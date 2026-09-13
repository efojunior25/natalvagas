import { hashPassword, createSessionToken, DEFAULT_AUTH_SECRET } from "./_utils";

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

export const onRequestPost = async ({ request, env }: { request: Request; env?: Env }) => {
  try {
    const body: any = await request.json().catch(() => ({}));
    const name = (body.name || "").trim();
    const email = (body.email || "").trim().toLowerCase();
    const password = (body.password || "").trim();

    if (!name || name.length < 2) {
      return new Response(JSON.stringify({ success: false, message: "Informe seu nome completo." }), {
        status: 400,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(JSON.stringify({ success: false, message: "Informe um e-mail válido." }), {
        status: 400,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }

    if (!password || password.length < 6) {
      return new Response(JSON.stringify({ success: false, message: "A senha deve ter no mínimo 6 caracteres." }), {
        status: 400,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }

    const userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();
    const secret = env?.AUTH_SECRET || DEFAULT_AUTH_SECRET;

    // Se o Cloudflare D1 estiver configurado
    if (env && env.DB) {
      // 1. Verifica se o e-mail já existe
      const existing = await env.DB.prepare("SELECT id FROM users WHERE email = ?").bind(email).first();
      if (existing) {
        return new Response(JSON.stringify({ 
          success: false, 
          message: "Este e-mail já está cadastrado. Faça login para acessar sua conta." 
        }), {
          status: 409,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
        });
      }

      // 2. Criptografa a senha com salt exclusivo
      const { hash, salt } = await hashPassword(password);

      // 3. Salva no banco de dados D1
      await env.DB.prepare(`
        INSERT INTO users (id, name, email, password_hash, salt, is_pro, pro_plan, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, 0, NULL, ?, ?)
      `).bind(userId, name, email, hash, salt, now, now).run();
    }

    const userProfile = {
      id: userId,
      name,
      email,
      isPro: false,
      createdAt: now
    };

    const token = await createSessionToken(userProfile, secret);

    return new Response(JSON.stringify({
      success: true,
      user: userProfile,
      token,
      message: "Conta criada com sucesso!"
    }), {
      status: 201,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });

  } catch (err: any) {
    return new Response(JSON.stringify({ 
      success: false, 
      message: "Erro ao criar conta no servidor.", 
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
