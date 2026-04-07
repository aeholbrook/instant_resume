'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import ClassicResumeStack from '@/components/resume/ClassicResumeStack';
import type { ResumeTheme } from '@/components/resume/ClassicResumeStack';
import ResumeActions from '@/components/ResumeActions';

const THEMES: { value: ResumeTheme; label: string }[] = [
  { value: 'modern', label: 'Modern' },
  { value: 'classic', label: 'Classic' },
  { value: 'card', label: 'Card' },
  { value: 'dark', label: 'Dark' },
  { value: 'lcars', label: 'LCARS' },
];
import { filterContent, filterByTags } from '@/lib/profile-filter';
import type { ResumeData } from '@/lib/resume';
import type { ProfileInfo } from '@/lib/profile-filter';

type Props = {
  rawData: ResumeData;
  profiles: ProfileInfo[];
  initialProfile?: string;
};

/* ── Quick-pick roles shown on landing ─────────────────────────── */

const QUICK_PICKS = [
  { label: 'Site Reliability Engineer', role: 'Site Reliability Engineer' },
  { label: 'Data Analyst', role: 'Data Analyst' },
  { label: 'Research Analyst', role: 'Research Analyst Program Evaluation' },
  { label: 'Visual Designer', role: 'Visual Designer' },
  { label: 'Photographer', role: 'Photographer Visual Storyteller' },
  { label: 'Community Organizer', role: 'Community Organizer Nonprofit' },
];

/* ── Landing screen ─────────────────────────────────────────────── */

function LandingScreen({
  contactName,
  onSubmitRole,
  onSkip,
}: {
  contactName: string;
  onSubmitRole: (role: string, description?: string) => void;
  onSkip: () => void;
}) {
  const [role, setRole] = useState('');
  const [description, setDescription] = useState('');

  return (
    <div className="landing">
      <div className="landing-card">
        <h1 className="landing-name">{contactName}</h1>
        <p className="landing-subtitle">Interactive Resume</p>
        <p className="landing-blurb">
          This resume adapts to the role you're hiring for. Enter a job title below or pick a focus to see the most relevant experience.
        </p>

        <div className="landing-input-group">
          <input
            type="text"
            className="landing-input"
            placeholder="What role are you hiring for?"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && role.trim()) onSubmitRole(role.trim(), description.trim() || undefined);
            }}
            autoFocus
          />
          <textarea
            className="landing-textarea"
            placeholder="Paste job description for better matching (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
          />
          <button
            className="landing-btn landing-btn--primary"
            onClick={() => onSubmitRole(role.trim(), description.trim() || undefined)}
            disabled={!role.trim()}
          >
            Tailor Resume
          </button>
        </div>

        <div className="landing-divider">
          <span>or pick a focus</span>
        </div>

        <div className="landing-picks">
          {QUICK_PICKS.map((pick) => (
            <button
              key={pick.role}
              className="landing-pick-btn"
              onClick={() => onSubmitRole(pick.role)}
            >
              {pick.label}
            </button>
          ))}
        </div>

        <button className="landing-pick-btn landing-pick-btn--ghost" onClick={onSkip}>
          See Everything
        </button>
      </div>
    </div>
  );
}

/* ── Hamburger menu ─────────────────────────────────────────────── */

function HamburgerMenu({
  profiles,
  selectedProfile,
  matchedTags,
  customRole,
  customDescription,
  matching,
  onProfileChange,
  onCustomRoleChange,
  onCustomDescriptionChange,
  onMatch,
  currentProfile,
  theme,
  onThemeChange,
}: {
  profiles: ProfileInfo[];
  selectedProfile: string;
  matchedTags: string[] | null;
  customRole: string;
  customDescription: string;
  matching: boolean;
  onProfileChange: (name: string) => void;
  onCustomRoleChange: (role: string) => void;
  onCustomDescriptionChange: (desc: string) => void;
  onMatch: () => void;
  currentProfile?: string;
  theme: ResumeTheme;
  onThemeChange: (t: ResumeTheme) => void;
}) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <>
      <button
        className="hamburger-btn"
        onClick={() => setOpen(!open)}
        aria-label="Menu"
      >
        <span className="hamburger-icon">
          <span />
          <span />
          <span />
        </span>
      </button>

      {open && <div className="menu-backdrop" />}

      <div ref={panelRef} className={`menu-panel ${open ? 'menu-panel--open' : ''}`}>
        <button className="menu-close" onClick={() => setOpen(false)} aria-label="Close menu">
          &times;
        </button>

        <div className="sidebar-section">
          <h3 className="sidebar-heading">Profile</h3>
          <div className="profile-radios">
            {profiles.map((p) => (
              <label key={p.name} className="profile-radio">
                <input
                  type="radio"
                  name="profile"
                  value={p.name}
                  checked={selectedProfile === p.name && matchedTags === null}
                  onChange={() => { onProfileChange(p.name); }}
                />
                <span>{p.label}</span>
              </label>
            ))}
            <label className="profile-radio">
              <input
                type="radio"
                name="profile"
                value=""
                checked={selectedProfile === '' && matchedTags === null}
                onChange={() => { onProfileChange(''); }}
              />
              <span>All Experience</span>
            </label>
          </div>
        </div>

        <div className="sidebar-section">
          <h3 className="sidebar-heading">Theme</h3>
          <div className="profile-radios">
            {THEMES.map((t) => (
              <label key={t.value} className="profile-radio">
                <input
                  type="radio"
                  name="theme"
                  value={t.value}
                  checked={theme === t.value}
                  onChange={() => onThemeChange(t.value)}
                />
                <span>{t.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="sidebar-section">
          <h3 className="sidebar-heading">Custom Role</h3>
          <div className="role-input-group">
            <input
              type="text"
              className="role-input"
              placeholder="e.g. Senior Frontend Engineer"
              value={customRole}
              onChange={(e) => onCustomRoleChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') { onMatch(); }
              }}
            />
            <textarea
              className="role-description-input"
              placeholder="Paste job description (optional)"
              value={customDescription}
              onChange={(e) => onCustomDescriptionChange(e.target.value)}
              rows={4}
            />
            <button
              className="role-match-btn"
              onClick={() => { onMatch(); }}
              disabled={matching || !customRole.trim()}
            >
              {matching ? 'Matching...' : 'Match'}
            </button>
          </div>
          {matchedTags && (
            <div className="matched-tags-info">
              Matched {matchedTags.length} tag{matchedTags.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>

        <div className="sidebar-section">
          <h3 className="sidebar-heading">Export</h3>
          <ResumeActions profile={currentProfile} theme={theme} roleLabel={customRole.trim() && matchedTags ? customRole.trim() : profiles.find(p => p.name === selectedProfile)?.label} matchedTags={matchedTags} />
        </div>
      </div>
    </>
  );
}

/* ── Main viewer ────────────────────────────────────────────────── */

export default function ResumeViewer({ rawData, profiles, initialProfile }: Props) {
  // Check URL for persisted role param
  const initialRole = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).get('role') || ''
    : '';
  const hasInitialSelection = !!(initialProfile || initialRole);

  const [showLanding, setShowLanding] = useState(!hasInitialSelection);
  const [selectedProfile, setSelectedProfile] = useState<string>(initialProfile ?? '');
  const [customRole, setCustomRole] = useState(initialRole);
  const [customDescription, setCustomDescription] = useState('');
  const [matching, setMatching] = useState(false);
  const [matchedTags, setMatchedTags] = useState<string[] | null>(null);
  const [theme, setTheme] = useState<ResumeTheme>('modern');

  // Auto-match if we loaded with a role param
  const [didAutoMatch, setDidAutoMatch] = useState(false);
  useEffect(() => {
    if (initialRole && !didAutoMatch) {
      setDidAutoMatch(true);
      setMatching(true);
      fetch('/api/match-tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: initialRole }),
      })
        .then(res => res.ok ? res.json() : null)
        .then(data => { if (data?.tags) { setMatchedTags(data.tags); setSelectedProfile(''); } })
        .catch(() => {})
        .finally(() => setMatching(false));
    }
  }, [initialRole, didAutoMatch]);

  const filteredData = matchedTags
    ? filterByTags(rawData, matchedTags)
    : filterContent(rawData, selectedProfile || undefined);

  // Update page title and URL based on active role/profile
  useEffect(() => {
    const url = new URL(window.location.href);
    if (showLanding) {
      document.title = 'Resume';
      url.searchParams.delete('profile');
      url.searchParams.delete('role');
    } else if (customRole.trim() && matchedTags) {
      document.title = `Resume - ${customRole.trim()}`;
      url.searchParams.delete('profile');
      url.searchParams.set('role', customRole.trim());
    } else if (selectedProfile) {
      const profile = profiles.find(p => p.name === selectedProfile);
      document.title = `Resume - ${profile?.label || selectedProfile}`;
      url.searchParams.set('profile', selectedProfile);
      url.searchParams.delete('role');
    } else {
      document.title = 'Resume';
      url.searchParams.delete('profile');
      url.searchParams.delete('role');
    }
    window.history.replaceState({}, '', url.toString());
  }, [showLanding, customRole, matchedTags, selectedProfile, profiles]);

  const handleProfileChange = useCallback((profileName: string) => {
    setSelectedProfile(profileName);
    setMatchedTags(null);
  }, []);

  const handleMatch = useCallback(async () => {
    if (!customRole.trim()) return;
    setMatching(true);
    try {
      const body: Record<string, string> = { title: customRole.trim() };
      if (customDescription.trim()) body.description = customDescription.trim();
      const res = await fetch('/api/match-tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const data = await res.json();
        setMatchedTags(data.tags || []);
        setSelectedProfile('');
      }
    } catch {
      // silently fail
    } finally {
      setMatching(false);
    }
  }, [customRole, customDescription]);

  const handleLandingSubmit = useCallback(async (role: string, description?: string) => {
    setCustomRole(role);
    setShowLanding(false);
    // Trigger match after switching to resume view
    setMatching(true);
    try {
      const res = await fetch('/api/match-tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: role, description }),
      });
      if (res.ok) {
        const data = await res.json();
        setMatchedTags(data.tags || []);
        setSelectedProfile('');
      }
    } catch {
      // silently fail
    } finally {
      setMatching(false);
    }
  }, []);

  const contactName = rawData.contact?.name || 'Resume';

  if (showLanding) {
    return (
      <LandingScreen
        contactName={contactName}
        onSubmitRole={handleLandingSubmit}
        onSkip={() => setShowLanding(false)}
      />
    );
  }

  const currentProfile = selectedProfile || undefined;

  return (
    <div className="viewer-layout viewer-layout--full">
      <HamburgerMenu
        profiles={profiles}
        selectedProfile={selectedProfile}
        matchedTags={matchedTags}
        customRole={customRole}
        customDescription={customDescription}
        matching={matching}
        onProfileChange={handleProfileChange}
        onCustomRoleChange={setCustomRole}
        onCustomDescriptionChange={setCustomDescription}
        onMatch={handleMatch}
        currentProfile={currentProfile}
        theme={theme}
        onThemeChange={setTheme}
      />

      <div className="viewer-center">
        <ClassicResumeStack
          data={filteredData}
          profiles={profiles}
          currentProfile={currentProfile}
          hideControls
          theme={theme}
        />
      </div>
    </div>
  );
}
