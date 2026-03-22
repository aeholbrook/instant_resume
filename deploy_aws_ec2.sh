#!/bin/bash
# AWS EC2 Deployment Script
# Run this script ON your EC2 instance after SSH'ing in

set -e

echo "🚀 Resume Editor - AWS EC2 Setup Script"
echo "========================================"

# Update system
echo ""
echo "📦 Updating system packages..."
sudo apt-get update

# Install Docker
echo ""
echo "🐳 Installing Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker ubuntu
    rm get-docker.sh
    echo "✅ Docker installed"
else
    echo "✅ Docker already installed"
fi

# Install docker-compose
echo ""
echo "📦 Installing docker-compose..."
if ! command -v docker-compose &> /dev/null; then
    sudo apt-get install -y docker-compose
    echo "✅ docker-compose installed"
else
    echo "✅ docker-compose already installed"
fi

# Install git if not present
if ! command -v git &> /dev/null; then
    echo ""
    echo "📦 Installing git..."
    sudo apt-get install -y git
fi

echo ""
echo "✅ All prerequisites installed!"
echo ""
echo "Next steps:"
echo "1. Clone your repository or upload your application files"
echo "   git clone https://github.com/your-username/instant-resume.git"
echo ""
echo "2. Navigate to the application directory"
echo "   cd instant-resume"
echo ""
echo "3. Start the application"
echo "   docker-compose up -d"
echo ""
echo "4. Check the status"
echo "   docker-compose ps"
echo "   curl http://localhost/api/status"
echo ""
echo "5. View logs"
echo "   docker-compose logs -f"
echo ""
echo "⚠️  Note: If you just added yourself to the docker group, you may need to log out and back in for it to take effect"
