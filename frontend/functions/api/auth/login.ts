import { createSessionToken, hashPassword, json, requireSecret, sessionCookie, verifyPassword, verifyTotp } from "./_utils";
interface D1Database { prepare: (query: string) => { bind: (...args: any[]) => { first: <T = any>() => Promise<T | null>; run: () => Promise<any> } } }
interface Env { DB?: D1Database; AUTH_SECRET?: string }
export const onRequestPost = async ({ request, env }: { request: Request; env?: Env }) => {
  try {
    if (!env?.DB) return json({ success: false, message: "Serviço de autenticação temporariamente indisponível." }, 503);
    const secret = requireSecret(env.AUTH_SECRET); const body: any = await request.json().catch(() => ({})); const email = String(body.email || "").trim().toLowerCase().slice(0, 150); const password = String(body.password || ""); const mfaCode = String(body.mfaCode || "").trim(); const generic = { success: false, message: "E-mail ou senha incorretos." };
    if (!email || !password) return json(generic, 401);
    const user: any = await env.DB.prepare("SELECT id, name, email, password_hash, salt, role, company_id, status, is_pro, email_verified, failed_login_count, locked_until, mfa_totp_secret, auth_version, created_at FROM users WHERE email = ?").bind(email).first();
    if (!user) { await hashPassword(password, "00000000000000000000000000000000"); return json(generic, 401); }
    if (user.status !== "ACTIVE" || (user.locked_until && Date.parse(user.locked_until) > Date.now())) return json(generic, 401);
    if (!await verifyPassword(password, user.salt, user.password_hash)) { const failures = Number(user.failed_login_count || 0) + 1; const locked = failures >= 5 ? new Date(Date.now() + Math.min(30, 2 ** (failures - 5)) * 60_000).toISOString() : null; await env.DB.prepare("UPDATE users SET failed_login_count = ?, locked_until = ?, updated_at = ? WHERE id = ?").bind(failures, locked, new Date().toISOString(), user.id).run(); return json(generic, 401); }
    if (user.role === "EDITDEV") { if (!user.mfa_totp_secret) return json({ success: false, message: "Conta EDITDEV sem MFA provisionado." }, 403); if (!mfaCode) return json({ success: false, requiresMfa: true, message: "Informe o código do autenticador." }, 428); if (!await verifyTotp(mfaCode, user.mfa_totp_secret)) return json({ success: false, requiresMfa: true, message: "Credenciais inválidas." }, 401); }
    await env.DB.prepare("UPDATE users SET failed_login_count = 0, locked_until = NULL, last_login_at = ?, updated_at = ? WHERE id = ?").bind(new Date().toISOString(), new Date().toISOString(), user.id).run();
    let companyVerified = false; if (user.company_id) { const company: any = await env.DB.prepare("SELECT verification_status FROM companies WHERE id = ?").bind(user.company_id).first(); companyVerified = company?.verification_status === "VERIFIED"; }
    const profile = { id: user.id, name: user.name, email: user.email, role: user.role, companyId: user.company_id, isPro: Boolean(user.is_pro), emailVerified: Boolean(user.email_verified), companyVerified, createdAt: user.created_at }; const token = await createSessionToken({ ...profile, authVersion: Number(user.auth_version || 0) }, secret);
    return json({ success: true, user: profile, message: "Login realizado com sucesso." }, 200, { "Set-Cookie": sessionCookie(token) });
  } catch (error: any) {
    console.error("auth_login_failed", error instanceof Error ? `${error.name}: ${error.message}` : "unknown_error");
    return json({ success: false, message: "Serviço de autenticação temporariamente indisponível." }, error?.message === "AUTH_CONFIG_MISSING" ? 503 : 500);
  }
};
