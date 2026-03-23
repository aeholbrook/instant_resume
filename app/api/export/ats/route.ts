import { NextRequest, NextResponse } from 'next/server';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  TabStopPosition,
  TabStopType,
  BorderStyle,
  convertInchesToTwip,
} from 'docx';
import { getResumeData } from '@/lib/resume';
import type { ResumeData } from '@/lib/resume';

/*
 * ATS-optimized DOCX export
 *
 * Key differences from the styled DOCX:
 * - Company name on its own line (bold) so ATS grabs it as employer
 * - Title on separate line so ATS grabs it as position
 * - Dates right-aligned on the title line in MM/YYYY format when possible
 * - Plain ASCII dash bullets (no unicode ▸)
 * - No accent colors — all black text
 * - No italics on body text
 * - Standard section headers that ATS systems recognize
 * - Location included when available
 */

const FONT = 'Calibri';
const SIZE_NAME = 28;     // 14pt
const SIZE_SECTION = 22;  // 11pt
const SIZE_BODY = 20;     // 10pt
const SIZE_SMALL = 20;    // 10pt (same as body for ATS readability)

function sectionHeading(text: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 240, after: 80 },
    border: {
      bottom: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
    },
    children: [
      new TextRun({
        text: text.toUpperCase(),
        font: FONT,
        size: SIZE_SECTION,
        bold: true,
        color: '000000',
      }),
    ],
  });
}

/** Company name on its own line — this is what ATS reads as "employer" */
function companyLine(company: string, location?: string): Paragraph {
  let text = company;
  if (location) text += ` - ${location}`;
  return new Paragraph({
    spacing: { before: 160, after: 0 },
    children: [
      new TextRun({ text, font: FONT, size: SIZE_BODY, bold: true, color: '000000' }),
    ],
  });
}

/** Title + dates on one line — ATS reads as "position title" */
function titleLine(title: string, dates?: string): Paragraph {
  const children: TextRun[] = [
    new TextRun({ text: title, font: FONT, size: SIZE_BODY, color: '000000' }),
  ];

  if (dates) {
    children.push(
      new TextRun({ text: '\t', font: FONT }),
      new TextRun({
        text: dates.replace(/--/g, ' - '),
        font: FONT,
        size: SIZE_BODY,
        color: '000000',
      }),
    );
  }

  return new Paragraph({
    tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
    spacing: { before: 0, after: 40 },
    children,
  });
}

function bulletItem(text: string): Paragraph {
  return new Paragraph({
    spacing: { before: 20, after: 0 },
    indent: { left: convertInchesToTwip(0.25) },
    children: [
      new TextRun({ text: '- ', font: FONT, size: SIZE_SMALL, color: '000000' }),
      new TextRun({ text, font: FONT, size: SIZE_SMALL, color: '000000' }),
    ],
  });
}

function buildAtsDocx(data: ResumeData): Document {
  const sections: Paragraph[] = [];
  const contact = data.contact || { name: 'Your Name' };

  // --- Name ---
  sections.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 40 },
      children: [
        new TextRun({
          text: contact.name,
          font: FONT,
          size: SIZE_NAME,
          bold: true,
          color: '000000',
        }),
      ],
    }),
  );

  // --- Contact info line ---
  const contactParts: string[] = [];
  if (contact.email) contactParts.push(contact.email);
  if (contact.phone) contactParts.push(contact.phone);
  if (contact.location) contactParts.push(contact.location);
  if (contact.linkedin) contactParts.push(contact.linkedin.replace(/^https?:\/\//, ''));
  if (contact.github) contactParts.push(contact.github.replace(/^https?:\/\//, ''));
  if (contact.websites) {
    for (const site of contact.websites) {
      contactParts.push(site.url.replace(/^https?:\/\//, ''));
    }
  }

  if (contactParts.length > 0) {
    sections.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 80 },
        children: [
          new TextRun({
            text: contactParts.join('  |  '),
            font: FONT,
            size: SIZE_SMALL,
            color: '000000',
          }),
        ],
      }),
    );
  }

  // --- Summary ---
  if (data.summary) {
    sections.push(sectionHeading('Summary'));
    sections.push(
      new Paragraph({
        spacing: { before: 40, after: 80 },
        children: [
          new TextRun({
            text: data.summary,
            font: FONT,
            size: SIZE_SMALL,
            color: '000000',
          }),
        ],
      }),
    );
  }

  // --- Employment ---
  const employment = data.employment || [];
  if (employment.length > 0) {
    sections.push(sectionHeading('Work Experience'));
    for (const role of employment) {
      sections.push(companyLine(role.company, role.location));
      sections.push(titleLine(role.title, role.dates));
      if (role.summary) {
        sections.push(
          new Paragraph({
            spacing: { before: 20, after: 20 },
            children: [
              new TextRun({ text: role.summary, font: FONT, size: SIZE_SMALL, color: '000000' }),
            ],
          }),
        );
      }
      if (role.achievements) {
        for (const a of role.achievements) {
          const text = typeof a === 'string' ? a : a.text;
          sections.push(bulletItem(text));
        }
      }
    }
  }

  // --- Education ---
  const education = data.education || [];
  if (education.length > 0) {
    sections.push(sectionHeading('Education'));
    for (const item of education) {
      const children: TextRun[] = [
        new TextRun({ text: item.degree, font: FONT, size: SIZE_BODY, bold: true, color: '000000' }),
      ];
      if (item.dates) {
        children.push(
          new TextRun({ text: '\t', font: FONT }),
          new TextRun({
            text: item.dates.replace(/--/g, ' - '),
            font: FONT,
            size: SIZE_BODY,
            color: '000000',
          }),
        );
      }
      sections.push(
        new Paragraph({
          tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
          spacing: { before: 120, after: 0 },
          children,
        }),
      );
      if (item.details) {
        sections.push(
          new Paragraph({
            spacing: { before: 20, after: 0 },
            children: [
              new TextRun({ text: item.details, font: FONT, size: SIZE_SMALL, color: '000000' }),
            ],
          }),
        );
      }
      if (item.achievements) {
        for (const a of item.achievements) {
          const text = typeof a === 'string' ? a : a.text;
          sections.push(bulletItem(text));
        }
      }
    }
  }

  // --- Projects ---
  const projects = data.projects || [];
  if (projects.length > 0) {
    sections.push(sectionHeading('Projects'));
    for (const p of projects) {
      let text = p.name;
      if (p.description) text += ` - ${p.description}`;
      sections.push(bulletItem(text));
    }
  }

  // --- Skills ---
  const skills = data.skills || {};
  const skillEntries = Object.entries(skills);
  if (skillEntries.length > 0) {
    sections.push(sectionHeading('Skills'));
    for (const [category, items] of skillEntries) {
      sections.push(
        new Paragraph({
          spacing: { before: 40, after: 0 },
          children: [
            new TextRun({ text: `${category}: `, font: FONT, size: SIZE_SMALL, bold: true, color: '000000' }),
            new TextRun({ text: items.join(', '), font: FONT, size: SIZE_SMALL, color: '000000' }),
          ],
        }),
      );
    }
  }

  return new Document({
    sections: [{
      properties: {
        page: {
          margin: {
            top: convertInchesToTwip(0.75),
            bottom: convertInchesToTwip(0.75),
            left: convertInchesToTwip(1),
            right: convertInchesToTwip(1),
          },
        },
      },
      children: sections,
    }],
  });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const profile = searchParams.get('profile') || undefined;

  try {
    const data = await getResumeData(profile);
    const doc = buildAtsDocx(data);
    const buffer = await Packer.toBuffer(doc);

    const filename = profile ? `resume-ats-${profile}.docx` : 'resume-ats.docx';

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    console.error('ATS DOCX generation failed:', err);
    return NextResponse.json(
      { error: 'ATS DOCX generation failed', details: String(err) },
      { status: 500 },
    );
  }
}
