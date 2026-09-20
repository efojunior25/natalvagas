import { 
  verifyPassword, 
  createSessionToken, 
  getCorsHeaders, 
  checkRateLimit, 
  createAuthCookie, 
  logSecurityEvent, 
  getAuthSecret 
} from "./_utils";

interface D1Database {
  prepare: (query: string) => {
    bind: (...args: any[]) => {
      first: <T = any>() => Promise<T | null>;
      run: () => Promise<{ success: boolean; meta?: any }>;
    };
  };
}

interface Env {
  DB?: D1Database;
  PAYMENTS_KV?: any;
  AUTH_SECRET?: string;
}

export const onRequestPost = async ({ request, env }: { request: Request; env?: Env }) => {
  const corsHeaders = getCorsHeaders(request);
  const clientIp = request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for") || "client";
  const userAgent = request.headers.get("user-agent") || "";

  // Rate limiting anti-força bruta por IP: máx 5 tentativas por minuto (CTRL-03)
  const rl = await checkRateLimit(clientIp, "login", 5, 60, env?.PAYMENTS_KV);
  if (!rl.allowed) {
    return new Response(JSON.stringify({
      success: false,
      message: "Muitas tentativas de login consecutivas. Por segurança, aguarde 1 minuto para tentar novamente."
    }), {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": "60",
        ...corsHeaders
      }
    });
  }

  try {
    const body: any = await request.json().catch(() => ({}));
    const email = (body.email || "").trim().toLowerCase();
    const password = (body.password || "").trim();

    if (!email || !password) {
      return new Response(JSON.stringify({ success: false, message: "Informe seu e-mail e senha." }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    let secret: string;
    try {
      secret = getAuthSecret(env);
    } catch {
      return new Response(JSON.stringify({
        success: false,
        message: "Configuração de segurança do servidor ausente (AUTH_SECRET)."
      }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    if (env && env.DB) {
      // 1. Busca o usuário pelo e-mail com dados de bloqueio
      const userRecord: any = await env.DB.prepare(`
        SELECT id, name, email, password_hash, salt, role, is_pro, pro_plan, failed_attempts, locked_until, created_at
        FROM users WHERE email = ?
      `).bind(email).first();

      if (!userRecord) {
        await logSecurityEvent(env.DB, null, "LOGIN_FAILED_UNKNOWN_EMAIL", clientIp, userAgent, { email });
        return new Response(JSON.stringify({ success: false, message: "E-mail ou senha incorretos." }), {
          status: 401,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }

      // 2. Verifica se a conta está temporariamente bloqueada por excesso de tentativas (CTRL-12)
      if (userRecord.locked_until) {
        const lockExpiration = new Date(userRecord.locked_until).getTime();
        if (lockExpiration > Date.now()) {
          const minutesLeft = Math.max(1, Math.ceil((lockExpiration - Date.now()) / 60000));
          await logSecurityEvent(env.DB, userRecord.id, "LOGIN_BLOCKED_LOCKOUT", clientIp, userAgent, { email, minutesLeft });
          return new Response(JSON.stringify({
            success: false,
            message: `Conta temporariamente bloqueada após repetidas tentativas inválidas. Tente novamente em ${minutesLeft} minuto(s).`
          }), {
            status: 423, // 423 Locked
            headers: { "Content-Type": "application/json", ...corsHeaders }
          });
        }
      }

      // 3. Valida a senha com tempo constante
      const isValid = await verifyPassword(password, userRecord.salt, userRecord.password_hash);
      if (!isValid) {
        const currentAttempts = (userRecord.failed_attempts || 0) + 1;
        if (currentAttempts >= 5) {
          // Bloqueia a conta por 15 minutos (900.000 ms)
          const lockTime = new Date(Date.now() + 15 * 60 * 1000).toISOString();
          await env.DB.prepare(`
            UPDATE users SET failed_attempts = ?, locked_until = ? WHERE id = ?
          `).bind(currentAttempts, lockTime, userRecord.id).run();

          await logSecurityEvent(env.DB, userRecord.id, "ACCOUNT_LOCKED_5_ATTEMPTS", clientIp, userAgent, { email });

          return new Response(JSON.stringify({
            success: false,
            message: "Conta bloqueada por 15 minutos após 5 tentativas de senha consecutivas incorretas."
          }), {
            status: 423,
            headers: { "Content-Type": "application/json", ...corsHeaders }
          });
        } else {
          await env.DB.prepare(`
            UPDATE users SET failed_attempts = ? WHERE id = ?
          `).bind(currentAttempts, userRecord.id).run();

          await logSecurityEvent(env.DB, userRecord.id, "LOGIN_PASSWORD_MISMATCH", clientIp, userAgent, {
            email,
            attempt: currentAttempts,
            remainingBeforeLock: 5 - currentAttempts
          });

          return new Response(JSON.stringify({ success: false, message: "E-mail ou senha incorretos." }), {
            status: 401,
            headers: { "Content-Type": "application/json", ...corsHeaders }
          });
        }
      }

      // 4. Sucesso na autenticação: zera tentativas, limpa bloqueio e atualiza dados de acesso (CTRL-14)
      const now = new Date().toISOString();
      await env.DB.prepare(`
        UPDATE users SET failed_attempts = 0, locked_until = NULL, last_login_ip = ?, last_login_at = ? WHERE id = ?
      `).bind(clientIp, now, userRecord.id).run();

      const role = userRecord.role || "USER";
      const isAdmin = role === "ADMIN";

      const userProfile = {
        id: userRecord.id,
        name: userRecord.name,
        email: userRecord.email,
        role,
        isAdmin,
        isPro: Boolean(userRecord.is_pro),
        proPlan: userRecord.pro_plan,
        createdAt: userRecord.created_at
      };

      const token = await createSessionToken(userProfile, secret);
      const authCookie = createAuthCookie(token, isAdmin ? 8 * 3600 : 30 * 24 * 3600);

      await logSecurityEvent(env.DB, userRecord.id, "LOGIN_SUCCESS", clientIp, userAgent, { email, role });

      return new Response(JSON.stringify({
        success: true,
        user: userProfile,
        token,
        message: "Login realizado com sucesso!"
      }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Set-Cookie": authCookie,
          ...corsHeaders
        }
      });
    }

    return new Response(JSON.stringify({
      success: false,
      message: "Serviço de autenticação temporariamente indisponível. Conexão com banco de dados não estabelecida."
    }), {
      status: 503,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });


  } catch (err: any) {
    return new Response(JSON.stringify({ 
      success: false, 
      message: "Erro ao autenticar no servidor.", 
      error: err?.message 
    }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }
};

export const onRequestOptions = async ({ request }: { request?: Request }) => {
  return new Response(null, {
    status: 204,
    headers: getCorsHeaders(request)
  });
};
