# B2 Standalone Applications

This document describes the standalone desktop applications included in the B-2-Torrent project.

## 1. B2 VPN Client

### Overview
Local-first VPN/proxy client for laptops and PCs. Proxy mode configures local HTTP/SOCKS proxies for proxy-aware apps; TUN mode can route device traffic through `sing-box` or a custom helper.

### Features
- **Routing Modes**: System proxy mode and helper-backed TUN mode
- **Protocol Support**: VLESS, VMess, Shadowsocks, Outline-style keys, SOCKS5, HTTPS proxy, Tor SOCKS
- **Kill-Switch**: System-proxy block mode for supported desktop proxy settings
- **DNS Controls**: Applies configured DNS servers where the OS supports it
- **IPv6 Controls**: Privacy identifiers or disable mode where the OS supports it
- **Auto-Reconnect**: Automatically reconnects if connection drops
- **Network Sharing**: Share VPN connection with other devices on your network
- **Secret Safety**: No saved secrets by default; optional OS-keychain-backed saved secrets
- **Transport Hardening**: Weak Shadowsocks methods and plaintext HTTP upstreams blocked by default

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
4. Proxy-aware traffic routes through the client. Use TUN mode for device-level routing.

#### Manual Server Configuration
1. Click "Add Server"
2. Enter server details (name, host, port, UUID)
3. Select protocol type
4. Click "Save"
5. Click "Connect" on the server

### Settings

#### Kill-Switch
When enabled in `system-proxy` mode, points supported desktop proxy settings at a local blackhole if monitoring detects a dropped connection. Kernel-level firewall blocking requires an OS firewall/TUN helper outside the Electron app.

**Recommendation**: Keep enabled and use TUN mode or an OS firewall profile when your threat model requires device-level enforcement.

#### DNS Controls
Applies configured DNS servers on supported operating systems. In TUN mode, the generated helper config includes the configured DNS servers.

**Recommendation**: Always keep enabled.

#### IPv6 Controls
Can enable privacy identifiers or disable IPv6 where supported by the operating system.

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

- **Windows**: Registry-based desktop proxy configuration; TUN depends on helper privileges
- **macOS**: `networksetup` desktop proxy configuration; TUN depends on helper privileges
- **Linux**: GNOME `gsettings` proxy support where available; TUN depends on helper privileges

### Security Controls

- No app telemetry or analytics
- No server secrets saved unless enabled
- Saved secrets use the OS keychain/keyring through Electron `safeStorage`
- TLS 1.3 minimum by default for HTTPS/TLS upstreams
- Strong Shadowsocks allowlist: `2022-blake3-aes-256-gcm`, `2022-blake3-chacha20-poly1305`, `aes-256-gcm`, `chacha20-ietf-poly1305`, `xchacha20-ietf-poly1305`
- Private/loopback destination blocking
- Auto reconnect and system-proxy kill switch mode

---

## 2. B2 Secure Browser

### Overview
Privacy-focused desktop browser with ephemeral sessions, tracker blocking, proxy support, and anti-fingerprinting mitigations.

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
- **No Plugins**: JavaScript-only for a smaller attack surface

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
4. Browse with reduced local traces and network-layer privacy from your configured proxy

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

Privacy settings are enabled by default:

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

### Security Controls

- No app telemetry or analytics
- Ephemeral browser sessions with history/cache/cookies cleared on exit
- Tracker, ad, malware, social widget, and known fingerprinting-script blocking
- Canvas, WebGL, audio, timezone, screen, and hardware fingerprinting mitigations
- WebRTC leak-surface reduction
- DNS route follows the configured proxy/VPN/TUN path
- Automatic data clearing every 30 minutes
- Data clearing on exit

---

## 3. B2 Safe File Viewer

### Overview
Standalone local file viewer for inspecting files before opening them in trusted applications. It focuses on metadata, hashes, safe previews, risk indicators, and explicit deletion controls.

### Features
- **Native File Picker**: File operations are scoped to files opened in the current session
- **Streaming SHA-256**: Hashes large files in the main process
- **Metadata Inspection**: Size, path, mode, modified time, signature, entropy, and hex sample
- **Safe Preview Modes**: Images, audio, and video preview directly; active documents are shown as text or hex
- **Risk Indicators**: Flags executable signatures, double extensions, unknown signatures, and high-entropy packed/encrypted samples
- **Safe Delete**: Move to OS trash or overwrite-then-unlink after exact filename confirmation
- **No History**: No persistent cache, no telemetry, no recent-file database
- **Renderer Isolation**: Node integration disabled, context isolation and sandbox enabled

### Quick Start

```bash
cd file-viewer
npm install
npm start
```

### Linux Packages

```bash
cd file-viewer
npm run build:linux
```

Outputs are configured for AppImage, `.deb`, and `.tar.gz`. RPM builds are available with `npm run build:linux:rpm` on systems with `rpmbuild`.

### Deletion Notes

OS trash is recoverable. Overwrite-then-unlink is best effort and is most useful on simple magnetic storage without snapshots. SSD wear leveling, copy-on-write filesystems, journaling, snapshots, backups, and cloud sync can keep older data outside app control. For sensitive files, use encrypted storage and destroy keys when possible.

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

### Safe File Viewer

```bash
cd file-viewer

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

These applications reduce common local tracking, proxy, and routing risks when configured correctly, but no client can guarantee anonymity against every VPN provider, Tor exit, ISP, endpoint compromise, malware, or OS-level leak.

- Always enable Kill-Switch in VPN client
- Never disable anti-fingerprinting in browser
- Clear data regularly
- Use Tor or a trusted VPN route when your threat model requires network-layer privacy
- Combine the browser and VPN client for layered protection, then verify the route with independent leak tests

**Remember**: These tools are standalone and self-contained. They do not depend on the main B-2-Torrent application and can be distributed separately.
