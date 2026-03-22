FROM ubuntu:22.04

# Prevent interactive prompts during package installation
ENV DEBIAN_FRONTEND=noninteractive

# Install system dependencies
RUN apt-get update && apt-get install -y \
    python3.10 \
    python3-pip \
    texlive-latex-base \
    texlive-latex-extra \
    texlive-fonts-recommended \
    texlive-fonts-extra \
    texlive-xetex \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy application files
COPY . /app/

# Install Python dependencies
RUN pip3 install --no-cache-dir \
    flask>=2.3.0 \
    flask-cors>=4.0.0 \
    werkzeug>=2.3.0 \
    python-docx>=0.8.11 \
    pyyaml>=6.0 \
    gunicorn>=21.0.0

# Create projects directory if it doesn't exist
RUN mkdir -p /app/projects

# Set proper permissions
RUN chmod -R 755 /app

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD python3 -c "import urllib.request; urllib.request.urlopen('http://localhost:5000/api/status')" || exit 1

# Run application using gunicorn for production
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--chdir", "webapp/backend", "--workers", "2", "--timeout", "300", "app:app"]
