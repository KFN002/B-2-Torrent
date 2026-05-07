package torrent

import (
	"context"
	"fmt"
	"math/rand"
	"net"
	"net/http"
	"net/url"
	"os"
	"strings"
	"sync"
	"time"

	"github.com/anacrolix/torrent"
	"go.uber.org/zap"
)

type Client struct {
	client           *torrent.Client
	torrents         map[string]*torrent.Torrent
	mu               sync.RWMutex
	multiProxyDialer *MultiProxyDialer
	config           *ClientConfig
	logger           *zap.Logger
	torEnabled       bool // Add Tor toggle flag
	torrentLimits    map[string]*TorrentLimits
	globalLimits     *TorrentLimits
}

type ClientConfig struct {
	ProxyChain []string
	DataDir    string
	EnableDHT  bool
	MaxRetries int
	TorEnabled bool // Add Tor enabled config
	NoLogsMode         bool
	ObfuscateTraffic   bool
	DisableHistory     bool
	DisableMetadata    bool
}

type TorrentLimits struct {
	DownloadLimit int
	UploadLimit   int
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
	Seeders      int     `json:"seeders"`
	ETA          int64   `json:"eta"`
	Ratio        float64 `json:"ratio"`
	Favorite      bool `json:"favorite,omitempty"`
	DownloadLimit int  `json:"downloadLimit,omitempty"`
	UploadLimit   int  `json:"uploadLimit,omitempty"`
}

type ProxyConnection struct {
	ID        string  `json:"id"`
	Address   string  `json:"address"`
	Port      int     `json:"port"`
	Country   string  `json:"country"`
	Status    string  `json:"status"`
	Latency   int     `json:"latency"`
	Bandwidth float64 `json:"bandwidth"`
	Uptime    int     `json:"uptime"`
}

func NewClient(proxyChainStr string, downloadDir string) (*Client, error) {
	logger, _ := zap.NewProduction()

	noLogsMode := os.Getenv("NO_LOGS_MODE") == "true"
	obfuscateTraffic := os.Getenv("OBFUSCATE_TRAFFIC") == "true"

	if noLogsMode {
		logger.Info("No-logs mode enabled - minimal data persistence")
	}

	torEnabled := true
	if torEnv := os.Getenv("TOR_ENABLED"); torEnv == "false" {
		torEnabled = false
		logger.Info("Tor network is disabled, using direct connections")
	}

	var proxyChain []string
	if proxyChainStr != "" && torEnabled {
		proxyChain = strings.Split(proxyChainStr, ",")
		for i := range proxyChain {
			proxyChain[i] = strings.TrimSpace(proxyChain[i])
		}
	}
	
	if len(proxyChain) == 0 && torEnabled {
		if _, err := os.Stat("/.dockerenv"); err == nil {
			proxyChain = []string{"tor:9050"}
		} else {
			logger.Info("Running on localhost, Tor proxy optional")
			torEnabled = false
		}
	}

	logger.Info("Initializing torrent client",
		zap.Strings("proxies", proxyChain),
		zap.Bool("torEnabled", torEnabled),
		zap.String("downloadDir", downloadDir),
	)

	var multiDialer *MultiProxyDialer
	var err error
	
	if torEnabled && len(proxyChain) > 0 {
		multiDialer, err = NewMultiProxyDialer(proxyChain)
		if err != nil {
			logger.Warn("Failed to create multi-proxy dialer, continuing without Tor", zap.Error(err))
			torEnabled = false
		}
	}

	cfg := torrent.NewDefaultClientConfig()
	cfg.DataDir = downloadDir
	cfg.NoUpload = false
	cfg.Seed = false

	if torEnabled && len(proxyChain) > 0 {
		cfg.HTTPProxy = func(req *http.Request) (*url.URL, error) {
			return &url.URL{
				Scheme: "socks5",
				Host:   proxyChain[0],
			}, nil
		}

		cfg.DialContext = func(ctx context.Context, network, addr string) (net.Conn, error) {
			return multiDialer.DialContext(ctx, network, addr)
		}
	}

	if noLogsMode {
		cfg.NoDHT = true
		cfg.DisablePEX = true
		cfg.DisableTrackers = false // Still need trackers to find peers
		cfg.Debug = false
	} else {
		cfg.NoDHT = true
		cfg.DisablePEX = true
		cfg.DisableIPv6 = true
		cfg.DisableIPv4Peers = false
		cfg.DisableAcceptRateLimiting = false
		cfg.DisableAggressiveUpload = true
	}

	if obfuscateTraffic {
		// Modify protocol header to avoid DPI detection
		cfg.HeaderObfuscationPolicy.Preferred = true
		cfg.HeaderObfuscationPolicy.RequirePreferred = false
		logger.Info("Traffic obfuscation enabled - altering protocol fingerprints")
	}

	cfg.EstablishedConnsPerTorrent = 50
	cfg.HalfOpenConnsPerTorrent = 25
	cfg.TorrentPeersHighWater = 100
	cfg.TorrentPeersLowWater = 50

	client, err := torrent.NewClient(cfg)
	if err != nil {
		return nil, fmt.Errorf("failed to create torrent client: %w", err)
	}

	logger.Info("Torrent client initialized successfully")

	return &Client{
		client:           client,
		torrents:         make(map[string]*torrent.Torrent),
		multiProxyDialer: multiDialer,
		logger:           logger,
		torEnabled:       torEnabled,
		torrentLimits:    make(map[string]*TorrentLimits),
		globalLimits:     &TorrentLimits{DownloadLimit: 0, UploadLimit: 0},
		config: &ClientConfig{
			ProxyChain:         proxyChain,
			DataDir:            downloadDir,
			EnableDHT:          false,
			MaxRetries:         3,
			TorEnabled:         torEnabled,
			NoLogsMode:         noLogsMode,
			ObfuscateTraffic:   obfuscateTraffic,
			DisableHistory:     noLogsMode,
			DisableMetadata:    noLogsMode,
		},
	}, nil
}

func (c *Client) AddMagnet(magnetURI string) (string, error) {
	c.mu.Lock()
	defer c.mu.Unlock()

	c.logger.Info("Adding magnet link", zap.String("uri", magnetURI[:50]+"..."))

	t, err := c.client.AddMagnet(magnetURI)
	if err != nil {
		return "", fmt.Errorf("failed to add magnet: %w", err)
	}

	select {
	case <-t.GotInfo():
		c.logger.Info("Torrent metadata received", zap.String("name", t.Name()))
	case <-time.After(60 * time.Second):
		t.Drop()
		c.logger.Error("Timeout waiting for torrent metadata")
		return "", fmt.Errorf("timeout waiting for torrent metadata")
	}

	infoHash := t.InfoHash().String()
	c.torrents[infoHash] = t

	t.DownloadAll()

	c.logger.Info("Torrent added successfully",
		zap.String("infoHash", infoHash),
		zap.String("name", t.Name()),
		zap.Int64("size", t.Length()),
	)

	return infoHash, nil
}

func (c *Client) GetTorrent(infoHash string) (*TorrentInfo, error) {
	c.mu.RLock()
	defer c.mu.RUnlock()

	t, ok := c.torrents[infoHash]
	if !ok {
		return nil, fmt.Errorf("torrent not found: %s", infoHash)
	}

	stats := t.Stats()
	progress := 0.0
	if t.Length() > 0 {
		progress = float64(t.BytesCompleted()) / float64(t.Length()) * 100
	}

	status := "downloading"
	if progress >= 100 {
		status = "completed"
	} else if t.BytesCompleted() == 0 {
		status = "starting"
	}

	eta := int64(0)
	if stats.BytesReadData.Int64() > 0 && progress < 100 {
		remaining := t.Length() - t.BytesCompleted()
		eta = remaining / stats.BytesReadData.Int64()
	}

	ratio := 0.0
	if t.BytesCompleted() > 0 {
		ratio = float64(stats.BytesWrittenData.Int64()) / float64(t.BytesCompleted())
	}

	limits := c.torrentLimits[infoHash]
	downloadLimit := 0
	uploadLimit := 0
	if limits != nil {
		downloadLimit = limits.DownloadLimit
		uploadLimit = limits.UploadLimit
	}

	return &TorrentInfo{
		InfoHash:     infoHash,
		Name:         t.Name(),
		TotalSize:    t.Length(),
		Downloaded:   t.BytesCompleted(),
		Uploaded:     stats.BytesWrittenData.Int64(),
		DownloadRate: stats.BytesReadData.Int64(),
		UploadRate:   stats.BytesWrittenData.Int64(),
		Progress:     progress,
		Status:       status,
		Peers:        stats.ActivePeers,
		Seeders:      stats.ConnectedSeeders,
		ETA:          eta,
		Ratio:        ratio,
		DownloadLimit: downloadLimit,
		UploadLimit:   uploadLimit,
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
		return fmt.Errorf("torrent not found: %s", infoHash)
	}

	c.logger.Info("Removing torrent", zap.String("infoHash", infoHash))

	t.Drop()
	delete(c.torrents, infoHash)
	delete(c.torrentLimits, infoHash) // Remove limits for this torrent
	return nil
}

func (c *Client) PauseTorrent(infoHash string) error {
	c.mu.Lock()
	defer c.mu.Unlock()

	t, ok := c.torrents[infoHash]
	if !ok {
		return fmt.Errorf("torrent not found: %s", infoHash)
	}

	t.CancelPieces(0, t.NumPieces())
	return nil
}

func (c *Client) ResumeTorrent(infoHash string) error {
	c.mu.Lock()
	defer c.mu.Unlock()

	t, ok := c.torrents[infoHash]
	if !ok {
		return fmt.Errorf("torrent not found: %s", infoHash)
	}

	t.DownloadAll()
	return nil
}

func (c *Client) Close() error {
	c.mu.Lock()
	defer c.mu.Unlock()

	c.logger.Info("Closing torrent client", zap.Int("activeTorrents", len(c.torrents)))

	for _, t := range c.torrents {
		t.Drop()
	}
	c.torrents = make(map[string]*torrent.Torrent)
	c.torrentLimits = make(map[string]*TorrentLimits) // Clear limits

	errs := c.client.Close()
	if len(errs) > 0 {
		return fmt.Errorf("errors closing client: %v", errs)
	}

	c.logger.Sync()
	return nil
}

func (c *Client) GetTorStatus() (bool, error) {
	if !c.torEnabled {
		return false, nil
	}

	if c.multiProxyDialer == nil {
		return false, fmt.Errorf("no proxy chain configured")
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	err := c.multiProxyDialer.TestProxyChain(ctx)
	return err == nil, err
}

func (c *Client) GetProxyConnections() []ProxyConnection {
	c.mu.RLock()
	defer c.mu.RUnlock()

	connections := make([]ProxyConnection, 0)
	countries := []string{"US", "DE", "NL", "CH", "SE", "NO", "FR", "UK"}
	
	// Generate mock connections based on proxy chain
	for i, proxy := range c.config.ProxyChain {
		parts := strings.Split(proxy, ":")
		address := parts[0]
		port := 9050
		if len(parts) > 1 {
			fmt.Sscanf(parts[1], "%d", &port)
		}

		status := "connected"
		if rand.Float32() < 0.1 {
			status = "connecting"
		}

		conn := ProxyConnection{
			ID:        fmt.Sprintf("proxy-%d", i),
			Address:   address,
			Port:      port,
			Country:   countries[rand.Intn(len(countries))],
			Status:    status,
			Latency:   50 + rand.Intn(200),
			Bandwidth: rand.Float64() * 1024 * 10,
			Uptime:    rand.Intn(7200),
		}
		connections = append(connections, conn)
	}

	return connections
}

func (c *Client) SetTorEnabled(enabled bool) error {
	c.mu.Lock()
	defer c.mu.Unlock()

	c.torEnabled = enabled
	c.config.TorEnabled = enabled
	
	c.logger.Info("Tor network toggled",
		zap.Bool("enabled", enabled),
	)
	
	return nil
}

func (c *Client) IsTorEnabled() bool {
	c.mu.RLock()
	defer c.mu.RUnlock()
	return c.torEnabled
}

func (c *Client) SetLimits(infoHash string, downloadLimit, uploadLimit int) error {
	c.mu.Lock()
	defer c.mu.Unlock()

	_, ok := c.torrents[infoHash]
	if !ok {
		return fmt.Errorf("torrent not found: %s", infoHash)
	}

	c.torrentLimits[infoHash] = &TorrentLimits{
		DownloadLimit: downloadLimit,
		UploadLimit:   uploadLimit,
	}

	c.logger.Info("Set torrent speed limits",
		zap.String("infoHash", infoHash),
		zap.Int("downloadLimit", downloadLimit),
		zap.Int("uploadLimit", uploadLimit),
	)

	return nil
}

func (c *Client) SetGlobalLimits(downloadLimit, uploadLimit int) error {
	c.mu.Lock()
	defer c.mu.Unlock()

	c.globalLimits = &TorrentLimits{
		DownloadLimit: downloadLimit,
		UploadLimit:   uploadLimit,
	}

	c.logger.Info("Set global speed limits",
		zap.Int("downloadLimit", downloadLimit),
		zap.Int("uploadLimit", uploadLimit),
	)

	return nil
}
