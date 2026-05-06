/**
 * One-shot: snapshot current resume, then add 3 achievements + retag a few
 * on the consolidated Mastercard entry (group=mastercard-summary).
 */
import { neon } from '@neondatabase/serverless';

const SLUG = process.env.RESUME_SLUG || 'default';
const url = process.env.POSTGRES_URL || process.env.DATABASE_URL;
if (!url) throw new Error('POSTGRES_URL not set');
const sql = neon(url);

type Achievement = { text: string; tags?: string[]; priority?: number };

async function main() {
  const rows = await sql`select content from resumes where slug = ${SLUG} limit 1`;
  if (!rows.length) throw new Error(`No resume row for slug ${SLUG}`);
  const content = typeof rows[0].content === 'string' ? JSON.parse(rows[0].content) : rows[0].content;

  // Snapshot first
  await sql`
    insert into snapshots (resume_slug, content, label)
    select ${SLUG}, content, ${'pre-consolidated-bizops-additions'}
    from resumes where slug = ${SLUG}
  `;
  console.log('Snapshot created.');

  const consolidated = content.employment?.find((e: any) => e.group === 'mastercard-summary');
  if (!consolidated) throw new Error('Could not find mastercard-summary entry');

  const ach: Achievement[] = consolidated.achievements ?? [];
  console.log(`Current achievement count: ${ach.length}`);

  // Normalize any plain strings to structured form
  const norm: Achievement[] = ach.map((a: any) => (typeof a === 'string' ? { text: a } : a));

  // Find by leading-text fingerprint and tweak tags
  const byPrefix = (prefix: string) => norm.find((a) => a.text.startsWith(prefix));

  const onCall = byPrefix('Primary on-call engineer');
  if (onCall) {
    onCall.tags = Array.from(new Set([...(onCall.tags ?? []), 'leadership', 'operations']));
  }

  const log4shell = byPrefix('First in operations to detect');
  if (log4shell) {
    log4shell.tags = Array.from(new Set([...(log4shell.tags ?? []), 'evaluation', 'research']));
  }

  // Three new achievements
  const additions: Achievement[] = [
    {
      text:
        'Led onboarding & technical training for new engineers across 100+ microservices, dozens of customer call paths, & complex multi-service transaction flows; built training materials & runbooks adopted as team standards.',
      tags: ['leadership', 'community', 'evaluation', 'reporting'],
    },
    {
      text:
        'Translated production telemetry into stakeholder-ready BI dashboards & SLO/SLI reports for engineering leadership; replaced multi-hour manual reports with sub-second self-service analytics across global payment systems.',
      tags: ['data', 'reporting', 'visualization', 'evaluation', 'leadership'],
    },
    {
      text:
        'Drove postmortem & root-cause culture across the team — designed evaluation templates, ran retrospectives, & turned incident data into measurable reliability improvements adopted org-wide.',
      tags: ['evaluation', 'research', 'leadership', 'data', 'reporting'],
    },
  ];

  // Idempotency: don't double-add
  const existingTexts = new Set(norm.map((a) => a.text));
  for (const add of additions) {
    if (!existingTexts.has(add.text)) norm.push(add);
  }

  consolidated.achievements = norm;

  await sql`
    update resumes
    set content = ${JSON.stringify(content)}::jsonb, updated_at = now()
    where slug = ${SLUG}
  `;
  console.log(`Saved. New achievement count: ${norm.length}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
