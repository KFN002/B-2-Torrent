package database

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	_ "github.com/lib/pq"
)

type Database struct {
	db *sql.DB
}

type Torrent struct {
	InfoHash     string    `json:"infoHash"`
	Name         string    `json:"name"`
	TotalSize    int64     `json:"totalSize"`
	Downloaded   int64     `json:"downloaded"`
	Uploaded     int64     `json:"uploaded"`
	DownloadRate int64     `json:"downloadRate"`
	UploadRate   int64     `json:"uploadRate"`
	Progress     float64   `json:"progress"`
	Status       string    `json:"status"`
	MagnetURI    string    `json:"magnetUri"`
	CreatedAt    time.Time `json:"createdAt"`
}

func New(dbURL string) (*Database, error) {
	if dbURL == "" {
		return nil, fmt.Errorf("DATABASE_URL not provided")
	}

	db, err := sql.Open("postgres", dbURL)
	if err != nil {
		return nil, fmt.Errorf("failed to open database: %w", err)
	}

	db.SetMaxOpenConns(25)
	db.SetMaxIdleConns(10)
	db.SetConnMaxLifetime(10 * time.Minute)
	db.SetConnMaxIdleTime(5 * time.Minute)

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := db.PingContext(ctx); err != nil {
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	return &Database{db: db}, nil
}

func (d *Database) Close() error {
	return d.db.Close()
}

func (d *Database) ClearActiveTorrents() error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	_, err := d.db.ExecContext(ctx, "TRUNCATE TABLE active_torrents")
	if err != nil {
		return fmt.Errorf("failed to clear active torrents: %w", err)
	}
	return nil
}

func (d *Database) SaveTorrent(t *Torrent) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	query := `
		INSERT INTO active_torrents 
		(info_hash, name, total_size, downloaded, uploaded, download_rate, upload_rate, progress, status, magnet_uri)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
		ON CONFLICT (info_hash) DO UPDATE SET
			downloaded = EXCLUDED.downloaded,
			uploaded = EXCLUDED.uploaded,
			download_rate = EXCLUDED.download_rate,
			upload_rate = EXCLUDED.upload_rate,
			progress = EXCLUDED.progress,
			status = EXCLUDED.status,
			updated_at = CURRENT_TIMESTAMP
	`
	_, err := d.db.ExecContext(ctx, query, t.InfoHash, t.Name, t.TotalSize, t.Downloaded,
		t.Uploaded, t.DownloadRate, t.UploadRate, t.Progress, t.Status, t.MagnetURI)
	if err != nil {
		return fmt.Errorf("failed to save torrent: %w", err)
	}
	return nil
}

func (d *Database) GetAllTorrents() ([]Torrent, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	query := `
		SELECT info_hash, name, total_size, downloaded, uploaded, 
			   download_rate, upload_rate, progress, status, magnet_uri, created_at 
		FROM active_torrents 
		ORDER BY created_at DESC
		LIMIT 1000
	`

	rows, err := d.db.QueryContext(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("failed to query torrents: %w", err)
	}
	defer rows.Close()

	torrents := make([]Torrent, 0, 100)
	for rows.Next() {
		var t Torrent
		err := rows.Scan(&t.InfoHash, &t.Name, &t.TotalSize, &t.Downloaded,
			&t.Uploaded, &t.DownloadRate, &t.UploadRate, &t.Progress,
			&t.Status, &t.MagnetURI, &t.CreatedAt)
		if err != nil {
			return nil, fmt.Errorf("failed to scan torrent row: %w", err)
		}
		torrents = append(torrents, t)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating rows: %w", err)
	}

	return torrents, nil
}

func (d *Database) DeleteTorrent(infoHash string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	_, err := d.db.ExecContext(ctx, "DELETE FROM active_torrents WHERE info_hash = $1", infoHash)
	if err != nil {
		return fmt.Errorf("failed to delete torrent: %w", err)
	}
	return nil
}

func (d *Database) GetSetting(key string) (string, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()

	var value string
	err := d.db.QueryRowContext(ctx, "SELECT value FROM settings WHERE key = $1", key).Scan(&value)
	if err == sql.ErrNoRows {
		return "", nil
	}
	if err != nil {
		return "", fmt.Errorf("failed to get setting %s: %w", key, err)
	}
	return value, nil
}

func (d *Database) SetSetting(key, value string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	query := `
		INSERT INTO settings (key, value) VALUES ($1, $2)
		ON CONFLICT (key) DO UPDATE SET 
			value = EXCLUDED.value, 
			updated_at = CURRENT_TIMESTAMP
	`
	_, err := d.db.ExecContext(ctx, query, key, value)
	if err != nil {
		return fmt.Errorf("failed to set setting %s: %w", key, err)
	}
	return nil
}

func (d *Database) ClearUserSettings() error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// Clear user settings but keep system settings
	_, err := d.db.ExecContext(ctx, "DELETE FROM settings WHERE key NOT LIKE 'system_%'")
	if err != nil {
		return fmt.Errorf("failed to clear user settings: %w", err)
	}
	return nil
}

func (d *Database) ClearAllSettings() error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	_, err := d.db.ExecContext(ctx, "TRUNCATE TABLE settings")
	if err != nil {
		return fmt.Errorf("failed to clear settings: %w", err)
	}
	return nil
}
