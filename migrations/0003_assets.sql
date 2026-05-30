CREATE TABLE IF NOT EXISTS assets (
	id INTEGER PRIMARY KEY,
	asset_code TEXT NOT NULL UNIQUE,
	chain_state TEXT NOT NULL DEFAULT 'draft'
		CHECK (chain_state IN ('draft', 'issuing', 'onchain', 'issue_failed')),
	display_state TEXT NOT NULL DEFAULT 'active'
		CHECK (display_state IN ('active', 'hidden', 'archived')),
	created_at INTEGER NOT NULL DEFAULT (unixepoch()),
	updated_at INTEGER NOT NULL DEFAULT (unixepoch())
) STRICT;

CREATE TABLE IF NOT EXISTS asset_onchain_data (
	asset_id INTEGER PRIMARY KEY,
	chain_id INTEGER NOT NULL DEFAULT 8453,
	contract_address TEXT NOT NULL,
	recipient_address TEXT,
	name TEXT,
	phenix_price_wei TEXT,
	phenix_price_text TEXT,
	file_hash TEXT,
	package_key TEXT,
	package_url TEXT,
	package_size_bytes INTEGER,
	rwa_id TEXT UNIQUE,
	token_uri TEXT,
	issue_tx_hash TEXT,
	onchain_status TEXT CHECK (onchain_status IN ('published', 'unpublished', 'burned')),
	confirmed_at INTEGER,
	locked_at INTEGER,
	created_at INTEGER NOT NULL DEFAULT (unixepoch()),
	updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
	FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE,
	CHECK (file_hash IS NULL OR length(file_hash) IN (32, 64))
) STRICT;

CREATE TABLE IF NOT EXISTS asset_offchain_data (
	asset_id INTEGER PRIMARY KEY,
	member_price_cny_cents INTEGER,
	category_label TEXT,
	source_label TEXT,
	spec TEXT,
	size TEXT,
	description TEXT,
	sort_order INTEGER NOT NULL DEFAULT 0,
	updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
	FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE
) STRICT;

CREATE TABLE IF NOT EXISTS asset_media (
	id INTEGER PRIMARY KEY,
	asset_id INTEGER NOT NULL,
	role TEXT NOT NULL CHECK (role IN ('product', 'certificate')),
	url TEXT NOT NULL,
	storage_key TEXT,
	sort_order INTEGER NOT NULL DEFAULT 0,
	created_at INTEGER NOT NULL DEFAULT (unixepoch()),
	FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE
) STRICT;

CREATE TABLE IF NOT EXISTS asset_chain_issue_attempts (
	id INTEGER PRIMARY KEY,
	asset_id INTEGER NOT NULL,
	tx_hash TEXT,
	status TEXT NOT NULL CHECK (status IN ('submitted', 'confirmed', 'failed')),
	error_message TEXT,
	created_at INTEGER NOT NULL DEFAULT (unixepoch()),
	confirmed_at INTEGER,
	FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE
) STRICT;

CREATE INDEX IF NOT EXISTS idx_assets_chain_state
	ON assets(chain_state);

CREATE INDEX IF NOT EXISTS idx_asset_media_asset_role_order
	ON asset_media(asset_id, role, sort_order);

CREATE INDEX IF NOT EXISTS idx_asset_chain_issue_attempts_asset
	ON asset_chain_issue_attempts(asset_id, created_at);

CREATE TRIGGER IF NOT EXISTS lock_asset_onchain_fields
BEFORE UPDATE OF name, recipient_address, phenix_price_wei, phenix_price_text,
	file_hash, package_key, package_url, package_size_bytes
ON asset_onchain_data
WHEN OLD.locked_at IS NOT NULL
BEGIN
	SELECT RAISE(ABORT, 'asset onchain data is locked');
END;

CREATE TRIGGER IF NOT EXISTS lock_asset_media_insert
BEFORE INSERT ON asset_media
WHEN EXISTS (
	SELECT 1
	FROM assets
	WHERE assets.id = NEW.asset_id AND assets.chain_state = 'onchain'
)
BEGIN
	SELECT RAISE(ABORT, 'asset media is locked');
END;

CREATE TRIGGER IF NOT EXISTS lock_asset_media_update
BEFORE UPDATE ON asset_media
WHEN EXISTS (
	SELECT 1
	FROM assets
	WHERE assets.id = OLD.asset_id AND assets.chain_state = 'onchain'
)
BEGIN
	SELECT RAISE(ABORT, 'asset media is locked');
END;

CREATE TRIGGER IF NOT EXISTS lock_asset_media_delete
BEFORE DELETE ON asset_media
WHEN EXISTS (
	SELECT 1
	FROM assets
	WHERE assets.id = OLD.asset_id AND assets.chain_state = 'onchain'
)
BEGIN
	SELECT RAISE(ABORT, 'asset media is locked');
END;
