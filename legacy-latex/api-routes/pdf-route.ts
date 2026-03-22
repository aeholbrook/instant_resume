import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const PROJECT_ROOT = process.cwd();

export async function GET(request: NextRequest) {
  const profile = request.nextUrl.searchParams.get('profile');

  // Try profile-specific PDF first, then default
  const candidates = profile
    ? [
        path.join(PROJECT_ROOT, 'public', `resume-${profile}.pdf`),
        path.join(PROJECT_ROOT, 'projects', 'default', 'cv-llt.pdf'),
      ]
    : [
        path.join(PROJECT_ROOT, 'public', 'resume.pdf'),
        path.join(PROJECT_ROOT, 'projects', 'default', 'cv-llt.pdf'),
      ];

  for (const pdfPath of candidates) {
    try {
      const data = await fs.readFile(pdfPath);
      return new NextResponse(data, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `inline; filename="resume${profile ? `-${profile}` : ''}.pdf"`,
          'Cache-Control': 'no-cache',
        },
      });
    } catch {
      continue;
    }
  }

  return NextResponse.json({ error: 'PDF not found. Compile first.' }, { status: 404 });
}
