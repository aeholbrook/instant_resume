import { NextRequest, NextResponse } from 'next/server';
import { execFile } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';

const execFileAsync = promisify(execFile);
const PROJECT_ROOT = process.cwd();

export async function POST(request: NextRequest) {
  const { project = 'default', profile } = await request.json();

  const args = [path.join(PROJECT_ROOT, 'build-pdf.sh'), project];
  if (profile) {
    args.push('--profile', profile);
  }

  try {
    const { stdout, stderr } = await execFileAsync('bash', args, {
      cwd: PROJECT_ROOT,
      timeout: 60000,
      env: { ...process.env, PATH: `${process.env.HOME}/.local/bin:${process.env.PATH}` },
    });

    const log = stdout + (stderr ? '\n' + stderr : '');

    // Check page count from the compiled PDF
    let pages: number | null = null;
    const pdfPath = profile
      ? path.join(PROJECT_ROOT, 'public', `resume-${profile}.pdf`)
      : path.join(PROJECT_ROOT, 'public', 'resume.pdf');

    try {
      await fs.access(pdfPath);
      // Page count is typically in the compile log
      const pageMatch = log.match(/(\d+)\s*pages?/i);
      if (pageMatch) pages = parseInt(pageMatch[1]);
    } catch {
      // PDF may not exist yet
    }

    return NextResponse.json({ success: true, log, pages });
  } catch (err: unknown) {
    const error = err as { stdout?: string; stderr?: string; message?: string };
    return NextResponse.json(
      {
        success: false,
        log: (error.stdout || '') + '\n' + (error.stderr || ''),
        error: error.message || 'Compilation failed',
      },
      { status: 500 }
    );
  }
}
