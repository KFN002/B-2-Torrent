# B2 VPN Client - Local VPN/Proxy Client

## Overview

B2 VPN Client is a standalone desktop application for laptops and PCs. It provides a local HTTP/SOCKS proxy mode for proxy-aware apps and a TUN mode through `sing-box` or a custom helper for device-level routing. It supports VLESS, VMess, Shadowsocks, Outline-style Shadowsocks keys, SOCKS5, HTTPS proxy, and Tor SOCKS integration.

## Key Features

### 🌐 Routing Modes
- Proxy mode creates a local HTTP/HTTPS proxy on port `8888`
- Proxy mode creates a local SOCKS5 proxy on port `8889`
- TUN mode routes device traffic through `sing-box` or a configured helper
- Other devices on your network can use your PC as a proxy server when LAN access is enabled

### 🔐 Protocol Support
- **VLESS** - Modern, efficient protocol
- **VMess** - V2Ray protocol
- **Shadowsocks** - Lightweight proxy
- **Outline** - Jigsaw VPN access keys
- **Tor Network** - Anonymous routing

### 🚀 Quick Connect
- Connect via simple link/URI
- Save favorite servers
- One-click connection
- System tray integration

### 📊 Real-Time Monitoring
- Connection status
- Route mode and active endpoint
- Speed monitoring
- Data transfer statistics
- Runtime specs including platform, CPU, memory, Electron, and Node versions

## Installation

### Download Pre-Built Binaries

**Windows:**
```
B2-VPN-Client-1.0.0-win.exe (Installer)
B2-VPN-Client-1.0.0-portable.exe (Portable)
```

**macOS:**
```
B2-VPN-Client-1.0.0-mac.dmg
```

**Linux:**
```
B2-VPN-Client-1.0.0-linux.AppImage (Universal)
B2-VPN-Client-1.0.0-linux.deb (Debian/Ubuntu)
B2-VPN-Client-1.0.0-linux.rpm (Fedora/RHEL)
```

### Build from Source

```bash
cd vpn-client
npm install
npm run build         # Build for current platform
npm run build:win     # Build for Windows
npm run build:mac     # Build for macOS
npm run build:linux   # Build for Linux
npm run portable      # Build portable versions
```

## Usage

### 1. Quick Connect via Link

The easiest way to connect is using a connection link:

```
vless://uuid@host:port?encryption=none&security=tls&type=tcp&host=example.com#ServerName
```

Simply paste the link and click "Connect".

### 2. Manual Server Configuration

Add servers manually with these details:
- **Name**: Friendly name
- **Type**: Protocol (VLESS, VMess, etc.)
- **Host**: Server address
- **Port**: Server port
- **UUID/Key**: Authentication credentials

### 3. Routing

Proxy mode applies the operating system proxy settings and works for applications that honor the system proxy or are configured to use `127.0.0.1:8888` / `127.0.0.1:8889`.

TUN mode uses `sing-box` or a custom local helper to route device traffic at the network-interface level. TUN mode may require administrator privileges and the helper must be installed separately.

### 4. Share Connection with Other Devices

Other devices on your network can use your PC as a proxy:

**Configuration for other devices:**
- HTTP Proxy: `your-pc-ip:8888`
- HTTPS Proxy: `your-pc-ip:8888`
- SOCKS5 Proxy: `your-pc-ip:8889`

**Example:** If your PC IP is `192.168.1.100`, configure other devices to use:
- HTTP/HTTPS: `192.168.1.100:8888`
- SOCKS5: `192.168.1.100:8889`

## Platform-Specific Notes

### Windows
- May require elevated privileges for system proxy or TUN helper changes
- Automatically configures Windows Internet Settings
- Proxy mode works with proxy-aware Windows applications

### macOS
- May require administrator permission for `networksetup` or TUN helper changes
- Configures network services automatically
- Proxy mode works with proxy-aware macOS applications

### Linux
- Uses `gsettings` where available for GNOME proxy configuration
- Sets process proxy environment variables
- TUN mode depends on the selected helper and local privileges

## Security Features

- No app telemetry or analytics
- No saved server secrets unless explicitly enabled
- Saved secrets use Electron `safeStorage` / the OS keychain or keyring when available
- Strong Shadowsocks defaults: `2022-blake3-aes-256-gcm`
- Weak Shadowsocks methods and plaintext HTTP upstreams are blocked by default
- TLS 1.3 minimum by default for HTTPS/TLS upstreams, with explicit TLS 1.2 fallback setting
- DNS server controls where the OS supports automatic updates
- IPv6 privacy/off controls where the OS supports automatic updates
- Private and loopback destination blocking in the local proxy and TUN helper config
- System-proxy kill switch option for supported desktop proxy settings

## Troubleshooting

### Connection Fails
1. Check server address and port
2. Verify UUID/key is correct
3. Check firewall settings
4. Try different protocol

### System Proxy Not Working
1. Restart the application
2. Disconnect and reconnect
3. Manually check system proxy settings
4. Run as administrator/sudo

### Other Devices Can't Connect
1. Check firewall allows ports 8888 and 8889
2. Verify your PC's local IP address
3. Ensure all devices are on same network
4. Try disabling PC firewall temporarily

## Command Line

Run from command line:

```bash
# Start VPN client
./B2-VPN-Client

# With specific config
./B2-VPN-Client --config=/path/to/config.json

# Connect to server on startup
./B2-VPN-Client --connect-last
```

## Integration with B-2-Torrent

The VPN client integrates seamlessly with B-2-Torrent:

1. Start B2 VPN Client
2. Connect to your VPN/Tor
3. Launch B-2-Torrent web app
4. Proxy-aware traffic routes through the client; use TUN mode when you need device-level routing

## Support

- GitHub: https://github.com/yourusername/b-2-torrent
- Email: support@b2torrent.com
- Documentation: https://docs.b2torrent.com

## License

Personal Use Only - See LICENSE.md for commercial licensing.
