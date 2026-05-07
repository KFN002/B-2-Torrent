@echo off
REM Windows start script
echo Starting B-2-Torrent...
echo.

if not exist .env (
    echo Generating local secrets...
    node scripts\gen-env.mjs
)

docker compose up -d --build

if errorlevel 1 (
    echo Failed to start services!
    pause
    exit /b 1
)

echo.
echo B-2-Torrent started successfully!
echo.
echo Access the application at: http://localhost
echo.
timeout /t 3
start http://localhost
