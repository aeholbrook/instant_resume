#!/usr/bin/env node
const Anthropic = require('@anthropic-ai/sdk');
const fs = require('fs');
const yaml = require('yaml');
const path = require('path');

// Load env files
function loadEnv(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      let val = trimmed.slice(eqIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = val;
    }
  } catch {}
}

loadEnv(path.join(__dirname, '..', '.env.local'));
loadEnv(path.join(__dirname, '..', '.env'));

async function main() {
  const raw = fs.readFileSync(path.join(__dirname, '..', 'projects', 'default', 'cover-letter-blocks.yaml'), 'utf-8');
  const blocks = yaml.parse(raw);

  const fmt = (bs) => bs.map(b =>
    `[${b.id}] tags: ${b.tags.join(', ')}\n${b.text.trim()}`
  ).join('\n\n');

  const company = 'Washington University in St. Louis';
  const role = 'Data Visualization Designer II';
  const name = blocks.settings.sender_name;
  const notes = 'Hybrid role in the Provost Office, Institutional Effectiveness team. Key skills: Tableau, Excel, data storytelling, brand identity/style guides, WCAG 2.1 accessibility, SQL, UX/UI design. Focus on transforming complex data into clear visual narratives for university leadership and stakeholders.';

  const prompt = `You are writing a professional cover letter for ${name} applying to the role of "${role}" at ${company}.

The user also provided these notes about the job or company:
"${notes}"

Use this context to further tailor the letter where relevant.

Below are pre-written paragraph blocks organized by section. Select the most relevant blocks for this role and assemble them into a cohesive cover letter.

INSTRUCTIONS:
- Select exactly 1 intro paragraph
- Select 2-3 body paragraphs that are most relevant to the "${role}" role
- Select exactly 1 closing paragraph
- Replace all {{company}} with "${company}", {{role}} with "${role}", and {{name}} with "${name}"
- Smooth transitions between paragraphs so the letter reads naturally — you may lightly edit connecting phrases, but preserve the core content of each block
- Do NOT invent new claims or achievements — only use what's in the blocks
- Output ONLY the final letter text, no JSON, no commentary, no subject line

INTRO OPTIONS:
${fmt(blocks.intros)}

BODY OPTIONS:
${fmt(blocks.body)}

CLOSING OPTIONS:
${fmt(blocks.closings)}

Write the cover letter now:`;

  const apiKey = process.env.RESUME_ANTHROPIC_KEY || process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('No API key found');
    process.exit(1);
  }

  const client = new Anthropic({ apiKey });
  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = message.content.find(b => b.type === 'text');
  console.log(text.text);
}

main().catch(e => { console.error('Error:', e.message); process.exit(1); });
