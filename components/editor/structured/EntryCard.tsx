'use client';

import { useState, useCallback } from 'react';
import TagPicker from './TagPicker';
import AchievementList from './AchievementList';
import type { Achievement, AchievementInput } from '@/lib/resume';

type AnyEntry = Record<string, unknown>;

/** Convert mixed string/object achievements to structured Achievement[] */
function normalizeAchievements(items: AchievementInput[]): Achievement[] {
  return items.map((a) => {
    if (typeof a === 'string') {
      return { text: a };
    }
    return a;
  });
}

type FieldDef = {
  key: string;
  label: string;
  type: 'text' | 'textarea';
  placeholder?: string;
};

const FIELD_DEFS: Record<string, FieldDef[]> = {
  employment: [
    { key: 'title', label: 'Title', type: 'text', placeholder: 'Job title' },
    { key: 'company', label: 'Company', type: 'text', placeholder: 'Company name' },
    { key: 'location', label: 'Location', type: 'text', placeholder: 'City, State' },
    { key: 'dates', label: 'Dates', type: 'text', placeholder: '2020 -- Present' },
    { key: 'summary', label: 'Summary', type: 'textarea', placeholder: 'Brief role summary' },
  ],
  education: [
    { key: 'degree', label: 'Degree', type: 'text', placeholder: 'Degree or certification' },
    { key: 'dates', label: 'Dates', type: 'text', placeholder: '2016 -- 2020' },
    { key: 'details', label: 'Details', type: 'text', placeholder: 'School, program details' },
  ],
  projects: [
    { key: 'name', label: 'Name', type: 'text', placeholder: 'Project name' },
    { key: 'description', label: 'Description', type: 'textarea', placeholder: 'What the project does' },
    { key: 'url', label: 'URL', type: 'text', placeholder: 'github.com/user/repo' },
    { key: 'type', label: 'Type', type: 'text', placeholder: 'homelab, github, etc.' },
  ],
};

function getSummaryLine(entry: AnyEntry, sectionKey: string): string {
  if (sectionKey === 'employment') {
    const parts = [entry.title, entry.company].filter(Boolean);
    const line = parts.join(' \u2014 ') || 'Untitled entry';
    return entry.dates ? `${line}  (${entry.dates})` : line;
  }
  if (sectionKey === 'education') {
    const deg = (entry.degree as string) || 'Untitled entry';
    return entry.dates ? `${deg}  (${entry.dates})` : deg;
  }
  if (sectionKey === 'projects') {
    return (entry.name as string) || 'Untitled entry';
  }
  return 'Entry';
}

type Props = {
  entry: AnyEntry;
  index: number;
  sectionKey: string;
  allTags: string[];
  onChange: (entry: AnyEntry) => void;
  onDelete: () => void;
  defaultExpanded?: boolean;
};

export default function EntryCard({ entry, index, sectionKey, allTags, onChange, onDelete, defaultExpanded }: Props) {
  const [expanded, setExpanded] = useState(defaultExpanded ?? false);
  const [local, setLocal] = useState(entry);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Sync from parent
  const parentKey = JSON.stringify(entry);
  const [lastParentKey, setLastParentKey] = useState(parentKey);
  if (parentKey !== lastParentKey) {
    setLocal(entry);
    setLastParentKey(parentKey);
  }

  const updateField = useCallback((key: string, value: unknown) => {
    setLocal((prev) => ({ ...prev, [key]: value }));
  }, []);

  const commit = useCallback(() => {
    onChange(local);
  }, [local, onChange]);

  const fields = FIELD_DEFS[sectionKey] || [];
  const hasAchievements = sectionKey === 'employment' || sectionKey === 'education';
  const tags = (local.tags as string[]) || [];

  return (
    <div className="entry-card">
      <div className="entry-card-header" onClick={() => setExpanded(!expanded)}>
        <span className="entry-card-arrow">{expanded ? '\u25BC' : '\u25B6'}</span>
        <span className="entry-card-index">{index + 1}.</span>
        <span className="entry-card-summary">{getSummaryLine(local, sectionKey)}</span>
        {tags.length > 0 && (
          <span className="entry-card-tag-count">{tags.length} tags</span>
        )}
      </div>

      {expanded && (
        <div className="entry-card-body">
          {fields.map(({ key, label, type, placeholder }) => (
            <div className="field-row" key={key}>
              <label className="field-label">{label}</label>
              {type === 'textarea' ? (
                <textarea
                  className="field-textarea"
                  rows={2}
                  value={(local[key] as string) || ''}
                  placeholder={placeholder}
                  onChange={(e) => updateField(key, e.target.value)}
                  onBlur={commit}
                />
              ) : (
                <input
                  className="field-input"
                  type="text"
                  value={(local[key] as string) || ''}
                  placeholder={placeholder}
                  onChange={(e) => updateField(key, e.target.value)}
                  onBlur={commit}
                />
              )}
            </div>
          ))}

          <div className="field-row">
            <label className="field-label">Tags</label>
            <TagPicker
              allTags={allTags}
              activeTags={tags}
              onChange={(newTags) => {
                const updated = { ...local, tags: newTags };
                setLocal(updated);
                onChange(updated);
              }}
            />
          </div>

          {hasAchievements && (
            <AchievementList
              achievements={normalizeAchievements((local.achievements as AchievementInput[]) || [])}
              onChange={(achievements) => {
                const updated = { ...local, achievements };
                setLocal(updated);
                onChange(updated);
              }}
              allTags={allTags}
            />
          )}

          <div className="entry-card-actions">
            {confirmDelete ? (
              <span className="delete-confirm">
                Delete this entry?{' '}
                <button type="button" className="delete-yes" onClick={onDelete}>Yes</button>
                <button type="button" className="delete-no" onClick={() => setConfirmDelete(false)}>No</button>
              </span>
            ) : (
              <button
                type="button"
                className="entry-delete-btn"
                onClick={() => setConfirmDelete(true)}
              >
                Delete
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
