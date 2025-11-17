package torrent

import (
	"context"
	"fmt"
	"net"
	"net/http"
	"time"

	"golang.org/x/net/proxy"
)

type TorDialer struct {
	dialer proxy.Dialer
}

func NewTorDialer(proxyAddr string) (*TorDialer, error) {
	dialer, err := proxy.SOCKS5("tcp", proxyAddr, nil, proxy.Direct)
	if err != nil {
		return nil, fmt.Errorf("failed to create SOCKS5 dialer: %w", err)
	}

	return &TorDialer{dialer: dialer}, nil
}

func (t *TorDialer) Dial(network, addr string) (net.Conn, error) {
	return t.dialer.Dial(network, addr)
}

func (t *TorDialer) DialContext(ctx context.Context, network, addr string) (net.Conn, error) {
	return t.dialer.Dial(network, addr)
}

// Create HTTP client that routes through Tor
func CreateTorHTTPClient(proxyAddr string) (*http.Client, error) {
	torDialer, err := NewTorDialer(proxyAddr)
	if err != nil {
		return nil, err
	}

	transport := &http.Transport{
		DialContext: torDialer.DialContext,
		// Disable keep-alive for better privacy
		DisableKeepAlives: true,
		// Timeout settings
		ResponseHeaderTimeout: 30 * time.Second,
		ExpectContinueTimeout: 10 * time.Second,
	}

	return &http.Client{
		Transport: transport,
		Timeout:   60 * time.Second,
	}, nil
}

// Test Tor connection
func TestTorConnection(proxyAddr string) error {
	client, err := CreateTorHTTPClient(proxyAddr)
	if err != nil {
		return err
	}

	// Try to connect to a test endpoint
	resp, err := client.Get("https://check.torproject.org/api/ip")
	if err != nil {
		return fmt.Errorf("failed to connect through Tor: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("tor connection test failed with status: %d", resp.StatusCode)
	}

	return nil
}
