// InBody Body Composition — API Client
// Docs: apiusa.lookinbody.com
// Auth: Account + API-KEY headers

const INBODY_API = import.meta.env.VITE_INBODY_API_URL || '';
const INBODY_ACCOUNT = import.meta.env.VITE_INBODY_ACCOUNT || '';
const INBODY_KEY = import.meta.env.VITE_INBODY_API_KEY || '';

const INBODY_STORE = 'rp_inbody_scans';

function round1(n) { return Math.round(n * 10) / 10; }
function round2(n) { return Math.round(n * 100) / 100; }
function round3(n) { return Math.round(n * 1000) / 1000; }

// ── Demo/mock scan data generator ──
// scanIndex: 0 = baseline, 1 = 6 weeks, 2 = 3 months
// Progressive improvements: more SMM, less fat, better InBody score, improved segmental lean
function generateMockInBody(clientId, clientName, scanDate, seedNum, scanIndex) {
  // Each scan cycle shows realistic Pilates results
  const prog = scanIndex * 1.0; // 0, 1.0, 2.0

  // Height varies per client seed; fixed across scans
  const heightM = round2(1.60 + (seedNum * 0.007) % 0.14);

  // Weight: slight decrease from fat loss (~0.5 kg/cycle), offset partially by muscle gain
  const baseWeight = 63 + (seedNum * 4.1) % 15;
  const weight = round1(baseWeight - prog * 0.5);

  // Skeletal Muscle Mass increases ~0.4 kg per cycle (core + full-body Pilates)
  const baseSMM = 22 + (seedNum * 1.5) % 6;
  const smm = round1(baseSMM + prog * 0.4);

  // Body Fat Mass decreases ~0.9 kg per cycle
  const baseBFM = weight * (0.28 + (seedNum * 0.02) % 0.08);
  const bfm = round1(Math.max(5, baseBFM - prog * 0.9));

  const lbm = round1(weight - bfm);
  const tbw = round1(lbm * 0.73);
  const icw = round1(tbw * 0.62);
  const ecw = round1(tbw * 0.38);
  const pbf = round1(bfm / weight * 100);
  const bmi = round1(weight / (heightM ** 2));

  // InBody Score improves ~3 pts/cycle (muscle up + fat down = better score)
  const baseScore = 68 + (seedNum * 2) % 14;
  const inBodyScore = Math.min(100, Math.round(baseScore + prog * 3));

  // Visceral Fat Level decreases with core work
  const visceralFatLevel = Math.max(1, Math.round(6 + (seedNum % 4) - prog * 0.8));

  // Segmental lean adequacy % improves as muscles develop
  const segLeanBase = (seg) => Math.round(95 + (seedNum * 3) % 10 + prog * 2);

  return {
    id: `INB-${clientId}-${scanDate.replace(/-/g, '')}`,
    clientId,
    clientName,
    measurementDate: `${scanDate}T11:${String((20 + seedNum * 5) % 60).padStart(2, '0')}:00`,
    deviceModel: 'InBody 570',
    source: 'inbody',
    bodyComposition: {
      weight,
      TBW: tbw,
      ICW: icw,
      ECW: ecw,
      ECW_TBW_ratio: round3(ecw / tbw),
      protein: round1(lbm * 0.2),
      minerals: round2(lbm * 0.07),
      dryLeanMass: round1(lbm - tbw),
      leanBodyMass: lbm,
      bodyFatMass: bfm,
      SMM: smm,
      BMI: bmi,
      PBF: pbf,
      BMR: Math.round(1200 + smm * 15 + lbm * 5),
      visceralFatLevel,
      inBodyScore,
      // Skeletal Muscle Index: SMM / height²
      SMI: round2(smm / (heightM ** 2)),
    },
    segmentalLean: {
      rightArm: {
        massKg: round2(2.1 + (seedNum * 0.2) % 0.8 + prog * 0.06),
        adequacyPct: Math.min(120, segLeanBase('rightArm') + 1),
      },
      leftArm: {
        massKg: round2(2.0 + (seedNum * 0.2) % 0.8 + prog * 0.06),
        adequacyPct: Math.min(120, segLeanBase('leftArm')),
      },
      trunk: {
        massKg: round1(20 + (seedNum * 1.5) % 5 + prog * 0.15),
        adequacyPct: Math.min(120, Math.round(93 + (seedNum * 2) % 9 + prog * 2.5)),
      },
      rightLeg: {
        massKg: round1(8.5 + (seedNum * 0.8) % 3 + prog * 0.1),
        adequacyPct: Math.min(120, segLeanBase('rightLeg') + 2),
      },
      leftLeg: {
        massKg: round1(8.3 + (seedNum * 0.8) % 3 + prog * 0.1),
        adequacyPct: Math.min(120, segLeanBase('leftLeg') + 1),
      },
    },
    segmentalFat: {
      rightArm: { massKg: round2(Math.max(0.3, 0.9 + (seedNum * 0.15) % 0.5 - prog * 0.03)) },
      leftArm:  { massKg: round2(Math.max(0.3, 0.85 + (seedNum * 0.15) % 0.5 - prog * 0.03)) },
      trunk:    { massKg: round1(Math.max(1.5, bfm * 0.55 - prog * 0.15)) },
      rightLeg: { massKg: round1(Math.max(0.5, bfm * 0.12 - prog * 0.03)) },
      leftLeg:  { massKg: round1(Math.max(0.5, bfm * 0.11 - prog * 0.03)) },
    },
  };
}

// ── API Functions ──
export async function getScans(clientId) {
  if (INBODY_API && INBODY_KEY) {
    const res = await fetch(`${INBODY_API}/api/v1/results`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Account': INBODY_ACCOUNT,
        'API-KEY': INBODY_KEY,
      },
      body: JSON.stringify({ UserID: clientId }),
    });
    if (!res.ok) throw new Error('InBody API error');
    return res.json();
  }
  const all = JSON.parse(localStorage.getItem(INBODY_STORE) || '[]');
  return all.filter(s => s.clientId === clientId);
}

export function getAllScans() {
  return JSON.parse(localStorage.getItem(INBODY_STORE) || '[]');
}

// Seed demo data for 8 clients with 2–3 scans each showing Pilates progress
export function seedInBodyData(clients) {
  if (localStorage.getItem('rp_inbody_seeded')) return;
  const scans = [];
  const scanClients = clients.slice(0, 8);

  scanClients.forEach((c, i) => {
    // Scan 0: baseline
    scans.push(generateMockInBody(c.id, `${c.firstName} ${c.lastName}`, '2025-12-18', i, 0));
    // Scan 1: 6 weeks in
    scans.push(generateMockInBody(c.id, `${c.firstName} ${c.lastName}`, '2026-02-05', i, 1));
    // Scan 2: 3-month follow-up — only first 5 clients
    if (i < 5) {
      scans.push(generateMockInBody(c.id, `${c.firstName} ${c.lastName}`, '2026-03-16', i, 2));
    }
  });

  localStorage.setItem(INBODY_STORE, JSON.stringify(scans));
  localStorage.setItem('rp_inbody_seeded', 'true');
}
