'use client';

import { useState, useCallback } from 'react';
import TagPicker from './TagPicker';
import type { Achievement } from '@/lib/resume';

type Props = {
  achievements: Achievement[];
  onChange: (achievements: Achievement[]) => void;
  allTags: string[];
};

export default function AchievementList({ achievements, onChange, allTags }: Props) {
  const [localValues, setLocalValues] = useState(achievements);

  // Sync from parent
  const [lastParent, setLastParent] = useState(achievements);
  if (achievements !== lastParent && JSON.stringify(achievements) !== JSON.stringify(localValues)) {
    setLocalValues(achievements);
    setLastParent(achievements);
  }

  const updateAt = useCallback((index: number, patch: Partial<Achievement>) => {
    setLocalValues((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], ...patch };
      return next;
    });
  }, []);

  const commitText = useCallback((index: number) => {
    onChange(localValues);
  }, [localValues, onChange]);

  const updateTags = useCallback((index: number, tags: string[]) => {
    const next = [...localValues];
    next[index] = { ...next[index], tags: tags.length > 0 ? tags : undefined };
    setLocalValues(next);
    onChange(next);
  }, [localValues, onChange]);

  const updatePriority = useCallback((index: number, value: string) => {
    const next = [...localValues];
    const num = value === '' ? undefined : parseInt(value, 10);
    next[index] = { ...next[index], priority: Number.isNaN(num) ? undefined : num };
    setLocalValues(next);
    onChange(next);
  }, [localValues, onChange]);

  const remove = useCallback((index: number) => {
    const next = localValues.filter((_, i) => i !== index);
    setLocalValues(next);
    onChange(next);
  }, [localValues, onChange]);

  const add = useCallback(() => {
    const next = [...localValues, { text: '' }];
    setLocalValues(next);
    onChange(next);
  }, [localValues, onChange]);

  return (
    <div className="achievement-list">
      <label className="field-label">Achievements</label>
      {localValues.map((ach, i) => (
        <div className="achievement-card" key={i}>
          <div className="achievement-top-row">
            <span className="achievement-number">{i + 1}</span>
            <textarea
              className="achievement-input"
              rows={2}
              value={ach.text}
              onChange={(e) => updateAt(i, { text: e.target.value })}
              onBlur={() => commitText(i)}
              placeholder="Achievement text"
            />
            <div className="achievement-priority">
              <input
                className="priority-input"
                type="number"
                min="1"
                value={ach.priority ?? ''}
                placeholder="#"
                title="Priority (lower = higher priority)"
                onChange={(e) => updatePriority(i, e.target.value)}
              />
            </div>
            <button
              type="button"
              className="achievement-delete"
              onClick={() => remove(i)}
              title="Remove"
            >
              &times;
            </button>
          </div>
          {allTags.length > 0 && (
            <div className="achievement-tags-row">
              <TagPicker
                allTags={allTags}
                activeTags={ach.tags || []}
                onChange={(tags) => updateTags(i, tags)}
              />
            </div>
          )}
        </div>
      ))}
      <button type="button" className="add-btn" onClick={add}>
        + Add Achievement
      </button>
    </div>
  );
}
