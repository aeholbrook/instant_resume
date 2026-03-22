'use client';

import { useState, useCallback } from 'react';

type Props = {
  summary: string;
  onChange: (summary: string) => void;
};

export default function SummaryCard({ summary, onChange }: Props) {
  const [local, setLocal] = useState(summary);
  const [collapsed, setCollapsed] = useState(false);

  // Sync from parent
  const [lastParent, setLastParent] = useState(summary);
  if (summary !== lastParent) {
    setLocal(summary);
    setLastParent(summary);
  }

  const commit = useCallback(() => {
    onChange(local);
  }, [local, onChange]);

  return (
    <div className="section-card">
      <div className="section-card-header" onClick={() => setCollapsed(!collapsed)}>
        <span className="section-card-arrow">{collapsed ? '\u25B6' : '\u25BC'}</span>
        <h3 className="section-card-title">Summary</h3>
      </div>
      {!collapsed && (
        <div className="section-card-body">
          <textarea
            className="field-textarea"
            rows={4}
            value={local}
            onChange={(e) => setLocal(e.target.value)}
            onBlur={commit}
            placeholder="Professional summary..."
          />
        </div>
      )}
    </div>
  );
}
