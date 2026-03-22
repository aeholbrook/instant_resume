'use client';

import { useRef, useState, useEffect, useCallback, type ReactNode } from 'react';

/*
 * Letter page at 96 CSS-px/inch: 816 × 1056 px
 * Content is rendered once in a hidden measurement div with print-preview
 * styles, then page breaks are computed by walking the DOM to find
 * element boundaries — no content is clipped mid-line.
 *
 * Constants are shared with lib/generate-pdf.ts to ensure the live preview
 * and downloaded PDF use identical page geometry.
 */
const PAGE_W = 816;      // 8.5in at 96dpi
const PAGE_H = 1056;     // 11in at 96dpi
const MARGIN_Y = 48;     // 0.5in at 96dpi  — must match generate-pdf.ts
const MARGIN_X = 75.55;  // 0.787in at 96dpi — must match generate-pdf.ts
const CONTENT_H = PAGE_H - 2 * MARGIN_Y; // usable content height per page
const PAGE_GAP = 32;

type Props = { children: ReactNode };

/**
 * Walk the measurement DOM to find Y positions where pages should break.
 * Returns an array of break offsets (the Y position in the content where
 * each page starts). First entry is always 0.
 *
 * This is the same algorithm used in lib/generate-pdf.ts for PDF output.
 */
function computePageBreaks(container: HTMLElement): number[] {
  const breaks: number[] = [0];
  const containerRect = container.getBoundingClientRect();
  const containerTop = containerRect.top;

  const cssWidth = container.scrollWidth || 1;
  const visualScale = containerRect.width / cssWidth;

  const blocks: { top: number; bottom: number; avoidBreakInside: boolean; avoidBreakAfter: boolean }[] = [];

  function cssY(rect: DOMRect, edge: 'top' | 'bottom'): number {
    return (rect[edge] - containerTop) / visualScale;
  }

  function collectBlocks(el: Element) {
    if (el.getAttribute('aria-hidden') === 'true') return;

    const tag = el.tagName.toLowerCase();
    const cls = el.className || '';

    const isEntry = cls.includes('entry') && tag === 'article';
    const isSectionTitle = cls.includes('section-title');
    const isBulletItem = tag === 'li';
    const isSkillRow = cls.includes('skill-row');
    const isProjectItem = tag === 'li' && el.parentElement?.className?.includes('projects-list');
    const isSummary = cls.includes('summary') && tag === 'p';
    const isHeader = cls.includes('header-module');
    const isSection = cls.includes('resume-section');

    // Keep education, projects, and skills sections together on one page
    const sectionModule = el.getAttribute?.('data-module') || '';
    const isKeepTogetherSection = isSection && ['education', 'projects', 'skills'].includes(sectionModule);

    if (isKeepTogetherSection) {
      const rect = el.getBoundingClientRect();
      const top = cssY(rect, 'top');
      const bottom = cssY(rect, 'bottom');
      if ((bottom - top) <= CONTENT_H) {
        blocks.push({ top, bottom, avoidBreakInside: true, avoidBreakAfter: false });
        return;
      }
    }

    if (isEntry || isSectionTitle || isSkillRow || isProjectItem || isHeader) {
      const rect = el.getBoundingClientRect();
      const top = cssY(rect, 'top');
      const bottom = cssY(rect, 'bottom');

      if ((isEntry || isHeader) && (bottom - top) > CONTENT_H) {
        for (const child of el.children) {
          collectBlocks(child);
        }
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
      blocks.push({
        top: cssY(rect, 'top'),
        bottom: cssY(rect, 'bottom'),
        avoidBreakInside: false,
        avoidBreakAfter: false,
      });
      return;
    }

    if (isBulletItem && !isProjectItem) {
      const rect = el.getBoundingClientRect();
      blocks.push({
        top: cssY(rect, 'top'),
        bottom: cssY(rect, 'bottom'),
        avoidBreakInside: false,
        avoidBreakAfter: false,
      });
      return;
    }

    if (isSection || tag === 'main' || tag === 'div' || tag === 'section' || tag === 'ul' || tag === 'ol') {
      for (const child of el.children) {
        collectBlocks(child);
      }
      return;
    }

    const rect = el.getBoundingClientRect();
    if (rect.height > 0) {
      blocks.push({
        top: cssY(rect, 'top'),
        bottom: cssY(rect, 'bottom'),
        avoidBreakInside: false,
        avoidBreakAfter: false,
      });
    }
  }

  for (const child of container.children) {
    collectBlocks(child);
  }

  if (blocks.length === 0) return breaks;

  let pageStart = 0;

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    const blockHeight = block.bottom - block.top;
    const positionOnPage = block.bottom - pageStart;

    if (positionOnPage <= CONTENT_H) {
      continue;
    }

    let breakAt = block.top;

    if (block.avoidBreakInside && blockHeight <= CONTENT_H) {
      breakAt = block.top;
    }

    if (i > 0 && blocks[i - 1].avoidBreakAfter) {
      breakAt = blocks[i - 1].top;
    }

    pageStart = breakAt;
    breaks.push(pageStart);
  }

  return breaks;
}

export default function PaginatedPreview({ children }: Props) {
  const outerRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const [pageBreaks, setPageBreaks] = useState<number[]>([0]);
  const [scale, setScale] = useState(0.5);

  const recalc = useCallback(() => {
    if (!measureRef.current || !outerRef.current) return;

    const breaks = computePageBreaks(measureRef.current);
    setPageBreaks(breaks);

    const availW = outerRef.current.clientWidth - 48;
    setScale(Math.min(1, availW / PAGE_W));
  }, []);

  useEffect(() => { recalc(); }, [recalc, children]);

  // Also recalc after a short delay for fonts to load
  useEffect(() => {
    const t = setTimeout(recalc, 500);
    return () => clearTimeout(t);
  }, [recalc, children]);

  useEffect(() => {
    const el = outerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(recalc);
    ro.observe(el);
    return () => ro.disconnect();
  }, [recalc]);

  const pages = pageBreaks.length;
  const totalContent = measureRef.current?.scrollHeight ?? 0;
  const scalerH = pages * PAGE_H + (pages - 1) * PAGE_GAP;

  return (
    <div ref={outerRef} className="paginated-outer">
      <div className="paginated-page-count">
        {pages} page{pages !== 1 ? 's' : ''}
      </div>

      <div
        className="paginated-scaler"
        style={{
          transform: `scale(${scale})`,
          transformOrigin: 'top center',
          width: PAGE_W,
          height: scalerH,
          marginBottom: scalerH * (scale - 1),
        }}
      >
        {/* Hidden measurement container — horizontal padding only */}
        <div
          ref={measureRef}
          aria-hidden
          className="paginated-measure print-preview"
          style={{ width: PAGE_W, paddingLeft: MARGIN_X, paddingRight: MARGIN_X }}
        >
          {children}
        </div>

        {/* Visual page sheets */}
        {pageBreaks.map((breakY, i) => {
          const nextBreakY = i + 1 < pageBreaks.length
            ? pageBreaks[i + 1]
            : totalContent;
          const clipH = Math.min(CONTENT_H, nextBreakY - breakY);

          return (
            <div
              key={i}
              className="paginated-sheet"
              style={{
                width: PAGE_W,
                height: PAGE_H,
                top: i * (PAGE_H + PAGE_GAP),
                overflow: 'hidden',
              }}
            >
              <div className="paginated-sheet-label">Page {i + 1}</div>
              <div
                className="paginated-clip print-preview"
                style={{
                  width: PAGE_W,
                  height: clipH,
                  overflow: 'hidden',
                  margin: `${MARGIN_Y}px 0`,
                  padding: `0 ${MARGIN_X}px`,
                }}
              >
                <div style={{ position: 'relative', top: -breakY }}>
                  {children}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
