# B-2-Torrent Quick Start Guide

Complete guide to get B-2-Torrent up and running in minutes.

## Table of Contents
1. [Installation](#installation)
2. [Starting the Application](#starting-the-application)
3. [Starting the Browser](#starting-the-browser)
4. [First-Time Configuration](#first-time-configuration)
5. [Common Tasks](#common-tasks)
6. [Troubleshooting](#troubleshooting)

---

## Installation

### Prerequisites

**Required:**
- Docker Desktop 20.10+ ([Download](https://www.docker.com/products/docker-desktop))
- Docker Compose 2.0+ (included with Docker Desktop)

**Optional (for development):**
- Node.js 18+ ([Download](https://nodejs.org/))
- Go 1.21+ ([Download](https://go.dev/dl/))

### Download B-2-Torrent

```bash
git clone https://github.com/yourusername/b-2-torrent.git
cd b-2-torrent
```

---

## Starting the Application

### Method 1: Interactive Launcher (Recommended)

**Linux/macOS:**
```bash
chmod +x launcher.sh
./launcher.sh
```

**Windows:**
```cmd
launcher.bat
```

The launcher provides an interactive menu with all options.

### Method 2: Docker Compose (Direct)

```bash
# Start all services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

### Method 3: Make Commands

```bash
# Start services
make up

# Stop services
make down

# View logs
make logs

# Check health
make health
```

### Method 4: Development Mode

**Backend:**
```bash
cd backend
go mod download
go run cmd/server/main.go
```

**Frontend:**
```bash
npm install
npm run dev
```

---

## Starting the Browser

The B2 Secure Browser is a standalone application for anonymous web browsing.

### Quick Start

```bash
cd browser
npm install
npm start
```

### Building Standalone Executables

**Windows:**
```bash
cd browser
npm run build:win
# Output: browser/dist/B2 Secure Browser Setup.exe
```

**macOS:**
```bash
cd browser
npm run build:mac
# Output: browser/dist/B2 Secure Browser.dmg
```

**Linux:**
```bash
cd browser
npm run build:linux
# Output: browser/dist/B2 Secure Browser.AppImage
```

### Running Portable Version

After building, run the executable directly without installation.

---

## First-Time Configuration

### Step 1: Access the Application

Open your web browser and navigate to:
```
http://localhost:3000
```

### Step 2: Complete Setup Wizard

On first launch, you'll see a setup wizard:

1. **Welcome Screen**
   - Click "Get Started"

2. **Security Settings**
   - Enable Kill Switch: ✓ (Recommended)
   - Enable DNS Leak Protection: ✓ (Recommended)
   - Enable No-Logs Mode: ✓ (Recommended)
   - Force Encryption: ✓ (Recommended)

3. **Network Configuration**
   - Choose connection type:
     - **Tor**: Maximum anonymity (slower)
     - **VPN (VLESS)**: Fast and secure
     - **VPN (Outline)**: Alternative VPN
     - **Direct**: No proxy (not recommended)
   
   - Enter VPN credentials if applicable

4. **Download Settings**
   - Set default download path
   - Configure bandwidth limits
   - Enable auto-seeding options

5. **Complete Setup**
   - Review settings
   - Click "Finish"

### Step 3: Configure Browser (Optional)

If using B2 Secure Browser:

1. Launch browser
2. Click settings icon (⚙️)
3. Configure proxy (same as main app)
4. Choose default search engine

---

## Common Tasks

### Adding Torrents

**Via Magnet Link:**
1. Click "Add Torrent" button
2. Select "Magnet Link" tab
3. Paste magnet URI
4. Click "Add"

**Via Torrent File:**
1. Click "Add Torrent" button
2. Select "Torrent File" tab
3. Click "Choose File"
4. Select .torrent file
5. Click "Add"

**Via URL:**
1. Click "Add Torrent" button
2. Select "URL" tab
3. Paste torrent file URL
4. Click "Add"

### Managing Downloads

**Pause/Resume:**
- Click torrent card
- Click pause/resume button

**Delete Torrent:**
- Click torrent card
- Click delete button
- Choose to keep or remove files

**View Statistics:**
- Click torrent name
- View detailed stats panel

### Using Encryption

**Encrypt a File:**
1. Navigate to "Encryption" page
2. Select "File" target
3. Click "Select File"
4. Choose encryption algorithm (AES-256-GCM recommended)
5. Enter strong password
6. Click "Encrypt"

**Encrypt a Folder:**
1. Navigate to "Encryption" page
2. Select "Folder" target
3. Click "Select Folder"
4. Configure settings
5. Enter password
6. Click "Encrypt"

**Decrypt:**
1. Select encrypted file/folder
2. Click "Decrypt" tab
3. Enter password
4. Click "Decrypt"

### Secure File Deletion

1. Navigate to "Device Security" page
2. Scroll to "Secure File Erasure"
3. Click "Select Files"
4. Choose files to delete
5. Select overwrite passes (3-35)
6. Click "Secure Delete"
7. Confirm action

### Checking IP & Leaks

1. Navigate to "IP Dashboard"
2. View your real IP information
3. Check leak detection status
4. Review system specifications

### Using Mini-Apps

1. Navigate to "Mini Apps" page
2. Browse categories:
   - Security Tools
   - File Tools
   - Network Tools
   - Media Players
   - Developer Tools
3. Click desired tool
4. Use tool interface

---

## Troubleshooting

### Application Won't Start

**Check Docker Status:**
```bash
docker --version
docker-compose --version
```

**Restart Docker:**
- Windows/Mac: Restart Docker Desktop
- Linux: `sudo systemctl restart docker`

**Check Ports:**
```bash
# Check if ports are available
lsof -i :3000  # Frontend
lsof -i :8080  # Backend
lsof -i :5432  # PostgreSQL
```

**Free Ports:**
```bash
# Kill processes on port
kill -9 $(lsof -ti:3000)
```

### Services Unhealthy

**View Logs:**
```bash
docker-compose logs -f [service-name]
```

**Restart Services:**
```bash
docker-compose restart [service-name]
```

**Full Reset:**
```bash
docker-compose down -v
docker-compose up -d
```

### Database Connection Issues

**Reset Database:**
```bash
docker-compose down -v
docker volume rm b-2-torrent_postgres_data
docker-compose up -d
```

### VPN/Tor Not Connecting

1. **Verify Credentials:**
   - Check VPN connection string
   - Ensure no typos

2. **Test VPN Separately:**
   - Try connecting outside application
   - Verify VPN is working

3. **Check Firewall:**
   - Allow Docker through firewall
   - Allow Tor ports (9050, 9051)

4. **Review Logs:**
   ```bash
   docker-compose logs -f backend
   ```

### Browser Won't Launch

**Install Dependencies:**
```bash
cd browser
rm -rf node_modules
npm install
```

**Check Electron:**
```bash
npm list electron
```

**Rebuild:**
```bash
npm run build
```

### Downloads Not Saving

1. **Check Permissions:**
   ```bash
   chmod 755 /path/to/downloads
   ```

2. **Verify Path:**
   - Settings → Downloads → Download Path
   - Ensure path exists and is writable

3. **Check Disk Space:**
   ```bash
   df -h
   ```

### Performance Issues

**Increase Resource Limits:**

Edit `docker-compose.yml`:
```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 2G
```

**Reduce Torrent Connections:**
- Settings → Network → Max Connections: 50

**Enable Bandwidth Limits:**
- Settings → Network → Global Speed Limits

---

## Getting Help

### Documentation
- **Main README**: [README.md](README.md)
- **Security Guide**: [SECURITY.md](SECURITY.md)
- **Browser Docs**: [browser/README.md](browser/README.md)
- **Contributing**: [CONTRIBUTING.md](CONTRIBUTING.md)

### Support Channels
- **GitHub Issues**: [Report bugs](https://github.com/yourusername/b-2-torrent/issues)
- **Discussions**: [Ask questions](https://github.com/yourusername/b-2-torrent/discussions)
- **Email**: support@b2torrent.com

### Useful Commands

```bash
# Health check
make health

# View all logs
make logs

# Rebuild everything
make rebuild

# Clean and restart
make clean && make up

# Backup database
make backup

# Run tests
make test
```

---

**You're all set! Enjoy secure, anonymous torrenting with B-2-Torrent. 🚀**
