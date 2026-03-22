'use client';

import { useRef, useCallback } from 'react';
import { useEditor } from '@/lib/editor-context';
import ContactCard from './ContactCard';
import SummaryCard from './SummaryCard';
import SectionCard from './SectionCard';
import SkillsCard from './SkillsCard';
import ProfilesCard from './ProfilesCard';
import type { ResumeData } from '@/lib/resume';
import './structured-editor.css';

const SECTIONS = [
  { id: 'contact', label: 'Contact' },
  { id: 'summary', label: 'Summary' },
  { id: 'employment', label: 'Experience' },
  { id: 'education', label: 'Education' },
  { id: 'projects', label: 'Projects' },
  { id: 'skills', label: 'Skills' },
  { id: 'profiles', label: 'Profiles' },
];

export default function StructuredEditor() {
  const { state, updateRawData } = useEditor();
  const scrollRef = useRef<HTMLDivElement>(null);
  const raw = state.rawData;

  const scrollTo = useCallback((id: string) => {
    const el = scrollRef.current?.querySelector(`[data-section="${id}"]`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  if (!raw) {
    return (
      <div className="structured-editor">
        <div className="structured-empty">
          No data loaded. Switch to YAML mode to load a file.
        </div>
      </div>
    );
  }

  function update(patch: Partial<ResumeData>) {
    updateRawData({ ...raw!, ...patch });
  }

  return (
    <div className="structured-editor" ref={scrollRef}>
      <nav className="section-nav">
        {SECTIONS.map(({ id, label }) => (
          <button
            key={id}
            className="section-nav-pill"
            onClick={() => scrollTo(id)}
          >
            {label}
          </button>
        ))}
      </nav>

      <div data-section="contact">
        <ContactCard
          contact={raw.contact}
          onChange={(contact) => update({ contact })}
        />
      </div>

      <div data-section="summary">
        <SummaryCard
          summary={raw.summary || ''}
          onChange={(summary) => update({ summary })}
        />
      </div>

      <div data-section="employment">
        <SectionCard
          title="Professional Experience"
          sectionKey="employment"
          entries={(raw.employment || []) as Record<string, unknown>[]}
          onChange={(entries) => update({ employment: entries as ResumeData['employment'] })}
          allTags={getAllTags(raw)}
        />
      </div>

      <div data-section="education">
        <SectionCard
          title="Education"
          sectionKey="education"
          entries={(raw.education || []) as Record<string, unknown>[]}
          onChange={(entries) => update({ education: entries as ResumeData['education'] })}
          allTags={getAllTags(raw)}
        />
      </div>

      <div data-section="projects">
        <SectionCard
          title="Projects"
          sectionKey="projects"
          entries={(raw.projects || []) as Record<string, unknown>[]}
          onChange={(entries) => update({ projects: entries as ResumeData['projects'] })}
          allTags={getAllTags(raw)}
        />
      </div>

      <div data-section="skills">
        <SkillsCard
          skills={raw.skills || {}}
          skillsTags={raw.skills_tags || {}}
          onChange={(skills, skillsTags) => update({ skills, skills_tags: skillsTags })}
          allTags={getAllTags(raw)}
        />
      </div>

      <div data-section="profiles">
        <ProfilesCard
          profiles={raw.profiles || {}}
          onChange={(profiles) => update({ profiles })}
          allTags={getAllTags(raw)}
        />
      </div>
    </div>
  );
}

/** Gather all unique tags from all profiles */
function getAllTags(data: ResumeData): string[] {
  const tags = new Set<string>();
  const profiles = data.profiles ?? {};
  for (const prof of Object.values(profiles)) {
    for (const t of prof.tags ?? []) {
      tags.add(t);
    }
  }
  return Array.from(tags).sort();
}
