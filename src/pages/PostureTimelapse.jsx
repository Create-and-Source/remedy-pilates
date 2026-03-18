import { useState, useMemo, useRef, useEffect } from 'react';
import { useStyles } from '../theme';
import { getPatients, getAssessments, getAppointments } from '../data/store';

// ── Posture Progress Time-lapse ──
// Stores skeletal landmark data over time and generates a visual "transformation reel"
// showing alignment improvement month over month.

const LM = {
  NOSE: 0, L_EAR: 7, R_EAR: 8,
  L_SHOULDER: 11, R_SHOULDER: 12, L_ELBOW: 13, R_ELBOW: 14,
  L_WRIST: 15, R_WRIST: 16, L_HIP: 23, R_HIP: 24,
  L_KNEE: 25, R_KNEE: 26, L_ANKLE: 27, R_ANKLE: 28,
};

const CONNECTIONS = [
  [LM.L_EAR, LM.NOSE], [LM.R_EAR, LM.NOSE],
  [LM.L_SHOULDER, LM.R_SHOULDER], [LM.L_SHOULDER, LM.L_ELBOW], [LM.R_SHOULDER, LM.R_ELBOW],
  [LM.L_ELBOW, LM.L_WRIST], [LM.R_ELBOW, LM.R_WRIST],
  [LM.L_SHOULDER, LM.L_HIP], [LM.R_SHOULDER, LM.R_HIP], [LM.L_HIP, LM.R_HIP],
  [LM.L_HIP, LM.L_KNEE], [LM.R_HIP, LM.R_KNEE],
  [LM.L_KNEE, LM.L_ANKLE], [LM.R_KNEE, LM.R_ANKLE],
];

const METRIC_LABELS = {
  headAlignment: 'Head Alignment',
  shoulderBalance: 'Shoulder Balance',
  spinalCurve: 'Spinal Alignment',
  hipLevel: 'Hip Level',
  pelvicTilt: 'Pelvic Position',
  kneeTracking: 'Knee Tracking',
};

// Generate synthetic assessment history for demo clients
function generateDemoAssessments(client) {
  const seed = (client.id || '').split('').reduce((s, c) => s + c.charCodeAt(0), 0);
  const r = (min, max, off = 0) => min + ((seed + off) % (max - min + 1));
  const months = 6;
  const assessments = [];

  for (let m = months - 1; m >= 0; m--) {
    const date = new Date();
    date.setMonth(date.getMonth() - m);
    date.setDate(15);

    // Scores improve over time (higher = better, 0-100)
    const improvement = ((months - 1 - m) / (months - 1)) * 25; // up to 25pt improvement
    const base = r(45, 65, m);

    const metrics = {
      headAlignment: Math.min(100, Math.round(base + improvement + r(0, 8, m * 2))),
      shoulderBalance: Math.min(100, Math.round(base + 5 + improvement + r(0, 6, m * 3))),
      spinalCurve: Math.min(100, Math.round(base - 3 + improvement + r(0, 10, m * 4))),
      hipLevel: Math.min(100, Math.round(base + 8 + improvement + r(0, 5, m * 5))),
      pelvicTilt: Math.min(100, Math.round(base - 5 + improvement + r(0, 12, m * 6))),
      kneeTracking: Math.min(100, Math.round(base + 3 + improvement + r(0, 7, m * 7))),
    };

    const overall = Math.round(Object.values(metrics).reduce((s, v) => s + v, 0) / 6);

    // Generate normalized landmark positions (0-1 range) that show improvement
    const headTilt = 0.02 - (improvement / 25) * 0.015; // head becomes more centered
    const shoulderDrop = 0.03 - (improvement / 25) * 0.025;
    const hipShift = 0.02 - (improvement / 25) * 0.015;

    const landmarks = [
      /* 0 NOSE */     { x: 0.50 + headTilt, y: 0.12, z: 0 },
      /* 1 */ { x: 0, y: 0, z: 0 }, /* 2 */ { x: 0, y: 0, z: 0 },
      /* 3 */ { x: 0, y: 0, z: 0 }, /* 4 */ { x: 0, y: 0, z: 0 },
      /* 5 */ { x: 0, y: 0, z: 0 }, /* 6 */ { x: 0, y: 0, z: 0 },
      /* 7 L_EAR */    { x: 0.44 + headTilt, y: 0.11, z: 0 },
      /* 8 R_EAR */    { x: 0.56 + headTilt, y: 0.11, z: 0 },
      /* 9 */ { x: 0, y: 0, z: 0 }, /* 10 */ { x: 0, y: 0, z: 0 },
      /* 11 L_SHOULDER */ { x: 0.38, y: 0.22 + shoulderDrop, z: 0 },
      /* 12 R_SHOULDER */ { x: 0.62, y: 0.22, z: 0 },
      /* 13 L_ELBOW */   { x: 0.34, y: 0.38, z: 0 },
      /* 14 R_ELBOW */   { x: 0.66, y: 0.38, z: 0 },
      /* 15 L_WRIST */   { x: 0.36, y: 0.52, z: 0 },
      /* 16 R_WRIST */   { x: 0.64, y: 0.52, z: 0 },
      /* 17-22 */ ...Array(6).fill({ x: 0, y: 0, z: 0 }),
      /* 23 L_HIP */     { x: 0.44 + hipShift, y: 0.52, z: 0 },
      /* 24 R_HIP */     { x: 0.56, y: 0.52, z: 0 },
      /* 25 L_KNEE */    { x: 0.44, y: 0.72, z: 0 },
      /* 26 R_KNEE */    { x: 0.56, y: 0.72, z: 0 },
      /* 27 L_ANKLE */   { x: 0.44, y: 0.92, z: 0 },
      /* 28 R_ANKLE */   { x: 0.56, y: 0.92, z: 0 },
    ];

    assessments.push({
      id: `PA-demo-${client.id}-${m}`,
      patientId: client.id,
      date: date.toISOString(),
      metrics,
      overall,
      landmarks,
    });
  }
  return assessments;
}

function SkeletonSVG({ landmarks, color, opacity = 1, width = 200, height = 300 }) {
  if (!landmarks || landmarks.length < 29) return null;
  return (
    <svg width={width} height={height} style={{ display: 'block' }}>
      {CONNECTIONS.map(([a, b], i) => {
        const la = landmarks[a], lb = landmarks[b];
        if (!la || !lb || (la.x === 0 && la.y === 0) || (lb.x === 0 && lb.y === 0)) return null;
        return (
          <line key={i}
            x1={la.x * width} y1={la.y * height}
            x2={lb.x * width} y2={lb.y * height}
            stroke={color} strokeWidth={2.5} strokeLinecap="round" opacity={opacity}
          />
        );
      })}
      {[LM.NOSE, LM.L_SHOULDER, LM.R_SHOULDER, LM.L_HIP, LM.R_HIP, LM.L_KNEE, LM.R_KNEE, LM.L_ANKLE, LM.R_ANKLE].map(idx => {
        const l = landmarks[idx];
        if (!l || (l.x === 0 && l.y === 0)) return null;
        return <circle key={idx} cx={l.x * width} cy={l.y * height} r={4} fill={color} opacity={opacity} />;
      })}
    </svg>
  );
}

function ScoreRing({ score, size = 64, color }) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - score / 100);
  return (
    <svg width={size} height={size}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="6" />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="6"
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        transform={`rotate(-90 ${size/2} ${size/2})`}
        style={{ transition: 'stroke-dashoffset 0.8s ease' }} />
      <text x={size/2} y={size/2 + 5} textAnchor="middle" style={{ fontSize: 16, fontWeight: 700, fill: color }}>{score}</text>
    </svg>
  );
}

export default function PostureTimelapse() {
  const s = useStyles();
  const [selectedClientId, setSelectedClientId] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [frameIdx, setFrameIdx] = useState(0);
  const [showOverlay, setShowOverlay] = useState(true);
  const intervalRef = useRef(null);

  const { clients, assessmentsByClient } = useMemo(() => {
    const patients = getPatients().slice(0, 12);
    const realAssessments = getAssessments();
    const appointments = getAppointments();

    const byClient = {};
    patients.forEach(p => {
      const clientReal = realAssessments.filter(a => a.patientId === p.id);
      // Use real assessments if 2+, otherwise generate demo data
      byClient[p.id] = clientReal.length >= 2 ? clientReal : generateDemoAssessments(p);
    });

    // Only show clients with assessment data
    const enriched = patients.filter(p => byClient[p.id]?.length >= 2).map(p => {
      const assessments = byClient[p.id];
      const first = assessments[0];
      const latest = assessments[assessments.length - 1];
      const totalImprovement = latest.overall - first.overall;
      const classCount = appointments.filter(a => a.patientId === p.id && a.status === 'completed').length;
      return { ...p, assessments, firstScore: first.overall, latestScore: latest.overall, totalImprovement, classCount };
    });

    return { clients: enriched, assessmentsByClient: byClient };
  }, []);

  const selected = clients.find(c => c.id === selectedClientId);
  const timeline = selected ? assessmentsByClient[selected.id] || [] : [];

  // Playback animation
  useEffect(() => {
    if (playing && timeline.length > 1) {
      intervalRef.current = setInterval(() => {
        setFrameIdx(prev => {
          if (prev >= timeline.length - 1) { setPlaying(false); return prev; }
          return prev + 1;
        });
      }, 1200);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [playing, timeline.length]);

  const startPlayback = () => { setFrameIdx(0); setPlaying(true); };
  const scoreColor = (v) => v >= 80 ? '#16A34A' : v >= 60 ? '#D97706' : '#DC2626';

  const cardStyle = {
    background: 'rgba(255,255,255,0.72)', backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255,255,255,0.6)', borderRadius: 16, boxShadow: s.shadow,
  };

  return (
    <div style={{ animation: 'fadeIn 0.5s ease' }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ font: `400 11px ${s.MONO}`, textTransform: 'uppercase', letterSpacing: 1.5, color: s.text3, marginBottom: 4 }}>
          Body Intelligence
        </div>
        <h1 style={{ font: `600 28px ${s.DISPLAY}`, color: s.text, margin: 0 }}>
          Posture Time-lapse
        </h1>
        <p style={{ font: `400 14px ${s.FONT}`, color: s.text2, margin: '6px 0 0' }}>
          Skeletal alignment transformation reels — watch posture improve month over month
        </p>
      </div>

      {/* Client selector */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
        {clients.map(c => (
          <button key={c.id} onClick={() => { setSelectedClientId(c.id); setFrameIdx(0); setPlaying(false); }} style={{
            ...cardStyle, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10,
            cursor: 'pointer', border: selectedClientId === c.id ? `2px solid ${s.accent}` : cardStyle.border,
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: scoreColor(c.latestScore) + '20', color: scoreColor(c.latestScore),
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              font: `600 11px ${s.FONT}`, flexShrink: 0,
            }}>{c.firstName?.[0]}{c.lastName?.[0]}</div>
            <div>
              <div style={{ font: `500 12px ${s.FONT}`, color: s.text }}>{c.firstName} {c.lastName?.[0]}.</div>
              <div style={{ font: `400 10px ${s.MONO}`, color: c.totalImprovement > 0 ? '#16A34A' : s.text3 }}>
                {c.totalImprovement > 0 ? '+' : ''}{c.totalImprovement} pts
              </div>
            </div>
          </button>
        ))}
      </div>

      {!selected ? (
        <div style={{ ...cardStyle, padding: 60, textAlign: 'center' }}>
          <div style={{ font: `400 14px ${s.FONT}`, color: s.text3 }}>Select a client to view their posture transformation</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {/* Left — Time-lapse viewer */}
          <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
            {/* Viewer header */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(0,0,0,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ font: `500 15px ${s.FONT}`, color: s.text }}>{selected.firstName}'s Transformation</div>
                <div style={{ font: `400 11px ${s.MONO}`, color: s.text3 }}>{timeline.length} assessments · {selected.classCount} classes</div>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, font: `400 11px ${s.FONT}`, color: s.text3, cursor: 'pointer' }}>
                <input type="checkbox" checked={showOverlay} onChange={e => setShowOverlay(e.target.checked)} />
                Overlay first
              </label>
            </div>

            {/* Skeleton viewer */}
            <div style={{ position: 'relative', background: '#0a0a14', padding: '30px 0', display: 'flex', justifyContent: 'center', minHeight: 340 }}>
              {/* Ghost of first assessment */}
              {showOverlay && frameIdx > 0 && (
                <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', top: 30 }}>
                  <SkeletonSVG landmarks={timeline[0].landmarks} color="#DC2626" opacity={0.25} width={200} height={300} />
                </div>
              )}
              {/* Current frame */}
              <SkeletonSVG landmarks={timeline[frameIdx]?.landmarks} color={s.accent} width={200} height={300} />

              {/* Date + score overlay */}
              <div style={{ position: 'absolute', bottom: 16, left: 20, right: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                  <div style={{ font: `400 10px ${s.MONO}`, color: '#666' }}>
                    {new Date(timeline[frameIdx]?.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                  </div>
                  <div style={{ font: `600 20px ${s.FONT}`, color: '#fff' }}>
                    {timeline[frameIdx]?.overall}<span style={{ font: `400 12px ${s.FONT}`, color: '#888' }}>/100</span>
                  </div>
                </div>
                {frameIdx > 0 && (
                  <div style={{
                    padding: '4px 10px', borderRadius: 8,
                    background: (timeline[frameIdx]?.overall - timeline[0]?.overall) > 0 ? 'rgba(22,163,74,0.2)' : 'rgba(220,38,38,0.2)',
                    font: `600 13px ${s.MONO}`,
                    color: (timeline[frameIdx]?.overall - timeline[0]?.overall) > 0 ? '#4ADE80' : '#F87171',
                  }}>
                    {(timeline[frameIdx]?.overall - timeline[0]?.overall) > 0 ? '+' : ''}{timeline[frameIdx]?.overall - timeline[0]?.overall}
                  </div>
                )}
              </div>

              {/* Alignment guide lines */}
              <svg width="200" height="300" style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', top: 30, pointerEvents: 'none' }}>
                {/* Center vertical line */}
                <line x1="100" y1="0" x2="100" y2="300" stroke="rgba(255,255,255,0.08)" strokeWidth="1" strokeDasharray="4 4" />
                {/* Shoulder line */}
                <line x1="50" y1="66" x2="150" y2="66" stroke="rgba(255,255,255,0.06)" strokeWidth="1" strokeDasharray="4 4" />
                {/* Hip line */}
                <line x1="60" y1="156" x2="140" y2="156" stroke="rgba(255,255,255,0.06)" strokeWidth="1" strokeDasharray="4 4" />
              </svg>
            </div>

            {/* Timeline scrubber */}
            <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
                {timeline.map((a, i) => (
                  <button key={a.id} onClick={() => { setFrameIdx(i); setPlaying(false); }} style={{
                    flex: 1, height: 6, borderRadius: 3, border: 'none', cursor: 'pointer',
                    background: i <= frameIdx ? s.accent : 'rgba(0,0,0,0.08)',
                    transition: 'background 0.3s',
                  }} />
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                <button onClick={() => { setFrameIdx(0); setPlaying(false); }} style={{
                  padding: '8px 14px', borderRadius: 8, border: '1px solid rgba(0,0,0,0.08)',
                  background: 'rgba(255,255,255,0.6)', font: `400 12px ${s.FONT}`, color: s.text2, cursor: 'pointer',
                }}>Reset</button>
                <button onClick={playing ? () => setPlaying(false) : startPlayback} style={{
                  padding: '8px 20px', borderRadius: 8, border: 'none',
                  background: s.accent, color: '#fff', font: `500 12px ${s.FONT}`, cursor: 'pointer',
                }}>{playing ? 'Pause' : 'Play Time-lapse'}</button>
                <button onClick={() => setFrameIdx(Math.min(timeline.length - 1, frameIdx + 1))} style={{
                  padding: '8px 14px', borderRadius: 8, border: '1px solid rgba(0,0,0,0.08)',
                  background: 'rgba(255,255,255,0.6)', font: `400 12px ${s.FONT}`, color: s.text2, cursor: 'pointer',
                }}>Next</button>
              </div>
            </div>
          </div>

          {/* Right — Metrics & improvement */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Score comparison */}
            <div style={{ ...cardStyle, padding: 20, display: 'flex', gap: 20, alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ font: `400 10px ${s.MONO}`, color: s.text3, marginBottom: 6, textTransform: 'uppercase' }}>First</div>
                <ScoreRing score={selected.firstScore} color={scoreColor(selected.firstScore)} />
              </div>
              <div style={{ font: `400 24px ${s.FONT}`, color: '#16A34A' }}>→</div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ font: `400 10px ${s.MONO}`, color: s.text3, marginBottom: 6, textTransform: 'uppercase' }}>Latest</div>
                <ScoreRing score={selected.latestScore} color={scoreColor(selected.latestScore)} />
              </div>
              <div style={{
                padding: '8px 16px', borderRadius: 10,
                background: selected.totalImprovement > 0 ? 'rgba(22,163,74,0.1)' : 'rgba(220,38,38,0.1)',
                font: `700 20px ${s.FONT}`,
                color: selected.totalImprovement > 0 ? '#16A34A' : '#DC2626',
              }}>
                {selected.totalImprovement > 0 ? '+' : ''}{selected.totalImprovement}
              </div>
            </div>

            {/* Per-metric trend */}
            <div style={{ ...cardStyle, padding: 20 }}>
              <div style={{ font: `600 12px ${s.MONO}`, color: s.text3, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14 }}>
                Metric Trends
              </div>
              {Object.entries(METRIC_LABELS).map(([key, label]) => {
                const first = timeline[0]?.metrics?.[key] || 0;
                const current = timeline[frameIdx]?.metrics?.[key] || 0;
                const delta = current - first;
                return (
                  <div key={key} style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ font: `400 12px ${s.FONT}`, color: s.text2 }}>{label}</span>
                      <span style={{ font: `600 12px ${s.MONO}`, color: delta > 0 ? '#16A34A' : delta < 0 ? '#DC2626' : s.text3 }}>
                        {current} {delta !== 0 && `(${delta > 0 ? '+' : ''}${delta})`}
                      </span>
                    </div>
                    <div style={{ height: 6, background: 'rgba(0,0,0,0.06)', borderRadius: 3, overflow: 'hidden', position: 'relative' }}>
                      {/* First assessment (ghost) */}
                      <div style={{
                        position: 'absolute', top: 0, left: 0, height: '100%',
                        width: `${first}%`, background: 'rgba(220,38,38,0.15)', borderRadius: 3,
                      }} />
                      {/* Current */}
                      <div style={{
                        position: 'relative', height: '100%',
                        width: `${current}%`, background: scoreColor(current), borderRadius: 3,
                        transition: 'width 0.5s ease',
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Assessment history */}
            <div style={{ ...cardStyle, padding: 20 }}>
              <div style={{ font: `600 12px ${s.MONO}`, color: s.text3, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14 }}>
                Score Over Time
              </div>
              <svg width="100%" height="100" viewBox="0 0 300 100" preserveAspectRatio="none">
                {/* Grid lines */}
                {[25, 50, 75].map(y => (
                  <line key={y} x1="0" y1={100 - y} x2="300" y2={100 - y} stroke="rgba(0,0,0,0.05)" strokeWidth="1" />
                ))}
                {/* Area fill */}
                <path
                  d={`M 0 ${100 - timeline[0]?.overall} ${timeline.map((a, i) => `L ${(i / (timeline.length - 1)) * 300} ${100 - a.overall}`).join(' ')} L 300 100 L 0 100 Z`}
                  fill={s.accent + '15'}
                />
                {/* Line */}
                <polyline
                  points={timeline.map((a, i) => `${(i / (timeline.length - 1)) * 300},${100 - a.overall}`).join(' ')}
                  fill="none" stroke={s.accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                />
                {/* Dots */}
                {timeline.map((a, i) => (
                  <circle key={i}
                    cx={(i / (timeline.length - 1)) * 300} cy={100 - a.overall} r={frameIdx === i ? 6 : 4}
                    fill={frameIdx === i ? s.accent : '#fff'} stroke={s.accent} strokeWidth="2"
                    style={{ transition: 'all 0.3s', cursor: 'pointer' }}
                    onClick={() => { setFrameIdx(i); setPlaying(false); }}
                  />
                ))}
              </svg>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                {timeline.map((a, i) => (
                  <span key={i} style={{ font: `400 9px ${s.MONO}`, color: frameIdx === i ? s.accent : s.text3 }}>
                    {new Date(a.date).toLocaleDateString('en-US', { month: 'short' })}
                  </span>
                ))}
              </div>
            </div>

            {/* Share / Export */}
            <div style={{ ...cardStyle, padding: 16, display: 'flex', gap: 8 }}>
              <button onClick={() => alert('In production, this would generate a shareable video/GIF of the transformation reel.')} style={{
                flex: 1, padding: '10px', borderRadius: 10, border: 'none',
                background: s.accent, color: '#fff', font: `500 12px ${s.FONT}`, cursor: 'pointer',
              }}>Export Transformation Reel</button>
              <button onClick={() => window.print()} style={{
                flex: 1, padding: '10px', borderRadius: 10, border: '1px solid rgba(0,0,0,0.08)',
                background: 'rgba(255,255,255,0.6)', font: `500 12px ${s.FONT}`, color: s.text, cursor: 'pointer',
              }}>Print Report</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          div[style*="gridTemplateColumns: '1fr 1fr'"] { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
