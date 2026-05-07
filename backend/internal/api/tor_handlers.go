package api

import (
	"net/http"

	"go.uber.org/zap"
)

// GetTorConnections returns active Tor connections
func (h *Handlers) GetTorConnections(w http.ResponseWriter, r *http.Request) {
	h.logger.Info("Fetching Tor connections")

	// Get actual Tor connections from torrent client
	connections := h.torrentClient.GetProxyConnections()

	h.logger.Info("Tor connections fetched successfully",
		zap.Int("count", len(connections)),
	)

	h.writeJSON(w, http.StatusOK, connections)
}
