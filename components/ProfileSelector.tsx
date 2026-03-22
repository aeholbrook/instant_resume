'use client';

import { useRouter } from 'next/navigation';
import type { ProfileInfo } from '@/lib/profile-filter';

export default function ProfileSelector({
  profiles,
  currentProfile,
}: {
  profiles: ProfileInfo[];
  currentProfile?: string;
}) {
  const router = useRouter();

  if (!profiles.length) return null;

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value;
    if (value === '') {
      router.push('/');
    } else {
      router.push(`/profile/${value}`);
    }
  }

  return (
    <div className="profile-selector">
      <label htmlFor="profile-select" className="profile-label">
        View as:
      </label>
      <select
        id="profile-select"
        value={currentProfile ?? ''}
        onChange={handleChange}
        className="profile-dropdown"
      >
        <option value="">Full Resume</option>
        {profiles.map((p) => (
          <option key={p.name} value={p.name}>
            {p.label}
          </option>
        ))}
      </select>
    </div>
  );
}
