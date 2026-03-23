import type { ResumeData } from '@/lib/resume';
import type { ProfileInfo } from '@/lib/profile-filter';
import Image from 'next/image';
import ResumeActions from '@/components/ResumeActions';
import ProfileSelector from '@/components/ProfileSelector';
import { Fragment } from 'react';

export type ResumeModuleId = 'header' | 'employment' | 'education' | 'projects' | 'skills';

const DEFAULT_MODULE_ORDER: ResumeModuleId[] = [
  'header',
  'employment',
  'education',
  'projects',
  'skills',
];

function normalizeExternalUrl(value: string): string {
  if (/^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(value)) return value;
  return `https://${value}`;
}

function normalizePhoneHref(value: string): string {
  const cleaned = value.replace(/[^\d+]/g, '');
  return `tel:${cleaned || value}`;
}

/* ---- SVG icons matching the PDF ---- */

function MailIcon() {
  return (
    <svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
      <path d="M48 64C21.5 64 0 85.5 0 112c0 15.1 7.1 29.3 19.2 38.4L236.8 313.6c11.4 8.5 27 8.5 38.4 0L492.8 150.4c12.1-9.1 19.2-23.3 19.2-38.4c0-26.5-21.5-48-48-48H48zM0 176V384c0 35.3 28.7 64 64 64H448c35.3 0 64-28.7 64-64V176L294.4 339.2c-22.8 17.1-54 17.1-76.8 0L0 176z" />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg viewBox="0 0 496 512" xmlns="http://www.w3.org/2000/svg">
      <path d="M165.9 397.4c0 2-2.3 3.6-5.2 3.6-3.3.3-5.6-1.3-5.6-3.6 0-2 2.3-3.6 5.2-3.6 3-.3 5.6 1.3 5.6 3.6zm-31.1-4.5c-.7 2 1.3 4.3 4.3 4.9 2.6 1 5.6 0 6.2-2s-1.3-4.3-4.3-5.2c-2.6-.7-5.5.3-6.2 2.3zm44.2-1.7c-2.9.7-4.9 2.6-4.6 4.9.3 2 2.9 3.3 5.9 2.6 2.9-.7 4.9-2.6 4.6-4.6-.3-1.9-3-3.2-5.9-2.9zM244.8 8C106.1 8 0 113.3 0 252c0 110.9 69.8 205.8 169.5 239.2 12.8 2.3 17.3-5.6 17.3-12.1 0-6.2-.3-40.4-.3-61.4 0 0-70 15-84.7-29.8 0 0-11.4-29.1-27.8-36.6 0 0-22.9-15.7 1.6-15.4 0 0 24.9 2 38.6 25.8 21.9 38.6 58.6 27.5 72.9 20.9 2.3-16 8.8-27.1 16-33.7-55.9-6.2-112.3-14.3-112.3-110.5 0-27.5 7.6-41.3 23.6-58.9-2.6-6.5-11.1-33.3 2.6-67.9 20.9-6.5 69 27 69 27 20-5.6 41.5-8.5 62.8-8.5s42.8 2.9 62.8 8.5c0 0 48.1-33.6 69-27 13.7 34.7 5.2 61.4 2.6 67.9 16 17.7 25.8 31.5 25.8 58.9 0 96.5-58.9 104.2-114.8 110.5 9.2 7.9 17 22.9 17 46.4 0 33.7-.3 75.4-.3 83.6 0 6.5 4.6 14.4 17.3 12.1C428.2 457.8 496 362.9 496 252 496 113.3 383.5 8 244.8 8zM97.2 352.9c-1.3 1-1 3.3.7 5.2 1.6 1.6 3.9 2.3 5.2 1 1.3-1 1-3.3-.7-5.2-1.6-1.6-3.9-2.3-5.2-1zm-10.8-8.1c-.7 1.3.3 2.9 2.3 3.9 1.6 1 3.6.7 4.3-.7.7-1.3-.3-2.9-2.3-3.9-2-.6-3.6-.3-4.3.7zm32.4 35.6c-1.6 1.3-1 4.3 1.3 6.2 2.3 2.3 5.2 2.6 6.5 1 1.3-1.3.7-4.3-1.3-6.2-2.2-2.3-5.2-2.6-6.5-1zm-11.4-14.7c-1.6 1-1.6 3.6 0 5.9 1.6 2.3 4.3 3.3 5.6 2.3 1.6-1.3 1.6-3.9 0-6.2-1.4-2.3-4-3.3-5.6-2z" />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg viewBox="0 0 448 512" xmlns="http://www.w3.org/2000/svg">
      <path d="M416 32H31.9C14.3 32 0 46.5 0 64.3v383.4C0 465.5 14.3 480 31.9 480H416c17.6 0 32-14.5 32-32.3V64.3c0-17.8-14.4-32.3-32-32.3zM135.4 416H69V202.2h66.5V416zm-33.2-243c-21.3 0-38.5-17.3-38.5-38.5S80.9 96 102.2 96c21.2 0 38.5 17.3 38.5 38.5 0 21.3-17.2 38.5-38.5 38.5zm282.1 243h-66.4V312c0-24.8-.5-56.7-34.5-56.7-34.6 0-39.9 27-39.9 54.9V416h-66.4V202.2h63.7v29.2h.9c8.9-16.8 30.6-34.5 62.9-34.5 67.2 0 79.7 44.3 79.7 101.9V416z" />
    </svg>
  );
}

type ContactRow = {
  icon: () => JSX.Element;
  iconClass: string;
  value: string;
  href?: string;
};

function HeaderModule({ data, profiles, currentProfile, hideControls }: { data: ResumeData; profiles?: ProfileInfo[]; currentProfile?: string; hideControls?: boolean }) {
  const contact = data.contact || { name: 'Your Name' };
  const photoPath = contact.photo
    ? `/assets/${contact.photo}${contact.photo.includes('.') ? '' : '.jpg'}`
    : null;
  const photoSize = contact.photo_size ?? 150;
  const photoPosition = contact.photo_position ?? 'left';

  const contactRows = [
    contact.email
      ? { icon: MailIcon, iconClass: 'icon-mail', value: contact.email, href: `mailto:${contact.email}` }
      : null,
    contact.github
      ? { icon: GitHubIcon, iconClass: 'icon-github', value: `http://${contact.github.replace(/^https?:\/\//, '')}`, href: normalizeExternalUrl(contact.github) }
      : null,
    contact.linkedin
      ? { icon: LinkedInIcon, iconClass: 'icon-linkedin', value: `http://${contact.linkedin.replace(/^https?:\/\//, '')}`, href: normalizeExternalUrl(contact.linkedin) }
      : null,
  ].filter((row): row is NonNullable<typeof row> => Boolean(row));

  const photoEl = photoPath ? (
    <aside className="header-aside" style={{ order: photoPosition === 'right' ? 2 : 0 }}>
      <div className="headshot-frame" style={{ width: photoSize }}>
        <Image
          src={photoPath}
          alt={contact.name}
          width={260}
          height={300}
          className="headshot"
          priority
        />
      </div>
    </aside>
  ) : null;

  return (
    <header
      className={`header-module ${photoPosition === 'right' ? 'photo-right' : 'photo-left'}`}
      data-module="header"
    >
      {photoEl}
      <div className="identity-column" style={{ order: 1 }}>
        <h1 className="name">{contact.name}</h1>
        {contactRows.length > 0 && (
          <ul className="contact-list">
            {contactRows.map((row, i) => (
              <li key={i} className="contact-line">
                <span className={`contact-icon ${row.iconClass}`}><row.icon /></span>
                {row.href ? (
                  <a href={row.href} target="_blank" rel="noreferrer" className="contact-value">
                    {row.value}
                  </a>
                ) : (
                  <span className="contact-value">{row.value}</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
      {data.summary ? <p className="summary" style={{ order: 3 }}>{data.summary}</p> : null}
      {!hideControls && (
        <aside className="header-controls">
          <ResumeActions profile={currentProfile} />
          {profiles && profiles.length > 0 && (
            <ProfileSelector profiles={profiles} currentProfile={currentProfile} />
          )}
        </aside>
      )}
    </header>
  );
}

function EmploymentModule({ data }: { data: ResumeData }) {
  const items = data.employment || [];
  if (!items.length) return null;

  return (
    <section className="resume-section" data-module="employment">
      <div className="section-title">{data.section_titles?.employment || 'Professional Experience'}</div>
      {items.map((role, index) => (
        <article className="entry" key={`${role.company}-${index}`}>
          <div className="entry-topline">
            <span className="entry-title-group">
              <h3 className="entry-title">{role.title}</h3>
              <span className="entry-company"> at {role.company}</span>
            </span>
            <span className="entry-right">
              {role.dates?.replace(/--/g, '\u2013')}
            </span>
          </div>
          {role.summary ? <p className="entry-subtitle">{role.summary}</p> : null}
          {role.achievements?.length ? (
            <div className="entry-details">
              <ul className="stack-bullets">
                {role.achievements.map((item, i) => (
                  <li key={i}>{typeof item === 'string' ? item : item.text}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </article>
      ))}
    </section>
  );
}

function EducationModule({ data }: { data: ResumeData }) {
  const items = data.education || [];
  if (!items.length) return null;

  return (
    <section className="resume-section" data-module="education">
      <div className="section-title">{data.section_titles?.education || 'Education'}</div>
      {items.map((item, index) => (
        <article className="entry" key={`${item.degree}-${index}`}>
          <div className="entry-topline">
            <h3 className="entry-title">{item.degree}</h3>
            <span className="entry-right">
              {item.details ? <span className="edu-detail">{item.details}</span> : null}
              {item.dates ? ` | ${item.dates.replace(/--/g, '\u2013')}` : ''}
            </span>
          </div>
          {item.achievements?.length ? (
            <div className="entry-details">
              <ul className="stack-bullets">
                {item.achievements.map((achievement, i) => (
                  <li key={i}>{typeof achievement === 'string' ? achievement : achievement.text}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </article>
      ))}
    </section>
  );
}

function ProjectsModule({ data }: { data: ResumeData }) {
  const items = data.projects || [];
  if (!items.length) return null;

  return (
    <section className="resume-section" data-module="projects">
      <div className="section-title">{data.section_titles?.projects || 'Projects'}</div>
      <ul className="projects-list">
        {items.map((project, index) => (
          <li key={index}>
            <span className="project-name">
              {project.url ? (
                <a href={normalizeExternalUrl(project.url)} target="_blank" rel="noreferrer">
                  {project.name}
                </a>
              ) : (
                project.name
              )}
            </span>
            {project.description ? ` \u2013 ${project.description}` : ''}
          </li>
        ))}
      </ul>
    </section>
  );
}

function SkillsModule({ data }: { data: ResumeData }) {
  const items = Object.entries(data.skills || {});
  if (!items.length) return null;

  return (
    <section className="resume-section" data-module="skills">
      <div className="section-title">{data.section_titles?.skills || 'Skills'}</div>
      <div className="skills-block">
        {items.map(([group, skills]) => (
          <div className="skill-row" key={group}>
            <span className="skill-category">{group}</span>{' '}
            <span className="skill-items">{skills.join(', ')}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function resolveModuleOrder(data: ResumeData): ResumeModuleId[] {
  const configured = data.resume_modules || data.layout?.modules;
  if (!configured?.length) return DEFAULT_MODULE_ORDER;

  const allowed = new Set<ResumeModuleId>(DEFAULT_MODULE_ORDER);
  const sanitized = configured.filter((moduleId): moduleId is ResumeModuleId =>
    allowed.has(moduleId as ResumeModuleId)
  );

  return sanitized.length ? sanitized : DEFAULT_MODULE_ORDER;
}

export type ResumeTheme = 'classic' | 'modern' | 'card' | 'dark';

type StackProps = {
  data: ResumeData;
  profiles?: ProfileInfo[];
  currentProfile?: string;
  hideControls?: boolean;
  theme?: ResumeTheme;
};

export default function ClassicResumeStack({ data, profiles, currentProfile, hideControls, theme }: StackProps) {
  const modules = resolveModuleOrder(data);

  const moduleRenderer: Record<ResumeModuleId, () => JSX.Element | null> = {
    header: () => <HeaderModule data={data} profiles={profiles} currentProfile={currentProfile} hideControls={hideControls} />,
    employment: () => <EmploymentModule data={data} />,
    education: () => <EducationModule data={data} />,
    projects: () => <ProjectsModule data={data} />,
    skills: () => <SkillsModule data={data} />,
  };

  return (
    <main className="main">
      <div className="sheet" data-theme={theme || 'modern'}>
        {modules.map((moduleId) => (
          <Fragment key={moduleId}>{moduleRenderer[moduleId]()}</Fragment>
        ))}
      </div>
    </main>
  );
}
