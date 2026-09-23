import { readFileSync } from 'node:fs';
import https from 'node:https';

const required = ['EFI_CLIENT_ID', 'EFI_CLIENT_SECRET', 'EFI_CERT_P12', 'EFI_PIX_KEY', 'WEBHOOK_SECRET'];
for (const key of required) if (!process.env[key]) throw new Error(`Variável obrigatória ausente: ${key}`);
if (process.env.WEBHOOK_SECRET.length < 32) throw new Error('WEBHOOK_SECRET precisa de pelo menos 32 caracteres.');

const base = 'https://pix.api.efipay.com.br';
const cert = readFileSync(process.env.EFI_CERT_P12);
const tls = { pfx: cert, passphrase: process.env.EFI_CERT_PASSWORD || undefined, rejectUnauthorized: true };

function request(path, method, headers, body) {
  return new Promise((resolve, reject) => {
    const req = https.request(new URL(path, base), { ...tls, method, headers }, (res) => {
      let response = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => { response += chunk; });
      res.on('end', () => {
        let parsed;
        try { parsed = JSON.parse(response); } catch { parsed = {}; }
        if (res.statusCode < 200 || res.statusCode >= 300) return reject(new Error(`Efí retornou HTTP ${res.statusCode} em ${path.split('?')[0]}`));
        resolve(parsed);
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

const basic = Buffer.from(`${process.env.EFI_CLIENT_ID}:${process.env.EFI_CLIENT_SECRET}`).toString('base64');
const auth = await request('/oauth/token', 'POST', { Authorization: `Basic ${basic}`, 'Content-Type': 'application/json' }, { grant_type: 'client_credentials' });
if (!auth.access_token) throw new Error('A Efí não retornou token OAuth.');
const path = `/v2/webhook/${encodeURIComponent(process.env.EFI_PIX_KEY)}`;
const webhookUrl = `https://natalvagas.com.br/api/payments/pix/webhook?hmac=${encodeURIComponent(process.env.WEBHOOK_SECRET)}&ignorar=`;
await request(path, 'PUT', { Authorization: `Bearer ${auth.access_token}`, 'Content-Type': 'application/json', 'x-skip-mtls-checking': 'true' }, { webhookUrl });
console.log('Webhook Pix registrado na Efí para a chave configurada. Segredo e URL completa não foram exibidos.');
