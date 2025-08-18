#!/bin/bash

# Requiem Tracking System Startup Script

set -e

echo "🚀 Starting Requiem Tracking System..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ .env file not found! Please copy .env.example to .env and configure it."
    echo "   cp .env.example .env"
    echo "   Edit the .env file with your Discord bot token and guild ID."
    exit 1
fi

# Source environment variables
source .env

# Check required environment variables
if [ -z "$DISCORD_TOKEN" ] || [ "$DISCORD_TOKEN" = "your_discord_bot_token_here" ]; then
    echo "❌ DISCORD_TOKEN not set in .env file!"
    echo "   Please set your Discord bot token in the .env file."
    exit 1
fi

if [ -z "$DISCORD_GUILD_ID" ] || [ "$DISCORD_GUILD_ID" = "your_guild_id_here" ]; then
    echo "❌ DISCORD_GUILD_ID not set in .env file!"
    echo "   Please set your Discord guild ID in the .env file."
    exit 1
fi

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p data logs

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running! Please start Docker and try again."
    exit 1
fi

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    echo "❌ docker-compose not found! Please install docker-compose."
    exit 1
fi

# Determine which compose file to use
COMPOSE_FILE="docker-compose.yml"
if [ "$1" = "dev" ]; then
    COMPOSE_FILE="docker-compose.dev.yml"
    echo "🔧 Starting in development mode..."
else
    echo "🏭 Starting in production mode..."
fi

# Stop any existing containers
echo "🛑 Stopping existing containers..."
docker-compose -f $COMPOSE_FILE down

# Build and start containers
echo "🔨 Building and starting containers..."
docker-compose -f $COMPOSE_FILE up --build -d

# Wait a moment for services to start
echo "⏳ Waiting for services to start..."
sleep 5

# Check container status
echo "📊 Container status:"
docker-compose -f $COMPOSE_FILE ps

echo ""
echo "✅ Requiem Tracking System started successfully!"
echo ""
echo "🌐 Frontend: http://localhost:3001
echo "🔌 API: http://localhost:8000"
echo "📚 API Docs: http://localhost:8000/docs"
echo ""
echo "📝 To view logs:"
echo "   docker-compose -f $COMPOSE_FILE logs -f"
echo ""
echo "🛑 To stop the system:"
echo "   docker-compose -f $COMPOSE_FILE down"
