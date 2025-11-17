package main

import (
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/KFN002/B-2-Torrent/backend/internal/api"
	"github.com/KFN002/B-2-Torrent/backend/internal/database"
	"github.com/KFN002/B-2-Torrent/backend/internal/torrent"
)

func main() {
	log.SetOutput(os.Stderr)
	log.SetFlags(log.Ldate | log.Ltime | log.Lshortfile)

	// Initialize database
	db, err := database.New(os.Getenv("DATABASE_URL"))
	if err != nil {
		log.Fatalf("FATAL: Failed to connect to database: %v", err)
	}
	defer db.Close()

	// Initialize torrent client with multi-proxy support
	torrentClient, err := torrent.NewClient(os.Getenv("TOR_PROXY"))
	if err != nil {
		log.Fatalf("FATAL: Failed to initialize torrent client: %v", err)
	}
	defer torrentClient.Close()

	// Clear active torrents on startup for privacy
	if err := db.ClearActiveTorrents(); err != nil {
		log.Printf("ERROR: Failed to clear active torrents: %v", err)
	}

	// Setup signal handling for graceful shutdown
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, os.Interrupt, syscall.SIGTERM)

	go func() {
		<-sigChan
		log.Println("SHUTDOWN: Cleaning up and exiting...")

		// Clear all data before shutdown
		if err := db.ClearActiveTorrents(); err != nil {
			log.Printf("ERROR: Failed to clear torrents during shutdown: %v", err)
		}

		if err := torrentClient.Close(); err != nil {
			log.Printf("ERROR: Failed to close torrent client: %v", err)
		}

		os.Exit(0)
	}()

	// Start API server with Gorilla Mux
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	router := api.SetupRouter(db, torrentClient)

	server := &http.Server{
		Addr:           ":" + port,
		Handler:        router,
		ReadTimeout:    15 * time.Second,
		WriteTimeout:   15 * time.Second,
		IdleTimeout:    60 * time.Second,
		MaxHeaderBytes: 1 << 20,
	}

	log.Printf("Starting server on port %s...", port)
	if err := server.ListenAndServe(); err != nil {
		log.Fatalf("FATAL: Failed to start server: %v", err)
	}
}
