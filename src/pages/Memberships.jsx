import { useState, useEffect } from 'react';
import { useStyles, getAvatarGradient } from '../theme';
import { subscribe } from '../data/store';

/* ─── Storage keys ─────────────────────────────────────────── */
const MEM_KEY    = 'rp_memberships';
const SEED_KEY   = 'rp_memberships_seeded_v2';

function getMembers()     { try { return JSON.parse(localStorage.getItem(MEM_KEY)) || []; } catch { return []; } }
function saveMembers(d)   { localStorage.setItem(MEM_KEY, JSON.stringify(d)); }

/* ─── Membership tier definitions ─────────────────────────── */
const PLANS = {
  'Drop-In': {
    price: 35, unit: 'class', billing: 'per class', color: '#8B8FA8',
    gradient: 'linear-gradient(135deg, #8B8FA8, #B0B4C8)',
    features: ['No commitment required', 'Any class format', 'Book up to 24hr in advance', 'Bring a friend discount'],
    tag: 'Flexible',
  },
  'Starter 5-Pack': {
    price: 150, unit: 'pack', billing: '$30/class · expires 60 days', color: '#6B8F71',
    gradient: 'linear-gradient(135deg, #6B8F71, #8FBF96)',
    features: ['5 group classes', '$30 per class (save 14%)', 'Expires in 60 days', 'All class formats'],
    tag: 'Best to try',
    perClass: 30,
  },
  'Core 10-Pack': {
    price: 280, unit: 'pack', billing: '$28/class · expires 90 days', color: '#C4704B',
    gradient: 'linear-gradient(135deg, #C4704B, #E0936A)',
    features: ['10 group classes', '$28 per class (save 20%)', 'Expires in 90 days', 'All class formats + workshops'],
    tag: 'Most popular',
    perClass: 28,
    popular: true,
  },
  'Unlimited Monthly': {
    price: 199, unit: 'month', billing: 'auto-renew monthly', color: '#5B7B8F',
    gradient: 'linear-gradient(135deg, #5B7B8F, #7BA3B8)',
    features: ['Unlimited group classes', 'Priority booking access', 'Member events + workshops', 'Cancel anytime'],
    tag: 'Great value',
  },
  'Unlimited Annual': {
    price: 179, unit: 'month', billing: 'billed annually $2,148', color: '#8B6B94',
    gradient: 'linear-gradient(135deg, #8B6B94, #B08FBA)',
    features: ['Unlimited group classes', '2 free private sessions/month', 'All workshops included', 'Best annual savings'],
    tag: 'Best deal',
    badge: '2 privates/mo',
  },
  'Private 4-Pack': {
    price: 380, unit: 'pack', billing: '$95/session · expires 60 days', color: '#A68B6B',
    gradient: 'linear-gradient(135deg, #A68B6B, #C8AD8F)',
    features: ['4 private 1:1 sessions', '$95 per session', 'Dedicated instructor', 'Custom programming'],
    tag: 'Personalized',
    perClass: 95,
  },
};

/* ─── Seed 10 members ─────────────────────────────────────── */
function seedMembers() {
  if (localStorage.getItem(SEED_KEY)) return;

  const today = new Date('2026-03-18');
  const d = (offset) => {
    const dt = new Date(today);
    dt.setDate(dt.getDate() + offset);
    return dt.toISOString().slice(0, 10);
  };

  const fmtDate = (iso) => iso; // stored as ISO, formatted in render

  const members = [
    {
      id: 'M-001', name: 'Camille Rousseau', email: 'camille@email.com',
      plan: 'Unlimited Annual', status: 'active',
      startDate: d(-245), renewDate: d(120),
      classesUsed: 48, classesTotal: null,
      paymentHistory: [
        { date: d(-245), desc: 'Annual plan — Year 1', amount: 2148 },
      ],
      attendance: [
        { date: d(-3), cls: 'Reformer Flow', instructor: 'Maya' },
        { date: d(-5), cls: 'Mat Pilates', instructor: 'Sofia' },
        { date: d(-10), cls: 'Private: Fundamentals', instructor: 'Maya' },
        { date: d(-12), cls: 'Barre Fusion', instructor: 'Lena' },
      ],
      notes: 'Competing in a triathlon — focus on core stability.',
      addOns: [{ name: 'Workshop credit', qty: 1 }],
    },
    {
      id: 'M-002', name: 'Jordan Wexler', email: 'jordan@email.com',
      plan: 'Unlimited Monthly', status: 'active',
      startDate: d(-62), renewDate: d(0),
      classesUsed: 18, classesTotal: null,
      paymentHistory: [
        { date: d(-62), desc: 'Monthly plan', amount: 199 },
        { date: d(-32), desc: 'Monthly plan', amount: 199 },
      ],
      attendance: [
        { date: d(-1), cls: 'Tower Reformer', instructor: 'Maya' },
        { date: d(-4), cls: 'Mat Pilates', instructor: 'Sofia' },
        { date: d(-8), cls: 'Reformer Flow', instructor: 'Lena' },
      ],
      notes: '',
      addOns: [],
    },
    {
      id: 'M-003', name: 'Priya Nair', email: 'priya@email.com',
      plan: 'Core 10-Pack', status: 'active',
      startDate: d(-38), renewDate: d(52),
      classesUsed: 7, classesTotal: 10,
      paymentHistory: [
        { date: d(-38), desc: 'Core 10-Pack purchase', amount: 280 },
      ],
      attendance: [
        { date: d(-2), cls: 'Reformer Flow', instructor: 'Maya' },
        { date: d(-6), cls: 'Mat Pilates', instructor: 'Sofia' },
        { date: d(-9), cls: 'Barre Fusion', instructor: 'Lena' },
      ],
      notes: 'Lower back rehab — avoid deep flexion.',
      addOns: [],
    },
    {
      id: 'M-004', name: 'Marcus Bell', email: 'marcus@email.com',
      plan: 'Starter 5-Pack', status: 'active',
      startDate: d(-14), renewDate: d(46),
      classesUsed: 2, classesTotal: 5,
      paymentHistory: [
        { date: d(-14), desc: 'Starter 5-Pack purchase', amount: 150 },
      ],
      attendance: [
        { date: d(-7), cls: 'Mat Pilates (Intro)', instructor: 'Sofia' },
        { date: d(-14), cls: 'Orientation Class', instructor: 'Lena' },
      ],
      notes: 'New to Pilates — beginner level.',
      addOns: [],
    },
    {
      id: 'M-005', name: 'Simone Baxter', email: 'simone@email.com',
      plan: 'Unlimited Annual', status: 'active',
      startDate: d(-180), renewDate: d(185),
      classesUsed: 92, classesTotal: null,
      paymentHistory: [
        { date: d(-180), desc: 'Annual plan — Year 1', amount: 2148 },
      ],
      attendance: [
        { date: d(-1), cls: 'Private: Advanced', instructor: 'Maya' },
        { date: d(-3), cls: 'Reformer Flow', instructor: 'Maya' },
        { date: d(-5), cls: 'Cardio Reformer', instructor: 'Lena' },
        { date: d(-8), cls: 'Private: Advanced', instructor: 'Maya' },
      ],
      notes: 'Advanced practitioner. Trains 4–5x/week.',
      addOns: [{ name: 'Extra private session', qty: 2 }],
    },
    {
      id: 'M-006', name: 'Declan Farrow', email: 'declan@email.com',
      plan: 'Private 4-Pack', status: 'active',
      startDate: d(-20), renewDate: d(40),
      classesUsed: 1, classesTotal: 4,
      paymentHistory: [
        { date: d(-20), desc: 'Private 4-Pack purchase', amount: 380 },
      ],
      attendance: [
        { date: d(-20), cls: 'Private: Assessment', instructor: 'Maya' },
      ],
      notes: 'Post-surgery recovery — hip replacement.',
      addOns: [],
    },
    {
      id: 'M-007', name: 'Aaliya Hassan', email: 'aaliya@email.com',
      plan: 'Unlimited Monthly', status: 'paused',
      startDate: d(-95), renewDate: d(-10),
      classesUsed: 22, classesTotal: null,
      paymentHistory: [
        { date: d(-95), desc: 'Monthly plan', amount: 199 },
        { date: d(-65), desc: 'Monthly plan', amount: 199 },
        { date: d(-35), desc: 'Monthly plan', amount: 199 },
      ],
      attendance: [
        { date: d(-18), cls: 'Barre Fusion', instructor: 'Lena' },
        { date: d(-22), cls: 'Reformer Flow', instructor: 'Maya' },
      ],
      notes: 'Paused — traveling for work until April.',
      addOns: [],
    },
    {
      id: 'M-008', name: 'Tessa Moreno', email: 'tessa@email.com',
      plan: 'Core 10-Pack', status: 'expired',
      startDate: d(-100), renewDate: d(-10),
      classesUsed: 10, classesTotal: 10,
      paymentHistory: [
        { date: d(-100), desc: 'Core 10-Pack purchase', amount: 280 },
      ],
      attendance: [
        { date: d(-12), cls: 'Mat Pilates', instructor: 'Sofia' },
        { date: d(-15), cls: 'Reformer Flow', instructor: 'Maya' },
      ],
      notes: 'Interested in upgrading to Unlimited.',
      addOns: [],
    },
    {
      id: 'M-009', name: 'Oliver Chen', email: 'oliver@email.com',
      plan: 'Starter 5-Pack', status: 'active',
      startDate: d(-5), renewDate: d(55),
      classesUsed: 0, classesTotal: 5,
      paymentHistory: [
        { date: d(-5), desc: 'Starter 5-Pack purchase', amount: 150 },
      ],
      attendance: [],
      notes: 'Referred by Priya Nair.',
      addOns: [],
    },
    {
      id: 'M-010', name: 'Ingrid Solvang', email: 'ingrid@email.com',
      plan: 'Drop-In', status: 'active',
      startDate: d(-90), renewDate: null,
      classesUsed: 11, classesTotal: null,
      paymentHistory: [
        { date: d(-3), desc: 'Drop-In class', amount: 35 },
        { date: d(-12), desc: 'Drop-In class', amount: 35 },
        { date: d(-20), desc: 'Drop-In class', amount: 35 },
      ],
      attendance: [
        { date: d(-3), cls: 'Barre Fusion', instructor: 'Lena' },
        { date: d(-12), cls: 'Mat Pilates', instructor: 'Sofia' },
        { date: d(-20), cls: 'Reformer Flow', instructor: 'Maya' },
      ],
      notes: 'Prefers evening classes.',
      addOns: [],
    },
  ];

  saveMembers(members);
  localStorage.setItem(SEED_KEY, 'true');
}

/* ─── Animation injection (once) ───────────────────────────── */
const STYLE_ID = 'mem-v2-styles';
if (typeof document !== 'undefined' && !document.getElementById(STYLE_ID)) {
  const el = document.createElement('style');
  el.id = STYLE_ID;
  el.textContent = `
    @keyframes memFadeUp {
      from { opacity: 0; transform: translateY(16px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes memPulse {
      0%, 100% { opacity: 1; }
      50%       { opacity: 0.45; }
    }
    @keyframes memShimmer {
      0%   { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }
    @media (max-width: 768px) {
      .mem-plan-grid   { grid-template-columns: 1fr !important; }
      .mem-kpi-grid    { grid-template-columns: 1fr 1fr !important; }
      .mem-table-wrap  { overflow-x: auto; }
      .mem-table-wrap table { min-width: 680px; }
      .mem-modal-inner { width: calc(100vw - 32px) !important; max-height: 90vh; overflow-y: auto; }
    }
    @media (max-width: 480px) {
      .mem-kpi-grid { grid-template-columns: 1fr !important; }
    }
  `;
  document.head.appendChild(el);
}

/* ─── Helpers ─────────────────────────────────────────────── */
function StatusBadge({ status }) {
  const cfg = {
    active:  { bg: '#F0FDF4', color: '#16A34A', border: '#BBF7D0', label: 'Active' },
    paused:  { bg: '#FFFBEB', color: '#D97706', border: '#FDE68A', label: 'Paused' },
    expired: { bg: '#FEF2F2', color: '#DC2626', border: '#FECACA', label: 'Expired' },
  }[status] || { bg: '#F4F4F5', color: '#888', border: '#E4E4E7', label: status };

  return (
    <span style={{
      padding: '4px 12px', borderRadius: 100,
      font: "600 11px 'Outfit', sans-serif", letterSpacing: '0.01em',
      background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
      whiteSpace: 'nowrap',
    }}>
      {cfg.label}
    </span>
  );
}

function ProgressBar({ value, total, color, height = 6 }) {
  const pct = total > 0 ? Math.min((value / total) * 100, 100) : 0;
  return (
    <div style={{ height, borderRadius: height, background: 'rgba(0,0,0,0.07)', overflow: 'hidden' }}>
      <div style={{
        width: `${pct}%`, height: '100%', borderRadius: height,
        background: `linear-gradient(90deg, ${color}, ${color}CC)`,
        transition: 'width 0.6s cubic-bezier(0.16,1,0.3,1)',
      }} />
    </div>
  );
}

function PlanBadge({ plan }) {
  const p = PLANS[plan];
  if (!p) return <span style={{ color: '#999', fontSize: 12 }}>{plan}</span>;
  return (
    <span style={{
      padding: '4px 12px', borderRadius: 100,
      font: "600 11px 'Outfit', sans-serif",
      background: `${p.color}14`, color: p.color, border: `1px solid ${p.color}28`,
      whiteSpace: 'nowrap',
    }}>
      {plan}
    </span>
  );
}

function Avatar({ name, size = 36 }) {
  const initials = name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: getAvatarGradient(name),
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      font: `600 ${Math.round(size * 0.36)}px 'Outfit', sans-serif`,
      color: '#fff', flexShrink: 0, letterSpacing: '-0.01em',
    }}>
      {initials}
    </div>
  );
}

function CheckIcon({ color }) {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
      <circle cx="7.5" cy="7.5" r="7.5" fill={color} opacity="0.12" />
      <path d="M4.5 7.8L6.5 9.8L10.5 5.8" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function fmtDate(iso, opts = { month: 'short', day: 'numeric' }) {
  if (!iso) return '—';
  return new Date(iso + 'T12:00:00').toLocaleDateString('en-US', opts);
}

function fmtMoney(cents) {
  return '$' + (cents / 1).toLocaleString('en-US', { minimumFractionDigits: 0 });
}

/* ─── Member Detail Modal ─────────────────────────────────── */
function MemberModal({ member, s, onClose, onAction }) {
  const [activeTab, setActiveTab] = useState('overview');
  if (!member) return null;
  const plan = PLANS[member.plan] || {};

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(10,10,20,0.45)',
        backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, padding: 16,
      }}
      onClick={onClose}
    >
      <div
        className="mem-modal-inner"
        onClick={e => e.stopPropagation()}
        style={{
          width: 540, background: 'rgba(255,255,255,0.97)',
          backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
          borderRadius: 24, overflow: 'hidden',
          boxShadow: '0 24px 80px rgba(0,0,0,0.16), 0 4px 8px rgba(0,0,0,0.06)',
          animation: 'memFadeUp 0.3s cubic-bezier(0.16,1,0.3,1)',
        }}
      >
        {/* Gradient header band */}
        <div style={{ height: 5, background: plan.gradient || `linear-gradient(90deg, ${s.accent}, ${s.accent}AA)` }} />

        {/* Modal head */}
        <div style={{ padding: '24px 28px 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <Avatar name={member.name} size={48} />
              <div>
                <div style={{ font: `700 18px ${s.FONT}`, color: s.text, letterSpacing: '-0.02em' }}>
                  {member.name}
                </div>
                <div style={{ font: `400 13px ${s.FONT}`, color: s.text3, marginTop: 2 }}>
                  {member.email}
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              style={{
                width: 32, height: 32, borderRadius: 10, border: 'none', cursor: 'pointer',
                background: 'rgba(0,0,0,0.05)', color: s.text2,
                font: `500 18px ${s.FONT}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background 0.2s',
              }}
              onMouseOver={e => e.currentTarget.style.background = 'rgba(0,0,0,0.09)'}
              onMouseOut={e => e.currentTarget.style.background = 'rgba(0,0,0,0.05)'}
            >×</button>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
            <PlanBadge plan={member.plan} />
            <StatusBadge status={member.status} />
            {member.addOns?.map((a, i) => (
              <span key={i} style={{
                padding: '4px 12px', borderRadius: 100,
                font: `500 11px ${s.FONT}`, background: `${s.accent}10`, color: s.accent,
                border: `1px solid ${s.accent}28`,
              }}>+{a.name}{a.qty > 1 ? ` ×${a.qty}` : ''}</span>
            ))}
          </div>

          {/* Tabs */}
          <div style={{
            display: 'flex', gap: 0, borderBottom: '1px solid rgba(0,0,0,0.07)',
            marginBottom: 20,
          }}>
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'attendance', label: `Attendance (${member.attendance?.length || 0})` },
              { id: 'payments', label: 'Payments' },
            ].map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
                padding: '10px 16px', border: 'none', cursor: 'pointer', background: 'transparent',
                font: `${activeTab === t.id ? '600' : '400'} 13px ${s.FONT}`,
                color: activeTab === t.id ? s.accent : s.text3,
                borderBottom: `2px solid ${activeTab === t.id ? s.accent : 'transparent'}`,
                marginBottom: -1, transition: 'all 0.2s',
              }}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab content */}
        <div style={{ padding: '0 28px 28px', maxHeight: 340, overflowY: 'auto' }}>

          {/* Overview tab */}
          {activeTab === 'overview' && (
            <div style={{ display: 'grid', gap: 14 }}>
              {/* Stats row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                {[
                  { label: 'Start Date', value: fmtDate(member.startDate, { month: 'short', day: 'numeric', year: 'numeric' }) },
                  { label: member.renewDate ? 'Renews' : 'Last Visit', value: member.renewDate ? fmtDate(member.renewDate) : fmtDate(member.attendance?.[0]?.date) },
                  { label: 'Classes Used', value: member.classesTotal ? `${member.classesUsed}/${member.classesTotal}` : member.classesUsed },
                ].map(item => (
                  <div key={item.label} style={{
                    padding: '12px 14px', borderRadius: 12,
                    background: 'rgba(0,0,0,0.025)', border: '1px solid rgba(0,0,0,0.05)',
                  }}>
                    <div style={{ font: `500 9px ${s.MONO}`, textTransform: 'uppercase', letterSpacing: 1.5, color: s.text3, marginBottom: 6 }}>{item.label}</div>
                    <div style={{ font: `600 15px ${s.FONT}`, color: s.text }}>{item.value}</div>
                  </div>
                ))}
              </div>

              {/* Class progress (pack plans) */}
              {member.classesTotal && (
                <div style={{ padding: '14px 16px', borderRadius: 12, background: `${plan.color}08`, border: `1px solid ${plan.color}20` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ font: `500 13px ${s.FONT}`, color: s.text2 }}>Classes remaining</span>
                    <span style={{ font: `700 14px ${s.FONT}`, color: plan.color }}>
                      {member.classesTotal - member.classesUsed} left
                    </span>
                  </div>
                  <ProgressBar value={member.classesUsed} total={member.classesTotal} color={plan.color} height={8} />
                  <div style={{ font: `400 11px ${s.FONT}`, color: s.text3, marginTop: 6 }}>
                    {member.classesUsed} of {member.classesTotal} used · Expires {fmtDate(member.renewDate)}
                  </div>
                </div>
              )}

              {/* Notes */}
              {member.notes && (
                <div style={{ padding: '12px 16px', borderRadius: 12, background: 'rgba(0,0,0,0.02)', border: '1px solid rgba(0,0,0,0.06)' }}>
                  <div style={{ font: `500 9px ${s.MONO}`, textTransform: 'uppercase', letterSpacing: 1.5, color: s.text3, marginBottom: 6 }}>Instructor Notes</div>
                  <div style={{ font: `400 13px ${s.FONT}`, color: s.text2, lineHeight: 1.55 }}>{member.notes}</div>
                </div>
              )}

              {/* Actions */}
              <div>
                <div style={{ font: `500 9px ${s.MONO}`, textTransform: 'uppercase', letterSpacing: 1.5, color: s.text3, marginBottom: 10 }}>Actions</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {member.status === 'active' && (
                    <button
                      onClick={() => onAction(member.id, 'pause')}
                      style={{
                        padding: '8px 16px', borderRadius: 10, border: '1.5px solid rgba(217,119,6,0.3)',
                        cursor: 'pointer', font: `500 12px ${s.FONT}`,
                        background: '#FFFBEB', color: '#D97706', transition: 'all 0.2s',
                      }}
                    >
                      Pause Membership
                    </button>
                  )}
                  {member.status === 'paused' && (
                    <button
                      onClick={() => onAction(member.id, 'resume')}
                      style={{
                        padding: '8px 16px', borderRadius: 10, border: 'none',
                        cursor: 'pointer', font: `500 12px ${s.FONT}`,
                        background: s.accent, color: s.accentText,
                        boxShadow: `0 2px 12px ${s.accent}33`, transition: 'all 0.2s',
                      }}
                    >
                      Resume Membership
                    </button>
                  )}
                  <button
                    onClick={() => onAction(member.id, 'upgrade')}
                    style={{
                      padding: '8px 16px', borderRadius: 10, border: `1.5px solid ${s.accent}40`,
                      cursor: 'pointer', font: `500 12px ${s.FONT}`,
                      background: `${s.accent}08`, color: s.accent, transition: 'all 0.2s',
                    }}
                  >
                    Change Plan
                  </button>
                  <button
                    onClick={() => onAction(member.id, 'addon')}
                    style={{
                      padding: '8px 16px', borderRadius: 10, border: '1px solid rgba(0,0,0,0.08)',
                      cursor: 'pointer', font: `500 12px ${s.FONT}`,
                      background: 'rgba(0,0,0,0.02)', color: s.text2, transition: 'all 0.2s',
                    }}
                  >
                    + Add-on
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Attendance tab */}
          {activeTab === 'attendance' && (
            <div style={{ display: 'grid', gap: 8 }}>
              {member.attendance?.length === 0 && (
                <div style={{ padding: '32px 0', textAlign: 'center', font: `400 14px ${s.FONT}`, color: s.text3 }}>
                  No classes attended yet
                </div>
              )}
              {member.attendance?.map((a, i) => (
                <div key={i} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '10px 14px', borderRadius: 10,
                  background: 'rgba(0,0,0,0.02)', border: '1px solid rgba(0,0,0,0.05)',
                }}>
                  <div>
                    <div style={{ font: `500 13px ${s.FONT}`, color: s.text }}>{a.cls}</div>
                    <div style={{ font: `400 11px ${s.FONT}`, color: s.text3 }}>Instructor: {a.instructor}</div>
                  </div>
                  <div style={{ font: `400 12px ${s.FONT}`, color: s.text3 }}>
                    {fmtDate(a.date, { month: 'short', day: 'numeric' })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Payments tab */}
          {activeTab === 'payments' && (
            <div style={{ display: 'grid', gap: 8 }}>
              {member.paymentHistory?.map((p, i) => (
                <div key={i} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '10px 14px', borderRadius: 10,
                  background: 'rgba(0,0,0,0.02)', border: '1px solid rgba(0,0,0,0.05)',
                }}>
                  <div>
                    <div style={{ font: `500 13px ${s.FONT}`, color: s.text }}>{p.desc}</div>
                    <div style={{ font: `400 11px ${s.FONT}`, color: s.text3 }}>
                      {fmtDate(p.date, { month: 'long', day: 'numeric', year: 'numeric' })}
                    </div>
                  </div>
                  <div style={{ font: `700 15px ${s.FONT}`, color: s.success }}>
                    ${p.amount.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Main component ──────────────────────────────────────── */
export default function Memberships() {
  const s = useStyles();
  const [, setTick] = useState(0);

  useEffect(() => subscribe(() => setTick(t => t + 1)), []);
  useEffect(() => { seedMembers(); }, []);

  const [view, setView] = useState('table');
  const [search, setSearch] = useState('');
  const [filterPlan, setFilterPlan] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedId, setSelectedId] = useState(null);
  const [hoveredPlan, setHoveredPlan] = useState(null);
  const [showPlans, setShowPlans] = useState(false);
  const [toast, setToast] = useState(null);

  const members = getMembers();

  /* ── Derived state ── */
  const active   = members.filter(m => m.status === 'active');
  const mrr      = active.reduce((sum, m) => {
    const p = PLANS[m.plan];
    if (!p) return sum;
    if (m.plan === 'Unlimited Annual') return sum + 179;
    if (m.plan === 'Unlimited Monthly') return sum + 199;
    return sum; // packs/drop-in don't contribute to MRR
  }, 0);
  const retention = members.length > 0
    ? Math.round((active.length / members.length) * 100)
    : 0;
  const totalWeeklyClasses = active.reduce((sum, m) => sum + (m.classesTotal ? 0 : 3.5), 0);
  const avgClassesPerWeek  = active.length > 0 ? (totalWeeklyClasses / active.length).toFixed(1) : '0';

  /* ── Filter ── */
  const filtered = members.filter(m => {
    if (filterPlan !== 'all' && m.plan !== filterPlan) return false;
    if (filterStatus !== 'all' && m.status !== filterStatus) return false;
    if (search) {
      const q = search.toLowerCase();
      return m.name?.toLowerCase().includes(q) || m.plan?.toLowerCase().includes(q) || m.email?.toLowerCase().includes(q);
    }
    return true;
  });

  const selectedMember = members.find(m => m.id === selectedId) || null;

  /* ── Actions ── */
  const handleAction = (memberId, action) => {
    const all = getMembers().map(m => {
      if (m.id !== memberId) return m;
      if (action === 'pause')   return { ...m, status: 'paused' };
      if (action === 'resume')  return { ...m, status: 'active' };
      return m;
    });
    saveMembers(all);
    setTick(t => t + 1);

    const labels = { pause: 'Membership paused', resume: 'Membership resumed', upgrade: 'Plan change — feature coming soon', addon: 'Add-ons — feature coming soon' };
    setToast(labels[action] || 'Done');
    setTimeout(() => setToast(null), 3000);
  };

  /* ── Style helpers ── */
  const card = {
    background: 'rgba(255,255,255,0.72)',
    backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid rgba(255,255,255,0.65)',
    borderRadius: 18,
    boxShadow: '0 4px 24px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)',
    transition: 'all 0.3s cubic-bezier(0.16,1,0.3,1)',
  };

  const stagger = (i) => ({ animation: `memFadeUp 0.5s ${i * 0.07}s cubic-bezier(0.16,1,0.3,1) both` });

  const planNames = Object.keys(PLANS);
  const planColors = {
    active: '#16A34A', paused: '#D97706', expired: '#DC2626',
  };

  return (
    <div style={{ maxWidth: 1320, margin: '0 auto' }}>
      <style>{`
        .mem-row-hover:hover { background: rgba(0,0,0,0.018) !important; }
        .mem-row-hover td { cursor: pointer; }
        .mem-plan-card:hover { transform: translateY(-5px); }
      `}</style>

      {/* ─── Toast ─── */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
          background: '#111', color: '#fff', padding: '12px 24px', borderRadius: 12,
          font: `500 13px ${s.FONT}`, zIndex: 2000,
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
          animation: 'memFadeUp 0.3s ease-out',
        }}>
          {toast}
        </div>
      )}

      {/* ─── Header ─── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 36, ...stagger(0) }}>
        <div>
          <h1 style={{ font: `700 30px ${s.FONT}`, color: s.text, marginBottom: 6, letterSpacing: '-0.025em' }}>
            Memberships
          </h1>
          <p style={{ font: `400 14px ${s.FONT}`, color: s.text3 }}>
            {active.length} active clients across {planNames.length} plans
          </p>
        </div>
        <button
          onClick={() => setShowPlans(!showPlans)}
          style={{
            ...s.pillAccent,
            display: 'flex', alignItems: 'center', gap: 8,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 1V13M1 7H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          View Plans
        </button>
      </div>

      {/* ─── KPI Cards ─── */}
      <div className="mem-kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 28 }}>
        {[
          {
            label: 'Active Members', value: active.length, icon: '👥',
            sub: `${members.filter(m => m.status === 'paused').length} paused · ${members.filter(m => m.status === 'expired').length} expired`,
            color: s.accent,
          },
          {
            label: 'Monthly Revenue', value: `$${mrr.toLocaleString()}`, icon: '💳',
            sub: 'From recurring plans',
            color: '#16A34A',
          },
          {
            label: 'Retention Rate', value: `${retention}%`, icon: '📈',
            sub: 'Active vs all clients',
            color: retention >= 75 ? '#16A34A' : retention >= 50 ? '#D97706' : '#DC2626',
          },
          {
            label: 'Avg Classes/Week', value: avgClassesPerWeek, icon: '🏋️',
            sub: 'Per unlimited member',
            color: s.accent,
          },
        ].map((kpi, i) => (
          <div key={kpi.label} style={{ ...card, padding: '20px 22px', ...stagger(i + 1) }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div style={{ font: `500 10px ${s.MONO}`, textTransform: 'uppercase', letterSpacing: 1.5, color: s.text3 }}>
                {kpi.label}
              </div>
              <span style={{ fontSize: 16 }}>{kpi.icon}</span>
            </div>
            <div style={{ font: `700 26px ${s.FONT}`, color: s.text, letterSpacing: '-0.02em', marginBottom: 4 }}>
              {kpi.value}
            </div>
            <div style={{ font: `400 11px ${s.FONT}`, color: s.text3 }}>{kpi.sub}</div>
          </div>
        ))}
      </div>

      {/* ─── Plan Overview (collapsible) ─── */}
      {showPlans && (
        <div style={{ marginBottom: 32, ...stagger(0) }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <h2 style={{ font: `600 17px ${s.FONT}`, color: s.text }}>Membership Plans</h2>
            <button onClick={() => setShowPlans(false)} style={{ ...s.pillGhost, padding: '6px 14px', fontSize: 12 }}>
              Hide
            </button>
          </div>
          <div
            className="mem-plan-grid"
            style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}
          >
            {planNames.map((name, idx) => {
              const plan = PLANS[name];
              const count = members.filter(m => m.plan === name && m.status === 'active').length;
              const isHovered = hoveredPlan === name;
              return (
                <div
                  key={name}
                  className="mem-plan-card"
                  onMouseEnter={() => setHoveredPlan(name)}
                  onMouseLeave={() => setHoveredPlan(null)}
                  style={{
                    ...card,
                    overflow: 'hidden', position: 'relative',
                    boxShadow: isHovered
                      ? `0 12px 40px ${plan.color}22, 0 2px 4px rgba(0,0,0,0.03)`
                      : card.boxShadow,
                  }}
                >
                  {plan.popular && (
                    <div style={{
                      position: 'absolute', top: 16, right: 16,
                      padding: '3px 10px', borderRadius: 100,
                      font: `600 10px ${s.FONT}`, background: plan.color, color: '#fff',
                    }}>
                      Popular
                    </div>
                  )}
                  <div style={{ height: 4, background: plan.gradient, backgroundSize: '200% 100%' }} />
                  <div style={{ padding: '20px 22px 18px' }}>
                    <div style={{ font: `600 11px ${s.MONO}`, textTransform: 'uppercase', letterSpacing: 1.5, color: plan.color, marginBottom: 8 }}>
                      {plan.tag}
                    </div>
                    <div style={{ font: `700 16px ${s.FONT}`, color: s.text, marginBottom: 4, letterSpacing: '-0.01em' }}>
                      {name}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 4 }}>
                      <span style={{ font: `700 26px ${s.FONT}`, color: s.text, letterSpacing: '-0.02em' }}>
                        ${plan.price}
                      </span>
                      <span style={{ font: `400 12px ${s.FONT}`, color: s.text3 }}>/{plan.unit}</span>
                    </div>
                    <div style={{ font: `400 11px ${s.FONT}`, color: s.text3, marginBottom: 16 }}>
                      {plan.billing}
                    </div>
                    <div style={{ height: 1, background: 'rgba(0,0,0,0.06)', marginBottom: 14 }} />
                    <div style={{ display: 'grid', gap: 8 }}>
                      {plan.features.map((f, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                          <CheckIcon color={plan.color} />
                          <span style={{ font: `400 12px ${s.FONT}`, color: s.text2, lineHeight: 1.4 }}>{f}</span>
                        </div>
                      ))}
                    </div>
                    <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ font: `400 11px ${s.FONT}`, color: s.text3 }}>{count} active</span>
                      <button
                        onClick={() => { setFilterPlan(name); setShowPlans(false); }}
                        style={{
                          padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
                          font: `500 11px ${s.FONT}`,
                          background: `${plan.color}12`, color: plan.color,
                          transition: 'all 0.2s',
                        }}
                        onMouseOver={e => { e.currentTarget.style.background = plan.color; e.currentTarget.style.color = '#fff'; }}
                        onMouseOut={e => { e.currentTarget.style.background = `${plan.color}12`; e.currentTarget.style.color = plan.color; }}
                      >
                        View members
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── Filters + View toggle ─── */}
      <div style={{
        display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center',
        ...stagger(5),
      }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: '0 0 auto' }}>
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
            <circle cx="6.5" cy="6.5" r="5" stroke={s.text3} strokeWidth="1.5" />
            <path d="M10.5 10.5L13 13" stroke={s.text3} strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search clients..."
            style={{ ...s.input, maxWidth: 240, paddingLeft: 40, borderRadius: 12 }}
          />
        </div>

        {/* Plan filter */}
        <select
          value={filterPlan}
          onChange={e => setFilterPlan(e.target.value)}
          style={{
            ...s.input, width: 'auto', paddingRight: 32, cursor: 'pointer', borderRadius: 12,
            appearance: 'none', backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%23999' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center',
          }}
        >
          <option value="all">All Plans</option>
          {planNames.map(n => <option key={n} value={n}>{n}</option>)}
        </select>

        {/* Status filter */}
        <div style={{ display: 'flex', gap: 6 }}>
          {[['all', 'All'], ['active', 'Active'], ['paused', 'Paused'], ['expired', 'Expired']].map(([id, label]) => (
            <button key={id} onClick={() => setFilterStatus(id)} style={{
              padding: '9px 16px', borderRadius: 100, border: 'none', cursor: 'pointer',
              font: `500 12px ${s.FONT}`,
              background: filterStatus === id
                ? (planColors[id] || s.accent)
                : 'rgba(255,255,255,0.6)',
              color: filterStatus === id ? '#fff' : s.text2,
              boxShadow: filterStatus === id ? `0 2px 12px ${(planColors[id] || s.accent)}30` : 'none',
              backdropFilter: 'blur(8px)',
              transition: 'all 0.22s cubic-bezier(0.16,1,0.3,1)',
            }}>
              {label}
            </button>
          ))}
        </div>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* View toggle */}
        <div style={{
          display: 'inline-flex', padding: 3, borderRadius: 12,
          background: 'rgba(255,255,255,0.55)', border: '1px solid rgba(0,0,0,0.05)',
          backdropFilter: 'blur(8px)',
        }}>
          {[['table', 'Table'], ['cards', 'Cards']].map(([id, label]) => (
            <button key={id} onClick={() => setView(id)} style={{
              padding: '7px 14px', borderRadius: 9, border: 'none', cursor: 'pointer',
              font: `500 11px ${s.FONT}`,
              background: view === id ? 'rgba(255,255,255,0.8)' : 'transparent',
              color: view === id ? s.text : s.text3,
              boxShadow: view === id ? '0 1px 4px rgba(0,0,0,0.07)' : 'none',
              transition: 'all 0.2s',
            }}>{label}</button>
          ))}
        </div>

        {/* Result count */}
        <span style={{ font: `400 12px ${s.FONT}`, color: s.text3 }}>
          {filtered.length} result{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* ─── Active filter pills ─── */}
      {(filterPlan !== 'all' || filterStatus !== 'all') && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          {filterPlan !== 'all' && (
            <span style={{
              padding: '5px 14px', borderRadius: 100,
              font: `500 12px ${s.FONT}`, color: s.accent, background: `${s.accent}10`, border: `1px solid ${s.accent}28`,
              display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer',
            }} onClick={() => setFilterPlan('all')}>
              {filterPlan} ×
            </span>
          )}
          {filterStatus !== 'all' && (
            <span style={{
              padding: '5px 14px', borderRadius: 100,
              font: `500 12px ${s.FONT}`, color: planColors[filterStatus] || s.accent,
              background: `${planColors[filterStatus] || s.accent}10`,
              border: `1px solid ${planColors[filterStatus] || s.accent}28`,
              display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer',
            }} onClick={() => setFilterStatus('all')}>
              {filterStatus} ×
            </span>
          )}
        </div>
      )}

      {/* ─── TABLE VIEW ─── */}
      {view === 'table' && (
        <div className="mem-table-wrap" style={{ ...card, overflow: 'hidden', ...stagger(6) }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', font: `400 13px ${s.FONT}` }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
                {['Client', 'Plan', 'Status', 'Started', 'Renews / Expires', 'Classes', 'Weekly Rate', ''].map(h => (
                  <th key={h} style={{
                    padding: '13px 16px', textAlign: 'left',
                    font: `500 9px ${s.MONO}`, textTransform: 'uppercase', letterSpacing: 1.5,
                    color: s.text3, background: 'rgba(0,0,0,0.015)', whiteSpace: 'nowrap',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((m, idx) => {
                const plan = PLANS[m.plan] || {};
                const daysLeft = m.renewDate
                  ? Math.ceil((new Date(m.renewDate + 'T12:00:00') - new Date()) / 86400000)
                  : null;
                const isExpiringSoon = daysLeft !== null && daysLeft <= 14 && daysLeft > 0 && m.status === 'active';
                return (
                  <tr
                    key={m.id}
                    className="mem-row-hover"
                    onClick={() => setSelectedId(m.id)}
                    style={{ borderBottom: '1px solid rgba(0,0,0,0.04)', transition: 'background 0.15s', background: 'transparent' }}
                  >
                    {/* Client */}
                    <td style={{ padding: '13px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Avatar name={m.name} size={32} />
                        <div>
                          <div style={{ font: `500 13px ${s.FONT}`, color: s.text }}>{m.name}</div>
                          <div style={{ font: `400 11px ${s.FONT}`, color: s.text3 }}>{m.email}</div>
                        </div>
                      </div>
                    </td>
                    {/* Plan */}
                    <td style={{ padding: '13px 16px' }}>
                      <PlanBadge plan={m.plan} />
                    </td>
                    {/* Status */}
                    <td style={{ padding: '13px 16px' }}>
                      <StatusBadge status={m.status} />
                    </td>
                    {/* Started */}
                    <td style={{ padding: '13px 16px', color: s.text3, font: `400 12px ${s.FONT}`, whiteSpace: 'nowrap' }}>
                      {fmtDate(m.startDate)}
                    </td>
                    {/* Renews/Expires */}
                    <td style={{ padding: '13px 16px', whiteSpace: 'nowrap' }}>
                      {m.renewDate ? (
                        <span style={{
                          font: `${isExpiringSoon ? '600' : '400'} 12px ${s.FONT}`,
                          color: isExpiringSoon ? '#DC2626' : s.text3,
                        }}>
                          {fmtDate(m.renewDate)}
                          {isExpiringSoon && <span style={{ marginLeft: 6, font: `500 10px ${s.MONO}`, color: '#DC2626' }}>in {daysLeft}d</span>}
                        </span>
                      ) : (
                        <span style={{ color: s.text3, font: `400 12px ${s.FONT}` }}>—</span>
                      )}
                    </td>
                    {/* Classes */}
                    <td style={{ padding: '13px 16px' }}>
                      {m.classesTotal ? (
                        <div style={{ minWidth: 110 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                            <span style={{ font: `400 11px ${s.FONT}`, color: s.text2 }}>{m.classesUsed}/{m.classesTotal}</span>
                            <span style={{ font: `500 11px ${s.FONT}`, color: plan.color || s.text3 }}>
                              {m.classesTotal - m.classesUsed} left
                            </span>
                          </div>
                          <ProgressBar
                            value={m.classesUsed} total={m.classesTotal}
                            color={plan.color || s.accent} height={4}
                          />
                        </div>
                      ) : (
                        <span style={{ font: `400 12px ${s.FONT}`, color: s.text3 }}>
                          {m.classesUsed} total
                        </span>
                      )}
                    </td>
                    {/* Avg classes/week */}
                    <td style={{ padding: '13px 16px' }}>
                      {m.classesTotal == null ? (
                        <span style={{ font: `500 13px ${s.FONT}`, color: s.text }}>
                          ~{(m.classesUsed / Math.max(1, Math.ceil(Math.abs((new Date() - new Date(m.startDate + 'T00:00:00')) / 604800000)))).toFixed(1)}
                          <span style={{ font: `400 11px ${s.FONT}`, color: s.text3 }}>/wk</span>
                        </span>
                      ) : (
                        <span style={{ color: s.text3, font: `400 12px ${s.FONT}` }}>—</span>
                      )}
                    </td>
                    {/* Action */}
                    <td style={{ padding: '13px 16px' }}>
                      <button
                        onClick={e => { e.stopPropagation(); setSelectedId(m.id); }}
                        style={{
                          padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
                          font: `500 11px ${s.FONT}`,
                          background: `${s.accent}0C`, color: s.accent,
                          border: `1px solid ${s.accent}28`,
                          transition: 'all 0.2s', whiteSpace: 'nowrap',
                        }}
                        onMouseOver={e => { e.currentTarget.style.background = s.accent; e.currentTarget.style.color = '#fff'; }}
                        onMouseOut={e => { e.currentTarget.style.background = `${s.accent}0C`; e.currentTarget.style.color = s.accent; }}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div style={{ padding: '56px 24px', textAlign: 'center', font: `400 14px ${s.FONT}`, color: s.text3 }}>
              No members match this filter
            </div>
          )}
        </div>
      )}

      {/* ─── CARDS VIEW ─── */}
      {view === 'cards' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16, ...stagger(6) }}>
          {filtered.map((m, idx) => {
            const plan = PLANS[m.plan] || {};
            const daysLeft = m.renewDate
              ? Math.ceil((new Date(m.renewDate + 'T12:00:00') - new Date()) / 86400000)
              : null;
            const isExpiringSoon = daysLeft !== null && daysLeft <= 14 && daysLeft > 0 && m.status === 'active';
            return (
              <div
                key={m.id}
                onClick={() => setSelectedId(m.id)}
                style={{ ...card, overflow: 'hidden', cursor: 'pointer' }}
                onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = `0 12px 40px ${plan.color || s.accent}18, 0 2px 4px rgba(0,0,0,0.03)`; }}
                onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = card.boxShadow; }}
              >
                <div style={{ height: 4, background: plan.gradient || s.accent }} />
                <div style={{ padding: '18px 20px 16px' }}>
                  {/* Head */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Avatar name={m.name} size={38} />
                      <div>
                        <div style={{ font: `600 14px ${s.FONT}`, color: s.text }}>{m.name}</div>
                        <div style={{ font: `400 11px ${s.FONT}`, color: s.text3, marginTop: 1 }}>{m.email}</div>
                      </div>
                    </div>
                    <StatusBadge status={m.status} />
                  </div>

                  <PlanBadge plan={m.plan} />

                  <div style={{ height: 1, background: 'rgba(0,0,0,0.06)', margin: '14px 0' }} />

                  {/* Stats */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div>
                      <div style={{ font: `500 9px ${s.MONO}`, textTransform: 'uppercase', letterSpacing: 1.4, color: s.text3, marginBottom: 4 }}>
                        Started
                      </div>
                      <div style={{ font: `500 13px ${s.FONT}`, color: s.text }}>{fmtDate(m.startDate)}</div>
                    </div>
                    <div>
                      <div style={{ font: `500 9px ${s.MONO}`, textTransform: 'uppercase', letterSpacing: 1.4, color: s.text3, marginBottom: 4 }}>
                        {m.renewDate ? 'Renews' : 'Classes Used'}
                      </div>
                      <div style={{ font: `500 13px ${s.FONT}`, color: isExpiringSoon ? '#DC2626' : s.text }}>
                        {m.renewDate ? fmtDate(m.renewDate) : m.classesUsed}
                        {isExpiringSoon && <span style={{ marginLeft: 4, font: `500 10px ${s.MONO}`, color: '#DC2626' }}>soon!</span>}
                      </div>
                    </div>
                  </div>

                  {/* Pack progress */}
                  {m.classesTotal && (
                    <div style={{ marginTop: 14 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ font: `400 12px ${s.FONT}`, color: s.text2 }}>
                          {m.classesUsed} of {m.classesTotal} classes
                        </span>
                        <span style={{ font: `600 12px ${s.FONT}`, color: plan.color || s.accent }}>
                          {m.classesTotal - m.classesUsed} left
                        </span>
                      </div>
                      <ProgressBar value={m.classesUsed} total={m.classesTotal} color={plan.color || s.accent} height={7} />
                    </div>
                  )}

                  {/* Footer */}
                  <div style={{ marginTop: 14, display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      style={{
                        padding: '7px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
                        font: `500 12px ${s.FONT}`,
                        background: `${s.accent}10`, color: s.accent,
                        transition: 'all 0.2s',
                      }}
                    >
                      View Details →
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div style={{
              ...card, padding: 56, textAlign: 'center', gridColumn: '1 / -1',
              font: `400 14px ${s.FONT}`, color: s.text3,
            }}>
              No members match this filter
            </div>
          )}
        </div>
      )}

      {/* ─── Member Detail Modal ─── */}
      {selectedMember && (
        <MemberModal
          member={selectedMember}
          s={s}
          onClose={() => setSelectedId(null)}
          onAction={handleAction}
        />
      )}
    </div>
  );
}
