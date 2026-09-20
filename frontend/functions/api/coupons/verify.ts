import { getCorsHeaders } from "../auth/_utils";

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
  PAYMENTS_KV?: {
    get: (key: string) => Promise<string | null>;
    put: (key: string, value: string, options?: { expirationTtl?: number }) => Promise<void>;
  };
  AUTH_SECRET?: string;
}

// Bloqueio explícito dos códigos antigos que eram públicos/fixos
const FORBIDDEN_LEGACY_CODES = ["PCD50", "INCLUSAO50", "LAUDO50", "DESCONTO50"];

export const onRequestPost = async ({ request, env }: { request: Request; env?: Env }) => {
  const corsHeaders = getCorsHeaders(request);
  try {
    const body: any = await request.json().catch(() => ({}));
    const rawCode = (body.code || "").trim().toUpperCase();
    const userEmail = (body.email || "").trim().toLowerCase();

    if (!rawCode) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: "Por favor, digite o código do cupom." 
      }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    // 1. Bloqueia tentativas de usar códigos fixos antigos
    if (FORBIDDEN_LEGACY_CODES.includes(rawCode)) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: "O código genérico PCD50 foi desativado. Para garantir o benefício, envie seu laudo médico no WhatsApp para receber um cupom individual de uso único." 
      }), {
        status: 403,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    // 2. Validação no Cloudflare D1 se disponível
    if (env && env.DB) {
      const dbCoupon: any = await env.DB.prepare(`SELECT * FROM coupons WHERE code = ?`).bind(rawCode).first();
      if (dbCoupon) {
        if (dbCoupon.used) {
          const usedDateStr = dbCoupon.used_at ? new Date(dbCoupon.used_at).toLocaleDateString("pt-BR") : "";
          return new Response(JSON.stringify({ 
            success: false, 
            message: `Este cupom já foi utilizado${usedDateStr ? ` em ${usedDateStr}` : ""} e só é válido uma única vez.` 
          }), {
            status: 409,
            headers: { "Content-Type": "application/json", ...corsHeaders }
          });
        }

        // Consome o cupom no D1
        const now = new Date().toISOString();
        await env.DB.prepare(`
          UPDATE coupons SET used = 1, used_at = ?, used_by = ? WHERE code = ?
        `).bind(now, userEmail || "candidato", rawCode).run();

        return new Response(JSON.stringify({
          success: true,
          code: rawCode,
          discountPercent: dbCoupon.discount_percent || 50,
          message: "Cupom PcD validado com sucesso! 50% de desconto aplicado."
        }), {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }
    }

    // 3. Validação no Cloudflare KV (fallback/contingência)
    if (env && env.PAYMENTS_KV) {
      const recordStr = await env.PAYMENTS_KV.get(`coupon:${rawCode}`);
      
      if (!recordStr) {
        return new Response(JSON.stringify({ 
          success: false, 
          message: "Cupom não encontrado ou inválido. Envie seu laudo médico no WhatsApp para receber seu código de 50% de desconto." 
        }), {
          status: 404,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }

      try {
        const record = JSON.parse(recordStr);

        // Checagem estrita de uso único
        if (record.used) {
          const usedDateStr = record.usedAt ? new Date(record.usedAt).toLocaleDateString("pt-BR") : "";
          return new Response(JSON.stringify({ 
            success: false, 
            message: `Este cupom já foi utilizado${usedDateStr ? ` em ${usedDateStr}` : ""} e só é válido uma única vez.` 
          }), {
            status: 409,
            headers: { "Content-Type": "application/json", ...corsHeaders }
          });
        }

        // Marca imediatamente como utilizado (só vale uma vez)
        record.used = true;
        record.usedAt = new Date().toISOString();
        record.usedBy = userEmail || "candidato";

        await env.PAYMENTS_KV.put(`coupon:${rawCode}`, JSON.stringify(record), {
          expirationTtl: 60 * 60 * 24 * 365 // mantem histórico por 1 ano
        });

        return new Response(JSON.stringify({
          success: true,
          code: rawCode,
          discountPercent: record.discountPercent || 50,
          message: "Cupom PcD validado com sucesso! 50% de desconto aplicado."
        }), {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      } catch (parseErr) {
        console.error("Erro ao parsear dados do cupom no KV:", parseErr);
      }
    }

    return new Response(JSON.stringify({ 
      success: false, 
      message: "Cupom não encontrado ou inválido. Verifique o código digitado ou solicite suporte." 
    }), {
      status: 404,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });

  } catch (err: any) {
    return new Response(JSON.stringify({ 
      success: false, 
      message: "Erro interno ao validar cupom.", 
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
