import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import yaml from 'yaml';
import { getResume, saveResume } from '@/lib/db';

const PROJECTS_DIR = path.join(process.cwd(), 'projects');

function guardPath(projectDir: string, filename: string): string | null {
  const resolved = path.resolve(projectDir, filename);
  if (!resolved.startsWith(path.resolve(projectDir))) return null;
  return resolved;
}

export async function PUT(request: NextRequest) {
  const { project = 'default', filename, content } = await request.json();

  // If saving content.yaml, try database first
  if (filename === 'content.yaml') {
    try {
      // Check if we're in database mode (resume exists in db)
      const existing = await getResume(project);
      if (existing) {
        const parsed = yaml.parse(content);
        await saveResume(parsed, project);
        return NextResponse.json({ success: true, mtime: Date.now(), source: 'database' });
      }
    } catch (err) {
      // If YAML parse fails, return error
      if (err instanceof Error && err.message.includes('YAML')) {
        return NextResponse.json({ error: 'Invalid YAML', detail: String(err) }, { status: 400 });
      }
      // Otherwise fall through to filesystem
    }
  }

  // Filesystem fallback
  const projectDir = path.join(PROJECTS_DIR, project);
  const filePath = guardPath(projectDir, filename);

  if (!filePath) {
    return NextResponse.json({ error: 'Invalid path' }, { status: 403 });
  }

  try {
    await fs.writeFile(filePath, content, 'utf-8');
    const stat = await fs.stat(filePath);
    return NextResponse.json({ success: true, mtime: stat.mtimeMs, source: 'filesystem' });
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to save', detail: String(err) },
      { status: 500 }
    );
  }
}
