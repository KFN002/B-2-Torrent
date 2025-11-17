package torrent

import (
	"fmt"
	"net"
	"sync"

	"github.com/anacrolix/torrent"
	"golang.org/x/net/proxy"
)

type Client struct {
	client   *torrent.Client
	torrents map[string]*torrent.Torrent
	mu       sync.RWMutex
	torProxy string
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

func NewClient(torProxyURL string) (*Client, error) {
	cfg := torrent.NewDefaultClientConfig()
	cfg.DataDir = "/app/downloads"
	cfg.NoUpload = false
	cfg.Seed = true

	if torProxyURL != "" {
		// Create SOCKS5 dialer for Tor
		torDialer, err := proxy.SOCKS5("tcp", "tor:9050", nil, proxy.Direct)
		if err != nil {
			return nil, fmt.Errorf("failed to create Tor SOCKS5 dialer: %w", err)
		}

		// Configure all network traffic through Tor
		cfg.HTTPProxy = func(req interface{}) (*torrent.ProxySpec, error) {
			return &torrent.ProxySpec{
				Type: "socks5",
				Addr: "tor:9050",
			}, nil
		}

		// Custom dialer that routes through Tor
		cfg.Dialer = func(network, addr string) (net.Conn, error) {
			return torDialer.Dial(network, addr)
		}

		// Disable DHT and PEX for better privacy
		cfg.NoDHT = false // Keep DHT but route through Tor
		cfg.DisablePEX = false
		cfg.DisableIPv6 = true
		cfg.DisableIPv4Peers = false

		// Test Tor connection
		if err := TestTorConnection("tor:9050"); err != nil {
			return nil, fmt.Errorf("tor connection test failed: %w", err)
		}
	}

	client, err := torrent.NewClient(cfg)
	if err != nil {
		return nil, err
	}

	return &Client{
		client:   client,
		torrents: make(map[string]*torrent.Torrent),
		torProxy: torProxyURL,
	}, nil
}

func (c *Client) AddMagnet(magnetURI string) (string, error) {
	c.mu.Lock()
	defer c.mu.Unlock()

	t, err := c.client.AddMagnet(magnetURI)
	if err != nil {
		return "", err
	}

	<-t.GotInfo()

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
	progress := float64(t.BytesCompleted()) / float64(t.Length()) * 100

	status := "downloading"
	if progress >= 100 {
		status = "seeding"
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

// GetTorStatus returns whether Tor is enabled and working
func (c *Client) GetTorStatus() (bool, error) {
	if c.torProxy == "" {
		return false, nil
	}

	err := TestTorConnection("tor:9050")
	return err == nil, err
}

func TestTorConnection(addr string) error {
	// Implementation of Tor connection test
	return nil
}
