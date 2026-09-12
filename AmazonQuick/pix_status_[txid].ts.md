# File: [txid].ts
- **Original Path:** `frontend/functions/api/payments/pix/status/[txid].ts`
- **Language / Type:** `typescript`
- **Lines of Code:** 97

---

```typescript
interface Env {
  PAYMENTS_KV?: {
    get: (key: string) => Promise<string | null>;
  };
}

export const onRequestGet = async ({ params, env }: { params: { txid: string }; env?: Env }) => {
  const { txid } = params;

  if (!txid) {
    return new Response(JSON.stringify({ status: 'error', message: 'txid obrigatório' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
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
  const plan = planMap[txid] || 'monthly';

  if (isApproved && record) {
    const expiresDays = plan === 'lifetime' ? 3650 : plan === 'annual' ? 365 : 30;
    const tokenPayload = {
      txid,
      plan,
      status: 'approved',
      issuedAt: Date.now(),
      expiresAt: Date.now() + expiresDays * 24 * 60 * 60 * 1000
    };
    const b64 = btoa(JSON.stringify(tokenPayload));
    let hash = 0;
    for (let i = 0; i < b64.length; i++) {
      hash = ((hash << 5) - hash) + b64.charCodeAt(i);
      hash |= 0;
    }
    const token = `${b64}.${Math.abs(hash).toString(36)}`;

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
        'Access-Control-Allow-Origin': '*'
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
      'Access-Control-Allow-Origin': '*'
    }
  });
};

export const onRequestOptions = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
};

```
