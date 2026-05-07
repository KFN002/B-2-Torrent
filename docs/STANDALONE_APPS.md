# B2 Standalone Applications

This document describes the two standalone desktop applications included in the B-2-Torrent project.

## 1. B2 VPN Client

### Overview
System-wide VPN client that routes ALL device traffic through encrypted tunnels with military-grade security.

### Features
- **System-Wide Routing**: All applications on your device use the VPN automatically
- **Protocol Support**: VLESS, VMess, Shadowsocks, Outline, Tor
- **Kill-Switch**: Blocks all network traffic if VPN disconnects (prevents IP leaks)
- **DNS Leak Protection**: Routes DNS queries through encrypted tunnel
- **IPv6 Blocking**: Prevents IPv6 leaks
- **Auto-Reconnect**: Automatically reconnects if connection drops
- **Split Tunneling**: Route specific apps through VPN (coming soon)
- **Network Sharing**: Share VPN connection with other devices on your network
- **Zero Logs**: No connection logs, no activity logs, no metadata

### Quick Start

#### Installation
```bash
cd vpn-client
npm install
npm run build
```

#### Portable Usage
```bash
npm start
```

#### Connect via Link
1. Open B2 VPN Client
2. Paste your VLESS/VMess link in the "Quick Connect" field
3. Click "Connect via Link"
4. All device traffic is now routed through VPN

#### Manual Server Configuration
1. Click "Add Server"
2. Enter server details (name, host, port, UUID)
3. Select protocol type
4. Click "Save"
5. Click "Connect" on the server

### Settings

#### Kill-Switch
When enabled, blocks ALL network traffic if VPN disconnects. This prevents your real IP from being exposed.

**Recommendation**: Always keep enabled for maximum security.

#### DNS Leak Protection
Routes all DNS queries through the VPN tunnel using secure DNS servers (1.1.1.1).

**Recommendation**: Always keep enabled.

#### IPv6 Blocking
Disables IPv6 completely to prevent IPv6 leaks.

**Recommendation**: Always keep enabled unless you specifically need IPv6.

#### Auto-Reconnect
Automatically attempts to reconnect if VPN connection drops.

**Recommendation**: Enable for convenience, but pair with Kill-Switch for security.

### Network Sharing

The VPN client creates local proxy servers that other devices can use:

- **HTTP/HTTPS Proxy**: `http://[your-ip]:8888`
- **SOCKS5 Proxy**: `socks5://[your-ip]:8889`

Configure other devices to use these proxies to share your VPN connection.

### Platform Support

- **Windows**: Full support with registry-based proxy configuration
- **macOS**: Full support with networksetup commands
- **Linux**: Full support with iptables/gsettings

### Security Guarantees

- ✅ Zero logs policy - Nothing is recorded
- ✅ Kill-switch prevents IP leaks
- ✅ DNS leak protection
- ✅ IPv6 leak protection
- ✅ Encrypted data transmission
- ✅ No metadata collection
- ✅ Automatic data clearing on exit

---

## 2. B2 Secure Browser

### Overview
Ultra-secure, anonymous web browser with zero logs, complete privacy, and advanced anti-fingerprinting.

### Features
- **Zero Logs**: No history, no cache, no cookies, no traces
- **Advanced Ad Blocking**: Blocks ads, trackers, malware, social widgets
- **Anti-Fingerprinting**: Protects against canvas, WebGL, audio, and hardware fingerprinting
- **Automatic Data Clearing**: Clears all data every 30 minutes and on exit
- **Secure Headers**: HSTS, CSP, X-Frame-Options, and more
- **WebRTC Leak Protection**: Prevents IP leaks through WebRTC
- **Timezone Spoofing**: Always reports UTC timezone
- **Screen Resolution Spoofing**: Reports common 1920x1080 resolution
- **Hardware Spoofing**: Spoofs CPU cores, memory, and platform
- **Privacy Search Engines**: Quick access to DuckDuckGo, Startpage, SearX, Brave
- **Tor/VPN Integration**: Route browser traffic through Tor or VPN
- **No Plugins**: JavaScript-only for maximum security

### Quick Start

#### Installation
```bash
cd browser
npm install
npm run build
```

#### Portable Usage
```bash
npm start
```

### Usage

#### Normal Browsing
1. Open B2 Secure Browser
2. Enter URL or search term in address bar
3. Press Enter or click Go
4. Browse anonymously with zero traces

#### Search Engines
Click any search engine card on the welcome screen:
- **DuckDuckGo**: Privacy-focused search
- **Startpage**: Anonymous Google results
- **SearX**: Decentralized meta-search
- **Brave Search**: Independent, private search

#### Proxy Configuration
1. Click "Proxy" button in toolbar
2. Enable proxy
3. Select type (HTTP/HTTPS or SOCKS5)
4. Enter host and port
5. Click "Save"

**Tor Integration**: Select SOCKS5, host `127.0.0.1`, port `9050`  
**VPN Integration**: Select HTTP, host `127.0.0.1`, port `8888`

### Settings

All settings are enabled by default for maximum security:

- **Block Ads**: Blocks advertising networks and banners
- **Block Trackers**: Blocks analytics, telemetry, and tracking pixels
- **Block Malware**: Blocks known malware, cryptominers, and malicious sites
- **Block Social**: Blocks social media widgets and share buttons
- **Block Fingerprinting**: Blocks fingerprinting scripts and libraries
- **Clear on Exit**: Automatically clears all data when browser closes

### Privacy Features

#### Canvas Fingerprinting Protection
Injects random noise into canvas data to prevent tracking.

#### WebGL Fingerprinting Protection
Returns generic GPU/vendor information instead of real hardware.

#### Audio Context Fingerprinting Protection
Adds random variations to audio output to prevent audio fingerprinting.

#### Timezone Spoofing
Always reports UTC (GMT+0) regardless of actual timezone.

#### Screen Resolution Spoofing
Reports 1920x1080 resolution regardless of actual screen size.

#### Hardware Spoofing
Reports generic hardware specs (4 CPU cores, 8GB RAM, Win32 platform).

### Block Statistics

Real-time statistics showing blocked content:
- Total items blocked
- Ads blocked
- Trackers blocked
- Malware blocked

### Platform Support

- **Windows**: Full support
- **macOS**: Full support
- **Linux**: Full support

### Security Guarantees

- ✅ Zero logs - Nothing is recorded, ever
- ✅ No history - Browsing history never saved
- ✅ No cache - All cached data cleared continuously
- ✅ No cookies - Session-only, cleared on exit
- ✅ Anti-fingerprinting - Advanced protection against all fingerprinting techniques
- ✅ Secure headers - HSTS, CSP, X-Frame-Options
- ✅ WebRTC leak protection
- ✅ DNS leak protection (when used with VPN)
- ✅ Automatic data clearing every 30 minutes
- ✅ Complete data wipe on exit

---

## Integration

### Using Browser with VPN

1. Start B2 VPN Client and connect to a server
2. Start B2 Secure Browser
3. Click "Proxy" button
4. Enable proxy with HTTP type, host `127.0.0.1`, port `8888`
5. All browser traffic now routed through VPN

### Using Browser with Tor

1. Ensure Tor is running on your system (port 9050)
2. Start B2 Secure Browser
3. Click "Proxy" button
4. Enable proxy with SOCKS5 type, host `127.0.0.1`, port `9050`
5. All browser traffic now routed through Tor network

---

## Building Installers

### VPN Client

```bash
cd vpn-client

# Windows
npm run build:win

# macOS
npm run build:mac

# Linux
npm run build:linux
```

### Browser

```bash
cd browser

# Windows
npm run build:win

# macOS
npm run build:mac

# Linux
npm run build:linux
```

---

## License

Both applications are for **Personal Use Only**. Commercial use requires a license.

---

## Support

For issues or questions:
1. Check README.md in each app directory
2. Review security documentation
3. Open issue on GitHub

---

## Security Notice

⚠️ **These applications provide maximum anonymity and security when used correctly.**

- Always enable Kill-Switch in VPN client
- Never disable anti-fingerprinting in browser
- Clear data regularly
- Use with Tor for maximum anonymity
- Combine both apps for complete protection

**Remember**: These tools are standalone and self-contained. They do not depend on the main B-2-Torrent application and can be distributed separately.
