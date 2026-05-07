package repository

import (
	"context"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"go.uber.org/zap"
)

type SettingsRepository struct {
	pool   *pgxpool.Pool
	logger *zap.Logger
}

func NewSettingsRepository(pool *pgxpool.Pool, logger *zap.Logger) *SettingsRepository {
	return &SettingsRepository{
		pool:   pool,
		logger: logger,
	}
}

func (r *SettingsRepository) Get(ctx context.Context, key string) (string, error) {
	var value string
	err := r.pool.QueryRow(ctx, "SELECT value FROM settings WHERE key = $1", key).Scan(&value)
	if err == pgx.ErrNoRows {
		return "", nil
	}
	if err != nil {
		r.logger.Error("Failed to get setting", zap.Error(err), zap.String("key", key))
		return "", fmt.Errorf("failed to get setting: %w", err)
	}
	return value, nil
}

func (r *SettingsRepository) Set(ctx context.Context, key, value string) error {
	query := `
		INSERT INTO settings (key, value, updated_at) VALUES ($1, $2, $3)
		ON CONFLICT (key) DO UPDATE SET 
			value = EXCLUDED.value, 
			updated_at = EXCLUDED.updated_at
	`
	_, err := r.pool.Exec(ctx, query, key, value, time.Now())
	if err != nil {
		r.logger.Error("Failed to set setting", zap.Error(err), zap.String("key", key))
		return fmt.Errorf("failed to set setting: %w", err)
	}
	return nil
}

func (r *SettingsRepository) ClearUser(ctx context.Context) error {
	_, err := r.pool.Exec(ctx, "DELETE FROM settings WHERE key NOT LIKE 'system_%'")
	if err != nil {
		r.logger.Error("Failed to clear user settings", zap.Error(err))
		return fmt.Errorf("failed to clear user settings: %w", err)
	}
	return nil
}

func (r *SettingsRepository) ClearAll(ctx context.Context) error {
	_, err := r.pool.Exec(ctx, "TRUNCATE TABLE settings")
	if err != nil {
		r.logger.Error("Failed to clear all settings", zap.Error(err))
		return fmt.Errorf("failed to clear all settings: %w", err)
	}
	return nil
}
