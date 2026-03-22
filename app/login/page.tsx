'use client';

import { useState, FormEvent, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function LoginForm() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (!res.ok) {
        setError('Invalid password');
        setLoading(false);
        return;
      }

      const from = searchParams.get('from') || '/editor';
      router.push(from);
    } catch {
      setError('Something went wrong');
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{
      background: '#fff',
      padding: '2rem',
      borderRadius: '8px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      width: '320px',
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem',
    }}>
      <h1 style={{ margin: 0, fontSize: '1.25rem', textAlign: 'center' }}>Editor Login</h1>
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        autoFocus
        style={{
          padding: '0.6rem 0.8rem',
          border: '1px solid #ccc',
          borderRadius: '4px',
          fontSize: '1rem',
        }}
      />
      {error && <p style={{ color: '#c00', margin: 0, fontSize: '0.875rem' }}>{error}</p>}
      <button
        type="submit"
        disabled={loading || !password}
        style={{
          padding: '0.6rem',
          background: '#922D3E',
          color: '#fff',
          border: 'none',
          borderRadius: '4px',
          fontSize: '1rem',
          cursor: loading ? 'wait' : 'pointer',
          opacity: loading || !password ? 0.6 : 1,
        }}
      >
        {loading ? 'Signing in...' : 'Sign in'}
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: '#f5f5f5',
      fontFamily: 'system-ui, sans-serif',
    }}>
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  );
}
