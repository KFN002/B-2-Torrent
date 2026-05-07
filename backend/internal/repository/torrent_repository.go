package repository

import (
	"context"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"go.uber.org/zap"
)

type TorrentRepository struct {
	pool   *pgxpool.Pool
	logger *zap.Logger
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

func NewTorrentRepository(pool *pgxpool.Pool, logger *zap.Logger) *TorrentRepository {
	return &TorrentRepository{
		pool:   pool,
		logger: logger,
	}
}

func (r *TorrentRepository) GetAll(ctx context.Context, limit int) ([]Torrent, error) {
	query := `
		SELECT info_hash, name, total_size, downloaded, uploaded, 
			   download_rate, upload_rate, progress, status, magnet_uri, created_at 
		FROM active_torrents 
		ORDER BY created_at DESC
		LIMIT $1
	`

	rows, err := r.pool.Query(ctx, query, limit)
	if err != nil {
		r.logger.Error("Failed to query torrents", zap.Error(err))
		return nil, fmt.Errorf("failed to query torrents: %w", err)
	}
	defer rows.Close()

	torrents := make([]Torrent, 0, limit)
	for rows.Next() {
		var t Torrent
		err := rows.Scan(&t.InfoHash, &t.Name, &t.TotalSize, &t.Downloaded,
			&t.Uploaded, &t.DownloadRate, &t.UploadRate, &t.Progress,
			&t.Status, &t.MagnetURI, &t.CreatedAt)
		if err != nil {
			r.logger.Error("Failed to scan torrent row", zap.Error(err))
			continue
		}
		torrents = append(torrents, t)
	}

	if err := rows.Err(); err != nil {
		r.logger.Error("Row iteration error", zap.Error(err))
		return nil, fmt.Errorf("row iteration error: %w", err)
	}

	return torrents, nil
}

func (r *TorrentRepository) Save(ctx context.Context, t *Torrent) error {
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

	_, err := r.pool.Exec(ctx, query, t.InfoHash, t.Name, t.TotalSize, t.Downloaded,
		t.Uploaded, t.DownloadRate, t.UploadRate, t.Progress, t.Status, t.MagnetURI)
	if err != nil {
		r.logger.Error("Failed to save torrent", zap.Error(err), zap.String("info_hash", t.InfoHash))
		return fmt.Errorf("failed to save torrent: %w", err)
	}

	return nil
}

func (r *TorrentRepository) Delete(ctx context.Context, infoHash string) error {
	query := `DELETE FROM active_torrents WHERE info_hash = $1`
	_, err := r.pool.Exec(ctx, query, infoHash)
	if err != nil {
		r.logger.Error("Failed to delete torrent", zap.Error(err), zap.String("info_hash", infoHash))
		return fmt.Errorf("failed to delete torrent: %w", err)
	}
	return nil
}

func (r *TorrentRepository) ClearAll(ctx context.Context) error {
	_, err := r.pool.Exec(ctx, "TRUNCATE TABLE active_torrents")
	if err != nil {
		r.logger.Error("Failed to clear torrents", zap.Error(err))
		return fmt.Errorf("failed to clear torrents: %w", err)
	}
	return nil
}
