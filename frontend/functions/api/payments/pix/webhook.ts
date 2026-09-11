// Cloudflare Pages Function - Efí Pix Webhook Receiver
// Endpoint: https://natalvagas.com.br/api/payments/pix/webhook

export const onRequestPost = async ({ request }: { request: Request }) => {
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
    // Quando uma cobrança é paga, a Efí envia:
    // { "pix": [ { "txid": "...", "valor": "9.90", "endToEndId": "...", "horario": "..." } ] }

    return new Response(JSON.stringify({ 
      status: 'ok', 
      received: true, 
      timestamp: new Date().toISOString() 
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ status: 'ok', error: err?.message }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const onRequestGet = async () => {
  return new Response(JSON.stringify({ 
    status: 'online', 
    service: 'Natal Vagas - Efí Pix Webhook Receiver' 
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};
