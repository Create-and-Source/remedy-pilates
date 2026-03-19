import { useState, useMemo } from 'react';
import { useStyles } from '../theme';
import { getInventory, getAppointments } from '../data/store';

// ── Predictive Inventory ──
// Time-series forecasting for equipment wear, retail restocks, seasonal demand
// Uses appointment volume as demand signal

const WEAR_RATES = {
  'Equipment': { lifespan: 365 * 3, unit: 'years', check: 90 }, // 3 year lifespan, check every 90 days
  'Props': { lifespan: 365, unit: 'year', check: 30 },
  'Retail': { lifespan: null, unit: null, check: 14 }, // restock based on sales velocity
  'Parts': { lifespan: 180, unit: 'months', check: 60 },
};

function forecastDemand(appointments, daysAhead = 30) {
  const now = new Date();
  // Compute weekly class volumes for last 8 weeks
  const weeklyVolumes = [];
  for (let w = 7; w >= 0; w--) {
    const start = new Date(now); start.setDate(start.getDate() - w * 7);
    const end = new Date(start); end.setDate(end.getDate() + 7);
    const count = appointments.filter(a =>
      a.status !== 'cancelled' && new Date(a.date) >= start && new Date(a.date) < end
    ).length;
    weeklyVolumes.push(count);
  }

  // Simple linear regression for trend
  const n = weeklyVolumes.length;
  const xMean = (n - 1) / 2;
  const yMean = weeklyVolumes.reduce((s, v) => s + v, 0) / n;
  let num = 0, den = 0;
  weeklyVolumes.forEach((y, x) => {
    num += (x - xMean) * (y - yMean);
    den += (x - xMean) ** 2;
  });
  const slope = den > 0 ? num / den : 0;

  // Forecast next 4 weeks
  const forecast = [];
  for (let w = 1; w <= Math.ceil(daysAhead / 7); w++) {
    forecast.push(Math.max(0, Math.round(yMean + slope * (n + w - 1 - xMean))));
  }

  return { weeklyVolumes, forecast, trend: slope > 0.5 ? 'up' : slope < -0.5 ? 'down' : 'stable', slope };
}

function predictRestock(item, demand) {
  const velocity = demand.weeklyVolumes.length > 0
    ? demand.weeklyVolumes.reduce((s, v) => s + v, 0) / demand.weeklyVolumes.length
    : 0;

  if (item.category === 'Retail') {
    // Retail: estimate units sold per week based on class volume
    const salesRate = Math.max(0.5, velocity * 0.15); // ~15% of class-goers buy retail
    const weeksUntilEmpty = item.quantity > 0 ? item.quantity / salesRate : 0;
    const restockDate = new Date();
    restockDate.setDate(restockDate.getDate() + Math.floor(weeksUntilEmpty * 7));
    return {
      salesRate: salesRate.toFixed(1),
      weeksUntilEmpty: Math.floor(weeksUntilEmpty),
      restockDate,
      urgency: weeksUntilEmpty <= 2 ? 'critical' : weeksUntilEmpty <= 4 ? 'soon' : 'ok',
    };
  }

  // Equipment/Props: wear-based
  const wear = WEAR_RATES[item.category] || WEAR_RATES['Equipment'];
  const usagePerWeek = velocity * 0.8; // 80% of classes use the equipment
  const totalUses = usagePerWeek * 52; // annualized
  const wearScore = wear.lifespan ? Math.min(100, Math.round((totalUses / (wear.lifespan / 7 * usagePerWeek)) * 100)) : 0;

  return {
    usagePerWeek: usagePerWeek.toFixed(0),
    wearScore,
    nextCheck: new Date(Date.now() + wear.check * 86400000),
    urgency: wearScore >= 80 ? 'critical' : wearScore >= 50 ? 'soon' : 'ok',
  };
}

function MiniChart({ data, forecast, color, width = 160, height = 48 }) {
  const all = [...data, ...forecast];
  const max = Math.max(...all, 1);
  const total = all.length;
  const barW = Math.max((width - (total - 1) * 2) / total, 4);
  return (
    <svg width={width} height={height} style={{ display: 'block' }}>
      {all.map((v, i) => {
        const h = Math.max((v / max) * (height - 8), 2);
        const isForecast = i >= data.length;
        return (
          <rect key={i} x={i * (barW + 2)} y={height - h} width={barW} height={h} rx={2}
            fill={isForecast ? color + '40' : color}
            strokeDasharray={isForecast ? '2,2' : 'none'}
            stroke={isForecast ? color : 'none'} strokeWidth={1}
          />
        );
      })}
    </svg>
  );
}

export default function SmartInventory() {
  const s = useStyles();
  const [filter, setFilter] = useState('all');
  const [expandedId, setExpandedId] = useState(null);

  const { items, demand, alerts } = useMemo(() => {
    const inventory = getInventory();
    const appointments = getAppointments();
    const dem = forecastDemand(appointments);

    const enriched = inventory.map(item => ({
      ...item,
      prediction: predictRestock(item, dem),
    }));

    const alertList = enriched.filter(i => i.prediction.urgency === 'critical' || i.prediction.urgency === 'soon')
      .sort((a, b) => (a.prediction.urgency === 'critical' ? 0 : 1) - (b.prediction.urgency === 'critical' ? 0 : 1));

    return { items: enriched, demand: dem, alerts: alertList };
  }, []);

  const filtered = filter === 'all' ? items : filter === 'alerts' ? alerts : items.filter(i => i.category === filter);

  const cardStyle = {
    background: 'rgba(255,255,255,0.72)', backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255,255,255,0.6)', borderRadius: 16,
    boxShadow: s.shadow,
  };

  const urgencyColors = { critical: '#DC2626', soon: '#D97706', ok: '#16A34A' };

  return (
    <div style={{ animation: 'fadeIn 0.5s ease' }}>
      <style>{`
        @media (max-width: 768px) {
          .si-detail-grid { grid-template-columns: 1fr 1fr !important; }
        }
      `}</style>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ font: `400 11px ${s.MONO}`, textTransform: 'uppercase', letterSpacing: 1.5, color: s.text3, marginBottom: 4 }}>
          Intelligence
        </div>
        <h1 style={{ font: `600 28px ${s.DISPLAY}`, color: s.text, margin: 0 }}>
          Smart Inventory
        </h1>
        <p style={{ font: `400 14px ${s.FONT}`, color: s.text2, margin: '6px 0 0' }}>
          Predictive restocking — demand forecasting, wear tracking, automated reorder alerts
        </p>
      </div>

      {/* Demand Forecast */}
      <div style={{ ...cardStyle, padding: 24, marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <div style={{ font: `600 15px ${s.FONT}`, color: s.text }}>Class Volume Forecast</div>
            <div style={{ font: `400 12px ${s.FONT}`, color: s.text3, marginTop: 2 }}>
              Weekly classes — history (solid) + forecast (dashed)
              <span style={{
                marginLeft: 8, padding: '2px 8px', borderRadius: 4,
                background: demand.trend === 'up' ? '#DCFCE7' : demand.trend === 'down' ? '#FEE2E2' : '#F3F4F6',
                font: `500 10px ${s.MONO}`,
                color: demand.trend === 'up' ? '#16A34A' : demand.trend === 'down' ? '#DC2626' : '#6B7280',
              }}>
                {demand.trend === 'up' ? '↑ Growing' : demand.trend === 'down' ? '↓ Declining' : '→ Stable'}
              </span>
            </div>
          </div>
          <MiniChart data={demand.weeklyVolumes} forecast={demand.forecast} color={s.accent} width={200} height={56} />
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          {demand.forecast.map((v, i) => (
            <div key={i} style={{ padding: '8px 14px', background: 'rgba(0,0,0,0.02)', borderRadius: 8, textAlign: 'center' }}>
              <div style={{ font: `600 16px ${s.FONT}`, color: s.accent }}>{v}</div>
              <div style={{ font: `400 9px ${s.MONO}`, color: s.text3 }}>Week +{i + 1}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Alerts Banner */}
      {alerts.length > 0 && (
        <div style={{
          ...cardStyle, padding: 16, marginBottom: 20,
          borderLeft: '4px solid #DC2626', background: 'rgba(254,226,226,0.3)',
        }}>
          <div style={{ font: `600 13px ${s.FONT}`, color: '#DC2626', marginBottom: 8 }}>
            {alerts.filter(a => a.prediction.urgency === 'critical').length} critical · {alerts.filter(a => a.prediction.urgency === 'soon').length} upcoming
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {alerts.slice(0, 5).map(a => (
              <span key={a.id} style={{
                padding: '4px 10px', borderRadius: 6,
                background: a.prediction.urgency === 'critical' ? '#FEE2E2' : '#FEF3C7',
                font: `400 12px ${s.FONT}`,
                color: a.prediction.urgency === 'critical' ? '#DC2626' : '#D97706',
              }}>
                {a.name} @ {a.location === 'LOC-1' ? 'Downtown Studio' : a.location === 'LOC-2' ? 'Westside Studio' : 'North Studio'}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
        {['all', 'alerts', 'Equipment', 'Props', 'Retail', 'Parts'].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: '7px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
            background: filter === f ? s.accent : 'rgba(0,0,0,0.04)',
            color: filter === f ? '#fff' : s.text2,
            font: `400 12px ${s.FONT}`, transition: 'all 0.2s', textTransform: 'capitalize',
          }}>{f === 'alerts' ? `Alerts (${alerts.length})` : f}</button>
        ))}
      </div>

      {/* Inventory Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {filtered.map(item => {
          const pred = item.prediction;
          const expanded = expandedId === item.id;
          const uc = urgencyColors[pred.urgency];
          return (
            <div key={item.id} style={{
              ...cardStyle, padding: 0, overflow: 'hidden',
              borderLeft: `4px solid ${uc}`, cursor: 'pointer',
            }} onClick={() => setExpandedId(expanded ? null : item.id)}>
              <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 10, background: uc + '15',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  font: `600 14px ${s.FONT}`, color: uc, flexShrink: 0,
                }}>{item.quantity}</div>
                <div style={{ flex: '1 1 160px', minWidth: 120 }}>
                  <div style={{ font: `500 14px ${s.FONT}`, color: s.text }}>{item.name}</div>
                  <div style={{ font: `400 11px ${s.MONO}`, color: s.text3 }}>
                    {item.category} · {item.sku} · {item.location === 'LOC-1' ? 'Downtown Studio' : item.location === 'LOC-2' ? 'Westside Studio' : 'North Studio'}
                  </div>
                </div>
                {/* Prediction summary */}
                <div style={{ textAlign: 'right' }}>
                  {item.category === 'Retail' ? (
                    <>
                      <div style={{ font: `600 13px ${s.FONT}`, color: uc }}>
                        {pred.weeksUntilEmpty <= 0 ? 'Out of stock' : `${pred.weeksUntilEmpty}w remaining`}
                      </div>
                      <div style={{ font: `400 10px ${s.MONO}`, color: s.text3 }}>{pred.salesRate}/week est. sales</div>
                    </>
                  ) : (
                    <>
                      <div style={{ font: `600 13px ${s.FONT}`, color: uc }}>
                        {pred.wearScore}% wear
                      </div>
                      <div style={{ font: `400 10px ${s.MONO}`, color: s.text3 }}>{pred.usagePerWeek} uses/week</div>
                    </>
                  )}
                </div>
                <div style={{
                  padding: '4px 10px', borderRadius: 6,
                  background: uc + '15', font: `500 10px ${s.MONO}`, color: uc,
                  textTransform: 'uppercase',
                }}>{pred.urgency}</div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={s.text3} strokeWidth="1.5" strokeLinecap="round"
                  style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }}>
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>

              {expanded && (
                <div style={{ padding: '0 18px 18px', borderTop: '1px solid rgba(0,0,0,0.04)' }}>
                  <div className="si-detail-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10, marginTop: 14 }}>
                    <div style={{ padding: 10, background: 'rgba(0,0,0,0.02)', borderRadius: 8 }}>
                      <div style={{ font: `600 14px ${s.FONT}`, color: s.text }}>{item.quantity}</div>
                      <div style={{ font: `400 9px ${s.MONO}`, color: s.text3, textTransform: 'uppercase' }}>Current Stock</div>
                    </div>
                    <div style={{ padding: 10, background: 'rgba(0,0,0,0.02)', borderRadius: 8 }}>
                      <div style={{ font: `600 14px ${s.FONT}`, color: s.text }}>{item.reorderAt}</div>
                      <div style={{ font: `400 9px ${s.MONO}`, color: s.text3, textTransform: 'uppercase' }}>Reorder Point</div>
                    </div>
                    <div style={{ padding: 10, background: 'rgba(0,0,0,0.02)', borderRadius: 8 }}>
                      <div style={{ font: `600 14px ${s.FONT}`, color: s.text }}>${((item.unitCost || 0) / 100).toLocaleString()}</div>
                      <div style={{ font: `400 9px ${s.MONO}`, color: s.text3, textTransform: 'uppercase' }}>Unit Cost</div>
                    </div>
                    {item.category === 'Retail' && pred.restockDate && (
                      <div style={{ padding: 10, background: uc + '10', borderRadius: 8 }}>
                        <div style={{ font: `600 14px ${s.FONT}`, color: uc }}>
                          {pred.restockDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </div>
                        <div style={{ font: `400 9px ${s.MONO}`, color: s.text3, textTransform: 'uppercase' }}>Est. Restock By</div>
                      </div>
                    )}
                    {item.category !== 'Retail' && (
                      <div style={{ padding: 10, background: uc + '10', borderRadius: 8 }}>
                        <div style={{ font: `600 14px ${s.FONT}`, color: uc }}>
                          {pred.nextCheck?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </div>
                        <div style={{ font: `400 9px ${s.MONO}`, color: s.text3, textTransform: 'uppercase' }}>Next Inspection</div>
                      </div>
                    )}
                  </div>
                  {item.category !== 'Retail' && (
                    <div style={{ marginTop: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ font: `400 11px ${s.MONO}`, color: s.text3 }}>Wear Level</span>
                        <span style={{ font: `600 11px ${s.MONO}`, color: uc }}>{pred.wearScore}%</span>
                      </div>
                      <div style={{ height: 8, borderRadius: 4, background: 'rgba(0,0,0,0.06)' }}>
                        <div style={{ height: 8, borderRadius: 4, width: `${pred.wearScore}%`, background: uc, transition: 'width 0.5s ease' }} />
                      </div>
                    </div>
                  )}
                  <div style={{
                    marginTop: 14, padding: 12, borderRadius: 10,
                    background: pred.urgency === 'critical' ? '#FEE2E2' : pred.urgency === 'soon' ? '#FEF3C7' : '#F0FDF4',
                    font: `400 13px ${s.FONT}`, color: uc, lineHeight: 1.5,
                  }}>
                    {pred.urgency === 'critical' && `⚠️ Action needed — ${item.category === 'Retail' ? `stock will run out in ~${pred.weeksUntilEmpty} weeks at current sales rate` : `wear level at ${pred.wearScore}% — schedule replacement`}`}
                    {pred.urgency === 'soon' && `📋 Monitor — ${item.category === 'Retail' ? `~${pred.weeksUntilEmpty} weeks of stock remaining` : `next inspection due ${pred.nextCheck?.toLocaleDateString()}`}`}
                    {pred.urgency === 'ok' && `✅ Stock levels healthy — next check ${item.category === 'Retail' ? `in ~${pred.weeksUntilEmpty} weeks` : pred.nextCheck?.toLocaleDateString()}`}
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
