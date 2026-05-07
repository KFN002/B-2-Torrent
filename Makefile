.PHONY: help up down build rebuild clean logs restart health dev prod backup restore test lint format optimize

# Detect OS
ifeq ($(OS),Windows_NT)
    SHELL := pwsh.exe
    .SHELLFLAGS := -NoProfile -Command
    RM := Remove-Item -Recurse -Force
    MKDIR := New-Item -ItemType Directory -Force
else
    RM := rm -rf
    MKDIR := mkdir -p
endif

help:
	@echo "B-2-Torrent - Available Commands:"
	@echo ""
	@echo "🚀 Quick Start:"
	@echo "  make quick-start     - Build and start everything (optimized)"
	@echo "  make dev             - Start in development mode"
	@echo "  make prod            - Start in production mode (optimized)"
	@echo ""
	@echo "📦 Container Management:"
	@echo "  make up              - Start all services"
	@echo "  make down            - Stop all services"
	@echo "  make build           - Build all Docker images (cached)"
	@echo "  make rebuild         - Rebuild without cache"
	@echo "  make restart         - Restart all services"
	@echo ""
	@echo "⚡ Performance & Optimization:"
	@echo "  make optimize        - Optimize Docker images and system"
	@echo "  make clean-cache     - Clean Docker build cache"
	@echo "  make prune           - Remove unused Docker resources"
	@echo "  make health          - Check all services health"
	@echo "  make stats           - Show resource usage statistics"
	@echo "  make benchmark       - Run performance benchmarks"
	@echo ""
	@echo "📊 Monitoring & Logs:"
	@echo "  make logs            - Show all logs"
	@echo "  make logs-gateway    - Show API gateway logs"
	@echo "  make logs-frontend   - Show frontend logs"
	@echo "  make monitor         - Open monitoring dashboards"
	@echo ""
	@echo "🗄️  Database:"
	@echo "  make backup          - Backup database"
	@echo "  make restore         - Restore database"
	@echo "  make db-optimize     - Optimize PostgreSQL performance"
	@echo ""
	@echo "🧹 Cleanup:"
	@echo "  make clean           - Clean all data and volumes"
	@echo "  make clean-all       - Deep clean everything"

quick-start: optimize up
	@echo "✅ B-2-Torrent started successfully!"
	@echo "🌐 Web Interface: http://localhost"
	@echo "📊 RabbitMQ Console: http://localhost:15672"
	@echo "⚙️  Run 'make health' to check services status"

dev:
	@echo "Starting in development mode..."
	docker-compose -f docker-compose.yml up -d
	@echo "Dev environment ready at http://localhost:3000"

prod: optimize
	@echo "Starting in production mode (optimized)..."
	docker-compose up -d
	@echo "Production environment ready at http://localhost"

up:
	@echo "🚀 Starting B-2-Torrent services..."
	docker-compose up -d
	@echo "✅ Services started at http://localhost"

down:
	@echo "⏹️  Stopping services..."
	docker-compose down

build:
	@echo "🔨 Building with BuildKit (cached)..."
	DOCKER_BUILDKIT=1 COMPOSE_DOCKER_CLI_BUILD=1 docker-compose build --parallel

rebuild:
	@echo "🔨 Rebuilding all images from scratch..."
	DOCKER_BUILDKIT=1 COMPOSE_DOCKER_CLI_BUILD=1 docker-compose build --no-cache --parallel

optimize:
	@echo "⚡ Optimizing system..."
	@echo "  Pruning unused images..."
	@docker image prune -f
	@echo "  Pruning build cache..."
	@docker builder prune -f
	@echo "  Optimizing database..."
	@docker-compose exec -T postgres vacuumdb -U torrentuser -d torrentdb --analyze --verbose || true
	@echo "✅ Optimization complete"

clean-cache:
	@echo "🧹 Cleaning Docker build cache..."
	docker builder prune -af

prune:
	@echo "🧹 Removing unused Docker resources..."
	docker system prune -f
	@echo "✅ Cleanup complete"

clean:
	@echo "🧹 Cleaning up data and volumes..."
	docker-compose down -v
	@echo "✅ Cleanup complete"

clean-all:
	@echo "🧹 Deep cleaning everything..."
	docker-compose down -v --remove-orphans
	docker system prune -af --volumes
	$(RM) node_modules
	$(RM) .next
	@echo "✅ Deep clean complete"

logs:
	docker-compose logs -f --tail=100

logs-gateway:
	docker-compose logs -f --tail=100 api-gateway

logs-frontend:
	docker-compose logs -f --tail=100 frontend

logs-backend:
	docker-compose logs -f --tail=100 backend

restart:
	@echo "♻️  Restarting all services..."
	docker-compose restart

health:
	@echo "🏥 Health Check Report:"
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
	@docker-compose ps
	@echo ""
	@echo "🌐 Nginx: $$(curl -s -o /dev/null -w '%%{http_code}' http://localhost/health || echo 'DOWN')"
	@echo "🔌 Frontend: $$(curl -s -o /dev/null -w '%%{http_code}' http://localhost:3000 || echo 'DOWN')"
	@echo "⚙️  API Gateway: $$(curl -s -o /dev/null -w '%%{http_code}' http://localhost:8000/health || echo 'DOWN')"
	@echo "🗄️  PostgreSQL: $$(docker-compose exec -T postgres pg_isready -U torrentuser && echo 'UP' || echo 'DOWN')"
	@echo "📦 Redis: $$(docker-compose exec -T redis redis-cli ping 2>/dev/null || echo 'DOWN')"
	@echo "🐰 RabbitMQ: $$(curl -s -o /dev/null -w '%%{http_code}' http://localhost:15672 || echo 'DOWN')"

stats:
	@echo "📊 Resource Usage Statistics:"
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
	@docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}\t{{.BlockIO}}"

benchmark:
	@echo "🏃 Running performance benchmarks..."
	@which ab > /dev/null || (echo "Install apache-bench: brew install httpd (Mac) or apt-get install apache2-utils (Linux)" && exit 1)
	@echo "Testing API Gateway (10K requests, 100 concurrent)..."
	@ab -n 10000 -c 100 -q http://localhost:8000/health
	@echo ""
	@echo "Testing Frontend (5K requests, 50 concurrent)..."
	@ab -n 5000 -c 50 -q http://localhost:3000/

backup:
	@echo "💾 Creating database backup..."
	@$(MKDIR) backups
	@docker-compose exec -T postgres pg_dump -U torrentuser torrentdb > backups/backup_$$(date +%Y%m%d_%H%M%S).sql
	@echo "✅ Backup saved to backups/"

restore:
	@echo "📥 Restoring from latest backup..."
	@ls -t backups/*.sql | head -1 | xargs -I {} docker-compose exec -T postgres psql -U torrentuser torrentdb < {}
	@echo "✅ Restore complete"

db-optimize:
	@echo "⚡ Optimizing PostgreSQL database..."
	@docker-compose exec -T postgres vacuumdb -U torrentuser -d torrentdb --analyze --verbose
	@docker-compose exec -T postgres psql -U torrentuser -d torrentdb -c "REINDEX DATABASE torrentdb;"
	@echo "✅ Database optimized"

monitor:
	@echo "📊 Opening monitoring dashboards..."
	@echo "RabbitMQ Management: http://localhost:15672"
	@echo "Default credentials: admin / admin123"

browser-build:
	@echo "🌐 Building B2 Secure Browser..."
	cd browser && npm install && npm run build
	@echo "✅ Browser built. Run with: cd browser && npm start"

browser-package:
	@echo "📦 Packaging B2 Secure Browser for all platforms..."
	cd browser && npm run package:all
	@echo "✅ Executables created in browser/dist/"

test:
	@echo "🧪 Running tests..."
	@echo "Backend tests..."
	cd backend && go test -v -race -coverprofile=coverage.out ./...
	@echo "Frontend tests..."
	npm run test

install-deps:
	@echo "📦 Installing all dependencies..."
	@echo "Installing frontend dependencies..."
	npm install
	@echo "Installing browser dependencies..."
	cd browser && npm install
	@echo "Installing Go dependencies..."
	cd backend && go mod download
	@echo "✅ All dependencies installed"
