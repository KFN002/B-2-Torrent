-- Initialize database schema

-- No history, no logs - only active torrents in memory
-- This table is only for persistence of settings, not download history
CREATE TABLE IF NOT EXISTS settings (
    id SERIAL PRIMARY KEY,
    key VARCHAR(255) UNIQUE NOT NULL,
    value TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Active torrents table - gets cleared on restart for privacy
CREATE TABLE IF NOT EXISTS active_torrents (
    info_hash VARCHAR(40) PRIMARY KEY,
    name VARCHAR(512),
    total_size BIGINT,
    downloaded BIGINT DEFAULT 0,
    uploaded BIGINT DEFAULT 0,
    download_rate BIGINT DEFAULT 0,
    upload_rate BIGINT DEFAULT 0,
    progress FLOAT DEFAULT 0,
    status VARCHAR(50) DEFAULT 'downloading',
    magnet_uri TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE active_torrents
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_active_torrents_status ON active_torrents(status);
CREATE INDEX IF NOT EXISTS idx_active_torrents_updated_at ON active_torrents(updated_at);

-- Insert default settings
INSERT INTO settings (key, value) VALUES 
    ('max_download_rate', '0'),
    ('max_upload_rate', '0'),
    ('max_connections', '200'),
    ('enable_tor', 'true'),
    ('download_path', '/data/downloads'),
	('kill_switch_enabled', 'false'),
	('dns_protection_enabled', 'false'),
	('force_encryption', 'false'),
	('reject_plaintext', 'false'),
    ('no_logs_mode', 'true'),
    ('obfuscate_traffic', 'true'),
    ('vpn_type', 'none')
ON CONFLICT (key) DO NOTHING;

-- These controls were previously stored as enabled although the runtime did
-- not enforce them. Fail closed for existing installations as well.
UPDATE settings SET value = 'false', updated_at = CURRENT_TIMESTAMP
WHERE key IN ('kill_switch_enabled', 'dns_protection_enabled', 'force_encryption', 'reject_plaintext');

-- Magnet URIs can contain tracker URLs and user-supplied metadata. The client
-- only needs the info hash after activation, so erase legacy values.
UPDATE active_torrents SET magnet_uri = '' WHERE magnet_uri <> '';

-- Add function to automatically clear old data periodically
CREATE OR REPLACE FUNCTION cleanup_old_torrents()
RETURNS void AS $$
BEGIN
    -- This function can be called manually or via cron
    DELETE FROM active_torrents WHERE created_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;
