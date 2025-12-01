// LaTeX Resume Editor Frontend

class ResumeEditor {
    constructor() {
        this.editor = null;
        this.currentFile = null;
        this.files = new Map();
        this.autoCompile = false;
        this.compileTimeout = null;
        this.pdfDoc = null;
        this.scale = 1.0;
        this.pageNum = 1;
        this.rotation = 0;
        this.zoomMode = '1'; // '1' for 100%, 'page-fit', 'page-width', etc.
        this.darkMode = localStorage.getItem('darkMode') === 'true';
        this.sidebarCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
        this.openFolders = new Set(['resume']); // Keep resume folder open by default
        this.viewingFile = 'cv-llt.tex'; // The file currently being viewed in PDF
        this.textLayerEnabled = true;
        this.sourceMap = new Map(); // Maps PDF text to source location
        this.pdfMode = 'compare'; // 'compare' or 'select'

        this.initializeApp();
    }

    async initializeApp() {
        try {
            this.initializeTheme();
            await this.initializeEditor();
            await this.initializePdfViewer();
            await this.loadFiles();
            this.setupEventListeners();
            this.initializeFileTree();
            await this.loadPdf();

            console.log('Resume Editor initialized');
        } catch (error) {
            console.error('Failed to initialize app:', error);
            this.updateStatus('error', 'Failed to initialize app');
        }
    }

    async initializeEditor() {
        return new Promise((resolve) => {
            require.config({
                paths: { vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs' }
            });

            require(['vs/editor/editor.main'], () => {
                // Configure LaTeX language support
                monaco.languages.register({ id: 'latex' });
                monaco.languages.setMonarchTokensProvider('latex', {
                    tokenizer: {
                        root: [
                            [/\\[a-zA-Z@]+/, 'keyword'],
                            [/\\[{}%]/, 'keyword'], // Escaped characters including \%
                            [/{/, 'delimiter.bracket'],
                            [/}/, 'delimiter.bracket'],
                            [/(?<!\\)%.*$/, 'comment'], // % only if NOT preceded by backslash
                            [/\$[^$]*\$/, 'string'],
                        ]
                    }
                });

                this.editor = monaco.editor.create(document.getElementById('editor'), {
                    value: '% Loading...',
                    language: 'latex',
                    theme: this.darkMode ? 'vs-dark' : 'vs',
                    automaticLayout: true,
                    wordWrap: 'on',
                    minimap: { enabled: false },
                    fontSize: 14,
                    lineNumbers: 'on',
                    renderWhitespace: 'selection'
                });

                // Auto-save and compile on changes
                this.editor.onDidChangeModelContent(() => {
                    this.saveCurrentFile();
                    if (this.autoCompile) {
                        this.scheduleCompile();
                    }
                });

                resolve();
            });
        });
    }

    async initializePdfViewer() {
        // Configure PDF.js
        pdfjsLib.GlobalWorkerOptions.workerSrc =
            'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    }

    async loadFiles() {
        try {
            const response = await fetch('/api/status');
            const data = await response.json();

            // Load each file
            for (const filename of data.resume_files) {
                const fileResponse = await fetch(`/api/files/${filename}`);
                if (fileResponse.ok) {
                    const fileData = await fileResponse.json();
                    this.files.set(filename, fileData.content);
                }
            }

            // Load first file by default
            if (data.resume_files.length > 0) {
                this.loadFile(data.resume_files[0]);
            }

        } catch (error) {
            console.error('Failed to load files:', error);
            this.updateStatus('error', 'Failed to load files');
        }
    }

    loadFile(filename) {
        if (!this.files.has(filename)) return;

        // Save current file first
        if (this.currentFile) {
            this.saveCurrentFile();
        }

        // Update UI
        this.currentFile = filename;
        this.editor.setValue(this.files.get(filename));

        // Update current file display
        document.getElementById('current-file-name').textContent = filename;

        console.log(`Loaded file: ${filename}`);
    }

    saveCurrentFile() {
        if (!this.currentFile || !this.editor) return;

        const content = this.editor.getValue();
        this.files.set(this.currentFile, content);

        // Save to backend
        fetch(`/api/files/${this.currentFile}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content })
        }).catch(error => {
            console.error('Failed to save file:', error);
        });
    }

    scheduleCompile() {
        if (this.compileTimeout) {
            clearTimeout(this.compileTimeout);
        }

        this.compileTimeout = setTimeout(() => {
            this.compile();
        }, 1000); // Compile 1 second after last change
    }

    async compile() {
        try {
            this.updateStatus('compiling', 'Compiling...');

            const response = await fetch('/api/compile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });

            const data = await response.json();

            if (data.success) {
                this.updateStatus('success', 'Compiled successfully');
                // Update viewing file to main CV when PDF is compiled
                this.viewingFile = 'cv-llt.tex';
                this.buildFileTree(); // Refresh tree to show viewing indicator
                await this.loadPdf();
            } else {
                this.updateStatus('error', data.error || 'Compilation failed');
            }

        } catch (error) {
            console.error('Compilation error:', error);
            this.updateStatus('error', 'Network error');
        }
    }

    async loadPdf() {
        try {
            const response = await fetch('/api/pdf');
            if (!response.ok) throw new Error('PDF not available');

            const arrayBuffer = await response.arrayBuffer();
            this.pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

            // Update page count display
            document.getElementById('page-count').textContent = this.pdfDoc.numPages;
            document.getElementById('page-input').max = this.pdfDoc.numPages;

            await this.renderPage();
            this.updatePageControls();
            console.log('PDF loaded');

        } catch (error) {
            console.error('Failed to load PDF:', error);
        }
    }

    async renderPage() {
        // Render all pages in scrollable view
        await this.renderAllPages();
    }

    async renderAllPages() {
        if (!this.pdfDoc) return;

        try {
            // Show loading indicator
            const loadingDiv = document.getElementById('pdf-loading');
            if (loadingDiv) loadingDiv.style.display = 'block';

            const viewer = document.getElementById('pdf-viewer');
            viewer.innerHTML = ''; // Clear existing content

            // Render each page
            for (let pageNum = 1; pageNum <= this.pdfDoc.numPages; pageNum++) {
                const page = await this.pdfDoc.getPage(pageNum);

                // Create wrapper for each page
                const pageWrapper = document.createElement('div');
                pageWrapper.className = 'pdf-page-wrapper';
                pageWrapper.style.position = 'relative';
                pageWrapper.style.margin = '0 auto 1rem';

                // Create canvas for this page
                const canvas = document.createElement('canvas');
                canvas.className = 'pdf-page-canvas';
                canvas.style.display = 'block';
                canvas.style.border = '1px solid var(--border-color)';
                canvas.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                canvas.style.background = 'white';

                const context = canvas.getContext('2d');

                // Calculate scale based on zoom mode
                this.calculateScale(page);

                const viewport = page.getViewport({
                    scale: this.scale,
                    rotation: this.rotation
                });

                canvas.height = viewport.height;
                canvas.width = viewport.width;

                await page.render({
                    canvasContext: context,
                    viewport: viewport
                }).promise;

                pageWrapper.appendChild(canvas);

                // Add text layer for click-to-source
                if (this.textLayerEnabled) {
                    const textLayerDiv = document.createElement('div');
                    textLayerDiv.className = 'pdf-text-layer-page';
                    textLayerDiv.style.position = 'absolute';
                    textLayerDiv.style.left = '0';
                    textLayerDiv.style.top = '0';
                    textLayerDiv.style.width = viewport.width + 'px';
                    textLayerDiv.style.height = viewport.height + 'px';
                    textLayerDiv.style.overflow = 'hidden';
                    textLayerDiv.style.lineHeight = '1.0';

                    await this.renderTextLayerForPage(page, viewport, textLayerDiv);
                    pageWrapper.appendChild(textLayerDiv);
                }

                viewer.appendChild(pageWrapper);
            }

            // Hide loading indicator
            if (loadingDiv) loadingDiv.style.display = 'none';

            // Update UI
            this.updateZoomDisplay();
            // Hide page navigation controls since we're scrolling
            this.hidePageNavigation();

        } catch (error) {
            console.error('Error rendering PDF pages:', error);
        }
    }

    async renderTextLayerForPage(page, viewport, textLayerDiv) {
        try {
            const textContent = await page.getTextContent();

            for (let item of textContent.items) {
                const tx = pdfjsLib.Util.transform(
                    pdfjsLib.Util.transform(viewport.transform, item.transform),
                    [1, 0, 0, -1, 0, 0]
                );

                const span = document.createElement('span');
                span.textContent = item.str;
                span.style.position = 'absolute';
                span.style.left = tx[4] + 'px';
                span.style.top = tx[5] + 'px';
                span.style.fontSize = Math.abs(tx[3]) + 'px';
                span.style.fontFamily = item.fontName;
                span.style.cursor = 'pointer';
                span.style.color = 'transparent';
                span.dataset.sourceText = item.str;

                span.addEventListener('click', () => {
                    this.handleTextClick(item.str);
                });

                textLayerDiv.appendChild(span);
            }
        } catch (error) {
            console.error('Error rendering text layer:', error);
        }
    }

    hidePageNavigation() {
        const pageNav = document.querySelector('.pdf-toolbar .flex.items-center.gap-2');
        if (pageNav && pageNav.innerHTML.includes('first-page')) {
            pageNav.style.display = 'none';
        }
    }

    calculateScale(page) {
        const container = document.getElementById('pdf-container');
        const containerWidth = container.clientWidth - 32; // Account for padding
        const containerHeight = container.clientHeight - 32;

        if (this.zoomMode === 'page-fit') {
            const viewport = page.getViewport({ scale: 1 });
            const scaleX = containerWidth / viewport.width;
            const scaleY = containerHeight / viewport.height;
            this.scale = Math.min(scaleX, scaleY);
        } else if (this.zoomMode === 'page-width') {
            const viewport = page.getViewport({ scale: 1 });
            this.scale = containerWidth / viewport.width;
        } else if (this.zoomMode === 'auto') {
            // Auto is like fit page but with a reasonable maximum
            const viewport = page.getViewport({ scale: 1 });
            const scaleX = containerWidth / viewport.width;
            const scaleY = containerHeight / viewport.height;
            this.scale = Math.min(scaleX, scaleY, 1.5); // Max 150%
        } else {
            // Specific zoom percentage
            this.scale = parseFloat(this.zoomMode);
        }
    }

    updateZoomDisplay() {
        const zoomSelect = document.getElementById('zoom-select');
        const currentZoom = Math.round(this.scale * 100);

        // Update zoom select if it matches a predefined value
        const exactMatch = Array.from(zoomSelect.options).find(option => {
            if (option.value === this.zoomMode) return true;
            const numValue = parseFloat(option.value);
            return !isNaN(numValue) && Math.abs(numValue * 100 - currentZoom) < 1;
        });

        if (exactMatch) {
            zoomSelect.value = this.zoomMode;
        } else {
            // Add custom zoom level if not in list
            zoomSelect.value = this.scale.toString();
        }
    }

    updatePageControls() {
        const pageInput = document.getElementById('page-input');
        const firstBtn = document.getElementById('first-page');
        const prevBtn = document.getElementById('prev-page');
        const nextBtn = document.getElementById('next-page');
        const lastBtn = document.getElementById('last-page');

        pageInput.value = this.pageNum;

        // Enable/disable navigation buttons
        const isFirst = this.pageNum <= 1;
        const isLast = this.pageNum >= this.pdfDoc.numPages;

        firstBtn.disabled = isFirst;
        prevBtn.disabled = isFirst;
        nextBtn.disabled = isLast;
        lastBtn.disabled = isLast;

        // Update button opacity
        [firstBtn, prevBtn].forEach(btn => btn.style.opacity = isFirst ? '0.5' : '1');
        [nextBtn, lastBtn].forEach(btn => btn.style.opacity = isLast ? '0.5' : '1');
    }

    async renderTextLayer(page, viewport) {
        try {
            const textContent = await page.getTextContent();
            const textLayer = document.getElementById('pdf-text-layer');

            // Clear existing text layer
            textLayer.innerHTML = '';
            textLayer.style.width = viewport.width + 'px';
            textLayer.style.height = viewport.height + 'px';

            // Create text layer div
            const textLayerDiv = document.createElement('div');
            textLayerDiv.className = 'textLayer';
            textLayer.appendChild(textLayerDiv);

            // Build source mapping while rendering text
            this.buildSourceMap(textContent);

            // Render text items
            for (const textItem of textContent.items) {
                if (textItem.str.trim() === '') continue;

                const textSpan = document.createElement('span');
                textSpan.textContent = textItem.str;
                textSpan.style.left = textItem.transform[4] + 'px';
                textSpan.style.top = textItem.transform[5] + 'px';
                textSpan.style.fontSize = Math.abs(textItem.transform[0]) + 'px';
                textSpan.style.fontFamily = textItem.fontName || 'sans-serif';

                // Add mode-specific event handlers
                this.addTextInteractionHandlers(textSpan, textItem);

                textLayerDiv.appendChild(textSpan);
            }

        } catch (error) {
            console.error('Error rendering text layer:', error);
        }
    }

    addTextInteractionHandlers(textSpan, textItem) {
        // Store the text content for later use
        textSpan.setAttribute('data-text', textItem.str);

        if (this.pdfMode === 'compare') {
            // Compare mode: click to jump to source
            textSpan.addEventListener('click', (e) => {
                e.stopPropagation();
                this.handleTextClick(textItem.str, e);
            });
            textSpan.style.cursor = 'pointer';
            textSpan.style.userSelect = 'none';
        } else {
            // Select mode: enable text selection
            textSpan.style.cursor = 'text';
            textSpan.style.userSelect = 'text';
            textSpan.style.webkitUserSelect = 'text';
            textSpan.style.mozUserSelect = 'text';

            // Add selection event listeners
            textSpan.addEventListener('mouseup', (e) => {
                setTimeout(() => this.handleTextSelection(), 10);
            });

            textSpan.addEventListener('selectstart', (e) => {
                e.stopPropagation();
            });
        }
    }

    setPdfMode(mode) {
        this.pdfMode = mode;
        const textLayer = document.getElementById('pdf-text-layer');
        const modeIndicator = document.getElementById('pdf-mode-indicator');

        // Update visual state
        textLayer.className = `${mode}-mode`;

        // Update mode indicator
        if (mode === 'compare') {
            modeIndicator.textContent = 'Compare Mode';
            modeIndicator.style.background = 'rgba(16, 185, 129, 0.8)';
        } else {
            modeIndicator.textContent = 'Select Mode';
            modeIndicator.style.background = 'rgba(59, 130, 246, 0.8)';
        }

        // Update button states
        document.getElementById('compare-mode').classList.toggle('active', mode === 'compare');
        document.getElementById('select-mode').classList.toggle('active', mode === 'select');

        // Re-render text layer with new handlers
        if (this.pdfDoc) {
            this.renderPage();
        }
    }

    buildSourceMap(textContent) {
        // This is a simplified source mapping - in a real implementation,
        // you'd need LaTeX compilation with source mapping enabled
        const commonMappings = {
            'Adam E. Holbrook': { file: 'cv-llt.tex', context: '\\makeheaders' },
            'Software Engineer': { file: 'employment.tex', context: '\\role{Software Engineer}' },
            'Experience': { file: 'employment.tex', context: '\\begin{rubric}{Experience}' },
            'Education': { file: 'education.tex', context: '\\begin{rubric}{Education}' },
            'Skills': { file: 'skills.tex', context: '\\begin{rubric}{Skills}' },
            'Python': { file: 'skills.tex', context: 'Python, JavaScript' },
            'JavaScript': { file: 'skills.tex', context: 'Python, JavaScript' },
            'React': { file: 'skills.tex', context: 'React, Node.js' },
            'Node.js': { file: 'skills.tex', context: 'React, Node.js' }
        };

        // Build reverse mapping for quick lookup
        this.sourceMap.clear();
        for (const [text, source] of Object.entries(commonMappings)) {
            this.sourceMap.set(text.toLowerCase(), source);
        }

        // Add dynamic mappings based on current file content
        this.files.forEach((content, filename) => {
            const lines = content.split('\n');
            lines.forEach((line, index) => {
                // Simple heuristic: extract text between braces
                const matches = line.match(/\{([^}]+)\}/g);
                if (matches) {
                    matches.forEach(match => {
                        const text = match.slice(1, -1); // Remove braces
                        if (text.length > 3 && !text.includes('\\')) {
                            this.sourceMap.set(text.toLowerCase(), {
                                file: filename,
                                line: index + 1,
                                context: line.trim()
                            });
                        }
                    });
                }
            });
        });
    }

    handleTextClick(text, event) {
        // Only handle in compare mode
        if (this.pdfMode !== 'compare') return;

        const cleanText = text.trim().toLowerCase();
        const source = this.sourceMap.get(cleanText);

        if (source) {
            this.showSourceTooltip(text, source, event);
            this.highlightInEditor(source);
        }
    }

    showSourceTooltip(text, source, event) {
        // Remove existing tooltip
        const existingTooltip = document.querySelector('.pdf-selection-tooltip');
        if (existingTooltip) {
            existingTooltip.remove();
        }

        // Create tooltip
        const tooltip = document.createElement('div');
        tooltip.className = 'pdf-selection-tooltip';
        tooltip.innerHTML = `
            <div class="pdf-source-info">
                <div class="pdf-source-file">${source.file}${source.line ? `:${source.line}` : ''}</div>
                <div class="pdf-source-context">${source.context}</div>
                <div style="margin-top: 0.25rem; font-size: 0.65rem; color: var(--text-secondary);">
                    Click to jump to source
                </div>
            </div>
        `;

        // Position tooltip
        tooltip.style.left = event.pageX + 10 + 'px';
        tooltip.style.top = event.pageY - 10 + 'px';

        document.body.appendChild(tooltip);

        // Add click handler to jump to source
        tooltip.addEventListener('click', () => {
            this.jumpToSource(source);
            tooltip.remove();
        });

        // Remove tooltip after delay
        setTimeout(() => {
            if (tooltip.parentNode) {
                tooltip.remove();
            }
        }, 3000);
    }

    highlightInEditor(source) {
        if (source.file && this.files.has(source.file)) {
            // Load the file if not currently active
            if (this.currentFile !== source.file) {
                this.loadFile(source.file);
            }

            // Highlight line in editor if line number is available
            if (source.line && this.editor) {
                setTimeout(() => {
                    this.editor.setPosition({ lineNumber: source.line, column: 1 });
                    this.editor.revealLineInCenter(source.line);
                }, 100);
            }
        }
    }

    jumpToSource(source) {
        this.highlightInEditor(source);

        // Flash highlight in file tree
        const fileItem = document.querySelector(`[data-file="${source.file}"]`);
        if (fileItem) {
            fileItem.classList.add('source-highlight');
            setTimeout(() => {
                fileItem.classList.remove('source-highlight');
            }, 1500);
        }
    }

    handleTextSelection() {
        // Only handle in select mode
        if (this.pdfMode !== 'select') return;

        setTimeout(() => {
            const selection = window.getSelection();
            const selectedText = selection.toString().trim();

            if (selectedText) {
                console.log('Selected text:', selectedText);
                // In select mode, we can add additional functionality like copy to clipboard
                this.copySelectedText(selection);
            }
        }, 50);
    }

    copySelectedText(selection) {
        const selectedText = selection.toString();

        // Copy to clipboard if available
        if (navigator.clipboard) {
            navigator.clipboard.writeText(selectedText).then(() => {
                this.showCopyNotification();
            }).catch(err => {
                console.log('Copy failed:', err);
            });
        }
    }

    showCopyNotification() {
        // Create temporary notification
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 2rem;
            right: 2rem;
            background: rgba(16, 185, 129, 0.9);
            color: white;
            padding: 0.5rem 1rem;
            border-radius: 0.375rem;
            font-size: 0.875rem;
            z-index: 1000;
            pointer-events: none;
        `;
        notification.textContent = 'Text copied to clipboard';
        document.body.appendChild(notification);

        // Remove after delay
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 2000);
    }

    highlightSelectedText(selection) {
        // Add highlight class to selected spans
        const range = selection.getRangeAt(0);
        const spans = range.commonAncestorContainer.querySelectorAll ?
            range.commonAncestorContainer.querySelectorAll('span') :
            range.commonAncestorContainer.parentElement.querySelectorAll('span');

        spans.forEach(span => {
            if (selection.containsNode(span, true)) {
                span.classList.add('highlight');
            }
        });

        // Clear selection after a delay
        setTimeout(() => {
            spans.forEach(span => span.classList.remove('highlight'));
            selection.removeAllRanges();
        }, 2000);
    }

    updateStatus(status, message) {
        const indicator = document.getElementById('status-indicator');
        const dot = document.getElementById('status-dot');
        const text = document.getElementById('status-text');

        indicator.className = `status-indicator status-${status}`;
        text.textContent = message;

        // Animate dot for compiling status
        if (status === 'compiling') {
            dot.style.animation = 'pulse 1s infinite';
        } else {
            dot.style.animation = 'none';
        }
    }

    toggleAutoCompile() {
        this.autoCompile = !this.autoCompile;
        const btn = document.getElementById('auto-compile-btn');
        btn.textContent = `Auto: ${this.autoCompile ? 'ON' : 'OFF'}`;
        btn.className = `btn ${this.autoCompile ? 'btn-primary' : 'btn-secondary'}`;

        if (this.autoCompile) {
            this.compile(); // Compile immediately when enabled
        }
    }

    // Page Navigation
    goToFirstPage() {
        if (this.pageNum > 1) {
            this.pageNum = 1;
            this.renderPage();
        }
    }

    goToPrevPage() {
        if (this.pageNum > 1) {
            this.pageNum--;
            this.renderPage();
        }
    }

    goToNextPage() {
        if (this.pageNum < this.pdfDoc.numPages) {
            this.pageNum++;
            this.renderPage();
        }
    }

    goToLastPage() {
        if (this.pageNum < this.pdfDoc.numPages) {
            this.pageNum = this.pdfDoc.numPages;
            this.renderPage();
        }
    }

    goToPage(pageNum) {
        const num = parseInt(pageNum);
        if (num >= 1 && num <= this.pdfDoc.numPages) {
            this.pageNum = num;
            this.renderPage();
        }
    }

    // Zoom Controls
    zoomIn() {
        if (this.zoomMode === 'page-fit' || this.zoomMode === 'page-width' || this.zoomMode === 'auto') {
            this.scale = Math.min(this.scale * 1.2, 3.0);
            this.zoomMode = this.scale.toString();
        } else {
            this.scale = Math.min(this.scale + 0.25, 3.0);
            this.zoomMode = this.scale.toString();
        }
        this.renderPage();
    }

    zoomOut() {
        if (this.zoomMode === 'page-fit' || this.zoomMode === 'page-width' || this.zoomMode === 'auto') {
            this.scale = Math.max(this.scale * 0.8, 0.3);
            this.zoomMode = this.scale.toString();
        } else {
            this.scale = Math.max(this.scale - 0.25, 0.3);
            this.zoomMode = this.scale.toString();
        }
        this.renderPage();
    }

    setZoomMode(mode) {
        this.zoomMode = mode;
        this.renderPage();
    }

    // Rotation
    rotateLeft() {
        this.rotation = (this.rotation - 90) % 360;
        this.renderPage();
    }

    rotateRight() {
        this.rotation = (this.rotation + 90) % 360;
        this.renderPage();
    }

    // Fullscreen
    toggleFullscreen() {
        const previewPanel = document.querySelector('.preview-panel');

        if (!document.fullscreenElement) {
            previewPanel.classList.add('pdf-fullscreen');

            // Add fullscreen header
            const header = document.createElement('div');
            header.className = 'pdf-fullscreen-header';
            header.innerHTML = `
                <span>PDF Viewer - Fullscreen</span>
                <button id="exit-fullscreen" class="btn btn-secondary">Exit Fullscreen</button>
            `;
            previewPanel.insertBefore(header, previewPanel.firstChild);

            // Setup exit fullscreen handler
            document.getElementById('exit-fullscreen').onclick = () => this.exitFullscreen();

            // Re-render to fit new container size
            setTimeout(() => this.renderPage(), 100);
        }
    }

    exitFullscreen() {
        const previewPanel = document.querySelector('.preview-panel');
        const header = document.querySelector('.pdf-fullscreen-header');

        previewPanel.classList.remove('pdf-fullscreen');
        if (header) header.remove();

        // Re-render to fit original container size
        setTimeout(() => this.renderPage(), 100);
    }

    printPdf() {
        // Open PDF in new window for printing
        const printWindow = window.open('/api/pdf', '_blank');
        if (printWindow) {
            printWindow.onload = () => {
                printWindow.print();
            };
        }
    }

    downloadPdf() {
        window.open('/api/pdf', '_blank');
    }

    initializeTheme() {
        this.updateTheme();
    }

    toggleTheme() {
        this.darkMode = !this.darkMode;
        localStorage.setItem('darkMode', this.darkMode.toString());
        this.updateTheme();

        // Update Monaco editor theme
        if (this.editor) {
            monaco.editor.setTheme(this.darkMode ? 'vs-dark' : 'vs');
        }
    }

    updateTheme() {
        const body = document.body;
        const themeToggle = document.getElementById('theme-toggle');

        if (this.darkMode) {
            body.setAttribute('data-theme', 'dark');
            if (themeToggle) themeToggle.textContent = '☀️';
        } else {
            body.removeAttribute('data-theme');
            if (themeToggle) themeToggle.textContent = '🌙';
        }
    }

    initializeFileTree() {
        this.buildFileTree();
        this.updateSidebarVisibility();
    }

    buildFileTree() {
        const fileExplorer = document.getElementById('file-explorer');

        // Create file structure
        const structure = {
            'resume': {
                type: 'folder',
                children: {}
            }
        };

        // Add all files to resume folder
        this.files.forEach((content, filename) => {
            structure.resume.children[filename] = {
                type: 'file',
                extension: filename.split('.').pop()
            };
        });

        // Add main CV file
        structure.resume.children['cv-llt.tex'] = {
            type: 'file',
            extension: 'tex'
        };

        fileExplorer.innerHTML = this.renderFileTree(structure);
    }

    renderFileTree(structure, level = 0) {
        let html = '';

        for (const [name, item] of Object.entries(structure)) {
            if (item.type === 'folder') {
                const isOpen = this.openFolders.has(name);
                const icon = isOpen ? '📂' : '📁';
                const chevron = isOpen ? '▼' : '▶';

                html += `
                    <div class="tree-item folder" data-path="${name}" style="padding-left: ${level * 1}rem">
                        <span class="tree-icon">${chevron}</span>
                        <span>${icon} ${name}</span>
                    </div>
                `;

                if (isOpen && item.children) {
                    html += `<div class="tree-children expanded">`;
                    html += this.renderFileTree(item.children, level + 1);
                    html += `</div>`;
                }
            } else {
                const icon = this.getFileIcon(item.extension);
                const isActive = this.currentFile === name;
                const isViewing = this.viewingFile === name;

                let classes = 'tree-item';
                if (isActive) classes += ' active';
                if (isViewing) classes += ' viewing';

                html += `
                    <div class="${classes}" data-file="${name}" style="padding-left: ${(level + 1) * 1}rem">
                        <span class="tree-icon">${icon}</span>
                        <span>${name}</span>
                    </div>
                `;
            }
        }

        return html;
    }

    getFileIcon(extension) {
        const icons = {
            'tex': '📄',
            'sty': '🎨',
            'pdf': '📕',
            'md': '📝',
            'json': '⚙️',
            'js': '📜'
        };
        return icons[extension] || '📄';
    }

    toggleFolder(folderName) {
        if (this.openFolders.has(folderName)) {
            this.openFolders.delete(folderName);
        } else {
            this.openFolders.add(folderName);
        }
        this.buildFileTree();
    }

    toggleSidebar() {
        this.sidebarCollapsed = !this.sidebarCollapsed;
        localStorage.setItem('sidebarCollapsed', this.sidebarCollapsed.toString());
        this.updateSidebarVisibility();
    }

    updateSidebarVisibility() {
        const sidebar = document.querySelector('.sidebar');
        const mainContainer = document.querySelector('.main-container');
        const toggleBtn = document.getElementById('sidebar-toggle');

        console.log('Sidebar toggle called, collapsed:', this.sidebarCollapsed);

        if (this.sidebarCollapsed) {
            sidebar.classList.add('collapsed');
            mainContainer.classList.add('sidebar-collapsed');
            toggleBtn.textContent = '→';
            toggleBtn.title = 'Show sidebar';
        } else {
            sidebar.classList.remove('collapsed');
            mainContainer.classList.remove('sidebar-collapsed');
            toggleBtn.textContent = '←';
            toggleBtn.title = 'Hide sidebar';
        }
    }

    setupEventListeners() {
        // Compile button
        document.getElementById('compile-btn').onclick = () => this.compile();

        // Auto-compile toggle
        document.getElementById('auto-compile-btn').onclick = () => this.toggleAutoCompile();

        // Download button
        document.getElementById('download-btn').onclick = () => this.downloadPdf();

        // Theme toggle
        document.getElementById('theme-toggle').onclick = () => this.toggleTheme();

        // Sidebar toggle
        document.getElementById('sidebar-toggle').onclick = () => this.toggleSidebar();

        // File tree event delegation
        document.getElementById('file-explorer').addEventListener('click', (e) => {
            const treeItem = e.target.closest('.tree-item');
            if (!treeItem) return;

            if (treeItem.classList.contains('folder')) {
                const folderName = treeItem.dataset.path;
                this.toggleFolder(folderName);
            } else {
                const filename = treeItem.dataset.file;
                if (filename && this.files.has(filename)) {
                    this.loadFile(filename);
                    this.buildFileTree(); // Refresh to update active state
                }
            }
        });

        // PDF Navigation Controls
        document.getElementById('first-page').onclick = () => this.goToFirstPage();
        document.getElementById('prev-page').onclick = () => this.goToPrevPage();
        document.getElementById('next-page').onclick = () => this.goToNextPage();
        document.getElementById('last-page').onclick = () => this.goToLastPage();

        // Page input
        document.getElementById('page-input').addEventListener('change', (e) => {
            this.goToPage(e.target.value);
        });

        // Zoom controls
        document.getElementById('zoom-in').onclick = () => this.zoomIn();
        document.getElementById('zoom-out').onclick = () => this.zoomOut();

        // Zoom mode selector
        document.getElementById('zoom-select').addEventListener('change', (e) => {
            this.setZoomMode(e.target.value);
        });

        // PDF mode toggles
        document.getElementById('compare-mode').onclick = () => this.setPdfMode('compare');
        document.getElementById('select-mode').onclick = () => this.setPdfMode('select');

        // PDF tools
        document.getElementById('rotate-left').onclick = () => this.rotateLeft();
        document.getElementById('rotate-right').onclick = () => this.rotateRight();
        document.getElementById('fullscreen-pdf').onclick = () => this.toggleFullscreen();
        document.getElementById('print-pdf').onclick = () => this.printPdf();

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // PDF navigation shortcuts (when not in input field)
            if (!e.target.matches('input, textarea, select')) {
                switch (e.key) {
                    case 'ArrowLeft':
                    case 'PageUp':
                        e.preventDefault();
                        this.goToPrevPage();
                        break;
                    case 'ArrowRight':
                    case 'PageDown':
                        e.preventDefault();
                        this.goToNextPage();
                        break;
                    case 'Home':
                        e.preventDefault();
                        this.goToFirstPage();
                        break;
                    case 'End':
                        e.preventDefault();
                        this.goToLastPage();
                        break;
                    case '=':
                    case '+':
                        e.preventDefault();
                        this.zoomIn();
                        break;
                    case '-':
                        e.preventDefault();
                        this.zoomOut();
                        break;
                    case 'f':
                        e.preventDefault();
                        this.toggleFullscreen();
                        break;
                }
            }

            // Global shortcuts
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 's':
                        e.preventDefault();
                        this.saveCurrentFile();
                        break;
                    case 'Enter':
                        e.preventDefault();
                        this.compile();
                        break;
                    case 'p':
                        e.preventDefault();
                        this.printPdf();
                        break;
                }
            }

            // Escape key to exit fullscreen
            if (e.key === 'Escape') {
                const fullscreenElement = document.querySelector('.pdf-fullscreen');
                if (fullscreenElement) {
                    this.exitFullscreen();
                }
            }
        });

        // Document-level selection handler for select mode
        document.addEventListener('selectionchange', () => {
            if (this.pdfMode === 'select') {
                const selection = window.getSelection();
                if (selection.toString().trim()) {
                    // Check if selection is within PDF text layer
                    const textLayer = document.getElementById('pdf-text-layer');
                    if (textLayer && textLayer.contains(selection.anchorNode)) {
                        setTimeout(() => {
                            if (selection.toString().trim()) {
                                this.copySelectedText(selection);
                            }
                        }, 100);
                    }
                }
            }
        });

        // Window resize
        window.addEventListener('resize', () => {
            if (this.editor) {
                this.editor.layout();
            }
            // Re-render PDF if container size changed
            if (this.pdfDoc && (this.zoomMode === 'page-fit' || this.zoomMode === 'page-width' || this.zoomMode === 'auto')) {
                setTimeout(() => this.renderPage(), 100);
            }
        });
    }
}

// Add pulse animation CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes pulse {
        0% { opacity: 1; }
        50% { opacity: 0.5; }
        100% { opacity: 1; }
    }
`;
document.head.appendChild(style);

// Initialize the app when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.resumeEditor = new ResumeEditor();
});