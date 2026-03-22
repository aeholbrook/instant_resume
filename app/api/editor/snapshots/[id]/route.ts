import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { restoreSnapshot, getResume } from '@/lib/db';

const PROJECTS_DIR = path.join(process.cwd(), 'projects');

// POST: restore snapshot
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { project = 'default' } = await request.json();

  // Try database first
  try {
    const dbData = await getResume(project);
    if (dbData) {
      await restoreSnapshot(Number(id), project);
      return NextResponse.json({ success: true, source: 'database' });
    }
  } catch (err) {
    // If the snapshot ID is numeric, it was meant for the database
    if (/^\d+$/.test(id)) {
      return NextResponse.json(
        { error: 'Failed to restore snapshot', detail: String(err) },
        { status: 500 },
      );
    }
    // Otherwise fall through to filesystem
  }

  const projectDir = path.join(PROJECTS_DIR, project);
  const snapshotDir = path.join(projectDir, 'snapshots', id);

  // Guard against path traversal
  const resolvedSnapshot = path.resolve(snapshotDir);
  if (!resolvedSnapshot.startsWith(path.resolve(PROJECTS_DIR))) {
    return NextResponse.json({ error: 'Invalid snapshot ID' }, { status: 403 });
  }

  try {
    const files = await fs.readdir(snapshotDir);
    const restored: string[] = [];

    for (const file of files) {
      if (file.endsWith('.yaml') || file.endsWith('.yml') || file.endsWith('.tex') || file.endsWith('.sty')) {
        await fs.copyFile(path.join(snapshotDir, file), path.join(projectDir, file));
        restored.push(file);
      }
    }

    return NextResponse.json({ success: true, filesRestored: restored, source: 'filesystem' });
  } catch {
    return NextResponse.json({ error: 'Snapshot not found' }, { status: 404 });
  }
}
