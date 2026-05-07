package api

import (
	"net/http"

	"github.com/KFN002/B-2-Torrent/backend/internal/database"
	"github.com/KFN002/B-2-Torrent/backend/internal/middleware"
	"github.com/KFN002/B-2-Torrent/backend/internal/torrent"
	"github.com/gorilla/mux"
	"go.uber.org/zap"
)

func SetupRouter(db *database.Database, torrentClient *torrent.Client, logger *zap.Logger) http.Handler {
	r := mux.NewRouter()

	rateLimiter := middleware.NewRateLimiter()
	r.Use(middleware.SecurityHeaders)
	r.Use(middleware.AnonymityHeaders)
	r.Use(middleware.LimitRequestBody(10 << 20))
	r.Use(middleware.CORS)
	r.Use(rateLimiter.Middleware)
	r.Use(recoverer(logger))

	h := NewHandlers(db, torrentClient, logger)
	eh := NewEncryptionHandlers(logger)

	api := r.PathPrefix("/api").Subrouter()

	api.HandleFunc("/torrents", h.AddTorrent).Methods(http.MethodPost, http.MethodOptions)
	api.HandleFunc("/torrents", h.GetTorrents).Methods(http.MethodGet)
	api.HandleFunc("/torrents/{infoHash}", h.GetTorrent).Methods(http.MethodGet)
	api.HandleFunc("/torrents/{infoHash}", h.DeleteTorrent).Methods(http.MethodDelete, http.MethodOptions)
	api.HandleFunc("/torrents/{infoHash}/pause", h.PauseTorrent).Methods(http.MethodPost, http.MethodOptions)
	api.HandleFunc("/torrents/{infoHash}/resume", h.ResumeTorrent).Methods(http.MethodPost, http.MethodOptions)
	api.HandleFunc("/torrents/{infoHash}/favorite", h.ToggleFavorite).Methods(http.MethodPost, http.MethodOptions)
	api.HandleFunc("/torrents/{infoHash}/limits", h.SetTorrentLimits).Methods(http.MethodPost, http.MethodOptions)
	api.HandleFunc("/torrents/{infoHash}/schedule", h.SetTorrentSchedule).Methods(http.MethodPost, http.MethodOptions)
	api.HandleFunc("/torrents/events", h.GetTorrentEvents).Methods(http.MethodGet)

	api.HandleFunc("/settings", h.GetSettings).Methods(http.MethodGet)
	api.HandleFunc("/settings", h.UpdateSettings).Methods(http.MethodPut, http.MethodOptions)
	api.HandleFunc("/settings/limits", h.SetGlobalLimits).Methods(http.MethodPost, http.MethodOptions)
	api.HandleFunc("/config/initial", h.ApplyInitialConfig).Methods(http.MethodPost, http.MethodOptions)

	api.HandleFunc("/encryption/encrypt", eh.EncryptFile).Methods(http.MethodPost, http.MethodOptions)
	api.HandleFunc("/encryption/decrypt", eh.DecryptFile).Methods(http.MethodPost, http.MethodOptions)
	api.HandleFunc("/encryption/algorithms", eh.GetSupportedAlgorithms).Methods(http.MethodGet)

	api.HandleFunc("/security/status", h.GetSecurityStatus).Methods(http.MethodGet)
	api.HandleFunc("/security/config", h.GetSecurityConfig).Methods(http.MethodGet)
	api.HandleFunc("/security/settings", h.UpdateSecuritySettings).Methods(http.MethodPut, http.MethodOptions)
	api.HandleFunc("/security/killswitch", h.TriggerKillSwitch).Methods(http.MethodPost, http.MethodOptions)
	api.HandleFunc("/security/ip", h.GetIPStatus).Methods(http.MethodGet)
	api.HandleFunc("/security/dns-test", h.TestDNSLeak).Methods(http.MethodGet)
	api.HandleFunc("/security/metrics", h.GetSecurityMetrics).Methods(http.MethodGet)
	api.HandleFunc("/security/events", h.GetSecurityEvents).Methods(http.MethodGet)
	api.HandleFunc("/security/secure-delete", h.SecureDeleteFile).Methods(http.MethodPost, http.MethodOptions)

	api.HandleFunc("/network/connections", h.GetNetworkConnections).Methods(http.MethodGet)
	api.HandleFunc("/network/stats", h.GetNetworkStats).Methods(http.MethodGet)
	api.HandleFunc("/network/tor", h.GetTorConnections).Methods(http.MethodGet)

	api.HandleFunc("/health", h.HealthCheck).Methods(http.MethodGet)
	api.HandleFunc("/cleanup", h.CleanupData).Methods(http.MethodPost, http.MethodOptions)

	return r
}

func NewHandlers(db *database.Database, torrentClient *torrent.Client, logger *zap.Logger) *Handlers {
	return &Handlers{
		db:            db,
		torrentClient: torrentClient,
		logger:        logger,
	}
}

func recoverer(logger *zap.Logger) mux.MiddlewareFunc {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			defer func() {
				if err := recover(); err != nil {
					logger.Error("request failed", zap.String("method", r.Method), zap.Any("panic", err))
					http.Error(w, "internal server error", http.StatusInternalServerError)
				}
			}()
			next.ServeHTTP(w, r)
		})
	}
}
