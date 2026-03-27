import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

/* ── Simple in-memory rate limiter ──────────────────────────────── */
const WINDOW_MS = 60_000; // 1 minute
const MAX_REQUESTS = 5;   // per window per IP

const hits = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = hits.get(ip);
  if (!entry || now > entry.resetAt) {
    hits.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  entry.count++;
  return entry.count > MAX_REQUESTS;
}

// Prune stale entries every 5 minutes to prevent memory leak
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of hits) {
    if (now > entry.resetAt) hits.delete(ip);
  }
}, 300_000).unref?.();

const TAG_DEFINITIONS: Record<string, string> = {
  sre: "Site Reliability Engineering, monitoring, uptime, incident response, observability, on-call",
  devops: "DevOps, CI/CD, deployment pipelines, Jenkins, Git, infrastructure as code",
  infrastructure: "Cloud infrastructure, AWS, networking, systems administration, servers, Linux",
  automation: "Scripting, tooling, process automation, Python, Bash",
  operations: "Operations management, incident management, runbooks, production support",
  data: "Data engineering, data pipelines, ETL, analytics, databases, SQL, dashboards",
  community: "Community building, mutual aid, volunteer work, public events, outreach",
  nonprofit: "Nonprofit organizations, social services, food distribution, grassroots organizing",
  organizing: "Community organizing, event planning, coalition building, civic engagement",
  leadership: "Team leadership, mentoring, onboarding, organizational management, growing teams",
  evaluation: "Program evaluation, needs assessment, outcomes measurement, logic models",
  reporting: "Reporting, dashboards, KPIs, BI tools, Domo, Tableau, data visualization",
  research: "Research methods, survey design, statistical analysis, ANOVA, regression, R, SPSS",
  survey: "Survey design, Qualtrics, SurveyMonkey, questionnaire development, data collection",
  creative: "Creative work, content creation, visual storytelling, branding",
  photography: "Photography, photo editing, Lightroom, visual media, film, darkroom",
  design: "Graphic design, visual design, layout, typography, Canva, Adobe Suite",
  visualization: "Data visualization, charts, infographics, Plotly, Dash, interactive dashboards",
  payments: "Payment systems, financial technology, transaction processing, tokenization",
  security: "Security, compliance, certificate management, vulnerability response",
  development: "Software development, programming, APIs, microservices, web applications",
};

const VALID_TAGS = new Set(Object.keys(TAG_DEFINITIONS));

interface TagWeight {
  tag: string;
  weight: number;
}

function buildPrompt(title: string, description?: string): string {
  const tagList = Object.entries(TAG_DEFINITIONS)
    .map(([tag, desc]) => `- ${tag}: ${desc}`)
    .join("\n");

  let context = `Given the job title "${title}"`;
  if (description) {
    context += ` and the following job description:\n\n${description}\n\n`;
  }

  return `${context}rate how relevant each resume tag is on a scale of 0 to 1. Only include tags with relevance > 0.3. When a job description is provided, pay close attention to the specific skills, tools, and responsibilities mentioned.

Tags:
${tagList}

Respond with ONLY a JSON array of objects with "tag" and "weight" keys, sorted by weight descending. Example: [{"tag":"sre","weight":0.9},{"tag":"devops","weight":0.7}]`;
}

function parseResponse(text: string): TagWeight[] {
  const jsonMatch = text.match(/\[[\s\S]*?\]/);
  if (!jsonMatch) {
    throw new Error("No JSON array found in response");
  }

  const parsed: unknown = JSON.parse(jsonMatch[0]);

  if (!Array.isArray(parsed)) {
    throw new Error("Response is not an array");
  }

  return parsed
    .filter(
      (item: unknown): item is TagWeight =>
        typeof item === "object" &&
        item !== null &&
        "tag" in item &&
        "weight" in item &&
        typeof (item as TagWeight).tag === "string" &&
        typeof (item as TagWeight).weight === "number" &&
        VALID_TAGS.has((item as TagWeight).tag) &&
        (item as TagWeight).weight > 0.3
    )
    .map((item) => ({
      tag: item.tag,
      weight: Math.round(item.weight * 100) / 100,
    }))
    .sort((a, b) => b.weight - a.weight);
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      || request.headers.get("x-real-ip")
      || "unknown";

    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: "Too many requests. Please try again in a minute." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { title, description } = body;

    if (!title || typeof title !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid 'title' field" },
        { status: 400 }
      );
    }

    if (title.length > 200) {
      return NextResponse.json(
        { error: "Title too long (max 200 characters)" },
        { status: 400 }
      );
    }

    const descText = typeof description === "string" ? description.trim().slice(0, 5000) : undefined;

    const apiKey = process.env.RESUME_ANTHROPIC_KEY || process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Anthropic API key not configured" },
        { status: 500 }
      );
    }

    const client = new Anthropic({ apiKey });

    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 256,
      messages: [
        {
          role: "user",
          content: buildPrompt(title.trim(), descText),
        },
      ],
    });

    const textBlock = message.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return NextResponse.json(
        { error: "Unexpected response format from Claude" },
        { status: 502 }
      );
    }

    const results = parseResponse(textBlock.text);

    return NextResponse.json({
      tags: results.map((r) => r.tag),
      weights: results.map((r) => r.weight),
    });
  } catch (err) {
    if (err instanceof SyntaxError) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    console.error("match-tags error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
