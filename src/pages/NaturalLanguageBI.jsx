import { useState, useMemo, useCallback } from 'react';
import { useStyles } from '../theme';
import { getPatients, getAppointments, getServices, getProviders, getInventory } from '../data/store';

// ── helpers ────────────────────────────────────────────────────────────────

function fmt$(n) { return '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }); }
function fmtPct(n) { return Math.round(n) + '%'; }
function daysAgo(n) { const d = new Date(); d.setDate(d.getDate() - n); return d; }
function toDateStr(d) { return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); }

function parseDate(d) {
  if (!d) return null;
  const v = new Date(d);
  return isNaN(v.getTime()) ? null : v;
}

function periodLabel(days) {
  if (days <= 7) return 'this week';
  if (days <= 31) return 'last month';
  if (days <= 92) return 'this quarter';
  return 'this year';
}

// ── chart components (pure SVG) ────────────────────────────────────────────

function BarChart({ data, color = '#8B5CF6', height = 160 }) {
  if (!data?.length) return null;
  const max = Math.max(...data.map(d => d.value), 1);
  const w = 480, barW = Math.max(6, Math.floor((w - 40) / data.length) - 4);
  return (
    <svg viewBox={`0 0 ${w} ${height + 32}`} style={{ width: '100%', overflow: 'visible' }}>
      {data.map((d, i) => {
        const bh = Math.max(3, (d.value / max) * height);
        const x = 20 + i * ((w - 40) / data.length);
        const y = height - bh;
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={bh} rx={3} fill={color} opacity={0.85} />
            <text x={x + barW / 2} y={height + 14} textAnchor="middle" fontSize={9} fill="#94a3b8">{d.label}</text>
            {bh > 18 && (
              <text x={x + barW / 2} y={y + 12} textAnchor="middle" fontSize={9} fill="#fff" fontWeight="600">
                {d.value > 999 ? fmt$(d.value) : d.value}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

function HBarChart({ data, color = '#8B5CF6' }) {
  if (!data?.length) return null;
  const max = Math.max(...data.map(d => d.value), 1);
  const rowH = 28, w = 440;
  return (
    <svg viewBox={`0 0 ${w} ${data.length * rowH + 8}`} style={{ width: '100%' }}>
      {data.map((d, i) => {
        const bw = Math.max(4, (d.value / max) * (w - 130));
        const y = i * rowH + 6;
        return (
          <g key={i}>
            <text x={0} y={y + 13} fontSize={11} fill="#64748b">{d.label}</text>
            <rect x={120} y={y} width={bw} height={16} rx={3} fill={color} opacity={0.8} />
            <text x={124 + bw} y={y + 13} fontSize={10} fill="#94a3b8" style={{ fontFamily: 'JetBrains Mono' }}>
              {typeof d.value === 'number' && d.value < 2 ? fmtPct(d.value * 100) : fmtPct(d.value)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function LineChart({ data, color = '#8B5CF6', height = 120 }) {
  if (!data?.length) return null;
  const max = Math.max(...data.map(d => d.value), 1);
  const w = 480, pad = 20;
  const pts = data.map((d, i) => {
    const x = pad + i * ((w - pad * 2) / Math.max(data.length - 1, 1));
    const y = height - pad - (d.value / max) * (height - pad * 2);
    return { x, y, ...d };
  });
  const poly = pts.map(p => `${p.x},${p.y}`).join(' ');
  const area = `M${pts[0]?.x},${height - pad} ` + pts.map(p => `L${p.x},${p.y}`).join(' ') + ` L${pts[pts.length - 1]?.x},${height - pad} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${height + 20}`} style={{ width: '100%' }}>
      <defs>
        <linearGradient id="lg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#lg)" />
      <polyline points={poly} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r={4} fill={color} />
          <text x={p.x} y={height + 14} textAnchor="middle" fontSize={9} fill="#94a3b8">{p.label}</text>
        </g>
      ))}
    </svg>
  );
}

// ── query engine ───────────────────────────────────────────────────────────

function processQuery(query, patients, appointments, services, providers) {
  const q = query.toLowerCase();
  const now = new Date();

  // resolve period from query
  let periodDays = 31;
  if (q.includes('week')) periodDays = 7;
  else if (q.includes('quarter')) periodDays = 92;
  else if (q.includes('year')) periodDays = 365;
  const since = daysAgo(periodDays);

  const recent = appointments.filter(a => {
    const d = parseDate(a.date || a.scheduledAt || a.createdAt);
    return d && d >= since;
  });

  const completed = recent.filter(a =>
    !a.status || a.status === 'completed' || a.status === 'checked_in' || a.status === 'done'
  );

  const svcMap = Object.fromEntries((services || []).map(s => [s.id, s]));
  const provMap = Object.fromEntries((providers || []).map(p => [p.id, p]));
  const patMap = Object.fromEntries((patients || []).map(p => [p.id, p]));

  const getPrice = (appt) => {
    const svc = svcMap[appt.serviceId];
    return svc?.price || svc?.cost || 20;
  };

  // ── location / performance query ──
  if (q.includes('how did') || q.includes('performance') || q.includes('location') ||
      (q.includes('revenue') && !q.includes('trend') && !q.includes('quarter'))) {
    const loc = q.match(/downtown|westside|north studio/i)?.[0] || null;
    const subset = loc
      ? completed.filter(a => (a.location || '').toLowerCase().includes(loc.toLowerCase()))
      : completed;

    const totalRevenue = subset.reduce((sum, a) => sum + getPrice(a), 0);
    const uniqueClients = new Set(subset.map(a => a.patientId || a.clientId)).size;
    const avgClassSize = subset.length > 0 ? (subset.length / Math.max(1, new Set(subset.map(a => a.date?.slice(0, 10))).size)).toFixed(1) : '0';

    // daily revenue bars
    const byDay = {};
    subset.forEach(a => {
      const day = (a.date || a.scheduledAt || '').slice(0, 10);
      if (day) byDay[day] = (byDay[day] || 0) + getPrice(a);
    });
    const chartData = Object.entries(byDay).sort().slice(-14).map(([d, v]) => ({
      label: toDateStr(d), value: Math.round(v)
    }));

    const topSvc = (() => {
      const cnt = {};
      subset.forEach(a => { const nm = svcMap[a.serviceId]?.name || 'Class'; cnt[nm] = (cnt[nm] || 0) + 1; });
      return Object.entries(cnt).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Reformer';
    })();

    const locLabel = loc ? loc.charAt(0).toUpperCase() + loc.slice(1) : 'Your studio';
    const sqlStr = `SELECT SUM(s.price) AS revenue, COUNT(DISTINCT a.patient_id) AS clients\nFROM appointments a\nJOIN services s ON a.service_id = s.id\n${loc ? `WHERE a.location ILIKE '%${loc}%'\n  AND ` : 'WHERE '}a.date >= '${since.toISOString().slice(0, 10)}'\n  AND a.status = 'completed'`;

    return {
      type: 'performance',
      summary: `${locLabel} had a ${totalRevenue > 5000 ? 'strong' : 'steady'} ${periodLabel(periodDays)} with ${fmt$(totalRevenue)} in revenue across ${subset.length} sessions. Your average class size was ${avgClassSize} clients, and ${topSvc} was the most popular class type.`,
      stats: [
        { label: 'Total Revenue', value: fmt$(totalRevenue), icon: '💰' },
        { label: 'Sessions', value: subset.length, icon: '🗓' },
        { label: 'Unique Clients', value: uniqueClients, icon: '👥' },
        { label: 'Avg Class Size', value: avgClassSize, icon: '📊' },
      ],
      chart: { type: 'bar', data: chartData, label: 'Daily Revenue' },
      sql: sqlStr,
    };
  }

  // ── top clients ──
  if (q.includes('top') && (q.includes('client') || q.includes('active')) || q.includes('most active')) {
    const counts = {};
    const spend = {};
    appointments.forEach(a => {
      const id = a.patientId || a.clientId;
      if (!id) return;
      counts[id] = (counts[id] || 0) + 1;
      spend[id] = (spend[id] || 0) + getPrice(a);
    });
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([id, visits]) => ({
      name: patMap[id]?.name || patMap[id]?.firstName + ' ' + (patMap[id]?.lastName || '') || 'Client',
      visits,
      spend: spend[id] || 0,
      membership: patMap[id]?.membershipType || patMap[id]?.plan || 'Drop-in',
    }));

    const sqlStr = `SELECT p.name, COUNT(a.id) AS visits, SUM(s.price) AS spend\nFROM appointments a\nJOIN patients p ON a.patient_id = p.id\nJOIN services s ON a.service_id = s.id\nWHERE a.status = 'completed'\nGROUP BY p.id\nORDER BY visits DESC\nLIMIT 10`;

    return {
      type: 'top_clients',
      summary: `Your most loyal clients are visiting ${top[0]?.visits || 0}+ times. The top 8 clients account for ${fmt$(top.reduce((s, c) => s + c.spend, 0))} in lifetime spend — a strong signal for retention focus.`,
      list: top,
      sql: sqlStr,
    };
  }

  // ── fill rate / popular classes ──
  if (q.includes('fill rate') || q.includes('popular class') || q.includes('best class') || q.includes('highest fill')) {
    const capacity = 12;
    const byService = {};
    completed.forEach(a => {
      const nm = svcMap[a.serviceId]?.name || 'Class';
      byService[nm] = (byService[nm] || 0) + 1;
    });
    const uniqueDates = new Set(completed.map(a => a.date?.slice(0, 10))).size || 1;
    const chartData = Object.entries(byService)
      .map(([label, count]) => ({ label, value: Math.min(100, Math.round((count / uniqueDates / capacity) * 100)) }))
      .sort((a, b) => b.value - a.value).slice(0, 8);

    const best = chartData[0];
    const sqlStr = `SELECT s.name, COUNT(a.id)::float / (${capacity} * COUNT(DISTINCT a.date)) AS fill_rate\nFROM appointments a\nJOIN services s ON a.service_id = s.id\nWHERE a.date >= '${since.toISOString().slice(0, 10)}'\nGROUP BY s.id\nORDER BY fill_rate DESC`;

    return {
      type: 'fill_rate',
      summary: `${best?.label || 'Reformer'} leads with a ${best?.value || 0}% fill rate ${periodLabel(periodDays)}. Classes with under 60% fill rate may benefit from schedule changes or promotional push.`,
      chart: { type: 'hbar', data: chartData, label: 'Fill Rate by Class' },
      sql: sqlStr,
    };
  }

  // ── revenue trend ──
  if (q.includes('trend') || (q.includes('revenue') && (q.includes('quarter') || q.includes('week') || q.includes('month')))) {
    const byWeek = {};
    completed.forEach(a => {
      const d = parseDate(a.date || a.scheduledAt);
      if (!d) return;
      const wk = Math.floor((now - d) / (7 * 864e5));
      const label = wk === 0 ? 'This wk' : wk === 1 ? 'Last wk' : `${wk}wk ago`;
      byWeek[wk] = { label, value: (byWeek[wk]?.value || 0) + getPrice(a) };
    });
    const chartData = Object.entries(byWeek).sort((a, b) => Number(b[0]) - Number(a[0])).slice(0, 8).reverse()
      .map(([, v]) => ({ label: v.label, value: Math.round(v.value) }));

    const latest = chartData[chartData.length - 1]?.value || 0;
    const prev = chartData[chartData.length - 2]?.value || 0;
    const delta = prev > 0 ? Math.round(((latest - prev) / prev) * 100) : 0;

    const sqlStr = `SELECT DATE_TRUNC('week', a.date) AS week, SUM(s.price) AS revenue\nFROM appointments a\nJOIN services s ON a.service_id = s.id\nWHERE a.status = 'completed'\n  AND a.date >= '${since.toISOString().slice(0, 10)}'\nGROUP BY week\nORDER BY week`;

    return {
      type: 'revenue_trend',
      summary: `Revenue is ${delta >= 0 ? 'up' : 'down'} ${Math.abs(delta)}% week-over-week. This week is tracking at ${fmt$(latest)} — ${delta >= 5 ? 'excellent momentum' : delta >= 0 ? 'steady growth' : 'worth investigating'}. ${chartData.length > 1 ? `Total over ${periodLabel(periodDays)}: ${fmt$(chartData.reduce((s, d) => s + d.value, 0))}.` : ''}`,
      chart: { type: 'line', data: chartData, label: 'Weekly Revenue' },
      stats: [
        { label: 'This Week', value: fmt$(latest), icon: '📈' },
        { label: 'vs Last Week', value: (delta >= 0 ? '+' : '') + delta + '%', icon: delta >= 0 ? '🟢' : '🔴' },
      ],
      sql: sqlStr,
    };
  }

  // ── instructor / rebook rate ──
  if (q.includes('instructor') || q.includes('rebook') || q.includes('provider') || q.includes('best instructor')) {
    const byProv = {};
    completed.forEach(a => {
      const id = a.providerId || a.instructorId;
      const name = provMap[id]?.name || provMap[id]?.firstName || `Instructor ${id || '?'}`;
      if (!byProv[name]) byProv[name] = { classes: 0, revenue: 0, clients: new Set() };
      byProv[name].classes++;
      byProv[name].revenue += getPrice(a);
      byProv[name].clients.add(a.patientId || a.clientId);
    });
    const rows = Object.entries(byProv).map(([name, d]) => ({
      name, classes: d.classes, revenue: d.revenue, clients: d.clients.size,
      fillRate: Math.min(100, Math.round((d.classes / Math.max(1, d.classes / 10)) * 10)),
    })).sort((a, b) => b.revenue - a.revenue);

    const top = rows[0];
    const sqlStr = `SELECT p.name, COUNT(a.id) AS classes, SUM(s.price) AS revenue,\n  COUNT(DISTINCT a.patient_id) AS unique_clients\nFROM appointments a\nJOIN providers p ON a.provider_id = p.id\nJOIN services s ON a.service_id = s.id\nWHERE a.status = 'completed'\nGROUP BY p.id\nORDER BY revenue DESC`;

    return {
      type: 'instructors',
      summary: `${top?.name || 'Your top instructor'} leads ${periodLabel(periodDays)} with ${fmt$(top?.revenue || 0)} across ${top?.classes || 0} sessions and ${top?.clients || 0} unique clients. Consider recognizing top performers to boost retention.`,
      table: rows.slice(0, 8),
      sql: sqlStr,
    };
  }

  // ── new clients ──
  if (q.includes('new client') || q.includes('joined') || q.includes('sign') || q.includes('onboard')) {
    const newOnes = patients.filter(p => {
      const d = parseDate(p.createdAt || p.joinedAt);
      return d && d >= since;
    });
    const sqlStr = `SELECT name, email, created_at\nFROM patients\nWHERE created_at >= '${since.toISOString().slice(0, 10)}'\nORDER BY created_at DESC`;
    return {
      type: 'new_clients',
      summary: `${newOnes.length} new clients joined ${periodLabel(periodDays)}. ${newOnes.length > 10 ? 'Strong acquisition — make sure your onboarding sequence fires within 24 hours.' : newOnes.length > 3 ? 'Solid growth. A welcome series can convert these leads to regulars.' : 'Slower intake this period. Consider a referral push or intro offer.'}`,
      stats: [{ label: 'New Clients', value: newOnes.length, icon: '🌟' }],
      list_simple: newOnes.slice(0, 10).map(p => ({
        name: p.name || `${p.firstName || ''} ${p.lastName || ''}`.trim() || 'New Client',
        sub: `Joined ${toDateStr(p.createdAt || p.joinedAt)}`,
      })),
      sql: sqlStr,
    };
  }

  // ── churn / at risk ──
  if (q.includes('churn') || q.includes('at risk') || q.includes('lapsed') || q.includes('inactive')) {
    const cutoff30 = daysAgo(30);
    const cutoff90 = daysAgo(90);
    const clientActivity = {};
    appointments.forEach(a => {
      const id = a.patientId || a.clientId;
      if (!id) return;
      const d = parseDate(a.date || a.scheduledAt);
      if (!d) return;
      if (!clientActivity[id]) clientActivity[id] = { last: d, total: 0 };
      if (d > clientActivity[id].last) clientActivity[id].last = d;
      clientActivity[id].total++;
    });
    const atRisk = Object.entries(clientActivity)
      .filter(([, v]) => v.total >= 2 && v.last < cutoff30)
      .map(([id, v]) => ({
        name: patMap[id]?.name || `${patMap[id]?.firstName || ''} ${patMap[id]?.lastName || ''}`.trim() || 'Client',
        lastVisit: toDateStr(v.last),
        totalVisits: v.total,
        daysAbsent: Math.floor((now - v.last) / 864e5),
      }))
      .sort((a, b) => b.daysAbsent - a.daysAbsent).slice(0, 10);

    const sqlStr = `SELECT p.name, MAX(a.date) AS last_visit, COUNT(a.id) AS total_visits,\n  CURRENT_DATE - MAX(a.date) AS days_absent\nFROM patients p\nJOIN appointments a ON a.patient_id = p.id\nGROUP BY p.id\nHAVING COUNT(a.id) >= 2\n  AND MAX(a.date) < CURRENT_DATE - INTERVAL '30 days'\nORDER BY days_absent DESC`;

    return {
      type: 'churn',
      summary: `${atRisk.length} established clients haven't been in for 30+ days. These are high-value re-engagement targets — a personalized "we miss you" text can recover 20–40% of lapsed regulars.`,
      at_risk: atRisk,
      sql: sqlStr,
    };
  }

  // ── avg class size / default ──
  const avgSize = completed.length > 0
    ? (completed.length / Math.max(1, new Set(completed.map(a => a.date?.slice(0, 10))).size)).toFixed(1)
    : '—';

  return {
    type: 'class_size',
    summary: `Average class size is ${avgSize} clients per session ${periodLabel(periodDays)}, based on ${completed.length} completed appointments. Aim for 10+ for strong unit economics on group classes.`,
    stats: [
      { label: 'Avg Class Size', value: avgSize, icon: '👥' },
      { label: 'Total Sessions', value: completed.length, icon: '🗓' },
    ],
    sql: `SELECT AVG(daily_count) AS avg_class_size\nFROM (\n  SELECT date, COUNT(*) AS daily_count\n  FROM appointments\n  WHERE status = 'completed'\n    AND date >= '${since.toISOString().slice(0, 10)}'\n  GROUP BY date\n) sub`,
  };
}

// ── sub-components ──────────────────────────────────────────────────────────

function SqlBlock({ sql }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ marginTop: 12 }}>
      <button onClick={() => setOpen(o => !o)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: '#94a3b8', fontFamily: 'JetBrains Mono', padding: 0 }}>
        {open ? '▼' : '▶'} SQL equivalent
      </button>
      {open && (
        <pre style={{ marginTop: 6, padding: '10px 14px', background: 'rgba(15,23,42,0.06)', borderRadius: 8, fontSize: 11, fontFamily: 'JetBrains Mono', color: '#475569', overflowX: 'auto', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
          {sql}
        </pre>
      )}
    </div>
  );
}

function AnswerCard({ result, s }) {
  if (!result) return null;
  const card = { background: 'rgba(255,255,255,0.72)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.6)', borderRadius: 16, boxShadow: s.shadow, padding: '20px 24px', marginBottom: 16 };

  return (
    <div style={card}>
      <p style={{ fontFamily: s.FONT, fontSize: 15, color: s.text, lineHeight: 1.65, marginBottom: result.stats || result.chart || result.list || result.table ? 18 : 0 }}>
        {result.summary}
      </p>

      {result.stats && (
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: result.chart ? 16 : 0 }}>
          {result.stats.map((st, i) => (
            <div key={i} style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.15)', borderRadius: 10, padding: '10px 16px', minWidth: 110 }}>
              <div style={{ fontSize: 18, marginBottom: 2 }}>{st.icon}</div>
              <div style={{ fontFamily: s.MONO, fontSize: 18, fontWeight: 700, color: s.accent }}>{st.value}</div>
              <div style={{ fontFamily: s.FONT, fontSize: 11, color: s.text3 }}>{st.label}</div>
            </div>
          ))}
        </div>
      )}

      {result.chart?.type === 'bar' && <BarChart data={result.chart.data} color={s.accent} />}
      {result.chart?.type === 'hbar' && <HBarChart data={result.chart.data} color={s.accent} />}
      {result.chart?.type === 'line' && <LineChart data={result.chart.data} color={s.accent} />}

      {result.list && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {result.list.map((c, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px', background: i % 2 === 0 ? 'rgba(139,92,246,0.04)' : 'transparent', borderRadius: 8 }}>
              <span style={{ fontFamily: s.MONO, fontSize: 11, color: s.text3, minWidth: 20 }}>#{i + 1}</span>
              <span style={{ fontFamily: s.FONT, fontWeight: 600, color: s.text, flex: 1 }}>{c.name}</span>
              <span style={{ fontFamily: s.MONO, fontSize: 12, color: s.accent }}>{c.visits} visits</span>
              <span style={{ fontFamily: s.MONO, fontSize: 12, color: s.text2 }}>{fmt$(c.spend)}</span>
              <span style={{ fontFamily: s.FONT, fontSize: 11, color: s.text3, background: 'rgba(139,92,246,0.1)', padding: '2px 8px', borderRadius: 20 }}>{c.membership}</span>
            </div>
          ))}
        </div>
      )}

      {result.list_simple && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 8 }}>
          {result.list_simple.map((c, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, padding: '6px 10px', borderRadius: 8, background: 'rgba(139,92,246,0.04)' }}>
              <span style={{ fontFamily: s.FONT, fontWeight: 600, color: s.text, flex: 1 }}>{c.name}</span>
              <span style={{ fontFamily: s.FONT, fontSize: 12, color: s.text3 }}>{c.sub}</span>
            </div>
          ))}
        </div>
      )}

      {result.table && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: s.FONT, fontSize: 13 }}>
            <thead>
              <tr>{['Instructor', 'Sessions', 'Revenue', 'Clients'].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '6px 10px', fontFamily: s.MONO, fontSize: 10, color: s.text3, borderBottom: '1px solid rgba(139,92,246,0.12)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {result.table.map((r, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? 'rgba(139,92,246,0.03)' : 'transparent' }}>
                  <td style={{ padding: '8px 10px', fontWeight: 600, color: s.text }}>{r.name}</td>
                  <td style={{ padding: '8px 10px', fontFamily: s.MONO, color: s.text2 }}>{r.classes}</td>
                  <td style={{ padding: '8px 10px', fontFamily: s.MONO, color: s.accent }}>{fmt$(r.revenue)}</td>
                  <td style={{ padding: '8px 10px', fontFamily: s.MONO, color: s.text2 }}>{r.clients}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {result.at_risk && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {result.at_risk.map((c, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px', background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.12)', borderRadius: 8 }}>
              <span style={{ fontSize: 14 }}>⚠️</span>
              <span style={{ fontFamily: s.FONT, fontWeight: 600, color: s.text, flex: 1 }}>{c.name}</span>
              <span style={{ fontFamily: s.MONO, fontSize: 11, color: '#ef4444' }}>{c.daysAbsent}d absent</span>
              <span style={{ fontFamily: s.FONT, fontSize: 11, color: s.text3 }}>Last: {c.lastVisit}</span>
              <span style={{ fontFamily: s.MONO, fontSize: 11, color: s.text3 }}>{c.totalVisits} visits total</span>
            </div>
          ))}
        </div>
      )}

      {result.sql && <SqlBlock sql={result.sql} />}
    </div>
  );
}

// ── main component ──────────────────────────────────────────────────────────

const SUGGESTED = [
  'How did the Downtown Studio do last month?',
  'Who are my top 5 most active clients?',
  'Which classes have the highest fill rate?',
  "What's my revenue trend this quarter?",
  'Which instructor has the best rebook rate?',
  'How many new clients joined this month?',
  "What's my average class size?",
  'Show me clients at risk of churning',
];

const LOADING_STEPS = [
  'Understanding your question...',
  'Querying appointments, clients, and services...',
  'Generating insights...',
];

export default function NaturalLanguageBI() {
  const s = useStyles();
  const patients = useMemo(() => getPatients() || [], []);
  const appointments = useMemo(() => getAppointments() || [], []);
  const services = useMemo(() => getServices() || [], []);
  const providers = useMemo(() => getProviders() || [], []);
  const inventory = useMemo(() => getInventory() || [], []);

  const [query, setQuery] = useState('');
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadStep, setLoadStep] = useState(0);

  // quick insights derived from real data
  const insights = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const todayAppts = appointments.filter(a => (a.date || a.scheduledAt || '').slice(0, 10) === today);
    const bookedToday = todayAppts.length;
    const weekAgo = daysAgo(7);
    const twoWeeksAgo = daysAgo(14);
    const thisWeekRevenue = appointments.filter(a => {
      const d = parseDate(a.date || a.scheduledAt);
      return d && d >= weekAgo && (a.status === 'completed' || !a.status);
    }).reduce((sum, a) => {
      const svc = services.find(s => s.id === a.serviceId);
      return sum + (svc?.price || 20);
    }, 0);
    const lastWeekRevenue = appointments.filter(a => {
      const d = parseDate(a.date || a.scheduledAt);
      return d && d >= twoWeeksAgo && d < weekAgo && (a.status === 'completed' || !a.status);
    }).reduce((sum, a) => {
      const svc = services.find(sv => sv.id === a.serviceId);
      return sum + (svc?.price || 20);
    }, 0);
    const revDelta = lastWeekRevenue > 0 ? Math.round(((thisWeekRevenue - lastWeekRevenue) / lastWeekRevenue) * 100) : 0;
    const newThisMonth = patients.filter(p => {
      const d = parseDate(p.createdAt || p.joinedAt);
      return d && d >= daysAgo(30);
    }).length;
    return { bookedToday, thisWeekRevenue, revDelta, newThisMonth };
  }, [appointments, patients, services]);

  const submitQuery = useCallback(async (text) => {
    const q = (text || query).trim();
    if (!q) return;
    setQuery('');
    setLoading(true);
    setLoadStep(0);

    await new Promise(r => setTimeout(r, 420));
    setLoadStep(1);
    await new Promise(r => setTimeout(r, 600));
    setLoadStep(2);
    await new Promise(r => setTimeout(r, 380));

    const result = processQuery(q, patients, appointments, services, providers);
    const entry = { id: Date.now(), query: q, result, timestamp: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) };

    setHistory(h => [entry, ...h]);
    setLoading(false);
  }, [query, patients, appointments, services, providers]);

  const card = { background: 'rgba(255,255,255,0.72)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.6)', borderRadius: 16, boxShadow: s.shadow };

  return (
    <div className="nlbi-root" style={{ padding: '32px 28px', maxWidth: 1200, margin: '0 auto' }}>
      {/* header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontFamily: s.MONO, fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: s.accent, marginBottom: 8 }}>
          Natural Language BI
        </div>
        <h1 style={{ fontFamily: s.DISPLAY, fontSize: 32, fontWeight: 700, color: s.text, margin: 0, marginBottom: 8 }}>
          Ask Your Data Anything
        </h1>
        <p style={{ fontFamily: s.FONT, fontSize: 15, color: s.text2, margin: 0 }}>
          Plain-English questions. Instant answers. No spreadsheets required.
        </p>
      </div>

      <div className="nlbi-layout" style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 24, alignItems: 'start' }}>
        {/* main column */}
        <div>
          {/* query input */}
          <div style={{ ...card, padding: '20px 24px', marginBottom: 24 }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 16 }}>
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && submitQuery()}
                placeholder="Ask anything about your studio..."
                style={{ flex: 1, padding: '12px 16px', borderRadius: 10, border: `1.5px solid ${loading ? s.accent : 'rgba(139,92,246,0.2)'}`, background: 'rgba(255,255,255,0.8)', fontFamily: s.FONT, fontSize: 15, color: s.text, outline: 'none', transition: 'border-color 0.2s' }}
              />
              <button
                onClick={() => submitQuery()}
                disabled={loading || !query.trim()}
                style={{ padding: '12px 20px', borderRadius: 10, border: 'none', background: loading ? 'rgba(139,92,246,0.4)' : s.accent, color: '#fff', fontFamily: s.FONT, fontWeight: 600, fontSize: 14, cursor: loading ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap', transition: 'all 0.2s' }}
              >
                {loading ? '...' : 'Ask →'}
              </button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {SUGGESTED.map((sq, i) => (
                <button key={i} onClick={() => submitQuery(sq)} disabled={loading}
                  style={{ padding: '5px 12px', borderRadius: 20, border: '1px solid rgba(139,92,246,0.2)', background: 'rgba(139,92,246,0.05)', fontFamily: s.FONT, fontSize: 12, color: s.text2, cursor: 'pointer', transition: 'all 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(139,92,246,0.12)'; e.currentTarget.style.color = s.accent; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(139,92,246,0.05)'; e.currentTarget.style.color = s.text2; }}
                >
                  {sq}
                </button>
              ))}
            </div>
          </div>

          {/* loading state */}
          {loading && (
            <div style={{ ...card, padding: '20px 24px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', border: `3px solid rgba(139,92,246,0.2)`, borderTopColor: s.accent, animation: 'spin 0.8s linear infinite' }} />
              <div>
                {LOADING_STEPS.map((step, i) => (
                  <div key={i} style={{ fontFamily: s.FONT, fontSize: 13, color: i <= loadStep ? s.text : s.text3, marginBottom: 2, transition: 'color 0.3s' }}>
                    {i < loadStep ? '✓ ' : i === loadStep ? '› ' : '  '}{step}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* conversation history */}
          {history.length === 0 && !loading && (
            <div style={{ ...card, padding: '40px 24px', textAlign: 'center' }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>💬</div>
              <div style={{ fontFamily: s.DISPLAY, fontSize: 20, color: s.text, marginBottom: 8 }}>Your data analyst is ready</div>
              <div style={{ fontFamily: s.FONT, fontSize: 14, color: s.text3 }}>Ask a question above or click a suggested query to get started.</div>
            </div>
          )}

          {history.map(entry => (
            <div key={entry.id} style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 8 }}>
                <div style={{ fontFamily: s.DISPLAY, fontSize: 16, color: s.text, fontStyle: 'italic' }}>"{entry.query}"</div>
                <div style={{ fontFamily: s.MONO, fontSize: 10, color: s.text3 }}>{entry.timestamp}</div>
              </div>
              <AnswerCard result={entry.result} s={s} />
            </div>
          ))}
        </div>

        {/* right sidebar: quick insights */}
        <div className="nlbi-sidebar" style={{ position: 'sticky', top: 20 }}>
          <div style={{ ...card, padding: '18px 20px', marginBottom: 16 }}>
            <div style={{ fontFamily: s.MONO, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: s.accent, marginBottom: 12 }}>
              Today's Briefing
            </div>
            <div style={{ fontFamily: s.FONT, fontSize: 14, color: s.text, lineHeight: 1.6 }}>
              <strong style={{ fontFamily: s.DISPLAY }}>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</strong>
            </div>
            <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { icon: '🗓', label: 'Classes today', value: Math.max(1, Math.floor(insights.bookedToday / 8)) },
                { icon: '👥', label: 'Spots booked', value: insights.bookedToday },
                { icon: '🌟', label: 'New clients (30d)', value: insights.newThisMonth },
                { icon: '💰', label: 'Revenue this week', value: fmt$(insights.thisWeekRevenue) },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 16 }}>{item.icon}</span>
                  <span style={{ fontFamily: s.FONT, fontSize: 13, color: s.text2, flex: 1 }}>{item.label}</span>
                  <span style={{ fontFamily: s.MONO, fontSize: 13, fontWeight: 700, color: s.text }}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ ...card, padding: '18px 20px', marginBottom: 16 }}>
            <div style={{ fontFamily: s.MONO, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: s.accent, marginBottom: 12 }}>
              Alerts
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { icon: '🔥', msg: insights.revDelta >= 0 ? `Revenue up ${insights.revDelta}% vs last week` : `Revenue down ${Math.abs(insights.revDelta)}% vs last week`, color: insights.revDelta >= 0 ? '#10b981' : '#ef4444' },
                { icon: '📋', msg: `${appointments.filter(a => a.status === 'waitlisted').length || 0} clients on waitlist`, color: '#f59e0b' },
                { icon: '📦', msg: `${inventory.filter(i => (i.quantity || i.stock || 0) < 5).length || 0} inventory items low`, color: '#ef4444' },
              ].map((alert, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', padding: '8px 10px', background: 'rgba(0,0,0,0.02)', borderRadius: 8, borderLeft: `3px solid ${alert.color}` }}>
                  <span style={{ fontSize: 13 }}>{alert.icon}</span>
                  <span style={{ fontFamily: s.FONT, fontSize: 12, color: s.text2, lineHeight: 1.5 }}>{alert.msg}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ ...card, padding: '18px 20px' }}>
            <div style={{ fontFamily: s.MONO, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: s.accent, marginBottom: 12 }}>
              Data Coverage
            </div>
            {[
              { label: 'Appointments', value: appointments.length },
              { label: 'Clients', value: patients.length },
              { label: 'Services', value: services.length },
              { label: 'Providers', value: providers.length },
              { label: 'Inventory items', value: inventory.length },
            ].map((d, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontFamily: s.FONT, fontSize: 12, color: s.text3 }}>{d.label}</span>
                <span style={{ fontFamily: s.MONO, fontSize: 12, color: s.text2 }}>{d.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 768px) {
          .nlbi-root { padding: 20px 16px !important; }
          .nlbi-layout { grid-template-columns: 1fr !important; }
          .nlbi-sidebar { position: static !important; }
        }
      `}</style>
    </div>
  );
}
