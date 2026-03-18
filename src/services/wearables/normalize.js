// ── Wearable Data Normalizers ──────────────────────────────────────────
// Maps provider-specific API responses to the unified UI data shape.
//
// Target shape per day:
//   { date, restingHR, hrv, steps, sleep, calories, activeMinutes, hadClass }
//
// Target wearable object:
//   { daily[], recoveryScore, effortScore, recommendation, recColor, fitnessLevel }

function weekdayShort(dateStr) {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short' });
}

function last7Dates() {
  const dates = [];
  for (let d = 6; d >= 0; d--) {
    const dt = new Date();
    dt.setDate(dt.getDate() - d);
    dates.push(dt.toISOString().slice(0, 10));
  }
  return dates;
}

function computeRecovery(daily) {
  const today = daily[daily.length - 1];
  const hrv = today.hrv || 40;
  const rhr = today.restingHR || 65;
  const sleep = parseFloat(today.sleep) || 7;
  return Math.min(100, Math.max(0, Math.round(
    (hrv / 65 * 35) + ((80 - rhr) / 30 * 30) + (sleep / 8 * 35)
  )));
}

function computeRecommendation(recoveryScore) {
  if (recoveryScore >= 75) return {
    recommendation: 'Great recovery — clear for high-intensity classes (Reformer + Cardio, Barre Burn)',
    recColor: '#16A34A',
  };
  if (recoveryScore >= 50) return {
    recommendation: 'Moderate recovery — standard classes recommended (Reformer, Mat, Barre)',
    recColor: '#D97706',
  };
  return {
    recommendation: 'Low recovery — suggest Stretch & Restore or rest day',
    recColor: '#DC2626',
  };
}

function buildWearableResult(daily, classDateSet) {
  // Mark class days
  const withClasses = daily.map(d => ({
    ...d,
    hadClass: classDateSet.has(d.rawDate),
    date: weekdayShort(d.rawDate),
  }));

  const recoveryScore = computeRecovery(withClasses);
  const { recommendation, recColor } = computeRecommendation(recoveryScore);

  // Fitness level from class frequency
  const classDays = withClasses.filter(d => d.hadClass).length;
  const fitnessLevel = Math.min(1, classDays / 3); // 3 classes in 7 days ≈ 12/month

  return {
    daily: withClasses.map(({ rawDate, ...rest }) => rest),
    recoveryScore,
    effortScore: Math.round(60 + fitnessLevel * 30 + (recoveryScore / 100) * 10),
    recommendation,
    recColor,
    fitnessLevel,
  };
}

// ── Fitbit Normalizer ─────────────────────────────────────────────────

export function normalizeFitbit(responses, classDateSet) {
  const dates = last7Dates();
  const dateMap = {};
  dates.forEach(d => {
    dateMap[d] = { rawDate: d, restingHR: 0, hrv: 0, steps: 0, sleep: '0', calories: 0, activeMinutes: 0 };
  });

  // Heart rate → resting HR
  const hrData = responses.heartRate?.['activities-heart'] || [];
  hrData.forEach(entry => {
    if (dateMap[entry.dateTime]) {
      dateMap[entry.dateTime].restingHR = entry.value?.restingHeartRate || 0;
    }
  });

  // HRV
  const hrvData = responses.hrv?.hrv || [];
  hrvData.forEach(entry => {
    if (dateMap[entry.dateTime]) {
      dateMap[entry.dateTime].hrv = Math.round(entry.value?.dailyRmssd || 0);
    }
  });

  // Sleep
  const sleepData = responses.sleep?.sleep || [];
  sleepData.forEach(entry => {
    const date = entry.dateOfSleep;
    if (dateMap[date]) {
      dateMap[date].sleep = (entry.minutesAsleep / 60).toFixed(1);
    }
  });

  // Steps
  const stepsData = responses.steps?.['activities-steps'] || [];
  stepsData.forEach(entry => {
    if (dateMap[entry.dateTime]) {
      dateMap[entry.dateTime].steps = parseInt(entry.value) || 0;
    }
  });

  // Calories
  const calData = responses.calories?.['activities-calories'] || [];
  calData.forEach(entry => {
    if (dateMap[entry.dateTime]) {
      dateMap[entry.dateTime].calories = parseInt(entry.value) || 0;
    }
  });

  // Active minutes (fairly + very)
  const veryActive = responses.activeMinutes?.['activities-minutesVeryActive'] || [];
  const fairlyActive = responses.fairlyActive?.['activities-minutesFairlyActive'] || [];
  veryActive.forEach(entry => {
    if (dateMap[entry.dateTime]) {
      dateMap[entry.dateTime].activeMinutes += parseInt(entry.value) || 0;
    }
  });
  fairlyActive.forEach(entry => {
    if (dateMap[entry.dateTime]) {
      dateMap[entry.dateTime].activeMinutes += parseInt(entry.value) || 0;
    }
  });

  const daily = dates.map(d => dateMap[d]);
  return buildWearableResult(daily, classDateSet);
}

// ── WHOOP Normalizer ──────────────────────────────────────────────────

export function normalizeWhoop(responses, classDateSet) {
  const dates = last7Dates();
  const dateMap = {};
  dates.forEach(d => {
    dateMap[d] = { rawDate: d, restingHR: 0, hrv: 0, steps: 0, sleep: '0', calories: 0, activeMinutes: 0 };
  });

  // Recovery → resting HR, HRV, recovery score
  const recoveries = responses.recovery?.records || [];
  recoveries.forEach(rec => {
    const date = rec.created_at?.slice(0, 10) || rec.cycle?.days?.[0];
    if (date && dateMap[date]) {
      dateMap[date].restingHR = Math.round(rec.score?.resting_heart_rate || 0);
      dateMap[date].hrv = Math.round(rec.score?.hrv_rmssd_milli || 0);
    }
  });

  // Sleep → total in-bed time
  const sleeps = responses.sleep?.records || [];
  sleeps.forEach(s => {
    const date = s.start?.slice(0, 10);
    if (date && dateMap[date]) {
      const hours = (s.score?.total_in_bed_time_milli || 0) / 3600000;
      dateMap[date].sleep = hours.toFixed(1);
    }
  });

  // Cycles → strain, kilojoules
  const cycles = responses.cycle?.records || [];
  cycles.forEach(c => {
    const date = c.start?.slice(0, 10);
    if (date && dateMap[date]) {
      dateMap[date].calories = Math.round((c.score?.kilojoule || 0) / 4.184);
      dateMap[date].activeMinutes = Math.round((c.score?.strain || 0) * 4); // rough proxy
    }
  });

  // WHOOP doesn't track steps — estimate from strain
  dates.forEach(d => {
    dateMap[d].steps = Math.round(dateMap[d].activeMinutes * 120);
  });

  const daily = dates.map(d => dateMap[d]);
  return buildWearableResult(daily, classDateSet);
}

// ── Oura Normalizer ───────────────────────────────────────────────────

export function normalizeOura(responses, classDateSet) {
  const dates = last7Dates();
  const dateMap = {};
  dates.forEach(d => {
    dateMap[d] = { rawDate: d, restingHR: 0, hrv: 0, steps: 0, sleep: '0', calories: 0, activeMinutes: 0 };
  });

  // Daily readiness → HRV balance
  const readiness = responses.dailyReadiness?.data || [];
  readiness.forEach(r => {
    const date = r.day;
    if (date && dateMap[date]) {
      dateMap[date].hrv = Math.round(r.contributors?.hrv_balance || 0);
    }
  });

  // Daily sleep
  const sleeps = responses.dailySleep?.data || [];
  sleeps.forEach(s => {
    const date = s.day;
    if (date && dateMap[date]) {
      const hours = (s.contributors?.total_sleep || 0) / 100 * 8; // score → rough hours
      dateMap[date].sleep = hours.toFixed(1);
    }
  });

  // Daily activity
  const activities = responses.dailyActivity?.data || [];
  activities.forEach(a => {
    const date = a.day;
    if (date && dateMap[date]) {
      dateMap[date].steps = a.steps || 0;
      dateMap[date].calories = a.total_calories || 0;
      dateMap[date].activeMinutes = Math.round((a.high_activity_time || 0) / 60 + (a.medium_activity_time || 0) / 60);
    }
  });

  // Heartrate → resting HR (use minimum from quiet periods)
  const hrData = responses.heartrate?.data || [];
  const hrByDate = {};
  hrData.forEach(h => {
    const date = h.timestamp?.slice(0, 10);
    if (date) {
      if (!hrByDate[date]) hrByDate[date] = [];
      hrByDate[date].push(h.bpm);
    }
  });
  Object.entries(hrByDate).forEach(([date, bpms]) => {
    if (dateMap[date]) {
      // Approximate resting HR from lowest 10% of readings
      const sorted = bpms.sort((a, b) => a - b);
      const low10 = sorted.slice(0, Math.max(1, Math.floor(sorted.length * 0.1)));
      dateMap[date].restingHR = Math.round(low10.reduce((s, v) => s + v, 0) / low10.length);
    }
  });

  const daily = dates.map(d => dateMap[d]);
  return buildWearableResult(daily, classDateSet);
}

// ── Garmin Normalizer ─────────────────────────────────────────────────

export function normalizeGarmin(responses, classDateSet) {
  const dates = last7Dates();
  const dateMap = {};
  dates.forEach(d => {
    dateMap[d] = { rawDate: d, restingHR: 0, hrv: 0, steps: 0, sleep: '0', calories: 0, activeMinutes: 0 };
  });

  // Dailies
  const dailies = responses.dailies || [];
  dailies.forEach(d => {
    const date = d.calendarDate;
    if (date && dateMap[date]) {
      dateMap[date].steps = d.totalSteps || 0;
      dateMap[date].calories = d.totalKilocalories || 0;
      dateMap[date].activeMinutes = (d.vigorousIntensityDurationInSeconds || 0) / 60 +
        (d.moderateIntensityDurationInSeconds || 0) / 60;
      dateMap[date].restingHR = d.restingHeartRateInBeatsPerMinute || 0;
    }
  });

  // Heart rates → HRV (Garmin provides this in dailies as averageStressLevel, but real HRV needs separate endpoint)
  const heartRates = responses.heartRates || [];
  heartRates.forEach(h => {
    const date = h.calendarDate;
    if (date && dateMap[date]) {
      dateMap[date].hrv = h.hrvValue || Math.round(60 - (h.averageStressLevel || 50) * 0.4);
    }
  });

  // Sleep
  const sleeps = responses.sleeps || [];
  sleeps.forEach(s => {
    const date = s.calendarDate;
    if (date && dateMap[date]) {
      dateMap[date].sleep = ((s.durationInSeconds || 0) / 3600).toFixed(1);
    }
  });

  const daily = dates.map(d => dateMap[d]);
  return buildWearableResult(daily, classDateSet);
}
