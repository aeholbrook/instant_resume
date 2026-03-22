'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import ClassicResumeStack from '@/components/resume/ClassicResumeStack';
import ResumeActions from '@/components/ResumeActions';
import { filterContent, filterByTags } from '@/lib/profile-filter';
import type { ResumeData } from '@/lib/resume';
import type { ProfileInfo } from '@/lib/profile-filter';

type Props = {
  rawData: ResumeData;
  profiles: ProfileInfo[];
  initialProfile?: string;
};

/* ── Landing screen ─────────────────────────────────────────────── */

function LandingScreen({
  contactName,
  onSubmitRole,
  onSkip,
}: {
  contactName: string;
  onSubmitRole: (role: string) => void;
  onSkip: () => void;
}) {
  const [role, setRole] = useState('');

  return (
    <div className="landing">
      <div className="landing-card">
        <h1 className="landing-name">{contactName}</h1>
        <p className="landing-subtitle">Interactive Resume</p>

        <div className="landing-input-group">
          <input
            type="text"
            className="landing-input"
            placeholder="Enter a job title to tailor this resume..."
            value={role}
            onChange={(e) => setRole(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && role.trim()) onSubmitRole(role.trim());
            }}
            autoFocus
          />
          <button
            className="landing-btn landing-btn--primary"
            onClick={() => onSubmitRole(role.trim())}
            disabled={!role.trim()}
          >
            Tailor Resume
          </button>
        </div>

        <button className="landing-btn landing-btn--ghost" onClick={onSkip}>
          View Full Resume
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
  matching,
  onProfileChange,
  onCustomRoleChange,
  onMatch,
  currentProfile,
}: {
  profiles: ProfileInfo[];
  selectedProfile: string;
  matchedTags: string[] | null;
  customRole: string;
  matching: boolean;
  onProfileChange: (name: string) => void;
  onCustomRoleChange: (role: string) => void;
  onMatch: () => void;
  currentProfile?: string;
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
            <label className="profile-radio">
              <input
                type="radio"
                name="profile"
                value=""
                checked={selectedProfile === '' && matchedTags === null}
                onChange={() => { onProfileChange(''); setOpen(false); }}
              />
              <span>Full Resume</span>
            </label>
            {profiles.map((p) => (
              <label key={p.name} className="profile-radio">
                <input
                  type="radio"
                  name="profile"
                  value={p.name}
                  checked={selectedProfile === p.name && matchedTags === null}
                  onChange={() => { onProfileChange(p.name); setOpen(false); }}
                />
                <span>{p.label}</span>
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
                if (e.key === 'Enter') { onMatch(); setOpen(false); }
              }}
            />
            <button
              className="role-match-btn"
              onClick={() => { onMatch(); setOpen(false); }}
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
          <ResumeActions profile={currentProfile} />
        </div>
      </div>
    </>
  );
}

/* ── Main viewer ────────────────────────────────────────────────── */

export default function ResumeViewer({ rawData, profiles, initialProfile }: Props) {
  const [showLanding, setShowLanding] = useState(!initialProfile);
  const [selectedProfile, setSelectedProfile] = useState<string>(initialProfile ?? '');
  const [customRole, setCustomRole] = useState('');
  const [matching, setMatching] = useState(false);
  const [matchedTags, setMatchedTags] = useState<string[] | null>(null);

  const filteredData = matchedTags
    ? filterByTags(rawData, matchedTags)
    : filterContent(rawData, selectedProfile || undefined);

  const handleProfileChange = useCallback((profileName: string) => {
    setSelectedProfile(profileName);
    setMatchedTags(null);
  }, []);

  const handleMatch = useCallback(async () => {
    if (!customRole.trim()) return;
    setMatching(true);
    try {
      const res = await fetch('/api/match-tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: customRole.trim() }),
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
  }, [customRole]);

  const handleLandingSubmit = useCallback(async (role: string) => {
    setCustomRole(role);
    setShowLanding(false);
    // Trigger match after switching to resume view
    setMatching(true);
    try {
      const res = await fetch('/api/match-tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: role }),
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
        matching={matching}
        onProfileChange={handleProfileChange}
        onCustomRoleChange={setCustomRole}
        onMatch={handleMatch}
        currentProfile={currentProfile}
      />

      <div className="viewer-center">
        <ClassicResumeStack
          data={filteredData}
          profiles={profiles}
          currentProfile={currentProfile}
          hideControls
        />
      </div>
    </div>
  );
}
