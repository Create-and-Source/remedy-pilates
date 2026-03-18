import { useState, useEffect } from 'react';
import { useStyles } from '../theme';
import { getPatients, addPatient, updatePatient, deletePatient, getAppointments, getServices, subscribe } from '../data/store';

const fmt = (cents) => `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 0 })}`;

/* --- inject patient page keyframes once --- */
const PAT_ANIM_ID = 'patients-premium-anims';
if (!document.getElementById(PAT_ANIM_ID)) {
  const sheet = document.createElement('style');
  sheet.id = PAT_ANIM_ID;
  sheet.textContent = `
    @keyframes patFadeInUp {
      from { opacity: 0; transform: translateY(14px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes patSlideIn {
      from { opacity: 0; transform: translateX(20px); }
      to   { opacity: 1; transform: translateX(0); }
    }
    .pat-card-hover {
      transition: all 0.25s cubic-bezier(0.16,1,0.3,1) !important;
    }
    .pat-card-hover:hover {
      transform: translateY(-3px) !important;
      box-shadow: 0 12px 40px rgba(var(--accent-rgb), 0.1), 0 4px 12px rgba(0,0,0,0.04) !important;
    }
    .pat-row-hover {
      transition: background 0.15s ease !important;
    }
    .pat-row-hover:hover {
      background: rgba(var(--accent-rgb), 0.03) !important;
    }
    .pat-filter-pill {
      transition: all 0.2s cubic-bezier(0.16,1,0.3,1) !important;
    }
    .pat-filter-pill:hover {
      transform: translateY(-1px);
    }
  `;
  document.head.appendChild(sheet);
}

const TIER_BADGE = {
  None: null,
  Silver: { bg: '#F1F5F9', color: '#64748B', border: '#CBD5E1' },
  Gold: { bg: '#FFFBEB', color: '#B8960C', border: '#FDE68A' },
  Platinum: { bg: '#F5F3FF', color: '#7C3AED', border: '#DDD6FE' },
};

export default function Patients() {
  const s = useStyles();
  const [, setTick] = useState(0);
  useEffect(() => subscribe(() => setTick(t => t + 1)), []);

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [sort, setSort] = useState('lastVisit');
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', dob: '', gender: 'Female', allergies: '', notes: '', membershipTier: 'None' });
  const [viewMode, setViewMode] = useState('cards'); // 'cards' | 'table'
  const [detail, setDetail] = useState(null);

  const patients = getPatients();
  const appointments = getAppointments();
  const services = getServices();

  const filtered = patients.filter(p => {
    const q = search.toLowerCase();
    const nameMatch = `${p.firstName} ${p.lastName}`.toLowerCase().includes(q) || p.email?.toLowerCase().includes(q) || p.phone?.includes(q);
    if (!nameMatch) return false;
    if (filter === 'All') return true;
    return p.membershipTier === filter;
  }).sort((a, b) => {
    if (sort === 'lastVisit') return (b.lastVisit || '').localeCompare(a.lastVisit || '');
    if (sort === 'name') return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
    if (sort === 'spent') return b.totalSpent - a.totalSpent;
    if (sort === 'visits') return b.visitCount - a.visitCount;
    return 0;
  });

  const handleSave = () => {
    if (!form.firstName.trim() || !form.lastName.trim()) return;
    if (selected) {
      updatePatient(selected.id, form);
    } else {
      addPatient({ ...form, totalSpent: 0, visitCount: 0, lastVisit: null });
    }
    setShowForm(false);
    setSelected(null);
    setForm({ firstName: '', lastName: '', email: '', phone: '', dob: '', gender: 'Female', allergies: '', notes: '', membershipTier: 'None' });
  };

  const handleEdit = (p) => {
    setForm({ firstName: p.firstName, lastName: p.lastName, email: p.email, phone: p.phone, dob: p.dob || '', gender: p.gender || 'Female', allergies: p.allergies || '', notes: p.notes || '', membershipTier: p.membershipTier || 'None' });
    setSelected(p);
    setShowForm(true);
  };

  const handleDelete = (id) => {
    if (confirm('Delete this patient?')) {
      deletePatient(id);
      if (selected?.id === id) { setSelected(null); setShowForm(false); }
      if (detail?.id === id) setDetail(null);
    }
  };

  const patientAppts = (patientId) => appointments.filter(a => a.patientId === patientId).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);

  // Stats
  const thisMonth = new Date().toISOString().slice(0, 7);
  const newThisMonth = patients.filter(p => p.createdAt?.startsWith(thisMonth)).length;
  const avgSpend = patients.length > 0 ? Math.round(patients.reduce((sum, p) => sum + p.totalSpent, 0) / patients.length) : 0;
  const activeMembers = patients.filter(p => p.membershipTier && p.membershipTier !== 'None').length;

  const glass = {
    background: 'rgba(255,255,255,0.6)',
    backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid rgba(255,255,255,0.65)',
    borderRadius: 18,
    boxShadow: '0 4px 24px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)',
    transition: 'all 0.3s cubic-bezier(0.16,1,0.3,1)',
  };

  const filterOptions = ['All', 'None', 'Silver', 'Gold', 'Platinum'];
  const sortOptions = [
    { value: 'lastVisit', label: 'Last Visit' },
    { value: 'name', label: 'Name' },
    { value: 'spent', label: 'Top Spenders' },
    { value: 'visits', label: 'Most Visits' },
  ];

  return (
    <div>
      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12,
        animation: 'patFadeInUp 0.4s cubic-bezier(0.16,1,0.3,1) both',
      }}>
        <div>
          <h1 style={{ font: `600 26px ${s.FONT}`, color: s.text, marginBottom: 4, letterSpacing: '-0.3px' }}>Patients</h1>
          <p style={{ font: `400 14px ${s.FONT}`, color: s.text2 }}>{patients.length} total patients</p>
        </div>
        <button onClick={() => { setSelected(null); setForm({ firstName: '', lastName: '', email: '', phone: '', dob: '', gender: 'Female', allergies: '', notes: '', membershipTier: 'None' }); setShowForm(true); }} style={s.pillAccent}>
          + New Patient
        </button>
      </div>

      {/* ═══ STATS ROW ═══ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Total Patients', value: patients.length, icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={s.accent} strokeWidth="1.5" strokeLinecap="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          )},
          { label: 'New This Month', value: newThisMonth, icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={s.success} strokeWidth="1.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19" /><polyline points="19 12 12 19 5 12" />
            </svg>
          )},
          { label: 'Avg. Spend', value: fmt(avgSpend), icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={s.accent} strokeWidth="1.5" strokeLinecap="round">
              <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          )},
          { label: 'Active Members', value: activeMembers, icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={s.accent} strokeWidth="1.5" strokeLinecap="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          )},
        ].map((k, idx) => (
          <div key={k.label} style={{
            ...glass, padding: '18px 20px',
            animation: `patFadeInUp 0.4s cubic-bezier(0.16,1,0.3,1) ${(idx + 1) * 60}ms backwards`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 9,
                background: s.accentLight, display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {k.icon}
              </div>
              <div style={{ font: `500 10px ${s.MONO}`, textTransform: 'uppercase', letterSpacing: 1.5, color: s.text3 }}>{k.label}</div>
            </div>
            <div style={{ font: `600 24px ${s.FONT}`, color: s.text, letterSpacing: '-0.3px' }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* ═══ SEARCH / FILTER BAR ═══ */}
      <div style={{
        ...glass, padding: '14px 20px', marginBottom: 20,
        display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap',
        animation: 'patFadeInUp 0.4s cubic-bezier(0.16,1,0.3,1) 300ms backwards',
      }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: '1 1 240px', maxWidth: 360 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={s.text3} strokeWidth="2" strokeLinecap="round"
            style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }}>
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search patients..."
            style={{ ...s.input, paddingLeft: 40, background: 'rgba(255,255,255,0.5)', borderRadius: 100 }} />
        </div>

        {/* Filter pills */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {filterOptions.map(f => (
            <button key={f} className="pat-filter-pill" onClick={() => setFilter(f)} style={{
              padding: '7px 16px', borderRadius: 100, border: 'none', cursor: 'pointer',
              font: `500 12px ${s.FONT}`,
              background: filter === f ? s.accent : 'rgba(255,255,255,0.6)',
              color: filter === f ? s.accentText : s.text2,
              boxShadow: filter === f ? `0 2px 10px ${s.accent}30` : '0 1px 4px rgba(0,0,0,0.04)',
              backdropFilter: 'blur(8px)',
            }}>
              {f === 'None' ? 'Non-Members' : f === 'All' ? 'All' : f}
            </button>
          ))}
        </div>

        {/* Sort */}
        <select value={sort} onChange={e => setSort(e.target.value)} style={{
          ...s.input, width: 'auto', minWidth: 130, cursor: 'pointer',
          borderRadius: 100, padding: '9px 16px', background: 'rgba(255,255,255,0.5)',
        }}>
          {sortOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>

        {/* View toggle */}
        <div style={{ display: 'flex', gap: 0, background: 'rgba(0,0,0,0.04)', borderRadius: 10, overflow: 'hidden', flexShrink: 0 }}>
          {[['cards', 'Cards'], ['table', 'Table']].map(([v, l]) => (
            <button key={v} onClick={() => setViewMode(v)} style={{
              padding: '8px 16px', background: viewMode === v ? 'rgba(255,255,255,0.8)' : 'transparent', border: 'none',
              font: `500 12px ${s.FONT}`, color: viewMode === v ? s.text : s.text3, cursor: 'pointer',
              borderRadius: viewMode === v ? 10 : 0, boxShadow: viewMode === v ? s.shadow : 'none',
              backdropFilter: viewMode === v ? 'blur(8px)' : 'none',
            }}>{l}</button>
          ))}
        </div>
      </div>

      {/* ═══ MAIN CONTENT ═══ */}
      <div className="patients-main-grid" style={{ display: 'grid', gridTemplateColumns: detail ? '1fr 380px' : '1fr', gap: 20 }}>

        {/* ═══ CARD VIEW ═══ */}
        {viewMode === 'cards' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
            {filtered.map((p, idx) => {
              const tier = TIER_BADGE[p.membershipTier || 'None'];
              const isActive = detail?.id === p.id;
              return (
                <div key={p.id} className="pat-card-hover" onClick={() => setDetail(p)} style={{
                  ...glass, padding: '22px 20px', cursor: 'pointer',
                  borderLeft: isActive ? `3px solid ${s.accent}` : '3px solid transparent',
                  background: isActive ? s.accentLight : glass.background,
                  animation: `patFadeInUp 0.4s cubic-bezier(0.16,1,0.3,1) ${360 + idx * 40}ms backwards`,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                    {/* Avatar */}
                    <div style={{
                      width: 48, height: 48, borderRadius: '50%',
                      background: `linear-gradient(135deg, ${s.accentLight}, ${s.accent}18)`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      font: `600 15px ${s.FONT}`, color: s.accent, flexShrink: 0,
                      border: `2px solid ${s.accent}20`,
                    }}>
                      {p.firstName[0]}{p.lastName[0]}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ font: `600 15px ${s.FONT}`, color: s.text, marginBottom: 2 }}>{p.firstName} {p.lastName}</div>
                      <div style={{ font: `400 12px ${s.FONT}`, color: s.text3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.email}</div>
                    </div>
                    {tier && (
                      <span style={{
                        padding: '3px 10px', borderRadius: 100,
                        font: `600 10px ${s.FONT}`, textTransform: 'uppercase', letterSpacing: 0.5,
                        background: tier.bg, color: tier.color, border: `1px solid ${tier.border}`,
                        flexShrink: 0,
                      }}>{p.membershipTier}</span>
                    )}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                    <div>
                      <div style={{ font: `500 9px ${s.MONO}`, textTransform: 'uppercase', letterSpacing: 1, color: s.text3, marginBottom: 3 }}>Visits</div>
                      <div style={{ font: `600 16px ${s.FONT}`, color: s.text }}>{p.visitCount}</div>
                    </div>
                    <div>
                      <div style={{ font: `500 9px ${s.MONO}`, textTransform: 'uppercase', letterSpacing: 1, color: s.text3, marginBottom: 3 }}>Spent</div>
                      <div style={{ font: `600 16px ${s.FONT}`, color: s.text }}>{fmt(p.totalSpent)}</div>
                    </div>
                    <div>
                      <div style={{ font: `500 9px ${s.MONO}`, textTransform: 'uppercase', letterSpacing: 1, color: s.text3, marginBottom: 3 }}>Last Visit</div>
                      <div style={{ font: `500 12px ${s.FONT}`, color: s.text2 }}>
                        {p.lastVisit ? new Date(p.lastVisit + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '---'}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            {filtered.length === 0 && (
              <div style={{ ...glass, padding: 48, textAlign: 'center', gridColumn: '1 / -1' }}>
                <div style={{ font: `400 14px ${s.FONT}`, color: s.text3, marginBottom: 12 }}>No patients found</div>
                <button onClick={() => { setSelected(null); setForm({ firstName: '', lastName: '', email: '', phone: '', dob: '', gender: 'Female', allergies: '', notes: '', membershipTier: 'None' }); setShowForm(true); }} style={s.pillAccent}>
                  + New Patient
                </button>
              </div>
            )}
          </div>
        )}

        {/* ═══ TABLE VIEW ═══ */}
        {viewMode === 'table' && (
          <div style={{ ...glass, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                    {['Patient', 'Contact', 'Membership', 'Visits', 'Total Spent', 'Last Visit', ''].map(h => (
                      <th key={h} style={{ padding: '14px 18px', font: `500 10px ${s.MONO}`, textTransform: 'uppercase', letterSpacing: 1.2, color: s.text3, textAlign: 'left' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p, idx) => {
                    const tier = TIER_BADGE[p.membershipTier || 'None'];
                    const isActive = detail?.id === p.id;
                    return (
                      <tr key={p.id} className="pat-row-hover" onClick={() => setDetail(p)} style={{
                        borderBottom: '1px solid rgba(0,0,0,0.03)', cursor: 'pointer',
                        background: isActive ? s.accentLight : 'transparent',
                        animation: `patFadeInUp 0.3s ease ${idx * 30}ms backwards`,
                      }}>
                        <td style={{ padding: '14px 18px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{
                              width: 38, height: 38, borderRadius: '50%',
                              background: `linear-gradient(135deg, ${s.accentLight}, ${s.accent}18)`,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              font: `500 13px ${s.FONT}`, color: s.accent, flexShrink: 0,
                            }}>
                              {p.firstName[0]}{p.lastName[0]}
                            </div>
                            <div style={{ font: `500 14px ${s.FONT}`, color: s.text }}>{p.firstName} {p.lastName}</div>
                          </div>
                        </td>
                        <td style={{ padding: '14px 18px' }}>
                          <div style={{ font: `400 13px ${s.FONT}`, color: s.text2 }}>{p.email}</div>
                          <div style={{ font: `400 12px ${s.FONT}`, color: s.text3 }}>{p.phone}</div>
                        </td>
                        <td style={{ padding: '14px 18px' }}>
                          {tier && (
                            <span style={{
                              padding: '3px 10px', borderRadius: 100,
                              font: `600 10px ${s.FONT}`, textTransform: 'uppercase',
                              background: tier.bg, color: tier.color, border: `1px solid ${tier.border}`,
                            }}>{p.membershipTier}</span>
                          )}
                        </td>
                        <td style={{ padding: '14px 18px', font: `500 13px ${s.MONO}`, color: s.text }}>{p.visitCount}</td>
                        <td style={{ padding: '14px 18px', font: `500 13px ${s.MONO}`, color: s.text }}>{fmt(p.totalSpent)}</td>
                        <td style={{ padding: '14px 18px', font: `400 13px ${s.FONT}`, color: s.text2 }}>
                          {p.lastVisit ? new Date(p.lastVisit + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '---'}
                        </td>
                        <td style={{ padding: '14px 18px' }}>
                          <button onClick={e => { e.stopPropagation(); handleEdit(p); }} style={{ ...s.pillGhost, padding: '4px 12px', fontSize: 11 }}>Edit</button>
                        </td>
                      </tr>
                    );
                  })}
                  {filtered.length === 0 && (
                    <tr><td colSpan="7" style={{ padding: 48, textAlign: 'center', font: `400 13px ${s.FONT}`, color: s.text3 }}>No patients found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ═══ DETAIL PANEL ═══ */}
        {detail && (
          <div className="patients-detail-panel" style={{
            alignSelf: 'start', position: 'sticky', top: 80, overflow: 'hidden',
            ...glass, borderRadius: 20, padding: 0,
            animation: 'patSlideIn 0.35s cubic-bezier(0.16,1,0.3,1) both',
          }}>
            {/* Accent header area */}
            <div style={{
              background: `linear-gradient(135deg, ${s.accent}12, ${s.accent}08)`,
              padding: '28px 24px 20px', textAlign: 'center', position: 'relative',
              borderBottom: `1px solid ${s.accent}10`,
            }}>
              <button onClick={() => setDetail(null)} style={{
                position: 'absolute', top: 12, right: 14,
                background: 'rgba(255,255,255,0.6)', border: 'none', cursor: 'pointer',
                width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: s.text3, fontSize: 16, backdropFilter: 'blur(8px)',
              }}>x</button>
              {/* Large avatar */}
              <div style={{
                width: 72, height: 72, borderRadius: '50%', margin: '0 auto 12px',
                background: `linear-gradient(135deg, ${s.accentLight}, ${s.accent}22)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                font: `600 22px ${s.FONT}`, color: s.accent,
                border: `3px solid ${s.accent}25`,
                boxShadow: `0 4px 20px ${s.accent}15`,
              }}>
                {detail.firstName[0]}{detail.lastName[0]}
              </div>
              <div style={{ font: `600 18px ${s.FONT}`, color: s.text, marginBottom: 4 }}>{detail.firstName} {detail.lastName}</div>
              {detail.membershipTier && detail.membershipTier !== 'None' && (() => {
                const tier = TIER_BADGE[detail.membershipTier];
                return (
                  <span style={{
                    display: 'inline-block', padding: '4px 14px', borderRadius: 100,
                    font: `600 10px ${s.FONT}`, textTransform: 'uppercase', letterSpacing: 0.8,
                    background: tier.bg, color: tier.color, border: `1px solid ${tier.border}`,
                  }}>{detail.membershipTier} Member</span>
                );
              })()}
            </div>

            {/* Key-value pairs */}
            <div style={{ padding: '20px 24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
                {[
                  { label: 'Email', value: detail.email },
                  { label: 'Phone', value: detail.phone },
                  { label: 'DOB', value: detail.dob || '---' },
                  { label: 'Gender', value: detail.gender },
                  { label: 'Visits', value: detail.visitCount },
                  { label: 'Total Spent', value: fmt(detail.totalSpent) },
                ].map(f => (
                  <div key={f.label}>
                    <div style={{ font: `500 9px ${s.MONO}`, textTransform: 'uppercase', letterSpacing: 1.5, color: s.text3, marginBottom: 4 }}>{f.label}</div>
                    <div style={{ font: `400 13px ${s.FONT}`, color: s.text, wordBreak: 'break-word' }}>{f.value}</div>
                  </div>
                ))}
              </div>

              {detail.allergies && (
                <div style={{
                  padding: '10px 14px', background: '#FEF2F2', borderRadius: 10, marginBottom: 16,
                  font: `400 12px ${s.FONT}`, color: s.danger, border: '1px solid #FECACA',
                  display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={s.danger} strokeWidth="2" strokeLinecap="round">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                  Allergies: {detail.allergies}
                </div>
              )}

              {/* Recent appointments */}
              <div style={{ font: `600 13px ${s.FONT}`, color: s.text, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={s.text2} strokeWidth="1.5" strokeLinecap="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                Recent Appointments
              </div>
              {patientAppts(detail.id).length === 0 ? (
                <div style={{ font: `400 12px ${s.FONT}`, color: s.text3, padding: '8px 0' }}>No appointments found</div>
              ) : patientAppts(detail.id).map(a => {
                const svc = services.find(sv => sv.id === a.serviceId);
                const statusColor = a.status === 'completed' ? s.success : a.status === 'confirmed' ? s.accent : s.warning;
                return (
                  <div key={a.id} style={{
                    padding: '10px 12px', marginBottom: 6, borderRadius: 10,
                    background: 'rgba(255,255,255,0.5)', border: '1px solid rgba(0,0,0,0.03)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}>
                    <div>
                      <div style={{ font: `500 12px ${s.FONT}`, color: s.text }}>{svc?.name || 'Service'}</div>
                      <div style={{ font: `400 11px ${s.FONT}`, color: s.text3 }}>
                        {new Date(a.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                    </div>
                    <span style={{
                      padding: '2px 8px', borderRadius: 100,
                      font: `500 9px ${s.FONT}`, textTransform: 'uppercase', color: statusColor,
                      background: a.status === 'completed' ? '#F0FDF4' : a.status === 'confirmed' ? s.accentLight : '#FFFBEB',
                    }}>{a.status}</span>
                  </div>
                );
              })}

              <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
                <button onClick={() => handleEdit(detail)} style={{ ...s.pillOutline, padding: '8px 18px', fontSize: 12, flex: 1 }}>Edit</button>
                <button onClick={() => handleDelete(detail.id)} style={{ ...s.pillGhost, padding: '8px 18px', fontSize: 12, color: s.danger, borderColor: `${s.danger}40` }}>Delete</button>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @media (max-width: 768px) {
          .patients-main-grid {
            grid-template-columns: 1fr !important;
          }
          .patients-detail-panel {
            position: fixed !important;
            top: 0 !important;
            right: 0 !important;
            bottom: 0 !important;
            width: 85vw !important;
            max-width: 380px !important;
            z-index: 200 !important;
            border-radius: 20px 0 0 20px !important;
            overflow-y: auto !important;
            box-shadow: -8px 0 40px rgba(0,0,0,0.15) !important;
            animation: slideIn 0.3s cubic-bezier(0.16,1,0.3,1) both !important;
          }
        }
      `}</style>

      {/* ═══ ADD/EDIT MODAL ═══ */}
      {showForm && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300,
        }} onClick={() => setShowForm(false)}>
          <div style={{
            background: '#fff', borderRadius: 20, padding: 32, maxWidth: 540, width: '90%',
            boxShadow: s.shadowLg, maxHeight: '90vh', overflowY: 'auto',
            animation: 'patFadeInUp 0.35s cubic-bezier(0.16,1,0.3,1) both',
          }} onClick={e => e.stopPropagation()}>
            <h2 style={{ font: `600 20px ${s.FONT}`, color: s.text, marginBottom: 24 }}>{selected ? 'Edit Patient' : 'New Patient'}</h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {[
                { key: 'firstName', label: 'First Name', type: 'text' },
                { key: 'lastName', label: 'Last Name', type: 'text' },
                { key: 'email', label: 'Email', type: 'email' },
                { key: 'phone', label: 'Phone', type: 'tel' },
                { key: 'dob', label: 'Date of Birth', type: 'date' },
              ].map(f => (
                <div key={f.key}>
                  <label style={s.label}>{f.label}</label>
                  <input type={f.type} value={form[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })} style={s.input} />
                </div>
              ))}
              <div>
                <label style={s.label}>Gender</label>
                <select value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })} style={{ ...s.input, cursor: 'pointer' }}>
                  <option>Female</option><option>Male</option><option>Non-binary</option><option>Prefer not to say</option>
                </select>
              </div>
              <div>
                <label style={s.label}>Membership</label>
                <select value={form.membershipTier} onChange={e => setForm({ ...form, membershipTier: e.target.value })} style={{ ...s.input, cursor: 'pointer' }}>
                  <option>None</option><option>Silver</option><option>Gold</option><option>Platinum</option>
                </select>
              </div>
            </div>

            <div style={{ marginTop: 16 }}>
              <label style={s.label}>Allergies</label>
              <input value={form.allergies} onChange={e => setForm({ ...form, allergies: e.target.value })} style={s.input} placeholder="e.g., Latex, Lidocaine" />
            </div>
            <div style={{ marginTop: 16 }}>
              <label style={s.label}>Notes</label>
              <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={3} style={{ ...s.input, resize: 'vertical' }} placeholder="Internal notes..." />
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 24, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowForm(false)} style={s.pillGhost}>Cancel</button>
              <button onClick={handleSave} style={s.pillAccent}>{selected ? 'Save Changes' : 'Add Patient'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
