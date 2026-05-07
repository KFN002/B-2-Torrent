@echo off
setlocal enabledelayedexpansion

:: B-2-Torrent Launcher for Windows
:: Comprehensive startup script for all components

color 0A

:BANNER
cls
echo.
echo ============================================================
echo.
echo    ██████╗     ██████╗     ████████╗  ██████╗  ██████╗ 
echo    ██╔══██╗    ╚════██╗    ╚══██╔══╝ ██╔═══██╗ ██╔══██╗
echo    ██████╔╝     █████╔╝       ██║    ██║   ██║ ██████╔╝
echo    ██╔══██╗    ██╔═══╝        ██║    ██║   ██║ ██╔══██╗
echo    ██████╔╝    ███████╗       ██║    ╚██████╔╝ ██║  ██║
echo    ╚═════╝     ╚══════╝       ╚═╝     ╚═════╝  ╚═╝  ╚═╝
echo.
echo        The Ultimate Anonymous Torrent Client
echo.
echo ============================================================
echo.

:CHECK_DEPS
echo [INFO] Checking dependencies...
where docker >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Docker is not installed.
    echo Please install Docker Desktop from https://www.docker.com/
    pause
    exit /b 1
)

where docker-compose >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Docker Compose is not installed.
    pause
    exit /b 1
)

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [WARN] Node.js is not installed. Browser will not be available.
)

echo [OK] All dependencies are installed.
echo.

:MENU
echo ==================== MAIN MENU ====================
echo.
echo 1. Start All Services (Docker)
echo 2. Start Development Mode (Local)
echo 3. Start B2 Secure Browser
echo 4. Stop All Services
echo 5. View Logs
echo 6. Check Service Health
echo 7. Database Management
echo 8. Advanced Options
echo 9. Help ^& Documentation
echo 0. Exit
echo.
echo ===================================================
echo.
set /p choice="Enter your choice: "

if "%choice%"=="1" goto START_DOCKER
if "%choice%"=="2" goto START_DEV
if "%choice%"=="3" goto START_BROWSER
if "%choice%"=="4" goto STOP_SERVICES
if "%choice%"=="5" goto VIEW_LOGS
if "%choice%"=="6" goto CHECK_HEALTH
if "%choice%"=="7" goto DB_MANAGEMENT
if "%choice%"=="8" goto ADVANCED
if "%choice%"=="9" goto HELP
if "%choice%"=="0" goto EXIT

echo [ERROR] Invalid option. Please try again.
pause
goto MENU

:START_DOCKER
echo.
echo [START] Starting all B-2-Torrent services...
docker-compose up -d
echo.
echo Services started successfully!
echo.
echo Access URLs:
echo   Frontend:    http://localhost:3000
echo   Backend API: http://localhost:8080
echo   PostgreSQL:  localhost:5432
echo   Redis:       localhost:6379
echo   RabbitMQ:    http://localhost:15672 (admin/admin123)
echo.
pause
goto MENU

:START_DEV
echo.
echo [DEV] Starting development mode...
start cmd /k "cd backend && go run cmd/server/main.go"
start cmd /k "npm run dev"
echo.
echo Development mode started!
echo Frontend: http://localhost:3000
echo Backend:  http://localhost:8080
echo.
pause
goto MENU

:START_BROWSER
echo.
echo [BROWSER] Starting B2 Secure Browser...
cd browser
if not exist node_modules (
    echo [INFO] Installing browser dependencies...
    call npm install
)
call npm start
cd ..
goto MENU

:STOP_SERVICES
echo.
echo [STOP] Stopping all services...
docker-compose down
echo Services stopped.
pause
goto MENU

:VIEW_LOGS
echo.
echo ============ LOG VIEWER ============
echo 1. All Services
echo 2. API Gateway
echo 3. Torrent Service
echo 4. Security Service
echo 5. PostgreSQL
echo 0. Back
echo ====================================
set /p log_choice="Enter your choice: "

if "%log_choice%"=="1" docker-compose logs -f
if "%log_choice%"=="2" docker-compose logs -f api-gateway
if "%log_choice%"=="3" docker-compose logs -f torrent-service
if "%log_choice%"=="4" docker-compose logs -f security-service
if "%log_choice%"=="5" docker-compose logs -f postgres
if "%log_choice%"=="0" goto MENU
pause
goto MENU

:CHECK_HEALTH
echo.
echo [HEALTH] Checking service health...
docker-compose ps
echo.
echo Testing endpoints...
curl -s http://localhost:3000 >nul 2>&1 && echo Frontend:    OK || echo Frontend:    FAIL
curl -s http://localhost:8080/api/health >nul 2>&1 && echo Backend:     OK || echo Backend:     FAIL
echo.
pause
goto MENU

:DB_MANAGEMENT
echo.
echo ========= DATABASE MANAGEMENT =========
echo 1. Backup Database
echo 2. Restore Database
echo 3. Reset Database
echo 0. Back
echo =======================================
set /p db_choice="Enter your choice: "

if "%db_choice%"=="1" (
    if not exist backups mkdir backups
    set BACKUP_FILE=backups\backup_%date:~-4,4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%%time:~6,2%.sql
    echo [BACKUP] Creating backup...
    docker-compose exec -T postgres pg_dump -U torrentuser torrentdb > !BACKUP_FILE!
    echo Backup created: !BACKUP_FILE!
    pause
)

if "%db_choice%"=="3" (
    echo [WARN] This will delete ALL data. Are you sure? (Y/N)
    set /p confirm=
    if /i "!confirm!"=="Y" (
        docker-compose down -v
        docker-compose up -d
        echo Database reset complete
    )
    pause
)

if "%db_choice%"=="0" goto MENU
goto MENU

:ADVANCED
echo.
echo ========= ADVANCED OPTIONS =========
echo 1. Rebuild All Images
echo 2. Clean All Data
echo 3. Update Dependencies
echo 0. Back
echo ====================================
set /p adv_choice="Enter your choice: "

if "%adv_choice%"=="1" (
    echo [BUILD] Rebuilding all images...
    docker-compose build --no-cache --parallel
    echo Rebuild complete
    pause
)

if "%adv_choice%"=="2" (
    echo [WARN] This will delete everything. Continue? (Y/N)
    set /p confirm=
    if /i "!confirm!"=="Y" (
        docker-compose down -v --remove-orphans
        docker system prune -af --volumes
        echo Clean complete
    )
    pause
)

if "%adv_choice%"=="3" (
    echo [UPDATE] Updating dependencies...
    call npm install
    cd backend && go mod tidy && cd ..
    cd browser && npm install && cd ..
    echo Dependencies updated
    pause
)

if "%adv_choice%"=="0" goto MENU
goto MENU

:HELP
cls
echo.
echo ========== HELP ^& DOCUMENTATION ==========
echo.
echo Quick Start:
echo   1. Run option 1 to start all services
echo   2. Access http://localhost:3000
echo   3. Run option 3 for secure browser
echo.
echo Documentation:
echo   README.md         - Full documentation
echo   SECURITY.md       - Security best practices
echo   browser\README.md - Browser documentation
echo.
echo Support:
echo   GitHub: https://github.com/yourusername/b-2-torrent
echo.
echo ===========================================
pause
goto MENU

:EXIT
echo.
echo Thank you for using B-2-Torrent!
exit /b 0
