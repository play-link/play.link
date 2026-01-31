/**
 * HMAC-based unsubscribe token generation and verification.
 * Tokens encode gameId + email and are signed with SUPABASE_SERVICE_ROLE_KEY.
 */

export async function generateUnsubscribeToken(
  secret: string,
  gameId: string,
  email: string,
): Promise<string> {
  const payload = `${gameId}:${email}`;
  const key = await importKey(secret);
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(payload),
  );
  const sig = bufferToHex(signature);
  // token = base64url(gameId:email):signature
  const data = btoa(payload).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `${data}.${sig}`;
}

export async function verifyUnsubscribeToken(
  secret: string,
  token: string,
): Promise<{gameId: string; email: string} | null> {
  const dotIndex = token.indexOf('.');
  if (dotIndex === -1) return null;

  const dataPart = token.slice(0, dotIndex);
  const sigHex = token.slice(dotIndex + 1);

  // Decode base64url
  const base64 = dataPart.replace(/-/g, '+').replace(/_/g, '/');
  let payload: string;
  try {
    payload = atob(base64);
  } catch {
    return null;
  }

  const colonIndex = payload.indexOf(':');
  if (colonIndex === -1) return null;

  const gameId = payload.slice(0, colonIndex);
  const email = payload.slice(colonIndex + 1);

  // Verify HMAC
  const key = await importKey(secret);
  const expected = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(payload),
  );

  if (bufferToHex(expected) !== sigHex) return null;

  return {gameId, email};
}

async function importKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    {name: 'HMAC', hash: 'SHA-256'},
    false,
    ['sign'],
  );
}

function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
