/**
 * Seed script: imports content.yaml into the database.
 *
 * Usage:
 *   npx tsx scripts/seed.ts
 *
 * Env vars required:
 *   POSTGRES_URL or DATABASE_URL
 *
 * Optional:
 *   RESUME_SLUG (defaults to "default")
 *   YAML_PATH   (defaults to projects/default/content.yaml)
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import yaml from 'yaml';
import { ensureTables, saveResume } from '../lib/db';

async function main() {
  const yamlPath = process.env.YAML_PATH
    ?? path.join(process.cwd(), 'projects', 'default', 'content.yaml');

  console.log(`Reading YAML from ${yamlPath}...`);
  const raw = await fs.readFile(yamlPath, 'utf-8');
  const content = yaml.parse(raw);

  if (!content || typeof content !== 'object') {
    throw new Error('Invalid YAML content');
  }

  console.log('Ensuring database tables exist...');
  await ensureTables();

  const slug = process.env.RESUME_SLUG || 'default';
  console.log(`Upserting resume with slug "${slug}"...`);
  await saveResume(content, slug);

  console.log('Done! Resume content is now in the database.');
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
