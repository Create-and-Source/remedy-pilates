import { useState, useMemo } from 'react';
import { useStyles } from '../theme';
import { getPatients, getAppointments } from '../data/store';

// ── Engagement scoring ────────────────────────────────────────────────────────

function computeEngagementScore(client, appointments) {
  const clientApts = appointments.filter(a => a.patientId === client.id || a.clientId === client.id);
  if (!clientApts.length) return 0;

  const now = new Date();
  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  const msPerMonth = 30 * 24 * 60 * 60 * 1000;

  // Frequency: classes per week over last 8 weeks
  const eightWeeksAgo = new Date(now - 8 * msPerWeek);
  const recent = clientApts.filter(a => new Date(a.date || a.start) >= eightWeeksAgo);
  const frequency = Math.min(recent.length / 8, 3) / 3; // max 3/week → 1.0

  // Consistency: weeks with at least 1 class in last 8
  const weekBuckets = new Set();
  recent.forEach(a => {
    const d = new Date(a.date || a.start);
    const weekNum = Math.floor((now - d) / msPerWeek);
    weekBuckets.add(weekNum);
  });
  const consistency = weekBuckets.size / 8;

  // Tenure: months since first appointment
  const dates = clientApts.map(a => new Date(a.date || a.start)).sort((a, b) => a - b);
  const firstDate = dates[0];
  const tenureMonths = Math.max(0, (now - firstDate) / msPerMonth);
  const tenure = Math.min(tenureMonths / 24, 1); // cap at 24 months

  // Variety: unique class types
  const types = new Set(clientApts.map(a => a.type || a.classType || 'General'));
  const variety = Math.min(types.size / 5, 1); // cap at 5 types

  const raw = frequency * 35 + consistency * 30 + tenure * 20 + variety * 15;
  return Math.round(Math.min(raw, 100));
}

function makeReferralLink(client) {
  const initials = ((client.name || client.firstName || 'XX')
    .split(' ')
    .map(p => p[0])
    .join('')
    .toUpperCase()
    .slice(0, 2));
  const code = Math.abs((client.id || 0) * 9973 + 1337) % 9000 + 1000;
  return `remedy.link/ref/${initials}-${code}`;
}

// ── Simulated referral data ───────────────────────────────────────────────────

const SIM_REFERRAL_COUNTS = [7, 5, 4, 4, 3, 3, 2, 2, 1, 1];
const REWARD_TIERS = [
  { min: 6, label: 'Gold', color: '#C9A84C', reward: 'Annual Gift' },
  { min: 3, label: 'Silver', color: '#8A8A8A', reward: 'Free Month' },
  { min: 1, label: 'Bronze', color: '#A0603A', reward: 'Free Class' },
];
function rewardTier(count) {
  return REWARD_TIERS.find(t => count >= t.min) || null;
}

const FUNNEL = [
  { label: 'Links Shared', count: 248 },
  { label: 'Link Clicked', count: 181 },
  { label: 'Trial Booked', count: 97 },
  { label: 'First Class Attended', count: 71 },
  { label: 'Converted to Member', count: 42 },
];

const NUDGE_TEMPLATES = [
  {
    id: 'milestone',
    name: 'Milestone Nudge',
    trigger: 'Client hits 50 / 100 / 200 classes',
    preview: "You've hit [N] classes! Share the love — give a friend their first class free with your link.",
    channel: 'SMS + Email',
    icon: '🏆',
  },
  {
    id: 'streak',
    name: 'Streak Nudge',
    trigger: '4 consecutive weeks of attendance',
    preview: "4 weeks strong! Know someone who'd love Remedy? Share your link and get them started.",
    channel: 'SMS',
    icon: '🔥',
  },
  {
    id: 'post_class',
    name: 'Post-Class High',
    trigger: 'After any 5-star rated class',
    preview: "Loved today's class? Invite a friend to experience it — your link gives them a free trial.",
    channel: 'Email',
    icon: '⭐',
  },
];

// ── Mini sparkline (8-week bar chart) ────────────────────────────────────────

function Sparkline({ data, accent }) {
  const max = Math.max(...data, 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 28 }}>
      {data.map((v, i) => (
        <div
          key={i}
          style={{
            flex: 1,
            height: `${Math.round((v / max) * 100)}%`,
            minHeight: 3,
            background: i === data.length - 1 ? accent : `${accent}55`,
            borderRadius: 2,
          }}
        />
      ))}
    </div>
  );
}

// ── Funnel chart ─────────────────────────────────────────────────────────────

function FunnelChart({ stages, accent, s }) {
  const max = stages[0].count;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {stages.map((stage, i) => {
        const pct = Math.round((stage.count / max) * 100);
        const cvt = i > 0 ? Math.round((stage.count / stages[i - 1].count) * 100) : null;
        return (
          <div key={stage.label}>
            {cvt !== null && (
              <div style={{ textAlign: 'center', fontSize: 11, color: s.text3, fontFamily: s.MONO, marginBottom: 2 }}>
                ↓ {cvt}%
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 140, fontSize: 12, color: s.text2, fontFamily: s.FONT }}>{stage.label}</div>
              <div style={{ flex: 1, background: 'rgba(0,0,0,0.06)', borderRadius: 6, overflow: 'hidden', height: 22 }}>
                <div
                  style={{
                    width: `${pct}%`,
                    height: '100%',
                    background: `linear-gradient(90deg, ${accent}cc, ${accent})`,
                    borderRadius: 6,
                    transition: 'width 0.6s ease',
                  }}
                />
              </div>
              <div style={{ width: 40, fontSize: 13, fontFamily: s.MONO, fontWeight: 700, color: s.text, textAlign: 'right' }}>
                {stage.count}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ReferralEngine() {
  const s = useStyles();
  const patients = useMemo(() => getPatients() || [], []);
  const appointments = useMemo(() => getAppointments() || [], []);

  const [nudgeEnabled, setNudgeEnabled] = useState({ milestone: true, streak: true, post_class: false });
  const [copiedLink, setCopiedLink] = useState(null);
  const [nudgeSent, setNudgeSent] = useState({});

  // Score all clients, flag advocates (≥75)
  const scored = useMemo(() => {
    return patients
      .map(c => {
        const score = computeEngagementScore(c, appointments);
        const clientApts = appointments.filter(a => a.patientId === c.id || a.clientId === c.id);
        const now = new Date();
        const msPerWeek = 7 * 24 * 60 * 60 * 1000;
        const eightWeeksAgo = new Date(now - 8 * msPerWeek);
        const weekCounts = Array.from({ length: 8 }, (_, i) => {
          const wStart = new Date(now - (i + 1) * msPerWeek);
          const wEnd = new Date(now - i * msPerWeek);
          return clientApts.filter(a => {
            const d = new Date(a.date || a.start);
            return d >= wStart && d < wEnd;
          }).length;
        }).reverse();
        const monthlyCount = clientApts.filter(a => new Date(a.date || a.start) >= eightWeeksAgo).length / 2;
        const firstDate = clientApts.map(a => new Date(a.date || a.start)).sort((a, b) => a - b)[0];
        const tenureMonths = firstDate ? Math.round((now - firstDate) / (30 * 24 * 60 * 60 * 1000)) : 0;
        return { ...c, score, weekCounts, monthlyCount: Math.round(monthlyCount * 10) / 10, tenureMonths };
      })
      .filter(c => c.score >= 75)
      .sort((a, b) => b.score - a.score);
  }, [patients, appointments]);

  // Simulate referral counts for advocates
  const advocates = useMemo(() =>
    scored.map((c, i) => ({
      ...c,
      referralCount: SIM_REFERRAL_COUNTS[i] ?? Math.max(1, Math.floor(c.score / 30)),
      referralLink: makeReferralLink(c),
    })), [scored]);

  // KPIs
  const totalReferrals = advocates.reduce((s, a) => s + a.referralCount, 0);
  const conversionRate = 34;
  const revenueFromReferrals = Math.round(totalReferrals * 0.34 * 185);
  const topReferrer = advocates[0];
  const activeLinks = advocates.length;

  // Location breakdown
  const locationMap = useMemo(() => {
    const map = {};
    patients.forEach((p, i) => {
      const loc = p.location || p.studio || 'Main Studio';
      if (!map[loc]) map[loc] = { name: loc, clients: 0, referrals: 0 };
      map[loc].clients++;
      if (advocates.find(a => a.id === p.id)) {
        map[loc].referrals += advocates.find(a => a.id === p.id)?.referralCount || 0;
      }
    });
    return Object.values(map).sort((a, b) => b.referrals - a.referrals);
  }, [patients, advocates]);

  const multiLocation = locationMap.length > 1;
  const maxLocReferrals = Math.max(...locationMap.map(l => l.referrals), 1);

  // Leaderboard (top 10 from advocates + simulated extras)
  const leaderboard = advocates.slice(0, 10);

  // Card style
  const card = {
    background: 'rgba(255,255,255,0.72)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255,255,255,0.6)',
    borderRadius: 16,
    boxShadow: s.shadow,
    padding: 24,
  };

  function handleCopyLink(advocate) {
    navigator.clipboard?.writeText(`https://${advocate.referralLink}`).catch(() => {});
    setCopiedLink(advocate.id);
    setTimeout(() => setCopiedLink(null), 2000);
  }

  function handleSendNudge(advocate) {
    setNudgeSent(prev => ({ ...prev, [advocate.id]: true }));
    setTimeout(() => setNudgeSent(prev => ({ ...prev, [advocate.id]: false })), 3000);
  }

  return (
    <div style={{ padding: '32px 28px', maxWidth: 1200, margin: '0 auto' }}>
      <style>{`
        @media (max-width: 768px) {
          .re-kpi-grid { grid-template-columns: 1fr 1fr !important; }
          .re-main-grid { grid-template-columns: 1fr !important; }
          .re-pipeline-grid { grid-template-columns: 1fr !important; }
          .re-page { padding: 16px 12px !important; }
        }
        @media (max-width: 480px) {
          .re-kpi-grid { grid-template-columns: 1fr 1fr !important; }
        }
      `}</style>
      {/* Header */}
      <div style={{ marginBottom: 36 }}>
        <div style={{ fontFamily: s.MONO, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em', color: s.accent, marginBottom: 8 }}>
          Referral Engine
        </div>
        <h1 style={{ fontFamily: s.DISPLAY, fontSize: 32, fontWeight: 700, color: s.text, margin: '0 0 8px' }}>
          Virality Loop
        </h1>
        <p style={{ fontFamily: s.FONT, fontSize: 15, color: s.text2, margin: 0 }}>
          Auto-identifies your top advocates and triggers smart referral nudges at peak engagement moments.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="re-kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16, marginBottom: 28 }}>
        {[
          { label: 'Referrals This Month', value: totalReferrals, sub: '+12% vs last month' },
          { label: 'Conversion Rate', value: `${conversionRate}%`, sub: 'Referred → Booked' },
          { label: 'Revenue from Referrals', value: `$${revenueFromReferrals.toLocaleString()}`, sub: 'MTD' },
          { label: 'Top Referrer', value: topReferrer ? (topReferrer.name || topReferrer.firstName || 'N/A') : '—', sub: topReferrer ? `${topReferrer.referralCount} referrals` : '' },
          { label: 'Active Referral Links', value: activeLinks, sub: 'Advocates flagged' },
        ].map(kpi => (
          <div key={kpi.label} style={card}>
            <div style={{ fontFamily: s.MONO, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: s.text3, marginBottom: 8 }}>
              {kpi.label}
            </div>
            <div style={{ fontFamily: s.DISPLAY, fontSize: 26, fontWeight: 700, color: s.text, marginBottom: 4 }}>
              {kpi.value}
            </div>
            <div style={{ fontFamily: s.FONT, fontSize: 12, color: s.text3 }}>{kpi.sub}</div>
          </div>
        ))}
      </div>

      {/* Advocates + Nudge Templates */}
      <div className="re-main-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, marginBottom: 24 }}>

        {/* Advocate Grid */}
        <div style={card}>
          <div style={{ fontFamily: s.MONO, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: s.accent, marginBottom: 16 }}>
            Advocate Identification — Score ≥ 75
          </div>
          {advocates.length === 0 ? (
            <div style={{ fontFamily: s.FONT, color: s.text2, fontSize: 14 }}>No advocates identified yet. Clients need more appointment history.</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
              {advocates.map(adv => {
                const tier = rewardTier(adv.referralCount);
                return (
                  <div
                    key={adv.id}
                    style={{
                      background: 'rgba(255,255,255,0.55)',
                      border: '1px solid rgba(255,255,255,0.7)',
                      borderRadius: 12,
                      padding: 16,
                      position: 'relative',
                    }}
                  >
                    {tier && (
                      <div style={{
                        position: 'absolute', top: 10, right: 10,
                        background: tier.color, color: '#fff',
                        fontSize: 10, fontFamily: s.MONO, padding: '2px 7px',
                        borderRadius: 99, fontWeight: 700, letterSpacing: '0.05em',
                      }}>
                        {tier.label}
                      </div>
                    )}
                    <div style={{ fontFamily: s.FONT, fontWeight: 700, fontSize: 14, color: s.text, marginBottom: 2 }}>
                      {adv.name || `${adv.firstName || ''} ${adv.lastName || ''}`.trim() || 'Client'}
                    </div>
                    <div style={{ fontFamily: s.MONO, fontSize: 11, color: s.accent, marginBottom: 10 }}>
                      Score {adv.score} / 100
                    </div>
                    <div style={{ display: 'flex', gap: 16, fontSize: 11, fontFamily: s.FONT, color: s.text2, marginBottom: 10 }}>
                      <span>{adv.monthlyCount}/mo</span>
                      <span>{adv.tenureMonths}mo tenure</span>
                      <span>{adv.referralCount} refs</span>
                    </div>
                    <Sparkline data={adv.weekCounts} accent={s.accent} />
                    <div style={{ fontFamily: s.MONO, fontSize: 10, color: s.text3, margin: '8px 0 10px', wordBreak: 'break-all' }}>
                      {adv.referralLink}
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={() => handleCopyLink(adv)}
                        style={{
                          flex: 1, padding: '6px 0', fontSize: 11, fontFamily: s.FONT,
                          background: copiedLink === adv.id ? '#4CAF50' : 'rgba(0,0,0,0.06)',
                          color: copiedLink === adv.id ? '#fff' : s.text,
                          border: '1px solid rgba(0,0,0,0.08)', borderRadius: 8, cursor: 'pointer',
                        }}
                      >
                        {copiedLink === adv.id ? 'Copied!' : 'Copy Link'}
                      </button>
                      <button
                        onClick={() => handleSendNudge(adv)}
                        style={{
                          flex: 1, padding: '6px 0', fontSize: 11, fontFamily: s.FONT,
                          background: nudgeSent[adv.id] ? s.accent : `${s.accent}18`,
                          color: nudgeSent[adv.id] ? '#fff' : s.accent,
                          border: `1px solid ${s.accent}44`, borderRadius: 8, cursor: 'pointer',
                          fontWeight: 600,
                        }}
                      >
                        {nudgeSent[adv.id] ? 'Sent ✓' : 'Send Nudge'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Nudge Templates */}
        <div style={card}>
          <div style={{ fontFamily: s.MONO, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: s.accent, marginBottom: 16 }}>
            Auto-Trigger Templates
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {NUDGE_TEMPLATES.map(t => (
              <div
                key={t.id}
                style={{
                  background: nudgeEnabled[t.id] ? `${s.accent}08` : 'rgba(0,0,0,0.03)',
                  border: `1px solid ${nudgeEnabled[t.id] ? `${s.accent}33` : 'rgba(0,0,0,0.08)'}`,
                  borderRadius: 12, padding: 16,
                  opacity: nudgeEnabled[t.id] ? 1 : 0.6,
                  transition: 'all 0.2s',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 18 }}>{t.icon}</span>
                    <div style={{ fontFamily: s.FONT, fontWeight: 700, fontSize: 13, color: s.text }}>{t.name}</div>
                  </div>
                  <button
                    onClick={() => setNudgeEnabled(prev => ({ ...prev, [t.id]: !prev[t.id] }))}
                    style={{
                      width: 38, height: 22, borderRadius: 99,
                      background: nudgeEnabled[t.id] ? s.accent : '#ccc',
                      border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s',
                    }}
                  >
                    <div style={{
                      position: 'absolute', top: 3, left: nudgeEnabled[t.id] ? 18 : 3,
                      width: 16, height: 16, borderRadius: '50%', background: '#fff',
                      transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                    }} />
                  </button>
                </div>
                <div style={{ fontFamily: s.MONO, fontSize: 10, color: s.text3, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Trigger: {t.trigger}
                </div>
                <div style={{ fontFamily: s.FONT, fontSize: 12, color: s.text2, fontStyle: 'italic', marginBottom: 8, lineHeight: 1.5 }}>
                  "{t.preview}"
                </div>
                <div style={{ fontFamily: s.MONO, fontSize: 10, color: s.accent }}>Channel: {t.channel}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Referral Pipeline + Leaderboard */}
      <div className="re-pipeline-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>

        {/* Funnel */}
        <div style={card}>
          <div style={{ fontFamily: s.MONO, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: s.accent, marginBottom: 20 }}>
            Referral Pipeline
          </div>
          <FunnelChart stages={FUNNEL} accent={s.accent} s={s} />
        </div>

        {/* Leaderboard */}
        <div style={card}>
          <div style={{ fontFamily: s.MONO, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: s.accent, marginBottom: 16 }}>
            Top Referrer Leaderboard
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: s.FONT, fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
                  {['#', 'Name', 'Sent', 'Converted', 'Revenue', 'Reward'].map(h => (
                    <th key={h} style={{ padding: '6px 8px', textAlign: 'left', fontFamily: s.MONO, fontSize: 10, color: s.text3, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((adv, i) => {
                  const converted = Math.round(adv.referralCount * 0.34);
                  const revenue = converted * 185;
                  const tier = rewardTier(adv.referralCount);
                  const isTop = i === 0;
                  return (
                    <tr
                      key={adv.id}
                      style={{
                        background: isTop ? `${s.accent}10` : 'transparent',
                        borderLeft: isTop ? `3px solid ${s.accent}` : '3px solid transparent',
                      }}
                    >
                      <td style={{ padding: '8px 8px', color: s.text3, fontFamily: s.MONO, fontWeight: 700 }}>{i + 1}</td>
                      <td style={{ padding: '8px 8px', color: s.text, fontWeight: isTop ? 700 : 400 }}>
                        {adv.name || `${adv.firstName || ''} ${adv.lastName || ''}`.trim() || 'Client'}
                      </td>
                      <td style={{ padding: '8px 8px', color: s.text, fontFamily: s.MONO }}>{adv.referralCount}</td>
                      <td style={{ padding: '8px 8px', color: s.text, fontFamily: s.MONO }}>{converted}</td>
                      <td style={{ padding: '8px 8px', color: s.text, fontFamily: s.MONO }}>${revenue}</td>
                      <td style={{ padding: '8px 8px' }}>
                        {tier ? (
                          <span style={{
                            background: tier.color, color: '#fff', fontSize: 10, fontFamily: s.MONO,
                            padding: '2px 8px', borderRadius: 99, fontWeight: 700,
                          }}>
                            {tier.label}
                          </span>
                        ) : (
                          <span style={{ color: s.text3, fontSize: 11 }}>—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div style={{ marginTop: 16, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {REWARD_TIERS.map(t => (
              <div key={t.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontFamily: s.FONT, color: s.text2 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: t.color }} />
                {t.label}: {t.reward}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Location Breakdown */}
      {multiLocation && (
        <div style={card}>
          <div style={{ fontFamily: s.MONO, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: s.accent, marginBottom: 20 }}>
            Referrals by Location
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {locationMap.map(loc => (
              <div key={loc.name} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 160, fontFamily: s.FONT, fontSize: 13, color: s.text }}>{loc.name}</div>
                <div style={{ flex: 1, background: 'rgba(0,0,0,0.06)', borderRadius: 6, overflow: 'hidden', height: 20 }}>
                  <div style={{
                    width: `${Math.round((loc.referrals / maxLocReferrals) * 100)}%`,
                    height: '100%',
                    background: `linear-gradient(90deg, ${s.accent}aa, ${s.accent})`,
                    borderRadius: 6,
                  }} />
                </div>
                <div style={{ width: 60, fontFamily: s.MONO, fontSize: 12, color: s.text, textAlign: 'right' }}>
                  {loc.referrals} refs
                </div>
                <div style={{ width: 70, fontFamily: s.FONT, fontSize: 12, color: s.text2, textAlign: 'right' }}>
                  {loc.clients} clients
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
