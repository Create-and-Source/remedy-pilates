// ── Wearable Service ──────────────────────────────────────────────────
// Orchestrates OAuth flows, API calls, and data normalization.
// Usage:
//   import * as wearables from '../services/wearables';
//   await wearables.connect('fitbit');
//   const data = await wearables.fetchData('fitbit', classDateSet);
//   wearables.disconnect('fitbit');

import { PROVIDERS, getClientId, getRedirectUri } from './providers.js';
import {
  saveTokens, getTokens, clearTokens, isExpired,
  getConnectedProviders as getConnected,
  savePKCE, getPKCE, generateCodeVerifier, generateCodeChallenge,
} from './tokens.js';
import { normalizeFitbit, normalizeWhoop, normalizeOura, normalizeGarmin } from './normalize.js';

export { getConnected as getConnectedProviders };

// ── OAuth Connect ─────────────────────────────────────────────────────

export async function connect(provider) {
  const config = PROVIDERS[provider];
  if (!config) throw new Error(`Unknown provider: ${provider}`);

  const clientId = getClientId(provider);
  if (!clientId) throw new Error(`Missing client ID for ${provider}. Set ${config.clientIdEnv} in .env`);

  if (config.isOAuth1) {
    // Garmin: initiate server-side OAuth1a flow
    const res = await fetch(`/api/wearables/garmin-init`, { method: 'POST' });
    const { authorizeUrl } = await res.json();
    window.location.href = authorizeUrl;
    return;
  }

  // OAuth2 Authorization Code flow
  const state = `${provider}:${crypto.randomUUID()}`;
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: getRedirectUri(),
    scope: config.scopes.join(' '),
    state,
  });

  // PKCE for providers that support it
  if (config.supportsPKCE) {
    const verifier = generateCodeVerifier();
    const challenge = await generateCodeChallenge(verifier);
    params.set('code_challenge', challenge);
    params.set('code_challenge_method', 'S256');
    savePKCE(provider, verifier, state);
  } else {
    savePKCE(provider, null, state);
  }

  window.location.href = `${config.authorizeUrl}?${params.toString()}`;
}

// ── OAuth Callback Handler ────────────────────────────────────────────
// Called from the component when URL has ?code= and ?state=

export async function handleCallback(code, state) {
  if (!state || !code) return null;

  const provider = state.split(':')[0];
  const config = PROVIDERS[provider];
  if (!config) return null;

  const pkce = getPKCE(provider);
  if (!pkce || pkce.state !== state) {
    console.error('PKCE state mismatch — possible CSRF');
    return null;
  }

  // Exchange code for tokens via serverless function
  const res = await fetch('/api/wearables/callback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      provider,
      code,
      redirectUri: getRedirectUri(),
      codeVerifier: pkce.verifier, // null for non-PKCE providers
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Token exchange failed: ${res.status}`);
  }

  const tokens = await res.json();
  saveTokens(provider, tokens);
  return provider;
}

// ── Token Refresh ─────────────────────────────────────────────────────

async function refreshIfNeeded(provider) {
  if (!isExpired(provider)) return getTokens(provider);

  const current = getTokens(provider);
  if (!current?.refreshToken) {
    clearTokens(provider);
    throw new Error(`${provider} token expired and no refresh token available`);
  }

  const res = await fetch('/api/wearables/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      provider,
      refreshToken: current.refreshToken,
    }),
  });

  if (!res.ok) {
    clearTokens(provider);
    throw new Error(`Token refresh failed for ${provider}`);
  }

  const tokens = await res.json();
  saveTokens(provider, tokens);
  return getTokens(provider);
}

// ── API Calls ─────────────────────────────────────────────────────────

async function apiCall(provider, endpoint) {
  const tokens = await refreshIfNeeded(provider);
  const config = PROVIDERS[provider];

  const url = endpoint.startsWith('http') ? endpoint : `${config.apiBase}${endpoint}`;
  const today = new Date().toISOString().slice(0, 10);
  const finalUrl = url.replace('{today}', today);

  const res = await fetch(finalUrl, {
    headers: {
      'Authorization': `Bearer ${tokens.accessToken}`,
      'Accept': 'application/json',
    },
  });

  if (res.status === 401) {
    // Token might be invalid despite not being expired — force refresh
    clearTokens(provider);
    throw new Error(`${provider} API returned 401 — re-authorization required`);
  }

  if (!res.ok) {
    throw new Error(`${provider} API error: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

// ── Fetch All Data for a Provider ─────────────────────────────────────

export async function fetchData(provider, classDateSet = new Set()) {
  const config = PROVIDERS[provider];
  if (!config) throw new Error(`Unknown provider: ${provider}`);

  const tokens = getTokens(provider);
  if (!tokens) throw new Error(`${provider} not connected`);

  const endpoints = config.endpoints;
  const responses = {};

  // Fetch all endpoints in parallel
  const entries = Object.entries(endpoints);
  const results = await Promise.allSettled(
    entries.map(([key, endpoint]) => apiCall(provider, endpoint))
  );

  entries.forEach(([key], i) => {
    if (results[i].status === 'fulfilled') {
      responses[key] = results[i].value;
    } else {
      console.warn(`${provider}/${key} failed:`, results[i].reason?.message);
      responses[key] = null;
    }
  });

  // Normalize to UI shape
  switch (provider) {
    case 'fitbit': return normalizeFitbit(responses, classDateSet);
    case 'whoop': return normalizeWhoop(responses, classDateSet);
    case 'oura': return normalizeOura(responses, classDateSet);
    case 'garmin': return normalizeGarmin(responses, classDateSet);
    default: throw new Error(`No normalizer for ${provider}`);
  }
}

// ── Disconnect ────────────────────────────────────────────────────────

export function disconnect(provider) {
  clearTokens(provider);
}

// ── Connection Status ─────────────────────────────────────────────────

export function isConnected(provider) {
  const t = getTokens(provider);
  return !!(t && t.accessToken);
}

export function getProviderConfig(provider) {
  return PROVIDERS[provider] || null;
}
