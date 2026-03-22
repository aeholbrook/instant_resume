#!/bin/bash
# Quick deployment script for Docker

set -e

echo "🚀 Resume Editor - Docker Deployment Script"
echo "==========================================="

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Error: Docker is not installed"
    echo "Please install Docker: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if docker-compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Error: docker-compose is not installed"
    echo "Please install docker-compose: https://docs.docker.com/compose/install/"
    exit 1
fi

echo ""
echo "📦 Building Docker image..."
docker-compose build

echo ""
echo "🔄 Starting container..."
docker-compose up -d

echo ""
echo "⏳ Waiting for application to start..."
sleep 10

# Health check
if curl -sf http://localhost/api/status > /dev/null 2>&1; then
    echo ""
    echo "✅ Deployment successful!"
    echo ""
    echo "📍 Application is running at: http://localhost"
    echo ""
    echo "Useful commands:"
    echo "  - View logs:        docker-compose logs -f"
    echo "  - Stop application: docker-compose down"
    echo "  - Restart:          docker-compose restart"
    echo "  - View status:      docker-compose ps"
else
    echo ""
    echo "⚠️  Application started but health check failed"
    echo "Check logs with: docker-compose logs"
fi
