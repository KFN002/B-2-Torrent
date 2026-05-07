package security

import (
	"crypto/rand"
	"encoding/binary"
	"net"
	"time"

	"go.uber.org/zap"
)

// TrafficObfuscator alters protocol fingerprints to evade DPI
type TrafficObfuscator struct {
	enabled bool
	mode    string // "stealth", "blend", "random"
	logger  *zap.Logger
}

func NewTrafficObfuscator(logger *zap.Logger) *TrafficObfuscator {
	return &TrafficObfuscator{
		enabled: false,
		mode:    "stealth",
		logger:  logger,
	}
}

func (to *TrafficObfuscator) Enable(mode string) {
	to.enabled = true
	to.mode = mode
	to.logger.Info("Traffic obfuscation enabled", zap.String("mode", mode))
}

func (to *TrafficObfuscator) Disable() {
	to.enabled = false
	to.logger.Info("Traffic obfuscation disabled")
}

func (to *TrafficObfuscator) IsEnabled() bool {
	return to.enabled
}

// ObfuscateConnection wraps a connection to add traffic obfuscation
func (to *TrafficObfuscator) ObfuscateConnection(conn net.Conn) net.Conn {
	if !to.enabled {
		return conn
	}

	return &obfuscatedConn{
		Conn:   conn,
		mode:   to.mode,
		logger: to.logger,
	}
}

type obfuscatedConn struct {
	net.Conn
	mode   string
	logger *zap.Logger
}

// Write obfuscates data before sending
func (oc *obfuscatedConn) Write(b []byte) (int, error) {
	if len(b) == 0 {
		return oc.Conn.Write(b)
	}

	obfuscated := make([]byte, len(b))
	copy(obfuscated, b)

	switch oc.mode {
	case "stealth":
		// Add random padding to obscure packet sizes
		padding := make([]byte, randomInt(16))
		rand.Read(padding)
		obfuscated = append(obfuscated, padding...)

	case "blend":
		// Make traffic look like HTTPS
		if len(obfuscated) > 5 {
			// Mimic TLS handshake header
			obfuscated[0] = 0x16 // Content Type: Handshake
			obfuscated[1] = 0x03 // Version: TLS 1.2
			obfuscated[2] = 0x03
		}

	case "random":
		// Add random delays and jitter
		time.Sleep(time.Duration(randomInt(100)) * time.Millisecond)
	}

	n, err := oc.Conn.Write(obfuscated)
	if n > len(b) {
		n = len(b)
	}
	return n, err
}

func randomInt(max int) int {
	var n uint32
	binary.Read(rand.Reader, binary.BigEndian, &n)
	return int(n) % max
}
