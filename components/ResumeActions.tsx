'use client';

import { useState } from 'react';
import { downloadPdf, downloadTextPdf, downloadDocx } from '@/lib/generate-pdf';

export default function ResumeActions({ profile }: { profile?: string }) {
  const [downloading, setDownloading] = useState<string | null>(null);

  const handleExport = async (format: 'pdf' | 'pdf-text' | 'docx') => {
    setDownloading(format);
    try {
      const base = profile ? `resume-${profile}` : 'resume';
      switch (format) {
        case 'pdf':
          await downloadPdf(profile, `${base}.pdf`);
          break;
        case 'pdf-text':
          await downloadTextPdf(profile, `${base}.pdf`);
          break;
        case 'docx':
          await downloadDocx(profile, `${base}.docx`);
          break;
      }
    } catch (err) {
      console.error(`${format} export failed:`, err);
      alert(`Export failed. Check console for details.`);
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="toolbar">
      <button
        className="button"
        onClick={() => handleExport('pdf-text')}
        disabled={!!downloading}
        title="Text-based PDF — ATS-friendly with full styling"
      >
        {downloading === 'pdf-text' ? 'Preparing…' : 'Download PDF'}
      </button>
      <button
        className="button secondary"
        onClick={() => handleExport('docx')}
        disabled={!!downloading}
        title="Word document — ATS-friendly"
      >
        {downloading === 'docx' ? 'Preparing…' : 'Download DOCX'}
      </button>
      <button
        className="button secondary"
        onClick={() => document.body.classList.toggle('compact')}
      >
        Toggle Density
      </button>
      <button className="button secondary" onClick={() => navigator.clipboard?.writeText(window.location.href)}>
        Copy Link
      </button>
    </div>
  );
}
