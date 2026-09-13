# File: me.ts
- **Original Path:** `frontend/functions/api/auth/me.ts`
- **Language / Type:** `typescript`
- **Lines of Code:** 94

---

```typescript
import { verifySessionToken, DEFAULT_AUTH_SECRET } from "./_utils";

interface D1Database {
  prepare: (query: string) => {
    bind: (...args: any[]) => {
      first: <T = any>() => Promise<T | null>;
    };
  };
}

interface Env {
  DB?: D1Database;
  AUTH_SECRET?: string;
}

export const onRequestGet = async ({ request, env }: { request: Request; env?: Env }) => {
  try {
    const authHeader = request.headers.get("Authorization");
    const token = (authHeader || "").replace(/^Bearer\s+/i, "").trim();

    if (!token) {
      return new Response(JSON.stringify({ success: false, message: "Token não fornecido." }), {
        status: 401,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }

    const secret = env?.AUTH_SECRET || DEFAULT_AUTH_SECRET;
    const session = await verifySessionToken(token, secret);

    if (!session) {
      return new Response(JSON.stringify({ success: false, message: "Sessão expirada ou inválida." }), {
        status: 401,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }

    // Se o banco D1 estiver ativo, busca status mais recente
    if (env && env.DB) {
      const userRecord: any = await env.DB.prepare(`
        SELECT id, name, email, is_pro, pro_plan, created_at
        FROM users WHERE id = ?
      `).bind(session.sub).first();

      if (userRecord) {
        return new Response(JSON.stringify({
          success: true,
          user: {
            id: userRecord.id,
            name: userRecord.name,
            email: userRecord.email,
            isPro: Boolean(userRecord.is_pro),
            proPlan: userRecord.pro_plan,
            createdAt: userRecord.created_at
          }
        }), {
          status: 200,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
        });
      }
    }

    return new Response(JSON.stringify({
      success: true,
      user: {
        id: session.sub,
        name: session.name,
        email: session.email,
        isPro: session.isPro,
        createdAt: new Date(session.sub ? parseInt(session.sub.replace(/\D/g, "")) || Date.now() : Date.now()).toISOString()
      }
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });

  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, message: "Erro ao verificar sessão." }), {
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
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization"
    }
  });
};

```
