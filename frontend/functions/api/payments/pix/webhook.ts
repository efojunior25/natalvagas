// Cloudflare Pages Function - Efí Pix Webhook Receiver
// Endpoint: https://natalvagas.com.br/api/payments/pix/webhook

interface Env {
  PAYMENTS_KV?: {
    get: (key: string) => Promise<string | null>;
    put: (key: string, value: string, options?: { expirationTtl?: number }) => Promise<void>;
  };
}

// Armazenamento em memória (persiste durante o ciclo de vida do worker)
const MEMORY_APPROVED_TXIDS = new Map<string, any>();

export const onRequestPost = async ({ request, env }: { request: Request; env?: Env }) => {
  try {
    let payload: any = {};
    const text = await request.text();
    if (text) {
      try {
        payload = JSON.parse(text);
      } catch (e) {
        payload = { raw: text };
      }
    }

    console.log('[EFI_PIX_WEBHOOK] Received payload:', JSON.stringify(payload));

    // A Efí envia um POST vazio para validar que o endpoint existe e responde 200 OK.
    if (!payload || !payload.pix) {
      return new Response(JSON.stringify({ 
        status: 'ok', 
        message: 'Efí Webhook Ativo',
        timestamp: new Date().toISOString() 
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // Processa os Pix recebidos
    const processedTxids: string[] = [];
    if (Array.isArray(payload.pix)) {
      for (const item of payload.pix) {
        const txid = item.txid;
        if (txid) {
          const approvalRecord = {
            txid,
            status: 'approved',
            valor: item.valor,
            endToEndId: item.endToEndId,
            paidAt: item.horario || new Date().toISOString()
          };

          if (env && env.PAYMENTS_KV) {
            await env.PAYMENTS_KV.put(`txid:${txid}`, JSON.stringify(approvalRecord), {
              expirationTtl: 60 * 60 * 24 * 365
            });
          }

          MEMORY_APPROVED_TXIDS.set(txid, approvalRecord);
          processedTxids.push(txid);
        }
      }
    }

    return new Response(JSON.stringify({ 
      status: 'ok', 
      processedCount: processedTxids.length,
      processedTxids,
      timestamp: new Date().toISOString() 
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ status: 'error', error: err?.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const onRequestGet = async () => {
  return new Response(JSON.stringify({ 
    status: 'online', 
    service: 'Natal Vagas - Efí Pix Webhook Receiver & Automation',
    version: '2.0.0'
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};

export const onRequestOptions = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
};
