# Security & Privacy Features

## Core Privacy Principles

This torrent client is designed with privacy as the top priority:

### No Logging
- No HTTP request logging
- No access logs
- No error logs stored to disk
- All logs output to stderr only (ephemeral)

### No History
- Active torrents table cleared on every restart
- No download history maintained
- No search history
- No user activity tracking

### No Telemetry
- Zero analytics
- No crash reporting
- No usage statistics
- No external tracking services

## Network Security

### Tor Integration
- All torrent traffic routed through Tor SOCKS5 proxy
- DHT and PEX disabled for enhanced privacy
- No IPv6 to prevent leaks
- Connection testing before operations

### Security Headers
- `Cache-Control: no-store, no-cache`
- `X-Frame-Options: DENY`
- `Referrer-Policy: no-referrer`
- Server identification removed

## Data Protection

### Minimal Persistence
- Only settings stored in database
- Active torrents only in memory
- Automatic cleanup on shutdown
- Manual cleanup endpoint available

### Containerization
- Isolated network namespace
- Volume-based downloads (easily wipeable)
- No host filesystem access
- Clean separation of concerns

## Best Practices

### For Maximum Privacy:
1. Always verify Tor is enabled (check status bar)
2. Regularly restart containers to clear memory
3. Use `make clean` to wipe all data
4. Don't share screenshots with identifying info
5. Run behind a VPN for extra protection

### Operational Security:
- Change default database credentials
- Use strong passwords if exposing to network
- Consider firewall rules to restrict access
- Monitor Tor connection status
- Regularly update Docker images

## Cleanup

### Manual Cleanup:
\`\`\`bash
# Remove all data and volumes
make clean

# Or via API
curl -X POST http://localhost:8080/api/cleanup
\`\`\`

### Automatic Cleanup:
- All active torrents cleared on restart
- Graceful shutdown clears data
- SIGTERM/SIGINT handlers ensure cleanup

## Limitations

While we prioritize privacy, understand:
- ISP can see Tor usage (but not content)
- Exit nodes could monitor unencrypted traffic
- Timing attacks still theoretically possible
- Physical access to server exposes downloaded files

## Recommendations

For legal content only. This tool provides privacy but:
- Respect copyright laws
- Use for open source software, public domain content
- Don't use for illegal activities
- Follow your jurisdiction's laws

Remember: Privacy tools are for legitimate privacy needs, not illegal activity.
