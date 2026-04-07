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

function GlobeIcon() {
  return (
    <svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
      <path d="M352 256c0 22.2-1.2 43.6-3.3 64H163.3c-2.2-20.4-3.3-41.8-3.3-64s1.2-43.6 3.3-64H348.7c2.2 20.4 3.3 41.8 3.3 64zm28.8-64H503.9c5.3 20.5 8.1 41.9 8.1 64s-2.8 43.5-8.1 64H380.8c2.1-20.6 3.2-42 3.2-64s-1.1-43.4-3.2-64zm112.6-32H376.7c-10-63.9-29.8-117.4-55.3-151.6c78.3 20.7 142 77.5 171.9 151.6zm-149.1 0H167.7c6.1-36.4 15.5-68.6 27-94.7 10.5-23.6 22.2-40.7 33.5-51.5C239.4 3.2 248.7 0 256 0s16.6 3.2 27.8 13.8c11.3 10.8 23 27.9 33.5 51.5 11.5 26 20.9 58.2 27 94.7zm-209 0H18.6C48.6 85.9 112.2 29.1 190.6 8.4C165.1 42.6 145.3 96.1 135.3 160zM8.1 192H131.2c-2.1 20.6-3.2 42-3.2 64s1.1 43.4 3.2 64H8.1C2.8 299.5 0 278.1 0 256s2.8-43.5 8.1-64zM194.7 446.6c-11.5-26-20.9-58.2-27-94.6H344.3c-6.1 36.4-15.5 68.6-27 94.6-10.5 23.6-22.2 40.7-33.5 51.5C272.6 508.8 263.3 512 256 512s-16.6-3.2-27.8-13.8c-11.3-10.8-23-27.9-33.5-51.5zM135.3 352c10 63.9 29.8 117.4 55.3 151.6C112.2 482.9 48.6 426.1 18.6 352H135.3zm245.1 0H493.4c-29.9 74.1-93.6 130.9-171.9 151.6 25.5-34.2 45.2-87.7 55.3-151.6z" />
    </svg>
  );
}

function CameraIcon() {
  return (
    <svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
      <path d="M149.1 64.8L138.7 96H64C28.7 96 0 124.7 0 160V416c0 35.3 28.7 64 64 64H448c35.3 0 64-28.7 64-64V160c0-35.3-28.7-64-64-64H373.3L362.9 64.8C356.4 45.2 338.1 32 317.4 32H194.6c-20.7 0-39 13.2-45.5 32.8zM256 384c-53 0-96-43-96-96s43-96 96-96s96 43 96 96s-43 96-96 96z" />
    </svg>
  );
}

function BriefcaseIcon() {
  return (
    <svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
      <path d="M184 48H328c4.4 0 8 3.6 8 8V96H176V56c0-4.4 3.6-8 8-8zm-56 8V96H64C28.7 96 0 124.7 0 160v96H192 320 512V160c0-35.3-28.7-64-64-64H384V56c0-30.9-25.1-56-56-56H184c-30.9 0-56 25.1-56 56zM512 288H320v32c0 17.7-14.3 32-32 32H224c-17.7 0-32-14.3-32-32V288H0V416c0 35.3 28.7 64 64 64H448c35.3 0 64-28.7 64-64V288z" />
    </svg>
  );
}

function DocumentIcon() {
  return (
    <svg viewBox="0 0 384 512" xmlns="http://www.w3.org/2000/svg">
      <path d="M0 64C0 28.7 28.7 0 64 0H224V128c0 17.7 14.3 32 32 32H384V448c0 35.3-28.7 64-64 64H64c-35.3 0-64-28.7-64-64V64zm384 64H256V0L384 128z" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
      <path d="M164.9 24.6c-7.7-18.6-28-28.5-47.4-23.2l-88 24C12.1 30.2 0 46 0 64C0 311.4 200.6 512 448 512c18 0 33.8-12.1 38.6-29.5l24-88c5.3-19.4-4.6-39.7-23.2-47.4l-96-40c-16.3-6.8-35.2-2.1-46.3 11.6L304.7 368C234.3 334.7 177.3 277.7 144 207.3L193.3 167c13.7-11.2 18.4-30 11.6-46.3l-40-96z" />
    </svg>
  );
}

function LocationIcon() {
  return (
    <svg viewBox="0 0 384 512" xmlns="http://www.w3.org/2000/svg">
      <path d="M215.7 499.2C267 435 384 279.4 384 192C384 86 298 0 192 0S0 86 0 192c0 87.4 117 243 168.3 307.2c12.3 15.3 35.1 15.3 47.4 0zM192 128a64 64 0 1 1 0 128 64 64 0 1 1 0-128z" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg viewBox="0 0 640 512" xmlns="http://www.w3.org/2000/svg">
      <path d="M579.8 267.7c56.5-56.5 56.5-148 0-204.5c-50-50-128.8-56.5-186.3-15.4l-1.6 1.1c-14.4 10.3-17.7 30.3-7.4 44.6s30.3 17.7 44.6 7.4l1.6-1.1c32.1-22.9 76-19.3 103.8 8.6c31.5 31.5 31.5 82.5 0 114L422.3 334.8c-31.5 31.5-82.5 31.5-114 0c-27.9-27.9-31.5-71.8-8.6-103.8l1.1-1.6c10.3-14.4 6.9-34.4-7.4-44.6s-34.4-6.9-44.6 7.4l-1.1 1.6C206.5 251.2 213 330 263 380c56.5 56.5 148 56.5 204.5 0L579.8 267.7zM60.2 244.3c-56.5 56.5-56.5 148 0 204.5c50 50 128.8 56.5 186.3 15.4l1.6-1.1c14.4-10.3 17.7-30.3 7.4-44.6s-30.3-17.7-44.6-7.4l-1.6 1.1c-32.1 22.9-76 19.3-103.8-8.6C74 372.1 74 321.1 105.5 289.5L217.7 177.2c31.5-31.5 82.5-31.5 114 0c27.9 27.9 31.5 71.8 8.6 103.8l-1.1 1.6c-10.3 14.4-6.9 34.4 7.4 44.6s34.4 6.9 44.6-7.4l1.1-1.6C433.5 260.8 427 182 377 132c-56.5-56.5-148-56.5-204.5 0L60.2 244.3z" />
    </svg>
  );
}

function TwitterIcon() {
  return (
    <svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
      <path d="M389.2 48h70.6L305.6 224.2 487 464H345L233.7 318.6 106.5 464H35.8L200.7 275.5 26.8 48H172.4L272.9 180.9 389.2 48zM364.4 421.8h39.1L151.1 88h-42L364.4 421.8z" />
    </svg>
  );
}

function YoutubeIcon() {
  return (
    <svg viewBox="0 0 576 512" xmlns="http://www.w3.org/2000/svg">
      <path d="M549.655 124.083c-6.281-23.65-24.787-42.276-48.284-48.597C458.781 64 288 64 288 64S117.22 64 74.629 75.486c-23.497 6.322-42.003 24.947-48.284 48.597-11.412 42.867-11.412 132.305-11.412 132.305s0 89.438 11.412 132.305c6.281 23.65 24.787 41.5 48.284 47.821C117.22 448 288 448 288 448s170.78 0 213.371-11.486c23.497-6.321 42.003-24.171 48.284-47.821 11.412-42.867 11.412-132.305 11.412-132.305s0-89.438-11.412-132.305zm-317.51 213.508V175.185l142.739 81.205-142.739 81.201z" />
    </svg>
  );
}

function CodeIcon() {
  return (
    <svg viewBox="0 0 640 512" xmlns="http://www.w3.org/2000/svg">
      <path d="M392.8 1.2c-17-4.9-34.7 5-39.6 22l-128 448c-4.9 17 5 34.7 22 39.6s34.7-5 39.6-22l128-448c4.9-17-5-34.7-22-39.6zm80.6 120.1L562.1 256l-88.7 134.7c-9.7 14.7-5.7 34.5 9 44.2s34.5 5.7 44.2-9l112-170.2c6.2-9.4 6.2-21.6 0-31L526.6 54.1c-9.7-14.7-29.5-18.7-44.2-9s-18.7 29.5-9 44.2zM177.4 134.7L88.7 0c-9.7-14.7-29.5-18.7-44.2-9s-18.7 29.5-9 44.2L124.1 256 35.4 390.7c-9.7 14.7-5.7 34.5 9 44.2s34.5 5.7 44.2-9l112-170.2c6.2-9.4 6.2-21.6 0-31z" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg viewBox="0 0 576 512" xmlns="http://www.w3.org/2000/svg">
      <path d="M316.9 18C311.6 7 300.4 0 288.1 0s-23.4 7-28.8 18L195 150.3 51.4 171.5c-12 1.8-22 10.2-25.7 21.7s-.7 24.2 7.9 32.7L137.8 329 113.2 474.7c-2 12 3 24.2 12.9 31.3s23 8 33.8 2.3l128.3-68.5 128.3 68.5c10.8 5.7 23.9 4.9 33.8-2.3s14.9-19.3 12.9-31.3L searching438.5 329 542.7 225.9c8.6-8.5 11.7-21.2 7.9-32.7s-13.7-19.9-25.7-21.7L381.2 150.3 316.9 18z" />
    </svg>
  );
}

function GraduationIcon() {
  return (
    <svg viewBox="0 0 640 512" xmlns="http://www.w3.org/2000/svg">
      <path d="M320 32L0 160l320 128 320-128L320 32zM64 187.1v133.8l256 102.4 256-102.4V187.1L320 315.1 64 187.1z" />
    </svg>
  );
}

const ICON_MAP: Record<string, () => JSX.Element> = {
  globe: GlobeIcon,
  camera: CameraIcon,
  briefcase: BriefcaseIcon,
  document: DocumentIcon,
  mail: MailIcon,
  github: GitHubIcon,
  linkedin: LinkedInIcon,
  phone: PhoneIcon,
  location: LocationIcon,
  link: LinkIcon,
  twitter: TwitterIcon,
  x: TwitterIcon,
  youtube: YoutubeIcon,
  code: CodeIcon,
  star: StarIcon,
  graduation: GraduationIcon,
};

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

  // Build left & right columns, then interleave for CSS grid (row-first flow)
  const websites = (contact.websites || []).map(site => {
    const iconName = site.icon || 'globe';
    const IconComponent = ICON_MAP[iconName] || GlobeIcon;
    return {
      icon: IconComponent,
      iconClass: `icon-${iconName}`,
      value: `${site.label}: ${site.url.replace(/^https?:\/\//, '')}`,
      href: site.url,
    };
  });

  const leftCol: (ContactRow | null)[] = [
    contact.email
      ? { icon: MailIcon, iconClass: 'icon-mail', value: contact.email, href: `mailto:${contact.email}` }
      : null,
    contact.linkedin
      ? { icon: LinkedInIcon, iconClass: 'icon-linkedin', value: contact.linkedin.replace(/^https?:\/\//, ''), href: normalizeExternalUrl(contact.linkedin) }
      : null,
    websites[1] || null, // Virtual Resume
  ];

  const rightCol: (ContactRow | null)[] = [
    contact.github
      ? { icon: GitHubIcon, iconClass: 'icon-github', value: contact.github.replace(/^https?:\/\//, ''), href: normalizeExternalUrl(contact.github) }
      : null,
    websites[0] || null, // Portfolio
    websites[2] || null, // Photography
  ];

  // Interleave: left1, right1, left2, right2, ... so CSS grid rows are correct
  const contactRows: ContactRow[] = [];
  const maxLen = Math.max(leftCol.length, rightCol.length);
  for (let i = 0; i < maxLen; i++) {
    if (leftCol[i]) contactRows.push(leftCol[i]!);
    if (rightCol[i]) contactRows.push(rightCol[i]!);
  }

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

export type ResumeTheme = 'classic' | 'modern' | 'card' | 'dark' | 'lcars';

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
