package api

import (
	"github.com/KFN002/B-2-Torrent/backend/internal/database"
	"github.com/KFN002/B-2-Torrent/backend/internal/middleware"
	"github.com/KFN002/B-2-Torrent/backend/internal/torrent"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func SetupRouter(db *database.Database, tc *torrent.Client) *gin.Engine {
	gin.SetMode(gin.ReleaseMode)
	gin.DisableConsoleColor()

	router := gin.New()

	router.Use(gin.Recovery())
	router.Use(middleware.SecurityHeaders())
	router.Use(middleware.RemoveHeaders())
	router.Use(middleware.NoLogging())

	// CORS configuration
	config := cors.DefaultConfig()
	config.AllowOrigins = []string{"*"}
	config.AllowMethods = []string{"GET", "POST", "DELETE", "PUT"}
	router.Use(cors.New(config))

	// Create handlers
	h := &Handlers{
		db:            db,
		torrentClient: tc,
	}

	// API routes
	api := router.Group("/api")
	{
		// Torrent routes
		api.POST("/torrents", h.AddTorrent)
		api.GET("/torrents", h.GetTorrents)
		api.GET("/torrents/:infoHash", h.GetTorrent)
		api.DELETE("/torrents/:infoHash", h.DeleteTorrent)
		api.POST("/torrents/:infoHash/pause", h.PauseTorrent)
		api.POST("/torrents/:infoHash/resume", h.ResumeTorrent)

		// Settings routes
		api.GET("/settings", h.GetSettings)
		api.PUT("/settings", h.UpdateSettings)

		// Health check
		api.GET("/health", h.HealthCheck)

		api.POST("/cleanup", h.CleanupData)
	}

	return router
}
