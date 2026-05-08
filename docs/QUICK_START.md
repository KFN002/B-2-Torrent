# Quick Start

B-2-Torrent is intended to run as a self-hosted localhost app on your own laptop or PC.

## 1. Install

macOS:

```bash
./scripts/install-macos.sh
```

Windows PowerShell:

```powershell
.\scripts\install-windows.ps1
```

Manual:

```bash
node scripts/gen-env.mjs
corepack enable
pnpm --dir frontend install --frozen-lockfile
docker compose build
```

Debian / hardened Linux:

```bash
sudo apt update
sudo apt install -y ca-certificates curl git make nodejs npm
node scripts/gen-env.mjs
corepack enable
pnpm --dir frontend install --frozen-lockfile
docker compose build
```

For a locked-down workstation, use a dedicated user, encrypted `DOWNLOAD_DIR`, and the host firewall guidance in [DEBIAN_SECURE_LINUX.md](DEBIAN_SECURE_LINUX.md).

## 2. Start

```bash
docker compose up -d
```

Open `http://localhost`.

## 3. Check Health

```bash
./scripts/health-check.sh
docker compose ps
docker compose logs -f backend
```

## 4. Stop

```bash
docker compose down
```

Remove databases and queues:

```bash
docker compose down -v
```

## Local Development

Frontend:

```bash
pnpm --dir frontend dev
```

Backend:

```bash
cd backend
go run ./cmd/server
```

Generate or rotate local secrets:

```bash
node scripts/gen-env.mjs --force
```

Standalone safe file viewer:

```bash
cd file-viewer
npm install
npm start
```
