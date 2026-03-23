import { NextRequest, NextResponse } from 'next/server';
import { COOKIE_NAME, verifyToken } from '@/lib/auth';

export async function middleware(req: NextRequest) {
  const editorPassword = process.env.EDITOR_PASSWORD;

  // If no password is set, allow everything (local dev without auth)
  if (!editorPassword) return NextResponse.next();

  const token = req.cookies.get(COOKIE_NAME)?.value;

  if (token && await verifyToken(token)) {
    return NextResponse.next();
  }

  // API routes return 401 JSON
  if (req.nextUrl.pathname.startsWith('/api/editor')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Editor page redirects to login
  const loginUrl = new URL('/login', req.url);
  loginUrl.searchParams.set('from', req.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/editor/:path*', '/api/editor/:path*', '/cover-letter/:path*'],
};
