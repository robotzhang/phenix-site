CREATE TABLE IF NOT EXISTS admin_wallets (
	address TEXT PRIMARY KEY,
	role TEXT NOT NULL CHECK (role IN ('super_admin')),
	status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disabled')),
	created_at INTEGER NOT NULL DEFAULT (unixepoch()),
	updated_at INTEGER NOT NULL DEFAULT (unixepoch())
) STRICT;

CREATE TABLE IF NOT EXISTS admin_auth_nonces (
	nonce TEXT PRIMARY KEY,
	address TEXT NOT NULL,
	message TEXT NOT NULL,
	expires_at INTEGER NOT NULL,
	consumed_at INTEGER
) STRICT;

CREATE TABLE IF NOT EXISTS admin_sessions (
	id TEXT PRIMARY KEY,
	address TEXT NOT NULL,
	expires_at INTEGER NOT NULL,
	created_at INTEGER NOT NULL DEFAULT (unixepoch()),
	revoked_at INTEGER,
	FOREIGN KEY (address) REFERENCES admin_wallets(address)
) STRICT;

CREATE INDEX IF NOT EXISTS idx_admin_auth_nonces_address
	ON admin_auth_nonces(address);

CREATE INDEX IF NOT EXISTS idx_admin_sessions_address
	ON admin_sessions(address);

CREATE INDEX IF NOT EXISTS idx_admin_sessions_active
	ON admin_sessions(id, expires_at, revoked_at);

