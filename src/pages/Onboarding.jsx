// Onboarding — 4-screen first-launch intro for Pilates Studio
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStyles, useTheme } from '../theme';

const GOALS = [
  { id: 'tone', label: 'Tone & Sculpt' },
  { id: 'recovery', label: 'Injury Recovery' },
  { id: 'core', label: 'Core Strength' },
  { id: 'flexibility', label: 'Flexibility' },
  { id: 'stress', label: 'Stress Relief' },
];

const LEVELS = ['New', 'Some Experience', 'Advanced'];

const CLASS_TYPES = [
  { id: 'reformer', label: 'Reformer' },
  { id: 'mat', label: 'Mat' },
  { id: 'barre', label: 'Barre' },
  { id: 'stretch', label: 'Stretch' },
  { id: 'private', label: 'Private' },
];

const TIMES = ['Morning', 'Afternoon', 'Evening'];
const LENGTHS = ['30 min', '45 min', '60 min'];

// ── Spine illustration (CSS only) ────────────────────────────────────────────
function SpineIllustration({ accent }) {
  const vertebrae = [
    { w: 32, h: 9 },
    { w: 36, h: 9 },
    { w: 40, h: 10 },
    { w: 44, h: 10 },
    { w: 46, h: 10 },
    { w: 44, h: 9 },
    { w: 40, h: 9 },
    { w: 36, h: 8 },
    { w: 30, h: 8 },
    { w: 26, h: 7 },
    { w: 22, h: 7 },
    { w: 18, h: 6 },
  ];

  return (
    <div style={{
      position: 'relative', width: 160, height: 280,
      margin: '0 auto',
    }}>
      {/* Spine canal — central vertical rod */}
      <div style={{
        position: 'absolute', left: '50%', top: 0, bottom: 0,
        width: 6, transform: 'translateX(-50%)',
        background: `linear-gradient(to bottom, ${accent}60, ${accent}20)`,
        borderRadius: 3,
      }} />

      {/* Vertebrae */}
      {vertebrae.map((v, i) => {
        const top = i * (240 / vertebrae.length) + 4;
        const opacity = 0.25 + (i / vertebrae.length) * 0.55;
        return (
          <div key={i} style={{
            position: 'absolute',
            left: '50%', top,
            transform: 'translateX(-50%)',
            width: v.w, height: v.h,
            background: `linear-gradient(135deg, ${accent}${Math.round(opacity * 255).toString(16).padStart(2,'0')} 0%, ${accent}${Math.round(opacity * 0.6 * 255).toString(16).padStart(2,'0')} 100%)`,
            borderRadius: 3,
            border: `1px solid ${accent}40`,
          }} />
        );
      })}

      {/* Left arc arms — ribcage feel */}
      {[2, 3, 4, 5, 6, 7].map((i) => {
        const top = i * (240 / vertebrae.length) + 8;
        return (
          <div key={`l${i}`} style={{
            position: 'absolute', left: 4, top,
            width: 44, height: 18,
            border: `1.5px solid ${accent}28`,
            borderRight: 'none',
            borderRadius: '20px 0 0 20px',
            boxSizing: 'border-box',
          }} />
        );
      })}

      {/* Right arc arms */}
      {[2, 3, 4, 5, 6, 7].map((i) => {
        const top = i * (240 / vertebrae.length) + 8;
        return (
          <div key={`r${i}`} style={{
            position: 'absolute', right: 4, top,
            width: 44, height: 18,
            border: `1.5px solid ${accent}28`,
            borderLeft: 'none',
            borderRadius: '0 20px 20px 0',
            boxSizing: 'border-box',
          }} />
        );
      })}

      {/* Pelvis arc at base */}
      <div style={{
        position: 'absolute', left: '50%', bottom: 0,
        transform: 'translateX(-50%)',
        width: 64, height: 32,
        border: `2px solid ${accent}35`,
        borderTop: 'none',
        borderRadius: '0 0 32px 32px',
        boxSizing: 'border-box',
      }} />

      {/* Flow particles */}
      <style>{`
        @keyframes floatUp {
          0%   { opacity: 0; transform: translate(-50%, 0) scale(0.6); }
          30%  { opacity: 1; }
          100% { opacity: 0; transform: translate(-50%, -260px) scale(0.3); }
        }
      `}</style>
      {[0, 1, 2].map((i) => (
        <div key={`p${i}`} style={{
          position: 'absolute', left: `${40 + i * 10}%`, bottom: 30,
          width: 5, height: 5, borderRadius: '50%',
          background: accent,
          animation: `floatUp 3.5s ease-in-out ${i * 1.1}s infinite`,
          opacity: 0,
        }} />
      ))}
    </div>
  );
}

// ── Chip toggle ───────────────────────────────────────────────────────────────
function Chip({ label, selected, onClick, accent, accentLight, accentText, s }) {
  return (
    <button onClick={onClick} style={{
      padding: '9px 18px', borderRadius: 100, cursor: 'pointer', border: 'none',
      font: `500 13px ${s.FONT}`,
      background: selected ? accent : 'rgba(255,255,255,0.6)',
      color: selected ? accentText : '#555',
      boxShadow: selected ? `0 2px 12px ${accent}33` : '0 1px 4px rgba(0,0,0,0.05)',
      transition: 'all 0.22s cubic-bezier(0.16,1,0.3,1)',
      backdropFilter: 'blur(8px)',
      outline: selected ? `2px solid ${accent}40` : '2px solid transparent',
      transform: selected ? 'scale(1.04)' : 'scale(1)',
    }}>
      {label}
    </button>
  );
}

// ── Summary row ───────────────────────────────────────────────────────────────
function SummaryRow({ label, value, accent, s }) {
  if (!value) return null;
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
      padding: '12px 0', borderBottom: '1px solid rgba(0,0,0,0.05)',
    }}>
      <span style={{ fontFamily: s.MONO, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.5, color: '#999' }}>
        {label}
      </span>
      <span style={{ font: `400 13px ${s.FONT}`, color: '#444', textAlign: 'right', maxWidth: '60%' }}>
        {value}
      </span>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function Onboarding() {
  const s = useStyles();
  const { theme } = useTheme();
  const nav = useNavigate();

  const [screen, setScreen] = useState(0);
  const [visible, setVisible] = useState(true);
  const [direction, setDirection] = useState(1); // 1=forward, -1=back

  // Profile state
  const [goals, setGoals] = useState([]);
  const [level, setLevel] = useState('');
  const [injuries, setInjuries] = useState('');
  const [classTypes, setClassTypes] = useState([]);
  const [prefTime, setPrefTime] = useState('');
  const [classLength, setClassLength] = useState('');

  // Touch swipe
  const touchStart = useRef(null);

  const TOTAL = 4;

  function goTo(next) {
    const dir = next > screen ? 1 : -1;
    setDirection(dir);
    setVisible(false);
    setTimeout(() => {
      setScreen(next);
      setVisible(true);
    }, 220);
  }

  function advance() {
    if (screen < TOTAL - 1) goTo(screen + 1);
  }

  function finish() {
    const profile = { goals, level, injuries, classTypes, prefTime, classLength, completedAt: Date.now() };
    localStorage.setItem('rp_onboarding_profile', JSON.stringify(profile));
    localStorage.setItem('rp_onboarded', 'true');
    nav('/signin');
  }

  function skip() {
    localStorage.setItem('rp_onboarded', 'true');
    nav('/signin');
  }

  function toggleGoal(id) {
    setGoals(g => g.includes(id) ? g.filter(x => x !== id) : [...g, id]);
  }
  function toggleClassType(id) {
    setClassTypes(t => t.includes(id) ? t.filter(x => x !== id) : [...t, id]);
  }

  function onTouchStart(e) { touchStart.current = e.touches[0].clientX; }
  function onTouchEnd(e) {
    if (touchStart.current === null) return;
    const dx = touchStart.current - e.changedTouches[0].clientX;
    touchStart.current = null;
    if (Math.abs(dx) < 40) return;
    if (dx > 0 && screen < TOTAL - 1) advance();
    else if (dx < 0 && screen > 0) goTo(screen - 1);
  }

  const A = theme.accent;
  const AL = theme.accentLight;
  const AT = theme.accentText;

  const slideStyle = {
    opacity: visible ? 1 : 0,
    transform: visible
      ? 'translateX(0) scale(1)'
      : `translateX(${direction * 28}px) scale(0.98)`,
    transition: 'opacity 0.22s cubic-bezier(0.16,1,0.3,1), transform 0.22s cubic-bezier(0.16,1,0.3,1)',
    width: '100%',
  };

  // Staggered fade-in keyframe
  const fadeIn = (delay = 0) => ({
    animation: visible ? `obFadeIn 0.5s cubic-bezier(0.16,1,0.3,1) ${delay}s both` : 'none',
  });

  // Summary helpers
  const goalLabels = GOALS.filter(g => goals.includes(g.id)).map(g => g.label).join(', ');
  const classLabels = CLASS_TYPES.filter(c => classTypes.includes(c.id)).map(c => c.label).join(', ');

  return (
    <div
      style={{
        minHeight: '100vh', background: '#FAF6F1',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        overflowX: 'hidden', position: 'relative',
        padding: '0 24px',
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >

      <style>{`
        @keyframes obFadeIn {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes obPulse {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.12); }
        }
      `}</style>

      {/* Ambient glow behind content */}
      <div style={{
        position: 'fixed', top: '-20%', right: '-15%',
        width: 600, height: 600, borderRadius: '50%',
        background: `radial-gradient(circle, ${A}14 0%, transparent 60%)`,
        filter: 'blur(80px)', pointerEvents: 'none', zIndex: 0,
      }} />
      <div style={{
        position: 'fixed', bottom: '-25%', left: '-10%',
        width: 500, height: 500, borderRadius: '50%',
        background: `radial-gradient(circle, ${A}0c 0%, transparent 60%)`,
        filter: 'blur(60px)', pointerEvents: 'none', zIndex: 0,
      }} />

      {/* Skip button */}
      <button onClick={skip} style={{
        position: 'fixed', top: 'max(20px, env(safe-area-inset-top))', right: 24,
        background: 'rgba(255,255,255,0.5)', backdropFilter: 'blur(12px)',
        border: '1px solid rgba(0,0,0,0.07)', borderRadius: 100,
        padding: '7px 16px', cursor: 'pointer',
        font: `400 12px ${s.FONT}`, color: '#999',
        transition: 'all 0.2s ease', zIndex: 200,
      }}>
        Skip
      </button>

      {/* Card */}
      <div style={{
        position: 'relative', zIndex: 10,
        width: '100%', maxWidth: 440,
        background: 'rgba(255,255,255,0.72)',
        backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
        border: '1px solid rgba(255,255,255,0.7)',
        borderRadius: 24,
        boxShadow: '0 16px 64px rgba(0,0,0,0.07), 0 2px 4px rgba(0,0,0,0.03)',
        padding: '40px 36px 36px',
        minHeight: 480,
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Screen content */}
        <div style={{ ...slideStyle, flex: 1, display: 'flex', flexDirection: 'column' }}>

          {/* ── Screen 0: Welcome ── */}
          {screen === 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', flex: 1 }}>
              <div style={{ ...fadeIn(0.05), marginBottom: 28 }}>
                <SpineIllustration accent={A} />
              </div>
              <span style={{
                ...fadeIn(0.15),
                fontFamily: s.MONO, fontSize: 10, textTransform: 'uppercase',
                letterSpacing: 2, color: A, marginBottom: 12, display: 'block',
              }}>
                Pilates Studio
              </span>
              <h1 style={{
                ...fadeIn(0.22),
                fontFamily: s.DISPLAY, fontSize: 30, fontWeight: 700,
                color: '#2D2A26', lineHeight: 1.25, margin: '0 0 16px',
              }}>
                Welcome to<br />Pilates Studio
              </h1>
              <p style={{
                ...fadeIn(0.3),
                font: `300 15px ${s.FONT}`, color: '#777', lineHeight: 1.65,
                margin: 0, maxWidth: 320,
              }}>
                Move with intention. Every session is crafted to meet your body where it is — building strength, ease, and presence from the inside out.
              </p>
            </div>
          )}

          {/* ── Screen 1: Profile ── */}
          {screen === 1 && (
            <div style={{ flex: 1 }}>
              <span style={{
                ...fadeIn(0.05),
                fontFamily: s.MONO, fontSize: 10, textTransform: 'uppercase',
                letterSpacing: 2, color: A, marginBottom: 10, display: 'block',
              }}>
                Step 1 of 2
              </span>
              <h2 style={{
                ...fadeIn(0.12),
                fontFamily: s.DISPLAY, fontSize: 24, fontWeight: 700,
                color: '#2D2A26', margin: '0 0 6px',
              }}>
                Your Practice,<br />Personalized
              </h2>
              <p style={{
                ...fadeIn(0.18),
                font: `300 13px ${s.FONT}`, color: '#999', margin: '0 0 28px',
              }}>
                All optional — skip anything you'd like.
              </p>

              {/* Goals */}
              <div style={{ ...fadeIn(0.22), marginBottom: 24 }}>
                <span style={s.label}>What are your goals?</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {GOALS.map(g => (
                    <Chip
                      key={g.id} label={g.label}
                      selected={goals.includes(g.id)}
                      onClick={() => toggleGoal(g.id)}
                      accent={A} accentLight={AL} accentText={AT} s={s}
                    />
                  ))}
                </div>
              </div>

              {/* Experience */}
              <div style={{ ...fadeIn(0.3), marginBottom: 24 }}>
                <span style={s.label}>Experience level</span>
                <div style={{ display: 'flex', gap: 8 }}>
                  {LEVELS.map(l => (
                    <Chip
                      key={l} label={l}
                      selected={level === l}
                      onClick={() => setLevel(prev => prev === l ? '' : l)}
                      accent={A} accentLight={AL} accentText={AT} s={s}
                    />
                  ))}
                </div>
              </div>

              {/* Injuries */}
              <div style={fadeIn(0.37)}>
                <span style={s.label}>Any injuries or areas of concern?</span>
                <input
                  type="text"
                  placeholder="e.g. lower back, knee — or leave blank"
                  value={injuries}
                  onChange={e => setInjuries(e.target.value)}
                  style={{
                    ...s.input,
                    fontSize: 13,
                  }}
                  onFocus={e => { e.target.style.borderColor = A; e.target.style.boxShadow = `0 0 0 3px ${A}18`; }}
                  onBlur={e => { e.target.style.borderColor = 'rgba(0,0,0,0.06)'; e.target.style.boxShadow = 'none'; }}
                />
              </div>
            </div>
          )}

          {/* ── Screen 2: Preferences ── */}
          {screen === 2 && (
            <div style={{ flex: 1 }}>
              <span style={{
                ...fadeIn(0.05),
                fontFamily: s.MONO, fontSize: 10, textTransform: 'uppercase',
                letterSpacing: 2, color: A, marginBottom: 10, display: 'block',
              }}>
                Step 2 of 2
              </span>
              <h2 style={{
                ...fadeIn(0.12),
                fontFamily: s.DISPLAY, fontSize: 24, fontWeight: 700,
                color: '#2D2A26', margin: '0 0 6px',
              }}>
                Find Your Flow
              </h2>
              <p style={{
                ...fadeIn(0.18),
                font: `300 13px ${s.FONT}`, color: '#999', margin: '0 0 28px',
              }}>
                We'll suggest classes that fit your rhythm.
              </p>

              {/* Class types */}
              <div style={{ ...fadeIn(0.22), marginBottom: 24 }}>
                <span style={s.label}>Preferred class types</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {CLASS_TYPES.map(c => (
                    <Chip
                      key={c.id} label={c.label}
                      selected={classTypes.includes(c.id)}
                      onClick={() => toggleClassType(c.id)}
                      accent={A} accentLight={AL} accentText={AT} s={s}
                    />
                  ))}
                </div>
              </div>

              {/* Preferred time */}
              <div style={{ ...fadeIn(0.3), marginBottom: 24 }}>
                <span style={s.label}>Preferred time of day</span>
                <div style={{ display: 'flex', gap: 8 }}>
                  {TIMES.map(t => (
                    <Chip
                      key={t} label={t}
                      selected={prefTime === t}
                      onClick={() => setPrefTime(prev => prev === t ? '' : t)}
                      accent={A} accentLight={AL} accentText={AT} s={s}
                    />
                  ))}
                </div>
              </div>

              {/* Class length */}
              <div style={fadeIn(0.37)}>
                <span style={s.label}>Class length preference</span>
                <div style={{ display: 'flex', gap: 8 }}>
                  {LENGTHS.map(l => (
                    <Chip
                      key={l} label={l}
                      selected={classLength === l}
                      onClick={() => setClassLength(prev => prev === l ? '' : l)}
                      accent={A} accentLight={AL} accentText={AT} s={s}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Screen 3: You're Ready ── */}
          {screen === 3 && (
            <div style={{ flex: 1 }}>
              {/* Animated check mark */}
              <div style={{ ...fadeIn(0.05), display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
                <div style={{
                  width: 64, height: 64, borderRadius: '50%',
                  background: `linear-gradient(135deg, ${A}22, ${A}10)`,
                  border: `2px solid ${A}40`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 28,
                  animation: 'obPulse 3s ease-in-out infinite',
                }}>
                  ✦
                </div>
              </div>

              <h2 style={{
                ...fadeIn(0.12),
                fontFamily: s.DISPLAY, fontSize: 26, fontWeight: 700,
                color: '#2D2A26', margin: '0 0 6px', textAlign: 'center',
              }}>
                You're Ready
              </h2>
              <p style={{
                ...fadeIn(0.18),
                font: `300 13px ${s.FONT}`, color: '#999', margin: '0 0 24px', textAlign: 'center',
              }}>
                Your personalized practice is set.
              </p>

              {/* Summary card */}
              <div style={{
                ...fadeIn(0.24),
                background: AL || `${A}0a`,
                border: `1px solid ${A}20`,
                borderRadius: 14, padding: '16px 18px', marginBottom: 28,
              }}>
                <SummaryRow label="Goals" value={goalLabels || 'Not specified'} accent={A} s={s} />
                <SummaryRow label="Level" value={level || 'Not specified'} accent={A} s={s} />
                <SummaryRow label="Classes" value={classLabels || 'Not specified'} accent={A} s={s} />
                <SummaryRow label="Preferred time" value={prefTime || 'Not specified'} accent={A} s={s} />
                <SummaryRow label="Class length" value={classLength || 'Not specified'} accent={A} s={s} />
                {injuries && <SummaryRow label="Notes" value={injuries} accent={A} s={s} />}
              </div>

              {/* CTA */}
              <button
                onClick={finish}
                style={{
                  ...fadeIn(0.3),
                  width: '100%', padding: '15px', borderRadius: 14, border: 'none',
                  cursor: 'pointer',
                  background: `linear-gradient(135deg, ${A}, ${A}cc)`,
                  color: AT,
                  font: `600 15px ${s.FONT}`,
                  boxShadow: `0 4px 24px ${A}40`,
                  transition: 'all 0.25s cubic-bezier(0.16,1,0.3,1)',
                  letterSpacing: 0.3,
                }}
                onMouseEnter={e => { e.target.style.transform = 'translateY(-1px)'; e.target.style.boxShadow = `0 8px 32px ${A}50`; }}
                onMouseLeave={e => { e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = `0 4px 24px ${A}40`; }}
              >
                Enter Studio
              </button>
            </div>
          )}

        </div>

        {/* ── Bottom: nav buttons + dots ── */}
        <div style={{ marginTop: 32, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>

          {/* Dot indicators */}
          <div style={{ display: 'flex', gap: 7, alignItems: 'center' }}>
            {Array.from({ length: TOTAL }).map((_, i) => (
              <button
                key={i}
                onClick={() => i < screen ? goTo(i) : undefined}
                style={{
                  width: i === screen ? 20 : 7,
                  height: 7, borderRadius: 100, border: 'none',
                  background: i === screen ? A : `${A}30`,
                  cursor: i < screen ? 'pointer' : 'default',
                  transition: 'all 0.3s cubic-bezier(0.16,1,0.3,1)',
                  padding: 0,
                  animation: i === screen ? 'obPulse 2.5s ease-in-out infinite' : 'none',
                }}
              />
            ))}
          </div>

          {/* Forward button — shown on screens 0–2 */}
          {screen < TOTAL - 1 && (
            <button
              onClick={advance}
              style={{
                width: '100%', padding: '13px', borderRadius: 12, border: 'none',
                cursor: 'pointer',
                background: `linear-gradient(135deg, ${A}, ${A}cc)`,
                color: AT,
                font: `500 14px ${s.FONT}`,
                boxShadow: `0 2px 16px ${A}35`,
                transition: 'all 0.25s cubic-bezier(0.16,1,0.3,1)',
              }}
              onMouseEnter={e => { e.target.style.transform = 'translateY(-1px)'; e.target.style.boxShadow = `0 6px 24px ${A}45`; }}
              onMouseLeave={e => { e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = `0 2px 16px ${A}35`; }}
            >
              {screen === 0 ? 'Get Started' : 'Continue'}
            </button>
          )}

          {/* Back button — shown on screens 1–2 */}
          {screen > 0 && screen < TOTAL - 1 && (
            <button
              onClick={() => goTo(screen - 1)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                font: `400 13px ${s.FONT}`, color: '#AAA',
                padding: '4px 12px',
                transition: 'color 0.2s ease',
              }}
              onMouseEnter={e => { e.target.style.color = '#666'; }}
              onMouseLeave={e => { e.target.style.color = '#AAA'; }}
            >
              ← Back
            </button>
          )}

        </div>
      </div>

      {/* Progress line — top of card area */}
      <div style={{
        position: 'fixed', top: 0, left: 0,
        height: 3, width: `${((screen + 1) / TOTAL) * 100}%`,
        background: `linear-gradient(to right, ${A}, ${A}88)`,
        transition: 'width 0.4s cubic-bezier(0.16,1,0.3,1)',
        zIndex: 300,
        borderRadius: '0 2px 2px 0',
      }} />

    </div>
  );
}
