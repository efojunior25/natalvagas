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
    is_pro INTEGER DEFAULT 0,
    pro_plan TEXT DEFAULT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

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
