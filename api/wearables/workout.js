// POST /api/wearables/workout
// Receives completed workout summary from iOS app after a class ends.
// Stores the workout record so it can appear in the member's history
// and the admin reports.
//
// Body: { userId, classId, className, duration, averageHR, maxHR, calories, startTime, endTime }

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      userId,
      classId,
      className,
      duration,
      averageHR,
      maxHR,
      calories,
      startTime,
      endTime
    } = req.body;

    if (!userId || !className) {
      return res.status(400).json({ error: 'Missing userId or className' });
    }

    // In production: save to database, update member stats, trigger post-class email
    console.log(`[workout] userId=${userId} class="${className}" duration=${duration}s avgHR=${averageHR} maxHR=${maxHR} cal=${calories}`);

    return res.status(200).json({
      ok: true,
      workout: {
        userId,
        classId,
        className,
        duration,
        averageHR,
        maxHR,
        calories,
        startTime,
        endTime
      }
    });
  } catch (err) {
    console.error('[workout] error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
