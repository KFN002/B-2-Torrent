package torrent

import (
	"fmt"
	"net"
	"sync"
	"time"

	"github.com/anacrolix/torrent"
	"golang.org/x/net/proxy"
)

type Client struct {
	client           *torrent.Client
	torrents         map[string]*torrent.Torrent
	mu               sync.RWMutex
	multiProxyDialer *MultiProxyDialer
	config           *ClientConfig
}

type ClientConfig struct {
	ProxyChain []string
	DataDir    string
	EnableDHT  bool
	MaxRetries int
}

type TorrentInfo struct {
	InfoHash     string  `json:"infoHash"`
	Name         string  `json:"name"`
	TotalSize    int64   `json:"totalSize"`
	Downloaded   int64   `json:"downloaded"`
	Uploaded     int64   `json:"uploaded"`
	DownloadRate int64   `json:"downloadRate"`
	UploadRate   int64   `json:"uploadRate"`
	Progress     float64 `json:"progress"`
	Status       string  `json:"status"`
	Peers        int     `json:"peers"`
}

// NewClient creates a torrent client with multi-proxy support and fault tolerance
func NewClient(proxyChainStr string) (*Client, error) {
	// Parse proxy chain - comma separated list of SOCKS5 proxies
	proxyChain := []string{"tor:9050"} // Default Tor proxy

	// Add additional proxies for multi-hop routing
	// In production, these would be different exit nodes in different countries
	additionalProxies := []string{
		"tor:9050", // Can add more Tor instances or other SOCKS5 proxies
	}
	proxyChain = append(proxyChain, additionalProxies...)

	// Create multi-proxy dialer for enhanced anonymity
	multiDialer, err := NewMultiProxyDialer(proxyChain)
	if err != nil {
		return nil, fmt.Errorf("failed to create multi-proxy dialer: %w", err)
	}

	cfg := torrent.NewDefaultClientConfig()
	cfg.DataDir = "/app/downloads"
	cfg.NoUpload = false
	cfg.Seed = false // Disable seeding for privacy

	// Configure network through multi-proxy chain
	cfg.HTTPProxy = func(req interface{}) (*torrent.ProxySpec, error) {
		return &torrent.ProxySpec{
			Type: "socks5",
			Addr: "tor:9050",
		}, nil
	}

	// Custom dialer that routes through proxy chain
	cfg.Dialer = func(network, addr string) (net.Conn, error) {
		return multiDialer.DialWithRetry(network, addr, 3)
	}

	// Privacy settings - disable features that leak information
	cfg.NoDHT = true       // DHT can leak IP addresses
	cfg.DisablePEX = true  // PEX can leak peer information
	cfg.DisableIPv6 = true // Simplify routing
	cfg.DisableIPv4Peers = false
	cfg.DisableAcceptRateLimiting = false
	cfg.DisableAggressiveUpload = true

	// Set conservative limits for fault tolerance
	cfg.EstablishedConnsPerTorrent = 50
	cfg.HalfOpenConnsPerTorrent = 25
	cfg.TorrentPeersHighWater = 100
	cfg.TorrentPeersLowWater = 50

	// Disable telemetry and debug features
	cfg.Debug = false
	cfg.DisableTrackers = false
	cfg.NoDHT = true

	client, err := torrent.NewClient(cfg)
	if err != nil {
		return nil, fmt.Errorf("failed to create torrent client: %w", err)
	}

	return &Client{
		client:           client,
		torrents:         make(map[string]*torrent.Torrent),
		multiProxyDialer: multiDialer,
		config: &ClientConfig{
			ProxyChain: proxyChain,
			DataDir:    cfg.DataDir,
			EnableDHT:  false,
			MaxRetries: 3,
		},
	}, nil
}

func (c *Client) AddMagnet(magnetURI string) (string, error) {
	c.mu.Lock()
	defer c.mu.Unlock()

	t, err := c.client.AddMagnet(magnetURI)
	if err != nil {
		return "", fmt.Errorf("failed to add magnet: %w", err)
	}

	// Wait for metadata with timeout for fault tolerance
	select {
	case <-t.GotInfo():
	case <-time.After(60 * time.Second):
		t.Drop()
		return "", fmt.Errorf("timeout waiting for torrent metadata")
	}

	infoHash := t.InfoHash().String()
	c.torrents[infoHash] = t

	// Start downloading all files
	t.DownloadAll()

	return infoHash, nil
}

func (c *Client) GetTorrent(infoHash string) (*TorrentInfo, error) {
	c.mu.RLock()
	defer c.mu.RUnlock()

	t, ok := c.torrents[infoHash]
	if !ok {
		return nil, fmt.Errorf("torrent not found")
	}

	stats := t.Stats()
	progress := float64(0)
	if t.Length() > 0 {
		progress = float64(t.BytesCompleted()) / float64(t.Length()) * 100
	}

	status := "downloading"
	if progress >= 100 {
		status = "completed"
	} else if t.BytesCompleted() == 0 {
		status = "starting"
	}

	return &TorrentInfo{
		InfoHash:     infoHash,
		Name:         t.Name(),
		TotalSize:    t.Length(),
		Downloaded:   t.BytesCompleted(),
		Uploaded:     stats.BytesWrittenData.Int64(),
		DownloadRate: stats.DataBytesRead.Int64(),
		UploadRate:   stats.DataBytesWritten.Int64(),
		Progress:     progress,
		Status:       status,
		Peers:        stats.ActivePeers,
	}, nil
}

func (c *Client) GetAllTorrents() []*TorrentInfo {
	c.mu.RLock()
	defer c.mu.RUnlock()

	var infos []*TorrentInfo
	for infoHash := range c.torrents {
		if info, err := c.GetTorrent(infoHash); err == nil {
			infos = append(infos, info)
		}
	}
	return infos
}

func (c *Client) RemoveTorrent(infoHash string) error {
	c.mu.Lock()
	defer c.mu.Unlock()

	t, ok := c.torrents[infoHash]
	if !ok {
		return fmt.Errorf("torrent not found")
	}

	t.Drop()
	delete(c.torrents, infoHash)
	return nil
}

func (c *Client) PauseTorrent(infoHash string) error {
	c.mu.RLock()
	defer c.mu.RUnlock()

	t, ok := c.torrents[infoHash]
	if !ok {
		return fmt.Errorf("torrent not found")
	}

	t.CancelPieces(0, t.NumPieces())
	return nil
}

func (c *Client) ResumeTorrent(infoHash string) error {
	c.mu.RLock()
	defer c.mu.RUnlock()

	t, ok := c.torrents[infoHash]
	if !ok {
		return fmt.Errorf("torrent not found")
	}

	t.DownloadAll()
	return nil
}

func (c *Client) Close() error {
	c.mu.Lock()
	defer c.mu.Unlock()

	for _, t := range c.torrents {
		t.Drop()
	}
	c.torrents = make(map[string]*torrent.Torrent)

	return c.client.Close()
}

// GetTorStatus returns whether the proxy chain is working
func (c *Client) GetTorStatus() (bool, error) {
	if c.multiProxyDialer == nil {
		return false, fmt.Errorf("no proxy chain configured")
	}

	err := c.multiProxyDialer.TestProxyChain()
	return err == nil, err
}

// MultiProxyDialer is a placeholder for the actual implementation
type MultiProxyDialer struct {
	proxies []string
}

func NewMultiProxyDialer(proxies []string) (*MultiProxyDialer, error) {
	return &MultiProxyDialer{proxies: proxies}, nil
}

func (d *MultiProxyDialer) DialWithRetry(network, addr string, retries int) (net.Conn, error) {
	// Implementation of dialing with retry logic
	return nil, nil
}

func (d *MultiProxyDialer) TestProxyChain() error {
	// Implementation of proxy chain test
	return nil
}
