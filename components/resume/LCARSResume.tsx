'use client';

import { useState } from 'react';
import type { ResumeData } from '@/lib/resume';
import Image from 'next/image';
import './lcars.css';

type SectionId = 'employment' | 'education' | 'projects' | 'skills';

const SECTION_COLORS: Record<SectionId, string> = {
  employment: '#FFCC66',  // tan
  education: '#CC99CC',   // lilac
  projects: '#9999FF',    // blue
  skills: '#FF9933',      // orange
};

const SECTION_LABELS: Record<SectionId, string> = {
  employment: 'PROFESSIONAL EXPERIENCE',
  education: 'EDUCATION',
  projects: 'PROJECTS',
  skills: 'SKILLS',
};

function normalizeExternalUrl(value: string): string {
  if (/^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(value)) return value;
  return `https://${value}`;
}

export default function LCARSResume({ data }: { data: ResumeData }) {
  const [expandedSections, setExpandedSections] = useState<Set<SectionId>>(
    new Set(['employment', 'education', 'projects', 'skills'])
  );

  const toggleSection = (id: SectionId) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const contact = data.contact || { name: 'Unknown' };
  const photoPath = contact.photo
    ? `/assets/${contact.photo}${contact.photo.includes('.') ? '' : '.jpg'}`
    : null;

  const sections: SectionId[] = ['employment', 'education', 'projects', 'skills'];

  return (
    <div className="lcars-root">
      {/* ── Top Bar ── */}
      <div className="lcars-top-bar">
        <div className="lcars-top-elbow" />
        <div className="lcars-top-bar-content">
          <span className="lcars-top-text">PERSONNEL FILE</span>
          <span className="lcars-top-text lcars-top-text--dim">UNITED FEDERATION OF PLANETS</span>
          <span className="lcars-top-text lcars-top-text--dim">STARDATE 78432.9</span>
          <span className="lcars-top-text">LCARS 47291</span>
        </div>
      </div>

      <div className="lcars-body">
        {/* ── Left Panel ── */}
        <div className="lcars-left-panel">
          {/* Sidebar strip segments */}
          <div className="lcars-sidebar-strip">
            {sections.map((id) => (
              <button
                key={id}
                className={`lcars-sidebar-btn ${expandedSections.has(id) ? 'lcars-sidebar-btn--active' : ''}`}
                style={{ '--btn-color': SECTION_COLORS[id] } as React.CSSProperties}
                onClick={() => toggleSection(id)}
              >
                {SECTION_LABELS[id]}
              </button>
            ))}
            <div className="lcars-sidebar-spacer" />
            {/* Decorative blocks */}
            <div className="lcars-sidebar-block" style={{ background: '#CC99CC', flex: '0 0 20px' }} />
            <div className="lcars-sidebar-block" style={{ background: '#9999FF', flex: '0 0 14px' }} />
            <div className="lcars-sidebar-block" style={{ background: '#FF9933', flex: '0 0 30px' }} />
            <div className="lcars-sidebar-block" style={{ background: '#FFCC66', flex: '0 0 10px' }} />
          </div>
        </div>

        {/* ── Main Content ── */}
        <div className="lcars-main">
          {/* Header */}
          <div className="lcars-header">
            {photoPath && (
              <div className="lcars-photo-frame">
                <div className="lcars-photo-label">PERSONNEL FILE</div>
                <Image
                  src={photoPath}
                  alt={contact.name}
                  width={120}
                  height={120}
                  className="lcars-photo"
                />
              </div>
            )}
            <div className="lcars-header-info">
              <h1 className="lcars-name">{contact.name}</h1>
              <div className="lcars-contact-grid">
                {contact.email && (
                  <a href={`mailto:${contact.email}`} className="lcars-contact-item">{contact.email}</a>
                )}
                {contact.linkedin && (
                  <a href={normalizeExternalUrl(contact.linkedin)} className="lcars-contact-item" target="_blank" rel="noreferrer">
                    {contact.linkedin.replace(/^https?:\/\//, '')}
                  </a>
                )}
                {contact.github && (
                  <a href={normalizeExternalUrl(contact.github)} className="lcars-contact-item" target="_blank" rel="noreferrer">
                    {contact.github.replace(/^https?:\/\//, '')}
                  </a>
                )}
                {contact.websites?.map((site, i) => (
                  <a key={i} href={site.url} className="lcars-contact-item" target="_blank" rel="noreferrer">
                    {site.label}: {site.url.replace(/^https?:\/\//, '')}
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Summary */}
          {data.summary && (
            <div className="lcars-summary-bar">
              <div className="lcars-summary-text">{data.summary}</div>
            </div>
          )}

          {/* Employment */}
          {expandedSections.has('employment') && data.employment && data.employment.length > 0 && (
            <div className="lcars-section" data-section="employment">
              <div className="lcars-section-header" style={{ background: SECTION_COLORS.employment }}>
                {SECTION_LABELS.employment}
              </div>
              {data.employment.map((job, i) => (
                <div key={i} className="lcars-entry">
                  <div className="lcars-entry-header">
                    <span className="lcars-entry-title">{job.title}</span>
                    <span className="lcars-entry-company">{job.company}</span>
                    {job.dates && <span className="lcars-entry-dates">{job.dates.replace(/--/g, '–')}</span>}
                  </div>
                  {job.summary && <div className="lcars-entry-summary">{job.summary}</div>}
                  {job.achievements && job.achievements.length > 0 && (
                    <ul className="lcars-bullets">
                      {job.achievements.map((a, j) => (
                        <li key={j}>{typeof a === 'string' ? a : a.text}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Education */}
          {expandedSections.has('education') && data.education && data.education.length > 0 && (
            <div className="lcars-section" data-section="education">
              <div className="lcars-section-header" style={{ background: SECTION_COLORS.education }}>
                {SECTION_LABELS.education}
              </div>
              {data.education.map((edu, i) => (
                <div key={i} className="lcars-entry">
                  <div className="lcars-entry-header">
                    <span className="lcars-entry-title">{edu.degree}</span>
                    {edu.dates && <span className="lcars-entry-dates">{edu.dates.replace(/--/g, '–')}</span>}
                  </div>
                  {edu.details && <div className="lcars-entry-summary">{edu.details}</div>}
                  {edu.achievements && edu.achievements.length > 0 && (
                    <ul className="lcars-bullets">
                      {edu.achievements.map((a, j) => (
                        <li key={j}>{typeof a === 'string' ? a : a.text}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Projects */}
          {expandedSections.has('projects') && data.projects && data.projects.length > 0 && (
            <div className="lcars-section" data-section="projects">
              <div className="lcars-section-header" style={{ background: SECTION_COLORS.projects }}>
                {SECTION_LABELS.projects}
              </div>
              {data.projects.map((proj, i) => (
                <div key={i} className="lcars-entry lcars-entry--compact">
                  <span className="lcars-entry-title">
                    {proj.url ? (
                      <a href={proj.url} target="_blank" rel="noreferrer">{proj.name}</a>
                    ) : proj.name}
                  </span>
                  {proj.description && <span className="lcars-entry-summary"> — {proj.description}</span>}
                </div>
              ))}
            </div>
          )}

          {/* Skills */}
          {expandedSections.has('skills') && data.skills && Object.keys(data.skills).length > 0 && (
            <div className="lcars-section" data-section="skills">
              <div className="lcars-section-header" style={{ background: SECTION_COLORS.skills }}>
                {SECTION_LABELS.skills}
              </div>
              <div className="lcars-skills-grid">
                {Object.entries(data.skills).map(([category, items]) => (
                  <div key={category} className="lcars-skill-group">
                    <span className="lcars-skill-category">{category}</span>
                    <span className="lcars-skill-items">{items.join(' • ')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Right Panel (decorative) ── */}
        <div className="lcars-right-panel">
          <div className="lcars-right-block" style={{ background: '#FF9933', flex: '0 0 60px' }} />
          <div className="lcars-right-block" style={{ background: '#CC99CC', flex: '0 0 40px' }} />
          <div className="lcars-right-block" style={{ background: '#FFCC66', flex: '1' }} />
          <div className="lcars-right-block" style={{ background: '#9999FF', flex: '0 0 30px' }} />
          <div className="lcars-right-block" style={{ background: '#CC6666', flex: '0 0 20px' }} />
        </div>
      </div>

      {/* ── Bottom Bar ── */}
      <div className="lcars-bottom-bar">
        <div className="lcars-bottom-elbow" />
        <div className="lcars-bottom-bar-content">
          <span className="lcars-top-text lcars-top-text--dim">RESUME FILE ACTIVE</span>
          <span className="lcars-top-text">NCC-1701</span>
          <span className="lcars-top-text lcars-top-text--dim">SEC 47-ALPHA</span>
        </div>
      </div>
    </div>
  );
}
