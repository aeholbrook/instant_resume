#!/usr/bin/env python3
"""
Flask backend for LaTeX Resume Editor
Provides API endpoints for file management, compilation, and PDF serving.
"""

import os
import subprocess
import sys
from pathlib import Path
from flask import Flask, jsonify, request, send_file, send_from_directory
from flask_cors import CORS
import tempfile
import shutil

app = Flask(__name__)
CORS(app)

# Configuration
PROJECT_ROOT = Path(__file__).parent.parent.parent
RESUME_DIR = PROJECT_ROOT / "resume"
WEBAPP_DIR = PROJECT_ROOT / "webapp"
TEMP_DIR = Path(tempfile.gettempdir()) / "instant_resume"

# Ensure directories exist
TEMP_DIR.mkdir(exist_ok=True)

class ResumeCompiler:
    def __init__(self):
        self.resume_dir = RESUME_DIR
        self.temp_dir = TEMP_DIR

    def get_resume_files(self):
        """Get list of LaTeX files in resume directory."""
        if not self.resume_dir.exists():
            return []

        tex_files = list(self.resume_dir.glob("*.tex"))
        sty_files = list(self.resume_dir.glob("*.sty"))

        files = [f.name for f in tex_files + sty_files]
        return sorted(files)

    def read_file(self, filename):
        """Read content of a resume file."""
        file_path = self.resume_dir / filename
        if not file_path.exists() or not file_path.is_file():
            return None

        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                return f.read()
        except Exception as e:
            print(f"Error reading file {filename}: {e}")
            return None

    def write_file(self, filename, content):
        """Write content to a resume file."""
        file_path = self.resume_dir / filename

        try:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            return True
        except Exception as e:
            print(f"Error writing file {filename}: {e}")
            return False

    def compile_resume(self):
        """Compile the LaTeX resume to PDF."""
        main_tex = self.resume_dir / "cv-llt.tex"
        if not main_tex.exists():
            return False, "Main LaTeX file (cv-llt.tex) not found"

        # Create temp working directory
        work_dir = self.temp_dir / "compile"
        if work_dir.exists():
            shutil.rmtree(work_dir)
        work_dir.mkdir(parents=True)

        try:
            # Copy all resume files to temp directory
            for file_path in self.resume_dir.iterdir():
                if file_path.is_file():
                    shutil.copy2(file_path, work_dir)

            # Run pdflatex
            cmd = ['pdflatex', '-interaction=nonstopmode', 'cv-llt.tex']
            result = subprocess.run(
                cmd,
                cwd=work_dir,
                capture_output=True,
                text=True,
                timeout=30
            )

            # Check if PDF was generated
            pdf_path = work_dir / "cv-llt.pdf"
            if pdf_path.exists():
                # Copy PDF to resume directory
                output_path = self.resume_dir / "cv-llt.pdf"
                shutil.copy2(pdf_path, output_path)
                return True, "Compilation successful"
            else:
                # Return compilation errors
                error_msg = result.stderr if result.stderr else result.stdout
                return False, f"PDF generation failed: {error_msg}"

        except subprocess.TimeoutExpired:
            return False, "Compilation timed out"
        except Exception as e:
            return False, f"Compilation error: {str(e)}"
        finally:
            # Clean up temp directory
            if work_dir.exists():
                shutil.rmtree(work_dir, ignore_errors=True)

    def get_pdf_path(self):
        """Get path to compiled PDF."""
        pdf_path = self.resume_dir / "cv-llt.pdf"
        return pdf_path if pdf_path.exists() else None

# Initialize compiler
compiler = ResumeCompiler()

@app.route('/')
def index():
    """Serve the main webapp."""
    return send_from_directory(WEBAPP_DIR / "frontend", "index.html")

@app.route('/<path:filename>')
def static_files(filename):
    """Serve static frontend files."""
    return send_from_directory(WEBAPP_DIR / "frontend", filename)

@app.route('/api/status')
def api_status():
    """Get application status and file list."""
    files = compiler.get_resume_files()
    pdf_exists = compiler.get_pdf_path() is not None

    return jsonify({
        'status': 'ready',
        'resume_files': files,
        'pdf_available': pdf_exists,
        'resume_dir': str(compiler.resume_dir)
    })

@app.route('/api/files/<filename>')
def api_get_file(filename):
    """Get content of a specific file."""
    content = compiler.read_file(filename)
    if content is None:
        return jsonify({'error': 'File not found'}), 404

    return jsonify({
        'filename': filename,
        'content': content
    })

@app.route('/api/files/<filename>', methods=['PUT'])
def api_save_file(filename):
    """Save content to a specific file."""
    data = request.get_json()
    if not data or 'content' not in data:
        return jsonify({'error': 'No content provided'}), 400

    success = compiler.write_file(filename, data['content'])
    if not success:
        return jsonify({'error': 'Failed to save file'}), 500

    return jsonify({
        'success': True,
        'filename': filename
    })

@app.route('/api/compile', methods=['POST'])
def api_compile():
    """Compile the LaTeX resume."""
    success, message = compiler.compile_resume()

    if success:
        return jsonify({
            'success': True,
            'message': message
        })
    else:
        return jsonify({
            'success': False,
            'error': message
        }), 400

@app.route('/api/pdf')
def api_get_pdf():
    """Serve the compiled PDF."""
    pdf_path = compiler.get_pdf_path()
    if not pdf_path:
        return jsonify({'error': 'PDF not available'}), 404

    return send_file(pdf_path, as_attachment=False, download_name='resume.pdf')

@app.route('/api/pdf/download')
def api_download_pdf():
    """Download the compiled PDF."""
    pdf_path = compiler.get_pdf_path()
    if not pdf_path:
        return jsonify({'error': 'PDF not available'}), 404

    return send_file(pdf_path, as_attachment=True, download_name='resume.pdf')

if __name__ == '__main__':
    print("🚀 Starting LaTeX Resume Editor Backend")
    print(f"📁 Resume directory: {RESUME_DIR}")
    print(f"🌐 Serving frontend from: {WEBAPP_DIR / 'frontend'}")
    print("=" * 50)

    # Check if pdflatex is available
    try:
        subprocess.run(['pdflatex', '--version'],
                      capture_output=True, check=True)
        print("✅ pdflatex is available")
    except (subprocess.CalledProcessError, FileNotFoundError):
        print("⚠️  pdflatex not found - PDF compilation will fail")

    print("🌐 Starting server on http://localhost:5000")
    app.run(host='0.0.0.0', port=5000, debug=True)