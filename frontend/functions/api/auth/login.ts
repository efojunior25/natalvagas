import { verifyPassword, createSessionToken, DEFAULT_AUTH_SECRET } from "./_utils";

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

export const onRequestPost = async ({ request, env }: { request: Request; env?: Env }) => {
  try {
    const body: any = await request.json().catch(() => ({}));
    const email = (body.email || "").trim().toLowerCase();
    const password = (body.password || "").trim();

    if (!email || !password) {
      return new Response(JSON.stringify({ success: false, message: "Informe seu e-mail e senha." }), {
        status: 400,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }

    const secret = env?.AUTH_SECRET || DEFAULT_AUTH_SECRET;

    if (env && env.DB) {
      // 1. Busca o usuário pelo e-mail
      const userRecord: any = await env.DB.prepare(`
        SELECT id, name, email, password_hash, salt, is_pro, pro_plan, created_at
        FROM users WHERE email = ?
      `).bind(email).first();

      if (!userRecord) {
        return new Response(JSON.stringify({ success: false, message: "E-mail ou senha incorretos." }), {
          status: 401,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
        });
      }

      // 2. Valida a senha com tempo constante
      const isValid = await verifyPassword(password, userRecord.salt, userRecord.password_hash);
      if (!isValid) {
        return new Response(JSON.stringify({ success: false, message: "E-mail ou senha incorretos." }), {
          status: 401,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
        });
      }

      const userProfile = {
        id: userRecord.id,
        name: userRecord.name,
        email: userRecord.email,
        isPro: Boolean(userRecord.is_pro),
        proPlan: userRecord.pro_plan,
        createdAt: userRecord.created_at
      };

      const token = await createSessionToken(userProfile, secret);

      return new Response(JSON.stringify({
        success: true,
        user: userProfile,
        token,
        message: "Login realizado com sucesso!"
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }

    // Fallback de contingência caso D1 ainda não esteja vinculado
    const fallbackName = email.split("@")[0].replace(/[._]/g, " ");
    const fallbackUser = {
      id: `usr_${Date.now()}`,
      name: fallbackName.charAt(0).toUpperCase() + fallbackName.slice(1),
      email,
      isPro: false,
      createdAt: new Date().toISOString()
    };
    const token = await createSessionToken(fallbackUser, secret);

    return new Response(JSON.stringify({
      success: true,
      user: fallbackUser,
      token,
      message: "Login realizado!"
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });

  } catch (err: any) {
    return new Response(JSON.stringify({ 
      success: false, 
      message: "Erro ao autenticar no servidor.", 
      error: err?.message 
    }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }
};

export const onRequestOptions = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization"
    }
  });
};
