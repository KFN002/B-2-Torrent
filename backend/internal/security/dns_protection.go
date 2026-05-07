package security

import (
	"context"
	"net"
	"time"

	"go.uber.org/zap"
	"golang.org/x/net/proxy"
)

// DNSProtection prevents DNS leaks by routing DNS queries through proxy
type DNSProtection struct {
	enabled    bool
	proxyDialer proxy.Dialer
	logger     *zap.Logger
}

func NewDNSProtection(proxyDialer proxy.Dialer, logger *zap.Logger) *DNSProtection {
	return &DNSProtection{
		enabled:    true,
		proxyDialer: proxyDialer,
		logger:     logger,
	}
}

func (dp *DNSProtection) Enable() {
	dp.enabled = true
	dp.logger.Info("DNS leak protection enabled")
}

func (dp *DNSProtection) Disable() {
	dp.enabled = false
	dp.logger.Info("DNS leak protection disabled")
}

func (dp *DNSProtection) IsEnabled() bool {
	return dp.enabled
}

// SecureResolver creates a custom resolver that uses the proxy
func (dp *DNSProtection) SecureResolver() *net.Resolver {
	if !dp.enabled {
		return net.DefaultResolver
	}

	return &net.Resolver{
		PreferGo: true,
		Dial: func(ctx context.Context, network, address string) (net.Conn, error) {
			dp.logger.Debug("DNS query through proxy", zap.String("address", address))
			
			if dp.proxyDialer != nil {
				return dp.proxyDialer.Dial(network, address)
			}
			
			// Fallback to context-aware dial
			d := net.Dialer{Timeout: 10 * time.Second}
			return d.DialContext(ctx, network, address)
		},
	}
}
