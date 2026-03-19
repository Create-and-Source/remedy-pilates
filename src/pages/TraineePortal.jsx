import { useState, useMemo } from 'react';
import { useStyles } from '../theme';
import { getTrainees, getProviders } from '../data/store';

// ─── Fallback mock data ───────────────────────────────────────────────────────
const MOCK_TRAINEES = [
  {
    id: 't1', firstName: 'Maya', lastName: 'Chen', email: 'maya@email.com',
    program: 'Comprehensive', startDate: '2025-11-01', mentor: 'Alex',
    hoursCompleted: 340, hoursRequired: 500,
    modules: [
      { name: 'Mat Fundamentals', status: 'completed', score: 94, date: '2025-12-10', hours: 40, exam: 'both' },
      { name: 'Reformer I', status: 'completed', score: 91, date: '2026-01-18', hours: 60, exam: 'both' },
      { name: 'Reformer II', status: 'in-progress', score: null, date: null, hours: 60, exam: 'practical' },
      { name: 'Cadillac', status: 'locked', score: null, date: null, hours: 50, exam: 'both' },
      { name: 'Chair & Barrel', status: 'locked', score: null, date: null, hours: 40, exam: 'written' },
      { name: 'Teaching Practicum', status: 'locked', score: null, date: null, hours: 80, exam: 'teaching demo' },
    ],
    observations: 28, teachingHours: 45,
  },
  {
    id: 't2', firstName: 'Jordan', lastName: 'Park', email: 'jordan@email.com',
    program: 'Mat & Reformer', startDate: '2025-09-15', mentor: 'Sasha',
    hoursCompleted: 210, hoursRequired: 300,
    modules: [
      { name: 'Mat Fundamentals', status: 'completed', score: 88, date: '2025-11-02', hours: 40, exam: 'both' },
      { name: 'Reformer I', status: 'completed', score: 85, date: '2025-12-20', hours: 60, exam: 'both' },
      { name: 'Reformer II', status: 'in-progress', score: null, date: null, hours: 60, exam: 'practical' },
      { name: 'Teaching Practicum', status: 'locked', score: null, date: null, hours: 80, exam: 'teaching demo' },
    ],
    observations: 42, teachingHours: 20,
  },
  {
    id: 't3', firstName: 'Remi', lastName: 'Torres', email: 'remi@email.com',
    program: 'Comprehensive', startDate: '2026-01-06', mentor: 'Alex',
    hoursCompleted: 95, hoursRequired: 500,
    modules: [
      { name: 'Mat Fundamentals', status: 'in-progress', score: null, date: null, hours: 40, exam: 'both' },
      { name: 'Reformer I', status: 'locked', score: null, date: null, hours: 60, exam: 'both' },
      { name: 'Reformer II', status: 'locked', score: null, date: null, hours: 60, exam: 'practical' },
      { name: 'Cadillac', status: 'locked', score: null, date: null, hours: 50, exam: 'both' },
      { name: 'Chair & Barrel', status: 'locked', score: null, date: null, hours: 40, exam: 'written' },
      { name: 'Teaching Practicum', status: 'locked', score: null, date: null, hours: 80, exam: 'teaching demo' },
    ],
    observations: 8, teachingHours: 0,
  },
  {
    id: 't4', firstName: 'Priya', lastName: 'Anand', email: 'priya@email.com',
    program: 'Comprehensive', startDate: '2025-07-01', mentor: 'Sasha',
    hoursCompleted: 478, hoursRequired: 500,
    modules: [
      { name: 'Mat Fundamentals', status: 'completed', score: 97, date: '2025-08-14', hours: 40, exam: 'both' },
      { name: 'Reformer I', status: 'completed', score: 93, date: '2025-09-28', hours: 60, exam: 'both' },
      { name: 'Reformer II', status: 'completed', score: 90, date: '2025-11-15', hours: 60, exam: 'practical' },
      { name: 'Cadillac', status: 'completed', score: 88, date: '2026-01-10', hours: 50, exam: 'both' },
      { name: 'Chair & Barrel', status: 'in-progress', score: null, date: null, hours: 40, exam: 'written' },
      { name: 'Teaching Practicum', status: 'locked', score: null, date: null, hours: 80, exam: 'teaching demo' },
    ],
    observations: 60, teachingHours: 92,
  },
];

const MOCK_HOURS_LOG = [
  { date: '2026-03-15', type: 'teaching', hours: 2, location: 'Studio A', verifiedBy: 'Alex', notes: 'Beginner reformer class, great cueing on footwork' },
  { date: '2026-03-13', type: 'observation', hours: 1.5, location: 'Studio B', verifiedBy: 'Alex', notes: 'Observed advanced mat class' },
  { date: '2026-03-10', type: 'workshop', hours: 3, location: 'Main Floor', verifiedBy: 'Alex', notes: 'Pelvic floor integration workshop' },
  { date: '2026-03-08', type: 'teaching', hours: 1, location: 'Studio A', verifiedBy: 'Alex', notes: 'Private session — hip mobility focus' },
  { date: '2026-03-05', type: 'self-practice', hours: 1, location: 'Studio C', verifiedBy: null, notes: 'Independent practice — cadillac sequence' },
  { date: '2026-03-01', type: 'observation', hours: 2, location: 'Studio B', verifiedBy: 'Alex', notes: 'Prenatal reformer observation' },
];

const MILESTONES = [
  { pct: 25, label: 'Mat Certified' },
  { pct: 50, label: 'Reformer Certified' },
  { pct: 75, label: 'Apparatus Certified' },
  { pct: 100, label: 'Comprehensive Certified' },
];

const MODULE_DESCRIPTIONS = {
  'Mat Fundamentals': 'Master the foundational Pilates mat repertoire — the 34 classical exercises, breath mechanics, and cueing principles.',
  'Reformer I': 'Introduction to the reformer — footwork, leg springs, arms, and beginner-to-intermediate exercises.',
  'Reformer II': 'Advanced reformer sequences, client modifications, and independent session design.',
  'Cadillac': 'Trapeze table work including roll-back bar, push-through bar, and hanging sequences.',
  'Chair & Barrel': 'Wunda Chair and Spine Corrector programming for strength, balance, and spinal mobility.',
  'Teaching Practicum': '80-hour supervised teaching block with weekly mentor reviews and final teaching demo.',
};

const HOUR_TYPE_COLORS = {
  teaching: '#7C5CBF',
  observation: '#3B9BBE',
  workshop: '#E06B3E',
  'self-practice': '#5BAE8A',
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function CircularProgress({ value, max, size = 96, stroke = 8, color }) {
  const pct = Math.min(value / max, 1);
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const dash = pct * circ;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth={stroke} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={stroke}
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        style={{ transition: 'stroke-dasharray 0.8s cubic-bezier(.16,1,.3,1)' }}
      />
    </svg>
  );
}

function ModuleStatusDot({ status, accent }) {
  if (status === 'completed') return <span style={{ fontSize: 18, color: '#5BAE8A' }}>✓</span>;
  if (status === 'in-progress') return (
    <span style={{
      display: 'inline-block', width: 12, height: 12, borderRadius: '50%',
      background: accent, animation: 'pulse-dot 1.6s ease-in-out infinite',
    }} />
  );
  return <span style={{ fontSize: 16, color: '#bbb' }}>🔒</span>;
}

function ScoreBadge({ score }) {
  if (score === null) return null;
  const color = score >= 90 ? '#5BAE8A' : score >= 80 ? '#E0B03E' : '#E06B3E';
  return (
    <span style={{
      background: color + '18', color, border: `1px solid ${color}44`,
      borderRadius: 6, padding: '2px 8px', fontSize: 12, fontWeight: 700,
    }}>{score}%</span>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function TraineePortal() {
  const s = useStyles();

  // Load trainees with fallback
  let trainees = [];
  try { trainees = getTrainees?.() || []; } catch (_) {}
  if (!trainees || trainees.length === 0) trainees = MOCK_TRAINEES;

  // Load providers/mentors with fallback
  let providers = [];
  try { providers = getProviders?.() || []; } catch (_) {}

  const [selectedId, setSelectedId] = useState(trainees[0]?.id);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [expandedModule, setExpandedModule] = useState(null);
  const [showLogForm, setShowLogForm] = useState(false);
  const [celebration, setCelebration] = useState(false);
  const [logForm, setLogForm] = useState({ date: '', type: 'teaching', hours: '', notes: '' });
  const [confidenceSet, setConfidenceSet] = useState({});

  const trainee = useMemo(() => trainees.find(t => t.id === selectedId) || trainees[0], [selectedId, trainees]);

  const completedModules = useMemo(() => trainee.modules.filter(m => m.status === 'completed'), [trainee]);
  const pct = Math.round((trainee.hoursCompleted / trainee.hoursRequired) * 100);

  const currentMilestone = useMemo(() => {
    for (let i = MILESTONES.length - 1; i >= 0; i--) {
      if (pct >= MILESTONES[i].pct) return MILESTONES[i];
    }
    return null;
  }, [pct]);

  const mentorProvider = providers.find(p => p.name?.toLowerCase().includes(trainee.mentor?.toLowerCase()))
    || { name: trainee.mentor || 'Alex M.', initials: (trainee.mentor || 'A').charAt(0) };

  function handleLogSubmit(e) {
    e.preventDefault();
    setShowLogForm(false);
    setLogForm({ date: '', type: 'teaching', hours: '', notes: '' });
    if (parseFloat(logForm.hours) >= 2) {
      setCelebration(true);
      setTimeout(() => setCelebration(false), 2800);
    }
  }

  const card = {
    background: 'rgba(255,255,255,0.72)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255,255,255,0.6)',
    borderRadius: 16,
    boxShadow: s.shadow,
  };

  const TABS = ['dashboard', 'modules', 'hours', 'exams', 'mentor'];

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f8f4f0 0%, #ede8f5 50%, #f0f4f8 100%)', padding: '32px 24px 64px', fontFamily: s.FONT }}>

      {/* CSS keyframes */}
      <style>{`
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.35); }
        }
        @keyframes confetti-fall {
          0% { transform: translateY(-20px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(80px) rotate(360deg); opacity: 0; }
        }
        @keyframes slide-in {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes milestone-ping {
          0% { transform: scale(1); opacity: 1; }
          80% { transform: scale(2.2); opacity: 0; }
          100% { transform: scale(2.2); opacity: 0; }
        }
        .tp-tab { transition: all 0.18s ease; cursor: pointer; }
        .tp-tab:hover { background: rgba(255,255,255,0.6) !important; }
        .tp-module-card { transition: box-shadow 0.18s ease; cursor: pointer; }
        .tp-module-card:hover { box-shadow: 0 4px 24px rgba(124,92,191,0.13) !important; }
        .tp-btn { transition: opacity 0.15s ease, transform 0.15s ease; cursor: pointer; }
        .tp-btn:hover { opacity: 0.88; transform: translateY(-1px); }
        .tp-btn:active { transform: scale(0.97); }
        @media (max-width: 768px) {
          .tp-stats-grid { grid-template-columns: 1fr 1fr !important; }
          .tp-form-grid { grid-template-columns: 1fr !important; }
          .tp-two-col { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* Celebration confetti */}
      {celebration && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 9999, overflow: 'hidden' }}>
          {Array.from({ length: 22 }).map((_, i) => (
            <div key={i} style={{
              position: 'absolute',
              left: `${Math.random() * 100}%`,
              top: `${10 + Math.random() * 20}%`,
              width: 8 + Math.random() * 8,
              height: 8 + Math.random() * 8,
              borderRadius: Math.random() > 0.5 ? '50%' : 2,
              background: [s.accent, '#5BAE8A', '#E0B03E', '#E06B3E', '#3B9BBE'][i % 5],
              animation: `confetti-fall ${0.9 + Math.random() * 1.4}s ease-in ${Math.random() * 0.6}s forwards`,
            }} />
          ))}
          <div style={{
            position: 'absolute', top: '28%', left: '50%', transform: 'translateX(-50%)',
            background: 'rgba(255,255,255,0.95)', borderRadius: 16, padding: '18px 32px',
            boxShadow: '0 8px 40px rgba(0,0,0,0.14)', textAlign: 'center', animation: 'slide-in 0.3s ease',
          }}>
            <div style={{ fontSize: 28, marginBottom: 4 }}>🌟</div>
            <div style={{ fontFamily: s.DISPLAY, fontSize: 18, color: s.text }}>Hours Logged!</div>
            <div style={{ fontFamily: s.FONT, fontSize: 13, color: s.text2, marginTop: 4 }}>Your progress is being tracked</div>
          </div>
        </div>
      )}

      {/* Page header */}
      <div style={{ maxWidth: 920, margin: '0 auto 28px' }}>
        <div style={{ fontFamily: s.MONO, fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: s.accent, marginBottom: 8 }}>
          PSC Teacher Training Program
        </div>
        <h1 style={{ fontFamily: s.DISPLAY, fontSize: 36, fontWeight: 700, color: s.text, margin: 0, lineHeight: 1.15 }}>
          Trainee Portal
        </h1>
        <p style={{ fontFamily: s.FONT, fontSize: 15, color: s.text2, margin: '8px 0 0' }}>
          Track your hours, modules, and certification progress.
        </p>
      </div>

      {/* Trainee selector */}
      <div style={{ maxWidth: 920, margin: '0 auto 24px' }}>
        <div style={{ ...card, padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <span style={{ fontFamily: s.MONO, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: s.text3 }}>
            Viewing as
          </span>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', flex: 1 }}>
            {trainees.map(t => (
              <button
                key={t.id}
                className="tp-tab"
                onClick={() => { setSelectedId(t.id); setActiveTab('dashboard'); setExpandedModule(null); }}
                style={{
                  padding: '7px 16px', borderRadius: 10, border: 'none', cursor: 'pointer',
                  background: selectedId === t.id ? s.accent : 'rgba(0,0,0,0.05)',
                  color: selectedId === t.id ? '#fff' : s.text2,
                  fontFamily: s.FONT, fontSize: 14, fontWeight: selectedId === t.id ? 600 : 400,
                }}
              >
                {t.firstName} {t.lastName}
              </button>
            ))}
          </div>
          <span style={{ fontFamily: s.FONT, fontSize: 13, color: s.text3 }}>
            {trainee.program} · Started {new Date(trainee.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
          </span>
        </div>
      </div>

      {/* Tab navigation */}
      <div style={{ maxWidth: 920, margin: '0 auto 24px', display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        {TABS.map(tab => (
          <button
            key={tab}
            className="tp-tab"
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '9px 20px', borderRadius: 10, border: 'none', cursor: 'pointer',
              background: activeTab === tab ? 'rgba(255,255,255,0.9)' : 'transparent',
              color: activeTab === tab ? s.accent : s.text2,
              fontFamily: s.FONT, fontSize: 14, fontWeight: activeTab === tab ? 600 : 400,
              boxShadow: activeTab === tab ? s.shadow : 'none',
            }}
          >
            {{ dashboard: 'Dashboard', modules: 'Modules', hours: 'Hours Log', exams: 'Exam Center', mentor: 'Mentor' }[tab]}
          </button>
        ))}
      </div>

      <div style={{ maxWidth: 920, margin: '0 auto', animation: 'slide-in 0.25s ease' }} key={activeTab + selectedId}>

        {/* ── DASHBOARD ─────────────────────────────────────────────────────── */}
        {activeTab === 'dashboard' && (
          <div>
            {/* Hero stats */}
            <div className="tp-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 16, marginBottom: 20 }}>
              {/* Hours ring */}
              <div style={{ ...card, padding: '24px 20px', textAlign: 'center', gridColumn: 'span 1' }}>
                <div style={{ position: 'relative', display: 'inline-block', marginBottom: 10 }}>
                  <CircularProgress value={trainee.hoursCompleted} max={trainee.hoursRequired} size={88} stroke={8} color={s.accent} />
                  <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center' }}>
                    <div style={{ fontFamily: s.DISPLAY, fontSize: 18, fontWeight: 700, color: s.text, lineHeight: 1 }}>{pct}%</div>
                  </div>
                </div>
                <div style={{ fontFamily: s.DISPLAY, fontSize: 22, fontWeight: 700, color: s.text }}>{trainee.hoursCompleted}</div>
                <div style={{ fontFamily: s.FONT, fontSize: 13, color: s.text2 }}>of {trainee.hoursRequired} hours</div>
                <div style={{ fontFamily: s.MONO, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: s.text3, marginTop: 6 }}>Total Hours</div>
              </div>

              <div style={{ ...card, padding: '24px 20px', textAlign: 'center' }}>
                <div style={{ fontFamily: s.DISPLAY, fontSize: 36, fontWeight: 700, color: s.accent }}>{completedModules.length}</div>
                <div style={{ fontFamily: s.FONT, fontSize: 13, color: s.text2 }}>of {trainee.modules.length} modules</div>
                <div style={{ fontFamily: s.MONO, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: s.text3, marginTop: 6 }}>Modules Complete</div>
              </div>

              <div style={{ ...card, padding: '24px 20px', textAlign: 'center' }}>
                <div style={{ fontFamily: s.DISPLAY, fontSize: 36, fontWeight: 700, color: '#5BAE8A' }}>{trainee.teachingHours}</div>
                <div style={{ fontFamily: s.FONT, fontSize: 13, color: s.text2 }}>hours taught</div>
                <div style={{ fontFamily: s.MONO, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: s.text3, marginTop: 6 }}>Teaching Hours</div>
              </div>

              <div style={{ ...card, padding: '24px 20px', textAlign: 'center' }}>
                <div style={{ fontFamily: s.DISPLAY, fontSize: 36, fontWeight: 700, color: '#3B9BBE' }}>{trainee.observations}</div>
                <div style={{ fontFamily: s.FONT, fontSize: 13, color: s.text2 }}>sessions observed</div>
                <div style={{ fontFamily: s.MONO, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: s.text3, marginTop: 6 }}>Observations</div>
              </div>
            </div>

            {/* Certification progress bar */}
            <div style={{ ...card, padding: '24px 28px', marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
                <div style={{ fontFamily: s.DISPLAY, fontSize: 17, fontWeight: 600, color: s.text }}>Certification Progress</div>
                <div style={{ fontFamily: s.FONT, fontSize: 13, color: s.text2 }}>
                  {currentMilestone ? (
                    <span style={{ color: '#5BAE8A', fontWeight: 600 }}>✓ {currentMilestone.label}</span>
                  ) : 'Working toward Mat Certified'}
                </div>
              </div>
              <div style={{ position: 'relative', height: 12, background: 'rgba(0,0,0,0.07)', borderRadius: 99, overflow: 'visible', marginBottom: 32 }}>
                <div style={{
                  height: '100%', borderRadius: 99, width: `${pct}%`,
                  background: `linear-gradient(90deg, ${s.accent}, #5BAE8A)`,
                  transition: 'width 1s cubic-bezier(.16,1,.3,1)',
                }} />
                {MILESTONES.map(m => (
                  <div key={m.pct} style={{ position: 'absolute', left: `${m.pct}%`, top: '50%', transform: 'translate(-50%,-50%)' }}>
                    <div style={{
                      width: 14, height: 14, borderRadius: '50%', border: '2.5px solid #fff',
                      background: pct >= m.pct ? '#5BAE8A' : 'rgba(0,0,0,0.12)',
                      boxShadow: pct >= m.pct ? '0 0 0 3px rgba(91,174,138,0.25)' : 'none',
                      position: 'relative', zIndex: 2,
                    }} />
                    <div style={{
                      position: 'absolute', top: 20, left: '50%', transform: 'translateX(-50%)',
                      fontFamily: s.MONO, fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase',
                      color: pct >= m.pct ? '#5BAE8A' : s.text3, whiteSpace: 'nowrap', textAlign: 'center',
                    }}>
                      <div style={{ fontWeight: 700 }}>{m.pct}%</div>
                      <div>{m.label}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Module quick-glance */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
                {trainee.modules.map(m => (
                  <div key={m.name} style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    background: m.status === 'completed' ? 'rgba(91,174,138,0.10)' : m.status === 'in-progress' ? `${s.accent}12` : 'rgba(0,0,0,0.04)',
                    borderRadius: 8, padding: '5px 10px',
                    border: `1px solid ${m.status === 'completed' ? 'rgba(91,174,138,0.25)' : m.status === 'in-progress' ? `${s.accent}30` : 'rgba(0,0,0,0.07)'}`,
                  }}>
                    <ModuleStatusDot status={m.status} accent={s.accent} />
                    <span style={{ fontFamily: s.FONT, fontSize: 12, color: m.status === 'locked' ? s.text3 : s.text }}>{m.name}</span>
                    {m.score !== null && <ScoreBadge score={m.score} />}
                  </div>
                ))}
              </div>
            </div>

            {/* Avg score + next up */}
            <div className="tp-two-col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={{ ...card, padding: '20px 24px' }}>
                <div style={{ fontFamily: s.MONO, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: s.text3, marginBottom: 8 }}>Average Exam Score</div>
                {completedModules.length > 0 ? (
                  <>
                    <div style={{ fontFamily: s.DISPLAY, fontSize: 40, fontWeight: 700, color: s.accent }}>
                      {Math.round(completedModules.reduce((a, m) => a + m.score, 0) / completedModules.length)}%
                    </div>
                    <div style={{ fontFamily: s.FONT, fontSize: 13, color: s.text2 }}>across {completedModules.length} completed exams</div>
                  </>
                ) : (
                  <div style={{ fontFamily: s.FONT, fontSize: 14, color: s.text2 }}>No exams completed yet</div>
                )}
              </div>
              <div style={{ ...card, padding: '20px 24px' }}>
                <div style={{ fontFamily: s.MONO, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: s.text3, marginBottom: 8 }}>Up Next</div>
                {(() => {
                  const next = trainee.modules.find(m => m.status === 'in-progress') || trainee.modules.find(m => m.status === 'locked');
                  return next ? (
                    <>
                      <div style={{ fontFamily: s.DISPLAY, fontSize: 18, fontWeight: 600, color: s.text, marginBottom: 4 }}>{next.name}</div>
                      <div style={{ fontFamily: s.FONT, fontSize: 13, color: s.text2 }}>{next.hours}h required · {next.exam} exam</div>
                      <button className="tp-btn" onClick={() => { setActiveTab('modules'); }}
                        style={{ marginTop: 12, padding: '7px 16px', background: s.accent, color: '#fff', border: 'none', borderRadius: 8, fontFamily: s.FONT, fontSize: 13, fontWeight: 600 }}>
                        View Module →
                      </button>
                    </>
                  ) : <div style={{ fontFamily: s.FONT, fontSize: 14, color: '#5BAE8A', fontWeight: 600 }}>All modules complete! 🎉</div>;
                })()}
              </div>
            </div>
          </div>
        )}

        {/* ── MODULES ───────────────────────────────────────────────────────── */}
        {activeTab === 'modules' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontFamily: s.FONT, fontSize: 14, color: s.text2, marginBottom: 4 }}>
              {completedModules.length} of {trainee.modules.length} modules complete · Click any module to expand
            </div>
            {trainee.modules.map((mod, i) => {
              const isOpen = expandedModule === i;
              const prevCompleted = i === 0 || trainee.modules[i - 1].status === 'completed';
              return (
                <div key={mod.name} className="tp-module-card"
                  style={{ ...card, overflow: 'hidden', borderLeft: `4px solid ${mod.status === 'completed' ? '#5BAE8A' : mod.status === 'in-progress' ? s.accent : '#e0e0e0'}` }}
                  onClick={() => setExpandedModule(isOpen ? null : i)}>
                  <div style={{ padding: '18px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <ModuleStatusDot status={mod.status} accent={s.accent} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                        <span style={{ fontFamily: s.DISPLAY, fontSize: 17, fontWeight: 600, color: mod.status === 'locked' ? s.text3 : s.text }}>{mod.name}</span>
                        <ScoreBadge score={mod.score} />
                        {mod.status === 'completed' && mod.date && (
                          <span style={{ fontFamily: s.MONO, fontSize: 10, color: s.text3, letterSpacing: '0.08em' }}>
                            COMPLETED {new Date(mod.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        )}
                      </div>
                      <div style={{ fontFamily: s.FONT, fontSize: 13, color: s.text2, marginTop: 2 }}>
                        {mod.hours}h required · {mod.exam} exam
                        {mod.status === 'locked' && !prevCompleted && ' · Complete previous module first'}
                      </div>
                    </div>
                    <span style={{ fontSize: 14, color: s.text3, transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▾</span>
                  </div>

                  {isOpen && (
                    <div style={{ padding: '0 24px 20px 72px', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                      <p style={{ fontFamily: s.FONT, fontSize: 14, color: s.text2, margin: '14px 0 12px', lineHeight: 1.65 }}>
                        {MODULE_DESCRIPTIONS[mod.name] || 'Module details coming soon.'}
                      </p>
                      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        {['Study Guide PDF', 'Practice Videos', 'Flashcard Deck'].map(r => (
                          <a key={r} href="#" onClick={e => e.preventDefault()}
                            style={{ fontFamily: s.FONT, fontSize: 12, color: s.accent, background: `${s.accent}12`, padding: '5px 12px', borderRadius: 6, textDecoration: 'none', border: `1px solid ${s.accent}25` }}>
                            📎 {r}
                          </a>
                        ))}
                        {mod.status === 'in-progress' && (
                          <button className="tp-btn"
                            style={{ padding: '5px 16px', background: s.accent, color: '#fff', border: 'none', borderRadius: 6, fontFamily: s.FONT, fontSize: 12, fontWeight: 600 }}>
                            Continue Module →
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── HOURS LOG ─────────────────────────────────────────────────────── */}
        {activeTab === 'hours' && (
          <div>
            {/* Totals */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 20 }}>
              {Object.entries(HOUR_TYPE_COLORS).map(([type, color]) => {
                const total = MOCK_HOURS_LOG.filter(e => e.type === type).reduce((a, e) => a + e.hours, 0);
                return (
                  <div key={type} style={{ ...card, padding: '16px 20px' }}>
                    <div style={{ fontFamily: s.DISPLAY, fontSize: 26, fontWeight: 700, color }}>{total}</div>
                    <div style={{ fontFamily: s.MONO, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: s.text3, marginTop: 2 }}>
                      {type.replace('-', ' ')} hrs
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ ...card, padding: '20px 24px', marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ fontFamily: s.DISPLAY, fontSize: 18, fontWeight: 600, color: s.text }}>Recent Entries</div>
                <button className="tp-btn" onClick={() => setShowLogForm(v => !v)}
                  style={{ padding: '8px 18px', background: s.accent, color: '#fff', border: 'none', borderRadius: 8, fontFamily: s.FONT, fontSize: 13, fontWeight: 600 }}>
                  + Log Hours
                </button>
              </div>

              {showLogForm && (
                <form onSubmit={handleLogSubmit} className="tp-form-grid" style={{ background: 'rgba(0,0,0,0.03)', borderRadius: 12, padding: 20, marginBottom: 20, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div style={{ gridColumn: 'span 1' }}>
                    <label style={{ fontFamily: s.MONO, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: s.text3, display: 'block', marginBottom: 6 }}>Date</label>
                    <input type="date" required value={logForm.date} onChange={e => setLogForm(f => ({ ...f, date: e.target.value }))}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid rgba(0,0,0,0.12)', fontFamily: s.FONT, fontSize: 14, background: '#fff', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ fontFamily: s.MONO, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: s.text3, display: 'block', marginBottom: 6 }}>Type</label>
                    <select value={logForm.type} onChange={e => setLogForm(f => ({ ...f, type: e.target.value }))}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid rgba(0,0,0,0.12)', fontFamily: s.FONT, fontSize: 14, background: '#fff' }}>
                      {Object.keys(HOUR_TYPE_COLORS).map(t => <option key={t} value={t}>{t.replace('-', ' ')}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontFamily: s.MONO, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: s.text3, display: 'block', marginBottom: 6 }}>Hours</label>
                    <input type="number" step="0.5" min="0.5" max="12" required value={logForm.hours} onChange={e => setLogForm(f => ({ ...f, hours: e.target.value }))}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid rgba(0,0,0,0.12)', fontFamily: s.FONT, fontSize: 14, background: '#fff', boxSizing: 'border-box' }} />
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ fontFamily: s.MONO, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: s.text3, display: 'block', marginBottom: 6 }}>Notes</label>
                    <textarea rows={2} value={logForm.notes} onChange={e => setLogForm(f => ({ ...f, notes: e.target.value }))}
                      placeholder="What did you work on?"
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid rgba(0,0,0,0.12)', fontFamily: s.FONT, fontSize: 14, background: '#fff', resize: 'none', boxSizing: 'border-box' }} />
                  </div>
                  <div style={{ gridColumn: 'span 2', display: 'flex', gap: 10 }}>
                    <button type="submit" className="tp-btn"
                      style={{ padding: '9px 20px', background: s.accent, color: '#fff', border: 'none', borderRadius: 8, fontFamily: s.FONT, fontSize: 14, fontWeight: 600 }}>
                      Submit for Review
                    </button>
                    <button type="button" className="tp-btn" onClick={() => setShowLogForm(false)}
                      style={{ padding: '9px 16px', background: 'transparent', color: s.text2, border: '1px solid rgba(0,0,0,0.12)', borderRadius: 8, fontFamily: s.FONT, fontSize: 14 }}>
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: s.FONT, fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
                      {['Date', 'Type', 'Hours', 'Location', 'Verified by', 'Notes'].map(h => (
                        <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontFamily: s.MONO, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: s.text3, fontWeight: 600 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {MOCK_HOURS_LOG.map((entry, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                        <td style={{ padding: '10px 10px', color: s.text2 }}>{new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</td>
                        <td style={{ padding: '10px 10px' }}>
                          <span style={{ background: `${HOUR_TYPE_COLORS[entry.type]}18`, color: HOUR_TYPE_COLORS[entry.type], border: `1px solid ${HOUR_TYPE_COLORS[entry.type]}30`, borderRadius: 5, padding: '2px 8px', fontSize: 11, fontWeight: 600 }}>
                            {entry.type.replace('-', ' ')}
                          </span>
                        </td>
                        <td style={{ padding: '10px 10px', color: s.text, fontWeight: 600 }}>{entry.hours}h</td>
                        <td style={{ padding: '10px 10px', color: s.text2 }}>{entry.location}</td>
                        <td style={{ padding: '10px 10px', color: entry.verifiedBy ? '#5BAE8A' : s.text3 }}>
                          {entry.verifiedBy ? `✓ ${entry.verifiedBy}` : 'Pending'}
                        </td>
                        <td style={{ padding: '10px 10px', color: s.text2, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.notes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── EXAM CENTER ───────────────────────────────────────────────────── */}
        {activeTab === 'exams' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
            {completedModules.map(mod => (
              <div key={mod.name} style={{ ...card, padding: '20px 22px', borderTop: '3px solid #5BAE8A' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div style={{ fontFamily: s.DISPLAY, fontSize: 15, fontWeight: 600, color: s.text }}>{mod.name}</div>
                  <span style={{ background: '#5BAE8A18', color: '#5BAE8A', border: '1px solid #5BAE8A30', borderRadius: 6, padding: '2px 9px', fontSize: 11, fontWeight: 700 }}>PASSED</span>
                </div>
                <div style={{ fontFamily: s.DISPLAY, fontSize: 36, fontWeight: 700, color: s.accent, marginBottom: 2 }}>{mod.score}%</div>
                <div style={{ fontFamily: s.FONT, fontSize: 12, color: s.text2, marginBottom: 10 }}>
                  {mod.date && new Date(mod.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} · {mod.exam} exam
                </div>
                <div style={{ background: 'rgba(0,0,0,0.04)', borderRadius: 8, padding: '10px 12px' }}>
                  <div style={{ fontFamily: s.MONO, fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: s.text3, marginBottom: 4 }}>Score Breakdown</div>
                  {['Written', 'Practical', 'Teaching Demo'].filter((_, i) => i < (mod.exam === 'both' ? 2 : mod.exam === 'teaching demo' ? 1 : 1)).map(t => (
                    <div key={t} style={{ display: 'flex', justifyContent: 'space-between', fontFamily: s.FONT, fontSize: 12, color: s.text2, marginTop: 4 }}>
                      <span>{t}</span>
                      <span style={{ fontWeight: 600, color: s.text }}>{Math.max(mod.score - Math.round(Math.random() * 6), 80)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Upcoming exams */}
            {trainee.modules.filter(m => m.status === 'in-progress').map(mod => (
              <div key={mod.name} style={{ ...card, padding: '20px 22px', borderTop: `3px solid ${s.accent}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div style={{ fontFamily: s.DISPLAY, fontSize: 15, fontWeight: 600, color: s.text }}>{mod.name}</div>
                  <span style={{ background: `${s.accent}18`, color: s.accent, border: `1px solid ${s.accent}30`, borderRadius: 6, padding: '2px 9px', fontSize: 11, fontWeight: 700 }}>UPCOMING</span>
                </div>
                <div style={{ fontFamily: s.FONT, fontSize: 13, color: s.text2, marginBottom: 14 }}>
                  Exam format: <strong style={{ color: s.text }}>{mod.exam}</strong>
                </div>
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontFamily: s.MONO, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: s.text3, marginBottom: 8 }}>Confidence Check</div>
                  {['Not quite ready', 'Getting there', "I'm ready!"].map((label, li) => (
                    <button key={label} className="tp-btn"
                      onClick={() => setConfidenceSet(c => ({ ...c, [mod.name]: li }))}
                      style={{
                        display: 'block', width: '100%', marginBottom: 6, padding: '8px 14px',
                        background: confidenceSet[mod.name] === li ? `${s.accent}18` : 'rgba(0,0,0,0.04)',
                        color: confidenceSet[mod.name] === li ? s.accent : s.text2,
                        border: `1px solid ${confidenceSet[mod.name] === li ? s.accent + '40' : 'rgba(0,0,0,0.08)'}`,
                        borderRadius: 8, fontFamily: s.FONT, fontSize: 13, textAlign: 'left', cursor: 'pointer',
                        fontWeight: confidenceSet[mod.name] === li ? 600 : 400,
                      }}>
                      {['😅', '🙂', '💪'][li]} {label}
                    </button>
                  ))}
                </div>
                <a href="#" onClick={e => e.preventDefault()}
                  style={{ display: 'inline-block', fontFamily: s.FONT, fontSize: 13, color: s.accent, textDecoration: 'none', background: `${s.accent}12`, padding: '7px 14px', borderRadius: 8, border: `1px solid ${s.accent}25` }}>
                  📖 Download Study Guide
                </a>
              </div>
            ))}

            {trainee.modules.every(m => m.status !== 'in-progress') && completedModules.length === 0 && (
              <div style={{ ...card, padding: '32px 24px', textAlign: 'center', gridColumn: 'span 2' }}>
                <div style={{ fontFamily: s.DISPLAY, fontSize: 18, color: s.text2 }}>No exams yet — keep working through your modules!</div>
              </div>
            )}
          </div>
        )}

        {/* ── MENTOR ────────────────────────────────────────────────────────── */}
        {activeTab === 'mentor' && (
          <div className="tp-two-col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ ...card, padding: '28px 28px' }}>
              <div style={{ fontFamily: s.MONO, fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: s.text3, marginBottom: 16 }}>Your Mentor</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 20 }}>
                <div style={{
                  width: 56, height: 56, borderRadius: '50%',
                  background: `linear-gradient(135deg, ${s.accent}, #5BAE8A)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: s.DISPLAY, fontSize: 22, fontWeight: 700, color: '#fff',
                }}>
                  {(mentorProvider.name || trainee.mentor || 'K').charAt(0)}
                </div>
                <div>
                  <div style={{ fontFamily: s.DISPLAY, fontSize: 20, fontWeight: 700, color: s.text }}>{mentorProvider.name || trainee.mentor}</div>
                  <div style={{ fontFamily: s.FONT, fontSize: 13, color: s.text2 }}>PSC Certified Instructor · Senior Mentor</div>
                </div>
              </div>

              <div style={{ background: 'rgba(0,0,0,0.04)', borderRadius: 12, padding: '14px 16px', marginBottom: 16 }}>
                <div style={{ fontFamily: s.MONO, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: s.text3, marginBottom: 6 }}>Next Session</div>
                <div style={{ fontFamily: s.DISPLAY, fontSize: 16, fontWeight: 600, color: s.text }}>Thursday, March 26 at 2:00 PM</div>
                <div style={{ fontFamily: s.FONT, fontSize: 13, color: s.text2, marginTop: 2 }}>45-minute teaching review · Studio B</div>
              </div>

              <div style={{ background: `${s.accent}0d`, borderRadius: 12, padding: '14px 16px', marginBottom: 20, borderLeft: `3px solid ${s.accent}` }}>
                <div style={{ fontFamily: s.MONO, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: s.accent, marginBottom: 6 }}>Mentor's Recent Feedback</div>
                <div style={{ fontFamily: s.FONT, fontSize: 14, color: s.text, lineHeight: 1.6 }}>
                  {pct > 75
                    ? `${trainee.firstName} is demonstrating exceptional command of the apparatus work. Her cueing is precise and client-centered. Focus now on expanding your teaching repertoire for special populations.`
                    : pct > 40
                    ? `${trainee.firstName}'s reformer technique is solid and improving each week. Continue building confidence with verbal cueing — your hands-on corrections are already strong.`
                    : `${trainee.firstName} is off to a great start with mat fundamentals. Strong body awareness will serve you well. Keep building your observation hours to internalize movement patterns.`}
                </div>
              </div>

              <button className="tp-btn"
                style={{ width: '100%', padding: '11px 20px', background: s.accent, color: '#fff', border: 'none', borderRadius: 10, fontFamily: s.FONT, fontSize: 14, fontWeight: 600 }}>
                ✉ Message {(mentorProvider.name || trainee.mentor || 'Mentor').split(' ')[0]}
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ ...card, padding: '22px 24px' }}>
                <div style={{ fontFamily: s.MONO, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: s.text3, marginBottom: 12 }}>Your Progress Summary</div>
                {[
                  { label: 'Hours toward goal', value: `${pct}%`, color: s.accent },
                  { label: 'Modules completed', value: `${completedModules.length} / ${trainee.modules.length}`, color: '#5BAE8A' },
                  { label: 'Teaching hours', value: `${trainee.teachingHours}h`, color: '#7C5CBF' },
                  { label: 'Observation hours', value: `${trainee.observations}h`, color: '#3B9BBE' },
                ].map(({ label, value, color }) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                    <span style={{ fontFamily: s.FONT, fontSize: 14, color: s.text2 }}>{label}</span>
                    <span style={{ fontFamily: s.DISPLAY, fontSize: 16, fontWeight: 700, color }}>{value}</span>
                  </div>
                ))}
              </div>

              <div style={{ ...card, padding: '22px 24px' }}>
                <div style={{ fontFamily: s.MONO, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: s.text3, marginBottom: 12 }}>Upcoming Milestones</div>
                {MILESTONES.filter(m => pct < m.pct).slice(0, 2).map(m => (
                  <div key={m.pct} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                    <div style={{ position: 'relative', width: 36, height: 36, flexShrink: 0 }}>
                      <CircularProgress value={pct} max={m.pct} size={36} stroke={4} color={s.accent} />
                      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', fontFamily: s.MONO, fontSize: 8, fontWeight: 700, color: s.text }}>{Math.round(pct / m.pct * 100)}%</div>
                    </div>
                    <div>
                      <div style={{ fontFamily: s.FONT, fontSize: 13, fontWeight: 600, color: s.text }}>{m.label}</div>
                      <div style={{ fontFamily: s.FONT, fontSize: 12, color: s.text2 }}>Reach {m.pct}% of total hours</div>
                    </div>
                  </div>
                ))}
                {MILESTONES.filter(m => pct >= m.pct).map(m => (
                  <div key={m.pct} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0' }}>
                    <span style={{ fontSize: 18 }}>✅</span>
                    <div style={{ fontFamily: s.FONT, fontSize: 13, color: '#5BAE8A', fontWeight: 600 }}>{m.label} — Achieved</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
