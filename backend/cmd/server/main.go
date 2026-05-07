package main

import (
	"context"
	"os"
	"os/signal"
	"path/filepath"
	"runtime"
	"syscall"
	"time"
	"net/http"

	"github.com/KFN002/B-2-Torrent/backend/internal/api"
	"github.com/KFN002/B-2-Torrent/backend/internal/repository"
	"github.com/KFN002/B-2-Torrent/backend/internal/service"
	"github.com/KFN002/B-2-Torrent/backend/pkg/cache"
	"github.com/KFN002/B-2-Torrent/backend/pkg/database"
	"github.com/KFN002/B-2-Torrent/backend/pkg/messaging"
	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
)

var (
	tempDir    string
	uploadDir  string
	downloadDir string
)

func initLogger() *zap.Logger {
	config := zap.NewProductionConfig()
	config.EncoderConfig.TimeKey = "timestamp"
	config.EncoderConfig.EncodeTime = zapcore.ISO8601TimeEncoder
	config.EncoderConfig.EncodeLevel = zapcore.CapitalColorLevelEncoder
	
	config.OutputPaths = []string{"stdout"}
	config.ErrorOutputPaths = []string{"stderr"}
	config.DisableCaller = true
	config.DisableStacktrace = true
	config.Level = zap.NewAtomicLevelAt(zapcore.WarnLevel) // Only log warnings and errors
	config.Sampling = &zap.SamplingConfig{
		Initial:    100,
		Thereafter: 100,
	}
	
	logger, err := config.Build()
	if err != nil {
		panic(err)
	}
	return logger
}

func getUserDownloadDir() string {
	homeDir, err := os.UserHomeDir()
	if err != nil {
		return "./downloads"
	}
	
	var downloadPath string
	switch runtime.GOOS {
	case "windows":
		downloadPath = filepath.Join(homeDir, "Downloads")
	case "darwin", "linux":
		downloadPath = filepath.Join(homeDir, "Downloads")
	default:
		downloadPath = "./downloads"
	}
	
	// Create directory if it doesn't exist
	if err := os.MkdirAll(downloadPath, 0755); err != nil {
		return "./downloads"
	}
	
	return downloadPath
}

func cleanupTempDirectories(logger *zap.Logger) {
	logger.Info("Cleaning up temporary directories")
	
	if tempDir != "" {
		if err := os.RemoveAll(tempDir); err != nil {
			logger.Error("Failed to remove temp directory", zap.Error(err))
		} else {
			logger.Info("Temp directory cleaned", zap.String("path", tempDir))
		}
	}
	
	if uploadDir != "" {
		if err := os.RemoveAll(uploadDir); err != nil {
			logger.Error("Failed to remove upload directory", zap.Error(err))
		} else {
			logger.Info("Upload directory cleaned", zap.String("path", uploadDir))
		}
	}
}

func main() {
	logger := initLogger()
	defer logger.Sync()

	runtime.GOMAXPROCS(runtime.NumCPU())
	
	logger.Info("Starting B-2-Torrent server",
		zap.String("version", "2.0.0"),
		zap.String("mode", "anonymous"),
		zap.Int("cpus", runtime.NumCPU()),
	)

	downloadDir = getUserDownloadDir()
	logger.Info("Using download directory", zap.String("path", downloadDir))
	
	// Create temp directory
	tempDir = filepath.Join(os.TempDir(), "b2torrent-temp")
	if err := os.MkdirAll(tempDir, 0755); err != nil {
		logger.Fatal("Failed to create temp directory", zap.Error(err))
	}
	logger.Info("Temp directory created", zap.String("path", tempDir))
	
	// Create upload directory
	uploadDir = filepath.Join(os.TempDir(), "b2torrent-uploads")
	if err := os.MkdirAll(uploadDir, 0755); err != nil {
		logger.Fatal("Failed to create upload directory", zap.Error(err))
	}
	logger.Info("Upload directory created", zap.String("path", uploadDir))
	
	// Set environment variables for handlers to use
	os.Setenv("TEMP_DIR", tempDir)
	os.Setenv("UPLOAD_DIR", uploadDir)
	os.Setenv("DOWNLOAD_DIR", downloadDir)

	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		dbURL = "postgres://torrentuser:torrentpass@localhost:5432/torrentdb?sslmode=disable"
	}
	
	ctx := context.Background()
	pool, err := database.NewPgxPool(ctx, dbURL, logger)
	if err != nil {
		logger.Fatal("Failed to create database pool", zap.Error(err))
	}
	defer pool.Close()

	redisURL := os.Getenv("REDIS_URL")
	if redisURL == "" {
		redisURL = "redis://localhost:6379/0"
	}
	
	redisCache, err := cache.NewRedisCache(redisURL, logger)
	if err != nil {
		logger.Warn("Redis cache unavailable, running without cache", zap.Error(err))
		redisCache = nil // Continue without cache
	}
	if redisCache != nil {
		defer redisCache.Close()
	}

	rabbitmqURL := os.Getenv("RABBITMQ_URL")
	if rabbitmqURL == "" {
		rabbitmqURL = "amqp://admin:admin123@localhost:5672/"
	}
	
	mq, err := messaging.NewRabbitMQ(rabbitmqURL, logger)
	if err != nil {
		logger.Warn("RabbitMQ unavailable, running without messaging", zap.Error(err))
		mq = nil // Continue without messaging
	}
	if mq != nil {
		defer mq.Close()
	}

	torrentRepo := repository.NewTorrentRepository(pool, logger)
	settingsRepo := repository.NewSettingsRepository(pool, logger)

	torrentService := service.NewTorrentService(torrentRepo, logger)
	settingsService := service.NewSettingsService(settingsRepo, redisCache, logger)

	if mq != nil {
		mq.Subscribe("torrent_completed", "torrent.completed", func(event messaging.Event) error {
			logger.Info("Torrent completed event received", zap.Any("payload", event.Payload))
			return nil
		})
		
		mq.Subscribe("security_alerts", "security.*", func(event messaging.Event) error {
			logger.Warn("Security alert received", zap.String("type", event.Type), zap.Any("payload", event.Payload))
			return nil
		})
	}

	autoDelete, _ := settingsService.Get(ctx, "auto_delete_on_shutdown")
	if autoDelete == "true" {
		logger.Info("Auto-delete on shutdown is enabled")
	}

	// Setup signal handling for graceful shutdown
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, os.Interrupt, syscall.SIGTERM)

	go func() {
		sig := <-sigChan
		logger.Info("Shutdown signal received", zap.String("signal", sig.String()))

		shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()

		autoDelete, _ := settingsService.Get(shutdownCtx, "auto_delete_on_shutdown")
		if autoDelete == "true" {
			if err := torrentService.ClearAllTorrents(shutdownCtx); err != nil {
				logger.Error("Cleanup failed", zap.Error(err))
			}
			if err := settingsRepo.ClearUser(shutdownCtx); err != nil {
				logger.Error("Cleanup failed", zap.Error(err))
			}
		}

		cleanupTempDirectories(logger)

		if err := server.Shutdown(shutdownCtx); err != nil {
			logger.Error("Server shutdown error", zap.Error(err))
		}

		pool.Close()
		if redisCache != nil {
			redisCache.Close()
		}
		if mq != nil {
			mq.Close()
		}
		
		logger.Info("Shutdown complete")
		os.Exit(0)
	}()

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	router := api.SetupRouter(pool, logger, redisCache, mq)

	server := &http.Server{
		Addr:         ":" + port,
		Handler:      router,
		ReadTimeout:  10 * time.Second,  // Reduced timeout for faster responses
		WriteTimeout: 10 * time.Second,
		IdleTimeout:  30 * time.Second,
		MaxHeaderBytes: 1 << 20, // 1MB max header size
	}

	logger.Info("Server listening", zap.String("port", port))
	if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		logger.Fatal("Server error", zap.Error(err))
	}
}
