// Client Check-In — front desk flow: arrival → verify info → sign waivers → ready for instructor
import { useState, useEffect } from 'react';
import { useStyles } from '../theme';
import { getAppointments, updateAppointment, getPatients, getServices, getProviders, getSettings, subscribe } from '../data/store';
import CheckoutDrawer from '../components/CheckoutDrawer';

const CHECKIN_KEY = 'rp_checkins';
function getCheckins() { try { return JSON.parse(localStorage.getItem(CHECKIN_KEY)) || []; } catch { return []; } }
function saveCheckins(c) { localStorage.setItem(CHECKIN_KEY, JSON.stringify(c)); }

export default function CheckIn() {
  const s = useStyles();
  const [, setTick] = useState(0);
  useEffect(() => subscribe(() => setTick(t => t + 1)), []);

  const [checkins, setCheckins] = useState(getCheckins);
  const [search, setSearch] = useState('');
  const [showVerify, setShowVerify] = useState(null);
  const [verifyForm, setVerifyForm] = useState({ phone: '', dob: '', allergies: '', medications: '', pregnant: false });
  const [checkoutAppt, setCheckoutAppt] = useState(null);

  const today = new Date().toISOString().slice(0, 10);
  const appointments = getAppointments().filter(a => a.date === today && a.status !== 'cancelled');
  const clients = getPatients();
  const services = getServices();
  const providers = getProviders();
  const settings = getSettings();

  const refresh = () => setCheckins(getCheckins());

  const getCheckin = (apptId) => checkins.find(c => c.appointmentId === apptId);

  const todayAppts = appointments.sort((a, b) => a.time.localeCompare(b.time)).filter(a => {
    if (!search) return true;
    const q = search.toLowerCase();
    return a.patientName?.toLowerCase().includes(q);
  });

  const checkedInCount = todayAppts.filter(a => getCheckin(a.id)?.status === 'checked-in' || getCheckin(a.id)?.status === 'in-class').length;
  const waitingCount = todayAppts.filter(a => getCheckin(a.id)?.status === 'checked-in').length;

  const startCheckin = (appt) => {
    const pat = clients.find(p => p.id === appt.patientId);
    setVerifyForm({
      phone: pat?.phone || '',
      dob: pat?.dob || '',
      allergies: pat?.allergies || '',
      medications: '',
      pregnant: false,
    });
    setShowVerify(appt);
  };

  const completeCheckin = () => {
    if (!showVerify) return;
    const all = getCheckins();
    all.push({
      id: `CK-${Date.now()}`,
      appointmentId: showVerify.id,
      patientId: showVerify.patientId,
      patientName: showVerify.patientName,
      checkedInAt: new Date().toISOString(),
      verifiedInfo: { ...verifyForm },
      status: 'checked-in',
    });
    saveCheckins(all);
    refresh();
    setShowVerify(null);
  };

  const updateStatus = (apptId, status) => {
    const all = getCheckins().map(c => c.appointmentId === apptId ? { ...c, status } : c);
    saveCheckins(all);
    refresh();
    if (status === 'in-class') {
      updateAppointment(apptId, { status: 'confirmed' });
    } else if (status === 'complete') {
      updateAppointment(apptId, { status: 'completed' });
      // Open checkout drawer for the completed appointment
      const appt = appointments.find(a => a.id === apptId);
      if (appt) setCheckoutAppt(appt);
    }
  };

  const statusInfo = (appt) => {
    const ck = getCheckin(appt.id);
    if (!ck) return { label: 'Not Arrived', color: s.text3, bg: '#F5F5F5' };
    if (ck.status === 'checked-in') return { label: 'Waiting', color: s.warning, bg: '#FFF7ED' };
    if (ck.status === 'in-class') return { label: 'In Class', color: s.accent, bg: s.accentLight };
    if (ck.status === 'complete') return { label: 'Complete', color: s.success, bg: '#F0FDF4' };
    return { label: ck.status, color: s.text3, bg: '#F5F5F5' };
  };

  const waitTime = (appt) => {
    const ck = getCheckin(appt.id);
    if (!ck?.checkedInAt) return null;
    const mins = Math.floor((Date.now() - new Date(ck.checkedInAt)) / 60000);
    return mins;
  };

  return (
    <div>
      <style>{`
        @media (max-width: 768px) {
          .ci-kpi-grid {
            grid-template-columns: 1fr 1fr !important;
          }
          .ci-modal-grid {
            grid-template-columns: 1fr !important;
          }
          .ci-modal-grid > div[style*="1 / -1"] {
            grid-column: 1 !important;
          }
          .ci-appt-card {
            flex-wrap: wrap !important;
          }
        }
        @media (max-width: 480px) {
          .ci-kpi-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ font: `600 26px ${s.FONT}`, color: s.text, marginBottom: 4 }}>Check-In</h1>
          <p style={{ font: `400 14px ${s.FONT}`, color: s.text2 }}>Today's client flow — {todayAppts.length} appointments, {checkedInCount} checked in</p>
        </div>
      </div>

      {/* Stats bar */}
      <div className="ci-kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Total Today', value: todayAppts.length },
          { label: 'Checked In', value: checkedInCount, color: s.success },
          { label: 'Waiting', value: waitingCount, color: waitingCount > 0 ? s.warning : s.success },
          { label: 'Not Arrived', value: todayAppts.filter(a => !getCheckin(a.id)).length },
        ].map(k => (
          <div key={k.label} style={{ ...s.cardStyle, padding: '14px 18px' }}>
            <div style={{ font: `400 10px ${s.MONO}`, textTransform: 'uppercase', letterSpacing: 1, color: s.text3, marginBottom: 4 }}>{k.label}</div>
            <div style={{ font: `600 24px ${s.FONT}`, color: k.color || s.text }}>{k.value}</div>
          </div>
        ))}
      </div>

      <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search client..." style={{ ...s.input, maxWidth: 300, marginBottom: 16 }} />

      {/* Appointment Cards */}
      <div style={{ display: 'grid', gap: 10 }}>
        {todayAppts.map(appt => {
          const svc = services.find(sv => sv.id === appt.serviceId);
          const prov = providers.find(p => p.id === appt.providerId);
          const si = statusInfo(appt);
          const ck = getCheckin(appt.id);
          const wait = waitTime(appt);

          return (
            <div key={appt.id} style={{
              ...s.cardStyle, padding: '18px 22px', display: 'flex', alignItems: 'center', gap: 16,
              borderLeftWidth: 4, borderLeftStyle: 'solid', borderLeftColor: si.color,
            }}>
              {/* Time */}
              <div style={{ width: 60, textAlign: 'center', flexShrink: 0 }}>
                <div style={{ font: `600 16px ${s.MONO}`, color: s.text }}>{appt.time}</div>
                <div style={{ font: `400 10px ${s.FONT}`, color: s.text3 }}>{appt.duration}min</div>
              </div>

              {/* Client Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ font: `500 15px ${s.FONT}`, color: s.text, marginBottom: 2 }}>{appt.patientName}</div>
                <div style={{ font: `400 13px ${s.FONT}`, color: s.text2 }}>{svc?.name || 'Service'} — {prov?.name?.split(',')[0] || 'Instructor'}</div>
                {appt.room && <div style={{ font: `400 11px ${s.FONT}`, color: s.text3 }}>{appt.room}</div>}
              </div>

              {/* Status */}
              <div style={{ textAlign: 'center', flexShrink: 0 }}>
                <span style={{ padding: '4px 12px', borderRadius: 100, font: `500 11px ${s.FONT}`, textTransform: 'uppercase', background: si.bg, color: si.color }}>{si.label}</span>
                {wait !== null && ck?.status === 'checked-in' && (
                  <div style={{ font: `500 11px ${s.MONO}`, color: wait > 15 ? s.danger : s.text3, marginTop: 4 }}>{wait}m waiting</div>
                )}
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                {!ck && (
                  <button onClick={() => startCheckin(appt)} style={s.pillAccent}>Check In</button>
                )}
                {ck?.status === 'checked-in' && (
                  <button onClick={() => updateStatus(appt.id, 'in-class')} style={{ ...s.pillOutline, fontSize: 12 }}>Send to Instructor</button>
                )}
                {ck?.status === 'in-class' && (
                  <button onClick={() => updateStatus(appt.id, 'complete')} style={{ ...s.pillAccent, background: s.success, fontSize: 12 }}>Complete</button>
                )}
                {ck?.status === 'complete' && (
                  <span style={{ font: `500 12px ${s.FONT}`, color: s.success }}>Done ✓</span>
                )}
              </div>
            </div>
          );
        })}
        {todayAppts.length === 0 && (
          <div style={{ ...s.cardStyle, padding: 48, textAlign: 'center', font: `400 14px ${s.FONT}`, color: s.text3 }}>No appointments scheduled for today</div>
        )}
      </div>

      {/* Verify & Check-In Modal */}
      {showVerify && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300 }} onClick={() => setShowVerify(null)}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 32, maxWidth: 500, width: '90%', boxShadow: s.shadowLg }} onClick={e => e.stopPropagation()}>
            <h2 style={{ font: `600 20px ${s.FONT}`, color: s.text, marginBottom: 8 }}>Check In: {showVerify.patientName}</h2>
            <p style={{ font: `400 13px ${s.FONT}`, color: s.text2, marginBottom: 20 }}>Verify client information before checking in.</p>

            <div className="ci-modal-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label style={s.label}>Phone (verify)</label>
                <input value={verifyForm.phone} onChange={e => setVerifyForm({ ...verifyForm, phone: e.target.value })} style={s.input} />
              </div>
              <div>
                <label style={s.label}>Date of Birth (verify)</label>
                <input type="date" value={verifyForm.dob} onChange={e => setVerifyForm({ ...verifyForm, dob: e.target.value })} style={s.input} />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={s.label}>Any Allergies?</label>
                <input value={verifyForm.allergies} onChange={e => setVerifyForm({ ...verifyForm, allergies: e.target.value })} style={s.input} placeholder="None, or list allergies" />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={s.label}>Current Medications</label>
                <input value={verifyForm.medications} onChange={e => setVerifyForm({ ...verifyForm, medications: e.target.value })} style={s.input} placeholder="List current medications" />
              </div>
            </div>

            {/* Only show pregnancy check for contraindicated services */}
            {(() => {
              const svc = services.find(sv => sv.id === showVerify?.serviceId);
              const safeInPregnancy = ['Consultation', 'Virtual Consultation', 'Red Light Therapy'];
              const showPregnancy = svc && !safeInPregnancy.includes(svc.name);
              if (!showPregnancy) return null;
              return (
                <>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 16, cursor: 'pointer' }}>
                    <input type="checkbox" checked={verifyForm.pregnant} onChange={e => setVerifyForm({ ...verifyForm, pregnant: e.target.checked })} style={{ accentColor: s.danger, width: 18, height: 18 }} />
                    <span style={{ font: `400 13px ${s.FONT}`, color: s.text }}>Client is or may be pregnant</span>
                  </label>
                  {verifyForm.pregnant && (
                    <div style={{ padding: '10px 14px', background: '#FEF2F2', borderRadius: 8, marginTop: 8, font: `500 12px ${s.FONT}`, color: s.danger }}>
                      ALERT: {svc?.name} may be contraindicated during pregnancy. Confirm session safety with instructor before proceeding.
                    </div>
                  )}
                </>
              );
            })()}

            <div style={{ display: 'flex', gap: 10, marginTop: 24, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowVerify(null)} style={s.pillGhost}>Cancel</button>
              <button onClick={completeCheckin} style={s.pillAccent}>Complete Check-In</button>
            </div>
          </div>
        </div>
      )}

      <CheckoutDrawer
        open={!!checkoutAppt}
        onClose={() => setCheckoutAppt(null)}
        appointment={checkoutAppt}
      />
    </div>
  );
}
