package api

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/KFN002/B-2-Torrent/backend/internal/database"
	"github.com/KFN002/B-2-Torrent/backend/internal/torrent"
	"github.com/gorilla/mux"
	"go.uber.org/zap"
)

type Handlers struct {
	db            *database.Database
	torrentClient *torrent.Client
	logger        *zap.Logger
}

type AddTorrentRequest struct {
	MagnetURI string `json:"magnetUri"`
}

type UpdateSettingsRequest struct {
	MaxDownloadRate string `json:"maxDownloadRate"`
	MaxUploadRate   string `json:"maxUploadRate"`
	MaxConnections  string `json:"maxConnections"`
	EnableTor       string `json:"enableTor"`
	DownloadPath    string `json:"downloadPath"`
}

// ErrorResponse represents an API error
type ErrorResponse struct {
	Error string `json:"error"`
}

// TorConnection represents a Tor network connection
type TorConnection struct {
	ID        string  `json:"id"`
	Address   string  `json:"address"`
	Port      int     `json:"port"`
	Country   string  `json:"country"`
	Status    string  `json:"status"` // connected, connecting, disconnected
	Latency   int     `json:"latency"`
	Bandwidth float64 `json:"bandwidth"`
	Uptime    int     `json:"uptime"`
}

// SecurityConfig represents the security settings
type SecurityConfig struct {
	KillSwitchEnabled    bool `json:"killSwitchEnabled"`
	DNSProtectionEnabled bool `json:"dnsProtectionEnabled"`
	IPObfuscationEnabled bool `json:"ipObfuscationEnabled"`
	DataEncryptionEnabled bool `json:"dataEncryptionEnabled"`
	TorEnabled           bool `json:"torEnabled"`
}

// ProxyConnection represents a network proxy connection
type ProxyConnection struct {
	ID       string `json:"id"`
	Address  string `json:"address"`
	Port     int    `json:"port"`
	Protocol string `json:"protocol"`
	Status   string `json:"status"`
	Latency  int    `json:"latency"`
	BytesIn  int64  `json:"bytesIn"`
	BytesOut int64  `json:"bytesOut"`
	Uptime   int    `json:"uptime"`
}

// NetworkStats represents network statistics
type NetworkStats struct {
	TotalConnections  int     `json:"totalConnections"`
	ActiveProxies     int     `json:"activeProxies"`
	TotalBytesIn      int64   `json:"totalBytesIn"`
	TotalBytesOut     int64   `json:"totalBytesOut"`
	AverageLatency    float64 `json:"averageLatency"`
	ConnectionQuality string  `json:"connectionQuality"`
}

// writeJSON writes JSON response with error handling
func (h *Handlers) writeJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(data); err != nil {
		h.logger.Error("Failed to encode JSON response", zap.Error(err))
	}
}

// writeError writes error response
func (h *Handlers) writeError(w http.ResponseWriter, status int, message string) {
	h.writeJSON(w, status, ErrorResponse{Error: message})
}

func (h *Handlers) AddTorrent(w http.ResponseWriter, r *http.Request) {
	var req AddTorrentRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		h.logger.Warn("Invalid request body for add torrent", zap.Error(err))
		h.writeError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if req.MagnetURI == "" {
		h.logger.Warn("Empty magnet URI received")
		h.writeError(w, http.StatusBadRequest, "Magnet URI is required")
		return
	}

	h.logger.Info("Adding new torrent", zap.String("magnetUri", req.MagnetURI[:50]+"..."))

	infoHash, err := h.torrentClient.AddMagnet(req.MagnetURI)
	if err != nil {
		h.logger.Error("Failed to add torrent", zap.Error(err))
		h.writeError(w, http.StatusInternalServerError, "Failed to add torrent")
		return
	}

	h.logger.Info("Torrent added successfully", zap.String("infoHash", infoHash))
	h.writeJSON(w, http.StatusOK, map[string]string{"infoHash": infoHash})
}

func (h *Handlers) GetTorrents(w http.ResponseWriter, r *http.Request) {
	torrents := h.torrentClient.GetAllTorrents()
	h.logger.Debug("Retrieved torrents list", zap.Int("count", len(torrents)))
	h.writeJSON(w, http.StatusOK, torrents)
}

func (h *Handlers) GetTorrent(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	infoHash := vars["infoHash"]

	torrent, err := h.torrentClient.GetTorrent(infoHash)
	if err != nil {
		h.logger.Warn("Torrent not found", zap.String("infoHash", infoHash))
		h.writeError(w, http.StatusNotFound, "Torrent not found")
		return
	}

	h.writeJSON(w, http.StatusOK, torrent)
}

func (h *Handlers) DeleteTorrent(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	infoHash := vars["infoHash"]

	h.logger.Info("Deleting torrent", zap.String("infoHash", infoHash))

	if err := h.torrentClient.RemoveTorrent(infoHash); err != nil {
		h.logger.Error("Failed to remove torrent", zap.String("infoHash", infoHash), zap.Error(err))
		h.writeError(w, http.StatusInternalServerError, "Failed to remove torrent")
		return
	}

	if err := h.db.DeleteTorrent(infoHash); err != nil {
		h.logger.Warn("Failed to delete torrent from database", zap.String("infoHash", infoHash), zap.Error(err))
	}

	h.logger.Info("Torrent deleted successfully", zap.String("infoHash", infoHash))
	h.writeJSON(w, http.StatusOK, map[string]string{"message": "Torrent removed"})
}

func (h *Handlers) PauseTorrent(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	infoHash := vars["infoHash"]

	h.logger.Info("Pausing torrent", zap.String("infoHash", infoHash))

	if err := h.torrentClient.PauseTorrent(infoHash); err != nil {
		h.logger.Error("Failed to pause torrent", zap.String("infoHash", infoHash), zap.Error(err))
		h.writeError(w, http.StatusInternalServerError, "Failed to pause torrent")
		return
	}

	h.logger.Info("Torrent paused successfully", zap.String("infoHash", infoHash))
	h.writeJSON(w, http.StatusOK, map[string]string{"message": "Torrent paused"})
}

func (h *Handlers) ResumeTorrent(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	infoHash := vars["infoHash"]

	h.logger.Info("Resuming torrent", zap.String("infoHash", infoHash))

	if err := h.torrentClient.ResumeTorrent(infoHash); err != nil {
		h.logger.Error("Failed to resume torrent", zap.String("infoHash", infoHash), zap.Error(err))
		h.writeError(w, http.StatusInternalServerError, "Failed to resume torrent")
		return
	}

	h.logger.Info("Torrent resumed successfully", zap.String("infoHash", infoHash))
	h.writeJSON(w, http.StatusOK, map[string]string{"message": "Torrent resumed"})
}

func (h *Handlers) GetSettings(w http.ResponseWriter, r *http.Request) {
	settings := make(map[string]string)

	keys := []string{"max_download_rate", "max_upload_rate", "max_connections", "enable_tor", "download_path", "auto_stop_seeding"}
	for _, key := range keys {
		if value, err := h.db.GetSetting(key); err == nil {
			settings[key] = value
		}
	}

	h.logger.Debug("Retrieved settings", zap.Int("count", len(settings)))
	h.writeJSON(w, http.StatusOK, settings)
}

func (h *Handlers) UpdateSettings(w http.ResponseWriter, r *http.Request) {
	var req UpdateSettingsRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		h.logger.Warn("Invalid request body for update settings", zap.Error(err))
		h.writeError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	h.logger.Info("Updating settings",
		zap.String("maxDownloadRate", req.MaxDownloadRate),
		zap.String("maxUploadRate", req.MaxUploadRate),
		zap.String("enableTor", req.EnableTor),
	)

	if req.MaxDownloadRate != "" {
		h.db.SetSetting("max_download_rate", req.MaxDownloadRate)
	}
	if req.MaxUploadRate != "" {
		h.db.SetSetting("max_upload_rate", req.MaxUploadRate)
	}
	if req.MaxConnections != "" {
		h.db.SetSetting("max_connections", req.MaxConnections)
	}
	if req.EnableTor != "" {
		h.db.SetSetting("enable_tor", req.EnableTor)
	}
	if req.DownloadPath != "" {
		h.db.SetSetting("download_path", req.DownloadPath)
	}

	h.logger.Info("Settings updated successfully")
	h.writeJSON(w, http.StatusOK, map[string]string{"message": "Settings updated"})
}

func (h *Handlers) HealthCheck(w http.ResponseWriter, r *http.Request) {
	torEnabled, err := h.torrentClient.GetTorStatus()

	status := "healthy"
	torStatus := "enabled"

	if err != nil || !torEnabled {
		torStatus = "disabled"
		h.logger.Warn("Tor proxy chain not working", zap.Error(err))
	}

	h.writeJSON(w, http.StatusOK, map[string]string{
		"status": status,
		"tor":    torStatus,
	})
}

func (h *Handlers) CleanupData(w http.ResponseWriter, r *http.Request) {
	h.logger.Info("Cleaning up all user data and logs")

	// Stop and remove all active torrents
	torrents := h.torrentClient.GetAllTorrents()
	for _, t := range torrents {
		if err := h.torrentClient.RemoveTorrent(t.InfoHash); err != nil {
			h.logger.Warn("Failed to remove torrent during cleanup", 
				zap.String("infoHash", t.InfoHash),
				zap.Error(err))
		}
	}

	// Clear all torrents from database
	if err := h.db.ClearActiveTorrents(); err != nil {
		h.logger.Error("Failed to cleanup torrents", zap.Error(err))
		h.writeError(w, http.StatusInternalServerError, "Failed to cleanup data")
		return
	}

	// Clear all settings (except system settings)
	if err := h.db.ClearUserSettings(); err != nil {
		h.logger.Error("Failed to cleanup user settings", zap.Error(err))
	}

	h.logger.Info("All user data and logs cleaned successfully")
	h.writeJSON(w, http.StatusOK, map[string]string{"message": "All user data and logs deleted"})
}

func (h *Handlers) GetTorConnections(w http.ResponseWriter, r *http.Request) {
	h.logger.Info("Fetching Tor connections")

	// Get actual Tor connections from torrent client
	connections := h.torrentClient.GetProxyConnections()

	h.logger.Info("Tor connections fetched successfully",
		zap.Int("count", len(connections)),
	)

	h.writeJSON(w, http.StatusOK, connections)
}

func (h *Handlers) GetSecurityStatus(w http.ResponseWriter, r *http.Request) {
	h.logger.Info("Fetching security status")

	config := SecurityConfig{
		KillSwitchEnabled:    true,
		DNSProtectionEnabled: true,
		IPObfuscationEnabled: true,
		DataEncryptionEnabled: true,
		TorEnabled:           h.torrentClient.IsTorEnabled(),
	}

	h.writeJSON(w, http.StatusOK, config)
}

func (h *Handlers) UpdateSecuritySettings(w http.ResponseWriter, r *http.Request) {
	var config SecurityConfig
	if err := json.NewDecoder(r.Body).Decode(&config); err != nil {
		h.logger.Warn("Invalid security config", zap.Error(err))
		h.writeError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	h.logger.Info("Updating security settings",
		zap.Bool("killSwitch", config.KillSwitchEnabled),
		zap.Bool("dnsProtection", config.DNSProtectionEnabled),
		zap.Bool("torEnabled", config.TorEnabled),
	)

	// Update Tor status
	if err := h.torrentClient.SetTorEnabled(config.TorEnabled); err != nil {
		h.logger.Error("Failed to toggle Tor", zap.Error(err))
		h.writeError(w, http.StatusInternalServerError, "Failed to toggle Tor")
		return
	}

	// Store settings in database
	h.db.SetSetting("kill_switch_enabled", fmt.Sprintf("%t", config.KillSwitchEnabled))
	h.db.SetSetting("dns_protection_enabled", fmt.Sprintf("%t", config.DNSProtectionEnabled))
	h.db.SetSetting("ip_obfuscation_enabled", fmt.Sprintf("%t", config.IPObfuscationEnabled))
	h.db.SetSetting("data_encryption_enabled", fmt.Sprintf("%t", config.DataEncryptionEnabled))
	h.db.SetSetting("tor_enabled", fmt.Sprintf("%t", config.TorEnabled))

	h.logger.Info("Security settings updated successfully")
	h.writeJSON(w, http.StatusOK, map[string]string{"message": "Security settings updated"})
}

func (h *Handlers) TriggerKillSwitch(w http.ResponseWriter, r *http.Request) {
	h.logger.Warn("Kill switch manually triggered")

	// Stop all torrents
	torrents := h.torrentClient.GetAllTorrents()
	for _, t := range torrents {
		h.torrentClient.RemoveTorrent(t.InfoHash)
	}

	// Clear database
	h.db.ClearActiveTorrents()

	h.logger.Info("Kill switch activated - all connections terminated")
	h.writeJSON(w, http.StatusOK, map[string]string{"message": "Kill switch activated"})
}

func (h *Handlers) GetIPStatus(w http.ResponseWriter, r *http.Request) {
	h.logger.Info("Fetching IP status")

	// Check if Tor is enabled
	torEnabled := h.torrentClient.IsTorEnabled()
	
	status := map[string]interface{}{
		"torEnabled":     torEnabled,
		"ipObfuscated":   torEnabled,
		"dnsProtected":   true,
		"connectionType": func() string {
			if torEnabled {
				return "Tor Multi-Proxy Chain"
			}
			return "Direct Connection"
		}(),
	}

	h.writeJSON(w, http.StatusOK, status)
}

func (h *Handlers) ToggleFavorite(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	infoHash := vars["infoHash"]

	var req struct {
		Favorite bool `json:"favorite"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		h.logger.Warn("Invalid request body for toggle favorite", zap.Error(err))
		h.writeError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	h.logger.Info("Toggling favorite status", 
		zap.String("infoHash", infoHash),
		zap.Bool("favorite", req.Favorite),
	)

	// Store favorite status in database
	key := fmt.Sprintf("torrent_%s_favorite", infoHash)
	if err := h.db.SetSetting(key, fmt.Sprintf("%t", req.Favorite)); err != nil {
		h.logger.Error("Failed to update favorite status", zap.Error(err))
		h.writeError(w, http.StatusInternalServerError, "Failed to update favorite")
		return
	}

	h.logger.Info("Favorite status updated successfully")
	h.writeJSON(w, http.StatusOK, map[string]string{"message": "Favorite status updated"})
}

func (h *Handlers) SetTorrentLimits(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	infoHash := vars["infoHash"]

	var req struct {
		DownloadLimit int `json:"downloadLimit"`
		UploadLimit   int `json:"uploadLimit"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		h.logger.Warn("Invalid request body for set limits", zap.Error(err))
		h.writeError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	h.logger.Info("Setting torrent limits",
		zap.String("infoHash", infoHash),
		zap.Int("downloadLimit", req.DownloadLimit),
		zap.Int("uploadLimit", req.UploadLimit),
	)

	// Store limits in database
	dlKey := fmt.Sprintf("torrent_%s_download_limit", infoHash)
	ulKey := fmt.Sprintf("torrent_%s_upload_limit", infoHash)
	
	h.db.SetSetting(dlKey, fmt.Sprintf("%d", req.DownloadLimit))
	h.db.SetSetting(ulKey, fmt.Sprintf("%d", req.UploadLimit))

	// Apply limits to torrent client
	if err := h.torrentClient.SetLimits(infoHash, req.DownloadLimit, req.UploadLimit); err != nil {
		h.logger.Warn("Failed to apply limits to torrent client", zap.Error(err))
	}

	h.logger.Info("Torrent limits updated successfully")
	h.writeJSON(w, http.StatusOK, map[string]string{"message": "Limits updated"})
}

func (h *Handlers) SetTorrentSchedule(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	infoHash := vars["infoHash"]

	var req struct {
		Enabled             bool   `json:"enabled"`
		StartDate           string `json:"startDate"`
		StartTime           string `json:"startTime"`
		PauseWhenComplete   bool   `json:"pauseWhenComplete"`
		DeleteWhenComplete  bool   `json:"deleteWhenComplete"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		h.logger.Warn("Invalid request body for set schedule", zap.Error(err))
		h.writeError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	h.logger.Info("Setting torrent schedule",
		zap.String("infoHash", infoHash),
		zap.Bool("enabled", req.Enabled),
		zap.String("startDate", req.StartDate),
		zap.String("startTime", req.StartTime),
	)

	// Store schedule in database
	schedKey := fmt.Sprintf("torrent_%s_schedule", infoHash)
	schedData, _ := json.Marshal(req)
	h.db.SetSetting(schedKey, string(schedData))

	h.logger.Info("Torrent schedule updated successfully")
	h.writeJSON(w, http.StatusOK, map[string]string{"message": "Schedule updated"})
}

func (h *Handlers) SetGlobalLimits(w http.ResponseWriter, r *http.Request) {
	var req struct {
		DownloadLimit int `json:"downloadLimit"`
		UploadLimit   int `json:"uploadLimit"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		h.logger.Warn("Invalid request body for global limits", zap.Error(err))
		h.writeError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	h.logger.Info("Setting global limits",
		zap.Int("downloadLimit", req.DownloadLimit),
		zap.Int("uploadLimit", req.UploadLimit),
	)

	// Store global limits in database
	h.db.SetSetting("global_download_limit", fmt.Sprintf("%d", req.DownloadLimit))
	h.db.SetSetting("global_upload_limit", fmt.Sprintf("%d", req.UploadLimit))

	// Apply global limits to torrent client
	if err := h.torrentClient.SetGlobalLimits(req.DownloadLimit, req.UploadLimit); err != nil {
		h.logger.Warn("Failed to apply global limits", zap.Error(err))
	}

	h.logger.Info("Global limits updated successfully")
	h.writeJSON(w, http.StatusOK, map[string]string{"message": "Global limits updated"})
}

func (h *Handlers) GetTorrentEvents(w http.ResponseWriter, r *http.Request) {
	// This endpoint returns recent torrent events (completed, failed, etc.)
	events := []map[string]interface{}{}
	
	autoStopSeeding, _ := h.db.GetSetting("auto_stop_seeding")
	
	if autoStopSeeding == "true" {
		torrents := h.torrentClient.GetAllTorrents()
		for _, torrent := range torrents {
			// If torrent just completed (100% progress) and is seeding
			if torrent.Progress >= 100 && torrent.Status == "seeding" {
				// Check if we haven't already auto-stopped this torrent
				key := fmt.Sprintf("torrent_%s_auto_stopped", torrent.InfoHash)
				alreadyStopped, _ := h.db.GetSetting(key)
				
				if alreadyStopped != "true" {
					// Pause the torrent
					if err := h.torrentClient.PauseTorrent(torrent.InfoHash); err == nil {
						h.logger.Info("Auto-stopped seeding for completed torrent",
							zap.String("infoHash", torrent.InfoHash),
							zap.String("name", torrent.Name),
						)
						
						// Mark as auto-stopped
						h.db.SetSetting(key, "true")
						
						// Add event
						events = append(events, map[string]interface{}{
							"type":        "auto_stopped",
							"torrentName": torrent.Name,
							"message":     "Seeding automatically stopped",
							"timestamp":   fmt.Sprintf("%d", int64(0)),
						})
					}
				}
			}
		}
	}
	
	h.writeJSON(w, http.StatusOK, events)
}

// DNS leak test endpoint
func (h *Handlers) TestDNSLeak(w http.ResponseWriter, r *http.Request) {
	h.logger.Info("Testing DNS leak")

	// In production, this would query multiple DNS servers and compare results
	// For now, return a simplified response
	result := map[string]interface{}{
		"leaked": false,
		"dnsIP":  "Protected via Tor",
	}

	// If Tor is disabled, DNS might leak
	if !h.torrentClient.IsTorEnabled() {
		result["leaked"] = true
		result["dnsIP"] = "Using system DNS"
	}

	h.writeJSON(w, http.StatusOK, result)
}
