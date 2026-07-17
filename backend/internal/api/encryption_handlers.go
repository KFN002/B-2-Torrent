package api

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/KFN002/B-2-Torrent/backend/internal/security"
	"go.uber.org/zap"
)

const maxEncryptionFileSize = 512 << 20

var supportedEncryptionAlgorithms = map[string]bool{"AES-256-GCM": true, "ChaCha20-Poly1305": true}
var supportedKDFs = map[string]bool{"PBKDF2": true, "Argon2id": true, "scrypt": true}
var supportedHashes = map[string]bool{"SHA-256": true, "SHA-512": true}

type EncryptionHandlers struct {
	logger *zap.Logger
}

func NewEncryptionHandlers(logger *zap.Logger) *EncryptionHandlers {
	return &EncryptionHandlers{
		logger: logger,
	}
}

type EncryptRequest struct {
	FilePath      string `json:"filePath"`
	Password      string `json:"password"`
	Algorithm     string `json:"algorithm"`
	KeyDerivation string `json:"keyDerivation"`
	HashAlgorithm string `json:"hashAlgorithm"`
}

type EncryptResponse struct {
	Success       bool   `json:"success"`
	Message       string `json:"message"`
	EncryptedPath string `json:"encryptedPath,omitempty"`
}

func validateEncryptionRequest(req EncryptRequest) error {
	if len(req.Password) < 12 || len(req.Password) > 1024 {
		return fmt.Errorf("password must be between 12 and 1024 characters")
	}
	if !supportedEncryptionAlgorithms[req.Algorithm] {
		return fmt.Errorf("unsupported encryption algorithm")
	}
	if !supportedKDFs[req.KeyDerivation] {
		return fmt.Errorf("unsupported key derivation function")
	}
	if !supportedHashes[req.HashAlgorithm] {
		return fmt.Errorf("unsupported hash algorithm")
	}
	return nil
}

func validateEncryptionInput(filePath string) error {
	info, err := os.Stat(filePath)
	if err != nil {
		return err
	}
	if !info.Mode().IsRegular() {
		return fmt.Errorf("only regular files are supported")
	}
	if info.Size() > maxEncryptionFileSize {
		return fmt.Errorf("file exceeds the 512 MiB in-memory encryption limit")
	}
	return nil
}

func (h *EncryptionHandlers) EncryptFile(w http.ResponseWriter, r *http.Request) {
	var req EncryptRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		h.logger.Error("Failed to decode request", zap.Error(err))
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}
	if err := validateEncryptionRequest(req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	filePath, err := normalizeUserFilePath(req.FilePath)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if err := validateEncryptionInput(filePath); err != nil {
		http.Error(w, "Invalid input file: "+err.Error(), http.StatusBadRequest)
		return
	}

	// Create encryption manager
	config := &security.EncryptionConfig{
		Algorithm:     req.Algorithm,
		KeyDerivation: req.KeyDerivation,
		HashAlgorithm: req.HashAlgorithm,
	}

	em := security.NewEncryptionManager(config, h.logger)

	// Generate output path
	outputPath := filePath + ".b2encrypted"
	if _, err := os.Lstat(outputPath); err == nil {
		http.Error(w, "Encrypted output already exists", http.StatusConflict)
		return
	} else if !os.IsNotExist(err) {
		http.Error(w, "Unable to validate output path", http.StatusInternalServerError)
		return
	}

	// Encrypt file
	if err := em.EncryptFile(filePath, outputPath, req.Password); err != nil {
		h.logger.Error("Encryption failed", zap.Error(err))
		http.Error(w, "Encryption failed", http.StatusInternalServerError)
		return
	}

	// Optionally remove original file (secure delete)
	uploadDir := os.Getenv("UPLOAD_DIR")
	if uploadDir != "" && filepath.Dir(filePath) == uploadDir {
		os.Remove(filePath) // Remove original after encryption
	}

	h.logger.Info("File encrypted successfully", zap.String("output", outputPath))

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(EncryptResponse{
		Success:       true,
		Message:       "File encrypted successfully",
		EncryptedPath: outputPath,
	})
}

func (h *EncryptionHandlers) DecryptFile(w http.ResponseWriter, r *http.Request) {
	var req EncryptRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		h.logger.Error("Failed to decode request", zap.Error(err))
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}
	if err := validateEncryptionRequest(req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	filePath, err := normalizeUserFilePath(req.FilePath)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if !strings.HasSuffix(filePath, ".b2encrypted") {
		http.Error(w, "Encrypted file must use the .b2encrypted suffix", http.StatusBadRequest)
		return
	}
	if err := validateEncryptionInput(filePath); err != nil {
		http.Error(w, "Invalid encrypted file: "+err.Error(), http.StatusBadRequest)
		return
	}

	// Create encryption manager
	config := &security.EncryptionConfig{
		Algorithm:     req.Algorithm,
		KeyDerivation: req.KeyDerivation,
		HashAlgorithm: req.HashAlgorithm,
	}

	em := security.NewEncryptionManager(config, h.logger)

	// Generate output path (remove .b2encrypted extension)
	outputPath := strings.TrimSuffix(filePath, ".b2encrypted")
	if _, err := os.Lstat(outputPath); err == nil {
		http.Error(w, "Decrypted output already exists", http.StatusConflict)
		return
	} else if !os.IsNotExist(err) {
		http.Error(w, "Unable to validate output path", http.StatusInternalServerError)
		return
	}

	// Decrypt file
	if err := em.DecryptFile(filePath, outputPath, req.Password); err != nil {
		h.logger.Error("Decryption failed", zap.Error(err))
		http.Error(w, "Decryption failed - incorrect password or corrupted file", http.StatusUnauthorized)
		return
	}

	h.logger.Info("File decrypted successfully", zap.String("output", outputPath))

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(EncryptResponse{
		Success:       true,
		Message:       "File decrypted successfully",
		EncryptedPath: outputPath,
	})
}

func (h *EncryptionHandlers) GetSupportedAlgorithms(w http.ResponseWriter, r *http.Request) {
	algorithms := map[string]interface{}{
		"encryption": []string{
			"AES-256-GCM",
			"ChaCha20-Poly1305",
		},
		"keyDerivation": []string{
			"PBKDF2",
			"Argon2id",
			"scrypt",
		},
		"hashing": []string{
			"SHA-256",
			"SHA-512",
		},
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(algorithms)
}
