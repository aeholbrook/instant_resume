import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs/promises';
import path from 'path';
import yaml from 'yaml';

type Block = { id: string; tags: string[]; text: string };
type BlocksData = {
  settings: { sender_name: string; sender_email: string; sender_phone?: string; sender_location?: string };
  intros: Block[];
  body: Block[];
  closings: Block[];
};

let blocksCache: BlocksData | null = null;

async function loadBlocks(): Promise<BlocksData> {
  if (blocksCache && process.env.NODE_ENV !== 'development') return blocksCache;
  const filePath = path.join(process.cwd(), 'projects', 'default', 'cover-letter-blocks.yaml');
  const raw = await fs.readFile(filePath, 'utf-8');
  blocksCache = yaml.parse(raw) as BlocksData;
  return blocksCache;
}

function formatBlockList(blocks: Block[]): string {
  return blocks.map(b =>
    `[${b.id}] tags: ${b.tags.length ? b.tags.join(', ') : 'general'}\n${b.text.trim()}`
  ).join('\n\n');
}

function substituteVars(text: string, vars: Record<string, string>): string {
  return text.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] || `{{${key}}}`);
}

function buildPrompt(blocks: BlocksData, company: string, role: string, notes?: string): string {
  const notesSection = notes
    ? `\nThe user also provided these notes about the job or company:\n"${notes}"\n\nUse this context to further tailor the letter where relevant.`
    : '';

  return `You are writing a professional cover letter for ${blocks.settings.sender_name} applying to the role of "${role}" at ${company}.${notesSection}

Below are pre-written paragraph blocks organized by section. Select the most relevant blocks for this role and assemble them into a cohesive cover letter.

INSTRUCTIONS:
- Select exactly 1 intro paragraph
- Select 2-3 body paragraphs that are most relevant to the "${role}" role
- Select exactly 1 closing paragraph
- Replace all {{company}} with "${company}", {{role}} with "${role}", and {{name}} with "${blocks.settings.sender_name}"
- Smooth transitions between paragraphs so the letter reads naturally — you may lightly edit connecting phrases, but preserve the core content of each block
- Do NOT invent new claims or achievements — only use what's in the blocks
- Output ONLY the final letter text, no JSON, no commentary, no subject line

INTRO OPTIONS:
${formatBlockList(blocks.intros)}

BODY OPTIONS:
${formatBlockList(blocks.body)}

CLOSING OPTIONS:
${formatBlockList(blocks.closings)}

Write the cover letter now:`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { company, role, notes } = body;

    if (!company || typeof company !== 'string' || !role || typeof role !== 'string') {
      return NextResponse.json(
        { error: 'Missing required fields: company and role' },
        { status: 400 },
      );
    }

    if (company.length > 200 || role.length > 200) {
      return NextResponse.json({ error: 'Fields too long (max 200 chars)' }, { status: 400 });
    }

    if (notes && typeof notes === 'string' && notes.length > 3000) {
      return NextResponse.json({ error: 'Notes too long (max 3000 chars)' }, { status: 400 });
    }

    const apiKey = process.env.RESUME_ANTHROPIC_KEY || process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Anthropic API key not configured' }, { status: 500 });
    }

    const blocks = await loadBlocks();
    const prompt = buildPrompt(blocks, company.trim(), role.trim(), notes?.trim());

    const client = new Anthropic({ apiKey });
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    });

    const textBlock = message.content.find(b => b.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      return NextResponse.json({ error: 'Unexpected response format' }, { status: 502 });
    }

    // Safety net: substitute any remaining template vars
    const vars = {
      company: company.trim(),
      role: role.trim(),
      name: blocks.settings.sender_name,
    };
    const letter = substituteVars(textBlock.text.trim(), vars);

    return NextResponse.json({ letter, sender: blocks.settings });
  } catch (err) {
    if (err instanceof SyntaxError) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }
    console.error('cover-letter error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
