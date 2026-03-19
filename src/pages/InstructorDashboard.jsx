import { useState, useMemo } from 'react';
import { useStyles } from '../theme';
import { getProviders, getAppointments, getPatients, getAssessments } from '../data/store';

// ── Instructor Analytics Engine ──
// Computes per-instructor metrics from appointment + client data:
//   Fill rate — completed / total booked (excludes cancelled)
//   Rebook rate — clients who book again within 14 days
//   Client improvement — posture score deltas for their clients
//   Revenue attribution — sum of service prices for completed appointments
//   Unique clients — distinct client count

const SERVICE_PRICES = {
  'SVC-1': 3800, 'SVC-2': 2800, 'SVC-3': 3200, 'SVC-4': 3200, 'SVC-5': 3500,
  'SVC-6': 4000, 'SVC-7': 2500, 'SVC-8': 9500, 'SVC-9': 6500, 'SVC-10': 4200,
  'SVC-11': 3500, 'SVC-12': 3000, 'SVC-13': 0, 'SVC-14': 0, 'SVC-15': 0,
};

const SERVICE_NAMES = {
  'SVC-1': 'Reformer', 'SVC-2': 'Mat Pilates', 'SVC-3': 'Barre', 'SVC-4': 'Barre Burn',
  'SVC-5': 'TRX Fusion', 'SVC-6': 'Reformer + Cardio', 'SVC-7': 'Stretch & Restore',
  'SVC-8': 'Private Training', 'SVC-9': 'Semi-Private', 'SVC-10': 'Group Apparatus',
  'SVC-11': 'Prenatal', 'SVC-12': 'Youth', 'SVC-13': 'Teacher Training', 'SVC-14': 'Intro', 'SVC-15': 'Consult',
};

function computeInstructorMetrics(instructor, appointments, allAssessments) {
  const now = new Date();
  const insAppts = appointments.filter(a => a.providerId === instructor.id);
  const last30 = insAppts.filter(a => (now - new Date(a.date)) / 86400000 <= 30);
  const completed = last30.filter(a => a.status === 'completed');
  const booked = last30.filter(a => a.status !== 'cancelled');

  // Fill rate
  const fillRate = booked.length > 0 ? completed.length / booked.length : 0;

  // Rebook rate — of completed clients, how many booked another session within 14 days
  let rebooks = 0;
  const completedClients = [...new Set(completed.map(a => a.patientId))];
  completedClients.forEach(pid => {
    const clientAppts = insAppts.filter(a => a.patientId === pid).sort((a, b) => new Date(a.date) - new Date(b.date));
    for (let i = 0; i < clientAppts.length - 1; i++) {
      const gap = (new Date(clientAppts[i + 1].date) - new Date(clientAppts[i].date)) / 86400000;
      if (gap <= 14 && gap > 0) { rebooks++; break; }
    }
  });
  const rebookRate = completedClients.length > 0 ? rebooks / completedClients.length : 0;

  // Revenue
  const revenue = completed.reduce((sum, a) => sum + (SERVICE_PRICES[a.serviceId] || 0), 0);

  // Unique clients
  const uniqueClients = new Set(completed.map(a => a.patientId)).size;

  // Classes taught
  const classesThisMonth = completed.length;

  // Class mix
  const classMix = {};
  completed.forEach(a => {
    const name = SERVICE_NAMES[a.serviceId] || a.serviceId;
    classMix[name] = (classMix[name] || 0) + 1;
  });

  // Weekly trend (last 8 weeks)
  const weeklyClasses = [];
  for (let w = 7; w >= 0; w--) {
    const wStart = new Date(now); wStart.setDate(wStart.getDate() - w * 7);
    const wEnd = new Date(wStart); wEnd.setDate(wEnd.getDate() + 7);
    const count = insAppts.filter(a => a.status === 'completed' && new Date(a.date) >= wStart && new Date(a.date) < wEnd).length;
    weeklyClasses.push(count);
  }

  // Client satisfaction proxy — posture improvement for their clients
  let avgImprovement = null;
  const clientIds = [...new Set(insAppts.map(a => a.patientId))];
  const improvements = [];
  clientIds.forEach(cid => {
    const assessments = allAssessments.filter(a => a.clientId === cid);
    if (assessments.length >= 2) {
      const sorted = [...assessments].sort((a, b) => new Date(a.date) - new Date(b.date));
      const delta = (sorted[sorted.length - 1].overallScore || 0) - (sorted[0].overallScore || 0);
      improvements.push(delta);
    }
  });
  if (improvements.length > 0) {
    avgImprovement = Math.round(improvements.reduce((s, d) => s + d, 0) / improvements.length);
  }

  // Upcoming classes (next 7 days)
  const upcoming = insAppts.filter(a => {
    const d = (new Date(a.date) - now) / 86400000;
    return d >= 0 && d <= 7 && a.status !== 'cancelled';
  }).length;

  return {
    fillRate, rebookRate, revenue, uniqueClients, classesThisMonth,
    classMix, weeklyClasses, avgImprovement, upcoming,
  };
}

function MiniBar({ data, color, width = 100, height = 32 }) {
  const max = Math.max(...data, 1);
  const barW = Math.max((width - (data.length - 1) * 2) / data.length, 3);
  return (
    <svg width={width} height={height} style={{ display: 'block' }}>
      {data.map((v, i) => {
        const h = Math.max((v / max) * (height - 4), 2);
        return <rect key={i} x={i * (barW + 2)} y={height - h} width={barW} height={h} rx={2} fill={i === data.length - 1 ? color : 'rgba(0,0,0,0.08)'} />;
      })}
    </svg>
  );
}

function DonutChart({ value, color, size = 56, strokeWidth = 5 }) {
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - Math.min(value, 1));
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth={strokeWidth} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={strokeWidth} strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.8s ease' }} />
    </svg>
  );
}

export default function InstructorDashboard() {
  const s = useStyles();
  const [selectedId, setSelectedId] = useState(null);

  const { instructors, studioTotals } = useMemo(() => {
    const providers = getProviders();
    const appointments = getAppointments();
    const assessments = getAssessments();

    const enriched = providers.map(ins => ({
      ...ins,
      metrics: computeInstructorMetrics(ins, appointments, assessments),
    }));

    // Studio totals
    const totalRevenue = enriched.reduce((s, i) => s + i.metrics.revenue, 0);
    const totalClasses = enriched.reduce((s, i) => s + i.metrics.classesThisMonth, 0);
    const totalClients = new Set(appointments.filter(a => a.status === 'completed').map(a => a.patientId)).size;
    const avgFill = enriched.length ? enriched.reduce((s, i) => s + i.metrics.fillRate, 0) / enriched.length : 0;

    return {
      instructors: enriched,
      studioTotals: { totalRevenue, totalClasses, totalClients, avgFill },
    };
  }, []);

  const selected = selectedId ? instructors.find(i => i.id === selectedId) : null;

  const cardStyle = {
    background: 'rgba(255,255,255,0.72)', backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255,255,255,0.6)', borderRadius: 16,
    boxShadow: s.shadow,
  };

  return (
    <div style={{ animation: 'fadeIn 0.5s ease' }}>
      <style>{`
        @media (max-width: 768px) {
          .id-kpi-grid { grid-template-columns: 1fr 1fr !important; }
          .id-instructor-grid { grid-template-columns: 1fr !important; }
          .id-card-metrics { grid-template-columns: 1fr 1fr 1fr !important; }
        }
      `}</style>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ font: `400 11px ${s.MONO}`, textTransform: 'uppercase', letterSpacing: 1.5, color: s.text3, marginBottom: 4 }}>
          Intelligence
        </div>
        <h1 style={{ font: `600 28px ${s.DISPLAY}`, color: s.text, margin: 0, lineHeight: 1.2 }}>
          Instructor Dashboard
        </h1>
        <p style={{ font: `400 14px ${s.FONT}`, color: s.text2, margin: '6px 0 0' }}>
          Per-instructor performance metrics — fill rates, revenue, client outcomes
        </p>
      </div>

      {/* Studio KPIs */}
      <div className="id-kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Revenue (30d)', value: `$${(studioTotals.totalRevenue / 100).toLocaleString()}`, color: s.accent },
          { label: 'Classes Taught', value: studioTotals.totalClasses, color: '#2563EB' },
          { label: 'Active Clients', value: studioTotals.totalClients, color: '#16A34A' },
          { label: 'Avg Fill Rate', value: `${(studioTotals.avgFill * 100).toFixed(0)}%`, color: '#D97706' },
        ].map(kpi => (
          <div key={kpi.label} style={{ ...cardStyle, padding: 18, textAlign: 'center' }}>
            <div style={{ font: `700 26px ${s.FONT}`, color: kpi.color, lineHeight: 1 }}>{kpi.value}</div>
            <div style={{ font: `400 11px ${s.MONO}`, color: s.text3, marginTop: 6, textTransform: 'uppercase', letterSpacing: 0.8 }}>{kpi.label}</div>
          </div>
        ))}
      </div>

      {/* Instructor Grid */}
      <div className="id-instructor-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
        {instructors.map(ins => {
          const m = ins.metrics;
          const isSelected = selectedId === ins.id;
          return (
            <div key={ins.id} style={{
              ...cardStyle, padding: 0, overflow: 'hidden', cursor: 'pointer',
              transition: 'all 0.2s', transform: isSelected ? 'scale(1.01)' : 'none',
              border: isSelected ? `2px solid ${ins.color || s.accent}` : cardStyle.border,
            }} onClick={() => setSelectedId(isSelected ? null : ins.id)}>
              {/* Header bar */}
              <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14, borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                <div style={{
                  width: 42, height: 42, borderRadius: 12, background: ins.color || s.accent,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', font: `600 16px ${s.FONT}`, flexShrink: 0,
                }}>
                  {ins.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ font: `500 14px ${s.FONT}`, color: s.text }}>{ins.name}</div>
                  <div style={{ font: `400 12px ${s.FONT}`, color: s.text3 }}>{ins.title}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ font: `600 16px ${s.FONT}`, color: s.text }}>${(m.revenue / 100).toLocaleString()}</div>
                  <div style={{ font: `400 10px ${s.MONO}`, color: s.text3 }}>Revenue</div>
                </div>
              </div>

              {/* Metrics */}
              <div className="id-card-metrics" style={{ padding: '14px 20px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ position: 'relative', display: 'inline-block' }}>
                    <DonutChart value={m.fillRate} color={m.fillRate >= 0.8 ? '#16A34A' : m.fillRate >= 0.6 ? '#D97706' : '#DC2626'} size={48} strokeWidth={4} />
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', font: `600 11px ${s.MONO}`, color: s.text }}>
                      {(m.fillRate * 100).toFixed(0)}%
                    </div>
                  </div>
                  <div style={{ font: `400 10px ${s.MONO}`, color: s.text3, marginTop: 4 }}>Fill Rate</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ position: 'relative', display: 'inline-block' }}>
                    <DonutChart value={m.rebookRate} color={m.rebookRate >= 0.6 ? '#16A34A' : m.rebookRate >= 0.35 ? '#D97706' : '#DC2626'} size={48} strokeWidth={4} />
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', font: `600 11px ${s.MONO}`, color: s.text }}>
                      {(m.rebookRate * 100).toFixed(0)}%
                    </div>
                  </div>
                  <div style={{ font: `400 10px ${s.MONO}`, color: s.text3, marginTop: 4 }}>Rebook</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ font: `700 20px ${s.FONT}`, color: s.text, lineHeight: '48px' }}>{m.classesThisMonth}</div>
                  <div style={{ font: `400 10px ${s.MONO}`, color: s.text3, marginTop: 4 }}>Classes</div>
                </div>
              </div>

              {/* Weekly trend */}
              <div style={{ padding: '0 20px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <MiniBar data={m.weeklyClasses} color={ins.color || s.accent} />
                <div style={{ font: `400 10px ${s.MONO}`, color: s.text3 }}>{m.uniqueClients} clients · {m.upcoming} upcoming</div>
              </div>

              {/* Expanded detail */}
              {isSelected && (
                <div style={{ padding: '0 20px 20px', borderTop: '1px solid rgba(0,0,0,0.04)' }}>
                  {/* Specialties */}
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', margin: '14px 0 12px' }}>
                    {(ins.specialties || []).map(sp => (
                      <span key={sp} style={{
                        padding: '3px 10px', borderRadius: 6, background: 'rgba(0,0,0,0.03)',
                        font: `400 11px ${s.MONO}`, color: s.text2,
                      }}>{sp}</span>
                    ))}
                  </div>

                  {/* Class mix */}
                  <div style={{ font: `600 11px ${s.MONO}`, color: s.text3, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
                    Class Mix (30d)
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {Object.entries(m.classMix).sort((a, b) => b[1] - a[1]).map(([name, count]) => {
                      const total = m.classesThisMonth || 1;
                      return (
                        <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ font: `400 12px ${s.FONT}`, color: s.text, width: 120, flexShrink: 0 }}>{name}</span>
                          <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'rgba(0,0,0,0.04)' }}>
                            <div style={{ height: 6, borderRadius: 3, width: `${(count / total) * 100}%`, background: ins.color || s.accent, transition: 'width 0.5s ease' }} />
                          </div>
                          <span style={{ font: `500 11px ${s.MONO}`, color: s.text3, width: 24, textAlign: 'right' }}>{count}</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Bio */}
                  {ins.bio && (
                    <div style={{ marginTop: 14, padding: 14, background: 'rgba(0,0,0,0.02)', borderRadius: 10 }}>
                      <div style={{ font: `400 12px ${s.FONT}`, color: s.text2, lineHeight: 1.6 }}>{ins.bio}</div>
                    </div>
                  )}

                  {/* Stats row */}
                  <div style={{ display: 'flex', gap: 12, marginTop: 14, flexWrap: 'wrap' }}>
                    {[
                      { label: 'Experience', value: `${ins.yearsExperience || '—'}y` },
                      { label: 'Location', value: ins.location || '—' },
                      { label: 'Certifications', value: (ins.certifications || []).length },
                      { label: 'Improvement', value: m.avgImprovement !== null ? `${m.avgImprovement > 0 ? '+' : ''}${m.avgImprovement}pts` : 'N/A' },
                    ].map(stat => (
                      <div key={stat.label} style={{ padding: '8px 12px', background: 'rgba(0,0,0,0.02)', borderRadius: 8 }}>
                        <div style={{ font: `600 14px ${s.FONT}`, color: s.text }}>{stat.value}</div>
                        <div style={{ font: `400 10px ${s.MONO}`, color: s.text3, textTransform: 'uppercase' }}>{stat.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
