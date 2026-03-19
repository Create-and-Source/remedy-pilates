import { useState, useEffect, useRef, useCallback } from 'react';
import { useStyles } from '../theme';
import { getPatients, getAppointments, getServices, getProviders } from '../data/store';

const LOCATIONS = [
  { id: 'downtown', name: 'Downtown Studio', address: '123 Main St', color: null, shortName: 'DWN' },
  { id: 'westside', name: 'Westside Studio', address: '456 West Ave', color: '#3B82F6', shortName: 'WST' },
  { id: 'north', name: 'North Studio', address: '789 North Blvd', color: '#10B981', shortName: 'NTH' },
];

const CLASSES = [
  { name: 'Reformer Flow', duration: 50 },
  { name: 'Barre Burn', duration: 45 },
  { name: 'Mat Pilates', duration: 55 },
  { name: 'Reformer + Cardio', duration: 60 },
  { name: 'Tower Class', duration: 50 },
  { name: 'Jump Board', duration: 45 },
  { name: 'Reformer Basics', duration: 55 },
  { name: 'Core Strength', duration: 50 },
];

const CLASS_TIMES = [
  '6:00 AM', '7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM',
  '12:00 PM', '1:00 PM', '2:00 PM', '4:00 PM', '5:30 PM', '6:30 PM', '7:30 PM',
];

const CAPACITY = 12;

const ANIM_CSS = `
@keyframes pulse {
  0% { transform: scale(1); opacity: 0.9; }
  50% { transform: scale(1.35); opacity: 0.4; }
  100% { transform: scale(1.7); opacity: 0; }
}
@keyframes pulseRing {
  0% { box-shadow: 0 0 0 0 rgba(239,68,68,0.6); }
  70% { box-shadow: 0 0 0 14px rgba(239,68,68,0); }
  100% { box-shadow: 0 0 0 0 rgba(239,68,68,0); }
}
@keyframes fadeInSlide {
  from { transform: translateX(120px); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}
@keyframes ticker {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}
@keyframes glow {
  0%, 100% { box-shadow: 0 0 8px 2px rgba(139,92,246,0.35); }
  50% { box-shadow: 0 0 22px 6px rgba(139,92,246,0.6); }
}
@keyframes dotFill {
  0% { transform: scale(0); opacity: 0; }
  60% { transform: scale(1.3); }
  100% { transform: scale(1); opacity: 1; }
}
@keyframes slideDown {
  from { transform: translateY(-24px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
@keyframes counterUp {
  from { transform: translateY(8px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
`;

function generateSchedule(services, providers) {
  const classNames =
    services && services.length > 0
      ? services.slice(0, 8).map((s) => s.name || s.title || 'Reformer Flow')
      : CLASSES.map((c) => c.name);
  const instructorNames =
    providers && providers.length > 0
      ? providers.slice(0, 6).map((p) => p.name || p.firstName || 'Instructor')
      : ['Alex R.', 'Jordan M.', 'Casey T.', 'Morgan L.', 'Taylor S.', 'Riley P.'];

  const now = new Date();
  const schedule = [];
  let classId = 0;

  LOCATIONS.forEach((loc, li) => {
    const locTimes = CLASS_TIMES.filter((_, i) => (i + li) % 3 !== 2).slice(0, 5);
    locTimes.forEach((time, ti) => {
      const [hourStr, rest] = time.split(':');
      const [minStr, ampm] = rest.split(' ');
      let hour = parseInt(hourStr, 10);
      if (ampm === 'PM' && hour !== 12) hour += 12;
      if (ampm === 'AM' && hour === 12) hour = 0;
      const classStart = new Date(now);
      classStart.setHours(hour, parseInt(minStr, 10), 0, 0);
      const cls = CLASSES[(classId + ti * 3) % CLASSES.length];
      const classEnd = new Date(classStart.getTime() + cls.duration * 60000);
      const isCurrent = now >= classStart && now <= classEnd;
      const isPast = now > classEnd;
      const filled = isCurrent
        ? Math.floor(Math.random() * 6) + 5
        : isPast
        ? Math.floor(Math.random() * CAPACITY) + 4
        : Math.floor(Math.random() * 5) + 1;
      schedule.push({
        id: `cls-${classId++}`,
        locationId: loc.id,
        locationName: loc.name,
        locationColor: loc.color,
        className: classNames[ti % classNames.length],
        instructor: instructorNames[(ti + li) % instructorNames.length],
        time,
        startDate: classStart,
        endDate: classEnd,
        isCurrent,
        isPast,
        filled: Math.min(filled, CAPACITY),
        capacity: CAPACITY,
        duration: cls.duration,
      });
    });
  });

  return schedule.sort((a, b) => a.startDate - b.startDate);
}

function timeRemaining(endDate) {
  const diff = endDate - new Date();
  if (diff <= 0) return 'Ended';
  const mins = Math.floor(diff / 60000);
  return `${mins}m remaining`;
}

export default function LiveDashboard() {
  const s = useStyles();
  const accentColor = s.accent || '#8B5CF6';

  const [patients] = useState(() => {
    try { return getPatients() || []; } catch { return []; }
  });
  const [services] = useState(() => {
    try { return getServices() || []; } catch { return []; }
  });
  const [providers] = useState(() => {
    try { return getProviders() || []; } catch { return []; }
  });

  const [schedule] = useState(() => generateSchedule(services, providers));

  const clientNames =
    patients && patients.length > 5
      ? patients.map(
          (p) =>
            `${p.firstName || (p.name && p.name.split(' ')[0]) || 'Client'} ${(
              (p.lastName || (p.name && p.name.split(' ')[1]) || 'A.').charAt(0)
            )}.`
        )
      : [
          'Maya C.', 'Jordan T.', 'Sam R.', 'Alex M.', 'Riley P.',
          'Casey L.', 'Morgan S.', 'Taylor B.', 'Quinn D.', 'Avery N.',
          'Dana K.', 'Jesse W.', 'Logan F.', 'Skyler H.', 'Reese V.',
          'Blake O.', 'Drew J.', 'Finley Y.', 'Hayden Z.', 'Parker E.',
        ];

  const [locationState, setLocationState] = useState(() =>
    LOCATIONS.map((loc) => {
      const current = schedule.find((c) => c.locationId === loc.id && c.isCurrent);
      return {
        id: loc.id,
        checkedIn: current ? current.filled : 0,
        capacity: CAPACITY,
        pulsing: false,
        lastCheckIn: null,
        currentClass: current || null,
      };
    })
  );

  const [toasts, setToasts] = useState([]);
  const [activityFeed, setActivityFeed] = useState(() => {
    const types = ['check-in', 'booking', 'check-in', 'booking', 'check-in'];
    return types.map((type, i) => ({
      id: `init-${i}`,
      type,
      client: ['Maya C.', 'Jordan T.', 'Sam R.', 'Alex M.', 'Riley P.'][i],
      location: LOCATIONS[i % 3].name,
      className: CLASSES[i % CLASSES.length].name,
      time: new Date(Date.now() - (5 - i) * 90000),
    }));
  });

  const [totalCheckIns, setTotalCheckIns] = useState(47);
  const [revenueToday, setRevenueToday] = useState(3240);
  const [hourlyData, setHourlyData] = useState([3, 7, 12, 8, 5, 9, 11, 6]);
  const [fullscreen, setFullscreen] = useState(false);
  const toastIdRef = useRef(0);

  const typeColors = {
    'check-in': '#10B981',
    booking: '#3B82F6',
    cancellation: '#EF4444',
    waitlist: '#F59E0B',
  };
  const typeLabels = {
    'check-in': 'Check-in',
    booking: 'Booking',
    cancellation: 'Cancelled',
    waitlist: 'Waitlist',
  };

  const fireEvent = useCallback(() => {
    const locIdx = Math.floor(Math.random() * 3);
    const loc = LOCATIONS[locIdx];
    const client = clientNames[Math.floor(Math.random() * clientNames.length)];
    const eventTypes = ['check-in', 'check-in', 'check-in', 'booking', 'cancellation', 'waitlist'];
    const weights = [0.5, 0.5, 0.5, 0.25, 0.1, 0.15];
    const roll = Math.random();
    let cumulative = 0;
    let type = 'check-in';
    for (let i = 0; i < eventTypes.length; i++) {
      cumulative += weights[i];
      if (roll < cumulative) { type = eventTypes[i]; break; }
    }
    const clsForLoc = schedule.filter((c) => c.locationId === loc.id);
    const cls =
      clsForLoc[Math.floor(Math.random() * clsForLoc.length)] || schedule[0];

    if (type === 'check-in') {
      setLocationState((prev) =>
        prev.map((ls, i) => {
          if (i !== locIdx) return ls;
          return {
            ...ls,
            checkedIn: Math.min(ls.checkedIn + 1, ls.capacity),
            pulsing: true,
            lastCheckIn: client,
          };
        })
      );
      setTimeout(() => {
        setLocationState((prev) =>
          prev.map((ls, i) => (i === locIdx ? { ...ls, pulsing: false } : ls))
        );
      }, 1200);
      setTotalCheckIns((n) => n + 1);
      setRevenueToday((r) => r + Math.floor(Math.random() * 25) + 20);
      setHourlyData((prev) => {
        const next = [...prev];
        next[next.length - 1] = next[next.length - 1] + 1;
        return next;
      });
    }

    const toastId = ++toastIdRef.current;
    const toastText = {
      'check-in': `${client} checked in`,
      booking: `${client} booked a spot`,
      cancellation: `${client} cancelled`,
      waitlist: `${client} joined waitlist`,
    };
    setToasts((prev) => [
      ...prev.slice(-4),
      { id: toastId, type, text: toastText[type] || '', location: loc.name, cls: cls ? cls.className : 'class' },
    ]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== toastId)), 2200);

    setActivityFeed((prev) =>
      [
        {
          id: `evt-${Date.now()}`,
          type,
          client,
          location: loc.name,
          className: cls ? cls.className : 'Reformer Flow',
          time: new Date(),
        },
        ...prev,
      ].slice(0, 15)
    );
  }, [clientNames, schedule]);

  useEffect(() => {
    let timeout;
    const scheduleNext = () => {
      const delay = Math.random() * 5000 + 3000;
      timeout = setTimeout(() => {
        fireEvent();
        scheduleNext();
      }, delay);
    };
    scheduleNext();
    return () => clearTimeout(timeout);
  }, [fireEvent]);

  const tickerContent =
    LOCATIONS.map((loc) => {
      const ls = locationState.find((l) => l.id === loc.id);
      const cur = schedule.find((c) => c.locationId === loc.id && c.isCurrent);
      return `${loc.name}: ${ls ? ls.checkedIn : 0}/${CAPACITY} ${cur ? `in ${cur.className}` : 'between classes'}`;
    }).join('  ·  ') +
    `  ·  Revenue today: $${revenueToday.toLocaleString()}  ·  ${totalCheckIns} check-ins today  ·  `;

  const classesCompleted = schedule.filter((c) => c.isPast).length;
  const classesRemaining = schedule.filter((c) => !c.isPast && !c.isCurrent).length;
  const busiestLoc = LOCATIONS.reduce((best, loc) => {
    const ls = locationState.find((l) => l.id === loc.id);
    const bestLs = locationState.find((l) => l.id === best.id);
    return (ls ? ls.checkedIn : 0) > (bestLs ? bestLs.checkedIn : 0) ? loc : best;
  }, LOCATIONS[0]);
  const nextClass = schedule.find((c) => !c.isPast && !c.isCurrent);
  const waitlistCount = 4;

  const cardStyle = {
    background: 'rgba(255,255,255,0.72)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255,255,255,0.6)',
    borderRadius: 16,
    boxShadow: s.shadow,
  };

  const bgStyle = fullscreen
    ? { background: '#0a0a0f', minHeight: '100vh', color: '#f0f0f8', padding: 0 }
    : {
        background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 40%, #fdf2f8 100%)',
        minHeight: '100vh',
        padding: '32px 28px 48px',
        position: 'relative',
      };

  const fgText = fullscreen ? '#e0d8ff' : (s.text || '#1a1a2e');
  const fgText2 = fullscreen ? '#9090b0' : (s.text2 || '#666');
  const fgText3 = fullscreen ? '#6060a0' : (s.text3 || '#999');
  const fgCard = fullscreen
    ? { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 16, boxShadow: 'none' }
    : cardStyle;
  const sparkMax = Math.max(...hourlyData, 1);

  return (
    <div style={bgStyle}>
      <style>{ANIM_CSS + `
        @media (max-width: 768px) {
          .ld-locations { grid-template-columns: 1fr !important; }
          .ld-main { grid-template-columns: 1fr !important; }
          .ld-padding { padding: 20px 16px 28px !important; }
          .ld-header { flex-wrap: wrap !important; gap: 12px !important; }
        }
      `}</style>

      {/* Toast notifications */}
      <div
        style={{
          position: 'fixed',
          top: 80,
          right: 24,
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          pointerEvents: 'none',
        }}
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            style={{
              background: fullscreen ? 'rgba(30,20,60,0.95)' : 'rgba(255,255,255,0.96)',
              border: `1px solid ${typeColors[t.type] || accentColor}40`,
              borderLeft: `3px solid ${typeColors[t.type] || accentColor}`,
              borderRadius: 10,
              padding: '10px 16px',
              minWidth: 220,
              boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
              animation: 'fadeInSlide 0.3s ease',
              fontFamily: s.FONT,
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 600, color: typeColors[t.type] || accentColor }}>
              {t.location}
            </div>
            <div style={{ fontSize: 13, color: fgText, marginTop: 2 }}>{t.text}</div>
            <div style={{ fontSize: 11, color: fgText3, marginTop: 2 }}>{t.cls}</div>
          </div>
        ))}
      </div>

      {/* Header — normal mode */}
      {!fullscreen && (
        <div className="ld-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
          <div>
            <div
              style={{
                fontFamily: s.MONO,
                fontSize: 11,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: accentColor,
                marginBottom: 8,
              }}
            >
              Live Dashboard &middot; {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </div>
            <h1
              style={{
                fontFamily: s.DISPLAY,
                fontSize: 'clamp(24px,3vw,36px)',
                fontWeight: 700,
                margin: 0,
                color: s.text || '#1a1a2e',
                lineHeight: 1.15,
              }}
            >
              Real-Time Studio Activity
            </h1>
            <div style={{ fontFamily: s.FONT, fontSize: 14, color: s.text2 || '#666', marginTop: 6 }}>
              Live check-ins across all 3 Pilates Studio locations
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.25)',
                borderRadius: 20,
                padding: '6px 14px',
              }}
            >
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: '#EF4444',
                  animation: 'pulseRing 1.5s infinite',
                }}
              />
              <span style={{ fontFamily: s.MONO, fontSize: 11, color: '#EF4444', letterSpacing: '0.08em' }}>
                LIVE
              </span>
            </div>
            <button
              onClick={() => setFullscreen(true)}
              style={{
                fontFamily: s.FONT,
                fontSize: 13,
                background: accentColor,
                color: '#fff',
                border: 'none',
                borderRadius: 10,
                padding: '8px 16px',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              Fullscreen
            </button>
          </div>
        </div>
      )}

      {/* Header — fullscreen mode */}
      {fullscreen && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '16px 28px',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            marginBottom: 4,
          }}
        >
          <div style={{ fontFamily: s.DISPLAY, fontSize: 22, color: '#e0d8ff', fontWeight: 700 }}>
            Pilates Studio &middot; Live
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ fontFamily: s.MONO, fontSize: 12, color: '#9090b0' }}>
              {new Date().toLocaleTimeString()}
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: 'rgba(239,68,68,0.15)',
                border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: 20,
                padding: '5px 12px',
              }}
            >
              <div
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  background: '#EF4444',
                  animation: 'pulseRing 1.5s infinite',
                }}
              />
              <span style={{ fontFamily: s.MONO, fontSize: 11, color: '#EF4444' }}>LIVE</span>
            </div>
            <button
              onClick={() => setFullscreen(false)}
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: 8,
                color: '#e0d8ff',
                padding: '6px 14px',
                cursor: 'pointer',
                fontSize: 13,
                fontFamily: s.FONT,
              }}
            >
              Exit
            </button>
          </div>
        </div>
      )}

      <div className="ld-padding" style={{ padding: fullscreen ? '20px 28px 28px' : 0 }}>
        {/* Location Cards */}
        <div className="ld-locations" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 20 }}>
          {LOCATIONS.map((loc, li) => {
            const ls = locationState[li];
            const locColor = loc.color || accentColor;
            const cur = (ls && ls.currentClass) || schedule.find((c) => c.locationId === loc.id && c.isCurrent);
            const fillPct = ls ? ls.checkedIn / ls.capacity : 0;
            const isAlmostFull = fillPct >= 0.75;

            return (
              <div
                key={loc.id}
                style={{
                  ...(fullscreen
                    ? {
                        background: 'rgba(255,255,255,0.06)',
                        backdropFilter: 'blur(10px)',
                        border: `1px solid ${locColor}30`,
                        borderRadius: 16,
                        boxShadow: `0 4px 24px ${locColor}20`,
                      }
                    : { ...cardStyle, border: `1px solid ${locColor}25` }),
                  padding: '20px 20px 18px',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {/* Pulse ring on check-in */}
                {ls && ls.pulsing && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 16,
                      right: 16,
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      border: `2px solid ${locColor}`,
                      animation: 'pulse 1s ease-out forwards',
                      pointerEvents: 'none',
                    }}
                  />
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div>
                    <div
                      style={{
                        fontFamily: s.MONO,
                        fontSize: 10,
                        letterSpacing: '0.1em',
                        color: locColor,
                        textTransform: 'uppercase',
                        marginBottom: 4,
                      }}
                    >
                      {loc.shortName}
                    </div>
                    <div
                      style={{
                        fontFamily: s.DISPLAY,
                        fontSize: 18,
                        fontWeight: 700,
                        color: fgText,
                        lineHeight: 1.2,
                      }}
                    >
                      {loc.name}
                    </div>
                    <div style={{ fontFamily: s.FONT, fontSize: 11, color: fgText3, marginTop: 2 }}>
                      {loc.address}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div
                      style={{
                        fontFamily: s.MONO,
                        fontSize: 26,
                        fontWeight: 700,
                        color: locColor,
                        animation: ls && ls.pulsing ? 'counterUp 0.3s ease' : 'none',
                      }}
                    >
                      {ls ? ls.checkedIn : 0}
                    </div>
                    <div style={{ fontFamily: s.FONT, fontSize: 11, color: fgText3 }}>of {CAPACITY}</div>
                  </div>
                </div>

                {/* Current class info */}
                <div
                  style={{
                    background: fullscreen ? 'rgba(255,255,255,0.05)' : `${locColor}10`,
                    borderRadius: 10,
                    padding: '10px 12px',
                    marginBottom: 14,
                    minHeight: 52,
                  }}
                >
                  {cur ? (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontFamily: s.FONT, fontSize: 13, fontWeight: 600, color: fgText }}>
                          {cur.className}
                        </div>
                        <div style={{ fontFamily: s.MONO, fontSize: 10, color: locColor }}>
                          {timeRemaining(cur.endDate)}
                        </div>
                      </div>
                      <div style={{ fontFamily: s.FONT, fontSize: 11, color: fgText2, marginTop: 3 }}>
                        with {cur.instructor} &middot; {cur.time}
                      </div>
                    </>
                  ) : (
                    <div style={{ fontFamily: s.FONT, fontSize: 12, color: fgText3, fontStyle: 'italic' }}>
                      Between classes
                    </div>
                  )}
                </div>

                {/* Capacity dot grid */}
                <div style={{ marginBottom: 10 }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 8,
                    }}
                  >
                    <div
                      style={{
                        fontFamily: s.MONO,
                        fontSize: 10,
                        letterSpacing: '0.08em',
                        color: fgText3,
                        textTransform: 'uppercase',
                      }}
                    >
                      Reformer Spots
                    </div>
                    {isAlmostFull && (
                      <div style={{ fontFamily: s.MONO, fontSize: 10, color: '#F59E0B', letterSpacing: '0.06em' }}>
                        ALMOST FULL
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 6 }}>
                    {Array.from({ length: CAPACITY }).map((_, di) => (
                      <div
                        key={di}
                        style={{
                          width: '100%',
                          aspectRatio: '1',
                          borderRadius: 6,
                          background:
                            ls && di < ls.checkedIn
                              ? locColor
                              : fullscreen
                              ? 'rgba(255,255,255,0.08)'
                              : 'rgba(0,0,0,0.08)',
                          transition: 'background 0.4s ease',
                          animation:
                            ls && di === ls.checkedIn - 1 && ls.pulsing ? 'dotFill 0.4s ease' : 'none',
                        }}
                      />
                    ))}
                  </div>
                </div>

                {ls && ls.lastCheckIn && (
                  <div
                    style={{
                      fontFamily: s.FONT,
                      fontSize: 11,
                      color: locColor,
                      fontWeight: 500,
                      animation: 'slideDown 0.3s ease',
                    }}
                  >
                    &#10003; {ls.lastCheckIn} just checked in
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Stats Ticker */}
        <div
          style={{
            ...(fullscreen
              ? { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }
              : { background: `${accentColor}12`, border: `1px solid ${accentColor}20` }),
            borderRadius: 12,
            padding: '10px 0',
            marginBottom: 20,
            overflow: 'hidden',
          }}
        >
          <div style={{ display: 'flex', overflow: 'hidden' }}>
            <div
              style={{
                display: 'flex',
                animation: 'ticker 28s linear infinite',
                whiteSpace: 'nowrap',
                fontFamily: s.MONO,
                fontSize: 12,
                color: fullscreen ? '#c0b8e0' : accentColor,
                letterSpacing: '0.05em',
              }}
            >
              {[tickerContent, tickerContent].map((content, i) => (
                <span key={i} style={{ paddingRight: 40 }}>
                  {content.split('  ·  ').map((seg, si) => (
                    <span key={si}>
                      {seg}
                      {si < content.split('  ·  ').length - 1 && (
                        <span style={{ opacity: 0.4, margin: '0 16px' }}>&middot;</span>
                      )}
                    </span>
                  ))}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Schedule Timeline + KPIs */}
        <div
          className="ld-main"
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 260px',
            gap: 16,
            marginBottom: 16,
          }}
        >
          {/* Schedule Timeline */}
          <div style={{ ...fgCard, padding: '18px 20px' }}>
            <div
              style={{
                fontFamily: s.MONO,
                fontSize: 11,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: accentColor,
                marginBottom: 14,
              }}
            >
              Today's Schedule
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {schedule.slice(0, 14).map((cls) => {
                const locColor = cls.locationColor || accentColor;
                return (
                  <div
                    key={cls.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      background: cls.isCurrent
                        ? fullscreen
                          ? `${locColor}22`
                          : `${locColor}14`
                        : cls.isPast
                        ? fullscreen
                          ? 'rgba(255,255,255,0.02)'
                          : 'rgba(0,0,0,0.02)'
                        : 'transparent',
                      borderRadius: 9,
                      padding: '7px 10px',
                      animation: cls.isCurrent ? 'glow 2.5s ease-in-out infinite' : 'none',
                      opacity: cls.isPast ? 0.45 : 1,
                      border: cls.isCurrent ? `1px solid ${locColor}30` : '1px solid transparent',
                    }}
                  >
                    <div
                      style={{
                        width: 3,
                        height: 32,
                        borderRadius: 2,
                        background: locColor,
                        flexShrink: 0,
                      }}
                    />
                    <div
                      style={{
                        fontFamily: s.MONO,
                        fontSize: 11,
                        color: fgText3,
                        width: 62,
                        flexShrink: 0,
                      }}
                    >
                      {cls.time}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontFamily: s.FONT,
                          fontSize: 13,
                          fontWeight: cls.isCurrent ? 600 : 400,
                          color: fgText,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {cls.className}
                      </div>
                      <div style={{ fontFamily: s.FONT, fontSize: 11, color: fgText2 }}>
                        {cls.locationName} &middot; {cls.instructor}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
                      <div
                        style={{
                          fontFamily: s.MONO,
                          fontSize: 12,
                          color: cls.filled >= 10 ? '#EF4444' : locColor,
                          fontWeight: 600,
                        }}
                      >
                        {cls.filled}/{cls.capacity}
                      </div>
                      {cls.isCurrent && (
                        <div
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            background: '#EF4444',
                            animation: 'pulseRing 1.5s infinite',
                          }}
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* KPIs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
            {[
              { label: 'Check-ins This Hour', value: String(hourlyData[hourlyData.length - 1]), showSpark: true },
              { label: 'Revenue Today', value: `$${revenueToday.toLocaleString()}`, highlight: true },
              { label: 'Classes Done / Left', value: `${classesCompleted} / ${classesRemaining}` },
              {
                label: 'Busiest Right Now',
                value: busiestLoc.name,
                sub: `${(locationState.find((l) => l.id === busiestLoc.id) || {}).checkedIn || 0} checked in`,
              },
              {
                label: 'Next Available Spot',
                value: nextClass ? nextClass.time : 'Tomorrow',
                sub: nextClass ? `${nextClass.locationName} · ${nextClass.className}` : '',
              },
              { label: 'Waitlist', value: `${waitlistCount} waiting`, amber: true },
            ].map((kpi, i) => (
              <div key={i} style={{ ...fgCard, padding: '12px 14px' }}>
                <div
                  style={{
                    fontFamily: s.MONO,
                    fontSize: 10,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: fgText3,
                    marginBottom: 4,
                  }}
                >
                  {kpi.label}
                </div>
                <div
                  style={{
                    fontFamily: s.MONO,
                    fontSize: 18,
                    fontWeight: 700,
                    color: kpi.highlight ? accentColor : kpi.amber ? '#F59E0B' : fgText,
                  }}
                >
                  {kpi.value}
                </div>
                {kpi.sub && (
                  <div style={{ fontFamily: s.FONT, fontSize: 11, color: fgText3, marginTop: 2 }}>
                    {kpi.sub}
                  </div>
                )}
                {kpi.showSpark && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-end',
                      gap: 3,
                      marginTop: 8,
                      height: 24,
                    }}
                  >
                    {hourlyData.map((v, hi) => (
                      <div
                        key={hi}
                        style={{
                          flex: 1,
                          borderRadius: 2,
                          height: `${Math.max(4, (v / sparkMax) * 24)}px`,
                          background:
                            hi === hourlyData.length - 1
                              ? accentColor
                              : fullscreen
                              ? 'rgba(255,255,255,0.15)'
                              : `${accentColor}30`,
                          transition: 'height 0.4s ease',
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Activity Feed */}
        <div style={{ ...fgCard, padding: '18px 20px' }}>
          <div
            style={{
              fontFamily: s.MONO,
              fontSize: 11,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: accentColor,
              marginBottom: 14,
            }}
          >
            Live Activity Feed
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {activityFeed.map((event, i) => (
              <div
                key={event.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '8px 10px',
                  borderRadius: 8,
                  background:
                    i === 0
                      ? fullscreen
                        ? 'rgba(255,255,255,0.05)'
                        : `${typeColors[event.type] || accentColor}08`
                      : 'transparent',
                  animation: i === 0 ? 'slideDown 0.35s ease' : 'none',
                }}
              >
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: typeColors[event.type] || accentColor,
                    flexShrink: 0,
                  }}
                />
                <div
                  style={{
                    fontFamily: s.MONO,
                    fontSize: 11,
                    color: fgText3,
                    width: 60,
                    flexShrink: 0,
                  }}
                >
                  {event.time.toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true,
                  })}
                </div>
                <div
                  style={{
                    fontFamily: s.FONT,
                    fontSize: 12,
                    color: typeColors[event.type] || accentColor,
                    fontWeight: 600,
                    width: 72,
                    flexShrink: 0,
                  }}
                >
                  {typeLabels[event.type] || event.type}
                </div>
                <div style={{ fontFamily: s.FONT, fontSize: 13, fontWeight: 500, color: fgText }}>
                  {event.client}
                </div>
                <div style={{ fontFamily: s.FONT, fontSize: 12, color: fgText2 }}>
                  {event.className}
                </div>
                <div
                  style={{
                    fontFamily: s.FONT,
                    fontSize: 11,
                    color: fgText3,
                    marginLeft: 'auto',
                    flexShrink: 0,
                  }}
                >
                  {event.location}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div
          style={{
            textAlign: 'center',
            marginTop: 20,
            fontFamily: s.MONO,
            fontSize: 11,
            color: fgText3,
            letterSpacing: '0.08em',
          }}
        >
          PILATES STUDIO &middot; CROSS-LOCATION LIVE DASHBOARD &middot; AUTO-REFRESHING
        </div>
      </div>
    </div>
  );
}
