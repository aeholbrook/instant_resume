import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { listSnapshots, createSnapshot, getResume } from '@/lib/db';

const PROJECTS_DIR = path.join(process.cwd(), 'projects');
const SNAPSHOT_EXTENSIONS = ['.yaml', '.yml', '.tex', '.sty'];

// GET: list snapshots
export async function GET(request: NextRequest) {
  const project = request.nextUrl.searchParams.get('project') || 'default';

  // Try database first
  try {
    const dbData = await getResume(project);
    if (dbData) {
      const snapshots = await listSnapshots(project);
      return NextResponse.json({
        snapshots: snapshots.map((s) => ({
          id: String(s.id),
          date: s.created_at,
          label: s.label,
          fileCount: 1,
        })),
        source: 'database',
      });
    }
  } catch {
    // fall through to filesystem
  }

  const snapshotsDir = path.join(PROJECTS_DIR, project, 'snapshots');

  try {
    const entries = await fs.readdir(snapshotsDir, { withFileTypes: true });
    const snapshots = [];

    for (const entry of entries.filter(e => e.isDirectory())) {
      const snapshotPath = path.join(snapshotsDir, entry.name);
      const files = await fs.readdir(snapshotPath);
      snapshots.push({
        id: entry.name,
        date: entry.name.replace(/_/g, ' ').replace(/-/g, ':').replace(/ (\d{2}):/, ' $1:'),
        files: files,
        fileCount: files.length,
      });
    }

    snapshots.sort((a, b) => b.id.localeCompare(a.id));
    return NextResponse.json({ snapshots: snapshots.slice(0, 30), source: 'filesystem' });
  } catch {
    return NextResponse.json({ snapshots: [], source: 'filesystem' });
  }
}

// POST: create snapshot
export async function POST(request: NextRequest) {
  const { project = 'default', label } = await request.json();

  // Try database first
  try {
    const dbData = await getResume(project);
    if (dbData) {
      const snapshot = await createSnapshot(label, project);
      return NextResponse.json({
        success: true,
        id: String(snapshot.id),
        date: snapshot.created_at,
        source: 'database',
      });
    }
  } catch {
    // fall through to filesystem
  }

  const projectDir = path.join(PROJECTS_DIR, project);
  const now = new Date();
  const id = now.toISOString().replace(/[:.]/g, '-').replace('T', '_').slice(0, 19);
  const snapshotDir = path.join(projectDir, 'snapshots', id);

  try {
    await fs.mkdir(snapshotDir, { recursive: true });

    const entries = await fs.readdir(projectDir, { withFileTypes: true });
    const copied: string[] = [];

    for (const entry of entries) {
      if (entry.isFile() && SNAPSHOT_EXTENSIONS.some(ext => entry.name.endsWith(ext))) {
        await fs.copyFile(path.join(projectDir, entry.name), path.join(snapshotDir, entry.name));
        copied.push(entry.name);
      }
    }

    return NextResponse.json({ success: true, id, files: copied, source: 'filesystem' });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to create snapshot', detail: String(err) }, { status: 500 });
  }
}
