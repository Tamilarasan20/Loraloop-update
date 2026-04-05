#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# Postiz Self-Hosted Setup Script for Loraloop.ai
# ═══════════════════════════════════════════════════════════════

set -e

echo "🚀 Loraloop.ai — Postiz Self-Hosted Setup"
echo "═══════════════════════════════════════════"
echo ""

# Check Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed."
    echo ""
    echo "Please install Docker Desktop for Mac:"
    echo "  → https://docs.docker.com/desktop/install/mac-install/"
    echo ""
    echo "After installing, run this script again."
    exit 1
fi

echo "✅ Docker found: $(docker --version)"

# Check Docker Compose
if ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose plugin is not available."
    echo "   Please update Docker Desktop to the latest version."
    exit 1
fi

echo "✅ Docker Compose found: $(docker compose version --short)"

# Check .env.postiz
if [ ! -f .env.postiz ]; then
    echo ""
    echo "📋 Creating .env.postiz from example..."
    cp .env.postiz.example .env.postiz

    # Generate random JWT secret
    JWT_SECRET=$(openssl rand -hex 32)
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s/CHANGE_ME_TO_A_RANDOM_STRING_1234567890abcdef/$JWT_SECRET/" .env.postiz
    else
        sed -i "s/CHANGE_ME_TO_A_RANDOM_STRING_1234567890abcdef/$JWT_SECRET/" .env.postiz
    fi

    echo "✅ .env.postiz created with random JWT secret"
    echo ""
    echo "⚠️  IMPORTANT: Edit .env.postiz to add your social media API keys!"
    echo "   Each platform has a registration URL in the comments."
    echo ""
fi

# Start the stack
echo "🐳 Starting Postiz stack..."
echo "   This will pull images on first run (~2-3 GB). Please wait..."
echo ""

docker compose up -d

echo ""
echo "═══════════════════════════════════════════"
echo "✅ Postiz stack is starting!"
echo ""
echo "📍 Postiz Frontend:   http://localhost:4007"
echo "📍 Temporal UI:       http://localhost:8080"
echo "📍 Loraloop.ai:       http://localhost:3000"
echo ""
echo "1️⃣  Open http://localhost:4007 to create your Postiz admin account"
echo "2️⃣  Connect your social media accounts in Postiz Settings"
echo "3️⃣  Run 'npm run dev' to start Loraloop.ai"
echo ""
echo "To stop:  docker compose down"
echo "To reset: docker compose down -v (removes all data)"
echo "═══════════════════════════════════════════"
