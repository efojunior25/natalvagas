-- ============================================================================
-- NATAL VAGAS - BANCO DE DADOS CLOUDFLARE D1 (SQLITE SERVERLESS)
-- Armazenamento Gratuito: 5 GB | 5M leituras/dia | 100k escritas/dia
-- ============================================================================

-- 1. TABELA DE USUÁRIOS (CANDIDATOS & RECRUTADORES)
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    salt TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'USER' CHECK (role IN ('USER', 'COMPANY', 'EDITDEV')),
    company_id TEXT DEFAULT NULL,
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'SUSPENDED', 'DELETED')),
    is_pro INTEGER DEFAULT 0,
    pro_plan TEXT DEFAULT NULL,
    pro_expires_at TEXT DEFAULT NULL,
    email_verified INTEGER NOT NULL DEFAULT 0,
    failed_login_count INTEGER NOT NULL DEFAULT 0,
    locked_until TEXT DEFAULT NULL,
    last_login_at TEXT DEFAULT NULL,
    mfa_totp_secret TEXT DEFAULT NULL,
    auth_version INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

CREATE TABLE IF NOT EXISTS account_tokens (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    token_hash TEXT UNIQUE NOT NULL,
    purpose TEXT NOT NULL CHECK (purpose IN ('VERIFY_EMAIL', 'RESET_PASSWORD')),
    expires_at TEXT NOT NULL,
    used_at TEXT DEFAULT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_account_tokens_hash ON account_tokens(token_hash, purpose, used_at);

CREATE TABLE IF NOT EXISTS companies (
    id TEXT PRIMARY KEY,
    legal_name TEXT NOT NULL,
    display_name TEXT NOT NULL,
    cnpj TEXT UNIQUE NOT NULL,
    verification_status TEXT NOT NULL DEFAULT 'PENDING' CHECK (verification_status IN ('PENDING', 'VERIFIED', 'REJECTED', 'SUSPENDED')),
    verified_at TEXT DEFAULT NULL,
    verified_by TEXT DEFAULT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_companies_verification ON companies(verification_status);

-- 2. TABELA DE CURRÍCULOS SALVOS NA NUVEM
CREATE TABLE IF NOT EXISTS resumes (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT DEFAULT 'Meu Currículo Profissional',
    resume_data TEXT NOT NULL, -- JSON completo estruturado com experiências, formação, habilidades
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_resumes_user ON resumes(user_id);

-- 3. TABELA DE CUPONS DE DESCONTO SOCIAL PCD (USO ÚNICO)
CREATE TABLE IF NOT EXISTS coupons (
    code TEXT PRIMARY KEY,
    discount_percent INTEGER DEFAULT 50,
    used INTEGER DEFAULT 0,
    used_at TEXT DEFAULT NULL,
    used_by TEXT DEFAULT NULL,
    candidate_name TEXT DEFAULT NULL,
    created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_coupons_used ON coupons(used);

CREATE TABLE IF NOT EXISTS payment_orders (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    company_id TEXT DEFAULT NULL,
    account_role TEXT NOT NULL CHECK (account_role IN ('USER', 'COMPANY')),
    plan TEXT NOT NULL,
    amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
    txid TEXT UNIQUE NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PAID', 'EXPIRED', 'CANCELLED', 'REFUNDED')),
    provider_end_to_end_id TEXT UNIQUE,
    created_at TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    paid_at TEXT DEFAULT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_payment_orders_user ON payment_orders(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_orders_txid ON payment_orders(txid);

CREATE TABLE IF NOT EXISTS submitted_jobs (
    id TEXT PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,
    company_id TEXT DEFAULT NULL,
    title TEXT NOT NULL,
    company TEXT NOT NULL,
    data TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'PAUSED', 'REJECTED', 'EXPIRED')),
    source_type TEXT NOT NULL DEFAULT 'ROBOT' CHECK (source_type IN ('VERIFIED_COMPANY', 'REGISTERED_COMPANY', 'ROBOT')),
    source_priority INTEGER NOT NULL DEFAULT 3,
    is_featured INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    FOREIGN KEY (company_id) REFERENCES companies(id)
);

CREATE INDEX IF NOT EXISTS idx_jobs_priority ON submitted_jobs(status, source_priority, is_featured DESC, created_at DESC);
