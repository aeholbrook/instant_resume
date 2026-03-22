import { NextRequest, NextResponse } from 'next/server';
import { execFile } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import yaml from 'yaml';

const execFileAsync = promisify(execFile);
const PROJECT_ROOT = process.cwd();

export async function POST(request: NextRequest) {
  const { project = 'default' } = await request.json();

  // Read content.yaml to get profile names
  const contentPath = path.join(PROJECT_ROOT, 'projects', project, 'content.yaml');
  let profileNames: string[] = [];

  try {
    const raw = await fs.readFile(contentPath, 'utf-8');
    const content = yaml.parse(raw);
    if (content.profiles) {
      profileNames = Object.keys(content.profiles);
    }
  } catch {
    return NextResponse.json({ error: 'Could not read content.yaml' }, { status: 500 });
  }

  const buildScript = path.join(PROJECT_ROOT, 'build-pdf.sh');
  const env = { ...process.env, PATH: `${process.env.HOME}/.local/bin:${process.env.PATH}` };
  const results: Array<{ profile: string; success: boolean; pages: number | null; log: string }> = [];

  // Build each profile
  for (const profile of profileNames) {
    try {
      const { stdout, stderr } = await execFileAsync('bash', [buildScript, project, '--profile', profile], {
        cwd: PROJECT_ROOT,
        timeout: 60000,
        env,
      });
      const log = stdout + (stderr ? '\n' + stderr : '');
      const pageMatch = log.match(/(\d+)\s*pages?/i);
      results.push({ profile, success: true, pages: pageMatch ? parseInt(pageMatch[1]) : null, log });
    } catch (err: unknown) {
      const error = err as { stdout?: string; stderr?: string };
      results.push({ profile, success: false, pages: null, log: (error.stdout || '') + '\n' + (error.stderr || '') });
    }
  }

  // Build default (no profile)
  try {
    const { stdout, stderr } = await execFileAsync('bash', [buildScript, project], {
      cwd: PROJECT_ROOT,
      timeout: 60000,
      env,
    });
    const log = stdout + (stderr ? '\n' + stderr : '');
    const pageMatch = log.match(/(\d+)\s*pages?/i);
    results.push({ profile: 'default', success: true, pages: pageMatch ? parseInt(pageMatch[1]) : null, log });
  } catch (err: unknown) {
    const error = err as { stdout?: string; stderr?: string };
    results.push({ profile: 'default', success: false, pages: null, log: (error.stdout || '') + '\n' + (error.stderr || '') });
  }

  const allSuccess = results.every(r => r.success);
  return NextResponse.json({ success: allSuccess, results });
}
