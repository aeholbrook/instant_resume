#!/usr/bin/env python3
"""
Flask backend for LaTeX Resume Editor with Project Management
Provides API endpoints for project management, file management, compilation, and PDF serving.
"""

import os
import subprocess
import sys
import json
from pathlib import Path
from datetime import datetime
from flask import Flask, jsonify, request, send_file, send_from_directory
from flask_cors import CORS
import tempfile
import shutil

app = Flask(__name__)
CORS(app)

# Configuration
PROJECT_ROOT = Path(__file__).parent.parent.parent
PROJECTS_DIR = PROJECT_ROOT / "projects"
WEBAPP_DIR = PROJECT_ROOT / "webapp"
TEMP_DIR = Path(tempfile.gettempdir()) / "instant_resume"

# Ensure directories exist
PROJECTS_DIR.mkdir(exist_ok=True)
TEMP_DIR.mkdir(exist_ok=True)

class ProjectManager:
    def __init__(self):
        self.projects_dir = PROJECTS_DIR
        self.current_project = "default"

    def list_projects(self):
        """List all available projects."""
        projects = []
        for project_dir in self.projects_dir.iterdir():
            if project_dir.is_dir():
                meta_file = project_dir / "project.json"
                if meta_file.exists():
                    try:
                        with open(meta_file, 'r') as f:
                            meta = json.load(f)
                            projects.append(meta)
                    except:
                        # Fallback if metadata is corrupted
                        projects.append({
                            'name': project_dir.name,
                            'displayName': project_dir.name,
                            'description': ''
                        })
                else:
                    # Create metadata for projects without it
                    meta = {
                        'name': project_dir.name,
                        'displayName': project_dir.name,
                        'description': '',
                        'created': datetime.now().isoformat(),
                        'lastModified': datetime.now().isoformat()
                    }
                    with open(meta_file, 'w') as f:
                        json.dump(meta, f, indent=2)
                    projects.append(meta)
        return sorted(projects, key=lambda x: x['name'])

    def create_project(self, name, display_name, description='', template_project=None):
        """Create a new project."""
        project_dir = self.projects_dir / name
        if project_dir.exists():
            return False, "Project already exists"

        try:
            project_dir.mkdir(parents=True)

            # Copy from template if provided
            if template_project:
                template_dir = self.projects_dir / template_project
                if template_dir.exists():
                    for file_path in template_dir.iterdir():
                        if file_path.is_file() and file_path.suffix in ['.tex', '.sty', '.jpg', '.png']:
                            shutil.copy2(file_path, project_dir)

            # Create project metadata
            meta = {
                'name': name,
                'displayName': display_name,
                'description': description,
                'created': datetime.now().isoformat(),
                'lastModified': datetime.now().isoformat()
            }
            with open(project_dir / "project.json", 'w') as f:
                json.dump(meta, f, indent=2)

            return True, "Project created successfully"
        except Exception as e:
            return False, str(e)

    def delete_project(self, name):
        """Delete a project."""
        if name == "default":
            return False, "Cannot delete default project"

        project_dir = self.projects_dir / name
        if not project_dir.exists():
            return False, "Project not found"

        try:
            shutil.rmtree(project_dir)
            return True, "Project deleted successfully"
        except Exception as e:
            return False, str(e)

    def duplicate_project(self, source_name, new_name, new_display_name):
        """Duplicate an existing project."""
        source_dir = self.projects_dir / source_name
        if not source_dir.exists():
            return False, "Source project not found"

        new_dir = self.projects_dir / new_name
        if new_dir.exists():
            return False, "Project with that name already exists"

        try:
            shutil.copytree(source_dir, new_dir)

            # Update metadata
            meta_file = new_dir / "project.json"
            if meta_file.exists():
                with open(meta_file, 'r') as f:
                    meta = json.load(f)
            else:
                meta = {}

            meta['name'] = new_name
            meta['displayName'] = new_display_name
            meta['created'] = datetime.now().isoformat()
            meta['lastModified'] = datetime.now().isoformat()

            with open(meta_file, 'w') as f:
                json.dump(meta, f, indent=2)

            return True, "Project duplicated successfully"
        except Exception as e:
            return False, str(e)

class ResumeCompiler:
    def __init__(self, project_manager):
        self.project_manager = project_manager
        self.temp_dir = TEMP_DIR

    @property
    def resume_dir(self):
        """Get current project directory."""
        return self.project_manager.projects_dir / self.project_manager.current_project

    def get_resume_files(self):
        """Get list of LaTeX files in current project."""
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

            # Update project's lastModified
            meta_file = self.resume_dir / "project.json"
            if meta_file.exists():
                with open(meta_file, 'r') as f:
                    meta = json.load(f)
                meta['lastModified'] = datetime.now().isoformat()
                with open(meta_file, 'w') as f:
                    json.dump(meta, f, indent=2)

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
                if file_path.is_file() and file_path.suffix != '.json':
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

# Initialize project manager and compiler
project_manager = ProjectManager()
compiler = ResumeCompiler(project_manager)

# Static file routes
@app.route('/')
def index():
    """Serve the main webapp."""
    response = send_from_directory(WEBAPP_DIR / "frontend", "index.html")
    response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
    response.headers['Pragma'] = 'no-cache'
    response.headers['Expires'] = '0'
    return response

@app.route('/<path:filename>')
def static_files(filename):
    """Serve static frontend files."""
    response = send_from_directory(WEBAPP_DIR / "frontend", filename)
    # Disable caching for JS and HTML files
    if filename.endswith('.js') or filename.endswith('.html'):
        response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
        response.headers['Pragma'] = 'no-cache'
        response.headers['Expires'] = '0'
    return response

# Project management routes
@app.route('/api/projects')
def api_list_projects():
    """List all projects."""
    projects = project_manager.list_projects()
    return jsonify({
        'projects': projects,
        'current': project_manager.current_project
    })

@app.route('/api/projects', methods=['POST'])
def api_create_project():
    """Create a new project."""
    data = request.get_json()
    if not data or 'name' not in data or 'displayName' not in data:
        return jsonify({'error': 'Missing required fields'}), 400

    success, message = project_manager.create_project(
        data['name'],
        data['displayName'],
        data.get('description', ''),
        data.get('template')
    )

    if success:
        return jsonify({'success': True, 'message': message})
    else:
        return jsonify({'success': False, 'error': message}), 400

@app.route('/api/projects/<name>/duplicate', methods=['POST'])
def api_duplicate_project(name):
    """Duplicate a project."""
    data = request.get_json()
    if not data or 'newName' not in data or 'newDisplayName' not in data:
        return jsonify({'error': 'Missing required fields'}), 400

    success, message = project_manager.duplicate_project(
        name,
        data['newName'],
        data['newDisplayName']
    )

    if success:
        return jsonify({'success': True, 'message': message})
    else:
        return jsonify({'success': False, 'error': message}), 400

@app.route('/api/projects/<name>', methods=['DELETE'])
def api_delete_project(name):
    """Delete a project."""
    success, message = project_manager.delete_project(name)

    if success:
        return jsonify({'success': True, 'message': message})
    else:
        return jsonify({'success': False, 'error': message}), 400

@app.route('/api/projects/current', methods=['PUT'])
def api_set_current_project():
    """Set the current project."""
    data = request.get_json()
    if not data or 'project' not in data:
        return jsonify({'error': 'Missing project name'}), 400

    project_manager.current_project = data['project']
    return jsonify({'success': True, 'current': project_manager.current_project})

# File management routes
@app.route('/api/status')
def api_status():
    """Get application status and file list."""
    files = compiler.get_resume_files()
    pdf_exists = compiler.get_pdf_path() is not None

    return jsonify({
        'status': 'ready',
        'resume_files': files,
        'pdf_available': pdf_exists,
        'resume_dir': str(compiler.resume_dir),
        'current_project': project_manager.current_project
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
    print("🚀 Starting LaTeX Resume Editor Backend (Project Management Edition)")
    print(f"📁 Projects directory: {PROJECTS_DIR}")
    print(f"🌐 Serving frontend from: {WEBAPP_DIR / 'frontend'}")
    print("=" * 50)

    # Check if pdflatex is available
    try:
        subprocess.run(['pdflatex', '--version'],
                      capture_output=True, check=True)
        print("✅ pdflatex is available")
    except (subprocess.CalledProcessError, FileNotFoundError):
        print("⚠️  pdflatex not found - PDF compilation will fail")

    # Ensure default project exists
    if not (PROJECTS_DIR / "default").exists():
        print("⚠️  Default project not found, creating...")
        project_manager.create_project("default", "My Resume", "Main resume project")

    print("🌐 Starting server on http://localhost:5000")
    app.run(host='0.0.0.0', port=5000, debug=True)
