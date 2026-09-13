interface Env {
  PAYMENTS_KV?: {
    get: (key: string) => Promise<string | null>;
    put: (key: string, value: string, options?: { expirationTtl?: number }) => Promise<void>;
  };
  AUTH_SECRET?: string;
}

// Bloqueio explícito dos códigos antigos que eram públicos/fixos
const FORBIDDEN_LEGACY_CODES = ["PCD50", "INCLUSAO50", "LAUDO50", "DESCONTO50"];

export const onRequestPost = async ({ request, env }: { request: Request; env?: Env }) => {
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
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }

    // 1. Bloqueia tentativas de usar códigos fixos antigos
    if (FORBIDDEN_LEGACY_CODES.includes(rawCode)) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: "O código genérico PCD50 foi desativado. Para garantir o benefício, envie seu laudo médico no WhatsApp para receber um cupom individual de uso único." 
      }), {
        status: 403,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }

    // 2. Validação no Cloudflare KV
    if (env && env.PAYMENTS_KV) {
      const recordStr = await env.PAYMENTS_KV.get(`coupon:${rawCode}`);
      
      if (!recordStr) {
        return new Response(JSON.stringify({ 
          success: false, 
          message: "Cupom não encontrado ou inválido. Envie seu laudo médico no WhatsApp para receber seu código de 50% de desconto." 
        }), {
          status: 404,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
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
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
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
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
        });
      } catch (parseErr) {
        console.error("Erro ao parsear dados do cupom no KV:", parseErr);
      }
    }

    // 3. Fallback de contingência caso o KV ainda não tenha sido vinculado no Cloudflare Pages
    // Verifica formato válido gerado (ex: PCD-XXXX)
    if (/^PCD-[A-Z0-9]{4,8}$/.test(rawCode)) {
      return new Response(JSON.stringify({
        success: true,
        code: rawCode,
        discountPercent: 50,
        message: "Cupom PcD validado! 50% de desconto aplicado."
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }

    return new Response(JSON.stringify({ 
      success: false, 
      message: "Cupom inválido. Envie seu laudo médico no WhatsApp para receber o código de 50% de desconto." 
    }), {
      status: 400,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });

  } catch (err: any) {
    return new Response(JSON.stringify({ 
      success: false, 
      message: "Erro interno ao validar cupom.", 
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
