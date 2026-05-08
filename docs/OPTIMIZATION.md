# B-2-Torrent Performance Optimization Guide

## 🚀 Quick Optimization Checklist

### Immediate Performance Gains
```bash
# Run comprehensive optimization
make optimize

# Check system health
make health

# View resource usage
make stats
```

## 📊 System Requirements

### Minimum (Development)
- CPU: 2 cores
- RAM: 4GB
- Storage: 10GB SSD

### Recommended (Production)
- CPU: 4-8 cores
- RAM: 8-16GB
- Storage: 50GB NVMe SSD
- Network: 100Mbps+

### Optimal (High Performance)
- CPU: 8+ cores
- RAM: 32GB+
- Storage: 500GB NVMe SSD
- Network: 1Gbps+

## ⚡ Docker Optimization

### Build Performance
```bash
# Use BuildKit for faster builds (enabled by default)
export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1

# Parallel builds
docker-compose build --parallel

# Clean build cache periodically
make clean-cache
```

### Runtime Optimization
```bash
# Resource limits are pre-configured in docker-compose.yml
# Nginx: 128MB RAM, 0.5 CPU
# Redis: 384MB RAM, 0.5 CPU
# PostgreSQL: 1GB RAM, 2 CPU
# Frontend: 512MB RAM, 1 CPU
# API Gateway: 512MB RAM, 1 CPU

# Scale services based on load
docker-compose up -d --scale torrent-service=5
```

### Image Size Optimization
```
Current optimized sizes:
- Backend: ~15MB (Alpine + UPX compression)
- Frontend: ~120MB (Multi-stage build)
- Total deployment: <500MB
```

## 🗄️ Database Optimization

### PostgreSQL Tuning
```sql
-- Already configured in docker-compose.yml:
-- shared_buffers=256MB
-- effective_cache_size=1GB
-- work_mem=4MB
-- maintenance_work_mem=64MB

-- Manual optimization
make db-optimize
```

### Connection Pooling
```go
// Configured in pkg/database/pgx.go:
MaxConns: 50
MinConns: 10
MaxConnLifetime: 1 hour
MaxConnIdleTime: 30 minutes
HealthCheckPeriod: 1 minute
```

### Query Optimization
```sql
-- All queries use prepared statements
-- Indexes on frequently queried columns
-- Batch operations for bulk inserts
```

## 📦 Redis Caching Strategy

### Cache Configuration
```
Maxmemory: 256MB
Policy: allkeys-lru (evict least recently used)
TTL: 5 minutes for settings
Persistence: AOF (append-only file)
```

### What's Cached
- User settings (5min TTL)
- Security configurations (5min TTL)
- Torrent metadata (no TTL)
- Session data (15min TTL)

## 🌐 Frontend Optimization

### Build Optimizations
```javascript
// next.config.mjs optimizations:
- SWC minification
- Gzip compression
- Image optimization (AVIF, WebP)
- Code splitting
- Tree shaking
- Remove console.logs in production
```

### Runtime Performance
```typescript
// Implemented optimizations:
- React.memo for expensive components
- useCallback for event handlers
- useMemo for computed values
- Lazy loading for routes
- Debounced API calls
- Virtual scrolling for large lists
```

### Bundle Analysis
```bash
# Analyze bundle size
npm run build
npm run analyze
```

## 🔒 Security vs Performance Balance

### Zero-Log Mode (Maximum Anonymity)
```go
// Minimal logging (warnings and errors only)
config.Level = zap.NewAtomicLevelAt(zapcore.WarnLevel)
config.DisableCaller = true
config.DisableStacktrace = true
```

### Encryption Performance
```
AES-256-GCM: ~1GB/s throughput
ChaCha20-Poly1305: ~2GB/s throughput
Argon2id: 100-200ms key derivation
```

## 🌍 Network Optimization

### Tor Network
```
Circuit build time: 5-10 seconds
Throughput: 1-5 MB/s (varies)
Latency: +200-500ms overhead
```

### VPN Performance
```
WireGuard: ~1000 Mbps, 1ms latency
OpenVPN: ~300 Mbps, 5ms latency
```

### Multi-Proxy Performance
```
Single proxy: 100% speed
2 hops: ~70% speed
3 hops: ~50% speed
```

## 📈 Monitoring & Benchmarks

### Health Checks
```bash
# Check all services
make health

# Real-time stats
make stats

# View logs
make logs
```

### Performance Benchmarks
```bash
# API Gateway benchmark
make benchmark

# Results on M1 Mac (example):
# Requests per second: ~8000
# Time per request: ~0.125ms
# Transfer rate: ~2MB/s
```

### Database Performance
```sql
-- Check slow queries
SELECT * FROM pg_stat_statements 
ORDER BY mean_exec_time DESC 
LIMIT 10;

-- Check cache hit ratio (should be >95%)
SELECT 
  sum(heap_blks_hit) / (sum(heap_blks_hit) + sum(heap_blks_read)) 
  AS cache_hit_ratio 
FROM pg_statio_user_tables;
```

## 🎯 Platform-Specific Optimizations

### Linux
```bash
# Increase file descriptors
ulimit -n 65536

# Enable BBR TCP congestion control
sudo sysctl -w net.ipv4.tcp_congestion_control=bbr

# Use io_uring for better I/O
# (automatically used by PostgreSQL 18)
```

### Debian / Secure Linux

Use conservative performance tuning when anonymity routing matters more than raw throughput:

```bash
# Dedicated encrypted download location
sudo install -d -m 0700 -o "$USER" -g "$USER" /srv/b2torrent/downloads

# BuildKit for faster local rebuilds
export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1

# Keep the stack local-only unless a reviewed reverse proxy is used
docker compose ps
ss -ltnp | grep -E ':(80|3000|8080|5432|6379|9050|15672)\b'
```

For Debian stable and secure Linux distributions, prefer:

- Encrypted NVMe/SSD storage for downloads and database volumes.
- Rootless Docker or a dedicated VM when available.
- BBR only after testing it through your VPN/Tor route.
- `noatime` on dedicated encrypted download volumes when compatible with your backup policy.
- Separate VMs/profiles for torrenting, browsing, and untrusted-file inspection.

See [DEBIAN_SECURE_LINUX.md](DEBIAN_SECURE_LINUX.md) for the full hardening checklist.

### macOS
```bash
# Increase file descriptors
ulimit -n 10240

# Use Docker Desktop with VirtioFS
# (automatically configured)

# Allocate more resources to Docker
# Docker Desktop → Preferences → Resources
# CPUs: 4+, Memory: 8GB+, Swap: 2GB+
```

### Windows
```powershell
# Use WSL2 backend for Docker Desktop
# (automatically configured)

# Allocate resources
# Docker Desktop → Settings → Resources → WSL Integration
# Memory: 8GB+, CPUs: 4+

# Enable BuildKit
$env:DOCKER_BUILDKIT=1
```

## 🔥 Hot Performance Tips

### 1. Use SSD/NVMe Storage
- 10x faster than HDD
- Critical for database performance

### 2. Enable BuildKit
```bash
export DOCKER_BUILDKIT=1
# 2-5x faster builds
```

### 3. Prune Regularly
```bash
make prune  # Weekly
make clean-cache  # After large builds
```

### 4. Scale Horizontally
```bash
# Add more service replicas
docker-compose up -d --scale torrent-service=5
```

### 5. Use Redis Caching
```bash
# Already enabled by default
# 80-90% reduction in database queries
```

### 6. Optimize PostgreSQL
```bash
make db-optimize  # Monthly
```

### 7. Monitor Resource Usage
```bash
make stats  # Check for bottlenecks
```

## 🐛 Troubleshooting Performance Issues

### Slow Startup
```bash
# Check if pulling images
docker-compose pull

# Rebuild with cache
make build
```

### High Memory Usage
```bash
# Check stats
make stats

# Reduce service replicas
docker-compose up -d --scale torrent-service=1

# Restart services
make restart
```

### Slow Database Queries
```bash
# Optimize database
make db-optimize

# Check connection pool
# Logs will show if pool is exhausted
make logs-backend
```

### Network Latency
```bash
# Check Tor circuit
curl --socks5 localhost:9050 https://check.torproject.org

# Test direct connection
curl https://check.torproject.org
```

## 📖 Additional Resources

- Docker Performance: https://docs.docker.com/config/containers/resource_constraints/
- PostgreSQL Tuning: https://pgtune.leopard.in.ua/
- Next.js Optimization: https://nextjs.org/docs/advanced-features/measuring-performance
- Go Performance: https://go.dev/doc/diagnostics
