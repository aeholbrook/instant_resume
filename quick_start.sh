#!/bin/bash
# Quick Start Script - Start the resume editor when you need it

set -e

echo "📝 LaTeX Resume Editor - Quick Start"
echo "===================================="

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo ""
    echo "🔧 First-time setup: Creating virtual environment..."
    python3 -m venv venv
    source venv/bin/activate
    pip install -q flask flask-cors python-docx pyyaml
    echo "✅ Setup complete!"
else
    source venv/bin/activate
fi

# Check if pdflatex is available
if ! command -v pdflatex &> /dev/null; then
    echo ""
    echo "⚠️  Warning: pdflatex not found"
    echo "LaTeX compilation will not work without it."
    echo ""
    echo "To install on:"
    echo "  Ubuntu/Debian: sudo apt install texlive-latex-base texlive-latex-extra"
    echo "  Mac: brew install --cask mactex"
    echo "  Windows: Download MiKTeX from miktex.org"
    echo ""
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo ""
echo "🚀 Starting application..."
echo ""

# Get local IP for network access info
LOCAL_IP=$(hostname -I 2>/dev/null | awk '{print $1}' || ifconfig 2>/dev/null | grep "inet " | grep -v 127.0.0.1 | head -1 | awk '{print $2}' | sed 's/addr://')

python start_webapp.py &
APP_PID=$!

# Wait for server to start
echo "⏳ Waiting for server to start..."
sleep 3

# Check if server is running
if curl -sf http://localhost:5000/api/status > /dev/null 2>&1; then
    echo ""
    echo "✅ Resume Editor is running!"
    echo ""
    echo "📍 Access the application:"
    echo "   Local:   http://localhost:5000"
    if [ ! -z "$LOCAL_IP" ]; then
        echo "   Network: http://$LOCAL_IP:5000"
        echo "            (Access from phone/tablet on same WiFi)"
    fi
    echo ""
    echo "⌨️  Press Ctrl+C to stop the server"
    echo ""

    # Keep script running and handle Ctrl+C
    trap "echo ''; echo '🛑 Stopping server...'; kill $APP_PID 2>/dev/null; echo '✅ Server stopped'; exit 0" INT TERM
    wait $APP_PID
else
    echo ""
    echo "❌ Failed to start server"
    echo "Check the error messages above"
    kill $APP_PID 2>/dev/null || true
    exit 1
fi
