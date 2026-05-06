import { neon } from '@neondatabase/serverless';
import { renderResumeHTML } from '../lib/render-resume-html';
import { filterByTags } from '../lib/profile-filter';
import fs from 'fs';

async function main() {
  const url = process.env.POSTGRES_URL!;
  const sql = neon(url);
  const r = await sql`select content from resumes where slug = 'default'`;
  const data = typeof r[0].content === 'string' ? JSON.parse(r[0].content) : r[0].content;

  const filtered = filterByTags(data, ['data', 'reporting', 'research', 'evaluation', 'leadership', 'community']);
  const html = await renderResumeHTML(filtered, 'classic');
  fs.writeFileSync('/tmp/dumped.html', html);
  console.log('Wrote /tmp/dumped.html, length:', html.length);
}
main().catch(e => { console.error(e); process.exit(1); });
