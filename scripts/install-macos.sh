#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

command -v docker >/dev/null 2>&1 || {
  echo "Docker Desktop is required: https://www.docker.com/products/docker-desktop/"
  exit 1
}

docker info >/dev/null 2>&1 || {
  echo "Docker is installed but not running. Start Docker Desktop and re-run this script."
  exit 1
}

command -v node >/dev/null 2>&1 || {
  echo "Node.js 22+ is required: https://nodejs.org/"
  exit 1
}

if [ ! -f .env ]; then
  node scripts/gen-env.mjs
else
  echo ".env already exists; keeping existing secrets."
fi

corepack enable
pnpm --dir frontend install --frozen-lockfile

docker compose build

echo
echo "B-2-Torrent is installed."
echo "Start it with: docker compose up -d"
echo "Open: http://localhost"
