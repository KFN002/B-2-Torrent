@echo off
REM Windows start script
echo Starting B-2-Torrent...
echo.

docker-compose up -d

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
