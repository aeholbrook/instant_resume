'use client';

import { useState, useCallback } from 'react';
import EntryCard from './EntryCard';

type AnyEntry = Record<string, unknown>;

type Props = {
  title: string;
  sectionKey: string;
  entries: AnyEntry[];
  onChange: (entries: AnyEntry[]) => void;
  allTags: string[];
};

const EMPTY_ENTRY: Record<string, AnyEntry> = {
  employment: { title: '', company: '', location: '', dates: '', summary: '', achievements: [], tags: [] },
  education: { degree: '', dates: '', details: '', achievements: [], tags: [] },
  projects: { name: '', description: '', url: '', type: '', tags: [] },
};

export default function SectionCard({ title, sectionKey, entries, onChange, allTags }: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  const updateEntry = useCallback((index: number, entry: AnyEntry) => {
    const next = [...entries];
    next[index] = entry;
    onChange(next);
  }, [entries, onChange]);

  const deleteEntry = useCallback((index: number) => {
    onChange(entries.filter((_, i) => i !== index));
  }, [entries, onChange]);

  const addEntry = useCallback(() => {
    const template = EMPTY_ENTRY[sectionKey] || {};
    onChange([...entries, { ...template }]);
  }, [entries, onChange, sectionKey]);

  // Drag-to-reorder
  const handleDragStart = useCallback((index: number) => {
    setDragIndex(index);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    setOverIndex(index);
  }, []);

  const handleDrop = useCallback((index: number) => {
    if (dragIndex === null || dragIndex === index) {
      setDragIndex(null);
      setOverIndex(null);
      return;
    }
    const next = [...entries];
    const [moved] = next.splice(dragIndex, 1);
    next.splice(index, 0, moved);
    onChange(next);
    setDragIndex(null);
    setOverIndex(null);
  }, [dragIndex, entries, onChange]);

  const handleDragEnd = useCallback(() => {
    setDragIndex(null);
    setOverIndex(null);
  }, []);

  return (
    <div className="section-card">
      <div className="section-card-header" onClick={() => setCollapsed(!collapsed)}>
        <span className="section-card-arrow">{collapsed ? '\u25B6' : '\u25BC'}</span>
        <h3 className="section-card-title">{title}</h3>
        <span className="section-card-count">{entries.length}</span>
      </div>

      {!collapsed && (
        <div className="section-card-body">
          {entries.map((entry, i) => (
            <div
              key={i}
              className={`entry-drag-wrapper ${overIndex === i && dragIndex !== i ? 'drag-over' : ''}`}
              draggable
              onDragStart={() => handleDragStart(i)}
              onDragOver={(e) => handleDragOver(e, i)}
              onDrop={() => handleDrop(i)}
              onDragEnd={handleDragEnd}
            >
              <EntryCard
                entry={entry}
                index={i}
                sectionKey={sectionKey}
                allTags={allTags}
                onChange={(updated) => updateEntry(i, updated)}
                onDelete={() => deleteEntry(i)}
                defaultExpanded={i === 0}
              />
            </div>
          ))}

          <button type="button" className="add-btn" onClick={addEntry}>
            + Add Entry
          </button>
        </div>
      )}
    </div>
  );
}
