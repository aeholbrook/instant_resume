#!/usr/bin/env python3
"""
Quick start script for the LaTeX Resume Editor webapp.
This script launches the Flask backend which serves both the API and frontend.
"""

import os
import sys

# Add the webapp/backend directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'webapp', 'backend'))

# Import and run the app
from app import app, PROJECTS_DIR, project_manager, WEBAPP_DIR

if __name__ == '__main__':
    import subprocess

    print("Starting LaTeX Resume Editor Backend (Project Management Edition)")
    print(f"Projects directory: {PROJECTS_DIR}")
    print(f"Serving frontend from: {WEBAPP_DIR / 'frontend'}")
    print("=" * 50)

    # Check if pdflatex is available
    try:
        subprocess.run(['pdflatex', '--version'],
                      capture_output=True, check=True)
        print("pdflatex is available")
    except (subprocess.CalledProcessError, FileNotFoundError):
        print("Warning: pdflatex not found - PDF compilation will fail")

    # Ensure default project exists
    if not (PROJECTS_DIR / "default").exists():
        print("Warning: Default project not found, creating...")
        project_manager.create_project("default", "My Resume", "Main resume project")

    print("Starting server on http://localhost:5000")
    app.run(host='0.0.0.0', port=5000, debug=True)
