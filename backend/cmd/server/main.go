package main

import (
	"log"
	"os"
	"os/signal"
	"syscall"

	"github.com/KFN002/B-2-Torrent/backend/internal/api"
	"github.com/KFN002/B-2-Torrent/backend/internal/database"
	"github.com/KFN002/B-2-Torrent/backend/internal/torrent"
)

func main() {
	log.SetOutput(os.Stderr)

	// Initialize database
	db, err := database.New(os.Getenv("DATABASE_URL"))
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}
	defer db.Close()

	// Initialize torrent client
	torrentClient, err := torrent.NewClient(os.Getenv("TOR_PROXY"))
	if err != nil {
		log.Fatal("Failed to initialize torrent client:", err)
	}
	defer torrentClient.Close()

	// Clear active torrents on startup for privacy
	if err := db.ClearActiveTorrents(); err != nil {
		log.Println("Warning: Failed to clear active torrents:", err)
	}

	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, os.Interrupt, syscall.SIGTERM)

	go func() {
		<-sigChan
		log.Println("Shutting down and cleaning up...")

		// Clear all data before shutdown
		db.ClearActiveTorrents()
		torrentClient.Close()

		os.Exit(0)
	}()

	// Start API server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	router := api.SetupRouter(db, torrentClient)
	log.Printf("Starting server on port %s...", port)
	if err := router.Run(":" + port); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}
