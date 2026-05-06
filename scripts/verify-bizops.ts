import { neon } from '@neondatabase/serverless';
import { filterByTags } from '../lib/profile-filter';

async function main() {
  const sql = neon(process.env.POSTGRES_URL!);
  const r = await sql`select content from resumes where slug = 'default'`;
  const data = typeof r[0].content === 'string' ? JSON.parse(r[0].content) : r[0].content;
  const tags = ['data', 'reporting', 'research', 'nonprofit', 'visualization', 'survey', 'evaluation', 'leadership', 'community', 'organizing'];
  const filtered = filterByTags(data, tags);

  console.log('=== Mastercard consolidated for nonprofit profile ===');
  const cons = filtered.employment?.find((e: any) => e.title?.includes('Senior') && e.title?.includes('II'));
  if (cons) {
    console.log('Title:', cons.title);
    console.log('Summary:', cons.summary);
    console.log('Bullets:');
    cons.achievements?.forEach((a: any, i: number) => console.log(`  ${i + 1}. ${typeof a === 'string' ? a : a.text}`));
  }

  console.log('\n=== Skills categories visible for nonprofit profile ===');
  for (const [cat, items] of Object.entries(filtered.skills || {})) {
    const names = (items as any[]).map((s: any) => (typeof s === 'string' ? s : s.name));
    console.log(`  ${cat}: ${names.join(', ')}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
