import { signHMAC, getCorsHeaders, getAuthSecret } from "./_utils";

interface Env {
  PAYMENTS_KV?: {
    get: (key: string) => Promise<string | null>;
    put: (key: string, value: string, options?: { expirationTtl?: number }) => Promise<void>;
  };
  AUTH_SECRET?: string;
}

export const onRequestPost = async ({ request, env }: { request: Request; env?: Env }) => {
  const corsHeaders = getCorsHeaders(request);
  try {
    const body: any = await request.json().catch(() => ({}));
    const { txid, plan, email } = body;

    if (!txid || typeof txid !== 'string') {
      return new Response(JSON.stringify({ error: 'Identificador txid de pagamento confirmado é obrigatório.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    let record: any = null;

    // Validação estrita no Cloudflare KV
    if (env && env.PAYMENTS_KV) {
      const stored = await env.PAYMENTS_KV.get(`txid:${txid}`);
      if (!stored) {
        return new Response(JSON.stringify({ error: 'Pagamento não localizado ou não confirmado para este txid.' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }
      try {
        record = JSON.parse(stored);
        if (record.status !== 'approved') {
          return new Response(JSON.stringify({ error: 'O pagamento deste txid ainda não foi aprovado.' }), {
            status: 403,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }
        if (record.claimed === true) {
          return new Response(JSON.stringify({ error: 'Este comprovante Pix já foi utilizado para ativar um plano.' }), {
            status: 409,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }
      } catch {
        return new Response(JSON.stringify({ error: 'Registro de pagamento inválido.' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }
    } else {
      return new Response(JSON.stringify({ error: 'Serviço de validação de pagamentos indisponível.' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    let secret: string;
    try {
      secret = getAuthSecret(env);
    } catch {
      return new Response(JSON.stringify({ error: 'Configuração de segurança do servidor ausente.' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // Queima atômica do comprovante Pix no KV para prevenir Replay Attack (VULN-06)
    if (env.PAYMENTS_KV && record) {
      const updatedRecord = {
        ...record,
        claimed: true,
        claimedAt: Date.now(),
        claimedBy: email || 'anonymous'
      };
      await env.PAYMENTS_KV.put(`txid:${txid}`, JSON.stringify(updatedRecord), {
        expirationTtl: 60 * 60 * 24 * 365
      });
    }

    const selectedPlan = plan || 'monthly';
    const expiresDays = selectedPlan === 'lifetime' ? 3650 : selectedPlan === 'annual' ? 365 : 30;
    const expiresAt = Date.now() + expiresDays * 24 * 60 * 60 * 1000;

    const tokenPayload = {
      txid: txid || 'manual_grant',
      email: email || undefined,
      plan: selectedPlan,
      status: 'approved',
      issuedAt: Date.now(),
      expiresAt
    };

    const payloadJson = JSON.stringify(tokenPayload);
    // Base64 seguro para UTF-8
    const b64Payload = btoa(unescape(encodeURIComponent(payloadJson)));
    const signature = await signHMAC(secret, b64Payload);

    const token = `${b64Payload}.${signature}`;

    return new Response(JSON.stringify({
      success: true,
      status: 'approved',
      plan: selectedPlan,
      expiresAt,
      token
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: 'Erro interno ao assinar token PRO', details: err?.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
};

export const onRequestOptions = async ({ request }: { request?: Request }) => {
  return new Response(null, {
    status: 204,
    headers: getCorsHeaders(request)
  });
};
