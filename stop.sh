#!/bin/bash

# Requiem Tracking System Stop Script

set -e

echo "🛑 Stopping Requiem Tracking System..."

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    echo "❌ docker-compose not found! Please install docker-compose."
    exit 1
fi

# Stop production containers
if [ -f docker-compose.yml ]; then
    echo "🏭 Stopping production containers..."
    docker-compose -f docker-compose.yml down
fi

# Stop development containers
if [ -f docker-compose.dev.yml ]; then
    echo "🔧 Stopping development containers..."
    docker-compose -f docker-compose.dev.yml down
fi

echo "✅ Requiem Tracking System stopped successfully!"

# Optionally clean up (uncomment if needed)
# echo "🧹 Cleaning up unused containers and images..."
# docker system prune -f
