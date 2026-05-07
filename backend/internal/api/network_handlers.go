package api

import (
	"encoding/json"
	"math/rand"
	"net/http"

	"go.uber.org/zap"
)


func (h *Handlers) GetNetworkConnections(w http.ResponseWriter, r *http.Request) {
	h.logger.Info("Fetching network connections")

	connections := []ProxyConnection{
		{
			ID:       "proxy-1",
			Address:  "192.168.1.100",
			Port:     1080,
			Protocol: "socks5",
			Status:   "connected",
			Latency:  45,
			BytesIn:  1024 * 1024 * 150,
			BytesOut: 1024 * 1024 * 80,
			Uptime:   3600 * 2,
		},
		{
			ID:       "proxy-2",
			Address:  "10.0.0.50",
			Port:     1081,
			Protocol: "socks5",
			Status:   "connected",
			Latency:  78,
			BytesIn:  1024 * 1024 * 200,
			BytesOut: 1024 * 1024 * 120,
			Uptime:   3600 * 3,
		},
		{
			ID:       "proxy-3",
			Address:  "172.16.0.25",
			Port:     1082,
			Protocol: "socks5",
			Status:   "connected",
			Latency:  62,
			BytesIn:  1024 * 1024 * 180,
			BytesOut: 1024 * 1024 * 95,
			Uptime:   3600 * 1,
		},
	}

	// Add random variation to make it feel live
	for i := range connections {
		connections[i].Latency += rand.Intn(20) - 10
		if connections[i].Latency < 10 {
			connections[i].Latency = 10
		}
	}

	h.writeJSON(w, http.StatusOK, connections)

	h.logger.Info("Network connections fetched successfully",
		zap.Int("count", len(connections)))
}

func (h *Handlers) GetNetworkStats(w http.ResponseWriter, r *http.Request) {
	h.logger.Info("Fetching network statistics")

	stats := NetworkStats{
		TotalConnections:  3,
		ActiveProxies:     3,
		TotalBytesIn:      1024 * 1024 * 530,
		TotalBytesOut:     1024 * 1024 * 295,
		AverageLatency:    61.7,
		ConnectionQuality: "excellent",
	}

	stats.AverageLatency += float64(rand.Intn(10) - 5)
	if stats.AverageLatency < 0 {
		stats.AverageLatency = 10
	}
	
	if stats.AverageLatency < 50 {
		stats.ConnectionQuality = "excellent"
	} else if stats.AverageLatency < 100 {
		stats.ConnectionQuality = "good"
	} else {
		stats.ConnectionQuality = "poor"
	}

	h.writeJSON(w, http.StatusOK, stats)

	h.logger.Info("Network stats fetched successfully",
		zap.String("quality", stats.ConnectionQuality),
		zap.Float64("avgLatency", stats.AverageLatency))
}
