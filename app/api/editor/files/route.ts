import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import yaml from 'yaml';
import { getResume } from '@/lib/db';

const PROJECTS_DIR = path.join(process.cwd(), 'projects');
const ALLOWED_EXTENSIONS = ['.yaml', '.yml', '.md', '.json'];

function isAllowedFile(filename: string): boolean {
  return ALLOWED_EXTENSIONS.some(ext => filename.endsWith(ext));
}

function guardPath(projectDir: string, filename: string): string | null {
  const resolved = path.resolve(projectDir, filename);
  if (!resolved.startsWith(path.resolve(projectDir))) return null;
  return resolved;
}

// GET: list files in project
export async function GET(request: NextRequest) {
  const project = request.nextUrl.searchParams.get('project') || 'default';

  // Try database first
  try {
    const dbData = await getResume(project);
    if (dbData) {
      return NextResponse.json({
        files: [{ name: 'content.yaml', mtime: Date.now(), size: 0, source: 'database' }],
        project,
        source: 'database',
      });
    }
  } catch {
    // fall through to filesystem
  }

  const projectDir = path.join(PROJECTS_DIR, project);

  try {
    const entries = await fs.readdir(projectDir, { withFileTypes: true });
    const files = [];

    for (const entry of entries) {
      if (entry.isFile() && isAllowedFile(entry.name)) {
        const stat = await fs.stat(path.join(projectDir, entry.name));
        files.push({
          name: entry.name,
          mtime: stat.mtimeMs,
          size: stat.size,
        });
      }
    }

    files.sort((a, b) => {
      if (a.name === 'content.yaml') return -1;
      if (b.name === 'content.yaml') return 1;
      return a.name.localeCompare(b.name);
    });

    return NextResponse.json({ files, project, source: 'filesystem' });
  } catch {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }
}

// POST: read a specific file
export async function POST(request: NextRequest) {
  const { project = 'default', filename } = await request.json();

  // If requesting content.yaml, try database first
  if (filename === 'content.yaml') {
    try {
      const dbData = await getResume(project);
      if (dbData) {
        const yamlContent = yaml.stringify(dbData);
        return NextResponse.json({
          filename,
          content: yamlContent,
          mtime: Date.now(),
          source: 'database',
        });
      }
    } catch {
      // fall through to filesystem
    }
  }

  const projectDir = path.join(PROJECTS_DIR, project);
  const filePath = guardPath(projectDir, filename);

  if (!filePath) {
    return NextResponse.json({ error: 'Invalid path' }, { status: 403 });
  }

  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const stat = await fs.stat(filePath);
    return NextResponse.json({ filename, content, mtime: stat.mtimeMs, source: 'filesystem' });
  } catch {
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }
}
