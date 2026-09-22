export type AccountRole = "USER" | "COMPANY" | "EDITDEV";
export interface SessionPayload { sub: string; email: string; name: string; role: AccountRole; companyId?: string | null; isPro: boolean; ver: number; iss: "natalvagas"; aud: "natalvagas-web"; iat: number; exp: number; jti: string }

export function requireSecret(secret?: string): string { if (!secret || secret.length < 32) throw new Error("AUTH_CONFIG_MISSING"); return secret; }
export function generateSalt(bytes = 16): string { const arr = new Uint8Array(bytes); crypto.getRandomValues(arr); return Array.from(arr).map(b => b.toString(16).padStart(2, "0")).join(""); }
export function randomToken(bytes = 32): string { const arr = new Uint8Array(bytes); crypto.getRandomValues(arr); return Array.from(arr).map(b => b.toString(16).padStart(2, "0")).join(""); }
export async function hashOpaqueToken(token: string): Promise<string> { const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token)); return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, "0")).join(""); }
export async function hashPassword(password: string, existingSalt?: string): Promise<{ hash: string; salt: string }> {
  const salt = existingSalt || generateSalt();
  const material = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), { name: "PBKDF2" }, false, ["deriveBits"]);
  // Cloudflare Workers WebCrypto currently rejects PBKDF2 counts above 100,000.
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt: new TextEncoder().encode(salt), iterations: 100_000, hash: "SHA-256" }, material, 256);
  return { hash: Array.from(new Uint8Array(bits)).map(b => b.toString(16).padStart(2, "0")).join(""), salt };
}
export async function verifyPassword(password: string, salt: string, expectedHash: string): Promise<boolean> { const { hash } = await hashPassword(password, salt); if (hash.length !== expectedHash.length) return false; let result = 0; for (let i = 0; i < hash.length; i++) result |= hash.charCodeAt(i) ^ expectedHash.charCodeAt(i); return result === 0; }
async function sign(secret: string, data: string): Promise<string> { const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]); const value = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data)); return Array.from(new Uint8Array(value)).map(b => b.toString(16).padStart(2, "0")).join(""); }
function encode(value: unknown): string { return btoa(unescape(encodeURIComponent(JSON.stringify(value)))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""); }
function decode(value: string): any { const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "="); return JSON.parse(decodeURIComponent(escape(atob(padded)))); }

export async function createSessionToken(user: { id: string; email: string; name: string; role: AccountRole; companyId?: string | null; isPro: boolean; authVersion?: number }, secret: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000); const payload: SessionPayload = { sub: user.id, email: user.email, name: user.name, role: user.role, companyId: user.companyId || null, isPro: user.isPro, ver: user.authVersion || 0, iss: "natalvagas", aud: "natalvagas-web", iat: now, exp: now + 15 * 60, jti: crypto.randomUUID() }; const encoded = encode(payload); return `${encoded}.${await sign(secret, encoded)}`;
}
export async function verifySessionToken(token: string, secret: string): Promise<SessionPayload | null> {
  try { const [payloadPart, signature, extra] = token.split("."); if (!payloadPart || !signature || extra) return null; const expected = await sign(secret, payloadPart); if (signature.length !== expected.length) return null; let difference = 0; for (let i = 0; i < signature.length; i++) difference |= signature.charCodeAt(i) ^ expected.charCodeAt(i); if (difference !== 0) return null; const payload = decode(payloadPart) as SessionPayload; const now = Math.floor(Date.now() / 1000); if (payload.iss !== "natalvagas" || payload.aud !== "natalvagas-web" || !payload.jti || !Number.isInteger(payload.ver) || payload.exp <= now || payload.iat > now + 60) return null; return ["USER", "COMPANY", "EDITDEV"].includes(payload.role) ? payload : null; } catch { return null; }
}
export function readSessionToken(request: Request): string { const match = (request.headers.get("cookie") || "").match(/(?:^|;\s*)nv_session=([^;]+)/); return match ? decodeURIComponent(match[1]) : ""; }
export const sessionCookie = (token: string, maxAge = 15 * 60) => `nv_session=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
export const clearSessionCookie = () => "nv_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0";
export const json = (data: unknown, status = 200, extra: Record<string, string> = {}) => new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...extra } });
export const validPassword = (password: string) => password.length >= 12 && password.length <= 128 && /[a-z]/.test(password) && /[A-Z]/.test(password) && /\d/.test(password) && /[^A-Za-z0-9]/.test(password);
export function validCnpj(value: string): boolean { const digits = value.replace(/\D/g, ""); if (digits.length !== 14 || /^(\d)\1+$/.test(digits)) return false; const calc = (length: number) => { let sum = 0, weight = length - 7; for (let i = 0; i < length; i++) { sum += Number(digits[i]) * weight--; if (weight < 2) weight = 9; } const rest = sum % 11; return rest < 2 ? 0 : 11 - rest; }; return calc(12) === Number(digits[12]) && calc(13) === Number(digits[13]); }

function base32(value: string): Uint8Array { const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"; let bits = ""; for (const char of value.toUpperCase().replace(/[^A-Z2-7]/g, "")) bits += alphabet.indexOf(char).toString(2).padStart(5, "0"); const bytes: number[] = []; for (let i = 0; i + 8 <= bits.length; i += 8) bytes.push(parseInt(bits.slice(i, i + 8), 2)); return new Uint8Array(bytes); }
export async function verifyTotp(code: string, secret: string): Promise<boolean> {
  if (!/^\d{6}$/.test(code) || !secret) return false; const key = await crypto.subtle.importKey("raw", base32(secret), { name: "HMAC", hash: "SHA-1" }, false, ["sign"]); const step = Math.floor(Date.now() / 30000);
  for (let drift = -1; drift <= 1; drift++) { const buffer = new ArrayBuffer(8); const view = new DataView(buffer); const counter = step + drift; view.setUint32(0, Math.floor(counter / 0x100000000), false); view.setUint32(4, counter >>> 0, false); const bytes = new Uint8Array(await crypto.subtle.sign("HMAC", key, buffer)); const offset = bytes[bytes.length - 1] & 15; const binary = ((bytes[offset] & 127) << 24) | (bytes[offset + 1] << 16) | (bytes[offset + 2] << 8) | bytes[offset + 3]; if (String(binary % 1000000).padStart(6, "0") === code) return true; }
  return false;
}
