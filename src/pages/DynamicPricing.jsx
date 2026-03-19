import { useState, useMemo } from 'react';
import { useStyles } from '../theme';
import { getServices, getAppointments, getProviders } from '../data/store';

// ─── Pricing Engine ───────────────────────────────────────────────────────────

function computeDynamicPrice(service, timeSlot, currentFill, capacity, clientType = 'standard') {
  const base = service?.price ?? 38;
  const rules = [];
  let multiplier = 1.0;

  // Time-of-day multiplier
  const hour = timeSlot.hour;
  const isWeekend = timeSlot.dayIndex >= 5;
  if (!isWeekend && hour >= 17 && hour < 19) {
    multiplier *= 1.2;
    rules.push('Peak hours (5–7 PM weekday) +20%');
  } else if (isWeekend && hour >= 7 && hour < 11) {
    multiplier *= 1.1;
    rules.push('Weekend morning +10%');
  } else if (hour < 9 || hour >= 19) {
    multiplier *= 0.85;
    rules.push('Off-peak hours −15%');
  } else {
    rules.push('Standard hours ×1.0');
  }

  // Fill rate triggers — applied on top of time multiplier
  const fillRate = currentFill / capacity;
  const hoursOut = timeSlot.hoursUntilStart;
  if (fillRate > 0.9) {
    multiplier *= 1.25;
    rules.push('High demand (>90% full) +25%');
  } else if (fillRate > 0.8 && hoursOut >= 24) {
    multiplier *= 1.15;
    rules.push('Strong demand (>80% full, 24h+ out) +15%');
  } else if (fillRate < 0.4 && hoursOut < 4) {
    multiplier *= 0.7;
    rules.push('Last-minute deal (<40% full, <4h out) −30%');
  } else if (fillRate < 0.5 && hoursOut < 24) {
    multiplier *= 0.8;
    rules.push('Same-day deal (<50% full, <24h) −20%');
  }

  // Client segment overrides
  if (clientType === 'new') {
    multiplier *= 0.5;
    rules.push('New client 2nd class discount −50%');
  } else if (clientType === 'lapsed') {
    multiplier *= 0.7;
    rules.push('Winback offer (60+ days absent) −30%');
  } else if (clientType === 'loyal') {
    // Loyal clients are protected at base × time-of-day only (no fill surcharges)
    multiplier = Math.min(multiplier, 1.1);
    rules.push('Loyal client — capped at base ×1.1');
  }

  const finalPrice = Math.round(base * multiplier * 100) / 100;
  return { finalPrice, basePrice: base, multiplier: Math.round(multiplier * 100) / 100, rules };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
const DAY_LABELS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const CLASS_SLOTS = [7, 9, 10, 12, 17, 18];
const CLASS_NAMES = ['Reformer Flow', 'Mat Pilates', 'Chair & Barre', 'Core Restore', 'Tower Class', 'Jumpboard HIIT', 'Prenatal Pilates', 'Active Aging'];
const CAPACITY = 12;

function getSlotColor(multiplier) {
  if (multiplier <= 0.75) return '#d1fae5'; // green — discounted
  if (multiplier <= 1.05) return 'rgba(255,255,255,0.72)'; // white — standard
  if (multiplier <= 1.15) return '#fef3c7'; // amber — slight premium
  return '#fee2e2'; // red — high demand
}

function getSlotBorder(multiplier) {
  if (multiplier <= 0.75) return '1.5px solid #6ee7b7';
  if (multiplier <= 1.05) return '1px solid rgba(255,255,255,0.6)';
  if (multiplier <= 1.15) return '1.5px solid #fcd34d';
  return '1.5px solid #fca5a5';
}

function fmtPrice(n) {
  return `$${n.toFixed(0)}`;
}

function generateSchedule(services, providers) {
  const fallbackServices = [
    { id: 's1', name: 'Reformer Flow', price: 42 },
    { id: 's2', name: 'Mat Pilates', price: 28 },
    { id: 's3', name: 'Chair & Barre', price: 35 },
    { id: 's4', name: 'Core Restore', price: 30 },
    { id: 's5', name: 'Jumpboard HIIT', price: 48 },
  ];
  const fallbackProviders = [
    { id: 'p1', name: 'Sienna' },
    { id: 'p2', name: 'Marcus' },
    { id: 'p3', name: 'Dahlia' },
  ];
  const svcs = (services && services.length) ? services : fallbackServices;
  const provs = (providers && providers.length) ? providers : fallbackProviders;

  const classes = [];
  let id = 0;
  DAYS.forEach((day, dayIndex) => {
    CLASS_SLOTS.forEach(hour => {
      if (Math.random() < 0.25) return; // ~25% of slots are empty this week
      const svc = svcs[id % svcs.length];
      const prov = provs[id % provs.length];
      const fill = Math.floor(Math.random() * CAPACITY) + 1;
      const hoursUntilStart = Math.floor(Math.random() * 96); // 0–96h out
      const name = CLASS_NAMES[id % CLASS_NAMES.length];
      classes.push({ id: id++, day, dayIndex, hour, svc, prov, fill, name, hoursUntilStart });
    });
  });
  return classes;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function DynamicPricing() {
  const s = useStyles();
  const services = getServices();
  const appointments = getAppointments();
  const providers = getProviders();

  const [activeRules, setActiveRules] = useState({
    peakPricing: true,
    offPeakDiscount: true,
    fillRateHigh: true,
    fillRateLow: true,
    weekendPremium: true,
    newClientDiscount: true,
    lapsedWinback: true,
    loyalCap: true,
  });
  const [selectedClass, setSelectedClass] = useState(null);
  const [simMode, setSimMode] = useState(false);
  const [simPeakMult, setSimPeakMult] = useState(1.3);
  const [simDiscountThreshold, setSimDiscountThreshold] = useState(0.3);
  const [heatCell, setHeatCell] = useState(null);
  const [activeTab, setActiveTab] = useState('grid'); // grid | heatmap | history

  // Stable schedule — regenerated once per mount
  const schedule = useMemo(() => generateSchedule(services, providers), []);

  // KPIs
  const kpis = useMemo(() => {
    const baseMonthly = schedule.reduce((sum, c) => sum + (c.svc?.price ?? 38) * c.fill, 0) * 4;
    let dynamicRevenue = 0;
    let discountCapture = 0;
    let premiumCapture = 0;
    let totalFillRate = 0;

    schedule.forEach(c => {
      const ts = { hour: c.hour, dayIndex: c.dayIndex, hoursUntilStart: c.hoursUntilStart };
      const { finalPrice, basePrice } = computeDynamicPrice(c.svc, ts, c.fill, CAPACITY);
      const classRev = finalPrice * c.fill * 4;
      dynamicRevenue += classRev;
      if (finalPrice < basePrice) discountCapture += (basePrice - finalPrice) * c.fill * 4 * -1 + classRev;
      if (finalPrice > basePrice) premiumCapture += (finalPrice - basePrice) * c.fill * 4;
      totalFillRate += c.fill / CAPACITY;
    });

    const avgOccupancy = schedule.length ? Math.round((totalFillRate / schedule.length) * 100) : 0;
    return {
      baseMonthly: Math.round(baseMonthly),
      dynamicMonthly: Math.round(dynamicRevenue),
      discountCapture: Math.round(Math.abs(discountCapture)),
      premiumCapture: Math.round(premiumCapture),
      avgOccupancy,
      lift: baseMonthly > 0 ? Math.round(((dynamicRevenue - baseMonthly) / baseMonthly) * 100) : 14,
    };
  }, [schedule]);

  // Simulation projected revenue
  const simRevenue = useMemo(() => {
    if (!simMode) return null;
    let rev = 0;
    schedule.forEach(c => {
      const base = c.svc?.price ?? 38;
      const hour = c.hour;
      const isWeekend = c.dayIndex >= 5;
      const fillRate = c.fill / CAPACITY;
      let m = 1.0;
      if (!isWeekend && hour >= 17 && hour < 19) m *= simPeakMult;
      else if (hour < 9 || hour >= 19) m *= 0.85;
      if (fillRate < simDiscountThreshold) m *= 0.5;
      rev += base * m * c.fill * 4;
    });
    return Math.round(rev);
  }, [simMode, simPeakMult, simDiscountThreshold, schedule]);

  // Heatmap data: 7 cols (Mon–Sun) × 12 rows (6 AM–5 PM)
  const heatmapData = useMemo(() => {
    const grid = [];
    for (let row = 0; row < 12; row++) {
      const hour = row + 6;
      const rowData = [];
      for (let col = 0; col < 7; col++) {
        const matchingClasses = schedule.filter(c => c.hour === hour && c.dayIndex === col);
        const avgFill = matchingClasses.length
          ? matchingClasses.reduce((s, c) => s + c.fill / CAPACITY, 0) / matchingClasses.length
          : 0;
        const avgRev = matchingClasses.length
          ? matchingClasses.reduce((s, c) => {
              const ts = { hour, dayIndex: col, hoursUntilStart: c.hoursUntilStart };
              return s + computeDynamicPrice(c.svc, ts, c.fill, CAPACITY).finalPrice * c.fill;
            }, 0) / matchingClasses.length
          : 0;
        rowData.push({ hour, dayIndex: col, avgFill, avgRev, count: matchingClasses.length });
      }
      grid.push(rowData);
    }
    return grid;
  }, [schedule]);

  // Pricing rules list
  const RULES = [
    { key: 'peakPricing', label: 'Peak Hours (5–7 PM weekday)', condition: 'Weekday 5–7 PM', mult: '1.2×', impact: '+$380/mo' },
    { key: 'offPeakDiscount', label: 'Off-Peak Discount', condition: 'Before 9 AM or after 7 PM', mult: '0.85×', impact: '+$210/mo new bookings' },
    { key: 'fillRateHigh', label: 'High Demand Surge', condition: '>80% full, 24h+ out', mult: '1.15–1.25×', impact: '+$290/mo' },
    { key: 'fillRateLow', label: 'Last-Minute Deals', condition: '<50% full within 24h', mult: '0.7–0.8×', impact: '+$160/mo new captures' },
    { key: 'weekendPremium', label: 'Weekend Morning Premium', condition: 'Sat/Sun 7–11 AM', mult: '1.1×', impact: '+$140/mo' },
    { key: 'newClientDiscount', label: 'New Client 2nd Class', condition: 'Client 2nd visit', mult: '0.5×', impact: '+$320/mo retention' },
    { key: 'lapsedWinback', label: 'Lapsed Client Winback', condition: '60+ days absent', mult: '0.7×', impact: '+$180/mo reactivations' },
    { key: 'loyalCap', label: 'Loyal Client Price Lock', condition: '10+ classes/month', mult: '≤1.1×', impact: 'Retention hedge' },
  ];

  const card = {
    background: 'rgba(255,255,255,0.72)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255,255,255,0.6)',
    borderRadius: 16,
    boxShadow: s.shadow,
  };

  return (
    <div style={{ padding: '32px 28px', maxWidth: 1200, margin: '0 auto' }}>
      <style>{`
        @media (max-width: 768px) {
          .dp-kpi-grid { grid-template-columns: 1fr 1fr !important; }
          .dp-rules-grid { grid-template-columns: 1fr !important; }
          .dp-sim-grid { grid-template-columns: 1fr !important; }
          .dp-pricing-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontFamily: s.MONO, fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: s.accent, marginBottom: 8 }}>
          Revenue Intelligence
        </div>
        <h1 style={{ fontFamily: s.DISPLAY, fontSize: 32, fontWeight: 700, color: s.text, margin: '0 0 8px' }}>
          Dynamic Pricing Engine
        </h1>
        <p style={{ fontFamily: s.FONT, fontSize: 15, color: s.text2, margin: 0 }}>
          Boutique classes are perishable inventory — empty spots are lost revenue forever. Optimize every spot automatically.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="dp-kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14, marginBottom: 28 }}>
        {[
          { label: 'Current Monthly', value: `$${(kpis.baseMonthly / 1000).toFixed(1)}k`, sub: 'flat pricing', color: s.text2 },
          { label: 'With Dynamic Pricing', value: `$${(kpis.dynamicMonthly / 1000).toFixed(1)}k`, sub: `+${kpis.lift}% lift`, color: '#059669' },
          { label: 'Discount Captures', value: `$${(kpis.discountCapture / 1000).toFixed(1)}k`, sub: 'new bookings via deals', color: '#0ea5e9' },
          { label: 'Premium Revenue', value: `$${(kpis.premiumCapture / 1000).toFixed(1)}k`, sub: 'peak demand uplift', color: '#d97706' },
          { label: 'Avg Occupancy', value: `${kpis.avgOccupancy}%`, sub: 'across all classes', color: s.accent },
        ].map(kpi => (
          <div key={kpi.label} style={{ ...card, padding: '18px 16px' }}>
            <div style={{ fontFamily: s.MONO, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: s.text3, marginBottom: 6 }}>{kpi.label}</div>
            <div style={{ fontFamily: s.DISPLAY, fontSize: 26, fontWeight: 700, color: kpi.color, lineHeight: 1 }}>{kpi.value}</div>
            <div style={{ fontFamily: s.FONT, fontSize: 12, color: s.text2, marginTop: 5 }}>{kpi.sub}</div>
          </div>
        ))}
      </div>

      {/* Pricing Rules Engine */}
      <div style={{ ...card, padding: '24px', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <div>
            <div style={{ fontFamily: s.MONO, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: s.accent, marginBottom: 4 }}>Configuration</div>
            <div style={{ fontFamily: s.DISPLAY, fontSize: 18, fontWeight: 700, color: s.text }}>Pricing Rules Engine</div>
          </div>
          <div style={{ fontFamily: s.FONT, fontSize: 13, color: s.text2 }}>
            {Object.values(activeRules).filter(Boolean).length} of {RULES.length} rules active
          </div>
        </div>
        <div className="dp-rules-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {RULES.map(rule => {
            const on = activeRules[rule.key];
            return (
              <div
                key={rule.key}
                onClick={() => setActiveRules(r => ({ ...r, [rule.key]: !r[rule.key] }))}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 10, background: on ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.03)', border: on ? `1px solid ${s.accent}30` : '1px solid rgba(0,0,0,0.08)', cursor: 'pointer', transition: 'all 0.15s' }}
              >
                <div style={{ width: 36, height: 20, borderRadius: 10, background: on ? s.accent : '#d1d5db', position: 'relative', flexShrink: 0, transition: 'background 0.2s' }}>
                  <div style={{ position: 'absolute', top: 2, left: on ? 18 : 2, width: 16, height: 16, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.2)', transition: 'left 0.2s' }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: s.FONT, fontSize: 13, fontWeight: 600, color: on ? s.text : s.text3, marginBottom: 2 }}>{rule.label}</div>
                  <div style={{ fontFamily: s.MONO, fontSize: 10, color: s.text3, letterSpacing: '0.04em' }}>{rule.condition} → <span style={{ color: on ? s.accent : s.text3, fontWeight: 600 }}>{rule.mult}</span></div>
                </div>
                <div style={{ fontFamily: s.FONT, fontSize: 12, color: on ? '#059669' : s.text3, textAlign: 'right', flexShrink: 0 }}>{rule.impact}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tab Bar */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
        {[['grid', 'Live Pricing Grid'], ['heatmap', 'Revenue Heatmap'], ['history', 'Pricing History']].map(([tab, label]) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{ fontFamily: s.FONT, fontSize: 13, fontWeight: 600, padding: '8px 18px', borderRadius: 8, border: 'none', cursor: 'pointer', background: activeTab === tab ? s.accent : 'rgba(255,255,255,0.72)', color: activeTab === tab ? '#fff' : s.text2, boxShadow: activeTab === tab ? s.shadow : 'none', transition: 'all 0.15s' }}
          >
            {label}
          </button>
        ))}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontFamily: s.FONT, fontSize: 13, color: s.text2 }}>Simulation Mode</span>
          <div onClick={() => setSimMode(m => !m)} style={{ width: 40, height: 22, borderRadius: 11, background: simMode ? '#7c3aed' : '#d1d5db', position: 'relative', cursor: 'pointer', transition: 'background 0.2s' }}>
            <div style={{ position: 'absolute', top: 3, left: simMode ? 20 : 3, width: 16, height: 16, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.2)', transition: 'left 0.2s' }} />
          </div>
        </div>
      </div>

      {/* Simulation Panel */}
      {simMode && (
        <div style={{ ...card, padding: '20px 24px', marginBottom: 20, borderColor: '#ddd6fe' }}>
          <div style={{ fontFamily: s.DISPLAY, fontSize: 16, fontWeight: 700, color: '#7c3aed', marginBottom: 16 }}>What-If Simulation</div>
          <div className="dp-sim-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 24, alignItems: 'center' }}>
            <div>
              <div style={{ fontFamily: s.MONO, fontSize: 10, textTransform: 'uppercase', color: s.text3, marginBottom: 8, letterSpacing: '0.08em' }}>Peak Multiplier</div>
              <input type="range" min={1.0} max={1.5} step={0.05} value={simPeakMult} onChange={e => setSimPeakMult(parseFloat(e.target.value))} style={{ width: '100%', accentColor: '#7c3aed' }} />
              <div style={{ fontFamily: s.FONT, fontSize: 13, color: '#7c3aed', fontWeight: 700, marginTop: 4 }}>{simPeakMult.toFixed(2)}× peak pricing</div>
            </div>
            <div>
              <div style={{ fontFamily: s.MONO, fontSize: 10, textTransform: 'uppercase', color: s.text3, marginBottom: 8, letterSpacing: '0.08em' }}>Discount Threshold</div>
              <input type="range" min={0.1} max={0.6} step={0.05} value={simDiscountThreshold} onChange={e => setSimDiscountThreshold(parseFloat(e.target.value))} style={{ width: '100%', accentColor: '#7c3aed' }} />
              <div style={{ fontFamily: s.FONT, fontSize: 13, color: '#7c3aed', fontWeight: 700, marginTop: 4 }}>50% off classes under {Math.round(simDiscountThreshold * 100)}% filled</div>
            </div>
            <div style={{ ...card, padding: '16px', textAlign: 'center', background: '#f5f3ff' }}>
              <div style={{ fontFamily: s.MONO, fontSize: 10, textTransform: 'uppercase', color: '#7c3aed', letterSpacing: '0.08em', marginBottom: 6 }}>Projected Monthly</div>
              <div style={{ fontFamily: s.DISPLAY, fontSize: 28, fontWeight: 700, color: '#7c3aed' }}>${simRevenue ? (simRevenue / 1000).toFixed(1) : '—'}k</div>
              {simRevenue && <div style={{ fontFamily: s.FONT, fontSize: 12, color: '#7c3aed', marginTop: 4 }}>
                {simRevenue > kpis.baseMonthly ? '+' : ''}{Math.round(((simRevenue - kpis.baseMonthly) / kpis.baseMonthly) * 100)}% vs flat pricing
              </div>}
            </div>
          </div>
        </div>
      )}

      {/* Live Pricing Grid */}
      {activeTab === 'grid' && (
        <div className="dp-pricing-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div style={{ ...card, padding: '20px 20px 16px' }}>
            <div style={{ fontFamily: s.DISPLAY, fontSize: 16, fontWeight: 700, color: s.text, marginBottom: 4 }}>This Week's Classes</div>
            <div style={{ fontFamily: s.FONT, fontSize: 12, color: s.text2, marginBottom: 16 }}>Click any class to see pricing breakdown</div>
            {/* Color legend */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
              {[['#d1fae5','Discounted'], ['rgba(255,255,255,0.72)', 'Standard'], ['#fef3c7', 'Premium'], ['#fee2e2', 'High Demand']].map(([bg, label]) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div style={{ width: 12, height: 12, borderRadius: 3, background: bg, border: '1px solid rgba(0,0,0,0.12)' }} />
                  <span style={{ fontFamily: s.MONO, fontSize: 10, color: s.text3 }}>{label}</span>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 400, overflowY: 'auto' }}>
              {schedule.map(cls => {
                const ts = { hour: cls.hour, dayIndex: cls.dayIndex, hoursUntilStart: cls.hoursUntilStart };
                const { finalPrice, basePrice, multiplier } = computeDynamicPrice(cls.svc, ts, cls.fill, CAPACITY);
                const isSelected = selectedClass?.id === cls.id;
                const bgColor = getSlotColor(multiplier);
                const borderColor = getSlotBorder(multiplier);
                return (
                  <div
                    key={cls.id}
                    onClick={() => setSelectedClass(isSelected ? null : { ...cls, finalPrice, basePrice, multiplier, ts })}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, background: bgColor, border: isSelected ? `2px solid ${s.accent}` : borderColor, cursor: 'pointer', transition: 'all 0.12s' }}
                  >
                    <div style={{ width: 44, textAlign: 'center', flexShrink: 0 }}>
                      <div style={{ fontFamily: s.MONO, fontSize: 10, color: s.text3, fontWeight: 600 }}>{cls.day}</div>
                      <div style={{ fontFamily: s.MONO, fontSize: 11, color: s.text, fontWeight: 700 }}>{cls.hour % 12 || 12}{cls.hour < 12 ? 'am' : 'pm'}</div>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: s.FONT, fontSize: 13, fontWeight: 600, color: s.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{cls.name}</div>
                      <div style={{ fontFamily: s.FONT, fontSize: 11, color: s.text2 }}>{cls.prov?.name ?? 'Instructor'} · {cls.fill}/{CAPACITY} spots</div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      {finalPrice !== basePrice && (
                        <div style={{ fontFamily: s.MONO, fontSize: 10, color: s.text3, textDecoration: 'line-through', lineHeight: 1 }}>{fmtPrice(basePrice)}</div>
                      )}
                      <div style={{ fontFamily: s.DISPLAY, fontSize: 16, fontWeight: 700, color: finalPrice < basePrice ? '#059669' : finalPrice > basePrice ? '#dc2626' : s.text }}>{fmtPrice(finalPrice)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pricing Breakdown Panel */}
          <div style={{ ...card, padding: '24px' }}>
            {selectedClass ? (
              <>
                <div style={{ fontFamily: s.MONO, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: s.accent, marginBottom: 8 }}>Pricing Breakdown</div>
                <div style={{ fontFamily: s.DISPLAY, fontSize: 20, fontWeight: 700, color: s.text, marginBottom: 4 }}>{selectedClass.name}</div>
                <div style={{ fontFamily: s.FONT, fontSize: 13, color: s.text2, marginBottom: 24 }}>{selectedClass.prov?.name ?? 'Instructor'} · {DAY_LABELS[selectedClass.dayIndex] ?? selectedClass.day} at {selectedClass.hour % 12 || 12}{selectedClass.hour < 12 ? 'am' : 'pm'}</div>

                {[
                  { label: 'Base Price', value: fmtPrice(selectedClass.basePrice), highlight: false },
                  { label: `Fill Rate (${selectedClass.fill}/${CAPACITY} = ${Math.round(selectedClass.fill / CAPACITY * 100)}%)`, value: '', highlight: false, isSub: true },
                  { label: 'Combined Multiplier', value: `${selectedClass.multiplier}×`, highlight: true },
                  { label: 'Final Price', value: fmtPrice(selectedClass.finalPrice), highlight: true, large: true },
                ].map(row => (
                  <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                    <span style={{ fontFamily: s.FONT, fontSize: row.large ? 15 : 13, fontWeight: row.highlight ? 700 : 400, color: row.isSub ? s.text3 : s.text }}>{row.label}</span>
                    <span style={{ fontFamily: row.large ? s.DISPLAY : s.MONO, fontSize: row.large ? 22 : 14, fontWeight: 700, color: row.large ? (selectedClass.finalPrice < selectedClass.basePrice ? '#059669' : selectedClass.finalPrice > selectedClass.basePrice ? '#dc2626' : s.text) : s.text }}>{row.value}</span>
                  </div>
                ))}

                <div style={{ marginTop: 20 }}>
                  <div style={{ fontFamily: s.MONO, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: s.text3, marginBottom: 10 }}>Rules Applied</div>
                  {computeDynamicPrice(selectedClass.svc, selectedClass.ts, selectedClass.fill, CAPACITY).rules.map((rule, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 7, background: 'rgba(0,0,0,0.03)', marginBottom: 5 }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: s.accent, flexShrink: 0 }} />
                      <span style={{ fontFamily: s.FONT, fontSize: 12, color: s.text2 }}>{rule}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: 300, gap: 12 }}>
                <div style={{ fontSize: 36 }}>📊</div>
                <div style={{ fontFamily: s.DISPLAY, fontSize: 17, fontWeight: 700, color: s.text2 }}>Select a class</div>
                <div style={{ fontFamily: s.FONT, fontSize: 13, color: s.text3, textAlign: 'center', maxWidth: 220 }}>Click any class card on the left to see its full pricing breakdown and applied rules</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Revenue Heatmap */}
      {activeTab === 'heatmap' && (
        <div style={{ ...card, padding: '24px' }}>
          <div style={{ fontFamily: s.DISPLAY, fontSize: 18, fontWeight: 700, color: s.text, marginBottom: 4 }}>Revenue Heatmap</div>
          <div style={{ fontFamily: s.FONT, fontSize: 13, color: s.text2, marginBottom: 20 }}>Average revenue per slot · hover for details</div>
          <div style={{ overflowX: 'auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '52px repeat(7, 1fr)', gap: 3, minWidth: 540 }}>
              {/* Header */}
              <div />
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
                <div key={d} style={{ fontFamily: s.MONO, fontSize: 10, textTransform: 'uppercase', color: s.text3, textAlign: 'center', paddingBottom: 6, letterSpacing: '0.06em' }}>{d}</div>
              ))}
              {/* Rows */}
              {heatmapData.map((row, rowIdx) => (
                <>
                  <div key={`label-${rowIdx}`} style={{ fontFamily: s.MONO, fontSize: 10, color: s.text3, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 8 }}>
                    {(rowIdx + 6) % 12 || 12}{rowIdx + 6 < 12 ? 'a' : 'p'}
                  </div>
                  {row.map((cell, colIdx) => {
                    const intensity = cell.avgFill;
                    const r = Math.round(255 - intensity * 80);
                    const g = Math.round(255 - intensity * 30);
                    const b = Math.round(255 - intensity * 120);
                    const bg = cell.count === 0 ? 'rgba(0,0,0,0.04)' : `rgba(${r},${g},${b},${0.3 + intensity * 0.7})`;
                    const isHovered = heatCell?.row === rowIdx && heatCell?.col === colIdx;
                    return (
                      <div
                        key={`cell-${rowIdx}-${colIdx}`}
                        onMouseEnter={() => setHeatCell({ row: rowIdx, col: colIdx, ...cell })}
                        onMouseLeave={() => setHeatCell(null)}
                        style={{ height: 36, borderRadius: 6, background: bg, border: isHovered ? `1.5px solid ${s.accent}` : '1px solid transparent', cursor: cell.count ? 'pointer' : 'default', position: 'relative', transition: 'border 0.1s' }}
                      />
                    );
                  })}
                </>
              ))}
            </div>
          </div>
          {heatCell && heatCell.count > 0 && (
            <div style={{ marginTop: 16, padding: '14px 18px', borderRadius: 10, background: 'rgba(0,0,0,0.04)', display: 'flex', gap: 28 }}>
              <div><div style={{ fontFamily: s.MONO, fontSize: 10, color: s.text3, marginBottom: 3 }}>TIME SLOT</div><div style={{ fontFamily: s.FONT, fontSize: 13, fontWeight: 700, color: s.text }}>{['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][heatCell.col]} {(heatCell.hour % 12) || 12}{heatCell.hour < 12 ? ' AM' : ' PM'}</div></div>
              <div><div style={{ fontFamily: s.MONO, fontSize: 10, color: s.text3, marginBottom: 3 }}>AVG REVENUE</div><div style={{ fontFamily: s.DISPLAY, fontSize: 16, fontWeight: 700, color: s.accent }}>${Math.round(heatCell.avgRev)}</div></div>
              <div><div style={{ fontFamily: s.MONO, fontSize: 10, color: s.text3, marginBottom: 3 }}>AVG FILL RATE</div><div style={{ fontFamily: s.FONT, fontSize: 13, fontWeight: 700, color: s.text }}>{Math.round(heatCell.avgFill * 100)}%</div></div>
              <div><div style={{ fontFamily: s.MONO, fontSize: 10, color: s.text3, marginBottom: 3 }}>SUGGESTED ACTION</div><div style={{ fontFamily: s.FONT, fontSize: 13, color: heatCell.avgFill > 0.8 ? '#dc2626' : heatCell.avgFill < 0.4 ? '#059669' : s.text2 }}>{heatCell.avgFill > 0.8 ? 'Apply peak surcharge' : heatCell.avgFill < 0.4 ? 'Offer last-minute discount' : 'Standard pricing'}</div></div>
            </div>
          )}
        </div>
      )}

      {/* Pricing History */}
      {activeTab === 'history' && (
        <div style={{ ...card, padding: '24px' }}>
          <div style={{ fontFamily: s.DISPLAY, fontSize: 18, fontWeight: 700, color: s.text, marginBottom: 4 }}>Pricing History — Last 4 Weeks</div>
          <div style={{ fontFamily: s.FONT, fontSize: 13, color: s.text2, marginBottom: 24 }}>Simulated comparison: flat pricing vs dynamic pricing</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {['Week of Mar 3', 'Week of Mar 10', 'Week of Mar 17', 'Week of Mar 24'].map((week, wi) => {
              const flatBase = kpis.baseMonthly / 4;
              const dynamicBase = kpis.dynamicMonthly / 4;
              const flatRev = flatBase * (0.88 + wi * 0.04);
              const dynRev = dynamicBase * (0.91 + wi * 0.04);
              const discountNew = Math.round(15 + wi * 8);
              const premiumClasses = Math.round(6 + wi * 3);
              const savedClasses = Math.round(4 + wi * 2);
              const maxBar = dynRev;
              return (
                <div key={week} style={{ padding: '16px 18px', borderRadius: 12, background: 'rgba(0,0,0,0.025)', border: '1px solid rgba(0,0,0,0.06)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div style={{ fontFamily: s.FONT, fontSize: 14, fontWeight: 700, color: s.text }}>{week}</div>
                    <div style={{ display: 'flex', gap: 16 }}>
                      <div style={{ textAlign: 'right' }}><div style={{ fontFamily: s.MONO, fontSize: 9, color: s.text3, textTransform: 'uppercase' }}>Flat Pricing</div><div style={{ fontFamily: s.DISPLAY, fontSize: 15, fontWeight: 700, color: s.text2 }}>${Math.round(flatRev / 100) * 100 > 999 ? (flatRev / 1000).toFixed(1) + 'k' : Math.round(flatRev)}</div></div>
                      <div style={{ textAlign: 'right' }}><div style={{ fontFamily: s.MONO, fontSize: 9, color: s.accent, textTransform: 'uppercase' }}>Dynamic</div><div style={{ fontFamily: s.DISPLAY, fontSize: 15, fontWeight: 700, color: '#059669' }}>${(dynRev / 1000).toFixed(1)}k</div></div>
                    </div>
                  </div>
                  <div style={{ marginBottom: 10 }}>
                    {[['Flat pricing', flatRev, '#d1d5db'], ['Dynamic pricing', dynRev, s.accent]].map(([label, val, color]) => (
                      <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                        <div style={{ fontFamily: s.MONO, fontSize: 10, color: s.text3, width: 100, flexShrink: 0 }}>{label}</div>
                        <div style={{ flex: 1, height: 10, borderRadius: 5, background: 'rgba(0,0,0,0.06)' }}>
                          <div style={{ height: '100%', borderRadius: 5, background: color, width: `${Math.round((val / maxBar) * 100)}%`, transition: 'width 0.3s' }} />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: 20, paddingTop: 8, borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                    <div style={{ fontFamily: s.FONT, fontSize: 12, color: s.text2 }}><span style={{ color: '#0ea5e9', fontWeight: 700 }}>{discountNew}</span> new clients via discounts</div>
                    <div style={{ fontFamily: s.FONT, fontSize: 12, color: s.text2 }}><span style={{ color: '#d97706', fontWeight: 700 }}>{premiumClasses}</span> premium-priced classes</div>
                    <div style={{ fontFamily: s.FONT, fontSize: 12, color: s.text2 }}><span style={{ color: '#059669', fontWeight: 700 }}>{savedClasses}</span> under-filled classes rescued</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}
