'use client';

import { useEffect, useMemo, useState } from 'react';
import './terminal.css';

const SCRIPT = [
  'boot> initializing MU/TH/UR interface... done',
  'boot> loading resume matrix... done',
  'scan> parsing identity: Adam E. Holbrook',
  'scan> parsing focus: data, evaluation, community operations',
  'scan> building experience stack...',
  '  - Volunteer Community Organizer | Local LGBTQ+ Mutual Aid Network',
  '  - Founder & Facilitator | Yes, Chef Mutual Aid Network',
  '  - Senior Business Operations Engineer | Mastercard',
  'scan> compiling core skills...',
  '  - Program evaluation, needs assessment, survey design',
  '  - Data reporting, dashboards, operational monitoring',
  'resume> ready for review'
];

export default function TerminalPage() {
  const [lines, setLines] = useState<string[]>([]);
  const [cursor, setCursor] = useState('');
  const script = useMemo(() => SCRIPT, []);

  useEffect(() => {
    let index = 0;
    let charIndex = 0;
    let current = '';

    const interval = setInterval(() => {
      if (index >= script.length) {
        setCursor('');
        return;
      }

      const target = script[index];
      current += target.charAt(charIndex);
      setCursor(current);
      charIndex += 1;

      if (charIndex >= target.length) {
        setLines((prev) => [...prev, target]);
        current = '';
        charIndex = 0;
        index += 1;
      }
    }, 22);

    return () => clearInterval(interval);
  }, [script]);

  return (
    <div className="terminal-root">
      <div className="terminal-shell">
        <div className="scanline" />
        <header className="terminal-topbar">
          <div className="terminal-title glitch" data-text="MU/TH/UR 6000 SYSTEMS">
            MU/TH/UR 6000 SYSTEMS
          </div>
          <div className="terminal-status">WY-LINK ACTIVE</div>
          <div className="terminal-status">SECURITY: GREEN</div>
        </header>

        <div className="terminal-grid">
          <section className="panel">
            <h3>DIRECTIVE</h3>
            <ul>
              <li>Special Order 937</li>
              <li>Containment: ACTIVE</li>
              <li>Priority: CREW</li>
              <li>Mode: SURVEY</li>
            </ul>
          </section>

          <section className="panel terminal-log">
            <h3>LOG STREAM</h3>
            {lines.map((line) => (
              <span className="log-line" key={line}>
                <span className="prompt">$</span> {line}
              </span>
            ))}
          </section>

          <section className="panel">
            <h3>SHIP STATUS</h3>
            <div className="status-grid">
              <div className="status-row">
                <span>CORE TEMP</span>
                <span>291K</span>
              </div>
              <div className="status-row">
                <span>UPLINK</span>
                <span>STABLE</span>
              </div>
              <div className="status-row">
                <span>SECURITY</span>
                <span>LOCKED</span>
              </div>
              <div className="status-row">
                <span>CREW</span>
                <span>6 ACTIVE</span>
              </div>
              <div className="status-row">
                <span>DATA BANK</span>
                <span>SYNC</span>
              </div>
            </div>
          </section>

          <section className="panel">
            <h3>NAV ARRAY</h3>
            <ul>
              <li>LV-426 TRACKING</li>
              <li>COURSE: 038.2</li>
              <li>DRIFT: 0.03</li>
              <li>GRAVITY: NOMINAL</li>
            </ul>
          </section>

          <section className="panel">
            <h3>MISSION DOSSIER</h3>
            <ul>
              <li>IDENT: AEH-2210</li>
              <li>ROLE: OPS / EVAL</li>
              <li>SKILLSET: DATA OPS</li>
              <li>STATE: READY</li>
            </ul>
          </section>

          <section className="panel">
            <h3>ACTIVITY</h3>
            <ul>
              <li>LOGS: 48</li>
              <li>EVENTS: 12</li>
              <li>ALERTS: 0</li>
              <li>TRACE: CLEAN</li>
            </ul>
          </section>

          <section className="panel command-panel">
            <h3>COMMAND INPUT</h3>
            <div className="command-line">
              <span className="prompt">$</span>
              <span>{cursor}</span>
              <span className="cursor" />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
