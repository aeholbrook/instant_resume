/**
 * Shared auth helpers using Web Crypto API (Edge-compatible).
 */

const COOKIE_NAME = 'editor_session';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export { COOKIE_NAME, COOKIE_MAX_AGE };

async function hmacHex(secret: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(message));
  return Array.from(new Uint8Array(sig))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function signToken(password: string): Promise<string> {
  const secret = process.env.EDITOR_PASSWORD || '';
  return hmacHex(secret, password);
}

export async function verifyToken(token: string): Promise<boolean> {
  const secret = process.env.EDITOR_PASSWORD;
  if (!secret) return true;
  const expected = await hmacHex(secret, secret);
  return token === expected;
}
