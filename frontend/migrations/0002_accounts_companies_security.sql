ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'USER';
ALTER TABLE users ADD COLUMN company_id TEXT DEFAULT NULL;
ALTER TABLE users ADD COLUMN status TEXT NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE users ADD COLUMN pro_expires_at TEXT DEFAULT NULL;
ALTER TABLE users ADD COLUMN email_verified INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN failed_login_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN locked_until TEXT DEFAULT NULL;
ALTER TABLE users ADD COLUMN last_login_at TEXT DEFAULT NULL;
ALTER TABLE users ADD COLUMN mfa_totp_secret TEXT DEFAULT NULL;
ALTER TABLE users ADD COLUMN auth_version INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS companies (
  id TEXT PRIMARY KEY, legal_name TEXT NOT NULL, display_name TEXT NOT NULL,
  cnpj TEXT UNIQUE NOT NULL, verification_status TEXT NOT NULL DEFAULT 'PENDING',
  verified_at TEXT, verified_by TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS account_tokens (
  id TEXT PRIMARY KEY, user_id TEXT NOT NULL, token_hash TEXT UNIQUE NOT NULL,
  purpose TEXT NOT NULL, expires_at TEXT NOT NULL, used_at TEXT, created_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS payment_orders (
  id TEXT PRIMARY KEY, user_id TEXT NOT NULL, company_id TEXT, account_role TEXT NOT NULL,
  plan TEXT NOT NULL, amount_cents INTEGER NOT NULL, txid TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING', provider_end_to_end_id TEXT UNIQUE,
  created_at TEXT NOT NULL, expires_at TEXT NOT NULL, paid_at TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS submitted_jobs (
  id TEXT PRIMARY KEY, slug TEXT UNIQUE NOT NULL, company_id TEXT, title TEXT NOT NULL,
  company TEXT NOT NULL, data TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'PENDING',
  source_type TEXT NOT NULL DEFAULT 'ROBOT', source_priority INTEGER NOT NULL DEFAULT 3,
  is_featured INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL,
  FOREIGN KEY (company_id) REFERENCES companies(id)
);

CREATE INDEX IF NOT EXISTS idx_companies_verification ON companies(verification_status);
CREATE INDEX IF NOT EXISTS idx_account_tokens_hash ON account_tokens(token_hash, purpose, used_at);
CREATE INDEX IF NOT EXISTS idx_payment_orders_user ON payment_orders(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_orders_txid ON payment_orders(txid);
CREATE INDEX IF NOT EXISTS idx_jobs_priority ON submitted_jobs(status, source_priority, is_featured DESC, created_at DESC);
