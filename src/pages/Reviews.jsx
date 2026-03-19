import { useState, useEffect } from 'react';
import { useStyles } from '../theme';
import { subscribe, getSettings } from '../data/store';

const STORE_KEY = 'rp_reviews';

function getReviews() {
  try { return JSON.parse(localStorage.getItem(STORE_KEY)) || []; } catch { return []; }
}
function setReviews(data) { localStorage.setItem(STORE_KEY, JSON.stringify(data)); }

function seedReviews() {
  if (getReviews().length > 0) return;
  const now = new Date();
  const d = (offset) => { const dt = new Date(now); dt.setDate(dt.getDate() + offset); return dt.toISOString(); };

  const names = [
    'Emma Johnson', 'Olivia Williams', 'Sophia Brown', 'Ava Jones', 'Isabella Garcia',
    'Mia Miller', 'Charlotte Davis', 'Amelia Thompson', 'Harper White', 'Evelyn Lopez',
    'Abigail Taylor', 'Ella Thomas', 'Scarlett Hernandez', 'Grace Moore', 'Chloe Martin',
    'Victoria Jackson', 'Riley Clark', 'Aria Lewis',
  ];
  const services = ['Reformer', 'Juvederm Barre', 'Mat Pilates', 'TRX Photofacial', 'Chemical Peel', 'RF Private Session', 'Laser Hair Removal', 'Sculptra'];
  const platforms = ['Google', 'Google', 'Google', 'Yelp', 'Google', 'Yelp'];
  const statuses = ['completed', 'completed', 'completed', 'completed', 'pending', 'pending', 'completed', 'completed', 'completed', 'pending'];
  const comments = [
    'Amazing results! Dr. Mitchell is incredible.',
    'Best studio in Scottsdale. My skin has never looked better.',
    'Super professional team. Love the results.',
    'Great experience from start to finish. Highly recommend!',
    'The staff made me feel so comfortable. Will definitely be back.',
    'Incredible transformation. Worth every penny.',
    'Jessica is so talented. Natural-looking results every time.',
    'Five stars is not enough. Absolutely love this place!',
    'Clean facility, friendly staff, amazing outcomes.',
    'I was nervous but the team put me at ease. Love my results!',
    'Been coming here for 2 years and always leave happy.',
    'The Mat Pilates was life-changing for my skin.',
    'Professional, knowledgeable, and the results speak for themselves.',
    'My friends keep asking what I did differently. Thank you!',
    'Top-notch care and beautiful results.',
  ];

  const seed = names.map((name, i) => {
    const isCompleted = statuses[i % statuses.length] === 'completed';
    const rating = isCompleted ? [5, 5, 5, 5, 4, 4, 4, 5, 3, 5][i % 10] : null;
    return {
      id: `REV-${1000 + i}`,
      patientId: `PAT-${1000 + i}`,
      patientName: name,
      service: services[i % services.length],
      platform: platforms[i % platforms.length],
      status: isCompleted ? 'completed' : 'pending',
      rating,
      comment: isCompleted ? comments[i % comments.length] : null,
      requestSentAt: d(-Math.floor(3 + Math.random() * 45)),
      completedAt: isCompleted ? d(-Math.floor(1 + Math.random() * 30)) : null,
      appointmentDate: d(-Math.floor(5 + Math.random() * 50)),
    };
  });
  setReviews(seed);
}

export default function Reviews() {
  const s = useStyles();
  const [, setTick] = useState(0);
  useEffect(() => subscribe(() => setTick(t => t + 1)), []);
  useEffect(() => { seedReviews(); }, []);

  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState(null);

  const settings = getSettings();
  const businessName = settings.businessName || 'Remedy Pilates & Barre';

  const reviews = getReviews();

  // KPIs
  const completed = reviews.filter(r => r.status === 'completed');
  const pending = reviews.filter(r => r.status === 'pending');
  const totalReviews = completed.length;
  const avgRating = completed.length > 0
    ? (completed.reduce((sum, r) => sum + (r.rating || 0), 0) / completed.length).toFixed(1)
    : '—';
  const now = new Date();
  const thisMonth = completed.filter(r => {
    const d = new Date(r.completedAt);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;
  const responseRate = reviews.length > 0 ? Math.round((completed.length / reviews.length) * 100) : 0;

  // Filter
  const filtered = reviews.filter(r => {
    if (filter === 'pending' && r.status !== 'pending') return false;
    if (filter === 'completed' && r.status !== 'completed') return false;
    if (filter === 'google' && r.platform !== 'Google') return false;
    if (filter === 'yelp' && r.platform !== 'Yelp') return false;
    if (search) {
      const q = search.toLowerCase();
      return r.patientName?.toLowerCase().includes(q) || r.service?.toLowerCase().includes(q);
    }
    return true;
  });

  const sendRequest = (id) => {
    const all = getReviews().map(r => r.id === id ? { ...r, status: 'pending', requestSentAt: new Date().toISOString() } : r);
    setReviews(all);
    const rev = all.find(r => r.id === id);
    setToast(`Review request sent to ${rev?.patientName}`);
    setTimeout(() => setToast(null), 3000);
    setTick(t => t + 1);
  };

  const simulateComplete = (id) => {
    const rating = [4, 5, 5, 5, 4][Math.floor(Math.random() * 5)];
    const comments = [
      'Great experience! Highly recommend.',
      'Love my results. The staff is amazing!',
      'Professional and caring team. Will be back!',
      'Best studio I have ever been to.',
    ];
    const all = getReviews().map(r => r.id === id ? {
      ...r,
      status: 'completed',
      rating,
      comment: comments[Math.floor(Math.random() * comments.length)],
      completedAt: new Date().toISOString(),
    } : r);
    setReviews(all);
    setToast('Review received!');
    setTimeout(() => setToast(null), 3000);
    setTick(t => t + 1);
  };

  const Stars = ({ rating, size = 16 }) => (
    <span style={{ display: 'inline-flex', gap: 1 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <span key={i} style={{ fontSize: size, color: i <= rating ? '#F59E0B' : '#E5E5E5', lineHeight: 1 }}>
          {'\u2605'}
        </span>
      ))}
    </span>
  );

  const smsTemplate = `Thanks for visiting ${businessName}! Love your results? Leave us a quick review: https://g.page/${businessName.replace(/\s/g, '').toLowerCase()}/review`;

  return (
    <div>
      <style>{`
        @media (max-width: 768px) {
          .rev-kpi-grid {
            grid-template-columns: 1fr 1fr !important;
          }
          .rev-card {
            flex-wrap: wrap !important;
            gap: 10px !important;
          }
          .rev-card-actions {
            flex-direction: row !important;
            width: 100% !important;
          }
        }
        @media (max-width: 480px) {
          .rev-kpi-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 20, right: 20, zIndex: 999,
          ...s.cardStyle, padding: '12px 20px',
          background: s.accent, color: s.accentText,
          font: `500 13px ${s.FONT}`, borderRadius: 10,
          boxShadow: s.shadowLg,
        }}>{toast}</div>
      )}

      <div style={{ marginBottom: 24 }}>
        <h1 style={{ font: `600 26px ${s.FONT}`, color: s.text, marginBottom: 4 }}>Reviews</h1>
        <p style={{ font: `400 14px ${s.FONT}`, color: s.text2 }}>Track review requests, ratings, and response rates across platforms</p>
      </div>

      {/* KPIs */}
      <div className="rev-kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Total Reviews', value: totalReviews, color: s.text },
          { label: 'Average Rating', value: avgRating, color: Number(avgRating) >= 4.5 ? s.success : Number(avgRating) >= 3.5 ? s.warning : s.danger, extra: completed.length > 0 ? <Stars rating={Math.round(Number(avgRating))} size={12} /> : null },
          { label: 'Reviews This Month', value: thisMonth, color: s.accent },
          { label: 'Response Rate', value: `${responseRate}%`, color: responseRate >= 70 ? s.success : responseRate >= 40 ? s.warning : s.danger },
        ].map(k => (
          <div key={k.label} style={{ ...s.cardStyle, padding: '16px 20px' }}>
            <div style={{ font: `400 10px ${s.MONO}`, textTransform: 'uppercase', letterSpacing: 1, color: s.text3, marginBottom: 6 }}>{k.label}</div>
            <div style={{ font: `600 24px ${s.FONT}`, color: k.color }}>{k.value}</div>
            {k.extra && <div style={{ marginTop: 4 }}>{k.extra}</div>}
          </div>
        ))}
      </div>

      {/* SMS Template */}
      <div style={{ ...s.cardStyle, padding: '16px 20px', marginBottom: 24 }}>
        <div style={{ ...s.label }}>Review Request Template (SMS)</div>
        <div style={{
          padding: '12px 16px', background: s.accentLight, borderRadius: 8,
          font: `400 13px ${s.FONT}`, color: s.text2, lineHeight: 1.6,
          border: `1px dashed ${s.border}`,
        }}>
          {smsTemplate}
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search clients or services..." style={{ ...s.input, maxWidth: 260 }} />
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {[['all', 'All'], ['pending', 'Pending'], ['completed', 'Completed'], ['google', 'Google'], ['yelp', 'Yelp']].map(([id, label]) => (
            <button key={id} onClick={() => setFilter(id)} style={{
              ...s.pill, padding: '7px 14px', fontSize: 12,
              background: filter === id ? s.accent : 'transparent',
              color: filter === id ? s.accentText : s.text2,
              border: filter === id ? `1px solid ${s.accent}` : '1px solid #E5E5E5',
            }}>{label}</button>
          ))}
        </div>
      </div>

      {/* Reviews List */}
      <div style={{ display: 'grid', gap: 8 }}>
        {filtered.map(rev => (
          <div key={rev.id} style={{
            ...s.cardStyle, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16,
            borderLeftWidth: 3, borderLeftStyle: 'solid',
            borderLeftColor: rev.status === 'completed'
              ? (rev.rating >= 4 ? s.success : rev.rating >= 3 ? s.warning : s.danger)
              : s.text3,
          }}>
            {/* Avatar */}
            <div style={{
              width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
              background: rev.status === 'completed' ? '#F0FDF4' : '#F8F8F8',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              font: `500 14px ${s.FONT}`, color: rev.status === 'completed' ? s.success : s.text2,
            }}>
              {rev.patientName?.split(' ').map(n => n[0]).join('')}
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                <span style={{ font: `500 14px ${s.FONT}`, color: s.text }}>{rev.patientName}</span>
                <span style={{
                  padding: '2px 8px', borderRadius: 100, font: `500 9px ${s.FONT}`, textTransform: 'uppercase',
                  background: rev.platform === 'Google' ? '#EFF6FF' : '#FEF2F2',
                  color: rev.platform === 'Google' ? '#2563EB' : '#DC2626',
                }}>{rev.platform}</span>
                <span style={{
                  padding: '2px 8px', borderRadius: 100, font: `500 9px ${s.FONT}`, textTransform: 'uppercase',
                  background: rev.status === 'completed' ? '#F0FDF4' : '#FFFBEB',
                  color: rev.status === 'completed' ? s.success : s.warning,
                }}>{rev.status}</span>
              </div>
              <div style={{ font: `400 13px ${s.FONT}`, color: s.text2 }}>{rev.service}</div>
              {rev.status === 'completed' && (
                <div style={{ marginTop: 4 }}>
                  <Stars rating={rev.rating} size={14} />
                  {rev.comment && (
                    <div style={{ font: `400 12px ${s.FONT}`, color: s.text3, marginTop: 2, fontStyle: 'italic' }}>
                      "{rev.comment}"
                    </div>
                  )}
                </div>
              )}
              <div style={{ font: `400 11px ${s.FONT}`, color: s.text3, marginTop: 2 }}>
                Requested: {rev.requestSentAt ? new Date(rev.requestSentAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
                {rev.completedAt && ` — Reviewed: ${new Date(rev.completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0 }}>
              {rev.status === 'pending' && (
                <>
                  <button onClick={() => sendRequest(rev.id)} style={{ ...s.pillAccent, padding: '6px 12px', fontSize: 11 }}>Send Review Request</button>
                  <button onClick={() => simulateComplete(rev.id)} style={{ ...s.pillGhost, padding: '4px 10px', fontSize: 10 }}>Simulate Review</button>
                </>
              )}
              {rev.status === 'completed' && rev.rating && (
                <div style={{ font: `600 18px ${s.MONO}`, color: rev.rating >= 4 ? s.success : rev.rating >= 3 ? s.warning : s.danger, textAlign: 'right' }}>
                  {rev.rating}.0
                </div>
              )}
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div style={{ ...s.cardStyle, padding: 48, textAlign: 'center', font: `400 14px ${s.FONT}`, color: s.text3 }}>
            {filter === 'all' ? 'No reviews yet — send your first review request!' : 'No reviews match this filter'}
          </div>
        )}
      </div>
    </div>
  );
}
