package security

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"encoding/base64"
	"fmt"
	"io"

	"go.uber.org/zap"
)

// DataEncryption handles encryption of user data
type DataEncryption struct {
	key    []byte
	logger *zap.Logger
}

func NewDataEncryption(encryptionKey string, logger *zap.Logger) (*DataEncryption, error) {
	// Ensure key is 32 bytes for AES-256
	key := []byte(encryptionKey)
	if len(key) < 32 {
		// Pad key if too short
		paddedKey := make([]byte, 32)
		copy(paddedKey, key)
		key = paddedKey
	} else if len(key) > 32 {
		// Truncate if too long
		key = key[:32]
	}

	return &DataEncryption{
		key:    key,
		logger: logger,
	}, nil
}

func (de *DataEncryption) Encrypt(plaintext string) (string, error) {
	block, err := aes.NewCipher(de.key)
	if err != nil {
		de.logger.Error("Failed to create cipher", zap.Error(err))
		return "", err
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		de.logger.Error("Failed to create GCM", zap.Error(err))
		return "", err
	}

	nonce := make([]byte, gcm.NonceSize())
	if _, err := io.ReadFull(rand.Reader, nonce); err != nil {
		de.logger.Error("Failed to generate nonce", zap.Error(err))
		return "", err
	}

	ciphertext := gcm.Seal(nonce, nonce, []byte(plaintext), nil)
	return base64.StdEncoding.EncodeToString(ciphertext), nil
}

func (de *DataEncryption) Decrypt(ciphertext string) (string, error) {
	data, err := base64.StdEncoding.DecodeString(ciphertext)
	if err != nil {
		de.logger.Error("Failed to decode base64", zap.Error(err))
		return "", err
	}

	block, err := aes.NewCipher(de.key)
	if err != nil {
		de.logger.Error("Failed to create cipher", zap.Error(err))
		return "", err
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		de.logger.Error("Failed to create GCM", zap.Error(err))
		return "", err
	}

	nonceSize := gcm.NonceSize()
	if len(data) < nonceSize {
		return "", fmt.Errorf("ciphertext too short")
	}

	nonce, encryptedPayload := data[:nonceSize], data[nonceSize:]
	plaintext, err := gcm.Open(nil, nonce, encryptedPayload, nil)
	if err != nil {
		de.logger.Error("Failed to decrypt", zap.Error(err))
		return "", err
	}

	return string(plaintext), nil
}
