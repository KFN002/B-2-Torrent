package api

import (
	"net/http"

	"go.uber.org/zap"
)

func (h *Handlers) GetNetworkConnections(w http.ResponseWriter, r *http.Request) {
	h.logger.Info("Fetching network connections")

	connections := h.torrentClient.GetProxyConnections()

	h.writeJSON(w, http.StatusOK, connections)

	h.logger.Info("Network connections fetched successfully",
		zap.Int("count", len(connections)))
}

func (h *Handlers) GetNetworkStats(w http.ResponseWriter, r *http.Request) {
	h.logger.Info("Fetching network statistics")

	connections := h.torrentClient.GetProxyConnections()
	stats := NetworkStats{
		TotalConnections:  len(connections),
		ActiveProxies:     0,
		ConnectionQuality: "unverified",
	}

	h.writeJSON(w, http.StatusOK, stats)

	h.logger.Info("Network stats fetched successfully",
		zap.String("quality", stats.ConnectionQuality),
		zap.Float64("avgLatency", stats.AverageLatency))
}
