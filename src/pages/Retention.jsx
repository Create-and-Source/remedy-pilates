import { useState, useEffect } from 'react';
import { useStyles } from '../theme';
import { getRetentionAlerts, updateRetentionAlert, getPatients, subscribe } from '../data/store';

export default function Retention() {
  const s = useStyles();
  const [, setTick] = useState(0);
  useEffect(() => subscribe(() => setTick(t => t + 1)), []);

  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const alerts = getRetentionAlerts();
  const clients = getPatients();

  const filtered = alerts.filter(a => {
    if (filter === 'pending' && a.status !== 'pending') return false;
    if (filter === 'contacted' && !a.contacted) return false;
    if (filter === 'high' && a.priority !== 'high') return false;
    if (search) {
      const q = search.toLowerCase();
      return a.patientName?.toLowerCase().includes(q) || a.lastService?.toLowerCase().includes(q);
    }
    return true;
  }).sort((a, b) => b.daysSince - a.daysSince);

  const pendingCount = alerts.filter(a => a.status === 'pending').length;
  const highCount = alerts.filter(a => a.priority === 'high').length;
  const contactedCount = alerts.filter(a => a.contacted).length;
  const avgDays = alerts.length > 0 ? Math.round(alerts.reduce((sum, a) => sum + a.daysSince, 0) / alerts.length) : 0;

  const markContacted = (id) => {
    updateRetentionAlert(id, { contacted: true, status: 'contacted', contactedAt: new Date().toISOString() });
  };

  const dismiss = (id) => {
    updateRetentionAlert(id, { status: 'dismissed' });
  };

  return (
    <div>
      <style>{`
        @media (max-width: 768px) {
          .ret-kpi-grid {
            grid-template-columns: 1fr 1fr !important;
          }
          .ret-card {
            flex-wrap: wrap !important;
          }
          .ret-card-actions {
            flex-direction: row !important;
            width: 100% !important;
          }
        }
        @media (max-width: 480px) {
          .ret-kpi-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ font: `600 26px ${s.FONT}`, color: s.text, marginBottom: 4 }}>Retention</h1>
        <p style={{ font: `400 14px ${s.FONT}`, color: s.text2 }}>Smart alerts for clients who need re-engagement — stop the drift</p>
      </div>

      {/* KPIs */}
      <div className="ret-kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Pending Alerts', value: pendingCount, color: pendingCount > 0 ? s.warning : s.success },
          { label: 'High Priority', value: highCount, color: highCount > 0 ? s.danger : s.success },
          { label: 'Contacted', value: contactedCount, color: s.success },
          { label: 'Avg Days Since Visit', value: `${avgDays}d`, color: avgDays > 90 ? s.danger : s.text },
        ].map(k => (
          <div key={k.label} style={{ ...s.cardStyle, padding: '16px 20px' }}>
            <div style={{ font: `400 10px ${s.MONO}`, textTransform: 'uppercase', letterSpacing: 1, color: s.text3, marginBottom: 6 }}>{k.label}</div>
            <div style={{ font: `600 24px ${s.FONT}`, color: k.color }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search clients..." style={{ ...s.input, maxWidth: 260 }} />
        <div style={{ display: 'flex', gap: 6 }}>
          {[['all', 'All'], ['pending', 'Pending'], ['high', 'High Priority'], ['contacted', 'Contacted']].map(([id, label]) => (
            <button key={id} onClick={() => setFilter(id)} style={{
              ...s.pill, padding: '7px 14px', fontSize: 12,
              background: filter === id ? s.accent : 'transparent',
              color: filter === id ? s.accentText : s.text2,
              border: filter === id ? `1px solid ${s.accent}` : '1px solid #E5E5E5',
            }}>{label}</button>
          ))}
        </div>
      </div>

      {/* Alerts List */}
      <div style={{ display: 'grid', gap: 8 }}>
        {filtered.map(alert => {
          const patient = clients.find(p => p.id === alert.patientId);
          return (
            <div key={alert.id} style={{
              ...s.cardStyle, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16,
              borderLeftWidth: 3, borderLeftStyle: 'solid',
              borderLeftColor: alert.priority === 'high' ? s.danger : alert.contacted ? s.success : s.warning,
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                background: alert.priority === 'high' ? '#FEF2F2' : '#F8F8F8',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                font: `500 14px ${s.FONT}`, color: alert.priority === 'high' ? s.danger : s.text2,
              }}>
                {alert.patientName?.split(' ').map(n => n[0]).join('')}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                  <span style={{ font: `500 14px ${s.FONT}`, color: s.text }}>{alert.patientName}</span>
                  {alert.priority === 'high' && (
                    <span style={{ padding: '2px 8px', borderRadius: 100, font: `500 9px ${s.FONT}`, textTransform: 'uppercase', background: '#FEF2F2', color: s.danger }}>High Priority</span>
                  )}
                  {alert.contacted && (
                    <span style={{ padding: '2px 8px', borderRadius: 100, font: `500 9px ${s.FONT}`, textTransform: 'uppercase', background: '#F0FDF4', color: s.success }}>Contacted</span>
                  )}
                </div>
                <div style={{ font: `400 13px ${s.FONT}`, color: s.text2 }}>{alert.suggestedAction}</div>
                <div style={{ font: `400 11px ${s.FONT}`, color: s.text3, marginTop: 2 }}>
                  Last visit: {alert.lastVisit ? new Date(alert.lastVisit + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'} — {alert.lastService}
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ font: `600 18px ${s.MONO}`, color: alert.daysSince > 100 ? s.danger : s.warning, marginBottom: 4 }}>{alert.daysSince}d</div>
                <div style={{ font: `400 10px ${s.FONT}`, color: s.text3 }}>since visit</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0 }}>
                {!alert.contacted && (
                  <>
                    <button onClick={() => markContacted(alert.id)} style={{ ...s.pillAccent, padding: '6px 12px', fontSize: 11 }}>Mark Contacted</button>
                    <button onClick={() => dismiss(alert.id)} style={{ ...s.pillGhost, padding: '4px 10px', fontSize: 10 }}>Dismiss</button>
                  </>
                )}
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div style={{ ...s.cardStyle, padding: 48, textAlign: 'center', font: `400 14px ${s.FONT}`, color: s.text3 }}>
            {filter === 'all' ? 'No retention alerts — all clients are engaged!' : 'No alerts match this filter'}
          </div>
        )}
      </div>
    </div>
  );
}
