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

const FONT = 'Calibri';
const FONT_SIZE_NAME = 28;     // 14pt in half-points
const FONT_SIZE_SECTION = 22;  // 11pt
const FONT_SIZE_BODY = 20;     // 10pt
const FONT_SIZE_SMALL = 18;    // 9pt
const ACCENT_COLOR = '922D3E';

function sectionHeading(text: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 200, after: 80 },
    border: {
      bottom: { style: BorderStyle.SINGLE, size: 6, color: '7A1D0A' },
    },
    children: [
      new TextRun({
        text: text.toUpperCase(),
        font: FONT,
        size: FONT_SIZE_SECTION,
        bold: true,
        color: '000000',
      }),
    ],
  });
}

function entryTopline(title: string, company: string, dates?: string): Paragraph {
  const children: TextRun[] = [
    new TextRun({ text: title, font: FONT, size: FONT_SIZE_BODY, bold: true }),
    new TextRun({ text: ` at ${company}`, font: FONT, size: FONT_SIZE_BODY, color: '3A3A3A' }),
  ];

  if (dates) {
    children.push(
      new TextRun({ text: '\t', font: FONT }),
      new TextRun({
        text: dates.replace(/--/g, '\u2013'),
        font: FONT,
        size: FONT_SIZE_SMALL,
      }),
    );
  }

  return new Paragraph({
    tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
    spacing: { before: 120, after: 0 },
    children,
  });
}

function bulletItem(text: string): Paragraph {
  return new Paragraph({
    spacing: { before: 40, after: 0 },
    indent: { left: convertInchesToTwip(0.25) },
    children: [
      new TextRun({ text: '\u25B8 ', font: FONT, size: FONT_SIZE_SMALL, color: ACCENT_COLOR }),
      new TextRun({ text, font: FONT, size: FONT_SIZE_SMALL, italics: true, color: '3A3A3A' }),
    ],
  });
}

function buildDocx(data: ResumeData): Document {
  const sections: Paragraph[] = [];

  // --- Header ---
  const contact = data.contact || { name: 'Your Name' };
  sections.push(
    new Paragraph({
      alignment: AlignmentType.LEFT,
      spacing: { after: 40 },
      children: [
        new TextRun({
          text: contact.name,
          font: FONT,
          size: FONT_SIZE_NAME,
          bold: true,
        }),
      ],
    }),
  );

  const contactParts: string[] = [];
  if (contact.email) contactParts.push(contact.email);
  if (contact.phone) contactParts.push(contact.phone);
  if (contact.linkedin) contactParts.push(contact.linkedin.replace(/^https?:\/\//, ''));
  if (contact.github) contactParts.push(contact.github.replace(/^https?:\/\//, ''));
  if (contact.location) contactParts.push(contact.location);

  if (contactParts.length > 0) {
    sections.push(
      new Paragraph({
        spacing: { after: 80 },
        children: [
          new TextRun({
            text: contactParts.join('  |  '),
            font: FONT,
            size: FONT_SIZE_SMALL,
            color: '555555',
          }),
        ],
      }),
    );
  }

  // Summary
  if (data.summary) {
    sections.push(
      new Paragraph({
        spacing: { before: 40, after: 80 },
        children: [
          new TextRun({
            text: data.summary,
            font: FONT,
            size: FONT_SIZE_SMALL,
            bold: true,
          }),
        ],
      }),
    );
  }

  // --- Employment ---
  const employment = data.employment || [];
  if (employment.length > 0) {
    sections.push(sectionHeading(data.section_titles?.employment || 'Professional Experience'));
    for (const role of employment) {
      sections.push(entryTopline(role.title, role.company, role.dates));
      if (role.summary) {
        sections.push(
          new Paragraph({
            spacing: { before: 20, after: 0 },
            children: [
              new TextRun({ text: role.summary, font: FONT, size: FONT_SIZE_SMALL, italics: true, color: '3A3A3A' }),
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
    sections.push(sectionHeading(data.section_titles?.education || 'Education'));
    for (const item of education) {
      const children: TextRun[] = [
        new TextRun({ text: item.degree, font: FONT, size: FONT_SIZE_BODY, bold: true }),
      ];
      if (item.dates) {
        children.push(
          new TextRun({ text: '\t', font: FONT }),
          new TextRun({
            text: item.dates.replace(/--/g, '\u2013'),
            font: FONT,
            size: FONT_SIZE_SMALL,
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
              new TextRun({ text: item.details, font: FONT, size: FONT_SIZE_SMALL, italics: true, color: '555555' }),
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
    sections.push(sectionHeading(data.section_titles?.projects || 'Projects'));
    for (const p of projects) {
      const parts: TextRun[] = [
        new TextRun({ text: p.name, font: FONT, size: FONT_SIZE_SMALL, bold: true, italics: true, color: ACCENT_COLOR }),
      ];
      if (p.description) {
        parts.push(
          new TextRun({ text: ` \u2013 ${p.description}`, font: FONT, size: FONT_SIZE_SMALL, italics: true, color: '3A3A3A' }),
        );
      }
      sections.push(
        new Paragraph({
          spacing: { before: 60, after: 0 },
          indent: { left: convertInchesToTwip(0.25) },
          children: [
            new TextRun({ text: '\u25B8 ', font: FONT, size: FONT_SIZE_SMALL, color: ACCENT_COLOR }),
            ...parts,
          ],
        }),
      );
    }
  }

  // --- Skills ---
  const skills = data.skills || {};
  const skillEntries = Object.entries(skills);
  if (skillEntries.length > 0) {
    sections.push(sectionHeading(data.section_titles?.skills || 'Skills'));
    for (const [category, items] of skillEntries) {
      sections.push(
        new Paragraph({
          spacing: { before: 40, after: 0 },
          children: [
            new TextRun({ text: `${category}: `, font: FONT, size: FONT_SIZE_SMALL, bold: true }),
            new TextRun({ text: items.join(', '), font: FONT, size: FONT_SIZE_SMALL, color: '3A3A3A' }),
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
            top: convertInchesToTwip(0.5),
            bottom: convertInchesToTwip(0.5),
            left: convertInchesToTwip(0.787),
            right: convertInchesToTwip(0.787),
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
    const doc = buildDocx(data);
    const buffer = await Packer.toBuffer(doc);

    const filename = profile ? `resume-${profile}.docx` : 'resume.docx';

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    console.error('DOCX generation failed:', err);
    return NextResponse.json(
      { error: 'DOCX generation failed', details: String(err) },
      { status: 500 },
    );
  }
}
