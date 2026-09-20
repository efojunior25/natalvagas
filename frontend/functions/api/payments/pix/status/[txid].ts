import { getAuthSecret, getCorsHeaders } from "../../../auth/_utils";

interface Env {
  PAYMENTS_KV?: {
    get: (key: string) => Promise<string | null>;
  };
  AUTH_SECRET?: string;
}

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

export const onRequestGet = async ({ request, params, env }: { request: Request; params: { txid: string }; env?: Env }) => {
  const corsHeaders = getCorsHeaders(request);
  const { txid } = params;

  if (!txid) {
    return new Response(JSON.stringify({ status: 'error', message: 'txid obrigatório' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }

  // 1. Checa no Cloudflare KV
  let isApproved = false;
  let record: any = null;

  if (env && env.PAYMENTS_KV) {
    try {
      const stored = await env.PAYMENTS_KV.get(`txid:${txid}`);
      if (stored) {
        record = JSON.parse(stored);
        if (record.status === 'approved') {
          isApproved = true;
        }
      }
    } catch (e) {
      console.warn('Erro ao consultar KV:', e);
    }
  }

  // Mapeamento de planos conhecidos pelo txid
  const planMap: Record<string, string> = {
    'cbc09e55682a4802ae728295c0d6fa97': 'monthly',
    '34c4c8898b574e88aac634e77dca7406': 'annual',
    'dddc590b669b4f8fa78ac6939fa8d687': 'lifetime'
  };
  const isVipJob = txid.startsWith('VIP') || txid.startsWith('natalvagas_vip');
  const plan = planMap[txid] || (isVipJob ? 'vip_job_30' : 'monthly');

  if (isApproved && record) {
    const expiresDays = plan === 'lifetime' ? 3650 : plan === 'annual' ? 365 : 30;
    const tokenPayload = {
      txid,
      plan,
      status: 'approved',
      issuedAt: Date.now(),
      expiresAt: Date.now() + expiresDays * 24 * 60 * 60 * 1000
    };
    const b64 = btoa(unescape(encodeURIComponent(JSON.stringify(tokenPayload))));
    const secret = getAuthSecret(env);
    const signature = await signHMAC(secret, b64);
    const token = `${b64}.${signature}`;

    return new Response(JSON.stringify({
      status: 'approved',
      txid,
      plan,
      paidAt: record.paidAt || new Date().toISOString(),
      token
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }

  return new Response(JSON.stringify({
    txid,
    status: 'pending',
    checkedAt: new Date().toISOString()
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders
    }
  });
};

export const onRequestOptions = async ({ request }: { request?: Request }) => {
  return new Response(null, {
    status: 204,
    headers: getCorsHeaders(request)
  });
};
