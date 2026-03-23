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

const MIME_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
  '.gif': 'image/gif', '.webp': 'image/webp', '.svg': 'image/svg+xml',
};

async function inlineImage(relPath: string): Promise<string | null> {
  // relPath looks like "/assets/adam_headshot.jpg" — maps to public/assets/...
  const filePath = path.join(process.cwd(), 'public', relPath);
  try {
    const buf = await fs.readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const mime = MIME_TYPES[ext] || 'image/jpeg';
    return `data:${mime};base64,${buf.toString('base64')}`;
  } catch {
    return null;
  }
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

async function renderContact(data: ResumeData): Promise<string> {
  const contact = data.contact || { name: 'Your Name' };
  const photoRelPath = contact.photo
    ? `/assets/${contact.photo}${contact.photo.includes('.') ? '' : '.jpg'}`
    : null;
  const photoSize = contact.photo_size ?? 150;
  const photoPosition = contact.photo_position ?? 'left';
  const photoDataUri = photoRelPath ? await inlineImage(photoRelPath) : null;

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
  const svgGlobe = `<svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><path d="M352 256c0 22.2-1.2 43.6-3.3 64H163.3c-2.2-20.4-3.3-41.8-3.3-64s1.2-43.6 3.3-64H348.7c2.2 20.4 3.3 41.8 3.3 64zm28.8-64H503.9c5.3 20.5 8.1 41.9 8.1 64s-2.8 43.5-8.1 64H380.8c2.1-20.6 3.2-42 3.2-64s-1.1-43.4-3.2-64zm112.6-32H376.7c-10-63.9-29.8-117.4-55.3-151.6c78.3 20.7 142 77.5 171.9 151.6zm-149.1 0H167.7c6.1-36.4 15.5-68.6 27-94.7 10.5-23.6 22.2-40.7 33.5-51.5C239.4 3.2 248.7 0 256 0s16.6 3.2 27.8 13.8c11.3 10.8 23 27.9 33.5 51.5 11.5 26 20.9 58.2 27 94.7zm-209 0H18.6C48.6 85.9 112.2 29.1 190.6 8.4C165.1 42.6 145.3 96.1 135.3 160zM8.1 192H131.2c-2.1 20.6-3.2 42-3.2 64s1.1 43.4 3.2 64H8.1C2.8 299.5 0 278.1 0 256s2.8-43.5 8.1-64zM194.7 446.6c-11.5-26-20.9-58.2-27-94.6H344.3c-6.1 36.4-15.5 68.6-27 94.6-10.5 23.6-22.2 40.7-33.5 51.5C272.6 508.8 263.3 512 256 512s-16.6-3.2-27.8-13.8c-11.3-10.8-23-27.9-33.5-51.5zM135.3 352c10 63.9 29.8 117.4 55.3 151.6C112.2 482.9 48.6 426.1 18.6 352H135.3zm245.1 0H493.4c-29.9 74.1-93.6 130.9-171.9 151.6 25.5-34.2 45.2-87.7 55.3-151.6z"/></svg>`;
  if (contact.websites && Array.isArray(contact.websites)) {
    for (const site of contact.websites) {
      contactRows.push(`<li class="contact-line"><span class="contact-icon icon-globe">${svgGlobe}</span><a href="${esc(site.url)}" class="contact-value">${esc(site.label)}: ${esc(site.url.replace(/^https?:\/\//, ''))}</a></li>`);
    }
  }

  const photoHTML = photoDataUri
    ? `<aside class="header-aside" style="order:${photoPosition === 'right' ? 2 : 0}"><div class="headshot-frame" style="width:${photoSize}px"><img src="${photoDataUri}" alt="${esc(contact.name)}" class="headshot" width="260" height="300" /></div></aside>`
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

async function renderBody(data: ResumeData, theme = 'classic'): Promise<string> {
  const order = data.resume_modules?.length ? data.resume_modules : DEFAULT_ORDER;

  const syncRenderers: Record<string, (d: ResumeData) => string> = {
    employment: renderEmployment,
    education: renderEducation,
    projects: renderProjects,
    skills: renderSkills,
  };

  const parts: string[] = [];
  for (const m of order) {
    if (m === 'header') {
      parts.push(await renderContact(data));
    } else if (m in syncRenderers) {
      parts.push(syncRenderers[m](data));
    }
  }

  return `<main class="main"><div class="sheet" data-theme="${theme}">${parts.join('')}</div></main>`;
}

export async function renderResumeHTML(data: ResumeData, theme = 'classic'): Promise<string> {
  const [css, fontCss, bodyHTML] = await Promise.all([getCSS(), getFontCSS(), renderBody(data, theme)]);

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>${fontCss}</style>
  <style>${css}</style>
  <style>
    /* Zero out all internal spacing — Puppeteer page.pdf() margin option handles page margins */
    body { margin: 0 !important; padding: 0 !important; background: #fff; }
    .main { padding: 0 !important; margin: 0 !important; min-height: auto !important; display: block !important; }
    .sheet { padding: 0 !important; margin: 0 !important; box-shadow: none !important; width: 100% !important; max-width: none !important; }
  </style>
</head>
<body class="print-preview">
  ${bodyHTML}
</body>
</html>`;
}
