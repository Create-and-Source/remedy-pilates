// POST /api/wearables/live-hr
// Receives real-time heart rate from iOS app during an active workout.
// In production, this would push to a WebSocket/SSE channel so the
// web dashboard can show a member's live HR on the instructor's screen.
//
// Body: { userId, classId, heartRate, calories, elapsed, timestamp }

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, classId, heartRate, calories, elapsed, timestamp } = req.body;

    if (!userId || !heartRate) {
      return res.status(400).json({ error: 'Missing userId or heartRate' });
    }

    // In production: broadcast via WebSocket to instructor dashboard
    // For now: just acknowledge receipt
    // This runs every ~1 second during a workout, so keep it lightweight

    return res.status(200).json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
}
