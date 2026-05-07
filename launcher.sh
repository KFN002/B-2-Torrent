#!/bin/bash

# B-2-Torrent Launcher Menu
# Comprehensive startup script for all components

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Banner
echo -e "${CYAN}"
cat << "EOF"
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║   ██████╗     ██████╗     ████████╗  ██████╗  ██████╗      ║
║   ██╔══██╗    ╚════██╗    ╚══██╔══╝ ██╔═══██╗ ██╔══██╗     ║
║   ██████╔╝     █████╔╝       ██║    ██║   ██║ ██████╔╝     ║
║   ██╔══██╗    ██╔═══╝        ██║    ██║   ██║ ██╔══██╗     ║
║   ██████╔╝    ███████╗       ██║    ╚██████╔╝ ██║  ██║     ║
║   ╚═════╝     ╚══════╝       ╚═╝     ╚═════╝  ╚═╝  ╚═╝     ║
║                                                              ║
║        The Ultimate Anonymous Torrent Client 🚀               ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

# Check dependencies
check_dependencies() {
    echo -e "${BLUE}[INFO] Checking dependencies...${NC}"
    
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}[ERROR] Docker is not installed. Please install Docker first.${NC}"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        echo -e "${RED}[ERROR] Docker Compose is not installed. Please install Docker Compose first.${NC}"
        exit 1
    fi
    
    if ! command -v node &> /dev/null; then
        echo -e "${YELLOW}[WARN] Node.js is not installed. Browser and VPN client will not be available.${NC}"
    fi
    
    echo -e "${GREEN}[OK] All dependencies are installed.${NC}"
}

# Show main menu
show_menu() {
    echo ""
    echo -e "${PURPLE}═══════════════════════ MAIN MENU ═══════════════════════${NC}"
    echo -e "${CYAN}1.${NC} Start All Services (Docker)"
    echo -e "${CYAN}2.${NC} Start Development Mode (Local)"
    echo -e "${CYAN}3.${NC} Start B2 Secure Browser"
    echo -e "${CYAN}4.${NC} Start B2 VPN Client"
    echo -e "${CYAN}5.${NC} Stop All Services"
    echo -e "${CYAN}6.${NC} View Logs"
    echo -e "${CYAN}7.${NC} Check Service Health"
    echo -e "${CYAN}8.${NC} Database Management"
    echo -e "${CYAN}9.${NC} Advanced Options"
    echo -e "${CYAN}10.${NC} Help & Documentation"
    echo -e "${CYAN}0.${NC} Exit"
    echo -e "${PURPLE}═════════════════════════════════════════════════════════${NC}"
    echo -n "Enter your choice: "
}

# Start all services via Docker
start_docker() {
    echo -e "${GREEN}[START] Starting all B-2-Torrent services...${NC}"
    docker-compose up -d
    echo ""
    echo -e "${GREEN}✓ Services started successfully!${NC}"
    echo ""
    echo -e "${CYAN}Access URLs:${NC}"
    echo -e "  Frontend:    ${YELLOW}http://localhost:3000${NC}"
    echo -e "  Backend API: ${YELLOW}http://localhost:8080${NC}"
    echo -e "  PostgreSQL:  ${YELLOW}localhost:5432${NC}"
    echo -e "  Redis:       ${YELLOW}localhost:6379${NC}"
    echo -e "  RabbitMQ:    ${YELLOW}http://localhost:15672${NC} (admin/admin123)"
    echo ""
    echo -e "${BLUE}[TIP] Run option 3 to start the B2 Secure Browser${NC}"
}

# Start development mode
start_dev() {
    echo -e "${GREEN}[DEV] Starting development mode...${NC}"
    
    # Check if backend is needed
    echo -e "${BLUE}[INFO] Starting backend...${NC}"
    cd backend
    go mod download
    go run cmd/server/main.go &
    BACKEND_PID=$!
    cd ..
    
    # Start frontend
    echo -e "${BLUE}[INFO] Starting frontend...${NC}"
    npm install
    npm run dev &
    FRONTEND_PID=$!
    
    echo ""
    echo -e "${GREEN}✓ Development mode started!${NC}"
    echo -e "${CYAN}Frontend: ${YELLOW}http://localhost:3000${NC}"
    echo -e "${CYAN}Backend:  ${YELLOW}http://localhost:8080${NC}"
    echo ""
    echo -e "${YELLOW}[WARN] Press Ctrl+C to stop services${NC}"
    
    # Wait for user to stop
    trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null" EXIT
    wait
}

# Start B2 Secure Browser
start_browser() {
    echo -e "${GREEN}[BROWSER] Starting B2 Secure Browser...${NC}"
    
    if ! command -v node &> /dev/null; then
        echo -e "${RED}[ERROR] Node.js is not installed. Cannot start browser.${NC}"
        return
    fi
    
    cd browser
    
    # Check if dependencies are installed
    if [ ! -d "node_modules" ]; then
        echo -e "${BLUE}[INFO] Installing browser dependencies...${NC}"
        npm install
    fi
    
    echo -e "${CYAN}[INFO] Launching browser...${NC}"
    npm start
}

# Start B2 VPN Client
start_vpn_client() {
    echo -e "${GREEN}[VPN] Starting B2 VPN Client...${NC}"
    
    if ! command -v node &> /dev/null; then
        echo -e "${RED}[ERROR] Node.js is not installed. Cannot start VPN client.${NC}"
        return
    fi
    
    cd vpn-client
    
    if [ ! -d "node_modules" ]; then
        echo -e "${BLUE}[INFO] Installing VPN client dependencies...${NC}"
        npm install
    fi
    
    echo -e "${CYAN}[INFO] Launching VPN client...${NC}"
    echo -e "${YELLOW}[NOTE] VPN client requires administrator/root privileges for system-wide proxy${NC}"
    
    if [ "$(uname)" == "Darwin" ] || [ "$(expr substr $(uname -s) 1 5)" == "Linux" ]; then
        sudo npm start
    else
        npm start
    fi
}

# Stop all services
stop_services() {
    echo -e "${YELLOW}[STOP] Stopping all services...${NC}"
    docker-compose down
    echo -e "${GREEN}✓ All services stopped.${NC}"
}

# View logs
view_logs() {
    echo -e "${PURPLE}═══════════════════ LOG VIEWER ══════════════════${NC}"
    echo -e "${CYAN}1.${NC} All Services"
    echo -e "${CYAN}2.${NC} API Gateway"
    echo -e "${CYAN}3.${NC} Torrent Service"
    echo -e "${CYAN}4.${NC} Security Service"
    echo -e "${CYAN}5.${NC} PostgreSQL"
    echo -e "${CYAN}6.${NC} Redis"
    echo -e "${CYAN}7.${NC} RabbitMQ"
    echo -e "${CYAN}0.${NC} Back"
    echo -e "${PURPLE}═════════════════════════════════════════════════${NC}"
    echo -n "Enter your choice: "
    read log_choice
    
    case $log_choice in
        1) docker-compose logs -f ;;
        2) docker-compose logs -f api-gateway ;;
        3) docker-compose logs -f torrent-service ;;
        4) docker-compose logs -f security-service ;;
        5) docker-compose logs -f postgres ;;
        6) docker-compose logs -f redis ;;
        7) docker-compose logs -f rabbitmq ;;
        0) return ;;
        *) echo -e "${RED}Invalid option${NC}" ;;
    esac
}

# Check service health
check_health() {
    echo -e "${BLUE}[HEALTH] Checking service health...${NC}"
    echo ""
    
    docker-compose ps
    
    echo ""
    echo -e "${CYAN}Testing endpoints...${NC}"
    
    # Test frontend
    if curl -s http://localhost:3000 > /dev/null; then
        echo -e "Frontend:    ${GREEN}✓ Healthy${NC}"
    else
        echo -e "Frontend:    ${RED}✗ Unhealthy${NC}"
    fi
    
    # Test backend
    if curl -s http://localhost:8080/api/health > /dev/null; then
        echo -e "Backend:     ${GREEN}✓ Healthy${NC}"
    else
        echo -e "Backend:     ${RED}✗ Unhealthy${NC}"
    fi
    
    # Test PostgreSQL
    if docker-compose exec -T postgres pg_isready -U torrentuser > /dev/null 2>&1; then
        echo -e "PostgreSQL:  ${GREEN}✓ Healthy${NC}"
    else
        echo -e "PostgreSQL:  ${RED}✗ Unhealthy${NC}"
    fi
    
    # Test Redis
    if docker-compose exec -T redis redis-cli ping > /dev/null 2>&1; then
        echo -e "Redis:       ${GREEN}✓ Healthy${NC}"
    else
        echo -e "Redis:       ${RED}✗ Unhealthy${NC}"
    fi
}

# Database management
db_management() {
    echo -e "${PURPLE}═══════════════ DATABASE MANAGEMENT ════════════════${NC}"
    echo -e "${CYAN}1.${NC} Backup Database"
    echo -e "${CYAN}2.${NC} Restore Database"
    echo -e "${CYAN}3.${NC} Reset Database"
    echo -e "${CYAN}4.${NC} View Database Logs"
    echo -e "${CYAN}0.${NC} Back"
    echo -e "${PURPLE}════════════════════════════════════════════════════${NC}"
    echo -n "Enter your choice: "
    read db_choice
    
    case $db_choice in
        1)
            mkdir -p backups
            BACKUP_FILE="backups/backup_$(date +%Y%m%d_%H%M%S).sql"
            echo -e "${BLUE}[BACKUP] Creating backup...${NC}"
            docker-compose exec -T postgres pg_dump -U torrentuser torrentdb > "$BACKUP_FILE"
            echo -e "${GREEN}✓ Backup created: $BACKUP_FILE${NC}"
            ;;
        2)
            echo -e "${YELLOW}[RESTORE] Available backups:${NC}"
            ls -lh backups/*.sql 2>/dev/null || echo "No backups found"
            echo -n "Enter backup filename: "
            read backup_file
            docker-compose exec -T postgres psql -U torrentuser torrentdb < "$backup_file"
            echo -e "${GREEN}✓ Database restored${NC}"
            ;;
        3)
            echo -e "${RED}[WARN] This will delete ALL data. Are you sure? (yes/no)${NC}"
            read confirm
            if [ "$confirm" = "yes" ]; then
                docker-compose down -v
                docker-compose up -d
                echo -e "${GREEN}✓ Database reset complete${NC}"
            fi
            ;;
        4)
            docker-compose logs -f postgres
            ;;
        0) return ;;
        *) echo -e "${RED}Invalid option${NC}" ;;
    esac
}

# Advanced options
advanced_options() {
    echo -e "${PURPLE}══════════════════ ADVANCED OPTIONS ═══════════════${NC}"
    echo -e "${CYAN}1.${NC} Rebuild All Images"
    echo -e "${CYAN}2.${NC} Clean All Data"
    echo -e "${CYAN}3.${NC} Scale Services"
    echo -e "${CYAN}4.${NC} Run Tests"
    echo -e "${CYAN}5.${NC} View System Resources"
    echo -e "${CYAN}6.${NC} Update Dependencies"
    echo -e "${CYAN}0.${NC} Back"
    echo -e "${PURPLE}════════════════════════════════════════════════════${NC}"
    echo -n "Enter your choice: "
    read adv_choice
    
    case $adv_choice in
        1)
            echo -e "${BLUE}[BUILD] Rebuilding all images...${NC}"
            DOCKER_BUILDKIT=1 docker-compose build --no-cache --parallel
            echo -e "${GREEN}✓ Rebuild complete${NC}"
            ;;
        2)
            echo -e "${RED}[WARN] This will delete all containers, volumes, and images. Continue? (yes/no)${NC}"
            read confirm
            if [ "$confirm" = "yes" ]; then
                docker-compose down -v --remove-orphans
                docker system prune -af --volumes
                echo -e "${GREEN}✓ Clean complete${NC}"
            fi
            ;;
        3)
            echo -e "${BLUE}[SCALE] Scaling services...${NC}"
            docker-compose up -d --scale torrent-service=3 --scale security-service=2
            echo -e "${GREEN}✓ Services scaled${NC}"
            ;;
        4)
            echo -e "${BLUE}[TEST] Running tests...${NC}"
            make test
            ;;
        5)
            echo -e "${BLUE}[RESOURCES] System resource usage:${NC}"
            docker stats --no-stream
            ;;
        6)
            echo -e "${BLUE}[UPDATE] Updating dependencies...${NC}"
            npm install
            cd backend && go mod tidy && cd ..
            cd browser && npm install && cd ..
            echo -e "${GREEN}✓ Dependencies updated${NC}"
            ;;
        0) return ;;
        *) echo -e "${RED}Invalid option${NC}" ;;
    esac
}

# Help and documentation
show_help() {
    echo -e "${PURPLE}═══════════════════ HELP & DOCUMENTATION ══════════════════${NC}"
    echo ""
    echo -e "${CYAN}Quick Start:${NC}"
    echo "  1. Run option 1 to start all services with Docker"
    echo "  2. Access web app at http://localhost:3000"
    echo "  3. Run option 3 to start the secure browser"
    echo ""
    echo -e "${CYAN}First Time Setup:${NC}"
    echo "  1. Configure VPN/Tor in the Network page"
    echo "  2. Set security preferences in Settings"
    echo "  3. Choose download directory"
    echo ""
    echo -e "${CYAN}Documentation:${NC}"
    echo "  README.md         - Full documentation"
    echo "  SECURITY.md       - Security best practices"
    echo "  browser/README.md - Browser documentation"
    echo ""
    echo -e "${CYAN}Support:${NC}"
    echo "  GitHub: https://github.com/yourusername/b-2-torrent"
    echo "  Email:  support@b2torrent.com"
    echo ""
    read -p "Press Enter to continue..."
}

# Main loop
main() {
    check_dependencies
    
    while true; do
        show_menu
        read choice
        
        case $choice in
            1) start_docker ;;
            2) start_dev ;;
            3) start_browser ;;
            4) start_vpn_client ;;
            5) stop_services ;;
            6) view_logs ;;
            7) check_health ;;
            8) db_management ;;
            9) advanced_options ;;
            10) show_help ;;
            0) 
                echo -e "${GREEN}Thank you for using B-2-Torrent!${NC}"
                exit 0
                ;;
            *) echo -e "${RED}Invalid option. Please try again.${NC}" ;;
        esac
        
        echo ""
        read -p "Press Enter to continue..."
    done
}

# Run main
main
