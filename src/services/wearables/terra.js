// ── Terra API Integration ─────────────────────────────────────────────
// Terra (tryterra.co) is a unified health data API that bridges Apple Health,
// Samsung Health, and 200+ wearables via a single REST API.
//
// For Apple Watch specifically, Terra provides:
//   1. A mobile SDK that reads HealthKit data on-device
//   2. A widget for web auth that generates a user_id
//   3. REST endpoints to fetch daily/sleep/activity data
//
// Flow:
//   1. User clicks "Connect Apple Watch (Live)" in our UI
//   2. We load Terra's auth widget → user authorizes
//   3. Terra returns a user_id → stored in localStorage
//   4. We fetch data via our serverless proxy → Terra REST API
//   5. Normalize to our standard daily shape

const TERRA_USER_KEY = 'ds_wearable_terra_user';
const TERRA_WIDGET_URL = 'https://widget.tryterra.co/session';

export function getTerraUserId() {
  return localStorage.getItem(TERRA_USER_KEY);
}

export function saveTerraUser(userId, provider) {
  localStorage.setItem(TERRA_USER_KEY, JSON.stringify({ userId, provider, connectedAt: new Date().toISOString() }));
}

export function clearTerraUser() {
  localStorage.removeItem(TERRA_USER_KEY);
}

export function isTerraConnected() {
  const raw = localStorage.getItem(TERRA_USER_KEY);
  if (!raw) return false;
  try { return !!JSON.parse(raw).userId; } catch { return false; }
}

// ── Widget Auth ───────────────────────────────────────────────────────
// Creates a Terra widget session via our serverless proxy, then opens the widget

export async function connectViaTerra() {
  const res = await fetch('/api/wearables/terra', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'create-session' }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to create Terra session');
  }

  const { url } = await res.json();
  return url; // Caller opens this in a popup/iframe
}

// ── Handle Widget Callback ────────────────────────────────────────────
// Terra widget posts back to our page with user_id + reference_id

export function handleTerraCallback(params) {
  const userId = params.get('user_id');
  const provider = params.get('resource') || 'APPLE';

  if (!userId) return false;

  saveTerraUser(userId, provider);
  return true;
}

// ── Fetch Data ────────────────────────────────────────────────────────

export async function fetchTerraData(classDateSet = new Set()) {
  const raw = localStorage.getItem(TERRA_USER_KEY);
  if (!raw) throw new Error('No Terra user connected');

  const { userId } = JSON.parse(raw);

  // Fetch daily, sleep, and activity in parallel via our proxy
  const [dailyRes, sleepRes, activityRes] = await Promise.all([
    fetch('/api/wearables/terra', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'fetch', userId, dataType: 'daily' }),
    }),
    fetch('/api/wearables/terra', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'fetch', userId, dataType: 'sleep' }),
    }),
    fetch('/api/wearables/terra', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'fetch', userId, dataType: 'activity' }),
    }),
  ]);

  const [dailyData, sleepData, activityData] = await Promise.all([
    dailyRes.json(), sleepRes.json(), activityRes.json(),
  ]);

  return normalizeTerraData(dailyData, sleepData, activityData, classDateSet);
}

// ── Normalize Terra Data ──────────────────────────────────────────────

function last7Dates() {
  const dates = [];
  for (let d = 6; d >= 0; d--) {
    const dt = new Date();
    dt.setDate(dt.getDate() - d);
    dates.push(dt.toISOString().slice(0, 10));
  }
  return dates;
}

function weekdayShort(dateStr) {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short' });
}

function normalizeTerraData(dailyData, sleepData, activityData, classDateSet) {
  const dates = last7Dates();
  const dateMap = {};
  dates.forEach(d => {
    dateMap[d] = {
      date: weekdayShort(d),
      restingHR: 0,
      hrv: 0,
      steps: 0,
      sleep: '0',
      calories: 0,
      activeMinutes: 0,
      hadClass: classDateSet.has(d),
    };
  });

  // Terra daily data — contains heart rate, HRV, steps, calories
  const dailies = dailyData?.data || [];
  dailies.forEach(d => {
    const date = d.metadata?.start_time?.slice(0, 10);
    if (!date || !dateMap[date]) return;

    const hr = d.heart_rate_data?.summary;
    if (hr) {
      dateMap[date].restingHR = Math.round(hr.resting_hr_bpm || 0);
      dateMap[date].hrv = Math.round(hr.avg_hrv_rmssd || hr.avg_hrv_sdnn || 0);
    }

    dateMap[date].steps = d.distance_data?.steps || dateMap[date].steps;
    dateMap[date].calories = Math.round(
      (d.calories_data?.total_burned_calories || 0)
    );
    dateMap[date].activeMinutes = Math.round(
      (d.active_durations_data?.activity_seconds || 0) / 60
    );
  });

  // Terra sleep data
  const sleeps = sleepData?.data || [];
  sleeps.forEach(sl => {
    const date = sl.metadata?.start_time?.slice(0, 10);
    if (!date || !dateMap[date]) return;

    const totalSleep = sl.sleep_durations_data?.asleep?.duration_asleep_state_seconds || 0;
    const inBed = sl.sleep_durations_data?.other?.duration_in_bed_seconds || totalSleep;
    dateMap[date].sleep = ((totalSleep || inBed) / 3600).toFixed(1);
  });

  // Terra activity data (supplements daily)
  const activities = activityData?.data || [];
  activities.forEach(a => {
    const date = a.metadata?.start_time?.slice(0, 10);
    if (!date || !dateMap[date]) return;

    // Supplement if daily didn't have steps
    if (!dateMap[date].steps && a.distance_data?.steps) {
      dateMap[date].steps = a.distance_data.steps;
    }
    if (a.active_durations_data?.activity_seconds) {
      dateMap[date].activeMinutes = Math.max(
        dateMap[date].activeMinutes,
        Math.round(a.active_durations_data.activity_seconds / 60)
      );
    }
  });

  const daily = dates.map(d => dateMap[d]);

  // Compute scores
  const today = daily[daily.length - 1];
  const hrvVal = today.hrv || 40;
  const rhrVal = today.restingHR || 65;
  const sleepVal = parseFloat(today.sleep) || 7;
  const recoveryScore = Math.min(100, Math.max(0, Math.round(
    (hrvVal / 65 * 35) + ((80 - rhrVal) / 30 * 30) + (sleepVal / 8 * 35)
  )));

  let recommendation, recColor;
  if (recoveryScore >= 75) {
    recommendation = 'Great recovery \u2014 clear for high-intensity classes (Reformer + Cardio, Barre Burn)';
    recColor = '#16A34A';
  } else if (recoveryScore >= 50) {
    recommendation = 'Moderate recovery \u2014 standard classes recommended (Reformer, Mat, Barre)';
    recColor = '#D97706';
  } else {
    recommendation = 'Low recovery \u2014 suggest Stretch & Restore or rest day';
    recColor = '#DC2626';
  }

  const classDays = daily.filter(d => d.hadClass).length;
  const fitnessLevel = Math.min(1, classDays / 3);

  return {
    provider: 'apple-watch',
    daily,
    recoveryScore,
    effortScore: Math.round(60 + fitnessLevel * 30 + (recoveryScore / 100) * 10),
    recommendation,
    recColor,
    fitnessLevel,
    source: 'terra-api',
  };
}
