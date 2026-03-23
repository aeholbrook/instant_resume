import fs from 'node:fs/promises';
import path from 'node:path';
import yaml from 'yaml';
import { getResume } from './db';

export type ProfileDef = {
  label?: string;
  tags?: string[];
  summary?: string;
  section_order?: string[];
  limits?: {
    max_jobs?: number;
    max_achievements?: number;
    max_projects?: number;
    max_education?: number;
  };
};

export type Achievement = {
  text: string;
  tags?: string[];
  priority?: number; // lower = higher priority (1 is top). Unset = lowest priority.
};

/** An achievement can be a structured object or a legacy plain string */
export type AchievementInput = string | Achievement;

export type ResumeData = {
  section_titles?: Record<string, string>;
  layout?: {
    modules?: string[];
  };
  resume_modules?: string[];
  contact: {
    name: string;
    email?: string;
    phone?: string;
    location?: string;
    linkedin?: string;
    github?: string;
    photo?: string;
    photo_size?: number;       // width in px (default 150)
    photo_position?: 'left' | 'right'; // default 'left'
    websites?: Array<{ label: string; url: string }>;
  };
  summary?: string;
  employment?: Array<{
    title: string;
    company: string;
    location?: string;
    dates?: string;
    summary?: string;
    achievements?: AchievementInput[];
    tags?: string[];
  }>;
  education?: Array<{
    degree: string;
    dates?: string;
    details?: string;
    achievements?: AchievementInput[];
    tags?: string[];
  }>;
  projects?: Array<{
    name: string;
    description?: string;
    url?: string;
    type?: string;
    tags?: string[];
  }>;
  skills?: Record<string, string[]>;
  profiles?: Record<string, ProfileDef>;
  skills_tags?: Record<string, string[]>;
};

async function loadYamlResume(): Promise<ResumeData> {
  const filePath = path.join(process.cwd(), 'projects', 'default', 'content.yaml');
  const content = await fs.readFile(filePath, 'utf-8');
  return yaml.parse(content) as ResumeData;
}

/** Load raw resume data (unfiltered, includes profiles metadata) */
export async function getRawResumeData(): Promise<ResumeData> {
  try {
    const dbData = await getResume();
    if (dbData) return dbData;
  } catch (error) {
    console.warn('Failed to load resume from database, falling back to YAML.', error);
  }

  return loadYamlResume();
}

/** Load resume data, optionally filtered by profile */
export async function getResumeData(profile?: string): Promise<ResumeData> {
  const { filterContent } = await import('./profile-filter');
  const raw = await getRawResumeData();
  return filterContent(raw, profile);
}
