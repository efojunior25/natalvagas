import { json, readSessionToken, requireSecret, verifySessionToken } from "../auth/_utils";
interface D1Database { prepare: (query: string) => { bind: (...args: any[]) => { first: <T = any>() => Promise<T | null>; run: () => Promise<any>; all: <T = any>() => Promise<{ results: T[] }> } } }
interface Env { DB?: D1Database; AUTH_SECRET?: string }
const cleanText = (value: unknown, max: number) => String(value || "").trim().slice(0, max);

export const onRequestGet = async ({ env }: { env?: Env }) => {
  if (!env?.DB) return json({ success: false, message: "Catálogo dinâmico indisponível." }, 503);
  const rows = await env.DB.prepare("SELECT id, slug, title, company, data, source_type, source_priority, is_featured, created_at FROM submitted_jobs WHERE status = 'APPROVED' ORDER BY source_priority ASC, is_featured DESC, created_at DESC LIMIT 500").bind().all();
  return json({ success: true, jobs: rows.results.map((row: any) => ({ ...JSON.parse(row.data), id: row.id, slug: row.slug, sourceType: row.source_type, sourcePriority: row.source_priority, isFeatured: Boolean(row.is_featured), createdAt: row.created_at })) });
};

export const onRequestPost = async ({ request, env }: { request: Request; env?: Env }) => {
  try {
    if (!env?.DB) return json({ success: false, message: "Cadastro de vagas indisponível." }, 503);
    const session = await verifySessionToken(readSessionToken(request), requireSecret(env.AUTH_SECRET));
    if (!session || session.role !== "COMPANY" || !session.companyId) return json({ success: false, message: "Entre com uma conta de empresa para publicar vagas." }, 403);
    const account: any = await env.DB.prepare("SELECT email_verified, status FROM users WHERE id = ?").bind(session.sub).first();
    if (!account || account.status !== "ACTIVE" || !account.email_verified) return json({ success: false, message: "Verifique o e-mail da empresa antes de publicar." }, 403);
    const company: any = await env.DB.prepare("SELECT display_name, verification_status FROM companies WHERE id = ?").bind(session.companyId).first();
    if (!company || ["REJECTED", "SUSPENDED"].includes(company.verification_status)) return json({ success: false, message: "Empresa sem permissão para publicar." }, 403);
    const body: any = await request.json().catch(() => null); const title = cleanText(body?.title, 150); const description = cleanText(body?.description, 10_000); const target = cleanText(body?.applicationTarget, 500);
    if (!title || description.length < 20 || !target) return json({ success: false, message: "Preencha os campos obrigatórios da vaga." }, 400);
    const baseSlug = `${title}-${company.display_name}`.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    const slug = `${baseSlug}-${crypto.randomUUID().slice(0, 8)}`; const verified = company.verification_status === "VERIFIED"; const sourceType = verified ? "VERIFIED_COMPANY" : "REGISTERED_COMPANY"; const priority = verified ? 1 : 2; const now = new Date().toISOString();
    const safeData = { title, companyName: company.display_name, city: cleanText(body.city, 80), state: "RN", neighborhood: cleanText(body.neighborhood, 100) || undefined, workModel: body.workModel, contractType: body.contractType, hideSalary: Boolean(body.hideSalary), salaryMin: Number.isFinite(body.salaryMin) ? body.salaryMin : undefined, salaryMax: Number.isFinite(body.salaryMax) ? body.salaryMax : undefined, description, requirements: cleanText(body.requirements, 5000) || undefined, benefits: cleanText(body.benefits, 5000) || undefined, applicationChannel: body.applicationChannel, applicationTarget: target, status: "PENDING", isCompanyVerified: verified, sourceType, sourcePriority: priority };
    await env.DB.prepare("INSERT INTO submitted_jobs (id, slug, company_id, title, company, data, status, source_type, source_priority, is_featured, created_at) VALUES (?, ?, ?, ?, ?, ?, 'PENDING', ?, ?, 0, ?)").bind(`job_${crypto.randomUUID()}`, slug, session.companyId, title, company.display_name, JSON.stringify(safeData), sourceType, priority, now).run();
    return json({ success: true, slug, status: "PENDING", message: "Vaga recebida e enviada para verificação." }, 202);
  } catch { return json({ success: false, message: "Não foi possível cadastrar a vaga." }, 500); }
};
