package main

import (
	"context"
	"net"
	"os"
	"os/signal"
	"strconv"
	"syscall"

	"github.com/KFN002/B-2-Torrent/backend/pkg/cache"
	"github.com/KFN002/B-2-Torrent/backend/pkg/database"
	"github.com/KFN002/B-2-Torrent/backend/pkg/messaging"
	pb "github.com/KFN002/B-2-Torrent/services/proto/security"
	"go.uber.org/zap"
	"google.golang.org/grpc"
	"google.golang.org/grpc/health"
	healthpb "google.golang.org/grpc/health/grpc_health_v1"
	"google.golang.org/grpc/reflection"
)

type server struct {
	pb.UnimplementedSecurityServiceServer
	logger *zap.Logger
	mq     *messaging.RabbitMQ
}

func (s *server) GetSecurityStatus(ctx context.Context, req *pb.SecurityStatusRequest) (*pb.SecurityStatusResponse, error) {
	s.logger.Info("GetSecurityStatus called")

	return &pb.SecurityStatusResponse{
		KillSwitchActive:     false,
		DnsProtectionActive:  false,
		IpObfuscationActive:  false,
		DataEncryptionActive: false,
		OverallSecurityScore: 0,
	}, nil
}

func (s *server) CheckLeaks(ctx context.Context, req *pb.LeakCheckRequest) (*pb.LeakCheckResponse, error) {
	s.logger.Info("CheckLeaks called")

	// No external probe is implemented. Boolean fields remain false for proto
	// compatibility; callers must use the message and treat the result as unknown.
	return &pb.LeakCheckResponse{
		IpLeakDetected:  false,
		DnsLeakDetected: false,
		Message:         "Leak check not performed; no security conclusion is available",
	}, nil
}

func main() {
	logger, err := zap.NewProduction()
	if err != nil {
		panic("failed to initialize logger")
	}
	defer func() {
		_ = logger.Sync()
	}()

	logger.Info("Starting Security Microservice")

	// Initialize dependencies
	ctx := context.Background()
	dbURL := os.Getenv("DATABASE_URL")
	pool, err := database.NewPgxPool(ctx, dbURL, logger)
	if err != nil {
		logger.Fatal("Failed to connect to database", zap.Error(err))
	}
	defer pool.Close()

	redisURL := os.Getenv("REDIS_URL")
	redisCache, _ := cache.NewRedisCache(redisURL, logger)
	if redisCache != nil {
		defer redisCache.Close()
	}

	rabbitmqURL := os.Getenv("RABBITMQ_URL")
	mq, _ := messaging.NewRabbitMQ(rabbitmqURL, logger)
	if mq != nil {
		defer mq.Close()
	}

	// Create gRPC server
	grpcServer := grpc.NewServer()

	securityServer := &server{
		logger: logger,
		mq:     mq,
	}

	pb.RegisterSecurityServiceServer(grpcServer, securityServer)

	// Register health check
	healthServer := health.NewServer()
	healthpb.RegisterHealthServer(grpcServer, healthServer)
	healthServer.SetServingStatus("", healthpb.HealthCheckResponse_SERVING)

	// Register reflection
	reflection.Register(grpcServer)

	// Start server
	port := 50053
	if value := os.Getenv("GRPC_PORT"); value != "" {
		parsed, err := strconv.Atoi(value)
		if err != nil || parsed < 1 || parsed > 65535 {
			logger.Fatal("GRPC_PORT must be a number between 1 and 65535")
		}
		port = parsed
	}

	lis, err := net.Listen("tcp", net.JoinHostPort("", strconv.Itoa(port)))
	if err != nil {
		logger.Fatal("Failed to listen", zap.Error(err))
	}

	// Graceful shutdown
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, os.Interrupt, syscall.SIGTERM)

	go func() {
		<-sigChan
		logger.Info("Shutting down security service")
		grpcServer.GracefulStop()
	}()

	logger.Info("Security service listening", zap.Int("port", port))
	if err := grpcServer.Serve(lis); err != nil {
		logger.Fatal("Failed to serve", zap.Error(err))
	}
}
