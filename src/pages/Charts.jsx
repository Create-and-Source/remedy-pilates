// Session Notes — progress tracking, body map, session documentation
import { useState, useEffect, useRef, useCallback } from 'react';
import { useStyles } from '../theme';
import { getPatients, getServices, getProviders, subscribe } from '../data/store';

const NOTES_KEY = 'rp_session_notes';
function getNotes() { try { return JSON.parse(localStorage.getItem(NOTES_KEY)) || []; } catch { return []; } }
function saveNotes(n) { localStorage.setItem(NOTES_KEY, JSON.stringify(n)); }

// ── Muscle Group Map ──────────────────────────────────────────────────────────
// Front/back body: click to toggle activation state

const MUSCLE_GROUPS_FRONT = [
  { id: 'core',       label: 'Core',        x: 50, y: 38, side: 'front' },
  { id: 'quads-l',    label: 'Quads L',     x: 38, y: 58, side: 'front' },
  { id: 'quads-r',    label: 'Quads R',     x: 62, y: 58, side: 'front' },
  { id: 'hip-l',      label: 'Hip Flexor L',x: 37, y: 48, side: 'front' },
  { id: 'hip-r',      label: 'Hip Flexor R',x: 63, y: 48, side: 'front' },
  { id: 'chest',      label: 'Chest',       x: 50, y: 26, side: 'front' },
  { id: 'shoulders',  label: 'Shoulders',   x: 50, y: 19, side: 'front' },
  { id: 'biceps-l',   label: 'Biceps L',    x: 28, y: 32, side: 'front' },
  { id: 'biceps-r',   label: 'Biceps R',    x: 72, y: 32, side: 'front' },
  { id: 'calves-l',   label: 'Calves L',    x: 39, y: 76, side: 'front' },
  { id: 'calves-r',   label: 'Calves R',    x: 61, y: 76, side: 'front' },
  { id: 'adductors',  label: 'Inner Thighs',x: 50, y: 53, side: 'front' },
];

const MUSCLE_GROUPS_BACK = [
  { id: 'upper-back', label: 'Upper Back',  x: 50, y: 26, side: 'back' },
  { id: 'mid-back',   label: 'Mid Back',    x: 50, y: 35, side: 'back' },
  { id: 'lower-back', label: 'Low Back',    x: 50, y: 44, side: 'back' },
  { id: 'glutes-l',   label: 'Glutes L',    x: 38, y: 52, side: 'back' },
  { id: 'glutes-r',   label: 'Glutes R',    x: 62, y: 52, side: 'back' },
  { id: 'hamstrings-l',label:'Hamstrings L',x: 38, y: 62, side: 'back' },
  { id: 'hamstrings-r',label:'Hamstrings R',x: 62, y: 62, side: 'back' },
  { id: 'triceps-l',  label: 'Triceps L',   x: 28, y: 32, side: 'back' },
  { id: 'triceps-r',  label: 'Triceps R',   x: 72, y: 32, side: 'back' },
  { id: 'lats-l',     label: 'Lats L',      x: 35, y: 31, side: 'back' },
  { id: 'lats-r',     label: 'Lats R',      x: 65, y: 31, side: 'back' },
  { id: 'calves-back-l', label: 'Calves L', x: 39, y: 76, side: 'back' },
  { id: 'calves-back-r', label: 'Calves R', x: 61, y: 76, side: 'back' },
];

const ALL_MUSCLES = [...MUSCLE_GROUPS_FRONT, ...MUSCLE_GROUPS_BACK];

// Status colors for muscle groups
const MUSCLE_STATUS = {
  strong:    { color: '#16A34A', bg: '#DCFCE7', label: 'Strong / Activated' },
  working:   { color: '#CA8A04', bg: '#FEF9C3', label: 'Working On It' },
  attention: { color: '#DC2626', bg: '#FEE2E2', label: 'Needs Attention' },
};

const CLASS_TYPES = [
  'Reformer', 'Barre', 'Mat Pilates', 'Private Session', 'Group Reformer',
  'Tower', 'Chair', 'Barrel', 'Cardio Pilates', 'Body Sculpt', 'TRX',
  'Prenatal Pilates', 'Pilates for Seniors', 'Pilates for Rehabilitation',
  'Stretch & Restore', 'Online Session',
];

const SPRING_OPTIONS = [
  '1 red', '2 red', '3 red', '4 red',
  '1 red + 1 blue', '2 red + 1 blue', '3 red + 1 blue',
  '1 blue', '2 blue', '1 yellow', '1 green',
  'Max springs', 'No springs (bodyweight)',
];

// ── Seed data ────────────────────────────────────────────────────────────────

function buildSeedNotes(clients, instructors) {
  const c = (i) => clients[i] || {};
  const ins = (i) => instructors[i] || {};
  const d = (offset) => {
    const dt = new Date();
    dt.setDate(dt.getDate() + offset);
    return dt.toISOString().slice(0, 10);
  };

  return [
    {
      id: 'SN-001',
      clientId: c(0).id, clientName: `${c(0).firstName || 'Emma'} ${c(0).lastName || 'Johnson'}`,
      instructorId: ins(0).id, instructorName: ins(0).name || 'Sarah Chen',
      date: d(-3), classType: 'Reformer', duration: 55,
      status: 'complete',
      observations: 'Emma demonstrated strong hip flexor engagement during footwork series. Spinal articulation on long spine massage improved significantly from last session. Shoulder tension noted during pulling straps — cued to widen scapular base.',
      areasOfFocus: ['Core', 'Hip mobility', 'Shoulder integration'],
      springSettings: { footwork: '4 red', arms: '1 red + 1 blue', longBox: '2 red' },
      exercisesCompleted: ['Footwork (heels/balls/toes)', 'Hundred', 'Long spine massage', 'Pulling straps A + B', 'Elephant', 'Short box series', 'Snake (modified)'],
      flexibility: { forwardFold: 8, hipRotation: 7, shoulderMobility: 6 },
      strengthBenchmarks: { coreHold: 45, springResistance: '2 red + 1 blue', legPress: '4 red' },
      discomfortNotes: 'Mild right hip tightness at the start — resolved after warm-up.',
      goals: 'Build single-leg stability for standing work. Progress toward full snake on 2 red.',
      instructorRecommendations: 'Add single-leg footwork next session. Continue releasing shoulder girdle before pulling exercises.',
      muscleMap: { core: 'strong', quads: 'working', 'upper-back': 'working', shoulders: 'attention', 'hip-l': 'working', 'hip-r': 'attention' },
    },
    {
      id: 'SN-002',
      clientId: c(1).id, clientName: `${c(1).firstName || 'Marcus'} ${c(1).lastName || 'Rivera'}`,
      instructorId: ins(1).id, instructorName: ins(1).name || 'Jordan Kim',
      date: d(-5), classType: 'Private Session', duration: 60,
      status: 'complete',
      observations: 'Post-ACL rehab focus. Marcus is 4 months post-surgery. Demonstrated good quad activation but avoids full knee flexion in lunge variations. Excellent upper body strength — reformer box exercises felt effortless.',
      areasOfFocus: ['Knee rehabilitation', 'Quad activation', 'Single-leg balance'],
      springSettings: { footwork: '2 red', singleLeg: '1 red', upperBody: '2 red + 1 blue' },
      exercisesCompleted: ['Footwork (heels only)', 'Single-leg press (modified range)', 'Side-lying abduction series', 'Kneeling arm series on tower', 'Prone back extension', 'Seated roll-down on barrel'],
      flexibility: { forwardFold: 6, hipRotation: 5, shoulderMobility: 9 },
      strengthBenchmarks: { coreHold: 30, springResistance: '2 red', legPress: '2 red (modified)' },
      discomfortNotes: 'Reported 3/10 discomfort in right knee during lunge position. Stopped and modified immediately.',
      goals: 'Restore full range of motion in right knee. Return to Group Reformer by end of month.',
      instructorRecommendations: 'Stay with 2 red on footwork until full range is comfortable. Add standing balance exercises on soft surface next session.',
      muscleMap: { 'quads-l': 'working', 'quads-r': 'attention', 'glutes-l': 'working', 'glutes-r': 'working', core: 'strong', 'hamstrings-r': 'attention' },
    },
    {
      id: 'SN-003',
      clientId: c(2).id, clientName: `${c(2).firstName || 'Lily'} ${c(2).lastName || 'Park'}`,
      instructorId: ins(2).id, instructorName: ins(2).name || 'Mia Torres',
      date: d(-7), classType: 'Barre', duration: 50,
      status: 'complete',
      observations: 'Lily is progressing well in the barre fundamentals track. Turnout is improving — heels lifted cleanly in all plié variations. Core connection still needs work during high kick sequences. Great energy and attitude throughout.',
      areasOfFocus: ['Turnout', 'Core during standing work', 'Arabesque extension'],
      springSettings: {},
      exercisesCompleted: ['Parallel relevé warm-up', 'Plié series (parallel + turned out)', 'Tendu + dégagé', 'Grand battement', 'Arabesque series', 'Floor barre: leg circles + clam shells', 'Standing balance sequence'],
      flexibility: { forwardFold: 9, hipRotation: 8, shoulderMobility: 8 },
      strengthBenchmarks: { coreHold: 40, springResistance: 'N/A (barre)', legPress: 'N/A (barre)' },
      discomfortNotes: 'None reported.',
      goals: 'Achieve 90° arabesque with control. Hold relevé balance for 10 counts without barre support.',
      instructorRecommendations: 'Practice single-leg balance at home. Start adding small resistance band to clamshells.',
      muscleMap: { glutes: 'strong', 'glutes-l': 'strong', 'glutes-r': 'strong', 'calves-l': 'working', 'calves-r': 'working', adductors: 'working', core: 'attention', quads: 'strong' },
    },
    {
      id: 'SN-004',
      clientId: c(3).id, clientName: `${c(3).firstName || 'Diana'} ${c(3).lastName || 'Chen'}`,
      instructorId: ins(0).id, instructorName: ins(0).name || 'Sarah Chen',
      date: d(-10), classType: 'Mat Pilates', duration: 45,
      status: 'complete',
      observations: 'Diana is working through diastasis recti recovery (confirmed 2 finger separation). Modified all flexion work — no traditional crunches or full roll-ups. Transverse abdominis activation is improving. Breathing coordination with movement is excellent.',
      areasOfFocus: ['Diastasis recti recovery', 'Transverse abdominis', 'Pelvic floor integration'],
      springSettings: {},
      exercisesCompleted: ['Pelvic tilt series', 'Heel slides', 'Dead bug (modified)', 'Bird-dog', 'Side plank preparation', 'Bridge variations', 'Cat-cow breathing', 'Clam shells'],
      flexibility: { forwardFold: 7, hipRotation: 6, shoulderMobility: 7 },
      strengthBenchmarks: { coreHold: 25, springResistance: 'N/A (mat)', legPress: 'N/A (mat)' },
      discomfortNotes: 'None. Checked for doming — none observed during exercises.',
      goals: 'Close diastasis to 1 finger. Progress to full roll-up in 8 weeks.',
      instructorRecommendations: 'Continue avoiding loaded spinal flexion. Add standing core work at wall next session.',
      muscleMap: { core: 'working', 'lower-back': 'working', 'glutes-l': 'working', 'glutes-r': 'working', 'mid-back': 'working' },
    },
    {
      id: 'SN-005',
      clientId: c(4).id, clientName: `${c(4).firstName || 'Alex'} ${c(4).lastName || 'Morgan'}`,
      instructorId: ins(3).id, instructorName: ins(3).name || 'Riley Nakamura',
      date: d(-14), classType: 'Tower', duration: 55,
      status: 'complete',
      observations: 'Tower work is Alex\'s favorite — strong upper body allows for advanced push through and pull through variations. Noticed lateral hip drop in standing tower exercises, cued alignment repeatedly. Roll-down bar control was excellent with 4 yellow springs.',
      areasOfFocus: ['Lateral hip stability', 'Upper body strength', 'Tower fundamentals'],
      springSettings: { rollDownBar: '4 yellow', legSprings: '2 blue', armSprings: '1 red' },
      exercisesCompleted: ['Roll-down bar series', 'Push through bar', 'Arm springs (standing)', 'Leg springs supine', 'Monkey', 'Tower kneeling cat', 'Standing roll-down with bar'],
      flexibility: { forwardFold: 8, hipRotation: 7, shoulderMobility: 9 },
      strengthBenchmarks: { coreHold: 55, springResistance: '2 red + 1 blue', legPress: 'N/A (tower)' },
      discomfortNotes: 'None.',
      goals: 'Eliminate lateral hip drop during standing tower work. Progress to advanced push-through variations.',
      instructorRecommendations: 'Single-leg standing exercises to improve lateral hip stability before next tower session.',
      muscleMap: { core: 'strong', 'upper-back': 'strong', 'lats-l': 'strong', 'lats-r': 'strong', 'hip-l': 'attention', 'hip-r': 'attention', shoulders: 'strong' },
    },
    {
      id: 'SN-006',
      clientId: c(5).id, clientName: `${c(5).firstName || 'James'} ${c(5).lastName || 'Wilson'}`,
      instructorId: ins(2).id, instructorName: ins(2).name || 'Mia Torres',
      date: d(-18), classType: 'Reformer', duration: 55,
      status: 'complete',
      observations: 'James has been coming for 6 months and the progress is remarkable. Completed full advanced short box series including round back and flat back with control. Elephant balance held for 5 breaths. Ready to introduce side splits on reformer.',
      areasOfFocus: ['Advanced short box', 'Single-leg balance', 'Side splits preparation'],
      springSettings: { footwork: '4 red', shortBox: 'no springs', elephant: '2 red', sideWork: '3 red' },
      exercisesCompleted: ['Footwork series', 'Hundred', 'Coordination', 'Short box (round + flat + side to side + tree)', 'Elephant (balance variation)', 'Long stretch series', 'Kneeling side splits (intro)', 'Mermaid'],
      flexibility: { forwardFold: 10, hipRotation: 9, shoulderMobility: 8 },
      strengthBenchmarks: { coreHold: 70, springResistance: '3 red', legPress: '4 red + 1 blue' },
      discomfortNotes: 'None.',
      goals: 'Full side splits on reformer. Begin advanced kneeling series.',
      instructorRecommendations: 'Cleared for advanced group reformer classes. Introduce Wunda chair work.',
      muscleMap: { core: 'strong', 'upper-back': 'strong', 'lower-back': 'strong', 'glutes-l': 'strong', 'glutes-r': 'strong', adductors: 'working', 'hamstrings-l': 'strong', 'hamstrings-r': 'strong' },
    },
    {
      id: 'SN-007',
      clientId: c(6).id, clientName: `${c(6).firstName || 'Ruth'} ${c(6).lastName || 'Martinez'}`,
      instructorId: ins(1).id, instructorName: ins(1).name || 'Jordan Kim',
      date: d(-21), classType: 'Pilates for Seniors', duration: 45,
      status: 'complete',
      observations: 'Ruth (age 74) is making wonderful progress in balance and joint mobility. Hip flexor range has increased noticeably over the past month. Seated reformer work is preferred — standing with support only. Great engagement and enthusiasm.',
      areasOfFocus: ['Balance', 'Joint mobility', 'Gentle strength'],
      springSettings: { footwork: '2 red', seatWork: '1 red' },
      exercisesCompleted: ['Seated footwork (low springs)', 'Seated arm series', 'Supine leg circles', 'Hip flexor stretch on reformer', 'Seated mermaid', 'Standing balance at bar', 'Seated spine twist'],
      flexibility: { forwardFold: 5, hipRotation: 5, shoulderMobility: 6 },
      strengthBenchmarks: { coreHold: 15, springResistance: '1 red', legPress: '2 red' },
      discomfortNotes: 'Mild left knee stiffness at start — warm-up helped significantly.',
      goals: 'Maintain current range of motion. Work toward unsupported standing balance for 5 counts.',
      instructorRecommendations: 'Continue twice-weekly sessions. Add simple hand weights for seated arm work.',
      muscleMap: { 'hip-l': 'working', 'hip-r': 'working', core: 'working', 'glutes-l': 'working', 'glutes-r': 'working', 'calves-l': 'attention', 'calves-r': 'working' },
    },
    {
      id: 'SN-008',
      clientId: c(7).id, clientName: `${c(7).firstName || 'Priya'} ${c(7).lastName || 'Kapoor'}`,
      instructorId: ins(3).id, instructorName: ins(3).name || 'Riley Nakamura',
      date: d(-25), classType: 'Prenatal Pilates', duration: 50,
      status: 'complete',
      observations: 'Priya is 22 weeks pregnant, second child. Excellent body awareness and prior Pilates experience. Modified all supine work past 20 min to side-lying. Pelvic floor exercises well-cued and executed. Reported improved back comfort since starting prenatal sessions.',
      areasOfFocus: ['Pelvic floor', 'Spinal support', 'Breathing coordination'],
      springSettings: { seated: '1 red', sidelyingWork: '1 blue' },
      exercisesCompleted: ['Seated breathing', 'Seated arm series (1 red)', 'Modified cat-cow on hands/knees', 'Side-lying leg series', 'Side-lying clam shells', 'Pelvic floor activation sequence', 'Standing wall series', 'Modified mermaid'],
      flexibility: { forwardFold: 7, hipRotation: 6, shoulderMobility: 7 },
      strengthBenchmarks: { coreHold: 20, springResistance: '1 red', legPress: 'N/A (prenatal)' },
      discomfortNotes: 'None. No round ligament discomfort noted this session.',
      goals: 'Maintain core and pelvic floor strength through pregnancy. Prepare for postpartum recovery.',
      instructorRecommendations: 'Schedule postnatal intro session for 8 weeks postpartum. Continue twice-weekly sessions.',
      muscleMap: { core: 'working', 'lower-back': 'working', 'glutes-l': 'working', 'glutes-r': 'working', adductors: 'working' },
    },
  ];
}

// ── Body Map SVG ─────────────────────────────────────────────────────────────

function BodyMapSVG({ side, muscleMap, onToggle, s }) {
  const muscles = side === 'front' ? MUSCLE_GROUPS_FRONT : MUSCLE_GROUPS_BACK;

  return (
    <svg viewBox="0 0 100 100" style={{ width: '100%', maxWidth: 200, height: 'auto' }}>
      {/* Simple body outline */}
      {side === 'front' ? (
        <>
          {/* Head */}
          <ellipse cx="50" cy="8" rx="8" ry="9" fill="#E5E7EB" stroke="#D1D5DB" strokeWidth="0.8" />
          {/* Neck */}
          <rect x="46" y="16" width="8" height="5" rx="2" fill="#E5E7EB" stroke="#D1D5DB" strokeWidth="0.5" />
          {/* Torso */}
          <path d="M32 21 Q28 30 29 42 Q29 50 34 55 Q42 58 50 58 Q58 58 66 55 Q71 50 71 42 Q72 30 68 21 Q59 18 50 18 Q41 18 32 21Z"
            fill="#E5E7EB" stroke="#D1D5DB" strokeWidth="0.8" />
          {/* Left arm */}
          <path d="M32 21 Q24 28 22 40 Q21 46 24 50 L27 38 Q28 30 32 21Z" fill="#E5E7EB" stroke="#D1D5DB" strokeWidth="0.5" />
          {/* Right arm */}
          <path d="M68 21 Q76 28 78 40 Q79 46 76 50 L73 38 Q72 30 68 21Z" fill="#E5E7EB" stroke="#D1D5DB" strokeWidth="0.5" />
          {/* Left leg */}
          <path d="M34 55 Q31 65 31 75 Q31 84 34 88 Q37 92 40 88 Q42 82 42 72 Q43 62 42 55Z" fill="#E5E7EB" stroke="#D1D5DB" strokeWidth="0.5" />
          {/* Right leg */}
          <path d="M66 55 Q69 65 69 75 Q69 84 66 88 Q63 92 60 88 Q58 82 58 72 Q57 62 58 55Z" fill="#E5E7EB" stroke="#D1D5DB" strokeWidth="0.5" />
        </>
      ) : (
        <>
          {/* Head back */}
          <ellipse cx="50" cy="8" rx="8" ry="9" fill="#E5E7EB" stroke="#D1D5DB" strokeWidth="0.8" />
          {/* Neck */}
          <rect x="46" y="16" width="8" height="5" rx="2" fill="#E5E7EB" stroke="#D1D5DB" strokeWidth="0.5" />
          {/* Torso back */}
          <path d="M32 21 Q28 30 29 42 Q29 50 34 55 Q42 58 50 58 Q58 58 66 55 Q71 50 71 42 Q72 30 68 21 Q59 18 50 18 Q41 18 32 21Z"
            fill="#E5E7EB" stroke="#D1D5DB" strokeWidth="0.8" />
          {/* Spine line */}
          <line x1="50" y1="21" x2="50" y2="55" stroke="#D1D5DB" strokeWidth="0.5" strokeDasharray="1.5,1" />
          {/* Arms */}
          <path d="M32 21 Q24 28 22 40 Q21 46 24 50 L27 38 Q28 30 32 21Z" fill="#E5E7EB" stroke="#D1D5DB" strokeWidth="0.5" />
          <path d="M68 21 Q76 28 78 40 Q79 46 76 50 L73 38 Q72 30 68 21Z" fill="#E5E7EB" stroke="#D1D5DB" strokeWidth="0.5" />
          {/* Legs */}
          <path d="M34 55 Q31 65 31 75 Q31 84 34 88 Q37 92 40 88 Q42 82 42 72 Q43 62 42 55Z" fill="#E5E7EB" stroke="#D1D5DB" strokeWidth="0.5" />
          <path d="M66 55 Q69 65 69 75 Q69 84 66 88 Q63 92 60 88 Q58 82 58 72 Q57 62 58 55Z" fill="#E5E7EB" stroke="#D1D5DB" strokeWidth="0.5" />
        </>
      )}

      {/* Muscle group dots */}
      {muscles.map(m => {
        const status = muscleMap?.[m.id];
        const col = status ? MUSCLE_STATUS[status] : null;
        return (
          <g key={m.id} onClick={() => onToggle && onToggle(m.id, side)} style={{ cursor: onToggle ? 'pointer' : 'default' }}>
            <circle
              cx={m.x} cy={m.y} r={onToggle ? 4.5 : 4}
              fill={col ? col.bg : 'rgba(255,255,255,0.7)'}
              stroke={col ? col.color : '#9CA3AF'}
              strokeWidth={status ? 1.2 : 0.8}
              style={{ transition: 'all 0.2s' }}
            />
            {status && (
              <circle cx={m.x} cy={m.y} r={2}
                fill={MUSCLE_STATUS[status].color}
              />
            )}
          </g>
        );
      })}
    </svg>
  );
}

// ── Legend ────────────────────────────────────────────────────────────────────

function BodyMapLegend({ s }) {
  return (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 8 }}>
      {Object.entries(MUSCLE_STATUS).map(([key, val]) => (
        <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: val.color }} />
          <span style={{ font: `400 11px ${s.FONT}`, color: s.text2 }}>{val.label}</span>
        </div>
      ))}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'white', border: '1px solid #9CA3AF' }} />
        <span style={{ font: `400 11px ${s.FONT}`, color: s.text2 }}>Not marked</span>
      </div>
    </div>
  );
}

// ── Status Badge ──────────────────────────────────────────────────────────────

const STATUS_STYLES = {
  complete: { bg: '#F0FDF4', color: '#16A34A', label: 'Complete' },
  draft:    { bg: '#FFF7ED', color: '#CA8A04', label: 'Draft' },
  pending:  { bg: '#EFF6FF', color: '#2563EB', label: 'Pending Review' },
};

function StatusBadge({ status, s }) {
  const st = STATUS_STYLES[status] || STATUS_STYLES.draft;
  return (
    <span style={{ padding: '3px 10px', borderRadius: 100, font: `500 10px ${s.FONT}`, textTransform: 'uppercase', letterSpacing: 0.5, background: st.bg, color: st.color }}>
      {st.label}
    </span>
  );
}

// ── Progress Sparkline ────────────────────────────────────────────────────────

function MiniSparkline({ values, color }) {
  if (!values || values.length < 2) return null;
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  const w = 80, h = 28;
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 4) - 2;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg width={w} height={h} style={{ display: 'block' }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={pts.split(' ').slice(-1)[0].split(',')[0]} cy={pts.split(' ').slice(-1)[0].split(',')[1]} r="2.5" fill={color} />
    </svg>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function Charts() {
  const s = useStyles();
  const [, setTick] = useState(0);
  useEffect(() => subscribe(() => setTick(t => t + 1)), []);

  const clients = getPatients();
  const services = getServices();
  const instructors = getProviders();

  const [notes, setNotes] = useState(() => {
    const stored = getNotes();
    if (stored.length > 0) return stored;
    const seed = buildSeedNotes(clients, instructors);
    saveNotes(seed);
    return seed;
  });

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [view, setView] = useState('list'); // 'list' | 'detail' | 'form'
  const [selected, setSelected] = useState(null);
  const [bodyMapTab, setBodyMapTab] = useState('front');

  // ── Form state ──
  const blankForm = {
    clientId: '', instructorId: '', date: new Date().toISOString().slice(0, 10),
    classType: '', duration: 55, status: 'draft',
    observations: '', areasOfFocus: [], springSettings: {},
    exercisesCompleted: [], flexibility: { forwardFold: '', hipRotation: '', shoulderMobility: '' },
    strengthBenchmarks: { coreHold: '', springResistance: '', legPress: '' },
    discomfortNotes: '', goals: '', instructorRecommendations: '', muscleMap: {},
  };
  const [form, setForm] = useState(blankForm);
  const [areaInput, setAreaInput] = useState('');
  const [exerciseInput, setExerciseInput] = useState('');
  const [springKey, setSpringKey] = useState('');
  const [springVal, setSpringVal] = useState('');
  const [muscleMapTabForm, setMuscleMapTabForm] = useState('front');

  const refresh = useCallback((updated) => {
    setNotes(updated);
    saveNotes(updated);
  }, []);

  const openNew = () => {
    setForm({ ...blankForm });
    setView('form');
    setSelected(null);
  };

  const openEdit = (note) => {
    setForm({ ...note });
    setSelected(note);
    setView('form');
  };

  const openDetail = (note) => {
    setSelected(note);
    setView('detail');
  };

  const handleDelete = (id) => {
    if (!confirm('Delete this session note?')) return;
    const updated = notes.filter(n => n.id !== id);
    refresh(updated);
    if (selected?.id === id) { setSelected(null); setView('list'); }
  };

  const handleSave = () => {
    const client = clients.find(p => p.id === form.clientId);
    const instructor = instructors.find(p => p.id === form.instructorId);
    const noteData = {
      ...form,
      clientName: client ? `${client.firstName} ${client.lastName}` : form.clientName,
      instructorName: instructor ? instructor.name : form.instructorName,
    };
    let updated;
    if (selected) {
      updated = notes.map(n => n.id === selected.id ? { ...n, ...noteData } : n);
    } else {
      updated = [{ ...noteData, id: `SN-${Date.now()}` }, ...notes];
    }
    refresh(updated);
    setView('list');
    setSelected(null);
  };

  const toggleMuscle = (muscleId, side) => {
    const current = form.muscleMap?.[muscleId];
    const states = [null, 'strong', 'working', 'attention'];
    const idx = states.indexOf(current);
    const next = states[(idx + 1) % states.length];
    const newMap = { ...form.muscleMap };
    if (next === null) delete newMap[muscleId]; else newMap[muscleId] = next;
    setForm({ ...form, muscleMap: newMap });
  };

  const toggleMuscleDetail = (muscleId, side) => {
    const current = selected?.muscleMap?.[muscleId];
    const states = [null, 'strong', 'working', 'attention'];
    const idx = states.indexOf(current);
    const next = states[(idx + 1) % states.length];
    const newMap = { ...selected.muscleMap };
    if (next === null) delete newMap[muscleId]; else newMap[muscleId] = next;
    const updated = notes.map(n => n.id === selected.id ? { ...n, muscleMap: newMap } : n);
    setSelected({ ...selected, muscleMap: newMap });
    refresh(updated);
  };

  const addArea = () => {
    if (!areaInput.trim()) return;
    setForm({ ...form, areasOfFocus: [...(form.areasOfFocus || []), areaInput.trim()] });
    setAreaInput('');
  };

  const addExercise = () => {
    if (!exerciseInput.trim()) return;
    setForm({ ...form, exercisesCompleted: [...(form.exercisesCompleted || []), exerciseInput.trim()] });
    setExerciseInput('');
  };

  const addSpring = () => {
    if (!springKey.trim() || !springVal) return;
    setForm({ ...form, springSettings: { ...form.springSettings, [springKey.trim()]: springVal } });
    setSpringKey('');
    setSpringVal('');
  };

  // ── Filtered notes ──
  const filtered = notes.filter(n => {
    if (filterStatus !== 'all' && n.status !== filterStatus) return false;
    if (filterType !== 'all' && n.classType !== filterType) return false;
    if (search) {
      const q = search.toLowerCase();
      return (n.clientName || '').toLowerCase().includes(q) ||
        (n.classType || '').toLowerCase().includes(q) ||
        (n.instructorName || '').toLowerCase().includes(q);
    }
    return true;
  });

  // ── KPIs ──
  const total = notes.length;
  const thisMonth = notes.filter(n => n.date?.startsWith(new Date().toISOString().slice(0, 7))).length;
  const uniqueClients = new Set(notes.map(n => n.clientId)).size;
  const classTypeCounts = notes.reduce((acc, n) => { acc[n.classType] = (acc[n.classType] || 0) + 1; return acc; }, {});
  const topClass = Object.entries(classTypeCounts).sort(([, a], [, b]) => b - a)[0];

  // ── Progress chart data (flexibility over time for selected client) ──
  const clientNotesByDate = (clientId) =>
    notes.filter(n => n.clientId === clientId && n.date)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-8);

  const flexTrend = selected?.clientId
    ? clientNotesByDate(selected.clientId).map(n => Number(n.flexibility?.forwardFold) || 0).filter(v => v > 0)
    : [];

  const strengthTrend = selected?.clientId
    ? clientNotesByDate(selected.clientId).map(n => Number(n.strengthBenchmarks?.coreHold) || 0).filter(v => v > 0)
    : [];

  // ── Styles ──
  const card = { ...s.cardStyle, padding: 20, marginBottom: 0 };
  const inp = { ...s.input };
  const label = { ...s.label };

  const fmtDate = (d) => {
    if (!d) return '';
    return new Date(d + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // ══════════════════════════════════════════════════════════════════
  // ── FORM VIEW ──
  // ══════════════════════════════════════════════════════════════════
  if (view === 'form') {
    return (
      <div>
        <style>{`
          @media (max-width: 768px) {
            .sn-form-grid { grid-template-columns: 1fr !important; }
            .sn-measure-grid { grid-template-columns: 1fr !important; }
            .sn-body-tabs { flex-direction: row !important; }
          }
        `}</style>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
          <button onClick={() => { setView('list'); setSelected(null); }} style={{ ...s.pillGhost, padding: '6px 14px', fontSize: 13 }}>← Back</button>
          <h1 style={{ font: `600 24px ${s.FONT}`, color: s.text }}>
            {selected ? 'Edit Session Note' : 'New Session Note'}
          </h1>
        </div>

        <div style={{ display: 'grid', gap: 20, maxWidth: 900 }}>

          {/* ── Basic Info ── */}
          <div style={card}>
            <div style={{ font: `600 14px ${s.FONT}`, color: s.text, marginBottom: 16 }}>Session Details</div>
            <div className="sn-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={label}>Client</label>
                <select value={form.clientId} onChange={e => setForm({ ...form, clientId: e.target.value })} style={{ ...inp, cursor: 'pointer' }}>
                  <option value="">Select client...</option>
                  {clients.map(p => <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>)}
                </select>
              </div>
              <div>
                <label style={label}>Instructor</label>
                <select value={form.instructorId} onChange={e => setForm({ ...form, instructorId: e.target.value })} style={{ ...inp, cursor: 'pointer' }}>
                  <option value="">Select instructor...</option>
                  {instructors.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label style={label}>Date</label>
                <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} style={inp} />
              </div>
              <div>
                <label style={label}>Class Type</label>
                <select value={form.classType} onChange={e => setForm({ ...form, classType: e.target.value })} style={{ ...inp, cursor: 'pointer' }}>
                  <option value="">Select class type...</option>
                  {CLASS_TYPES.map(ct => <option key={ct} value={ct}>{ct}</option>)}
                </select>
              </div>
              <div>
                <label style={label}>Duration (minutes)</label>
                <input type="number" value={form.duration} onChange={e => setForm({ ...form, duration: parseInt(e.target.value) || 55 })} style={inp} min={15} max={120} />
              </div>
              <div>
                <label style={label}>Status</label>
                <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} style={{ ...inp, cursor: 'pointer' }}>
                  <option value="draft">Draft</option>
                  <option value="complete">Complete</option>
                  <option value="pending">Pending Review</option>
                </select>
              </div>
            </div>
          </div>

          {/* ── Session Notes ── */}
          <div style={card}>
            <div style={{ font: `600 14px ${s.FONT}`, color: s.text, marginBottom: 16 }}>Session Notes</div>
            <div style={{ display: 'grid', gap: 14 }}>
              <div>
                <label style={label}>Observations</label>
                <textarea value={form.observations} onChange={e => setForm({ ...form, observations: e.target.value })} rows={4} style={{ ...inp, resize: 'vertical' }} placeholder="Form quality, alignment cues, notable moments, technique observations..." />
              </div>
              <div>
                <label style={label}>Discomfort / Pain Notes</label>
                <textarea value={form.discomfortNotes} onChange={e => setForm({ ...form, discomfortNotes: e.target.value })} rows={2} style={{ ...inp, resize: 'vertical' }} placeholder="e.g. Reported mild lower back tightness during extension — resolved with spring reduction" />
              </div>
              <div>
                <label style={label}>Client Goals</label>
                <textarea value={form.goals} onChange={e => setForm({ ...form, goals: e.target.value })} rows={2} style={{ ...inp, resize: 'vertical' }} placeholder="Client's stated goals and progress toward them..." />
              </div>
              <div>
                <label style={label}>Instructor Recommendations for Next Session</label>
                <textarea value={form.instructorRecommendations} onChange={e => setForm({ ...form, instructorRecommendations: e.target.value })} rows={2} style={{ ...inp, resize: 'vertical' }} placeholder="Focus areas, progression suggestions, modifications to try..." />
              </div>
            </div>
          </div>

          {/* ── Areas of Focus + Exercises ── */}
          <div className="sn-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={card}>
              <div style={{ font: `600 14px ${s.FONT}`, color: s.text, marginBottom: 12 }}>Areas of Focus</div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                <input value={areaInput} onChange={e => setAreaInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && addArea()} style={{ ...inp, flex: 1 }} placeholder="e.g. Core, Hip mobility..." />
                <button onClick={addArea} style={s.pillAccent}>Add</button>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {(form.areasOfFocus || []).map((area, i) => (
                  <span key={i} style={{ padding: '4px 10px', borderRadius: 100, background: s.accentLight, color: s.accent, font: `500 12px ${s.FONT}`, display: 'flex', alignItems: 'center', gap: 6 }}>
                    {area}
                    <button onClick={() => setForm({ ...form, areasOfFocus: form.areasOfFocus.filter((_, j) => j !== i) })} style={{ background: 'none', border: 'none', cursor: 'pointer', color: s.accent, padding: 0, fontSize: 14, lineHeight: 1 }}>×</button>
                  </span>
                ))}
              </div>
            </div>
            <div style={card}>
              <div style={{ font: `600 14px ${s.FONT}`, color: s.text, marginBottom: 12 }}>Exercises Completed</div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                <input value={exerciseInput} onChange={e => setExerciseInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && addExercise()} style={{ ...inp, flex: 1 }} placeholder="e.g. Hundred, Roll-up..." />
                <button onClick={addExercise} style={s.pillAccent}>Add</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 160, overflowY: 'auto' }}>
                {(form.exercisesCompleted || []).map((ex, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 8px', background: '#F9F9F9', borderRadius: 6 }}>
                    <span style={{ font: `400 12px ${s.FONT}`, color: s.text }}>{ex}</span>
                    <button onClick={() => setForm({ ...form, exercisesCompleted: form.exercisesCompleted.filter((_, j) => j !== i) })} style={{ background: 'none', border: 'none', cursor: 'pointer', color: s.text3, fontSize: 14 }}>×</button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Spring Settings ── */}
          <div style={card}>
            <div style={{ font: `600 14px ${s.FONT}`, color: s.text, marginBottom: 12 }}>Spring Settings Used</div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <input value={springKey} onChange={e => setSpringKey(e.target.value)} style={{ ...inp, flex: 1 }} placeholder="Exercise name (e.g. Footwork)" />
              <select value={springVal} onChange={e => setSpringVal(e.target.value)} style={{ ...inp, width: 160, cursor: 'pointer' }}>
                <option value="">Spring setting...</option>
                {SPRING_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
              <button onClick={addSpring} style={s.pillAccent}>Add</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8 }}>
              {Object.entries(form.springSettings || {}).map(([k, v]) => (
                <div key={k} style={{ padding: '8px 12px', background: '#F9F9F9', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ font: `500 12px ${s.FONT}`, color: s.text }}>{k}</div>
                    <div style={{ font: `400 11px ${s.MONO}`, color: s.accent }}>{v}</div>
                  </div>
                  <button onClick={() => { const m = { ...form.springSettings }; delete m[k]; setForm({ ...form, springSettings: m }); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: s.text3 }}>×</button>
                </div>
              ))}
            </div>
          </div>

          {/* ── Measurements ── */}
          <div style={card}>
            <div style={{ font: `600 14px ${s.FONT}`, color: s.text, marginBottom: 16 }}>Flexibility & Strength Measurements</div>
            <div className="sn-measure-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div>
                <div style={{ font: `500 12px ${s.MONO}`, color: s.accent, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Flexibility (1-10 scale)</div>
                <div style={{ display: 'grid', gap: 10 }}>
                  {[['forwardFold', 'Forward Fold Reach'], ['hipRotation', 'Hip Rotation'], ['shoulderMobility', 'Shoulder Mobility']].map(([key, lbl]) => (
                    <div key={key}>
                      <label style={label}>{lbl}</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <input type="range" min={1} max={10} value={form.flexibility?.[key] || 5}
                          onChange={e => setForm({ ...form, flexibility: { ...form.flexibility, [key]: parseInt(e.target.value) } })}
                          style={{ flex: 1, accentColor: s.accent }} />
                        <span style={{ font: `600 14px ${s.MONO}`, color: s.accent, minWidth: 24, textAlign: 'right' }}>
                          {form.flexibility?.[key] || 5}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <div style={{ font: `500 12px ${s.MONO}`, color: s.accent, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Strength Benchmarks</div>
                <div style={{ display: 'grid', gap: 10 }}>
                  <div>
                    <label style={label}>Core Hold Time (seconds)</label>
                    <input type="number" value={form.strengthBenchmarks?.coreHold || ''} onChange={e => setForm({ ...form, strengthBenchmarks: { ...form.strengthBenchmarks, coreHold: e.target.value } })} style={inp} placeholder="e.g. 45" />
                  </div>
                  <div>
                    <label style={label}>Max Spring Resistance</label>
                    <select value={form.strengthBenchmarks?.springResistance || ''} onChange={e => setForm({ ...form, strengthBenchmarks: { ...form.strengthBenchmarks, springResistance: e.target.value } })} style={{ ...inp, cursor: 'pointer' }}>
                      <option value="">Select...</option>
                      {SPRING_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={label}>Leg Press Load</label>
                    <select value={form.strengthBenchmarks?.legPress || ''} onChange={e => setForm({ ...form, strengthBenchmarks: { ...form.strengthBenchmarks, legPress: e.target.value } })} style={{ ...inp, cursor: 'pointer' }}>
                      <option value="">Select...</option>
                      {SPRING_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Body Map ── */}
          <div style={card}>
            <div style={{ font: `600 14px ${s.FONT}`, color: s.text, marginBottom: 8 }}>Muscle Groups Worked</div>
            <div style={{ font: `400 12px ${s.FONT}`, color: s.text2, marginBottom: 12 }}>Click dots to cycle through: strong (green) → working (yellow) → needs attention (red) → clear</div>
            <BodyMapLegend s={s} />
            <div className="sn-body-tabs" style={{ display: 'flex', gap: 8, marginTop: 16, marginBottom: 12 }}>
              {['front', 'back'].map(side => (
                <button key={side} onClick={() => setMuscleMapTabForm(side)} style={{
                  padding: '6px 16px', borderRadius: 100, border: `1px solid ${muscleMapTabForm === side ? s.accent : '#E5E5E5'}`,
                  background: muscleMapTabForm === side ? s.accentLight : 'transparent',
                  color: muscleMapTabForm === side ? s.accent : s.text2,
                  font: `500 12px ${s.FONT}`, cursor: 'pointer',
                }}>{side.charAt(0).toUpperCase() + side.slice(1)}</button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <div style={{ flex: '0 0 160px' }}>
                <BodyMapSVG side={muscleMapTabForm} muscleMap={form.muscleMap} onToggle={toggleMuscle} s={s} />
              </div>
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ font: `500 11px ${s.MONO}`, color: s.text3, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Marked Muscles</div>
                {Object.keys(form.muscleMap || {}).length === 0 ? (
                  <div style={{ font: `400 13px ${s.FONT}`, color: s.text3 }}>Click the body map to mark muscle groups</div>
                ) : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {Object.entries(form.muscleMap || {}).map(([id, status]) => {
                      const muscle = ALL_MUSCLES.find(m => m.id === id);
                      const st = MUSCLE_STATUS[status];
                      return (
                        <span key={id} style={{ padding: '4px 10px', borderRadius: 100, background: st?.bg, color: st?.color, font: `500 11px ${s.FONT}` }}>
                          {muscle?.label || id}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Actions ── */}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', paddingBottom: 40 }}>
            <button onClick={() => { setView('list'); setSelected(null); }} style={s.pillGhost}>Cancel</button>
            <button onClick={handleSave} style={s.pillAccent}>{selected ? 'Save Changes' : 'Create Note'}</button>
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════
  // ── DETAIL VIEW ──
  // ══════════════════════════════════════════════════════════════════
  if (view === 'detail' && selected) {
    const clientHistory = clientNotesByDate(selected.clientId);

    return (
      <div>
        <style>{`
          @media (max-width: 768px) {
            .sn-detail-grid { grid-template-columns: 1fr !important; }
          }
        `}</style>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
          <button onClick={() => { setView('list'); setSelected(null); }} style={{ ...s.pillGhost, padding: '6px 14px', fontSize: 13 }}>← Back</button>
          <div style={{ flex: 1 }}>
            <h1 style={{ font: `600 22px ${s.FONT}`, color: s.text, margin: 0 }}>{selected.clientName}</h1>
            <div style={{ font: `400 13px ${s.FONT}`, color: s.text2 }}>{selected.classType} · {fmtDate(selected.date)}</div>
          </div>
          <StatusBadge status={selected.status} s={s} />
          <button onClick={() => openEdit(selected)} style={{ ...s.pillOutline, fontSize: 12 }}>Edit</button>
          <button onClick={() => handleDelete(selected.id)} style={{ ...s.pillGhost, fontSize: 12, color: s.danger }}>Delete</button>
        </div>

        <div className="sn-detail-grid" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>

          {/* Left column */}
          <div style={{ display: 'grid', gap: 16 }}>

            {/* Instructor + session info */}
            <div style={{ ...card, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              {[
                ['Instructor', selected.instructorName || '—'],
                ['Duration', `${selected.duration || '—'} min`],
                ['Class Type', selected.classType || '—'],
              ].map(([l, v]) => (
                <div key={l}>
                  <div style={{ font: `400 10px ${s.MONO}`, textTransform: 'uppercase', letterSpacing: 1, color: s.text3, marginBottom: 4 }}>{l}</div>
                  <div style={{ font: `500 14px ${s.FONT}`, color: s.text }}>{v}</div>
                </div>
              ))}
            </div>

            {/* Observations */}
            {selected.observations && (
              <div style={card}>
                <div style={{ font: `500 11px ${s.MONO}`, color: s.accent, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Observations</div>
                <p style={{ font: `400 14px ${s.FONT}`, color: s.text, lineHeight: 1.7, margin: 0 }}>{selected.observations}</p>
              </div>
            )}

            {/* Exercises */}
            {selected.exercisesCompleted?.length > 0 && (
              <div style={card}>
                <div style={{ font: `500 11px ${s.MONO}`, color: s.accent, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
                  Exercises Completed ({selected.exercisesCompleted.length})
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {selected.exercisesCompleted.map((ex, i) => (
                    <span key={i} style={{ padding: '4px 10px', borderRadius: 100, background: '#F5F5F5', font: `400 12px ${s.FONT}`, color: s.text }}>{ex}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Spring settings */}
            {Object.keys(selected.springSettings || {}).length > 0 && (
              <div style={card}>
                <div style={{ font: `500 11px ${s.MONO}`, color: s.accent, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Spring Settings</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 8 }}>
                  {Object.entries(selected.springSettings).map(([k, v]) => (
                    <div key={k} style={{ padding: '8px 12px', background: '#F9F9F9', borderRadius: 8 }}>
                      <div style={{ font: `400 11px ${s.FONT}`, color: s.text3, marginBottom: 2 }}>{k}</div>
                      <div style={{ font: `600 13px ${s.MONO}`, color: s.accent }}>{v}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Discomfort notes */}
            {selected.discomfortNotes && (
              <div style={{ ...card, borderLeft: `3px solid ${selected.discomfortNotes.toLowerCase().includes('none') ? s.success : '#F59E0B'}`, paddingLeft: 16 }}>
                <div style={{ font: `500 11px ${s.MONO}`, color: selected.discomfortNotes.toLowerCase().includes('none') ? s.success : '#D97706', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
                  Discomfort / Pain Notes
                </div>
                <p style={{ font: `400 13px ${s.FONT}`, color: s.text, lineHeight: 1.6, margin: 0 }}>{selected.discomfortNotes}</p>
              </div>
            )}

            {/* Goals + Recommendations */}
            <div className="sn-detail-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {selected.goals && (
                <div style={card}>
                  <div style={{ font: `500 11px ${s.MONO}`, color: s.accent, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Client Goals</div>
                  <p style={{ font: `400 13px ${s.FONT}`, color: s.text, lineHeight: 1.6, margin: 0 }}>{selected.goals}</p>
                </div>
              )}
              {selected.instructorRecommendations && (
                <div style={card}>
                  <div style={{ font: `500 11px ${s.MONO}`, color: s.accent, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Next Session Plan</div>
                  <p style={{ font: `400 13px ${s.FONT}`, color: s.text, lineHeight: 1.6, margin: 0 }}>{selected.instructorRecommendations}</p>
                </div>
              )}
            </div>

            {/* Progress trends */}
            {(flexTrend.length >= 2 || strengthTrend.length >= 2) && (
              <div style={card}>
                <div style={{ font: `500 11px ${s.MONO}`, color: s.accent, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14 }}>Progress Over Time</div>
                <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
                  {flexTrend.length >= 2 && (
                    <div>
                      <div style={{ font: `400 11px ${s.FONT}`, color: s.text3, marginBottom: 4 }}>Flexibility Score</div>
                      <MiniSparkline values={flexTrend} color={s.accent} />
                      <div style={{ font: `600 16px ${s.MONO}`, color: s.accent, marginTop: 4 }}>{flexTrend[flexTrend.length - 1]}<span style={{ font: `400 11px ${s.FONT}`, color: s.text3 }}>/10</span></div>
                    </div>
                  )}
                  {strengthTrend.length >= 2 && (
                    <div>
                      <div style={{ font: `400 11px ${s.FONT}`, color: s.text3, marginBottom: 4 }}>Core Hold (sec)</div>
                      <MiniSparkline values={strengthTrend} color={s.success} />
                      <div style={{ font: `600 16px ${s.MONO}`, color: s.success, marginTop: 4 }}>{strengthTrend[strengthTrend.length - 1]}s</div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right column */}
          <div style={{ display: 'grid', gap: 16, alignContent: 'start' }}>

            {/* Measurements */}
            <div style={card}>
              <div style={{ font: `500 11px ${s.MONO}`, color: s.accent, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Measurements</div>
              <div style={{ display: 'grid', gap: 10 }}>
                {selected.flexibility && Object.entries(selected.flexibility).map(([k, v]) => {
                  if (!v) return null;
                  const labels = { forwardFold: 'Forward Fold', hipRotation: 'Hip Rotation', shoulderMobility: 'Shoulder Mobility' };
                  const val = Number(v);
                  return (
                    <div key={k}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ font: `400 12px ${s.FONT}`, color: s.text2 }}>{labels[k] || k}</span>
                        <span style={{ font: `600 12px ${s.MONO}`, color: s.accent }}>{val}/10</span>
                      </div>
                      <div style={{ height: 6, background: '#F0F0F0', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${val * 10}%`, background: val >= 7 ? s.success : val >= 4 ? '#F59E0B' : '#EF4444', borderRadius: 3, transition: 'width 0.4s' }} />
                      </div>
                    </div>
                  );
                })}
                {selected.strengthBenchmarks?.coreHold && (
                  <div style={{ paddingTop: 8, borderTop: '1px solid #F0F0F0' }}>
                    <div style={{ font: `400 11px ${s.FONT}`, color: s.text3, marginBottom: 2 }}>Core Hold</div>
                    <div style={{ font: `600 18px ${s.MONO}`, color: s.text }}>{selected.strengthBenchmarks.coreHold}s</div>
                  </div>
                )}
                {selected.strengthBenchmarks?.springResistance && selected.strengthBenchmarks.springResistance !== 'N/A (mat)' && (
                  <div>
                    <div style={{ font: `400 11px ${s.FONT}`, color: s.text3, marginBottom: 2 }}>Max Spring Resistance</div>
                    <div style={{ font: `600 13px ${s.MONO}`, color: s.accent }}>{selected.strengthBenchmarks.springResistance}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Areas of focus */}
            {selected.areasOfFocus?.length > 0 && (
              <div style={card}>
                <div style={{ font: `500 11px ${s.MONO}`, color: s.accent, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Focus Areas</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {selected.areasOfFocus.map((a, i) => (
                    <span key={i} style={{ padding: '4px 10px', borderRadius: 100, background: s.accentLight, color: s.accent, font: `500 11px ${s.FONT}` }}>{a}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Body Map */}
            <div style={card}>
              <div style={{ font: `500 11px ${s.MONO}`, color: s.accent, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Muscle Groups</div>
              <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
                {['front', 'back'].map(side => (
                  <button key={side} onClick={() => setBodyMapTab(side)} style={{
                    padding: '4px 12px', borderRadius: 100, border: `1px solid ${bodyMapTab === side ? s.accent : '#E5E5E5'}`,
                    background: bodyMapTab === side ? s.accentLight : 'transparent',
                    color: bodyMapTab === side ? s.accent : s.text3,
                    font: `500 11px ${s.FONT}`, cursor: 'pointer',
                  }}>{side}</button>
                ))}
              </div>
              <BodyMapSVG side={bodyMapTab} muscleMap={selected.muscleMap} onToggle={toggleMuscleDetail} s={s} />
              <BodyMapLegend s={s} />
              <div style={{ font: `400 10px ${s.FONT}`, color: s.text3, marginTop: 8 }}>Click to update muscle status</div>
            </div>

            {/* Past sessions (mini list) */}
            {clientHistory.length > 1 && (
              <div style={card}>
                <div style={{ font: `500 11px ${s.MONO}`, color: s.accent, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Previous Sessions</div>
                {clientHistory.filter(n => n.id !== selected.id).slice(-5).map(n => (
                  <div key={n.id} onClick={() => { setSelected(n); setView('detail'); }} style={{ padding: '8px 0', borderBottom: '1px solid #F5F5F5', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ font: `500 12px ${s.FONT}`, color: s.text }}>{n.classType}</div>
                      <div style={{ font: `400 11px ${s.FONT}`, color: s.text3 }}>{fmtDate(n.date)}</div>
                    </div>
                    <StatusBadge status={n.status} s={s} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════
  // ── LIST VIEW (default) ──
  // ══════════════════════════════════════════════════════════════════
  return (
    <div>
      <style>{`
        @media (max-width: 768px) {
          .sn-kpi-grid { grid-template-columns: 1fr 1fr !important; }
          .sn-table { display: none !important; }
          .sn-cards { display: grid !important; }
        }
        @media (min-width: 769px) {
          .sn-cards { display: none !important; }
        }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ font: `600 28px ${s.FONT}`, color: s.text, marginBottom: 6, letterSpacing: '-0.3px' }}>Session Notes</h1>
          <p style={{ font: `400 14px ${s.FONT}`, color: s.text2 }}>Progress tracking, body mapping, and session documentation</p>
        </div>
        <button onClick={openNew} style={s.pillAccent}>+ New Session Note</button>
      </div>

      {/* KPIs */}
      <div className="sn-kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Total Notes', value: total },
          { label: 'This Month', value: thisMonth, color: s.accent },
          { label: 'Clients Documented', value: uniqueClients, color: s.text },
          { label: 'Top Class', value: topClass?.[0] || '—', sub: topClass ? `${topClass[1]} sessions` : '', color: s.text },
        ].map(k => (
          <div key={k.label} style={{ ...s.cardStyle, padding: '16px 18px' }}>
            <div style={{ font: `400 10px ${s.MONO}`, textTransform: 'uppercase', letterSpacing: 1, color: s.text3, marginBottom: 4 }}>{k.label}</div>
            <div style={{ font: `600 22px ${s.FONT}`, color: k.color || s.text, lineHeight: 1.2 }}>{k.value}</div>
            {k.sub && <div style={{ font: `400 11px ${s.FONT}`, color: s.text3, marginTop: 2 }}>{k.sub}</div>}
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search client, class, or instructor..." style={{ ...s.input, maxWidth: 280 }} />
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ ...s.input, width: 'auto', cursor: 'pointer' }}>
          <option value="all">All Statuses</option>
          <option value="complete">Complete</option>
          <option value="draft">Draft</option>
          <option value="pending">Pending Review</option>
        </select>
        <select value={filterType} onChange={e => setFilterType(e.target.value)} style={{ ...s.input, width: 'auto', cursor: 'pointer' }}>
          <option value="all">All Classes</option>
          {CLASS_TYPES.map(ct => <option key={ct} value={ct}>{ct}</option>)}
        </select>
        {(search || filterStatus !== 'all' || filterType !== 'all') && (
          <button onClick={() => { setSearch(''); setFilterStatus('all'); setFilterType('all'); }} style={{ ...s.pillGhost, fontSize: 12, padding: '6px 12px' }}>Clear</button>
        )}
        <span style={{ font: `400 12px ${s.FONT}`, color: s.text3, marginLeft: 'auto' }}>{filtered.length} notes</span>
      </div>

      {/* Desktop Table */}
      <div className="sn-table" style={{ ...s.tableWrap }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #E5E5E5' }}>
              {['Client', 'Class Type', 'Date', 'Instructor', 'Focus Areas', 'Status', ''].map(h => (
                <th key={h} style={{ padding: '12px 16px', font: `500 11px ${s.MONO}`, textTransform: 'uppercase', letterSpacing: 1, color: s.text3, textAlign: 'left' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(note => (
              <tr key={note.id} onClick={() => openDetail(note)} style={{ borderBottom: '1px solid rgba(0,0,0,0.04)', cursor: 'pointer' }}
                onMouseEnter={e => e.currentTarget.style.background = '#FAFAFA'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <td style={{ padding: '14px 16px' }}>
                  <div style={{ font: `500 13px ${s.FONT}`, color: s.text }}>{note.clientName}</div>
                </td>
                <td style={{ padding: '14px 16px', font: `400 13px ${s.FONT}`, color: s.text2 }}>{note.classType || '—'}</td>
                <td style={{ padding: '14px 16px', font: `400 12px ${s.MONO}`, color: s.text2 }}>{fmtDate(note.date)}</td>
                <td style={{ padding: '14px 16px', font: `400 13px ${s.FONT}`, color: s.text2 }}>{note.instructorName?.split(',')[0] || '—'}</td>
                <td style={{ padding: '14px 16px' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {(note.areasOfFocus || []).slice(0, 2).map((a, i) => (
                      <span key={i} style={{ padding: '2px 8px', borderRadius: 100, background: s.accentLight, color: s.accent, font: `400 10px ${s.FONT}` }}>{a}</span>
                    ))}
                    {(note.areasOfFocus?.length || 0) > 2 && (
                      <span style={{ font: `400 10px ${s.FONT}`, color: s.text3 }}>+{note.areasOfFocus.length - 2}</span>
                    )}
                  </div>
                </td>
                <td style={{ padding: '14px 16px' }}><StatusBadge status={note.status} s={s} /></td>
                <td style={{ padding: '14px 16px' }}>
                  <div style={{ display: 'flex', gap: 6 }} onClick={e => e.stopPropagation()}>
                    <button onClick={() => openEdit(note)} style={{ ...s.pillGhost, padding: '4px 10px', fontSize: 11 }}>Edit</button>
                    <button onClick={() => handleDelete(note.id)} style={{ ...s.pillGhost, padding: '4px 10px', fontSize: 11, color: s.danger }}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div style={{ padding: '48px 24px', textAlign: 'center', font: `400 14px ${s.FONT}`, color: s.text3 }}>
            No session notes found. <button onClick={openNew} style={{ background: 'none', border: 'none', color: s.accent, cursor: 'pointer', font: `500 14px ${s.FONT}` }}>Create the first one →</button>
          </div>
        )}
      </div>

      {/* Mobile Cards */}
      <div className="sn-cards" style={{ display: 'none', gap: 10 }}>
        {filtered.map(note => (
          <div key={note.id} onClick={() => openDetail(note)} style={{ ...s.cardStyle, padding: 16, cursor: 'pointer' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <div>
                <div style={{ font: `600 14px ${s.FONT}`, color: s.text }}>{note.clientName}</div>
                <div style={{ font: `400 12px ${s.FONT}`, color: s.text2 }}>{note.classType} · {fmtDate(note.date)}</div>
              </div>
              <StatusBadge status={note.status} s={s} />
            </div>
            {note.observations && (
              <p style={{ font: `400 12px ${s.FONT}`, color: s.text2, margin: 0, lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                {note.observations}
              </p>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
              <span style={{ font: `400 11px ${s.FONT}`, color: s.text3 }}>{note.instructorName?.split(',')[0]}</span>
              <div style={{ display: 'flex', gap: 6 }} onClick={e => e.stopPropagation()}>
                <button onClick={() => openEdit(note)} style={{ ...s.pillGhost, padding: '3px 10px', fontSize: 11 }}>Edit</button>
                <button onClick={() => handleDelete(note.id)} style={{ ...s.pillGhost, padding: '3px 10px', fontSize: 11, color: s.danger }}>Delete</button>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div style={{ padding: 32, textAlign: 'center', font: `400 14px ${s.FONT}`, color: s.text3 }}>
            No session notes found.
          </div>
        )}
      </div>
    </div>
  );
}
