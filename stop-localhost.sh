#!/bin/bash

# B-2-Torrent Localhost Shutdown Script

echo "🛑 Stopping B-2-Torrent..."

# Stop containers gracefully
docker compose down

echo "✅ Cleanup complete!"
echo ""
echo "Note: Your downloaded files in ~/Downloads/B2Torrent are preserved."
echo "To remove app databases and queues too: docker compose down -v"
echo "To remove them: rm -rf ~/Downloads/B2Torrent"
