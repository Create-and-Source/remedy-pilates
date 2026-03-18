// POST /api/wearables/sync
// Receives HealthKit snapshot from iOS app, stores it so the web dashboard
// can display Apple Watch data without Terra or manual XML import.
//
// Body: { userId, daily[], recoveryScore, effortScore, recommendation, recColor, source, updatedAt }

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      userId,
      daily,
      recoveryScore,
      effortScore,
      recommendation,
      recColor,
      source,
      updatedAt
    } = req.body;

    if (!userId || !daily) {
      return res.status(400).json({ error: 'Missing userId or daily data' });
    }

    // In production, you'd store this in a database (Supabase, Planetscale, etc.)
    // For now, we log it and return success so the iOS app flow works end-to-end.
    // The web WearablesHub reads from localStorage, so this endpoint is the bridge
    // for when you add a real database layer.

    console.log(`[sync] userId=${userId} recovery=${recoveryScore} source=${source} days=${daily.length}`);

    return res.status(200).json({
      ok: true,
      received: {
        userId,
        recoveryScore,
        effortScore,
        daysCount: daily.length,
        source,
        updatedAt
      }
    });
  } catch (err) {
    console.error('[sync] error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
