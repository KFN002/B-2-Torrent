package security

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"io"
	"os"

	"go.uber.org/zap"
)

// AdvancedEncryption handles advanced encryption features
type AdvancedEncryption struct {
	logger           *zap.Logger
	forceEncryption  bool
	encryptionLevel  string
	minProtocol      string
	rejectPlaintext  bool
	macRandomization bool
	antiFingerprint  bool
	secureDelete     bool
}

func NewAdvancedEncryption(logger *zap.Logger) *AdvancedEncryption {
	return &AdvancedEncryption{
		logger:           logger,
		forceEncryption:  true,
		encryptionLevel:  "strong",
		minProtocol:      "AES-256",
		rejectPlaintext:  true,
		macRandomization: false,
		antiFingerprint:  false,
		secureDelete:     true,
	}
}

// SetForceEncryption enables/disables forced encryption
func (ae *AdvancedEncryption) SetForceEncryption(enabled bool) {
	ae.forceEncryption = enabled
	ae.logger.Info("Force encryption toggled", zap.Bool("enabled", enabled))
}

// SetEncryptionLevel sets the encryption level
func (ae *AdvancedEncryption) SetEncryptionLevel(level string) error {
	validLevels := map[string]bool{
		"basic":   true,
		"standard": true,
		"strong":   true,
		"maximum":  true,
	}

	if !validLevels[level] {
		return fmt.Errorf("invalid encryption level: %s", level)
	}

	ae.encryptionLevel = level
	ae.logger.Info("Encryption level set", zap.String("level", level))
	return nil
}

// SetMinProtocol sets the minimum acceptable encryption protocol
func (ae *AdvancedEncryption) SetMinProtocol(protocol string) error {
	validProtocols := map[string]bool{
		"RC4":        true,
		"AES-128":    true,
		"AES-256":    true,
		"ChaCha20":   true,
	}

	if !validProtocols[protocol] {
		return fmt.Errorf("invalid protocol: %s", protocol)
	}

	ae.minProtocol = protocol
	ae.logger.Info("Minimum protocol set", zap.String("protocol", protocol))
	return nil
}

// ShouldAcceptPeer determines if a peer should be accepted based on encryption
func (ae *AdvancedEncryption) ShouldAcceptPeer(peerEncryption string) bool {
	if ae.forceEncryption && peerEncryption == "none" {
		ae.logger.Debug("Rejecting unencrypted peer", zap.String("encryption", peerEncryption))
		return false
	}

	if ae.rejectPlaintext && peerEncryption == "plaintext" {
		ae.logger.Debug("Rejecting plaintext peer")
		return false
	}

	// Check minimum protocol requirement
	protocolStrength := map[string]int{
		"RC4":      1,
		"AES-128":  2,
		"AES-256":  3,
		"ChaCha20": 4,
	}

	peerStrength := protocolStrength[peerEncryption]
	minStrength := protocolStrength[ae.minProtocol]

	if peerStrength < minStrength {
		ae.logger.Debug("Rejecting peer with weak encryption",
			zap.String("peerEncryption", peerEncryption),
			zap.String("minRequired", ae.minProtocol),
		)
		return false
	}

	return true
}

// RandomizeMAC generates a random MAC address
func (ae *AdvancedEncryption) RandomizeMAC() (string, error) {
	if !ae.macRandomization {
		return "", fmt.Errorf("MAC randomization is disabled")
	}

	// Generate random MAC address
	mac := make([]byte, 6)
	_, err := rand.Read(mac)
	if err != nil {
		ae.logger.Error("Failed to generate random MAC", zap.Error(err))
		return "", err
	}

	// Set local bit and unicast bit
	mac[0] = (mac[0] | 0x02) & 0xFE

	macStr := hex.EncodeToString(mac)
	macFormatted := fmt.Sprintf("%s:%s:%s:%s:%s:%s",
		macStr[0:2], macStr[2:4], macStr[4:6],
		macStr[6:8], macStr[8:10], macStr[10:12],
	)

	ae.logger.Info("Generated random MAC address", zap.String("mac", macFormatted))
	return macFormatted, nil
}

// ObfuscateProtocol modifies protocol headers to evade DPI
func (ae *AdvancedEncryption) ObfuscateProtocol(data []byte) []byte {
	if !ae.antiFingerprint {
		return data
	}

	// Simple XOR obfuscation with rotating key
	key := []byte{0x42, 0x74, 0x54, 0x6F, 0x72, 0x72}
	obfuscated := make([]byte, len(data))

	for i, b := range data {
		obfuscated[i] = b ^ key[i%len(key)]
	}

	ae.logger.Debug("Protocol data obfuscated", zap.Int("bytes", len(data)))
	return obfuscated
}

// SecureDeleteFile securely deletes a file by overwriting it
func (ae *AdvancedEncryption) SecureDeleteFile(filePath string) error {
	if !ae.secureDelete {
		return os.Remove(filePath)
	}

	// Open file
	file, err := os.OpenFile(filePath, os.O_WRONLY, 0)
	if err != nil {
		ae.logger.Error("Failed to open file for secure deletion", zap.Error(err))
		return err
	}
	defer file.Close()

	// Get file size
	info, err := file.Stat()
	if err != nil {
		return err
	}
	size := info.Size()

	// Overwrite with random data (3 passes)
	for pass := 0; pass < 3; pass++ {
		file.Seek(0, 0)
		
		// Write random data
		written := int64(0)
		buf := make([]byte, 4096)
		for written < size {
			toWrite := size - written
			if toWrite > int64(len(buf)) {
				toWrite = int64(len(buf))
			}
			
			io.ReadFull(rand.Reader, buf[:toWrite])
			n, err := file.Write(buf[:toWrite])
			if err != nil {
				return err
			}
			written += int64(n)
		}
		
		file.Sync()
	}

	// Finally remove the file
	err = os.Remove(filePath)
	if err != nil {
		ae.logger.Error("Failed to remove file after secure wipe", zap.Error(err))
		return err
	}

	ae.logger.Info("File securely deleted", zap.String("file", filePath))
	return nil
}

// GetConfig returns current configuration
func (ae *AdvancedEncryption) GetConfig() map[string]interface{} {
	return map[string]interface{}{
		"forceEncryption":  ae.forceEncryption,
		"encryptionLevel":  ae.encryptionLevel,
		"minProtocol":      ae.minProtocol,
		"rejectPlaintext":  ae.rejectPlaintext,
		"macRandomization": ae.macRandomization,
		"antiFingerprint":  ae.antiFingerprint,
		"secureDelete":     ae.secureDelete,
	}
}
