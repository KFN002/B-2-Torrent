# B-2-Torrent 🚀

**The Ultimate Anonymous Torrent Client with Military-Grade Security**

B-2-Torrent is a next-generation torrent client designed for maximum privacy, anonymity, and security. Built with Go (backend) and Next.js (frontend), it provides enterprise-level protection while maintaining simplicity and performance.

---

## 🌟 Key Features

### 🔐 Security & Anonymity
- **Multi-Layer Encryption**: AES-256-GCM with Perfect Forward Secrecy
- **File/Folder/Drive Encryption**: Military-grade encryption with customizable algorithms
- **VPN Integration**: Native support for VLESS and Outline protocols
- **Tor Network**: Multi-proxy chain routing for ultimate anonymity
- **Kill Switch**: Automatic connection termination on security breach
- **DNS Leak Protection**: Prevents IP exposure through DNS queries
- **IP Obfuscation**: Advanced traffic masking and fingerprint randomization
- **Zero-Logs Mode**: No history, DHT, or metadata persistence
- **Auto-Wipe**: Secure deletion of all traces on exit
- **Secure File Deletion**: 3-35 pass random data overwrite (DoD 5220.22-M & Gutmann)
- **B2 Secure Browser**: Standalone anonymous browser with ad/tracker/malware blocking

### 🌐 Network Features
- **IP & DNS Leak Detection**: Real-time monitoring with instant alerts
- **Traffic Obfuscation**: Evade DPI and ISP throttling
- **Peer Verification**: Block malicious peers automatically
- **Bandwidth Control**: Per-torrent and global speed limits
- **Port Randomization**: Prevent port-based tracking
- **Network Interface Binding**: Route through specific interfaces

### 🎨 Modern Interface
- **Clean Minimalistic Design**: Black/gray theme with colorful accents
- **Real-Time Monitoring**: Live security status and connection stats
- **Responsive**: Optimized for Full HD to 4K displays
- **Bilingual**: Full English and Russian support
- **Animations**: Smooth transitions and visual feedback

### 🛠️ 50+ Built-in Tools
- **File Tools**: Encryption, compression, splitting, hashing
- **Encryption Suite**: AES-256-GCM, ChaCha20-Poly1305, multiple key derivation functions
- **Secure Erasure**: Military-grade file shredding with triple random overwrite
- **Media Players**: Audio/video with subtitle support
- **Network Tools**: Port scanner, WiFi analyzer, certificate viewer
- **Security Tools**: Steganography, secure notes, leak checker
- **Dev Tools**: Base64, JSON formatter, regex tester, UUID generator
- **B2 Secure Browser**: Zero-trace anonymous web browsing
- **And many more...**

---

## 📋 Requirements

### System Requirements
- **OS**: Windows 10+, macOS 11+, Linux (Ubuntu 20.04+)
- **RAM**: 4GB minimum, 8GB recommended
- **Storage**: 500MB for app + space for downloads
- **Network**: Broadband internet connection

### Software Requirements
- **Docker**: 20.10+ and Docker Compose 2.0+
- **Go**: 1.21+ (for development)
- **Node.js**: 18+ (for development)

---

## 🚀 Quick Start

### Option 1: Docker (Recommended)

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/b-2-torrent.git
   cd b-2-torrent
   ```

2. **Start the application**
   ```bash
   docker-compose up -d
   ```

3. **Access the app**
   - Frontend: `http://localhost:3000`
   - Backend API: `http://localhost:8080`

### Option 2: Local Development

1. **Start the backend**
   ```bash
   cd backend
   go mod download
   go run cmd/server/main.go
   ```

2. **Start the frontend**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

3. **Access at** `http://localhost:3000`

### Option 3: Using Helper Scripts

```bash
# Start application
./start-localhost.sh

# Stop application
./stop-localhost.sh
```

### Option 4: B2 Secure Browser (Standalone)

```bash
cd browser
npm install
npm start

# Or build for your platform
npm run build:win    # Windows
npm run build:mac    # macOS
npm run build:linux  # Linux
```

---

## 📖 Configuration

### Environment Variables

Create a `.env` file in the project root:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/b2torrent
POSTGRES_USER=torrentuser
POSTGRES_PASSWORD=secure_password_here
POSTGRES_DB=b2torrent

# Redis
REDIS_URL=redis://localhost:6379/0

# RabbitMQ
RABBITMQ_URL=amqp://admin:admin123@localhost:5672/

# Security
ENCRYPTION_KEY=your-32-byte-encryption-key-here
JWT_SECRET=your-jwt-secret-key

# Network
BACKEND_PORT=8080
FRONTEND_PORT=3000

# Downloads (automatically detected)
DOWNLOAD_PATH=/path/to/downloads

# Optional: VPN Keys
VLESS_KEY=vless://your-connection-string
OUTLINE_KEY=ss://your-outline-key
```

### Security Settings

Access settings via the gear icon in the navbar:

1. **Security Tab**
   - Enable Kill Switch
   - Configure DNS Leak Protection
   - Set encryption levels (Force Encryption, Min Protocol)
   - Enable no-logs mode
   - MAC Address Randomization
   - Anti-Fingerprinting
   - Peer Verification

2. **VPN Configuration**
   - Choose: Tor / VLESS / Outline / None
   - Enter connection keys if using VPN
   - System-wide proxy configuration available

3. **Privacy Tab**
   - Auto-delete data on exit
   - Manual data cleanup
   - Secure file deletion (3-35 passes)
   - Memory encryption
   - Stealth mode

4. **Encryption Tab**
   - File/Folder/Drive encryption
   - Algorithm selection (AES-256-GCM, ChaCha20-Poly1305, etc.)
   - Key derivation functions (Argon2id, PBKDF2, scrypt)
   - Hash algorithms (SHA-256, SHA-512, BLAKE2b)

---

## 🎯 Usage Guide

### Adding Torrents

1. Click "Add Torrent" button
2. Choose method:
   - **Magnet Link**: Paste magnet URI
   - **Torrent File**: Upload .torrent file
   - **URL**: Enter torrent file URL
3. Select download path (defaults to ~/Downloads)
4. Configure options (start immediately, schedule, etc.)
5. Click "Add"

### Managing Downloads

- **Pause/Resume**: Click torrent card action buttons
- **Delete**: Remove torrent (optionally delete files)
- **View Info**: Click torrent for detailed statistics
- **Set Limits**: Configure per-torrent speed limits
- **Schedule**: Set bandwidth scheduler rules

### Using Mini-Apps

Access 50+ tools from the homepage:

- **Security**: Leak checker, steganography, secure notes
- **Files**: Encryption, compression, splitting, hashing
- **Network**: Port scanner, certificate viewer, WiFi analyzer
- **Media**: Audio/video players with subtitle support
- **Development**: Base64, JSON formatter, regex tester

### Torrent Search (Beta)

1. Navigate to "Search" page
2. Enter search query
3. Apply filters (quality, size, seeders)
4. Click results to copy magnet links
5. Use "Add Torrent" to download

### Using Encryption Tools

Navigate to Encryption page:

1. **Select Target**
   - File: Single file encryption
   - Folder: Entire folder encryption
   - Drive: Full disk encryption

2. **Configure Algorithm**
   - Encryption: AES-256-GCM (recommended), ChaCha20-Poly1305, etc.
   - Key Derivation: Argon2id (recommended), PBKDF2, scrypt
   - Hash: SHA-256, SHA-512, BLAKE2b

3. **Set Password**
   - Minimum 12 characters
   - Must include uppercase, number, and special character
   - Password is NOT stored anywhere

4. **Encrypt/Decrypt**
   - Click appropriate button
   - Wait for progress completion
   - Original file securely wiped after encryption

### Using B2 Secure Browser

1. **Launch Browser**
   ```bash
   cd browser
   npm start
   ```

2. **Features**
   - Zero data persistence (no history, cookies, cache)
   - Automatic ad/tracker/malware blocking
   - Anti-fingerprinting protection
   - Proxy configuration for Tor/VPN
   - Private search engines (DuckDuckGo, Startpage, etc.)

3. **Proxy Setup**
   - Click settings icon
   - Enter proxy details (SOCKS5 or HTTP/HTTPS)
   - Same proxy as main app for consistency

---

## 🔒 Security Best Practices

### Maximum Anonymity Setup

1. **Enable Tor Network**
   - Settings → Security → Connection Type → Tor
   - Or Network page → Tor Configuration
   - Restart application

2. **Force Encryption**
   - Settings → Security → Force Encryption: ON
   - Encryption Level: Maximum (AES-256-GCM)
   - Reject Plaintext: ON
   - Min Protocol: Force Encrypted

3. **Enable Kill Switch**
   - Settings → Security → Kill Switch: ON
   - DNS Leak Protection: ON
   - Network page shows real-time status

4. **No-Logs Mode**
   - Settings → Privacy → No-Logs Mode: ON
   - Auto-Wipe on Exit: ON
   - Backend logs are ephemeral only

5. **Additional Hardening**
   - MAC Randomization: ON
   - Anti-Fingerprinting: ON
   - Peer Verification: ON (blocks malicious peers)
   - Stealth Mode: ON
   - Sandbox Mode: ON
   - Memory Encryption: ON

6. **System-Wide Proxy**
   - Network page → Proxy Configuration
   - Apply to entire device
   - All traffic routes through Tor/VPN

7. **Use B2 Secure Browser**
   - Launch standalone browser
   - Configure same proxy settings
   - All web browsing completely anonymous

### Secure File Management

1. **Encrypt Sensitive Files**
   - Navigate to Encryption page
   - Select files/folders to encrypt
   - Use strong password (12+ chars)
   - Original files automatically deleted

2. **Secure File Deletion**
   - Device Security → Secure File Erasure
   - Select files to permanently delete
   - Choose overwrite passes (3-35)
   - Files are forensically unrecoverable

3. **Full Disk Encryption**
   - Encryption page → Drive Encryption
   - Select drive to encrypt
   - Configure algorithm and password
   - All data protected at rest

---

## 🏗️ Architecture

### Microservices Architecture

```
services/
├── api-gateway/        # HTTP gateway and routing
├── torrent/           # Torrent management service
├── security/          # Security monitoring service
└── auth/              # Authentication service (planned)
```

### Backend (Go)
```
backend/
├── cmd/server/          # Main entry point
├── internal/
│   ├── api/            # REST API handlers
│   ├── repository/     # Data access layer (pgx)
│   ├── service/        # Business logic layer
│   ├── torrent/        # Torrent client logic
│   ├── security/       # Security modules
│   └── middleware/     # HTTP middleware
├── pkg/
│   ├── database/       # pgx pool connection
│   ├── cache/          # Redis caching
│   └── messaging/      # RabbitMQ messaging
└── proto/              # gRPC protocol definitions
```

### Frontend (Next.js)
```
frontend/
├── app/                # Pages and routes
│   ├── encryption/     # Encryption tools
│   ├── network/        # VPN/Tor configuration
│   ├── device-security/# System-level security
│   ├── ip-dashboard/   # IP intelligence
│   └── mini-apps/      # Tool directory
├── components/         # React components
├── lib/                # Utilities (English only)
└── public/             # Static assets
```

### B2 Secure Browser (Electron)
```
browser/
├── main.js            # Main process (security config)
├── preload.js         # Preload scripts
├── renderer.js        # Renderer process
├── index.html         # UI
└── styles.css         # Styling
```

### Database Schema
- **torrents**: Torrent metadata and status
- **settings**: User preferences (cached in Redis)
- **security_logs**: Security events (ephemeral)
- **peer_blacklist**: Blocked peers

---

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Find and kill process
lsof -ti:8080 | xargs kill -9  # Backend
lsof -ti:3000 | xargs kill -9  # Frontend
```

### Database Connection Issues
```bash
# Check PostgreSQL status
docker-compose ps
docker-compose logs postgres

# Reset database
docker-compose down -v
docker-compose up -d
```

### VPN Not Connecting
1. Verify connection string format
2. Check firewall settings
3. Test VPN independently
4. Review logs: `docker-compose logs backend`

### Downloads Not Saving
1. Check download path permissions
2. Ensure sufficient disk space
3. Verify path in settings
4. Review backend logs

### Encryption Issues
1. Verify password strength (12+ characters)
2. Ensure sufficient disk space
3. Check file permissions
4. Review backend logs for errors

### Browser Not Starting
1. Check Node.js installation (18+)
2. Clear node_modules: `npm install`
3. Verify Electron installation
4. Check port conflicts

### Proxy Not Working
1. Verify proxy credentials
2. Test proxy independently
3. Check firewall settings
4. Review browser console for errors

---

## 📜 License

**Personal Use License**

This software is licensed for **personal use only**. See [LICENSE.md](LICENSE.md) for full terms.

**Commercial Use**: Requires a separate license. Contact: [commercial@b2torrent.com]

**B2 Secure Browser**: Same license terms apply

---

## 🗺️ Roadmap

### Version 2.0 (Planned)
- [ ] Mobile app (iOS/Android)
- [ ] Blockchain-based identity
- [ ] Decentralized tracker
- [ ] Advanced AI-based peer selection
- [ ] Plugin system
- [ ] Browser extensions for all major browsers
- [ ] Hardware security key support

### Version 1.5 (In Progress)
- [x] Torrent search (Beta)
- [x] Military-grade encryption suite
- [x] B2 Secure Browser
- [x] System-wide proxy configuration
- [x] IP intelligence dashboard
- [ ] Streaming support
- [ ] RSS feed integration
- [ ] Cloud backup sync (encrypted)

---

## 🙏 Acknowledgments

- **Anacrolix Torrent**: Core torrent library
- **Tor Project**: Anonymity network
- **shadcn/ui**: UI components
- **Next.js Team**: React framework
- **Go Team**: Backend language
- **pgx**: PostgreSQL driver
- **Electron**: Desktop browser framework
- **Redis**: Caching layer
- **RabbitMQ**: Message broker

---

## 📈 Statistics

- **Lines of Code**: ~75,000+
- **Components**: 150+
- **Mini-Apps**: 50+
- **Languages**: Go, TypeScript, SQL, JavaScript
- **Microservices**: 4 (api-gateway, torrent, security, auth)
- **Development Time**: 8+ months
- **Encryption Algorithms**: 7+
- **Key Derivation Functions**: 4+

---

**Built with ❤️ for Privacy**

*B-2-Torrent - Your Data, Your Control*
