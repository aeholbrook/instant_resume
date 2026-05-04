export type Skill = {
  name: string;
  tags?: string[];
};

/** A skill can be a structured object (with its own tags) or a plain string
 *  (which inherits its category's tags from skills_tags). */
export type SkillInput = string | Skill;

export function getSkillName(s: SkillInput): string {
  return typeof s === 'string' ? s : s.name;
}

/** Returns the skill's own tags, or undefined if it is a plain string. */
export function getSkillOwnTags(s: SkillInput): string[] | undefined {
  return typeof s === 'string' ? undefined : s.tags;
}
