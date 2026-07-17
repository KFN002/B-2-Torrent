package torrent

import (
	"context"
	"fmt"
	"net"
	"net/http"
	"net/url"
	"os"
	"strings"
	"sync"
	"time"

	"github.com/anacrolix/dht/v2/krpc"
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
	ProxyChain       []string
	DataDir          string
	EnableDHT        bool
	MaxRetries       int
	TorEnabled       bool // Add Tor enabled config
	NoLogsMode       bool
	ObfuscateTraffic bool
	IPObfuscation    bool
	DNSObfuscation   bool
	DHTInvisibility  bool
	DisableSharing   bool
	DisableHistory   bool
	DisableMetadata  bool
}

type TorrentLimits struct {
	DownloadLimit int
	UploadLimit   int
}

type TorrentInfo struct {
	ID            string  `json:"id"`
	InfoHash      string  `json:"infoHash"`
	Name          string  `json:"name"`
	Size          int64   `json:"size"`
	TotalSize     int64   `json:"totalSize"`
	Downloaded    int64   `json:"downloaded"`
	Uploaded      int64   `json:"uploaded"`
	DownloadSpeed int64   `json:"downloadSpeed"`
	DownloadRate  int64   `json:"downloadRate"`
	UploadSpeed   int64   `json:"uploadSpeed"`
	UploadRate    int64   `json:"uploadRate"`
	Progress      float64 `json:"progress"`
	Status        string  `json:"status"`
	Peers         int     `json:"peers"`
	Seeders       int     `json:"seeders"`
	ETA           int64   `json:"eta"`
	Ratio         float64 `json:"ratio"`
	Favorite      bool    `json:"favorite,omitempty"`
	DownloadLimit int     `json:"downloadLimit,omitempty"`
	UploadLimit   int     `json:"uploadLimit,omitempty"`
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

type PrivacyStatus struct {
	IPObfuscation              bool `json:"ipObfuscation"`
	DNSObfuscation             bool `json:"dnsObfuscation"`
	DHTInvisibility            bool `json:"dhtInvisibility"`
	SharingDisabled            bool `json:"sharingDisabled"`
	PeerExchangeDisabled       bool `json:"peerExchangeDisabled"`
	InboundConnectionsDisabled bool `json:"inboundConnectionsDisabled"`
	DirectPeerDialingDisabled  bool `json:"directPeerDialingDisabled"`
	UDPTrackersBlocked         bool `json:"udpTrackersBlocked"`
	ProxyRequired              bool `json:"proxyRequired"`
	ProxyAvailable             bool `json:"proxyAvailable"`
	NoLogsMode                 bool `json:"noLogsMode"`
	TrafficObfuscation         bool `json:"trafficObfuscation"`
}

func NewClient(proxyChainStr string, downloadDir string) (*Client, error) {
	logger, _ := zap.NewProduction()

	noLogsMode := envBoolDefault("NO_LOGS_MODE", false)
	obfuscateTraffic := envBoolDefault("OBFUSCATE_TRAFFIC", false)
	ipObfuscation := envBoolDefault("IP_OBFUSCATION", false)
	dnsObfuscation := envBoolDefault("DNS_OBFUSCATION", false)
	dhtInvisibility := envBoolDefault("DHT_INVISIBILITY", true) || noLogsMode
	disableSharing := envBoolDefault("DISABLE_SHARING", true) || noLogsMode

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
	cfg.NoUpload = disableSharing
	cfg.Seed = false
	cfg.NoDHT = dhtInvisibility
	cfg.PeriodicallyAnnounceTorrentsToDht = !dhtInvisibility
	cfg.DisablePEX = dhtInvisibility
	cfg.DisableUTP = dhtInvisibility || ipObfuscation
	cfg.DisableWebtorrent = true
	cfg.DisableWebseeds = true
	cfg.NoDefaultPortForwarding = true
	cfg.DisableIPv6 = ipObfuscation
	cfg.DisableAggressiveUpload = true
	if dhtInvisibility {
		cfg.DHTOnQuery = func(query *krpc.Msg, source net.Addr) bool {
			return false
		}
	}

	if torEnabled && len(proxyChain) > 0 {
		cfg.HTTPProxy = func(req *http.Request) (*url.URL, error) {
			return &url.URL{
				Scheme: "socks5",
				Host:   proxyChain[0],
			}, nil
		}

		cfg.HTTPDialContext = func(ctx context.Context, network, addr string) (net.Conn, error) {
			return multiDialer.DialContext(ctx, network, addr)
		}
		cfg.TrackerDialContext = func(ctx context.Context, network, addr string) (net.Conn, error) {
			return multiDialer.DialContext(ctx, network, addr)
		}
		cfg.DialForPeerConns = false
		cfg.AcceptPeerConnections = false
		if dnsObfuscation {
			cfg.LookupTrackerIp = proxyTrackerLookup(multiDialer, logger)
		}
	} else if ipObfuscation {
		cfg.DialForPeerConns = false
		cfg.AcceptPeerConnections = false
		logger.Warn("IP obfuscation requested without an available proxy chain; direct peer traffic is disabled")
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
	if torEnabled && multiDialer != nil {
		client.AddDialer(proxyPeerDialer{network: "tcp", dialer: multiDialer})
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
			ProxyChain:       proxyChain,
			DataDir:          downloadDir,
			EnableDHT:        false,
			MaxRetries:       3,
			TorEnabled:       torEnabled,
			NoLogsMode:       noLogsMode,
			ObfuscateTraffic: obfuscateTraffic,
			IPObfuscation:    ipObfuscation,
			DNSObfuscation:   dnsObfuscation,
			DHTInvisibility:  dhtInvisibility,
			DisableSharing:   disableSharing,
			DisableHistory:   noLogsMode,
			DisableMetadata:  noLogsMode,
		},
	}, nil
}

func envBoolDefault(key string, fallback bool) bool {
	switch strings.ToLower(strings.TrimSpace(os.Getenv(key))) {
	case "1", "true", "yes", "on":
		return true
	case "0", "false", "no", "off":
		return false
	case "":
		return fallback
	default:
		return fallback
	}
}

func proxyTrackerLookup(dialer *MultiProxyDialer, logger *zap.Logger) func(*url.URL) ([]net.IP, error) {
	resolverAddress := strings.TrimSpace(os.Getenv("DNS_OBFUSCATION_RESOLVER"))
	if resolverAddress == "" {
		resolverAddress = "1.1.1.1:53"
	}

	resolver := &net.Resolver{
		PreferGo: true,
		Dial: func(ctx context.Context, network, address string) (net.Conn, error) {
			logger.Debug("Resolving tracker DNS through proxy chain", zap.String("resolver", resolverAddress))
			return dialer.DialContext(ctx, "tcp", resolverAddress)
		},
	}

	return func(trackerURL *url.URL) ([]net.IP, error) {
		host := strings.TrimSpace(trackerURL.Hostname())
		if host == "" {
			return nil, fmt.Errorf("tracker host is empty")
		}
		if ip := net.ParseIP(host); ip != nil {
			if isPrivateOrLocalHost(host) {
				return nil, fmt.Errorf("tracker resolved to private or loopback IP")
			}
			return []net.IP{ip}, nil
		}

		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()

		ips, err := resolver.LookupIP(ctx, "ip", host)
		if err != nil {
			return nil, fmt.Errorf("obfuscated tracker DNS lookup failed: %w", err)
		}

		filtered := ips[:0]
		for _, ip := range ips {
			if !isPrivateOrLocalHost(ip.String()) {
				filtered = append(filtered, ip)
			}
		}
		if len(filtered) == 0 {
			return nil, fmt.Errorf("tracker DNS returned only private or loopback addresses")
		}
		return filtered, nil
	}
}

func (c *Client) AddMagnet(magnetURI string) (string, error) {
	if err := c.ValidateMagnetURI(magnetURI); err != nil {
		return "", err
	}

	c.logger.Info("Adding magnet link")

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
	c.mu.Lock()
	c.torrents[infoHash] = t
	disableSharing := c.config.DisableSharing
	c.mu.Unlock()

	if disableSharing {
		t.DisallowDataUpload()
	}

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
	t, ok := c.torrents[infoHash]
	if !ok {
		c.mu.RUnlock()
		return nil, fmt.Errorf("torrent not found: %s", infoHash)
	}
	limits := c.torrentLimits[infoHash]
	c.mu.RUnlock()

	return c.torrentInfo(infoHash, t, limits), nil
}

func (c *Client) torrentInfo(infoHash string, t *torrent.Torrent, limits *TorrentLimits) *TorrentInfo {
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

	downloadLimit := 0
	uploadLimit := 0
	if limits != nil {
		downloadLimit = limits.DownloadLimit
		uploadLimit = limits.UploadLimit
	}

	return &TorrentInfo{
		ID:            infoHash,
		InfoHash:      infoHash,
		Name:          t.Name(),
		Size:          t.Length(),
		TotalSize:     t.Length(),
		Downloaded:    t.BytesCompleted(),
		Uploaded:      stats.BytesWrittenData.Int64(),
		DownloadSpeed: stats.BytesReadData.Int64(),
		DownloadRate:  stats.BytesReadData.Int64(),
		UploadSpeed:   stats.BytesWrittenData.Int64(),
		UploadRate:    stats.BytesWrittenData.Int64(),
		Progress:      progress,
		Status:        status,
		Peers:         stats.ActivePeers,
		Seeders:       stats.ConnectedSeeders,
		ETA:           eta,
		Ratio:         ratio,
		DownloadLimit: downloadLimit,
		UploadLimit:   uploadLimit,
	}
}

func (c *Client) GetAllTorrents() []*TorrentInfo {
	c.mu.RLock()
	snapshot := make(map[string]struct {
		t      *torrent.Torrent
		limits *TorrentLimits
	}, len(c.torrents))
	for infoHash, t := range c.torrents {
		snapshot[infoHash] = struct {
			t      *torrent.Torrent
			limits *TorrentLimits
		}{t: t, limits: c.torrentLimits[infoHash]}
	}
	c.mu.RUnlock()

	var infos []*TorrentInfo
	for infoHash, item := range snapshot {
		infos = append(infos, c.torrentInfo(infoHash, item.t, item.limits))
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
	// Report configured routes without inventing connection or geolocation data.
	for i, proxy := range c.config.ProxyChain {
		parts := strings.Split(proxy, ":")
		address := parts[0]
		port := 9050
		if len(parts) > 1 {
			fmt.Sscanf(parts[1], "%d", &port)
		}

		conn := ProxyConnection{
			ID:        fmt.Sprintf("proxy-%d", i),
			Address:   address,
			Port:      port,
			Country:   "unknown",
			Status:    "configured",
			Latency:   0,
			Bandwidth: 0,
			Uptime:    0,
		}
		connections = append(connections, conn)
	}

	return connections
}

func (c *Client) SetTorEnabled(enabled bool) error {
	c.mu.Lock()
	defer c.mu.Unlock()

	if enabled == c.torEnabled {
		return nil
	}
	// anacrolix dialers are fixed when the client is created. Pretending to
	// toggle this flag at runtime could expose direct traffic or report a proxy
	// that is not actually in use.
	return fmt.Errorf("changing Tor routing requires an application restart")
}

func (c *Client) IsTorEnabled() bool {
	c.mu.RLock()
	defer c.mu.RUnlock()
	return c.torEnabled
}

func (c *Client) IsTorConnected() bool {
	connected, err := c.GetTorStatus()
	return err == nil && connected
}

func (c *Client) SetNoLogsMode(enabled bool) {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.config.NoLogsMode = enabled
	c.config.DisableHistory = enabled
	c.config.DisableMetadata = enabled
	if enabled {
		c.config.DHTInvisibility = true
		c.config.DisableSharing = true
		go c.applySharingPolicy(true)
	}
}

func (c *Client) SetTrafficObfuscation(enabled bool) {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.config.ObfuscateTraffic = enabled
}

func (c *Client) SetIPObfuscation(enabled bool) bool {
	c.mu.Lock()
	defer c.mu.Unlock()
	if enabled && !(c.torEnabled && len(c.config.ProxyChain) > 0) {
		c.logger.Warn("IP obfuscation requires a configured proxy chain; keeping direct mode setting disabled")
		enabled = false
	}
	c.config.IPObfuscation = enabled
	return enabled
}

func (c *Client) SetDNSObfuscation(enabled bool) bool {
	c.mu.Lock()
	defer c.mu.Unlock()
	if enabled && !(c.torEnabled && len(c.config.ProxyChain) > 0) {
		c.logger.Warn("DNS obfuscation requires a configured proxy chain; keeping direct resolver setting disabled")
		enabled = false
	}
	c.config.DNSObfuscation = enabled
	return enabled
}

func (c *Client) SetDHTInvisibility(enabled bool) {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.config.DHTInvisibility = enabled
	if enabled {
		c.config.EnableDHT = false
	}
}

func (c *Client) SetSharingDisabled(enabled bool) {
	c.mu.Lock()
	c.config.DisableSharing = enabled
	c.mu.Unlock()
	c.applySharingPolicy(enabled)
}

func (c *Client) ValidateMagnetURI(magnetURI string) error {
	c.mu.RLock()
	policy := MagnetValidationPolicy{
		TorEnabled:       c.torEnabled,
		AllowUDPTrackers: !(c.config.IPObfuscation || c.config.DNSObfuscation),
	}
	c.mu.RUnlock()
	return ValidateMagnetURIWithPolicy(magnetURI, policy)
}

func (c *Client) PrivacyStatus() PrivacyStatus {
	c.mu.RLock()
	defer c.mu.RUnlock()
	proxyAvailable := c.torEnabled && len(c.config.ProxyChain) > 0
	return PrivacyStatus{
		IPObfuscation:              c.config.IPObfuscation && proxyAvailable,
		DNSObfuscation:             c.config.DNSObfuscation && proxyAvailable,
		DHTInvisibility:            c.config.DHTInvisibility,
		SharingDisabled:            c.config.DisableSharing,
		PeerExchangeDisabled:       c.config.DHTInvisibility,
		InboundConnectionsDisabled: c.config.IPObfuscation || proxyAvailable,
		DirectPeerDialingDisabled:  c.config.IPObfuscation && !proxyAvailable,
		UDPTrackersBlocked:         c.config.IPObfuscation || c.config.DNSObfuscation,
		ProxyRequired:              c.config.IPObfuscation || c.config.DNSObfuscation,
		ProxyAvailable:             proxyAvailable,
		NoLogsMode:                 c.config.NoLogsMode,
		TrafficObfuscation:         c.config.ObfuscateTraffic,
	}
}

func (c *Client) applySharingPolicy(disabled bool) {
	c.mu.RLock()
	torrents := make([]*torrent.Torrent, 0, len(c.torrents))
	for _, t := range c.torrents {
		torrents = append(torrents, t)
	}
	c.mu.RUnlock()

	for _, t := range torrents {
		if disabled {
			t.DisallowDataUpload()
		} else {
			t.AllowDataUpload()
		}
	}
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
