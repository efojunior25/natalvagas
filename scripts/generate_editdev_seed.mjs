import { pbkdf2Sync, randomBytes, randomUUID } from 'node:crypto';

const required = ['EDITDEV_NAME', 'EDITDEV_EMAIL', 'EDITDEV_PASSWORD', 'EDITDEV_TOTP_SECRET'];
for (const key of required) if (!process.env[key]) throw new Error(`Variável obrigatória ausente: ${key}`);
const password = process.env.EDITDEV_PASSWORD;
if (password.length < 16 || !/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password) || !/[^A-Za-z0-9]/.test(password)) throw new Error('EDITDEV_PASSWORD deve ter 16+ caracteres, maiúscula, minúscula, número e símbolo.');
const totp = process.env.EDITDEV_TOTP_SECRET.toUpperCase().replace(/[^A-Z2-7]/g, '');
if (totp.length < 26) throw new Error('EDITDEV_TOTP_SECRET deve ser Base32 forte (mínimo 26 caracteres).');
const quote = (value) => `'${String(value).replaceAll("'", "''")}'`;
const salt = randomBytes(16).toString('hex');
const hash = pbkdf2Sync(password, salt, 100_000, 32, 'sha256').toString('hex');
const now = new Date().toISOString();
const sql = `INSERT INTO users (id,name,email,password_hash,salt,role,status,is_pro,email_verified,failed_login_count,auth_version,mfa_totp_secret,created_at,updated_at) VALUES (${quote(`usr_${randomUUID()}`)},${quote(process.env.EDITDEV_NAME.trim())},${quote(process.env.EDITDEV_EMAIL.trim().toLowerCase())},${quote(hash)},${quote(salt)},'EDITDEV','ACTIVE',1,1,0,0,${quote(totp)},${quote(now)},${quote(now)});`;
process.stdout.write(`${sql}\n`);
