/**
 * Profile-based content filtering for resume display.
 *
 * Rules:
 *   - No profile → all content, achievements converted to plain strings
 *   - Untagged entries always included
 *   - Tagged entries included if ANY tag matches profile
 *   - Achievement tags filter at fine grain, priority sorts within filtered set
 *   - Limits truncate after filtering + sorting
 */

import type { ResumeData, AchievementInput, Achievement } from './resume';

// ── Legacy hashtag support (for plain string achievements) ──────────

const HASHTAG_RE = /\s*#([a-zA-Z][\w-]*)/g;

export function stripHashtags(text: string): string {
  return text.replace(HASHTAG_RE, '').trimEnd();
}

function extractHashtags(text: string): Set<string> {
  const tags = new Set<string>();
  let match;
  const re = /\s*#([a-zA-Z][\w-]*)/g;
  while ((match = re.exec(text)) !== null) {
    tags.add(match[1]);
  }
  return tags;
}

// ── Achievement helpers ─────────────────────────────────────────────

/** Normalize a mixed achievement to structured form */
function normalizeAchievement(a: AchievementInput): Achievement {
  if (typeof a === 'string') {
    const tags = Array.from(extractHashtags(a));
    return { text: stripHashtags(a), tags: tags.length > 0 ? tags : undefined };
  }
  return a;
}

/** Get tags from any achievement format */
function getAchievementTags(a: AchievementInput): string[] {
  if (typeof a === 'string') return Array.from(extractHashtags(a));
  return a.tags || [];
}

/** Get display text from any achievement format */
function getAchievementText(a: AchievementInput): string {
  if (typeof a === 'string') return stripHashtags(a);
  return a.text;
}

/** Get priority (undefined = lowest) */
function getAchievementPriority(a: AchievementInput): number | undefined {
  if (typeof a === 'string') return undefined;
  return a.priority;
}

/**
 * Filter achievements by profile tags, sort by priority, apply limit.
 * Returns plain strings for display.
 */
function filterAchievements(
  achievements: AchievementInput[],
  profileTags: Set<string>,
  maxAchievements?: number,
): string[] {
  // Filter: untagged = included, tagged = any match
  const filtered = achievements.filter((a) => {
    const tags = getAchievementTags(a);
    return tags.length === 0 || tags.some((t) => profileTags.has(t));
  });

  // Sort by priority: lower number first, undefined last, stable within same priority
  filtered.sort((a, b) => {
    const pa = getAchievementPriority(a);
    const pb = getAchievementPriority(b);
    if (pa === undefined && pb === undefined) return 0;
    if (pa === undefined) return 1;
    if (pb === undefined) return -1;
    return pa - pb;
  });

  // Extract text and apply limit
  const texts = filtered.map(getAchievementText);
  return maxAchievements != null ? texts.slice(0, maxAchievements) : texts;
}

/**
 * Convert all achievements to plain strings (no filtering, no sorting).
 * Used when no profile is selected.
 */
function flattenAchievements(achievements: AchievementInput[]): string[] {
  return achievements.map(getAchievementText);
}

// ── Shared helpers ──────────────────────────────────────────────────

function tagsMatch(entryTags: string[] | undefined, profileTags: Set<string>): boolean {
  if (!entryTags || entryTags.length === 0) return true;
  return entryTags.some((t) => profileTags.has(t));
}

/**
 * Resolve entry groups: if any entry in a group matched, pull in the rest of that group.
 * Entries with group_alt point to an alternative group — when the alt group is present,
 * this entry is excluded (they're mutually exclusive representations).
 */
function resolveGroups<T extends { group?: string; group_alt?: string }>(
  allEntries: T[],
  matchedEntries: T[],
): T[] {
  // Collect groups that matched
  const matchedGroups = new Set<string>();
  for (const e of matchedEntries) {
    if (e.group) matchedGroups.add(e.group);
  }

  // If no groups matched, nothing to resolve
  if (matchedGroups.size === 0) return matchedEntries;

  // Pull in unmatched entries whose group was matched
  const result = [...matchedEntries];
  const matchedSet = new Set(matchedEntries);
  for (const e of allEntries) {
    if (!matchedSet.has(e) && e.group && matchedGroups.has(e.group)) {
      result.push(e);
    }
  }

  // Remove entries whose group_alt is present (mutually exclusive)
  return result.filter((e) => {
    if (!e.group_alt) return true;
    return !matchedGroups.has(e.group_alt);
  });
}

export type ProfileInfo = {
  name: string;
  label: string;
};

export function getAvailableProfiles(content: ResumeData): ProfileInfo[] {
  const profiles = content.profiles ?? {};
  return Object.entries(profiles).map(([name, prof]) => ({
    name,
    label: prof.label ?? name,
  }));
}

// ── Normalize for editor use ────────────────────────────────────────

/** Convert all achievements in a ResumeData to structured Achievement objects */
export function normalizeAllAchievements(data: ResumeData): ResumeData {
  const result = { ...data };
  if (result.employment) {
    result.employment = result.employment.map((e) => ({
      ...e,
      achievements: e.achievements?.map(normalizeAchievement),
    }));
  }
  if (result.education) {
    result.education = result.education.map((e) => ({
      ...e,
      achievements: e.achievements?.map(normalizeAchievement),
    }));
  }
  return result;
}

// ── Filter by raw tags (AI matching) ────────────────────────────────

export function filterByTags(content: ResumeData, tags: string[]): ResumeData {
  const profileTags = new Set(tags);
  const result: ResumeData = { ...content };
  delete result.profiles;
  delete result.skills_tags;

  if (content.employment) {
    const matched = content.employment.filter((e) => tagsMatch(e.tags, profileTags));
    const resolved = resolveGroups(content.employment, matched);
    result.employment = resolved.map((e) => {
      const cleaned = { ...e };
      delete cleaned.tags;
      delete cleaned.group;
      delete cleaned.group_alt;
      if (cleaned.achievements) {
        cleaned.achievements = filterAchievements(cleaned.achievements, profileTags);
      }
      return cleaned;
    });
  }

  if (content.education) {
    const matched = content.education.filter((e) => tagsMatch(e.tags, profileTags));
    const resolved = resolveGroups(content.education, matched);
    result.education = resolved.map((e) => {
      const cleaned = { ...e };
      delete cleaned.tags;
      delete cleaned.group;
      delete cleaned.group_alt;
      if (cleaned.achievements) {
        cleaned.achievements = filterAchievements(cleaned.achievements, profileTags);
      }
      return cleaned;
    });
  }

  if (content.projects) {
    result.projects = content.projects
      .filter((p) => tagsMatch(p.tags, profileTags))
      .map((p) => {
        const cleaned = { ...p };
        delete cleaned.tags;
        return cleaned;
      });
  }

  const skillsTags = content.skills_tags ?? {};
  if (content.skills && Object.keys(skillsTags).length > 0) {
    const filteredSkills: Record<string, string[]> = {};
    for (const [category, skillList] of Object.entries(content.skills)) {
      const catTags = skillsTags[category];
      if (!catTags || catTags.some((t: string) => profileTags.has(t))) {
        filteredSkills[category] = skillList;
      }
    }
    result.skills = filteredSkills;
  }

  return result;
}

// ── Filter by named profile ─────────────────────────────────────────

export function filterContent(content: ResumeData, profileName?: string): ResumeData {
  const profiles = content.profiles ?? {};
  const skillsTags = content.skills_tags ?? {};

  const result: ResumeData = { ...content };
  delete result.profiles;
  delete result.skills_tags;

  // No profile → flatten achievements to strings, remove tags, return everything
  // Show detailed group entries, hide summary alternates (group_alt entries)
  if (!profileName || !(profileName in profiles)) {
    for (const section of ['employment', 'education'] as const) {
      const entries = result[section];
      if (!entries) continue;
      (result as any)[section] = entries
        .filter((entry: any) => !entry.group_alt)
        .map((entry: any) => {
          const cleaned = { ...entry };
          delete cleaned.tags;
          delete cleaned.group;
          delete cleaned.group_alt;
          if (cleaned.achievements) {
            cleaned.achievements = flattenAchievements(cleaned.achievements);
          }
          return cleaned;
        });
    }
    if (result.projects) {
      result.projects = result.projects.map((p) => {
        const cleaned = { ...p };
        delete cleaned.tags;
        return cleaned;
      });
    }
    return result;
  }

  const profile = profiles[profileName];
  const profileTags = new Set(profile.tags ?? []);
  const limits = profile.limits ?? {};

  if (profile.summary) {
    result.summary = profile.summary;
  }

  // Filter employment
  if (content.employment) {
    const matched = content.employment.filter((e) => tagsMatch(e.tags, profileTags));
    const resolved = resolveGroups(content.employment, matched);
    let filtered = resolved.map((e) => {
      const cleaned = { ...e };
      delete cleaned.tags;
      delete cleaned.group;
      delete cleaned.group_alt;
      if (cleaned.achievements) {
        cleaned.achievements = filterAchievements(
          cleaned.achievements,
          profileTags,
          limits.max_achievements,
        );
      }
      return cleaned;
    });
    if (limits.max_jobs != null) filtered = filtered.slice(0, limits.max_jobs);
    result.employment = filtered;
  }

  // Filter education
  if (content.education) {
    const matched = content.education.filter((e) => tagsMatch(e.tags, profileTags));
    const resolved = resolveGroups(content.education, matched);
    let filtered = resolved.map((e) => {
      const cleaned = { ...e };
      delete cleaned.tags;
      delete cleaned.group;
      delete cleaned.group_alt;
      if (cleaned.achievements) {
        cleaned.achievements = filterAchievements(cleaned.achievements, profileTags);
      }
      return cleaned;
    });
    if (limits.max_education != null) filtered = filtered.slice(0, limits.max_education);
    result.education = filtered;
  }

  // Filter projects
  if (content.projects) {
    let filtered = content.projects
      .filter((p) => tagsMatch(p.tags, profileTags))
      .map((p) => {
        const cleaned = { ...p };
        delete cleaned.tags;
        return cleaned;
      });
    if (limits.max_projects != null) filtered = filtered.slice(0, limits.max_projects);
    result.projects = filtered;
  }

  // Filter skills
  if (content.skills && Object.keys(skillsTags).length > 0) {
    const filteredSkills: Record<string, string[]> = {};
    for (const [category, skillList] of Object.entries(content.skills)) {
      const catTags = skillsTags[category];
      if (!catTags || catTags.some((t: string) => profileTags.has(t))) {
        filteredSkills[category] = skillList;
      }
    }
    result.skills = filteredSkills;
  }

  // Set section order
  if (profile.section_order) {
    const order = profile.section_order.filter((m: string) => m !== 'header');
    result.resume_modules = ['header', ...order];
  }

  return result;
}
