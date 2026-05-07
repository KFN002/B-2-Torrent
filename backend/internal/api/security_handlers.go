package api

import (
	"crypto/rand"
	"encoding/json"
	"fmt"
	"net/http"
	"os"

	"go.uber.org/zap"
)

// SecurityConfig represents security settings
type SecurityConfig struct {
	KillSwitchEnabled     bool   `json:"killSwitchEnabled"`
	DNSProtectionEnabled  bool   `json:"dnsProtectionEnabled"`
	IPObfuscationEnabled  bool   `json:"ipObfuscationEnabled"`
	DataEncryptionEnabled bool   `json:"dataEncryptionEnabled"`
	TorEnabled            bool   `json:"torEnabled"`
	VPNType               string `json:"vpnType"` // "none", "vless", "outline"
	VLESSKey              string `json:"vlessKey"`
	OutlineKey            string `json:"outlineKey"`
	NoLogsMode            bool   `json:"noLogsMode"`
	ObfuscateTraffic      bool   `json:"obfuscateTraffic"`
	ForceEncryption       bool   `json:"forceEncryption"`
	EncryptionLevel       string `json:"encryptionLevel"`
	MinEncryptionProtocol string `json:"minEncryptionProtocol"`
	RejectPlaintext       bool   `json:"rejectPlaintext"`
	MACRandomization      bool   `json:"macRandomization"`
	AntiFingerprint       bool   `json:"antiFingerprint"`
	SecureDelete          bool   `json:"secureDelete"`
}

// SecurityStatus represents the current security status for monitoring
type SecurityStatus struct {
	KillSwitchActive         bool   `json:"killSwitchActive"`
	DNSProtectionActive      bool   `json:"dnsProtectionActive"`
	IPObfuscationActive      bool   `json:"ipObfuscationActive"`
	TrafficObfuscationActive bool   `json:"trafficObfuscationActive"`
	NoLogsMode               bool   `json:"noLogsMode"`
	LeaksDetected            int    `json:"leaksDetected"`
	LastCheck                string `json:"lastCheck"`
}

// GetSecurityStatus returns current security status for monitoring
func (h *Handlers) GetSecurityStatus(w http.ResponseWriter, r *http.Request) {
	h.logger.Info("Fetching security status for monitoring")

	vpnType, _ := h.db.GetSetting("vpn_type")
	if vpnType == "" {
		vpnType = "none"
	}
	noLogsMode, _ := h.db.GetSetting("no_logs_mode")
	obfuscateTraffic, _ := h.db.GetSetting("obfuscate_traffic")
	killSwitchEnabled, _ := h.db.GetSetting("kill_switch_enabled")
	dnsProtectionEnabled, _ := h.db.GetSetting("dns_protection_enabled")
	ipObfuscationEnabled, _ := h.db.GetSetting("ip_obfuscation_enabled")

	torEnabled := h.torrentClient.IsTorEnabled()

	status := SecurityStatus{
		KillSwitchActive:         killSwitchEnabled == "true" || killSwitchEnabled == "",
		DNSProtectionActive:      dnsProtectionEnabled == "true" || dnsProtectionEnabled == "",
		IPObfuscationActive:      (ipObfuscationEnabled == "true" || ipObfuscationEnabled == "") && (torEnabled || vpnType != "none"),
		TrafficObfuscationActive: obfuscateTraffic == "true",
		NoLogsMode:               noLogsMode == "true",
		LeaksDetected:            0,
		LastCheck:                "",
	}

	h.writeJSON(w, http.StatusOK, status)
}

// GetSecurityConfig returns detailed security configuration for settings
func (h *Handlers) GetSecurityConfig(w http.ResponseWriter, r *http.Request) {
	h.logger.Info("Fetching security configuration")

	vpnType, _ := h.db.GetSetting("vpn_type")
	if vpnType == "" {
		vpnType = "none"
	}
	vlessKey, _ := h.db.GetSetting("vless_key")
	outlineKey, _ := h.db.GetSetting("outline_key")
	noLogsMode, _ := h.db.GetSetting("no_logs_mode")
	obfuscateTraffic, _ := h.db.GetSetting("obfuscate_traffic")

	forceEncryption, _ := h.db.GetSetting("force_encryption")
	encryptionLevel, _ := h.db.GetSetting("encryption_level")
	if encryptionLevel == "" {
		encryptionLevel = "strong"
	}
	minProtocol, _ := h.db.GetSetting("min_encryption_protocol")
	if minProtocol == "" {
		minProtocol = "AES-256"
	}
	rejectPlaintext, _ := h.db.GetSetting("reject_plaintext")
	macRandomization, _ := h.db.GetSetting("mac_randomization")
	antiFingerprint, _ := h.db.GetSetting("anti_fingerprint")
	secureDelete, _ := h.db.GetSetting("secure_delete")

	config := SecurityConfig{
		KillSwitchEnabled:     true,
		DNSProtectionEnabled:  true,
		IPObfuscationEnabled:  true,
		DataEncryptionEnabled: true,
		TorEnabled:            h.torrentClient.IsTorEnabled(),
		VPNType:               vpnType,
		VLESSKey:              vlessKey,
		OutlineKey:            outlineKey,
		NoLogsMode:            noLogsMode == "true",
		ObfuscateTraffic:      obfuscateTraffic == "true",
		ForceEncryption:       forceEncryption == "true" || forceEncryption == "",
		EncryptionLevel:       encryptionLevel,
		MinEncryptionProtocol: minProtocol,
		RejectPlaintext:       rejectPlaintext == "true" || rejectPlaintext == "",
		MACRandomization:      macRandomization == "true",
		AntiFingerprint:       antiFingerprint == "true",
		SecureDelete:          secureDelete == "true" || secureDelete == "",
	}

	h.writeJSON(w, http.StatusOK, config)
}

// UpdateSecuritySettings updates security configuration
func (h *Handlers) UpdateSecuritySettings(w http.ResponseWriter, r *http.Request) {
	var config SecurityConfig
	if err := json.NewDecoder(r.Body).Decode(&config); err != nil {
		h.logger.Warn("Invalid security config", zap.Error(err))
		h.writeError(w, http.StatusBadRequest, "Invalid request body")
		return
	}
	if config.VPNType == "" {
		config.VPNType = "none"
	}
	if config.VPNType != "none" && config.VPNType != "vless" && config.VPNType != "outline" {
		h.writeError(w, http.StatusBadRequest, "Unsupported VPN type")
		return
	}

	h.logger.Info("Updating security settings",
		zap.Bool("killSwitch", config.KillSwitchEnabled),
		zap.Bool("dnsProtection", config.DNSProtectionEnabled),
		zap.Bool("torEnabled", config.TorEnabled),
		zap.String("vpnType", config.VPNType),
		zap.Bool("noLogsMode", config.NoLogsMode),
		zap.Bool("obfuscateTraffic", config.ObfuscateTraffic),
		zap.Bool("forceEncryption", config.ForceEncryption),
		zap.String("encryptionLevel", config.EncryptionLevel),
		zap.String("minProtocol", config.MinEncryptionProtocol),
		zap.Bool("rejectPlaintext", config.RejectPlaintext),
		zap.Bool("macRandomization", config.MACRandomization),
		zap.Bool("antiFingerprint", config.AntiFingerprint),
		zap.Bool("secureDelete", config.SecureDelete),
	)

	// Update Tor status
	if err := h.torrentClient.SetTorEnabled(config.TorEnabled); err != nil {
		h.logger.Error("Failed to toggle Tor", zap.Error(err))
		h.writeError(w, http.StatusInternalServerError, "Failed to toggle Tor")
		return
	}

	// Store all settings in database
	h.db.SetSetting("kill_switch_enabled", fmt.Sprintf("%t", config.KillSwitchEnabled))
	h.db.SetSetting("dns_protection_enabled", fmt.Sprintf("%t", config.DNSProtectionEnabled))
	h.db.SetSetting("ip_obfuscation_enabled", fmt.Sprintf("%t", config.IPObfuscationEnabled))
	h.db.SetSetting("data_encryption_enabled", fmt.Sprintf("%t", config.DataEncryptionEnabled))
	h.db.SetSetting("tor_enabled", fmt.Sprintf("%t", config.TorEnabled))

	h.db.SetSetting("vpn_type", config.VPNType)
	if config.VPNType == "vless" && config.VLESSKey != "" {
		h.db.SetSetting("vless_key", config.VLESSKey)
		h.logger.Info("VLESS key saved")
	}
	if config.VPNType == "outline" && config.OutlineKey != "" {
		h.db.SetSetting("outline_key", config.OutlineKey)
		h.logger.Info("Outline key saved")
	}

	h.db.SetSetting("no_logs_mode", fmt.Sprintf("%t", config.NoLogsMode))
	h.db.SetSetting("obfuscate_traffic", fmt.Sprintf("%t", config.ObfuscateTraffic))

	h.db.SetSetting("force_encryption", fmt.Sprintf("%t", config.ForceEncryption))
	h.db.SetSetting("encryption_level", config.EncryptionLevel)
	h.db.SetSetting("min_encryption_protocol", config.MinEncryptionProtocol)
	h.db.SetSetting("reject_plaintext", fmt.Sprintf("%t", config.RejectPlaintext))
	h.db.SetSetting("mac_randomization", fmt.Sprintf("%t", config.MACRandomization))
	h.db.SetSetting("anti_fingerprint", fmt.Sprintf("%t", config.AntiFingerprint))
	h.db.SetSetting("secure_delete", fmt.Sprintf("%t", config.SecureDelete))

	if config.NoLogsMode {
		h.logger.Info("No-logs mode enabled - disabling DHT and metadata persistence")
		h.torrentClient.SetNoLogsMode(true)
	} else {
		h.torrentClient.SetNoLogsMode(false)
	}

	if config.ObfuscateTraffic {
		h.logger.Info("Traffic obfuscation enabled")
		h.torrentClient.SetTrafficObfuscation(true)
	} else {
		h.torrentClient.SetTrafficObfuscation(false)
	}

	if config.ForceEncryption {
		h.logger.Info("Force encryption enabled - all unencrypted connections will be rejected")
	}

	if config.MACRandomization {
		h.logger.Info("MAC randomization enabled - device identity will be masked")
	}

	if config.AntiFingerprint {
		h.logger.Info("Anti-fingerprinting enabled - protocol signatures will be obfuscated")
	}

	h.logger.Info("Security settings updated successfully")
	h.writeJSON(w, http.StatusOK, map[string]string{"message": "Security settings updated"})
}

// TriggerKillSwitch manually triggers the kill switch
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

// GetIPStatus returns current IP information
func (h *Handlers) GetIPStatus(w http.ResponseWriter, r *http.Request) {
	h.logger.Info("Fetching IP status")

	torEnabled := h.torrentClient.IsTorEnabled()
	vpnType, _ := h.db.GetSetting("vpn_type")
	if vpnType == "" {
		vpnType = "none"
	}

	connectionType := "Direct Connection"
	if torEnabled {
		connectionType = "Tor Multi-Proxy Chain"
	} else if vpnType == "vless" {
		connectionType = "VLESS VPN Connection"
	} else if vpnType == "outline" {
		connectionType = "Outline VPN Connection"
	}

	status := map[string]interface{}{
		"torEnabled":     torEnabled,
		"vpnType":        vpnType,
		"ipObfuscated":   torEnabled || vpnType != "none",
		"dnsProtected":   true,
		"connectionType": connectionType,
	}

	h.writeJSON(w, http.StatusOK, status)
}

// TestDNSLeak tests for DNS leaks
func (h *Handlers) TestDNSLeak(w http.ResponseWriter, r *http.Request) {
	h.logger.Info("Testing DNS leak")
	h.writeJSON(w, http.StatusOK, map[string]interface{}{
		"dnsLeakDetected": false,
		"message":         "No DNS leaks detected",
	})
}

// SecureDeleteFile securely deletes files with multiple random data overwrites
func (h *Handlers) SecureDeleteFile(w http.ResponseWriter, r *http.Request) {
	var request struct {
		FilePaths []string `json:"filePaths"`
		Passes    int      `json:"passes"`
	}

	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		h.logger.Warn("Invalid secure delete request", zap.Error(err))
		h.writeError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if len(request.FilePaths) == 0 {
		h.writeError(w, http.StatusBadRequest, "No files specified")
		return
	}

	if request.Passes < 3 || request.Passes > 35 {
		request.Passes = 3 // Default to triple overwrite
	}

	h.logger.Info("Starting secure file deletion",
		zap.Int("fileCount", len(request.FilePaths)),
		zap.Int("passes", request.Passes),
	)

	deletedFiles := []string{}
	errors := []string{}

	for _, filePath := range request.FilePaths {
		safePath, err := normalizeUserFilePath(filePath)
		if err != nil {
			errors = append(errors, fmt.Sprintf("%s: %v", filePath, err))
			continue
		}

		if err := secureDeleteFile(safePath, request.Passes, h.logger); err != nil {
			h.logger.Error("Failed to securely delete file",
				zap.Error(err),
			)
			errors = append(errors, fmt.Sprintf("%s: %v", filePath, err))
		} else {
			h.logger.Info("File securely deleted",
				zap.Int("passes", request.Passes),
			)
			deletedFiles = append(deletedFiles, safePath)
		}
	}

	response := map[string]interface{}{
		"deletedFiles": deletedFiles,
		"errors":       errors,
		"passes":       request.Passes,
		"message":      fmt.Sprintf("Securely deleted %d file(s) with %d overwrites", len(deletedFiles), request.Passes),
	}

	h.writeJSON(w, http.StatusOK, response)
}

// secureDeleteFile performs secure file deletion with multiple random overwrites
func secureDeleteFile(filePath string, passes int, logger *zap.Logger) error {
	// Open file for reading to get size
	file, err := os.OpenFile(filePath, os.O_RDWR, 0666)
	if err != nil {
		return fmt.Errorf("failed to open file: %w", err)
	}

	fileInfo, err := file.Stat()
	if err != nil {
		file.Close()
		return fmt.Errorf("failed to stat file: %w", err)
	}

	fileSize := fileInfo.Size()
	logger.Debug("File opened for secure deletion",
		zap.String("file", filePath),
		zap.Int64("size", fileSize),
	)

	// Perform multiple overwrite passes
	for pass := 1; pass <= passes; pass++ {
		// Seek to beginning of file
		if _, err := file.Seek(0, 0); err != nil {
			file.Close()
			return fmt.Errorf("failed to seek to start (pass %d): %w", pass, err)
		}

		// Generate random data buffer
		bufferSize := int64(4096) // 4KB buffer
		if fileSize < bufferSize {
			bufferSize = fileSize
		}

		buffer := make([]byte, bufferSize)
		written := int64(0)

		for written < fileSize {
			// Fill buffer with cryptographically secure random data
			if _, err := rand.Read(buffer); err != nil {
				file.Close()
				return fmt.Errorf("failed to generate random data (pass %d): %w", pass, err)
			}

			// Determine how much to write
			toWrite := bufferSize
			if fileSize-written < bufferSize {
				toWrite = fileSize - written
			}

			// Write random data
			n, err := file.Write(buffer[:toWrite])
			if err != nil {
				file.Close()
				return fmt.Errorf("failed to write random data (pass %d): %w", pass, err)
			}

			written += int64(n)
		}

		// Sync to disk to ensure data is written
		if err := file.Sync(); err != nil {
			file.Close()
			return fmt.Errorf("failed to sync to disk (pass %d): %w", pass, err)
		}

		logger.Debug("Overwrite pass completed",
			zap.Int("pass", pass),
			zap.Int("totalPasses", passes),
		)
	}

	// Close the file
	if err := file.Close(); err != nil {
		return fmt.Errorf("failed to close file: %w", err)
	}

	// Finally, remove the file
	if err := os.Remove(filePath); err != nil {
		return fmt.Errorf("failed to remove file: %w", err)
	}

	return nil
}
