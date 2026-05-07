package api

import (
	"encoding/json"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/KFN002/B-2-Torrent/backend/internal/security"
	"go.uber.org/zap"
)

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

func (h *EncryptionHandlers) EncryptFile(w http.ResponseWriter, r *http.Request) {
	var req EncryptRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		h.logger.Error("Failed to decode request", zap.Error(err))
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	filePath, err := normalizeUserFilePath(req.FilePath)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	// Validate file exists
	if _, err := os.Stat(filePath); os.IsNotExist(err) {
		http.Error(w, "File not found", http.StatusNotFound)
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

	filePath, err := normalizeUserFilePath(req.FilePath)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	// Validate encrypted file exists
	if _, err := os.Stat(filePath); os.IsNotExist(err) {
		http.Error(w, "Encrypted file not found", http.StatusNotFound)
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
			"AES-256-CBC",
			"AES-192-GCM",
			"ChaCha20-Poly1305",
			"Twofish-256",
			"Serpent-256",
			"Camellia-256",
		},
		"keyDerivation": []string{
			"PBKDF2",
			"Argon2id",
			"scrypt",
			"bcrypt",
		},
		"hashing": []string{
			"SHA-256",
			"SHA-512",
			"SHA-3-256",
			"BLAKE2b",
			"Whirlpool",
		},
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(algorithms)
}
