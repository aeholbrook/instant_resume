import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const TAG_DEFINITIONS: Record<string, string> = {
  sre: "Site Reliability Engineering, infrastructure, monitoring, uptime, incident response, observability",
  devops: "DevOps, CI/CD, automation, deployment, pipelines",
  infrastructure: "Cloud infrastructure, AWS, networking, systems administration",
  automation: "Scripting, tooling, process automation, Python",
  operations: "Operations management, incident management, on-call, runbooks",
  data: "Data engineering, data pipelines, ETL, analytics",
  community: "Community building, mentoring, leadership, nonprofit, volunteer work",
  payments: "Payment systems, financial technology, transaction processing",
  security: "Security, compliance, PCI-DSS, access management",
  development: "Software development, programming, APIs, microservices",
};

const VALID_TAGS = new Set(Object.keys(TAG_DEFINITIONS));

interface TagWeight {
  tag: string;
  weight: number;
}

function buildPrompt(title: string): string {
  const tagList = Object.entries(TAG_DEFINITIONS)
    .map(([tag, desc]) => `- ${tag}: ${desc}`)
    .join("\n");

  return `Given the job title "${title}", rate how relevant each resume tag is on a scale of 0 to 1. Only include tags with relevance > 0.3.

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
    const body = await request.json();
    const { title } = body;

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
          content: buildPrompt(title.trim()),
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
