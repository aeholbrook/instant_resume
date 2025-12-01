#!/usr/bin/env node
// LaTeX Resume Webapp Server

const express = require('express');
const cors = require('cors');
const fs = require('fs-extra');
const path = require('path');
const { execSync, spawn } = require('child_process');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuration
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static('webapp/frontend'));

// Paths
const PROJECT_ROOT = __dirname;
const RESUME_DIR = path.join(PROJECT_ROOT, 'resume');
const BUILD_DIR = path.join(PROJECT_ROOT, 'build');

// Ensure build directory exists
fs.ensureDirSync(BUILD_DIR);

// Global state
let compileStatus = {
    status: 'idle', // idle, compiling, success, error
    lastCompileTime: 0,
    lastError: null
};

/**
 * Compile LaTeX using our existing build.py logic
 */
async function compileLatex() {
    return new Promise((resolve) => {
        compileStatus.status = 'compiling';
        compileStatus.lastError = null;

        try {
            // Run pdflatex directly
            const result = execSync(
                `cd "${RESUME_DIR}" && pdflatex -interaction=nonstopmode -output-directory="${BUILD_DIR}" cv-llt.tex`,
                {
                    encoding: 'utf8',
                    timeout: 30000 // 30 second timeout
                }
            );

            // Check if PDF was created
            const pdfPath = path.join(BUILD_DIR, 'cv-llt.pdf');
            if (fs.existsSync(pdfPath)) {
                compileStatus.status = 'success';
                compileStatus.lastCompileTime = Date.now();
                resolve({ success: true });
            } else {
                compileStatus.status = 'error';
                compileStatus.lastError = 'PDF file was not generated';
                resolve({ success: false, error: 'PDF file was not generated' });
            }

        } catch (error) {
            compileStatus.status = 'error';
            compileStatus.lastError = error.message;
            resolve({ success: false, error: error.message });
        }
    });
}

/**
 * Get list of resume files
 */
function getResumeFiles() {
    try {
        const files = fs.readdirSync(RESUME_DIR);
        return files.filter(file =>
            (file.endsWith('.tex') && file !== 'cv-llt.tex') ||
            file.endsWith('.sty')
        );
    } catch (error) {
        console.error('Error reading resume directory:', error);
        return [];
    }
}

// Routes

/**
 * Serve main webapp
 */
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'webapp', 'frontend', 'index.html'));
});

/**
 * Get compilation status and file list
 */
app.get('/api/status', (req, res) => {
    res.json({
        ...compileStatus,
        project_root: PROJECT_ROOT,
        resume_files: getResumeFiles()
    });
});

/**
 * Compile LaTeX resume
 */
app.post('/api/compile', async (req, res) => {
    console.log('🔨 Compiling LaTeX resume...');

    const result = await compileLatex();

    res.json({
        ...result,
        status: compileStatus.status,
        timestamp: new Date().toISOString()
    });
});

/**
 * Serve compiled PDF
 */
app.get('/api/pdf', (req, res) => {
    const pdfPath = path.join(BUILD_DIR, 'cv-llt.pdf');

    if (!fs.existsSync(pdfPath)) {
        return res.status(404).json({ error: 'PDF not found. Please compile first.' });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="resume.pdf"');
    res.sendFile(pdfPath);
});

/**
 * Get file content
 */
app.get('/api/files/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(RESUME_DIR, filename);

    // Security check
    if (!filename.endsWith('.tex') && !filename.endsWith('.sty')) {
        return res.status(400).json({ error: 'Only .tex and .sty files are allowed' });
    }

    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: `File ${filename} not found` });
    }

    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const stats = fs.statSync(filePath);

        res.json({
            filename,
            content,
            last_modified: stats.mtime.getTime()
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * Save file content
 */
app.put('/api/files/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(RESUME_DIR, filename);
    const { content } = req.body;

    // Security check
    if (!filename.endsWith('.tex') && !filename.endsWith('.sty')) {
        return res.status(400).json({ error: 'Only .tex and .sty files are allowed' });
    }

    if (!content) {
        return res.status(400).json({ error: 'Content is required' });
    }

    try {
        // Backup original file if it exists
        if (fs.existsSync(filePath)) {
            const backupPath = filePath + '.backup';
            fs.copyFileSync(filePath, backupPath);
        }

        // Write new content
        fs.writeFileSync(filePath, content, 'utf8');

        res.json({
            success: true,
            filename,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * Auto-compile if files changed
 */
app.post('/api/auto-compile', async (req, res) => {
    try {
        // Check if any files have been modified since last compile
        const files = getResumeFiles().map(f => path.join(RESUME_DIR, f));
        files.push(path.join(RESUME_DIR, 'cv-llt.tex')); // Include main file

        let latestModTime = 0;
        for (const filePath of files) {
            if (fs.existsSync(filePath)) {
                const stats = fs.statSync(filePath);
                latestModTime = Math.max(latestModTime, stats.mtime.getTime());
            }
        }

        // Only compile if files have changed
        if (latestModTime > compileStatus.lastCompileTime) {
            const result = await compileLatex();
            res.json({
                compiled: true,
                ...result,
                status: compileStatus.status,
                timestamp: new Date().toISOString()
            });
        } else {
            res.json({
                compiled: false,
                message: 'No changes detected',
                status: compileStatus.status
            });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * Export resume in different formats
 */
app.get('/api/export/:format', (req, res) => {
    const format = req.params.format;

    if (format === 'pdf') {
        // Redirect to PDF endpoint
        return res.redirect('/api/pdf');
    } else {
        res.status(400).json({ error: `Format '${format}' not supported` });
    }
});

// Error handling
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

// Start server
function startServer() {
    // Initial compilation
    console.log('Starting LaTeX Resume Webapp...');
    console.log(`Project root: ${PROJECT_ROOT}`);
    console.log(`Resume files: ${RESUME_DIR}`);
    console.log(`Build output: ${BUILD_DIR}`);

    // Check if pdflatex is available
    try {
        execSync('pdflatex --version', { stdio: 'ignore' });
        console.log('LaTeX (pdflatex) is available');
    } catch (error) {
        console.warn('LaTeX (pdflatex) not found. PDF compilation will not work.');
    }

    // Initial compilation
    console.log('Initial compilation...');
    compileLatex().then(result => {
        if (result.success) {
            console.log('Initial compilation successful');
        } else {
            console.log('Initial compilation failed:', result.error);
        }
    });

    app.listen(PORT, () => {
        console.log('Server ready!');
        console.log(`Open http://localhost:${PORT} to view your resume editor`);
        console.log('Press Ctrl+C to stop');
    });
}

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\nShutting down server...');
    process.exit(0);
});

startServer();