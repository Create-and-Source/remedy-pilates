// FatigueTracker — Muscle fatigue monitoring + recovery recommendations
// Tracks which muscle groups each class targets, warns on overload, suggests recovery
import { useState, useMemo } from 'react';
import { useStyles, useTheme } from '../theme';
import { getBookings, addBooking, deleteBooking } from '../data/store';

// ── Muscle groups ──
const MUSCLE_GROUPS = [
  { id: 'core', label: 'Core', region: 'torso', recoveryHrs: { low: 12, medium: 24, high: 48 } },
  { id: 'glutes', label: 'Glutes', region: 'lower', recoveryHrs: { low: 12, medium: 24, high: 48 } },
  { id: 'quads', label: 'Quads', region: 'lower', recoveryHrs: { low: 12, medium: 24, high: 48 } },
  { id: 'hamstrings', label: 'Hamstrings', region: 'lower', recoveryHrs: { low: 12, medium: 36, high: 48 } },
  { id: 'calves', label: 'Calves', region: 'lower', recoveryHrs: { low: 8, medium: 18, high: 36 } },
  { id: 'hip-flexors', label: 'Hip Flexors', region: 'lower', recoveryHrs: { low: 12, medium: 24, high: 48 } },
  { id: 'back', label: 'Back', region: 'torso', recoveryHrs: { low: 12, medium: 24, high: 48 } },
  { id: 'shoulders', label: 'Shoulders', region: 'upper', recoveryHrs: { low: 12, medium: 24, high: 48 } },
  { id: 'arms', label: 'Arms', region: 'upper', recoveryHrs: { low: 8, medium: 18, high: 36 } },
  { id: 'chest', label: 'Chest', region: 'upper', recoveryHrs: { low: 12, medium: 24, high: 48 } },
];

// ── Class types with muscle targets ──
const CLASS_TYPES = [
  { id: 'reformer-foundations', name: 'Reformer Foundations', intensity: 'low', muscles: { core: 0.7, glutes: 0.6, quads: 0.5, back: 0.3 }, duration: 50, color: '#60A5FA' },
  { id: 'reformer-power', name: 'Reformer Power', intensity: 'high', muscles: { core: 0.9, glutes: 0.8, quads: 0.8, hamstrings: 0.6, shoulders: 0.5 }, duration: 50, color: '#EF4444' },
  { id: 'mat-pilates', name: 'Mat Pilates', intensity: 'medium', muscles: { core: 0.9, back: 0.6, 'hip-flexors': 0.5, shoulders: 0.3 }, duration: 55, color: '#A78BFA' },
  { id: 'barre-sculpt', name: 'Barre Sculpt', intensity: 'medium', muscles: { glutes: 0.8, calves: 0.7, quads: 0.6, arms: 0.5 }, duration: 50, color: '#F472B6' },
  { id: 'stretch-release', name: 'Stretch & Release', intensity: 'recovery', muscles: {}, duration: 45, color: '#34D399' },
  { id: 'reformer-barre', name: 'Reformer + Barre Fusion', intensity: 'high', muscles: { core: 0.7, glutes: 0.8, quads: 0.7, calves: 0.6, arms: 0.6 }, duration: 55, color: '#FBBF24' },
  { id: 'tower', name: 'Tower / Cadillac', intensity: 'medium', muscles: { core: 0.6, back: 0.7, shoulders: 0.6, hamstrings: 0.5 }, duration: 50, color: '#818CF8' },
  { id: 'prenatal', name: 'Prenatal Pilates', intensity: 'low', muscles: { core: 0.4, back: 0.3, glutes: 0.4 }, duration: 45, color: '#FB923C' },
];

// ── Default demo bookings (last 7 days) ──
function getDefaultBookings() {
  const now = new Date();
  const d = (daysAgo, hours = 10) => {
    const dt = new Date(now);
    dt.setDate(dt.getDate() - daysAgo);
    dt.setHours(hours, 0, 0, 0);
    return dt.toISOString();
  };
  return [
    { id: 'BK-demo-1', clientName: 'Sarah Martinez', classType: 'reformer-power', date: d(0, 9), instructor: 'Alex' },
    { id: 'BK-demo-2', clientName: 'Sarah Martinez', classType: 'barre-sculpt', date: d(1, 10), instructor: 'Sam' },
    { id: 'BK-demo-3', clientName: 'Sarah Martinez', classType: 'reformer-foundations', date: d(2, 9), instructor: 'Alex' },
    { id: 'BK-demo-4', clientName: 'Sarah Martinez', classType: 'mat-pilates', date: d(4, 11), instructor: 'Emily' },
    { id: 'BK-demo-5', clientName: 'Mike Chen', classType: 'reformer-power', date: d(0, 11), instructor: 'Alex' },
    { id: 'BK-demo-6', clientName: 'Mike Chen', classType: 'reformer-power', date: d(2, 11), instructor: 'Tovah' },
    { id: 'BK-demo-7', clientName: 'Mike Chen', classType: 'stretch-release', date: d(3, 10), instructor: 'Sam' },
    { id: 'BK-demo-8', clientName: 'Jessica Lee', classType: 'barre-sculpt', date: d(0, 10), instructor: 'Emily' },
    { id: 'BK-demo-9', clientName: 'Jessica Lee', classType: 'barre-sculpt', date: d(1, 10), instructor: 'Emily' },
    { id: 'BK-demo-10', clientName: 'Jessica Lee', classType: 'barre-sculpt', date: d(2, 10), instructor: 'Emily' },
  ];
}

// ── Fatigue analysis engine ──
function analyzeFatigue(bookings, clientName, windowHrs = 72) {
  const now = new Date();
  const cutoff = new Date(now.getTime() - windowHrs * 60 * 60 * 1000);
  const clientBookings = bookings
    .filter(b => b.clientName === clientName && new Date(b.date) >= cutoff)
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  // Accumulate muscle load
  const muscleLoad = {};
  MUSCLE_GROUPS.forEach(mg => { muscleLoad[mg.id] = { total: 0, sessions: 0, lastWorked: null }; });

  clientBookings.forEach(booking => {
    const cls = CLASS_TYPES.find(c => c.id === booking.classType);
    if (!cls) return;
    Object.entries(cls.muscles).forEach(([muscleId, load]) => {
      const intensityMultiplier = cls.intensity === 'high' ? 1.5 : cls.intensity === 'medium' ? 1.0 : 0.5;
      muscleLoad[muscleId].total += load * intensityMultiplier;
      muscleLoad[muscleId].sessions += 1;
      muscleLoad[muscleId].lastWorked = booking.date;
    });
  });

  // Determine status per muscle group
  const results = MUSCLE_GROUPS.map(mg => {
    const load = muscleLoad[mg.id];
    let status = 'fresh'; // fresh | recovering | loaded | overloaded
    let hoursRemaining = 0;

    if (load.sessions === 0) {
      status = 'fresh';
    } else if (load.total >= 2.5) {
      status = 'overloaded';
      hoursRemaining = 48;
    } else if (load.total >= 1.5) {
      status = 'loaded';
      hoursRemaining = 24;
    } else if (load.total >= 0.5) {
      status = 'recovering';
      // Calculate actual recovery time remaining
      if (load.lastWorked) {
        const hoursSince = (now - new Date(load.lastWorked)) / (1000 * 60 * 60);
        hoursRemaining = Math.max(0, 24 - hoursSince);
      }
    }

    if (load.lastWorked) {
      const hoursSince = (now - new Date(load.lastWorked)) / (1000 * 60 * 60);
      if (hoursSince > 48 && status !== 'fresh') status = 'fresh';
    }

    return { ...mg, ...load, status, hoursRemaining: Math.round(hoursRemaining) };
  });

  // Generate warnings
  const warnings = [];
  const overloaded = results.filter(r => r.status === 'overloaded');
  const loaded = results.filter(r => r.status === 'loaded');

  if (overloaded.length > 0) {
    warnings.push({
      severity: 'high',
      message: `${overloaded.map(r => r.label).join(', ')} ${overloaded.length > 1 ? 'are' : 'is'} overloaded — ${clientBookings.length} sessions in ${windowHrs}hrs with heavy overlap`,
      suggestion: 'Book Stretch & Release or take a rest day before the next session targeting these muscles',
    });
  }

  if (loaded.length >= 3) {
    warnings.push({
      severity: 'medium',
      message: `${loaded.length} muscle groups are still loaded — overall fatigue is building`,
      suggestion: 'Consider reducing intensity: swap Reformer Power for Reformer Foundations',
    });
  }

  // Suggest safe classes
  const overloadedMuscles = new Set([...overloaded, ...loaded].map(r => r.id));
  const safeClasses = CLASS_TYPES.filter(cls => {
    if (cls.intensity === 'recovery') return true;
    const classMuscles = Object.keys(cls.muscles);
    return !classMuscles.some(m => overloadedMuscles.has(m));
  });

  return { results, warnings, safeClasses, clientBookings, totalSessions: clientBookings.length };
}

// ── Status colors ──
const STATUS_COLORS = {
  fresh: '#4ADE80',
  recovering: '#60A5FA',
  loaded: '#FBBF24',
  overloaded: '#EF4444',
};

const STATUS_LABELS = {
  fresh: 'Fresh',
  recovering: 'Recovering',
  loaded: 'Loaded',
  overloaded: 'Overloaded',
};

export default function FatigueTracker() {
  const s = useStyles();
  const { theme } = useTheme();

  // Initialize with demo data if empty
  const [bookings, setBookings] = useState(() => {
    const stored = getBookings();
    if (stored.length === 0) {
      const defaults = getDefaultBookings();
      defaults.forEach(b => addBooking(b));
      return getBookings();
    }
    return stored;
  });

  const [selectedClient, setSelectedClient] = useState('Sarah Martinez');
  const [showAddBooking, setShowAddBooking] = useState(false);
  const [newBooking, setNewBooking] = useState({ clientName: '', classType: '', instructor: '', date: '' });
  const [windowHrs, setWindowHrs] = useState(72);

  // Get unique clients
  const clients = useMemo(() => [...new Set(bookings.map(b => b.clientName))], [bookings]);

  // Run fatigue analysis
  const analysis = useMemo(
    () => analyzeFatigue(bookings, selectedClient, windowHrs),
    [bookings, selectedClient, windowHrs]
  );

  const handleAddBooking = () => {
    if (!newBooking.clientName || !newBooking.classType) return;
    addBooking({
      clientName: newBooking.clientName,
      classType: newBooking.classType,
      instructor: newBooking.instructor || 'Staff',
      date: newBooking.date || new Date().toISOString(),
    });
    setBookings(getBookings());
    setShowAddBooking(false);
    setNewBooking({ clientName: '', classType: '', instructor: '', date: '' });
  };

  return (
    <div style={{ minHeight: '100vh', background: '#fafaf8' }}>
      <style>{`
        @media (max-width: 768px) {
          .ft-main-grid { grid-template-columns: 1fr !important; }
          .ft-muscle-grid { grid-template-columns: 1fr 1fr !important; }
          .ft-recovery-grid { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 480px) {
          .ft-muscle-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
      {/* Header */}
      <div style={{ padding: '32px 32px 0', borderBottom: '1px solid #eee' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ font: `500 10px ${s.MONO}`, textTransform: 'uppercase', letterSpacing: 3, color: theme.accent, marginBottom: 8 }}>
            Recovery Intelligence
          </div>
          <h1 style={{ font: `400 32px ${s.DISPLAY}`, color: '#1a1a1a', marginBottom: 6 }}>
            Muscle Fatigue Tracker
          </h1>
          <p style={{ font: `300 15px ${s.FONT}`, color: '#888', marginBottom: 24 }}>
            Monitors muscle group load across bookings — warns before overtraining, suggests recovery
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: 32 }}>
        {/* Controls */}
        <div style={{
          display: 'flex', gap: 16, alignItems: 'center', marginBottom: 32, flexWrap: 'wrap',
        }}>
          {/* Client selector */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <label style={{ font: `500 12px ${s.FONT}`, color: '#888' }}>Client:</label>
            <select value={selectedClient} onChange={e => setSelectedClient(e.target.value)} style={{
              padding: '8px 14px', borderRadius: 8, border: '1px solid #ddd',
              font: `400 14px ${s.FONT}`, outline: 'none', background: '#fff',
            }}>
              {clients.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Time window */}
          <div style={{ display: 'flex', gap: 6 }}>
            {[24, 48, 72, 168].map(hrs => (
              <button key={hrs} onClick={() => setWindowHrs(hrs)} style={{
                padding: '6px 14px', borderRadius: 100,
                border: `1.5px solid ${windowHrs === hrs ? theme.accent : '#e5e5e3'}`,
                background: windowHrs === hrs ? `${theme.accent}12` : 'transparent',
                color: windowHrs === hrs ? theme.accent : '#888',
                font: `400 12px ${s.FONT}`, cursor: 'pointer',
              }}>{hrs === 168 ? '7 days' : `${hrs}hrs`}</button>
            ))}
          </div>

          <button onClick={() => setShowAddBooking(true)} style={{
            padding: '8px 20px', borderRadius: 100, border: 'none', marginLeft: 'auto',
            background: theme.accent, color: '#fff', font: `500 12px ${s.FONT}`, cursor: 'pointer',
          }}>Log Class</button>
        </div>

        {/* Warnings */}
        {analysis.warnings.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
            {analysis.warnings.map((w, i) => (
              <div key={i} style={{
                padding: 16, borderRadius: 14,
                background: w.severity === 'high' ? '#FEF2F2' : '#FEF3C7',
                border: `1px solid ${w.severity === 'high' ? '#FECACA' : '#FDE68A'}`,
              }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <div style={{
                    width: 20, height: 20, borderRadius: 6, flexShrink: 0, marginTop: 1,
                    background: w.severity === 'high' ? '#EF4444' : '#F59E0B',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    font: `700 11px ${s.FONT}`, color: '#fff',
                  }}>!</div>
                  <div>
                    <div style={{ font: `500 13px ${s.FONT}`, color: w.severity === 'high' ? '#991B1B' : '#92400E', marginBottom: 4 }}>
                      {w.message}
                    </div>
                    <div style={{ font: `300 12px ${s.FONT}`, color: w.severity === 'high' ? '#B91C1C' : '#B45309' }}>
                      {w.suggestion}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="ft-main-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24 }}>
          {/* Body diagram */}
          <div>
            {/* Visual body map */}
            <div style={{
              padding: 28, borderRadius: 20, background: '#fff', border: '1px solid #eee', marginBottom: 20,
            }}>
              <div style={{ font: `500 10px ${s.MONO}`, textTransform: 'uppercase', letterSpacing: 2, color: '#bbb', marginBottom: 20 }}>
                Muscle Load Map — {selectedClient} — Last {windowHrs}hrs
              </div>

              <div className="ft-muscle-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                {/* Upper body */}
                <div>
                  <div style={{ font: `500 10px ${s.MONO}`, textTransform: 'uppercase', letterSpacing: 1, color: '#ccc', marginBottom: 10 }}>Upper</div>
                  {analysis.results.filter(r => r.region === 'upper').map(muscle => (
                    <MuscleBar key={muscle.id} muscle={muscle} accent={theme.accent} s={s} />
                  ))}
                </div>
                {/* Torso */}
                <div>
                  <div style={{ font: `500 10px ${s.MONO}`, textTransform: 'uppercase', letterSpacing: 1, color: '#ccc', marginBottom: 10 }}>Core</div>
                  {analysis.results.filter(r => r.region === 'torso').map(muscle => (
                    <MuscleBar key={muscle.id} muscle={muscle} accent={theme.accent} s={s} />
                  ))}
                </div>
                {/* Lower body */}
                <div>
                  <div style={{ font: `500 10px ${s.MONO}`, textTransform: 'uppercase', letterSpacing: 1, color: '#ccc', marginBottom: 10 }}>Lower</div>
                  {analysis.results.filter(r => r.region === 'lower').map(muscle => (
                    <MuscleBar key={muscle.id} muscle={muscle} accent={theme.accent} s={s} />
                  ))}
                </div>
              </div>

              {/* Legend */}
              <div style={{ display: 'flex', gap: 16, marginTop: 20, paddingTop: 16, borderTop: '1px solid #f0f0f0' }}>
                {Object.entries(STATUS_COLORS).map(([status, color]) => (
                  <div key={status} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 10, height: 10, borderRadius: 3, background: color }} />
                    <span style={{ font: `400 11px ${s.FONT}`, color: '#999' }}>{STATUS_LABELS[status]}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Safe classes to book */}
            <div style={{
              padding: 24, borderRadius: 16, background: '#fff', border: '1px solid #eee',
            }}>
              <div style={{ font: `500 10px ${s.MONO}`, textTransform: 'uppercase', letterSpacing: 2, color: theme.accent, marginBottom: 16 }}>
                Safe to Book Next
              </div>
              {analysis.safeClasses.length > 0 ? (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {analysis.safeClasses.map(cls => (
                    <div key={cls.id} style={{
                      padding: '10px 16px', borderRadius: 10, background: '#fafaf8',
                      border: cls.intensity === 'recovery' ? `1.5px solid ${STATUS_COLORS.fresh}40` : '1px solid #eee',
                    }}>
                      <div style={{ font: `500 13px ${s.FONT}`, color: '#1a1a1a' }}>{cls.name}</div>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 4 }}>
                        <div style={{
                          width: 8, height: 8, borderRadius: '50%', background: cls.color,
                        }} />
                        <span style={{ font: `400 10px ${s.FONT}`, color: '#999' }}>
                          {cls.intensity === 'recovery' ? 'Recovery — always safe' : `${cls.intensity} · ${cls.duration}min`}
                        </span>
                      </div>
                      {cls.intensity !== 'recovery' && (
                        <div style={{ font: `300 10px ${s.FONT}`, color: '#bbb', marginTop: 4 }}>
                          Targets: {Object.keys(cls.muscles).join(', ')}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{
                  padding: 20, borderRadius: 10, background: '#FEF2F2', textAlign: 'center',
                }}>
                  <div style={{ font: `500 13px ${s.FONT}`, color: '#DC2626' }}>Full rest day recommended</div>
                  <div style={{ font: `300 12px ${s.FONT}`, color: '#991B1B', marginTop: 4 }}>
                    All major muscle groups are loaded — only Stretch & Release is safe
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right sidebar — booking history */}
          <div>
            <div style={{
              padding: 24, borderRadius: 16, background: '#fff', border: '1px solid #eee',
              position: 'sticky', top: 80,
            }}>
              <div style={{ font: `500 10px ${s.MONO}`, textTransform: 'uppercase', letterSpacing: 2, color: '#bbb', marginBottom: 4 }}>
                Recent Sessions
              </div>
              <div style={{ font: `300 12px ${s.FONT}`, color: '#ccc', marginBottom: 16 }}>
                {analysis.totalSessions} sessions in {windowHrs}hrs
              </div>

              {analysis.clientBookings.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[...analysis.clientBookings].reverse().map(booking => {
                    const cls = CLASS_TYPES.find(c => c.id === booking.classType);
                    const dt = new Date(booking.date);
                    const hoursAgo = Math.round((new Date() - dt) / (1000 * 60 * 60));
                    return (
                      <div key={booking.id} style={{
                        padding: 12, borderRadius: 10, background: '#fafaf8',
                        borderLeft: `3px solid ${cls?.color || '#ddd'}`,
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ font: `500 13px ${s.FONT}`, color: '#1a1a1a' }}>
                            {cls?.name || booking.classType}
                          </div>
                          <button onClick={() => {
                            deleteBooking(booking.id);
                            setBookings(getBookings());
                          }} style={{
                            background: 'none', border: 'none', color: '#ddd', cursor: 'pointer',
                            font: `400 14px ${s.FONT}`, padding: 2,
                          }}>x</button>
                        </div>
                        <div style={{ font: `400 11px ${s.FONT}`, color: '#999', marginTop: 2 }}>
                          {hoursAgo < 24
                            ? `${hoursAgo}hrs ago`
                            : `${Math.round(hoursAgo / 24)}d ago`} · {booking.instructor}
                        </div>
                        {cls && Object.keys(cls.muscles).length > 0 && (
                          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 6 }}>
                            {Object.entries(cls.muscles).map(([m, load]) => (
                              <span key={m} style={{
                                padding: '2px 8px', borderRadius: 100,
                                font: `400 9px ${s.MONO}`, textTransform: 'uppercase',
                                background: load >= 0.7 ? '#FEF2F2' : '#f5f5f3',
                                color: load >= 0.7 ? '#DC2626' : '#999',
                              }}>{m} {Math.round(load * 100)}%</span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: 24, color: '#ddd' }}>
                  <div style={{ font: `300 14px ${s.FONT}` }}>No sessions in this window</div>
                </div>
              )}

              {/* Quick recovery stats */}
              {analysis.totalSessions > 0 && (
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #f0f0f0' }}>
                  <div style={{ font: `500 10px ${s.MONO}`, textTransform: 'uppercase', letterSpacing: 1, color: '#ccc', marginBottom: 10 }}>
                    Recovery Summary
                  </div>
                  <div className="ft-recovery-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <div style={{ padding: 10, borderRadius: 8, background: '#fafaf8', textAlign: 'center' }}>
                      <div style={{ font: `600 20px ${s.DISPLAY}`, color: STATUS_COLORS[analysis.results.some(r => r.status === 'overloaded') ? 'overloaded' : analysis.results.some(r => r.status === 'loaded') ? 'loaded' : 'fresh'] }}>
                        {analysis.results.filter(r => r.status === 'fresh').length}
                      </div>
                      <div style={{ font: `400 10px ${s.FONT}`, color: '#999' }}>Fresh groups</div>
                    </div>
                    <div style={{ padding: 10, borderRadius: 8, background: '#fafaf8', textAlign: 'center' }}>
                      <div style={{ font: `600 20px ${s.DISPLAY}`, color: '#EF4444' }}>
                        {analysis.results.filter(r => r.status === 'overloaded').length}
                      </div>
                      <div style={{ font: `400 10px ${s.FONT}`, color: '#999' }}>Overloaded</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add Booking Modal */}
      {showAddBooking && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)',
        }} onClick={() => setShowAddBooking(false)}>
          <div onClick={e => e.stopPropagation()} style={{
            background: '#fff', borderRadius: 20, padding: 32, width: 420,
            boxShadow: '0 24px 80px rgba(0,0,0,0.2)',
          }}>
            <div style={{ font: `400 20px ${s.DISPLAY}`, color: '#1a1a1a', marginBottom: 24 }}>Log a Class</div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ font: `500 12px ${s.FONT}`, color: '#888', display: 'block', marginBottom: 6 }}>Client</label>
                <input value={newBooking.clientName} onChange={e => setNewBooking({ ...newBooking, clientName: e.target.value })}
                  placeholder="Client name" list="client-list"
                  style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid #ddd', font: `400 14px ${s.FONT}`, width: '100%', outline: 'none' }} />
                <datalist id="client-list">
                  {clients.map(c => <option key={c} value={c} />)}
                </datalist>
              </div>

              <div>
                <label style={{ font: `500 12px ${s.FONT}`, color: '#888', display: 'block', marginBottom: 6 }}>Class Type</label>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {CLASS_TYPES.map(cls => (
                    <div key={cls.id} onClick={() => setNewBooking({ ...newBooking, classType: cls.id })} style={{
                      padding: '8px 14px', borderRadius: 10, cursor: 'pointer', transition: 'all 0.2s',
                      background: newBooking.classType === cls.id ? `${cls.color}15` : '#f5f5f3',
                      border: `1.5px solid ${newBooking.classType === cls.id ? cls.color : '#e5e5e3'}`,
                      font: `400 12px ${s.FONT}`, color: newBooking.classType === cls.id ? cls.color : '#666',
                    }}>
                      {cls.name}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ font: `500 12px ${s.FONT}`, color: '#888', display: 'block', marginBottom: 6 }}>Instructor</label>
                <input value={newBooking.instructor} onChange={e => setNewBooking({ ...newBooking, instructor: e.target.value })}
                  placeholder="Instructor name"
                  style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid #ddd', font: `400 14px ${s.FONT}`, width: '100%', outline: 'none' }} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
              <button onClick={() => setShowAddBooking(false)} style={{
                flex: 1, padding: '12px 0', borderRadius: 100, border: '1px solid #ddd',
                background: 'transparent', color: '#888', font: `400 14px ${s.FONT}`, cursor: 'pointer',
              }}>Cancel</button>
              <button onClick={handleAddBooking} disabled={!newBooking.clientName || !newBooking.classType} style={{
                flex: 2, padding: '12px 0', borderRadius: 100, border: 'none',
                background: (!newBooking.clientName || !newBooking.classType) ? '#ddd' : theme.accent,
                color: '#fff', font: `500 14px ${s.FONT}`, cursor: 'pointer',
              }}>Log Class</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Muscle load bar component ──
function MuscleBar({ muscle, accent, s }) {
  const maxLoad = 3; // visual max
  const fillPct = Math.min(100, (muscle.total / maxLoad) * 100);
  const color = STATUS_COLORS[muscle.status];

  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <span style={{ font: `500 12px ${s.FONT}`, color: '#1a1a1a' }}>{muscle.label}</span>
        <span style={{
          font: `500 10px ${s.MONO}`, color,
          textTransform: 'uppercase', letterSpacing: 0.5,
        }}>{STATUS_LABELS[muscle.status]}</span>
      </div>
      <div style={{ height: 8, borderRadius: 4, background: '#f0f0f0', overflow: 'hidden' }}>
        <div style={{
          height: '100%', borderRadius: 4, width: `${fillPct}%`,
          background: color, transition: 'all 0.5s ease',
        }} />
      </div>
      {muscle.sessions > 0 && (
        <div style={{ font: `300 10px ${s.FONT}`, color: '#bbb', marginTop: 3 }}>
          {muscle.sessions} session{muscle.sessions > 1 ? 's' : ''} · load: {muscle.total.toFixed(1)}
          {muscle.hoursRemaining > 0 ? ` · ${muscle.hoursRemaining}hrs to recover` : ''}
        </div>
      )}
    </div>
  );
}
