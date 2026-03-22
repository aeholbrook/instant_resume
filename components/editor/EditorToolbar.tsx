'use client';

import { useState, useRef, useEffect } from 'react';
import { useEditor } from '@/lib/editor-context';
import { downloadTextPdf, downloadDocx } from '@/lib/generate-pdf';

export default function EditorToolbar() {
  const { state, dispatch, save, compile, compileAll, isDirty } = useEditor();
  const [exportOpen, setExportOpen] = useState(false);
  const [exporting, setExporting] = useState<string | null>(null);
  const exportRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) {
        setExportOpen(false);
      }
    }
    if (exportOpen) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [exportOpen]);

  const handleExport = async (format: 'pdf-text' | 'pdf-image' | 'docx' | 'all-pdf') => {
    setExportOpen(false);
    setExporting(format);

    // Save first if dirty
    if (isDirty) await save();

    try {
      const p = state.selectedProfile;
      const base = p ? `resume-${p}` : 'resume';

      switch (format) {
        case 'pdf-text':
          await downloadTextPdf(p, `${base}.pdf`);
          break;
        case 'pdf-image':
          await compile(p);
          setExporting(null);
          return; // compile handles its own state
        case 'docx':
          await downloadDocx(p, `${base}.docx`);
          break;
        case 'all-pdf':
          await compileAll();
          setExporting(null);
          return;
      }
    } catch (err) {
      console.error('Export failed:', err);
    }
    setExporting(null);
  };

  return (
    <div className={`editor-toolbar ${state.darkMode ? 'dark' : ''}`}>
      <div className="toolbar-left">
        {state.editorMode === 'yaml' && (
          <button
            className="toolbar-btn sidebar-toggle"
            onClick={() => dispatch({ type: 'TOGGLE_SIDEBAR' })}
            title="Toggle sidebar"
          >
            {'\u2630'}
          </button>
        )}

        <span className="toolbar-label">instant_resume</span>
      </div>

      <div className="toolbar-center">
        {/* Editor mode toggle */}
        <div className="mode-toggle">
          <button
            className={`mode-toggle-btn ${state.editorMode === 'yaml' ? 'active' : ''}`}
            onClick={() => dispatch({ type: 'SET_EDITOR_MODE', mode: 'yaml' })}
          >
            YAML
          </button>
          <button
            className={`mode-toggle-btn ${state.editorMode === 'cards' ? 'active' : ''}`}
            onClick={() => dispatch({ type: 'SET_EDITOR_MODE', mode: 'cards' })}
          >
            Cards
          </button>
        </div>

        {/* Profile selector */}
        <select
          className="toolbar-select"
          value={state.selectedProfile || ''}
          onChange={e => dispatch({ type: 'SET_PROFILE', profile: e.target.value || undefined })}
        >
          <option value="">Full Resume</option>
          {state.profiles.map(p => (
            <option key={p.name} value={p.name}>{p.label || p.name}</option>
          ))}
        </select>

        {/* Save */}
        <button
          className={`toolbar-btn ${isDirty ? 'dirty' : ''}`}
          onClick={save}
          title="Save (Ctrl+S)"
        >
          {isDirty ? '\u25CF ' : ''}Save
        </button>

        {/* Export dropdown */}
        <div className="export-dropdown" ref={exportRef}>
          <button
            className="toolbar-btn compile-btn"
            onClick={() => setExportOpen(!exportOpen)}
            disabled={!!exporting || state.compiling}
          >
            {exporting || state.compiling ? 'Exporting...' : 'Export \u25BE'}
          </button>
          {exportOpen && (
            <div className="export-menu">
              <button className="export-menu-item" onClick={() => handleExport('pdf-text')}>
                <span className="export-icon">PDF</span>
                <span className="export-label">
                  <strong>Download PDF</strong>
                  <small>Text-based, ATS-friendly</small>
                </span>
              </button>
              <button className="export-menu-item" onClick={() => handleExport('docx')}>
                <span className="export-icon">DOCX</span>
                <span className="export-label">
                  <strong>Download DOCX</strong>
                  <small>Word format, ATS-friendly</small>
                </span>
              </button>
              <hr className="export-divider" />
              <button className="export-menu-item" onClick={() => handleExport('pdf-image')}>
                <span className="export-icon">IMG</span>
                <span className="export-label">
                  <strong>PDF (Image)</strong>
                  <small>Pixel-perfect, not text-selectable</small>
                </span>
              </button>
              <button className="export-menu-item" onClick={() => handleExport('all-pdf')}>
                <span className="export-icon">ALL</span>
                <span className="export-label">
                  <strong>All Profiles (Image PDF)</strong>
                  <small>Download all profiles</small>
                </span>
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="toolbar-right">
        {/* Dark mode */}
        <button
          className="toolbar-btn"
          onClick={() => dispatch({ type: 'TOGGLE_DARK' })}
          title="Toggle theme"
          suppressHydrationWarning
        >
          {state.darkMode ? '\u2600' : '\u263E'}
        </button>
      </div>
    </div>
  );
}
