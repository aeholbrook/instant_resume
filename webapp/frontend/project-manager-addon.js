// Project Manager Add-on
// This script adds project management UI to the existing Resume Editor

class ProjectManagerAddon {
    constructor(editor = null) {
        this.editor = editor;
        this.currentProject = 'default';
        this.projects = [];
        console.log('ProjectManagerAddon constructor called');
        this.init();
    }

    async init() {
        await this.loadProjects();
        this.injectUI();
        this.setupEventListeners();
    }

    async loadProjects() {
        try {
            const response = await fetch('/api/projects');
            const data = await response.json();
            this.projects = data.projects;
            this.currentProject = data.current;
        } catch (error) {
            console.error('Failed to load projects:', error);
        }
    }

    injectUI() {
        // Find the toolbar
        const toolbar = document.querySelector('.toolbar h1');
        console.log('injectUI: toolbar element found?', toolbar !== null);
        if (!toolbar) {
            console.error('Could not find .toolbar h1 element');
            return;
        }

        console.log('Injecting project UI with', this.projects.length, 'projects');
        // Create project selector HTML
        const projectHTML = `
            <div style="display: flex; align-items: center; gap: 0.5rem; margin-left: 1rem;">
                <span style="font-size: 0.875rem; color: var(--toolbar-text); opacity: 0.7;">Project:</span>
                <select id="project-selector" style="
                    background: white;
                    color: #000;
                    border: 1px solid rgba(255,255,255,0.2);
                    border-radius: 0.25rem;
                    padding: 0.25rem 0.5rem;
                    font-size: 0.875rem;
                    cursor: pointer;
                ">
                    <style>
                        #project-selector option {
                            color: #000;
                            background: white;
                        }
                    </style>
                    ${this.projects.map(p =>
                        `<option value="${p.name}" ${p.name === this.currentProject ? 'selected' : ''}>
                            ${p.displayName}
                        </option>`
                    ).join('')}
                </select>
                <button id="new-project-btn" style="
                    background: rgba(255,255,255,0.1);
                    color: var(--toolbar-text);
                    border: 1px solid rgba(255,255,255,0.2);
                    border-radius: 0.25rem;
                    padding: 0.25rem 0.5rem;
                    font-size: 0.875rem;
                    cursor: pointer;
                " title="New Project">+</button>
                <button id="duplicate-project-btn" style="
                    background: rgba(255,255,255,0.1);
                    color: var(--toolbar-text);
                    border: 1px solid rgba(255,255,255,0.2);
                    border-radius: 0.25rem;
                    padding: 0.25rem 0.5rem;
                    font-size: 0.875rem;
                    cursor: pointer;
                " title="Duplicate Current Project">⎘</button>
            </div>
        `;

        // Insert after title
        toolbar.insertAdjacentHTML('afterend', projectHTML);
    }

    setupEventListeners() {
        // Project selector change
        const selector = document.getElementById('project-selector');
        if (selector) {
            selector.onchange = async (e) => {
                await this.switchProject(e.target.value);
            };
        }

        // New project button
        const newBtn = document.getElementById('new-project-btn');
        if (newBtn) {
            newBtn.onclick = () => this.showNewProjectDialog();
        }

        // Duplicate project button
        const dupBtn = document.getElementById('duplicate-project-btn');
        if (dupBtn) {
            dupBtn.onclick = () => this.showDuplicateDialog();
        }
    }

    async switchProject(projectName) {
        try {
            const response = await fetch('/api/projects/current', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ project: projectName })
            });

            if (response.ok) {
                this.currentProject = projectName;
                // Reload the page to refresh file list
                window.location.reload();
            }
        } catch (error) {
            console.error('Failed to switch project:', error);
            alert('Failed to switch project');
        }
    }

    showNewProjectDialog() {
        const name = prompt('Enter project ID (lowercase, no spaces):');
        if (!name) return;

        const displayName = prompt('Enter display name:');
        if (!displayName) return;

        const description = prompt('Enter description (optional):') || '';

        this.createProject(name, displayName, description);
    }

    async createProject(name, displayName, description, template = 'default') {
        try {
            const response = await fetch('/api/projects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, displayName, description, template })
            });

            const data = await response.json();
            if (data.success) {
                alert('Project created! Switching to it...');
                await this.switchProject(name);
            } else {
                alert(`Failed: ${data.error}`);
            }
        } catch (error) {
            console.error('Failed to create project:', error);
            alert('Failed to create project');
        }
    }

    showDuplicateDialog() {
        const newName = prompt(`Duplicate "${this.currentProject}" as (ID):`);
        if (!newName) return;

        const newDisplayName = prompt('Display name for duplicate:');
        if (!newDisplayName) return;

        this.duplicateProject(this.currentProject, newName, newDisplayName);
    }

    async duplicateProject(sourceName, newName, newDisplayName) {
        try {
            const response = await fetch(`/api/projects/${sourceName}/duplicate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ newName, newDisplayName })
            });

            const data = await response.json();
            if (data.success) {
                const switchNow = confirm('Project duplicated! Switch to it now?');
                if (switchNow) {
                    await this.switchProject(newName);
                } else {
                    await this.loadProjects();
                    this.updateSelector();
                }
            } else {
                alert(`Failed: ${data.error}`);
            }
        } catch (error) {
            console.error('Failed to duplicate project:', error);
            alert('Failed to duplicate project');
        }
    }

    updateSelector() {
        const selector = document.getElementById('project-selector');
        if (!selector) return;

        selector.innerHTML = this.projects.map(p =>
            `<option value="${p.name}" ${p.name === this.currentProject ? 'selected' : ''}>
                ${p.displayName}
            </option>`
        ).join('');
    }
}

// Initialize when editor is ready
window.addEventListener('load', () => {
    setTimeout(() => {
        console.log('Attempting to load Project Manager addon...');
        const toolbar = document.querySelector('.toolbar h1');
        if (toolbar) {
            window.projectManager = new ProjectManagerAddon(null);
            console.log('✅ Project Manager addon loaded successfully');
        } else {
            console.error('❌ Could not find toolbar element');
        }
    }, 1000);
});
