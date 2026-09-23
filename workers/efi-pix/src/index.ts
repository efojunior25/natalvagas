interface Env {
  EFI_CLIENT_ID: string;
  EFI_CLIENT_SECRET: string;
  EFI_PIX_KEY: string;
  EFI_MTLS: { fetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response> };
}

const BASE = "https://pix.api.efipay.com.br";

async function accessToken(env: Env): Promise<string> {
  const basic = btoa(`${env.EFI_CLIENT_ID}:${env.EFI_CLIENT_SECRET}`);
  const response = await env.EFI_MTLS.fetch(`${BASE}/oauth/token`, {
    method: "POST",
    headers: { Authorization: `Basic ${basic}`, "Content-Type": "application/json" },
    body: JSON.stringify({ grant_type: "client_credentials" }),
  });
  if (!response.ok) throw new Error("EFI_OAUTH_FAILED");
  const body: { access_token?: string } = await response.json();
  if (!body.access_token) throw new Error("EFI_OAUTH_EMPTY");
  return body.access_token;
}

async function api(env: Env, token: string, path: string, init: RequestInit = {}): Promise<any> {
  const response = await env.EFI_MTLS.fetch(`${BASE}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...init.headers },
  });
  if (!response.ok) throw new Error(`EFI_API_${response.status}`);
  return response.json();
}

const reply = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method !== "POST" || !env.EFI_MTLS || !env.EFI_CLIENT_ID || !env.EFI_CLIENT_SECRET || !env.EFI_PIX_KEY) return reply({ success: false }, 503);
    try {
      const body: any = await request.json();
      const txid = String(body.txid || "");
      if (!/^[A-Za-z0-9]{26,35}$/.test(txid)) return reply({ success: false }, 400);
      const token = await accessToken(env);
      if (body.action === "create") {
        const cents = Number(body.amountCents);
        if (!Number.isSafeInteger(cents) || cents < 1) return reply({ success: false }, 400);
        const charge = await api(env, token, `/v2/cob/${txid}`, {
          method: "PUT",
          body: JSON.stringify({ calendario: { expiracao: 900 }, valor: { original: (cents / 100).toFixed(2) }, chave: env.EFI_PIX_KEY }),
        });
        if (charge.txid !== txid || charge.status !== "ATIVA" || charge.valor?.original !== (cents / 100).toFixed(2)) throw new Error("EFI_CHARGE_MISMATCH");
        let pixCode = charge.pixCopiaECola;
        if (!pixCode && charge.loc?.id) {
          const qr = await api(env, token, `/v2/loc/${encodeURIComponent(charge.loc.id)}/qrcode`);
          pixCode = qr.qrcode;
        }
        if (typeof pixCode !== "string" || !pixCode.startsWith("000201")) throw new Error("EFI_QR_MISSING");
        return reply({ success: true, txid, pixCode });
      }
      if (body.action === "verify") {
        const charge = await api(env, token, `/v2/cob/${txid}`);
        const payment = Array.isArray(charge.pix) ? charge.pix.find((item: any) => item.endToEndId === body.endToEndId) : null;
        return reply({ success: true, confirmed: charge.status === "CONCLUIDA" && Boolean(payment), amountCents: payment ? Math.round(Number(payment.valor) * 100) : null });
      }
      return reply({ success: false }, 400);
    } catch (error) {
      console.error("efi_pix_request_failed", error instanceof Error ? error.message : "unknown_error");
      return reply({ success: false }, 502);
    }
  },
};
