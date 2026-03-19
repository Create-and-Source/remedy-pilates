import { useState, useEffect } from 'react';
import { useStyles } from '../theme';
import { getPatients, getAppointments, getServices, getProviders, getInventory, subscribe } from '../data/store';

const fmt = (cents) => `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 0 })}`;

export default function Reports() {
  const s = useStyles();
  const [, setTick] = useState(0);
  useEffect(() => subscribe(() => setTick(t => t + 1)), []);

  const [reportType, setReportType] = useState('revenue');
  const [period, setPeriod] = useState('month');

  const clients = getPatients();
  const appointments = getAppointments();
  const services = getServices();
  const providers = getProviders();
  const inventory = getInventory();

  const today = new Date();
  const thisMonth = today.toISOString().slice(0, 7);
  const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1).toISOString().slice(0, 7);

  const completedAppts = appointments.filter(a => a.status === 'completed');
  const thisMonthAppts = completedAppts.filter(a => a.date?.startsWith(thisMonth));
  const lastMonthAppts = completedAppts.filter(a => a.date?.startsWith(lastMonth));

  const calcRevenue = (appts) => appts.reduce((sum, a) => {
    const svc = services.find(sv => sv.id === a.serviceId);
    return sum + (svc?.price || 0);
  }, 0);

  const thisMonthRev = calcRevenue(thisMonthAppts);
  const lastMonthRev = calcRevenue(lastMonthAppts);
  const revChange = lastMonthRev > 0 ? Math.round(((thisMonthRev - lastMonthRev) / lastMonthRev) * 100) : 0;

  // Top services
  const serviceCounts = {};
  const serviceRevenue = {};
  completedAppts.forEach(a => {
    const svc = services.find(sv => sv.id === a.serviceId);
    if (svc) {
      serviceCounts[svc.name] = (serviceCounts[svc.name] || 0) + 1;
      serviceRevenue[svc.name] = (serviceRevenue[svc.name] || 0) + svc.price;
    }
  });
  const topServices = Object.entries(serviceCounts).sort(([, a], [, b]) => b - a).slice(0, 8);
  const maxServiceCount = topServices.length > 0 ? topServices[0][1] : 1;

  // Instructor performance
  const providerStats = providers.map(p => {
    const provAppts = completedAppts.filter(a => a.providerId === p.id);
    const rev = calcRevenue(provAppts);
    return { ...p, appointments: provAppts.length, revenue: rev };
  }).sort((a, b) => b.revenue - a.revenue);

  // Client retention
  const activePatients = clients.filter(p => {
    if (!p.lastVisit) return false;
    const days = (today - new Date(p.lastVisit)) / (1000 * 60 * 60 * 24);
    return days <= 90;
  }).length;
  const retentionRate = clients.length > 0 ? Math.round((activePatients / clients.length) * 100) : 0;

  const newPatientsThisMonth = clients.filter(p => p.createdAt?.startsWith(thisMonth)).length;
  const avgSpend = clients.length > 0 ? clients.reduce((sum, p) => sum + p.totalSpent, 0) / clients.length : 0;

  // Membership breakdown
  const memberCounts = { None: 0, Silver: 0, Gold: 0, Platinum: 0 };
  clients.forEach(p => { memberCounts[p.membershipTier || 'None']++; });

  const exportCSV = (data, filename) => {
    if (!data.length) return;
    const headers = Object.keys(data[0]);
    const csv = [headers.join(','), ...data.map(row => headers.map(h => `"${row[h] || ''}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
  };

  return (
    <div>
      <style>{`
        @media (max-width: 768px) {
          .reports-two-col {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ font: `600 26px ${s.FONT}`, color: s.text, marginBottom: 4 }}>Reports</h1>
          <p style={{ font: `400 14px ${s.FONT}`, color: s.text2 }}>Revenue, services, instructors, and client analytics</p>
        </div>
        <button onClick={() => exportCSV(
          completedAppts.map(a => {
            const svc = services.find(sv => sv.id === a.serviceId);
            const prov = providers.find(p => p.id === a.providerId);
            return { date: a.date, client: a.patientName, service: svc?.name, instructor: prov?.name, revenue: fmt(svc?.price || 0) };
          }),
          `studio-report-${today.toISOString().slice(0, 10)}.csv`
        )} style={s.pillOutline}>Export CSV</button>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 28 }}>
        {[
          { label: 'Monthly Revenue', value: fmt(thisMonthRev), sub: revChange >= 0 ? `+${revChange}% vs last month` : `${revChange}% vs last month`, subColor: revChange >= 0 ? s.success : s.danger },
          { label: 'Sessions This Month', value: thisMonthAppts.length, sub: `${lastMonthAppts.length} last month` },
          { label: 'Retention Rate', value: `${retentionRate}%`, sub: `${activePatients} active of ${clients.length}`, subColor: retentionRate > 70 ? s.success : s.warning },
          { label: 'Avg Client Spend', value: fmt(avgSpend), sub: `${newPatientsThisMonth} new this month` },
        ].map(k => (
          <div key={k.label} style={{ ...s.cardStyle, padding: '20px' }}>
            <div style={{ font: `400 10px ${s.MONO}`, textTransform: 'uppercase', letterSpacing: 1, color: s.text3, marginBottom: 8 }}>{k.label}</div>
            <div style={{ font: `600 28px ${s.FONT}`, color: s.text, marginBottom: 4 }}>{k.value}</div>
            <div style={{ font: `400 12px ${s.FONT}`, color: k.subColor || s.text2 }}>{k.sub}</div>
          </div>
        ))}
      </div>

      <div className="reports-two-col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Top Services */}
        <div style={{ ...s.cardStyle, overflow: 'hidden' }}>
          <div style={{ padding: '18px 20px', borderBottom: '1px solid #F0F0F0' }}>
            <span style={{ font: `600 14px ${s.FONT}`, color: s.text }}>Top Services</span>
          </div>
          <div style={{ padding: '12px 20px' }}>
            {topServices.map(([name, count]) => (
              <div key={name} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ font: `500 13px ${s.FONT}`, color: s.text }}>{name}</span>
                  <span style={{ font: `500 12px ${s.MONO}`, color: s.text2 }}>{count} — {fmt(serviceRevenue[name] || 0)}</span>
                </div>
                <div style={{ height: 6, background: '#F0F0F0', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ width: `${(count / maxServiceCount) * 100}%`, height: '100%', background: s.accent, borderRadius: 3, transition: 'width 0.5s' }} />
                </div>
              </div>
            ))}
            {topServices.length === 0 && <div style={{ padding: 20, font: `400 13px ${s.FONT}`, color: s.text3, textAlign: 'center' }}>No completed sessions yet</div>}
          </div>
        </div>

        {/* Instructor Performance */}
        <div style={{ ...s.cardStyle, overflow: 'hidden' }}>
          <div style={{ padding: '18px 20px', borderBottom: '1px solid #F0F0F0' }}>
            <span style={{ font: `600 14px ${s.FONT}`, color: s.text }}>Instructor Performance</span>
          </div>
          <div>
            {providerStats.map(p => (
              <div key={p.id} style={{ padding: '14px 20px', borderBottom: '1px solid #F8F8F8', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ font: `500 13px ${s.FONT}`, color: s.text }}>{p.name.split(',')[0]}</div>
                  <div style={{ font: `400 12px ${s.FONT}`, color: s.text3 }}>{p.title}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ font: `600 14px ${s.MONO}`, color: s.text }}>{fmt(p.revenue)}</div>
                  <div style={{ font: `400 11px ${s.FONT}`, color: s.text3 }}>{p.appointments} sessions</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Membership Breakdown */}
        <div style={{ ...s.cardStyle, padding: 20 }}>
          <div style={{ font: `600 14px ${s.FONT}`, color: s.text, marginBottom: 16 }}>Membership Breakdown</div>
          {['Platinum', 'Gold', 'Silver', 'None'].map(tier => (
            <div key={tier} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
              <span style={{
                width: 10, height: 10, borderRadius: '50%',
                background: tier === 'Platinum' ? '#111' : tier === 'Gold' ? '#B8960C' : tier === 'Silver' ? '#999' : '#DDD',
              }} />
              <span style={{ font: `500 13px ${s.FONT}`, color: s.text, flex: 1 }}>{tier}</span>
              <span style={{ font: `500 13px ${s.MONO}`, color: s.text }}>{memberCounts[tier]}</span>
              <span style={{ font: `400 12px ${s.FONT}`, color: s.text3, width: 40, textAlign: 'right' }}>
                {clients.length > 0 ? Math.round((memberCounts[tier] / clients.length) * 100) : 0}%
              </span>
            </div>
          ))}
        </div>

        {/* Inventory Value */}
        <div style={{ ...s.cardStyle, padding: 20 }}>
          <div style={{ font: `600 14px ${s.FONT}`, color: s.text, marginBottom: 16 }}>Inventory by Category</div>
          {[...new Set(inventory.map(i => i.category))].map(cat => {
            const items = inventory.filter(i => i.category === cat);
            const value = items.reduce((sum, i) => sum + i.quantity * (i.unitCost || 0), 0);
            const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
            return (
              <div key={cat} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #F8F8F8' }}>
                <div>
                  <div style={{ font: `500 13px ${s.FONT}`, color: s.text }}>{cat}</div>
                  <div style={{ font: `400 11px ${s.FONT}`, color: s.text3 }}>{totalItems} units across {items.length} items</div>
                </div>
                <div style={{ font: `600 13px ${s.MONO}`, color: s.text }}>{fmt(value)}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
