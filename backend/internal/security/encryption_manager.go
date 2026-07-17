package security

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"crypto/sha256"
	"crypto/sha512"
	"encoding/hex"
	"fmt"
	"os"
	"strings"

	"go.uber.org/zap"
	"golang.org/x/crypto/argon2"
	"golang.org/x/crypto/chacha20poly1305"
	"golang.org/x/crypto/pbkdf2"
	"golang.org/x/crypto/scrypt"
)

type EncryptionConfig struct {
	Algorithm     string // AES-256-GCM, ChaCha20-Poly1305, etc.
	KeyDerivation string // PBKDF2, Argon2id, scrypt
	HashAlgorithm string // SHA-256, SHA-512, BLAKE2b
	Iterations    int
	MemoryCost    uint32 // For Argon2
	Parallelism   uint8  // For Argon2
}

type EncryptionManager struct {
	config *EncryptionConfig
	logger *zap.Logger
}

func NewEncryptionManager(config *EncryptionConfig, logger *zap.Logger) *EncryptionManager {
	if config.Iterations == 0 {
		config.Iterations = 100000 // Default PBKDF2 iterations
	}
	if config.MemoryCost == 0 {
		config.MemoryCost = 65536 // Default Argon2 memory cost (64 MB)
	}
	if config.Parallelism == 0 {
		config.Parallelism = 4 // Default Argon2 parallelism
	}

	return &EncryptionManager{
		config: config,
		logger: logger,
	}
}

func (em *EncryptionManager) DeriveKey(password string, salt []byte, keySize int) ([]byte, error) {
	switch em.config.KeyDerivation {
	case "Argon2id":
		return argon2.IDKey([]byte(password), salt, 1, em.config.MemoryCost, em.config.Parallelism, uint32(keySize)), nil

	case "scrypt":
		return scrypt.Key([]byte(password), salt, 32768, 8, 1, keySize)

	case "PBKDF2":
		fallthrough
	default:
		hashFunc := sha256.New
		if em.config.HashAlgorithm == "SHA-512" {
			hashFunc = sha512.New
		}
		return pbkdf2.Key([]byte(password), salt, em.config.Iterations, keySize, hashFunc), nil
	}
}

func (em *EncryptionManager) EncryptFile(inputPath, outputPath, password string) error {
	// Generate random salt
	salt := make([]byte, 32)
	if _, err := rand.Read(salt); err != nil {
		return fmt.Errorf("failed to generate salt: %w", err)
	}

	// Derive key from password
	var key []byte
	var err error

	switch em.config.Algorithm {
	case "ChaCha20-Poly1305":
		key, err = em.DeriveKey(password, salt, chacha20poly1305.KeySize)
	default: // AES variants
		key, err = em.DeriveKey(password, salt, 32) // 256-bit key
	}

	if err != nil {
		return fmt.Errorf("key derivation failed: %w", err)
	}

	// Read input file
	plaintext, err := os.ReadFile(inputPath)
	if err != nil {
		return fmt.Errorf("failed to read input file: %w", err)
	}

	// Encrypt based on algorithm
	var ciphertext []byte
	var nonce []byte

	switch em.config.Algorithm {
	case "ChaCha20-Poly1305":
		aead, err := chacha20poly1305.New(key)
		if err != nil {
			return fmt.Errorf("failed to create ChaCha20-Poly1305 cipher: %w", err)
		}

		nonce = make([]byte, aead.NonceSize())
		if _, err := rand.Read(nonce); err != nil {
			return fmt.Errorf("failed to generate nonce: %w", err)
		}

		ciphertext = aead.Seal(nil, nonce, plaintext, nil)

	default: // AES-256-GCM
		block, err := aes.NewCipher(key)
		if err != nil {
			return fmt.Errorf("failed to create AES cipher: %w", err)
		}

		gcm, err := cipher.NewGCM(block)
		if err != nil {
			return fmt.Errorf("failed to create GCM: %w", err)
		}

		nonce = make([]byte, gcm.NonceSize())
		if _, err := rand.Read(nonce); err != nil {
			return fmt.Errorf("failed to generate nonce: %w", err)
		}

		ciphertext = gcm.Seal(nil, nonce, plaintext, nil)
	}

	// Write encrypted file: salt + nonce + ciphertext
	output, err := os.OpenFile(outputPath, os.O_WRONLY|os.O_CREATE|os.O_EXCL, 0600)
	if err != nil {
		return fmt.Errorf("failed to create output file: %w", err)
	}
	defer output.Close()

	// Write metadata header
	header := fmt.Sprintf("B2ENCRYPT:%s:%s:%s\n", em.config.Algorithm, em.config.KeyDerivation, em.config.HashAlgorithm)
	if _, err := output.WriteString(header); err != nil {
		return fmt.Errorf("failed to write header: %w", err)
	}

	// Write salt
	if _, err := output.Write(salt); err != nil {
		return fmt.Errorf("failed to write salt: %w", err)
	}

	// Write nonce
	if _, err := output.Write(nonce); err != nil {
		return fmt.Errorf("failed to write nonce: %w", err)
	}

	// Write ciphertext
	if _, err := output.Write(ciphertext); err != nil {
		return fmt.Errorf("failed to write ciphertext: %w", err)
	}

	return nil
}

func (em *EncryptionManager) DecryptFile(inputPath, outputPath, password string) error {
	// Read encrypted file
	data, err := os.ReadFile(inputPath)
	if err != nil {
		return fmt.Errorf("failed to read input file: %w", err)
	}

	// Parse header
	headerEnd := -1
	for i, b := range data {
		if i > 256 {
			break
		}
		if b == '\n' {
			headerEnd = i + 1
			break
		}
	}
	if headerEnd < 0 {
		return fmt.Errorf("invalid or missing encryption header")
	}
	header := strings.TrimSuffix(string(data[:headerEnd]), "\n")
	parts := strings.Split(header, ":")
	if len(parts) != 4 || parts[0] != "B2ENCRYPT" {
		return fmt.Errorf("invalid encryption header")
	}
	if parts[1] != "AES-256-GCM" && parts[1] != "ChaCha20-Poly1305" {
		return fmt.Errorf("unsupported encryption algorithm in header")
	}
	if parts[2] != "PBKDF2" && parts[2] != "Argon2id" && parts[2] != "scrypt" {
		return fmt.Errorf("unsupported key derivation function in header")
	}
	if parts[3] != "SHA-256" && parts[3] != "SHA-512" {
		return fmt.Errorf("unsupported hash algorithm in header")
	}
	em.config.Algorithm, em.config.KeyDerivation, em.config.HashAlgorithm = parts[1], parts[2], parts[3]

	data = data[headerEnd:] // Skip header
	if len(data) < 32 {
		return fmt.Errorf("encrypted payload is missing salt")
	}

	// Extract salt and nonce
	salt := data[:32]
	data = data[32:]

	var nonceSize int
	switch em.config.Algorithm {
	case "ChaCha20-Poly1305":
		nonceSize = chacha20poly1305.NonceSize
	default:
		nonceSize = 12 // GCM nonce size
	}
	if len(data) < nonceSize {
		return fmt.Errorf("encrypted payload is missing nonce")
	}

	nonce := data[:nonceSize]
	ciphertext := data[nonceSize:]

	// Derive key
	var key []byte
	switch em.config.Algorithm {
	case "ChaCha20-Poly1305":
		key, err = em.DeriveKey(password, salt, chacha20poly1305.KeySize)
	default:
		key, err = em.DeriveKey(password, salt, 32)
	}

	if err != nil {
		return fmt.Errorf("key derivation failed: %w", err)
	}

	// Decrypt
	var plaintext []byte

	switch em.config.Algorithm {
	case "ChaCha20-Poly1305":
		aead, err := chacha20poly1305.New(key)
		if err != nil {
			return fmt.Errorf("failed to create ChaCha20-Poly1305 cipher: %w", err)
		}

		plaintext, err = aead.Open(nil, nonce, ciphertext, nil)
		if err != nil {
			return fmt.Errorf("decryption failed: %w", err)
		}

	default: // AES-256-GCM
		block, err := aes.NewCipher(key)
		if err != nil {
			return fmt.Errorf("failed to create AES cipher: %w", err)
		}

		gcm, err := cipher.NewGCM(block)
		if err != nil {
			return fmt.Errorf("failed to create GCM: %w", err)
		}

		plaintext, err = gcm.Open(nil, nonce, ciphertext, nil)
		if err != nil {
			return fmt.Errorf("decryption failed: %w", err)
		}
	}

	// Write decrypted file
	output, err := os.OpenFile(outputPath, os.O_WRONLY|os.O_CREATE|os.O_EXCL, 0600)
	if err != nil {
		return fmt.Errorf("failed to create output file: %w", err)
	}
	if _, err := output.Write(plaintext); err != nil {
		output.Close()
		_ = os.Remove(outputPath)
		return fmt.Errorf("failed to write output file: %w", err)
	}
	if err := output.Close(); err != nil {
		_ = os.Remove(outputPath)
		return fmt.Errorf("failed to finalize output file: %w", err)
	}

	return nil
}

func (em *EncryptionManager) ComputeHash(data []byte) string {
	switch em.config.HashAlgorithm {
	case "SHA-512":
		hash := sha512.Sum512(data)
		return hex.EncodeToString(hash[:])
	default: // SHA-256
		hash := sha256.Sum256(data)
		return hex.EncodeToString(hash[:])
	}
}
