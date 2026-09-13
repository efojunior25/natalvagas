# File: _utils.ts
- **Original Path:** `frontend/functions/api/auth/_utils.ts`
- **Language / Type:** `typescript`
- **Lines of Code:** 116

---

```typescript
export const DEFAULT_AUTH_SECRET = "natalvagas-pro-auth-secret-potiguar-2026";

/**
 * Gera salt aleatório seguro em formato hexadecimal
 */
export function generateSalt(bytes = 16): string {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return Array.from(arr).map(b => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Derivação de chave PBKDF2 com HMAC-SHA256 (100.000 iterações)
 */
export async function hashPassword(password: string, existingSalt?: string): Promise<{ hash: string; salt: string }> {
  const salt = existingSalt || generateSalt();
  const enc = new TextEncoder();
  
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits"]
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: enc.encode(salt),
      iterations: 100000,
      hash: "SHA-256"
    },
    keyMaterial,
    256
  );

  const hashArray = Array.from(new Uint8Array(derivedBits));
  const hash = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
  return { hash, salt };
}

/**
 * Verificação de senha em tempo constante
 */
export async function verifyPassword(password: string, salt: string, expectedHash: string): Promise<boolean> {
  const { hash } = await hashPassword(password, salt);
  if (hash.length !== expectedHash.length) return false;
  
  let result = 0;
  for (let i = 0; i < hash.length; i++) {
    result |= hash.charCodeAt(i) ^ expectedHash.charCodeAt(i);
  }
  return result === 0;
}

/**
 * Assina payload HMAC-SHA256
 */
export async function signHMAC(secret: string, data: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, enc.encode(data));
  const hashArray = Array.from(new Uint8Array(signature));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Cria token de sessão seguro com expiração de 30 dias
 */
export async function createSessionToken(user: { id: string; email: string; name: string; isPro: boolean }, secret: string): Promise<string> {
  const payload = {
    sub: user.id,
    email: user.email,
    name: user.name,
    isPro: user.isPro,
    iat: Date.now(),
    exp: Date.now() + 30 * 24 * 60 * 60 * 1000 // 30 dias
  };

  const b64Payload = btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
  const signature = await signHMAC(secret, b64Payload);
  return `${b64Payload}.${signature}`;
}

/**
 * Verifica e decodifica token de sessão
 */
export async function verifySessionToken(token: string, secret: string): Promise<{ sub: string; email: string; name: string; isPro: boolean } | null> {
  try {
    if (!token || typeof token !== "string") return null;
    const parts = token.split(".");
    if (parts.length !== 2) return null;

    const [b64Payload, signature] = parts;
    const expectedSignature = await signHMAC(secret, b64Payload);
    if (signature !== expectedSignature) return null;

    const jsonStr = decodeURIComponent(escape(atob(b64Payload)));
    const payload = JSON.parse(jsonStr);

    if (payload.exp && payload.exp < Date.now()) {
      return null; // Expirado
    }

    return payload;
  } catch {
    return null;
  }
}

```
