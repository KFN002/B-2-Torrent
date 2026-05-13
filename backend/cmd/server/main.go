package main

import (
	"context"
	"errors"
	"net/http"
	"os"
	"os/signal"
	"path/filepath"
	"runtime"
	"strconv"
	"syscall"
	"time"

	"github.com/KFN002/B-2-Torrent/backend/internal/api"
	"github.com/KFN002/B-2-Torrent/backend/internal/database"
	"github.com/KFN002/B-2-Torrent/backend/internal/torrent"
	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
)

var (
	tempDir     string
	uploadDir   string
	downloadDir string
)

func initLogger() *zap.Logger {
	config := zap.NewProductionConfig()
	config.EncoderConfig.TimeKey = "timestamp"
	config.EncoderConfig.EncodeTime = zapcore.ISO8601TimeEncoder
	config.EncoderConfig.EncodeLevel = zapcore.CapitalLevelEncoder
	config.OutputPaths = []string{"stdout"}
	config.ErrorOutputPaths = []string{"stderr"}
	config.DisableCaller = true
	config.DisableStacktrace = true
	config.Sampling = &zap.SamplingConfig{Initial: 100, Thereafter: 100}

	level := zapcore.WarnLevel
	if configured := os.Getenv("LOG_LEVEL"); configured != "" {
		if parsed, err := zapcore.ParseLevel(configured); err == nil {
			level = parsed
		}
	}
	config.Level = zap.NewAtomicLevelAt(level)

	logger, err := config.Build()
	if err != nil {
		panic(err)
	}
	return logger
}

func getUserDownloadDir() string {
	if configured := os.Getenv("DOWNLOAD_DIR"); configured != "" {
		if err := os.MkdirAll(configured, 0700); err == nil {
			return configured
		}
	}

	homeDir, err := os.UserHomeDir()
	if err != nil {
		return "./downloads"
	}

	downloadPath := filepath.Join(homeDir, "Downloads", "B2Torrent")
	if err := os.MkdirAll(downloadPath, 0700); err != nil {
		return "./downloads"
	}

	return downloadPath
}

func cleanupTempDirectories(logger *zap.Logger) {
	for _, dir := range []string{tempDir, uploadDir} {
		if dir == "" {
			continue
		}
		if err := os.RemoveAll(dir); err != nil {
			logger.Error("failed to remove temporary directory", zap.Error(err))
		}
	}
}

func getenvDefault(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}

func main() {
	logger := initLogger()
	defer logger.Sync()

	runtime.GOMAXPROCS(runtime.NumCPU())

	downloadDir = getUserDownloadDir()
	tempDir = filepath.Join(os.TempDir(), "b2torrent-temp")
	uploadDir = filepath.Join(os.TempDir(), "b2torrent-uploads")
	for _, dir := range []string{tempDir, uploadDir, downloadDir} {
		if err := os.MkdirAll(dir, 0700); err != nil {
			logger.Fatal("failed to create app directory", zap.Error(err))
		}
	}

	os.Setenv("TEMP_DIR", tempDir)
	os.Setenv("UPLOAD_DIR", uploadDir)
	os.Setenv("DOWNLOAD_DIR", downloadDir)

	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		if os.Getenv("NODE_ENV") == "production" {
			logger.Fatal("DATABASE_URL is required in production")
		}
		dbURL = "postgres://torrentuser:torrentpass@localhost:5432/torrentdb?sslmode=disable"
	}

	db, err := database.New(dbURL)
	if err != nil {
		logger.Fatal("failed to connect to database", zap.Error(err))
	}
	defer db.Close()

	if os.Getenv("NO_LOGS_MODE") == "" {
		_ = os.Setenv("NO_LOGS_MODE", "true")
	}
	if os.Getenv("OBFUSCATE_TRAFFIC") == "" {
		_ = os.Setenv("OBFUSCATE_TRAFFIC", "true")
	}
	if os.Getenv("DHT_INVISIBILITY") == "" {
		_ = os.Setenv("DHT_INVISIBILITY", "true")
	}
	if os.Getenv("DISABLE_SHARING") == "" {
		_ = os.Setenv("DISABLE_SHARING", "true")
	}
	if os.Getenv("DNS_OBFUSCATION") == "" {
		_ = os.Setenv("DNS_OBFUSCATION", strconv.FormatBool(os.Getenv("PROXY_CHAIN") != ""))
	}
	if os.Getenv("IP_OBFUSCATION") == "" {
		_ = os.Setenv("IP_OBFUSCATION", strconv.FormatBool(os.Getenv("PROXY_CHAIN") != ""))
	}

	proxyChain := os.Getenv("PROXY_CHAIN")
	torrentClient, err := torrent.NewClient(proxyChain, downloadDir)
	if err != nil {
		logger.Fatal("failed to create torrent client", zap.Error(err))
	}
	defer torrentClient.Close()

	router := api.SetupRouter(db, torrentClient, logger)
	go api.StartSecurityMonitoring(db, torrentClient, logger)

	readTimeout, _ := strconv.Atoi(getenvDefault("HTTP_READ_TIMEOUT_SECONDS", "10"))
	writeTimeout, _ := strconv.Atoi(getenvDefault("HTTP_WRITE_TIMEOUT_SECONDS", "10"))
	port := getenvDefault("PORT", "8080")

	server := &http.Server{
		Addr:           ":" + port,
		Handler:        router,
		ReadTimeout:    time.Duration(readTimeout) * time.Second,
		WriteTimeout:   time.Duration(writeTimeout) * time.Second,
		IdleTimeout:    30 * time.Second,
		MaxHeaderBytes: 1 << 20,
	}

	errCh := make(chan error, 1)
	go func() {
		logger.Info("server listening", zap.String("port", port))
		errCh <- server.ListenAndServe()
	}()

	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, os.Interrupt, syscall.SIGTERM)

	select {
	case sig := <-sigChan:
		logger.Info("shutdown signal received", zap.String("signal", sig.String()))
	case err := <-errCh:
		if !errors.Is(err, http.ErrServerClosed) {
			logger.Fatal("server error", zap.Error(err))
		}
	}

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	autoDelete, _ := db.GetSetting("auto_delete_on_shutdown")
	if autoDelete == "true" {
		_ = db.ClearActiveTorrents()
		_ = db.ClearUserSettings()
	}

	cleanupTempDirectories(logger)
	if err := server.Shutdown(shutdownCtx); err != nil {
		logger.Error("server shutdown error", zap.Error(err))
	}
}
