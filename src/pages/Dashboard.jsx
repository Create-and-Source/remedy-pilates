import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStyles, getAvatarGradient } from '../theme';
import { getPatients, getAppointments, getInventory, getRetentionAlerts, getServices, getProviders, subscribe } from '../data/store';

const fmt = (cents) => `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 0 })}`;

/* --- inject dashboard keyframes once --- */
const DASH_ANIM_ID = 'dashboard-premium-anims';
if (!document.getElementById(DASH_ANIM_ID)) {
  const sheet = document.createElement('style');
  sheet.id = DASH_ANIM_ID;
  sheet.textContent = `
    @keyframes dashFadeInUp {
      from { opacity: 0; transform: translateY(16px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes dashPulseGlow {
      0%, 100% { box-shadow: 0 0 0 0 rgba(var(--accent-rgb), 0); }
      50%      { box-shadow: 0 0 20px 2px rgba(var(--accent-rgb), 0.08); }
    }
    @keyframes dashCountUp {
      from { opacity: 0; transform: translateY(8px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes sparkDraw {
      from { stroke-dashoffset: 300; }
      to   { stroke-dashoffset: 0; }
    }
    .dash-card-hover:hover {
      transform: translateY(-3px) !important;
      box-shadow: 0 12px 40px rgba(0,0,0,0.08), 0 2px 6px rgba(0,0,0,0.03) !important;
    }
    .dash-action-btn:hover {
      border-color: var(--accent-color) !important;
      color: var(--accent-color) !important;
      box-shadow: 0 0 16px rgba(var(--accent-rgb), 0.12) !important;
    }
  `;
  document.head.appendChild(sheet);
}

/* Simple sparkline SVG — 7 data points, fake demo data */
function MiniSparkline({ accent, data }) {
  const points = data || [42, 58, 35, 72, 65, 88, 76];
  const max = Math.max(...points);
  const min = Math.min(...points);
  const range = max - min || 1;
  const w = 180, h = 52, padY = 6;
  const coords = points.map((v, i) => ({
    x: (i / (points.length - 1)) * w,
    y: padY + ((max - v) / range) * (h - padY * 2),
  }));
  const pathD = coords.map((c, i) => `${i === 0 ? 'M' : 'L'}${c.x},${c.y}`).join(' ');
  const areaD = `${pathD} L${w},${h} L0,${h} Z`;

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: 'block' }}>
      <defs>
        <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={accent} stopOpacity="0.15" />
          <stop offset="100%" stopColor={accent} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaD} fill="url(#sparkGrad)" />
      <path d={pathD} fill="none" stroke={accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        style={{ strokeDasharray: 300, animation: 'sparkDraw 1.2s ease forwards' }} />
      {coords.map((c, i) => (
        <circle key={i} cx={c.x} cy={c.y} r={i === coords.length - 1 ? 3.5 : 2.5}
          fill={i === coords.length - 1 ? accent : '#fff'} stroke={accent} strokeWidth="1.5" />
      ))}
    </svg>
  );
}

/* KPI Icon components */
function CalendarIcon({ color }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}
function DollarIcon({ color }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  );
}
function UsersIcon({ color }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
function BellIcon({ color }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}
function BoxIcon({ color }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    </svg>
  );
}
function ChevronRight({ color }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

export default function Dashboard() {
  const s = useStyles();
  const nav = useNavigate();
  const [, setTick] = useState(0);
  useEffect(() => subscribe(() => setTick(t => t + 1)), []);

  const patients = getPatients();
  const appointments = getAppointments();
  const inventory = getInventory();
  const alerts = getRetentionAlerts();
  const services = getServices();
  const providers = getProviders();

  const today = new Date().toISOString().slice(0, 10);
  const todayAppts = appointments.filter(a => a.date === today);
  const confirmedToday = todayAppts.filter(a => a.status === 'confirmed').length;
  const pendingToday = todayAppts.filter(a => a.status === 'pending').length;

  // Revenue (completed appointments this month)
  const thisMonth = today.slice(0, 7);
  const monthAppts = appointments.filter(a => a.date?.startsWith(thisMonth) && a.status === 'completed');
  const monthRevenue = monthAppts.reduce((sum, a) => {
    const svc = services.find(sv => sv.id === a.serviceId);
    return sum + (svc?.price || 0);
  }, 0);

  // New patients this month
  const newPatientsMonth = patients.filter(p => p.createdAt?.startsWith(thisMonth)).length;

  // Low stock
  const lowStock = inventory.filter(i => i.quantity <= i.reorderAt);

  // Pending retention
  const pendingAlerts = alerts.filter(a => a.status === 'pending');

  // Upcoming appointments (next 8)
  const upcoming = appointments
    .filter(a => a.date >= today && a.status !== 'completed')
    .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`))
    .slice(0, 8);

  // Greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const dateStr = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  // Glass style shorthand
  const glass = {
    background: 'rgba(255,255,255,0.6)',
    backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid rgba(255,255,255,0.65)',
    borderRadius: 18,
    boxShadow: '0 4px 24px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)',
    transition: 'all 0.3s cubic-bezier(0.16,1,0.3,1)',
  };

  const kpiIcons = [
    <CalendarIcon color={s.accent} />,
    <DollarIcon color={s.accent} />,
    <UsersIcon color={s.accent} />,
    <BellIcon color={s.accent} />,
  ];

  const kpis = [
    { label: "Today's Appointments", value: todayAppts.length, sub: `${confirmedToday} confirmed, ${pendingToday} pending`, path: '/schedule' },
    { label: 'Monthly Revenue', value: fmt(monthRevenue), sub: `${monthAppts.length} completed treatments`, path: '/reports' },
    { label: 'Active Patients', value: patients.length, sub: `${newPatientsMonth} new this month`, path: '/patients' },
    { label: 'Retention Alerts', value: pendingAlerts.length, sub: pendingAlerts.length > 0 ? `${pendingAlerts.filter(a => a.priority === 'high').length} high priority` : 'All caught up', path: '/retention' },
  ];

  return (
    <div>
      {/* ═══ GRADIENT WELCOME HERO ═══ */}
      <div className="dash-hero" style={{
        ...glass,
        padding: '28px 32px',
        marginBottom: 28,
        background: `linear-gradient(135deg, rgba(255,255,255,0.75) 0%, ${s.accentLight} 100%)`,
        borderLeft: `3px solid ${s.accent}`,
        animation: 'dashFadeInUp 0.5s cubic-bezier(0.16,1,0.3,1) both',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 style={{
              font: `600 26px ${s.FONT}`, color: s.text, marginBottom: 4, letterSpacing: '-0.3px',
            }}>
              {greeting}, team
            </h1>
            <p style={{ font: `400 13px ${s.FONT}`, color: s.text2, margin: 0 }}>{dateStr}</p>
          </div>
          <div className="dash-hero-right" style={{
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ font: `500 10px ${s.MONO}`, textTransform: 'uppercase', letterSpacing: 1.5, color: s.text3, marginBottom: 2 }}>Today's Revenue</div>
              <div style={{ font: `600 20px ${s.FONT}`, color: s.accent }}>
                {fmt(todayAppts.filter(a => a.status === 'completed').reduce((sum, a) => {
                  const svc = services.find(sv => sv.id === a.serviceId);
                  return sum + (svc?.price || 0);
                }, 0))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ KPI CARDS ═══ */}
      <div className="dash-kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 28 }}>
        {kpis.map((k, idx) => (
          <div key={k.label} className="dash-card-hover" onClick={() => nav(k.path)} style={{
            ...glass, padding: '24px 22px', cursor: 'pointer',
            animation: `dashFadeInUp 0.5s cubic-bezier(0.16,1,0.3,1) ${(idx + 1) * 80}ms backwards`,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 12,
                background: s.accentLight, display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {kpiIcons[idx]}
              </div>
              <ChevronRight color={s.text3} />
            </div>
            <div style={{
              font: `500 10px ${s.MONO}`, textTransform: 'uppercase', letterSpacing: 1.5,
              color: s.text3, marginBottom: 8,
            }}>{k.label}</div>
            <div style={{
              font: `600 32px ${s.FONT}`, color: s.text, marginBottom: 6, letterSpacing: '-0.5px',
              animation: 'dashCountUp 0.6s cubic-bezier(0.16,1,0.3,1) both',
            }}>{k.value}</div>
            <div style={{ font: `400 13px ${s.FONT}`, color: s.text2 }}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* ═══ MAIN GRID: Appointments + Sparkline / Low Stock + Quick Actions ═══ */}
      <div className="dashboard-main-grid" style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: 20 }}>

        {/* LEFT: Upcoming Appointments */}
        <div style={{
          ...glass, overflow: 'hidden',
          animation: 'dashFadeInUp 0.5s cubic-bezier(0.16,1,0.3,1) 400ms backwards',
        }}>
          <div style={{
            padding: '18px 22px', borderBottom: '1px solid rgba(0,0,0,0.04)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <span style={{ font: `600 15px ${s.FONT}`, color: s.text }}>Upcoming Appointments</span>
            <button onClick={() => nav('/schedule')} style={{ ...s.pillGhost, padding: '5px 14px', fontSize: 11 }}>View All</button>
          </div>
          <div>
            {upcoming.map((a, idx) => {
              const svc = services.find(sv => sv.id === a.serviceId);
              const prov = providers.find(p => p.id === a.providerId);
              const isToday = a.date === today;
              const statusColor = a.status === 'confirmed' ? s.success : a.status === 'pending' ? s.warning : s.text3;
              return (
                <div key={a.id} className="dash-card-hover" style={{
                  margin: '6px 10px', padding: '14px 16px', borderRadius: 14,
                  background: isToday ? `${s.accentLight}` : 'rgba(255,255,255,0.4)',
                  border: isToday ? `1px solid ${s.accent}20` : '1px solid rgba(0,0,0,0.02)',
                  display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer',
                  animation: `dashFadeInUp 0.4s cubic-bezier(0.16,1,0.3,1) ${500 + idx * 50}ms backwards`,
                  transition: 'all 0.25s cubic-bezier(0.16,1,0.3,1)',
                }} onClick={() => nav('/schedule')}>
                  {/* Date tile */}
                  <div style={{
                    width: 48, height: 48, borderRadius: 12,
                    background: isToday ? s.accent : 'rgba(255,255,255,0.8)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    boxShadow: isToday ? `0 4px 12px ${s.accent}30` : '0 2px 8px rgba(0,0,0,0.04)',
                  }}>
                    <div style={{ font: `600 14px ${s.FONT}`, color: isToday ? s.accentText : s.text, lineHeight: 1 }}>
                      {new Date(a.date + 'T12:00:00').getDate()}
                    </div>
                    <div style={{ font: `500 9px ${s.MONO}`, color: isToday ? `${s.accentText}BB` : s.text3, textTransform: 'uppercase' }}>
                      {new Date(a.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short' })}
                    </div>
                  </div>
                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ font: `500 14px ${s.FONT}`, color: s.text }}>{a.patientName}</div>
                    <div style={{ font: `400 12px ${s.FONT}`, color: s.text2 }}>{svc?.name || 'Service'} — {prov?.name || 'Provider'}</div>
                  </div>
                  {/* Time + status */}
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ font: `500 12px ${s.MONO}`, color: s.text, marginBottom: 2 }}>{a.time}</div>
                    <span style={{
                      display: 'inline-block', padding: '2px 8px', borderRadius: 100,
                      font: `500 9px ${s.FONT}`, textTransform: 'uppercase', letterSpacing: 0.5,
                      background: a.status === 'confirmed' ? '#F0FDF4' : a.status === 'pending' ? '#FFFBEB' : 'rgba(0,0,0,0.04)',
                      color: statusColor,
                    }}>{a.status}</span>
                  </div>
                </div>
              );
            })}
            {upcoming.length === 0 && (
              <div style={{ padding: 48, textAlign: 'center', font: `400 13px ${s.FONT}`, color: s.text3 }}>No upcoming appointments</div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Revenue Sparkline */}
          <div style={{
            ...glass, padding: '20px 22px',
            animation: 'dashFadeInUp 0.5s cubic-bezier(0.16,1,0.3,1) 480ms backwards',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div>
                <div style={{ font: `500 10px ${s.MONO}`, textTransform: 'uppercase', letterSpacing: 1.5, color: s.text3, marginBottom: 4 }}>7-Day Revenue Trend</div>
                <div style={{ font: `600 22px ${s.FONT}`, color: s.text, letterSpacing: '-0.3px' }}>{fmt(monthRevenue)}</div>
              </div>
              <div style={{
                padding: '4px 10px', borderRadius: 100,
                background: '#F0FDF4', font: `500 11px ${s.FONT}`, color: s.success,
              }}>+12%</div>
            </div>
            <MiniSparkline accent={s.accent} />
          </div>

          {/* Low Stock Alerts */}
          <div style={{
            ...glass, overflow: 'hidden',
            animation: 'dashFadeInUp 0.5s cubic-bezier(0.16,1,0.3,1) 560ms backwards',
          }}>
            <div style={{
              padding: '16px 22px', borderBottom: '1px solid rgba(0,0,0,0.04)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <BoxIcon color={lowStock.length > 0 ? s.warning : s.text3} />
                <span style={{ font: `600 14px ${s.FONT}`, color: s.text }}>Low Stock</span>
                {lowStock.length > 0 && (
                  <span style={{
                    width: 20, height: 20, borderRadius: '50%', background: s.warning,
                    color: '#fff', font: `600 10px ${s.FONT}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>{lowStock.length}</span>
                )}
              </div>
              <button onClick={() => nav('/inventory')} style={{ ...s.pillGhost, padding: '5px 12px', fontSize: 11 }}>Inventory</button>
            </div>
            {lowStock.length === 0 ? (
              <div style={{ padding: 28, textAlign: 'center', font: `400 13px ${s.FONT}`, color: s.text3 }}>All stock levels healthy</div>
            ) : lowStock.slice(0, 4).map((item, idx) => (
              <div key={item.id} style={{
                padding: '12px 22px', borderBottom: '1px solid rgba(0,0,0,0.03)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                animation: `dashFadeInUp 0.3s ease ${600 + idx * 40}ms backwards`,
              }}>
                <div>
                  <div style={{ font: `500 13px ${s.FONT}`, color: s.text }}>{item.name}</div>
                  <div style={{ font: `400 11px ${s.FONT}`, color: s.text3 }}>{item.category}</div>
                </div>
                <span style={{
                  padding: '3px 10px', borderRadius: 100,
                  font: `600 11px ${s.MONO}`,
                  background: item.quantity <= item.reorderAt / 2 ? '#FEF2F2' : '#FFFBEB',
                  color: item.quantity <= item.reorderAt / 2 ? s.danger : s.warning,
                }}>{item.quantity} left</span>
              </div>
            ))}
          </div>

          {/* Quick Actions */}
          <div style={{
            ...glass, padding: '20px 22px',
            animation: 'dashFadeInUp 0.5s cubic-bezier(0.16,1,0.3,1) 640ms backwards',
          }}>
            <div style={{ font: `600 14px ${s.FONT}`, color: s.text, marginBottom: 14 }}>Quick Actions</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[
                { label: 'New Patient', path: '/patients', icon: (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" /><line x1="20" y1="8" x2="20" y2="14" /><line x1="23" y1="11" x2="17" y2="11" />
                  </svg>
                )},
                { label: 'Book Appointment', path: '/schedule', icon: (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                )},
                { label: 'Send Email', path: '/email', icon: (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" />
                  </svg>
                )},
                { label: 'Text Blast', path: '/texts', icon: (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                )},
              ].map(a => (
                <button key={a.label} className="dash-action-btn" onClick={() => nav(a.path)} style={{
                  padding: '14px 16px',
                  background: 'rgba(255,255,255,0.5)',
                  border: '1px solid rgba(0,0,0,0.06)',
                  borderRadius: 12, cursor: 'pointer', textAlign: 'left',
                  font: `500 13px ${s.FONT}`, color: s.text,
                  transition: 'all 0.25s cubic-bezier(0.16,1,0.3,1)',
                  display: 'flex', alignItems: 'center', gap: 10,
                  backdropFilter: 'blur(8px)',
                }}>
                  <span style={{ opacity: 0.6 }}>{a.icon}</span>
                  {a.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 860px) {
          .dashboard-main-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 768px) {
          .dashboard-main-grid { grid-template-columns: 1fr !important; }
          .dash-hero {
            padding: 20px 18px !important;
          }
          .dash-hero h1 {
            font-size: 22px !important;
          }
          .dash-hero-right {
            display: none !important;
          }
          .dash-kpi-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 10px !important;
          }
          .dash-kpi-card {
            padding: 16px 14px !important;
          }
          .dash-kpi-card .dash-kpi-value {
            font-size: 24px !important;
          }
          .dash-kpi-card .dash-kpi-sub {
            font-size: 11px !important;
          }
          .dash-quick-actions {
            grid-template-columns: 1fr !important;
          }
          .dash-appt-item {
            padding: 12px 14px !important;
          }
          .dash-sparkline-section {
            display: none !important;
          }
        }
        @media (max-width: 400px) {
          .dash-kpi-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

    </div>
  );
}
