#!/usr/bin/env python3
"""
Profile-based content filtering for resume generation.

Filters resume content from content.yaml based on tag-matching profiles.
Used by both generate_latex_from_yaml.py and generate_docx_from_yaml.py
to produce role-targeted resumes from a single source of truth.

Filtering rules:
  - No profile selected → all content returned unchanged
  - Entry has no `tags` → always included
  - Entry has `tags` → included if ANY tag matches the profile's tag list
  - Achievement has no inline #hashtags → included when parent entry is included
  - Achievement has inline #hashtags → included if ANY hashtag matches profile tags
  - Limits applied after filtering (first N items kept, YAML order = priority)
  - All #hashtags stripped from output text
"""

import copy
import re
from typing import Optional

# Matches inline #hashtags like "#data" or "#community-ops"
_HASHTAG_RE = re.compile(r'\s*#([a-zA-Z][\w-]*)')


def strip_hashtags(text: str) -> str:
    """Remove inline #hashtag tokens from text."""
    return _HASHTAG_RE.sub('', text).rstrip()


def extract_hashtags(text: str) -> set[str]:
    """Extract the set of hashtag names from text (without the # prefix)."""
    return set(_HASHTAG_RE.findall(text))


def get_available_profiles(content: dict) -> list[dict]:
    """Return list of {name, label} for all defined profiles."""
    profiles = content.get('profiles', {})
    return [
        {'name': name, 'label': prof.get('label', name)}
        for name, prof in profiles.items()
    ]


def _tags_match(entry_tags: list | None, profile_tags: set) -> bool:
    """Check if an entry should be included based on its tags."""
    if not entry_tags:
        return True  # untagged = always included
    return bool(set(entry_tags) & profile_tags)


def _filter_achievements(achievements: list[str], profile_tags: set, max_achievements: int | None) -> list[str]:
    """Filter and strip achievements based on inline hashtags and limits."""
    filtered = []
    for achievement in achievements:
        hashtags = extract_hashtags(achievement)
        if not hashtags or hashtags & profile_tags:
            filtered.append(strip_hashtags(achievement))
    if max_achievements is not None:
        filtered = filtered[:max_achievements]
    return filtered


def _filter_entries(entries: list[dict], profile_tags: set, max_entries: int | None,
                    max_achievements: int | None = None) -> list[dict]:
    """Filter a list of entries (employment, education, projects) by tags and limits."""
    filtered = []
    for entry in entries:
        if not _tags_match(entry.get('tags'), profile_tags):
            continue
        entry = copy.deepcopy(entry)
        # Filter achievements if present
        if 'achievements' in entry and max_achievements is not None:
            entry['achievements'] = _filter_achievements(
                entry['achievements'], profile_tags, max_achievements
            )
        elif 'achievements' in entry:
            # Still need to strip hashtags even without a limit
            entry['achievements'] = [strip_hashtags(a) for a in entry['achievements']
                                     if not extract_hashtags(a) or extract_hashtags(a) & profile_tags]
        # Remove the tags key from output
        entry.pop('tags', None)
        filtered.append(entry)
    if max_entries is not None:
        filtered = filtered[:max_entries]
    return filtered


def _filter_skills(skills: dict, skills_tags: dict, profile_tags: set) -> dict:
    """Filter skills categories based on skills_tags mapping."""
    if not skills_tags:
        return skills
    filtered = {}
    for category, skill_list in skills.items():
        category_tags = skills_tags.get(category)
        if category_tags is None or set(category_tags) & profile_tags:
            filtered[category] = skill_list
    return filtered


def filter_content(content: dict, profile_name: Optional[str] = None) -> dict:
    """
    Apply profile-based filtering to resume content.

    Args:
        content: Full resume content dict (from YAML)
        profile_name: Name of the profile to apply, or None for no filtering

    Returns:
        Filtered content dict ready for generation
    """
    profiles = content.get('profiles', {})
    skills_tags = content.get('skills_tags', {})

    # Start with a shallow copy
    result = dict(content)

    # Always clean metadata keys from output
    result.pop('profiles', None)
    result.pop('skills_tags', None)

    # No profile → strip hashtags from achievements but return everything
    if not profile_name or profile_name not in profiles:
        # Still strip any hashtags from achievement text
        for section in ('employment', 'education', 'projects'):
            entries = result.get(section, [])
            cleaned = []
            for entry in entries:
                entry = copy.deepcopy(entry)
                if 'achievements' in entry:
                    entry['achievements'] = [strip_hashtags(a) for a in entry['achievements']]
                entry.pop('tags', None)
                cleaned.append(entry)
            result[section] = cleaned
        return result

    profile = profiles[profile_name]
    profile_tags = set(profile.get('tags', []))
    limits = profile.get('limits', {})

    # Replace summary if profile provides one
    if 'summary' in profile:
        result['summary'] = profile['summary']

    # Filter employment
    result['employment'] = _filter_entries(
        content.get('employment', []),
        profile_tags,
        limits.get('max_jobs'),
        limits.get('max_achievements'),
    )

    # Filter education
    result['education'] = _filter_entries(
        content.get('education', []),
        profile_tags,
        limits.get('max_education'),
    )

    # Filter projects
    result['projects'] = _filter_entries(
        content.get('projects', []),
        profile_tags,
        limits.get('max_projects'),
    )

    # Filter skills
    if 'skills' in content:
        result['skills'] = _filter_skills(content['skills'], skills_tags, profile_tags)

    # Set section order from profile
    if 'section_order' in profile:
        result['resume_modules'] = profile['section_order']

    return result
