import { 
  verifySessionToken, 
  getCorsHeaders, 
  extractToken, 
  clearAuthCookie, 
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
  AUTH_SECRET?: string;
}

export const onRequestGet = async ({ request, env }: { request: Request; env?: Env }) => {
  const corsHeaders = getCorsHeaders(request);
  try {
    const token = extractToken(request);

    if (!token) {
      return new Response(JSON.stringify({ success: false, message: "Token não fornecido." }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    let secret: string;
    try {
      secret = getAuthSecret(env);
    } catch {
      return new Response(JSON.stringify({ success: false, message: "Configuração de segurança do servidor ausente." }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    const session = await verifySessionToken(token, secret);

    if (!session) {
      return new Response(JSON.stringify({ success: false, message: "Sessão expirada ou inválida." }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    if (env && env.DB) {
      const userRecord: any = await env.DB.prepare(`
        SELECT id, name, email, role, is_pro, pro_plan, created_at
        FROM users WHERE id = ?
      `).bind(session.sub).first();

      if (userRecord) {
        const role = userRecord.role || "USER";
        return new Response(JSON.stringify({
          success: true,
          user: {
            id: userRecord.id,
            name: userRecord.name,
            email: userRecord.email,
            role,
            isAdmin: role === "ADMIN",
            isPro: Boolean(userRecord.is_pro),
            proPlan: userRecord.pro_plan,
            createdAt: userRecord.created_at
          }
        }), {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }
    }

    const sessionRole = session.role || "USER";
    return new Response(JSON.stringify({
      success: true,
      user: {
        id: session.sub,
        name: session.name,
        email: session.email,
        role: sessionRole,
        isAdmin: sessionRole === "ADMIN",
        isPro: session.isPro,
        createdAt: new Date(session.sub ? parseInt(session.sub.replace(/\D/g, "")) || Date.now() : Date.now()).toISOString()
      }
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });

  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, message: "Erro ao verificar sessão." }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }
};

/**
 * Exclusão autônoma de conta e dados pessoais (LGPD Art. 18 / VULN-06)
 */
export const onRequestDelete = async ({ request, env }: { request: Request; env?: Env }) => {
  const corsHeaders = getCorsHeaders(request);
  const clientIp = request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for") || "client";
  const userAgent = request.headers.get("user-agent") || "";

  try {
    const token = extractToken(request);

    if (!token) {
      return new Response(JSON.stringify({ success: false, message: "Token não fornecido." }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    let secret: string;
    try {
      secret = getAuthSecret(env);
    } catch {
      return new Response(JSON.stringify({ success: false, message: "Configuração de segurança do servidor ausente." }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    const session = await verifySessionToken(token, secret);

    if (!session) {
      return new Response(JSON.stringify({ success: false, message: "Sessão expirada ou inválida." }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    if (env && env.DB) {
      // 1. Exclui currículo vinculado no D1
      await env.DB.prepare("DELETE FROM resumes WHERE user_id = ?").bind(session.sub).run();
      // 2. Exclui cadastro do usuário no D1
      await env.DB.prepare("DELETE FROM users WHERE id = ?").bind(session.sub).run();
      // 3. Registra auditoria de exclusão
      await logSecurityEvent(env.DB, session.sub, "ACCOUNT_DELETED", clientIp, userAgent, { email: session.email });
    }

    return new Response(JSON.stringify({
      success: true,
      message: "Sua conta e todos os dados associados foram excluídos permanentemente com sucesso (LGPD Art. 18)."
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Set-Cookie": clearAuthCookie(),
        ...corsHeaders
      }
    });

  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, message: "Erro ao excluir conta.", error: err?.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }
};

export const onRequestOptions = async ({ request }: { request?: Request }) => {
  return new Response(null, {
    status: 204,
    headers: {
      ...getCorsHeaders(request),
      "Access-Control-Allow-Methods": "GET, DELETE, OPTIONS"
    }
  });
};

