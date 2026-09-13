# File: create.ts
- **Original Path:** `frontend/functions/api/coupons/create.ts`
- **Language / Type:** `typescript`
- **Lines of Code:** 145

---

```typescript
interface Env {
  PAYMENTS_KV?: {
    get: (key: string) => Promise<string | null>;
    put: (key: string, value: string, options?: { expirationTtl?: number }) => Promise<void>;
    list?: (options?: any) => Promise<{ keys: { name: string }[] }>;
    delete?: (key: string) => Promise<void>;
  };
  AUTH_SECRET?: string;
  ADMIN_PIN?: string;
}

const DEFAULT_SECRET = "natalvagas-pro-auth-secret-potiguar-2026";
const VALID_PINS = [
  "potiguar2026",
  "edson2026",
  "natalvagas2026",
  DEFAULT_SECRET
];

function checkAdminAuth(authHeader: string | null, bodyKey?: string, env?: Env): boolean {
  const token = (authHeader || "").replace(/^Bearer\s+/i, "").trim();
  const keyToCheck = bodyKey || token;
  if (!keyToCheck) return false;

  const validEnvSecret = env?.AUTH_SECRET || DEFAULT_SECRET;
  const validEnvPin = env?.ADMIN_PIN;

  if (keyToCheck === validEnvSecret) return true;
  if (validEnvPin && keyToCheck === validEnvPin) return true;
  return VALID_PINS.includes(keyToCheck.toLowerCase());
}

function generateRandomCode(): string {
  // Gera formato PCD-XXXX (letras e números não ambíguos)
  const chars = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  let randomPart = "";
  const randomValues = new Uint8Array(4);
  crypto.getRandomValues(randomValues);
  for (let i = 0; i < 4; i++) {
    randomPart += chars[randomValues[i] % chars.length];
  }
  return `PCD-${randomPart}`;
}

export const onRequestPost = async ({ request, env }: { request: Request; env?: Env }) => {
  try {
    const authHeader = request.headers.get("Authorization");
    const body: any = await request.json().catch(() => ({}));
    const adminKey = body.adminKey || body.pin || "";

    if (!checkAdminAuth(authHeader, adminKey, env)) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: "Acesso administrativo não autorizado. Verifique sua chave ou PIN." 
      }), {
        status: 401,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }

    const candidate = (body.candidate || "Candidato PcD WhatsApp").trim();
    const discountPercent = typeof body.discountPercent === "number" ? body.discountPercent : 50;
    const cleanCustomCode = (body.customCode || "").trim().toUpperCase().replace(/[^A-Z0-9-]/g, "");
    
    // Gera código único
    const code = cleanCustomCode || generateRandomCode();

    const couponData = {
      code,
      discountPercent,
      used: false,
      createdAt: new Date().toISOString(),
      candidate,
      usedAt: null,
      usedBy: null
    };

    // Armazena no KV se disponível
    if (env && env.PAYMENTS_KV) {
      await env.PAYMENTS_KV.put(`coupon:${code}`, JSON.stringify(couponData), {
        expirationTtl: 60 * 60 * 24 * 90 // 90 dias de validade para uso
      });

      // Atualiza o índice de cupons
      const indexStr = await env.PAYMENTS_KV.get("coupons_index");
      let index: string[] = [];
      if (indexStr) {
        try {
          index = JSON.parse(indexStr);
          if (!Array.isArray(index)) index = [];
        } catch (e) {
          index = [];
        }
      }
      if (!index.includes(code)) {
        index.unshift(code);
        // Mantém os últimos 100 cupons
        if (index.length > 100) index = index.slice(0, 100);
        await env.PAYMENTS_KV.put("coupons_index", JSON.stringify(index));
      }
    }

    const whatsappMessage = 
      `Olá! Seu Laudo Médico PcD foi avaliado e aprovado com sucesso no Natal Vagas! ✅\n\n` +
      `Aqui está seu Cupom Exclusivo de ${discountPercent}% de Desconto para assinar o Plano PRO:\n\n` +
      `👉 Código: *${code}*\n` +
      `_(Atenção: Este cupom é de USO ÚNICO e exclusivo para você)_\n\n` +
      `Para ativar agora:\n` +
      `1. Acesse https://natalvagas.com.br\n` +
      `2. Clique em "Seja PRO" ou no banner de Desconto PcD\n` +
      `3. Insira o código *${code}* e pronto! O valor cairá pela metade.\n\n` +
      `Qualquer dúvida, estou à disposição aqui no WhatsApp! Abraço, Edson.`;

    return new Response(JSON.stringify({
      success: true,
      coupon: couponData,
      whatsappMessage,
      message: `Cupom ${code} criado com sucesso!`
    }), {
      status: 201,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });

  } catch (err: any) {
    return new Response(JSON.stringify({ 
      success: false, 
      message: "Erro ao gerar cupom PcD.", 
      error: err?.message 
    }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }
};

export const onRequestOptions = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization"
    }
  });
};

```
