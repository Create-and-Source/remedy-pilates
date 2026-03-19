// Home — warm editorial landing for Pilates & Barre
import { useNavigate } from 'react-router-dom';
import { useStyles, useTheme } from '../theme';
import { getSettings, getPatients, getAppointments, getServices, getInventory, getRetentionAlerts } from '../data/store';

const fmt = (cents) => `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 0 })}`;

export default function Home() {
  const s = useStyles();
  const { theme } = useTheme();
  const nav = useNavigate();
  const settings = getSettings();
  const name = settings.businessName || 'Pilates & Barre';
  const tagline = settings.tagline || 'Form. Strength. Balance.';

  // Pull real data for the dashboard preview
  const clients = getPatients();
  const appointments = getAppointments();
  const services = getServices();
  const inventory = getInventory();
  const alerts = getRetentionAlerts();

  const today = new Date().toISOString().slice(0, 10);
  const todayAppts = appointments.filter(a => a.date === today);
  const thisMonth = today.slice(0, 7);
  const monthAppts = appointments.filter(a => a.date?.startsWith(thisMonth) && a.status === 'completed');
  const monthRevenue = monthAppts.reduce((sum, a) => {
    const svc = services.find(sv => sv.id === a.serviceId);
    return sum + (svc?.price || 0);
  }, 0);
  const pendingAlerts = alerts.filter(a => a.status === 'pending').length;

  return (
    <div style={{ minHeight: '100vh', background: '#FAF6F1', color: '#2D2A26', overflow: 'hidden' }}>
      {/* Warm ambient gradient */}
      <div style={{
        position: 'fixed', top: '-20%', right: '-10%',
        width: 900, height: 900, borderRadius: '50%',
        background: `radial-gradient(circle, ${theme.accent}15 0%, transparent 55%)`,
        filter: 'blur(100px)', pointerEvents: 'none',
      }} />
      <div style={{
        position: 'fixed', bottom: '-30%', left: '-15%',
        width: 700, height: 700, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(196,112,75,0.08) 0%, transparent 55%)',
        filter: 'blur(80px)', pointerEvents: 'none',
      }} />

      {/* Nav — warm glass */}
      <nav style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        paddingTop: 'env(safe-area-inset-top)', paddingBottom: '16px', paddingLeft: '32px', paddingRight: '32px',
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: 'rgba(250,246,241,0.85)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(0,0,0,0.06)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10, background: theme.accent,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            font: `700 14px ${s.FONT}`, color: theme.accentText,
          }}>
            {(settings.businessName || 'Pilates')[0]}
          </div>
          <span style={{ font: `600 16px ${s.FONT}`, color: '#2D2A26' }}>{name}</span>
        </div>
        <div className="home-nav-btns" style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button onClick={() => nav('/book')} style={{
            padding: '8px 20px', borderRadius: 100, border: '1px solid rgba(0,0,0,0.1)',
            background: 'transparent', color: '#6B6560', font: `400 13px ${s.FONT}`, cursor: 'pointer',
          }}>Book a Class</button>
          <button onClick={() => nav('/portal')} style={{
            padding: '8px 20px', borderRadius: 100, border: '1px solid rgba(0,0,0,0.1)',
            background: 'transparent', color: '#6B6560', font: `400 13px ${s.FONT}`, cursor: 'pointer',
          }}>Client Portal</button>
          <button onClick={() => nav('/admin')} style={{
            padding: '8px 20px', borderRadius: 100, border: 'none',
            background: theme.accent, color: theme.accentText, font: `500 13px ${s.FONT}`, cursor: 'pointer',
            boxShadow: `0 2px 16px ${theme.accent}30`,
          }}>Open Studio</button>
        </div>
      </nav>

      {/* Hero — warm, editorial */}
      <div className="home-hero-section" style={{
        textAlign: 'center', padding: '120px 24px 48px', position: 'relative', zIndex: 10,
      }}>
        <div style={{
          font: `500 11px ${s.MONO}`, textTransform: 'uppercase', letterSpacing: 4,
          color: theme.accent, marginBottom: 20,
        }}>{tagline}</div>
        <h1 style={{
          font: `400 52px ${s.DISPLAY}`, color: '#2D2A26', marginBottom: 16,
          letterSpacing: '-0.5px', lineHeight: 1.15,
        }}>
          Your studio,{' '}
          <span style={{ fontStyle: 'italic', color: theme.accent }}>elevated</span>
        </h1>
        <p style={{
          font: `300 17px ${s.FONT}`, color: '#8A847D',
          maxWidth: 520, margin: '0 auto 36px', lineHeight: 1.7,
        }}>
          Scheduling, class packages, client portal, memberships, and marketing — all in one beautiful platform built for movement studios.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => nav('/admin')} style={{
            padding: '14px 40px', borderRadius: 100, border: 'none',
            background: theme.accent, color: theme.accentText,
            font: `600 15px ${s.FONT}`, cursor: 'pointer',
            boxShadow: `0 4px 24px ${theme.accent}30`,
            transition: 'all 0.25s cubic-bezier(0.16,1,0.3,1)',
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
          >Explore the Dashboard</button>
          <button onClick={() => nav('/book')} style={{
            padding: '14px 40px', borderRadius: 100,
            border: `1.5px solid ${theme.accent}40`,
            background: 'transparent', color: theme.accent,
            font: `500 15px ${s.FONT}`, cursor: 'pointer',
            transition: 'all 0.25s cubic-bezier(0.16,1,0.3,1)',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = `${theme.accent}08`; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
          >Book a Class</button>
          <a href="/book/free-trial" style={{
            display: 'inline-block', padding: '14px 32px', background: '#C4704B', color: '#fff',
            borderRadius: 100, fontFamily: "'Outfit', sans-serif", fontSize: 15, fontWeight: 600,
            textDecoration: 'none', boxShadow: '0 4px 16px rgba(196,112,75,0.25)',
            transition: 'all 0.25s cubic-bezier(0.16,1,0.3,1)',
          }}>Try Your First Class Free &rarr;</a>
        </div>
      </div>

      {/* Live Dashboard Preview — real data from localStorage */}
      <div className="home-preview-section" style={{
        maxWidth: 1000, margin: '0 auto', padding: '0 24px 60px',
        position: 'relative', zIndex: 10,
      }}>
        {/* Browser chrome */}
        <div style={{
          background: 'rgba(255,255,255,0.8)', borderRadius: '16px 16px 0 0',
          padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 8,
          borderBottom: '1px solid rgba(0,0,0,0.06)',
          border: '1px solid rgba(0,0,0,0.06)', borderBottomWidth: 0,
        }}>
          <div style={{ display: 'flex', gap: 6 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#FF5F57' }} />
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#FFBD2E' }} />
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#28C840' }} />
          </div>
          <div style={{
            flex: 1, background: 'rgba(0,0,0,0.03)', borderRadius: 8, padding: '5px 14px',
            font: `400 11px ${s.MONO}`, color: '#AAA', textAlign: 'center',
          }}>pilatesstudio.com/admin</div>
        </div>

        {/* Dashboard content */}
        <div onClick={() => nav('/admin')} style={{
          background: '#FFFFFF', borderRadius: '0 0 16px 16px', padding: '24px 28px',
          cursor: 'pointer', transition: 'all 0.3s',
          border: '1px solid rgba(0,0,0,0.06)', borderTopWidth: 0,
          boxShadow: '0 20px 60px rgba(0,0,0,0.08)',
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 30px 80px rgba(0,0,0,0.12)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 20px 60px rgba(0,0,0,0.08)'; }}
        >
          {/* Mini dashboard header */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ font: `500 18px ${s.DISPLAY}`, color: '#2D2A26', marginBottom: 2 }}>Studio Dashboard</div>
            <div style={{ font: `400 12px ${s.FONT}`, color: '#AAA' }}>
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} overview
            </div>
          </div>

          {/* KPI cards */}
          <div className="home-kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 16 }}>
            {[
              { label: 'Classes Today', value: todayAppts.length },
              { label: 'Monthly Revenue', value: fmt(monthRevenue) },
              { label: 'Active Clients', value: clients.length },
              { label: 'Follow-Ups', value: pendingAlerts },
            ].map(k => (
              <div key={k.label} style={{
                padding: '14px 12px', borderRadius: 12,
                background: '#FAF6F1',
                border: '1px solid rgba(0,0,0,0.04)',
              }}>
                <div style={{ font: `500 8px ${s.MONO}`, textTransform: 'uppercase', letterSpacing: 1.2, color: '#AAA', marginBottom: 4 }}>{k.label}</div>
                <div style={{ font: `600 20px ${s.FONT}`, color: '#2D2A26' }}>{k.value}</div>
              </div>
            ))}
          </div>

          {/* Mini appointment list */}
          <div style={{
            padding: '12px 14px', borderRadius: 12,
            background: '#FAF6F1', border: '1px solid rgba(0,0,0,0.04)',
          }}>
            <div style={{ font: `600 11px ${s.FONT}`, color: '#2D2A26', marginBottom: 8 }}>Upcoming Classes</div>
            {appointments.filter(a => a.date >= today && a.status !== 'completed').sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`)).slice(0, 3).map(a => (
              <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                <span style={{ font: `400 11px ${s.FONT}`, color: '#6B6560' }}>{a.patientName}</span>
                <span style={{ font: `500 10px ${s.MONO}`, color: '#AAA' }}>{a.time}</span>
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: 14, font: `500 12px ${s.FONT}`, color: theme.accent }}>
            Click anywhere to explore the full dashboard →
          </div>
        </div>
      </div>

      {/* Feature pills */}
      <div style={{
        display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center',
        padding: '0 24px 40px', position: 'relative', zIndex: 10,
      }}>
        {['22 Admin Pages', 'Client Portal', 'DM Inbox', 'Progress Tracking', 'Online Booking', 'Memberships', 'Recovery Tips', 'Referrals', 'White-Label Branding'].map(f => (
          <span key={f} style={{
            padding: '6px 14px', borderRadius: 100, font: `400 11px ${s.FONT}`,
            color: '#8A847D', border: '1px solid rgba(0,0,0,0.08)',
            background: 'rgba(255,255,255,0.5)',
          }}>{f}</span>
        ))}
      </div>

      {/* Quick links */}
      <div style={{
        display: 'flex', gap: 12, justifyContent: 'center', padding: '20px 24px 60px',
        position: 'relative', zIndex: 10,
      }}>
        {[
          { label: 'Studio Dashboard', path: '/admin' },
          { label: 'Client Portal', path: '/portal' },
          { label: 'Book Online', path: '/book' },
        ].map(l => (
          <button key={l.label} onClick={() => nav(l.path)} style={{
            padding: '12px 28px', borderRadius: 14, cursor: 'pointer',
            background: 'rgba(255,255,255,0.6)', border: '1px solid rgba(0,0,0,0.06)',
            font: `500 13px ${s.FONT}`, color: '#6B6560',
            backdropFilter: 'blur(8px)', transition: 'all 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.9)'; e.currentTarget.style.borderColor = `${theme.accent}30`; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.6)'; e.currentTarget.style.borderColor = 'rgba(0,0,0,0.06)'; }}
          >{l.label}</button>
        ))}
      </div>

      <style>{`
        @media (max-width: 768px) {
          .home-kpi-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
          .home-nav-btns {
            gap: 6px !important;
          }
          .home-nav-btns button {
            padding: 6px 12px !important;
            font-size: 11px !important;
          }
          .home-hero-section {
            padding: 90px 18px 32px !important;
          }
          .home-hero-section h1 {
            font-size: 32px !important;
          }
          .home-hero-section p {
            font-size: 14px !important;
          }
          .home-preview-section {
            padding: 0 14px 40px !important;
          }
        }
        @media (max-width: 380px) {
          .home-nav-btns button:not(:last-child) {
            display: none !important;
          }
          .home-hero-section h1 {
            font-size: 28px !important;
          }
        }
      `}</style>
    </div>
  );
}
