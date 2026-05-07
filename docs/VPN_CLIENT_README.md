# B2 VPN Client - System-Wide Anonymous VPN

## Overview

B2 VPN Client is a standalone desktop application that provides system-wide anonymous VPN connectivity supporting multiple protocols including VLESS, VMess, Shadowsocks, Outline, and Tor network integration.

## Key Features

### 🌐 System-Wide Proxy
- Routes **all device traffic** through VPN automatically
- Creates local HTTP/HTTPS proxy (port 8888)
- Creates local SOCKS5 proxy (port 8889)
- Other devices on your network can use your PC as proxy server

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
- Public IP address
- Speed monitoring
- Data transfer statistics

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

### 3. System-Wide Routing

Once connected, **ALL** applications on your device will automatically route through the VPN:
- Web browsers
- Email clients
- Desktop apps
- Command-line tools
- Games

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
- Requires administrator privileges for system proxy
- Automatically configures Windows Internet Settings
- Works with all Windows applications

### macOS
- Requires sudo password for networksetup
- Configures network services automatically
- Works with all macOS applications

### Linux
- Requires sudo for gsettings (GNOME)
- Sets environment variables
- Works with most desktop environments

## Security Features

- ✅ Zero logs policy
- ✅ Encrypted connections
- ✅ DNS leak protection
- ✅ Kill switch (optional)
- ✅ IP address masking
- ✅ Secure credential storage

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
4. All torrent traffic automatically routes through VPN

## Support

- GitHub: https://github.com/yourusername/b-2-torrent
- Email: support@b2torrent.com
- Documentation: https://docs.b2torrent.com

## License

Personal Use Only - See LICENSE.md for commercial licensing.
