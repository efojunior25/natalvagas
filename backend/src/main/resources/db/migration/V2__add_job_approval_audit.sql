-- Migration V2: Add audit fields for job approval (CTRL-65, CTRL-87)
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS approved_by VARCHAR(120);
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_jobs_approved_at ON jobs (approved_at);
