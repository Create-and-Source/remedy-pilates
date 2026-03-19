import { useState } from 'react';
import { useStyles } from '../theme';

const EXERCISES = [
  { id: 1, name: 'Footwork', difficulty: 1, muscles: ['Quads', 'Glutes', 'Calves'], spring: '3 springs', color: '#4ade80' },
  { id: 2, name: 'Hundred', difficulty: 2, muscles: ['Core', 'Hip Flexors', 'Shoulders'], spring: '2 springs', color: '#60a5fa' },
  { id: 3, name: 'Elephant', difficulty: 3, muscles: ['Hamstrings', 'Core', 'Arms'], spring: '2 springs', color: '#f59e0b' },
  { id: 4, name: 'Long Stretch', difficulty: 3, muscles: ['Core', 'Chest', 'Triceps'], spring: '3 springs', color: '#a78bfa' },
  { id: 5, name: 'Short Box', difficulty: 2, muscles: ['Core', 'Hip Flexors', 'Back'], spring: '1 spring', color: '#f472b6' },
  { id: 6, name: 'Knee Stretches', difficulty: 2, muscles: ['Quads', 'Core', 'Glutes'], spring: '2 springs', color: '#34d399' },
];

const SESSION_HISTORY = [
  { date: 'Mar 15', exercises: 4, avgScore: 87, trend: +5 },
  { date: 'Mar 12', exercises: 5, avgScore: 82, trend: +3 },
  { date: 'Mar 10', exercises: 3, avgScore: 79, trend: -1 },
];

const DEVICES = [
  { name: 'iPhone 12+', icon: '📱', status: 'Supported' },
  { name: 'iPad Pro', icon: '📟', status: 'Recommended' },
  { name: 'Meta Quest 3', icon: '🥽', status: 'Full AR' },
];

const CALIBRATION_STEPS = [
  'Place your reformer in an open area with at least 3 ft clearance on all sides.',
  'Open the camera and point at the reformer footbar for 3 seconds to anchor the AR overlay.',
  'Stand at the end of the reformer — the system will auto-detect your height.',
  'Select your exercise and press Start AR Session.',
];

export default function ARSimulator() {
  const s = useStyles();
  const [active, setActive] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState(EXERCISES[0]);
  const [repCount, setRepCount] = useState(0);
  const [formScore, setFormScore] = useState(84);
  const [setupOpen, setSetupOpen] = useState(false);

  const card = {
    background: 'rgba(255,255,255,0.72)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255,255,255,0.6)',
    borderRadius: 16,
    boxShadow: s.shadow,
    padding: 24,
  };

  function handleStart() {
    if (!active) {
      setActive(true);
      setRepCount(0);
      setFormScore(Math.floor(70 + Math.random() * 25));
    } else {
      setActive(false);
    }
  }

  function handleSelectExercise(ex) {
    setSelectedExercise(ex);
    setActive(false);
    setRepCount(0);
  }

  function handleTap() {
    if (!active) return;
    setRepCount(r => r + 1);
    setFormScore(Math.min(100, Math.max(60, formScore + (Math.random() > 0.4 ? 1 : -2))));
  }

  const alignColor = formScore >= 85 ? '#4ade80' : formScore >= 70 ? '#fbbf24' : '#f87171';
  const symmetry = active ? 48 + Math.floor(Math.random() * 4) : 50;

  return (
    <div style={{ fontFamily: s.FONT, color: s.text, padding: '32px 24px', maxWidth: 1100, margin: '0 auto' }}>
      <style>{`
        @keyframes arScan {
          0% { transform: translateY(0); opacity: 0.7; }
          50% { opacity: 1; }
          100% { transform: translateY(320px); opacity: 0; }
        }
        @keyframes guideFlicker {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
        @keyframes repPulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.18); }
          100% { transform: scale(1); }
        }
        @keyframes springOscillate {
          0%, 100% { stroke-dashoffset: 0; }
          50% { stroke-dashoffset: 8; }
        }
        @keyframes coreGlow {
          0%, 100% { opacity: 0.4; r: 10; }
          50% { opacity: 0.9; r: 14; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .ar-guide-line { animation: guideFlicker 2s ease-in-out infinite; }
        .ar-scan-line { animation: arScan 2.4s linear infinite; }
        .rep-badge { animation: repPulse 0.35s ease; }
        .spring-line { animation: springOscillate 1.2s ease-in-out infinite; stroke-dasharray: 6 3; }
        .core-indicator { animation: coreGlow 1.8s ease-in-out infinite; }
        .fade-in { animation: fadeIn 0.4s ease; }
        @media (max-width: 768px) {
          .ar-main-grid { grid-template-columns: 1fr !important; }
          .ar-form-metrics { grid-template-columns: 1fr !important; }
          .ar-page { padding: 16px 12px !important; }
        }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontFamily: s.MONO, fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: s.accent, marginBottom: 8 }}>
          Beta Feature · Concept Demo
        </div>
        <h1 style={{ fontFamily: s.DISPLAY, fontSize: 36, fontWeight: 700, margin: '0 0 10px', lineHeight: 1.15 }}>
          AR Reformer Simulator
        </h1>
        <p style={{ color: s.text2, fontSize: 15, margin: 0, maxWidth: 520 }}>
          Experience AI-guided reformer coaching through augmented reality. Real-time form feedback, rep counting, and spring guidance — overlaid directly on your equipment.
        </p>
      </div>

      <div className="ar-main-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24 }}>

        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* AR Viewfinder */}
          <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
            <div
              onClick={handleTap}
              style={{
                background: 'linear-gradient(160deg, #0d1117 0%, #0f1a12 60%, #0a0d1a 100%)',
                borderRadius: 16,
                position: 'relative',
                height: 340,
                overflow: 'hidden',
                cursor: active ? 'pointer' : 'default',
                userSelect: 'none',
              }}
            >
              {/* Corner brackets */}
              {[['top:12px','left:12px','borderTop','borderLeft'],
                ['top:12px','right:12px','borderTop','borderRight'],
                ['bottom:12px','left:12px','borderBottom','borderLeft'],
                ['bottom:12px','right:12px','borderBottom','borderRight']].map(([t, lr, b1, b2], i) => {
                const pos = {};
                t.includes('top') ? (pos.top = 12) : (pos.bottom = 12);
                lr.includes('left') ? (pos.left = 12) : (pos.right = 12);
                return (
                  <div key={i} style={{
                    position: 'absolute', width: 22, height: 22,
                    [b1]: `2px solid ${active ? s.accent : 'rgba(255,255,255,0.3)'}`,
                    [b2]: `2px solid ${active ? s.accent : 'rgba(255,255,255,0.3)'}`,
                    borderRadius: 2,
                    transition: 'border-color 0.4s',
                    ...pos,
                  }} />
                );
              })}

              {/* Reformer SVG */}
              <svg viewBox="0 0 580 280" style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}>
                {/* Floor shadow */}
                <ellipse cx="290" cy="248" rx="230" ry="10" fill="rgba(0,0,0,0.4)" />

                {/* Main frame rails */}
                <rect x="60" y="160" width="460" height="14" rx="4" fill="#2a3040" stroke="#3d4a5c" strokeWidth="1.5" />
                <rect x="60" y="180" width="460" height="14" rx="4" fill="#2a3040" stroke="#3d4a5c" strokeWidth="1.5" />

                {/* Frame legs */}
                <rect x="72" y="174" width="12" height="60" rx="3" fill="#1e2535" stroke="#3d4a5c" strokeWidth="1" />
                <rect x="496" y="174" width="12" height="60" rx="3" fill="#1e2535" stroke="#3d4a5c" strokeWidth="1" />
                <rect x="200" y="185" width="10" height="48" rx="3" fill="#1e2535" stroke="#3d4a5c" strokeWidth="1" />
                <rect x="370" y="185" width="10" height="48" rx="3" fill="#1e2535" stroke="#3d4a5c" strokeWidth="1" />

                {/* Footbar */}
                <rect x="52" y="148" width="26" height="22" rx="5" fill="#3a4560" stroke="#5a6a8a" strokeWidth="1.5" />
                <rect x="56" y="152" width="18" height="14" rx="3" fill="#2a3555" />

                {/* Carriage */}
                <rect x={active ? 140 : 180} y="140" width="200" height="36" rx="6" fill="#1e4d4a" stroke={active ? '#34d399' : '#2d6a65'} strokeWidth={active ? 2 : 1.5}
                  style={{ transition: 'all 0.5s ease' }} />
                {/* Carriage padding stripes */}
                {[0,1,2,3,4].map(i => (
                  <rect key={i} x={(active ? 140 : 180) + 16 + i * 36} y="144" width="22" height="28" rx="3"
                    fill="rgba(52,211,153,0.08)" stroke="rgba(52,211,153,0.2)" strokeWidth="1" style={{ transition: 'all 0.5s ease' }} />
                ))}
                {/* Carriage headrest */}
                <rect x={active ? 150 : 190} y="133" width="60" height="14" rx="5" fill="#163a37" stroke={active ? '#34d399' : '#2d6a65'} strokeWidth="1.5"
                  style={{ transition: 'all 0.5s ease' }} />

                {/* Springs */}
                {[0,1,2].map(i => (
                  <line key={i}
                    x1={active ? 340 : 380} y1={153 + i * 5}
                    x2="460" y2={153 + i * 5}
                    stroke={i === 0 ? '#f59e0b' : i === 1 ? '#fbbf24' : '#fcd34d'}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    className={active ? 'spring-line' : ''}
                    style={{ transition: 'x1 0.5s ease' }}
                  />
                ))}

                {/* Ropes */}
                <path d={`M ${active ? 140 : 180},152 Q 110,152 90,145`} stroke="#6b7280" strokeWidth="1.5" fill="none" strokeDasharray="none" />
                <path d={`M ${active ? 140 : 180},165 Q 110,165 90,170`} stroke="#6b7280" strokeWidth="1.5" fill="none" />

                {/* Shoulder blocks */}
                <rect x="490" y="148" width="20" height="22" rx="4" fill="#3a4560" stroke="#5a6a8a" strokeWidth="1.5" />

                {/* === AR OVERLAYS (only when active) === */}
                {active && (
                  <>
                    {/* Spine alignment guide */}
                    <line x1="290" y1="30" x2="290" y2="145" stroke={alignColor} strokeWidth="2" className="ar-guide-line" strokeDasharray="8 4" opacity="0.9" />
                    {/* Hip level guide */}
                    <line x1="210" y1="120" x2="370" y2="120" stroke={alignColor} strokeWidth="1.5" className="ar-guide-line" strokeDasharray="6 3" opacity="0.8" />
                    {/* Shoulder symmetry */}
                    <line x1="230" y1="70" x2="350" y2="70" stroke="#60a5fa" strokeWidth="1.5" className="ar-guide-line" strokeDasharray="6 3" opacity="0.75" />

                    {/* Joint markers */}
                    {[[290,30,'Hip Center'],[230,70,'L Shoulder'],[350,70,'R Shoulder']].map(([cx,cy,label], i) => (
                      <g key={i}>
                        <circle cx={cx} cy={cy} r="5" fill="none" stroke={alignColor} strokeWidth="2" opacity="0.9" />
                        <circle cx={cx} cy={cy} r="2" fill={alignColor} opacity="0.9" />
                      </g>
                    ))}

                    {/* Core engagement glow */}
                    <circle cx="290" cy="100" r="12" fill={`${s.accent}22`} stroke={s.accent} strokeWidth="1.5" className="core-indicator" />

                    {/* Scan line */}
                    <rect x="60" y="30" width="460" height="2" fill={`${s.accent}55`} className="ar-scan-line" />

                    {/* Spring tension arc */}
                    <path d="M 350,145 Q 405,130 460,145" stroke="#f59e0b" strokeWidth="2" fill="none" opacity="0.7" strokeDasharray="none" />
                    <text x="400" y="128" fill="#fbbf24" fontSize="9" fontFamily="monospace" textAnchor="middle" opacity="0.9">
                      {selectedExercise.spring}
                    </text>

                    {/* Exercise name overlay */}
                    <rect x="60" y="32" width="140" height="22" rx="4" fill="rgba(0,0,0,0.55)" />
                    <text x="68" y="47" fill={selectedExercise.color} fontSize="11" fontFamily="monospace" fontWeight="700" letterSpacing="0.05em">
                      {selectedExercise.name.toUpperCase()}
                    </text>

                    {/* Rep counter */}
                    <rect x="448" y="32" width="72" height="34" rx="6" fill="rgba(0,0,0,0.6)" />
                    <text x="484" y="46" fill="white" fontSize="10" fontFamily="monospace" textAnchor="middle" opacity="0.7">REPS</text>
                    <text x="484" y="62" fill={selectedExercise.color} fontSize="18" fontFamily="monospace" fontWeight="800" textAnchor="middle">
                      {String(repCount).padStart(2, '0')}
                    </text>

                    {/* Form score badge */}
                    <rect x="448" y="74" width="72" height="28" rx="6" fill="rgba(0,0,0,0.6)" />
                    <text x="484" y="86" fill="white" fontSize="9" fontFamily="monospace" textAnchor="middle" opacity="0.7">FORM</text>
                    <text x="484" y="98" fill={alignColor} fontSize="14" fontFamily="monospace" fontWeight="800" textAnchor="middle">
                      {formScore}
                    </text>
                  </>
                )}

                {/* Idle overlay hint */}
                {!active && (
                  <>
                    <rect x="185" y="90" width="210" height="36" rx="8" fill="rgba(0,0,0,0.5)" />
                    <text x="290" y="110" fill="rgba(255,255,255,0.5)" fontSize="12" fontFamily="monospace" textAnchor="middle" letterSpacing="0.05em">
                      TAP START AR SESSION
                    </text>
                  </>
                )}
              </svg>

              {/* Bottom status bar */}
              <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                padding: '10px 16px',
                background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: active ? '#4ade80' : '#6b7280',
                    boxShadow: active ? '0 0 8px #4ade80' : 'none',
                  }} />
                  <span style={{ fontFamily: s.MONO, fontSize: 10, color: active ? '#4ade80' : 'rgba(255,255,255,0.4)', letterSpacing: '0.08em' }}>
                    {active ? 'AR LIVE · TAP CARRIAGE TO COUNT REP' : 'AR STANDBY'}
                  </span>
                </div>
                <button
                  onClick={e => { e.stopPropagation(); handleStart(); }}
                  style={{
                    fontFamily: s.MONO, fontSize: 11, letterSpacing: '0.06em',
                    padding: '6px 16px', borderRadius: 20,
                    background: active ? 'rgba(248,113,113,0.2)' : `rgba(${s.accent === '#b45309' ? '180,83,9' : '139,92,246'},0.25)`,
                    border: `1px solid ${active ? '#f87171' : s.accent}`,
                    color: active ? '#f87171' : s.accent,
                    cursor: 'pointer',
                  }}
                >
                  {active ? 'STOP SESSION' : 'START AR SESSION'}
                </button>
              </div>
            </div>
          </div>

          {/* Form Analysis Panel */}
          <div style={card}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <div>
                <div style={{ fontFamily: s.MONO, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: s.text3, marginBottom: 4 }}>Real-Time Analysis</div>
                <div style={{ fontFamily: s.DISPLAY, fontSize: 18, fontWeight: 700 }}>Form Metrics</div>
              </div>
              {!active && (
                <span style={{ fontFamily: s.MONO, fontSize: 10, color: s.text3, letterSpacing: '0.06em' }}>— START SESSION TO ACTIVATE —</span>
              )}
            </div>

            <div className="ar-form-metrics" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {/* Alignment Score */}
              <div style={{ background: 'rgba(0,0,0,0.03)', borderRadius: 12, padding: 16 }}>
                <div style={{ fontFamily: s.MONO, fontSize: 10, color: s.text3, marginBottom: 10, letterSpacing: '0.08em' }}>ALIGNMENT SCORE</div>
                <div style={{ position: 'relative', height: 8, background: 'rgba(0,0,0,0.08)', borderRadius: 4, overflow: 'hidden', marginBottom: 8 }}>
                  <div style={{
                    position: 'absolute', left: 0, top: 0, bottom: 0,
                    width: `${active ? formScore : 0}%`,
                    background: `linear-gradient(90deg, #f87171, #fbbf24, #4ade80)`,
                    borderRadius: 4, transition: 'width 0.6s ease',
                  }} />
                </div>
                <div style={{ fontFamily: s.MONO, fontSize: 22, fontWeight: 800, color: active ? alignColor : s.text3 }}>
                  {active ? formScore : '—'}
                  <span style={{ fontSize: 12, opacity: 0.6 }}>/100</span>
                </div>
              </div>

              {/* Symmetry */}
              <div style={{ background: 'rgba(0,0,0,0.03)', borderRadius: 12, padding: 16 }}>
                <div style={{ fontFamily: s.MONO, fontSize: 10, color: s.text3, marginBottom: 10, letterSpacing: '0.08em' }}>SYMMETRY L/R</div>
                <div style={{ display: 'flex', gap: 4, height: 8, borderRadius: 4, overflow: 'hidden', marginBottom: 8 }}>
                  <div style={{ flex: active ? symmetry : 50, background: '#60a5fa', transition: 'flex 0.5s ease', borderRadius: '4px 0 0 4px' }} />
                  <div style={{ flex: active ? 100 - symmetry : 50, background: '#a78bfa', transition: 'flex 0.5s ease', borderRadius: '0 4px 4px 0' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: s.MONO, fontSize: 11 }}>
                  <span style={{ color: '#60a5fa' }}>L {active ? `${symmetry}%` : '—'}</span>
                  <span style={{ color: '#a78bfa' }}>R {active ? `${100 - symmetry}%` : '—'}</span>
                </div>
              </div>

              {/* Tempo */}
              <div style={{ background: 'rgba(0,0,0,0.03)', borderRadius: 12, padding: 16 }}>
                <div style={{ fontFamily: s.MONO, fontSize: 10, color: s.text3, marginBottom: 10, letterSpacing: '0.08em' }}>TEMPO CONSISTENCY</div>
                <div style={{ display: 'flex', gap: 3, alignItems: 'flex-end', height: 28 }}>
                  {[60,75,80,55,85,78,90,82].map((h, i) => (
                    <div key={i} style={{
                      flex: 1, height: `${active ? h : 30}%`,
                      background: active ? `${s.accent}bb` : 'rgba(0,0,0,0.1)',
                      borderRadius: 2, transition: `height ${0.3 + i * 0.05}s ease`,
                    }} />
                  ))}
                </div>
                <div style={{ fontFamily: s.MONO, fontSize: 11, color: active ? s.accent : s.text3, marginTop: 6 }}>
                  {active ? '4 sec / rep  ✓' : '—'}
                </div>
              </div>

              {/* Spring Control */}
              <div style={{ background: 'rgba(0,0,0,0.03)', borderRadius: 12, padding: 16 }}>
                <div style={{ fontFamily: s.MONO, fontSize: 10, color: s.text3, marginBottom: 10, letterSpacing: '0.08em' }}>SPRING CONTROL</div>
                <div style={{ position: 'relative', height: 8, background: 'rgba(0,0,0,0.08)', borderRadius: 4, overflow: 'hidden', marginBottom: 8 }}>
                  <div style={{
                    position: 'absolute', left: 0, top: 0, bottom: 0,
                    width: active ? '76%' : '0%',
                    background: 'linear-gradient(90deg, #fbbf24, #f59e0b)',
                    borderRadius: 4, transition: 'width 0.6s ease',
                  }} />
                </div>
                <div style={{ fontFamily: s.MONO, fontSize: 11, color: active ? '#f59e0b' : s.text3 }}>
                  {active ? 'Smooth · 76/100' : '—'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Exercise Library */}
          <div style={card}>
            <div style={{ fontFamily: s.MONO, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: s.text3, marginBottom: 6 }}>Exercise Library</div>
            <div style={{ fontFamily: s.DISPLAY, fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Load Exercise</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {EXERCISES.map(ex => {
                const isSelected = selectedExercise.id === ex.id;
                return (
                  <button
                    key={ex.id}
                    onClick={() => handleSelectExercise(ex)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '10px 12px', borderRadius: 10,
                      border: `1px solid ${isSelected ? ex.color + '60' : 'rgba(0,0,0,0.06)'}`,
                      background: isSelected ? `${ex.color}12` : 'transparent',
                      cursor: 'pointer', textAlign: 'left',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <div style={{
                      width: 8, height: 8, borderRadius: '50%',
                      background: ex.color, flexShrink: 0,
                      boxShadow: isSelected ? `0 0 8px ${ex.color}` : 'none',
                    }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: s.FONT, fontSize: 13, fontWeight: 600, color: s.text, marginBottom: 2 }}>{ex.name}</div>
                      <div style={{ fontFamily: s.MONO, fontSize: 9, color: s.text3, letterSpacing: '0.04em' }}>
                        {ex.muscles.slice(0, 2).join(' · ')} · {ex.spring}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 2 }}>
                      {[1,2,3].map(d => (
                        <div key={d} style={{
                          width: 5, height: 5, borderRadius: '50%',
                          background: d <= ex.difficulty ? ex.color : 'rgba(0,0,0,0.12)',
                        }} />
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Session History */}
          <div style={card}>
            <div style={{ fontFamily: s.MONO, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: s.text3, marginBottom: 6 }}>Recent Activity</div>
            <div style={{ fontFamily: s.DISPLAY, fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Session History</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {SESSION_HISTORY.map((sess, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 12px', borderRadius: 10,
                  background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.05)',
                }}>
                  <div style={{ fontFamily: s.MONO, fontSize: 10, color: s.text3, width: 36 }}>{sess.date}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: s.FONT, fontSize: 12, fontWeight: 600, color: s.text }}>{sess.exercises} exercises</div>
                    <div style={{ fontFamily: s.MONO, fontSize: 9, color: s.text3 }}>Avg form: {sess.avgScore}</div>
                  </div>
                  <div style={{
                    fontFamily: s.MONO, fontSize: 11, fontWeight: 700,
                    color: sess.trend > 0 ? '#4ade80' : '#f87171',
                  }}>
                    {sess.trend > 0 ? '+' : ''}{sess.trend}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Setup Guide */}
          <div style={card}>
            <button
              onClick={() => setSetupOpen(o => !o)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: 'none', border: 'none', cursor: 'pointer', padding: 0,
              }}
            >
              <div>
                <div style={{ fontFamily: s.MONO, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: s.text3, marginBottom: 4, textAlign: 'left' }}>Hardware</div>
                <div style={{ fontFamily: s.DISPLAY, fontSize: 18, fontWeight: 700, color: s.text }}>Setup Guide</div>
              </div>
              <div style={{
                width: 28, height: 28, borderRadius: '50%', border: '1px solid rgba(0,0,0,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: s.MONO, fontSize: 14, color: s.text2,
                transform: setupOpen ? 'rotate(180deg)' : 'none',
                transition: 'transform 0.3s ease',
              }}>▾</div>
            </button>

            {setupOpen && (
              <div className="fade-in" style={{ marginTop: 16 }}>
                <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                  {DEVICES.map(dev => (
                    <div key={dev.name} style={{
                      flex: 1, padding: '10px 8px', borderRadius: 10, textAlign: 'center',
                      background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.06)',
                    }}>
                      <div style={{ fontSize: 20, marginBottom: 4 }}>{dev.icon}</div>
                      <div style={{ fontFamily: s.FONT, fontSize: 10, fontWeight: 600, color: s.text, marginBottom: 2 }}>{dev.name}</div>
                      <div style={{ fontFamily: s.MONO, fontSize: 8, color: s.accent, letterSpacing: '0.04em' }}>{dev.status}</div>
                    </div>
                  ))}
                </div>
                <div style={{ fontFamily: s.MONO, fontSize: 10, color: s.text3, letterSpacing: '0.08em', marginBottom: 10, textTransform: 'uppercase' }}>
                  Calibration Steps
                </div>
                {CALIBRATION_STEPS.map((step, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 10, alignItems: 'flex-start' }}>
                    <div style={{
                      width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                      background: `${s.accent}18`, border: `1px solid ${s.accent}44`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: s.MONO, fontSize: 9, fontWeight: 800, color: s.accent,
                    }}>{i + 1}</div>
                    <div style={{ fontFamily: s.FONT, fontSize: 12, color: s.text2, lineHeight: 1.5, paddingTop: 2 }}>{step}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
