import { useState, useEffect } from 'react';
import { useStyles } from '../theme';
import { subscribe } from '../data/store';

const STORAGE_KEY = 'rp_referrals';
const SETTINGS_KEY = 'rp_referral_settings';

function getReferrals() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; } catch { return []; }
}
function setReferrals(data) { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }

function getRefSettings() {
  try { return JSON.parse(localStorage.getItem(SETTINGS_KEY)) || { referrerCredit: 50, friendCredit: 50 }; } catch { return { referrerCredit: 50, friendCredit: 50 }; }
}
function setRefSettings(data) { localStorage.setItem(SETTINGS_KEY, JSON.stringify(data)); }

function getPatients() {
  try { return JSON.parse(localStorage.getItem('rp_clients')) || []; } catch { return []; }
}

function seedReferrals() {
  if (localStorage.getItem('rp_referrals_seeded')) return;
  const clients = getPatients();
  if (clients.length < 12) return;

  const now = new Date();
  const d = (offset) => { const dt = new Date(now); dt.setDate(dt.getDate() + offset); return dt.toISOString().slice(0, 10); };

  const seed = [
    { id: 'REF-1', referrerId: clients[0].id, referrerName: `${clients[0].firstName} ${clients[0].lastName}`, code: `REF-${clients[0].firstName.toUpperCase()}-1000`, friendName: `${clients[10].firstName} ${clients[10].lastName}`, friendId: clients[10].id, friendEmail: clients[10].email, status: 'credited', referredDate: d(-45), bookedDate: d(-38), creditedDate: d(-38), referrerCredit: 50, friendCredit: 50 },
    { id: 'REF-2', referrerId: clients[0].id, referrerName: `${clients[0].firstName} ${clients[0].lastName}`, code: `REF-${clients[0].firstName.toUpperCase()}-1000`, friendName: `${clients[11].firstName} ${clients[11].lastName}`, friendId: clients[11].id, friendEmail: clients[11].email, status: 'credited', referredDate: d(-30), bookedDate: d(-24), creditedDate: d(-24), referrerCredit: 50, friendCredit: 50 },
    { id: 'REF-3', referrerId: clients[0].id, referrerName: `${clients[0].firstName} ${clients[0].lastName}`, code: `REF-${clients[0].firstName.toUpperCase()}-1000`, friendName: 'Taylor Swift', friendId: null, friendEmail: 'taylor@example.com', status: 'pending', referredDate: d(-5), bookedDate: null, creditedDate: null, referrerCredit: 50, friendCredit: 50 },
    { id: 'REF-4', referrerId: clients[1].id, referrerName: `${clients[1].firstName} ${clients[1].lastName}`, code: `REF-${clients[1].firstName.toUpperCase()}-1001`, friendName: `${clients[12].firstName} ${clients[12].lastName}`, friendId: clients[12].id, friendEmail: clients[12].email, status: 'credited', referredDate: d(-60), bookedDate: d(-52), creditedDate: d(-52), referrerCredit: 50, friendCredit: 50 },
    { id: 'REF-5', referrerId: clients[1].id, referrerName: `${clients[1].firstName} ${clients[1].lastName}`, code: `REF-${clients[1].firstName.toUpperCase()}-1001`, friendName: `${clients[13].firstName} ${clients[13].lastName}`, friendId: clients[13].id, friendEmail: clients[13].email, status: 'booked', referredDate: d(-10), bookedDate: d(-3), creditedDate: null, referrerCredit: 50, friendCredit: 50 },
    { id: 'REF-6', referrerId: clients[2].id, referrerName: `${clients[2].firstName} ${clients[2].lastName}`, code: `REF-${clients[2].firstName.toUpperCase()}-1002`, friendName: `${clients[14].firstName} ${clients[14].lastName}`, friendId: clients[14].id, friendEmail: clients[14].email, status: 'credited', referredDate: d(-90), bookedDate: d(-82), creditedDate: d(-82), referrerCredit: 50, friendCredit: 50 },
    { id: 'REF-7', referrerId: clients[3].id, referrerName: `${clients[3].firstName} ${clients[3].lastName}`, code: `REF-${clients[3].firstName.toUpperCase()}-1003`, friendName: 'Jordan Lee', friendId: null, friendEmail: 'jordan@example.com', status: 'pending', referredDate: d(-2), bookedDate: null, creditedDate: null, referrerCredit: 50, friendCredit: 50 },
    { id: 'REF-8', referrerId: clients[4].id, referrerName: `${clients[4].firstName} ${clients[4].lastName}`, code: `REF-${clients[4].firstName.toUpperCase()}-1004`, friendName: `${clients[15].firstName} ${clients[15].lastName}`, friendId: clients[15].id, friendEmail: clients[15].email, status: 'booked', referredDate: d(-14), bookedDate: d(-7), creditedDate: null, referrerCredit: 50, friendCredit: 50 },
    { id: 'REF-9', referrerId: clients[5].id, referrerName: `${clients[5].firstName} ${clients[5].lastName}`, code: `REF-${clients[5].firstName.toUpperCase()}-1005`, friendName: `${clients[16].firstName} ${clients[16].lastName}`, friendId: clients[16].id, friendEmail: clients[16].email, status: 'credited', referredDate: d(-40), bookedDate: d(-33), creditedDate: d(-33), referrerCredit: 50, friendCredit: 50 },
    { id: 'REF-10', referrerId: clients[6].id, referrerName: `${clients[6].firstName} ${clients[6].lastName}`, code: `REF-${clients[6].firstName.toUpperCase()}-1006`, friendName: 'Morgan Blake', friendId: null, friendEmail: 'morgan@example.com', status: 'pending', referredDate: d(-1), bookedDate: null, creditedDate: null, referrerCredit: 50, friendCredit: 50 },
  ];

  setReferrals(seed);
  localStorage.setItem('rp_referrals_seeded', 'true');
}

export default function Referrals() {
  const s = useStyles();
  const [, setTick] = useState(0);
  useEffect(() => subscribe(() => setTick(t => t + 1)), []);
  useEffect(() => { seedReferrals(); }, []);

  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [showGenerate, setShowGenerate] = useState(false);
  const [settings, setSettings] = useState(getRefSettings);
  const [generateSearch, setGenerateSearch] = useState('');

  const referrals = getReferrals();
  const clients = getPatients();

  // Filter referrals
  const filtered = referrals.filter(r => {
    if (filter === 'pending' && r.status !== 'pending') return false;
    if (filter === 'booked' && r.status !== 'booked') return false;
    if (filter === 'credited' && r.status !== 'credited') return false;
    if (search) {
      const q = search.toLowerCase();
      return r.referrerName?.toLowerCase().includes(q) || r.friendName?.toLowerCase().includes(q) || r.code?.toLowerCase().includes(q);
    }
    return true;
  });

  // KPIs
  const totalReferrals = referrals.length;
  const pendingCount = referrals.filter(r => r.status === 'pending').length;
  const bookedCount = referrals.filter(r => r.status === 'booked' || r.status === 'credited').length;
  const conversionRate = totalReferrals > 0 ? Math.round((bookedCount / totalReferrals) * 100) : 0;
  const totalCredits = referrals.filter(r => r.status === 'credited').reduce((sum, r) => sum + (r.referrerCredit || 0) + (r.friendCredit || 0), 0);

  // Top referrers leaderboard
  const referrerMap = {};
  referrals.forEach(r => {
    if (!referrerMap[r.referrerId]) referrerMap[r.referrerId] = { name: r.referrerName, count: 0, credited: 0 };
    referrerMap[r.referrerId].count++;
    if (r.status === 'credited') referrerMap[r.referrerId].credited += r.referrerCredit || 0;
  });
  const leaderboard = Object.entries(referrerMap)
    .map(([id, data]) => ({ id, ...data }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Actions
  const markBooked = (id) => {
    const all = getReferrals().map(r => r.id === id ? { ...r, status: 'booked', bookedDate: new Date().toISOString().slice(0, 10) } : r);
    setReferrals(all);
    setTick(t => t + 1);
  };

  const markCredited = (id) => {
    const cfg = getRefSettings();
    const all = getReferrals().map(r => r.id === id ? { ...r, status: 'credited', creditedDate: new Date().toISOString().slice(0, 10), referrerCredit: cfg.referrerCredit, friendCredit: cfg.friendCredit } : r);
    setReferrals(all);
    setTick(t => t + 1);
  };

  const generateLink = (patient) => {
    const code = `REF-${patient.firstName.toUpperCase()}-${patient.id.split('-')[1]}`;
    navigator.clipboard?.writeText(`https://pilatesstudio.com/refer/${code}`);
    setShowGenerate(false);
    setGenerateSearch('');
  };

  const saveSettings = () => {
    setRefSettings(settings);
    setShowSettings(false);
  };

  const filteredPatients = clients.filter(p => {
    if (!generateSearch) return true;
    const q = generateSearch.toLowerCase();
    return `${p.firstName} ${p.lastName}`.toLowerCase().includes(q);
  }).slice(0, 8);

  const statusColor = (status) => {
    if (status === 'credited') return s.success;
    if (status === 'booked') return s.accent;
    return s.warning;
  };

  const statusBg = (status) => {
    if (status === 'credited') return '#F0FDF4';
    if (status === 'booked') return s.accentLight;
    return '#FFFBEB';
  };

  return (
    <div>
      <style>{`
        @media (max-width: 768px) {
          .ref-kpi-grid {
            grid-template-columns: 1fr 1fr !important;
          }
          .ref-header {
            flex-wrap: wrap !important;
          }
          .ref-header-btns {
            flex-wrap: wrap !important;
          }
          .ref-table-wrap {
            overflow-x: auto !important;
          }
        }
        @media (max-width: 480px) {
          .ref-kpi-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
      <div className="ref-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ font: `600 26px ${s.FONT}`, color: s.text, marginBottom: 4 }}>Referrals</h1>
          <p style={{ font: `400 14px ${s.FONT}`, color: s.text2 }}>Track referrals, reward loyalty, and grow your client base</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setShowSettings(true)} style={s.pillGhost}>Settings</button>
          <button onClick={() => setShowGenerate(true)} style={s.pillOutline}>View Client Links</button>
        </div>
      </div>

      {/* KPIs */}
      <div className="ref-kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Total Referrals', value: totalReferrals, color: s.text },
          { label: 'Pending', value: pendingCount, color: pendingCount > 0 ? s.warning : s.success },
          { label: 'Conversion Rate', value: `${conversionRate}%`, color: conversionRate >= 50 ? s.success : s.warning },
          { label: 'Credits Issued', value: `$${totalCredits.toLocaleString()}`, color: s.success },
        ].map(k => (
          <div key={k.label} style={{ ...s.cardStyle, padding: '16px 20px' }}>
            <div style={{ font: `400 10px ${s.MONO}`, textTransform: 'uppercase', letterSpacing: 1, color: s.text3, marginBottom: 6 }}>{k.label}</div>
            <div style={{ font: `600 24px ${s.FONT}`, color: k.color }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Leaderboard */}
      <div style={{ ...s.cardStyle, padding: 20, marginBottom: 24 }}>
        <div style={{ font: `600 15px ${s.FONT}`, color: s.text, marginBottom: 14 }}>Top Referrers</div>
        <div style={{ display: 'flex', gap: 16, overflowX: 'auto' }}>
          {leaderboard.map((ref, i) => (
            <div key={ref.id} style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 200, padding: '10px 14px', background: i === 0 ? s.accentLight : '#F8F8F8', borderRadius: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: i === 0 ? s.accent : '#E5E5E5', color: i === 0 ? s.accentText : s.text2, display: 'flex', alignItems: 'center', justifyContent: 'center', font: `600 13px ${s.FONT}`, flexShrink: 0 }}>
                {i + 1}
              </div>
              <div>
                <div style={{ font: `500 13px ${s.FONT}`, color: s.text }}>{ref.name}</div>
                <div style={{ font: `400 11px ${s.FONT}`, color: s.text3 }}>{ref.count} referral{ref.count !== 1 ? 's' : ''} &middot; ${ref.credited} earned</div>
              </div>
            </div>
          ))}
          {leaderboard.length === 0 && <div style={{ font: `400 13px ${s.FONT}`, color: s.text3 }}>No referrals yet</div>}
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search referrals..." style={{ ...s.input, maxWidth: 260 }} />
        <div style={{ display: 'flex', gap: 6 }}>
          {[['all', 'All'], ['pending', 'Pending'], ['booked', 'Booked'], ['credited', 'Credited']].map(([id, label]) => (
            <button key={id} onClick={() => setFilter(id)} style={{
              ...s.pill, padding: '7px 14px', fontSize: 12,
              background: filter === id ? s.accent : 'transparent',
              color: filter === id ? s.accentText : s.text2,
              border: filter === id ? `1px solid ${s.accent}` : '1px solid #E5E5E5',
            }}>{label}</button>
          ))}
        </div>
      </div>

      {/* Referral Table */}
      <div className="ref-table-wrap" style={{ ...s.tableWrap, overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', font: `400 13px ${s.FONT}` }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #E5E5E5' }}>
              {['Referrer', 'Code', 'Friend', 'Referred', 'Booked', 'Status', 'Credits', ''].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', font: `500 10px ${s.MONO}`, textTransform: 'uppercase', letterSpacing: 1, color: s.text3 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(ref => (
              <tr key={ref.id} style={{ borderBottom: '1px solid #F0F0F0' }}>
                <td style={{ padding: '12px 16px', font: `500 13px ${s.FONT}`, color: s.text }}>{ref.referrerName}</td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ font: `400 12px ${s.MONO}`, color: s.text2, background: '#F5F5F5', padding: '3px 8px', borderRadius: 6 }}>{ref.code}</span>
                </td>
                <td style={{ padding: '12px 16px', color: s.text }}>{ref.friendName}</td>
                <td style={{ padding: '12px 16px', color: s.text2, font: `400 12px ${s.FONT}` }}>
                  {ref.referredDate ? new Date(ref.referredDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
                </td>
                <td style={{ padding: '12px 16px', color: s.text2, font: `400 12px ${s.FONT}` }}>
                  {ref.bookedDate ? new Date(ref.bookedDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ padding: '3px 10px', borderRadius: 100, font: `500 11px ${s.FONT}`, textTransform: 'capitalize', background: statusBg(ref.status), color: statusColor(ref.status) }}>{ref.status}</span>
                </td>
                <td style={{ padding: '12px 16px' }}>
                  {ref.status === 'credited' ? (
                    <span style={{ font: `500 13px ${s.FONT}`, color: s.success }}>${(ref.referrerCredit || 0) + (ref.friendCredit || 0)}</span>
                  ) : (
                    <span style={{ font: `400 12px ${s.FONT}`, color: s.text3 }}>—</span>
                  )}
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {ref.status === 'pending' && (
                      <button onClick={() => markBooked(ref.id)} style={{ ...s.pillOutline, padding: '4px 10px', fontSize: 11 }}>Mark Booked</button>
                    )}
                    {ref.status === 'booked' && (
                      <button onClick={() => markCredited(ref.id)} style={{ ...s.pillAccent, padding: '4px 10px', fontSize: 11 }}>Apply Credit</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div style={{ padding: 48, textAlign: 'center', font: `400 14px ${s.FONT}`, color: s.text3 }}>
            {filter === 'all' ? 'No referrals yet — generate a link to get started' : 'No referrals match this filter'}
          </div>
        )}
      </div>

      {/* Generate Link Modal */}
      {showGenerate && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }} onClick={() => setShowGenerate(false)}>
          <div onClick={e => e.stopPropagation()} style={{ ...s.cardStyle, padding: 28, width: 420, maxHeight: '80vh', overflow: 'auto' }}>
            <div style={{ font: `600 18px ${s.FONT}`, color: s.text, marginBottom: 4 }}>Generate Referral Link</div>
            <div style={{ font: `400 13px ${s.FONT}`, color: s.text2, marginBottom: 16 }}>Select a client to generate their unique referral link</div>
            <input value={generateSearch} onChange={e => setGenerateSearch(e.target.value)} placeholder="Search clients..." style={{ ...s.input, marginBottom: 12 }} />
            <div style={{ display: 'grid', gap: 6 }}>
              {filteredPatients.map(p => {
                const code = `REF-${p.firstName.toUpperCase()}-${p.id.split('-')[1]}`;
                return (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 10, border: '1px solid #E5E5E5', cursor: 'pointer' }}>
                    <div>
                      <div style={{ font: `500 13px ${s.FONT}`, color: s.text }}>{p.firstName} {p.lastName}</div>
                      <div style={{ font: `400 11px ${s.MONO}`, color: s.text3 }}>{code}</div>
                    </div>
                    <button onClick={() => generateLink(p)} style={{ ...s.pillAccent, padding: '5px 12px', fontSize: 11 }}>Copy Link</button>
                  </div>
                );
              })}
            </div>
            <button onClick={() => setShowGenerate(false)} style={{ ...s.pillGhost, marginTop: 14, width: '100%' }}>Close</button>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }} onClick={() => setShowSettings(false)}>
          <div onClick={e => e.stopPropagation()} style={{ ...s.cardStyle, padding: 28, width: 380 }}>
            <div style={{ font: `600 18px ${s.FONT}`, color: s.text, marginBottom: 16 }}>Referral Settings</div>
            <div style={{ marginBottom: 16 }}>
              <label style={s.label}>Referrer Credit ($)</label>
              <input type="number" value={settings.referrerCredit} onChange={e => setSettings({ ...settings, referrerCredit: parseInt(e.target.value) || 0 })} style={s.input} />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={s.label}>Friend Credit ($)</label>
              <input type="number" value={settings.friendCredit} onChange={e => setSettings({ ...settings, friendCredit: parseInt(e.target.value) || 0 })} style={s.input} />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={saveSettings} style={{ ...s.pillAccent, flex: 1 }}>Save</button>
              <button onClick={() => setShowSettings(false)} style={{ ...s.pillGhost, flex: 1 }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
