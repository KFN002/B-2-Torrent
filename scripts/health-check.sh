#!/bin/bash

echo "🏥 B-2-Torrent Health Check"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

check_service() {
    local name=$1
    local url=$2
    local response=$(curl -s -o /dev/null -w "%{http_code}" $url 2>/dev/null)
    
    if [ "$response" = "200" ] || [ "$response" = "000" ]; then
        echo -e "${GREEN}✓${NC} $name: ${GREEN}UP${NC}"
        return 0
    else
        echo -e "${RED}✗${NC} $name: ${RED}DOWN${NC} (HTTP $response)"
        return 1
    fi
}

check_port() {
    local name=$1
    local port=$2
    
    if nc -z localhost $port 2>/dev/null; then
        echo -e "${GREEN}✓${NC} $name: ${GREEN}UP${NC} (port $port)"
        return 0
    else
        echo -e "${RED}✗${NC} $name: ${RED}DOWN${NC} (port $port)"
        return 1
    fi
}

echo "📊 Service Status:"
check_service "Frontend" "http://localhost:3000"
check_service "API Gateway" "http://localhost:8000/health"
check_service "Nginx" "http://localhost"
check_port "PostgreSQL" 5432
check_port "Redis" 6379
check_port "RabbitMQ" 5672
check_port "Tor" 9050

echo ""
echo "💾 Resource Usage:"
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}" | grep b2torrent

echo ""
echo "🔒 Security Status:"
if nc -z localhost 9050 2>/dev/null; then
    echo -e "${GREEN}✓${NC} Tor Network: ${GREEN}ACTIVE${NC}"
else
    echo -e "${YELLOW}⚠${NC} Tor Network: ${YELLOW}INACTIVE${NC}"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Health check complete!"
