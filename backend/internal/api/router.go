package api

import (
	"log"
	"net/http"

	"github.com/KFN002/B-2-Torrent/backend/internal/database"
	"github.com/KFN002/B-2-Torrent/backend/internal/middleware"
	"github.com/KFN002/B-2-Torrent/backend/internal/torrent"
	"github.com/gorilla/mux"
)

// SetupRouter configures routes with Gorilla Mux for better security and middleware support
func SetupRouter(db *database.Database, tc *torrent.Client) http.Handler {
	r := mux.NewRouter()

	// Security middleware
	rateLimiter := middleware.NewRateLimiter()
	r.Use(middleware.SecurityHeaders)
	r.Use(middleware.AnonymityHeaders)
	r.Use(middleware.CORS)
	r.Use(rateLimiter.Middleware)

	// Recovery middleware for fault tolerance
	r.Use(func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			defer func() {
				if err := recover(); err != nil {
					log.Printf("PANIC RECOVERED: %v", err)
					http.Error(w, "Internal server error", http.StatusInternalServerError)
				}
			}()
			next.ServeHTTP(w, r)
		})
	})

	// Create handlers
	h := &Handlers{
		db:            db,
		torrentClient: tc,
	}

	// API routes with Gorilla Mux
	api := r.PathPrefix("/api").Subrouter()

	// Torrent routes
	api.HandleFunc("/torrents", h.AddTorrent).Methods("POST", "OPTIONS")
	api.HandleFunc("/torrents", h.GetTorrents).Methods("GET")
	api.HandleFunc("/torrents/{infoHash}", h.GetTorrent).Methods("GET")
	api.HandleFunc("/torrents/{infoHash}", h.DeleteTorrent).Methods("DELETE", "OPTIONS")
	api.HandleFunc("/torrents/{infoHash}/pause", h.PauseTorrent).Methods("POST", "OPTIONS")
	api.HandleFunc("/torrents/{infoHash}/resume", h.ResumeTorrent).Methods("POST", "OPTIONS")

	// Settings routes
	api.HandleFunc("/settings", h.GetSettings).Methods("GET")
	api.HandleFunc("/settings", h.UpdateSettings).Methods("PUT", "OPTIONS")

	// Health check
	api.HandleFunc("/health", h.HealthCheck).Methods("GET")

	// Cleanup endpoint
	api.HandleFunc("/cleanup", h.CleanupData).Methods("POST", "OPTIONS")

	return r
}
