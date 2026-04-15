import { NextRequest, NextResponse } from 'next/server';
import { getResumeData, getRawResumeData } from '@/lib/resume';
import type { ResumeData, AchievementInput } from '@/lib/resume';

/*
 * Markdown export — machine-readable resume for LLM pipelines.
 *
 * Primary consumer: the job-matcher service, which feeds this into a
 * Claude prompt (with prompt caching) to score jobs against Adam's
 * profile. Also usable for any other tool that wants a flat markdown
 * resume without the styling overhead of DOCX/PDF.
 *
 * Query params (mirrors /api/export/ats):
 *   - profile=<name>   → filtered by profile definition
 *   - tags=a,b,c       → filtered by tag list (used when profile not set)
 *   - both unset       → unfiltered default resume
 *
 * Output is text/markdown. Deterministic: same input yields byte-identical
 * output so upstream caches (e.g. Anthropic prompt cache) stay warm.
 */

function getAchievementText(a: AchievementInput): string {
  if (typeof a === 'string') {
    // Strip legacy #hashtags that the plain-string format uses for tagging.
    return a.replace(/\s*#[a-zA-Z][\w-]*/g, '').trimEnd();
  }
  return a.text;
}

function stripProtocol(url: string): string {
  return url.replace(/^https?:\/\//, '');
}

function normalizeDates(dates?: string): string | undefined {
  if (!dates) return undefined;
  return dates.replace(/--/g, '–');
}

function buildMarkdown(data: ResumeData): string {
  const lines: string[] = [];
  const contact = data.contact || { name: 'Your Name' };

  // ── Header: name + contact line ────────────────────────────────────
  lines.push(`# ${contact.name}`);
  lines.push('');

  const contactParts: string[] = [];
  if (contact.email) contactParts.push(contact.email);
  if (contact.phone) contactParts.push(contact.phone);
  if (contact.location) contactParts.push(contact.location);
  if (contact.linkedin) contactParts.push(stripProtocol(contact.linkedin));
  if (contact.github) contactParts.push(stripProtocol(contact.github));
  if (contact.websites) {
    for (const site of contact.websites) {
      contactParts.push(stripProtocol(site.url));
    }
  }
  if (contactParts.length > 0) {
    lines.push(contactParts.join(' · '));
    lines.push('');
  }

  // ── Summary ────────────────────────────────────────────────────────
  if (data.summary) {
    lines.push('## Summary');
    lines.push('');
    lines.push(data.summary);
    lines.push('');
  }

  // ── Work Experience ────────────────────────────────────────────────
  const employment = data.employment || [];
  if (employment.length > 0) {
    lines.push('## Work Experience');
    lines.push('');
    for (const role of employment) {
      // ### Company — Title
      const header = `### ${role.company} — ${role.title}`;
      lines.push(header);

      // Meta line: location · dates (both optional)
      const metaParts: string[] = [];
      if (role.location) metaParts.push(role.location);
      const dates = normalizeDates(role.dates);
      if (dates) metaParts.push(dates);
      if (metaParts.length > 0) {
        lines.push(`*${metaParts.join(' · ')}*`);
      }
      lines.push('');

      if (role.summary) {
        lines.push(role.summary);
        lines.push('');
      }

      if (role.achievements && role.achievements.length > 0) {
        for (const a of role.achievements) {
          lines.push(`- ${getAchievementText(a)}`);
        }
        lines.push('');
      }
    }
  }

  // ── Education ──────────────────────────────────────────────────────
  const education = data.education || [];
  if (education.length > 0) {
    lines.push('## Education');
    lines.push('');
    for (const item of education) {
      const dates = normalizeDates(item.dates);
      const header = dates ? `### ${item.degree} *(${dates})*` : `### ${item.degree}`;
      lines.push(header);
      if (item.details) {
        lines.push(item.details);
      }
      lines.push('');
      if (item.achievements && item.achievements.length > 0) {
        for (const a of item.achievements) {
          lines.push(`- ${getAchievementText(a)}`);
        }
        lines.push('');
      }
    }
  }

  // ── Projects ───────────────────────────────────────────────────────
  const projects = data.projects || [];
  if (projects.length > 0) {
    lines.push('## Projects');
    lines.push('');
    for (const p of projects) {
      const name = p.url ? `[${p.name}](${p.url})` : p.name;
      const desc = p.description ? ` — ${p.description}` : '';
      lines.push(`- **${name}**${desc}`);
    }
    lines.push('');
  }

  // ── Skills ─────────────────────────────────────────────────────────
  const skills = data.skills || {};
  const skillEntries = Object.entries(skills);
  if (skillEntries.length > 0) {
    lines.push('## Skills');
    lines.push('');
    for (const [category, items] of skillEntries) {
      lines.push(`- **${category}:** ${items.join(', ')}`);
    }
    lines.push('');
  }

  // Collapse trailing blank lines and ensure exactly one trailing newline.
  while (lines.length > 0 && lines[lines.length - 1] === '') {
    lines.pop();
  }
  return lines.join('\n') + '\n';
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const profile = searchParams.get('profile') || undefined;
  const tagsParam = searchParams.get('tags');

  try {
    let data: ResumeData;
    if (tagsParam && !profile) {
      const { filterByTags } = await import('@/lib/profile-filter');
      const raw = await getRawResumeData();
      data = filterByTags(raw, tagsParam.split(',').map((t) => t.trim()).filter(Boolean));
    } else {
      data = await getResumeData(profile);
    }

    const markdown = buildMarkdown(data);

    return new NextResponse(markdown, {
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        // Short cache: the resume doesn't change often, but we don't want
        // stale content after an edit. Upstream can pass its own caching
        // layer (the job-matcher has a local file cache).
        'Cache-Control': 'public, max-age=300, s-maxage=300',
      },
    });
  } catch (err) {
    console.error('Markdown resume generation failed:', err);
    return NextResponse.json(
      { error: 'Markdown resume generation failed', details: String(err) },
      { status: 500 },
    );
  }
}
