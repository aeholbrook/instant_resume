/**
 * Reshape the resume for the nonprofit/development-director profile:
 *   - Trim Mastercard consolidated bullets to 2 visible (Domo + new combined),
 *     narrow remaining bullets to SRE-only tags
 *   - Add new "Donor & CRM Systems" skills category
 *   - Move CiviCRM and Salesforce into the new category
 *   - Scrub skill tags so SRE/infra categories drop for nonprofit profile
 */
import { neon } from '@neondatabase/serverless';

const SLUG = process.env.RESUME_SLUG || 'default';
const url = process.env.POSTGRES_URL || process.env.DATABASE_URL;
if (!url) throw new Error('POSTGRES_URL not set');
const sql = neon(url);

type Skill = { name: string; tags?: string[] } | string;
type Achievement = { text: string; tags?: string[]; priority?: number };

function dropTags(skill: any, tagsToRemove: string[]) {
  if (!skill || typeof skill === 'string' || !skill.tags) return;
  skill.tags = skill.tags.filter((t: string) => !tagsToRemove.includes(t));
}

function scrubCategory(skills: Record<string, Skill[]>, category: string, removeTags: string[], onlyForNames?: string[]) {
  const list = skills[category];
  if (!list) return;
  for (const s of list) {
    if (typeof s === 'string') continue;
    if (onlyForNames && !onlyForNames.includes(s.name)) continue;
    dropTags(s, removeTags);
  }
}

async function main() {
  const rows = await sql`select content from resumes where slug = ${SLUG} limit 1`;
  if (!rows.length) throw new Error(`No resume row for slug ${SLUG}`);
  const content = typeof rows[0].content === 'string' ? JSON.parse(rows[0].content) : rows[0].content;

  await sql`
    insert into snapshots (resume_slug, content, label)
    select ${SLUG}, content, ${'pre-bizops-nonprofit-reshape'}
    from resumes where slug = ${SLUG}
  `;
  console.log('Snapshot created.');

  // ── Mastercard consolidated achievements ─────────────────────────────
  const cons = content.employment.find((e: any) => e.group === 'mastercard-summary');
  if (!cons) throw new Error('Could not find mastercard-summary entry');

  const newAchievements: Achievement[] = [
    {
      text: 'Built Domo operational intelligence platform integrating Salesforce, Splunk, Dynatrace, Jira, & Remedy; reduced report generation from 2+ hours to seconds.',
      tags: ['data', 'reporting', 'visualization', 'evaluation', 'leadership', 'operations'],
    },
    {
      text: 'Translated complex operational data into KPI dashboards and reports for executive leadership; led cross-functional training and documentation initiatives across distributed teams.',
      tags: ['data', 'reporting', 'leadership', 'community', 'evaluation', 'visualization'],
    },
    {
      text: 'Architected 200+ observability monitors & IaC/CI/CD pipelines (Chef, Jenkins, Groovy, Splunk, Dynatrace, Domo); achieved 99.99% uptime.',
      tags: ['sre', 'devops', 'infrastructure', 'automation', 'operations'],
    },
    {
      text: 'Primary on-call engineer with <5min response SLA; resolved 1,000+ production incidents annually.',
      tags: ['sre', 'operations'],
    },
    {
      text: 'Engineered Python-based terminal platform & VSCode toolkit for Tomcat monitoring, deployment validation, & service control.',
      tags: ['sre', 'devops', 'automation', 'development', 'infrastructure'],
    },
    {
      text: 'First in operations to detect active exploitation of Log4Shell (CVE-2021-44228) across production payment infrastructure.',
      tags: ['sre', 'devops', 'operations', 'security'],
    },
  ];
  cons.achievements = newAchievements;
  console.log(`Mastercard consolidated: ${newAchievements.length} achievements (2 visible for nonprofit, 5 for SRE).`);

  // ── Skills: build a new ordered skills object ────────────────────────
  const oldSkills: Record<string, Skill[]> = content.skills || {};
  const oldSkillsTags: Record<string, string[]> = content.skills_tags || {};

  // Remove CiviCRM from Community & Program Operations
  if (oldSkills['Community & Program Operations']) {
    oldSkills['Community & Program Operations'] = oldSkills['Community & Program Operations'].filter(
      (s) => (typeof s === 'string' ? s !== 'CiviCRM' : s.name !== 'CiviCRM'),
    );
  }
  // Remove Salesforce from Systems & Automation
  if (oldSkills['Systems & Automation']) {
    oldSkills['Systems & Automation'] = oldSkills['Systems & Automation'].filter(
      (s) => (typeof s === 'string' ? s !== 'Salesforce' : s.name !== 'Salesforce'),
    );
  }
  // Remove Domo from Observability (kept in Data, Reporting & Analysis)
  if (oldSkills['Observability']) {
    oldSkills['Observability'] = oldSkills['Observability'].filter(
      (s) => (typeof s === 'string' ? s !== 'Domo' : s.name !== 'Domo'),
    );
  }
  // Remove R from Development (kept in Data, Reporting & Analysis)
  if (oldSkills['Development']) {
    oldSkills['Development'] = oldSkills['Development'].filter(
      (s) => (typeof s === 'string' ? s !== 'R' : s.name !== 'R'),
    );
  }

  // Tag scrubs
  scrubCategory(oldSkills, 'Databases', ['data'], [
    'Kafka', 'RabbitMQ', 'Redis', 'IBMMQ', 'Elasticsearch', 'MongoDB', 'CouchDB',
  ]);
  scrubCategory(oldSkills, 'Development', ['data', 'research', 'evaluation'], ['Python']);
  scrubCategory(oldSkills, 'Documentation', ['leadership', 'community'], [
    'Atlassian Suite', 'Confluence', 'Jira', 'Agile',
  ]);
  scrubCategory(oldSkills, 'Observability', ['data', 'reporting', 'visualization'], [
    'Grafana', 'Prometheus', 'Splunk', 'Dynatrace', 'Datadog',
  ]);
  scrubCategory(oldSkills, 'Incident Management', ['evaluation', 'leadership', 'data', 'reporting'], [
    'Incident Postmortems', 'Root Cause Analysis', 'Runbook Development',
    'Escalation Management', 'SLO/SLI', 'Alerting',
  ]);
  scrubCategory(oldSkills, 'Systems & Automation', ['leadership', 'community'], [
    'Process Documentation & Training', 'Jira',
  ]);
  scrubCategory(oldSkills, 'Infrastructure & Self-Hosting', ['data'], [
    'ZFS Storage', 'CouchDB',
  ]);

  // New CRM category at top
  const crmCategory: Skill[] = [
    { name: 'CiviCRM (Soup House)', tags: ['community', 'nonprofit', 'organizing', 'data', 'reporting'] },
    { name: 'Salesforce', tags: ['community', 'nonprofit', 'organizing', 'data', 'reporting'] },
  ];

  // Rebuild skills with CRM first, preserving rest in original order
  const newSkills: Record<string, Skill[]> = {
    'Donor & CRM Systems': crmCategory,
    ...oldSkills,
  };
  content.skills = newSkills;

  // skills_tags fallback for new category
  const newSkillsTags: Record<string, string[]> = {
    'Donor & CRM Systems': ['community', 'nonprofit', 'organizing', 'data', 'reporting'],
    ...oldSkillsTags,
  };
  content.skills_tags = newSkillsTags;

  console.log('Skills rebuilt with Donor & CRM Systems at top.');

  await sql`
    update resumes
    set content = ${JSON.stringify(content)}::jsonb, updated_at = now()
    where slug = ${SLUG}
  `;
  console.log('Saved.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
