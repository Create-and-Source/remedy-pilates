import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStyles } from '../theme';
import { getServices, getProviders } from '../data/store';

/* ── Inject keyframes once ── */
const ANIM_ID = 'transformation-plan-anims';
if (!document.getElementById(ANIM_ID)) {
  const sheet = document.createElement('style');
  sheet.id = ANIM_ID;
  sheet.textContent = `
    @keyframes tpFadeUp {
      from { opacity: 0; transform: translateY(20px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes tpRingFill {
      from { stroke-dashoffset: 251; }
      to   { stroke-dashoffset: var(--ring-target); }
    }
    .tp-day-card:hover {
      transform: translateY(-3px) !important;
      box-shadow: 0 12px 40px rgba(0,0,0,0.09) !important;
    }
    .tp-tab:hover {
      background: rgba(255,255,255,0.5) !important;
    }
    .tp-cta-btn:hover {
      opacity: 0.9 !important;
      transform: translateY(-2px) !important;
      box-shadow: 0 12px 32px rgba(var(--accent-rgb),0.4) !important;
    }
  `;
  document.head.appendChild(sheet);
}

/* ── Constants ── */
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const WEEK_META = [
  { label: 'Week 1', subtitle: 'Foundation', pct: 25, desc: 'Building awareness — learning proper form and breathing techniques.' },
  { label: 'Week 2', subtitle: 'Build',       pct: 50, desc: 'Increasing intensity — adding springs, longer holds, deeper engagement.' },
  { label: 'Week 3', subtitle: 'Challenge',   pct: 75, desc: 'Pushing boundaries — advanced variations, faster transitions, new apparatus.' },
  { label: 'Week 4', subtitle: 'Transform',   pct: 100, desc: 'Integration — flowing sequences, peak performance, full-body expression.' },
];

const FOCUS_ICONS = {
  core:        '◎',
  flexibility: '↔',
  strength:    '▲',
  balance:     '⊛',
  cardio:      '♥',
  restore:     '∿',
};

const CLASS_CALORIES = {
  'Mat Pilates':         280,
  'Reformer':            320,
  'Barre':               300,
  'Tower':               310,
  'Chair':               290,
  'Cadillac':            300,
  'Stretch & Restore':   200,
  'HIIT':                380,
  'Cardio Trampoline':   400,
  'Jump Board':          390,
  'Power Pilates':       360,
  'Aerial':              340,
};

const DEFAULT_CLASSES = [
  { name: 'Mat Pilates',       duration: 45, focus: 'core',        difficulty: 'Beginner',     category: 'mat' },
  { name: 'Reformer Intro',    duration: 55, focus: 'strength',    difficulty: 'Beginner',     category: 'reformer' },
  { name: 'Stretch & Restore', duration: 60, focus: 'restore',     difficulty: 'Beginner',     category: 'stretch' },
  { name: 'Barre Basics',      duration: 45, focus: 'balance',     difficulty: 'Beginner',     category: 'barre' },
  { name: 'Reformer Flow',     duration: 55, focus: 'core',        difficulty: 'Intermediate', category: 'reformer' },
  { name: 'Tower Class',       duration: 50, focus: 'strength',    difficulty: 'Intermediate', category: 'tower' },
  { name: 'Barre Sculpt',      duration: 50, focus: 'balance',     difficulty: 'Intermediate', category: 'barre' },
  { name: 'Power Mat',         duration: 60, focus: 'cardio',      difficulty: 'Intermediate', category: 'mat' },
  { name: 'Reformer Advanced', duration: 60, focus: 'strength',    difficulty: 'Advanced',     category: 'reformer' },
  { name: 'Jump Board HIIT',   duration: 45, focus: 'cardio',      difficulty: 'Advanced',     category: 'reformer' },
  { name: 'Cadillac Fusion',   duration: 60, focus: 'flexibility', difficulty: 'Advanced',     category: 'cadillac' },
  { name: 'Deep Stretch',      duration: 45, focus: 'restore',     difficulty: 'Beginner',     category: 'stretch' },
];

const DEFAULT_INSTRUCTORS = [
  { name: 'Sarah K.',  specialties: ['mat', 'reformer', 'barre'] },
  { name: 'Maya L.',   specialties: ['reformer', 'tower', 'cadillac'] },
  { name: 'Jordan R.', specialties: ['barre', 'stretch', 'mat'] },
  { name: 'Priya S.',  specialties: ['reformer', 'cardio', 'hiit'] },
];

const TIME_LABELS = {
  morning: 'Morning',
  midday:  'Midday',
  evening: 'Evening',
  weekend: 'Weekend',
};

/* ── Plan generator ── */
function generatePlan(profile, services, providers) {
  const level    = profile?.level      || 'New';
  const goals    = profile?.goals      || [];
  const classTypes = (profile?.classTypes || []).map(c => c.toLowerCase());
  const prefTime = profile?.prefTime   || 'morning';
  const injuryFlag = (profile?.notes || '').toLowerCase().includes('injur') ||
                     (profile?.injuries || '').length > 0;

  // Build class pool from store, fall back to defaults
  let pool = services.length
    ? services.map(s => ({
        name:       s.name || 'Pilates Class',
        duration:   parseInt(s.duration) || 50,
        focus:      (s.category || 'core').toLowerCase(),
        difficulty: s.difficulty || 'Intermediate',
        category:   (s.category || 'mat').toLowerCase(),
        price:      s.price,
      }))
    : DEFAULT_CLASSES;

  // Filter by preferred class types if provided
  if (classTypes.length > 0) {
    const filtered = pool.filter(c =>
      classTypes.some(t => c.category.includes(t) || c.name.toLowerCase().includes(t))
    );
    if (filtered.length >= 3) pool = filtered;
  }

  // Always include stretch if injury flag
  const stretchClass = pool.find(c => c.focus === 'restore') ||
    { name: 'Stretch & Restore', duration: 60, focus: 'restore', difficulty: 'Beginner', category: 'stretch' };

  // Instructor matching
  const instructorPool = providers.length
    ? providers.map(p => ({
        name:        `${p.firstName || p.name || 'Instructor'} ${p.lastName || ''}`.trim(),
        specialties: (p.specialties || []).map(s => s.toLowerCase()),
      }))
    : DEFAULT_INSTRUCTORS;

  function pickInstructor(cls) {
    const matches = instructorPool.filter(i =>
      i.specialties.some(s => cls.category.includes(s) || s.includes(cls.category))
    );
    const pool2 = matches.length ? matches : instructorPool;
    return pool2[Math.floor(Math.random() * pool2.length)].name;
  }

  // Level-based class selectors
  function beginnerClasses()     { return pool.filter(c => c.difficulty === 'Beginner'); }
  function intermediateClasses() { return pool.filter(c => c.difficulty === 'Intermediate'); }
  function advancedClasses()     { return pool.filter(c => c.difficulty === 'Advanced'); }

  function pickFrom(arr) {
    if (!arr.length) return pool[0] || DEFAULT_CLASSES[0];
    return arr[Math.floor(Math.random() * arr.length)];
  }

  // Classes per week by level + week
  function classCounts(weekIdx) {
    if (level === 'New') return [3, 3, 4, 4][weekIdx];
    if (level === 'Some Experience') return [4, 4, 5, 5][weekIdx];
    return [4, 5, 5, 6][weekIdx]; // Advanced
  }

  // Difficulty mix per week
  function pickClass(weekIdx) {
    if (level === 'New') {
      if (weekIdx < 2) return pickFrom(beginnerClasses());
      return Math.random() < 0.6 ? pickFrom(beginnerClasses()) : pickFrom(intermediateClasses());
    }
    if (level === 'Some Experience') {
      if (weekIdx < 2) return Math.random() < 0.7 ? pickFrom(intermediateClasses()) : pickFrom(beginnerClasses());
      return Math.random() < 0.55 ? pickFrom(intermediateClasses()) : pickFrom(advancedClasses());
    }
    // Advanced
    return Math.random() < 0.4 ? pickFrom(intermediateClasses()) : pickFrom(advancedClasses());
  }

  // Build schedule for each week
  const weeks = WEEK_META.map((_, weekIdx) => {
    const count = classCounts(weekIdx);
    // Pick which days get classes (spread across week, prefer pref time days)
    const classDays = [];
    const all = [0, 1, 2, 3, 4, 5, 6];
    while (classDays.length < count) {
      const candidate = all[Math.floor(Math.random() * all.length)];
      if (!classDays.includes(candidate)) classDays.push(candidate);
    }
    classDays.sort((a, b) => a - b);

    // Ensure 1 stretch if injury
    const classSlots = classDays.map((dayIdx, i) => {
      let cls;
      if (injuryFlag && i === 0) cls = stretchClass;
      else cls = pickClass(weekIdx);
      return {
        dayIdx,
        class: cls,
        instructor: pickInstructor(cls),
        timeLabel: TIME_LABELS[prefTime] || 'Morning',
      };
    });

    return DAYS.map((day, di) => {
      const slot = classSlots.find(s => s.dayIdx === di);
      if (slot) return { day, type: 'class', ...slot };
      return { day, type: 'rest', suggestion: di === 6 ? 'Foam roll & breathwork' : di === 3 ? 'Light walk or swim' : 'Active recovery — stretch at home' };
    });
  });

  return weeks;
}

/* ── Progress Ring SVG ── */
function ProgressRing({ pct, accent, size = 56 }) {
  const r   = 38;
  const circ = 2 * Math.PI * r;
  const dash = circ * (pct / 100);
  return (
    <svg width={size} height={size} viewBox="0 0 88 88" style={{ transform: 'rotate(-90deg)' }}>
      <circle cx="44" cy="44" r={r} fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="7" />
      <circle
        cx="44" cy="44" r={r} fill="none"
        stroke={accent} strokeWidth="7"
        strokeLinecap="round"
        strokeDasharray={`${dash} ${circ}`}
        style={{ transition: 'stroke-dasharray 1s cubic-bezier(0.16,1,0.3,1)' }}
      />
      <text
        x="44" y="44" textAnchor="middle" dominantBaseline="middle"
        style={{
          transform: 'rotate(90deg)', transformOrigin: '44px 44px',
          font: "700 18px 'Outfit', sans-serif", fill: accent,
        }}
      >
        {pct}%
      </text>
    </svg>
  );
}

/* ── Difficulty pill ── */
function DifficultyPill({ level, accent }) {
  const colors = {
    Beginner:     { bg: 'rgba(22,163,74,0.1)',  text: '#16A34A' },
    Intermediate: { bg: 'rgba(217,119,6,0.1)',  text: '#D97706' },
    Advanced:     { bg: 'rgba(220,38,38,0.1)',   text: '#DC2626' },
  };
  const c = colors[level] || colors.Beginner;
  return (
    <span style={{
      padding: '2px 8px', borderRadius: 100,
      font: "500 10px 'JetBrains Mono', monospace",
      background: c.bg, color: c.text, letterSpacing: 0.5, textTransform: 'uppercase',
    }}>
      {level}
    </span>
  );
}

/* ── Main page ── */
export default function TransformationPlan() {
  const s = useStyles();
  const navigate = useNavigate();

  const [activeWeek, setActiveWeek] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 60);
    return () => clearTimeout(t);
  }, []);

  // Load profile
  const profile = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('rp_onboarding_profile')) || {}; }
    catch { return {}; }
  }, []);

  const services  = useMemo(() => getServices(),  []);
  const providers = useMemo(() => getProviders(), []);

  // Generate plan deterministically (seed from profile)
  const plan = useMemo(() => generatePlan(profile, services, providers), [profile, services, providers]);

  // Compute stats
  const stats = useMemo(() => {
    let totalClasses = 0, totalMinutes = 0, totalCals = 0;
    const focuses = new Set();
    plan.forEach(week => {
      week.forEach(day => {
        if (day.type === 'class') {
          totalClasses++;
          totalMinutes += day.class.duration || 50;
          focuses.add(day.class.focus);
          const cal = CLASS_CALORIES[day.class.name] || 280;
          totalCals += cal;
        }
      });
    });
    return { totalClasses, totalMinutes, focuses: focuses.size, totalCals };
  }, [plan]);

  const goals = Array.isArray(profile?.goals) ? profile.goals : [];
  const level = profile?.level || 'New';

  const fadeDelay = (i) => ({
    animation: visible ? `tpFadeUp 0.55s cubic-bezier(0.16,1,0.3,1) ${i * 80}ms both` : 'none',
  });

  return (
    <div style={{ minHeight: '100vh', background: s.bg, fontFamily: s.FONT }}>

      {/* ── Hero ── */}
      <div style={{
        ...fadeDelay(0),
        background: `linear-gradient(135deg, ${s.accent}18 0%, transparent 60%)`,
        borderRadius: 20, padding: '48px 48px 40px',
        marginBottom: 32, position: 'relative', overflow: 'hidden',
      }}>
        {/* Decorative ring */}
        <div style={{
          position: 'absolute', right: -40, top: -40,
          width: 260, height: 260, borderRadius: '50%',
          border: `1.5px solid ${s.accent}20`, pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', right: 20, top: 20,
          width: 160, height: 160, borderRadius: '50%',
          border: `1.5px solid ${s.accent}15`, pointerEvents: 'none',
        }} />

        <div style={{
          fontFamily: s.MONO, fontSize: 11, textTransform: 'uppercase',
          letterSpacing: 2, color: s.accent, marginBottom: 12, fontWeight: 500,
        }}>
          Your Personalized Program
        </div>

        <h1 style={{
          fontFamily: s.DISPLAY, fontSize: 'clamp(28px, 4vw, 42px)',
          fontWeight: 700, color: s.text, margin: '0 0 16px', lineHeight: 1.2,
        }}>
          Your 30-Day Transformation
        </h1>

        <p style={{ color: s.text2, fontSize: 15, margin: '0 0 28px', maxWidth: 520, lineHeight: 1.6 }}>
          A personalized 4-week progressive plan built around your goals, fitness level,
          and schedule preferences.
        </p>

        {/* Goal pills */}
        {goals.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
            {goals.map(g => (
              <span key={g} style={{
                padding: '6px 14px', borderRadius: 100,
                background: s.accent, color: s.accentText,
                font: `500 12px '${s.FONT}'`, boxShadow: `0 2px 10px ${s.accent}33`,
              }}>
                {g}
              </span>
            ))}
          </div>
        )}

        {/* Level badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            padding: '5px 14px', borderRadius: 100,
            background: 'rgba(255,255,255,0.7)', border: `1.5px solid ${s.accent}40`,
            font: `500 12px '${s.MONO}'`, color: s.accent, letterSpacing: 0.5,
            backdropFilter: 'blur(8px)',
          }}>
            {level} Level
          </span>
          {profile?.prefTime && (
            <span style={{
              padding: '5px 14px', borderRadius: 100,
              background: 'rgba(255,255,255,0.5)', border: '1px solid rgba(0,0,0,0.06)',
              font: `400 12px '${s.FONT}'`, color: s.text2,
              backdropFilter: 'blur(8px)',
            }}>
              {TIME_LABELS[profile.prefTime] || profile.prefTime} preferred
            </span>
          )}
        </div>
      </div>

      {/* ── Stats Bar ── */}
      <div style={{
        ...fadeDelay(1),
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 32,
      }} className="tp-stats-grid">
        {[
          { label: 'Total Classes', value: stats.totalClasses, unit: 'sessions' },
          { label: 'Total Minutes', value: stats.totalMinutes, unit: 'min' },
          { label: 'Focus Areas', value: stats.focuses, unit: 'covered' },
          { label: 'Est. Calories', value: stats.totalCals.toLocaleString(), unit: 'kcal' },
        ].map((stat, i) => (
          <div key={i} style={{
            ...s.cardStyle, padding: '20px 24px', textAlign: 'center',
          }}>
            <div style={{
              fontFamily: s.DISPLAY, fontSize: 32, fontWeight: 700,
              color: s.accent, lineHeight: 1, marginBottom: 4,
            }}>
              {stat.value}
            </div>
            <div style={{ fontFamily: s.MONO, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.2, color: s.text3, marginBottom: 2 }}>
              {stat.unit}
            </div>
            <div style={{ fontSize: 12, color: s.text2 }}>{stat.label}</div>
          </div>
        ))}

        <style>{`
          @media (max-width: 768px) {
            .tp-stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
            .tp-week-grid  { grid-template-columns: 1fr !important; }
          }
        `}</style>
      </div>

      {/* ── Week Tabs ── */}
      <div style={{ ...fadeDelay(2), marginBottom: 20 }}>
        <div style={{
          display: 'flex', gap: 6,
          background: 'rgba(0,0,0,0.03)', borderRadius: 12, padding: 5,
          width: 'fit-content', flexWrap: 'wrap',
        }}>
          {WEEK_META.map((w, i) => {
            const isActive = i === activeWeek;
            return (
              <button
                key={i}
                className="tp-tab"
                onClick={() => setActiveWeek(i)}
                style={{
                  padding: '9px 20px', borderRadius: 9, border: 'none', cursor: 'pointer',
                  font: `${isActive ? '600' : '400'} 13px '${s.FONT}'`,
                  background: isActive ? '#fff' : 'transparent',
                  color: isActive ? s.accent : s.text2,
                  boxShadow: isActive ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
                  transition: 'all 0.2s cubic-bezier(0.16,1,0.3,1)',
                }}
              >
                <span>{w.label}</span>
                {isActive && (
                  <span style={{
                    marginLeft: 6, fontFamily: s.MONO, fontSize: 10,
                    textTransform: 'uppercase', letterSpacing: 0.5, color: s.accent, opacity: 0.7,
                  }}>
                    {w.subtitle}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Weekly Calendar Grid ── */}
      <div style={{ ...fadeDelay(3), marginBottom: 32 }}>
        <div style={{
          fontFamily: s.MONO, fontSize: 10, textTransform: 'uppercase',
          letterSpacing: 1.5, color: s.text3, marginBottom: 14,
        }}>
          {WEEK_META[activeWeek].label} — {WEEK_META[activeWeek].subtitle}
        </div>

        <div className="tp-week-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: 10,
        }}>
          {plan[activeWeek].map((day, di) => (
            <div
              key={di}
              className="tp-day-card"
              style={{
                ...s.cardStyle,
                padding: '14px 12px',
                minHeight: 160,
                display: 'flex', flexDirection: 'column', gap: 8,
                borderTop: day.type === 'class' ? `3px solid ${s.accent}` : '3px solid rgba(0,0,0,0.04)',
                cursor: 'default',
                transition: 'all 0.25s cubic-bezier(0.16,1,0.3,1)',
              }}
            >
              {/* Day header */}
              <div style={{
                fontFamily: s.MONO, fontSize: 10, textTransform: 'uppercase',
                letterSpacing: 1.2, color: s.text3, fontWeight: 600,
              }}>
                {day.day}
              </div>

              {day.type === 'class' ? (
                <>
                  {/* Focus icon */}
                  <div style={{
                    width: 32, height: 32, borderRadius: 8,
                    background: `${s.accent}15`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 16, color: s.accent,
                  }}>
                    {FOCUS_ICONS[day.class.focus] || '◎'}
                  </div>

                  {/* Class name */}
                  <div style={{
                    fontFamily: s.FONT, fontSize: 13, fontWeight: 600,
                    color: s.text, lineHeight: 1.3,
                  }}>
                    {day.class.name}
                  </div>

                  {/* Duration */}
                  <div style={{ fontSize: 11, color: s.text2 }}>
                    {day.class.duration} min · {day.timeLabel}
                  </div>

                  {/* Instructor */}
                  <div style={{
                    fontFamily: s.MONO, fontSize: 10, color: s.text3,
                    letterSpacing: 0.3,
                  }}>
                    {day.instructor}
                  </div>

                  {/* Difficulty pill */}
                  <div style={{ marginTop: 'auto' }}>
                    <DifficultyPill level={day.class.difficulty} accent={s.accent} />
                  </div>
                </>
              ) : (
                <>
                  {/* Rest icon */}
                  <div style={{
                    width: 32, height: 32, borderRadius: 8,
                    background: 'rgba(0,0,0,0.04)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 16, color: s.text3,
                  }}>
                    ∿
                  </div>

                  <div style={{
                    fontFamily: s.FONT, fontSize: 13, fontWeight: 600,
                    color: s.text3,
                  }}>
                    Rest & Recover
                  </div>

                  <div style={{
                    fontSize: 11, color: s.text3, lineHeight: 1.5, fontStyle: 'italic',
                    marginTop: 2,
                  }}>
                    {day.suggestion}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Progress Timeline ── */}
      <div style={{ ...fadeDelay(4), marginBottom: 40 }}>
        <div style={{
          fontFamily: s.MONO, fontSize: 10, textTransform: 'uppercase',
          letterSpacing: 1.5, color: s.text3, marginBottom: 20,
        }}>
          Your Journey
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {WEEK_META.map((w, i) => {
            const isActive = i === activeWeek;
            return (
              <div
                key={i}
                onClick={() => setActiveWeek(i)}
                style={{
                  display: 'flex', gap: 24, alignItems: 'flex-start',
                  cursor: 'pointer', padding: '20px 24px', borderRadius: 14,
                  background: isActive ? `${s.accent}08` : 'transparent',
                  border: isActive ? `1px solid ${s.accent}20` : '1px solid transparent',
                  transition: 'all 0.25s cubic-bezier(0.16,1,0.3,1)',
                  marginBottom: 8,
                }}
              >
                {/* Ring */}
                <div style={{ flexShrink: 0 }}>
                  <ProgressRing pct={w.pct} accent={isActive ? s.accent : s.text3} size={56} />
                </div>

                {/* Text */}
                <div style={{ flex: 1 }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6,
                  }}>
                    <span style={{
                      fontFamily: s.DISPLAY, fontSize: 16, fontWeight: 700,
                      color: isActive ? s.text : s.text2,
                    }}>
                      {w.label}
                    </span>
                    <span style={{
                      fontFamily: s.MONO, fontSize: 10, textTransform: 'uppercase',
                      letterSpacing: 1, color: isActive ? s.accent : s.text3,
                    }}>
                      {w.subtitle}
                    </span>
                  </div>
                  <div style={{
                    fontSize: 13, color: s.text2, lineHeight: 1.6, maxWidth: 520,
                  }}>
                    {w.desc}
                  </div>
                </div>

                {/* Connector line */}
                {i < WEEK_META.length - 1 && (
                  <div style={{
                    position: 'absolute',
                    left: 47, top: '100%', width: 2, height: 8,
                    background: `${s.accent}20`,
                  }} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Book Week 1 CTA ── */}
      <div style={{
        ...fadeDelay(5),
        ...s.cardStyle,
        padding: '36px 40px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 20,
        background: `linear-gradient(135deg, ${s.accent}12 0%, rgba(255,255,255,0.72) 60%)`,
        marginBottom: 40,
      }}>
        <div>
          <div style={{
            fontFamily: s.DISPLAY, fontSize: 22, fontWeight: 700,
            color: s.text, marginBottom: 6,
          }}>
            Ready to Start Week 1?
          </div>
          <div style={{ fontSize: 14, color: s.text2, lineHeight: 1.6 }}>
            Book your Foundation week classes and begin your transformation journey.
          </div>
        </div>
        <button
          className="tp-cta-btn"
          onClick={() => navigate('/book')}
          style={{
            padding: '14px 36px', borderRadius: 100, border: 'none', cursor: 'pointer',
            background: s.accent, color: s.accentText,
            font: `600 15px '${s.FONT}'`,
            boxShadow: `0 6px 24px ${s.accent}40`,
            transition: 'all 0.25s cubic-bezier(0.16,1,0.3,1)',
            flexShrink: 0,
          }}
        >
          Book Week 1 →
        </button>
      </div>

    </div>
  );
}
