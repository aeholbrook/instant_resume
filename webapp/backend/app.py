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
        """Get list of editable files in current project."""
        if not self.resume_dir.exists():
            return []

        tex_files = list(self.resume_dir.glob("*.tex"))
        sty_files = list(self.resume_dir.glob("*.sty"))
        yaml_files = list(self.resume_dir.glob("*.yaml"))
        yml_files = list(self.resume_dir.glob("*.yml"))
        md_files = list(self.resume_dir.glob("*.md"))

        files = [f.name for f in tex_files + sty_files + yaml_files + yml_files + md_files]
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

    def compile_resume(self, from_yaml=False):
        """Compile the LaTeX resume to PDF."""
        main_tex = self.resume_dir / "cv-llt.tex"
        if not main_tex.exists():
            return False, "Main LaTeX file (cv-llt.tex) not found", ""

        # Create temp working directory
        work_dir = self.temp_dir / "compile"
        if work_dir.exists():
            shutil.rmtree(work_dir)
        work_dir.mkdir(parents=True)

        compilation_log = ""

        try:
            # If from_yaml flag is set, generate LaTeX files from YAML first
            if from_yaml:
                yaml_gen_script = PROJECT_ROOT / "generate_latex_from_yaml.py"
                if yaml_gen_script.exists():
                    compilation_log += "=== Generating LaTeX files from YAML ===\n"
                    current_project = self.project_manager.current_project
                    yaml_result = subprocess.run(
                        [sys.executable, str(yaml_gen_script), current_project],
                        cwd=PROJECT_ROOT,
                        capture_output=True,
                        text=True,
                        timeout=10
                    )
                    compilation_log += yaml_result.stdout + "\n"
                    if yaml_result.stderr:
                        compilation_log += "STDERR:\n" + yaml_result.stderr + "\n"
                    compilation_log += "\n"
                else:
                    return False, "YAML generator script not found", compilation_log

            # Copy all resume files to temp directory
            for file_path in self.resume_dir.iterdir():
                if file_path.is_file() and file_path.suffix != '.json':
                    shutil.copy2(file_path, work_dir)

            # Run pdflatex
            compilation_log += "=== Running pdflatex ===\n"
            cmd = ['pdflatex', '-interaction=nonstopmode', 'cv-llt.tex']
            result = subprocess.run(
                cmd,
                cwd=work_dir,
                capture_output=True,
                text=True,
                timeout=30
            )

            compilation_log += result.stdout + "\n"
            if result.stderr:
                compilation_log += "STDERR:\n" + result.stderr + "\n"

            # Check if PDF was generated
            pdf_path = work_dir / "cv-llt.pdf"
            if pdf_path.exists():
                # Copy PDF to resume directory
                output_path = self.resume_dir / "cv-llt.pdf"
                shutil.copy2(pdf_path, output_path)
                return True, "Compilation successful", compilation_log
            else:
                # Return compilation errors
                return False, "PDF generation failed", compilation_log

        except subprocess.TimeoutExpired:
            return False, "Compilation timed out", compilation_log
        except Exception as e:
            compilation_log += f"\nException: {str(e)}\n"
            return False, f"Compilation error: {str(e)}", compilation_log
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

    # Get file modification time
    file_path = compiler.resume_dir / filename
    mtime = file_path.stat().st_mtime if file_path.exists() else 0

    return jsonify({
        'filename': filename,
        'content': content,
        'mtime': mtime
    })

@app.route('/api/files/timestamps')
def api_get_file_timestamps():
    """Get modification timestamps for all files in current project."""
    files = compiler.get_resume_files()
    timestamps = {}

    for filename in files:
        file_path = compiler.resume_dir / filename
        if file_path.exists():
            timestamps[filename] = file_path.stat().st_mtime

    return jsonify({
        'timestamps': timestamps,
        'project': project_manager.current_project
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
    success, message, log = compiler.compile_resume(from_yaml=False)

    if success:
        return jsonify({
            'success': True,
            'message': message,
            'log': log
        })
    else:
        return jsonify({
            'success': False,
            'error': message,
            'log': log
        }), 400

@app.route('/api/compile-from-yaml', methods=['POST'])
def api_compile_from_yaml():
    """Generate LaTeX from YAML and compile."""
    success, message, log = compiler.compile_resume(from_yaml=True)

    if success:
        return jsonify({
            'success': True,
            'message': message,
            'log': log
        })
    else:
        return jsonify({
            'success': False,
            'error': message,
            'log': log
        }), 400

@app.route('/api/generate-docx', methods=['POST'])
def api_generate_docx():
    """Generate Word document from YAML."""
    import subprocess
    import sys
    from flask import request

    data = request.get_json()
    ats_mode = data.get('ats_mode', False)

    # Get current project
    current_project = project_manager.current_project

    # Path to the docx generator script
    docx_gen_script = Path(__file__).parent.parent.parent / 'generate_docx_from_yaml.py'

    # Path to output file
    project_dir = Path(__file__).parent.parent.parent / 'projects' / current_project
    output_file = project_dir / ('resume-ats.docx' if ats_mode else 'resume.docx')

    try:
        # Run the generator
        mode_arg = 'ats' if ats_mode else 'normal'
        result = subprocess.run(
            [sys.executable, str(docx_gen_script), current_project, mode_arg],
            capture_output=True,
            text=True,
            timeout=30
        )

        if result.returncode != 0:
            return jsonify({
                'success': False,
                'error': f'Failed to generate Word document: {result.stderr}'
            }), 500

        # Send the file
        if output_file.exists():
            return send_file(
                output_file,
                as_attachment=True,
                download_name='resume-ats.docx' if ats_mode else 'resume.docx',
                mimetype='application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            )
        else:
            return jsonify({
                'success': False,
                'error': 'Generated file not found'
            }), 500

    except subprocess.TimeoutExpired:
        return jsonify({
            'success': False,
            'error': 'Word generation timed out'
        }), 500
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/snapshots', methods=['GET'])
def api_list_snapshots():
    """List available snapshots for current project."""
    import os
    from datetime import datetime

    current_project = project_manager.current_project
    snapshots_dir = PROJECTS_DIR / current_project / 'snapshots'

    if not snapshots_dir.exists():
        return jsonify({'snapshots': []})

    snapshots = []
    for item in snapshots_dir.glob('*'):
        if item.is_dir():
            # Get timestamp from directory name
            try:
                timestamp_str = item.name
                # Parse timestamp format: 2024-12-02_14-30-15
                dt = datetime.strptime(timestamp_str, '%Y-%m-%d_%H-%M-%S')
                snapshots.append({
                    'id': timestamp_str,
                    'timestamp': timestamp_str,
                    'date': dt.strftime('%Y-%m-%d %H:%M:%S'),
                    'files': [f.name for f in item.glob('*') if f.is_file()]
                })
            except:
                continue

    # Sort by timestamp, newest first
    snapshots.sort(key=lambda x: x['timestamp'], reverse=True)

    return jsonify({'snapshots': snapshots[:20]})  # Return last 20

@app.route('/api/snapshots/save', methods=['POST'])
def api_save_snapshot():
    """Save current project state as a snapshot."""
    import shutil
    from datetime import datetime

    current_project = project_manager.current_project
    project_dir = PROJECTS_DIR / current_project
    snapshots_dir = project_dir / 'snapshots'
    snapshots_dir.mkdir(exist_ok=True)

    # Create timestamp
    timestamp = datetime.now().strftime('%Y-%m-%d_%H-%M-%S')
    snapshot_dir = snapshots_dir / timestamp
    snapshot_dir.mkdir(exist_ok=True)

    # Copy all relevant files
    extensions = ['.tex', '.yaml', '.yml', '.sty', '.pdf', '.docx']
    files_copied = []

    for ext in extensions:
        for file in project_dir.glob(f'*{ext}'):
            if file.is_file():
                shutil.copy2(file, snapshot_dir / file.name)
                files_copied.append(file.name)

    return jsonify({
        'success': True,
        'snapshot_id': timestamp,
        'files': files_copied
    })

@app.route('/api/snapshots/<snapshot_id>/restore', methods=['POST'])
def api_restore_snapshot(snapshot_id):
    """Restore a snapshot."""
    import shutil

    current_project = project_manager.current_project
    project_dir = PROJECTS_DIR / current_project
    snapshot_dir = project_dir / 'snapshots' / snapshot_id

    if not snapshot_dir.exists():
        return jsonify({'success': False, 'error': 'Snapshot not found'}), 404

    # Restore files (except PDFs which will be regenerated)
    extensions = ['.tex', '.yaml', '.yml', '.sty']
    files_restored = []

    for ext in extensions:
        for file in snapshot_dir.glob(f'*{ext}'):
            if file.is_file():
                shutil.copy2(file, project_dir / file.name)
                files_restored.append(file.name)

    return jsonify({
        'success': True,
        'files_restored': files_restored
    })

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
