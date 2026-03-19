import { useState, useEffect } from 'react';
import { useStyles } from '../theme';
import { getAppointments, addAppointment, updateAppointment, deleteAppointment, getPatients, getServices, getProviders, getLocations, subscribe } from '../data/store';

export default function Schedule() {
  const s = useStyles();
  const [, setTick] = useState(0);
  useEffect(() => subscribe(() => setTick(t => t + 1)), []);

  const [view, setView] = useState('day'); // 'day' | 'week' | 'list'
  const [currentDate, setCurrentDate] = useState(new Date().toISOString().slice(0, 10));
  const [showForm, setShowForm] = useState(false);
  const [editAppt, setEditAppt] = useState(null);
  const [form, setForm] = useState({ patientId: '', serviceId: '', providerId: '', date: '', time: '', duration: 30, location: 'LOC-1', room: '', notes: '' });

  const appointments = getAppointments();
  const clients = getPatients();
  const services = getServices();
  const providers = getProviders();
  const locations = getLocations();

  const dayAppts = appointments.filter(a => a.date === currentDate).sort((a, b) => a.time.localeCompare(b.time));

  // Week view
  const weekStart = new Date(currentDate + 'T12:00:00');
  const dayOfWeek = weekStart.getDay();
  weekStart.setDate(weekStart.getDate() - dayOfWeek);
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d.toISOString().slice(0, 10);
  });

  const navigate = (dir) => {
    const d = new Date(currentDate + 'T12:00:00');
    d.setDate(d.getDate() + (view === 'week' ? dir * 7 : dir));
    setCurrentDate(d.toISOString().slice(0, 10));
  };

  const openNew = (date, time) => {
    setEditAppt(null);
    setForm({ patientId: '', serviceId: '', providerId: '', date: date || currentDate, time: time || '09:00', duration: 30, location: 'LOC-1', room: '', notes: '' });
    setShowForm(true);
  };

  const openEdit = (appt) => {
    setEditAppt(appt);
    setForm({ patientId: appt.patientId, serviceId: appt.serviceId, providerId: appt.providerId, date: appt.date, time: appt.time, duration: appt.duration, location: appt.location, room: appt.room || '', notes: appt.notes || '' });
    setShowForm(true);
  };

  const handleSave = () => {
    const pat = clients.find(p => p.id === form.patientId);
    const data = { ...form, patientName: pat ? `${pat.firstName} ${pat.lastName}` : 'Unknown', status: 'confirmed' };
    if (editAppt) {
      updateAppointment(editAppt.id, data);
    } else {
      addAppointment(data);
    }
    setShowForm(false);
  };

  const handleStatusChange = (id, status) => {
    updateAppointment(id, { status });
  };

  const hours = Array.from({ length: 12 }, (_, i) => i + 8); // 8AM-7PM

  const statusColor = (status) => {
    if (status === 'completed') return s.success;
    if (status === 'confirmed') return s.accent;
    if (status === 'pending') return s.warning;
    if (status === 'cancelled') return s.danger;
    return s.text3;
  };

  const ApptBlock = ({ appt, compact }) => {
    const svc = services.find(sv => sv.id === appt.serviceId);
    const prov = providers.find(p => p.id === appt.providerId);
    return (
      <div onClick={() => openEdit(appt)} style={{
        padding: compact ? '6px 8px' : '10px 14px', borderRadius: 8, cursor: 'pointer',
        background: 'rgba(255,255,255,0.5)', backdropFilter: 'blur(8px)', borderLeft: `3px solid ${statusColor(appt.status)}`,
        marginBottom: 4, transition: 'all 0.15s',
      }}
      onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.04)'}
      onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.5)'}
      >
        <div style={{ font: `500 ${compact ? 11 : 13}px ${s.FONT}`, color: s.text }}>{appt.patientName}</div>
        <div style={{ font: `400 ${compact ? 10 : 12}px ${s.FONT}`, color: s.text2 }}>
          {appt.time} — {svc?.name || 'Service'}{!compact && prov ? ` · ${prov.name.split(',')[0]}` : ''}
        </div>
      </div>
    );
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ font: `600 26px ${s.FONT}`, color: s.text, marginBottom: 4 }}>Schedule</h1>
          <p style={{ font: `400 14px ${s.FONT}`, color: s.text2 }}>{dayAppts.length} appointments {view === 'day' ? 'today' : 'this week'}</p>
        </div>
        <button onClick={() => openNew()} style={s.pillAccent}>+ Book Appointment</button>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => navigate(-1)} style={{ ...s.pillGhost, padding: '6px 12px' }}>←</button>
          <span style={{ font: `500 15px ${s.FONT}`, color: s.text, minWidth: 180, textAlign: 'center' }}>
            {new Date(currentDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </span>
          <button onClick={() => navigate(1)} style={{ ...s.pillGhost, padding: '6px 12px' }}>→</button>
          <button onClick={() => setCurrentDate(new Date().toISOString().slice(0, 10))} style={{ ...s.pillGhost, padding: '6px 12px', fontSize: 11 }}>Today</button>
        </div>
        <div style={{ display: 'flex', gap: 0, background: 'rgba(0,0,0,0.04)', borderRadius: 8, overflow: 'hidden' }}>
          {['day', 'week', 'list'].map(v => (
            <button key={v} onClick={() => setView(v)} style={{
              padding: '7px 16px', background: view === v ? '#fff' : 'transparent', border: 'none',
              font: `500 12px ${s.FONT}`, color: view === v ? s.text : s.text3, cursor: 'pointer',
              borderRadius: view === v ? 8 : 0, boxShadow: view === v ? s.shadow : 'none',
              textTransform: 'capitalize',
            }}>{v}</button>
          ))}
        </div>
      </div>

      {/* Day View */}
      {view === 'day' && (
        <div style={s.tableWrap}>
          {hours.map(h => {
            const hourAppts = dayAppts.filter(a => parseInt(a.time.split(':')[0]) === h);
            return (
              <div key={h} style={{ display: 'flex', borderBottom: '1px solid rgba(0,0,0,0.03)', minHeight: 72 }}>
                <div className="schedule-time-col" style={{ width: 80, padding: '12px 16px', font: `400 12px ${s.MONO}`, color: s.text3, borderRight: '1px solid rgba(0,0,0,0.03)', flexShrink: 0 }}>
                  {h > 12 ? h - 12 : h}:00 {h >= 12 ? 'PM' : 'AM'}
                </div>
                <div style={{ flex: 1, padding: '8px 12px', cursor: 'pointer' }} onClick={() => openNew(currentDate, `${String(h).padStart(2, '0')}:00`)}>
                  {hourAppts.map(a => <ApptBlock key={a.id} appt={a} />)}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Week View */}
      {view === 'week' && (
        <div className="schedule-week-wrap" style={{ ...s.tableWrap, overflowX: 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', minWidth: 800 }}>
            {weekDays.map(day => {
              const isToday = day === new Date().toISOString().slice(0, 10);
              const dayA = appointments.filter(a => a.date === day).sort((a, b) => a.time.localeCompare(b.time));
              return (
                <div key={day} style={{ borderRight: '1px solid rgba(0,0,0,0.04)', minHeight: 300 }}>
                  <div style={{
                    padding: '12px 10px', borderBottom: '1px solid rgba(0,0,0,0.04)', textAlign: 'center',
                    background: isToday ? s.accentLight : 'transparent',
                  }}>
                    <div style={{ font: `400 10px ${s.MONO}`, color: s.text3, textTransform: 'uppercase' }}>
                      {new Date(day + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short' })}
                    </div>
                    <div style={{ font: `600 18px ${s.FONT}`, color: isToday ? s.accent : s.text }}>
                      {new Date(day + 'T12:00:00').getDate()}
                    </div>
                  </div>
                  <div style={{ padding: 6 }}>
                    {dayA.map(a => <ApptBlock key={a.id} appt={a} compact />)}
                    {dayA.length === 0 && (
                      <div onClick={() => openNew(day)} style={{ padding: 12, textAlign: 'center', font: `400 11px ${s.FONT}`, color: s.text3, cursor: 'pointer' }}>+</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* List View */}
      {view === 'list' && (
        <div style={s.tableWrap}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #E5E5E5' }}>
                {['Time', 'Client', 'Service', 'Instructor', 'Status', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', font: `500 11px ${s.MONO}`, textTransform: 'uppercase', letterSpacing: 1, color: s.text3, textAlign: 'left' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dayAppts.map(a => {
                const svc = services.find(sv => sv.id === a.serviceId);
                const prov = providers.find(p => p.id === a.providerId);
                return (
                  <tr key={a.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.03)' }}>
                    <td style={{ padding: '14px 16px', font: `500 13px ${s.MONO}`, color: s.text }}>{a.time}</td>
                    <td style={{ padding: '14px 16px', font: `500 13px ${s.FONT}`, color: s.text }}>{a.patientName}</td>
                    <td style={{ padding: '14px 16px', font: `400 13px ${s.FONT}`, color: s.text2 }}>{svc?.name || '—'}</td>
                    <td style={{ padding: '14px 16px', font: `400 13px ${s.FONT}`, color: s.text2 }}>{prov?.name?.split(',')[0] || '—'}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <select value={a.status} onChange={e => handleStatusChange(a.id, e.target.value)} style={{ ...s.input, width: 'auto', padding: '4px 8px', fontSize: 12, cursor: 'pointer', color: statusColor(a.status), fontWeight: 500 }}>
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => openEdit(a)} style={{ ...s.pillGhost, padding: '4px 10px', fontSize: 11 }}>Edit</button>
                        <button onClick={() => { if (confirm('Delete?')) deleteAppointment(a.id); }} style={{ ...s.pillGhost, padding: '4px 10px', fontSize: 11, color: s.danger }}>×</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {dayAppts.length === 0 && (
                <tr><td colSpan="6" style={{ padding: 40, textAlign: 'center', font: `400 13px ${s.FONT}`, color: s.text3 }}>No appointments for this day</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .schedule-week-wrap {
            -webkit-overflow-scrolling: touch;
          }
          .schedule-week-wrap::after {
            content: 'Scroll to see full week →';
            display: block;
            text-align: center;
            font: 400 11px 'Inter', sans-serif;
            color: #999;
            padding: 8px 0 4px;
          }
          .schedule-time-col {
            width: 56px !important;
            padding: 10px 6px !important;
            font-size: 10px !important;
          }
        }
      `}</style>

      {/* Booking Modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300 }} onClick={() => setShowForm(false)}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 32, maxWidth: 520, width: '90%', boxShadow: s.shadowLg, maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <h2 style={{ font: `600 20px ${s.FONT}`, color: s.text, marginBottom: 24 }}>{editAppt ? 'Edit Appointment' : 'Book Appointment'}</h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={s.label}>Client</label>
                <select value={form.patientId} onChange={e => setForm({ ...form, patientId: e.target.value })} style={{ ...s.input, cursor: 'pointer' }}>
                  <option value="">Select client...</option>
                  {clients.map(p => <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>)}
                </select>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={s.label}>Service</label>
                <select value={form.serviceId} onChange={e => { const svc = services.find(sv => sv.id === e.target.value); setForm({ ...form, serviceId: e.target.value, duration: svc?.duration || 30 }); }} style={{ ...s.input, cursor: 'pointer' }}>
                  <option value="">Select service...</option>
                  {services.map(sv => <option key={sv.id} value={sv.id}>{sv.name} ({sv.duration}min)</option>)}
                </select>
              </div>
              <div>
                <label style={s.label}>Instructor</label>
                <select value={form.providerId} onChange={e => setForm({ ...form, providerId: e.target.value })} style={{ ...s.input, cursor: 'pointer' }}>
                  <option value="">Select...</option>
                  {(() => {
                    const svc = services.find(sv => sv.id === form.serviceId);
                    const filtered = svc ? providers.filter(p => p.specialties?.some(sp => svc.name.includes(sp) || sp.includes(svc.name) || svc.category === 'Consultation')) : providers;
                    return (filtered.length > 0 ? filtered : providers).map(p => <option key={p.id} value={p.id}>{p.name}</option>);
                  })()}
                </select>
              </div>
              <div>
                <label style={s.label}>Location</label>
                <select value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} style={{ ...s.input, cursor: 'pointer' }}>
                  {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </div>
              <div>
                <label style={s.label}>Date</label>
                <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} style={s.input} />
              </div>
              <div>
                <label style={s.label}>Time</label>
                <input type="time" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} style={s.input} />
              </div>
              <div>
                <label style={s.label}>Duration (min)</label>
                <input type="number" value={form.duration} onChange={e => setForm({ ...form, duration: parseInt(e.target.value) || 30 })} style={s.input} />
              </div>
              <div>
                <label style={s.label}>Room</label>
                <input value={form.room} onChange={e => setForm({ ...form, room: e.target.value })} style={s.input} placeholder="e.g., Suite A" />
              </div>
            </div>
            <div style={{ marginTop: 16 }}>
              <label style={s.label}>Notes</label>
              <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} style={{ ...s.input, resize: 'vertical' }} />
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 24, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowForm(false)} style={s.pillGhost}>Cancel</button>
              <button onClick={handleSave} style={s.pillAccent}>{editAppt ? 'Save Changes' : 'Book'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
