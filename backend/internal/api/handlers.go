package api

import (
	"net/http"

	"github.com/KFN002/B-2-Torrent/backend/internal/database"
	"github.com/KFN002/B-2-Torrent/backend/internal/torrent"
	"github.com/gin-gonic/gin"
)

type Handlers struct {
	db            *database.Database
	torrentClient *torrent.Client
}

type AddTorrentRequest struct {
	MagnetURI string `json:"magnetUri" binding:"required"`
}

type UpdateSettingsRequest struct {
	MaxDownloadRate string `json:"maxDownloadRate"`
	MaxUploadRate   string `json:"maxUploadRate"`
	MaxConnections  string `json:"maxConnections"`
	EnableTor       string `json:"enableTor"`
	DownloadPath    string `json:"downloadPath"`
}

func (h *Handlers) AddTorrent(c *gin.Context) {
	var req AddTorrentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	infoHash, err := h.torrentClient.AddMagnet(req.MagnetURI)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to add torrent"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"infoHash": infoHash})
}

func (h *Handlers) GetTorrents(c *gin.Context) {
	torrents := h.torrentClient.GetAllTorrents()
	c.JSON(http.StatusOK, torrents)
}

func (h *Handlers) GetTorrent(c *gin.Context) {
	infoHash := c.Param("infoHash")

	torrent, err := h.torrentClient.GetTorrent(infoHash)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Torrent not found"})
		return
	}

	c.JSON(http.StatusOK, torrent)
}

func (h *Handlers) DeleteTorrent(c *gin.Context) {
	infoHash := c.Param("infoHash")

	if err := h.torrentClient.RemoveTorrent(infoHash); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to remove torrent"})
		return
	}

	if err := h.db.DeleteTorrent(infoHash); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete from database"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Torrent removed"})
}

func (h *Handlers) PauseTorrent(c *gin.Context) {
	infoHash := c.Param("infoHash")

	if err := h.torrentClient.PauseTorrent(infoHash); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to pause torrent"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Torrent paused"})
}

func (h *Handlers) ResumeTorrent(c *gin.Context) {
	infoHash := c.Param("infoHash")

	if err := h.torrentClient.ResumeTorrent(infoHash); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to resume torrent"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Torrent resumed"})
}

func (h *Handlers) GetSettings(c *gin.Context) {
	settings := make(map[string]string)

	keys := []string{"max_download_rate", "max_upload_rate", "max_connections", "enable_tor", "download_path"}
	for _, key := range keys {
		if value, err := h.db.GetSetting(key); err == nil {
			settings[key] = value
		}
	}

	c.JSON(http.StatusOK, settings)
}

func (h *Handlers) UpdateSettings(c *gin.Context) {
	var req UpdateSettingsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
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

	c.JSON(http.StatusOK, gin.H{"message": "Settings updated"})
}

func (h *Handlers) HealthCheck(c *gin.Context) {
	torEnabled, err := h.torrentClient.GetTorStatus()

	status := "healthy"
	torStatus := "enabled"

	if err != nil || !torEnabled {
		torStatus = "disabled"
	}

	c.JSON(http.StatusOK, gin.H{
		"status": status,
		"tor":    torStatus,
	})
}

func (h *Handlers) CleanupData(c *gin.Context) {
	// Clear all active torrents from database
	if err := h.db.ClearActiveTorrents(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to cleanup data"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "All data cleaned"})
}
