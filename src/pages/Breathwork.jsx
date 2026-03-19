import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStyles, useTheme } from '../theme';

// ── Breathing patterns ─────────────────────────────────────────────────────
const PATTERNS = {
  box: {
    name: 'Box Breathing',
    phases: [
      { label: 'Breathe In', duration: 4, type: 'inhale' },
      { label: 'Hold', duration: 4, type: 'hold' },
      { label: 'Breathe Out', duration: 4, type: 'exhale' },
      { label: 'Hold', duration: 4, type: 'hold' },
    ],
  },
  diaphragmatic: {
    name: 'Diaphragmatic',
    phases: [
      { label: 'Breathe In', duration: 4, type: 'inhale' },
      { label: 'Hold', duration: 2, type: 'hold' },
      { label: 'Breathe Out', duration: 6, type: 'exhale' },
    ],
  },
  '4-7-8': {
    name: '4-7-8',
    phases: [
      { label: 'Breathe In', duration: 4, type: 'inhale' },
      { label: 'Hold', duration: 7, type: 'hold' },
      { label: 'Breathe Out', duration: 8, type: 'exhale' },
    ],
  },
  progressive: {
    name: 'Progressive Relaxation',
    // computed dynamically — see getProgressivePhases()
    phases: [
      { label: 'Breathe In', duration: 3, type: 'inhale' },
      { label: 'Hold', duration: 3, type: 'hold' },
      { label: 'Breathe Out', duration: 3, type: 'exhale' },
    ],
  },
};

function getPatternPhases(patternKey, cycleIndex) {
  if (patternKey !== 'progressive') return PATTERNS[patternKey].phases;
  // Progressive: starts 3-3-3, step +1 every 2 cycles, max 5-7-8
  const step = Math.min(Math.floor(cycleIndex / 2), 2);
  return [
    { label: 'Breathe In', duration: 3 + step * 1, type: 'inhale' },
    { label: 'Hold', duration: 3 + step * 2, type: 'hold' },
    { label: 'Breathe Out', duration: 3 + step * 2.5, type: 'exhale' },
  ];
}

// ── Sessions ───────────────────────────────────────────────────────────────
const SESSIONS = [
  {
    id: 'morning',
    name: 'Morning Energize',
    duration: 3,
    pattern: 'box',
    tagline: 'Start your day with clarity',
    description: 'Equal-ratio box breathing resets the nervous system and brings focused, energized calm before your day begins.',
    gradient: 'linear-gradient(135deg, #FF9F43 0%, #EE5A24 100%)',
    gradientDark: 'linear-gradient(135deg, #3A1A00 0%, #1A0800 100%)',
    ambientFrom: '#1A0800',
    ambientTo: '#0A0500',
    circleGlow: '#FF9F43',
    emoji: '🌅',
  },
  {
    id: 'pre-class',
    name: 'Pre-Class Focus',
    duration: 5,
    pattern: 'diaphragmatic',
    tagline: 'Center before you move',
    description: 'Deep diaphragmatic breathing activates your parasympathetic system, grounding you for intentional movement.',
    gradient: 'linear-gradient(135deg, #55E6C1 0%, #1ABC9C 100%)',
    gradientDark: 'linear-gradient(135deg, #00261E 0%, #001A15 100%)',
    ambientFrom: '#001A15',
    ambientTo: '#000D0A',
    circleGlow: '#55E6C1',
    emoji: '🧘',
  },
  {
    id: 'cool-down',
    name: 'Post-Class Cool Down',
    duration: 5,
    pattern: '4-7-8',
    tagline: 'Ease back into stillness',
    description: 'Extended exhale activates the vagal brake, lowering heart rate and transitioning your body from effort to recovery.',
    gradient: 'linear-gradient(135deg, #74B9FF 0%, #0984E3 100%)',
    gradientDark: 'linear-gradient(135deg, #001626 0%, #000C18 100%)',
    ambientFrom: '#000C18',
    ambientTo: '#000608',
    circleGlow: '#74B9FF',
    emoji: '🌊',
  },
  {
    id: 'evening',
    name: 'Evening Wind Down',
    duration: 7,
    pattern: 'progressive',
    tagline: 'Prepare your body for rest',
    description: 'Progressive relaxation deepens with each cycle — gently extending your breath to signal sleep readiness.',
    gradient: 'linear-gradient(135deg, #A29BFE 0%, #6C5CE7 100%)',
    gradientDark: 'linear-gradient(135deg, #1A0030 0%, #0D001A 100%)',
    ambientFrom: '#0D001A',
    ambientTo: '#060010',
    circleGlow: '#A29BFE',
    emoji: '🌙',
  },
];

// ── Sound modes ────────────────────────────────────────────────────────────
const SOUNDS = [
  { id: 'silent', label: 'Silent' },
  { id: 'ocean', label: 'Ocean Waves' },
  { id: 'rain', label: 'Rain' },
  { id: 'forest', label: 'Forest' },
];

// ── localStorage ───────────────────────────────────────────────────────────
const LOG_KEY = 'rp_breathwork_log';

function loadLog() {
  try { return JSON.parse(localStorage.getItem(LOG_KEY)) || []; } catch { return []; }
}
function saveLog(entry) {
  const log = loadLog();
  log.unshift(entry);
  localStorage.setItem(LOG_KEY, JSON.stringify(log.slice(0, 200)));
}

// ── Helpers ────────────────────────────────────────────────────────────────
function fmtTime(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function totalCycleSeconds(phases) {
  return phases.reduce((a, p) => a + p.duration, 0);
}

function calcTotalCycles(session) {
  const phases = getPatternPhases(session.pattern, 0);
  const cycleTime = totalCycleSeconds(phases);
  return Math.round((session.duration * 60) / cycleTime);
}

function getWeekStart() {
  const now = new Date();
  const d = new Date(now);
  d.setDate(d.getDate() - d.getDay());
  d.setHours(0, 0, 0, 0);
  return d;
}

function getMonthStart() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

const EMOJI_RATINGS = ['😞', '😐', '🙂', '😊', '🤩'];

// ── Particle components (CSS-only ambient) ─────────────────────────────────
function OceanWaves({ color }) {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      {[0, 1, 2, 3].map(i => (
        <div key={i} style={{
          position: 'absolute',
          bottom: `${i * 14}%`,
          left: '-20%',
          width: '140%',
          height: 60,
          background: `rgba(${i % 2 === 0 ? '116,185,255' : '0,132,227'},${0.06 - i * 0.01})`,
          borderRadius: '50%',
          animation: `oceanWave ${3 + i * 0.8}s ease-in-out ${i * 0.5}s infinite`,
        }} />
      ))}
      <style>{`
        @keyframes oceanWave {
          0%, 100% { transform: translateY(0) scaleY(1); }
          50% { transform: translateY(-18px) scaleY(1.15); }
        }
      `}</style>
    </div>
  );
}

function RainDrops() {
  const drops = Array.from({ length: 28 }, (_, i) => ({
    id: i,
    left: `${(i * 37) % 100}%`,
    delay: `${(i * 0.13) % 2}s`,
    duration: `${0.7 + (i * 0.09) % 0.8}s`,
    height: `${10 + (i * 7) % 18}px`,
  }));
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      {drops.map(d => (
        <div key={d.id} style={{
          position: 'absolute',
          top: '-20px',
          left: d.left,
          width: 1.5,
          height: d.height,
          background: 'rgba(116,185,255,0.25)',
          borderRadius: 2,
          animation: `rainFall ${d.duration} ${d.delay} linear infinite`,
        }} />
      ))}
      <style>{`
        @keyframes rainFall {
          0% { transform: translateY(0); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 0.7; }
          100% { transform: translateY(110vh); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

function LeafParticles() {
  const leaves = Array.from({ length: 16 }, (_, i) => ({
    id: i,
    left: `${(i * 43) % 90 + 5}%`,
    delay: `${(i * 0.6) % 6}s`,
    duration: `${4 + (i * 0.8) % 5}s`,
    size: `${8 + (i * 3) % 10}px`,
    rotate: (i * 47) % 360,
  }));
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      {leaves.map(l => (
        <div key={l.id} style={{
          position: 'absolute',
          top: '-30px',
          left: l.left,
          width: l.size,
          height: l.size,
          background: 'rgba(85,230,193,0.20)',
          borderRadius: '50% 10% 50% 10%',
          transform: `rotate(${l.rotate}deg)`,
          animation: `leafFall ${l.duration} ${l.delay} ease-in-out infinite`,
        }} />
      ))}
      <style>{`
        @keyframes leafFall {
          0% { transform: translateY(0) rotate(0deg) translateX(0); opacity: 0; }
          10% { opacity: 0.8; }
          50% { transform: translateY(45vh) rotate(180deg) translateX(30px); }
          90% { opacity: 0.4; }
          100% { transform: translateY(100vh) rotate(360deg) translateX(-20px); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

// ── Checkmark animation ────────────────────────────────────────────────────
function Checkmark({ color }) {
  return (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none" style={{ display: 'block' }}>
      <circle cx="40" cy="40" r="36" stroke={color} strokeWidth="3" opacity="0.3" />
      <circle
        cx="40" cy="40" r="36"
        stroke={color} strokeWidth="3"
        strokeDasharray="226" strokeDashoffset="226"
        strokeLinecap="round"
        style={{ animation: 'checkCircle 0.6s cubic-bezier(0.16,1,0.3,1) forwards' }}
      />
      <polyline
        points="24,40 35,51 56,29"
        stroke={color} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"
        strokeDasharray="50" strokeDashoffset="50"
        style={{ animation: 'checkMark 0.4s 0.5s cubic-bezier(0.16,1,0.3,1) forwards' }}
      />
      <style>{`
        @keyframes checkCircle { to { stroke-dashoffset: 0; } }
        @keyframes checkMark { to { stroke-dashoffset: 0; } }
      `}</style>
    </svg>
  );
}

// ── Main component ─────────────────────────────────────────────────────────
export default function Breathwork() {
  const s = useStyles();
  const { theme } = useTheme();
  const navigate = useNavigate();

  // ── UI state ──
  const [selectedSession, setSelectedSession] = useState(null);
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [soundMode, setSoundMode] = useState('silent');
  const [completed, setCompleted] = useState(null); // { session, totalBreaths, cycleCount }
  const [rating, setRating] = useState(null);
  const [log, setLog] = useState(loadLog);

  // ── Session timer state ──
  const [currentPhaseIdx, setCurrentPhaseIdx] = useState(0);
  const [secondsInPhase, setSecondsInPhase] = useState(0);
  const [cycleCount, setCycleCount] = useState(0);
  const [totalSecondsRemaining, setTotalSecondsRemaining] = useState(0);
  const [totalBreaths, setTotalBreaths] = useState(0);

  const intervalRef = useRef(null);
  const pausedRef = useRef(false);

  // ── Derived ──
  const activeSession = SESSIONS.find(s => s.id === selectedSession);
  const totalCycles = activeSession ? calcTotalCycles(activeSession) : 0;
  const currentPhases = activeSession
    ? getPatternPhases(activeSession.pattern, cycleCount)
    : [];
  const currentPhase = currentPhases[currentPhaseIdx] || { label: '', duration: 4, type: 'inhale' };

  // ── Scale animation: 1.0 on exhale/hold-after-exhale, 1.35 on inhale, 1.2 on hold-after-inhale ──
  function getCircleScale(phase) {
    if (phase.type === 'inhale') return 1.35;
    if (phase.type === 'exhale') return 0.85;
    // hold — inherit from prior
    return 1.1;
  }
  const circleScale = getCircleScale(currentPhase);
  const circleTransitionTime = currentPhase.duration;

  // ── Start session ──
  function startSession(sessionId) {
    const sess = SESSIONS.find(s => s.id === sessionId);
    if (!sess) return;
    setSelectedSession(sessionId);
    setCompleted(null);
    setRating(null);
    setCurrentPhaseIdx(0);
    setSecondsInPhase(0);
    setCycleCount(0);
    setTotalBreaths(0);
    setTotalSecondsRemaining(sess.duration * 60);
    setIsActive(true);
    setIsPaused(false);
    pausedRef.current = false;
  }

  // ── Tick ──
  useEffect(() => {
    if (!isActive) return;

    intervalRef.current = setInterval(() => {
      if (pausedRef.current) return;

      setTotalSecondsRemaining(prev => {
        if (prev <= 1) {
          // Session over
          clearInterval(intervalRef.current);
          setIsActive(false);
          setCompleted({
            session: selectedSession,
            cycleCount,
            totalBreaths,
          });
          return 0;
        }
        return prev - 1;
      });

      setSecondsInPhase(prevSec => {
        // We read current phase from ref-like approach via a functional update
        // Instead, we manage phase advancement here
        const nextSec = prevSec + 1;
        return nextSec;
      });
    }, 1000);

    return () => clearInterval(intervalRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, selectedSession]);

  // ── Phase advancement — watch secondsInPhase ──
  useEffect(() => {
    if (!isActive || isPaused) return;
    if (currentPhases.length === 0) return;

    const phaseDuration = currentPhase.duration;
    if (secondsInPhase >= phaseDuration) {
      const nextPhaseIdx = (currentPhaseIdx + 1) % currentPhases.length;
      if (nextPhaseIdx === 0) {
        // Completed a full cycle
        setCycleCount(prev => prev + 1);
        if (activeSession?.pattern === 'diaphragmatic' || currentPhase.type === 'exhale') {
          setTotalBreaths(prev => prev + 1);
        }
      }
      setCurrentPhaseIdx(nextPhaseIdx);
      setSecondsInPhase(0);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsInPhase]);

  // ── Pause / Resume ──
  function togglePause() {
    setIsPaused(p => {
      pausedRef.current = !p;
      return !p;
    });
  }

  // ── End session early ──
  function endSession() {
    clearInterval(intervalRef.current);
    setIsActive(false);
    setCompleted({
      session: selectedSession,
      cycleCount,
      totalBreaths,
    });
  }

  // ── Save & reset after completion ──
  function saveAndReset(chosenRating) {
    if (completed) {
      const sess = SESSIONS.find(s => s.id === completed.session);
      const entry = {
        id: `BW-${Date.now()}`,
        date: new Date().toISOString(),
        sessionId: completed.session,
        sessionName: sess?.name || '',
        pattern: PATTERNS[sess?.pattern]?.name || '',
        duration: sess?.duration || 0,
        cycleCount: completed.cycleCount,
        totalBreaths: completed.totalBreaths,
        rating: chosenRating,
      };
      saveLog(entry);
      setLog(loadLog());
    }
    setCompleted(null);
    setSelectedSession(null);
    setRating(null);
    setIsActive(false);
  }

  // ── History stats ──
  const weekStart = getWeekStart();
  const monthStart = getMonthStart();
  const weekSessions = log.filter(e => new Date(e.date) >= weekStart);
  const monthSessions = log.filter(e => new Date(e.date) >= monthStart);
  const totalMindfulMinutes = log.reduce((a, e) => a + (e.duration || 0), 0);
  const last7 = log.slice(0, 7);

  // ── Progress: phase countdown ──
  const phaseSecondsLeft = Math.max(0, currentPhase.duration - secondsInPhase);

  // ── Render: active session overlay ──────────────────────────────────────
  if (isActive && activeSession) {
    return (
      <div style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: activeSession.ambientFrom,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden',
        animation: 'ambientShift 12s ease-in-out infinite alternate',
      }}>
        <style>{`
          @keyframes ambientShift {
            0% { background: ${activeSession.ambientFrom}; }
            100% { background: ${activeSession.ambientTo}; }
          }
          @keyframes breathePulse {
            0%, 100% { box-shadow: 0 0 40px ${activeSession.circleGlow}33, 0 0 80px ${activeSession.circleGlow}11; }
            50% { box-shadow: 0 0 80px ${activeSession.circleGlow}55, 0 0 140px ${activeSession.circleGlow}22; }
          }
          @keyframes phaseIn {
            0% { opacity: 0; transform: translateY(6px); }
            100% { opacity: 1; transform: translateY(0); }
          }
          @keyframes countDown {
            0% { opacity: 0.4; }
            100% { opacity: 1; }
          }
        `}</style>

        {/* Ambient particles */}
        {soundMode === 'ocean' && <OceanWaves color={activeSession.circleGlow} />}
        {soundMode === 'rain' && <RainDrops />}
        {soundMode === 'forest' && <LeafParticles />}

        {/* Top bar — timer + cycle */}
        <div style={{
          position: 'absolute', top: 32, left: 0, right: 0,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '0 40px',
        }}>
          <div style={{
            font: "300 13px 'JetBrains Mono', monospace",
            color: 'rgba(255,255,255,0.45)', letterSpacing: 1,
          }}>
            {activeSession.name.toUpperCase()}
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              font: "600 24px 'Outfit', sans-serif",
              color: 'rgba(255,255,255,0.9)',
              letterSpacing: 2,
            }}>
              {fmtTime(totalSecondsRemaining)}
            </div>
            <div style={{
              font: "400 11px 'JetBrains Mono', monospace",
              color: 'rgba(255,255,255,0.35)', marginTop: 2,
            }}>
              remaining
            </div>
          </div>
          <div style={{
            font: "300 13px 'JetBrains Mono', monospace",
            color: 'rgba(255,255,255,0.45)', letterSpacing: 1,
            textAlign: 'right',
          }}>
            CYCLE {cycleCount + 1} / {totalCycles}
          </div>
        </div>

        {/* Breathing circle */}
        <div style={{
          width: 200, height: 200,
          borderRadius: '50%',
          border: `2px solid ${activeSession.circleGlow}50`,
          background: `radial-gradient(circle at center, ${activeSession.circleGlow}18 0%, transparent 70%)`,
          transform: `scale(${circleScale})`,
          transition: `transform ${circleTransitionTime}s cubic-bezier(0.45, 0, 0.55, 1)`,
          animation: 'breathePulse 4s ease-in-out infinite',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          position: 'relative',
        }}>
          {/* Inner ring */}
          <div style={{
            width: 140, height: 140, borderRadius: '50%',
            border: `1.5px solid ${activeSession.circleGlow}30`,
            background: `radial-gradient(circle, ${activeSession.circleGlow}10, transparent 80%)`,
          }} />
        </div>

        {/* Phase label + countdown */}
        <div style={{ marginTop: 48, textAlign: 'center' }}>
          <div
            key={`${currentPhaseIdx}-${cycleCount}`}
            style={{
              font: "300 32px 'Playfair Display', serif",
              color: 'rgba(255,255,255,0.92)',
              letterSpacing: 2,
              animation: 'phaseIn 0.4s cubic-bezier(0.16,1,0.3,1)',
              marginBottom: 16,
            }}
          >
            {currentPhase.label}
          </div>
          <div style={{
            font: "500 48px 'JetBrains Mono', monospace",
            color: activeSession.circleGlow,
            lineHeight: 1,
            animation: 'countDown 1s ease-in-out infinite alternate',
          }}>
            {phaseSecondsLeft}
          </div>
        </div>

        {/* Sound selector */}
        <div style={{
          position: 'absolute', bottom: 100, left: 0, right: 0,
          display: 'flex', justifyContent: 'center', gap: 8,
        }}>
          {SOUNDS.map(sound => (
            <button
              key={sound.id}
              onClick={() => setSoundMode(sound.id)}
              style={{
                padding: '7px 16px', borderRadius: 100,
                border: soundMode === sound.id
                  ? `1.5px solid ${activeSession.circleGlow}`
                  : '1.5px solid rgba(255,255,255,0.15)',
                background: soundMode === sound.id
                  ? `${activeSession.circleGlow}22`
                  : 'rgba(255,255,255,0.05)',
                color: soundMode === sound.id
                  ? activeSession.circleGlow
                  : 'rgba(255,255,255,0.4)',
                font: "400 12px 'Outfit', sans-serif",
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {sound.label}
            </button>
          ))}
        </div>

        {/* Pause / End buttons */}
        <div style={{
          position: 'absolute', bottom: 40, display: 'flex', gap: 12, alignItems: 'center',
        }}>
          <button
            onClick={togglePause}
            style={{
              padding: '12px 28px', borderRadius: 100,
              border: `1.5px solid ${activeSession.circleGlow}60`,
              background: isPaused ? `${activeSession.circleGlow}20` : 'rgba(255,255,255,0.06)',
              color: 'rgba(255,255,255,0.8)',
              font: "500 14px 'Outfit', sans-serif",
              cursor: 'pointer', transition: 'all 0.2s',
              backdropFilter: 'blur(8px)',
            }}
          >
            {isPaused ? '▶ Resume' : '⏸ Pause'}
          </button>
          <button
            onClick={endSession}
            style={{
              padding: '12px 28px', borderRadius: 100,
              border: '1.5px solid rgba(255,255,255,0.12)',
              background: 'rgba(255,255,255,0.04)',
              color: 'rgba(255,255,255,0.4)',
              font: "500 14px 'Outfit', sans-serif",
              cursor: 'pointer', transition: 'all 0.2s',
              backdropFilter: 'blur(8px)',
            }}
          >
            End Session
          </button>
        </div>
      </div>
    );
  }

  // ── Render: completed screen ─────────────────────────────────────────────
  if (completed) {
    const sess = SESSIONS.find(s => s.id === completed.session);
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: 'linear-gradient(160deg, #1A0030 0%, #060010 100%)',
        padding: '40px 24px',
      }}>
        <style>{`
          @keyframes floatUp {
            0% { opacity: 0; transform: translateY(20px); }
            100% { opacity: 1; transform: translateY(0); }
          }
        `}</style>

        <div style={{ animation: 'floatUp 0.6s cubic-bezier(0.16,1,0.3,1)', textAlign: 'center' }}>
          <Checkmark color={sess?.circleGlow || theme.accent} />

          <h2 style={{
            font: "300 36px 'Playfair Display', serif",
            color: 'rgba(255,255,255,0.95)', margin: '24px 0 8px',
          }}>
            Session Complete
          </h2>
          <p style={{
            font: "400 15px 'Outfit', sans-serif",
            color: 'rgba(255,255,255,0.45)', marginBottom: 40,
          }}>
            {sess?.name}
          </p>

          {/* Stats */}
          <div style={{
            display: 'flex', gap: 32, justifyContent: 'center', marginBottom: 48,
          }}>
            {[
              { label: 'Breaths', value: completed.totalBreaths || completed.cycleCount },
              { label: 'Duration', value: `${sess?.duration}m` },
              { label: 'Pattern', value: PATTERNS[sess?.pattern]?.name || '' },
            ].map(stat => (
              <div key={stat.label} style={{ textAlign: 'center' }}>
                <div style={{
                  font: "600 28px 'Outfit', sans-serif",
                  color: sess?.circleGlow || theme.accent,
                }}>
                  {stat.value}
                </div>
                <div style={{
                  font: "400 12px 'JetBrains Mono', monospace",
                  color: 'rgba(255,255,255,0.35)', marginTop: 4, letterSpacing: 1,
                  textTransform: 'uppercase',
                }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>

          {/* Rating */}
          <div style={{ marginBottom: 40 }}>
            <div style={{
              font: "400 14px 'Outfit', sans-serif",
              color: 'rgba(255,255,255,0.6)', marginBottom: 16,
            }}>
              How do you feel?
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              {EMOJI_RATINGS.map((emoji, i) => (
                <button
                  key={i}
                  onClick={() => setRating(i + 1)}
                  style={{
                    fontSize: 32, background: 'none', border: 'none', cursor: 'pointer',
                    transform: rating === i + 1 ? 'scale(1.3)' : 'scale(1)',
                    transition: 'transform 0.2s cubic-bezier(0.16,1,0.3,1)',
                    opacity: rating && rating !== i + 1 ? 0.4 : 1,
                    padding: 4,
                  }}
                  title={`${i + 1} / 5`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* CTAs */}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => saveAndReset(rating)}
              style={{
                padding: '13px 32px', borderRadius: 100,
                background: sess?.gradient,
                border: 'none', color: '#fff',
                font: "500 14px 'Outfit', sans-serif",
                cursor: 'pointer', transition: 'all 0.2s',
                boxShadow: `0 4px 20px ${sess?.circleGlow}40`,
              }}
            >
              Save & Return
            </button>
            <button
              onClick={() => navigate('/admin/book')}
              style={{
                padding: '13px 32px', borderRadius: 100,
                border: '1.5px solid rgba(255,255,255,0.2)',
                background: 'transparent', color: 'rgba(255,255,255,0.7)',
                font: "500 14px 'Outfit', sans-serif",
                cursor: 'pointer', transition: 'all 0.2s',
              }}
            >
              Book a Class →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Render: main page ────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: 960, margin: '0 auto' }}>
      <style>{`
        @keyframes ambientFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        @keyframes subtlePulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
        .session-card:hover { transform: translateY(-3px); box-shadow: 0 16px 48px rgba(0,0,0,0.12); }
        .session-card { transition: transform 0.3s cubic-bezier(0.16,1,0.3,1), box-shadow 0.3s; }
        .history-row:hover { background: rgba(0,0,0,0.02); }
        .history-row { transition: background 0.15s; }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: 36 }}>
        <div style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.5,
          color: s.text3, marginBottom: 8,
        }}>
          Mindfulness
        </div>
        <h1 style={{
          font: "300 34px 'Playfair Display', serif",
          color: s.text, margin: 0, marginBottom: 8,
        }}>
          Breathwork & Mindfulness
        </h1>
        <p style={{
          font: "400 15px 'Outfit', sans-serif",
          color: s.text2, margin: 0,
        }}>
          Guided breathing sessions to energize, center, and restore.
        </p>
      </div>

      {/* Session picker ─────────────────────────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
        gap: 16, marginBottom: 48,
      }}>
        {SESSIONS.map(sess => (
          <div
            key={sess.id}
            className="session-card"
            style={{
              borderRadius: 18, overflow: 'hidden',
              boxShadow: s.shadow,
              background: 'rgba(255,255,255,0.72)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.6)',
            }}
          >
            {/* Gradient banner */}
            <div style={{
              height: 80,
              background: sess.gradient,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 32,
              position: 'relative',
            }}>
              <span style={{ animation: 'ambientFloat 4s ease-in-out infinite' }}>{sess.emoji}</span>
              {/* Duration pill */}
              <div style={{
                position: 'absolute', top: 10, right: 10,
                background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(8px)',
                borderRadius: 100, padding: '4px 10px',
                font: "500 11px 'JetBrains Mono', monospace",
                color: 'rgba(255,255,255,0.9)', letterSpacing: 0.5,
              }}>
                {sess.duration} min
              </div>
            </div>

            <div style={{ padding: '18px 18px 20px' }}>
              <div style={{
                font: "600 15px 'Outfit', sans-serif",
                color: s.text, marginBottom: 4,
              }}>
                {sess.name}
              </div>
              <div style={{
                font: "400 11px 'JetBrains Mono', monospace",
                color: s.text3, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.8,
              }}>
                {PATTERNS[sess.pattern]?.name}
              </div>
              <p style={{
                font: "400 13px 'Outfit', sans-serif",
                color: s.text2, margin: '0 0 16px',
                lineHeight: 1.55,
              }}>
                {sess.description}
              </p>
              <button
                onClick={() => startSession(sess.id)}
                style={{
                  width: '100%', padding: '10px 0', borderRadius: 100,
                  background: sess.gradient, border: 'none',
                  color: '#fff', font: "500 13px 'Outfit', sans-serif",
                  cursor: 'pointer', transition: 'all 0.2s',
                  boxShadow: `0 2px 12px ${sess.circleGlow}33`,
                  letterSpacing: 0.3,
                }}
              >
                Start Session
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Sound mode selector (ambient preview) ──────────────────────────── */}
      <div style={{
        ...s.cardStyle, padding: '20px 24px', marginBottom: 40,
        display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
      }}>
        <div style={{
          font: "500 12px 'JetBrains Mono', monospace",
          color: s.text3, textTransform: 'uppercase', letterSpacing: 1.2,
          marginRight: 4, flexShrink: 0,
        }}>
          Ambient
        </div>
        {SOUNDS.map(sound => (
          <button
            key={sound.id}
            onClick={() => setSoundMode(sound.id)}
            style={{
              padding: '8px 18px', borderRadius: 100,
              border: soundMode === sound.id
                ? `1.5px solid ${theme.accent}`
                : '1.5px solid rgba(0,0,0,0.08)',
              background: soundMode === sound.id
                ? `${theme.accent}12`
                : 'rgba(255,255,255,0.5)',
              color: soundMode === sound.id ? theme.accent : s.text2,
              font: "400 13px 'Outfit', sans-serif",
              cursor: 'pointer', transition: 'all 0.2s',
              backdropFilter: 'blur(8px)',
            }}
          >
            {sound.label}
          </button>
        ))}

        {/* Ambient demo indicator */}
        {soundMode === 'ocean' && (
          <div style={{ display: 'flex', gap: 4, alignItems: 'center', marginLeft: 'auto' }}>
            {[0, 1, 2, 3].map(i => (
              <div key={i} style={{
                width: 3 + i, height: 12 + i * 4,
                borderRadius: 2,
                background: `rgba(116,185,255,${0.3 + i * 0.15})`,
                animation: `subtlePulse ${1 + i * 0.3}s ${i * 0.2}s ease-in-out infinite`,
              }} />
            ))}
          </div>
        )}
        {soundMode === 'rain' && (
          <div style={{ display: 'flex', gap: 3, alignItems: 'flex-end', marginLeft: 'auto', height: 20 }}>
            {Array.from({ length: 8 }, (_, i) => (
              <div key={i} style={{
                width: 1.5,
                height: 8 + (i % 3) * 4,
                background: `rgba(116,185,255,${0.25 + (i % 3) * 0.1})`,
                borderRadius: 1,
                animation: `subtlePulse ${0.6 + (i * 0.1) % 0.6}s ${(i * 0.08) % 0.5}s linear infinite`,
              }} />
            ))}
          </div>
        )}
        {soundMode === 'forest' && (
          <div style={{ display: 'flex', gap: 5, alignItems: 'center', marginLeft: 'auto' }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{
                width: 10, height: 10,
                borderRadius: '50% 10% 50% 10%',
                background: `rgba(85,230,193,${0.25 + i * 0.1})`,
                transform: `rotate(${i * 40}deg)`,
                animation: `subtlePulse ${1.5 + i * 0.5}s ${i * 0.4}s ease-in-out infinite`,
              }} />
            ))}
          </div>
        )}
      </div>

      {/* Session history ─────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 48 }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
          marginBottom: 20,
        }}>
          <div>
            <div style={{
              font: "500 10px 'JetBrains Mono', monospace",
              textTransform: 'uppercase', letterSpacing: 1.5,
              color: s.text3, marginBottom: 6,
            }}>
              Your Practice
            </div>
            <h2 style={{
              font: "500 20px 'Outfit', sans-serif",
              color: s.text, margin: 0,
            }}>
              Session History
            </h2>
          </div>

          {/* Summary stats */}
          <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
            {[
              { label: 'This Week', value: weekSessions.length },
              { label: 'This Month', value: monthSessions.length },
              { label: 'Mindful Mins', value: totalMindfulMinutes },
            ].map(stat => (
              <div key={stat.label} style={{ textAlign: 'center' }}>
                <div style={{
                  font: "600 22px 'Outfit', sans-serif",
                  color: theme.accent,
                }}>
                  {stat.value}
                </div>
                <div style={{
                  font: "400 10px 'JetBrains Mono', monospace",
                  color: s.text3, textTransform: 'uppercase', letterSpacing: 0.8,
                }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {last7.length === 0 ? (
          <div style={{
            ...s.cardStyle, padding: '40px 24px',
            textAlign: 'center',
            color: s.text3,
            font: "400 14px 'Outfit', sans-serif",
          }}>
            No sessions yet — start your first breathing practice above.
          </div>
        ) : (
          <div style={{
            ...s.tableWrap,
          }}>
            {/* Table header */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1.4fr 1.2fr 80px 80px',
              gap: 12, padding: '12px 20px',
              borderBottom: '1px solid rgba(0,0,0,0.04)',
              font: "500 10px 'JetBrains Mono', monospace",
              color: s.text3, textTransform: 'uppercase', letterSpacing: 1.2,
            }}>
              <span>Date</span>
              <span>Session</span>
              <span>Pattern</span>
              <span style={{ textAlign: 'center' }}>Duration</span>
              <span style={{ textAlign: 'center' }}>Feeling</span>
            </div>

            {last7.map(entry => {
              const entryDate = new Date(entry.date);
              const sess = SESSIONS.find(s => s.id === entry.sessionId);
              return (
                <div
                  key={entry.id}
                  className="history-row"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1.4fr 1.2fr 80px 80px',
                    gap: 12, padding: '14px 20px',
                    borderBottom: '1px solid rgba(0,0,0,0.03)',
                    alignItems: 'center',
                  }}
                >
                  <div style={{ font: "400 13px 'Outfit', sans-serif", color: s.text2 }}>
                    {entryDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    <span style={{
                      display: 'block', font: "400 11px 'JetBrains Mono', monospace",
                      color: s.text3,
                    }}>
                      {entryDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 16 }}>{sess?.emoji || '🫁'}</span>
                    <span style={{ font: "500 13px 'Outfit', sans-serif", color: s.text }}>
                      {entry.sessionName}
                    </span>
                  </div>
                  <div style={{
                    font: "400 12px 'JetBrains Mono', monospace",
                    color: s.text3,
                  }}>
                    {entry.pattern}
                  </div>
                  <div style={{
                    textAlign: 'center',
                    font: "500 13px 'Outfit', sans-serif",
                    color: theme.accent,
                  }}>
                    {entry.duration}m
                  </div>
                  <div style={{ textAlign: 'center', fontSize: 20 }}>
                    {entry.rating ? EMOJI_RATINGS[entry.rating - 1] : '—'}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Breathing patterns reference ───────────────────────────────────── */}
      <div style={{ marginBottom: 40 }}>
        <div style={{
          font: "500 10px 'JetBrains Mono', monospace",
          textTransform: 'uppercase', letterSpacing: 1.5,
          color: s.text3, marginBottom: 12,
        }}>
          Pattern Reference
        </div>
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: 12,
        }}>
          {Object.entries(PATTERNS).map(([key, pat]) => {
            const phases = pat.phases;
            const cycleTime = totalCycleSeconds(phases);
            return (
              <div
                key={key}
                style={{
                  ...s.cardStyle, padding: '16px 18px',
                }}
              >
                <div style={{
                  font: "600 13px 'Outfit', sans-serif",
                  color: s.text, marginBottom: 8,
                }}>
                  {pat.name}
                </div>
                <div style={{ display: 'flex', gap: 4, marginBottom: 10, flexWrap: 'wrap' }}>
                  {phases.map((phase, i) => (
                    <div key={i} style={{
                      padding: '3px 9px', borderRadius: 100,
                      background: phase.type === 'inhale'
                        ? `${theme.accent}18`
                        : phase.type === 'hold'
                          ? 'rgba(0,0,0,0.04)'
                          : 'rgba(0,0,0,0.06)',
                      font: "500 11px 'JetBrains Mono', monospace",
                      color: phase.type === 'inhale' ? theme.accent : s.text3,
                    }}>
                      {phase.duration}s {phase.type === 'inhale' ? '↑' : phase.type === 'exhale' ? '↓' : '—'}
                    </div>
                  ))}
                </div>
                <div style={{
                  font: "400 11px 'JetBrains Mono', monospace",
                  color: s.text3,
                }}>
                  {cycleTime}s per cycle
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
