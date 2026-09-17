/**
 * TOTP (Time-based One-Time Password) Service - RFC 6238 & RFC 4226
 * Totalmente compatível com Google Authenticator, Microsoft Authenticator, Authy e 1Password.
 * Utiliza Web Crypto API nativa do navegador sem dependências pesadas.
 */

const BASE32_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

// Decodifica string Base32 em Uint8Array
export function base32ToUint8Array(base32: string): Uint8Array {
  const clean = base32.toUpperCase().replace(/[^A-Z2-7]/g, '');
  const bits: number[] = [];
  
  for (let i = 0; i < clean.length; i++) {
    const val = BASE32_CHARS.indexOf(clean.charAt(i));
    if (val === -1) continue;
    for (let j = 4; j >= 0; j--) {
      bits.push((val >> j) & 1);
    }
  }

  const bytes: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    let byte = 0;
    for (let j = 0; j < 8; j++) {
      byte = (byte << 1) | bits[i + j];
    }
    bytes.push(byte);
  }

  return new Uint8Array(bytes);
}

// Gera uma chave secreta Base32 segura de 16 caracteres (80 bits)
export function generateTotpSecret(length: number = 16): string {
  const randomBytes = new Uint8Array(length);
  if (typeof window !== 'undefined' && window.crypto) {
    window.crypto.getRandomValues(randomBytes);
  } else {
    for (let i = 0; i < length; i++) {
      randomBytes[i] = Math.floor(Math.random() * 256);
    }
  }

  let result = '';
  for (let i = 0; i < length; i++) {
    result += BASE32_CHARS.charAt(randomBytes[i] % BASE32_CHARS.length);
  }
  return result;
}

// Formata a chave em grupos de 4 para facilitar a digitação manual (ex: ABCD EFGH JKLM NPQR)
export function formatSecretKey(secret: string): string {
  return secret.replace(/(.{4})/g, '$1 ').trim();
}

// Gera o URI padrão otpauth para QR Code
export function generateOtpAuthUri(email: string, secret: string, issuer: string = 'Natal Vagas'): string {
  const cleanIssuer = encodeURIComponent(issuer);
  const cleanEmail = encodeURIComponent(email);
  return `otpauth://totp/${cleanIssuer}:${cleanEmail}?secret=${secret}&issuer=${cleanIssuer}&algorithm=SHA1&digits=6&period=30`;
}

// Calcula o código TOTP de 6 dígitos para um contador de tempo específico
export async function calculateTotpCode(secret: string, timeStep: number): Promise<string> {
  const keyBytes = base32ToUint8Array(secret);

  // Buffer de 8 bytes com o contador em big-endian
  const counterBuffer = new ArrayBuffer(8);
  const counterView = new DataView(counterBuffer);
  counterView.setUint32(0, Math.floor(timeStep / 0x100000000), false);
  counterView.setUint32(4, timeStep & 0xffffffff, false);

  const cryptoObj = (typeof globalThis !== 'undefined' && globalThis.crypto) ? globalThis.crypto : ((typeof window !== 'undefined' && window.crypto) ? window.crypto : null);
  if (!cryptoObj || !cryptoObj.subtle) {
    throw new Error('Web Crypto API não disponível');
  }

  const cryptoKey = await cryptoObj.subtle.importKey(
    'raw',
    keyBytes as unknown as BufferSource,
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  );

  const signature = await cryptoObj.subtle.sign('HMAC', cryptoKey, counterBuffer);
  const hmac = new Uint8Array(signature);

  // Truncamento dinâmico RFC 4226
  const offset = hmac[hmac.length - 1] & 0x0f;
  const binary =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);

  const otp = binary % 1000000;
  return otp.toString().padStart(6, '0');
}

/**
 * Valida o código TOTP de 6 dígitos informado pelo usuário.
 * Testa o intervalo atual e janelas adjacentes (-1 e +1 steps de 30s) para tolerar desvio de relógio.
 */
export async function verifyTotpCode(code: string, secret: string, windowSteps: number = 1): Promise<boolean> {
  const cleanCode = code.trim().replace(/\s/g, '');
  if (cleanCode.length !== 6 || !/^\d{6}$/.test(cleanCode)) {
    return false;
  }

  if (!secret) return false;

  const currentStep = Math.floor(Date.now() / 1000 / 30);

  for (let offset = -windowSteps; offset <= windowSteps; offset++) {
    try {
      const generated = await calculateTotpCode(secret, currentStep + offset);
      if (generated === cleanCode) {
        return true;
      }
    } catch (err) {
      console.warn('Erro ao calcular TOTP:', err);
    }
  }

  return false;
}
