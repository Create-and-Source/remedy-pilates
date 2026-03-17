import { useState, useEffect } from 'react';
import { useStyles } from '../theme';
import { subscribe } from '../data/store';

const MEM_KEY = 'ms_memberships';
const PKG_KEY = 'ms_packages';

function getMemberships() {
  try { return JSON.parse(localStorage.getItem(MEM_KEY)) || []; } catch { return []; }
}
function setMemberships(data) { localStorage.setItem(MEM_KEY, JSON.stringify(data)); }

function getPackages() {
  try { return JSON.parse(localStorage.getItem(PKG_KEY)) || []; } catch { return []; }
}
function setPackages(data) { localStorage.setItem(PKG_KEY, JSON.stringify(data)); }

function getPatients() {
  try { return JSON.parse(localStorage.getItem('ms_patients')) || []; } catch { return []; }
}

const TIERS = {
  Silver: { price: 99, color: '#94A3B8', bg: '#F8FAFC', allocations: [{ service: 'HydraFacial', units: 1, unit: 'session' }, { service: 'Chemical Peel', units: 1, unit: 'session' }] },
  Gold: { price: 199, color: '#A68A4C', bg: '#FAF7F2', allocations: [{ service: 'Botox', units: 20, unit: 'units' }, { service: 'HydraFacial', units: 1, unit: 'session' }, { service: 'Chemical Peel', units: 1, unit: 'session' }] },
  Platinum: { price: 349, color: '#7C3AED', bg: '#F5F3FF', allocations: [{ service: 'Botox', units: 40, unit: 'units' }, { service: 'Juvederm Filler', units: 1, unit: 'syringe' }, { service: 'HydraFacial', units: 2, unit: 'sessions' }, { service: 'RF Microneedling', units: 1, unit: 'session' }, { service: 'IV Therapy', units: 1, unit: 'session' }] },
};

const TIER_FEATURES = {
  Silver: ['1 HydraFacial per month', '1 Chemical Peel per month', '10% off retail products', 'Priority booking access'],
  Gold: ['20 Botox units per month', '1 HydraFacial per month', '1 Chemical Peel per month', '15% off retail products', 'Priority booking access', 'Free consultations'],
  Platinum: ['40 Botox units per month', '1 Juvederm syringe per month', '2 HydraFacials per month', '1 RF Microneedling session', '1 IV Therapy session', '20% off retail products', 'VIP priority booking', 'Free consultations', 'Exclusive member events'],
};

function seedMemberships() {
  if (localStorage.getItem('ms_memberships_seeded')) return;
  const patients = getPatients();
  if (patients.length < 16) return;

  const now = new Date();
  const d = (offset) => { const dt = new Date(now); dt.setDate(dt.getDate() + offset); return dt.toISOString().slice(0, 10); };

  const memberships = [
    { id: 'MEM-1', patientId: patients[0].id, patientName: `${patients[0].firstName} ${patients[0].lastName}`, tier: 'Gold', startDate: d(-60), nextBilling: d(0), credits: 25, status: 'active', wallet: [{ service: 'Botox', remaining: 5, total: 20 }, { service: 'HydraFacial', remaining: 0, total: 1 }, { service: 'Chemical Peel', remaining: 1, total: 1 }] },
    { id: 'MEM-2', patientId: patients[1].id, patientName: `${patients[1].firstName} ${patients[1].lastName}`, tier: 'Platinum', startDate: d(-90), nextBilling: d(5), credits: 0, status: 'active', wallet: [{ service: 'Botox', remaining: 28, total: 40 }, { service: 'Juvederm Filler', remaining: 1, total: 1 }, { service: 'HydraFacial', remaining: 2, total: 2 }, { service: 'RF Microneedling', remaining: 1, total: 1 }, { service: 'IV Therapy', remaining: 0, total: 1 }] },
    { id: 'MEM-3', patientId: patients[2].id, patientName: `${patients[2].firstName} ${patients[2].lastName}`, tier: 'Silver', startDate: d(-30), nextBilling: d(1), credits: 50, status: 'active', wallet: [{ service: 'HydraFacial', remaining: 1, total: 1 }, { service: 'Chemical Peel', remaining: 0, total: 1 }] },
    { id: 'MEM-4', patientId: patients[3].id, patientName: `${patients[3].firstName} ${patients[3].lastName}`, tier: 'Gold', startDate: d(-120), nextBilling: d(10), credits: 0, status: 'active', wallet: [{ service: 'Botox', remaining: 20, total: 20 }, { service: 'HydraFacial', remaining: 1, total: 1 }, { service: 'Chemical Peel', remaining: 1, total: 1 }] },
    { id: 'MEM-5', patientId: patients[4].id, patientName: `${patients[4].firstName} ${patients[4].lastName}`, tier: 'Platinum', startDate: d(-45), nextBilling: d(15), credits: 100, status: 'active', wallet: [{ service: 'Botox', remaining: 12, total: 40 }, { service: 'Juvederm Filler', remaining: 0, total: 1 }, { service: 'HydraFacial', remaining: 1, total: 2 }, { service: 'RF Microneedling', remaining: 0, total: 1 }, { service: 'IV Therapy', remaining: 1, total: 1 }] },
    { id: 'MEM-6', patientId: patients[5].id, patientName: `${patients[5].firstName} ${patients[5].lastName}`, tier: 'Silver', startDate: d(-15), nextBilling: d(15), credits: 0, status: 'active', wallet: [{ service: 'HydraFacial', remaining: 1, total: 1 }, { service: 'Chemical Peel', remaining: 1, total: 1 }] },
    { id: 'MEM-7', patientId: patients[6].id, patientName: `${patients[6].firstName} ${patients[6].lastName}`, tier: 'Gold', startDate: d(-75), nextBilling: d(14), credits: 75, status: 'active', wallet: [{ service: 'Botox', remaining: 8, total: 20 }, { service: 'HydraFacial', remaining: 0, total: 1 }, { service: 'Chemical Peel', remaining: 0, total: 1 }] },
    { id: 'MEM-8', patientId: patients[7].id, patientName: `${patients[7].firstName} ${patients[7].lastName}`, tier: 'Platinum', startDate: d(-180), nextBilling: d(3), credits: 0, status: 'active', wallet: [{ service: 'Botox', remaining: 35, total: 40 }, { service: 'Juvederm Filler', remaining: 1, total: 1 }, { service: 'HydraFacial', remaining: 2, total: 2 }, { service: 'RF Microneedling', remaining: 1, total: 1 }, { service: 'IV Therapy', remaining: 1, total: 1 }] },
    { id: 'MEM-9', patientId: patients[8].id, patientName: `${patients[8].firstName} ${patients[8].lastName}`, tier: 'Gold', startDate: d(-200), nextBilling: d(-5), credits: 0, status: 'paused', wallet: [{ service: 'Botox', remaining: 14, total: 20 }, { service: 'HydraFacial', remaining: 1, total: 1 }, { service: 'Chemical Peel', remaining: 1, total: 1 }] },
    { id: 'MEM-10', patientId: patients[9].id, patientName: `${patients[9].firstName} ${patients[9].lastName}`, tier: 'Silver', startDate: d(-10), nextBilling: d(20), credits: 0, status: 'active', wallet: [{ service: 'HydraFacial', remaining: 1, total: 1 }, { service: 'Chemical Peel', remaining: 1, total: 1 }] },
  ];

  const packages = [
    { id: 'PKG-1', patientId: patients[0].id, patientName: `${patients[0].firstName} ${patients[0].lastName}`, name: '3 IPL Sessions', service: 'IPL Photofacial', totalSessions: 3, usedSessions: 2, purchaseDate: d(-45), expiresDate: d(45), status: 'active' },
    { id: 'PKG-2', patientId: patients[2].id, patientName: `${patients[2].firstName} ${patients[2].lastName}`, name: '6 Laser Hair Removal', service: 'Laser Hair Removal', totalSessions: 6, usedSessions: 3, purchaseDate: d(-90), expiresDate: d(90), status: 'active' },
    { id: 'PKG-3', patientId: patients[4].id, patientName: `${patients[4].firstName} ${patients[4].lastName}`, name: '3 RF Microneedling', service: 'RF Microneedling', totalSessions: 3, usedSessions: 1, purchaseDate: d(-30), expiresDate: d(60), status: 'active' },
    { id: 'PKG-4', patientId: patients[7].id, patientName: `${patients[7].firstName} ${patients[7].lastName}`, name: '4 Chemical Peels', service: 'Chemical Peel', totalSessions: 4, usedSessions: 4, purchaseDate: d(-120), expiresDate: d(-10), status: 'completed' },
    { id: 'PKG-5', patientId: patients[10].id, patientName: `${patients[10].firstName} ${patients[10].lastName}`, name: '3 IPL Sessions', service: 'IPL Photofacial', totalSessions: 3, usedSessions: 0, purchaseDate: d(-5), expiresDate: d(85), status: 'active' },
    { id: 'PKG-6', patientId: patients[3].id, patientName: `${patients[3].firstName} ${patients[3].lastName}`, name: '6 HydraFacial', service: 'HydraFacial', totalSessions: 6, usedSessions: 5, purchaseDate: d(-150), expiresDate: d(14), status: 'active' },
  ];

  setMemberships(memberships);
  setPackages(packages);
  localStorage.setItem('ms_memberships_seeded', 'true');
}

/* ---------- Inline keyframe injection (once) ---------- */
const STYLE_ID = 'memberships-animations';
if (typeof document !== 'undefined' && !document.getElementById(STYLE_ID)) {
  const styleEl = document.createElement('style');
  styleEl.id = STYLE_ID;
  styleEl.textContent = `
    @keyframes memFadeUp {
      from { opacity: 0; transform: translateY(18px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes memShimmer {
      0%   { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }
    @keyframes memPulse {
      0%, 100% { opacity: 1; }
      50%      { opacity: 0.6; }
    }
  `;
  document.head.appendChild(styleEl);
}

/* ---------- Reusable sub-components ---------- */

function CheckIcon({ color = '#16A34A' }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
      <circle cx="8" cy="8" r="8" fill={color} opacity="0.12" />
      <path d="M5 8.2L7 10.2L11 6.2" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ProgressBar({ value, total, color, height = 6, showGlow = false }) {
  const pct = total > 0 ? Math.min((value / total) * 100, 100) : 0;
  return (
    <div style={{
      height, borderRadius: height, background: 'rgba(0,0,0,0.06)', overflow: 'hidden', position: 'relative',
    }}>
      <div style={{
        width: `${pct}%`, height: '100%', borderRadius: height,
        background: `linear-gradient(90deg, ${color}, ${color}DD)`,
        transition: 'width 0.5s cubic-bezier(0.16,1,0.3,1)',
        boxShadow: showGlow ? `0 0 8px ${color}44` : 'none',
      }} />
    </div>
  );
}

function AlertDot({ color }) {
  return (
    <span style={{
      width: 7, height: 7, borderRadius: '50%', background: color, flexShrink: 0, display: 'inline-block',
      boxShadow: `0 0 6px ${color}66`,
      animation: 'memPulse 2s ease-in-out infinite',
    }} />
  );
}

/* ============================================================ */

export default function Memberships() {
  const s = useStyles();
  const [, setTick] = useState(0);
  useEffect(() => subscribe(() => setTick(t => t + 1)), []);
  useEffect(() => { seedMemberships(); }, []);

  const [tab, setTab] = useState('memberships');
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [view, setView] = useState('cards');
  const [selectedMember, setSelectedMember] = useState(null);
  const [hoveredTier, setHoveredTier] = useState(null);
  const [hoveredCard, setHoveredCard] = useState(null);

  const memberships = getMemberships();
  const packages = getPackages();

  // Filter
  const filteredMemberships = memberships.filter(m => {
    if (filter === 'Silver' || filter === 'Gold' || filter === 'Platinum') {
      if (m.tier !== filter) return false;
    }
    if (filter === 'paused' && m.status !== 'paused') return false;
    if (search) {
      const q = search.toLowerCase();
      return m.patientName?.toLowerCase().includes(q) || m.tier?.toLowerCase().includes(q);
    }
    return true;
  });

  const filteredPackages = packages.filter(p => {
    if (filter === 'active' && p.status !== 'active') return false;
    if (filter === 'completed' && p.status !== 'completed') return false;
    if (search) return p.patientName?.toLowerCase().includes(search.toLowerCase()) || p.name?.toLowerCase().includes(search.toLowerCase());
    return true;
  });

  // KPIs
  const activeMemberships = memberships.filter(m => m.status === 'active').length;
  const mrr = memberships.filter(m => m.status === 'active').reduce((sum, m) => sum + (TIERS[m.tier]?.price || 0), 0);
  const tierBreakdown = { Silver: memberships.filter(m => m.tier === 'Silver').length, Gold: memberships.filter(m => m.tier === 'Gold').length, Platinum: memberships.filter(m => m.tier === 'Platinum').length };
  const activePackages = packages.filter(p => p.status === 'active').length;

  // Alerts
  const alerts = [];
  memberships.forEach(m => {
    m.wallet?.forEach(w => {
      if (w.remaining > 0 && w.remaining <= 5 && w.total >= 10) {
        alerts.push({ type: 'low', text: `${m.patientName} has ${w.remaining} ${w.service} units remaining`, id: m.id });
      }
    });
  });
  packages.forEach(p => {
    if (p.status === 'active') {
      const daysLeft = Math.ceil((new Date(p.expiresDate) - new Date()) / (1000 * 60 * 60 * 24));
      if (daysLeft <= 14 && daysLeft > 0) {
        alerts.push({ type: 'expiring', text: `${p.patientName}'s "${p.name}" package expires in ${daysLeft} days`, id: p.id });
      }
    }
  });

  // Actions
  const deductUnit = (memId, serviceName) => {
    const all = getMemberships().map(m => {
      if (m.id === memId) {
        return { ...m, wallet: m.wallet.map(w => w.service === serviceName ? { ...w, remaining: Math.max(0, w.remaining - 1) } : w) };
      }
      return m;
    });
    setMemberships(all);
    setTick(t => t + 1);
  };

  const usePackageSession = (pkgId) => {
    const all = getPackages().map(p => {
      if (p.id === pkgId) {
        const used = p.usedSessions + 1;
        return { ...p, usedSessions: used, status: used >= p.totalSessions ? 'completed' : 'active' };
      }
      return p;
    });
    setPackages(all);
    setTick(t => t + 1);
  };

  const tierColor = (tier) => TIERS[tier]?.color || s.text3;

  /* -- Style helpers -- */
  const glassCard = {
    background: 'rgba(255,255,255,0.72)',
    backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
    border: '1px solid rgba(255,255,255,0.7)',
    borderRadius: 20,
    boxShadow: '0 4px 24px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)',
    transition: 'all 0.35s cubic-bezier(0.16,1,0.3,1)',
  };

  const tierGradients = {
    Silver: 'linear-gradient(135deg, #94A3B8, #B0BEC5, #94A3B8)',
    Gold: 'linear-gradient(135deg, #D4A017, #F0C850, #D4A017)',
    Platinum: 'linear-gradient(135deg, #7C3AED, #A78BFA, #7C3AED)',
  };

  const tierGlowShadows = {
    Silver: '0 8px 32px rgba(148,163,184,0.18), 0 2px 4px rgba(0,0,0,0.03)',
    Gold: '0 8px 32px rgba(212,160,23,0.18), 0 2px 4px rgba(0,0,0,0.03)',
    Platinum: '0 8px 32px rgba(124,58,237,0.18), 0 2px 4px rgba(0,0,0,0.03)',
  };

  const stagger = (i) => ({
    animation: `memFadeUp 0.5s ${i * 0.08}s cubic-bezier(0.16,1,0.3,1) both`,
  });

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto' }}>

      {/* ===== HEADER ===== */}
      <div style={{ marginBottom: 36, ...stagger(0) }}>
        <h1 style={{ font: `700 32px ${s.FONT}`, color: s.text, marginBottom: 6, letterSpacing: '-0.02em' }}>
          Memberships & Packages
        </h1>
        <p style={{ font: `400 15px ${s.FONT}`, color: s.text2, lineHeight: 1.5 }}>
          Manage membership wallets, service allocations, and treatment packages
        </p>
      </div>

      {/* ===== TIER SHOWCASE ===== */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginBottom: 32 }}>
        {Object.entries(TIERS).map(([name, tier], idx) => {
          const isHovered = hoveredTier === name;
          return (
            <div
              key={name}
              onMouseEnter={() => setHoveredTier(name)}
              onMouseLeave={() => setHoveredTier(null)}
              style={{
                ...glassCard,
                overflow: 'hidden',
                position: 'relative',
                transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
                boxShadow: isHovered ? tierGlowShadows[name] : glassCard.boxShadow,
                ...stagger(idx + 1),
              }}
            >
              {/* Gradient top border */}
              <div style={{
                height: 5, width: '100%',
                background: tierGradients[name],
                backgroundSize: '200% 100%',
                animation: isHovered ? 'memShimmer 2s linear infinite' : 'none',
              }} />

              <div style={{ padding: '28px 28px 24px' }}>
                {/* Tier name */}
                <div style={{
                  font: `600 13px ${s.MONO}`, textTransform: 'uppercase', letterSpacing: 2,
                  color: tier.color, marginBottom: 12, opacity: 0.9,
                }}>
                  {name}
                </div>

                {/* Price */}
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 4 }}>
                  <span style={{ font: `600 36px ${s.FONT}`, color: s.text, letterSpacing: '-0.02em' }}>
                    ${tier.price}
                  </span>
                  <span style={{ font: `400 14px ${s.FONT}`, color: s.text3 }}>
                    / month
                  </span>
                </div>

                {/* Active member count */}
                <div style={{
                  font: `500 13px ${s.FONT}`, color: s.text2, marginBottom: 20,
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  <span style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: tier.color, display: 'inline-block', opacity: 0.6,
                  }} />
                  {tierBreakdown[name]} active member{tierBreakdown[name] !== 1 ? 's' : ''}
                </div>

                {/* Divider */}
                <div style={{ height: 1, background: 'rgba(0,0,0,0.06)', marginBottom: 18 }} />

                {/* Feature checklist */}
                <div style={{ display: 'grid', gap: 10 }}>
                  {TIER_FEATURES[name].map((feat, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <CheckIcon color={tier.color} />
                      <span style={{ font: `400 13px ${s.FONT}`, color: s.text2, lineHeight: 1.3 }}>{feat}</span>
                    </div>
                  ))}
                </div>

                {/* CTA */}
                <button
                  onClick={() => { setTab('memberships'); setFilter(name); }}
                  style={{
                    marginTop: 24, width: '100%', padding: '12px 20px', borderRadius: 12,
                    border: 'none', cursor: 'pointer',
                    font: `600 13px ${s.FONT}`, letterSpacing: '0.02em',
                    background: isHovered ? tier.color : `${tier.color}14`,
                    color: isHovered ? '#FFFFFF' : tier.color,
                    transition: 'all 0.3s cubic-bezier(0.16,1,0.3,1)',
                    boxShadow: isHovered ? `0 4px 20px ${tier.color}33` : 'none',
                  }}
                >
                  View {name} Members
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ===== KPI ROW ===== */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
        {[
          { label: 'Monthly Revenue', value: `$${mrr.toLocaleString()}`, icon: '$', color: s.success, sub: 'Recurring' },
          { label: 'Total Members', value: activeMemberships, icon: '#', color: s.accent, sub: 'Active' },
          { label: 'Active Packages', value: activePackages, icon: '~', color: '#7C3AED', sub: 'In progress' },
          { label: 'Alerts', value: alerts.length, icon: '!', color: alerts.length > 0 ? s.warning : s.success, sub: alerts.length > 0 ? 'Need attention' : 'All clear' },
        ].map((k, i) => (
          <div key={k.label} style={{
            ...glassCard, padding: '22px 24px',
            ...stagger(i + 4),
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
              <div style={{
                font: `500 10px ${s.MONO}`, textTransform: 'uppercase', letterSpacing: 1.5,
                color: s.text3,
              }}>
                {k.label}
              </div>
              <div style={{
                width: 32, height: 32, borderRadius: 10,
                background: `${k.color}10`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                font: `700 14px ${s.MONO}`, color: k.color,
              }}>
                {k.icon}
              </div>
            </div>
            <div style={{ font: `700 28px ${s.FONT}`, color: s.text, letterSpacing: '-0.02em', marginBottom: 4 }}>
              {k.value}
            </div>
            <div style={{ font: `400 12px ${s.FONT}`, color: s.text3 }}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* ===== ALERTS ===== */}
      {alerts.length > 0 && (
        <div style={{
          ...glassCard, padding: '20px 24px', marginBottom: 28,
          borderLeft: `4px solid ${s.warning}`,
          background: 'rgba(255,251,235,0.6)',
          ...stagger(8),
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 8,
              background: `${s.warning}15`, display: 'flex', alignItems: 'center', justifyContent: 'center',
              font: `700 13px ${s.MONO}`, color: s.warning,
            }}>!</div>
            <span style={{ font: `600 14px ${s.FONT}`, color: s.warning }}>Attention Required</span>
            <span style={{
              padding: '3px 10px', borderRadius: 100,
              font: `600 11px ${s.FONT}`, background: `${s.warning}15`, color: s.warning,
            }}>{alerts.length}</span>
          </div>
          <div style={{ display: 'grid', gap: 8 }}>
            {alerts.map((a, i) => (
              <div key={i} style={{
                font: `400 13px ${s.FONT}`, color: s.text2, padding: '6px 0',
                display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <AlertDot color={a.type === 'low' ? s.warning : s.danger} />
                {a.text}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===== TABS ===== */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 24, ...stagger(9),
      }}>
        <div style={{
          display: 'inline-flex', padding: 4, borderRadius: 14,
          background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(12px)',
          border: '1px solid rgba(0,0,0,0.04)',
        }}>
          {[
            { id: 'memberships', label: 'Members', count: filteredMemberships.length },
            { id: 'packages', label: 'Packages', count: filteredPackages.length },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => { setTab(t.id); setFilter('all'); }}
              style={{
                padding: '10px 22px', borderRadius: 10, border: 'none', cursor: 'pointer',
                font: `500 13px ${s.FONT}`,
                background: tab === t.id ? s.accent : 'transparent',
                color: tab === t.id ? s.accentText : s.text2,
                boxShadow: tab === t.id ? `0 2px 12px ${s.accent}22` : 'none',
                transition: 'all 0.25s cubic-bezier(0.16,1,0.3,1)',
                display: 'flex', alignItems: 'center', gap: 8,
              }}
            >
              {t.label}
              <span style={{
                padding: '1px 7px', borderRadius: 100, font: `600 10px ${s.FONT}`,
                background: tab === t.id ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.05)',
                color: tab === t.id ? s.accentText : s.text3,
              }}>{t.count}</span>
            </button>
          ))}
        </div>

        {/* View toggle */}
        <div style={{
          display: 'inline-flex', padding: 3, borderRadius: 10,
          background: 'rgba(255,255,255,0.5)', border: '1px solid rgba(0,0,0,0.04)',
        }}>
          {['cards', 'table'].map(v => (
            <button key={v} onClick={() => setView(v)} style={{
              padding: '7px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
              font: `500 11px ${s.FONT}`, textTransform: 'capitalize',
              background: view === v ? 'rgba(0,0,0,0.06)' : 'transparent',
              color: view === v ? s.text : s.text3,
              transition: 'all 0.2s',
            }}>{v}</button>
          ))}
        </div>
      </div>

      {/* ===== FILTERS ===== */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '0 0 auto' }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
            <circle cx="7" cy="7" r="5" stroke={s.text3} strokeWidth="1.5" />
            <path d="M11 11L14 14" stroke={s.text3} strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={tab === 'memberships' ? 'Search members...' : 'Search packages...'}
            style={{
              ...s.input, maxWidth: 280, paddingLeft: 40,
              borderRadius: 12,
            }}
          />
        </div>

        {tab === 'memberships' && (
          <div style={{ display: 'flex', gap: 6 }}>
            {[['all', 'All'], ['Silver', 'Silver'], ['Gold', 'Gold'], ['Platinum', 'Platinum'], ['paused', 'Paused']].map(([id, label]) => (
              <button
                key={id}
                onClick={() => setFilter(id)}
                style={{
                  padding: '8px 16px', borderRadius: 10, border: 'none', cursor: 'pointer',
                  font: `500 12px ${s.FONT}`,
                  background: filter === id ? (TIERS[id]?.color || s.accent) : 'rgba(255,255,255,0.5)',
                  color: filter === id ? '#FFFFFF' : s.text2,
                  boxShadow: filter === id ? `0 2px 12px ${(TIERS[id]?.color || s.accent)}33` : 'none',
                  transition: 'all 0.25s cubic-bezier(0.16,1,0.3,1)',
                  backdropFilter: 'blur(8px)',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}
              >
                {TIERS[id] && <span style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: filter === id ? 'rgba(255,255,255,0.4)' : TIERS[id].color,
                  display: 'inline-block',
                }} />}
                {label}
              </button>
            ))}
          </div>
        )}
        {tab === 'packages' && (
          <div style={{ display: 'flex', gap: 6 }}>
            {[['all', 'All'], ['active', 'Active'], ['completed', 'Completed']].map(([id, label]) => (
              <button
                key={id}
                onClick={() => setFilter(id)}
                style={{
                  padding: '8px 16px', borderRadius: 10, border: 'none', cursor: 'pointer',
                  font: `500 12px ${s.FONT}`,
                  background: filter === id ? s.accent : 'rgba(255,255,255,0.5)',
                  color: filter === id ? s.accentText : s.text2,
                  boxShadow: filter === id ? `0 2px 12px ${s.accent}33` : 'none',
                  transition: 'all 0.25s cubic-bezier(0.16,1,0.3,1)',
                  backdropFilter: 'blur(8px)',
                }}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ===== MEMBERS TAB — CARDS VIEW ===== */}
      {tab === 'memberships' && view === 'cards' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(370px, 1fr))', gap: 18 }}>
          {filteredMemberships.map((m, idx) => {
            const tc = tierColor(m.tier);
            const isHovered = hoveredCard === m.id;
            const hasLowUnits = m.wallet?.some(w => w.remaining > 0 && w.remaining <= 5 && w.total >= 10);
            return (
              <div
                key={m.id}
                onMouseEnter={() => setHoveredCard(m.id)}
                onMouseLeave={() => setHoveredCard(null)}
                onClick={() => setSelectedMember(selectedMember === m.id ? null : m.id)}
                style={{
                  ...glassCard, overflow: 'hidden', cursor: 'pointer', position: 'relative',
                  transform: isHovered ? 'translateY(-3px)' : 'translateY(0)',
                  boxShadow: isHovered ? `0 8px 32px ${tc}18, 0 2px 4px rgba(0,0,0,0.03)` : glassCard.boxShadow,
                  ...stagger(idx),
                }}
              >
                {/* Gradient top accent */}
                <div style={{
                  height: 4, width: '100%',
                  background: tierGradients[m.tier],
                }} />

                {/* Low-unit warning glow */}
                {hasLowUnits && (
                  <div style={{
                    position: 'absolute', top: 4, right: 0, width: 80, height: 80,
                    background: `radial-gradient(circle, ${s.warning}15 0%, transparent 70%)`,
                    pointerEvents: 'none',
                  }} />
                )}

                <div style={{ padding: '22px 24px 20px' }}>
                  {/* Header row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                    <div>
                      <div style={{ font: `600 16px ${s.FONT}`, color: s.text, marginBottom: 6, letterSpacing: '-0.01em' }}>
                        {m.patientName}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        {/* Tier badge */}
                        <span style={{
                          padding: '4px 14px', borderRadius: 100,
                          font: `600 11px ${s.FONT}`, letterSpacing: '0.03em',
                          background: `${tc}14`, color: tc,
                          border: `1px solid ${tc}22`,
                        }}>{m.tier}</span>
                        {m.status === 'paused' && (
                          <span style={{
                            padding: '4px 12px', borderRadius: 100,
                            font: `500 10px ${s.FONT}`,
                            background: '#FEF2F2', color: s.danger,
                            border: '1px solid #FECACA',
                          }}>Paused</span>
                        )}
                        {m.credits > 0 && (
                          <span style={{
                            padding: '4px 12px', borderRadius: 100,
                            font: `600 10px ${s.FONT}`,
                            background: '#F0FDF4', color: s.success,
                            border: '1px solid #BBF7D0',
                          }}>${m.credits} credit</span>
                        )}
                        {hasLowUnits && (
                          <span style={{
                            padding: '4px 12px', borderRadius: 100,
                            font: `600 10px ${s.FONT}`,
                            background: '#FEF3C7', color: s.warning,
                            border: '1px solid #FDE68A',
                          }}>Low units</span>
                        )}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ font: `700 22px ${s.FONT}`, color: s.text, letterSpacing: '-0.02em' }}>
                        ${TIERS[m.tier]?.price}
                      </div>
                      <div style={{ font: `400 11px ${s.FONT}`, color: s.text3, marginTop: 2 }}>
                        Next: {new Date(m.nextBilling + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </div>
                    </div>
                  </div>

                  {/* Divider */}
                  <div style={{ height: 1, background: 'rgba(0,0,0,0.05)', marginBottom: 16 }} />

                  {/* Wallet — service allocations with progress bars */}
                  <div style={{
                    font: `500 9px ${s.MONO}`, textTransform: 'uppercase', letterSpacing: 1.5,
                    color: s.text3, marginBottom: 12,
                  }}>Service Wallet</div>

                  <div style={{ display: 'grid', gap: 10 }}>
                    {m.wallet?.map(w => {
                      const pct = w.total > 0 ? (w.remaining / w.total) * 100 : 0;
                      const barColor = pct <= 25 ? s.danger : pct <= 50 ? s.warning : s.success;
                      return (
                        <div key={w.service}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                            <span style={{ font: `400 13px ${s.FONT}`, color: s.text2 }}>{w.service}</span>
                            <span style={{
                              font: `600 12px ${s.MONO}`,
                              color: w.remaining === 0 ? s.text3 : s.text,
                            }}>
                              {w.remaining}/{w.total}
                              <span style={{ font: `400 10px ${s.FONT}`, color: s.text3, marginLeft: 3 }}>
                                {w.remaining === 0 ? 'used' : 'left'}
                              </span>
                            </span>
                          </div>
                          <ProgressBar
                            value={w.remaining} total={w.total}
                            color={barColor} height={6}
                            showGlow={w.remaining > 0 && w.remaining <= 5 && w.total >= 10}
                          />
                        </div>
                      );
                    })}
                  </div>

                  {/* Expanded: deduct buttons */}
                  {selectedMember === m.id && (
                    <div style={{
                      marginTop: 18, paddingTop: 16,
                      borderTop: '1px solid rgba(0,0,0,0.06)',
                      animation: 'memFadeUp 0.25s ease-out',
                    }}>
                      <div style={{
                        font: `500 9px ${s.MONO}`, textTransform: 'uppercase', letterSpacing: 1.5,
                        color: s.text3, marginBottom: 10,
                      }}>Record Usage</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {m.wallet?.filter(w => w.remaining > 0).map(w => (
                          <button
                            key={w.service}
                            onClick={(e) => { e.stopPropagation(); deductUnit(m.id, w.service); }}
                            style={{
                              padding: '8px 16px', borderRadius: 10, cursor: 'pointer',
                              font: `500 12px ${s.FONT}`,
                              background: `${tc}0A`, color: tc,
                              border: `1.5px solid ${tc}30`,
                              transition: 'all 0.2s',
                            }}
                            onMouseOver={e => { e.currentTarget.style.background = tc; e.currentTarget.style.color = '#FFF'; }}
                            onMouseOut={e => { e.currentTarget.style.background = `${tc}0A`; e.currentTarget.style.color = tc; }}
                          >
                            Use 1 {w.service}
                          </button>
                        ))}
                        {m.wallet?.every(w => w.remaining === 0) && (
                          <span style={{ font: `400 13px ${s.FONT}`, color: s.text3, padding: '8px 0' }}>
                            All units used this cycle
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          {filteredMemberships.length === 0 && (
            <div style={{
              ...glassCard, padding: 56, textAlign: 'center', gridColumn: '1 / -1',
              font: `400 15px ${s.FONT}`, color: s.text3,
            }}>
              No memberships match this filter
            </div>
          )}
        </div>
      )}

      {/* ===== MEMBERS TAB — TABLE VIEW ===== */}
      {tab === 'memberships' && view === 'table' && (
        <div style={{
          ...glassCard, overflow: 'hidden',
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', font: `400 13px ${s.FONT}` }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                {['Patient', 'Tier', 'Status', 'Next Billing', 'Credits', 'Wallet Summary', ''].map(h => (
                  <th key={h} style={{
                    padding: '14px 18px', textAlign: 'left',
                    font: `500 9px ${s.MONO}`, textTransform: 'uppercase', letterSpacing: 1.5,
                    color: s.text3, background: 'rgba(0,0,0,0.015)',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredMemberships.map(m => {
                const tc = tierColor(m.tier);
                return (
                  <tr key={m.id} style={{
                    borderBottom: '1px solid rgba(0,0,0,0.04)',
                    transition: 'background 0.2s',
                  }}
                  onMouseOver={e => e.currentTarget.style.background = 'rgba(0,0,0,0.015)'}
                  onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '14px 18px', font: `500 13px ${s.FONT}`, color: s.text }}>{m.patientName}</td>
                    <td style={{ padding: '14px 18px' }}>
                      <span style={{
                        padding: '4px 14px', borderRadius: 100,
                        font: `600 11px ${s.FONT}`, background: `${tc}14`, color: tc,
                        border: `1px solid ${tc}22`,
                      }}>{m.tier}</span>
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      <span style={{
                        padding: '4px 12px', borderRadius: 100, font: `500 11px ${s.FONT}`, textTransform: 'capitalize',
                        background: m.status === 'active' ? '#F0FDF4' : '#FEF2F2',
                        color: m.status === 'active' ? s.success : s.danger,
                      }}>{m.status}</span>
                    </td>
                    <td style={{ padding: '14px 18px', color: s.text2, font: `400 12px ${s.FONT}` }}>
                      {new Date(m.nextBilling + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </td>
                    <td style={{ padding: '14px 18px', font: `500 13px ${s.FONT}`, color: m.credits > 0 ? s.success : s.text3 }}>
                      {m.credits > 0 ? `$${m.credits}` : '\u2014'}
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {m.wallet?.map(w => (
                          <span key={w.service} style={{
                            padding: '3px 10px', borderRadius: 100,
                            font: `400 10px ${s.MONO}`,
                            background: w.remaining === 0 ? 'rgba(0,0,0,0.04)' : `${tc}0A`,
                            color: w.remaining === 0 ? s.text3 : tc,
                          }}>
                            {w.service}: {w.remaining}/{w.total}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      {m.wallet?.some(w => w.remaining > 0) && (
                        <button onClick={() => setSelectedMember(selectedMember === m.id ? null : m.id)} style={{
                          padding: '6px 14px', borderRadius: 8, cursor: 'pointer',
                          font: `500 11px ${s.FONT}`,
                          background: `${s.accent}0A`, color: s.accent,
                          border: `1.5px solid ${s.accent}30`,
                          transition: 'all 0.2s',
                        }}>Deduct</button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredMemberships.length === 0 && (
            <div style={{ padding: 56, textAlign: 'center', font: `400 15px ${s.FONT}`, color: s.text3 }}>
              No memberships match this filter
            </div>
          )}
        </div>
      )}

      {/* ===== PACKAGES TAB — CARDS VIEW ===== */}
      {tab === 'packages' && view === 'cards' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 18 }}>
          {filteredPackages.map((p, idx) => {
            const remaining = p.totalSessions - p.usedSessions;
            const pct = (p.usedSessions / p.totalSessions) * 100;
            const daysLeft = Math.ceil((new Date(p.expiresDate) - new Date()) / (1000 * 60 * 60 * 24));
            const isHovered = hoveredCard === p.id;
            const isUrgent = daysLeft <= 14 && daysLeft > 0 && p.status === 'active';
            return (
              <div
                key={p.id}
                onMouseEnter={() => setHoveredCard(p.id)}
                onMouseLeave={() => setHoveredCard(null)}
                style={{
                  ...glassCard, overflow: 'hidden', position: 'relative',
                  transform: isHovered ? 'translateY(-3px)' : 'translateY(0)',
                  boxShadow: isHovered
                    ? `0 8px 32px ${s.accent}14, 0 2px 4px rgba(0,0,0,0.03)`
                    : glassCard.boxShadow,
                  ...stagger(idx),
                }}
              >
                {/* Top accent */}
                <div style={{
                  height: 4, width: '100%',
                  background: p.status === 'completed'
                    ? 'linear-gradient(90deg, #CBD5E1, #94A3B8)'
                    : `linear-gradient(90deg, ${s.accent}, ${s.accent}AA)`,
                }} />

                {/* Urgent glow */}
                {isUrgent && (
                  <div style={{
                    position: 'absolute', top: 4, right: 0, width: 70, height: 70,
                    background: `radial-gradient(circle, ${s.danger}12 0%, transparent 70%)`,
                    pointerEvents: 'none',
                  }} />
                )}

                <div style={{ padding: '22px 24px 20px' }}>
                  {/* Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                    <div>
                      <div style={{ font: `600 16px ${s.FONT}`, color: s.text, marginBottom: 4, letterSpacing: '-0.01em' }}>
                        {p.name}
                      </div>
                      <div style={{ font: `400 13px ${s.FONT}`, color: s.text2 }}>{p.patientName}</div>
                    </div>
                    <span style={{
                      padding: '4px 14px', borderRadius: 100,
                      font: `600 11px ${s.FONT}`, textTransform: 'capitalize',
                      background: p.status === 'active' ? '#F0FDF4' : 'rgba(0,0,0,0.04)',
                      color: p.status === 'active' ? s.success : s.text3,
                      border: p.status === 'active' ? '1px solid #BBF7D0' : '1px solid rgba(0,0,0,0.06)',
                    }}>{p.status}</span>
                  </div>

                  {/* Session progress */}
                  <div style={{
                    font: `500 9px ${s.MONO}`, textTransform: 'uppercase', letterSpacing: 1.5,
                    color: s.text3, marginBottom: 10,
                  }}>Session Progress</div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
                    <span style={{ font: `400 13px ${s.FONT}`, color: s.text2 }}>
                      {p.usedSessions} of {p.totalSessions} sessions
                    </span>
                    <span style={{ font: `700 20px ${s.FONT}`, color: s.text, letterSpacing: '-0.02em' }}>
                      {Math.round(pct)}%
                    </span>
                  </div>

                  <ProgressBar
                    value={p.usedSessions} total={p.totalSessions}
                    color={p.status === 'completed' ? s.text3 : s.accent}
                    height={8}
                  />

                  {/* Session dots */}
                  <div style={{ display: 'flex', gap: 6, marginTop: 12, marginBottom: 16 }}>
                    {Array.from({ length: p.totalSessions }).map((_, i) => (
                      <div key={i} style={{
                        flex: 1, height: 6, borderRadius: 3,
                        background: i < p.usedSessions
                          ? (p.status === 'completed' ? s.text3 : s.accent)
                          : 'rgba(0,0,0,0.06)',
                        transition: 'background 0.3s',
                      }} />
                    ))}
                  </div>

                  {/* Footer */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{
                      font: `500 12px ${s.FONT}`,
                      color: isUrgent ? s.danger : p.status === 'completed' ? s.text3 : s.text2,
                      display: 'flex', alignItems: 'center', gap: 6,
                    }}>
                      {isUrgent && <AlertDot color={s.danger} />}
                      {p.status === 'completed' ? 'Completed' : daysLeft > 0 ? `${daysLeft} days remaining` : 'Expired'}
                    </div>
                    {p.status === 'active' && remaining > 0 && (
                      <button
                        onClick={() => usePackageSession(p.id)}
                        style={{
                          padding: '8px 18px', borderRadius: 10, border: 'none', cursor: 'pointer',
                          font: `600 12px ${s.FONT}`,
                          background: s.accent, color: s.accentText,
                          boxShadow: `0 2px 12px ${s.accent}33`,
                          transition: 'all 0.25s cubic-bezier(0.16,1,0.3,1)',
                        }}
                        onMouseOver={e => { e.currentTarget.style.transform = 'scale(1.04)'; e.currentTarget.style.boxShadow = `0 4px 20px ${s.accent}44`; }}
                        onMouseOut={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = `0 2px 12px ${s.accent}33`; }}
                      >
                        Use Session
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          {filteredPackages.length === 0 && (
            <div style={{
              ...glassCard, padding: 56, textAlign: 'center', gridColumn: '1 / -1',
              font: `400 15px ${s.FONT}`, color: s.text3,
            }}>
              No packages match this filter
            </div>
          )}
        </div>
      )}

      {/* ===== PACKAGES TAB — TABLE VIEW ===== */}
      {tab === 'packages' && view === 'table' && (
        <div style={{ ...glassCard, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', font: `400 13px ${s.FONT}` }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                {['Patient', 'Package', 'Service', 'Progress', 'Expires', 'Status', ''].map(h => (
                  <th key={h} style={{
                    padding: '14px 18px', textAlign: 'left',
                    font: `500 9px ${s.MONO}`, textTransform: 'uppercase', letterSpacing: 1.5,
                    color: s.text3, background: 'rgba(0,0,0,0.015)',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredPackages.map(p => {
                const remaining = p.totalSessions - p.usedSessions;
                const daysLeft = Math.ceil((new Date(p.expiresDate) - new Date()) / (1000 * 60 * 60 * 24));
                return (
                  <tr key={p.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.04)', transition: 'background 0.2s' }}
                    onMouseOver={e => e.currentTarget.style.background = 'rgba(0,0,0,0.015)'}
                    onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '14px 18px', font: `500 13px ${s.FONT}`, color: s.text }}>{p.patientName}</td>
                    <td style={{ padding: '14px 18px', color: s.text2 }}>{p.name}</td>
                    <td style={{ padding: '14px 18px', color: s.text2 }}>{p.service}</td>
                    <td style={{ padding: '14px 18px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ flex: 1, maxWidth: 80 }}>
                          <ProgressBar value={p.usedSessions} total={p.totalSessions} color={s.accent} height={5} />
                        </div>
                        <span style={{ font: `500 12px ${s.MONO}`, color: s.text }}>{p.usedSessions}/{p.totalSessions}</span>
                      </div>
                    </td>
                    <td style={{
                      padding: '14px 18px', font: `400 12px ${s.FONT}`,
                      color: daysLeft <= 14 && daysLeft > 0 ? s.danger : s.text2,
                    }}>
                      {new Date(p.expiresDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      <span style={{
                        padding: '4px 12px', borderRadius: 100, font: `500 11px ${s.FONT}`, textTransform: 'capitalize',
                        background: p.status === 'active' ? '#F0FDF4' : 'rgba(0,0,0,0.04)',
                        color: p.status === 'active' ? s.success : s.text3,
                      }}>{p.status}</span>
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      {p.status === 'active' && remaining > 0 && (
                        <button onClick={() => usePackageSession(p.id)} style={{
                          padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
                          font: `500 11px ${s.FONT}`,
                          background: s.accent, color: s.accentText,
                          boxShadow: `0 2px 8px ${s.accent}22`,
                          transition: 'all 0.2s',
                        }}>Use Session</button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredPackages.length === 0 && (
            <div style={{ padding: 56, textAlign: 'center', font: `400 15px ${s.FONT}`, color: s.text3 }}>
              No packages match this filter
            </div>
          )}
        </div>
      )}

      {/* ===== DEDUCT MODAL (table view) ===== */}
      {selectedMember && view === 'table' && (() => {
        const m = memberships.find(x => x.id === selectedMember);
        if (!m) return null;
        const tc = tierColor(m.tier);
        return (
          <div
            style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)',
              backdropFilter: 'blur(4px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999,
            }}
            onClick={() => setSelectedMember(null)}
          >
            <div
              onClick={e => e.stopPropagation()}
              style={{
                ...glassCard, padding: 32, width: 420,
                background: 'rgba(255,255,255,0.92)',
                boxShadow: '0 20px 60px rgba(0,0,0,0.15), 0 4px 8px rgba(0,0,0,0.06)',
                animation: 'memFadeUp 0.3s ease-out',
              }}
            >
              {/* Modal header gradient */}
              <div style={{
                height: 4, borderRadius: '20px 20px 0 0',
                background: tierGradients[m.tier],
                margin: '-32px -32px 24px -32px',
                borderRadius: '20px 20px 0 0',
              }} />

              <div style={{ font: `700 20px ${s.FONT}`, color: s.text, marginBottom: 4, letterSpacing: '-0.02em' }}>
                Deduct Units
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                <span style={{ font: `400 14px ${s.FONT}`, color: s.text2 }}>{m.patientName}</span>
                <span style={{
                  padding: '3px 10px', borderRadius: 100,
                  font: `600 10px ${s.FONT}`, background: `${tc}14`, color: tc,
                }}>{m.tier}</span>
              </div>

              <div style={{ display: 'grid', gap: 10 }}>
                {m.wallet?.map(w => {
                  const pct = w.total > 0 ? (w.remaining / w.total) * 100 : 0;
                  const barColor = pct <= 25 ? s.danger : pct <= 50 ? s.warning : s.success;
                  return (
                    <div key={w.service} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '12px 16px', borderRadius: 12,
                      background: 'rgba(0,0,0,0.02)', border: '1px solid rgba(0,0,0,0.05)',
                    }}>
                      <div style={{ flex: 1, marginRight: 16 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                          <span style={{ font: `400 13px ${s.FONT}`, color: s.text }}>{w.service}</span>
                          <span style={{ font: `500 12px ${s.MONO}`, color: s.text2 }}>{w.remaining}/{w.total}</span>
                        </div>
                        <ProgressBar value={w.remaining} total={w.total} color={barColor} height={4} />
                      </div>
                      {w.remaining > 0 && (
                        <button
                          onClick={() => deductUnit(m.id, w.service)}
                          style={{
                            width: 36, height: 36, borderRadius: 10, border: 'none', cursor: 'pointer',
                            font: `700 16px ${s.FONT}`, background: `${s.accent}10`, color: s.accent,
                            transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}
                          onMouseOver={e => { e.currentTarget.style.background = s.accent; e.currentTarget.style.color = '#FFF'; }}
                          onMouseOut={e => { e.currentTarget.style.background = `${s.accent}10`; e.currentTarget.style.color = s.accent; }}
                        >
                          -1
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              <button
                onClick={() => setSelectedMember(null)}
                style={{
                  marginTop: 20, width: '100%', padding: '12px 20px', borderRadius: 12,
                  border: '1px solid rgba(0,0,0,0.08)', cursor: 'pointer',
                  font: `500 13px ${s.FONT}`, color: s.text2,
                  background: 'rgba(0,0,0,0.02)',
                  transition: 'all 0.2s',
                }}
              >Close</button>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
