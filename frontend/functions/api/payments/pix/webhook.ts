import { json } from "../../auth/_utils";
interface D1Database { prepare: (query: string) => { bind: (...args: any[]) => { first: <T = any>() => Promise<T | null>; run: () => Promise<any> } } }
interface Env { DB?: D1Database; WEBHOOK_SECRET?: string }
function constantTimeEqual(a: string, b: string): boolean { if (a.length !== b.length) return false; let result = 0; for (let i = 0; i < a.length; i++) result |= a.charCodeAt(i) ^ b.charCodeAt(i); return result === 0; }
export const onRequestPost = async ({ request, env }: { request: Request; env?: Env }) => {
  try {
    if (!env?.DB || !env.WEBHOOK_SECRET || env.WEBHOOK_SECRET.length < 32) return json({ status: "unavailable" }, 503);
    const supplied = request.headers.get("x-webhook-secret") || ""; if (!constantTimeEqual(supplied, env.WEBHOOK_SECRET)) return json({ error: "unauthorized" }, 401);
    const payload: any = await request.json().catch(() => null); if (!payload || !Array.isArray(payload.pix)) return json({ error: "invalid_payload" }, 400);
    let processed = 0;
    for (const item of payload.pix.slice(0, 20)) {
      const txid = String(item?.txid || ""); const endToEndId = String(item?.endToEndId || ""); const paidCents = Math.round(Number(String(item?.valor || "0").replace(",", ".")) * 100);
      if (!txid || !endToEndId || !Number.isSafeInteger(paidCents) || paidCents <= 0) continue;
      const order: any = await env.DB.prepare("SELECT id, user_id, plan, amount_cents, status, expires_at FROM payment_orders WHERE txid = ?").bind(txid).first();
      if (!order || order.status !== "PENDING" || order.amount_cents !== paidCents || Date.parse(order.expires_at) < Date.now()) continue;
      const paidAt = item.horario ? new Date(item.horario).toISOString() : new Date().toISOString();
      const result: any = await env.DB.prepare("UPDATE payment_orders SET status = 'PAID', provider_end_to_end_id = ?, paid_at = ? WHERE id = ? AND status = 'PENDING'").bind(endToEndId, paidAt, order.id).run();
      if (result?.meta?.changes === 0) continue;
      const days = order.plan === "lifetime" ? 36500 : order.plan === "annual" ? 365 : 30; const expires = new Date(Date.now() + days * 86400000).toISOString();
      await env.DB.prepare("UPDATE users SET is_pro = 1, pro_plan = ?, pro_expires_at = ?, updated_at = ? WHERE id = ?").bind(order.plan, expires, new Date().toISOString(), order.user_id).run(); processed++;
    }
    return json({ status: "ok", processedCount: processed });
  } catch { return json({ status: "error" }, 500); }
};
export const onRequestGet = async () => json({ status: "method_not_allowed" }, 405);
