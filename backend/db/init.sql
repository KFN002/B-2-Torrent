-- Initialize database schema

-- No history, no logs - only active torrents in memory
-- This table is only for persistence of settings, not download history
CREATE TABLE IF NOT EXISTS settings (
    id SERIAL PRIMARY KEY,
    key VARCHAR(255) UNIQUE NOT NULL,
    value TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
    magnet_uri TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_active_torrents_status ON active_torrents(status);

-- Insert default settings
INSERT INTO settings (key, value) VALUES 
    ('max_download_rate', '0'),
    ('max_upload_rate', '0'),
    ('max_connections', '200'),
    ('enable_tor', 'true'),
    ('download_path', '/app/downloads')
ON CONFLICT (key) DO NOTHING;

-- Add function to automatically clear old data periodically
CREATE OR REPLACE FUNCTION cleanup_old_torrents()
RETURNS void AS $$
BEGIN
    -- This function can be called manually or via cron
    DELETE FROM active_torrents WHERE created_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;
