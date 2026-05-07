package cache

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/redis/go-redis/v9"
	"go.uber.org/zap"
)

type RedisCache struct {
	client *redis.Client
	logger *zap.Logger
}

func NewRedisCache(redisURL string, logger *zap.Logger) (*RedisCache, error) {
	opt, err := redis.ParseURL(redisURL)
	if err != nil {
		return nil, fmt.Errorf("failed to parse redis URL: %w", err)
	}

	client := redis.NewClient(opt)

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := client.Ping(ctx).Err(); err != nil {
		return nil, fmt.Errorf("failed to connect to redis: %w", err)
	}

	logger.Info("Redis cache connected successfully")

	return &RedisCache{
		client: client,
		logger: logger,
	}, nil
}

func (c *RedisCache) Get(ctx context.Context, key string, dest interface{}) error {
	data, err := c.client.Get(ctx, key).Result()
	if err == redis.Nil {
		return nil // Cache miss
	}
	if err != nil {
		c.logger.Warn("Redis GET error", zap.Error(err), zap.String("key", key))
		return err
	}

	if err := json.Unmarshal([]byte(data), dest); err != nil {
		c.logger.Error("Failed to unmarshal cached data", zap.Error(err))
		return err
	}

	return nil
}

func (c *RedisCache) Set(ctx context.Context, key string, value interface{}, ttl time.Duration) error {
	data, err := json.Marshal(value)
	if err != nil {
		c.logger.Error("Failed to marshal data for cache", zap.Error(err))
		return err
	}

	if err := c.client.Set(ctx, key, data, ttl).Err(); err != nil {
		c.logger.Warn("Redis SET error", zap.Error(err), zap.String("key", key))
		return err
	}

	return nil
}

func (c *RedisCache) Delete(ctx context.Context, keys ...string) error {
	if err := c.client.Del(ctx, keys...).Err(); err != nil {
		c.logger.Warn("Redis DEL error", zap.Error(err))
		return err
	}
	return nil
}

func (c *RedisCache) Close() error {
	return c.client.Close()
}
