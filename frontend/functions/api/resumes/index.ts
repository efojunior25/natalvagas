import { verifySessionToken, readSessionToken, requireSecret } from "../auth/_utils";

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
  try {
    if (!env?.DB) return new Response(JSON.stringify({ success: false, message: "Serviço indisponível." }), { status: 503, headers: { "Content-Type": "application/json" } });
    const token = readSessionToken(request);
    const secret = requireSecret(env?.AUTH_SECRET);

    const session = await verifySessionToken(token, secret);
    if (!session) {
      return new Response(JSON.stringify({ success: false, message: "Sessão não autorizada." }), {
        status: 401,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }

    if (env && env.DB) {
      const record: any = await env.DB.prepare(`
        SELECT id, title, resume_data, updated_at
        FROM resumes WHERE user_id = ?
        ORDER BY updated_at DESC LIMIT 1
      `).bind(session.sub).first();

      if (record && record.resume_data) {
        try {
          const parsed = JSON.parse(record.resume_data);
          return new Response(JSON.stringify({
            success: true,
            title: record.title,
            updatedAt: record.updated_at,
            resume: parsed
          }), {
            status: 200,
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
          });
        } catch (e) {
          console.error("Falha ao parsear resume_data:", e);
        }
      }
    }

    return new Response(JSON.stringify({ success: false, message: "Nenhum currículo em nuvem encontrado." }), {
      status: 404,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });

  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, message: "Erro ao buscar currículo.", error: err?.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }
};

export const onRequestPost = async ({ request, env }: { request: Request; env?: Env }) => {
  try {
    if (!env?.DB) return new Response(JSON.stringify({ success: false, message: "Serviço indisponível." }), { status: 503, headers: { "Content-Type": "application/json" } });
    const token = readSessionToken(request);
    const secret = requireSecret(env?.AUTH_SECRET);

    const session = await verifySessionToken(token, secret);
    if (!session) {
      return new Response(JSON.stringify({ success: false, message: "Faça login para salvar seu currículo na nuvem." }), {
        status: 401,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }

    const body: any = await request.json().catch(() => ({}));
    const resumeData = body.resume;
    const title = (body.title || "Meu Currículo").trim();

    if (!resumeData || typeof resumeData !== "object") {
      return new Response(JSON.stringify({ success: false, message: "Dados do currículo inválidos." }), {
        status: 400,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }

    const now = new Date().toISOString();
    const jsonStr = JSON.stringify(resumeData);
    if (jsonStr.length > 250_000) return new Response(JSON.stringify({ success: false, message: "Currículo excede o limite permitido." }), { status: 413, headers: { "Content-Type": "application/json" } });

    if (env && env.DB) {
      const existing: any = await env.DB.prepare(`SELECT id FROM resumes WHERE user_id = ?`).bind(session.sub).first();

      if (existing) {
        await env.DB.prepare(`
          UPDATE resumes SET title = ?, resume_data = ?, updated_at = ? WHERE user_id = ?
        `).bind(title, jsonStr, now, session.sub).run();
      } else {
        const resumeId = `res_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        await env.DB.prepare(`
          INSERT INTO resumes (id, user_id, title, resume_data, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?)
        `).bind(resumeId, session.sub, title, jsonStr, now, now).run();
      }
    }

    return new Response(JSON.stringify({
      success: true,
      message: "Currículo salvo na nuvem com sucesso!",
      updatedAt: now
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });

  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, message: "Erro ao salvar currículo.", error: err?.message }), {
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
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization"
    }
  });
};
