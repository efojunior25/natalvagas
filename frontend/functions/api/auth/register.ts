import { 
  hashPassword, 
  createSessionToken, 
  getCorsHeaders, 
  getAuthSecret, 
  createAuthCookie, 
  logSecurityEvent 
} from "./_utils";

interface D1Database {
  prepare: (query: string) => {
    bind: (...args: any[]) => {
      first: <T = any>() => Promise<T | null>;
      run: () => Promise<{ success: boolean; meta?: any }>;
      all: <T = any>() => Promise<{ results: T[] }>;
    };
  };
}

interface Env {
  DB?: D1Database;
  AUTH_SECRET?: string;
}

const WEAK_PASSWORDS = [
  "12345678", "123456789", "1234567890", "password", "qwertyui", 
  "senha123", "admin123", "natal123", "11111111", "00000000",
  "abcdefgh", "mudar123", "brasil123"
];

export const onRequestPost = async ({ request, env }: { request: Request; env?: Env }) => {
  const corsHeaders = getCorsHeaders(request);
  const clientIp = request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for") || "client";
  const userAgent = request.headers.get("user-agent") || "";

  try {
    const body: any = await request.json().catch(() => ({}));
    const name = (body.name || "").trim();
    const email = (body.email || "").trim().toLowerCase();
    const password = (body.password || "").trim();

    if (!name || name.length < 2) {
      return new Response(JSON.stringify({ success: false, message: "Informe seu nome completo." }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(JSON.stringify({ success: false, message: "Informe um e-mail válido." }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    if (!password || password.length < 8) {
      return new Response(JSON.stringify({ success: false, message: "A senha deve ter no mínimo 8 caracteres." }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    if (WEAK_PASSWORDS.includes(password.toLowerCase()) || /^(.)\1+$/.test(password)) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: "Senha muito previsível. Por segurança, escolha uma senha mais forte combinando letras e números." 
      }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    if (!env || !env.DB) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: "Serviço de cadastro indisponível. Base de dados não conectada." 
      }), {
        status: 503,
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

    const userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    // 1. Verifica se o e-mail já existe
    const existing = await env.DB.prepare("SELECT id FROM users WHERE email = ?").bind(email).first();
    if (existing) {
      await logSecurityEvent(env.DB, null, "REGISTER_FAILED_EMAIL_EXISTS", clientIp, userAgent, { email });
      return new Response(JSON.stringify({ 
        success: false, 
        message: "Não foi possível concluir o cadastro com este e-mail. Se já possui cadastro, faça login." 
      }), {
        status: 409,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    // 2. Criptografa a senha com salt exclusivo
    const { hash, salt } = await hashPassword(password);

    // 3. Salva no banco de dados D1 com papel padrão USER e campos de controle de tentativas
    await env.DB.prepare(`
      INSERT INTO users (id, name, email, password_hash, salt, role, is_pro, pro_plan, failed_attempts, locked_until, last_login_ip, last_login_at, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 'USER', 0, NULL, 0, NULL, ?, ?, ?, ?)
    `).bind(userId, name, email, hash, salt, clientIp, now, now, now).run();

    const userProfile = {
      id: userId,
      name,
      email,
      role: "USER",
      isAdmin: false,
      isPro: false,
      createdAt: now
    };

    const token = await createSessionToken(userProfile, secret);
    const authCookie = createAuthCookie(token, 30 * 24 * 3600);

    await logSecurityEvent(env.DB, userId, "USER_REGISTERED", clientIp, userAgent, { email });

    return new Response(JSON.stringify({
      success: true,
      user: userProfile,
      token,
      message: "Conta criada com sucesso!"
    }), {
      status: 201,
      headers: {
        "Content-Type": "application/json",
        "Set-Cookie": authCookie,
        ...corsHeaders
      }
    });


  } catch (err: any) {
    return new Response(JSON.stringify({ 
      success: false, 
      message: "Erro ao criar conta no servidor.", 
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
