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
	"strconv"
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
	TimeCost      uint32 // For Argon2
}

type EncryptionManager struct {
	config *EncryptionConfig
	logger *zap.Logger
}

func NewEncryptionManager(config *EncryptionConfig, logger *zap.Logger) *EncryptionManager {
	if config.Iterations == 0 {
		config.Iterations = 600000
	}
	if config.MemoryCost == 0 {
		config.MemoryCost = 65536
	}
	if config.Parallelism == 0 {
		config.Parallelism = 4
	}
	if config.TimeCost == 0 {
		config.TimeCost = 3
	}

	return &EncryptionManager{
		config: config,
		logger: logger,
	}
}

func (em *EncryptionManager) DeriveKey(password string, salt []byte, keySize int) ([]byte, error) {
	if keySize < 1 || keySize > 64 {
		return nil, fmt.Errorf("invalid derived key size")
	}

	switch em.config.KeyDerivation {
	case "Argon2id":
		// #nosec G115 -- keySize is bounded to 1..64 immediately above.
		return argon2.IDKey([]byte(password), salt, em.config.TimeCost, em.config.MemoryCost, em.config.Parallelism, uint32(keySize)), nil

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
	// #nosec G304 -- API callers normalize and confine inputPath to app-owned roots.
	plaintext, err := os.ReadFile(inputPath)
	if err != nil {
		return fmt.Errorf("failed to read input file: %w", err)
	}

	header := fmt.Sprintf(
		"B2ENCRYPT:2:%s:%s:%s:%d:%d:%d:%d\n",
		em.config.Algorithm,
		em.config.KeyDerivation,
		em.config.HashAlgorithm,
		em.config.Iterations,
		em.config.MemoryCost,
		em.config.Parallelism,
		em.config.TimeCost,
	)

	// Encrypt based on algorithm. The v2 header is authenticated as associated
	// data so algorithm and KDF parameters cannot be changed undetected.
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

		ciphertext = aead.Seal(nil, nonce, plaintext, []byte(header))

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

		ciphertext = gcm.Seal(nil, nonce, plaintext, []byte(header))
	}

	// Write encrypted file: salt + nonce + ciphertext
	// #nosec G304 -- outputPath is derived from a validated, confined input path.
	output, err := os.OpenFile(outputPath, os.O_WRONLY|os.O_CREATE|os.O_EXCL, 0600)
	if err != nil {
		return fmt.Errorf("failed to create output file: %w", err)
	}
	complete := false
	defer func() {
		_ = output.Close()
		if !complete {
			_ = os.Remove(outputPath)
		}
	}()

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
	if err := output.Close(); err != nil {
		return fmt.Errorf("failed to finalize output file: %w", err)
	}
	complete = true

	return nil
}

func (em *EncryptionManager) DecryptFile(inputPath, outputPath, password string) error {
	// Read encrypted file
	// #nosec G304 -- API callers normalize and confine inputPath to app-owned roots.
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
	headerBytes := data[:headerEnd]
	header := strings.TrimSuffix(string(headerBytes), "\n")
	parts := strings.Split(header, ":")
	if len(parts) < 4 || parts[0] != "B2ENCRYPT" {
		return fmt.Errorf("invalid encryption header")
	}
	associatedData := headerBytes
	switch {
	case len(parts) == 4:
		// Legacy v1 files did not authenticate their header and used the original
		// KDF defaults. Keep these values solely for backward-compatible reads.
		em.config.Algorithm, em.config.KeyDerivation, em.config.HashAlgorithm = parts[1], parts[2], parts[3]
		em.config.Iterations = 100000
		em.config.MemoryCost = 65536
		em.config.Parallelism = 4
		em.config.TimeCost = 1
		associatedData = nil
	case len(parts) == 9 && parts[1] == "2":
		em.config.Algorithm, em.config.KeyDerivation, em.config.HashAlgorithm = parts[2], parts[3], parts[4]
		iterations, err := strconv.Atoi(parts[5])
		if err != nil || iterations < 100000 || iterations > 10000000 {
			return fmt.Errorf("invalid PBKDF2 iteration count in header")
		}
		memoryCost, err := strconv.ParseUint(parts[6], 10, 32)
		if err != nil || memoryCost < 8192 || memoryCost > 1048576 {
			return fmt.Errorf("invalid Argon2 memory cost in header")
		}
		parallelism, err := strconv.ParseUint(parts[7], 10, 8)
		if err != nil || parallelism < 1 || parallelism > 32 {
			return fmt.Errorf("invalid Argon2 parallelism in header")
		}
		timeCost, err := strconv.ParseUint(parts[8], 10, 32)
		if err != nil || timeCost < 1 || timeCost > 10 {
			return fmt.Errorf("invalid Argon2 time cost in header")
		}
		em.config.Iterations = iterations
		em.config.MemoryCost = uint32(memoryCost)
		em.config.Parallelism = uint8(parallelism)
		em.config.TimeCost = uint32(timeCost)
	default:
		return fmt.Errorf("unsupported encryption header version")
	}

	if em.config.Algorithm != "AES-256-GCM" && em.config.Algorithm != "ChaCha20-Poly1305" {
		return fmt.Errorf("unsupported encryption algorithm in header")
	}
	if em.config.KeyDerivation != "PBKDF2" && em.config.KeyDerivation != "Argon2id" && em.config.KeyDerivation != "scrypt" {
		return fmt.Errorf("unsupported key derivation function in header")
	}
	if em.config.HashAlgorithm != "SHA-256" && em.config.HashAlgorithm != "SHA-512" {
		return fmt.Errorf("unsupported hash algorithm in header")
	}

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

		plaintext, err = aead.Open(nil, nonce, ciphertext, associatedData)
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

		plaintext, err = gcm.Open(nil, nonce, ciphertext, associatedData)
		if err != nil {
			return fmt.Errorf("decryption failed: %w", err)
		}
	}

	// Write decrypted file
	// #nosec G304 -- outputPath is derived from a validated, confined input path.
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
