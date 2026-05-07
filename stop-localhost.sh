#!/bin/bash

# B-2-Torrent Localhost Shutdown Script

echo "🛑 Stopping B-2-Torrent..."

# Stop containers gracefully
docker-compose down

# Clean up temp data
echo "🧹 Cleaning up temporary data..."
docker volume rm $(docker volume ls -q | grep b2torrent) 2>/dev/null || true

# Remove temp directories
rm -rf /tmp/b2torrent-* 2>/dev/null || true

echo "✅ Cleanup complete!"
echo ""
echo "Note: Your downloaded files in ~/Downloads/B2Torrent are preserved."
echo "To remove them: rm -rf ~/Downloads/B2Torrent"
