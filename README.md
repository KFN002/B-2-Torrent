# Secure Torrent Client

A privacy-focused torrent tracker and downloader with a clean web interface.

## Features

- **Complete Privacy**: No logs, no history, all downloads are ephemeral
- **Tor Integration**: All traffic routed through Tor network
- **Modern UI**: Clean black and white interface built with Next.js
- **Containerized**: Fully dockerized for easy deployment
- **PostgreSQL**: Minimal data persistence (settings only)
- **Golang Backend**: High-performance torrent engine

## Quick Start

1. Start all services:
\`\`\`bash
make up
\`\`\`

2. Access the web interface:
\`\`\`
http://localhost:3000
\`\`\`

3. View logs:
\`\`\`bash
make logs
\`\`\`

## Architecture

- **Frontend**: Next.js (port 3000)
- **Backend**: Golang with Gin (port 8080)
- **Database**: PostgreSQL (port 5432)
- **Tor Proxy**: SOCKS5 (port 9050)

## Privacy Features

- No download history stored
- Active torrents cleared on restart
- All connections through Tor
- No telemetry or tracking
- Minimal data persistence

## Commands

- `make up` - Start all containers
- `make down` - Stop all containers
- `make build` - Rebuild containers
- `make clean` - Remove all data and volumes
- `make logs` - View all logs
- `make restart` - Restart all services

## Security Note

This application is designed for downloading legal content. Respect copyright laws.
\`\`\`

```.gitignore file=".gitignore"
# Downloads
downloads/*
!downloads/.gitkeep

# Go
*.exe
*.exe~
*.dll
*.so
*.dylib
*.test
*.out
vendor/

# Node
node_modules/
.next/
out/
.env*.local

# Docker
.docker/

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db
