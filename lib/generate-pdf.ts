/**
 * Shared PDF generation via html2canvas + jsPDF.
 * Returns a Blob of the generated PDF.
 *
 * Used by both the editor's PDF preview and the standalone "Download PDF" button.
 */

// Page dimensions at 96dpi — must match PaginatedPreview exactly
const PAGE_H = 1056;       // 11in
const PAGE_W = 816;        // 8.5in
const MARGIN_Y = 48;       // 0.5in
const MARGIN_X = 75.55;    // 0.787in
const CONTENT_H = PAGE_H - 2 * MARGIN_Y;

async function loadLib(url: string, globalName: string) {
  if ((window as any)[globalName]) return;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}`);
  const code = await res.text();
  const savedDefine = (window as any).define;
  (window as any).define = undefined;
  try {
    (0, eval)(code);
  } finally {
    (window as any).define = savedDefine;
  }
}

async function waitForImages(doc: Document, timeout = 5000) {
  const imgs = Array.from(doc.querySelectorAll('img'));
  await Promise.all(imgs.map(img => {
    if (img.complete && img.naturalWidth > 0) return Promise.resolve();
    return new Promise<void>((resolve) => {
      const timer = setTimeout(resolve, timeout);
      img.onload = () => { clearTimeout(timer); resolve(); };
      img.onerror = () => { clearTimeout(timer); resolve(); };
    });
  }));
}

function collectBlocks(
  contentEl: HTMLElement,
  contentH: number
): { top: number; bottom: number; avoidBreakInside: boolean; avoidBreakAfter: boolean }[] {
  const containerTop = contentEl.getBoundingClientRect().top;
  type Block = { top: number; bottom: number; avoidBreakInside: boolean; avoidBreakAfter: boolean };
  const blocks: Block[] = [];

  function walk(el: Element) {
    if (el.getAttribute('aria-hidden') === 'true') return;

    const tag = el.tagName.toLowerCase();
    const cls = el.className || '';
    const isEntry = cls.includes('entry') && tag === 'article';
    const isSectionTitle = cls.includes('section-title');
    const isSkillRow = cls.includes('skill-row');
    const isHeader = cls.includes('header-module');
    const isSection = cls.includes('resume-section');
    const isProjectItem = tag === 'li' && el.parentElement?.className?.includes('projects-list');
    const isSummary = cls.includes('summary') && tag === 'p';
    const isBulletItem = tag === 'li';

    // Keep education, projects, and skills sections together on one page
    const sectionModule = el.getAttribute?.('data-module') || '';
    const isKeepTogetherSection = isSection && ['education', 'projects', 'skills'].includes(sectionModule);

    if (isKeepTogetherSection) {
      const rect = el.getBoundingClientRect();
      const top = rect.top - containerTop;
      const bottom = rect.bottom - containerTop;
      // Only keep together if it fits on a page; otherwise fall through and walk children
      if ((bottom - top) <= contentH) {
        blocks.push({ top, bottom, avoidBreakInside: true, avoidBreakAfter: false });
        return;
      }
    }

    if (isEntry || isSectionTitle || isSkillRow || isProjectItem || isHeader) {
      const rect = el.getBoundingClientRect();
      const top = rect.top - containerTop;
      const bottom = rect.bottom - containerTop;

      if ((isEntry || isHeader) && (bottom - top) > contentH) {
        for (const child of el.children) walk(child);
        return;
      }

      blocks.push({
        top,
        bottom,
        avoidBreakInside: isEntry || isHeader,
        avoidBreakAfter: isSectionTitle,
      });
      return;
    }

    if (isSummary) {
      const rect = el.getBoundingClientRect();
      blocks.push({ top: rect.top - containerTop, bottom: rect.bottom - containerTop, avoidBreakInside: false, avoidBreakAfter: false });
      return;
    }

    if (isBulletItem && !isProjectItem) {
      const rect = el.getBoundingClientRect();
      if (rect.height > 0) {
        blocks.push({ top: rect.top - containerTop, bottom: rect.bottom - containerTop, avoidBreakInside: false, avoidBreakAfter: false });
      }
      return;
    }

    if (isSection || tag === 'main' || tag === 'div' || tag === 'section' || tag === 'header' || tag === 'ul' || tag === 'ol') {
      for (const child of el.children) walk(child);
      return;
    }

    const rect = el.getBoundingClientRect();
    if (rect.height > 0) {
      blocks.push({ top: rect.top - containerTop, bottom: rect.bottom - containerTop, avoidBreakInside: false, avoidBreakAfter: false });
    }
  }

  for (const child of contentEl.children) walk(child);
  return blocks;
}

function computePageBreaks(blocks: { top: number; bottom: number; avoidBreakInside: boolean; avoidBreakAfter: boolean }[]): number[] {
  const pageBreaks: number[] = [0];
  let pageStart = 0;

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    const blockHeight = block.bottom - block.top;
    if (block.bottom - pageStart <= CONTENT_H) continue;

    let breakAt = block.top;
    if (block.avoidBreakInside && blockHeight <= CONTENT_H) {
      breakAt = block.top;
    }
    if (i > 0 && blocks[i - 1].avoidBreakAfter) {
      breakAt = blocks[i - 1].top;
    }
    pageStart = breakAt;
    pageBreaks.push(pageStart);
  }

  return pageBreaks;
}

export async function generatePdfBlob(profile?: string): Promise<Blob> {
  await loadLib('https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js', 'html2canvas');
  await loadLib('https://cdn.jsdelivr.net/npm/jspdf@2.5.2/dist/jspdf.umd.min.js', 'jspdf');

  const html2canvas = (window as any).html2canvas;
  const jsPDF = (window as any).jspdf.jsPDF;

  // Create an off-screen iframe to render print-styled content
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.left = '-9999px';
  iframe.style.top = '0';
  iframe.style.width = `${PAGE_W}px`;
  iframe.style.height = `${PAGE_H}px`;
  iframe.style.border = 'none';

  const profileParam = profile
    ? `/profile/${profile}?printpreview`
    : '/?printpreview';

  document.body.appendChild(iframe);

  try {
    await new Promise<void>((resolve, reject) => {
      iframe.onload = () => resolve();
      iframe.onerror = () => reject(new Error('Failed to load preview'));
      iframe.src = profileParam;
    });

    const iframeDoc = iframe.contentDocument;
    if (!iframeDoc || !iframeDoc.body) {
      throw new Error('Could not access iframe content');
    }

    const contentEl = iframeDoc.body;
    contentEl.classList.add('print-preview');
    contentEl.style.cssText = `margin: 0; padding: 0 ${MARGIN_X}px; width: ${PAGE_W}px; background: #fff;`;

    // Wait for fonts
    try {
      await (iframeDoc as any).fonts?.ready;
    } catch (_) {}
    await new Promise(r => setTimeout(r, 500));

    // Wait for images
    await waitForImages(iframeDoc);

    // Convert Next.js optimized images to inline data URLs
    const imgs = Array.from(iframeDoc.querySelectorAll('img'));
    for (const img of imgs) {
      if (img.complete && img.naturalWidth > 0) {
        try {
          const c = document.createElement('canvas');
          c.width = img.naturalWidth;
          c.height = img.naturalHeight;
          const ctx2 = c.getContext('2d');
          if (ctx2) {
            ctx2.drawImage(img, 0, 0);
            img.src = c.toDataURL('image/png');
            img.removeAttribute('srcset');
            img.removeAttribute('sizes');
          }
        } catch (_) {
          // If tainted canvas, skip
        }
      }
    }
    await new Promise(r => setTimeout(r, 200));

    // Compute page breaks
    const blocks = collectBlocks(contentEl, CONTENT_H);
    const pageBreaks = computePageBreaks(blocks);

    const totalHeight = contentEl.scrollHeight;
    if (totalHeight === 0) {
      throw new Error('Content has zero height — iframe may not have rendered');
    }

    // Resize iframe to full content height for capture
    iframe.style.height = `${totalHeight}px`;
    await new Promise(r => setTimeout(r, 200));

    // Capture the full body
    const canvas = await html2canvas(contentEl, {
      width: PAGE_W,
      height: totalHeight,
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
    });

    // Create PDF — letter size
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'in',
      format: 'letter',
    });

    const myIn = MARGIN_Y / 96;
    const pageWIn = PAGE_W / 96;
    const pxToCanvasY = canvas.height / totalHeight;

    for (let i = 0; i < pageBreaks.length; i++) {
      if (i > 0) pdf.addPage();

      const breakY = pageBreaks[i];
      const nextBreakY = i + 1 < pageBreaks.length ? pageBreaks[i + 1] : totalHeight;
      const sliceHPx = Math.min(CONTENT_H, nextBreakY - breakY);
      const sliceHCanvas = Math.round(sliceHPx * pxToCanvasY);
      const sliceYCanvas = Math.round(breakY * pxToCanvasY);
      const sliceHIn = sliceHPx / 96;

      const pageCanvas = document.createElement('canvas');
      pageCanvas.width = canvas.width;
      pageCanvas.height = sliceHCanvas;
      const ctx = pageCanvas.getContext('2d');
      if (!ctx) continue;

      ctx.drawImage(
        canvas,
        0, sliceYCanvas,
        canvas.width, sliceHCanvas,
        0, 0,
        canvas.width, sliceHCanvas,
      );

      const imgData = pageCanvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', 0, myIn, pageWIn, sliceHIn);
    }

    return pdf.output('blob');
  } finally {
    document.body.removeChild(iframe);
  }
}

/**
 * Generate and immediately download the PDF (image-based via html2canvas).
 */
export async function downloadPdf(profile?: string, filename = 'resume.pdf'): Promise<void> {
  const blob = await generatePdfBlob(profile);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Generate a text-based, ATS-friendly PDF via server-side Puppeteer.
 * The PDF preserves full CSS styling AND has selectable/parseable text.
 */
export async function generateTextPdfBlob(profile?: string, theme?: string): Promise<Blob> {
  const params = new URLSearchParams();
  if (profile) params.set('profile', profile);
  if (theme) params.set('theme', theme);
  const res = await fetch(`/api/export/pdf?${params}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(err.details || err.error || 'PDF generation failed');
  }
  return res.blob();
}

/**
 * Generate and immediately download the text-based PDF.
 */
export async function downloadTextPdf(profile?: string, filename = 'resume.pdf', theme?: string): Promise<void> {
  const blob = await generateTextPdfBlob(profile, theme);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Generate and download a DOCX file via the server-side API.
 */
export async function downloadDocx(profile?: string, filename = 'resume.docx'): Promise<void> {
  const params = new URLSearchParams();
  if (profile) params.set('profile', profile);
  const res = await fetch(`/api/export/docx?${params}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(err.details || err.error || 'DOCX generation failed');
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
