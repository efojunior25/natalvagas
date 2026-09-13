interface Env {
  PAYMENTS_KV?: {
    get: (key: string) => Promise<string | null>;
  };
  AUTH_SECRET?: string;
}

const DEFAULT_SECRET = "natalvagas-pro-auth-secret-potiguar-2026";

async function signHMAC(secret: string, data: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, enc.encode(data));
  const hashArray = Array.from(new Uint8Array(signature));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export const onRequestPost = async ({ request, env }: { request: Request; env?: Env }) => {
  try {
    const body: any = await request.json().catch(() => ({}));
    const { txid, plan, email } = body;

    if (!txid && !email) {
      return new Response(JSON.stringify({ error: 'Identificador txid ou email obrigatório' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    // Validação no Cloudflare KV se txid for fornecido
    if (txid && env && env.PAYMENTS_KV) {
      const stored = await env.PAYMENTS_KV.get(`txid:${txid}`);
      if (!stored) {
        return new Response(JSON.stringify({ error: 'Pagamento não confirmado para este txid' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }
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
    const secret = (env && env.AUTH_SECRET) ? env.AUTH_SECRET : DEFAULT_SECRET;
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
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: 'Erro interno ao assinar token PRO', details: err?.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
};
