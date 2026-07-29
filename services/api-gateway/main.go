package main

import (
	"context"
	"encoding/json"
	"log"
	"net"
	"net/http"
	"os"
	"strconv"
	"strings"
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

	port := validatedPort(os.Getenv("PORT"))
	bindAddress := validatedBindAddress(os.Getenv("BIND_ADDRESS"))

	srv := &http.Server{
		Addr:              net.JoinHostPort(bindAddress, port),
		Handler:           gateway.router,
		ReadTimeout:       15 * time.Second,
		ReadHeaderTimeout: 5 * time.Second,
		WriteTimeout:      15 * time.Second,
		IdleTimeout:       60 * time.Second,
		MaxHeaderBytes:    1 << 20,
	}

	log.Print("API Gateway starting")
	if err := srv.ListenAndServe(); err != nil {
		log.Fatal(err)
	}
}

func validatedPort(value string) string {
	if strings.TrimSpace(value) == "" {
		return "8000"
	}
	port, err := strconv.Atoi(value)
	if err != nil || port < 1 || port > 65535 {
		log.Fatal("PORT must be a number between 1 and 65535")
	}
	return strconv.Itoa(port)
}

func validatedBindAddress(value string) string {
	if strings.TrimSpace(value) == "" {
		return "127.0.0.1"
	}
	address := strings.TrimSpace(value)
	if net.ParseIP(address) == nil && address != "localhost" {
		log.Fatal("BIND_ADDRESS must be an IP address or localhost")
	}
	return address
}

func (g *Gateway) setupRoutes() {
	g.router.HandleFunc("/health", g.healthCheck).Methods("GET")
	g.router.HandleFunc("/api/torrents", g.handleTorrents).Methods("GET", "POST")
	g.router.HandleFunc("/api/security/status", g.handleSecurityStatus).Methods("GET")
}

func (g *Gateway) healthCheck(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{"status": "healthy"})
}

func (g *Gateway) handleTorrents(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{"message": "torrents endpoint"})
}

func (g *Gateway) handleSecurityStatus(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 2*time.Second)
	defer cancel()

	// Try to get from cache first
	cached, err := g.redis.Get(ctx, "security:status").Result()
	if err == nil {
		w.Header().Set("Content-Type", "application/json")
		if _, err := w.Write([]byte(cached)); err != nil {
			log.Print("failed to write cached security status")
		}
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

	data, err := json.Marshal(status)
	if err == nil {
		if err := g.redis.Set(ctx, "security:status", data, 30*time.Second).Err(); err != nil {
			log.Print("failed to cache security status")
		}
	}
	writeJSON(w, http.StatusOK, status)
}

func writeJSON(w http.ResponseWriter, status int, value any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(value); err != nil {
		log.Print("failed to write JSON response")
	}
}
