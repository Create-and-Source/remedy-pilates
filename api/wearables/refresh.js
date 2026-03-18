// ── Vercel Serverless: OAuth Token Refresh ─────────────────────────────
// POST /api/wearables/refresh
// Body: { provider, refreshToken }
// Returns: { access_token, refresh_token, expires_in }

const PROVIDER_CONFIGS = {
  fitbit: {
    tokenUrl: 'https://api.fitbit.com/oauth2/token',
    clientIdEnv: 'FITBIT_CLIENT_ID',
    clientSecretEnv: 'FITBIT_CLIENT_SECRET',
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

  const { provider, refreshToken } = req.body;

  if (!provider || !refreshToken) {
    return res.status(400).json({ error: 'Missing required fields: provider, refreshToken' });
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

  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  });

  if (!config.useBasicAuth) {
    body.set('client_id', clientId);
    body.set('client_secret', clientSecret);
  }

  const headers = { 'Content-Type': 'application/x-www-form-urlencoded' };

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
      console.error(`Token refresh failed for ${provider}:`, data);
      return res.status(tokenRes.status).json({
        error: data.errors?.[0]?.message || data.error_description || data.error || 'Token refresh failed',
      });
    }

    return res.status(200).json({
      access_token: data.access_token,
      refresh_token: data.refresh_token || refreshToken, // Some providers don't rotate refresh tokens
      expires_in: data.expires_in,
    });
  } catch (err) {
    console.error(`Token refresh error for ${provider}:`, err);
    return res.status(500).json({ error: 'Internal server error during token refresh' });
  }
}
