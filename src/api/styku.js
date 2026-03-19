// STYKU 3D Body Scanner — API Client
// Docs: styku.com/api
// Auth: API key (Bearer token)

const STYKU_API = import.meta.env.VITE_STYKU_API_URL || '';
const STYKU_KEY = import.meta.env.VITE_STYKU_API_KEY || '';

// Storage key for demo data
const STYKU_KEY_STORE = 'rp_styku_scans';

// Helper rounding functions
function round1(n) { return Math.round(n * 10) / 10; }
function round2(n) { return Math.round(n * 100) / 100; }

// ── Demo/mock scan data generator ──
// scanIndex: 0 = first scan (baseline), 1 = 6 weeks later, 2 = 3 months (most recent)
// Later scans show Pilates-driven improvements: lower BF%, better posture, smaller waist
function generateMockScan(clientId, clientName, scanDate, seedNum, scanIndex) {
  // Progressive improvement factor — each scan shows measurable Pilates results
  const prog = scanIndex * 1.0; // 0, 1.0, 2.0

  // Body fat decreases ~1.2% per scan cycle (realistic for consistent Pilates)
  const baseFat = 28 + (seedNum * 2.1) % 10;
  const bodyFatPct = round1(baseFat - prog * 1.2);

  // Weight reduces slightly (~0.6 kg per cycle from fat loss, offset by muscle gain)
  const baseWeight = 60 + (seedNum * 3.7) % 14;
  const weightKg = round1(baseWeight - prog * 0.4);

  const bodyFatMassKg = round2(weightKg * bodyFatPct / 100);
  const leanMassKg = round2(weightKg - bodyFatMassKg);
  const leanMassPercent = round1(100 - bodyFatPct);

  // Android/gynoid fat both decrease, but android (belly) improves faster
  const androidFatPct = round1(bodyFatPct + 3 + seedNum % 3 - prog * 1.0);
  const gynoidFatPct = round1(bodyFatPct + 5 + seedNum % 3 - prog * 0.6);

  // Waist shrinks ~1.2 cm per scan cycle (realistic core strengthening result)
  const baseWaist = 72 + (seedNum * 2.5) % 10;
  const naturalWaist = round1(baseWaist - prog * 1.2);
  const abdominalWaist = round1(baseWaist + 5.5 - prog * 1.4);

  // Posture score improves ~5 pts per cycle (Pilates core work)
  const postureScore = Math.min(99, Math.round(72 + (seedNum * 3) % 14 + prog * 5));

  // Postural sway decreases as core strengthens
  const anteriorSway = round1(Math.max(0.3, 2.8 + (seedNum * 0.7) % 2.5 - prog * 0.5));
  const lateralSway = round1(Math.max(0.1, 1.2 + (seedNum * 0.4) % 1.8 - prog * 0.3));
  const shoulderTilt = round1(Math.max(0.1, 2.0 + (seedNum * 0.6) % 2 - prog * 0.35));
  const hipTilt = round1(Math.max(0.1, 1.0 + (seedNum * 0.3) % 1.2 - prog * 0.2));

  // Visceral fat drops meaningfully with core work
  const visceralFatKg = round1(Math.max(0.3, 1.5 + (seedNum * 0.3) % 1.2 - prog * 0.25));

  return {
    id: `STK-${clientId}-${scanDate.replace(/-/g, '')}`,
    clientId,
    clientName,
    scannedAt: `${scanDate}T10:${String((15 + seedNum * 7) % 60).padStart(2, '0')}:00Z`,
    source: 'styku',
    weightKg,
    bodyFatPercent: bodyFatPct,
    bodyFatMassKg,
    leanMassKg,
    leanMassPercent,
    androidFatPercent: androidFatPct,
    gynoidFatPercent: gynoidFatPct,
    androidGynoidRatio: round2(androidFatPct / gynoidFatPct),
    visceralFatKg,
    waistToHipRatio: round2((naturalWaist) / (94 + (seedNum * 2.3) % 8 - prog * 0.4)),
    posture: {
      anteriorSwayDeg: anteriorSway,
      lateralSwayDeg: lateralSway,
      shoulderTiltDeg: shoulderTilt,
      hipTiltDeg: hipTilt,
      postureScore,
    },
    circumferencesCm: {
      chest: round1(87 + (seedNum * 2.1) % 8 - prog * 0.3),
      bicepLeft: round1(27 + (seedNum * 1.2) % 4 + prog * 0.2),
      bicepRight: round1(27.5 + (seedNum * 1.2) % 4 + prog * 0.2),
      forearmLeft: round1(22 + (seedNum * 0.8) % 3),
      forearmRight: round1(22.3 + (seedNum * 0.8) % 3),
      naturalWaist,
      waistAbdominal: abdominalWaist,
      highHip: round1(88 + (seedNum * 2) % 7 - prog * 0.5),
      lowHip: round1(94 + (seedNum * 2.3) % 8 - prog * 0.4),
      midThighLeft: round1(53 + (seedNum * 1.8) % 7 - prog * 0.3),
      midThighRight: round1(53.5 + (seedNum * 1.8) % 7 - prog * 0.3),
      calfLeft: round1(34 + (seedNum * 1) % 4),
      calfRight: round1(34.3 + (seedNum * 1) % 4),
    },
    reportUrl: null, // Would be STYKU-hosted PDF in production
    modelUrl: null,  // Would be OBJ file in production
  };
}

// ── API Functions ──
export async function getScans(clientId) {
  if (STYKU_API && STYKU_KEY) {
    // Real API call
    const res = await fetch(`${STYKU_API}/members/${clientId}/scans`, {
      headers: { Authorization: `Bearer ${STYKU_KEY}` },
    });
    if (!res.ok) throw new Error('STYKU API error');
    return res.json();
  }
  // Demo mode — return from localStorage
  const all = JSON.parse(localStorage.getItem(STYKU_KEY_STORE) || '[]');
  return all.filter(s => s.clientId === clientId);
}

export function getAllScans() {
  return JSON.parse(localStorage.getItem(STYKU_KEY_STORE) || '[]');
}

// Seed demo data for 8 clients with 2–3 scans each showing Pilates progress
export function seedStykuData(clients) {
  if (localStorage.getItem('rp_styku_seeded')) return;
  const scans = [];
  const scanClients = clients.slice(0, 8);

  scanClients.forEach((c, i) => {
    // Scan 0: baseline (3 months ago)
    scans.push(generateMockScan(c.id, `${c.firstName} ${c.lastName}`, '2025-12-15', i * 3, 0));
    // Scan 1: 6 weeks later
    scans.push(generateMockScan(c.id, `${c.firstName} ${c.lastName}`, '2026-02-01', i * 3, 1));
    // Scan 2: most recent — only first 5 clients have 3 scans
    if (i < 5) {
      scans.push(generateMockScan(c.id, `${c.firstName} ${c.lastName}`, '2026-03-15', i * 3, 2));
    }
  });

  localStorage.setItem(STYKU_KEY_STORE, JSON.stringify(scans));
  localStorage.setItem('rp_styku_seeded', 'true');
}
