package api

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/KFN002/B-2-Torrent/backend/internal/database"
	"github.com/KFN002/B-2-Torrent/backend/internal/torrent"
	"github.com/gorilla/mux"
)

type Handlers struct {
	db            *database.Database
	torrentClient *torrent.Client
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

// writeJSON writes JSON response with error handling
func writeJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(data); err != nil {
		log.Printf("ERROR: Failed to encode JSON response: %v", err)
	}
}

// writeError writes error response
func writeError(w http.ResponseWriter, status int, message string) {
	writeJSON(w, status, ErrorResponse{Error: message})
}

func (h *Handlers) AddTorrent(w http.ResponseWriter, r *http.Request) {
	var req AddTorrentRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if req.MagnetURI == "" {
		writeError(w, http.StatusBadRequest, "Magnet URI is required")
		return
	}

	infoHash, err := h.torrentClient.AddMagnet(req.MagnetURI)
	if err != nil {
		log.Printf("ERROR: Failed to add torrent: %v", err)
		writeError(w, http.StatusInternalServerError, "Failed to add torrent")
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"infoHash": infoHash})
}

func (h *Handlers) GetTorrents(w http.ResponseWriter, r *http.Request) {
	torrents := h.torrentClient.GetAllTorrents()
	writeJSON(w, http.StatusOK, torrents)
}

func (h *Handlers) GetTorrent(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	infoHash := vars["infoHash"]

	torrent, err := h.torrentClient.GetTorrent(infoHash)
	if err != nil {
		writeError(w, http.StatusNotFound, "Torrent not found")
		return
	}

	writeJSON(w, http.StatusOK, torrent)
}

func (h *Handlers) DeleteTorrent(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	infoHash := vars["infoHash"]

	if err := h.torrentClient.RemoveTorrent(infoHash); err != nil {
		log.Printf("ERROR: Failed to remove torrent %s: %v", infoHash, err)
		writeError(w, http.StatusInternalServerError, "Failed to remove torrent")
		return
	}

	if err := h.db.DeleteTorrent(infoHash); err != nil {
		log.Printf("ERROR: Failed to delete torrent from database %s: %v", infoHash, err)
	}

	writeJSON(w, http.StatusOK, map[string]string{"message": "Torrent removed"})
}

func (h *Handlers) PauseTorrent(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	infoHash := vars["infoHash"]

	if err := h.torrentClient.PauseTorrent(infoHash); err != nil {
		log.Printf("ERROR: Failed to pause torrent %s: %v", infoHash, err)
		writeError(w, http.StatusInternalServerError, "Failed to pause torrent")
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"message": "Torrent paused"})
}

func (h *Handlers) ResumeTorrent(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	infoHash := vars["infoHash"]

	if err := h.torrentClient.ResumeTorrent(infoHash); err != nil {
		log.Printf("ERROR: Failed to resume torrent %s: %v", infoHash, err)
		writeError(w, http.StatusInternalServerError, "Failed to resume torrent")
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"message": "Torrent resumed"})
}

func (h *Handlers) GetSettings(w http.ResponseWriter, r *http.Request) {
	settings := make(map[string]string)

	keys := []string{"max_download_rate", "max_upload_rate", "max_connections", "enable_tor", "download_path"}
	for _, key := range keys {
		if value, err := h.db.GetSetting(key); err == nil {
			settings[key] = value
		}
	}

	writeJSON(w, http.StatusOK, settings)
}

func (h *Handlers) UpdateSettings(w http.ResponseWriter, r *http.Request) {
	var req UpdateSettingsRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

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

	writeJSON(w, http.StatusOK, map[string]string{"message": "Settings updated"})
}

func (h *Handlers) HealthCheck(w http.ResponseWriter, r *http.Request) {
	torEnabled, err := h.torrentClient.GetTorStatus()

	status := "healthy"
	torStatus := "enabled"

	if err != nil || !torEnabled {
		torStatus = "disabled"
		log.Printf("WARNING: Tor proxy chain not working: %v", err)
	}

	writeJSON(w, http.StatusOK, map[string]string{
		"status": status,
		"tor":    torStatus,
	})
}

func (h *Handlers) CleanupData(w http.ResponseWriter, r *http.Request) {
	if err := h.db.ClearActiveTorrents(); err != nil {
		log.Printf("ERROR: Failed to cleanup data: %v", err)
		writeError(w, http.StatusInternalServerError, "Failed to cleanup data")
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"message": "All data cleaned"})
}
