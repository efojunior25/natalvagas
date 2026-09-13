# File: verify-code.ts
- **Original Path:** `frontend/functions/api/payments/verify-code.ts`
- **Language / Type:** `typescript`
- **Lines of Code:** 128

---

```typescript
interface Env {
  PAYMENTS_KV?: {
    get: (key: string) => Promise<string | null>;
    put: (key: string, value: string, options?: { expirationTtl?: number }) => Promise<void>;
  };
  AUTH_SECRET?: string;
  AUTHORIZED_CODES_JSON?: string;
}

const DEFAULT_SECRET = "natalvagas-pro-auth-secret-potiguar-2026";

// Códigos padrão de contingência (podem ser sobrepostos via env.AUTHORIZED_CODES_JSON)
const DEFAULT_AUTHORIZED_CODES: Record<string, { plan: 'monthly' | 'annual' | 'lifetime'; maxUses?: number }> = {
  'POTIGUAR2026': { plan: 'lifetime' },
  'VITALICIO2026': { plan: 'lifetime' },
  'PRO2026': { plan: 'annual' },
  'NATALVAGAS2026': { plan: 'monthly' },
  'VIP-NATAL': { plan: 'annual' }
};

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
    const rawCode = (body.code || '').trim().toUpperCase();
    const userEmail = (body.email || '').trim().toLowerCase();

    if (!rawCode) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Por favor, informe o código de ativação.' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    // 1. Obter mapa de códigos autorizados (prioriza env.AUTHORIZED_CODES_JSON)
    let authorizedCodes = DEFAULT_AUTHORIZED_CODES;
    if (env && env.AUTHORIZED_CODES_JSON) {
      try {
        const parsed = JSON.parse(env.AUTHORIZED_CODES_JSON);
        if (typeof parsed === 'object' && parsed !== null) {
          authorizedCodes = { ...DEFAULT_AUTHORIZED_CODES, ...parsed };
        }
      } catch (err) {
        console.warn('Falha ao ler AUTHORIZED_CODES_JSON:', err);
      }
    }

    // 2. Checa se é um código autorizado
    const matchedRule = authorizedCodes[rawCode];
    if (!matchedRule) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Código inválido ou expirado. Verifique a digitação ou contate o suporte no WhatsApp.' 
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    const plan = matchedRule.plan;
    const expiresDays = plan === 'lifetime' ? 3650 : plan === 'annual' ? 365 : 30;

    // Gera token seguro com assinatura HMAC-SHA256
    const tokenPayload = {
      code: rawCode,
      email: userEmail || undefined,
      plan,
      status: 'approved',
      issuedAt: Date.now(),
      expiresAt: Date.now() + expiresDays * 24 * 60 * 60 * 1000
    };

    const b64 = btoa(unescape(encodeURIComponent(JSON.stringify(tokenPayload))));
    const secret = (env && env.AUTH_SECRET) ? env.AUTH_SECRET : DEFAULT_SECRET;
    const signature = await signHMAC(secret, b64);
    const token = `${b64}.${signature}`;

    // Registra uso no KV se disponível
    if (env && env.PAYMENTS_KV) {
      await env.PAYMENTS_KV.put(`code_use:${rawCode}:${Date.now()}`, JSON.stringify({
        email: userEmail,
        usedAt: new Date().toISOString()
      }), { expirationTtl: 60 * 60 * 24 * 365 });
    }

    return new Response(JSON.stringify({
      success: true,
      plan,
      token,
      message: 'Código verificado com sucesso!'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, message: 'Erro ao validar código.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
};

export const onRequestOptions = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
};

```
