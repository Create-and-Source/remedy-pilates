// Cognito auth — lightweight, no SDK dependency
// Uses Cognito USER_PASSWORD_AUTH flow via InitiateAuth API

const REGION = import.meta.env.VITE_COGNITO_USER_POOL_ID?.split('_')[0] || 'us-west-2';
const POOL_ID = import.meta.env.VITE_COGNITO_USER_POOL_ID || '';
const CLIENT_ID = import.meta.env.VITE_COGNITO_CLIENT_ID || '';
const COGNITO_URL = `https://cognito-idp.${REGION}.amazonaws.com/`;

// ── Token storage ──
const TOKEN_KEY = 'rp_auth_token';
const REFRESH_KEY = 'rp_refresh_token';
const EXPIRES_KEY = 'rp_token_expires';

export function getToken() {
  const expires = parseInt(localStorage.getItem(EXPIRES_KEY) || '0', 10);
  if (Date.now() > expires) return null;
  return localStorage.getItem(TOKEN_KEY) || null;
}

function storeTokens(result) {
  const auth = result.AuthenticationResult;
  if (!auth) return;
  localStorage.setItem(TOKEN_KEY, auth.IdToken);
  if (auth.RefreshToken) localStorage.setItem(REFRESH_KEY, auth.RefreshToken);
  // Expire 5 minutes early to avoid edge cases
  localStorage.setItem(EXPIRES_KEY, String(Date.now() + (auth.ExpiresIn - 300) * 1000));
}

function clearTokens() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(EXPIRES_KEY);
}

// ── Cognito API call helper ──
async function cognitoRequest(action, params) {
  const res = await fetch(COGNITO_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-amz-json-1.1',
      'X-Amz-Target': `AWSCognitoIdentityProviderService.${action}`,
    },
    body: JSON.stringify(params),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.__type?.split('#').pop() || data.message || 'Auth failed');
  }
  return data;
}

// ── Sign in ──
export async function signIn(email, password) {
  const result = await cognitoRequest('InitiateAuth', {
    AuthFlow: 'USER_PASSWORD_AUTH',
    ClientId: CLIENT_ID,
    AuthParameters: { USERNAME: email, PASSWORD: password },
  });

  if (result.ChallengeName === 'NEW_PASSWORD_REQUIRED') {
    return { challenge: 'NEW_PASSWORD_REQUIRED', session: result.Session };
  }

  storeTokens(result);

  // Decode ID token to get user info
  const payload = JSON.parse(atob(result.AuthenticationResult.IdToken.split('.')[1]));
  const user = {
    email: payload.email,
    name: payload.name || payload.email,
    role: payload['custom:role'] || 'client',
    sub: payload.sub,
  };

  localStorage.setItem('rp_user_name', user.name);
  localStorage.setItem('rp_user_role', user.role);

  return { user };
}

// ── Respond to NEW_PASSWORD_REQUIRED challenge ──
export async function completeNewPassword(session, email, newPassword) {
  const result = await cognitoRequest('RespondToAuthChallenge', {
    ChallengeName: 'NEW_PASSWORD_REQUIRED',
    ClientId: CLIENT_ID,
    Session: session,
    ChallengeResponses: { USERNAME: email, NEW_PASSWORD: newPassword },
  });
  storeTokens(result);
  return result;
}

// ── Refresh token ──
export async function refreshSession() {
  const refreshToken = localStorage.getItem(REFRESH_KEY);
  if (!refreshToken) return false;

  try {
    const result = await cognitoRequest('InitiateAuth', {
      AuthFlow: 'REFRESH_TOKEN_AUTH',
      ClientId: CLIENT_ID,
      AuthParameters: { REFRESH_TOKEN: refreshToken },
    });
    storeTokens(result);
    return true;
  } catch {
    clearTokens();
    return false;
  }
}

// ── Get valid token (auto-refresh if expired) ──
export async function getValidToken() {
  let token = getToken();
  if (token) return token;

  // Try refresh
  const refreshed = await refreshSession();
  if (refreshed) return getToken();

  return null;
}

// ── Sign out ──
export function signOut() {
  clearTokens();
  localStorage.removeItem('rp_user_name');
  localStorage.removeItem('rp_user_role');
}

// ── Check if signed in ──
export function isAuthenticated() {
  return !!getToken();
}

// ── Demo mode: skip Cognito, set mock token for local-only use ──
export function signInDemo(role, name) {
  localStorage.setItem('rp_user_name', name);
  localStorage.setItem('rp_user_role', role);
  // Set a demo token so ProtectedRoute allows access
  localStorage.setItem(TOKEN_KEY, 'demo');
  localStorage.setItem(EXPIRES_KEY, String(Date.now() + 24 * 60 * 60 * 1000));
}
