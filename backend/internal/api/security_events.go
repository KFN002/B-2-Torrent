package api

import (
	"net/http"
	"sync"
	"time"

	"github.com/KFN002/B-2-Torrent/backend/internal/database"
	"github.com/KFN002/B-2-Torrent/backend/internal/torrent"
	"go.uber.org/zap"
)

// SecurityEvent represents a security-related event
type SecurityEvent struct {
	Type      string    `json:"type"`
	Severity  string    `json:"severity"`
	Message   string    `json:"message"`
	Timestamp time.Time `json:"timestamp"`
	Details   string    `json:"details,omitempty"`
}

var (
	securityEvents      []SecurityEvent
	securityEventsMutex sync.RWMutex
)

// AddSecurityEvent adds a new security event to the queue
func AddSecurityEvent(eventType, severity, message, details string) {
	securityEventsMutex.Lock()
	defer securityEventsMutex.Unlock()

	event := SecurityEvent{
		Type:      eventType,
		Severity:  severity,
		Message:   message,
		Timestamp: time.Now(),
		Details:   details,
	}

	securityEvents = append(securityEvents, event)

	// Keep only last 100 events
	if len(securityEvents) > 100 {
		securityEvents = securityEvents[len(securityEvents)-100:]
	}
}

// GetSecurityEvents returns recent security events
func (h *Handlers) GetSecurityEvents(w http.ResponseWriter, r *http.Request) {
	securityEventsMutex.RLock()
	events := make([]SecurityEvent, len(securityEvents))
	copy(events, securityEvents)
	securityEventsMutex.RUnlock()

	// Only return events from last 30 seconds
	cutoff := time.Now().Add(-30 * time.Second)
	recentEvents := []SecurityEvent{}
	for _, event := range events {
		if event.Timestamp.After(cutoff) {
			recentEvents = append(recentEvents, event)
		}
	}

	h.logger.Debug("Returning security events", zap.Int("count", len(recentEvents)))
	h.writeJSON(w, http.StatusOK, recentEvents)
}

// StartSecurityMonitoring continuously monitors security status and generates alerts
func StartSecurityMonitoring(db *database.Database, tc *torrent.Client, logger *zap.Logger) {
	ticker := time.NewTicker(10 * time.Second)
	defer ticker.Stop()

	logger.Info("Security monitoring started")

	for range ticker.C {
		// Check for leaks
		leaks := checkForLeaks(db, tc)
		if leaks > 0 {
			AddSecurityEvent(
				"leak_detected",
				"critical",
				"IP or DNS leak detected during connection",
				"Your real IP may be exposed to peers",
			)
		}

		// Check VPN/Tor status
		vpnType, _ := db.GetSetting("vpn_type")
		if vpnType == "" {
			vpnType = "none"
		}
		torEnabled := tc.IsTorEnabled()

		if vpnType != "none" && !isVPNConnected(vpnType) {
			AddSecurityEvent(
				"vpn_disconnected",
				"critical",
				"VPN connection lost",
				"Reconnecting to restore privacy protection",
			)
		}

		if torEnabled && !tc.IsTorConnected() {
			AddSecurityEvent(
				"tor_disconnected",
				"critical",
				"Tor connection lost",
				"Privacy protection interrupted",
			)
		}

		// Check encryption status
		forceEncryption, _ := db.GetSetting("force_encryption")
		if forceEncryption != "true" {
			unencryptedCount := countUnencryptedPeers(tc)
			if unencryptedCount > 0 {
				AddSecurityEvent(
					"unencrypted_peer",
					"warning",
					"Unencrypted peer connections detected",
					"Enable force encryption to block all unencrypted peers",
				)
			}
		}

		// Calculate security score
		score := calculateSecurityScore(db, tc)
		if score < 60 {
			AddSecurityEvent(
				"security_score_low",
				"warning",
				"Security score is below recommended threshold",
				"Enable additional security features to improve protection",
			)
		}
	}
}

// Helper functions
func checkForLeaks(db *database.Database, tc *torrent.Client) int {
	// Implement leak detection logic
	// This is a placeholder - actual implementation would check real IP exposure
	return 0
}

func isVPNConnected(vpnType string) bool {
	// Implement VPN connectivity check
	// This is a placeholder
	return true
}

func countUnencryptedPeers(tc *torrent.Client) int {
	// Implement peer encryption check
	// This is a placeholder
	return 0
}

func calculateSecurityScore(db *database.Database, tc *torrent.Client) int {
	score := 0

	killSwitch, _ := db.GetSetting("kill_switch_enabled")
	if boolSettingOrDefault(killSwitch, true) {
		score += 20
	}

	dnsProtection, _ := db.GetSetting("dns_protection_enabled")
	if boolSettingOrDefault(dnsProtection, true) {
		score += 20
	}

	forceEncryption, _ := db.GetSetting("force_encryption")
	if boolSettingOrDefault(forceEncryption, true) {
		score += 20
	}

	noLogsMode, _ := db.GetSetting("no_logs_mode")
	if noLogsMode == "true" {
		score += 20
	}

	obfuscation, _ := db.GetSetting("obfuscate_traffic")
	if obfuscation == "true" {
		score += 20
	}

	dhtInvisibility, _ := db.GetSetting("dht_invisibility")
	if boolSettingOrDefault(dhtInvisibility, true) {
		score += 10
	}

	sharingDisabled, _ := db.GetSetting("sharing_disabled")
	if boolSettingOrDefault(sharingDisabled, true) {
		score += 10
	}

	if score > 100 {
		return 100
	}
	return score
}
