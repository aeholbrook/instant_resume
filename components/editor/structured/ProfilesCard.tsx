'use client';

import { useState, useCallback } from 'react';
import TagPicker from './TagPicker';
import type { ProfileDef } from '@/lib/resume';

type Props = {
  profiles: Record<string, ProfileDef>;
  onChange: (profiles: Record<string, ProfileDef>) => void;
  allTags: string[];
};

function ProfileEntry({
  name,
  profile,
  allTags,
  onChange,
  onDelete,
  onRename,
}: {
  name: string;
  profile: ProfileDef;
  allTags: string[];
  onChange: (profile: ProfileDef) => void;
  onDelete: () => void;
  onRename: (newName: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [localLabel, setLocalLabel] = useState(profile.label || '');
  const [localSummary, setLocalSummary] = useState(profile.summary || '');
  const [localName, setLocalName] = useState(name);
  const [editingName, setEditingName] = useState(false);

  // Sync from parent
  const parentKey = JSON.stringify(profile);
  const [lastKey, setLastKey] = useState(parentKey);
  if (parentKey !== lastKey) {
    setLocalLabel(profile.label || '');
    setLocalSummary(profile.summary || '');
    setLastKey(parentKey);
  }

  const commitLabel = useCallback(() => {
    onChange({ ...profile, label: localLabel });
  }, [profile, localLabel, onChange]);

  const commitSummary = useCallback(() => {
    onChange({ ...profile, summary: localSummary });
  }, [profile, localSummary, onChange]);

  const limits = profile.limits || {};

  const updateLimit = useCallback((key: string, value: string) => {
    const num = value === '' ? undefined : parseInt(value, 10);
    const nextLimits = { ...limits, [key]: num };
    // Clean up undefined values
    for (const k of Object.keys(nextLimits)) {
      if (nextLimits[k as keyof typeof nextLimits] === undefined) {
        delete nextLimits[k as keyof typeof nextLimits];
      }
    }
    onChange({ ...profile, limits: Object.keys(nextLimits).length > 0 ? nextLimits : undefined });
  }, [profile, limits, onChange]);

  return (
    <div className="entry-card">
      <div className="entry-card-header" onClick={() => setExpanded(!expanded)}>
        <span className="entry-card-arrow">{expanded ? '\u25BC' : '\u25B6'}</span>
        <span className="entry-card-summary">
          {profile.label || name}
          <span className="entry-card-tag-count">{(profile.tags || []).length} tags</span>
        </span>
      </div>

      {expanded && (
        <div className="entry-card-body">
          <div className="field-row">
            <label className="field-label">Key</label>
            {editingName ? (
              <input
                className="field-input"
                autoFocus
                value={localName}
                onChange={(e) => setLocalName(e.target.value)}
                onBlur={() => {
                  if (localName && localName !== name) onRename(localName);
                  setEditingName(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    if (localName && localName !== name) onRename(localName);
                    setEditingName(false);
                  }
                }}
              />
            ) : (
              <span
                className="field-value-clickable"
                onDoubleClick={() => setEditingName(true)}
              >
                {name} <span className="field-hint">(double-click to rename)</span>
              </span>
            )}
          </div>

          <div className="field-row">
            <label className="field-label">Label</label>
            <input
              className="field-input"
              value={localLabel}
              placeholder="Display name"
              onChange={(e) => setLocalLabel(e.target.value)}
              onBlur={commitLabel}
            />
          </div>

          <div className="field-row">
            <label className="field-label">Tags</label>
            <TagPicker
              allTags={allTags}
              activeTags={profile.tags || []}
              onChange={(tags) => onChange({ ...profile, tags })}
            />
          </div>

          <div className="field-row">
            <label className="field-label">Summary</label>
            <textarea
              className="field-textarea"
              rows={3}
              value={localSummary}
              placeholder="Profile-specific summary"
              onChange={(e) => setLocalSummary(e.target.value)}
              onBlur={commitSummary}
            />
          </div>

          <div className="field-row">
            <label className="field-label">Limits</label>
            <div className="limits-grid">
              {(['max_jobs', 'max_achievements', 'max_projects', 'max_education'] as const).map((key) => (
                <div className="limit-field" key={key}>
                  <label className="limit-label">{key.replace('max_', '')}</label>
                  <input
                    className="field-input limit-input"
                    type="number"
                    min="0"
                    value={limits[key] ?? ''}
                    placeholder="-"
                    onChange={(e) => updateLimit(key, e.target.value)}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="entry-card-actions">
            <button type="button" className="entry-delete-btn" onClick={onDelete}>
              Delete Profile
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProfilesCard({ profiles, onChange, allTags }: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const names = Object.keys(profiles);

  const updateProfile = useCallback((name: string, profile: ProfileDef) => {
    onChange({ ...profiles, [name]: profile });
  }, [profiles, onChange]);

  const deleteProfile = useCallback((name: string) => {
    const next = { ...profiles };
    delete next[name];
    onChange(next);
  }, [profiles, onChange]);

  const renameProfile = useCallback((oldName: string, newName: string) => {
    if (profiles[newName]) return; // name collision
    const next: Record<string, ProfileDef> = {};
    for (const [k, v] of Object.entries(profiles)) {
      next[k === oldName ? newName : k] = v;
    }
    onChange(next);
  }, [profiles, onChange]);

  const addProfile = useCallback(() => {
    let name = 'new-profile';
    let counter = 0;
    while (profiles[name]) {
      counter++;
      name = `new-profile-${counter}`;
    }
    onChange({ ...profiles, [name]: { label: 'New Profile', tags: [], limits: {} } });
  }, [profiles, onChange]);

  return (
    <div className="section-card">
      <div className="section-card-header" onClick={() => setCollapsed(!collapsed)}>
        <span className="section-card-arrow">{collapsed ? '\u25B6' : '\u25BC'}</span>
        <h3 className="section-card-title">Profiles</h3>
        <span className="section-card-count">{names.length}</span>
      </div>

      {!collapsed && (
        <div className="section-card-body">
          {names.map((name) => (
            <ProfileEntry
              key={name}
              name={name}
              profile={profiles[name]}
              allTags={allTags}
              onChange={(p) => updateProfile(name, p)}
              onDelete={() => deleteProfile(name)}
              onRename={(newName) => renameProfile(name, newName)}
            />
          ))}

          <button type="button" className="add-btn" onClick={addProfile}>
            + Add Profile
          </button>
        </div>
      )}
    </div>
  );
}
