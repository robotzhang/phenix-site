ALTER TABLE admin_wallets ADD COLUMN label TEXT;
ALTER TABLE admin_wallets ADD COLUMN created_by TEXT;
ALTER TABLE admin_wallets ADD COLUMN disabled_at INTEGER;
ALTER TABLE admin_wallets ADD COLUMN disabled_by TEXT;

CREATE INDEX IF NOT EXISTS idx_admin_wallets_status
	ON admin_wallets(status);
