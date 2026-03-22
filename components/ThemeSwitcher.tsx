'use client';

import type { ResumeData } from '@/lib/resume';
import { useEffect, useMemo, useState } from 'react';
import styles from './ThemeSwitcher.module.css';
import ClassicResumeStack from '@/components/resume/ClassicResumeStack';

type ThemeOption = 'classic' | 'terminal';

function buildTerminalScript(data: ResumeData): string[] {
  const contact = data.contact || { name: 'Unknown' };
  const summary = (data.summary || 'No summary loaded').replace(/\s+/g, ' ').trim();
  const summarySnippet = summary.length > 90 ? `${summary.slice(0, 90)}...` : summary;
  const experienceLines = (data.employment || [])
    .slice(0, 4)
    .map((role) => `  - ${role.title} | ${role.company}`);
  const skillLines = Object.entries(data.skills || {})
    .slice(0, 3)
    .map(([group, skills]) => `  - ${group}: ${skills.slice(0, 3).join(', ')}`);

  return [
    'boot> initializing MU/TH/UR interface... done',
    'boot> loading resume matrix... done',
    `scan> parsing identity: ${contact.name}`,
    `scan> parsing focus: ${summarySnippet}`,
    'scan> building experience stack...',
    ...experienceLines,
    'scan> compiling core skills...',
    ...skillLines,
    'resume> ready for review',
  ];
}

function TerminalTheme({ data }: { data: ResumeData }) {
  const contact = data.contact || { name: 'Unknown' };
  const script = useMemo(() => buildTerminalScript(data), [data]);
  const [lines, setLines] = useState<string[]>([]);
  const [cursorText, setCursorText] = useState('');

  useEffect(() => {
    setLines([]);
    setCursorText('');
    let lineIndex = 0;
    let charIndex = 0;
    let working = '';

    const interval = setInterval(() => {
      if (lineIndex >= script.length) {
        setCursorText('system> awaiting command');
        return;
      }

      const target = script[lineIndex];
      working += target.charAt(charIndex);
      setCursorText(working);
      charIndex += 1;

      if (charIndex >= target.length) {
        setLines((prev) => [...prev, target]);
        working = '';
        charIndex = 0;
        lineIndex += 1;
      }
    }, 18);

    return () => clearInterval(interval);
  }, [script]);

  return (
    <div className={styles.terminalRoot}>
      <div className={styles.terminalShell}>
        <div className={styles.scanline} />
        <header className={styles.terminalTopbar}>
          <div className={`${styles.terminalTitle} ${styles.glitch}`} data-text="MU/TH/UR 6000 SYSTEMS">
            MU/TH/UR 6000 SYSTEMS
          </div>
          <div className={styles.terminalStatus}>WY-LINK ACTIVE</div>
          <div className={styles.terminalStatus}>SECURITY: GREEN</div>
        </header>

        <div className={styles.terminalGrid}>
          <section className={styles.panel}>
            <h3>Directive</h3>
            <ul>
              <li>Profile: {contact.name}</li>
              <li>Location: {contact.location || 'Unknown'}</li>
              <li>Priority: Crew</li>
              <li>Mode: Survey</li>
            </ul>
          </section>

          <section className={`${styles.panel} ${styles.terminalLog}`}>
            <h3>Log Stream</h3>
            {lines.map((line, index) => (
              <span className={styles.logLine} key={`${index}-${line}`}>
                <span className={styles.prompt}>$</span> {line}
              </span>
            ))}
          </section>

          <section className={styles.panel}>
            <h3>Ship Status</h3>
            <div className={styles.statusGrid}>
              <div className={styles.statusRow}>
                <span>Core Temp</span>
                <span>291K</span>
              </div>
              <div className={styles.statusRow}>
                <span>Uplink</span>
                <span>Stable</span>
              </div>
              <div className={styles.statusRow}>
                <span>Security</span>
                <span>Locked</span>
              </div>
              <div className={styles.statusRow}>
                <span>Experience</span>
                <span>{(data.employment || []).length}</span>
              </div>
              <div className={styles.statusRow}>
                <span>Projects</span>
                <span>{(data.projects || []).length}</span>
              </div>
            </div>
          </section>

          <section className={styles.panel}>
            <h3>Nav Array</h3>
            <ul>
              <li>Route: LV-426 Tracking</li>
              <li>Course: 038.2</li>
              <li>Drift: 0.03</li>
              <li>Gravity: Nominal</li>
            </ul>
          </section>

          <section className={styles.panel}>
            <h3>Mission Dossier</h3>
            <ul>
              <li>Ident: AEH-2210</li>
              <li>Role: OPS / EVAL</li>
              <li>Skillsets: {Object.keys(data.skills || {}).length}</li>
              <li>State: Ready</li>
            </ul>
          </section>

          <section className={styles.panel}>
            <h3>Activity</h3>
            <ul>
              <li>Log lines: {lines.length}</li>
              <li>Education: {(data.education || []).length}</li>
              <li>Alerts: 0</li>
              <li>Trace: Clean</li>
            </ul>
          </section>

          <section className={`${styles.panel} ${styles.commandPanel}`}>
            <h3>Command Input</h3>
            <div className={styles.commandLine}>
              <span className={styles.prompt}>$</span>
              <span>{cursorText}</span>
              <span className={styles.cursor} />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default function ThemeSwitcher({ data }: { data: ResumeData }) {
  const [theme, setTheme] = useState<ThemeOption>('classic');

  return (
    <div className={styles.page}>
      <div className={styles.themeBar}>
        <label className={styles.themeField} htmlFor="theme-select">
          Theme
          <select
            id="theme-select"
            className={styles.themeSelect}
            value={theme}
            onChange={(event) => setTheme(event.target.value as ThemeOption)}
          >
            <option value="classic">Resume (Module Stack)</option>
            <option value="terminal">MU/TH/UR Terminal</option>
          </select>
        </label>
      </div>
      {theme === 'classic' ? <ClassicResumeStack data={data} /> : <TerminalTheme data={data} />}
    </div>
  );
}
