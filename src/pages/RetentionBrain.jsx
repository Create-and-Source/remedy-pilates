import { useState, useMemo } from 'react';
import { useStyles } from '../theme';
import { getPatients, getAppointments, getTreatmentPlans, getAssessments } from '../data/store';

// ── Churn Scoring Model ──
// Weighted rule-based scoring: 0 (loyal) → 100 (about to churn)
// Factors:
//   Days since last visit     30%  — recency is the #1 predictor
//   Booking frequency trend   25%  — declining visit cadence
//   Cancellation rate         15%  — high cancels = disengagement
//   Class variety             10%  — single-class clients churn faster
//   Package expiry            10%  — no active package = no commitment
//   Posture improvement       10%  — no progress = no motivation

function computeChurnScore(client, appointments, packages, assessments) {
  const now = new Date();
  const factors = {};

  // 1. Days since last visit (30%) — higher = worse
  const daysSince = client.lastVisit
    ? Math.floor((now - new Date(client.lastVisit)) / 86400000)
    : 999;
  // 0 days = 0 risk, 14 days = 25%, 30 = 50%, 60 = 80%, 90+ = 100%
  const recencyScore = daysSince <= 7 ? 0 : daysSince <= 14 ? 25 : daysSince <= 30 ? 50 : daysSince <= 60 ? 80 : 100;
  factors.recency = { score: recencyScore, weight: 0.30, detail: `${daysSince} days since last visit` };

  // 2. Booking frequency trend (25%) — compare last 30d vs prior 30d
  const clientAppts = appointments.filter(a => a.patientId === client.id && a.status === 'completed');
  const last30 = clientAppts.filter(a => {
    const diff = (now - new Date(a.date)) / 86400000;
    return diff >= 0 && diff <= 30;
  }).length;
  const prior30 = clientAppts.filter(a => {
    const diff = (now - new Date(a.date)) / 86400000;
    return diff > 30 && diff <= 60;
  }).length;
  let freqScore = 0;
  if (prior30 > 0 && last30 === 0) freqScore = 100;
  else if (prior30 > 0 && last30 < prior30) freqScore = Math.round(((prior30 - last30) / prior30) * 80);
  else if (prior30 === 0 && last30 === 0) freqScore = 60; // no history
  else freqScore = 0;
  factors.frequency = { score: freqScore, weight: 0.25, detail: `${last30} classes (last 30d) vs ${prior30} (prior 30d)` };

  // 3. Cancellation rate (15%)
  const allClientAppts = appointments.filter(a => a.patientId === client.id);
  const cancelled = allClientAppts.filter(a => a.status === 'cancelled').length;
  const cancelRate = allClientAppts.length > 0 ? cancelled / allClientAppts.length : 0;
  const cancelScore = cancelRate > 0.4 ? 100 : cancelRate > 0.25 ? 70 : cancelRate > 0.1 ? 30 : 0;
  factors.cancellations = { score: cancelScore, weight: 0.15, detail: `${(cancelRate * 100).toFixed(0)}% cancel rate (${cancelled}/${allClientAppts.length})` };

  // 4. Class variety (10%) — unique service types
  const uniqueServices = new Set(clientAppts.map(a => a.serviceId)).size;
  const varietyScore = uniqueServices >= 4 ? 0 : uniqueServices >= 2 ? 25 : uniqueServices >= 1 ? 50 : 80;
  factors.variety = { score: varietyScore, weight: 0.10, detail: `${uniqueServices} class types tried` };

  // 5. Package expiry (10%)
  const clientPkgs = packages.filter(p => p.patientId === client.id);
  const hasActivePkg = clientPkgs.some(p => {
    const upcoming = (p.sessions || []).filter(s => s.status === 'upcoming' || s.status === 'in-progress');
    return upcoming.length > 0;
  });
  const pkgScore = hasActivePkg ? 0 : clientPkgs.length > 0 ? 50 : 80;
  factors.package = { score: pkgScore, weight: 0.10, detail: hasActivePkg ? 'Active package' : clientPkgs.length > 0 ? 'Package expired' : 'No package' };

  // 6. Posture improvement (10%)
  const clientAssessments = assessments.filter(a => a.clientId === client.id);
  let progressScore = 40; // neutral default
  if (clientAssessments.length >= 2) {
    const sorted = [...clientAssessments].sort((a, b) => new Date(b.date) - new Date(a.date));
    const latest = sorted[0].overallScore || 0;
    const earlier = sorted[sorted.length - 1].overallScore || 0;
    progressScore = latest > earlier ? 0 : latest === earlier ? 40 : 70;
  } else if (clientAssessments.length === 0) {
    progressScore = 50;
  }
  factors.progress = { score: progressScore, weight: 0.10, detail: `${clientAssessments.length} assessments` };

  // Weighted total
  const total = Math.round(
    Object.values(factors).reduce((sum, f) => sum + f.score * f.weight, 0)
  );

  return { total, factors };
}

function getRiskLevel(score) {
  if (score >= 70) return { label: 'Critical', color: '#DC2626', bg: '#FEE2E2' };
  if (score >= 50) return { label: 'High Risk', color: '#D97706', bg: '#FEF3C7' };
  if (score >= 30) return { label: 'Watch', color: '#2563EB', bg: '#DBEAFE' };
  return { label: 'Healthy', color: '#16A34A', bg: '#DCFCE7' };
}

function getSuggestedAction(client, factors) {
  const actions = [];
  if (factors.recency.score >= 80) actions.push({ type: 'outreach', text: 'Send re-engagement message — it\'s been over 60 days', priority: 'high' });
  else if (factors.recency.score >= 50) actions.push({ type: 'outreach', text: 'Personal check-in — hasn\'t visited in 30+ days', priority: 'medium' });
  if (factors.frequency.score >= 60) actions.push({ type: 'incentive', text: 'Offer class pack discount to restart cadence', priority: 'high' });
  if (factors.package.score >= 50) actions.push({ type: 'upgrade', text: 'Recommend a new class package or membership', priority: 'medium' });
  if (factors.variety.score >= 50) actions.push({ type: 'discovery', text: 'Invite to try a different class type — broaden engagement', priority: 'low' });
  if (factors.cancellations.score >= 70) actions.push({ type: 'flexibility', text: 'Discuss scheduling needs — high cancel rate suggests time conflicts', priority: 'medium' });
  if (factors.progress.score >= 50) actions.push({ type: 'assessment', text: 'Schedule a posture assessment to show progress', priority: 'low' });
  if (actions.length === 0) actions.push({ type: 'maintain', text: 'Keep engaging — this client is on track', priority: 'low' });
  return actions;
}

// Sparkline component for visit trend
function Sparkline({ data, color, width = 80, height = 28 }) {
  if (!data.length) return null;
  const max = Math.max(...data, 1);
  const points = data.map((v, i) => `${(i / (data.length - 1)) * width},${height - (v / max) * (height - 4)}`).join(' ');
  return (
    <svg width={width} height={height} style={{ display: 'block' }}>
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function RetentionBrain() {
  const s = useStyles();
  const [sortBy, setSortBy] = useState('score');
  const [filterRisk, setFilterRisk] = useState('all');
  const [expandedId, setExpandedId] = useState(null);
  const [search, setSearch] = useState('');

  const { clients, summary, weeklyTrends } = useMemo(() => {
    const patients = getPatients();
    const appointments = getAppointments();
    const packages = getTreatmentPlans();
    const assessments = getAssessments();
    const now = new Date();

    const scored = patients.map(client => {
      const { total, factors } = computeChurnScore(client, appointments, packages, assessments);
      const risk = getRiskLevel(total);
      const actions = getSuggestedAction(client, factors);

      // Build 8-week visit trend
      const trend = [];
      for (let w = 7; w >= 0; w--) {
        const weekStart = new Date(now); weekStart.setDate(weekStart.getDate() - w * 7);
        const weekEnd = new Date(weekStart); weekEnd.setDate(weekEnd.getDate() + 7);
        const count = appointments.filter(a =>
          a.patientId === client.id && a.status === 'completed' &&
          new Date(a.date) >= weekStart && new Date(a.date) < weekEnd
        ).length;
        trend.push(count);
      }

      return { ...client, churnScore: total, risk, factors, actions, trend };
    });

    // Summary stats
    const critical = scored.filter(c => c.churnScore >= 70).length;
    const highRisk = scored.filter(c => c.churnScore >= 50 && c.churnScore < 70).length;
    const watch = scored.filter(c => c.churnScore >= 30 && c.churnScore < 50).length;
    const healthy = scored.filter(c => c.churnScore < 30).length;
    const avgScore = scored.length ? Math.round(scored.reduce((s, c) => s + c.churnScore, 0) / scored.length) : 0;

    // Weekly retention trend (last 8 weeks — active clients per week)
    const wt = [];
    for (let w = 7; w >= 0; w--) {
      const weekStart = new Date(now); weekStart.setDate(weekStart.getDate() - w * 7);
      const weekEnd = new Date(weekStart); weekEnd.setDate(weekEnd.getDate() + 7);
      const active = new Set(
        appointments.filter(a => a.status === 'completed' && new Date(a.date) >= weekStart && new Date(a.date) < weekEnd).map(a => a.patientId)
      ).size;
      wt.push(active);
    }

    return {
      clients: scored,
      summary: { critical, highRisk, watch, healthy, avgScore, total: scored.length },
      weeklyTrends: wt,
    };
  }, []);

  const filtered = useMemo(() => {
    let list = clients;
    if (filterRisk !== 'all') {
      const ranges = { critical: [70, 101], high: [50, 70], watch: [30, 50], healthy: [0, 30] };
      const [min, max] = ranges[filterRisk] || [0, 101];
      list = list.filter(c => c.churnScore >= min && c.churnScore < max);
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(c => `${c.firstName} ${c.lastName}`.toLowerCase().includes(q));
    }
    list.sort((a, b) => sortBy === 'score' ? b.churnScore - a.churnScore : sortBy === 'name' ? `${a.firstName}`.localeCompare(`${b.firstName}`) : new Date(a.lastVisit) - new Date(b.lastVisit));
    return list;
  }, [clients, filterRisk, search, sortBy]);

  const cardStyle = {
    background: 'rgba(255,255,255,0.72)', backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255,255,255,0.6)', borderRadius: 16,
    boxShadow: s.shadow, padding: 24,
  };

  const actionIcons = {
    outreach: '📞', incentive: '🎁', upgrade: '📦', discovery: '🧭',
    flexibility: '📅', assessment: '📐', maintain: '✅',
  };

  return (
    <div style={{ animation: 'fadeIn 0.5s ease' }}>
      <style>{`
        @media (max-width: 768px) {
          .rb-kpi-grid { grid-template-columns: 1fr 1fr !important; }
          .rb-factor-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ font: `400 11px ${s.MONO}`, textTransform: 'uppercase', letterSpacing: 1.5, color: s.text3, marginBottom: 4 }}>
          Intelligence
        </div>
        <h1 style={{ font: `600 28px ${s.DISPLAY}`, color: s.text, margin: 0, lineHeight: 1.2 }}>
          Retention Brain
        </h1>
        <p style={{ font: `400 14px ${s.FONT}`, color: s.text2, margin: '6px 0 0' }}>
          Predictive churn scoring — find at-risk clients before they leave
        </p>
      </div>

      {/* Summary KPIs */}
      <div className="rb-kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Critical', value: summary.critical, color: '#DC2626', bg: '#FEE2E2' },
          { label: 'High Risk', value: summary.highRisk, color: '#D97706', bg: '#FEF3C7' },
          { label: 'Watch', value: summary.watch, color: '#2563EB', bg: '#DBEAFE' },
          { label: 'Healthy', value: summary.healthy, color: '#16A34A', bg: '#DCFCE7' },
          { label: 'Avg Score', value: summary.avgScore, color: s.text, bg: 'rgba(255,255,255,0.5)' },
        ].map(kpi => (
          <div key={kpi.label} style={{ ...cardStyle, padding: 18, textAlign: 'center', cursor: kpi.label !== 'Avg Score' ? 'pointer' : 'default', transition: 'all 0.2s', border: filterRisk === kpi.label.toLowerCase().replace(' ', '') ? `2px solid ${kpi.color}` : cardStyle.border }}
            onClick={() => {
              const key = kpi.label.toLowerCase().replace(' ', '');
              if (['critical', 'high', 'watch', 'healthy'].includes(key)) setFilterRisk(filterRisk === key ? 'all' : key);
            }}>
            <div style={{ font: `700 28px ${s.FONT}`, color: kpi.color, lineHeight: 1 }}>{kpi.value}</div>
            <div style={{ font: `400 12px ${s.MONO}`, color: s.text3, marginTop: 6, textTransform: 'uppercase', letterSpacing: 0.8 }}>{kpi.label}</div>
          </div>
        ))}
      </div>

      {/* Studio Health Trend */}
      <div style={{ ...cardStyle, marginBottom: 24, padding: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div style={{ font: `600 14px ${s.FONT}`, color: s.text }}>Active Clients per Week</div>
          <div style={{ font: `400 11px ${s.MONO}`, color: s.text3 }}>Last 8 weeks</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'end', gap: 8, height: 80 }}>
          {weeklyTrends.map((v, i) => {
            const max = Math.max(...weeklyTrends, 1);
            const h = Math.max((v / max) * 70, 4);
            const isLast = i === weeklyTrends.length - 1;
            return (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div style={{ font: `400 10px ${s.MONO}`, color: isLast ? s.accent : s.text3 }}>{v}</div>
                <div style={{
                  width: '100%', maxWidth: 40, height: h, borderRadius: 6,
                  background: isLast ? s.accent : 'rgba(0,0,0,0.06)',
                  transition: 'all 0.3s ease',
                }} />
                <div style={{ font: `400 9px ${s.MONO}`, color: s.text3 }}>W{i + 1}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          type="text" placeholder="Search clients..." value={search} onChange={e => setSearch(e.target.value)}
          style={{
            flex: '1 1 200px', padding: '9px 14px', borderRadius: 10,
            border: '1px solid rgba(0,0,0,0.08)', background: 'rgba(255,255,255,0.6)',
            font: `400 13px ${s.FONT}`, color: s.text, outline: 'none',
          }}
        />
        <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{
          padding: '9px 14px', borderRadius: 10, border: '1px solid rgba(0,0,0,0.08)',
          background: 'rgba(255,255,255,0.6)', font: `400 13px ${s.FONT}`, color: s.text, cursor: 'pointer',
        }}>
          <option value="score">Sort: Risk Score</option>
          <option value="name">Sort: Name</option>
          <option value="lastVisit">Sort: Last Visit</option>
        </select>
        {filterRisk !== 'all' && (
          <button onClick={() => setFilterRisk('all')} style={{
            padding: '9px 14px', borderRadius: 10, border: '1px solid rgba(0,0,0,0.08)',
            background: 'rgba(255,255,255,0.6)', font: `400 12px ${s.FONT}`, color: s.text2, cursor: 'pointer',
          }}>Clear filter</button>
        )}
        <div style={{ font: `400 12px ${s.MONO}`, color: s.text3 }}>
          {filtered.length} client{filtered.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Client List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filtered.map(client => {
          const expanded = expandedId === client.id;
          return (
            <div key={client.id} style={{
              ...cardStyle, padding: 0, overflow: 'hidden',
              borderLeft: `4px solid ${client.risk.color}`,
              cursor: 'pointer', transition: 'all 0.2s',
            }} onClick={() => setExpandedId(expanded ? null : client.id)}>
              {/* Row */}
              <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                {/* Avatar */}
                <div style={{
                  width: 40, height: 40, borderRadius: 12, background: client.risk.bg,
                  color: client.risk.color, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  font: `600 15px ${s.FONT}`, flexShrink: 0,
                }}>
                  {client.firstName?.[0]}{client.lastName?.[0]}
                </div>

                {/* Name + last visit */}
                <div style={{ flex: '1 1 160px', minWidth: 120 }}>
                  <div style={{ font: `500 14px ${s.FONT}`, color: s.text }}>{client.firstName} {client.lastName}</div>
                  <div style={{ font: `400 12px ${s.FONT}`, color: s.text3 }}>
                    Last visit: {client.lastVisit ? new Date(client.lastVisit).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Never'}
                    {client.membershipTier !== 'None' && <span style={{ marginLeft: 8, padding: '1px 6px', borderRadius: 4, background: s.accentLight || 'rgba(0,0,0,0.04)', font: `400 10px ${s.MONO}`, color: s.accent }}>{client.membershipTier}</span>}
                  </div>
                </div>

                {/* Visit trend sparkline */}
                <div style={{ flex: '0 0 80px' }}>
                  <Sparkline data={client.trend} color={client.risk.color} />
                </div>

                {/* Score */}
                <div style={{ flex: '0 0 60px', textAlign: 'center' }}>
                  <div style={{ font: `700 22px ${s.FONT}`, color: client.risk.color, lineHeight: 1 }}>{client.churnScore}</div>
                  <div style={{ font: `400 9px ${s.MONO}`, color: s.text3, textTransform: 'uppercase', marginTop: 2 }}>Risk</div>
                </div>

                {/* Risk badge */}
                <div style={{
                  padding: '4px 10px', borderRadius: 8, background: client.risk.bg,
                  font: `500 11px ${s.MONO}`, color: client.risk.color, textTransform: 'uppercase', letterSpacing: 0.5,
                }}>
                  {client.risk.label}
                </div>

                {/* Expand arrow */}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={s.text3} strokeWidth="1.5" strokeLinecap="round"
                  style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }}>
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>

              {/* Expanded Detail */}
              {expanded && (
                <div style={{ padding: '0 20px 20px', borderTop: '1px solid rgba(0,0,0,0.04)' }}>
                  {/* Factor breakdown */}
                  <div style={{ font: `600 12px ${s.MONO}`, color: s.text3, margin: '16px 0 10px', textTransform: 'uppercase', letterSpacing: 1 }}>
                    Risk Factors
                  </div>
                  <div className="rb-factor-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
                    {Object.entries(client.factors).map(([key, f]) => (
                      <div key={key} style={{ padding: 12, background: 'rgba(0,0,0,0.02)', borderRadius: 10 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                          <span style={{ font: `500 12px ${s.FONT}`, color: s.text, textTransform: 'capitalize' }}>{key}</span>
                          <span style={{ font: `600 12px ${s.MONO}`, color: f.score >= 70 ? '#DC2626' : f.score >= 40 ? '#D97706' : '#16A34A' }}>{f.score}</span>
                        </div>
                        {/* Bar */}
                        <div style={{ height: 4, borderRadius: 2, background: 'rgba(0,0,0,0.06)', marginBottom: 6 }}>
                          <div style={{ height: 4, borderRadius: 2, width: `${f.score}%`, background: f.score >= 70 ? '#DC2626' : f.score >= 40 ? '#D97706' : '#16A34A', transition: 'width 0.5s ease' }} />
                        </div>
                        <div style={{ font: `400 11px ${s.FONT}`, color: s.text3 }}>{f.detail}</div>
                        <div style={{ font: `400 10px ${s.MONO}`, color: s.text3, marginTop: 2 }}>Weight: {(f.weight * 100).toFixed(0)}%</div>
                      </div>
                    ))}
                  </div>

                  {/* Suggested Actions */}
                  <div style={{ font: `600 12px ${s.MONO}`, color: s.text3, margin: '18px 0 10px', textTransform: 'uppercase', letterSpacing: 1 }}>
                    Suggested Actions
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {client.actions.map((a, i) => (
                      <div key={i} style={{
                        display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
                        background: a.priority === 'high' ? '#FEF3C7' : a.priority === 'medium' ? '#F0F4FF' : 'rgba(0,0,0,0.02)',
                        borderRadius: 10,
                      }}>
                        <span style={{ fontSize: 16 }}>{actionIcons[a.type]}</span>
                        <span style={{ font: `400 13px ${s.FONT}`, color: s.text, flex: 1 }}>{a.text}</span>
                        <span style={{
                          font: `500 10px ${s.MONO}`, textTransform: 'uppercase', letterSpacing: 0.5,
                          color: a.priority === 'high' ? '#D97706' : a.priority === 'medium' ? '#2563EB' : '#16A34A',
                        }}>{a.priority}</span>
                      </div>
                    ))}
                  </div>

                  {/* Client Stats */}
                  <div style={{ display: 'flex', gap: 16, marginTop: 16, flexWrap: 'wrap' }}>
                    {[
                      { label: 'Total Visits', value: client.visitCount },
                      { label: 'Total Spent', value: `$${((client.totalSpent || 0) / 100).toLocaleString()}` },
                      { label: 'Member Since', value: client.createdAt ? new Date(client.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '—' },
                      { label: 'Location', value: client.location === 'LOC-1' ? 'Downtown Studio' : client.location === 'LOC-2' ? 'Westside Studio' : 'North Studio' },
                    ].map(stat => (
                      <div key={stat.label} style={{ padding: '8px 14px', background: 'rgba(0,0,0,0.02)', borderRadius: 8 }}>
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
        {filtered.length === 0 && (
          <div style={{ ...cardStyle, textAlign: 'center', padding: 48 }}>
            <div style={{ font: `400 14px ${s.FONT}`, color: s.text3 }}>No clients match the current filter</div>
          </div>
        )}
      </div>
    </div>
  );
}
