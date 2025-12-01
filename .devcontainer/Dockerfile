# LaTeX Resume Development Environment
# Optimized for fast builds and minimal size (~1GB vs 7GB with texlive-full)
FROM ubuntu:22.04

# Avoid interactive prompts during package installation
ENV DEBIAN_FRONTEND=noninteractive

# Install system dependencies in a single layer for efficiency
RUN apt-get update && apt-get install -y \
    # Core utilities
    curl \
    git \
    wget \
    unzip \
    sudo \
    ca-certificates \
    gnupg \
    lsb-release \
    # LaTeX packages (carefully selected for resume needs)
    texlive-latex-recommended \
    texlive-latex-extra \
    texlive-fonts-recommended \
    texlive-fonts-extra \
    texlive-science \
    texlive-pictures \
    texlive-bibtex-extra \
    texlive-latex-base \
    texlive-xetex \
    texlive-luatex \
    texlive-extra-utils \
    # Additional font packages and extras
    texlive-font-utils \
    # Try to get more LaTeX packages including bibliography and fonts
    texlive-base \
    texlive-publishers \
    # Build tools and linting
    latexmk \
    biber \
    chktex \
    # Development tools
    build-essential \
    python3 \
    python3-pip \
    python3-venv \
    # Utilities
    fontconfig \
    imagemagick \
    poppler-utils \
    # Clean up package cache to reduce image size
    && apt-get autoremove -y \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js LTS via NodeSource repository
RUN curl -fsSL https://deb.nodesource.com/setup_lts.x | bash - \
    && apt-get install -y nodejs \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user with sudo privileges
ARG USERNAME=vscode
ARG USER_UID=1000
ARG USER_GID=$USER_UID

RUN groupadd --gid $USER_GID $USERNAME \
    && useradd --uid $USER_UID --gid $USER_GID -m $USERNAME \
    && echo $USERNAME ALL=\(root\) NOPASSWD:ALL > /etc/sudoers.d/$USERNAME \
    && chmod 0440 /etc/sudoers.d/$USERNAME

# Install global npm packages for development (as root before switching users)
RUN npm install -g \
    typescript \
    eslint \
    prettier \
    @typescript-eslint/parser \
    @typescript-eslint/eslint-plugin

# Set working directory and switch to non-root user
WORKDIR /workspace
USER $USERNAME

# Verify installations work
RUN pdflatex --version && latexmk --version && node --version && npm --version