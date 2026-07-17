package api

import (
	"go.uber.org/zap"
	"net/http"
)

// SecurityMetrics represents detailed security analytics
type SecurityMetrics struct {
	OverallScore         int                `json:"overallScore"`
	Encryption           EncryptionMetrics  `json:"encryption"`
	Anonymity            AnonymityMetrics   `json:"anonymity"`
	LeakProtection       LeakMetrics        `json:"leakProtection"`
	TrafficObfuscation   ObfuscationMetrics `json:"trafficObfuscation"`
	ActiveThreats        int                `json:"activeThreats"`
	ProtectedConnections int                `json:"protectedConnections"`
	BlockedPeers         int                `json:"blockedPeers"`
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
	LeaksDetected *int `json:"leaksDetected"`
	Score         int  `json:"score"`
}

type ObfuscationMetrics struct {
	Enabled bool `json:"enabled"`
	Score   int  `json:"score"`
}

// GetSecurityMetrics returns comprehensive security analytics
func (h *Handlers) GetSecurityMetrics(w http.ResponseWriter, r *http.Request) {
	h.logger.Info("Fetching security metrics")

	privacy := h.torrentClient.PrivacyStatus()

	// Scores only reflect controls confirmed by the live torrent client.
	encryptionScore := 0
	anonymityScore := 0
	anonymityType := "Direct Connection"
	if privacy.ProxyAvailable && privacy.IPObfuscation {
		anonymityScore = 100
		anonymityType = "Tor Proxy Chain"
	}

	leakScore := 0
	if privacy.DNSObfuscation {
		leakScore += 40
	}
	if privacy.DHTInvisibility && privacy.PeerExchangeDisabled {
		leakScore += 30
	}
	if privacy.InboundConnectionsDisabled && privacy.UDPTrackersBlocked {
		leakScore += 30
	}

	obfuscationScore := 0
	if privacy.TrafficObfuscation {
		obfuscationScore = 100
	}

	overallScore := (encryptionScore + anonymityScore + leakScore + obfuscationScore) / 4

	metrics := SecurityMetrics{
		OverallScore: overallScore,
		Encryption: EncryptionMetrics{
			Enabled: false,
			Level:   "not enforced by torrent client",
			Score:   encryptionScore,
		},
		Anonymity: AnonymityMetrics{
			Enabled: privacy.ProxyAvailable && privacy.IPObfuscation,
			Type:    anonymityType,
			Score:   anonymityScore,
		},
		LeakProtection: LeakMetrics{
			Active:        privacy.DNSObfuscation,
			LeaksDetected: nil,
			Score:         leakScore,
		},
		TrafficObfuscation: ObfuscationMetrics{
			Enabled: privacy.TrafficObfuscation,
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
