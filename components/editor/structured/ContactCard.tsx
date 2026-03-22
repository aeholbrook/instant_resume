'use client';

import { useState, useCallback } from 'react';
import type { ResumeData } from '@/lib/resume';

type ContactData = ResumeData['contact'];

type Props = {
  contact: ContactData;
  onChange: (contact: ContactData) => void;
};

const FIELDS: { key: keyof ContactData; label: string; placeholder: string }[] = [
  { key: 'name', label: 'Name', placeholder: 'Full name' },
  { key: 'email', label: 'Email', placeholder: 'email@example.com' },
  { key: 'phone', label: 'Phone', placeholder: '(555) 555-5555' },
  { key: 'location', label: 'Location', placeholder: 'City, State' },
  { key: 'linkedin', label: 'LinkedIn', placeholder: 'linkedin.com/in/username' },
  { key: 'github', label: 'GitHub', placeholder: 'github.com/username' },
  { key: 'photo', label: 'Photo', placeholder: 'Photo asset name' },
];

export default function ContactCard({ contact, onChange }: Props) {
  const [local, setLocal] = useState(contact);
  const [collapsed, setCollapsed] = useState(false);

  // Sync from parent when rawData changes externally (e.g. YAML mode edit)
  const parentName = contact.name;
  const [lastParent, setLastParent] = useState(parentName);
  if (parentName !== lastParent) {
    setLocal(contact);
    setLastParent(parentName);
  }

  const commit = useCallback(() => {
    onChange(local);
  }, [local, onChange]);

  const updateField = useCallback((key: keyof ContactData, value: string) => {
    setLocal((prev) => ({ ...prev, [key]: value }));
  }, []);

  return (
    <div className="section-card">
      <div className="section-card-header" onClick={() => setCollapsed(!collapsed)}>
        <span className="section-card-arrow">{collapsed ? '\u25B6' : '\u25BC'}</span>
        <h3 className="section-card-title">Contact</h3>
      </div>
      {!collapsed && (
        <div className="section-card-body">
          {FIELDS.map(({ key, label, placeholder }) => (
            <div className="field-row" key={key}>
              <label className="field-label">{label}</label>
              <input
                className="field-input"
                type="text"
                value={(local[key] as string) || ''}
                placeholder={placeholder}
                onChange={(e) => updateField(key, e.target.value)}
                onBlur={commit}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
