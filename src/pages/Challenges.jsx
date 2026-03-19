import { useState, useMemo } from 'react';
import { useStyles } from '../theme';
import { getPatients, getAppointments, getAssessments, getBookings } from '../data/store';

// ── Gamified Client Challenges ──
// Points system: check-ins, assessments, referrals, streaks, variety
// Leaderboards, badges, studio-wide challenges

const BADGES = [
  { id: 'first-class', name: 'First Steps', icon: '🌱', desc: 'Completed your first class', condition: (stats) => stats.totalClasses >= 1 },
  { id: 'five-streak', name: 'On Fire', icon: '🔥', desc: '5 classes in 2 weeks', condition: (stats) => stats.recentClasses >= 5 },
  { id: 'ten-streak', name: 'Unstoppable', icon: '⚡', desc: '10 classes in 30 days', condition: (stats) => stats.monthClasses >= 10 },
  { id: 'variety', name: 'Explorer', icon: '🧭', desc: 'Tried 4+ different class types', condition: (stats) => stats.uniqueTypes >= 4 },
  { id: 'early-bird', name: 'Early Bird', icon: '🌅', desc: '5 classes before 8am', condition: (stats) => stats.earlyClasses >= 5 },
  { id: 'social', name: 'Squad Goals', icon: '👯', desc: 'Referred 2+ friends', condition: (stats) => stats.referrals >= 2 },
  { id: 'posture-up', name: 'Stand Tall', icon: '📐', desc: 'Improved posture score', condition: (stats) => stats.postureImproved },
  { id: 'century', name: 'Century Club', icon: '💎', desc: '100 lifetime classes', condition: (stats) => stats.totalClasses >= 100 },
  { id: 'dedication', name: 'Dedicated', icon: '🏆', desc: '6 months as a member', condition: (stats) => stats.memberDays >= 180 },
  { id: 'all-locations', name: 'Globetrotter', icon: '🗺️', desc: 'Visited all 3 locations', condition: (stats) => stats.uniqueLocations >= 3 },
  { id: 'barre-master', name: 'Barre Master', icon: '🩰', desc: '20+ barre classes', condition: (stats) => stats.barreClasses >= 20 },
  { id: 'reformer-pro', name: 'Reformer Pro', icon: '🔧', desc: '30+ reformer classes', condition: (stats) => stats.reformerClasses >= 30 },
];

const CHALLENGES = [
  { id: 'spring-30', name: 'Spring Into Strength', desc: '30 classes in 30 days — studio-wide', duration: '30 days', target: 30, type: 'classes', icon: '🌸', reward: 'Free Private Session', active: true },
  { id: 'posture-challenge', name: '30-Day Posture Challenge', desc: 'Complete a posture assessment at start and end', duration: '30 days', target: 2, type: 'assessments', icon: '📐', reward: '$25 Studio Credit', active: true },
  { id: 'variety-week', name: 'Variety Week', desc: 'Take 5 different class types in one week', duration: '7 days', target: 5, type: 'variety', icon: '🎨', reward: 'Branded Water Bottle', active: true },
  { id: 'buddy-month', name: 'Buddy Month', desc: 'Bring 3 friends this month', duration: '30 days', target: 3, type: 'referrals', icon: '👥', reward: 'Free Month Extension', active: false },
];

const POINT_VALUES = {
  classCompleted: 10,
  earlyBird: 5,     // before 8am
  streak3: 25,      // 3 classes in a row within 7 days
  streak5: 50,      // 5 in 14 days
  newClassType: 15,  // first time trying a class type
  postureAssessment: 30,
  referral: 50,
  challengeComplete: 100,
};

function computeClientStats(client, appointments, assessments) {
  const now = new Date();
  const clientAppts = appointments.filter(a => a.patientId === client.id && a.status === 'completed');
  const last14 = clientAppts.filter(a => (now - new Date(a.date)) / 86400000 <= 14).length;
  const last30 = clientAppts.filter(a => (now - new Date(a.date)) / 86400000 <= 30).length;
  const earlyClasses = clientAppts.filter(a => {
    const h = parseInt((a.time || '09:00').split(':')[0]);
    return h < 8;
  }).length;
  const uniqueTypes = new Set(clientAppts.map(a => a.serviceId)).size;
  const uniqueLocations = new Set(clientAppts.map(a => a.location)).size;
  const memberDays = client.createdAt ? Math.floor((now - new Date(client.createdAt)) / 86400000) : 0;

  const barreClasses = clientAppts.filter(a => ['SVC-3', 'SVC-4'].includes(a.serviceId)).length;
  const reformerClasses = clientAppts.filter(a => ['SVC-1', 'SVC-6'].includes(a.serviceId)).length;

  const clientAssessments = assessments.filter(a => a.clientId === client.id);
  const postureImproved = clientAssessments.length >= 2 && (() => {
    const sorted = [...clientAssessments].sort((a, b) => new Date(a.date) - new Date(b.date));
    return (sorted[sorted.length - 1].overallScore || 0) > (sorted[0].overallScore || 0);
  })();

  // Points calculation
  let points = 0;
  points += clientAppts.length * POINT_VALUES.classCompleted;
  points += earlyClasses * POINT_VALUES.earlyBird;
  if (last14 >= 5) points += POINT_VALUES.streak5;
  else if (last14 >= 3) points += POINT_VALUES.streak3;
  points += Math.max(0, uniqueTypes - 1) * POINT_VALUES.newClassType;
  points += clientAssessments.length * POINT_VALUES.postureAssessment;

  const badges = BADGES.filter(b => b.condition({
    totalClasses: clientAppts.length,
    recentClasses: last14,
    monthClasses: last30,
    uniqueTypes,
    earlyClasses,
    referrals: 0, // would need referral data
    postureImproved,
    memberDays,
    uniqueLocations,
    barreClasses,
    reformerClasses,
  }));

  // Level system: 0-99 Bronze, 100-299 Silver, 300-599 Gold, 600+ Platinum
  let level = 'Bronze';
  let levelColor = '#CD7F32';
  if (points >= 600) { level = 'Platinum'; levelColor = '#E5E4E2'; }
  else if (points >= 300) { level = 'Gold'; levelColor = '#FFD700'; }
  else if (points >= 100) { level = 'Silver'; levelColor = '#C0C0C0'; }

  return {
    totalClasses: clientAppts.length,
    recentClasses: last14,
    monthClasses: last30,
    earlyClasses,
    uniqueTypes,
    uniqueLocations,
    memberDays,
    barreClasses,
    reformerClasses,
    postureImproved,
    points,
    badges,
    level,
    levelColor,
  };
}

export default function Challenges() {
  const s = useStyles();
  const [tab, setTab] = useState('leaderboard'); // leaderboard | challenges | badges
  const [selectedClient, setSelectedClient] = useState(null);

  const { leaderboard, studioStats, activeChallenges } = useMemo(() => {
    const patients = getPatients();
    const appointments = getAppointments();
    const assessments = getAssessments();

    const scored = patients.map(client => ({
      ...client,
      stats: computeClientStats(client, appointments, assessments),
    })).sort((a, b) => b.stats.points - a.stats.points);

    const totalPoints = scored.reduce((s, c) => s + c.stats.points, 0);
    const totalBadges = scored.reduce((s, c) => s + c.stats.badges.length, 0);
    const platinums = scored.filter(c => c.stats.level === 'Platinum').length;

    return {
      leaderboard: scored,
      studioStats: { totalPoints, totalBadges, platinums, participants: scored.filter(c => c.stats.points > 0).length },
      activeChallenges: CHALLENGES.filter(c => c.active),
    };
  }, []);

  const cardStyle = {
    background: 'rgba(255,255,255,0.72)', backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255,255,255,0.6)', borderRadius: 16,
    boxShadow: s.shadow,
  };

  const selected = selectedClient ? leaderboard.find(c => c.id === selectedClient) : null;

  return (
    <div style={{ animation: 'fadeIn 0.5s ease' }}>
      <style>{`
        @media (max-width: 768px) {
          .ch-podium-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ font: `400 11px ${s.MONO}`, textTransform: 'uppercase', letterSpacing: 1.5, color: s.text3, marginBottom: 4 }}>
          Engagement
        </div>
        <h1 style={{ font: `600 28px ${s.DISPLAY}`, color: s.text, margin: 0 }}>
          Challenges & Rewards
        </h1>
        <p style={{ font: `400 14px ${s.FONT}`, color: s.text2, margin: '6px 0 0' }}>
          Gamified client engagement — points, badges, leaderboards, studio challenges
        </p>
      </div>

      {/* Studio KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Total Points', value: studioStats.totalPoints.toLocaleString(), icon: '⭐' },
          { label: 'Badges Earned', value: studioStats.totalBadges, icon: '🏅' },
          { label: 'Platinum Members', value: studioStats.platinums, icon: '💎' },
          { label: 'Active Players', value: studioStats.participants, icon: '🎮' },
        ].map(kpi => (
          <div key={kpi.label} style={{ ...cardStyle, padding: 18, textAlign: 'center' }}>
            <div style={{ fontSize: 24, marginBottom: 4 }}>{kpi.icon}</div>
            <div style={{ font: `700 22px ${s.FONT}`, color: s.text }}>{kpi.value}</div>
            <div style={{ font: `400 10px ${s.MONO}`, color: s.text3, marginTop: 4, textTransform: 'uppercase' }}>{kpi.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {['leaderboard', 'challenges', 'badges'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '8px 18px', borderRadius: 10, border: 'none', cursor: 'pointer',
            background: tab === t ? s.accent : 'rgba(0,0,0,0.04)',
            color: tab === t ? '#fff' : s.text2,
            font: `500 13px ${s.FONT}`, transition: 'all 0.2s', textTransform: 'capitalize',
          }}>{t}</button>
        ))}
      </div>

      {/* Leaderboard */}
      {tab === 'leaderboard' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {/* Top 3 podium */}
          <div className="ch-podium-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
            {leaderboard.slice(0, 3).map((client, i) => {
              const medals = ['🥇', '🥈', '🥉'];
              const sizes = [56, 48, 44];
              return (
                <div key={client.id} style={{
                  ...cardStyle, padding: 20, textAlign: 'center', cursor: 'pointer',
                  border: selectedClient === client.id ? `2px solid ${s.accent}` : cardStyle.border,
                  background: i === 0 ? 'linear-gradient(135deg, rgba(255,215,0,0.08), rgba(255,255,255,0.72))' : cardStyle.background,
                }} onClick={() => setSelectedClient(selectedClient === client.id ? null : client.id)}>
                  <div style={{ fontSize: sizes[i] - 12, marginBottom: 8 }}>{medals[i]}</div>
                  <div style={{
                    width: sizes[i], height: sizes[i], borderRadius: '50%', margin: '0 auto 8px',
                    background: `linear-gradient(135deg, ${client.stats.levelColor}, ${client.stats.levelColor}88)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', font: `600 ${sizes[i] * 0.35}px ${s.FONT}`,
                    border: `3px solid ${client.stats.levelColor}`,
                  }}>
                    {client.firstName?.[0]}{client.lastName?.[0]}
                  </div>
                  <div style={{ font: `600 14px ${s.FONT}`, color: s.text }}>{client.firstName} {client.lastName?.[0]}.</div>
                  <div style={{ font: `700 20px ${s.FONT}`, color: s.accent, marginTop: 4 }}>{client.stats.points}</div>
                  <div style={{ font: `400 10px ${s.MONO}`, color: s.text3 }}>points · {client.stats.level}</div>
                  <div style={{ display: 'flex', gap: 2, justifyContent: 'center', marginTop: 8, flexWrap: 'wrap' }}>
                    {client.stats.badges.slice(0, 5).map(b => (
                      <span key={b.id} title={b.name} style={{ fontSize: 14 }}>{b.icon}</span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Rest of leaderboard */}
          {leaderboard.slice(3).map((client, i) => (
            <div key={client.id} style={{
              ...cardStyle, padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 14,
              cursor: 'pointer', border: selectedClient === client.id ? `2px solid ${s.accent}` : cardStyle.border,
            }} onClick={() => setSelectedClient(selectedClient === client.id ? null : client.id)}>
              <div style={{ font: `500 14px ${s.MONO}`, color: s.text3, width: 28, textAlign: 'center' }}>#{i + 4}</div>
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: `linear-gradient(135deg, ${client.stats.levelColor}, ${client.stats.levelColor}88)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', font: `600 12px ${s.FONT}`, flexShrink: 0,
              }}>
                {client.firstName?.[0]}{client.lastName?.[0]}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ font: `500 13px ${s.FONT}`, color: s.text }}>{client.firstName} {client.lastName}</div>
                <div style={{ font: `400 11px ${s.FONT}`, color: s.text3 }}>{client.stats.level} · {client.stats.badges.length} badges</div>
              </div>
              <div style={{ display: 'flex', gap: 2 }}>
                {client.stats.badges.slice(0, 3).map(b => (
                  <span key={b.id} style={{ fontSize: 12 }}>{b.icon}</span>
                ))}
              </div>
              <div style={{ font: `700 16px ${s.FONT}`, color: s.accent, width: 60, textAlign: 'right' }}>
                {client.stats.points}
              </div>
            </div>
          ))}

          {/* Selected client detail */}
          {selected && (
            <div style={{ ...cardStyle, padding: 24, marginTop: 8, borderLeft: `4px solid ${selected.stats.levelColor}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                  <div style={{ font: `600 18px ${s.FONT}`, color: s.text }}>{selected.firstName} {selected.lastName}</div>
                  <div style={{ font: `400 12px ${s.MONO}`, color: s.text3 }}>{selected.stats.level} · {selected.stats.points} points</div>
                </div>
                <div style={{ padding: '6px 14px', borderRadius: 8, background: selected.stats.levelColor + '20', color: selected.stats.levelColor, font: `600 12px ${s.MONO}` }}>
                  {selected.stats.level}
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 10, marginBottom: 16 }}>
                {[
                  { label: 'Total Classes', value: selected.stats.totalClasses },
                  { label: 'This Month', value: selected.stats.monthClasses },
                  { label: 'Class Types', value: selected.stats.uniqueTypes },
                  { label: 'Locations', value: selected.stats.uniqueLocations },
                  { label: 'Early Birds', value: selected.stats.earlyClasses },
                  { label: 'Member Days', value: selected.stats.memberDays },
                ].map(stat => (
                  <div key={stat.label} style={{ padding: 10, background: 'rgba(0,0,0,0.02)', borderRadius: 8, textAlign: 'center' }}>
                    <div style={{ font: `600 16px ${s.FONT}`, color: s.text }}>{stat.value}</div>
                    <div style={{ font: `400 9px ${s.MONO}`, color: s.text3, textTransform: 'uppercase' }}>{stat.label}</div>
                  </div>
                ))}
              </div>
              <div style={{ font: `600 11px ${s.MONO}`, color: s.text3, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Badges Earned</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {selected.stats.badges.map(b => (
                  <div key={b.id} style={{ padding: '8px 12px', background: 'rgba(0,0,0,0.02)', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 18 }}>{b.icon}</span>
                    <div>
                      <div style={{ font: `500 12px ${s.FONT}`, color: s.text }}>{b.name}</div>
                      <div style={{ font: `400 10px ${s.FONT}`, color: s.text3 }}>{b.desc}</div>
                    </div>
                  </div>
                ))}
                {selected.stats.badges.length === 0 && (
                  <div style={{ font: `400 12px ${s.FONT}`, color: s.text3 }}>No badges yet — keep going!</div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Challenges */}
      {tab === 'challenges' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {CHALLENGES.map(ch => {
            const progress = Math.floor(Math.random() * ch.target); // simulated
            const pct = Math.min((progress / ch.target) * 100, 100);
            return (
              <div key={ch.id} style={{ ...cardStyle, padding: 24, position: 'relative', overflow: 'hidden' }}>
                {!ch.active && (
                  <div style={{ position: 'absolute', top: 12, right: 12, padding: '3px 8px', borderRadius: 6, background: 'rgba(0,0,0,0.06)', font: `400 10px ${s.MONO}`, color: s.text3 }}>Upcoming</div>
                )}
                <div style={{ fontSize: 32, marginBottom: 12 }}>{ch.icon}</div>
                <div style={{ font: `600 16px ${s.FONT}`, color: s.text, marginBottom: 4 }}>{ch.name}</div>
                <div style={{ font: `400 13px ${s.FONT}`, color: s.text2, marginBottom: 12, lineHeight: 1.5 }}>{ch.desc}</div>
                <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
                  <div style={{ padding: '4px 10px', borderRadius: 6, background: 'rgba(0,0,0,0.03)', font: `400 11px ${s.MONO}`, color: s.text3 }}>{ch.duration}</div>
                  <div style={{ padding: '4px 10px', borderRadius: 6, background: s.accentLight || 'rgba(196,112,75,0.08)', font: `400 11px ${s.MONO}`, color: s.accent }}>{ch.reward}</div>
                </div>
                {/* Progress bar */}
                <div style={{ marginBottom: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ font: `400 11px ${s.MONO}`, color: s.text3 }}>Studio Progress</span>
                    <span style={{ font: `600 11px ${s.MONO}`, color: s.accent }}>{progress}/{ch.target}</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 3, background: 'rgba(0,0,0,0.06)' }}>
                    <div style={{ height: 6, borderRadius: 3, width: `${pct}%`, background: pct >= 100 ? s.success : s.accent, transition: 'width 0.5s ease' }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Badges catalog */}
      {tab === 'badges' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
          {BADGES.map(badge => {
            const earnedCount = leaderboard.filter(c => c.stats.badges.some(b => b.id === badge.id)).length;
            return (
              <div key={badge.id} style={{ ...cardStyle, padding: 20, textAlign: 'center' }}>
                <div style={{ fontSize: 36, marginBottom: 8 }}>{badge.icon}</div>
                <div style={{ font: `600 14px ${s.FONT}`, color: s.text }}>{badge.name}</div>
                <div style={{ font: `400 12px ${s.FONT}`, color: s.text2, margin: '6px 0 10px', lineHeight: 1.4 }}>{badge.desc}</div>
                <div style={{
                  padding: '4px 10px', borderRadius: 6, display: 'inline-block',
                  background: earnedCount > 0 ? s.accentLight || 'rgba(196,112,75,0.08)' : 'rgba(0,0,0,0.03)',
                  font: `500 11px ${s.MONO}`, color: earnedCount > 0 ? s.accent : s.text3,
                }}>
                  {earnedCount} client{earnedCount !== 1 ? 's' : ''} earned
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Points legend */}
      <div style={{ ...cardStyle, padding: 20, marginTop: 24 }}>
        <div style={{ font: `600 12px ${s.MONO}`, color: s.text3, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>How Points Work</div>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          {Object.entries(POINT_VALUES).map(([key, val]) => (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ font: `700 14px ${s.FONT}`, color: s.accent }}>+{val}</span>
              <span style={{ font: `400 12px ${s.FONT}`, color: s.text2 }}>{key.replace(/([A-Z])/g, ' $1').replace(/(\d)/g, ' $1').trim()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
