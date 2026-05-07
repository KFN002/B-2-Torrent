param(
    [switch]$ForceEnv
)

$ErrorActionPreference = "Stop"
$Root = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location $Root

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    throw "Docker Desktop is required: https://www.docker.com/products/docker-desktop/"
}

docker info *> $null
if ($LASTEXITCODE -ne 0) {
    throw "Docker is installed but not running. Start Docker Desktop and re-run this script."
}

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    throw "Node.js 22+ is required: https://nodejs.org/"
}

if ((-not (Test-Path ".env")) -or $ForceEnv) {
    if ($ForceEnv) {
        node scripts/gen-env.mjs --force
    } else {
        node scripts/gen-env.mjs
    }
} else {
    Write-Host ".env already exists; keeping existing secrets."
}

corepack enable
pnpm --dir frontend install --frozen-lockfile
docker compose build

Write-Host ""
Write-Host "B-2-Torrent is installed."
Write-Host "Start it with: docker compose up -d"
Write-Host "Open: http://localhost"
