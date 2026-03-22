'use client';

import { useState, useCallback } from 'react';
import TagPicker from './TagPicker';

function SkillInput({ value, onCommit }: { value: string; onCommit: (v: string) => void }) {
  const [local, setLocal] = useState(value);
  const [lastValue, setLastValue] = useState(value);
  if (value !== lastValue) {
    setLocal(value);
    setLastValue(value);
  }
  return (
    <input
      className="field-input"
      type="text"
      value={local}
      placeholder="Skill1, Skill2, Skill3"
      onChange={(e) => setLocal(e.target.value)}
      onBlur={() => onCommit(local)}
    />
  );
}

type Props = {
  skills: Record<string, string[]>;
  skillsTags: Record<string, string[]>;
  onChange: (skills: Record<string, string[]>, skillsTags: Record<string, string[]>) => void;
  allTags: string[];
};

export default function SkillsCard({ skills, skillsTags, onChange, allTags }: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const categories = Object.keys(skills);

  const updateSkills = useCallback((category: string, value: string) => {
    const parsed = value.split(',').map((s) => s.trim()).filter(Boolean);
    const next = { ...skills, [category]: parsed };
    onChange(next, skillsTags);
  }, [skills, skillsTags, onChange]);

  const updateCategoryTags = useCallback((category: string, tags: string[]) => {
    const next = { ...skillsTags, [category]: tags };
    onChange(skills, next);
  }, [skills, skillsTags, onChange]);

  const renameCategory = useCallback((oldName: string, newName: string) => {
    if (!newName.trim() || newName === oldName) {
      setEditingCategory(null);
      return;
    }
    const nextSkills = { ...skills };
    nextSkills[newName] = nextSkills[oldName];
    delete nextSkills[oldName];

    const nextTags = { ...skillsTags };
    if (nextTags[oldName]) {
      nextTags[newName] = nextTags[oldName];
      delete nextTags[oldName];
    }

    onChange(nextSkills, nextTags);
    setEditingCategory(null);
  }, [skills, skillsTags, onChange]);

  const addCategory = useCallback(() => {
    const name = 'New Category';
    let suffix = '';
    let counter = 0;
    while (skills[name + suffix]) {
      counter++;
      suffix = ` ${counter}`;
    }
    onChange({ ...skills, [name + suffix]: [] }, skillsTags);
  }, [skills, skillsTags, onChange]);

  const deleteCategory = useCallback((category: string) => {
    const nextSkills = { ...skills };
    delete nextSkills[category];
    const nextTags = { ...skillsTags };
    delete nextTags[category];
    onChange(nextSkills, nextTags);
  }, [skills, skillsTags, onChange]);

  return (
    <div className="section-card">
      <div className="section-card-header" onClick={() => setCollapsed(!collapsed)}>
        <span className="section-card-arrow">{collapsed ? '\u25B6' : '\u25BC'}</span>
        <h3 className="section-card-title">Skills</h3>
        <span className="section-card-count">{categories.length}</span>
      </div>

      {!collapsed && (
        <div className="section-card-body">
          {categories.map((cat) => (
            <div className="skills-category" key={cat}>
              <div className="skills-category-header">
                {editingCategory === cat ? (
                  <input
                    className="field-input skills-name-input"
                    autoFocus
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onBlur={() => renameCategory(cat, editName)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') renameCategory(cat, editName);
                      if (e.key === 'Escape') setEditingCategory(null);
                    }}
                  />
                ) : (
                  <span
                    className="skills-category-name"
                    onDoubleClick={() => {
                      setEditingCategory(cat);
                      setEditName(cat);
                    }}
                  >
                    {cat}
                  </span>
                )}
                <button
                  type="button"
                  className="skills-delete-btn"
                  onClick={() => deleteCategory(cat)}
                  title="Delete category"
                >
                  &times;
                </button>
              </div>

              <SkillInput
                value={skills[cat].join(', ')}
                onCommit={(val) => updateSkills(cat, val)}
              />

              {allTags.length > 0 && (
                <div className="skills-tags-row">
                  <span className="skills-tags-label">Profile tags:</span>
                  <TagPicker
                    allTags={allTags}
                    activeTags={skillsTags[cat] || []}
                    onChange={(tags) => updateCategoryTags(cat, tags)}
                  />
                </div>
              )}
            </div>
          ))}

          <button type="button" className="add-btn" onClick={addCategory}>
            + Add Category
          </button>
        </div>
      )}
    </div>
  );
}
