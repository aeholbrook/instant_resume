#!/usr/bin/env python3
"""
Quick Start Script for LaTeX Resume Webapp

This script sets up and launches the web application with proper dependencies.
"""

import subprocess
import sys
import os
from pathlib import Path

def install_dependencies():
    """Install required Python packages."""
    print("📦 Installing Python dependencies...")
    requirements_path = Path(__file__).parent / "webapp" / "backend" / "requirements.txt"
    venv_dir = Path(__file__).parent / "venv"

    try:
        # Create virtual environment if it doesn't exist
        if not venv_dir.exists():
            print("🔧 Creating virtual environment...")
            subprocess.run([
                sys.executable, "-m", "venv", str(venv_dir)
            ], check=True)

        # Get pip executable from venv
        pip_executable = venv_dir / "bin" / "pip"
        if not pip_executable.exists():
            # Windows path
            pip_executable = venv_dir / "Scripts" / "pip.exe"

        # Install dependencies in virtual environment
        subprocess.run([
            str(pip_executable), "install", "-r", str(requirements_path)
        ], check=True)
        print("✅ Dependencies installed successfully")
        return True, venv_dir
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to install dependencies: {e}")
        return False, None

def check_latex():
    """Check if LaTeX is available."""
    try:
        result = subprocess.run(["pdflatex", "--version"],
                              capture_output=True, text=True)
        if result.returncode == 0:
            print("✅ LaTeX (pdflatex) is available")
            return True
        else:
            print("❌ LaTeX (pdflatex) not found")
            return False
    except FileNotFoundError:
        print("❌ LaTeX (pdflatex) not found in PATH")
        return False

def start_webapp(venv_dir):
    """Start the Flask webapp."""
    print("🚀 Starting LaTeX Resume Webapp...")

    # Change to backend directory
    backend_dir = Path(__file__).parent / "webapp" / "backend"
    os.chdir(backend_dir)

    # Get Python executable from venv
    python_executable = venv_dir / "bin" / "python"
    if not python_executable.exists():
        # Windows path
        python_executable = venv_dir / "Scripts" / "python.exe"

    # Add project root to Python path
    project_root = Path(__file__).parent
    env = os.environ.copy()
    env['PYTHONPATH'] = str(project_root) + os.pathsep + env.get('PYTHONPATH', '')

    try:
        subprocess.run([str(python_executable), "app.py"], env=env)
    except KeyboardInterrupt:
        print("\n🛑 Webapp stopped")
    except Exception as e:
        print(f"❌ Failed to start webapp: {e}")

def main():
    print("🔨 LaTeX Resume Webapp Setup")
    print("=" * 40)

    # Check prerequisites
    if not check_latex():
        print("\n⚠️  LaTeX is required for PDF compilation.")
        print("Please install LaTeX (e.g., 'sudo apt install texlive-latex-recommended')")
        return False

    # Install dependencies
    success, venv_dir = install_dependencies()
    if not success:
        return False

    print("\n" + "=" * 40)
    print("🌐 Starting webapp...")
    print("📖 Open http://localhost:5000 in your browser")
    print("⌨️  Press Ctrl+C to stop")
    print("=" * 40 + "\n")

    # Start the webapp
    start_webapp(venv_dir)

    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)