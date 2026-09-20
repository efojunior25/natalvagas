import { getCorsHeaders } from "../auth/_utils";

interface D1Database {
  prepare: (query: string) => {
    bind: (...args: any[]) => {
      all: <T = any>() => Promise<{ results: T[] }>;
    };
  };
}

interface Env {
  DB?: D1Database;
  PAYMENTS_KV?: {
    get: (key: string) => Promise<string | null>;
    list?: (options?: any) => Promise<{ keys: { name: string }[] }>;
    delete?: (key: string) => Promise<void>;
  };
  AUTH_SECRET?: string;
  ADMIN_PIN?: string;
}

function checkAdminAuth(authHeader: string | null, urlKey: string | null, env?: Env): boolean {
  const token = (authHeader || "").replace(/^Bearer\s+/i, "").trim();
  const keyToCheck = urlKey || token;
  if (!keyToCheck) return false;

  const validEnvSecret = env?.AUTH_SECRET;
  const validEnvPin = env?.ADMIN_PIN;

  if (validEnvPin && keyToCheck === validEnvPin) return true;
  if (validEnvSecret && keyToCheck === validEnvSecret) return true;
  return false;
}

export const onRequestGet = async ({ request, env }: { request: Request; env?: Env }) => {
  const corsHeaders = getCorsHeaders(request);
  try {
    const url = new URL(request.url);
    const keyParam = url.searchParams.get("key") || url.searchParams.get("pin");
    const authHeader = request.headers.get("Authorization");

    if (!checkAdminAuth(authHeader, keyParam, env)) {
      return new Response(JSON.stringify({ success: false, message: "Não autorizado." }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    // 1. Busca primeiro no Cloudflare D1 se configurado
    if (env && env.DB) {
      try {
        const queryRes = await env.DB.prepare(`
          SELECT code, discount_percent as discountPercent, used, used_at as usedAt, used_by as usedBy, candidate_name as candidate, created_at as createdAt
          FROM coupons ORDER BY created_at DESC LIMIT 50
        `).bind().all();

        if (queryRes && Array.isArray(queryRes.results) && queryRes.results.length > 0) {
          return new Response(JSON.stringify({
            success: true,
            coupons: queryRes.results.map((c: any) => ({ ...c, used: Boolean(c.used) }))
          }), {
            status: 200,
            headers: { "Content-Type": "application/json", ...corsHeaders }
          });
        }
      } catch (d1Err) {
        console.warn("Falha ao consultar D1 coupons, tentando KV:", d1Err);
      }
    }

    const coupons: any[] = [];

    // 2. Busca no Cloudflare KV (fallback)
    if (env && env.PAYMENTS_KV) {
      const indexStr = await env.PAYMENTS_KV.get("coupons_index");
      let codes: string[] = [];
      if (indexStr) {
        try {
          codes = JSON.parse(indexStr);
        } catch (e) {
          codes = [];
        }
      }

      for (const code of codes.slice(0, 50)) {
        const itemStr = await env.PAYMENTS_KV.get(`coupon:${code}`);
        if (itemStr) {
          try {
            coupons.push(JSON.parse(itemStr));
          } catch (e) {
            // ignore item parse error
          }
        }
      }
    }

    return new Response(JSON.stringify({
      success: true,
      coupons
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });

  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, message: "Erro ao listar cupons." }), {
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
