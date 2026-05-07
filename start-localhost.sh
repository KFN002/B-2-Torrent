#!/bin/bash

# B-2-Torrent Localhost Startup Script

echo "🚀 Starting B-2-Torrent for localhost..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Create Downloads directory if it doesn't exist
DOWNLOAD_DIR="$HOME/Downloads/B2Torrent"
mkdir -p "$DOWNLOAD_DIR"
echo "✅ Download directory: $DOWNLOAD_DIR"

# Stop any existing containers
echo "🛑 Stopping existing containers..."
docker-compose down

# Clean up old volumes
echo "🧹 Cleaning up old data..."
docker volume prune -f

# Start services
echo "🐳 Starting services..."
docker-compose up -d

# Wait for services to be healthy
echo "⏳ Waiting for services to start..."
sleep 10

# Check health
if curl -f http://localhost:8080/health > /dev/null 2>&1; then
    echo "✅ Backend is healthy"
else
    echo "⚠️  Backend health check failed"
fi

echo ""
echo "🎉 B-2-Torrent is running!"
echo "📱 Frontend: http://localhost:3000"
echo "🔧 Backend API: http://localhost:8080"
echo "📁 Downloads: $DOWNLOAD_DIR"
echo ""
echo "To stop: docker-compose down"
echo "To clean up: docker-compose down -v && rm -rf $DOWNLOAD_DIR"
