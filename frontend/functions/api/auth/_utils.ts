/**
 * Obtém a chave secreta de autenticação do ambiente de forma estrita (fail-closed).
 */
export function getAuthSecret(env?: { AUTH_SECRET?: string }): string {
  const secret = env?.AUTH_SECRET?.trim();
  if (!secret) {
    throw new Error("AUTH_SECRET não configurada no ambiente.");
  }
  return secret;
}

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
 * Cria token de sessão seguro com expiração de 30 dias (ou 8 horas para administradores)
 */
export async function createSessionToken(
  user: { id: string; email: string; name: string; isPro: boolean; role?: string },
  secret: string
): Promise<string> {
  if (!secret || !secret.trim()) {
    throw new Error("Secret inválida para assinatura de sessão.");
  }
  const role = user.role || "USER";
  const isAdmin = role === "ADMIN";
  // Admins possuem timeout reduzido de 8 horas (CTRL-85); usuários comuns 30 dias
  const lifetimeMs = isAdmin ? 8 * 60 * 60 * 1000 : 30 * 24 * 60 * 60 * 1000;

  const payload = {
    sub: user.id,
    email: user.email,
    name: user.name,
    isPro: user.isPro,
    role,
    isAdmin,
    iat: Date.now(),
    exp: Date.now() + lifetimeMs
  };

  const b64Payload = btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
  const signature = await signHMAC(secret, b64Payload);
  return `${b64Payload}.${signature}`;
}

// Cache local por isolate para Rate Limiting
const RATE_LIMIT_CACHE = new Map<string, { count: number; resetTime: number }>();

/**
 * Utilitário de Rate Limiting por IP para conter força bruta e abuso (CTRL-03)
 */
export async function checkRateLimit(
  ip: string,
  action: string,
  maxAttempts = 5,
  windowSeconds = 60,
  kv?: any
): Promise<{ allowed: boolean; remaining: number }> {
  const key = `rl:${action}:${ip}`;
  const now = Date.now();

  if (kv) {
    try {
      const stored = await kv.get(key);
      const current = stored ? parseInt(stored, 10) : 0;
      if (current >= maxAttempts) {
        return { allowed: false, remaining: 0 };
      }
      await kv.put(key, String(current + 1), { expirationTtl: windowSeconds });
      return { allowed: true, remaining: maxAttempts - (current + 1) };
    } catch {
      // Fallback para memória em caso de falha de KV
    }
  }

  const entry = RATE_LIMIT_CACHE.get(key);
  if (!entry || now > entry.resetTime) {
    RATE_LIMIT_CACHE.set(key, { count: 1, resetTime: now + windowSeconds * 1000 });
    return { allowed: true, remaining: maxAttempts - 1 };
  }

  if (entry.count >= maxAttempts) {
    return { allowed: false, remaining: 0 };
  }

  entry.count += 1;
  return { allowed: true, remaining: maxAttempts - entry.count };
}


/**
 * Verifica e decodifica token de sessão
 */
export async function verifySessionToken(
  token: string,
  secret: string
): Promise<{ sub: string; email: string; name: string; isPro: boolean; role?: string; isAdmin?: boolean } | null> {
  try {
    if (!token || typeof token !== "string" || !secret || !secret.trim()) return null;
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

/**
 * Retorna headers CORS restritos a origens autorizadas (produção e dev local)
 */
export function getCorsHeaders(request?: Request): Record<string, string> {
  const origin = request?.headers?.get("Origin") || "";
  const allowedOrigins = [
    "https://natalvagas.com.br",
    "https://www.natalvagas.com.br",
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000"
  ];

  const matchedOrigin = allowedOrigins.includes(origin) ? origin : "https://natalvagas.com.br";

  return {
    "Access-Control-Allow-Origin": matchedOrigin,
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
    "Access-Control-Allow-Credentials": "true"
  };
}

/**
 * Extrai o token de autenticação a partir de Authorization: Bearer ou do cookie HttpOnly natalvagas_auth_token
 */
export function extractToken(request: Request): string {
  const authHeader = request.headers.get("Authorization");
  if (authHeader) {
    const bearer = authHeader.replace(/^Bearer\s+/i, "").trim();
    if (bearer) return bearer;
  }

  const cookieHeader = request.headers.get("Cookie") || "";
  const match = cookieHeader.match(/(?:^|;\s*)natalvagas_auth_token=([^;]+)/);
  if (match && match[1]) {
    return decodeURIComponent(match[1].trim());
  }

  return "";
}

/**
 * Cria header Set-Cookie com atributos HttpOnly, Secure e SameSite=Lax (CTRL-09)
 */
export function createAuthCookie(token: string, maxAgeSeconds = 30 * 24 * 60 * 60): string {
  return `natalvagas_auth_token=${encodeURIComponent(token)}; Path=/; Max-Age=${maxAgeSeconds}; HttpOnly; Secure; SameSite=Lax`;
}

/**
 * Cria header Set-Cookie para expirar/remover o cookie de autenticação
 */
export function clearAuthCookie(): string {
  return `natalvagas_auth_token=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax; Expires=Thu, 01 Jan 1970 00:00:00 GMT`;
}

/**
 * Grava evento na tabela security_audit_logs do Cloudflare D1 (CTRL-16, CTRL-64, CTRL-65)
 */
export async function logSecurityEvent(
  db: any,
  userId: string | null,
  action: string,
  ip: string,
  userAgent: string,
  details?: Record<string, any>
): Promise<void> {
  if (!db) return;
  try {
    const auditId = `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    await db.prepare(`
      INSERT INTO security_audit_logs (id, user_id, action, ip_address, user_agent, details, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      auditId,
      userId || null,
      action,
      ip || "unknown",
      userAgent ? userAgent.substring(0, 255) : "unknown",
      details ? JSON.stringify(details) : null,
      new Date().toISOString()
    ).run();
  } catch (err) {
    console.warn("[SECURITY_AUDIT] Falha ao gravar log de auditoria:", err);
  }
}


