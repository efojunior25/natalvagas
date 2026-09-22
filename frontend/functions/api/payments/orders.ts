import { json, readSessionToken, requireSecret, verifySessionToken } from "../auth/_utils";
interface D1Database { prepare: (query: string) => { bind: (...args: any[]) => { first: <T = any>() => Promise<T | null>; run: () => Promise<any> } } }
interface Env { DB?: D1Database; AUTH_SECRET?: string; EFI_PIX?: { fetch: (request: Request) => Promise<Response> } }
const PRICES: Record<string, Record<string, number>> = { USER: { monthly: 990, annual: 3990, lifetime: 9990 }, COMPANY: { monthly: 2990, annual: 14990, lifetime: 39990 } };
export const onRequestPost = async ({ request, env }: { request: Request; env?: Env }) => {
  try {
    if (!env?.DB || !env.EFI_PIX) return json({ success: false, message: "Pagamentos temporariamente indisponíveis." }, 503);
    const session = await verifySessionToken(readSessionToken(request), requireSecret(env.AUTH_SECRET));
    if (!session || !["USER", "COMPANY"].includes(session.role)) return json({ success: false, message: "Faça login em uma conta válida." }, 401);
    const account: any = await env.DB.prepare("SELECT email_verified, status FROM users WHERE id = ?").bind(session.sub).first();
    if (!account || account.status !== "ACTIVE" || !account.email_verified) return json({ success: false, message: "Verifique seu e-mail antes de contratar um plano." }, 403);
    const body: any = await request.json().catch(() => ({})); const plan = String(body.plan || ""); const amountCents = PRICES[session.role]?.[plan];
    if (!amountCents) return json({ success: false, message: "Plano inválido." }, 400);
    const now = new Date(); const expiresAt = new Date(now.getTime() + 15 * 60_000); const id = `pay_${crypto.randomUUID()}`; const txid = `NV${crypto.randomUUID().replace(/-/g, "").slice(0, 30).toUpperCase()}`;
    await env.DB.prepare("INSERT INTO payment_orders (id, user_id, company_id, account_role, plan, amount_cents, txid, status, created_at, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?, 'PENDING', ?, ?)").bind(id, session.sub, session.companyId || null, session.role, plan, amountCents, txid, now.toISOString(), expiresAt.toISOString()).run();
    const provider = await env.EFI_PIX.fetch(new Request("https://natalvagas-efi-pix.internal/create", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "create", txid, amountCents }) })).catch(() => null);
    const providerOrder: any = provider?.ok ? await provider.json().catch(() => null) : null;
    if (!providerOrder?.success || providerOrder.txid !== txid || typeof providerOrder.pixCode !== "string") {
      await env.DB.prepare("UPDATE payment_orders SET status = 'CANCELLED' WHERE id = ? AND status = 'PENDING'").bind(id).run();
      return json({ success: false, message: "Não foi possível criar a cobrança Pix. Tente novamente." }, 503);
    }
    return json({ success: true, order: { id, txid, plan, amountCents, amount: amountCents / 100, status: "PENDING", expiresAt: expiresAt.toISOString(), pixCode: providerOrder.pixCode } }, 201);
  } catch { return json({ success: false, message: "Pagamentos indisponíveis." }, 503); }
};
