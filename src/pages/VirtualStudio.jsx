import { useState, useCallback } from 'react';
import { useStyles } from '../theme';
import { getProviders, getServices } from '../data/store';

// ── Virtual Studio ──
// Hybrid live/virtual class management
// Video class scheduling, WebRTC simulation, posture overlay concept

const VIRTUAL_CLASSES = [
  { id: 'VC-1', name: 'Live Reformer — At Home', instructor: 'INS-2', type: 'SVC-1', day: 'Mon/Wed/Fri', time: '7:00 AM', duration: 55, capacity: 20, enrolled: 14, price: 2500, format: 'live', platform: 'Zoom' },
  { id: 'VC-2', name: 'Virtual Mat Pilates', instructor: 'INS-4', type: 'SVC-2', day: 'Tue/Thu', time: '6:30 AM', duration: 45, capacity: 30, enrolled: 22, price: 1800, format: 'live', platform: 'Zoom' },
  { id: 'VC-3', name: 'Barre Burn — Livestream', instructor: 'INS-3', type: 'SVC-4', day: 'Mon/Wed', time: '5:30 PM', duration: 45, capacity: 25, enrolled: 19, price: 2200, format: 'live', platform: 'Zoom' },
  { id: 'VC-4', name: 'Stretch & Restore — On Demand', instructor: 'INS-4', type: 'SVC-7', day: 'Anytime', time: 'On Demand', duration: 30, capacity: null, enrolled: 87, price: 1200, format: 'on-demand', platform: 'Video Library' },
  { id: 'VC-5', name: 'Prenatal Pilates — Virtual', instructor: 'INS-2', type: 'SVC-11', day: 'Sat', time: '9:00 AM', duration: 45, capacity: 15, enrolled: 8, price: 2500, format: 'live', platform: 'Zoom' },
  { id: 'VC-6', name: 'Core Foundations — Series', instructor: 'INS-1', type: 'SVC-2', day: 'Self-paced', time: 'On Demand', duration: 30, capacity: null, enrolled: 143, price: 4900, format: 'series', platform: 'Video Library' },
  { id: 'VC-7', name: 'TRX Home Workout', instructor: 'INS-3', type: 'SVC-5', day: 'Tue/Thu', time: '12:00 PM', duration: 45, capacity: 20, enrolled: 11, price: 2200, format: 'live', platform: 'Zoom' },
  { id: 'VC-8', name: 'Posture Correction Workshop', instructor: 'INS-6', type: 'SVC-2', day: 'Monthly', time: '10:00 AM', duration: 90, capacity: 50, enrolled: 34, price: 3500, format: 'workshop', platform: 'Zoom' },
];

const ON_DEMAND_LIBRARY = [
  { id: 'OD-1', title: 'Reformer Foundations', instructor: 'Alex Morgan', duration: 35, level: 'Beginner', views: 1240, rating: 4.9, category: 'Reformer' },
  { id: 'OD-2', title: 'Power Reformer Flow', instructor: 'Sam Rivera', duration: 55, level: 'Advanced', views: 890, rating: 4.8, category: 'Reformer' },
  { id: 'OD-3', title: 'Classical Mat — Full Order', instructor: 'Taylor Brooks', duration: 50, level: 'Intermediate', views: 2100, rating: 4.9, category: 'Mat' },
  { id: 'OD-4', title: 'Barre Sculpt Express', instructor: 'Jordan Chen', duration: 30, level: 'All Levels', views: 3200, rating: 4.7, category: 'Barre' },
  { id: 'OD-5', title: 'Prenatal Safe Flow', instructor: 'Sam Rivera', duration: 40, level: 'Prenatal', views: 560, rating: 5.0, category: 'Prenatal' },
  { id: 'OD-6', title: 'Deep Stretch & Release', instructor: 'Riley Kim', duration: 25, level: 'All Levels', views: 4500, rating: 4.9, category: 'Recovery' },
  { id: 'OD-7', title: 'Core Rehab Series Ep.1', instructor: 'Alex Morgan', duration: 20, level: 'Beginner', views: 780, rating: 4.8, category: 'Rehab' },
  { id: 'OD-8', title: 'TRX Total Body', instructor: 'Jordan Chen', duration: 45, level: 'Intermediate', views: 670, rating: 4.6, category: 'TRX' },
];

export default function VirtualStudio() {
  const s = useStyles();
  const [tab, setTab] = useState('live'); // live | on-demand | analytics
  const [selectedClass, setSelectedClass] = useState(null);
  const [showJoin, setShowJoin] = useState(false);

  const providers = getProviders();
  const services = getServices();

  const getInstructor = (id) => providers.find(p => p.id === id);

  const cardStyle = {
    background: 'rgba(255,255,255,0.72)', backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255,255,255,0.6)', borderRadius: 16,
    boxShadow: s.shadow,
  };

  const formatColors = { live: '#16A34A', 'on-demand': '#2563EB', series: '#8B5CF6', workshop: '#D97706' };

  // Analytics data
  const analyticsData = {
    totalVirtualClients: 186,
    monthlyRevenue: 847500, // cents
    avgAttendance: 72,
    completionRate: 84,
    topClass: 'Virtual Mat Pilates',
    growthRate: 23,
  };

  const handleJoin = useCallback(() => {
    setShowJoin(true);
    setTimeout(() => setShowJoin(false), 3000);
  }, []);

  return (
    <div style={{ animation: 'fadeIn 0.5s ease' }}>
      <style>{`
        @media (max-width: 768px) {
          .vs-analytics-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ font: `400 11px ${s.MONO}`, textTransform: 'uppercase', letterSpacing: 1.5, color: s.text3, marginBottom: 4 }}>
          Intelligence
        </div>
        <h1 style={{ font: `600 28px ${s.DISPLAY}`, color: s.text, margin: 0 }}>
          Virtual Studio
        </h1>
        <p style={{ font: `400 14px ${s.FONT}`, color: s.text2, margin: '6px 0 0' }}>
          Hybrid live/virtual classes — Zoom integration, on-demand library, posture overlay
        </p>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Virtual Clients', value: analyticsData.totalVirtualClients, icon: '👥' },
          { label: 'Monthly Revenue', value: `$${(analyticsData.monthlyRevenue / 100).toLocaleString()}`, icon: '💰' },
          { label: 'Avg Attendance', value: `${analyticsData.avgAttendance}%`, icon: '📊' },
          { label: 'Growth', value: `+${analyticsData.growthRate}%`, icon: '📈' },
        ].map(kpi => (
          <div key={kpi.label} style={{ ...cardStyle, padding: 18, textAlign: 'center' }}>
            <div style={{ fontSize: 20, marginBottom: 4 }}>{kpi.icon}</div>
            <div style={{ font: `700 22px ${s.FONT}`, color: s.text }}>{kpi.value}</div>
            <div style={{ font: `400 10px ${s.MONO}`, color: s.text3, marginTop: 4, textTransform: 'uppercase' }}>{kpi.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {[
          { id: 'live', label: `Live Classes (${VIRTUAL_CLASSES.filter(c => c.format === 'live').length})` },
          { id: 'on-demand', label: `On Demand (${ON_DEMAND_LIBRARY.length})` },
          { id: 'analytics', label: 'Analytics' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: '8px 18px', borderRadius: 10, border: 'none', cursor: 'pointer',
            background: tab === t.id ? s.accent : 'rgba(0,0,0,0.04)',
            color: tab === t.id ? '#fff' : s.text2,
            font: `500 13px ${s.FONT}`, transition: 'all 0.2s',
          }}>{t.label}</button>
        ))}
      </div>

      {/* Join simulation overlay */}
      {showJoin && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 999,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          animation: 'fadeIn 0.3s ease',
        }} onClick={() => setShowJoin(false)}>
          <div style={{ textAlign: 'center', color: '#fff' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📹</div>
            <div style={{ font: `600 24px ${s.FONT}`, marginBottom: 8 }}>Connecting to Zoom...</div>
            <div style={{ font: `400 14px ${s.FONT}`, color: 'rgba(255,255,255,0.6)' }}>
              In production, this opens the Zoom meeting with posture AI overlay
            </div>
            <div style={{ marginTop: 24, display: 'flex', gap: 12, justifyContent: 'center' }}>
              <div style={{ width: 80, height: 80, borderRadius: 12, background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', font: `600 24px ${s.FONT}` }}>🎥</div>
              <div style={{ width: 80, height: 80, borderRadius: 12, background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', font: `600 24px ${s.FONT}` }}>🎤</div>
              <div style={{ width: 80, height: 80, borderRadius: 12, background: 'rgba(196,112,75,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', font: `600 24px ${s.FONT}` }}>📐</div>
            </div>
            <div style={{ font: `400 11px ${s.MONO}`, color: 'rgba(255,255,255,0.4)', marginTop: 12 }}>
              Camera · Mic · Posture AI Overlay
            </div>
          </div>
        </div>
      )}

      {/* Live Classes */}
      {tab === 'live' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }}>
          {VIRTUAL_CLASSES.map(vc => {
            const ins = getInstructor(vc.instructor);
            const fc = formatColors[vc.format] || '#666';
            const pctFull = vc.capacity ? (vc.enrolled / vc.capacity * 100) : null;
            return (
              <div key={vc.id} style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
                {/* Format badge */}
                <div style={{
                  padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  borderBottom: '1px solid rgba(0,0,0,0.04)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{
                      padding: '3px 8px', borderRadius: 6, background: fc + '15',
                      font: `500 10px ${s.MONO}`, color: fc, textTransform: 'uppercase',
                    }}>{vc.format === 'on-demand' ? 'On Demand' : vc.format}</span>
                    <span style={{ font: `400 11px ${s.MONO}`, color: s.text3 }}>{vc.platform}</span>
                  </div>
                  <span style={{ font: `600 14px ${s.FONT}`, color: s.accent }}>${(vc.price / 100).toFixed(0)}</span>
                </div>

                {/* Content */}
                <div style={{ padding: '14px 18px' }}>
                  <div style={{ font: `600 15px ${s.FONT}`, color: s.text, marginBottom: 6 }}>{vc.name}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    {ins && (
                      <div style={{
                        width: 28, height: 28, borderRadius: '50%', background: ins.color || s.accent,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#fff', font: `600 10px ${s.FONT}`,
                      }}>{ins.name.split(' ').map(n => n[0]).join('')}</div>
                    )}
                    <span style={{ font: `400 12px ${s.FONT}`, color: s.text2 }}>{ins?.name || 'TBD'}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
                    <span style={{ font: `400 11px ${s.MONO}`, color: s.text3 }}>📅 {vc.day}</span>
                    <span style={{ font: `400 11px ${s.MONO}`, color: s.text3 }}>🕐 {vc.time}</span>
                    <span style={{ font: `400 11px ${s.MONO}`, color: s.text3 }}>⏱ {vc.duration}min</span>
                  </div>

                  {/* Capacity bar */}
                  {pctFull !== null && (
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ font: `400 11px ${s.MONO}`, color: s.text3 }}>Enrolled</span>
                        <span style={{ font: `500 11px ${s.MONO}`, color: pctFull >= 90 ? '#DC2626' : s.text2 }}>{vc.enrolled}/{vc.capacity}</span>
                      </div>
                      <div style={{ height: 5, borderRadius: 3, background: 'rgba(0,0,0,0.06)' }}>
                        <div style={{ height: 5, borderRadius: 3, width: `${pctFull}%`, background: pctFull >= 90 ? '#DC2626' : pctFull >= 70 ? '#D97706' : '#16A34A' }} />
                      </div>
                    </div>
                  )}
                  {pctFull === null && (
                    <div style={{ font: `400 12px ${s.FONT}`, color: s.text3, marginBottom: 12 }}>
                      {vc.enrolled} enrolled · unlimited access
                    </div>
                  )}

                  <button onClick={handleJoin} style={{
                    width: '100%', padding: '10px', borderRadius: 10, border: 'none',
                    background: vc.format === 'live' ? s.accent : 'rgba(0,0,0,0.04)',
                    color: vc.format === 'live' ? '#fff' : s.text2,
                    font: `500 12px ${s.FONT}`, cursor: 'pointer', transition: 'all 0.2s',
                  }}>
                    {vc.format === 'live' ? '📹 Join Class' : vc.format === 'on-demand' ? '▶️ Watch Now' : '📋 Enroll'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* On Demand Library */}
      {tab === 'on-demand' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {ON_DEMAND_LIBRARY.map(vid => (
            <div key={vid.id} style={{
              ...cardStyle, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 16,
              cursor: 'pointer', transition: 'all 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateX(4px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'none'}>
              {/* Thumbnail placeholder */}
              <div style={{
                width: 80, height: 56, borderRadius: 8, background: 'linear-gradient(135deg, rgba(0,0,0,0.06), rgba(0,0,0,0.02))',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <span style={{ fontSize: 20, opacity: 0.4 }}>▶️</span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ font: `500 14px ${s.FONT}`, color: s.text }}>{vid.title}</div>
                <div style={{ font: `400 12px ${s.FONT}`, color: s.text3, marginTop: 2 }}>
                  {vid.instructor} · {vid.duration}min · {vid.level}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
                <span style={{ padding: '3px 8px', borderRadius: 4, background: 'rgba(0,0,0,0.03)', font: `400 10px ${s.MONO}`, color: s.text3 }}>{vid.category}</span>
                <span style={{ font: `400 11px ${s.MONO}`, color: s.text3 }}>⭐ {vid.rating}</span>
                <span style={{ font: `400 11px ${s.MONO}`, color: s.text3 }}>{vid.views.toLocaleString()} views</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Analytics */}
      {tab === 'analytics' && (
        <div className="vs-analytics-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ ...cardStyle, padding: 24 }}>
            <div style={{ font: `600 15px ${s.FONT}`, color: s.text, marginBottom: 16 }}>Revenue by Format</div>
            {[
              { label: 'Live Classes', value: 65, color: '#16A34A' },
              { label: 'On Demand', value: 20, color: '#2563EB' },
              { label: 'Workshops', value: 10, color: '#D97706' },
              { label: 'Series', value: 5, color: '#8B5CF6' },
            ].map(item => (
              <div key={item.label} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ font: `400 12px ${s.FONT}`, color: s.text2 }}>{item.label}</span>
                  <span style={{ font: `600 12px ${s.MONO}`, color: item.color }}>{item.value}%</span>
                </div>
                <div style={{ height: 6, borderRadius: 3, background: 'rgba(0,0,0,0.06)' }}>
                  <div style={{ height: 6, borderRadius: 3, width: `${item.value}%`, background: item.color }} />
                </div>
              </div>
            ))}
          </div>
          <div style={{ ...cardStyle, padding: 24 }}>
            <div style={{ font: `600 15px ${s.FONT}`, color: s.text, marginBottom: 16 }}>Posture AI Overlay</div>
            <div style={{
              padding: 20, background: 'rgba(0,0,0,0.03)', borderRadius: 12, textAlign: 'center',
            }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>📐</div>
              <div style={{ font: `500 14px ${s.FONT}`, color: s.text, marginBottom: 8 }}>Real-Time Form Check</div>
              <div style={{ font: `400 12px ${s.FONT}`, color: s.text3, lineHeight: 1.6 }}>
                During live virtual classes, the instructor sees a grid of client skeletons via MediaPipe. Auto-flags form issues and sends gentle corrections.
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 14 }}>
                {['Skeleton Overlay', 'Auto-Flags', 'Form Score'].map(f => (
                  <span key={f} style={{ padding: '4px 10px', borderRadius: 6, background: s.accentLight || 'rgba(196,112,75,0.08)', font: `400 10px ${s.MONO}`, color: s.accent }}>{f}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
