// MovementRx — Movement Prescription Engine
// Intake form → rule-based recommendation → progressive 4-week class plan
import { useState } from 'react';
import { useStyles, useTheme } from '../theme';
import { getPrescriptions, addPrescription, deletePrescription, getProviders } from '../data/store';

// ── Class catalog with properties ──
const CLASSES = [
  { id: 'reformer-foundations', name: 'Reformer Foundations', level: 'beginner', intensity: 'low', duration: 50, muscles: ['core', 'glutes', 'quads'], focus: ['stability', 'alignment', 'body-awareness'] },
  { id: 'reformer-power', name: 'Reformer Power', level: 'intermediate', intensity: 'high', duration: 50, muscles: ['core', 'glutes', 'quads', 'hamstrings', 'shoulders'], focus: ['strength', 'endurance', 'power'] },
  { id: 'mat-pilates', name: 'Mat Pilates', level: 'all', intensity: 'medium', duration: 55, muscles: ['core', 'back', 'hip-flexors'], focus: ['core-strength', 'flexibility', 'control'] },
  { id: 'barre-sculpt', name: 'Barre Sculpt', level: 'all', intensity: 'medium', duration: 50, muscles: ['glutes', 'calves', 'quads', 'arms'], focus: ['toning', 'balance', 'endurance'] },
  { id: 'stretch-release', name: 'Stretch & Release', level: 'all', intensity: 'low', duration: 45, muscles: [], focus: ['recovery', 'flexibility', 'mobility'] },
  { id: 'reformer-barre', name: 'Reformer + Barre Fusion', level: 'intermediate', intensity: 'high', duration: 55, muscles: ['core', 'glutes', 'quads', 'calves', 'arms'], focus: ['full-body', 'cardio', 'strength'] },
  { id: 'prenatal', name: 'Prenatal Pilates', level: 'all', intensity: 'low', duration: 45, muscles: ['core', 'back', 'glutes'], focus: ['pregnancy-safe', 'pelvic-floor', 'stability'] },
  { id: 'tower', name: 'Tower / Cadillac', level: 'intermediate', intensity: 'medium', duration: 50, muscles: ['core', 'back', 'shoulders', 'hamstrings'], focus: ['spinal-mobility', 'strength', 'rehab'] },
];

// ── Intake options ──
const INJURIES = [
  { id: 'lower-back', label: 'Lower back pain', contraindicates: ['reformer-power'], recommends: ['mat-pilates', 'stretch-release'] },
  { id: 'neck-cervical', label: 'Neck / cervical issues', contraindicates: [], recommends: ['stretch-release', 'mat-pilates'] },
  { id: 'shoulder', label: 'Shoulder injury', contraindicates: ['reformer-power'], recommends: ['tower', 'mat-pilates'] },
  { id: 'knee', label: 'Knee pain / injury', contraindicates: ['barre-sculpt', 'reformer-power'], recommends: ['mat-pilates', 'reformer-foundations'] },
  { id: 'hip', label: 'Hip replacement / injury', contraindicates: ['barre-sculpt', 'reformer-barre'], recommends: ['reformer-foundations', 'stretch-release'] },
  { id: 'pregnancy', label: 'Pregnancy', contraindicates: ['reformer-power', 'reformer-barre', 'barre-sculpt'], recommends: ['prenatal', 'stretch-release'] },
  { id: 'scoliosis', label: 'Scoliosis', contraindicates: [], recommends: ['tower', 'reformer-foundations'] },
  { id: 'disc', label: 'Disc herniation', contraindicates: ['reformer-power', 'mat-pilates'], recommends: ['reformer-foundations', 'tower'] },
  { id: 'osteoporosis', label: 'Osteoporosis', contraindicates: ['mat-pilates'], recommends: ['reformer-foundations', 'tower'] },
  { id: 'sciatica', label: 'Sciatica', contraindicates: ['reformer-power'], recommends: ['stretch-release', 'reformer-foundations'] },
];

const GOALS = [
  { id: 'core', label: 'Core strength', boosts: ['mat-pilates', 'reformer-foundations', 'reformer-power'] },
  { id: 'flexibility', label: 'Flexibility / mobility', boosts: ['stretch-release', 'mat-pilates', 'tower'] },
  { id: 'tone', label: 'Weight loss / toning', boosts: ['barre-sculpt', 'reformer-power', 'reformer-barre'] },
  { id: 'rehab', label: 'Injury rehabilitation', boosts: ['reformer-foundations', 'tower', 'stretch-release'] },
  { id: 'posture', label: 'Posture improvement', boosts: ['reformer-foundations', 'tower', 'mat-pilates'] },
  { id: 'stress', label: 'Stress relief', boosts: ['stretch-release', 'mat-pilates'] },
  { id: 'athletic', label: 'Athletic performance', boosts: ['reformer-power', 'reformer-barre', 'barre-sculpt'] },
  { id: 'prenatal-goal', label: 'Pre/post-natal fitness', boosts: ['prenatal', 'stretch-release'] },
];

const LIFESTYLES = [
  { id: 'desk', label: 'Desk job (8+ hrs sitting)', issues: ['tight-hips', 'forward-head', 'weak-core'], boosts: ['stretch-release', 'reformer-foundations'] },
  { id: 'active', label: 'Active / on feet all day', issues: ['leg-fatigue', 'lower-back'], boosts: ['stretch-release', 'mat-pilates'] },
  { id: 'athlete', label: 'Competitive athlete', issues: ['overuse', 'imbalance'], boosts: ['reformer-power', 'tower'] },
  { id: 'senior', label: 'Retired / senior', issues: ['balance', 'bone-density'], boosts: ['reformer-foundations', 'tower'] },
  { id: 'parent', label: 'New parent', issues: ['core-weakness', 'posture'], boosts: ['mat-pilates', 'reformer-foundations'] },
];

const EXPERIENCE_LEVELS = [
  { id: 'never', label: 'Never done Pilates', maxLevel: 'beginner', weekOneOnly: ['reformer-foundations', 'mat-pilates', 'stretch-release'] },
  { id: 'beginner', label: 'Beginner (< 6 months)', maxLevel: 'beginner', weekOneOnly: null },
  { id: 'intermediate', label: 'Intermediate (6mo-2yr)', maxLevel: 'intermediate', weekOneOnly: null },
  { id: 'advanced', label: 'Advanced (2+ years)', maxLevel: 'advanced', weekOneOnly: null },
];

const FREQUENCIES = [
  { id: '1', label: '1x / week', sessions: 1 },
  { id: '2', label: '2x / week', sessions: 2 },
  { id: '3', label: '3x / week', sessions: 3 },
  { id: '4', label: '4x / week', sessions: 4 },
  { id: '5', label: '5+ / week', sessions: 5 },
];

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// ── Prescription engine ──
function generatePrescription(intake) {
  const { injuries, goals, lifestyle, experience, frequency, clientName, preferredDays } = intake;
  const sessions = FREQUENCIES.find(f => f.id === frequency)?.sessions || 2;
  const expLevel = EXPERIENCE_LEVELS.find(e => e.id === experience);

  // 1. Build contraindicated set
  const contraindicated = new Set();
  injuries.forEach(injId => {
    const inj = INJURIES.find(i => i.id === injId);
    if (inj) inj.contraindicates.forEach(c => contraindicated.add(c));
  });

  // 2. Score each class
  const classScores = CLASSES.filter(c => !contraindicated.has(c.id)).map(cls => {
    let score = 0;
    // Goal alignment
    goals.forEach(gId => {
      const g = GOALS.find(gl => gl.id === gId);
      if (g && g.boosts.includes(cls.id)) score += 3;
    });
    // Injury recommendation
    injuries.forEach(injId => {
      const inj = INJURIES.find(i => i.id === injId);
      if (inj && inj.recommends.includes(cls.id)) score += 4;
    });
    // Lifestyle alignment
    const ls = LIFESTYLES.find(l => l.id === lifestyle);
    if (ls && ls.boosts.includes(cls.id)) score += 2;
    // Experience level match
    if (cls.level === 'all') score += 1;
    if (experience === 'never' && cls.level === 'beginner') score += 2;
    if (experience === 'advanced' && cls.intensity === 'high') score += 2;
    // Penalize high intensity for beginners
    if ((experience === 'never' || experience === 'beginner') && cls.intensity === 'high') score -= 3;
    return { ...cls, score };
  }).sort((a, b) => b.score - a.score);

  // 3. Select classes per week
  const primaryClass = classScores[0];
  const secondaryClass = classScores.find(c => c.id !== primaryClass.id) || classScores[0];
  const tertiaryClass = classScores.find(c => c.id !== primaryClass.id && c.id !== secondaryClass.id);
  const recoveryClass = classScores.find(c => c.id === 'stretch-release') || classScores[classScores.length - 1];

  // 4. Build 4-week progressive plan
  const weeks = [];
  for (let w = 1; w <= 4; w++) {
    const weekClasses = [];
    const availableDays = preferredDays.length > 0 ? preferredDays : DAYS.slice(0, 5);

    if (w === 1 && expLevel?.weekOneOnly) {
      // Week 1 for beginners: restricted class selection
      const allowed = classScores.filter(c => expLevel.weekOneOnly.includes(c.id));
      for (let i = 0; i < Math.min(sessions, availableDays.length); i++) {
        weekClasses.push({
          day: availableDays[i % availableDays.length],
          class: allowed[i % allowed.length] || allowed[0],
          note: i === 0 ? 'Start here — focus on form and breathing' : 'Build consistency',
        });
      }
    } else {
      for (let i = 0; i < Math.min(sessions, availableDays.length); i++) {
        let cls;
        if (i === 0) cls = primaryClass;
        else if (i === 1) cls = w >= 3 ? secondaryClass : primaryClass;
        else if (i === 2) cls = w >= 3 && tertiaryClass ? tertiaryClass : secondaryClass;
        else cls = (w >= 2 && recoveryClass) ? recoveryClass : secondaryClass;

        // Every other session in week 4+, introduce next level
        if (w === 4 && i === 0 && experience !== 'advanced') {
          const upgrade = classScores.find(c => c.intensity === 'high' && !contraindicated.has(c.id));
          if (upgrade) cls = upgrade;
        }

        weekClasses.push({
          day: availableDays[i % availableDays.length],
          class: cls,
          note: w === 1 ? 'Foundation building' : w === 2 ? 'Building endurance' : w === 3 ? 'Adding variety' : 'Progressive challenge',
        });
      }
    }

    // Add recovery recommendation if 3+ sessions
    if (sessions >= 3 && !weekClasses.find(wc => wc.class.id === 'stretch-release')) {
      weekClasses[weekClasses.length - 1] = {
        ...weekClasses[weekClasses.length - 1],
        note: 'Recovery day — active rest',
        class: recoveryClass,
      };
    }

    weeks.push({ week: w, classes: weekClasses });
  }

  // 5. Build insights
  const insights = [];
  const ls = LIFESTYLES.find(l => l.id === lifestyle);
  if (ls) {
    ls.issues.forEach(issue => {
      if (issue === 'tight-hips') insights.push('Desk work creates tight hip flexors — Reformer footwork and hip-opening sequences are prioritized');
      if (issue === 'forward-head') insights.push('Prolonged sitting promotes forward head posture — chin tuck cues added to all exercises');
      if (issue === 'weak-core') insights.push('Sedentary lifestyle weakens deep stabilizers — Mat Pilates builds foundational core engagement');
      if (issue === 'leg-fatigue') insights.push('Standing all day fatigues legs — Stretch & Release sessions help recovery');
      if (issue === 'overuse') insights.push('Athletic overuse patterns need balanced muscle work — Tower/Cadillac addresses imbalances');
      if (issue === 'balance') insights.push('Balance and bone density are priorities — weight-bearing Reformer work is ideal');
    });
  }
  injuries.forEach(injId => {
    const inj = INJURIES.find(i => i.id === injId);
    if (inj) {
      if (injId === 'lower-back') insights.push('Lower back pain protocol: pelvic stability before spinal flexion, avoid loaded flexion in weeks 1-2');
      if (injId === 'knee') insights.push('Knee protocol: no deep squats or jumps, focus on quad/hamstring balance and VMO activation');
      if (injId === 'shoulder') insights.push('Shoulder protocol: avoid overhead work initially, focus on scapular stability before shoulder flexion');
      if (injId === 'pregnancy') insights.push('Prenatal modifications: no supine work after week 16, focus on pelvic floor and breathing');
    }
  });

  return { clientName, intake, weeks, insights, topClasses: classScores.slice(0, 5), contraindicated: [...contraindicated] };
}

// ── Seed prescriptions if rp_prescriptions is empty ──
function initPrescriptions() {
  if (localStorage.getItem('rp_prescriptions_init')) return;
  const existing = JSON.parse(localStorage.getItem('rp_prescriptions') || '[]');
  if (existing.length > 0) { localStorage.setItem('rp_prescriptions_init', 'true'); return; }

  const seeds = [
    {
      id: 'RX-seed-1',
      clientId: 'CLT-1000',
      clientName: 'Emma Johnson',
      title: 'Core Stabilization Program',
      weeks: 4,
      status: 'active',
      date: '2026-01-15T10:00:00Z',
      intake: { experience: 'beginner', goals: ['core', 'rehab'], lifestyle: 'parent', injuries: [], frequency: '3', preferredDays: ['Monday', 'Wednesday', 'Friday'] },
      insights: ['Post-partum diastasis recti recovery: pelvic stability before spinal flexion, avoid loaded flexion in weeks 1-2', 'Sedentary lifestyle weakens deep stabilizers — Mat Pilates builds foundational core engagement'],
      topClasses: [
        { id: 'mat-pilates', name: 'Mat Pilates', intensity: 'medium', score: 12, muscles: ['core', 'back', 'hip-flexors'] },
        { id: 'reformer-foundations', name: 'Reformer Foundations', intensity: 'low', score: 10, muscles: ['core', 'glutes', 'quads'] },
        { id: 'stretch-release', name: 'Stretch & Release', intensity: 'low', score: 7, muscles: [] },
      ],
      weeks_plan: [
        { week: 1, classes: [{ day: 'Monday', class: { id: 'mat-pilates', name: 'Mat Pilates', intensity: 'medium', duration: 55 }, note: 'Start here — focus on form and breathing' }, { day: 'Wednesday', class: { id: 'reformer-foundations', name: 'Reformer Foundations', intensity: 'low', duration: 50 }, note: 'Build consistency' }, { day: 'Friday', class: { id: 'stretch-release', name: 'Stretch & Release', intensity: 'low', duration: 45 }, note: 'Recovery day — active rest' }] },
        { week: 2, classes: [{ day: 'Monday', class: { id: 'mat-pilates', name: 'Mat Pilates', intensity: 'medium', duration: 55 }, note: 'Building endurance' }, { day: 'Wednesday', class: { id: 'mat-pilates', name: 'Mat Pilates', intensity: 'medium', duration: 55 }, note: 'Building endurance' }, { day: 'Friday', class: { id: 'stretch-release', name: 'Stretch & Release', intensity: 'low', duration: 45 }, note: 'Recovery day — active rest' }] },
        { week: 3, classes: [{ day: 'Monday', class: { id: 'mat-pilates', name: 'Mat Pilates', intensity: 'medium', duration: 55 }, note: 'Adding variety' }, { day: 'Wednesday', class: { id: 'reformer-foundations', name: 'Reformer Foundations', intensity: 'low', duration: 50 }, note: 'Adding variety' }, { day: 'Friday', class: { id: 'stretch-release', name: 'Stretch & Release', intensity: 'low', duration: 45 }, note: 'Recovery day — active rest' }] },
        { week: 4, classes: [{ day: 'Monday', class: { id: 'reformer-foundations', name: 'Reformer Foundations', intensity: 'low', duration: 50 }, note: 'Progressive challenge' }, { day: 'Wednesday', class: { id: 'mat-pilates', name: 'Mat Pilates', intensity: 'medium', duration: 55 }, note: 'Progressive challenge' }, { day: 'Friday', class: { id: 'stretch-release', name: 'Stretch & Release', intensity: 'low', duration: 45 }, note: 'Recovery day — active rest' }] },
      ],
      contraindicated: [],
    },
    {
      id: 'RX-seed-2',
      clientId: 'CLT-1003',
      clientName: 'Ava Jones',
      title: 'Shoulder Mobility Protocol',
      weeks: 3,
      status: 'active',
      date: '2026-02-01T10:00:00Z',
      intake: { experience: 'intermediate', goals: ['flexibility', 'posture'], lifestyle: 'desk', injuries: ['shoulder'], frequency: '2', preferredDays: ['Tuesday', 'Thursday'] },
      insights: ['Shoulder protocol: avoid overhead work initially, focus on scapular stability before shoulder flexion', 'Desk work creates tight hip flexors — Reformer footwork and hip-opening sequences are prioritized'],
      topClasses: [
        { id: 'tower', name: 'Tower / Cadillac', intensity: 'medium', score: 14, muscles: ['core', 'back', 'shoulders', 'hamstrings'] },
        { id: 'mat-pilates', name: 'Mat Pilates', intensity: 'medium', score: 10, muscles: ['core', 'back', 'hip-flexors'] },
        { id: 'stretch-release', name: 'Stretch & Release', intensity: 'low', score: 8, muscles: [] },
      ],
      weeks_plan: [
        { week: 1, classes: [{ day: 'Tuesday', class: { id: 'tower', name: 'Tower / Cadillac', intensity: 'medium', duration: 50 }, note: 'Foundation building' }, { day: 'Thursday', class: { id: 'stretch-release', name: 'Stretch & Release', intensity: 'low', duration: 45 }, note: 'Recovery day — active rest' }] },
        { week: 2, classes: [{ day: 'Tuesday', class: { id: 'tower', name: 'Tower / Cadillac', intensity: 'medium', duration: 50 }, note: 'Building endurance' }, { day: 'Thursday', class: { id: 'mat-pilates', name: 'Mat Pilates', intensity: 'medium', duration: 55 }, note: 'Building endurance' }] },
        { week: 3, classes: [{ day: 'Tuesday', class: { id: 'tower', name: 'Tower / Cadillac', intensity: 'medium', duration: 50 }, note: 'Progressive challenge' }, { day: 'Thursday', class: { id: 'mat-pilates', name: 'Mat Pilates', intensity: 'medium', duration: 55 }, note: 'Progressive challenge' }] },
      ],
      contraindicated: ['reformer-power'],
    },
    {
      id: 'RX-seed-3',
      clientId: 'CLT-1005',
      clientName: 'Mia Garcia',
      title: 'Hip & Pelvis Alignment',
      weeks: 4,
      status: 'active',
      date: '2026-01-20T10:00:00Z',
      intake: { experience: 'intermediate', goals: ['posture', 'flexibility'], lifestyle: 'athlete', injuries: ['hip'], frequency: '3', preferredDays: ['Monday', 'Wednesday', 'Saturday'] },
      insights: ['Athletic overuse patterns need balanced muscle work — Tower/Cadillac addresses imbalances', 'Anterior pelvic tilt — prioritize hip flexor lengthening and posterior chain activation'],
      topClasses: [
        { id: 'reformer-foundations', name: 'Reformer Foundations', intensity: 'low', score: 11, muscles: ['core', 'glutes', 'quads'] },
        { id: 'stretch-release', name: 'Stretch & Release', intensity: 'low', score: 9, muscles: [] },
        { id: 'tower', name: 'Tower / Cadillac', intensity: 'medium', score: 8, muscles: ['core', 'back', 'shoulders', 'hamstrings'] },
      ],
      weeks_plan: [
        { week: 1, classes: [{ day: 'Monday', class: { id: 'reformer-foundations', name: 'Reformer Foundations', intensity: 'low', duration: 50 }, note: 'Foundation building' }, { day: 'Wednesday', class: { id: 'stretch-release', name: 'Stretch & Release', intensity: 'low', duration: 45 }, note: 'Recovery day — active rest' }, { day: 'Saturday', class: { id: 'reformer-foundations', name: 'Reformer Foundations', intensity: 'low', duration: 50 }, note: 'Foundation building' }] },
        { week: 2, classes: [{ day: 'Monday', class: { id: 'reformer-foundations', name: 'Reformer Foundations', intensity: 'low', duration: 50 }, note: 'Building endurance' }, { day: 'Wednesday', class: { id: 'tower', name: 'Tower / Cadillac', intensity: 'medium', duration: 50 }, note: 'Building endurance' }, { day: 'Saturday', class: { id: 'stretch-release', name: 'Stretch & Release', intensity: 'low', duration: 45 }, note: 'Recovery day — active rest' }] },
        { week: 3, classes: [{ day: 'Monday', class: { id: 'reformer-foundations', name: 'Reformer Foundations', intensity: 'low', duration: 50 }, note: 'Adding variety' }, { day: 'Wednesday', class: { id: 'tower', name: 'Tower / Cadillac', intensity: 'medium', duration: 50 }, note: 'Adding variety' }, { day: 'Saturday', class: { id: 'stretch-release', name: 'Stretch & Release', intensity: 'low', duration: 45 }, note: 'Recovery day — active rest' }] },
        { week: 4, classes: [{ day: 'Monday', class: { id: 'tower', name: 'Tower / Cadillac', intensity: 'medium', duration: 50 }, note: 'Progressive challenge' }, { day: 'Wednesday', class: { id: 'reformer-foundations', name: 'Reformer Foundations', intensity: 'low', duration: 50 }, note: 'Progressive challenge' }, { day: 'Saturday', class: { id: 'stretch-release', name: 'Stretch & Release', intensity: 'low', duration: 45 }, note: 'Recovery day — active rest' }] },
      ],
      contraindicated: ['barre-sculpt', 'reformer-barre'],
    },
    {
      id: 'RX-seed-4',
      clientId: 'CLT-1007',
      clientName: 'Amelia Thompson',
      title: 'Spinal Mobility Series',
      weeks: 3,
      status: 'completed',
      date: '2025-12-01T10:00:00Z',
      intake: { experience: 'beginner', goals: ['flexibility', 'posture'], lifestyle: 'desk', injuries: ['lower-back'], frequency: '2', preferredDays: ['Wednesday', 'Saturday'] },
      insights: ['Lower back pain protocol: pelvic stability before spinal flexion, avoid loaded flexion in weeks 1-2', 'Desk work creates tight hip flexors — Reformer footwork and hip-opening sequences are prioritized'],
      topClasses: [
        { id: 'tower', name: 'Tower / Cadillac', intensity: 'medium', score: 13, muscles: ['core', 'back', 'shoulders', 'hamstrings'] },
        { id: 'stretch-release', name: 'Stretch & Release', intensity: 'low', score: 11, muscles: [] },
        { id: 'reformer-foundations', name: 'Reformer Foundations', intensity: 'low', score: 9, muscles: ['core', 'glutes', 'quads'] },
      ],
      weeks_plan: [
        { week: 1, classes: [{ day: 'Wednesday', class: { id: 'stretch-release', name: 'Stretch & Release', intensity: 'low', duration: 45 }, note: 'Foundation building' }, { day: 'Saturday', class: { id: 'reformer-foundations', name: 'Reformer Foundations', intensity: 'low', duration: 50 }, note: 'Foundation building' }] },
        { week: 2, classes: [{ day: 'Wednesday', class: { id: 'tower', name: 'Tower / Cadillac', intensity: 'medium', duration: 50 }, note: 'Building endurance' }, { day: 'Saturday', class: { id: 'stretch-release', name: 'Stretch & Release', intensity: 'low', duration: 45 }, note: 'Recovery day — active rest' }] },
        { week: 3, classes: [{ day: 'Wednesday', class: { id: 'tower', name: 'Tower / Cadillac', intensity: 'medium', duration: 50 }, note: 'Progressive challenge' }, { day: 'Saturday', class: { id: 'reformer-foundations', name: 'Reformer Foundations', intensity: 'low', duration: 50 }, note: 'Progressive challenge' }] },
      ],
      contraindicated: ['reformer-power'],
    },
    {
      id: 'RX-seed-5',
      clientId: 'CLT-1009',
      clientName: 'Evelyn Lopez',
      title: 'Athletic Performance',
      weeks: 4,
      status: 'active',
      date: '2026-02-10T10:00:00Z',
      intake: { experience: 'advanced', goals: ['athletic', 'core'], lifestyle: 'athlete', injuries: [], frequency: '4', preferredDays: ['Monday', 'Tuesday', 'Thursday', 'Saturday'] },
      insights: ['Athletic overuse patterns need balanced muscle work — Tower/Cadillac addresses imbalances', 'Runner hip/knee balance: prioritize single-leg stability and posterior chain activation'],
      topClasses: [
        { id: 'reformer-power', name: 'Reformer Power', intensity: 'high', score: 16, muscles: ['core', 'glutes', 'quads', 'hamstrings', 'shoulders'] },
        { id: 'reformer-barre', name: 'Reformer + Barre Fusion', intensity: 'high', score: 14, muscles: ['core', 'glutes', 'quads', 'calves', 'arms'] },
        { id: 'tower', name: 'Tower / Cadillac', intensity: 'medium', score: 10, muscles: ['core', 'back', 'shoulders', 'hamstrings'] },
      ],
      weeks_plan: [
        { week: 1, classes: [{ day: 'Monday', class: { id: 'reformer-power', name: 'Reformer Power', intensity: 'high', duration: 50 }, note: 'Foundation building' }, { day: 'Tuesday', class: { id: 'reformer-power', name: 'Reformer Power', intensity: 'high', duration: 50 }, note: 'Foundation building' }, { day: 'Thursday', class: { id: 'tower', name: 'Tower / Cadillac', intensity: 'medium', duration: 50 }, note: 'Foundation building' }, { day: 'Saturday', class: { id: 'stretch-release', name: 'Stretch & Release', intensity: 'low', duration: 45 }, note: 'Recovery day — active rest' }] },
        { week: 2, classes: [{ day: 'Monday', class: { id: 'reformer-power', name: 'Reformer Power', intensity: 'high', duration: 50 }, note: 'Building endurance' }, { day: 'Tuesday', class: { id: 'reformer-barre', name: 'Reformer + Barre Fusion', intensity: 'high', duration: 55 }, note: 'Building endurance' }, { day: 'Thursday', class: { id: 'tower', name: 'Tower / Cadillac', intensity: 'medium', duration: 50 }, note: 'Building endurance' }, { day: 'Saturday', class: { id: 'stretch-release', name: 'Stretch & Release', intensity: 'low', duration: 45 }, note: 'Recovery day — active rest' }] },
        { week: 3, classes: [{ day: 'Monday', class: { id: 'reformer-power', name: 'Reformer Power', intensity: 'high', duration: 50 }, note: 'Adding variety' }, { day: 'Tuesday', class: { id: 'reformer-barre', name: 'Reformer + Barre Fusion', intensity: 'high', duration: 55 }, note: 'Adding variety' }, { day: 'Thursday', class: { id: 'tower', name: 'Tower / Cadillac', intensity: 'medium', duration: 50 }, note: 'Adding variety' }, { day: 'Saturday', class: { id: 'stretch-release', name: 'Stretch & Release', intensity: 'low', duration: 45 }, note: 'Recovery day — active rest' }] },
        { week: 4, classes: [{ day: 'Monday', class: { id: 'reformer-power', name: 'Reformer Power', intensity: 'high', duration: 50 }, note: 'Progressive challenge' }, { day: 'Tuesday', class: { id: 'reformer-barre', name: 'Reformer + Barre Fusion', intensity: 'high', duration: 55 }, note: 'Progressive challenge' }, { day: 'Thursday', class: { id: 'tower', name: 'Tower / Cadillac', intensity: 'medium', duration: 50 }, note: 'Progressive challenge' }, { day: 'Saturday', class: { id: 'stretch-release', name: 'Stretch & Release', intensity: 'low', duration: 45 }, note: 'Recovery day — active rest' }] },
      ],
      contraindicated: [],
    },
  ];

  localStorage.setItem('rp_prescriptions', JSON.stringify(seeds));
  localStorage.setItem('rp_prescriptions_init', 'true');
}

export default function MovementRx() {
  const s = useStyles();
  const { theme } = useTheme();
  const instructors = getProviders();
  const [prescriptions, setPrescriptions] = useState(() => { initPrescriptions(); return getPrescriptions(); });
  const [step, setStep] = useState('list'); // list | intake | plan
  const [plan, setPlan] = useState(null);
  const [selectedRx, setSelectedRx] = useState(null);

  // Intake form state
  const [clientName, setClientName] = useState('');
  const [injuries, setInjuries] = useState([]);
  const [goals, setGoals] = useState([]);
  const [lifestyle, setLifestyle] = useState('');
  const [experience, setExperience] = useState('');
  const [frequency, setFrequency] = useState('3');
  const [preferredDays, setPreferredDays] = useState([]);

  const toggleArray = (arr, setArr, val) => {
    setArr(arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val]);
  };

  const handleGenerate = () => {
    if (!experience || !lifestyle || goals.length === 0) return;
    const result = generatePrescription({ clientName, injuries, goals, lifestyle, experience, frequency, preferredDays });
    setPlan(result);
    setStep('plan');
  };

  const savePrescription = () => {
    addPrescription(plan);
    setPrescriptions(getPrescriptions());
    resetForm();
    setStep('list');
  };

  const resetForm = () => {
    setClientName(''); setInjuries([]); setGoals([]); setLifestyle('');
    setExperience(''); setFrequency('3'); setPreferredDays([]); setPlan(null);
  };

  const chip = (selected, accent) => ({
    padding: '8px 16px', borderRadius: 100, cursor: 'pointer', transition: 'all 0.2s',
    font: `400 13px ${s.FONT}`,
    background: selected ? `${accent}15` : '#f5f5f3',
    color: selected ? accent : '#666',
    border: `1.5px solid ${selected ? accent : '#e5e5e3'}`,
  });

  // ── LIST VIEW ──
  if (step === 'list') return (
    <div style={{ minHeight: '100vh', background: '#fafaf8' }}>
      <style>{`
        @media (max-width: 768px) {
          .mrx-weeks-grid { grid-template-columns: 1fr 1fr !important; }
          .mrx-plan-grid { grid-template-columns: 1fr 1fr !important; }
          .mrx-page-pad { padding: 16px !important; }
          .mrx-header-pad { padding: 20px 16px 0 !important; }
        }
        @media (max-width: 480px) {
          .mrx-weeks-grid { grid-template-columns: 1fr !important; }
          .mrx-plan-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
      <div style={{ padding: '32px 32px 0', borderBottom: '1px solid #eee' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ font: `500 10px ${s.MONO}`, textTransform: 'uppercase', letterSpacing: 3, color: theme.accent, marginBottom: 8 }}>
            Smart Programming
          </div>
          <h1 style={{ font: `400 32px ${s.DISPLAY}`, color: '#1a1a1a', marginBottom: 6 }}>
            Movement Prescription Engine
          </h1>
          <p style={{ font: `300 15px ${s.FONT}`, color: '#888', marginBottom: 24 }}>
            Intake assessment + rule-based engine generates personalized 4-week class plans
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: 32 }}>
        <button onClick={() => setStep('intake')} style={{
          padding: '14px 32px', borderRadius: 100, border: 'none',
          background: theme.accent, color: '#fff', font: `500 14px ${s.FONT}`,
          cursor: 'pointer', marginBottom: 32,
        }}>New Prescription</button>

        {prescriptions.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[...prescriptions].reverse().map(rx => (
              <div key={rx.id} onClick={() => setSelectedRx(selectedRx?.id === rx.id ? null : rx)} style={{
                padding: 20, borderRadius: 14, background: '#fff', border: '1px solid #eee',
                cursor: 'pointer', transition: 'all 0.2s',
                ...(selectedRx?.id === rx.id ? { borderColor: `${theme.accent}40` } : {}),
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ font: `500 15px ${s.FONT}`, color: '#1a1a1a' }}>{rx.clientName || 'Walk-in'}</div>
                    <div style={{ font: `400 12px ${s.FONT}`, color: '#999', marginTop: 2 }}>
                      {new Date(rx.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} — {rx.weeks?.[0]?.classes?.length || 0}x/week, {rx.intake?.experience}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {rx.topClasses?.slice(0, 3).map(c => (
                      <span key={c.id} style={{
                        padding: '4px 10px', borderRadius: 100, font: `400 10px ${s.FONT}`,
                        background: '#f5f5f3', color: '#888',
                      }}>{c.name}</span>
                    ))}
                    <button onClick={e => { e.stopPropagation(); deletePrescription(rx.id); setPrescriptions(getPrescriptions()); }} style={{
                      background: 'none', border: 'none', color: '#ccc', cursor: 'pointer', padding: 4,
                    }}>x</button>
                  </div>
                </div>

                {selectedRx?.id === rx.id && rx.weeks && (
                  <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #f0f0f0' }}>
                    {rx.insights?.length > 0 && (
                      <div style={{ marginBottom: 16, padding: 14, borderRadius: 10, background: '#FEF3C7', border: '1px solid #FDE68A' }}>
                        <div style={{ font: `500 10px ${s.MONO}`, textTransform: 'uppercase', letterSpacing: 1, color: '#92400E', marginBottom: 6 }}>Clinical Notes</div>
                        {rx.insights.map((ins, i) => (
                          <div key={i} style={{ font: `300 12px ${s.FONT}`, color: '#92400E', lineHeight: 1.5, marginBottom: 2 }}>- {ins}</div>
                        ))}
                      </div>
                    )}
                    <div className="mrx-weeks-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                      {rx.weeks.map(week => (
                        <div key={week.week} style={{ padding: 14, borderRadius: 10, background: '#fafaf8' }}>
                          <div style={{ font: `600 12px ${s.MONO}`, color: theme.accent, marginBottom: 8 }}>Week {week.week}</div>
                          {week.classes.map((wc, i) => (
                            <div key={i} style={{ marginBottom: 8 }}>
                              <div style={{ font: `500 12px ${s.FONT}`, color: '#1a1a1a' }}>{wc.day}</div>
                              <div style={{ font: `400 11px ${s.FONT}`, color: theme.accent }}>{wc.class.name}</div>
                              <div style={{ font: `300 10px ${s.FONT}`, color: '#bbb' }}>{wc.note}</div>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: 48, color: '#ccc' }}>
            <div style={{ font: `300 48px ${s.DISPLAY}`, marginBottom: 8 }}>Rx</div>
            <div style={{ font: `300 14px ${s.FONT}` }}>No prescriptions yet — create one above</div>
          </div>
        )}
      </div>
    </div>
  );

  // ── INTAKE FORM ──
  if (step === 'intake') return (
    <div style={{ minHeight: '100vh', background: '#fafaf8' }}>
      <div style={{ padding: '32px 32px 0', borderBottom: '1px solid #eee' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ font: `500 10px ${s.MONO}`, textTransform: 'uppercase', letterSpacing: 3, color: theme.accent, marginBottom: 8 }}>Step 1</div>
            <h1 style={{ font: `400 28px ${s.DISPLAY}`, color: '#1a1a1a', marginBottom: 24 }}>Client Intake</h1>
          </div>
          <button onClick={() => { resetForm(); setStep('list'); }} style={{
            padding: '8px 18px', borderRadius: 100, border: '1px solid #ddd',
            background: 'transparent', color: '#888', font: `400 13px ${s.FONT}`, cursor: 'pointer',
          }}>Cancel</button>
        </div>
      </div>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: 32 }}>
        {/* Client Name */}
        <div style={{ marginBottom: 32 }}>
          <label style={{ font: `500 13px ${s.FONT}`, color: '#1a1a1a', display: 'block', marginBottom: 8 }}>Client Name</label>
          <input value={clientName} onChange={e => setClientName(e.target.value)} placeholder="e.g. Sarah Martinez"
            style={{ padding: '12px 16px', borderRadius: 10, border: '1px solid #ddd', font: `400 14px ${s.FONT}`, width: '100%', maxWidth: 360, outline: 'none' }} />
        </div>

        {/* Injuries */}
        <div style={{ marginBottom: 32 }}>
          <label style={{ font: `500 13px ${s.FONT}`, color: '#1a1a1a', display: 'block', marginBottom: 4 }}>Injuries or Conditions</label>
          <div style={{ font: `300 12px ${s.FONT}`, color: '#999', marginBottom: 12 }}>Select all that apply — this shapes contraindications and class modifications</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {INJURIES.map(inj => (
              <div key={inj.id} onClick={() => toggleArray(injuries, setInjuries, inj.id)}
                style={chip(injuries.includes(inj.id), '#EF4444')}>
                {inj.label}
              </div>
            ))}
          </div>
        </div>

        {/* Goals */}
        <div style={{ marginBottom: 32 }}>
          <label style={{ font: `500 13px ${s.FONT}`, color: '#1a1a1a', display: 'block', marginBottom: 4 }}>Goals <span style={{ color: '#EF4444' }}>*</span></label>
          <div style={{ font: `300 12px ${s.FONT}`, color: '#999', marginBottom: 12 }}>What does this client want to achieve? Select 1-3</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {GOALS.map(g => (
              <div key={g.id} onClick={() => toggleArray(goals, setGoals, g.id)}
                style={chip(goals.includes(g.id), theme.accent)}>
                {g.label}
              </div>
            ))}
          </div>
        </div>

        {/* Lifestyle */}
        <div style={{ marginBottom: 32 }}>
          <label style={{ font: `500 13px ${s.FONT}`, color: '#1a1a1a', display: 'block', marginBottom: 4 }}>Lifestyle <span style={{ color: '#EF4444' }}>*</span></label>
          <div style={{ font: `300 12px ${s.FONT}`, color: '#999', marginBottom: 12 }}>Primary daily activity — informs muscle imbalance assumptions</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {LIFESTYLES.map(ls => (
              <div key={ls.id} onClick={() => setLifestyle(ls.id)}
                style={chip(lifestyle === ls.id, theme.accent)}>
                {ls.label}
              </div>
            ))}
          </div>
        </div>

        {/* Experience */}
        <div style={{ marginBottom: 32 }}>
          <label style={{ font: `500 13px ${s.FONT}`, color: '#1a1a1a', display: 'block', marginBottom: 4 }}>Pilates Experience <span style={{ color: '#EF4444' }}>*</span></label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
            {EXPERIENCE_LEVELS.map(exp => (
              <div key={exp.id} onClick={() => setExperience(exp.id)}
                style={chip(experience === exp.id, theme.accent)}>
                {exp.label}
              </div>
            ))}
          </div>
        </div>

        {/* Frequency */}
        <div style={{ marginBottom: 32 }}>
          <label style={{ font: `500 13px ${s.FONT}`, color: '#1a1a1a', display: 'block', marginBottom: 12 }}>Target Frequency</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {FREQUENCIES.map(f => (
              <div key={f.id} onClick={() => setFrequency(f.id)}
                style={chip(frequency === f.id, theme.accent)}>
                {f.label}
              </div>
            ))}
          </div>
        </div>

        {/* Preferred Days */}
        <div style={{ marginBottom: 40 }}>
          <label style={{ font: `500 13px ${s.FONT}`, color: '#1a1a1a', display: 'block', marginBottom: 4 }}>Preferred Days</label>
          <div style={{ font: `300 12px ${s.FONT}`, color: '#999', marginBottom: 12 }}>Optional — leave blank for weekday default</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {DAYS.map(d => (
              <div key={d} onClick={() => toggleArray(preferredDays, setPreferredDays, d)}
                style={chip(preferredDays.includes(d), theme.accent)}>
                {d.slice(0, 3)}
              </div>
            ))}
          </div>
        </div>

        {/* Generate */}
        <button onClick={handleGenerate} disabled={!experience || !lifestyle || goals.length === 0} style={{
          padding: '14px 40px', borderRadius: 100, border: 'none',
          background: (!experience || !lifestyle || goals.length === 0) ? '#ddd' : theme.accent,
          color: '#fff', font: `500 15px ${s.FONT}`, cursor: 'pointer',
        }}>Generate Prescription</button>
      </div>
    </div>
  );

  // ── PLAN VIEW ──
  if (step === 'plan' && plan) return (
    <div style={{ minHeight: '100vh', background: '#fafaf8' }}>
      <div style={{ padding: '32px 32px 0', borderBottom: '1px solid #eee' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ font: `500 10px ${s.MONO}`, textTransform: 'uppercase', letterSpacing: 3, color: theme.accent, marginBottom: 8 }}>
            Movement Prescription
          </div>
          <h1 style={{ font: `400 28px ${s.DISPLAY}`, color: '#1a1a1a', marginBottom: 6 }}>
            {plan.clientName || 'Walk-in'} — 4-Week Plan
          </h1>
          <p style={{ font: `300 14px ${s.FONT}`, color: '#888', marginBottom: 24 }}>
            {plan.intake.experience} · {plan.intake.goals.map(g => GOALS.find(gl => gl.id === g)?.label).join(', ')}
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: 32 }}>
        {/* Contraindications */}
        {plan.contraindicated.length > 0 && (
          <div style={{
            padding: 16, borderRadius: 12, background: '#FEF2F2', border: '1px solid #FECACA', marginBottom: 24,
          }}>
            <div style={{ font: `500 11px ${s.MONO}`, textTransform: 'uppercase', letterSpacing: 1, color: '#DC2626', marginBottom: 6 }}>Contraindicated Classes</div>
            <div style={{ font: `300 13px ${s.FONT}`, color: '#991B1B' }}>
              {plan.contraindicated.map(cId => CLASSES.find(c => c.id === cId)?.name).filter(Boolean).join(', ')} — excluded based on injury profile
            </div>
          </div>
        )}

        {/* Clinical insights */}
        {plan.insights.length > 0 && (
          <div style={{
            padding: 16, borderRadius: 12, background: '#FEF3C7', border: '1px solid #FDE68A', marginBottom: 24,
          }}>
            <div style={{ font: `500 11px ${s.MONO}`, textTransform: 'uppercase', letterSpacing: 1, color: '#92400E', marginBottom: 8 }}>Clinical Notes</div>
            {plan.insights.map((ins, i) => (
              <div key={i} style={{ font: `300 13px ${s.FONT}`, color: '#92400E', lineHeight: 1.6, marginBottom: 4 }}>- {ins}</div>
            ))}
          </div>
        )}

        {/* 4-week grid */}
        <div className="mrx-plan-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
          {plan.weeks.map(week => (
            <div key={week.week} style={{
              padding: 24, borderRadius: 16, background: '#fff', border: '1px solid #eee',
            }}>
              <div style={{
                font: `600 13px ${s.MONO}`, color: theme.accent, marginBottom: 16,
                paddingBottom: 8, borderBottom: `2px solid ${theme.accent}20`,
              }}>Week {week.week}</div>
              {week.classes.map((wc, i) => (
                <div key={i} style={{
                  padding: 12, borderRadius: 10, background: '#fafaf8', marginBottom: 8,
                }}>
                  <div style={{ font: `500 11px ${s.MONO}`, color: '#999', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
                    {wc.day}
                  </div>
                  <div style={{ font: `500 14px ${s.FONT}`, color: '#1a1a1a', marginBottom: 2 }}>
                    {wc.class.name}
                  </div>
                  <div style={{ display: 'flex', gap: 4, alignItems: 'center', marginBottom: 4 }}>
                    <span style={{
                      padding: '2px 8px', borderRadius: 100, font: `400 9px ${s.MONO}`,
                      background: wc.class.intensity === 'high' ? '#FEF2F2' : wc.class.intensity === 'medium' ? '#FEF3C7' : '#ECFDF5',
                      color: wc.class.intensity === 'high' ? '#DC2626' : wc.class.intensity === 'medium' ? '#D97706' : '#059669',
                      textTransform: 'uppercase', letterSpacing: 0.5,
                    }}>{wc.class.intensity}</span>
                    <span style={{ font: `400 10px ${s.FONT}`, color: '#bbb' }}>{wc.class.duration}min</span>
                  </div>
                  <div style={{ font: `300 10px ${s.FONT}`, color: '#bbb', fontStyle: 'italic' }}>{wc.note}</div>
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Top class recommendations */}
        <div style={{
          padding: 24, borderRadius: 16, background: '#fff', border: '1px solid #eee', marginBottom: 32,
        }}>
          <div style={{ font: `500 10px ${s.MONO}`, textTransform: 'uppercase', letterSpacing: 2, color: theme.accent, marginBottom: 16 }}>
            Class Ranking (by intake match)
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {plan.topClasses.map((cls, i) => (
              <div key={cls.id} style={{
                padding: '12px 18px', borderRadius: 12, background: '#fafaf8',
                display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <span style={{ font: `700 18px ${s.DISPLAY}`, color: i === 0 ? theme.accent : '#ddd' }}>{i + 1}</span>
                <div>
                  <div style={{ font: `500 13px ${s.FONT}`, color: '#1a1a1a' }}>{cls.name}</div>
                  <div style={{ font: `400 10px ${s.FONT}`, color: '#999' }}>Score: {cls.score} · {cls.intensity} · {cls.muscles.join(', ')}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={() => { resetForm(); setStep('list'); }} style={{
            padding: '14px 28px', borderRadius: 100, border: '1px solid #ddd',
            background: 'transparent', color: '#888', font: `400 14px ${s.FONT}`, cursor: 'pointer',
          }}>Discard</button>
          <button onClick={() => setStep('intake')} style={{
            padding: '14px 28px', borderRadius: 100, border: `1.5px solid ${theme.accent}40`,
            background: 'transparent', color: theme.accent, font: `400 14px ${s.FONT}`, cursor: 'pointer',
          }}>Edit Intake</button>
          <button onClick={savePrescription} style={{
            padding: '14px 36px', borderRadius: 100, border: 'none',
            background: theme.accent, color: '#fff', font: `500 14px ${s.FONT}`, cursor: 'pointer',
          }}>Save Prescription</button>
        </div>
      </div>
    </div>
  );

  return null;
}

