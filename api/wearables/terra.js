// ── Vercel Serverless: Terra API Proxy ─────────────────────────────────
// POST /api/wearables/terra
// Body: { action: "create-session" | "fetch", userId?, dataType? }
//
// Terra (tryterra.co) provides a unified health data API.
// This proxy keeps the API key + dev-id server-side.
//
// Env vars required:
//   TERRA_API_KEY — from Terra dashboard
//   TERRA_DEV_ID — from Terra dashboard

const TERRA_BASE = 'https://api.tryterra.co/v2';

function terraHeaders() {
  return {
    'dev-id': process.env.TERRA_DEV_ID,
    'x-api-key': process.env.TERRA_API_KEY,
    'Content-Type': 'application/json',
  };
}

function sevenDaysAgo() {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  return d.toISOString().slice(0, 10);
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!process.env.TERRA_API_KEY || !process.env.TERRA_DEV_ID) {
    return res.status(500).json({
      error: 'Server missing TERRA_API_KEY or TERRA_DEV_ID environment variables. Sign up at tryterra.co.',
    });
  }

  const { action, userId, dataType } = req.body;

  try {
    // ── Create widget session for user auth ──
    if (action === 'create-session') {
      const origin = req.headers.origin || req.headers.referer?.replace(/\/[^/]*$/, '') || '';

      const terraRes = await fetch(`${TERRA_BASE}/auth/generateWidgetSession`, {
        method: 'POST',
        headers: terraHeaders(),
        body: JSON.stringify({
          reference_id: `remedy-${Date.now()}`,
          providers: 'APPLE,GARMIN,FITBIT,SAMSUNG,WHOOP,OURA',
          language: 'en',
          auth_success_redirect_url: `${origin}/admin/wearables?terra=connected`,
        }),
      });

      const data = await terraRes.json();

      if (!terraRes.ok) {
        return res.status(terraRes.status).json({
          error: data.message || 'Failed to create Terra widget session',
        });
      }

      return res.status(200).json({ url: data.url });
    }

    // ── Fetch data for a connected user ──
    if (action === 'fetch') {
      if (!userId) {
        return res.status(400).json({ error: 'Missing userId' });
      }

      const validTypes = ['daily', 'sleep', 'activity', 'body'];
      if (!validTypes.includes(dataType)) {
        return res.status(400).json({ error: `Invalid dataType. Must be one of: ${validTypes.join(', ')}` });
      }

      const startDate = sevenDaysAgo();
      const endDate = today();

      const terraRes = await fetch(
        `${TERRA_BASE}/${dataType}?user_id=${userId}&start_date=${startDate}&end_date=${endDate}&to_webhook=false`,
        { method: 'GET', headers: terraHeaders() }
      );

      const data = await terraRes.json();

      if (!terraRes.ok) {
        return res.status(terraRes.status).json({
          error: data.message || `Failed to fetch ${dataType} data from Terra`,
        });
      }

      return res.status(200).json(data);
    }

    return res.status(400).json({ error: 'Invalid action. Must be "create-session" or "fetch".' });
  } catch (err) {
    console.error('Terra API error:', err);
    return res.status(500).json({ error: 'Internal server error communicating with Terra' });
  }
}
