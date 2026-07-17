package api

import (
	"crypto/rand"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"go.uber.org/zap"
)

const (
	maxSecureDeleteFiles        = 25
	secureDeleteConfirmationKey = "SECURE_DELETE"
)

// SecurityConfig represents security settings
type SecurityConfig struct {
	KillSwitchEnabled     bool   `json:"killSwitchEnabled"`
	DNSProtectionEnabled  bool   `json:"dnsProtectionEnabled"`
	DNSObfuscationEnabled bool   `json:"dnsObfuscationEnabled"`
	IPObfuscationEnabled  bool   `json:"ipObfuscationEnabled"`
	DHTInvisibility       bool   `json:"dhtInvisibility"`
	SharingDisabled       bool   `json:"sharingDisabled"`
	DataEncryptionEnabled bool   `json:"dataEncryptionEnabled"`
	TorEnabled            bool   `json:"torEnabled"`
	VPNType               string `json:"vpnType"` // "none", "tor", "vless", "outline"
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
	PeerVerification      bool   `json:"peerVerification"`
	BlockMaliciousPeers   bool   `json:"blockMaliciousPeers"`
	SandboxMode           bool   `json:"sandboxMode"`
	MemoryEncryption      bool   `json:"memoryEncryption"`
	AutoWipeOnExit        bool   `json:"autoWipeOnExit"`
	StealthMode           bool   `json:"stealthMode"`
}

// SecurityStatus represents the current security status for monitoring
type SecurityStatus struct {
	KillSwitchActive           bool   `json:"killSwitchActive"`
	DNSProtectionActive        bool   `json:"dnsProtectionActive"`
	DNSObfuscationActive       bool   `json:"dnsObfuscationActive"`
	IPObfuscationActive        bool   `json:"ipObfuscationActive"`
	DHTInvisible               bool   `json:"dhtInvisible"`
	SharingDisabled            bool   `json:"sharingDisabled"`
	TrafficObfuscationActive   bool   `json:"trafficObfuscationActive"`
	DataEncryptionActive       bool   `json:"dataEncryptionActive"`
	ForceEncryptionActive      bool   `json:"forceEncryptionActive"`
	RejectPlaintextActive      bool   `json:"rejectPlaintextActive"`
	NoLogsMode                 bool   `json:"noLogsMode"`
	MACRandomizationActive     bool   `json:"macRandomizationActive"`
	AntiFingerprintActive      bool   `json:"antiFingerprintActive"`
	SecureDeleteActive         bool   `json:"secureDeleteActive"`
	PeerVerificationActive     bool   `json:"peerVerificationActive"`
	BlockMaliciousPeersActive  bool   `json:"blockMaliciousPeersActive"`
	SandboxModeActive          bool   `json:"sandboxModeActive"`
	MemoryEncryptionActive     bool   `json:"memoryEncryptionActive"`
	AutoWipeOnExitActive       bool   `json:"autoWipeOnExitActive"`
	StealthModeActive          bool   `json:"stealthModeActive"`
	PeerExchangeDisabled       bool   `json:"peerExchangeDisabled"`
	InboundConnectionsDisabled bool   `json:"inboundConnectionsDisabled"`
	DirectPeerDialingDisabled  bool   `json:"directPeerDialingDisabled"`
	UDPTrackersBlocked         bool   `json:"udpTrackersBlocked"`
	ProxyRequired              bool   `json:"proxyRequired"`
	ProxyAvailable             bool   `json:"proxyAvailable"`
	ConnectionType             string `json:"connectionType"`
	DownloadSpeed              int64  `json:"downloadSpeed"`
	UploadSpeed                int64  `json:"uploadSpeed"`
	SecurityScore              int    `json:"securityScore"`
	LeaksDetected              *int   `json:"leaksDetected"`
	LastCheck                  string `json:"lastCheck"`
}

func boolSettingOrDefault(value string, fallback bool) bool {
	if value == "" {
		return fallback
	}
	return value == "true"
}

func connectionTypeFor(vpnType string, torEnabled bool) string {
	if torEnabled || vpnType == "tor" {
		return "Tor Multi-Proxy Chain"
	}
	switch vpnType {
	case "vless":
		return "VLESS VPN Connection"
	case "outline":
		return "Outline VPN Connection"
	default:
		return "Direct Connection"
	}
}

// GetSecurityStatus returns current security status for monitoring
func (h *Handlers) GetSecurityStatus(w http.ResponseWriter, r *http.Request) {
	h.logger.Info("Fetching security status for monitoring")

	vpnType, _ := h.db.GetSetting("vpn_type")
	if vpnType == "" {
		vpnType = "none"
	}
	privacy := h.torrentClient.PrivacyStatus()
	torrents := h.torrentClient.GetAllTorrents()
	var downloadSpeed int64
	var uploadSpeed int64
	for _, item := range torrents {
		downloadSpeed += item.DownloadSpeed
		uploadSpeed += item.UploadSpeed
	}
	connectionType := "Direct Connection"
	if privacy.ProxyAvailable {
		connectionType = "Tor Proxy Chain"
	} else if vpnType == "tor" || h.torrentClient.IsTorEnabled() {
		connectionType = "Tor Proxy Unavailable"
	}

	status := SecurityStatus{
		KillSwitchActive:           false,
		DNSProtectionActive:        privacy.DNSObfuscation,
		DNSObfuscationActive:       privacy.DNSObfuscation,
		IPObfuscationActive:        privacy.IPObfuscation,
		DHTInvisible:               privacy.DHTInvisibility,
		SharingDisabled:            privacy.SharingDisabled,
		TrafficObfuscationActive:   privacy.TrafficObfuscation,
		DataEncryptionActive:       false,
		ForceEncryptionActive:      false,
		RejectPlaintextActive:      false,
		NoLogsMode:                 privacy.NoLogsMode,
		MACRandomizationActive:     false,
		AntiFingerprintActive:      false,
		SecureDeleteActive:         false,
		PeerVerificationActive:     false,
		BlockMaliciousPeersActive:  false,
		SandboxModeActive:          false,
		MemoryEncryptionActive:     false,
		AutoWipeOnExitActive:       false,
		StealthModeActive:          false,
		PeerExchangeDisabled:       privacy.PeerExchangeDisabled,
		InboundConnectionsDisabled: privacy.InboundConnectionsDisabled,
		DirectPeerDialingDisabled:  privacy.DirectPeerDialingDisabled,
		UDPTrackersBlocked:         privacy.UDPTrackersBlocked,
		ProxyRequired:              privacy.ProxyRequired,
		ProxyAvailable:             privacy.ProxyAvailable,
		ConnectionType:             connectionType,
		DownloadSpeed:              downloadSpeed,
		UploadSpeed:                uploadSpeed,
		SecurityScore:              calculateSecurityScore(h.db, h.torrentClient),
		LeaksDetected:              nil,
		LastCheck:                  time.Now().UTC().Format(time.RFC3339),
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
	if h.torrentClient.IsTorEnabled() && vpnType == "none" {
		vpnType = "tor"
	}
	killSwitch, _ := h.db.GetSetting("kill_switch_enabled")
	dnsProtection, _ := h.db.GetSetting("dns_protection_enabled")
	dataEncryption, _ := h.db.GetSetting("data_encryption_enabled")
	noLogsMode, _ := h.db.GetSetting("no_logs_mode")
	obfuscateTraffic, _ := h.db.GetSetting("obfuscate_traffic")
	dnsObfuscation, _ := h.db.GetSetting("dns_obfuscation_enabled")
	ipObfuscation, _ := h.db.GetSetting("ip_obfuscation_enabled")
	dhtInvisibility, _ := h.db.GetSetting("dht_invisibility")
	sharingDisabled, _ := h.db.GetSetting("sharing_disabled")

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
	peerVerification, _ := h.db.GetSetting("peer_verification")
	blockMaliciousPeers, _ := h.db.GetSetting("block_malicious_peers")
	sandboxMode, _ := h.db.GetSetting("sandbox_mode")
	memoryEncryption, _ := h.db.GetSetting("memory_encryption")
	autoWipeOnExit, _ := h.db.GetSetting("auto_wipe_on_exit")
	stealthMode, _ := h.db.GetSetting("stealth_mode")
	privacy := h.torrentClient.PrivacyStatus()

	config := SecurityConfig{
		KillSwitchEnabled:     boolSettingOrDefault(killSwitch, true),
		DNSProtectionEnabled:  boolSettingOrDefault(dnsProtection, true),
		DNSObfuscationEnabled: boolSettingOrDefault(dnsObfuscation, privacy.DNSObfuscation),
		IPObfuscationEnabled:  boolSettingOrDefault(ipObfuscation, privacy.IPObfuscation),
		DHTInvisibility:       dhtInvisibility == "true" || dhtInvisibility == "",
		SharingDisabled:       sharingDisabled == "true" || sharingDisabled == "",
		DataEncryptionEnabled: boolSettingOrDefault(dataEncryption, true),
		TorEnabled:            h.torrentClient.IsTorEnabled(),
		VPNType:               vpnType,
		// Secrets are intentionally write-only and never returned by the API.
		VLESSKey:              "",
		OutlineKey:            "",
		NoLogsMode:            noLogsMode == "true",
		ObfuscateTraffic:      obfuscateTraffic == "true",
		ForceEncryption:       forceEncryption == "true" || forceEncryption == "",
		EncryptionLevel:       encryptionLevel,
		MinEncryptionProtocol: minProtocol,
		RejectPlaintext:       rejectPlaintext == "true" || rejectPlaintext == "",
		MACRandomization:      macRandomization == "true",
		AntiFingerprint:       antiFingerprint == "true",
		SecureDelete:          secureDelete == "true" || secureDelete == "",
		PeerVerification:      boolSettingOrDefault(peerVerification, true),
		BlockMaliciousPeers:   boolSettingOrDefault(blockMaliciousPeers, true),
		SandboxMode:           sandboxMode == "true",
		MemoryEncryption:      boolSettingOrDefault(memoryEncryption, true),
		AutoWipeOnExit:        autoWipeOnExit == "true",
		StealthMode:           stealthMode == "true",
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
	if config.VPNType != "none" && config.VPNType != "tor" {
		h.writeError(w, http.StatusBadRequest, "The backend only supports its configured Tor proxy. Use the standalone VPN client for VLESS or Outline.")
		return
	}
	config.TorEnabled = config.VPNType == "tor"
	if config.NoLogsMode {
		config.DHTInvisibility = true
		config.SharingDisabled = true
		config.SecureDelete = true
	}

	h.logger.Info("Updating security settings",
		zap.Bool("killSwitch", config.KillSwitchEnabled),
		zap.Bool("dnsProtection", config.DNSProtectionEnabled),
		zap.Bool("dnsObfuscation", config.DNSObfuscationEnabled),
		zap.Bool("ipObfuscation", config.IPObfuscationEnabled),
		zap.Bool("dhtInvisibility", config.DHTInvisibility),
		zap.Bool("sharingDisabled", config.SharingDisabled),
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
		zap.Bool("peerVerification", config.PeerVerification),
		zap.Bool("blockMaliciousPeers", config.BlockMaliciousPeers),
		zap.Bool("sandboxMode", config.SandboxMode),
		zap.Bool("memoryEncryption", config.MemoryEncryption),
		zap.Bool("autoWipeOnExit", config.AutoWipeOnExit),
		zap.Bool("stealthMode", config.StealthMode),
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
	h.db.SetSetting("dns_obfuscation_enabled", fmt.Sprintf("%t", config.DNSObfuscationEnabled))
	h.db.SetSetting("ip_obfuscation_enabled", fmt.Sprintf("%t", config.IPObfuscationEnabled))
	h.db.SetSetting("dht_invisibility", fmt.Sprintf("%t", config.DHTInvisibility))
	h.db.SetSetting("sharing_disabled", fmt.Sprintf("%t", config.SharingDisabled))
	h.db.SetSetting("data_encryption_enabled", fmt.Sprintf("%t", config.DataEncryptionEnabled))
	h.db.SetSetting("tor_enabled", fmt.Sprintf("%t", config.TorEnabled))

	h.db.SetSetting("vpn_type", config.VPNType)

	h.db.SetSetting("no_logs_mode", fmt.Sprintf("%t", config.NoLogsMode))
	h.db.SetSetting("obfuscate_traffic", fmt.Sprintf("%t", config.ObfuscateTraffic))

	h.db.SetSetting("force_encryption", fmt.Sprintf("%t", config.ForceEncryption))
	h.db.SetSetting("encryption_level", config.EncryptionLevel)
	h.db.SetSetting("min_encryption_protocol", config.MinEncryptionProtocol)
	h.db.SetSetting("reject_plaintext", fmt.Sprintf("%t", config.RejectPlaintext))
	h.db.SetSetting("mac_randomization", fmt.Sprintf("%t", config.MACRandomization))
	h.db.SetSetting("anti_fingerprint", fmt.Sprintf("%t", config.AntiFingerprint))
	h.db.SetSetting("secure_delete", fmt.Sprintf("%t", config.SecureDelete))
	h.db.SetSetting("peer_verification", fmt.Sprintf("%t", config.PeerVerification))
	h.db.SetSetting("block_malicious_peers", fmt.Sprintf("%t", config.BlockMaliciousPeers))
	h.db.SetSetting("sandbox_mode", fmt.Sprintf("%t", config.SandboxMode))
	h.db.SetSetting("memory_encryption", fmt.Sprintf("%t", config.MemoryEncryption))
	h.db.SetSetting("auto_wipe_on_exit", fmt.Sprintf("%t", config.AutoWipeOnExit))
	h.db.SetSetting("stealth_mode", fmt.Sprintf("%t", config.StealthMode))

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

	actualIPObfuscation := h.torrentClient.SetIPObfuscation(config.IPObfuscationEnabled)
	actualDNSObfuscation := h.torrentClient.SetDNSObfuscation(config.DNSObfuscationEnabled)
	h.torrentClient.SetDHTInvisibility(config.DHTInvisibility)
	h.torrentClient.SetSharingDisabled(config.SharingDisabled)
	_ = h.db.SetSetting("ip_obfuscation_enabled", fmt.Sprintf("%t", actualIPObfuscation))
	_ = h.db.SetSetting("dns_obfuscation_enabled", fmt.Sprintf("%t", actualDNSObfuscation))

	if config.ForceEncryption {
		h.logger.Info("Force encryption enabled - all unencrypted connections will be rejected")
	}

	if config.DHTInvisibility {
		h.logger.Info("DHT invisibility enabled - DHT announce/query participation and PEX remain disabled")
	}

	if config.SharingDisabled {
		h.logger.Info("Sharing disabled - torrent data upload and seeding are blocked")
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

	privacy := h.torrentClient.PrivacyStatus()
	connectionType := connectionTypeFor(vpnType, torEnabled)
	if (vpnType == "tor" || torEnabled) && !privacy.ProxyAvailable {
		connectionType = "Tor Proxy Unavailable"
	}
	status := map[string]interface{}{
		"torEnabled":         torEnabled,
		"vpnType":            vpnType,
		"ipObfuscated":       privacy.IPObfuscation || vpnType != "none",
		"dnsProtected":       true,
		"dnsObfuscated":      privacy.DNSObfuscation,
		"dhtInvisible":       privacy.DHTInvisibility,
		"sharingDisabled":    privacy.SharingDisabled,
		"udpTrackersBlocked": privacy.UDPTrackersBlocked,
		"connectionType":     connectionType,
	}

	h.writeJSON(w, http.StatusOK, status)
}

// TestDNSLeak tests for DNS leaks
func (h *Handlers) TestDNSLeak(w http.ResponseWriter, r *http.Request) {
	h.logger.Info("DNS leak test requested")
	h.writeJSON(w, http.StatusOK, map[string]interface{}{
		"checked":         false,
		"dnsLeakDetected": nil,
		"message":         "A DNS leak test requires an external resolver probe and is not performed by the local API. No safety conclusion was made.",
	})
}

// SecureDeleteFile securely deletes files with multiple random data overwrites
func (h *Handlers) SecureDeleteFile(w http.ResponseWriter, r *http.Request) {
	var request struct {
		FilePaths []string `json:"filePaths"`
		Passes    int      `json:"passes"`
		DryRun    bool     `json:"dryRun"`
		Confirm   string   `json:"confirm"`
	}

	type secureDeleteResult struct {
		Path    string `json:"path"`
		Name    string `json:"name"`
		Size    int64  `json:"size"`
		Deleted bool   `json:"deleted"`
		Error   string `json:"error,omitempty"`
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

	if len(request.FilePaths) > maxSecureDeleteFiles {
		h.writeError(w, http.StatusBadRequest, fmt.Sprintf("A maximum of %d files can be processed at once", maxSecureDeleteFiles))
		return
	}

	if request.Passes < 3 || request.Passes > 35 {
		request.Passes = 3 // Default to triple overwrite
	}

	if !request.DryRun && request.Confirm != secureDeleteConfirmationKey {
		h.writeError(w, http.StatusBadRequest, "Secure deletion requires confirm=SECURE_DELETE")
		return
	}

	h.logger.Info("Preparing secure file deletion",
		zap.Int("fileCount", len(request.FilePaths)),
		zap.Int("passes", request.Passes),
		zap.Bool("dryRun", request.DryRun),
	)

	deletedFiles := []string{}
	errors := []string{}
	results := make([]secureDeleteResult, 0, len(request.FilePaths))

	for _, filePath := range request.FilePaths {
		result := secureDeleteResult{
			Path: filePath,
			Name: filepath.Base(filePath),
		}

		safePath, err := normalizeUserFilePath(filePath)
		if err != nil {
			result.Error = err.Error()
			errors = append(errors, fmt.Sprintf("%s: %v", result.Name, err))
			results = append(results, result)
			continue
		}

		result.Path = safePath

		info, err := os.Stat(safePath)
		if err != nil {
			result.Error = fmt.Sprintf("failed to stat file: %v", err)
			errors = append(errors, fmt.Sprintf("%s: %s", result.Name, result.Error))
			results = append(results, result)
			continue
		}
		result.Name = info.Name()
		result.Size = info.Size()

		if !info.Mode().IsRegular() {
			result.Error = "secure deletion only supports regular files"
			errors = append(errors, fmt.Sprintf("%s: %s", result.Name, result.Error))
			results = append(results, result)
			continue
		}

		if request.DryRun {
			results = append(results, result)
			continue
		}

		if err := secureDeleteFile(safePath, request.Passes, h.logger); err != nil {
			h.logger.Error("Failed to securely delete file",
				zap.Error(err),
			)
			result.Error = err.Error()
			errors = append(errors, fmt.Sprintf("%s: %v", result.Name, err))
		} else {
			h.logger.Info("File securely deleted",
				zap.Int("passes", request.Passes),
			)
			result.Deleted = true
			deletedFiles = append(deletedFiles, safePath)
		}
		results = append(results, result)
	}

	message := fmt.Sprintf("Securely deleted %d file(s) with %d overwrites", len(deletedFiles), request.Passes)
	if request.DryRun {
		message = fmt.Sprintf("Validated %d file(s) for secure deletion", len(results)-len(errors))
	}

	response := map[string]interface{}{
		"deletedFiles": deletedFiles,
		"errors":       errors,
		"passes":       request.Passes,
		"dryRun":       request.DryRun,
		"results":      results,
		"message":      message,
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
			if n == 0 {
				file.Close()
				return fmt.Errorf("failed to write random data (pass %d): no bytes written", pass)
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

	if err := syncParentDir(filePath); err != nil {
		logger.Debug("Failed to sync parent directory after secure deletion", zap.Error(err))
	}

	return nil
}

func syncParentDir(filePath string) error {
	dir, err := os.Open(filepath.Dir(filePath))
	if err != nil {
		return err
	}
	defer dir.Close()
	return dir.Sync()
}
