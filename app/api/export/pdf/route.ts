import { NextRequest, NextResponse } from 'next/server';
import { getResumeData } from '@/lib/resume';
import { renderResumeHTML } from '@/lib/render-resume-html';
import fs from 'fs/promises';

export const maxDuration = 30; // Vercel function timeout

// ── Browser singleton ────────────────────────────────────────────────
// Reuse the browser across requests to avoid cold-start penalty on every call.

let browserInstance: any = null;
let browserPromise: Promise<any> | null = null;

async function getOrCreateBrowser() {
  if (browserInstance?.isConnected?.()) return browserInstance;

  // Prevent multiple concurrent launches
  if (browserPromise) return browserPromise;

  browserPromise = (async () => {
    const puppeteerCore = (await import('puppeteer-core')).default;

    // 1. CHROME_PATH env var (custom local install)
    const customPath = process.env.CHROME_PATH;
    if (customPath) {
      browserInstance = await puppeteerCore.launch({
        executablePath: customPath,
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
      });
      browserPromise = null;
      return browserInstance;
    }

    // 2. Common local paths (dev)
    if (process.env.NODE_ENV === 'development') {
      const localPaths = [
        '/usr/bin/google-chrome-stable',
        '/usr/bin/google-chrome',
        '/usr/bin/chromium-browser',
        '/usr/bin/chromium',
        '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      ];
      for (const p of localPaths) {
        try {
          await fs.access(p);
          browserInstance = await puppeteerCore.launch({
            executablePath: p,
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
          });
          browserPromise = null;
          return browserInstance;
        } catch {}
      }
    }

    // 3. @sparticuz/chromium (Vercel / serverless)
    const chromium = (await import('@sparticuz/chromium')).default;
    browserInstance = await puppeteerCore.launch({
      args: chromium.args,
      defaultViewport: (chromium as any).defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: (chromium as any).headless ?? true,
    });
    browserPromise = null;
    return browserInstance;
  })();

  return browserPromise;
}

// ── Route handler ────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const profile = searchParams.get('profile') || undefined;

  let page: any;
  try {
    // Run data fetching + HTML rendering in parallel with browser startup
    const [browser, html] = await Promise.all([
      getOrCreateBrowser(),
      getResumeData(profile).then(data => renderResumeHTML(data)),
    ]);

    page = await browser.newPage();

    // setContent with inlined fonts — no network requests needed
    await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: 10000 });
    // Wait for inlined fonts to be parsed and ready
    await page.evaluateHandle('document.fonts.ready');

    const pdfBuffer = await page.pdf({
      format: 'Letter',
      margin: {
        top: '0.4in',
        bottom: '0.4in',
        left: '0.6in',
        right: '0.6in',
      },
      printBackground: true,
    });

    const filename = profile ? `resume-${profile}.pdf` : 'resume.pdf';

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    console.error('PDF generation failed:', err);
    const hint = process.env.NODE_ENV === 'development'
      ? ' Set CHROME_PATH env var to your Chrome/Chromium binary path for local dev.'
      : '';
    return NextResponse.json(
      { error: 'PDF generation failed', details: String(err) + hint },
      { status: 500 },
    );
  } finally {
    if (page) {
      try { await page.close(); } catch {}
    }
  }
}
