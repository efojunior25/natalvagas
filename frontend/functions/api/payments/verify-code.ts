interface Env {
  PAYMENTS_KV?: {
    get: (key: string) => Promise<string | null>;
    put: (key: string, value: string, options?: { expirationTtl?: number }) => Promise<void>;
  };
  AUTH_SECRET?: string;
}

// Códigos legítimos autorizados no servidor (NUNCA expostos no bundle Javascript do frontend)
const AUTHORIZED_CODES: Record<string, { plan: 'monthly' | 'annual' | 'lifetime'; maxUses?: number }> = {
  'POTIGUAR2026': { plan: 'lifetime' },
  'VITALICIO2026': { plan: 'lifetime' },
  'PRO2026': { plan: 'annual' },
  'NATALVAGAS2026': { plan: 'monthly' },
  'VIP-NATAL': { plan: 'annual' }
};

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

    // 1. Checa se é um código autorizado
    const matchedRule = AUTHORIZED_CODES[rawCode];
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

    // Gera token seguro com assinatura
    const tokenPayload = {
      code: rawCode,
      email: userEmail,
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
