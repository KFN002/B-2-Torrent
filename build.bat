@echo off
REM Windows build script
echo Building B-2-Torrent for Windows...
echo.

REM Check Docker
docker --version >nul 2>&1
if errorlevel 1 (
    echo Docker not found! Please install Docker Desktop.
    exit /b 1
)

REM Build images
echo Building Docker images...
set DOCKER_BUILDKIT=1
set COMPOSE_DOCKER_CLI_BUILD=1
docker-compose build --parallel

if errorlevel 1 (
    echo Build failed!
    exit /b 1
)

echo.
echo Build complete! Run 'start.bat' to launch the application.
pause
