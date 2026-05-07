# B2 Secure Browser

Privacy-focused desktop browser with ephemeral sessions, proxy support, tracker blocking, and anti-fingerprinting mitigations.

## Features

- **Zero Logs**: No history, cookies, or cache - completely ephemeral
- **Reduced Fingerprinting**: Advanced anti-fingerprinting and tracking protection
- **Stealth Mode**: Canvas, WebGL, and audio fingerprinting randomization
- **Proxy Support**: Built-in Tor and VPN proxy configuration
- **Secure by Default**: DuckDuckGo and privacy-focused search engines
- **Cross-Platform**: Windows, macOS, and Linux support
- **Lightweight**: Minimal resource usage with security-focused defaults
- **No Data Persistence**: All data automatically cleared on exit
- **Tracker Blocking**: Automatic blocking of analytics and tracking scripts
- **DNS Leak Protection**: Secure DNS configuration

## Installation

### From Source

```bash
cd browser
npm install
npm start
```

### Build Executables

```bash
# Windows
npm run build:win

# macOS
npm run build:mac

# Linux
npm run build:linux

# All platforms
npm run build
```

Built executables will be in the `dist/` directory.

## Usage

1. **Launch Browser**: Start the application - it opens in stealth mode
2. **Configure Proxy** (Optional): Click the globe icon (🌐) to set up Tor/VPN
3. **Browse Anonymously**: Use secure search engines or navigate to any URL
4. **Clear Data**: Click trash icon (🗑️) to wipe all data at any time

## Proxy Configuration

The browser supports routing all traffic through:
- **Tor Network**: SOCKS5 proxy on 127.0.0.1:9050 (default Tor port)
- **B2 VPN**: HTTP/HTTPS proxy on 127.0.0.1:8888 (from the standalone B2 VPN Client)
- **Custom Proxy**: Any HTTP/HTTPS or SOCKS5 proxy

### Integration with B-2-Torrent

To use with B-2-Torrent's VPN/Tor network:
1. Start B-2-Torrent and navigate to the Network page
2. Connect to your preferred VPN or Tor network
3. Note the proxy settings displayed
4. In the browser, click the proxy button and configure matching settings
5. All browser traffic now routes through the secure connection

## Advanced Security Features

### Anti-Fingerprinting Protection
- **Canvas Fingerprinting**: Adds random noise to prevent tracking
- **WebGL Fingerprinting**: Spoofs GPU and vendor information
- **Audio Context**: Randomizes audio fingerprinting
- **Screen Resolution**: Normalizes to common 1920x1080
- **Timezone Spoofing**: Always reports UTC timezone
- **Hardware Concurrency**: Reports generic 4 cores
- **Device Memory**: Reports generic 8GB

### Network Security
- Disabled HTTP cache and disk storage
- Third-party cookie blocking
- Referer and Origin header removal
- Do Not Track (DNT) and Global Privacy Control (GPC) enabled
- WebRTC leak protection
- Strict Content Security Policy headers
- Automatic tracker domain blocking

### Privacy Protection
- No telemetry or metrics collection
- No sync services enabled
- No component updates
- No background networking
- Disabled WebGL for fingerprint protection
- Session isolation with ephemeral storage
- Automatic data wiping every 30 minutes and on exit

## Supported Privacy Search Engines

The browser provides quick access to:
- **DuckDuckGo**: No tracking, private search
- **Startpage**: Google results without tracking
- **Qwant**: EU-based privacy search
- **SearX**: Metasearch engine with no tracking
- **Mojeek**: Independent search engine
- **Swisscows**: Swiss privacy-focused search

## System Requirements

- **Windows**: Windows 10 or later
- **macOS**: macOS 10.13 (High Sierra) or later
- **Linux**: Ubuntu 18.04, Debian 10, Fedora 32, or equivalent

## Development

### Project Structure

```
browser/
├── main.js          # Electron main process (security config)
├── preload.js       # Secure bridge between main and renderer
├── renderer.js      # UI logic and event handlers
├── index.html       # Browser interface
├── styles.css       # Sleek black design with animations
├── package.json     # Dependencies and build config
├── build.sh         # Unix build script
└── build.bat        # Windows build script
```

### Security Architecture

The browser implements defense in depth:
1. **Electron Security**: Disabled node integration, enabled context isolation
2. **Session Isolation**: Separate partition for stronger privacy boundaries
3. **Content Filtering**: WebRequest API blocks tracking domains
4. **Header Manipulation**: Removes identifying headers, adds privacy headers
5. **JavaScript Injection**: Runtime fingerprint randomization
6. **Storage Management**: Automatic clearing of all persistent data

## Keyboard Shortcuts

- `Enter` in URL bar: Navigate or search
- `Ctrl+R` / `Cmd+R`: Reload page
- `Ctrl+L` / `Cmd+L`: Focus URL bar
- `Alt+Left`: Go back
- `Alt+Right`: Go forward

## Troubleshooting

### Tor Connection Issues
1. Ensure Tor Browser or Tor service is running
2. Default Tor SOCKS5 port is 9050
3. Check firewall settings allow local connections

### VPN Connection Issues
1. Verify B-2-Torrent network page shows active connection
2. Confirm proxy settings match between app and browser
3. Test proxy connection with a simple HTTP/HTTPS request

### Fingerprinting Test
Visit these sites to verify anti-fingerprinting:
- https://browserleaks.com/canvas
- https://coveryourtracks.eff.org/
- https://amiunique.org/

## Contributing

See main project CONTRIBUTING.md for guidelines.

## License

Personal use only. Commercial use requires purchase and author contact. See main project LICENSE.md for full terms.

## Credits

Built with:
- Electron for cross-platform desktop app framework
- electron-store for encrypted temporary configuration
- Modern web security best practices
