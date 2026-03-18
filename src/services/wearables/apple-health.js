// ── Apple Health Export Parser ─────────────────────────────────────────
// Parses Apple Health export (ZIP or XML) client-side.
//
// Flow:
//   1. User exports from Health app → Settings → Health → Export All Health Data
//   2. Gets "export.zip" containing export.xml + clinical records
//   3. User uploads the ZIP (or extracted XML) here
//   4. We parse the XML for HR, HRV, sleep, steps, calories, active minutes
//   5. Extract last 7 days → normalize to UI shape → cache in localStorage
//
// Note: Apple Health exports can be 200MB+. We use regex streaming (not DOM parsing)
// to extract only the records we need, keeping memory usage reasonable.

import JSZip from 'jszip';

const CACHE_KEY = 'ds_wearable_apple_health';
const RECORD_TYPES = [
  'HKQuantityTypeIdentifierRestingHeartRate',
  'HKQuantityTypeIdentifierHeartRateVariabilitySDNN',
  'HKQuantityTypeIdentifierStepCount',
  'HKCategoryTypeIdentifierSleepAnalysis',
  'HKQuantityTypeIdentifierActiveEnergyBurned',
  'HKQuantityTypeIdentifierBasalEnergyBurned',
  'HKQuantityTypeIdentifierAppleExerciseTime',
];

// Date range — we only care about the last 7 days
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

// ── Extract XML from file ─────────────────────────────────────────────

export async function extractXML(file) {
  if (file.name.endsWith('.xml')) {
    return await file.text();
  }

  if (file.name.endsWith('.zip')) {
    const zip = await JSZip.loadAsync(file);

    // Look for export.xml in the zip (might be in apple_health_export/ folder)
    let xmlFile = zip.file('export.xml');
    if (!xmlFile) {
      xmlFile = zip.file('apple_health_export/export.xml');
    }
    if (!xmlFile) {
      // Search all files for any .xml file
      const xmlFiles = zip.file(/\.xml$/i);
      if (xmlFiles.length > 0) {
        xmlFile = xmlFiles[0];
      }
    }

    if (!xmlFile) {
      throw new Error('No export.xml found in ZIP. Make sure this is an Apple Health export.');
    }

    return await xmlFile.async('string');
  }

  throw new Error('Unsupported file type. Upload .zip or .xml from Apple Health export.');
}

// ── Parse XML using regex (memory efficient) ──────────────────────────

export function parseHealthRecords(xmlString) {
  const dates = last7Dates();
  const cutoff = dates[0]; // oldest date we care about

  // Initialize daily buckets
  const dateMap = {};
  dates.forEach(d => {
    dateMap[d] = {
      restingHR: [],
      hrv: [],
      steps: 0,
      sleepMinutes: 0,
      activeCalories: 0,
      basalCalories: 0,
      exerciseMinutes: 0,
    };
  });

  // Regex to match Record elements — handles both self-closing and paired tags
  // We match the opening tag attributes, which contain all the data we need
  const recordRegex = /<Record\s+([^>]+?)\/?>(?:<\/Record>)?/g;
  const attrRegex = /(\w+)="([^"]*)"/g;

  let match;
  let processed = 0;
  let relevant = 0;

  while ((match = recordRegex.exec(xmlString)) !== null) {
    processed++;
    const attrStr = match[1];

    // Quick check — skip records we don't care about (before parsing attrs)
    let typeMatch = false;
    for (const t of RECORD_TYPES) {
      if (attrStr.includes(t)) { typeMatch = true; break; }
    }
    if (!typeMatch) continue;

    // Parse attributes
    const attrs = {};
    let am;
    while ((am = attrRegex.exec(attrStr)) !== null) {
      attrs[am[1]] = am[2];
    }
    attrRegex.lastIndex = 0;

    // Extract date (YYYY-MM-DD from startDate like "2024-01-15 08:30:00 -0700")
    const startDate = attrs.startDate || '';
    const date = startDate.slice(0, 10);

    // Skip if outside our 7-day window
    if (date < cutoff || !dateMap[date]) continue;

    relevant++;
    const value = parseFloat(attrs.value) || 0;
    const type = attrs.type;

    switch (type) {
      case 'HKQuantityTypeIdentifierRestingHeartRate':
        dateMap[date].restingHR.push(value);
        break;

      case 'HKQuantityTypeIdentifierHeartRateVariabilitySDNN':
        dateMap[date].hrv.push(value);
        break;

      case 'HKQuantityTypeIdentifierStepCount':
        dateMap[date].steps += value;
        break;

      case 'HKCategoryTypeIdentifierSleepAnalysis': {
        // Sleep records have startDate + endDate — calculate duration
        const endDate = attrs.endDate || '';
        if (endDate) {
          const start = new Date(startDate.replace(' ', 'T'));
          const end = new Date(endDate.replace(' ', 'T'));
          const minutes = (end - start) / 60000;
          // Only count "InBed" or "Asleep" values (value 0=InBed, 1=Asleep, 2=Awake)
          if (attrs.value !== '2') {
            dateMap[date].sleepMinutes += minutes;
          }
        }
        break;
      }

      case 'HKQuantityTypeIdentifierActiveEnergyBurned':
        dateMap[date].activeCalories += value;
        break;

      case 'HKQuantityTypeIdentifierBasalEnergyBurned':
        dateMap[date].basalCalories += value;
        break;

      case 'HKQuantityTypeIdentifierAppleExerciseTime':
        dateMap[date].exerciseMinutes += value;
        break;
    }
  }

  // Build normalized daily array
  const daily = dates.map(d => {
    const day = dateMap[d];
    const restingHR = day.restingHR.length > 0
      ? Math.round(day.restingHR.reduce((s, v) => s + v, 0) / day.restingHR.length)
      : 0;
    const hrv = day.hrv.length > 0
      ? Math.round(day.hrv.reduce((s, v) => s + v, 0) / day.hrv.length)
      : 0;

    return {
      date: weekdayShort(d),
      restingHR,
      hrv,
      steps: Math.round(day.steps),
      sleep: (day.sleepMinutes / 60).toFixed(1),
      calories: Math.round(day.activeCalories + day.basalCalories),
      activeMinutes: Math.round(day.exerciseMinutes),
      hadClass: false, // Will be patched by caller with real class dates
    };
  });

  return { daily, stats: { processed, relevant } };
}

// ── Full pipeline: file → parsed → cached ─────────────────────────────

export async function importAppleHealth(file, classDateSet = new Set(), onProgress) {
  onProgress?.('Extracting XML...');
  const xml = await extractXML(file);

  onProgress?.(`Parsing ${(xml.length / 1048576).toFixed(1)} MB of health data...`);
  const { daily, stats } = parseHealthRecords(xml);

  // Mark class days
  const dates = last7Dates();
  daily.forEach((d, i) => {
    d.hadClass = classDateSet.has(dates[i]);
  });

  // Compute recovery score
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

  const result = {
    provider: 'apple-watch',
    daily,
    recoveryScore,
    effortScore: Math.round(60 + fitnessLevel * 30 + (recoveryScore / 100) * 10),
    recommendation,
    recColor,
    fitnessLevel,
    source: 'apple-health-export',
    importedAt: new Date().toISOString(),
    stats,
  };

  // Cache in localStorage
  localStorage.setItem(CACHE_KEY, JSON.stringify(result));

  onProgress?.(`Done \u2014 ${stats.relevant.toLocaleString()} relevant records from ${stats.processed.toLocaleString()} total`);
  return result;
}

// ── Read cached Apple Health data ─────────────────────────────────────

export function getCachedAppleHealth() {
  const raw = localStorage.getItem(CACHE_KEY);
  if (!raw) return null;
  try {
    const data = JSON.parse(raw);
    // Check if cached data is from today (re-import daily for fresh data)
    const importDate = data.importedAt?.slice(0, 10);
    const today = new Date().toISOString().slice(0, 10);
    if (importDate !== today) return null; // stale
    return data;
  } catch { return null; }
}

export function clearAppleHealthCache() {
  localStorage.removeItem(CACHE_KEY);
}
