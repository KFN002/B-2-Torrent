# Security & Privacy Features

## Core Privacy Principles

B-2-Torrent is designed with privacy and anonymity as the top priority, with zero-knowledge architecture and military-grade security.

### Zero Logging
- **No HTTP request logging** - Only essential errors logged ephemerally
- **No access logs** - No tracking of user activity
- **No error logs to disk** - All logs output to stderr only (ephemeral)
- **Privacy-preserving logs** - Minimal zap logging with no PII
- **Caller info disabled** - Stack traces disabled for privacy
- **Zero telemetry** - No analytics, crash reporting, or usage statistics

### No History
- Active torrents table cleared on every restart
- No download history maintained
- No search history stored
- No user activity tracking
- No browser history (B2 Secure Browser)
- No cookies or cache persisted

### No Telemetry
- Zero analytics or tracking
- No crash reporting services
- No usage statistics collection
- No external tracking services
- No fingerprinting data collected

## Network Security

### Multi-Layer Protection

#### Tor Integration
- All torrent traffic routed through Tor SOCKS5 proxy
- Multi-hop circuit configuration available
- DHT and PEX disabled for enhanced privacy
- IPv6 completely disabled to prevent leaks
- Connection testing before all operations
- Circuit rotation for additional anonymity

#### VPN Support
- **VLESS Protocol**: High-performance encrypted proxy
- **Outline Protocol**: Secure Shadowsocks-based VPN
- **System-Wide Proxy**: Route all device traffic through configured proxy
- **Kill Switch**: Automatic connection termination on VPN/Tor failure
- **Connection Monitoring**: Real-time status with instant leak detection

#### Traffic Obfuscation
- DPI evasion techniques
- Protocol fingerprint randomization
- Timing attack mitigation
- Packet size obfuscation
- ISP throttling prevention

### Security Headers
All HTTP responses include:
- `Cache-Control: no-store, no-cache, must-revalidate`
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: no-referrer`
- `Permissions-Policy: geolocation=(), microphone=(), camera=()`
- `Content-Security-Policy`: Strict CSP with no inline scripts
- `Strict-Transport-Security`: HSTS with 1 year max-age
- Server identification removed

## Encryption

### File & Drive Encryption

#### Supported Algorithms
- **AES-256-GCM** (Recommended) - NIST approved, authenticated encryption
- **AES-256-CBC** - Standard AES with CBC mode
- **AES-192-GCM** - Balanced security and performance
- **ChaCha20-Poly1305** - Modern cipher, excellent on mobile
- **Twofish-256** - Alternative to AES
- **Serpent-256** - Maximum security cipher
- **Camellia-256** - International standard

#### Key Derivation Functions
- **Argon2id** (Recommended) - Winner of Password Hashing Competition, GPU/ASIC resistant
- **PBKDF2** - 100,000+ iterations with SHA-256/SHA-512
- **scrypt** - Memory-hard function
- **bcrypt** - Battle-tested key derivation

#### Hash Algorithms
- **SHA-256** - Standard cryptographic hash
- **SHA-512** - Extended security
- **SHA-3-256** - Latest NIST standard
- **BLAKE2b** - Fast and secure
- **Whirlpool** - 512-bit hash

#### Security Features
- **Authenticated Encryption** - AEAD modes prevent tampering
- **Perfect Forward Secrecy** - Unique keys per session
- **Random Salt & IV** - Unique per encryption operation
- **Secure Key Storage** - Keys never stored, derived from password
- **Automatic Secure Deletion** - Original files wiped after encryption

### Torrent Encryption
- **Force Encryption**: Reject all unencrypted peers
- **Protocol Encryption**: RC4 obfuscation minimum
- **Message Stream Encryption**: Full end-to-end encryption
- **Header Encryption**: Prevent protocol detection
- **Peer Exchange Disabled**: No PEX for anonymity

## Data Protection

### Minimal Persistence
- **Memory-Only Active Data**: Torrents stored in RAM during operation
- **Settings in Database**: User preferences cached in Redis
- **Ephemeral Security Logs**: Events logged but not persisted
- **Automatic Cleanup**: All data cleared on shutdown
- **Manual Wipe**: Endpoint for immediate data deletion

### Secure File Deletion
- **Multiple Pass Overwrite**: 3-35 passes available
- **DoD 5220.22-M Standard**: 7-pass military standard
- **Gutmann Method**: 35-pass maximum security
- **Cryptographic Random Data**: CSPRNG for all overwrites
- **Sector-Level Writing**: Direct disk writes with sync
- **Forensically Unrecoverable**: Prevents all data recovery

### Containerization & Isolation
- Isolated network namespace per service
- Volume-based downloads (easily wipeable)
- No host filesystem access
- Clean separation of concerns
- Microservices architecture for fault isolation

## B2 Secure Browser

### Zero-Trace Architecture
- **No Data Persistence**: All data cleared on exit
- **No History**: Browsing history never saved
- **No Cookies**: Session cookies only, cleared immediately
- **No Cache**: All cache disabled at system level
- **No Local Storage**: IndexedDB, WebSQL, localStorage all disabled
- **Encrypted Session Store**: Temporary settings encrypted with random key

### Content Blocking
- **Ad Blocking**: Comprehensive ad network database
- **Tracker Blocking**: Prevents analytics and tracking scripts
- **Malware Blocking**: Known malicious domains blocked
- **Cryptominer Blocking**: Prevents unauthorized mining
- **Social Widget Blocking**: Facebook, Twitter trackers removed
- **Real-Time Statistics**: Live counter of blocked items

### Anti-Fingerprinting
- **Canvas Randomization**: Canvas fingerprinting defeated
- **WebGL Spoofing**: Generic GPU information returned
- **Audio Context Protection**: Audio fingerprinting prevented
- **Screen Resolution Masking**: Common resolution reported
- **Timezone Spoofing**: UTC timezone enforced
- **Navigator Properties**: Hardware specs randomized
- **Font Fingerprinting**: Limited font exposure

### Security Features
- **Proxy Support**: SOCKS5 and HTTP/HTTPS proxy
- **DNT Header**: Do Not Track enabled
- **Sec-GPC Header**: Global Privacy Control enabled
- **Security Headers**: All modern security headers enforced
- **Permission Restrictions**: Geolocation, camera, mic denied
- **WebRTC Disabled**: Prevents IP leaks
- **JavaScript Control**: Optional JavaScript blocking

## Leak Prevention

### Real-Time Monitoring
The application continuously monitors for:

#### IP Leak Detection
- **Real IP Exposure**: Detects actual IP vs VPN IP
- **WebRTC Leaks**: Browser-based IP exposure
- **DNS Leaks**: DNS query tracking detection
- **IPv6 Leaks**: IPv6 completely disabled
- **Connection Drops**: VPN/Tor disconnection alerts

#### DNS Protection
- **Secure DNS**: DNS-over-HTTPS or DNS-over-Tor
- **DNS Leak Testing**: Continuous verification
- **Custom DNS**: Configure trusted DNS servers
- **DNSSEC**: Validation when available

#### Network Monitoring
- **Active Connections**: Real-time connection tracking
- **Peer Information**: Connected peer analysis
- **Bandwidth Usage**: Per-torrent and global stats
- **Port Monitoring**: Port randomization and tracking

### Automatic Responses
- **Kill Switch Activation**: Instantly stops all traffic on leak
- **Connection Termination**: Drops unsafe connections
- **User Alerts**: Immediate toast notifications
- **Event Logging**: Security events for review

## Best Practices

### For Maximum Privacy

1. **Enable All Security Features**
   - Tor Network: ON
   - Kill Switch: ON
   - DNS Leak Protection: ON
   - Force Encryption: ON
   - Peer Verification: ON
   - Anti-Fingerprinting: ON
   - MAC Randomization: ON
   - Stealth Mode: ON
   - Sandbox Mode: ON
   - Memory Encryption: ON

2. **Configure System-Wide Proxy**
   - Network page → Proxy Configuration
   - Apply to entire device
   - Route all traffic through Tor/VPN

3. **Use B2 Secure Browser**
   - Never use regular browser for sensitive activity
   - Configure same proxy as main app
   - Verify blocking statistics

4. **Regular Data Cleanup**
   - Enable Auto-Wipe on Exit
   - Use Secure File Deletion for sensitive files
   - Restart containers regularly
   - Run cleanup endpoint periodically

5. **Verify Connections**
   - Check IP Dashboard regularly
   - Monitor security status ticker
   - Review leak test results
   - Verify Tor circuit changes

### Operational Security

1. **Strong Passwords**
   - Minimum 12 characters
   - Include uppercase, lowercase, numbers, symbols
   - Never reuse passwords
   - Use password manager

2. **Encryption Best Practices**
   - Encrypt all sensitive files immediately after download
   - Use Argon2id key derivation
   - Select AES-256-GCM or ChaCha20-Poly1305
   - Store passwords securely offline

3. **Network Configuration**
   - Change default database credentials
   - Use strong PostgreSQL passwords
   - Restrict network access with firewall
   - Never expose services publicly without authentication

4. **Monitoring & Alerts**
   - Monitor security status ticker constantly
   - Respond to leak alerts immediately
   - Review security events regularly
   - Check connected peers for suspicious activity

5. **Update Regularly**
   - Update Docker images monthly
   - Check for security patches
   - Review changelog for security fixes
   - Test updates in isolated environment first

## Cleanup & Data Erasure

### Automatic Cleanup
- All active torrents cleared on restart
- Graceful shutdown clears memory data
- SIGTERM/SIGINT handlers ensure cleanup
- Auto-wipe on exit (configurable)
- Browser data cleared on close

### Manual Cleanup

#### Application Data
```bash
# Remove all data and volumes
make clean

# Via API
curl -X POST http://localhost:8080/api/cleanup

# Docker cleanup
docker-compose down -v
```

#### Secure File Deletion
1. Navigate to Device Security page
2. Select Secure File Erasure
3. Choose files to permanently delete
4. Select overwrite passes (3-35)
5. Execute secure deletion

#### Full System Reset
```bash
# Stop all services
docker-compose down

# Remove all volumes
docker volume prune -f

# Remove all images
docker rmi $(docker images -q b-2-torrent*)

# Clean project directory
rm -rf downloads/* uploads/* temp/*
```

## Limitations & Risks

### Understanding Privacy Limitations

While B-2-Torrent provides military-grade security, understand:

1. **ISP Visibility**
   - ISP can see Tor/VPN usage (but not content)
   - Traffic analysis could reveal torrent activity
   - Consider multiple anonymity layers

2. **Exit Node Monitoring**
   - Tor exit nodes could monitor unencrypted traffic
   - Always use encrypted torrents
   - Force encryption in settings

3. **Timing Attacks**
   - Sophisticated timing correlation attacks theoretically possible
   - Randomized delays help mitigate
   - Use during high network activity periods

4. **Physical Access**
   - Physical server access exposes downloaded files
   - Use full disk encryption
   - Secure file deletion after use
   - Consider hardware security

5. **Metadata**
   - File sizes and timestamps can reveal information
   - Connection timing patterns
   - Mitigate with stealth mode and random delays

### Threat Model

**Protected Against:**
- ISP monitoring and throttling
- Government surveillance (non-targeted)
- Copyright trolls and automated DMCA
- Malicious peers and trackers
- Network fingerprinting
- IP and DNS leaks
- Browser fingerprinting

**Not Protected Against:**
- Targeted government surveillance with server seizure
- Rubber-hose cryptanalysis (physical coercion)
- Zero-day exploits in underlying software
- Social engineering attacks
- Compromised VPN/Tor infrastructure
- Quantum computing attacks (future threat)

## Legal & Ethical Use

### Legal Notice
This tool provides technical privacy measures but:

- **Respect Copyright**: Only download legal, authorized content
- **Follow Local Laws**: Ensure compliance with your jurisdiction
- **No Illegal Activity**: Don't use for copyright infringement
- **Educational Purpose**: Software provided for learning and research
- **User Responsibility**: You are responsible for your actions

### Ethical Guidelines
1. Use for open source software, public domain content
2. Respect content creators and intellectual property
3. Support artists and developers you enjoy
4. Use privacy tools for legitimate privacy needs
5. Don't share copyrighted material without permission

### Recommended Use Cases
- **Legal Content**: Open source software, Linux ISOs, public domain media
- **Research**: Academic papers, research data, public datasets
- **Privacy Protection**: Legal activity requiring anonymity
- **Security Testing**: Authorized penetration testing
- **Archival**: Preservation of legally obtained content

## Recommendations

### Before Using B-2-Torrent

1. **Verify Legal Status**
   - Check content copyright status
   - Understand local laws
   - Use only for authorized content

2. **Secure Your System**
   - Use full disk encryption
   - Strong BIOS/UEFI password
   - Updated operating system
   - Firewall configured properly

3. **Test Configuration**
   - Run leak tests before torrenting
   - Verify Tor connection
   - Check IP Dashboard
   - Test browser fingerprinting

4. **Plan Data Management**
   - Decide on encryption strategy
   - Configure auto-wipe settings
   - Plan secure deletion schedule
   - Test backup procedures

Remember: Privacy tools are for legitimate privacy needs, not illegal activity. Use responsibly and ethically.

## Security Contact

**DO NOT** open public issues for security vulnerabilities.

**Security Email**: security@b2torrent.com  
**PGP Key**: Available at https://b2torrent.com/security.asc  
**Response Time**: 24-48 hours for critical vulnerabilities

Report security issues responsibly and we will address them promptly.
