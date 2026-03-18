// ── Vercel Serverless: OAuth Token Exchange ───────────────────────────
// POST /api/wearables/callback
// Body: { provider, code, redirectUri, codeVerifier }
// Returns: { access_token, refresh_token, expires_in, scope, user_id }
//
// This runs server-side so client secrets are never exposed to the browser.

const PROVIDER_CONFIGS = {
  fitbit: {
    tokenUrl: 'https://api.fitbit.com/oauth2/token',
    clientIdEnv: 'FITBIT_CLIENT_ID',
    clientSecretEnv: 'FITBIT_CLIENT_SECRET',
    // Fitbit requires Basic auth header for token exchange
    useBasicAuth: true,
  },
  whoop: {
    tokenUrl: 'https://api.prod.whoop.com/oauth/oauth2/token',
    clientIdEnv: 'WHOOP_CLIENT_ID',
    clientSecretEnv: 'WHOOP_CLIENT_SECRET',
    useBasicAuth: false,
  },
  oura: {
    tokenUrl: 'https://api.ouraring.com/oauth/token',
    clientIdEnv: 'OURA_CLIENT_ID',
    clientSecretEnv: 'OURA_CLIENT_SECRET',
    useBasicAuth: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { provider, code, redirectUri, codeVerifier } = req.body;

  if (!provider || !code || !redirectUri) {
    return res.status(400).json({ error: 'Missing required fields: provider, code, redirectUri' });
  }

  const config = PROVIDER_CONFIGS[provider];
  if (!config) {
    return res.status(400).json({ error: `Unsupported provider: ${provider}` });
  }

  const clientId = process.env[config.clientIdEnv];
  const clientSecret = process.env[config.clientSecretEnv];

  if (!clientId || !clientSecret) {
    return res.status(500).json({
      error: `Server missing ${config.clientIdEnv} or ${config.clientSecretEnv} environment variables`,
    });
  }

  // Build token request body
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
  });

  // PKCE: include code_verifier instead of client_secret in body
  if (codeVerifier) {
    body.set('code_verifier', codeVerifier);
  }

  // Some providers want client_id/secret in body, others in Basic auth header
  if (!config.useBasicAuth) {
    body.set('client_id', clientId);
    body.set('client_secret', clientSecret);
  }

  const headers = {
    'Content-Type': 'application/x-www-form-urlencoded',
  };

  if (config.useBasicAuth) {
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    headers['Authorization'] = `Basic ${credentials}`;
  }

  try {
    const tokenRes = await fetch(config.tokenUrl, {
      method: 'POST',
      headers,
      body: body.toString(),
    });

    const data = await tokenRes.json();

    if (!tokenRes.ok) {
      console.error(`Token exchange failed for ${provider}:`, data);
      return res.status(tokenRes.status).json({
        error: data.errors?.[0]?.message || data.error_description || data.error || 'Token exchange failed',
      });
    }

    // Return normalized token response
    return res.status(200).json({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_in: data.expires_in,
      scope: data.scope,
      user_id: data.user_id || data.user?.id || null,
    });
  } catch (err) {
    console.error(`Token exchange error for ${provider}:`, err);
    return res.status(500).json({ error: 'Internal server error during token exchange' });
  }
}
