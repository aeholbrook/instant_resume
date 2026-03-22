/**
 * Server-side resume HTML renderer.
 * Produces a self-contained HTML document for Puppeteer PDF generation.
 * This avoids react-dom/server restrictions in Next.js API routes.
 */

import type { ResumeData } from './resume';
import fs from 'fs/promises';
import path from 'path';

// CSS cache — read once, reuse
let cssCache: string | null = null;
let fontCssCache: string | null = null;

async function getCSS(): Promise<string> {
  if (cssCache && process.env.NODE_ENV !== 'development') return cssCache;
  const cssPath = path.join(process.cwd(), 'app', 'globals.css');
  let raw = await fs.readFile(cssPath, 'utf-8');
  // Strip @import rules (fonts are inlined separately) and @page (Puppeteer handles margins)
  raw = raw.replace(/@import\s+url\([^)]+\)\s*;/g, '');
  raw = raw.replace(/@page\s*\{[^}]+\}/g, '');
  cssCache = raw;
  return cssCache;
}

async function getFontCSS(): Promise<string> {
  if (fontCssCache && process.env.NODE_ENV !== 'development') return fontCssCache;
  const fontPath = path.join(process.cwd(), 'public', 'fonts', 'fira-sans-inline.css');
  fontCssCache = await fs.readFile(fontPath, 'utf-8');
  return fontCssCache;
}

function esc(s: string | undefined): string {
  if (!s) return '';
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function normalizeUrl(value: string): string {
  if (/^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(value)) return value;
  return `https://${value}`;
}

function achievementText(a: string | { text: string }): string {
  return typeof a === 'string' ? a : a.text;
}

function renderContact(data: ResumeData): string {
  const contact = data.contact || { name: 'Your Name' };
  const photoPath = contact.photo
    ? `/assets/${contact.photo}${contact.photo.includes('.') ? '' : '.jpg'}`
    : null;
  const photoSize = contact.photo_size ?? 150;
  const photoPosition = contact.photo_position ?? 'left';

  const svgMail = `<svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><path d="M48 64C21.5 64 0 85.5 0 112c0 15.1 7.1 29.3 19.2 38.4L236.8 313.6c11.4 8.5 27 8.5 38.4 0L492.8 150.4c12.1-9.1 19.2-23.3 19.2-38.4c0-26.5-21.5-48-48-48H48zM0 176V384c0 35.3 28.7 64 64 64H448c35.3 0 64-28.7 64-64V176L294.4 339.2c-22.8 17.1-54 17.1-76.8 0L0 176z"/></svg>`;
  const svgGH = `<svg viewBox="0 0 496 512" xmlns="http://www.w3.org/2000/svg"><path d="M165.9 397.4c0 2-2.3 3.6-5.2 3.6-3.3.3-5.6-1.3-5.6-3.6 0-2 2.3-3.6 5.2-3.6 3-.3 5.6 1.3 5.6 3.6zm-31.1-4.5c-.7 2 1.3 4.3 4.3 4.9 2.6 1 5.6 0 6.2-2s-1.3-4.3-4.3-5.2c-2.6-.7-5.5.3-6.2 2.3zm44.2-1.7c-2.9.7-4.9 2.6-4.6 4.9.3 2 2.9 3.3 5.9 2.6 2.9-.7 4.9-2.6 4.6-4.6-.3-1.9-3-3.2-5.9-2.9zM244.8 8C106.1 8 0 113.3 0 252c0 110.9 69.8 205.8 169.5 239.2 12.8 2.3 17.3-5.6 17.3-12.1 0-6.2-.3-40.4-.3-61.4 0 0-70 15-84.7-29.8 0 0-11.4-29.1-27.8-36.6 0 0-22.9-15.7 1.6-15.4 0 0 24.9 2 38.6 25.8 21.9 38.6 58.6 27.5 72.9 20.9 2.3-16 8.8-27.1 16-33.7-55.9-6.2-112.3-14.3-112.3-110.5 0-27.5 7.6-41.3 23.6-58.9-2.6-6.5-11.1-33.3 2.6-67.9 20.9-6.5 69 27 69 27 20-5.6 41.5-8.5 62.8-8.5s42.8 2.9 62.8 8.5c0 0 48.1-33.6 69-27 13.7 34.7 5.2 61.4 2.6 67.9 16 17.7 25.8 31.5 25.8 58.9 0 96.5-58.9 104.2-114.8 110.5 9.2 7.9 17 22.9 17 46.4 0 33.7-.3 75.4-.3 83.6 0 6.5 4.6 14.4 17.3 12.1C428.2 457.8 496 362.9 496 252 496 113.3 383.5 8 244.8 8zM97.2 352.9c-1.3 1-1 3.3.7 5.2 1.6 1.6 3.9 2.3 5.2 1 1.3-1 1-3.3-.7-5.2-1.6-1.6-3.9-2.3-5.2-1zm-10.8-8.1c-.7 1.3.3 2.9 2.3 3.9 1.6 1 3.6.7 4.3-.7.7-1.3-.3-2.9-2.3-3.9-2-.6-3.6-.3-4.3.7zm32.4 35.6c-1.6 1.3-1 4.3 1.3 6.2 2.3 2.3 5.2 2.6 6.5 1 1.3-1.3.7-4.3-1.3-6.2-2.2-2.3-5.2-2.6-6.5-1zm-11.4-14.7c-1.6 1-1.6 3.6 0 5.9 1.6 2.3 4.3 3.3 5.6 2.3 1.6-1.3 1.6-3.9 0-6.2-1.4-2.3-4-3.3-5.6-2z"/></svg>`;
  const svgLI = `<svg viewBox="0 0 448 512" xmlns="http://www.w3.org/2000/svg"><path d="M416 32H31.9C14.3 32 0 46.5 0 64.3v383.4C0 465.5 14.3 480 31.9 480H416c17.6 0 32-14.5 32-32.3V64.3c0-17.8-14.4-32.3-32-32.3zM135.4 416H69V202.2h66.5V416zm-33.2-243c-21.3 0-38.5-17.3-38.5-38.5S80.9 96 102.2 96c21.2 0 38.5 17.3 38.5 38.5 0 21.3-17.2 38.5-38.5 38.5zm282.1 243h-66.4V312c0-24.8-.5-56.7-34.5-56.7-34.6 0-39.9 27-39.9 54.9V416h-66.4V202.2h63.7v29.2h.9c8.9-16.8 30.6-34.5 62.9-34.5 67.2 0 79.7 44.3 79.7 101.9V416z"/></svg>`;

  const contactRows: string[] = [];
  if (contact.email) {
    contactRows.push(`<li class="contact-line"><span class="contact-icon icon-mail">${svgMail}</span><a href="mailto:${esc(contact.email)}" class="contact-value">${esc(contact.email)}</a></li>`);
  }
  if (contact.github) {
    const display = `http://${contact.github.replace(/^https?:\/\//, '')}`;
    contactRows.push(`<li class="contact-line"><span class="contact-icon icon-github">${svgGH}</span><a href="${esc(normalizeUrl(contact.github))}" class="contact-value">${esc(display)}</a></li>`);
  }
  if (contact.linkedin) {
    const display = `http://${contact.linkedin.replace(/^https?:\/\//, '')}`;
    contactRows.push(`<li class="contact-line"><span class="contact-icon icon-linkedin">${svgLI}</span><a href="${esc(normalizeUrl(contact.linkedin))}" class="contact-value">${esc(display)}</a></li>`);
  }

  const photoHTML = photoPath
    ? `<aside class="header-aside" style="order:${photoPosition === 'right' ? 2 : 0}"><div class="headshot-frame" style="width:${photoSize}px"><img src="${esc(photoPath)}" alt="${esc(contact.name)}" class="headshot" width="260" height="300" /></div></aside>`
    : '';

  const summaryHTML = data.summary
    ? `<p class="summary" style="order:3">${esc(data.summary)}</p>`
    : '';

  return `<header class="header-module ${photoPosition === 'right' ? 'photo-right' : 'photo-left'}" data-module="header">
    ${photoHTML}
    <div class="identity-column" style="order:1">
      <h1 class="name">${esc(contact.name)}</h1>
      ${contactRows.length > 0 ? `<ul class="contact-list">${contactRows.join('')}</ul>` : ''}
    </div>
    ${summaryHTML}
  </header>`;
}

function renderEmployment(data: ResumeData): string {
  const items = data.employment || [];
  if (!items.length) return '';
  const title = data.section_titles?.employment || 'Professional Experience';

  const entries = items.map(role => {
    const dates = role.dates?.replace(/--/g, '\u2013') || '';
    const summary = role.summary ? `<p class="entry-subtitle">${esc(role.summary)}</p>` : '';
    const bullets = role.achievements?.length
      ? `<div class="entry-details"><ul class="stack-bullets">${role.achievements.map(a => `<li>${esc(achievementText(a))}</li>`).join('')}</ul></div>`
      : '';

    return `<article class="entry">
      <div class="entry-topline">
        <span class="entry-title-group"><h3 class="entry-title">${esc(role.title)}</h3><span class="entry-company"> at ${esc(role.company)}</span></span>
        <span class="entry-right">${esc(dates)}</span>
      </div>
      ${summary}${bullets}
    </article>`;
  }).join('');

  return `<section class="resume-section" data-module="employment"><div class="section-title">${esc(title)}</div>${entries}</section>`;
}

function renderEducation(data: ResumeData): string {
  const items = data.education || [];
  if (!items.length) return '';
  const title = data.section_titles?.education || 'Education';

  const entries = items.map(item => {
    const dates = item.dates ? ` | ${item.dates.replace(/--/g, '\u2013')}` : '';
    const detail = item.details ? `<span class="edu-detail">${esc(item.details)}</span>` : '';
    const bullets = item.achievements?.length
      ? `<div class="entry-details"><ul class="stack-bullets">${item.achievements.map(a => `<li>${esc(achievementText(a))}</li>`).join('')}</ul></div>`
      : '';

    return `<article class="entry">
      <div class="entry-topline">
        <h3 class="entry-title">${esc(item.degree)}</h3>
        <span class="entry-right">${detail}${esc(dates)}</span>
      </div>
      ${bullets}
    </article>`;
  }).join('');

  return `<section class="resume-section" data-module="education"><div class="section-title">${esc(title)}</div>${entries}</section>`;
}

function renderProjects(data: ResumeData): string {
  const items = data.projects || [];
  if (!items.length) return '';
  const title = data.section_titles?.projects || 'Projects';

  const lis = items.map(p => {
    const nameHTML = p.url
      ? `<a href="${esc(normalizeUrl(p.url))}">${esc(p.name)}</a>`
      : esc(p.name);
    const desc = p.description ? ` \u2013 ${esc(p.description)}` : '';
    return `<li><span class="project-name">${nameHTML}</span>${desc}</li>`;
  }).join('');

  return `<section class="resume-section" data-module="projects"><div class="section-title">${esc(title)}</div><ul class="projects-list">${lis}</ul></section>`;
}

function renderSkills(data: ResumeData): string {
  const skills = data.skills || {};
  const entries = Object.entries(skills);
  if (!entries.length) return '';
  const title = data.section_titles?.skills || 'Skills';

  const rows = entries.map(([group, items]) =>
    `<div class="skill-row"><span class="skill-category">${esc(group)}</span> <span class="skill-items">${esc(items.join(', '))}</span></div>`
  ).join('');

  return `<section class="resume-section" data-module="skills"><div class="section-title">${esc(title)}</div><div class="skills-block">${rows}</div></section>`;
}

const DEFAULT_ORDER = ['header', 'employment', 'education', 'projects', 'skills'];

function renderBody(data: ResumeData): string {
  const order = data.resume_modules?.length ? data.resume_modules : DEFAULT_ORDER;

  const renderers: Record<string, (d: ResumeData) => string> = {
    header: renderContact,
    employment: renderEmployment,
    education: renderEducation,
    projects: renderProjects,
    skills: renderSkills,
  };

  const body = order
    .filter(m => m in renderers)
    .map(m => renderers[m](data))
    .join('');

  return `<main class="main"><div class="sheet">${body}</div></main>`;
}

export async function renderResumeHTML(data: ResumeData): Promise<string> {
  const [css, fontCss] = await Promise.all([getCSS(), getFontCSS()]);
  const bodyHTML = renderBody(data);

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>${fontCss}</style>
  <style>${css}</style>
  <style>
    /* Puppeteer page.pdf() handles margins — override everything else to zero */
    @page { margin: 0 !important; }
    body { margin: 0 !important; padding: 0 !important; background: #fff; }
    .main { padding: 0 !important; margin: 0 !important; min-height: auto !important; display: block !important; }
    .sheet { padding: 0 !important; margin: 0 !important; box-shadow: none !important; }
  </style>
</head>
<body class="print-preview">
  ${bodyHTML}
</body>
</html>`;
}
