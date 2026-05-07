package api

import (
	"net/http"
	"go.uber.org/zap"
)

// SecurityMetrics represents detailed security analytics
type SecurityMetrics struct {
	OverallScore      int                `json:"overallScore"`
	Encryption        EncryptionMetrics  `json:"encryption"`
	Anonymity         AnonymityMetrics   `json:"anonymity"`
	LeakProtection    LeakMetrics        `json:"leakProtection"`
	TrafficObfuscation ObfuscationMetrics `json:"trafficObfuscation"`
	ActiveThreats     int                `json:"activeThreats"`
	ProtectedConnections int             `json:"protectedConnections"`
	BlockedPeers      int                `json:"blockedPeers"`
}

type EncryptionMetrics struct {
	Enabled bool   `json:"enabled"`
	Level   string `json:"level"`
	Score   int    `json:"score"`
}

type AnonymityMetrics struct {
	Enabled bool   `json:"enabled"`
	Type    string `json:"type"`
	Score   int    `json:"score"`
}

type LeakMetrics struct {
	Active        bool `json:"active"`
	LeaksDetected int  `json:"leaksDetected"`
	Score         int  `json:"score"`
}

type ObfuscationMetrics struct {
	Enabled bool `json:"enabled"`
	Score   int  `json:"score"`
}

// GetSecurityMetrics returns comprehensive security analytics
func (h *Handlers) GetSecurityMetrics(w http.ResponseWriter, r *http.Request) {
	h.logger.Info("Fetching security metrics")

	// Get current security settings
	forceEncryption, _ := h.db.GetSetting("force_encryption")
	encryptionLevel, _ := h.db.GetSetting("encryption_level")
	if encryptionLevel == "" {
		encryptionLevel = "strong"
	}
	
	torEnabled := h.torrentClient.IsTorEnabled()
	vpnType, _ := h.db.GetSetting("vpn_type")
	if vpnType == "" {
		vpnType = "none"
	}
	
	noLogsMode, _ := h.db.GetSetting("no_logs_mode")
	obfuscateTraffic, _ := h.db.GetSetting("obfuscate_traffic")

	// Calculate scores
	encryptionScore := 0
	if forceEncryption == "true" {
		encryptionScore = 100
	} else if encryptionLevel == "maximum" {
		encryptionScore = 95
	} else if encryptionLevel == "strong" {
		encryptionScore = 85
	} else if encryptionLevel == "standard" {
		encryptionScore = 70
	} else {
		encryptionScore = 50
	}

	anonymityScore := 0
	anonymityType := "Direct Connection"
	if torEnabled {
		anonymityScore = 100
		anonymityType = "Tor Network"
	} else if vpnType == "vless" {
		anonymityScore = 90
		anonymityType = "VLESS VPN"
	} else if vpnType == "outline" {
		anonymityScore = 85
		anonymityType = "Outline VPN"
	}

	leakScore := 100
	if !torEnabled && vpnType == "none" {
		leakScore = 40
	}

	obfuscationScore := 0
	if obfuscateTraffic == "true" {
		obfuscationScore = 100
	}

	// Calculate overall score
	overallScore := (encryptionScore + anonymityScore + leakScore + obfuscationScore) / 4

	// Add bonus for no-logs mode
	if noLogsMode == "true" {
		overallScore = min(100, overallScore+5)
	}

	metrics := SecurityMetrics{
		OverallScore: overallScore,
		Encryption: EncryptionMetrics{
			Enabled: forceEncryption == "true",
			Level:   encryptionLevel,
			Score:   encryptionScore,
		},
		Anonymity: AnonymityMetrics{
			Enabled: torEnabled || vpnType != "none",
			Type:    anonymityType,
			Score:   anonymityScore,
		},
		LeakProtection: LeakMetrics{
			Active:        torEnabled || vpnType != "none",
			LeaksDetected: 0,
			Score:         leakScore,
		},
		TrafficObfuscation: ObfuscationMetrics{
			Enabled: obfuscateTraffic == "true",
			Score:   obfuscationScore,
		},
		ActiveThreats:        0,
		ProtectedConnections: len(h.torrentClient.GetAllTorrents()),
		BlockedPeers:         0,
	}

	h.logger.Info("Security metrics calculated",
		zap.Int("overallScore", metrics.OverallScore),
		zap.Int("encryptionScore", encryptionScore),
		zap.Int("anonymityScore", anonymityScore),
	)

	h.writeJSON(w, http.StatusOK, metrics)
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}
