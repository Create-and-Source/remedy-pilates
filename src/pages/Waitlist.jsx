import { useState, useEffect } from 'react';
import { useStyles } from '../theme';
import { subscribe } from '../data/store';

const STORE_KEY = 'rp_waitlist';

function getWaitlist() {
  try { return JSON.parse(localStorage.getItem(STORE_KEY)) || []; } catch { return []; }
}
function setWaitlist(data) { localStorage.setItem(STORE_KEY, JSON.stringify(data)); }

function seedWaitlist() {
  if (getWaitlist().length > 0) return;
  const now = new Date();
  const d = (offset) => { const dt = new Date(now); dt.setDate(dt.getDate() + offset); return dt.toISOString(); };

  const entries = [
    { name: 'Sophia Brown', patientId: 'PAT-1002', service: 'Reformer', preferredDays: ['Monday', 'Wednesday'], preferredTimes: 'Morning', status: 'waiting' },
    { name: 'Ava Jones', patientId: 'PAT-1003', service: 'Juvederm Barre', preferredDays: ['Tuesday', 'Thursday'], preferredTimes: 'Afternoon', status: 'notified' },
    { name: 'Mia Miller', patientId: 'PAT-1005', service: 'RF Private Session', preferredDays: ['Friday'], preferredTimes: 'Morning', status: 'waiting' },
    { name: 'Charlotte Davis', patientId: 'PAT-1006', service: 'TRX Photofacial', preferredDays: ['Monday', 'Tuesday'], preferredTimes: 'Any', status: 'confirmed' },
    { name: 'Amelia Thompson', patientId: 'PAT-1007', service: 'Chemical Peel', preferredDays: ['Wednesday', 'Friday'], preferredTimes: 'Morning', status: 'booked' },
    { name: 'Harper White', patientId: 'PAT-1008', service: 'Reformer', preferredDays: ['Thursday'], preferredTimes: 'Afternoon', status: 'waiting' },
    { name: 'Evelyn Lopez', patientId: 'PAT-1009', service: 'Mat Pilates', preferredDays: ['Monday', 'Wednesday', 'Friday'], preferredTimes: 'Morning', status: 'expired' },
    { name: 'Abigail Taylor', patientId: 'PAT-1010', service: 'Sculptra', preferredDays: ['Tuesday'], preferredTimes: 'Afternoon', status: 'notified' },
    { name: 'Ella Thomas', patientId: 'PAT-1011', service: 'Laser Hair Removal', preferredDays: ['Monday', 'Thursday'], preferredTimes: 'Any', status: 'waiting' },
    { name: 'Scarlett Hernandez', patientId: 'PAT-1012', service: 'RF Private Session', preferredDays: ['Wednesday'], preferredTimes: 'Morning', status: 'booked' },
    { name: 'Grace Moore', patientId: 'PAT-1013', service: 'Reformer', preferredDays: ['Friday'], preferredTimes: 'Afternoon', status: 'waiting' },
    { name: 'Chloe Martin', patientId: 'PAT-1014', service: 'Juvederm Barre', preferredDays: ['Tuesday', 'Thursday'], preferredTimes: 'Morning', status: 'confirmed' },
  ];

  const seed = entries.map((e, i) => ({
    id: `WL-${1000 + i}`,
    patientId: e.patientId,
    patientName: e.name,
    service: e.service,
    preferredDays: e.preferredDays,
    preferredTimes: e.preferredTimes,
    status: e.status,
    dateAdded: d(-Math.floor(2 + Math.random() * 20)),
    notifiedAt: ['notified', 'confirmed', 'booked'].includes(e.status) ? d(-Math.floor(1 + Math.random() * 5)) : null,
    confirmedAt: ['confirmed', 'booked'].includes(e.status) ? d(-Math.floor(Math.random() * 3)) : null,
    bookedAt: e.status === 'booked' ? d(-Math.floor(Math.random() * 2)) : null,
    expiredAt: e.status === 'expired' ? d(-Math.floor(Math.random() * 3)) : null,
    fillTimeHours: e.status === 'booked' ? Math.floor(2 + Math.random() * 46) : null,
  }));
  setWaitlist(seed);
}

export default function Waitlist() {
  const s = useStyles();
  const [, setTick] = useState(0);
  useEffect(() => subscribe(() => setTick(t => t + 1)), []);
  useEffect(() => { seedWaitlist(); }, []);

  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState(null);

  const entries = getWaitlist();

  // KPIs
  const totalWaiting = entries.filter(e => e.status === 'waiting').length;
  const totalEntries = entries.length;
  const now = new Date();
  const filledThisMonth = entries.filter(e => {
    if (e.status !== 'booked') return false;
    const d = new Date(e.bookedAt);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;
  const bookedEntries = entries.filter(e => e.fillTimeHours != null);
  const avgFillTime = bookedEntries.length > 0
    ? Math.round(bookedEntries.reduce((sum, e) => sum + e.fillTimeHours, 0) / bookedEntries.length)
    : 0;
  const notifiedCount = entries.filter(e => e.status === 'notified').length;

  // Filter
  const filtered = entries.filter(e => {
    if (filter === 'waiting' && e.status !== 'waiting') return false;
    if (filter === 'notified' && e.status !== 'notified') return false;
    if (filter === 'confirmed' && e.status !== 'confirmed') return false;
    if (filter === 'booked' && e.status !== 'booked') return false;
    if (filter === 'expired' && e.status !== 'expired') return false;
    if (search) {
      const q = search.toLowerCase();
      return e.patientName?.toLowerCase().includes(q) || e.service?.toLowerCase().includes(q);
    }
    return true;
  });

  const statusColor = (status) => {
    switch (status) {
      case 'waiting': return { bg: '#F8F8F8', text: s.text2 };
      case 'notified': return { bg: '#FFFBEB', text: s.warning };
      case 'confirmed': return { bg: '#EFF6FF', text: '#2563EB' };
      case 'booked': return { bg: '#F0FDF4', text: s.success };
      case 'expired': return { bg: '#FEF2F2', text: s.danger };
      default: return { bg: '#F8F8F8', text: s.text3 };
    }
  };

  const borderColor = (status) => {
    switch (status) {
      case 'waiting': return s.text3;
      case 'notified': return s.warning;
      case 'confirmed': return '#2563EB';
      case 'booked': return s.success;
      case 'expired': return s.danger;
      default: return s.border;
    }
  };

  const notify = (id) => {
    const all = getWaitlist().map(e => e.id === id ? { ...e, status: 'notified', notifiedAt: new Date().toISOString() } : e);
    setWaitlist(all);
    const entry = all.find(e => e.id === id);
    setToast(`Notification sent to ${entry?.patientName}`);
    setTimeout(() => setToast(null), 3000);
    setTick(t => t + 1);
  };

  const notifyAll = () => {
    const waiting = entries.filter(e => e.status === 'waiting');
    if (waiting.length === 0) return;
    const all = getWaitlist().map(e => e.status === 'waiting' ? { ...e, status: 'notified', notifiedAt: new Date().toISOString() } : e);
    setWaitlist(all);
    setToast(`Notified ${waiting.length} waitlisted clients`);
    setTimeout(() => setToast(null), 3000);
    setTick(t => t + 1);
  };

  const confirm = (id) => {
    const all = getWaitlist().map(e => e.id === id ? { ...e, status: 'confirmed', confirmedAt: new Date().toISOString() } : e);
    setWaitlist(all);
    setTick(t => t + 1);
  };

  const book = (id) => {
    const entry = entries.find(e => e.id === id);
    const notifiedTime = entry?.notifiedAt ? new Date(entry.notifiedAt) : new Date();
    const fillHours = Math.round((new Date() - notifiedTime) / (1000 * 60 * 60)) || 1;
    const all = getWaitlist().map(e => e.id === id ? { ...e, status: 'booked', bookedAt: new Date().toISOString(), fillTimeHours: fillHours } : e);
    setWaitlist(all);
    setToast(`${entry?.patientName} booked from waitlist!`);
    setTimeout(() => setToast(null), 3000);
    setTick(t => t + 1);
  };

  const expire = (id) => {
    const all = getWaitlist().map(e => e.id === id ? { ...e, status: 'expired', expiredAt: new Date().toISOString() } : e);
    setWaitlist(all);
    setTick(t => t + 1);
  };

  return (
    <div>
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

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ font: `600 26px ${s.FONT}`, color: s.text, marginBottom: 4 }}>Waitlist</h1>
          <p style={{ font: `400 14px ${s.FONT}`, color: s.text2 }}>Smart waitlist with auto-backfill — fill cancellations fast</p>
        </div>
        {totalWaiting > 0 && (
          <button onClick={notifyAll} style={{ ...s.pillAccent }}>Notify Waitlist ({totalWaiting})</button>
        )}
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Currently Waiting', value: totalWaiting, color: totalWaiting > 0 ? s.warning : s.success },
          { label: 'Notified', value: notifiedCount, color: notifiedCount > 0 ? '#2563EB' : s.text3 },
          { label: 'Filled This Month', value: filledThisMonth, color: s.success },
          { label: 'Avg Fill Time', value: avgFillTime > 0 ? `${avgFillTime}h` : '—', color: avgFillTime <= 24 ? s.success : avgFillTime <= 48 ? s.warning : s.danger },
        ].map(k => (
          <div key={k.label} style={{ ...s.cardStyle, padding: '16px 20px' }}>
            <div style={{ font: `400 10px ${s.MONO}`, textTransform: 'uppercase', letterSpacing: 1, color: s.text3, marginBottom: 6 }}>{k.label}</div>
            <div style={{ font: `600 24px ${s.FONT}`, color: k.color }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Status flow legend */}
      <div style={{ ...s.cardStyle, padding: '12px 20px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ font: `400 11px ${s.MONO}`, textTransform: 'uppercase', letterSpacing: 1, color: s.text3 }}>Flow:</span>
        {['waiting', 'notified', 'confirmed', 'booked'].map((st, i) => {
          const sc = statusColor(st);
          return (
            <span key={st} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <span style={{
                padding: '3px 10px', borderRadius: 100,
                font: `500 10px ${s.FONT}`, textTransform: 'uppercase',
                background: sc.bg, color: sc.text,
              }}>{st}</span>
              {i < 3 && <span style={{ color: s.text3, fontSize: 12 }}>{'\u2192'}</span>}
            </span>
          );
        })}
        <span style={{ marginLeft: 8, font: `400 11px ${s.FONT}`, color: s.text3 }}>(or expired)</span>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search clients or services..." style={{ ...s.input, maxWidth: 260 }} />
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {[['all', 'All'], ['waiting', 'Waiting'], ['notified', 'Notified'], ['confirmed', 'Confirmed'], ['booked', 'Booked'], ['expired', 'Expired']].map(([id, label]) => (
            <button key={id} onClick={() => setFilter(id)} style={{
              ...s.pill, padding: '7px 14px', fontSize: 12,
              background: filter === id ? s.accent : 'transparent',
              color: filter === id ? s.accentText : s.text2,
              border: filter === id ? `1px solid ${s.accent}` : '1px solid #E5E5E5',
            }}>{label}</button>
          ))}
        </div>
      </div>

      {/* Waitlist entries */}
      <div style={{ display: 'grid', gap: 8 }}>
        {filtered.map(entry => {
          const sc = statusColor(entry.status);
          return (
            <div key={entry.id} style={{
              ...s.cardStyle, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16,
              borderLeftWidth: 3, borderLeftStyle: 'solid',
              borderLeftColor: borderColor(entry.status),
            }}>
              {/* Avatar */}
              <div style={{
                width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                background: sc.bg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                font: `500 14px ${s.FONT}`, color: sc.text,
              }}>
                {entry.patientName?.split(' ').map(n => n[0]).join('')}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                  <span style={{ font: `500 14px ${s.FONT}`, color: s.text }}>{entry.patientName}</span>
                  <span style={{
                    padding: '2px 8px', borderRadius: 100, font: `500 9px ${s.FONT}`, textTransform: 'uppercase',
                    background: sc.bg, color: sc.text,
                  }}>{entry.status}</span>
                </div>
                <div style={{ font: `400 13px ${s.FONT}`, color: s.text2 }}>{entry.service}</div>
                <div style={{ font: `400 11px ${s.FONT}`, color: s.text3, marginTop: 2 }}>
                  {entry.preferredDays?.join(', ')} — {entry.preferredTimes}
                </div>
                <div style={{ font: `400 11px ${s.FONT}`, color: s.text3, marginTop: 1 }}>
                  Added: {entry.dateAdded ? new Date(entry.dateAdded).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
                  {entry.fillTimeHours != null && ` — Filled in ${entry.fillTimeHours}h`}
                </div>
              </div>

              {/* Days waiting */}
              {entry.status === 'waiting' && (
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ font: `600 18px ${s.MONO}`, color: s.warning, marginBottom: 4 }}>
                    {Math.max(1, Math.floor((new Date() - new Date(entry.dateAdded)) / (1000 * 60 * 60 * 24)))}d
                  </div>
                  <div style={{ font: `400 10px ${s.FONT}`, color: s.text3 }}>waiting</div>
                </div>
              )}

              {/* Actions */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0 }}>
                {entry.status === 'waiting' && (
                  <>
                    <button onClick={() => notify(entry.id)} style={{ ...s.pillAccent, padding: '6px 12px', fontSize: 11 }}>Notify</button>
                    <button onClick={() => expire(entry.id)} style={{ ...s.pillGhost, padding: '4px 10px', fontSize: 10 }}>Remove</button>
                  </>
                )}
                {entry.status === 'notified' && (
                  <>
                    <button onClick={() => confirm(entry.id)} style={{ ...s.pillOutline, padding: '6px 12px', fontSize: 11 }}>Confirm</button>
                    <button onClick={() => expire(entry.id)} style={{ ...s.pillGhost, padding: '4px 10px', fontSize: 10 }}>Expire</button>
                  </>
                )}
                {entry.status === 'confirmed' && (
                  <button onClick={() => book(entry.id)} style={{ ...s.pillAccent, padding: '6px 12px', fontSize: 11 }}>Book Slot</button>
                )}
                {entry.status === 'booked' && (
                  <div style={{ font: `500 11px ${s.FONT}`, color: s.success, textAlign: 'right' }}>Booked</div>
                )}
                {entry.status === 'expired' && (
                  <div style={{ font: `500 11px ${s.FONT}`, color: s.danger, textAlign: 'right' }}>Expired</div>
                )}
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div style={{ ...s.cardStyle, padding: 48, textAlign: 'center', font: `400 14px ${s.FONT}`, color: s.text3 }}>
            {filter === 'all' ? 'No waitlist entries yet' : 'No entries match this filter'}
          </div>
        )}
      </div>
    </div>
  );
}
