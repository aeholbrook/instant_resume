import { NextRequest, NextResponse } from 'next/server';
import { execFile } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';

const execFileAsync = promisify(execFile);
const PROJECT_ROOT = process.cwd();

/**
 * POST: Run YAML → LaTeX generation only (no tectonic compilation).
 * Returns the generated .tex and .sty files for client-side WASM compilation.
 */
export async function POST(request: NextRequest) {
  const { project = 'default', profile } = await request.json();

  const projectDir = path.join(PROJECT_ROOT, 'projects', project);
  const genScript = path.join(PROJECT_ROOT, 'generate_latex_from_yaml.py');

  const args = [genScript, project];
  if (profile) {
    args.push('--profile', profile);
  }

  try {
    const { stdout, stderr } = await execFileAsync('python3', args, {
      cwd: PROJECT_ROOT,
      timeout: 15000,
    });

    const log = stdout + (stderr ? '\n' + stderr : '');

    // Read all .tex and .sty files from the project directory
    const entries = await fs.readdir(projectDir);
    const texFiles: Record<string, string> = {};

    for (const entry of entries) {
      if (entry.endsWith('.tex') || entry.endsWith('.sty')) {
        texFiles[entry] = await fs.readFile(path.join(projectDir, entry), 'utf-8');
      }
    }

    return NextResponse.json({ success: true, log, files: texFiles });
  } catch (err: unknown) {
    const error = err as { stdout?: string; stderr?: string; message?: string };
    return NextResponse.json(
      {
        success: false,
        log: (error.stdout || '') + '\n' + (error.stderr || ''),
        error: error.message || 'LaTeX generation failed',
      },
      { status: 500 }
    );
  }
}
