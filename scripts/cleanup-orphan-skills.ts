/** Drop tags from skills that surface unwanted "orphan" categories for the nonprofit profile. */
import { neon } from '@neondatabase/serverless';

const SLUG = process.env.RESUME_SLUG || 'default';
const sql = neon(process.env.POSTGRES_URL!);

function dropTags(skill: any, toRemove: string[]) {
  if (!skill || typeof skill === 'string' || !skill.tags) return;
  skill.tags = skill.tags.filter((t: string) => !toRemove.includes(t));
}

function find(list: any[] | undefined, name: string) {
  if (!list) return undefined;
  return list.find((s) => (typeof s === 'string' ? s === name : s.name === name));
}

async function main() {
  const rows = await sql`select content from resumes where slug = ${SLUG}`;
  const c = typeof rows[0].content === 'string' ? JSON.parse(rows[0].content) : rows[0].content;

  // Development: REST/SOAP APIs — drop `data` (reviewer wanted it gone)
  dropTags(find(c.skills?.['Development'], 'REST/SOAP APIs'), ['data']);

  // Design & Web: Branding & Identity — drop community, nonprofit (keep creative tags)
  dropTags(find(c.skills?.['Design & Web'], 'Branding & Identity'), ['community', 'nonprofit']);

  // Photography & Visual Media — drop community/nonprofit so it stays on creative-only
  dropTags(find(c.skills?.['Photography & Visual Media'], 'Documentary Photography'), ['community', 'nonprofit']);
  dropTags(find(c.skills?.['Photography & Visual Media'], 'Gallery & Exhibition Work'), ['community']);
  dropTags(find(c.skills?.['Photography & Visual Media'], 'Creative Writing'), ['community']);

  await sql`update resumes set content = ${JSON.stringify(c)}::jsonb, updated_at = now() where slug = ${SLUG}`;
  console.log('Orphan-category tag scrub applied.');
}
main().catch((e) => { console.error(e); process.exit(1); });
