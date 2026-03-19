import { useState, useEffect } from 'react';
import { useStyles } from '../theme';
import { getTextMessages, addTextMessage, getPatients, getAppointments, getSettings, subscribe } from '../data/store';

const TEMPLATES = [
  { id: 'reminder', name: 'Appointment Reminder', preview: 'Hi {name}, reminder: your {service} appointment is tomorrow at {time}. Reply C to confirm or R to reschedule.' },
  { id: 'confirm', name: 'Booking Confirmation', preview: 'Hi {name}, your {service} appointment is confirmed for {date} at {time}. We look forward to seeing you!' },
  { id: 'followup', name: 'Post-Treatment Check-In', preview: 'Hi {name}, how are you feeling after your {service} yesterday? If you have any questions, reply here or call us.' },
  { id: 'promo', name: 'Special Offer', preview: 'Hi {name}, exclusive offer: [offer details]. Book by [date] to save. Reply BOOK or call us!' },
  { id: 'reactivation', name: 'We Miss You', preview: 'Hi {name}, it has been a while! We would love to see you. Enjoy [offer] on your next visit. Reply BOOK to schedule.' },
  { id: 'birthday', name: 'Birthday', preview: 'Happy birthday, {name}! 🎂 Enjoy a special gift from us: [offer]. Valid this month. We hope your day is beautiful!' },
  { id: 'review', name: 'Review Request', preview: 'Hi {name}, thank you for visiting us! If you loved your experience, we would appreciate a quick review: [link]' },
  { id: 'custom', name: 'Custom Message', preview: '' },
];

export default function TextMessages() {
  const s = useStyles();
  const [, setTick] = useState(0);
  useEffect(() => subscribe(() => setTick(t => t + 1)), []);

  const [tab, setTab] = useState('compose');
  const [template, setTemplate] = useState(null);
  const [message, setMessage] = useState('');
  const [audience, setAudience] = useState('all');
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedPatients, setSelectedPatients] = useState([]);
  const [sendMode, setSendMode] = useState('blast'); // 'blast' | 'individual'

  const texts = getTextMessages();
  const clients = getPatients();
  const appointments = getAppointments();
  const settings = getSettings();

  const getAudienceCount = () => {
    if (sendMode === 'individual') return selectedPatients.length;
    if (audience === 'all') return clients.length;
    if (audience === 'upcoming') return new Set(appointments.filter(a => a.date >= new Date().toISOString().slice(0, 10) && a.date <= new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10)).map(a => a.patientId)).size;
    if (audience === 'members') return clients.filter(p => p.membershipTier !== 'None').length;
    if (audience === 'lapsed') { const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 90); return clients.filter(p => p.lastVisit && new Date(p.lastVisit) < cutoff).length; }
    return 0;
  };

  const selectTemplate = (tpl) => {
    setTemplate(tpl.id);
    setMessage(tpl.preview);
  };

  const handleSend = () => {
    if (!message.trim()) return;
    setSending(true);
    setTimeout(() => {
      addTextMessage({
        message,
        audience: sendMode === 'individual' ? `${selectedPatients.length} selected` : audience,
        recipientCount: getAudienceCount(),
        template: template,
        status: 'Sent',
      });
      setSending(false);
      setMessage(''); setTemplate(null); setSelectedPatients([]);
      setTab('sent');
    }, 1000);
  };

  const togglePatient = (id) => {
    setSelectedPatients(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
  };

  const filteredPatients = clients.filter(p => {
    if (!search) return true;
    const q = search.toLowerCase();
    return `${p.firstName} ${p.lastName}`.toLowerCase().includes(q) || p.phone?.includes(q);
  });

  const charCount = message.length;
  const segments = Math.ceil(charCount / 160) || 1;

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ font: `600 26px ${s.FONT}`, color: s.text, marginBottom: 4 }}>Text Messages</h1>
        <p style={{ font: `400 14px ${s.FONT}`, color: s.text2 }}>Send SMS reminders, promotions, and check-ins</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 28, background: '#F0F0F0', borderRadius: 8, overflow: 'hidden', width: 'fit-content' }}>
        {[['compose', 'Compose'], ['sent', `Sent (${texts.length})`], ['templates', 'Templates']].map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} style={{
            padding: '9px 20px', background: tab === k ? '#fff' : 'transparent', border: 'none',
            font: `500 13px ${s.FONT}`, color: tab === k ? s.text : s.text3, cursor: 'pointer',
            borderRadius: tab === k ? 8 : 0, boxShadow: tab === k ? s.shadow : 'none',
          }}>{l}</button>
        ))}
      </div>

      {tab === 'compose' && (
        <div className="texts-compose-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24 }}>
          {/* Left: Compose */}
          <div>
            {/* Send mode toggle */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
              <button onClick={() => setSendMode('blast')} style={{ ...s.cardStyle, padding: '14px 18px', flex: 1, cursor: 'pointer', textAlign: 'left', borderColor: sendMode === 'blast' ? s.accent : '#E5E5E5', borderWidth: sendMode === 'blast' ? 2 : 1 }}>
                <div style={{ font: `600 13px ${s.FONT}`, color: sendMode === 'blast' ? s.accent : s.text }}>Text Blast</div>
                <div style={{ font: `400 11px ${s.FONT}`, color: s.text3 }}>Send to a group</div>
              </button>
              <button onClick={() => setSendMode('individual')} style={{ ...s.cardStyle, padding: '14px 18px', flex: 1, cursor: 'pointer', textAlign: 'left', borderColor: sendMode === 'individual' ? s.accent : '#E5E5E5', borderWidth: sendMode === 'individual' ? 2 : 1 }}>
                <div style={{ font: `600 13px ${s.FONT}`, color: sendMode === 'individual' ? s.accent : s.text }}>Individual</div>
                <div style={{ font: `400 11px ${s.FONT}`, color: s.text3 }}>Pick specific clients</div>
              </button>
            </div>

            {/* Audience (blast mode) */}
            {sendMode === 'blast' && (
              <div style={{ marginBottom: 20 }}>
                <label style={s.label}>Audience</label>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {[['all', 'All Clients'], ['upcoming', 'Upcoming Appts'], ['members', 'Members'], ['lapsed', 'Lapsed (90+ days)']].map(([id, name]) => (
                    <button key={id} onClick={() => setAudience(id)} style={{
                      ...s.pill, padding: '7px 14px', fontSize: 12,
                      background: audience === id ? s.accent : 'transparent',
                      color: audience === id ? s.accentText : s.text2,
                      border: audience === id ? `1px solid ${s.accent}` : '1px solid #E5E5E5',
                    }}>{name}</button>
                  ))}
                </div>
              </div>
            )}

            {/* Client picker (individual mode) */}
            {sendMode === 'individual' && (
              <div style={{ marginBottom: 20 }}>
                <label style={s.label}>Select Clients ({selectedPatients.length} selected)</label>
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or phone..." style={{ ...s.input, marginBottom: 10 }} />
                <div style={{ ...s.cardStyle, maxHeight: 200, overflowY: 'auto' }}>
                  {filteredPatients.slice(0, 20).map(p => (
                    <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px', cursor: 'pointer', borderBottom: '1px solid #F8F8F8' }}>
                      <input type="checkbox" checked={selectedPatients.includes(p.id)} onChange={() => togglePatient(p.id)} style={{ accentColor: s.accent }} />
                      <span style={{ font: `400 13px ${s.FONT}`, color: s.text }}>{p.firstName} {p.lastName}</span>
                      <span style={{ font: `400 11px ${s.FONT}`, color: s.text3, marginLeft: 'auto' }}>{p.phone}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Template picker */}
            <div style={{ marginBottom: 20 }}>
              <label style={s.label}>Quick Template</label>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {TEMPLATES.map(tpl => (
                  <button key={tpl.id} onClick={() => selectTemplate(tpl)} style={{
                    ...s.pill, padding: '6px 12px', fontSize: 11,
                    background: template === tpl.id ? s.accent : 'transparent',
                    color: template === tpl.id ? s.accentText : s.text2,
                    border: template === tpl.id ? `1px solid ${s.accent}` : '1px solid #E5E5E5',
                  }}>{tpl.name}</button>
                ))}
              </div>
            </div>

            {/* Message */}
            <div style={{ marginBottom: 20 }}>
              <label style={s.label}>Message</label>
              <textarea value={message} onChange={e => setMessage(e.target.value)} rows={5} style={{ ...s.input, resize: 'vertical', lineHeight: 1.6 }} placeholder="Type your message..." />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                <span style={{ font: `400 11px ${s.MONO}`, color: charCount > 160 ? s.warning : s.text3 }}>{charCount}/160 ({segments} segment{segments > 1 ? 's' : ''})</span>
                <span style={{ font: `400 11px ${s.FONT}`, color: s.text3 }}>{getAudienceCount()} recipients</span>
              </div>
            </div>

            <button onClick={handleSend} disabled={sending || !message.trim() || getAudienceCount() === 0} style={{ ...s.pillAccent, opacity: (sending || !message.trim() || getAudienceCount() === 0) ? 0.5 : 1 }}>
              {sending ? 'Sending...' : `Send to ${getAudienceCount()} clients`}
            </button>
          </div>

          {/* Right: Phone Preview */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div style={{ width: 280, background: '#F8F8F8', borderRadius: 32, padding: '48px 16px 32px', border: '1px solid #E5E5E5' }}>
              <div style={{ textAlign: 'center', marginBottom: 16 }}>
                <div style={{ font: `600 12px ${s.FONT}`, color: s.text }}>{settings.businessName || 'Pilates & Barre'}</div>
                <div style={{ font: `400 10px ${s.FONT}`, color: s.text3 }}>SMS</div>
              </div>
              <div style={{ background: '#fff', borderRadius: 16, padding: 14, minHeight: 120, boxShadow: s.shadow }}>
                {message ? (
                  <div style={{ background: s.accentLight, padding: '10px 14px', borderRadius: '14px 14px 14px 4px', font: `400 13px ${s.FONT}`, color: s.text, lineHeight: 1.5 }}>
                    {message}
                  </div>
                ) : (
                  <div style={{ font: `400 12px ${s.FONT}`, color: s.text3, textAlign: 'center', padding: 20 }}>Message preview</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sent Tab */}
      {tab === 'sent' && (
        <div style={s.tableWrap}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #E5E5E5' }}>
                {['Message', 'Audience', 'Recipients', 'Sent', 'Delivery'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', font: `500 11px ${s.MONO}`, textTransform: 'uppercase', letterSpacing: 1, color: s.text3, textAlign: 'left' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {texts.length === 0 ? (
                <tr><td colSpan="5" style={{ padding: 48, textAlign: 'center', font: `400 14px ${s.FONT}`, color: s.text3 }}>No texts sent yet</td></tr>
              ) : texts.map(t => {
                const deliveryRate = 95 + Math.floor(Math.random() * 5);
                return (
                  <tr key={t.id} style={{ borderBottom: '1px solid #F5F5F5' }}>
                    <td style={{ padding: '14px 16px', font: `400 13px ${s.FONT}`, color: s.text, maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.message}</td>
                    <td style={{ padding: '14px 16px' }}><span style={{ padding: '3px 10px', borderRadius: 100, font: `500 11px ${s.FONT}`, background: '#F5F5F5', color: s.text2 }}>{t.audience}</span></td>
                    <td style={{ padding: '14px 16px', font: `500 13px ${s.MONO}`, color: s.text }}>{t.recipientCount}</td>
                    <td style={{ padding: '14px 16px', font: `400 13px ${s.FONT}`, color: s.text2 }}>{new Date(t.sentDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</td>
                    <td style={{ padding: '14px 16px', font: `500 12px ${s.MONO}`, color: s.success }}>{deliveryRate}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Templates Tab */}
      {tab === 'templates' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
          {TEMPLATES.filter(t => t.id !== 'custom').map(tpl => (
            <div key={tpl.id} style={{ ...s.cardStyle, padding: 20 }}>
              <div style={{ font: `600 14px ${s.FONT}`, color: s.text, marginBottom: 8 }}>{tpl.name}</div>
              <div style={{ font: `400 13px ${s.FONT}`, color: s.text2, lineHeight: 1.5, marginBottom: 12, background: '#FAFAFA', padding: 12, borderRadius: 8 }}>{tpl.preview}</div>
              <button onClick={() => { selectTemplate(tpl); setTab('compose'); }} style={{ ...s.pillOutline, padding: '6px 14px', fontSize: 11 }}>Use Template</button>
            </div>
          ))}
        </div>
      )}
      <style>{`
        @media (max-width: 768px) {
          .texts-compose-grid {
            grid-template-columns: 1fr !important;
          }
          .texts-compose-grid > div:last-child {
            order: -1;
          }
        }
      `}</style>
    </div>
  );
}
