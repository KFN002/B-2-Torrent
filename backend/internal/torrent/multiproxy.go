package torrent

import (
	"context"
	"crypto/rand"
	"fmt"
	"math/big"
	"net"
	"time"

	"golang.org/x/net/proxy"
)

// MultiProxyDialer chains multiple SOCKS5 proxies for enhanced anonymity
type MultiProxyDialer struct {
	proxyChain []string
	baseDialer proxy.Dialer
}

// NewMultiProxyDialer creates a dialer that routes through multiple proxies
// This provides multi-hop routing through different countries for maximum anonymity
func NewMultiProxyDialer(proxyAddresses []string) (*MultiProxyDialer, error) {
	if len(proxyAddresses) == 0 {
		return nil, fmt.Errorf("at least one proxy address required")
	}

	return &MultiProxyDialer{
		proxyChain: proxyAddresses,
		baseDialer: proxy.Direct,
	}, nil
}

// Dial establishes a connection through the proxy chain
func (m *MultiProxyDialer) Dial(network, addr string) (net.Conn, error) {
	return m.DialWithRetry(network, addr, 3)
}

// DialWithRetry attempts connection with retry logic for fault tolerance
func (m *MultiProxyDialer) DialWithRetry(network, addr string, maxRetries int) (net.Conn, error) {
	var lastErr error

	for attempt := 0; attempt < maxRetries; attempt++ {
		// Shuffle proxy order for each attempt to avoid patterns
		shuffledProxies := m.shuffleProxies()

		currentDialer := m.baseDialer

		// Chain proxies together
		for _, proxyAddr := range shuffledProxies {
			nextDialer, err := proxy.SOCKS5("tcp", proxyAddr, nil, currentDialer)
			if err != nil {
				lastErr = fmt.Errorf("failed to create proxy chain at %s: %w", proxyAddr, err)
				break
			}
			currentDialer = nextDialer
		}

		if lastErr != nil {
			// Wait before retry with exponential backoff
			time.Sleep(time.Duration(attempt+1) * time.Second)
			continue
		}

		// Attempt connection through the chain
		conn, err := currentDialer.Dial(network, addr)
		if err != nil {
			lastErr = fmt.Errorf("failed to dial through proxy chain: %w", err)
			time.Sleep(time.Duration(attempt+1) * time.Second)
			continue
		}

		return conn, nil
	}

	return nil, fmt.Errorf("all retry attempts failed: %w", lastErr)
}

// DialContext implements context-aware dialing for timeouts
func (m *MultiProxyDialer) DialContext(ctx context.Context, network, addr string) (net.Conn, error) {
	type result struct {
		conn net.Conn
		err  error
	}

	resultChan := make(chan result, 1)

	go func() {
		conn, err := m.Dial(network, addr)
		resultChan <- result{conn: conn, err: err}
	}()

	select {
	case <-ctx.Done():
		return nil, ctx.Err()
	case res := <-resultChan:
		return res.conn, res.err
	}
}

// shuffleProxies randomizes proxy order to avoid patterns
func (m *MultiProxyDialer) shuffleProxies() []string {
	shuffled := make([]string, len(m.proxyChain))
	copy(shuffled, m.proxyChain)

	for i := len(shuffled) - 1; i > 0; i-- {
		j, _ := rand.Int(rand.Reader, big.NewInt(int64(i+1)))
		shuffled[i], shuffled[j.Int64()] = shuffled[j.Int64()], shuffled[i]
	}

	return shuffled
}

// TestProxyChain verifies all proxies in the chain are operational
func (m *MultiProxyDialer) TestProxyChain() error {
	for _, proxyAddr := range m.proxyChain {
		dialer, err := proxy.SOCKS5("tcp", proxyAddr, nil, proxy.Direct)
		if err != nil {
			return fmt.Errorf("proxy %s unreachable: %w", proxyAddr, err)
		}

		// Test with a quick connection attempt
		conn, err := dialer.Dial("tcp", "1.1.1.1:80")
		if err != nil {
			return fmt.Errorf("proxy %s not working: %w", proxyAddr, err)
		}
		conn.Close()
	}

	return nil
}
