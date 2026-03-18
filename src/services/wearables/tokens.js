// ── Wearable Token Storage ─────────────────────────────────────────────
// Manages OAuth tokens in localStorage with expiry tracking

const PREFIX = 'ds_wearable_';

export function saveTokens(provider, tokens) {
  const data = {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    expiresAt: Date.now() + (tokens.expires_in || 3600) * 1000,
    scope: tokens.scope || '',
    userId: tokens.user_id || null,
  };
  localStorage.setItem(`${PREFIX}${provider}`, JSON.stringify(data));
}

export function getTokens(provider) {
  const raw = localStorage.getItem(`${PREFIX}${provider}`);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

export function clearTokens(provider) {
  localStorage.removeItem(`${PREFIX}${provider}`);
  sessionStorage.removeItem(`${PREFIX}pkce_${provider}`);
}

export function isExpired(provider) {
  const tokens = getTokens(provider);
  if (!tokens) return true;
  return Date.now() >= tokens.expiresAt - 60000; // 1min buffer
}

export function getConnectedProviders() {
  return ['fitbit', 'whoop', 'oura', 'garmin'].filter(p => {
    const t = getTokens(p);
    return t && t.accessToken;
  });
}

// PKCE helpers — stored in sessionStorage (cleared on tab close)
export function savePKCE(provider, verifier, state) {
  sessionStorage.setItem(`${PREFIX}pkce_${provider}`, JSON.stringify({ verifier, state }));
}

export function getPKCE(provider) {
  const raw = sessionStorage.getItem(`${PREFIX}pkce_${provider}`);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

// Generate PKCE code verifier (RFC 7636)
export function generateCodeVerifier() {
  const array = new Uint8Array(64);
  crypto.getRandomValues(array);
  return Array.from(array, b => b.toString(36).padStart(2, '0')).join('').slice(0, 128);
}

// Generate PKCE code challenge (SHA-256, base64url)
export async function generateCodeChallenge(verifier) {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
