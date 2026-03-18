import { useState, useEffect, useRef } from 'react';
import { useStyles } from '../theme';
import {
  getPatients, getAppointments, getServices, getProviders,
  getTreatmentPlans, getPhotos, updatePatient, subscribe,
} from '../data/store';

const fmt = (cents) => `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 0 })}`;
const fmtDate = (d) => {
  if (!d) return '';
  const dt = new Date(d + (d.length === 10 ? 'T12:00:00' : ''));
  return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};
const fmtWeekday = (d) => {
  if (!d) return '';
  const dt = new Date(d + 'T12:00:00');
  return dt.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
};

// localStorage helpers for non-store keys
function lsGet(key, fallback = []) {
  try { return JSON.parse(localStorage.getItem(key)) || fallback; } catch { return fallback; }
}

const WAIVER_TEMPLATES = {
  general: 'General Liability Waiver',
  hipaa: 'Privacy Policy',
  botox: 'Reformer / Neurotoxin Consent',
  filler: 'Dermal Barre Consent',
  laser: 'Laser / TRX Consent',
  photo: 'Photo / Marketing Consent',
  financial: 'Financial Responsibility',
  micro: 'Private Session Consent',
  cancel: 'Cancellation Policy',
};

const TIER_COLORS = {
  Silver: { color: '#94A3B8', bg: '#F8FAFC' },
  Gold: { color: '#D97706', bg: '#FFFBEB' },
  Platinum: { color: '#7C3AED', bg: '#F5F3FF' },
};

/* --- keyframe injection (once) --- */
const ANIM_ID = 'portal-luxury-anims';
if (!document.getElementById(ANIM_ID)) {
  const sheet = document.createElement('style');
  sheet.id = ANIM_ID;
  sheet.textContent = `
    @keyframes portalFadeInUp {
      from { opacity: 0; transform: translateY(18px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes portalOrb1 {
      0%,100% { transform: translate(0,0) scale(1); }
      50%     { transform: translate(40px,-30px) scale(1.15); }
    }
    @keyframes portalOrb2 {
      0%,100% { transform: translate(0,0) scale(1); }
      50%     { transform: translate(-50px,25px) scale(1.1); }
    }
    @keyframes portalRingSpin {
      from { transform: rotate(-90deg); }
      to   { transform: rotate(-90deg); }
    }
    @keyframes portalPillSlide {
      from { opacity:0; transform: translateX(10px); }
      to   { opacity:1; transform: translateX(0); }
    }
    .portal-fadeInUp { animation: portalFadeInUp 0.5s cubic-bezier(0.16,1,0.3,1) both; }
    .portal-stagger-1 { animation-delay: 0.04s; }
    .portal-stagger-2 { animation-delay: 0.08s; }
    .portal-stagger-3 { animation-delay: 0.12s; }
    .portal-stagger-4 { animation-delay: 0.16s; }
    .portal-stagger-5 { animation-delay: 0.20s; }
    .portal-stagger-6 { animation-delay: 0.24s; }
    .portal-stagger-7 { animation-delay: 0.28s; }
    .portal-stagger-8 { animation-delay: 0.32s; }
    .portal-tabs::-webkit-scrollbar { display:none; }
  `;
  document.head.appendChild(sheet);
}

export default function Portal() {
  const s = useStyles();
  const [, setTick] = useState(0);
  useEffect(() => subscribe(() => setTick(t => t + 1)), []);

  const clients = getPatients();
  const [selectedPatientId, setSelectedPatientId] = useState('PAT-1000');
  const [section, setSection] = useState('home');
  const [editInfo, setEditInfo] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [copied, setCopied] = useState(false);
  const [signingWaiver, setSigningWaiver] = useState(null);
  const [signName, setSignName] = useState('');

  const patient = clients.find(p => p.id === selectedPatientId);
  const patientName = patient ? patient.firstName : 'Guest';
  const today = new Date().toISOString().slice(0, 10);

  // Data filtered by patient
  const appointments = getAppointments().filter(a => a.patientId === selectedPatientId);
  const services = getServices();
  const providers = getProviders();
  const sessionPlans = getTreatmentPlans().filter(t => t.patientId === selectedPatientId);
  const photos = getPhotos().filter(p => p.patientId === selectedPatientId);
  const memberships = lsGet('rp_memberships', []).filter(m => m.patientId === selectedPatientId);
  const packages = lsGet('rp_packages', []).filter(p => p.patientId === selectedPatientId);
  const walletEntries = lsGet('rp_wallet', []).filter(w => w.patientId === selectedPatientId);
  const waivers = lsGet('rp_waivers', []).filter(w => w.patientId === selectedPatientId);
  const referrals = lsGet('rp_referrals', []).filter(r => r.referrerId === selectedPatientId);

  const upcomingAppts = appointments.filter(a => a.date >= today && a.status !== 'completed')
    .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));
  const pastAppts = appointments.filter(a => a.date < today || a.status === 'completed')
    .sort((a, b) => `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`));
  const nextAppt = upcomingAppts[0];

  const membership = memberships[0];
  const tierInfo = membership ? TIER_COLORS[membership.tier] || TIER_COLORS.Gold : null;

  const giftCards = walletEntries.filter(w => w.type === 'gift_card' && w.balance > 0);
  const credits = walletEntries.filter(w => w.type === 'credit' && w.balance > 0);
  const loyalty = walletEntries.find(w => w.type === 'loyalty');

  const referralCode = referrals[0]?.code || `REF-${patientName.toUpperCase()}-${selectedPatientId.replace('PAT-', '')}`;
  const creditedReferrals = referrals.filter(r => r.status === 'credited');
  const totalReferralCredits = creditedReferrals.reduce((sum, r) => sum + (r.referrerCredit || 0), 0);

  const svcName = (id) => services.find(sv => sv.id === id)?.name || 'Service';
  const provName = (id) => providers.find(p => p.id === id)?.name || 'Provider';

  // Photo pairs
  const photoPairs = {};
  photos.forEach(p => {
    const key = `${p.serviceId}-${p.angle}`;
    if (!photoPairs[key]) photoPairs[key] = {};
    photoPairs[key][p.phase] = p;
    photoPairs[key].serviceName = p.serviceName || svcName(p.serviceId);
    photoPairs[key].angle = p.angle;
  });

  const handleEditInfo = () => {
    setEditForm({
      firstName: patient?.firstName || '',
      lastName: patient?.lastName || '',
      email: patient?.email || '',
      phone: patient?.phone || '',
      dob: patient?.dob || '',
      allergies: patient?.allergies || '',
    });
    setEditInfo(true);
  };

  const saveInfo = () => {
    updatePatient(selectedPatientId, editForm);
    setEditInfo(false);
    setTick(t => t + 1);
  };

  const handleSignWaiver = (waiverId) => {
    const allWaivers = lsGet('rp_waivers', []);
    const updated = allWaivers.map(w =>
      w.id === waiverId ? { ...w, status: 'signed', signedAt: new Date().toISOString(), signatureData: signName } : w
    );
    localStorage.setItem('rp_waivers', JSON.stringify(updated));
    setSigningWaiver(null);
    setSignName('');
    setTick(t => t + 1);
  };

  const copyReferralLink = () => {
    navigator.clipboard.writeText(`https://remedypilates.com/refer/${referralCode}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // -- Nav items --
  const navItems = [
    { id: 'home', label: 'Home', icon: '\u2302' },
    { id: 'appointments', label: 'Appointments', icon: '\uD83D\uDCC5' },
    { id: 'session', label: 'Treatments', icon: '\u2728' },
    { id: 'membership', label: 'Membership', icon: '\u2606' },
    { id: 'wallet', label: 'Wallet', icon: '\uD83D\uDCB3' },
    { id: 'photos', label: 'Photos', icon: '\uD83D\uDCF7' },
    { id: 'waivers', label: 'Waivers', icon: '\uD83D\uDCDD' },
    { id: 'referrals', label: 'Referrals', icon: '\uD83D\uDC96' },
    { id: 'info', label: 'Profile', icon: '\uD83D\uDC64' },
  ];

  // -- Shared luxury design tokens --
  const glass = {
    background: 'rgba(255,255,255,0.55)',
    backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
    border: '1px solid rgba(255,255,255,0.7)',
    borderRadius: 20,
    boxShadow: '0 8px 32px rgba(0,0,0,0.06), 0 1.5px 4px rgba(0,0,0,0.03)',
    transition: 'all 0.35s cubic-bezier(0.16,1,0.3,1)',
  };

  const glassHover = (e) => {
    e.currentTarget.style.transform = 'translateY(-2px)';
    e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.10), 0 2px 6px rgba(0,0,0,0.04)';
  };
  const glassUnhover = (e) => {
    e.currentTarget.style.transform = 'translateY(0)';
    e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.06), 0 1.5px 4px rgba(0,0,0,0.03)';
  };

  const Card = ({ children, style, hover = false, className = '' }) => (
    <div
      className={className}
      style={{ ...glass, ...style }}
      onMouseEnter={hover ? glassHover : undefined}
      onMouseLeave={hover ? glassUnhover : undefined}
    >
      {children}
    </div>
  );

  const SectionLabel = ({ children }) => (
    <div style={{
      fontFamily: s.MONO, fontSize: 10, textTransform: 'uppercase', letterSpacing: 2,
      color: s.text3, marginBottom: 14, fontWeight: 500,
    }}>{children}</div>
  );

  const SectionTitle = ({ children, sub }) => (
    <div style={{ marginBottom: 28 }} className="portal-fadeInUp">
      <h2 style={{ font: `300 28px ${s.FONT}`, color: s.text, margin: 0, letterSpacing: -0.5 }}>{children}</h2>
      {sub && <p style={{ font: `400 14px ${s.FONT}`, color: s.text3, margin: '6px 0 0', letterSpacing: 0.1 }}>{sub}</p>}
    </div>
  );

  const Badge = ({ text, color, bg }) => (
    <span style={{
      display: 'inline-block', padding: '5px 14px', borderRadius: 100,
      font: `600 10px ${s.FONT}`, textTransform: 'uppercase', letterSpacing: 1,
      color: color || '#fff', background: bg || s.accent,
    }}>{text}</span>
  );

  const ProgressBar = ({ value, max, color }) => (
    <div style={{ height: 6, borderRadius: 100, background: 'rgba(0,0,0,0.05)', overflow: 'hidden' }}>
      <div style={{
        height: '100%', borderRadius: 100, width: `${Math.min(100, (value / max) * 100)}%`,
        background: color || s.accent, transition: 'width 0.6s cubic-bezier(0.16,1,0.3,1)',
      }} />
    </div>
  );

  /* --- SVG progress ring for home dashboard --- */
  const ProgressRing = ({ value, max, size = 56, stroke = 5 }) => {
    const pct = max > 0 ? Math.min(1, value / max) : 0;
    const r = (size - stroke) / 2;
    const circ = 2 * Math.PI * r;
    return (
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={s.accent} strokeWidth={stroke}
          strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)} strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.16,1,0.3,1)' }} />
      </svg>
    );
  };

  // ------- SECTION RENDERERS -------

  const renderHome = () => {
    const firstPlan = sessionPlans[0];
    const planCompleted = firstPlan ? firstPlan.sessions.filter(ss => ss.status === 'completed').length : 0;
    const planTotal = firstPlan ? firstPlan.sessions.length : 0;
    const walletTotal = giftCards.reduce((sum, g) => sum + g.balance, 0) + credits.reduce((sum, c) => sum + c.balance, 0);

    return (
      <div>
        {/* --- Hero Welcome Gradient --- */}
        <div className="portal-fadeInUp" style={{
          borderRadius: 24, padding: '40px 36px 36px',
          background: `linear-gradient(135deg, ${s.accent}18 0%, ${s.accent}08 50%, rgba(255,255,255,0) 100%)`,
          marginBottom: 28, position: 'relative', overflow: 'hidden',
        }}>
          {/* decorative accent circle */}
          <div style={{
            position: 'absolute', top: -40, right: -40, width: 160, height: 160,
            borderRadius: '50%', background: `${s.accent}0A`, pointerEvents: 'none',
          }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap', position: 'relative' }}>
            <div style={{
              width: 60, height: 60, borderRadius: '50%',
              background: `linear-gradient(135deg, ${s.accent}30, ${s.accent}10)`,
              border: `2px solid ${s.accent}25`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              font: `500 22px ${s.FONT}`, color: s.accent, flexShrink: 0,
              letterSpacing: -0.5,
            }}>
              {patient?.firstName?.[0]}{patient?.lastName?.[0]}
            </div>
            <div style={{ flex: 1 }}>
              <h1 style={{ font: `300 32px ${s.FONT}`, color: s.text, margin: 0, letterSpacing: -0.8 }}>
                Welcome back, {patientName}
              </h1>
              <p style={{ font: `400 14px ${s.FONT}`, color: s.text2, margin: '4px 0 0', letterSpacing: 0.1 }}>
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
            {membership && tierInfo && (
              <span style={{
                padding: '6px 18px', borderRadius: 100,
                background: `${tierInfo.color}15`, border: `1.5px solid ${tierInfo.color}30`,
                font: `600 11px ${s.FONT}`, textTransform: 'uppercase', letterSpacing: 1.2,
                color: tierInfo.color,
              }}>{membership.tier} Member</span>
            )}
          </div>

          {/* Floating next-appointment glass card */}
          {nextAppt && (
            <div style={{
              marginTop: 28, ...glass,
              borderRadius: 16, padding: '22px 26px',
              borderLeft: `3px solid ${s.accent}`,
              background: 'rgba(255,255,255,0.65)',
            }}>
              <SectionLabel>Next Appointment</SectionLabel>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ font: `500 17px ${s.FONT}`, color: s.text, marginBottom: 3, letterSpacing: -0.2 }}>
                    {svcName(nextAppt.serviceId)}
                  </div>
                  <div style={{ font: `400 14px ${s.FONT}`, color: s.text2 }}>
                    {fmtWeekday(nextAppt.date)} at {nextAppt.time}
                  </div>
                  <div style={{ font: `400 13px ${s.FONT}`, color: s.text3, marginTop: 2 }}>
                    with {provName(nextAppt.providerId)}
                  </div>
                </div>
                <button onClick={() => setSection('appointments')} style={{
                  ...s.pillOutline, padding: '10px 22px', borderRadius: 100,
                }}>View All</button>
              </div>
            </div>
          )}
        </div>

        {/* --- Dashboard Cards Grid --- */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16, marginBottom: 28 }}>
          {/* Membership summary */}
          <Card hover className="portal-fadeInUp portal-stagger-1" style={{ padding: '24px 22px', cursor: 'pointer' }}
            onClick={() => setSection('membership')}>
            <SectionLabel>Membership</SectionLabel>
            {membership ? (
              <>
                <div style={{ font: `500 18px ${s.FONT}`, color: s.text, marginBottom: 4 }}>{membership.tier}</div>
                {(membership.wallet || []).slice(0, 1).map((w, i) => (
                  <div key={i} style={{ font: `400 13px ${s.FONT}`, color: s.text2 }}>
                    {w.remaining} / {w.total} {w.service} remaining
                  </div>
                ))}
              </>
            ) : (
              <div style={{ font: `400 14px ${s.FONT}`, color: s.text3 }}>No membership</div>
            )}
          </Card>

          {/* Wallet summary */}
          <Card hover className="portal-fadeInUp portal-stagger-2" style={{ padding: '24px 22px', cursor: 'pointer' }}
            onClick={() => setSection('wallet')}>
            <SectionLabel>Wallet</SectionLabel>
            <div style={{ font: `500 22px ${s.FONT}`, color: s.text, marginBottom: 2 }}>
              {walletTotal > 0 ? fmt(walletTotal) : '$0'}
            </div>
            {loyalty && (
              <div style={{ font: `400 13px ${s.FONT}`, color: s.accent }}>{loyalty.points.toLocaleString()} loyalty pts</div>
            )}
          </Card>

          {/* Treatment plan progress */}
          <Card hover className="portal-fadeInUp portal-stagger-3" style={{ padding: '24px 22px', cursor: 'pointer' }}
            onClick={() => setSection('session')}>
            <SectionLabel>Treatment Plan</SectionLabel>
            {firstPlan ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <ProgressRing value={planCompleted} max={planTotal} />
                <div>
                  <div style={{ font: `500 15px ${s.FONT}`, color: s.text }}>{firstPlan.name}</div>
                  <div style={{ font: `400 13px ${s.FONT}`, color: s.text2 }}>
                    {planCompleted}/{planTotal} sessions
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ font: `400 14px ${s.FONT}`, color: s.text3 }}>No active plan</div>
            )}
          </Card>

          {/* Upcoming appts count */}
          <Card hover className="portal-fadeInUp portal-stagger-4" style={{ padding: '24px 22px', cursor: 'pointer' }}
            onClick={() => setSection('appointments')}>
            <SectionLabel>Upcoming</SectionLabel>
            <div style={{ font: `500 28px ${s.FONT}`, color: s.accent, marginBottom: 2 }}>{upcomingAppts.length}</div>
            <div style={{ font: `400 13px ${s.FONT}`, color: s.text3 }}>
              {upcomingAppts.length === 1 ? 'appointment' : 'appointments'}
            </div>
          </Card>
        </div>

        {/* Quick action buttons */}
        <div className="portal-fadeInUp portal-stagger-5" style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button style={{
            ...s.pillAccent, padding: '14px 32px', fontSize: 14, borderRadius: 100,
            boxShadow: `0 4px 20px ${s.accent}30`,
          }}>
            Book Appointment
          </button>
          <button onClick={() => setSection('referrals')} style={{
            ...s.pillOutline, padding: '14px 32px', fontSize: 14, borderRadius: 100,
          }}>
            Refer a Friend
          </button>
        </div>
      </div>
    );
  };

  const renderAppointments = () => (
    <div>
      <SectionTitle sub={`${upcomingAppts.length} upcoming, ${pastAppts.length} past`}>
        My Appointments
      </SectionTitle>

      {/* Upcoming */}
      <SectionLabel>Upcoming</SectionLabel>
      {upcomingAppts.length === 0 ? (
        <Card className="portal-fadeInUp" style={{ padding: '40px 28px', textAlign: 'center', marginBottom: 28 }}>
          <div style={{ font: `400 15px ${s.FONT}`, color: s.text3 }}>No upcoming appointments</div>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
          {upcomingAppts.map((a, i) => {
            const dt = new Date(a.date + 'T12:00:00');
            return (
              <Card key={a.id} hover className={`portal-fadeInUp portal-stagger-${Math.min(i + 1, 8)}`}
                style={{ padding: '20px 24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
                  {/* Date tile */}
                  <div style={{
                    width: 52, height: 58, borderRadius: 14,
                    background: `linear-gradient(135deg, ${s.accent}15, ${s.accent}08)`,
                    border: `1px solid ${s.accent}20`,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <div style={{ font: `600 20px ${s.FONT}`, color: s.accent, lineHeight: 1 }}>
                      {dt.getDate()}
                    </div>
                    <div style={{ font: `500 9px ${s.MONO}`, color: s.accent, textTransform: 'uppercase', letterSpacing: 1, marginTop: 2 }}>
                      {dt.toLocaleDateString('en-US', { month: 'short' })}
                    </div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ font: `500 16px ${s.FONT}`, color: s.text, letterSpacing: -0.2 }}>{svcName(a.serviceId)}</div>
                    <div style={{ font: `400 13px ${s.FONT}`, color: s.text2, marginTop: 2 }}>
                      {fmtWeekday(a.date)} at {a.time}
                    </div>
                    <div style={{ font: `400 12px ${s.FONT}`, color: s.text3, marginTop: 2 }}>
                      with {provName(a.providerId)} {a.room ? `\u00B7 ${a.room}` : ''}
                    </div>
                  </div>
                  <Badge
                    text={a.status}
                    color={a.status === 'confirmed' ? s.success : s.warning}
                    bg={a.status === 'confirmed' ? '#F0FDF4' : '#FFFBEB'}
                  />
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <div className="portal-fadeInUp portal-stagger-3" style={{ marginBottom: 36 }}>
        <button style={{
          ...s.pillAccent, padding: '14px 32px', fontSize: 14, borderRadius: 100,
          boxShadow: `0 4px 20px ${s.accent}30`,
        }}>
          Book New Appointment
        </button>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: 'rgba(0,0,0,0.06)', marginBottom: 28 }} />

      {/* Past */}
      <SectionLabel>Past Appointments</SectionLabel>
      {pastAppts.length === 0 ? (
        <Card className="portal-fadeInUp" style={{ padding: '40px 28px', textAlign: 'center' }}>
          <div style={{ font: `400 15px ${s.FONT}`, color: s.text3 }}>No past appointments</div>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {pastAppts.slice(0, 10).map((a, i) => (
            <Card key={a.id} className={`portal-fadeInUp portal-stagger-${Math.min(i + 1, 8)}`}
              style={{ padding: '16px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ font: `500 14px ${s.FONT}`, color: s.text }}>{svcName(a.serviceId)}</div>
                  <div style={{ font: `400 12px ${s.FONT}`, color: s.text3 }}>
                    {fmtDate(a.date)} at {a.time} \u00B7 {provName(a.providerId)}
                  </div>
                </div>
                <span style={{
                  font: `500 10px ${s.FONT}`, textTransform: 'uppercase', letterSpacing: 1,
                  color: s.text3, opacity: 0.7,
                }}>Completed</span>
              </div>
            </Card>
          ))}
          {pastAppts.length > 10 && (
            <div style={{ font: `400 13px ${s.FONT}`, color: s.text3, textAlign: 'center', padding: 12 }}>
              + {pastAppts.length - 10} more
            </div>
          )}
        </div>
      )}
    </div>
  );

  const renderTreatmentPlan = () => (
    <div>
      <SectionTitle sub="Your personalized session journey">My Treatment Plan</SectionTitle>
      {sessionPlans.length === 0 ? (
        <Card className="portal-fadeInUp" style={{ padding: '48px 32px', textAlign: 'center' }}>
          <div style={{ font: `300 20px ${s.FONT}`, color: s.text, marginBottom: 10 }}>No active class package</div>
          <div style={{ font: `400 14px ${s.FONT}`, color: s.text3, maxWidth: 340, margin: '0 auto' }}>
            Ask your provider about a personalized class package at your next visit.
          </div>
        </Card>
      ) : sessionPlans.map((plan, pi) => {
        const completed = plan.sessions.filter(ss => ss.status === 'completed').length;
        const total = plan.sessions.length;
        const nextSession = plan.sessions.find(ss => ss.status === 'upcoming' || ss.status === 'in-progress');
        return (
          <Card key={plan.id} className={`portal-fadeInUp portal-stagger-${Math.min(pi + 1, 4)}`}
            style={{ padding: '28px 30px', marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
              <div>
                <div style={{ font: `300 22px ${s.FONT}`, color: s.text, letterSpacing: -0.3 }}>{plan.name}</div>
                <div style={{ font: `400 13px ${s.FONT}`, color: s.text2, marginTop: 4 }}>
                  with {provName(plan.providerId)}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <ProgressRing value={completed} max={total} size={48} stroke={4} />
                <div style={{ font: `500 14px ${s.FONT}`, color: s.accent }}>{completed}/{total}</div>
              </div>
            </div>
            <ProgressBar value={completed} max={total} />
            <div style={{ font: `400 12px ${s.FONT}`, color: s.text3, marginTop: 8 }}>
              {Math.round((completed / total) * 100)}% complete
            </div>
            {nextSession && (
              <div style={{
                marginTop: 20, padding: '16px 20px', borderRadius: 14,
                background: `${s.accent}08`, border: `1px solid ${s.accent}15`,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10,
              }}>
                <div>
                  <div style={{ font: `500 14px ${s.FONT}`, color: s.text }}>Next: {nextSession.name}</div>
                  <div style={{ font: `400 12px ${s.FONT}`, color: s.text2, marginTop: 2 }}>{fmtDate(nextSession.date)}</div>
                </div>
                <Badge text={nextSession.status} color={nextSession.status === 'in-progress' ? s.warning : s.accent} bg={nextSession.status === 'in-progress' ? '#FFFBEB' : s.accentLight} />
              </div>
            )}
            {/* Sessions list */}
            <div style={{ marginTop: 24 }}>
              <SectionLabel>All Sessions</SectionLabel>
              {plan.sessions.map((ss, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 14, padding: '12px 0',
                  borderBottom: i < plan.sessions.length - 1 ? '1px solid rgba(0,0,0,0.04)' : 'none',
                }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: ss.status === 'completed' ? s.success : ss.status === 'in-progress' ? s.warning : 'rgba(0,0,0,0.06)',
                    color: ss.status === 'completed' || ss.status === 'in-progress' ? '#fff' : s.text3,
                    font: `600 11px ${s.FONT}`,
                  }}>
                    {ss.status === 'completed' ? '\u2713' : i + 1}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ font: `500 13px ${s.FONT}`, color: ss.status === 'completed' ? s.text2 : s.text }}>{ss.name}</div>
                    {ss.date && <div style={{ font: `400 11px ${s.FONT}`, color: s.text3 }}>{fmtDate(ss.date)}</div>}
                  </div>
                  <span style={{
                    font: `500 10px ${s.FONT}`, textTransform: 'uppercase', letterSpacing: 0.8,
                    color: ss.status === 'completed' ? s.success : ss.status === 'in-progress' ? s.warning : s.text3,
                  }}>{ss.status}</span>
                </div>
              ))}
            </div>
          </Card>
        );
      })}
    </div>
  );

  const renderMembership = () => (
    <div>
      <SectionTitle sub="Your exclusive benefits">My Membership</SectionTitle>
      {!membership ? (
        <Card className="portal-fadeInUp" style={{ padding: '48px 32px', textAlign: 'center' }}>
          <div style={{ font: `300 22px ${s.FONT}`, color: s.text, marginBottom: 10 }}>
            You don't have a membership yet
          </div>
          <div style={{ font: `400 14px ${s.FONT}`, color: s.text3, marginBottom: 28, maxWidth: 340, margin: '0 auto 28px' }}>
            Unlock exclusive savings with a membership tier.
          </div>
          <button style={{
            ...s.pillAccent, padding: '14px 36px', fontSize: 14, borderRadius: 100,
            boxShadow: `0 4px 20px ${s.accent}30`,
          }}>
            Explore Memberships
          </button>
        </Card>
      ) : (
        <div>
          <Card className="portal-fadeInUp" style={{
            padding: '30px', marginBottom: 20,
            background: `linear-gradient(135deg, ${tierInfo?.bg || '#fff'}, rgba(255,255,255,0.6))`,
            backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22, flexWrap: 'wrap', gap: 12 }}>
              <div>
                <Badge text={membership.tier} color={tierInfo?.color} bg='rgba(255,255,255,0.85)' />
                <div style={{ font: `300 24px ${s.FONT}`, color: s.text, marginTop: 12, letterSpacing: -0.3 }}>
                  {membership.tier} Membership
                </div>
                <div style={{ font: `400 13px ${s.FONT}`, color: s.text2, marginTop: 4 }}>
                  Member since {fmtDate(membership.startDate)}
                </div>
              </div>
              <Badge text={membership.status} color={membership.status === 'active' ? s.success : s.warning}
                bg={membership.status === 'active' ? '#F0FDF4' : '#FFFBEB'} />
            </div>

            {membership.nextBilling && (
              <div style={{ font: `400 13px ${s.FONT}`, color: s.text2, marginBottom: 22 }}>
                Next billing: <strong>{fmtDate(membership.nextBilling)}</strong>
              </div>
            )}

            {membership.credits > 0 && (
              <div style={{
                padding: '14px 18px', borderRadius: 14, background: 'rgba(255,255,255,0.75)',
                font: `500 14px ${s.FONT}`, color: s.accent, marginBottom: 20,
                backdropFilter: 'blur(12px)',
              }}>
                {fmt(membership.credits * 100)} membership credits available
              </div>
            )}

            <SectionLabel>Included Services</SectionLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {(membership.wallet || []).map((w, i) => (
                <div key={i} style={{ background: 'rgba(255,255,255,0.7)', borderRadius: 14, padding: '16px 18px', backdropFilter: 'blur(8px)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ font: `500 14px ${s.FONT}`, color: s.text }}>{w.service}</span>
                    <span style={{ font: `600 13px ${s.MONO}`, color: w.remaining > 0 ? s.accent : s.text3 }}>
                      {w.remaining} of {w.total}
                    </span>
                  </div>
                  <ProgressBar value={w.remaining} max={w.total} color={w.remaining > 0 ? s.accent : '#DDD'} />
                </div>
              ))}
            </div>
          </Card>

          {/* Packages */}
          {packages.length > 0 && (
            <div>
              <SectionLabel>My Packages</SectionLabel>
              {packages.map((pkg, i) => (
                <Card key={pkg.id} className={`portal-fadeInUp portal-stagger-${Math.min(i + 1, 4)}`}
                  style={{ padding: '22px 24px', marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <div style={{ font: `500 16px ${s.FONT}`, color: s.text }}>{pkg.name}</div>
                    <Badge text={pkg.status} color={pkg.status === 'active' ? s.success : s.text3}
                      bg={pkg.status === 'active' ? '#F0FDF4' : '#F5F5F5'} />
                  </div>
                  <div style={{ font: `400 13px ${s.FONT}`, color: s.text2, marginBottom: 10 }}>
                    {pkg.usedSessions} of {pkg.totalSessions} sessions used \u00B7 Expires {fmtDate(pkg.expiresDate)}
                  </div>
                  <ProgressBar value={pkg.usedSessions} max={pkg.totalSessions} color={s.accent} />
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );

  const renderWallet = () => (
    <div>
      <SectionTitle sub="Gift cards, credits & loyalty points">My Wallet</SectionTitle>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 28 }}>
        <Card hover className="portal-fadeInUp portal-stagger-1" style={{ padding: '24px 22px' }}>
          <SectionLabel>Gift Cards</SectionLabel>
          <div style={{ font: `300 28px ${s.FONT}`, color: s.text }}>
            {fmt(giftCards.reduce((sum, g) => sum + g.balance, 0))}
          </div>
        </Card>
        <Card hover className="portal-fadeInUp portal-stagger-2" style={{ padding: '24px 22px' }}>
          <SectionLabel>Account Credits</SectionLabel>
          <div style={{ font: `300 28px ${s.FONT}`, color: s.text }}>
            {fmt(credits.reduce((sum, c) => sum + c.balance, 0))}
          </div>
        </Card>
        <Card hover className="portal-fadeInUp portal-stagger-3" style={{ padding: '24px 22px' }}>
          <SectionLabel>Loyalty Points</SectionLabel>
          <div style={{ font: `300 28px ${s.FONT}`, color: s.accent }}>
            {loyalty ? loyalty.points.toLocaleString() : '0'}
          </div>
          {loyalty && (
            <div style={{ font: `400 12px ${s.FONT}`, color: s.text3, marginTop: 4 }}>
              {loyalty.lifetimePoints?.toLocaleString()} lifetime
            </div>
          )}
        </Card>
      </div>

      {/* Gift Cards detail */}
      {giftCards.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <SectionLabel>Gift Cards</SectionLabel>
          {giftCards.map((gc, i) => (
            <Card key={gc.id} className={`portal-fadeInUp portal-stagger-${Math.min(i + 1, 4)}`}
              style={{ padding: '20px 24px', marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ font: `500 14px ${s.FONT}`, color: s.text }}>
                    Gift Card from {gc.purchasedBy}
                  </div>
                  {gc.recipientMessage && (
                    <div style={{ font: `400 12px ${s.FONT}`, color: s.text2, fontStyle: 'italic', marginTop: 3 }}>
                      "{gc.recipientMessage}"
                    </div>
                  )}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ font: `500 17px ${s.FONT}`, color: s.accent }}>{fmt(gc.balance)}</div>
                  <div style={{ font: `400 11px ${s.FONT}`, color: s.text3 }}>of {fmt(gc.amount)}</div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Credits detail */}
      {credits.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <SectionLabel>Account Credits</SectionLabel>
          {credits.map((cr, i) => (
            <Card key={cr.id} className={`portal-fadeInUp portal-stagger-${Math.min(i + 1, 4)}`}
              style={{ padding: '18px 24px', marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ font: `500 14px ${s.FONT}`, color: s.text }}>{cr.reason}</div>
                  <div style={{ font: `400 11px ${s.FONT}`, color: s.text3 }}>{fmtDate(cr.createdAt)}</div>
                </div>
                <div style={{ font: `500 17px ${s.FONT}`, color: s.success }}>{fmt(cr.balance)}</div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Loyalty history */}
      {loyalty && loyalty.transactions && (
        <div className="portal-fadeInUp portal-stagger-4">
          <SectionLabel>Points Activity</SectionLabel>
          <Card style={{ padding: '20px 24px' }}>
            {loyalty.transactions.slice().reverse().map((tx, i) => (
              <div key={i} style={{
                display: 'flex', justifyContent: 'space-between', padding: '12px 0',
                borderBottom: i < loyalty.transactions.length - 1 ? '1px solid rgba(0,0,0,0.04)' : 'none',
              }}>
                <div>
                  <div style={{ font: `400 13px ${s.FONT}`, color: s.text }}>{tx.note}</div>
                  <div style={{ font: `400 11px ${s.FONT}`, color: s.text3 }}>{fmtDate(tx.date)}</div>
                </div>
                <span style={{
                  font: `600 13px ${s.MONO}`,
                  color: (tx.points || 0) > 0 ? s.success : s.danger,
                }}>
                  {(tx.points || 0) > 0 ? '+' : ''}{tx.points}
                </span>
              </div>
            ))}
          </Card>
        </div>
      )}

      {giftCards.length === 0 && credits.length === 0 && !loyalty && (
        <Card className="portal-fadeInUp" style={{ padding: '48px 28px', textAlign: 'center' }}>
          <div style={{ font: `400 15px ${s.FONT}`, color: s.text3 }}>No wallet activity yet.</div>
        </Card>
      )}
    </div>
  );

  const renderPhotos = () => {
    const pairKeys = Object.keys(photoPairs);
    return (
      <div>
        <SectionTitle sub="Track your transformation">Transformations</SectionTitle>
        {pairKeys.length === 0 ? (
          <Card className="portal-fadeInUp" style={{ padding: '48px 32px', textAlign: 'center' }}>
            <div style={{ font: `300 20px ${s.FONT}`, color: s.text, marginBottom: 10 }}>No photos yet</div>
            <div style={{ font: `400 14px ${s.FONT}`, color: s.text3, maxWidth: 340, margin: '0 auto' }}>
              Your before and after photos will appear here after your sessions.
            </div>
          </Card>
        ) : pairKeys.map((key, ki) => {
          const pair = photoPairs[key];
          return (
            <Card key={key} className={`portal-fadeInUp portal-stagger-${Math.min(ki + 1, 6)}`}
              style={{ padding: '24px 26px', marginBottom: 16 }}>
              <div style={{ font: `500 16px ${s.FONT}`, color: s.text, marginBottom: 4, letterSpacing: -0.2 }}>
                {pair.serviceName}
              </div>
              <div style={{ font: `400 12px ${s.FONT}`, color: s.text3, marginBottom: 18 }}>
                Angle: {pair.angle}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {['before', 'after'].map(phase => {
                  const photo = pair[phase];
                  return (
                    <div key={phase}>
                      <SectionLabel>{phase}</SectionLabel>
                      {photo ? (
                        <div style={{
                          height: 170, borderRadius: 14, background: 'rgba(0,0,0,0.03)',
                          border: '1px solid rgba(0,0,0,0.06)',
                          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <div style={{ font: `500 12px ${s.FONT}`, color: s.text3, marginBottom: 4 }}>
                            Clinical Photo
                          </div>
                          <div style={{ font: `400 11px ${s.FONT}`, color: s.text3 }}>{fmtDate(photo.date)}</div>
                          {photo.notes && (
                            <div style={{ font: `400 11px ${s.FONT}`, color: s.text2, marginTop: 8, padding: '0 14px', textAlign: 'center' }}>
                              {photo.notes}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div style={{
                          height: 170, borderRadius: 14, background: 'rgba(0,0,0,0.015)',
                          border: '1px dashed rgba(0,0,0,0.1)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          font: `400 13px ${s.FONT}`, color: s.text3,
                        }}>
                          Not yet taken
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>
          );
        })}
      </div>
    );
  };

  const renderWaivers = () => (
    <div>
      <SectionTitle sub="Review and sign your consent forms">My Waivers</SectionTitle>
      {waivers.length === 0 ? (
        <Card className="portal-fadeInUp" style={{ padding: '48px 28px', textAlign: 'center' }}>
          <div style={{ font: `400 15px ${s.FONT}`, color: s.text3 }}>No waivers assigned.</div>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {waivers.map((w, i) => {
            const templateName = WAIVER_TEMPLATES[w.templateId] || w.templateId;
            const isPending = w.status === 'pending';
            return (
              <Card key={w.id} className={`portal-fadeInUp portal-stagger-${Math.min(i + 1, 8)}`}
                style={{ padding: '20px 24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                    background: isPending ? '#FEF3C7' : '#F0FDF4',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    font: `500 15px ${s.FONT}`,
                    color: isPending ? s.warning : s.success,
                  }}>
                    {isPending ? '!' : '\u2713'}
                  </div>
                  <div style={{ flex: 1, minWidth: 140 }}>
                    <div style={{ font: `500 15px ${s.FONT}`, color: s.text }}>{templateName}</div>
                    <div style={{ font: `400 12px ${s.FONT}`, color: s.text3, marginTop: 2 }}>
                      {isPending ? 'Signature required' : `Signed ${fmtDate(w.signedAt)}`}
                    </div>
                  </div>
                  {isPending && (
                    signingWaiver === w.id ? (
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                        <input
                          value={signName}
                          onChange={e => setSignName(e.target.value)}
                          placeholder="Type full name to sign"
                          style={{ ...s.input, width: 200, padding: '10px 14px', fontSize: 13, borderRadius: 14 }}
                        />
                        <button
                          onClick={() => handleSignWaiver(w.id)}
                          disabled={!signName.trim()}
                          style={{
                            ...s.pillAccent, padding: '10px 18px', fontSize: 12,
                            opacity: signName.trim() ? 1 : 0.5,
                          }}
                        >Sign</button>
                        <button onClick={() => { setSigningWaiver(null); setSignName(''); }}
                          style={{ ...s.pillGhost, padding: '10px 14px', fontSize: 12 }}>Cancel</button>
                      </div>
                    ) : (
                      <button onClick={() => setSigningWaiver(w.id)}
                        style={{ ...s.pillAccent, padding: '10px 22px', fontSize: 12 }}>
                        Sign Now
                      </button>
                    )
                  )}
                  {!isPending && (
                    <Badge text="Signed" color={s.success} bg="#F0FDF4" />
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );

  const renderReferrals = () => (
    <div>
      <SectionTitle sub="Give $50, get $50 for every friend who visits">Refer a Friend</SectionTitle>
      <Card className="portal-fadeInUp" style={{ padding: '30px', marginBottom: 24 }}>
        <div style={{ font: `300 20px ${s.FONT}`, color: s.text, marginBottom: 8, letterSpacing: -0.3 }}>
          Share your referral code
        </div>
        <div style={{ font: `400 14px ${s.FONT}`, color: s.text2, marginBottom: 20, lineHeight: 1.6 }}>
          Give your friends $50 off their first visit and earn $50 in credits for each referral.
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px',
          borderRadius: 16, background: `${s.accent}08`, border: `1px solid ${s.accent}15`,
          marginBottom: 16,
        }}>
          <code style={{ font: `600 16px ${s.MONO}`, color: s.accent, flex: 1, letterSpacing: 0.5 }}>
            {referralCode}
          </code>
          <button onClick={copyReferralLink} style={{
            ...s.pillAccent, padding: '10px 22px', fontSize: 12,
            minWidth: 100,
          }}>
            {copied ? 'Copied!' : 'Copy Link'}
          </button>
        </div>
        <div style={{ font: `400 13px ${s.FONT}`, color: s.text3 }}>
          Share link: https://remedypilates.com/refer/{referralCode}
        </div>
      </Card>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 28 }}>
        {[
          { label: 'Total Referrals', value: referrals.length, color: s.text },
          { label: 'Completed', value: creditedReferrals.length, color: s.success },
          { label: 'Credits Earned', value: `$${totalReferralCredits}`, color: s.accent },
        ].map((stat, i) => (
          <Card key={i} hover className={`portal-fadeInUp portal-stagger-${i + 1}`}
            style={{ padding: '22px 18px', textAlign: 'center' }}>
            <div style={{ font: `300 28px ${s.FONT}`, color: stat.color, marginBottom: 4 }}>{stat.value}</div>
            <div style={{ font: `400 12px ${s.FONT}`, color: s.text3, letterSpacing: 0.2 }}>{stat.label}</div>
          </Card>
        ))}
      </div>

      {/* Referral History */}
      {referrals.length > 0 && (
        <div className="portal-fadeInUp portal-stagger-4">
          <SectionLabel>Referral History</SectionLabel>
          {referrals.map((r, i) => (
            <Card key={r.id} className={`portal-fadeInUp portal-stagger-${Math.min(i + 1, 6)}`}
              style={{ padding: '18px 24px', marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ font: `500 14px ${s.FONT}`, color: s.text }}>{r.friendName}</div>
                  <div style={{ font: `400 12px ${s.FONT}`, color: s.text3 }}>Referred {fmtDate(r.referredDate)}</div>
                </div>
                <Badge
                  text={r.status}
                  color={r.status === 'credited' ? s.success : r.status === 'booked' ? s.accent : s.warning}
                  bg={r.status === 'credited' ? '#F0FDF4' : r.status === 'booked' ? s.accentLight : '#FFFBEB'}
                />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  const renderInfo = () => (
    <div>
      <SectionTitle sub="Manage your personal details">My Profile</SectionTitle>
      <Card className="portal-fadeInUp" style={{ padding: '30px' }}>
        {!editInfo ? (
          <div>
            {[
              { label: 'Name', value: `${patient?.firstName || ''} ${patient?.lastName || ''}` },
              { label: 'Email', value: patient?.email || '' },
              { label: 'Phone', value: patient?.phone || '' },
              { label: 'Date of Birth', value: patient?.dob ? fmtDate(patient.dob) : '' },
              { label: 'Allergies', value: patient?.allergies || 'None' },
              { label: 'Member Since', value: patient?.createdAt ? fmtDate(patient.createdAt) : '' },
            ].map((row, i) => (
              <div key={i} style={{
                display: 'flex', justifyContent: 'space-between', padding: '16px 0', alignItems: 'center',
                borderBottom: i < 5 ? '1px solid rgba(0,0,0,0.04)' : 'none',
              }}>
                <span style={{ fontFamily: s.MONO, fontSize: 10, textTransform: 'uppercase', letterSpacing: 2, color: s.text3, fontWeight: 500 }}>{row.label}</span>
                <span style={{ font: `500 14px ${s.FONT}`, color: s.text }}>{row.value}</span>
              </div>
            ))}
            <div style={{ marginTop: 24 }}>
              <button onClick={handleEditInfo} style={{
                ...s.pillOutline, padding: '12px 28px', borderRadius: 100,
              }}>
                Edit Info
              </button>
            </div>
          </div>
        ) : (
          <div>
            {[
              { key: 'firstName', label: 'First Name' },
              { key: 'lastName', label: 'Last Name' },
              { key: 'email', label: 'Email' },
              { key: 'phone', label: 'Phone' },
              { key: 'dob', label: 'Date of Birth', type: 'date' },
              { key: 'allergies', label: 'Allergies' },
            ].map(field => (
              <div key={field.key} style={{ marginBottom: 20 }}>
                <label style={{
                  display: 'block', fontFamily: s.MONO, fontSize: 10, textTransform: 'uppercase',
                  letterSpacing: 2, color: s.text3, marginBottom: 8, fontWeight: 500,
                }}>{field.label}</label>
                <input
                  type={field.type || 'text'}
                  value={editForm[field.key] || ''}
                  onChange={e => setEditForm({ ...editForm, [field.key]: e.target.value })}
                  style={{ ...s.input, borderRadius: 14, padding: '14px 18px' }}
                />
              </div>
            ))}
            <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
              <button onClick={saveInfo} style={{
                ...s.pillAccent, padding: '12px 32px', borderRadius: 100,
                boxShadow: `0 4px 20px ${s.accent}30`,
              }}>Save</button>
              <button onClick={() => setEditInfo(false)} style={{
                ...s.pillGhost, padding: '12px 32px', borderRadius: 100,
              }}>Cancel</button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );

  const sections = {
    home: renderHome,
    appointments: renderAppointments,
    session: renderTreatmentPlan,
    membership: renderMembership,
    wallet: renderWallet,
    photos: renderPhotos,
    waivers: renderWaivers,
    referrals: renderReferrals,
    info: renderInfo,
  };

  return (
    <div style={{ minHeight: '100vh', background: '#FAF6F1', fontFamily: s.FONT, position: 'relative', overflow: 'hidden' }}>
      {/* Background orbs */}
      <div className="bg-orbs" style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        <div style={{
          position: 'absolute', top: '8%', left: '12%', width: 320, height: 320,
          borderRadius: '50%', background: `${s.accent}08`,
          filter: 'blur(80px)', animation: 'portalOrb1 18s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute', bottom: '15%', right: '8%', width: 260, height: 260,
          borderRadius: '50%', background: `${s.accent}06`,
          filter: 'blur(60px)', animation: 'portalOrb2 22s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute', top: '50%', left: '55%', width: 200, height: 200,
          borderRadius: '50%', background: `${s.accent}04`,
          filter: 'blur(50px)', animation: 'portalOrb1 26s ease-in-out infinite reverse',
        }} />
      </div>

      {/* Horizontal pill tabs — sticky */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(245,243,240,0.8)',
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(0,0,0,0.04)',
      }}>
        <div className="portal-tabs" style={{
          maxWidth: 800, margin: '0 auto', padding: '14px 24px',
          display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center',
        }}>
          {navItems.map(item => {
            const active = section === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setSection(item.id)}
                style={{
                  padding: '9px 20px', borderRadius: 100, border: 'none', cursor: 'pointer',
                  font: `${active ? '600' : '400'} 13px ${s.FONT}`,
                  color: active ? s.accentText : s.text2,
                  background: active ? s.accent : 'rgba(255,255,255,0.5)',
                  boxShadow: active ? `0 2px 12px ${s.accent}30` : '0 1px 3px rgba(0,0,0,0.04)',
                  whiteSpace: 'nowrap', transition: 'all 0.25s cubic-bezier(0.16,1,0.3,1)',
                  backdropFilter: active ? 'none' : 'blur(8px)',
                  letterSpacing: active ? 0.3 : 0,
                  flexShrink: 0,
                }}
                onMouseEnter={e => {
                  if (!active) {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.8)';
                    e.currentTarget.style.color = s.text;
                  }
                }}
                onMouseLeave={e => {
                  if (!active) {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.5)';
                    e.currentTarget.style.color = s.text2;
                  }
                }}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content — centered, max 800px, generous spacing */}
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '36px 24px 80px', position: 'relative', zIndex: 1 }}>
        {sections[section]?.()}
      </div>

      {/* Dev toolbar — floating pill bottom-right */}
      <div style={{
        position: 'fixed', bottom: 20, right: 20, zIndex: 200,
        background: 'rgba(17,17,17,0.92)', backdropFilter: 'blur(12px)',
        borderRadius: 100, padding: '8px 16px',
        display: 'flex', alignItems: 'center', gap: 10,
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
      }}>
        <span style={{ font: `400 11px ${s.MONO}`, color: '#666' }}>as:</span>
        <select
          value={selectedPatientId}
          onChange={e => { setSelectedPatientId(e.target.value); setSection('home'); setEditInfo(false); }}
          style={{
            background: 'transparent', color: '#ccc', border: 'none',
            font: `400 11px ${s.MONO}`, outline: 'none', cursor: 'pointer',
          }}
        >
          {clients.map(p => (
            <option key={p.id} value={p.id} style={{ background: '#222' }}>
              {p.firstName} {p.lastName}
            </option>
          ))}
        </select>
        <div style={{ width: 1, height: 16, background: '#444' }} />
        <button onClick={() => window.location.href = '/'} style={{
          background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 100,
          padding: '4px 12px', font: `400 11px ${s.FONT}`, color: '#888', cursor: 'pointer',
        }}>← Home</button>
      </div>
    </div>
  );
}
