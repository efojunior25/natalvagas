import { hashOpaqueToken, json, randomToken } from "./_utils";
import { emailReady, sendAccountEmail, type EmailEnv } from "./_email";
interface D1Database { prepare: (query: string) => { bind: (...args: any[]) => { first: <T = any>() => Promise<T | null>; run: () => Promise<any> } } }
interface Env extends EmailEnv { DB?: D1Database }

export const onRequestPost = async ({ request, env }: { request: Request; env?: Env }) => {
  const accepted = json({ success: true, message: "Se a conta existir, enviaremos as instruções." }, 202);
  if (!env?.DB || !emailReady(env)) return json({ success: false, message: "Recuperação temporariamente indisponível." }, 503);
  try {
    const body: any = await request.json().catch(() => ({}));
    const email = String(body.email || "").trim().toLowerCase().slice(0, 150);
    const user: any = await env.DB.prepare("SELECT id, email FROM users WHERE email = ? AND status = 'ACTIVE'").bind(email).first();
    if (!user) return accepted;
    const raw = randomToken(); const hash = await hashOpaqueToken(raw); const id = `tok_${crypto.randomUUID()}`;
    const now = new Date().toISOString();
    await env.DB.prepare("INSERT INTO account_tokens (id, user_id, token_hash, purpose, expires_at, created_at) VALUES (?, ?, ?, 'RESET_PASSWORD', ?, ?)")
      .bind(id, user.id, hash, new Date(Date.now() + 30 * 60_000).toISOString(), now).run();
    const sent = await sendAccountEmail(env, { type: "RESET_PASSWORD", to: user.email, url: `${env.SITE_URL || "https://natalvagas.com.br"}/redefinir-senha?token=${raw}` }).catch(() => false);
    if (!sent) await env.DB.prepare("DELETE FROM account_tokens WHERE id = ?").bind(id).run();
    return accepted;
  } catch {
    return accepted;
  }
};
