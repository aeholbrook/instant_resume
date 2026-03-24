import { neon } from '@neondatabase/serverless';

import type { ResumeData } from './resume';

function getSql() {
  const url = process.env.POSTGRES_URL || process.env.DATABASE_URL;
  if (!url) throw new Error('No database URL configured (POSTGRES_URL or DATABASE_URL)');
  return neon(url, { fetchOptions: { next: { revalidate: 60 } } });
}

// ── Schema bootstrap ────────────────────────────────────────────────
export async function ensureTables() {
  const sql = getSql();
  await sql`
    create table if not exists resumes (
      id         serial primary key,
      slug       text not null unique,
      content    jsonb not null,
      updated_at timestamptz not null default now()
    )
  `;
  await sql`
    create table if not exists snapshots (
      id          serial primary key,
      resume_slug text not null references resumes(slug),
      content     jsonb not null,
      label       text,
      created_at  timestamptz not null default now()
    )
  `;
}

// ── Resume CRUD ─────────────────────────────────────────────────────
const DEFAULT_SLUG = () => process.env.RESUME_SLUG || 'default';

export async function getResume(slug?: string): Promise<ResumeData | null> {
  const sql = getSql();
  const s = slug ?? DEFAULT_SLUG();
  const rows = await sql`
    select content from resumes where slug = ${s} limit 1
  `;
  if (!rows || rows.length === 0) return null;
  const content = rows[0].content;
  return (typeof content === 'string' ? JSON.parse(content) : content) as ResumeData;
}

export async function saveResume(content: ResumeData, slug?: string): Promise<void> {
  const sql = getSql();
  const s = slug ?? DEFAULT_SLUG();
  await sql`
    insert into resumes (slug, content, updated_at)
    values (${s}, ${JSON.stringify(content)}::jsonb, now())
    on conflict (slug) do update
      set content = excluded.content,
          updated_at = now()
  `;
}

// ── Snapshots ───────────────────────────────────────────────────────
export type SnapshotRow = {
  id: number;
  resume_slug: string;
  label: string | null;
  created_at: string;
};

export async function listSnapshots(slug?: string, limit = 30): Promise<SnapshotRow[]> {
  const sql = getSql();
  const s = slug ?? DEFAULT_SLUG();
  const rows = await sql`
    select id, resume_slug, label, created_at
    from snapshots
    where resume_slug = ${s}
    order by created_at desc
    limit ${limit}
  `;
  return rows as SnapshotRow[];
}

export async function createSnapshot(label?: string, slug?: string): Promise<SnapshotRow> {
  const sql = getSql();
  const s = slug ?? DEFAULT_SLUG();
  const rows = await sql`
    insert into snapshots (resume_slug, content, label)
    select ${s}, content, ${label ?? null}
    from resumes
    where slug = ${s}
    returning id, resume_slug, label, created_at
  `;
  if (!rows || rows.length === 0) throw new Error(`No resume found with slug "${s}"`);
  return rows[0] as SnapshotRow;
}

export async function restoreSnapshot(snapshotId: number, slug?: string): Promise<void> {
  const sql = getSql();
  const s = slug ?? DEFAULT_SLUG();
  const rows = await sql`
    select content from snapshots where id = ${snapshotId} and resume_slug = ${s}
  `;
  if (!rows || rows.length === 0) throw new Error(`Snapshot ${snapshotId} not found`);
  await sql`
    update resumes set content = ${JSON.stringify(rows[0].content)}::jsonb, updated_at = now()
    where slug = ${s}
  `;
}
