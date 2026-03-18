import { useState, useMemo } from 'react';
import { useStyles } from '../theme';
import { getPatients, getAppointments, getServices } from '../data/store';

// ─── helpers ────────────────────────────────────────────────────────────────

function monthKey(date) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function monthLabel(key) {
  const [y, m] = key.split('-');
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
}

function addMonths(key, n) {
  const [y, m] = key.split('-').map(Number);
  const d = new Date(y, m - 1 + n, 1);
  return monthKey(d);
}

function retentionColor(pct) {
  if (pct == null) return 'rgba(200,200,200,0.18)';
  if (pct >= 80) return 'rgba(52,199,89,0.82)';
  if (pct >= 60) return 'rgba(52,199,89,0.55)';
  if (pct >= 40) return 'rgba(255,204,0,0.72)';
  if (pct >= 20) return 'rgba(255,149,0,0.72)';
  return 'rgba(255,59,48,0.72)';
}

function retentionTextColor(pct) {
  if (pct == null) return '#aaa';
  if (pct >= 40) return '#1a1a1a';
  return '#fff';
}

// ─── demo data derivation ────────────────────────────────────────────────────

function buildDemoData() {
  let patients = [];
  let appointments = [];
  try { patients = getPatients() || []; } catch (_) {}
  try { appointments = getAppointments() || []; } catch (_) {}

  const now = new Date('2026-03-18');

  // Build per-patient activity map
  const patientActivity = {};
  for (const appt of appointments) {
    const pid = appt.patientId || appt.patient_id || appt.clientId;
    if (!pid) continue;
    const d = new Date(appt.date || appt.start || appt.scheduledAt);
    if (isNaN(d)) continue;
    if (!patientActivity[pid]) patientActivity[pid] = [];
    patientActivity[pid].push(d);
  }

  // Assign each patient a cohort (first visit month)
  const patientCohort = {};
  for (const p of patients) {
    const pid = p.id;
    const acts = patientActivity[pid] || [];
    const joinDate = p.joinDate || p.join_date || p.createdAt || p.created_at;
    const earliest = acts.length
      ? new Date(Math.min(...acts.map(d => d.getTime())))
      : joinDate
        ? new Date(joinDate)
        : new Date(now.getTime() - Math.random() * 365 * 24 * 3600 * 1000 * 1.5);
    patientCohort[pid] = { cohortKey: monthKey(earliest), patient: p };
  }

  // If no real data, generate synthetic patients
  if (patients.length < 10) {
    const syntheticCohorts = [];
    for (let mOff = 11; mOff >= 0; mOff--) {
      const cohortDate = new Date(now.getFullYear(), now.getMonth() - mOff, 1);
      const cKey = monthKey(cohortDate);
      const size = Math.floor(12 + Math.random() * 18);
      for (let i = 0; i < size; i++) {
        const pid = `syn-${cKey}-${i}`;
        patientCohort[pid] = { cohortKey: cKey, patient: { id: pid } };
        // synthetic activity: retention decays
        patientActivity[pid] = [];
        const retentionCurve = [1, 0.78, 0.62, 0.52, 0.44, 0.38, 0.33];
        for (let mo = 0; mo <= mOff; mo++) {
          const threshold = retentionCurve[Math.min(mo, retentionCurve.length - 1)] + (Math.random() - 0.5) * 0.12;
          if (Math.random() < threshold) {
            const visitDate = new Date(cohortDate.getFullYear(), cohortDate.getMonth() + mo, 5 + Math.floor(Math.random() * 20));
            patientActivity[pid].push(visitDate);
          }
        }
      }
    }
  }

  return { patientCohort, patientActivity, now };
}

// ─── Cohort Matrix ───────────────────────────────────────────────────────────

function CohortMatrix({ s }) {
  const { patientCohort, patientActivity, now } = useMemo(buildDemoData, []);

  const cohorts = useMemo(() => {
    const map = {};
    for (const [pid, { cohortKey }] of Object.entries(patientCohort)) {
      if (!map[cohortKey]) map[cohortKey] = new Set();
      map[cohortKey].add(pid);
    }
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-10);
  }, [patientCohort]);

  const maxCols = 7;
  const nowKey = monthKey(now);

  const matrix = useMemo(() => {
    return cohorts.map(([cohortKey, pids]) => {
      const cols = [];
      for (let col = 0; col < maxCols; col++) {
        const targetKey = addMonths(cohortKey, col);
        if (targetKey > nowKey) { cols.push(null); continue; }
        const active = [...pids].filter(pid => {
          const acts = patientActivity[pid] || [];
          return acts.some(d => monthKey(d) === targetKey);
        }).length;
        cols.push(col === 0 ? 100 : Math.round((active / pids.size) * 100));
      }
      return { cohortKey, size: pids.size, cols };
    });
  }, [cohorts, patientActivity, nowKey]);

  const card = { background: 'rgba(255,255,255,0.72)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.6)', borderRadius: 16, boxShadow: s.shadow, padding: '28px 32px' };

  return (
    <div style={card}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontFamily: s.MONO, fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: s.accent, marginBottom: 6 }}>Cohort Analysis</div>
        <div style={{ fontFamily: s.DISPLAY, fontSize: 22, fontWeight: 700, color: s.text, marginBottom: 4 }}>Retention by Signup Month</div>
        <div style={{ fontFamily: s.FONT, fontSize: 14, color: s.text3 }}>% of clients still active each month after joining</div>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'separate', borderSpacing: 3, minWidth: 520 }}>
          <thead>
            <tr>
              <th style={{ fontFamily: s.MONO, fontSize: 11, color: s.text3, textAlign: 'left', padding: '4px 10px', fontWeight: 600 }}>Cohort</th>
              <th style={{ fontFamily: s.MONO, fontSize: 11, color: s.text3, textAlign: 'center', padding: '4px 8px', fontWeight: 600 }}>Size</th>
              {Array.from({ length: maxCols }, (_, i) => (
                <th key={i} style={{ fontFamily: s.MONO, fontSize: 11, color: s.text3, textAlign: 'center', padding: '4px 8px', fontWeight: 600 }}>M+{i}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matrix.map(({ cohortKey, size, cols }) => (
              <tr key={cohortKey}>
                <td style={{ fontFamily: s.MONO, fontSize: 12, color: s.text2, padding: '3px 10px', whiteSpace: 'nowrap' }}>{monthLabel(cohortKey)}</td>
                <td style={{ fontFamily: s.MONO, fontSize: 12, color: s.text, textAlign: 'center', padding: '3px 8px' }}>{size}</td>
                {cols.map((pct, col) => (
                  <td key={col} style={{ background: retentionColor(pct), borderRadius: 6, textAlign: 'center', padding: '6px 8px', minWidth: 44 }}>
                    <span style={{ fontFamily: s.MONO, fontSize: 12, fontWeight: 700, color: retentionTextColor(pct) }}>
                      {pct != null ? `${pct}%` : '—'}
                    </span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ display: 'flex', gap: 12, marginTop: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontFamily: s.FONT, fontSize: 12, color: s.text3 }}>Retention:</span>
        {[['≥80%', 'rgba(52,199,89,0.82)', '#1a1a1a'], ['60–79%', 'rgba(52,199,89,0.55)', '#1a1a1a'], ['40–59%', 'rgba(255,204,0,0.72)', '#1a1a1a'], ['20–39%', 'rgba(255,149,0,0.72)', '#fff'], ['<20%', 'rgba(255,59,48,0.72)', '#fff']].map(([label, bg, tc]) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 14, height: 14, borderRadius: 3, background: bg }} />
            <span style={{ fontFamily: s.MONO, fontSize: 11, color: s.text3 }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── A/B Experiments ─────────────────────────────────────────────────────────

const EXPERIMENTS = [
  {
    id: 'welcome-back',
    name: '"Welcome Back" Discount',
    description: 'Lapsed clients (45+ days inactive)',
    control: { label: 'No Offer', n: 48, conversions: 6 },
    treatment: { label: '20% Discount', n: 51, conversions: 18 },
  },
  {
    id: 'personal-outreach',
    name: 'Personal vs Automated Outreach',
    description: 'Clients with declining visit frequency',
    control: { label: 'Automated Email', n: 62, conversions: 9 },
    treatment: { label: 'Personal Call', n: 58, conversions: 21 },
  },
  {
    id: 'incentive-type',
    name: 'Incentive Type for Declining Clients',
    description: 'Clients with 40%+ drop in monthly visits',
    control: { label: 'Loyalty Points', n: 44, conversions: 10 },
    treatment: { label: 'Free Guest Pass', n: 46, conversions: 17 },
  },
];

function confidence(n1, c1, n2, c2) {
  const p1 = c1 / n1, p2 = c2 / n2;
  const se = Math.sqrt((p1 * (1 - p1)) / n1 + (p2 * (1 - p2)) / n2);
  if (se === 0) return 0;
  const z = Math.abs(p2 - p1) / se;
  if (z > 2.58) return 99;
  if (z > 1.96) return 95;
  if (z > 1.645) return 90;
  return Math.round(z * 35);
}

function ExperimentCard({ exp, s }) {
  const ctrlRate = exp.control.conversions / exp.control.n;
  const treatRate = exp.treatment.conversions / exp.treatment.n;
  const lift = ctrlRate > 0 ? Math.round(((treatRate - ctrlRate) / ctrlRate) * 100) : 0;
  const conf = confidence(exp.control.n, exp.control.conversions, exp.treatment.n, exp.treatment.conversions);
  const confColor = conf >= 95 ? '#34c759' : conf >= 90 ? '#ff9500' : '#ff3b30';

  const card = { background: 'rgba(255,255,255,0.72)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.6)', borderRadius: 16, boxShadow: s.shadow, padding: '22px 24px' };
  const barBase = { height: 10, borderRadius: 5, background: 'rgba(0,0,0,0.08)', overflow: 'hidden', marginTop: 6, marginBottom: 4 };

  return (
    <div style={card}>
      <div style={{ fontFamily: s.MONO, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: s.accent, marginBottom: 4 }}>A/B Test</div>
      <div style={{ fontFamily: s.DISPLAY, fontSize: 17, fontWeight: 700, color: s.text, marginBottom: 2 }}>{exp.name}</div>
      <div style={{ fontFamily: s.FONT, fontSize: 13, color: s.text3, marginBottom: 16 }}>{exp.description}</div>
      {[exp.control, exp.treatment].map((arm, i) => {
        const rate = arm.conversions / arm.n;
        return (
          <div key={i} style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontFamily: s.FONT, fontSize: 13, fontWeight: 600, color: s.text2 }}>{arm.label}</span>
              <span style={{ fontFamily: s.MONO, fontSize: 13, fontWeight: 700, color: s.text }}>{Math.round(rate * 100)}% <span style={{ fontWeight: 400, color: s.text3, fontSize: 11 }}>({arm.conversions}/{arm.n})</span></span>
            </div>
            <div style={barBase}>
              <div style={{ height: '100%', width: `${rate * 100}%`, background: i === 0 ? 'rgba(120,120,120,0.55)' : s.accent, borderRadius: 5, transition: 'width 0.6s ease' }} />
            </div>
          </div>
        );
      })}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 14, paddingTop: 14, borderTop: '1px solid rgba(0,0,0,0.07)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: s.MONO, fontSize: 20, fontWeight: 800, color: lift > 0 ? '#34c759' : '#ff3b30' }}>{lift > 0 ? '+' : ''}{lift}%</div>
          <div style={{ fontFamily: s.FONT, fontSize: 11, color: s.text3 }}>Lift</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: s.MONO, fontSize: 20, fontWeight: 800, color: confColor }}>{conf}%</div>
          <div style={{ fontFamily: s.FONT, fontSize: 11, color: s.text3 }}>Confidence</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: s.MONO, fontSize: 20, fontWeight: 800, color: s.text }}>{exp.control.n + exp.treatment.n}</div>
          <div style={{ fontFamily: s.FONT, fontSize: 11, color: s.text3 }}>Sample</div>
        </div>
      </div>
    </div>
  );
}

// ─── Churn Waterfall ─────────────────────────────────────────────────────────

function ChurnWaterfall({ s }) {
  const bars = [
    { label: 'Starting', value: 214, type: 'base', cumulative: 214 },
    { label: 'New Joins', value: 38, type: 'add', cumulative: 252 },
    { label: 'Reactivated', value: 17, type: 'add', cumulative: 269 },
    { label: 'Churned', value: -43, type: 'loss', cumulative: 226 },
    { label: 'Current', value: 226, type: 'base', cumulative: 226 },
  ];

  const maxVal = 300;
  const chartH = 160;
  const barW = 54;
  const gap = 18;
  const totalW = bars.length * (barW + gap) - gap;

  return (
    <div style={{ background: 'rgba(255,255,255,0.72)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.6)', borderRadius: 16, boxShadow: s.shadow, padding: '28px 32px' }}>
      <div style={{ fontFamily: s.MONO, fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: s.accent, marginBottom: 6 }}>Churn Waterfall</div>
      <div style={{ fontFamily: s.DISPLAY, fontSize: 22, fontWeight: 700, color: s.text, marginBottom: 4 }}>Client Flow — Last 90 Days</div>
      <div style={{ fontFamily: s.FONT, fontSize: 14, color: s.text3, marginBottom: 24 }}>Net movement in active client base</div>

      <svg width="100%" viewBox={`0 0 ${totalW + 20} ${chartH + 40}`} style={{ overflow: 'visible', maxWidth: 560 }}>
        {bars.map((bar, i) => {
          const x = i * (barW + gap) + 10;
          const isLoss = bar.type === 'loss';
          const isAdd = bar.type === 'add';
          const absVal = Math.abs(bar.value);
          const barH = (absVal / maxVal) * chartH;

          let yBase;
          if (bar.type === 'base') {
            yBase = chartH - (bar.cumulative / maxVal) * chartH;
          } else if (isAdd) {
            const prev = bars[i - 1].cumulative;
            yBase = chartH - (prev / maxVal) * chartH - barH;
          } else {
            yBase = chartH - (bar.cumulative / maxVal) * chartH;
          }

          const fill = bar.type === 'base' ? 'rgba(100,116,139,0.7)' : isAdd ? 'rgba(52,199,89,0.78)' : 'rgba(255,59,48,0.75)';

          return (
            <g key={bar.label}>
              <rect x={x} y={yBase} width={barW} height={barH} rx={5} fill={fill} />
              <text x={x + barW / 2} y={yBase - 6} textAnchor="middle" style={{ fontFamily: s.MONO, fontSize: 12, fontWeight: 700, fill: s.text }}>
                {isLoss ? '' : ''}{isAdd ? '+' : ''}{bar.value}
              </text>
              <text x={x + barW / 2} y={chartH + 18} textAnchor="middle" style={{ fontFamily: s.FONT, fontSize: 11, fill: s.text3 }}>{bar.label}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ─── Risk Segments Donut ─────────────────────────────────────────────────────

const SEGMENTS = [
  { label: 'Loyal', count: 74, color: '#34c759' },
  { label: 'Engaged', count: 58, color: '#30b0c7' },
  { label: 'Cooling Off', count: 47, color: '#ff9500' },
  { label: 'At Risk', count: 31, color: '#ff6b35' },
  { label: 'Churned', count: 43, color: '#ff3b30' },
];

function RiskDonut({ s }) {
  const [hovered, setHovered] = useState(null);
  const total = SEGMENTS.reduce((a, b) => a + b.count, 0);

  const slices = useMemo(() => {
    let cumAngle = -Math.PI / 2;
    return SEGMENTS.map(seg => {
      const angle = (seg.count / total) * 2 * Math.PI;
      const x1 = 80 + 60 * Math.cos(cumAngle);
      const y1 = 80 + 60 * Math.sin(cumAngle);
      const x2 = 80 + 60 * Math.cos(cumAngle + angle);
      const y2 = 80 + 60 * Math.sin(cumAngle + angle);
      const xi1 = 80 + 38 * Math.cos(cumAngle);
      const yi1 = 80 + 38 * Math.sin(cumAngle);
      const xi2 = 80 + 38 * Math.cos(cumAngle + angle);
      const yi2 = 80 + 38 * Math.sin(cumAngle + angle);
      const large = angle > Math.PI ? 1 : 0;
      const path = `M ${xi1} ${yi1} A 38 38 0 ${large} 1 ${xi2} ${yi2} L ${x2} ${y2} A 60 60 0 ${large} 0 ${x1} ${y1} Z`;
      const slice = { ...seg, path, startAngle: cumAngle, angle };
      cumAngle += angle;
      return slice;
    });
  }, [total]);

  const hov = hovered != null ? SEGMENTS[hovered] : null;

  return (
    <div style={{ background: 'rgba(255,255,255,0.72)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.6)', borderRadius: 16, boxShadow: s.shadow, padding: '28px 32px' }}>
      <div style={{ fontFamily: s.MONO, fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: s.accent, marginBottom: 6 }}>Risk Segmentation</div>
      <div style={{ fontFamily: s.DISPLAY, fontSize: 22, fontWeight: 700, color: s.text, marginBottom: 4 }}>Current Client Base</div>
      <div style={{ fontFamily: s.FONT, fontSize: 14, color: s.text3, marginBottom: 20 }}>Breakdown by engagement level</div>
      <div style={{ display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' }}>
        <svg width={160} height={160} style={{ flexShrink: 0 }}>
          {slices.map((slice, i) => (
            <path
              key={slice.label}
              d={slice.path}
              fill={slice.color}
              opacity={hovered == null || hovered === i ? 1 : 0.4}
              style={{ cursor: 'pointer', transition: 'opacity 0.2s' }}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            />
          ))}
          {hov ? (
            <>
              <text x={80} y={75} textAnchor="middle" style={{ fontFamily: s.MONO, fontSize: 22, fontWeight: 800, fill: hov.color }}>{hov.count}</text>
              <text x={80} y={94} textAnchor="middle" style={{ fontFamily: s.FONT, fontSize: 11, fill: '#666' }}>{hov.label}</text>
            </>
          ) : (
            <>
              <text x={80} y={75} textAnchor="middle" style={{ fontFamily: s.MONO, fontSize: 22, fontWeight: 800, fill: s.text }}>{total}</text>
              <text x={80} y={94} textAnchor="middle" style={{ fontFamily: s.FONT, fontSize: 11, fill: '#666' }}>Total</text>
            </>
          )}
        </svg>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, minWidth: 160 }}>
          {SEGMENTS.map((seg, i) => (
            <div key={seg.label} style={{ display: 'flex', alignItems: 'center', gap: 10, opacity: hovered == null || hovered === i ? 1 : 0.45, cursor: 'pointer', transition: 'opacity 0.2s' }} onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: seg.color, flexShrink: 0 }} />
              <span style={{ fontFamily: s.FONT, fontSize: 13, color: s.text2, flex: 1 }}>{seg.label}</span>
              <span style={{ fontFamily: s.MONO, fontSize: 13, fontWeight: 700, color: s.text }}>{seg.count}</span>
              <span style={{ fontFamily: s.MONO, fontSize: 11, color: s.text3, minWidth: 36, textAlign: 'right' }}>{Math.round(seg.count / total * 100)}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Predictive Timeline ─────────────────────────────────────────────────────

const AT_RISK_CLIENTS = [
  { id: 1, name: 'Sarah M.', lastVisit: '18 days ago', predictedChurn: '~12 days', weeklyVisits: [2, 2, 1, 2, 1, 1, 1, 0, 1, 0, 0, 0] },
  { id: 2, name: 'Jordan K.', lastVisit: '24 days ago', predictedChurn: '~6 days', weeklyVisits: [3, 2, 3, 2, 2, 1, 2, 1, 1, 0, 1, 0] },
  { id: 3, name: 'Alex T.', lastVisit: '31 days ago', predictedChurn: '~3 days', weeklyVisits: [2, 1, 2, 2, 1, 1, 0, 1, 0, 0, 0, 0] },
];

function EngagementLine({ data, projected, s }) {
  const w = 280, h = 80, pad = 14;
  const plotW = w - pad * 2, plotH = h - pad * 2;
  const maxV = Math.max(...data, ...projected, 1);
  const allPoints = [...data, ...projected];
  const pts = allPoints.map((v, i) => {
    const x = pad + (i / (allPoints.length - 1)) * plotW;
    const y = h - pad - (v / maxV) * plotH;
    return [x, y];
  });
  const realPts = pts.slice(0, data.length);
  const projPts = pts.slice(data.length - 1);
  const areaPath = `M ${realPts[0][0]} ${h - pad} ` + realPts.map(([x, y]) => `L ${x} ${y}`).join(' ') + ` L ${realPts[realPts.length - 1][0]} ${h - pad} Z`;
  const linePath = realPts.map(([x, y], i) => (i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`)).join(' ');
  const projPath = projPts.map(([x, y], i) => (i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`)).join(' ');

  return (
    <svg width={w} height={h} style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={s.accent} stopOpacity={0.22} />
          <stop offset="100%" stopColor={s.accent} stopOpacity={0.02} />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#areaGrad)" />
      <path d={linePath} fill="none" stroke={s.accent} strokeWidth={2} strokeLinejoin="round" />
      <path d={projPath} fill="none" stroke="#ff3b30" strokeWidth={2} strokeDasharray="4 3" strokeLinejoin="round" />
      {realPts.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={3} fill={s.accent} />
      ))}
    </svg>
  );
}

function PredictiveTimeline({ s }) {
  const [selected, setSelected] = useState(0);
  const client = AT_RISK_CLIENTS[selected];

  // simple projected: linear decay from last 3 weeks
  const projected = useMemo(() => {
    const recent = client.weeklyVisits.slice(-3);
    const avg = recent.reduce((a, b) => a + b, 0) / 3;
    const slope = (recent[2] - recent[0]) / 2;
    return Array.from({ length: 5 }, (_, i) => Math.max(0, avg + slope * (i + 1)));
  }, [client]);

  return (
    <div style={{ background: 'rgba(255,255,255,0.72)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.6)', borderRadius: 16, boxShadow: s.shadow, padding: '28px 32px' }}>
      <div style={{ fontFamily: s.MONO, fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: s.accent, marginBottom: 6 }}>Predictive Engine</div>
      <div style={{ fontFamily: s.DISPLAY, fontSize: 22, fontWeight: 700, color: s.text, marginBottom: 4 }}>At-Risk Client Timeline</div>
      <div style={{ fontFamily: s.FONT, fontSize: 14, color: s.text3, marginBottom: 20 }}>12-week engagement history + projected trend</div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {AT_RISK_CLIENTS.map((c, i) => (
          <button
            key={c.id}
            onClick={() => setSelected(i)}
            style={{ padding: '7px 16px', borderRadius: 20, border: selected === i ? `1.5px solid ${s.accent}` : '1.5px solid rgba(0,0,0,0.12)', background: selected === i ? `${s.accent}18` : 'transparent', fontFamily: s.FONT, fontSize: 13, fontWeight: 600, color: selected === i ? s.accent : s.text2, cursor: 'pointer', transition: 'all 0.18s' }}
          >
            {c.name}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <div style={{ flex: 1, minWidth: 280 }}>
          <div style={{ marginBottom: 8 }}>
            <EngagementLine data={client.weeklyVisits} projected={projected} s={s} />
          </div>
          <div style={{ display: 'flex', gap: 16, marginTop: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 18, height: 2, background: s.accent, borderRadius: 1 }} />
              <span style={{ fontFamily: s.FONT, fontSize: 11, color: s.text3 }}>Actual</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 18, height: 2, background: '#ff3b30', borderRadius: 1, backgroundImage: 'repeating-linear-gradient(90deg, #ff3b30 0 4px, transparent 4px 7px)' }} />
              <span style={{ fontFamily: s.FONT, fontSize: 11, color: s.text3 }}>Projected</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 180 }}>
          {[
            { label: 'Last Visit', value: client.lastVisit, color: s.text },
            { label: 'Predicted Churn', value: client.predictedChurn, color: '#ff3b30' },
            { label: 'Risk Score', value: `${Math.round(78 + selected * 9)}/100`, color: '#ff6b35' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.07)' }}>
              <div style={{ fontFamily: s.MONO, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: s.text3, marginBottom: 3 }}>{label}</div>
              <div style={{ fontFamily: s.MONO, fontSize: 16, fontWeight: 800, color }}>{value}</div>
            </div>
          ))}
          <button style={{ marginTop: 4, padding: '10px 16px', borderRadius: 10, border: 'none', background: s.accent, color: '#fff', fontFamily: s.FONT, fontSize: 13, fontWeight: 700, cursor: 'pointer', letterSpacing: '0.01em' }}>
            Send Outreach
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Root Page ────────────────────────────────────────────────────────────────

export default function CohortAnalysis() {
  const s = useStyles();

  return (
    <div style={{ padding: '40px 32px', maxWidth: 1100, margin: '0 auto' }}>
      {/* Page Header */}
      <div style={{ marginBottom: 36 }}>
        <div style={{ fontFamily: s.MONO, fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: s.accent, marginBottom: 8 }}>Advanced Analytics</div>
        <h1 style={{ fontFamily: s.DISPLAY, fontSize: 34, fontWeight: 800, color: s.text, margin: '0 0 10px' }}>Churn Prevention</h1>
        <p style={{ fontFamily: s.FONT, fontSize: 16, color: s.text3, margin: 0, maxWidth: 540 }}>Cohort analysis, intervention experiments, and predictive risk modeling to retain your most valuable clients.</p>
      </div>

      {/* Row 1: Cohort Matrix */}
      <div style={{ marginBottom: 24 }}>
        <CohortMatrix s={s} />
      </div>

      {/* Row 2: Waterfall + Donut */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24, marginBottom: 24 }}>
        <ChurnWaterfall s={s} />
        <RiskDonut s={s} />
      </div>

      {/* Row 3: A/B Experiments */}
      <div style={{ marginBottom: 8 }}>
        <div style={{ fontFamily: s.MONO, fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: s.accent, marginBottom: 14 }}>Intervention Experiments</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, marginBottom: 24 }}>
        {EXPERIMENTS.map(exp => <ExperimentCard key={exp.id} exp={exp} s={s} />)}
      </div>

      {/* Row 4: Predictive Timeline */}
      <PredictiveTimeline s={s} />
    </div>
  );
}
