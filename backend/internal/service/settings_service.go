package service

import (
	"context"
	"time"

	"github.com/KFN002/B-2-Torrent/backend/internal/repository"
	"github.com/KFN002/B-2-Torrent/backend/pkg/cache"
	"go.uber.org/zap"
)

type SettingsService struct {
	repo   *repository.SettingsRepository
	cache  *cache.RedisCache
	logger *zap.Logger
}

func NewSettingsService(repo *repository.SettingsRepository, cache *cache.RedisCache, logger *zap.Logger) *SettingsService {
	return &SettingsService{
		repo:   repo,
		cache:  cache,
		logger: logger,
	}
}

func (s *SettingsService) Get(ctx context.Context, key string) (string, error) {
	// Try cache first
	cacheKey := "setting:" + key
	var value string
	if err := s.cache.Get(ctx, cacheKey, &value); err == nil && value != "" {
		s.logger.Debug("Setting retrieved from cache", zap.String("key", key))
		return value, nil
	}

	// Cache miss, get from DB
	value, err := s.repo.Get(ctx, key)
	if err != nil {
		return "", err
	}

	// Store in cache
	if value != "" {
		s.cache.Set(ctx, cacheKey, value, 5*time.Minute)
	}

	return value, nil
}

func (s *SettingsService) Set(ctx context.Context, key, value string) error {
	if err := s.repo.Set(ctx, key, value); err != nil {
		return err
	}

	// Update cache
	cacheKey := "setting:" + key
	s.cache.Set(ctx, cacheKey, value, 5*time.Minute)

	s.logger.Info("Setting updated", zap.String("key", key))
	return nil
}

func (s *SettingsService) ClearUser(ctx context.Context) error {
	if err := s.repo.ClearUser(ctx); err != nil {
		return err
	}

	// Clear cache (simplified - in production use cache tags)
	s.logger.Info("User settings cleared")
	return nil
}
