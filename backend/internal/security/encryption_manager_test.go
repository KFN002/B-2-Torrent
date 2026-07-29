package security

import (
	"bytes"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"go.uber.org/zap"
)

func testEncryptionManager() *EncryptionManager {
	return NewEncryptionManager(&EncryptionConfig{
		Algorithm:     "AES-256-GCM",
		KeyDerivation: "Argon2id",
		HashAlgorithm: "SHA-256",
		Iterations:    100000,
		MemoryCost:    8192,
		Parallelism:   1,
		TimeCost:      1,
	}, zap.NewNop())
}

func TestEncryptDecryptFileRoundTrip(t *testing.T) {
	manager := testEncryptionManager()
	tempDir := t.TempDir()
	inputPath := filepath.Join(tempDir, "input.txt")
	encryptedPath := filepath.Join(tempDir, "encrypted.b2")
	decryptedPath := filepath.Join(tempDir, "decrypted.txt")
	plaintext := []byte("authenticated encryption round-trip")

	require.NoError(t, os.WriteFile(inputPath, plaintext, 0600))
	require.NoError(t, manager.EncryptFile(inputPath, encryptedPath, "correct horse battery staple"))

	encrypted, err := os.ReadFile(encryptedPath)
	require.NoError(t, err)
	assert.True(t, bytes.HasPrefix(encrypted, []byte("B2ENCRYPT:2:")))

	require.NoError(t, manager.DecryptFile(encryptedPath, decryptedPath, "correct horse battery staple"))
	decrypted, err := os.ReadFile(decryptedPath)
	require.NoError(t, err)
	assert.Equal(t, plaintext, decrypted)
}

func TestDecryptRejectsTamperedHeader(t *testing.T) {
	manager := testEncryptionManager()
	tempDir := t.TempDir()
	inputPath := filepath.Join(tempDir, "input.txt")
	encryptedPath := filepath.Join(tempDir, "encrypted.b2")
	tamperedPath := filepath.Join(tempDir, "tampered.b2")
	outputPath := filepath.Join(tempDir, "output.txt")

	require.NoError(t, os.WriteFile(inputPath, []byte("sensitive data"), 0600))
	require.NoError(t, manager.EncryptFile(inputPath, encryptedPath, "password"))

	encrypted, err := os.ReadFile(encryptedPath)
	require.NoError(t, err)
	tampered := strings.Replace(string(encrypted), ":SHA-256:", ":SHA-512:", 1)
	require.NotEqual(t, string(encrypted), tampered)
	require.NoError(t, os.WriteFile(tamperedPath, []byte(tampered), 0600))

	err = manager.DecryptFile(tamperedPath, outputPath, "password")
	require.Error(t, err)
	_, statErr := os.Stat(outputPath)
	assert.ErrorIs(t, statErr, os.ErrNotExist)
}

func TestDeriveKeyRejectsInvalidKeySize(t *testing.T) {
	manager := testEncryptionManager()

	_, err := manager.DeriveKey("password", []byte("salt"), 0)
	require.Error(t, err)
	_, err = manager.DeriveKey("password", []byte("salt"), 65)
	require.Error(t, err)
}
