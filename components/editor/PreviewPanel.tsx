'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useEditor } from '@/lib/editor-context';
import ClassicResumeStack from '@/components/resume/ClassicResumeStack';
import PaginatedPreview from './PaginatedPreview';
import { generatePdfBlob, downloadPdf } from '@/lib/generate-pdf';

export default function PreviewPanel() {
  const { state } = useEditor();
  const [mode, setMode] = useState<'live' | 'pdf'>('live');
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  // Clean up blob URL on unmount or when regenerating
  useEffect(() => {
    return () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    };
  }, [pdfUrl]);

  const generatePdf = useCallback(async () => {
    setPdfLoading(true);
    setPdfError(null);
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
      setPdfUrl(null);
    }

    try {
      const blob = await generatePdfBlob(state.selectedProfile);
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
    } catch (err) {
      setPdfError(String(err));
    } finally {
      setPdfLoading(false);
    }
  }, [state.selectedProfile, pdfUrl]);

  const handleDownload = useCallback(async () => {
    try {
      await downloadPdf(state.selectedProfile);
    } catch (err) {
      console.error('PDF download failed:', err);
    }
  }, [state.selectedProfile]);

  // Auto-generate PDF when switching to PDF mode
  useEffect(() => {
    if (mode === 'pdf' && !pdfUrl && !pdfLoading) {
      generatePdf();
    }
  }, [mode]); // eslint-disable-line react-hooks/exhaustive-deps

  // Regenerate when saved content changes in PDF mode
  const savedRef = useRef(state.savedContent);
  useEffect(() => {
    if (state.savedContent !== savedRef.current) {
      savedRef.current = state.savedContent;
      if (mode === 'pdf') {
        generatePdf();
      }
    }
  }, [state.savedContent]); // eslint-disable-line react-hooks/exhaustive-deps

  // Clear PDF when switching back to live
  useEffect(() => {
    if (mode === 'live' && pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
      setPdfUrl(null);
    }
  }, [mode]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="preview-panel">
      <div className="preview-mode-toggle">
        <button
          className={`preview-mode-btn ${mode === 'live' ? 'active' : ''}`}
          onClick={() => setMode('live')}
        >
          Live
        </button>
        <button
          className={`preview-mode-btn ${mode === 'pdf' ? 'active' : ''}`}
          onClick={() => setMode('pdf')}
        >
          PDF
        </button>
        {mode === 'pdf' && (
          <>
            <button
              className="preview-mode-btn"
              onClick={generatePdf}
              disabled={pdfLoading}
              title="Regenerate PDF"
            >
              {pdfLoading ? 'Generating...' : 'Refresh'}
            </button>
            <button
              className="preview-mode-btn"
              onClick={handleDownload}
              title="Download PDF file"
            >
              ⬇ Download
            </button>
            <span className="preview-mode-hint">
              {pdfLoading ? 'Rendering PDF...' : 'Saved version'}
            </span>
          </>
        )}
      </div>
      <div className="preview-content">
        {mode === 'live' ? (
          state.parseError ? (
            <div className="preview-error">
              <h3>YAML Parse Error</h3>
              <pre>{state.parseError}</pre>
            </div>
          ) : state.parsedData ? (
            <PaginatedPreview>
              <ClassicResumeStack
                data={state.parsedData}
                profiles={state.profiles}
                currentProfile={state.selectedProfile}
                hideControls
              />
            </PaginatedPreview>
          ) : (
            <div className="preview-empty">Loading...</div>
          )
        ) : pdfLoading ? (
          <div className="preview-empty">Generating PDF...</div>
        ) : pdfError ? (
          <div className="preview-error">
            <h3>PDF Generation Error</h3>
            <pre>{pdfError}</pre>
          </div>
        ) : pdfUrl ? (
          <iframe
            src={pdfUrl + '#zoom=FitH'}
            className="pdf-preview-iframe"
            title="PDF Preview"
          />
        ) : (
          <div className="preview-empty">Click Refresh to generate PDF</div>
        )}
      </div>
    </div>
  );
}
