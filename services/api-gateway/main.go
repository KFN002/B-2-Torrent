package main

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/gorilla/mux"
	"github.com/redis/go-redis/v9"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
)

type Gateway struct {
	router       *mux.Router
	redis        *redis.Client
	authConn     *grpc.ClientConn
	torrentConn  *grpc.ClientConn
	securityConn *grpc.ClientConn
}

func main() {
	// Redis connection
	rdb := redis.NewClient(&redis.Options{
		Addr: os.Getenv("REDIS_URL"),
		DB:   0,
	})

	// gRPC connections
	authConn, err := grpc.NewClient(
		os.Getenv("AUTH_SERVICE_URL"),
		grpc.WithTransportCredentials(insecure.NewCredentials()),
		grpc.WithDefaultCallOptions(grpc.MaxCallRecvMsgSize(50*1024*1024)),
	)
	if err != nil {
		log.Fatalf("Failed to connect to auth service: %v", err)
	}
	defer authConn.Close()

	torrentConn, err := grpc.NewClient(
		os.Getenv("TORRENT_SERVICE_URL"),
		grpc.WithTransportCredentials(insecure.NewCredentials()),
		grpc.WithDefaultCallOptions(grpc.MaxCallRecvMsgSize(50*1024*1024)),
	)
	if err != nil {
		log.Fatalf("Failed to connect to torrent service: %v", err)
	}
	defer torrentConn.Close()

	securityConn, err := grpc.NewClient(
		os.Getenv("SECURITY_SERVICE_URL"),
		grpc.WithTransportCredentials(insecure.NewCredentials()),
	)
	if err != nil {
		log.Fatalf("Failed to connect to security service: %v", err)
	}
	defer securityConn.Close()

	gateway := &Gateway{
		router:       mux.NewRouter(),
		redis:        rdb,
		authConn:     authConn,
		torrentConn:  torrentConn,
		securityConn: securityConn,
	}

	gateway.setupRoutes()

	port := os.Getenv("PORT")
	if port == "" {
		port = "8000"
	}
	bindAddress := os.Getenv("BIND_ADDRESS")
	if bindAddress == "" {
		bindAddress = "127.0.0.1"
	}

	srv := &http.Server{
		Addr:           bindAddress + ":" + port,
		Handler:        gateway.router,
		ReadTimeout:    15 * time.Second,
		WriteTimeout:   15 * time.Second,
		IdleTimeout:    60 * time.Second,
		MaxHeaderBytes: 1 << 20,
	}

	log.Printf("API Gateway starting on port %s", port)
	if err := srv.ListenAndServe(); err != nil {
		log.Fatal(err)
	}
}

func (g *Gateway) setupRoutes() {
	g.router.HandleFunc("/health", g.healthCheck).Methods("GET")
	g.router.HandleFunc("/api/torrents", g.handleTorrents).Methods("GET", "POST")
	g.router.HandleFunc("/api/security/status", g.handleSecurityStatus).Methods("GET")
}

func (g *Gateway) healthCheck(w http.ResponseWriter, r *http.Request) {
	json.NewEncoder(w).Encode(map[string]string{"status": "healthy"})
}

func (g *Gateway) handleTorrents(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "torrents endpoint"})
}

func (g *Gateway) handleSecurityStatus(w http.ResponseWriter, r *http.Request) {
	ctx := context.Background()

	// Try to get from cache first
	cached, err := g.redis.Get(ctx, "security:status").Result()
	if err == nil {
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(cached))
		return
	}

	// Fail closed: no downstream result means no controls have been verified.
	status := map[string]interface{}{
		"verified":             false,
		"killSwitchActive":     false,
		"dnsProtectionActive":  false,
		"ipObfuscationActive":  false,
		"dataEncryptionActive": false,
		"overallSecurityScore": 0,
	}

	data, _ := json.Marshal(status)
	g.redis.Set(ctx, "security:status", data, 30*time.Second)

	w.Header().Set("Content-Type", "application/json")
	w.Write(data)
}
