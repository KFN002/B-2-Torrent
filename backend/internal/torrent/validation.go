package torrent

import (
	"fmt"
	"net"
	"net/url"
	"os"
	"regexp"
	"strings"
)

const MaxMagnetURILength = 8192

var infoHashPattern = regexp.MustCompile(`(?i)^([a-f0-9]{40}|[a-f0-9]{64}|[a-z2-7]{32})$`)

type MagnetValidationPolicy struct {
	TorEnabled       bool
	AllowUDPTrackers bool
}

func IsValidInfoHash(value string) bool {
	return infoHashPattern.MatchString(strings.TrimSpace(value))
}

func ValidateMagnetURI(raw string, torEnabled bool) error {
	return ValidateMagnetURIWithPolicy(raw, MagnetValidationPolicy{
		TorEnabled:       torEnabled,
		AllowUDPTrackers: true,
	})
}

func ValidateMagnetURIWithPolicy(raw string, policy MagnetValidationPolicy) error {
	magnetURI := strings.TrimSpace(raw)
	if magnetURI == "" {
		return fmt.Errorf("magnet URI is required")
	}
	if len(magnetURI) > MaxMagnetURILength {
		return fmt.Errorf("magnet URI is too large")
	}

	parsed, err := url.Parse(magnetURI)
	if err != nil || !strings.EqualFold(parsed.Scheme, "magnet") {
		return fmt.Errorf("invalid magnet URI")
	}

	values := parsed.Query()
	if !hasValidBtih(values["xt"]) {
		return fmt.Errorf("magnet URI must include a valid btih info hash")
	}

	for _, tracker := range values["tr"] {
		if err := validateMagnetEndpoint("tracker", tracker, policy); err != nil {
			return err
		}
	}

	for _, key := range []string{"ws", "as", "xs"} {
		for _, endpoint := range values[key] {
			if looksLikeRemoteURL(endpoint) {
				return fmt.Errorf("remote source and web seed URLs are disabled for torrent safety")
			}
		}
	}

	return nil
}

func hasValidBtih(values []string) bool {
	for _, value := range values {
		lower := strings.ToLower(strings.TrimSpace(value))
		if !strings.HasPrefix(lower, "urn:btih:") {
			continue
		}
		if IsValidInfoHash(strings.TrimPrefix(lower, "urn:btih:")) {
			return true
		}
	}
	return false
}

func looksLikeRemoteURL(value string) bool {
	parsed, err := url.Parse(strings.TrimSpace(value))
	return err == nil && parsed.Scheme != "" && parsed.Hostname() != ""
}

func validateMagnetEndpoint(kind string, value string, policy MagnetValidationPolicy) error {
	endpoint := strings.TrimSpace(value)
	if endpoint == "" {
		return nil
	}

	parsed, err := url.Parse(endpoint)
	if err != nil || parsed.Scheme == "" || parsed.Hostname() == "" {
		return fmt.Errorf("invalid %s URL in magnet URI", kind)
	}

	scheme := strings.ToLower(parsed.Scheme)
	if scheme != "udp" && scheme != "http" && scheme != "https" {
		return fmt.Errorf("unsupported %s URL scheme %q", kind, scheme)
	}
	if scheme == "udp" && !policy.AllowUDPTrackers {
		return fmt.Errorf("UDP trackers are blocked while IP or DNS obfuscation is enabled")
	}

	host := strings.ToLower(strings.Trim(parsed.Hostname(), "[]"))
	if host == "" || isPrivateOrLocalHost(host) {
		return fmt.Errorf("%s points to a private or loopback host", kind)
	}
	if strings.HasSuffix(host, ".onion") && !policy.TorEnabled {
		return fmt.Errorf(".onion trackers require Tor to be enabled")
	}
	if scheme == "http" && !policy.TorEnabled && os.Getenv("ALLOW_INSECURE_TRACKERS") != "true" {
		return fmt.Errorf("plain HTTP trackers are blocked unless Tor is enabled or ALLOW_INSECURE_TRACKERS=true")
	}

	return nil
}

func isPrivateOrLocalHost(host string) bool {
	if host == "localhost" || strings.HasSuffix(host, ".localhost") || strings.HasSuffix(host, ".local") || strings.HasSuffix(host, ".lan") {
		return true
	}

	ip := net.ParseIP(host)
	if ip == nil {
		return false
	}

	if ip.IsLoopback() || ip.IsPrivate() || ip.IsLinkLocalUnicast() || ip.IsLinkLocalMulticast() || ip.IsUnspecified() {
		return true
	}

	if ip4 := ip.To4(); ip4 != nil {
		return ip4[0] == 0 || ip4[0] >= 224
	}

	return ip.IsMulticast()
}
