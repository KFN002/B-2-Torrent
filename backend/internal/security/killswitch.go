package security

import (
	"context"
	"fmt"
	"net"
	"sync"
	"time"

	"go.uber.org/zap"
)

// KillSwitch monitors network connections and kills all traffic if privacy is compromised
type KillSwitch struct {
	enabled       bool
	mu            sync.RWMutex
	logger        *zap.Logger
	violations    int
	maxViolations int
	isTriggered   bool
	onTrigger     func()
}

func NewKillSwitch(logger *zap.Logger, onTrigger func()) *KillSwitch {
	return &KillSwitch{
		enabled:       true,
		logger:        logger,
		maxViolations: 3,
		onTrigger:     onTrigger,
	}
}

func (ks *KillSwitch) Enable() {
	ks.mu.Lock()
	defer ks.mu.Unlock()
	ks.enabled = true
	ks.logger.Info("Kill switch enabled")
}

func (ks *KillSwitch) Disable() {
	ks.mu.Lock()
	defer ks.mu.Unlock()
	ks.enabled = false
	ks.logger.Info("Kill switch disabled")
}

func (ks *KillSwitch) IsEnabled() bool {
	ks.mu.RLock()
	defer ks.mu.RUnlock()
	return ks.enabled
}

func (ks *KillSwitch) IsTriggered() bool {
	ks.mu.RLock()
	defer ks.mu.RUnlock()
	return ks.isTriggered
}

func (ks *KillSwitch) CheckConnection(ctx context.Context, testURL string) error {
	if !ks.IsEnabled() {
		return nil
	}

	ks.mu.Lock()
	defer ks.mu.Unlock()

	// Test if connection is going through proxy
	conn, err := net.DialTimeout("tcp", testURL, 5*time.Second)
	if err != nil {
		ks.violations++
		ks.logger.Warn("Connection test failed",
			zap.Int("violations", ks.violations),
			zap.Int("maxViolations", ks.maxViolations),
		)

		if ks.violations >= ks.maxViolations {
			ks.trigger()
			return fmt.Errorf("kill switch triggered: too many connection violations")
		}
		return err
	}
	defer conn.Close()

	// Reset violations on successful connection
	ks.violations = 0
	return nil
}

func (ks *KillSwitch) trigger() {
	if ks.isTriggered {
		return
	}

	ks.isTriggered = true
	ks.logger.Error("KILL SWITCH TRIGGERED - All connections terminated for security")

	if ks.onTrigger != nil {
		go ks.onTrigger()
	}
}

func (ks *KillSwitch) Reset() {
	ks.mu.Lock()
	defer ks.mu.Unlock()
	ks.violations = 0
	ks.isTriggered = false
	ks.logger.Info("Kill switch reset")
}
