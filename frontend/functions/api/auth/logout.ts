import { clearSessionCookie, json, readSessionToken, requireSecret, verifySessionToken } from "./_utils";
interface D1Database { prepare: (query: string) => { bind: (...args: any[]) => { run: () => Promise<any> } } }
interface Env { DB?: D1Database; AUTH_SECRET?: string }
export const onRequestPost = async ({ request, env }: { request: Request; env?: Env }) => { try { if (env?.DB) { const session = await verifySessionToken(readSessionToken(request), requireSecret(env.AUTH_SECRET)); if (session) await env.DB.prepare("UPDATE users SET auth_version = auth_version + 1, updated_at = ? WHERE id = ?").bind(new Date().toISOString(), session.sub).run(); } } catch {} return json({ success: true }, 200, { "Set-Cookie": clearSessionCookie() }); };
