import { neon } from '@neondatabase/serverless';

const SLUG = process.env.RESUME_SLUG || 'default';
const sql = neon(process.env.POSTGRES_URL!);

const ORDER = [
  'Donor & CRM Systems',
  'Data, Reporting & Analysis',
  'Program Evaluation & Research',
  'Community & Program Operations',
  'Documentation',
  'Databases',
  'Development',
  'AI & Agent Engineering',
  'Observability',
  'CI/CD & Automation',
  'Incident Management',
  'Systems & Automation',
  'Security & Compliance',
  'Infrastructure & Self-Hosting',
  'Design & Web',
  'Photography & Visual Media',
];

async function main() {
  const rows = await sql`select content from resumes where slug = ${SLUG}`;
  const content = typeof rows[0].content === 'string' ? JSON.parse(rows[0].content) : rows[0].content;
  content.skills_order = ORDER;
  await sql`update resumes set content = ${JSON.stringify(content)}::jsonb, updated_at = now() where slug = ${SLUG}`;
  console.log('skills_order set:', ORDER.length, 'categories');
}
main().catch((e) => { console.error(e); process.exit(1); });
