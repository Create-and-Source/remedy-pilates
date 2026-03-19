// Home — daily studio experience for Pilates clients
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStyles, useTheme } from '../theme';
import {
  getSettings, getAppointments, getServices,
  getProviders, getLocations,
} from '../data/store';

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmtTime(t) {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'pm' : 'am';
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
}

function fmtDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((d - today) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function dayOfWeek(dateStr) {
  if (!dateStr) return -1;
  return new Date(dateStr + 'T00:00:00').getDay(); // 0=Sun
}

function startOfWeek(d = new Date()) {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  copy.setDate(copy.getDate() - copy.getDay()); // Sunday
  return copy;
}

function toISO(d) { return d.toISOString().slice(0, 10); }

// ── Streak calculation ────────────────────────────────────────────────────────

function calcWeekStats(appointments) {
  const now = new Date();
  const weekStart = startOfWeek(now);
  const weekEnd = toISO(new Date(weekStart.getTime() + 6 * 86400000));
  const weekStartStr = toISO(weekStart);

  const thisWeekCompleted = appointments.filter(
    a => a.status === 'completed' && a.date >= weekStartStr && a.date <= weekEnd
  );
  const count = thisWeekCompleted.length;

  // Days of week that have a completed class (0=Sun..6=Sat)
  const filledDays = new Set(thisWeekCompleted.map(a => dayOfWeek(a.date)));

  // Personal best: max classes in any 7-day (Mon–Sun) week in history
  const completed = appointments.filter(a => a.status === 'completed' && a.date);
  let best = 0;
  if (completed.length) {
    // group by ISO week
    const byCal = {};
    completed.forEach(a => {
      const d = new Date(a.date + 'T00:00:00');
      const sun = new Date(d); sun.setDate(d.getDate() - d.getDay());
      const key = toISO(sun);
      byCal[key] = (byCal[key] || 0) + 1;
    });
    best = Math.max(...Object.values(byCal));
  }

  return { count, filledDays, best };
}

// ── Next class logic ──────────────────────────────────────────────────────────

function getNextClass(appointments, services, providers) {
  const now = new Date();
  const todayStr = toISO(now);
  const upcoming = appointments
    .filter(a => a.status !== 'completed' && a.status !== 'cancelled' && a.date >= todayStr)
    .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));

  if (!upcoming.length) return null;
  const appt = upcoming[0];
  const svc = services.find(s => s.id === appt.serviceId) || {};
  const instructor = providers.find(p => p.id === appt.providerId || p.id === appt.instructorId) || {};

  // minutes until class starts
  let minutesUntil = null;
  if (appt.date === todayStr && appt.time) {
    const [h, m] = appt.time.split(':').map(Number);
    const classTime = new Date(now);
    classTime.setHours(h, m, 0, 0);
    minutesUntil = Math.round((classTime - now) / 60000);
  }

  return { appt, svc, instructor, minutesUntil };
}

// ── Service carousel filters ──────────────────────────────────────────────────

function filterServices(services, keywords) {
  const lower = keywords.map(k => k.toLowerCase());
  return services.filter(s => {
    const hay = `${s.name} ${s.category} ${s.description || ''}`.toLowerCase();
    return lower.some(k => hay.includes(k));
  });
}

function difficultyFor(svc) {
  const hay = `${svc.name} ${svc.category} ${svc.description || ''}`.toLowerCase();
  if (hay.includes('advanced') || hay.includes('burn') || hay.includes('cardio') || hay.includes('trx')) return 'Advanced';
  if (hay.includes('intermediate') || hay.includes('mixed') || hay.includes('barre')) return 'Intermediate';
  return 'Beginner';
}

const DIFF_COLOR = { Beginner: '#16A34A', Intermediate: '#D97706', Advanced: '#DC2626' };

// ── Sub-components ────────────────────────────────────────────────────────────

function PersonIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

// ── Service Card (carousel) ───────────────────────────────────────────────────

function ServiceCard({ svc, providers, s, theme, nav }) {
  const instructor = providers.find(p =>
    p.id === svc.defaultInstructorId || p.id === svc.instructorId
  ) || providers[0];
  const diff = difficultyFor(svc);
  const dur = svc.duration ? `${svc.duration} min` : svc.durationMin ? `${svc.durationMin} min` : null;

  return (
    <div
      onClick={() => nav('/book')}
      style={{
        minWidth: 200, maxWidth: 220, borderRadius: 18,
        background: 'rgba(255,255,255,0.78)',
        backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)',
        border: '1px solid rgba(255,255,255,0.7)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
        padding: '18px 16px 16px',
        cursor: 'pointer', flexShrink: 0,
        scrollSnapAlign: 'start',
        transition: 'transform 0.2s cubic-bezier(0.16,1,0.3,1), box-shadow 0.2s',
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 10px 32px rgba(0,0,0,0.1)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 24px rgba(0,0,0,0.06)'; }}
    >
      {/* Color bar */}
      <div style={{ height: 3, borderRadius: 2, background: theme.accent, marginBottom: 14, width: '40%', opacity: 0.7 }} />
      <div style={{ font: `600 14px ${s.FONT}`, color: '#2D2A26', marginBottom: 10, lineHeight: 1.35 }}>{svc.name}</div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
        {dur && (
          <span style={{
            font: `500 10px ${s.MONO}`, color: '#8A847D',
            background: 'rgba(0,0,0,0.04)', padding: '3px 8px', borderRadius: 100,
          }}>{dur}</span>
        )}
        <span style={{
          font: `500 10px ${s.MONO}`, color: DIFF_COLOR[diff],
          background: `${DIFF_COLOR[diff]}12`, padding: '3px 8px', borderRadius: 100,
        }}>{diff}</span>
      </div>
      {instructor && (
        <div style={{ font: `400 12px ${s.FONT}`, color: '#8A847D' }}>
          {instructor.name.split(' ')[0]}
        </div>
      )}
    </div>
  );
}

// ── Carousel Section ──────────────────────────────────────────────────────────

function CarouselSection({ title, services, providers, s, theme, nav, showAll }) {
  const trackRef = useRef(null);

  if (!services.length) return null;

  return (
    <div className="home-carousel-section" style={{ marginBottom: 32 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingLeft: 4, marginBottom: 14 }}>
        <span style={{ font: `600 15px ${s.FONT}`, color: '#2D2A26' }}>{title}</span>
        <button onClick={() => nav('/book')} style={{
          font: `500 12px ${s.FONT}`, color: theme.accent, background: 'none',
          border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: 3,
        }}>See All <ChevronRight /></button>
      </div>
      <div
        ref={trackRef}
        style={{
          display: 'flex', gap: 12, overflowX: 'auto',
          scrollSnapType: 'x mandatory', paddingBottom: 8,
          WebkitOverflowScrolling: 'touch',
          msOverflowStyle: 'none', scrollbarWidth: 'none',
        }}
        className="home-carousel-track"
      >
        {services.slice(0, 8).map(svc => (
          <ServiceCard key={svc.id} svc={svc} providers={providers} s={s} theme={theme} nav={nav} />
        ))}
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function Home() {
  const s = useStyles();
  const { theme } = useTheme();
  const nav = useNavigate();

  const [mounted, setMounted] = useState(false);
  useEffect(() => { const t = setTimeout(() => setMounted(true), 60); return () => clearTimeout(t); }, []);

  // Data
  const settings = getSettings();
  const studioName = settings.businessName || 'Pilates Studio';
  const appointments = getAppointments();
  const services = getServices();
  const providers = getProviders();
  const locations = getLocations();
  const location = locations[0] || {};

  // User
  const userName = localStorage.getItem('rp_user_name') || '';
  const userInitial = userName ? userName[0].toUpperCase() : null;

  // Next class
  const nextClassData = getNextClass(appointments, services, providers);

  // Streak
  const { count: weekCount, filledDays, best: personalBest } = calcWeekStats(appointments);

  // Carousels
  const reformerServices = filterServices(services, ['reformer']);
  const recoveryServices = filterServices(services, ['stretch', 'restore', 'recovery', 'wellness', 'prenatal', 'postnatal', 'yin']);
  const staffPicks = services.slice(0, 5);

  // Hero CTA type
  let ctaLabel = 'Book Now';
  let ctaPath = '/book';
  if (nextClassData) {
    const { minutesUntil } = nextClassData;
    if (minutesUntil !== null && minutesUntil >= -15 && minutesUntil <= 30) {
      ctaLabel = 'Check In';
      ctaPath = '/check-in';
    } else {
      ctaLabel = 'View Booking';
      ctaPath = '/portal';
    }
  }

  const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <div style={{ minHeight: '100vh', background: '#FAF6F1', color: '#2D2A26', overflowX: 'hidden' }}>

      {/* Ambient blobs */}
      <div style={{
        position: 'fixed', top: '-15%', right: '-8%',
        width: 700, height: 700, borderRadius: '50%',
        background: `radial-gradient(circle, ${theme.accent}12 0%, transparent 60%)`,
        filter: 'blur(90px)', pointerEvents: 'none', zIndex: 0,
      }} />
      <div style={{
        position: 'fixed', bottom: '-20%', left: '-12%',
        width: 600, height: 600, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(196,112,75,0.07) 0%, transparent 60%)',
        filter: 'blur(70px)', pointerEvents: 'none', zIndex: 0,
      }} />

      {/* ── NAV ────────────────────────────────────────────────────────── */}
      <nav style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '0 24px', height: 60,
        paddingTop: 'env(safe-area-inset-top)',
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(250,246,241,0.88)',
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(0,0,0,0.05)',
      }}>
        {/* Logo pill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 10,
            background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent}CC)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            font: `700 13px ${s.FONT}`, color: '#fff',
            boxShadow: `0 2px 10px ${theme.accent}40`,
            flexShrink: 0,
          }}>
            {studioName[0]}
          </div>
          <span style={{ font: `600 15px ${s.FONT}`, color: '#2D2A26' }}>{studioName}</span>
        </div>

        {/* Right: Book + Avatar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={() => nav('/book')}
            style={{
              ...s.pillAccent, padding: '8px 20px',
              font: `600 13px ${s.FONT}`,
            }}
          >
            Book
          </button>
          <div
            onClick={() => nav('/portal')}
            style={{
              width: 36, height: 36, borderRadius: '50%', cursor: 'pointer',
              background: userInitial
                ? `linear-gradient(135deg, ${theme.accent}CC, ${theme.accent}80)`
                : 'rgba(0,0,0,0.06)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: userInitial ? '#fff' : '#8A847D',
              font: `600 14px ${s.FONT}`,
              border: '1.5px solid rgba(255,255,255,0.8)',
              boxShadow: '0 1px 6px rgba(0,0,0,0.08)',
            }}
            title={userName || 'My portal'}
          >
            {userInitial || <PersonIcon />}
          </div>
        </div>
      </nav>

      {/* ── MAIN CONTENT ─────────────────────────────────────────────── */}
      <div style={{ maxWidth: 560, margin: '0 auto', padding: '24px 20px 100px', position: 'relative', zIndex: 1 }}>

        {/* Greeting */}
        <div
          className="home-fade-in"
          style={{
            marginBottom: 20, opacity: mounted ? 1 : 0,
            transform: mounted ? 'translateY(0)' : 'translateY(12px)',
            transition: 'opacity 0.5s ease, transform 0.5s ease',
          }}
        >
          <div style={{ font: `400 13px ${s.MONO}`, color: theme.accent, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 4 }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </div>
          <h1 style={{ font: `400 28px ${s.DISPLAY}`, color: '#2D2A26', margin: 0, lineHeight: 1.25 }}>
            {userName ? `Welcome back, ${userName.split(' ')[0]}.` : 'Good to see you.'}
          </h1>
        </div>

        {/* ── HERO "NEXT UP" CARD ─────────────────────────────────────── */}
        <div
          className="home-fade-in"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? 'translateY(0)' : 'translateY(16px)',
            transition: 'opacity 0.55s ease 0.07s, transform 0.55s ease 0.07s',
            marginBottom: 16,
          }}
        >
          {nextClassData ? (() => {
            const { appt, svc, instructor, minutesUntil } = nextClassData;
            const isImminent = minutesUntil !== null && minutesUntil >= -15 && minutesUntil <= 30;
            return (
              <div style={{
                borderRadius: 22,
                background: `linear-gradient(140deg, ${theme.accent}18 0%, ${theme.accent}08 50%, rgba(255,255,255,0.6) 100%)`,
                backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
                border: `1px solid ${theme.accent}25`,
                boxShadow: `0 8px 40px ${theme.accent}14, 0 2px 8px rgba(0,0,0,0.04)`,
                padding: '24px 22px',
                position: 'relative', overflow: 'hidden',
              }}>
                {/* Soft orb */}
                <div style={{
                  position: 'absolute', top: -40, right: -40,
                  width: 160, height: 160, borderRadius: '50%',
                  background: `radial-gradient(circle, ${theme.accent}20 0%, transparent 70%)`,
                  pointerEvents: 'none',
                }} />

                <div style={{ font: `500 10px ${s.MONO}`, color: theme.accent, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 }}>
                  {isImminent ? '🔴 Starting soon' : '⟶ Next up'}
                </div>

                <div style={{ font: `500 22px ${s.DISPLAY}`, color: '#2D2A26', marginBottom: 4, lineHeight: 1.2 }}>
                  {svc.name || appt.serviceName || 'Class'}
                </div>

                {instructor.name && (
                  <div style={{ font: `400 13px ${s.FONT}`, color: '#8A847D', marginBottom: 14 }}>
                    with {instructor.name}
                  </div>
                )}

                <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
                  {[
                    appt.time && { icon: '🕐', label: fmtTime(appt.time) },
                    appt.date && { icon: '📅', label: fmtDate(appt.date) },
                    (svc.duration || svc.durationMin) && { icon: '⏱', label: `${svc.duration || svc.durationMin} min` },
                    (appt.location || location.name) && { icon: '📍', label: appt.location || location.name },
                  ].filter(Boolean).map(item => (
                    <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <span style={{ fontSize: 13 }}>{item.icon}</span>
                      <span style={{ font: `500 12px ${s.FONT}`, color: '#5A5450' }}>{item.label}</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => nav(ctaPath)}
                  style={{
                    width: '100%', padding: '14px', borderRadius: 14, border: 'none',
                    background: isImminent
                      ? `linear-gradient(135deg, ${theme.accent}, ${theme.accent}CC)`
                      : theme.accent,
                    color: '#fff', font: `600 15px ${s.FONT}`, cursor: 'pointer',
                    boxShadow: `0 4px 20px ${theme.accent}40`,
                    transition: 'all 0.25s cubic-bezier(0.16,1,0.3,1)',
                    letterSpacing: 0.2,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = `0 8px 28px ${theme.accent}50`; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = `0 4px 20px ${theme.accent}40`; }}
                >
                  {ctaLabel}
                </button>
              </div>
            );
          })() : (
            // No upcoming class
            <div style={{
              borderRadius: 22,
              background: 'rgba(255,255,255,0.72)',
              backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.8)',
              boxShadow: '0 8px 40px rgba(0,0,0,0.06)',
              padding: '28px 22px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>🌿</div>
              <div style={{ font: `500 18px ${s.DISPLAY}`, color: '#2D2A26', marginBottom: 8 }}>
                Find Your First Class
              </div>
              <div style={{ font: `400 13px ${s.FONT}`, color: '#8A847D', marginBottom: 20, lineHeight: 1.6 }}>
                Explore our full schedule and book a class that fits your goals.
              </div>
              <button
                onClick={() => nav('/book')}
                style={{ ...s.pillAccent, font: `600 14px ${s.FONT}`, padding: '12px 32px', display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                Browse Schedule <ChevronRight />
              </button>
            </div>
          )}
        </div>

        {/* ── STREAK / PROGRESS ──────────────────────────────────────── */}
        <div
          className="home-fade-in"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? 'translateY(0)' : 'translateY(16px)',
            transition: 'opacity 0.55s ease 0.15s, transform 0.55s ease 0.15s',
            marginBottom: 28,
          }}
        >
          <div style={{
            borderRadius: 18,
            background: 'rgba(255,255,255,0.72)',
            backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(255,255,255,0.8)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
            padding: '16px 20px',
            display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
          }}>
            {/* Flame + count */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 130 }}>
              <span style={{ fontSize: 22 }}>🔥</span>
              <div>
                <div style={{ font: `600 15px ${s.FONT}`, color: '#2D2A26', lineHeight: 1.2 }}>
                  {weekCount} {weekCount === 1 ? 'class' : 'classes'} this week
                </div>
                {personalBest > 0 && (
                  <div style={{ font: `400 11px ${s.FONT}`, color: '#8A847D' }}>
                    Personal best: {personalBest}
                  </div>
                )}
              </div>
            </div>

            {/* Day dots */}
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              {DAYS.map((day, i) => {
                const filled = filledDays.has(i);
                const isToday = new Date().getDay() === i;
                return (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%',
                      background: filled
                        ? `linear-gradient(135deg, ${theme.accent}, ${theme.accent}CC)`
                        : 'rgba(0,0,0,0.05)',
                      border: isToday && !filled ? `2px solid ${theme.accent}60` : '2px solid transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.3s',
                    }}>
                      {filled && <span style={{ color: '#fff', fontSize: 11 }}>✓</span>}
                    </div>
                    <span style={{ font: `500 9px ${s.MONO}`, color: isToday ? theme.accent : '#B0A9A2' }}>
                      {day}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── CAROUSELS ──────────────────────────────────────────────── */}
        <div
          className="home-fade-in"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? 'translateY(0)' : 'translateY(16px)',
            transition: 'opacity 0.55s ease 0.22s, transform 0.55s ease 0.22s',
          }}
        >
          {reformerServices.length > 0 && (
            <CarouselSection
              title="Reformer Basics"
              services={reformerServices}
              providers={providers}
              s={s} theme={theme} nav={nav}
            />
          )}
          {recoveryServices.length > 0 && (
            <CarouselSection
              title="Recovery & Stretch"
              services={recoveryServices}
              providers={providers}
              s={s} theme={theme} nav={nav}
            />
          )}
          <CarouselSection
            title="Staff Picks"
            services={staffPicks}
            providers={providers}
            s={s} theme={theme} nav={nav}
          />
        </div>

        {/* ── QUICK ACTIONS ──────────────────────────────────────────── */}
        <div
          className="home-fade-in"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? 'translateY(0)' : 'translateY(16px)',
            transition: 'opacity 0.55s ease 0.3s, transform 0.55s ease 0.3s',
            marginBottom: 28,
          }}
        >
          <div style={{ font: `500 10px ${s.MONO}`, color: '#8A847D', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 12 }}>
            Quick Actions
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            {[
              { emoji: '📅', label: 'Book', path: '/book' },
              { emoji: '🗓', label: 'Schedule', path: '/admin/schedule' },
              { emoji: '📊', label: 'Progress', path: '/admin/charts' },
              { emoji: '🏷', label: 'Membership', path: '/admin/memberships' },
            ].map(({ emoji, label, path }) => (
              <button
                key={label}
                onClick={() => nav(path)}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                  padding: '16px 8px', borderRadius: 16, border: 'none', cursor: 'pointer',
                  background: 'rgba(255,255,255,0.72)',
                  backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
                  transition: 'all 0.2s cubic-bezier(0.16,1,0.3,1)',
                  borderTop: `2px solid ${theme.accent}25`,
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.04)'; }}
              >
                <span style={{ fontSize: 22 }}>{emoji}</span>
                <span style={{ font: `500 11px ${s.FONT}`, color: '#5A5450' }}>{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── YOUR STUDIO ────────────────────────────────────────────── */}
        <div
          className="home-fade-in"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? 'translateY(0)' : 'translateY(16px)',
            transition: 'opacity 0.55s ease 0.38s, transform 0.55s ease 0.38s',
          }}
        >
          <div style={{ font: `500 10px ${s.MONO}`, color: '#8A847D', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 12 }}>
            Your Studio
          </div>
          <div style={{
            borderRadius: 20,
            background: 'rgba(255,255,255,0.72)',
            backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.8)',
            boxShadow: '0 4px 24px rgba(0,0,0,0.05)',
            overflow: 'hidden',
          }}>
            {/* Map placeholder */}
            <div style={{
              height: 100, position: 'relative',
              background: `linear-gradient(135deg, ${theme.accent}15, ${theme.accent}08)`,
              borderBottom: '1px solid rgba(0,0,0,0.04)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            }}>
              <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              }}>
                <span style={{ fontSize: 28 }}>📍</span>
                <span style={{ font: `500 11px ${s.MONO}`, color: theme.accent, letterSpacing: 1 }}>
                  {location.city && location.state
                    ? `${location.city}, ${location.state}`
                    : 'Studio Location'}
                </span>
              </div>
              {/* Decorative grid lines */}
              <div style={{
                position: 'absolute', inset: 0, opacity: 0.08,
                backgroundImage: `repeating-linear-gradient(0deg, ${theme.accent} 0px, transparent 1px, transparent 24px, ${theme.accent} 25px),
                                  repeating-linear-gradient(90deg, ${theme.accent} 0px, transparent 1px, transparent 24px, ${theme.accent} 25px)`,
                pointerEvents: 'none',
              }} />
            </div>

            {/* Info */}
            <div style={{ padding: '18px 20px' }}>
              <div style={{ font: `600 16px ${s.FONT}`, color: '#2D2A26', marginBottom: 6 }}>
                {studioName}
              </div>
              {(location.address || settings.address) && (
                <div style={{ font: `400 13px ${s.FONT}`, color: '#8A847D', marginBottom: 4 }}>
                  {location.address || settings.address}
                  {(location.city || settings.city) && `, ${location.city || settings.city}`}
                  {(location.state || settings.state) && ` ${location.state || settings.state}`}
                </div>
              )}
              {(location.hours || settings.hours) && (
                <div style={{ font: `400 12px ${s.FONT}`, color: '#AAA4A0', marginBottom: 12 }}>
                  {location.hours || settings.hours}
                </div>
              )}

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: 10 }}>
                {(location.address || settings.address) && (
                  <a
                    href={`https://maps.google.com/?q=${encodeURIComponent(
                      [location.address || settings.address, location.city || settings.city].filter(Boolean).join(', ')
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      flex: 1, padding: '10px', borderRadius: 12, border: `1.5px solid ${theme.accent}30`,
                      background: `${theme.accent}08`, color: theme.accent,
                      font: `500 13px ${s.FONT}`, cursor: 'pointer', textDecoration: 'none',
                      textAlign: 'center', transition: 'all 0.2s',
                    }}
                  >
                    Directions
                  </a>
                )}
                {(location.phone || settings.phone) && (
                  <a
                    href={`tel:${(location.phone || settings.phone).replace(/\D/g, '')}`}
                    style={{
                      flex: 1, padding: '10px', borderRadius: 12, border: '1px solid rgba(0,0,0,0.06)',
                      background: 'rgba(0,0,0,0.02)', color: '#5A5450',
                      font: `500 13px ${s.FONT}`, cursor: 'pointer', textDecoration: 'none',
                      textAlign: 'center', transition: 'all 0.2s',
                    }}
                  >
                    Call
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

      </div>

      <style>{`
        .home-carousel-track::-webkit-scrollbar { display: none; }

        @media (max-width: 400px) {
          .home-carousel-track { gap: 10px !important; }
        }

        @keyframes homeBlob {
          0%, 100% { transform: scale(1) rotate(0deg); }
          50% { transform: scale(1.05) rotate(3deg); }
        }
      `}</style>
    </div>
  );
}
