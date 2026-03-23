'use client';

import { useState, useRef } from 'react';
import './cover-letter.css';

type Sender = {
  sender_name: string;
  sender_email: string;
  sender_phone?: string;
  sender_location?: string;
};

export default function CoverLetterClient() {
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [notes, setNotes] = useState('');
  const [letter, setLetter] = useState('');
  const [sender, setSender] = useState<Sender | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const canGenerate = company.trim() && role.trim() && !generating;

  const handleGenerate = async () => {
    if (!canGenerate) return;
    setGenerating(true);
    setError('');
    setCopied(false);
    try {
      const res = await fetch('/api/editor/cover-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company: company.trim(),
          role: role.trim(),
          notes: notes.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(data.error || 'Generation failed');
      }
      const data = await res.json();
      setLetter(data.letter);
      setSender(data.sender);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(letter);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      textareaRef.current?.select();
      document.execCommand('copy');
    }
  };

  const handleDownload = () => {
    const blob = new Blob([letter], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cover-letter-${company.trim().toLowerCase().replace(/\s+/g, '-')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="cl-layout">
      <div className="cl-panel cl-form-panel">
        <h1 className="cl-title">Cover Letter Generator</h1>
        <p className="cl-subtitle">Fill in the details and generate a tailored cover letter.</p>

        <div className="cl-field">
          <label className="cl-label" htmlFor="cl-company">Company</label>
          <input
            id="cl-company"
            className="cl-input"
            type="text"
            placeholder="e.g. Acme Corp"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
          />
        </div>

        <div className="cl-field">
          <label className="cl-label" htmlFor="cl-role">Role</label>
          <input
            id="cl-role"
            className="cl-input"
            type="text"
            placeholder="e.g. Senior Site Reliability Engineer"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleGenerate(); }}
          />
        </div>

        <div className="cl-field">
          <label className="cl-label" htmlFor="cl-notes">
            Notes <span className="cl-optional">(optional)</span>
          </label>
          <textarea
            id="cl-notes"
            className="cl-input cl-textarea"
            placeholder="Paste a job description or add notes about what to emphasize..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={5}
          />
        </div>

        <button
          className="cl-btn cl-btn--generate"
          onClick={handleGenerate}
          disabled={!canGenerate}
        >
          {generating ? 'Generating...' : 'Generate Cover Letter'}
        </button>

        {error && <p className="cl-error">{error}</p>}
      </div>

      <div className="cl-panel cl-output-panel">
        {letter ? (
          <>
            <div className="cl-output-toolbar">
              <button className="cl-btn cl-btn--sm" onClick={handleCopy}>
                {copied ? 'Copied!' : 'Copy'}
              </button>
              <button className="cl-btn cl-btn--sm" onClick={handleDownload}>
                Download .txt
              </button>
              <button
                className="cl-btn cl-btn--sm cl-btn--ghost"
                onClick={handleGenerate}
                disabled={generating}
              >
                {generating ? 'Regenerating...' : 'Regenerate'}
              </button>
            </div>
            {sender && (
              <div className="cl-sender">
                <div>{sender.sender_name}</div>
                {sender.sender_email && <div>{sender.sender_email}</div>}
                {sender.sender_phone && <div>{sender.sender_phone}</div>}
                {sender.sender_location && <div>{sender.sender_location}</div>}
              </div>
            )}
            <textarea
              ref={textareaRef}
              className="cl-output"
              value={letter}
              onChange={(e) => setLetter(e.target.value)}
              spellCheck
            />
          </>
        ) : (
          <div className="cl-placeholder">
            <p>Your cover letter will appear here.</p>
            <p className="cl-placeholder-hint">
              Fill in the company and role, then click Generate.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
