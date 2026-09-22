import { AccountRole, createSessionToken, hashOpaqueToken, hashPassword, json, randomToken, requireSecret, sessionCookie, validCnpj, validPassword } from "./_utils";
import { emailReady, sendAccountEmail, type EmailEnv } from "./_email";
interface D1Database { prepare: (query: string) => { bind: (...args: any[]) => { first: <T = any>() => Promise<T | null>; run: () => Promise<any> } } }
interface Env extends EmailEnv { DB?: D1Database; AUTH_SECRET?: string }
export const onRequestPost = async ({ request, env }: { request: Request; env?: Env }) => {
  try {
    if (!env?.DB) return json({ success: false, message: "Serviço de cadastro temporariamente indisponível." }, 503);
    if (!emailReady(env)) return json({ success: false, message: "Cadastro temporariamente indisponível. Tente novamente mais tarde." }, 503);
    const secret = requireSecret(env.AUTH_SECRET); const body: any = await request.json().catch(() => ({}));
    const name = String(body.name || "").trim().slice(0, 120); const email = String(body.email || "").trim().toLowerCase().slice(0, 150); const password = String(body.password || "");
    const accountType: AccountRole = body.accountType === "COMPANY" ? "COMPANY" : "USER"; const companyName = String(body.companyName || "").trim().slice(0, 160); const cnpj = String(body.cnpj || "").replace(/\D/g, "");
    if (body.accountType === "EDITDEV") return json({ success: false, message: "Tipo de conta não permitido no cadastro público." }, 403);
    if (name.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ success: false, message: "Dados de cadastro inválidos." }, 400);
    if (!validPassword(password)) return json({ success: false, message: "Use ao menos 12 caracteres, com maiúscula, minúscula, número e símbolo." }, 400);
    if (accountType === "COMPANY" && (companyName.length < 2 || !validCnpj(cnpj))) return json({ success: false, message: "Informe razão social e CNPJ válidos." }, 400);
    if (await env.DB.prepare("SELECT id FROM users WHERE email = ?").bind(email).first()) return json({ success: false, message: "Não foi possível concluir o cadastro com os dados informados." }, 409);
    const now = new Date().toISOString(); const userId = `usr_${crypto.randomUUID()}`; const companyId = accountType === "COMPANY" ? `cmp_${crypto.randomUUID()}` : null; const { hash, salt } = await hashPassword(password);
    if (companyId) await env.DB.prepare("INSERT INTO companies (id, legal_name, display_name, cnpj, verification_status, created_at, updated_at) VALUES (?, ?, ?, ?, 'PENDING', ?, ?)").bind(companyId, companyName, companyName, cnpj, now, now).run();
    await env.DB.prepare("INSERT INTO users (id, name, email, password_hash, salt, role, company_id, status, is_pro, email_verified, failed_login_count, auth_version, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, 'ACTIVE', 0, 0, 0, 0, ?, ?)").bind(userId, name, email, hash, salt, accountType, companyId, now, now).run();
    const rawToken = randomToken(); const tokenHash = await hashOpaqueToken(rawToken); const expiresAt = new Date(Date.now() + 24 * 60 * 60_000).toISOString();
    await env.DB.prepare("INSERT INTO account_tokens (id, user_id, token_hash, purpose, expires_at, created_at) VALUES (?, ?, ?, 'VERIFY_EMAIL', ?, ?)").bind(`tok_${crypto.randomUUID()}`, userId, tokenHash, expiresAt, now).run();
    const sent = await sendAccountEmail(env, { type: "VERIFY_EMAIL", to: email, url: `${env.SITE_URL || "https://natalvagas.com.br"}/verificar-email?token=${rawToken}` }).catch(() => false);
    if (!sent) {
      await env.DB.prepare("DELETE FROM account_tokens WHERE user_id = ?").bind(userId).run();
      await env.DB.prepare("DELETE FROM users WHERE id = ?").bind(userId).run();
      if (companyId) await env.DB.prepare("DELETE FROM companies WHERE id = ?").bind(companyId).run();
      return json({ success: false, message: "Não foi possível enviar a verificação. Tente novamente mais tarde." }, 503);
    }
    const profile = { id: userId, name, email, role: accountType, companyId, isPro: false, companyVerified: false, emailVerified: false, createdAt: now }; const token = await createSessionToken(profile, secret);
    return json({ success: true, user: profile, message: "Conta criada. Verifique seu e-mail antes de usar recursos sensíveis." }, 201, { "Set-Cookie": sessionCookie(token) });
  } catch (error: any) {
    console.error("auth_register_failed", error instanceof Error ? `${error.name}: ${error.message}` : "unknown_error");
    return json({ success: false, message: "Não foi possível concluir o cadastro." }, error?.message === "AUTH_CONFIG_MISSING" ? 503 : 500);
  }
};
