import { useState, useEffect, useRef } from 'react';
import { useStyles } from '../theme';
import { getEmails, addEmail, getPatients, getAppointments, getSettings, subscribe } from '../data/store';

const TEMPLATES = {
  appointment: { name: 'Appointment Reminder', icon: '📅', desc: 'Remind clients of upcoming visits', subject: 'Your Session is Coming Up!', body: 'Hi [Client],\n\nThis is a friendly reminder about your upcoming session:\n\nClass: [Service]\nDate: [Date]\nTime: [Time]\nInstructor: [Instructor]\n\nPlease arrive 10 minutes early and wear comfortable workout attire. If you need to reschedule, reply to this email or call us.\n\nSee you soon!' },
  followup: { name: 'Post-Session Follow-Up', icon: '💝', desc: 'Check in after a session', subject: 'How Did Your Session Feel?', body: 'Hi [Client],\n\nWe hope you are feeling strong after your recent [Service] session!\n\nA few reminders to maximize your results:\n- Stay hydrated and give your body time to integrate the work\n- Notice how your posture and alignment feel throughout the day\n- If anything felt tight or uncomfortable, let your instructor know next time\n\nIf you have any questions, do not hesitate to reach out.\n\nWe recommend scheduling your next session within [timeframe] to keep building momentum.\n\nWarmly,\n[Pilates & Barre] Team' },
  promo: { name: 'Special Offer', icon: '✨', desc: 'Promote a deal or package', subject: 'Exclusive Offer Just For You', body: 'Hi [Client],\n\nWe have something special for you!\n\n[Offer details — e.g., 20% off your next Reformer session or a class package deal]\n\nThis offer is valid through [end date]. Book online or reply to this email to reserve your spot.\n\nLimited availability — do not miss out!\n\nBest,\n[Pilates & Barre] Team' },
  newsletter: { name: 'Monthly Newsletter', icon: '📰', desc: 'Monthly updates and tips', subject: 'Monthly Update from [Pilates & Barre]', body: 'Hi [Client],\n\nHere is what is new this month:\n\nNEW CLASSES\n- [New class or workshop added to the schedule]\n\nMOVEMENT TIPS\n[Seasonal movement or wellness advice]\n\nSPECIAL OFFERS\n- [Current promotions]\n\nUPCOMING\n- [Events, workshops, or schedule updates]\n\nThank you for being part of our community.\n\nWarmly,\n[Pilates & Barre] Team' },
  reengagement: { name: 'We Miss You', icon: '💌', desc: 'Re-engage lapsed clients', subject: 'It Has Been a While — We Would Love to See You', body: 'Hi [Client],\n\nWe noticed it has been a while since your last visit and wanted to check in!\n\nYour last session was [Service] on [Date]. Coming back even once a week makes a real difference for your strength and flexibility.\n\nAs a welcome back, enjoy [offer] on your next visit.\n\nBook online or reply to schedule.\n\nWe miss you!\n[Pilates & Barre] Team' },
  blank: { name: 'Start from Scratch', icon: '📝', desc: 'Empty canvas', subject: '', body: '' },
};

const AUDIENCES = [
  { id: 'all', name: 'All Clients', desc: 'Everyone in your system' },
  { id: 'members', name: 'Members', desc: 'Clients with membership' },
  { id: 'recent', name: 'Recent Visitors', desc: 'Visited in last 30 days' },
  { id: 'lapsed', name: 'Lapsed Clients', desc: 'No visit in 90+ days' },
  { id: 'vip', name: 'VIP / High Spend', desc: 'Top spending clients' },
];

export default function Email() {
  const s = useStyles();
  const [, setTick] = useState(0);
  useEffect(() => subscribe(() => setTick(t => t + 1)), []);

  const [tab, setTab] = useState('compose');
  const [step, setStep] = useState(1); // 1: audience, 2: template, 3: write, 4: preview
  const [audience, setAudience] = useState('all');
  const [template, setTemplate] = useState(null);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState('');
  const bodyRef = useRef(null);

  const emails = getEmails();
  const clients = getPatients();
  const settings = getSettings();

  const getAudienceCount = (aud) => {
    const a = aud || audience;
    if (a === 'all') return clients.length;
    if (a === 'members') return clients.filter(p => p.membershipTier !== 'None').length;
    if (a === 'recent') { const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 30); return clients.filter(p => p.lastVisit && new Date(p.lastVisit) >= cutoff).length; }
    if (a === 'lapsed') { const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 90); return clients.filter(p => p.lastVisit && new Date(p.lastVisit) < cutoff).length; }
    if (a === 'vip') return clients.filter(p => p.totalSpent > 500000).length;
    return 0;
  };

  const audienceLabel = AUDIENCES.find(a => a.id === audience)?.name || 'All';

  const selectTemplate = (key) => {
    setTemplate(key);
    const tpl = TEMPLATES[key];
    setSubject(tpl.subject.replace('[Pilates & Barre]', settings.businessName || 'Pilates & Barre'));
    setBody(tpl.body.replace(/\[Pilates & Barre\]/g, settings.businessName || 'Pilates & Barre'));
  };

  const handleSend = () => {
    if (!subject.trim() || !body.trim()) return;
    setSending(true);
    setTimeout(() => {
      addEmail({ subject, body, audience: audienceLabel, status: 'Sent', recipientCount: getAudienceCount() });
      setSending(false);
      setSubject(''); setBody(''); setTemplate(null); setStep(1);
      setTab('sent');
    }, 1200);
  };

  const wrapText = (marker) => {
    const ta = bodyRef.current;
    if (!ta) return;
    const start = ta.selectionStart, end = ta.selectionEnd;
    const selected = body.slice(start, end);
    setBody(body.slice(0, start) + marker + selected + marker + body.slice(end));
  };

  const StepIndicator = () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 28 }}>
      {[1, 2, 3, 4].map(n => (
        <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div onClick={() => n < step && setStep(n)} style={{
            width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: step >= n ? s.accent : '#E5E5E5', color: step >= n ? s.accentText : s.text3,
            font: `600 11px ${s.FONT}`, cursor: n < step ? 'pointer' : 'default',
          }}>{n}</div>
          {n < 4 && <div style={{ width: 24, height: 2, background: step > n ? s.accent : '#E5E5E5', borderRadius: 1 }} />}
        </div>
      ))}
      <span style={{ font: `400 12px ${s.FONT}`, color: s.text3, marginLeft: 8 }}>
        {['Audience', 'Template', 'Write', 'Preview'][step - 1]}
      </span>
    </div>
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ font: `600 26px ${s.FONT}`, color: s.text, marginBottom: 4 }}>Email</h1>
          <p style={{ font: `400 14px ${s.FONT}`, color: s.text2 }}>Compose and send branded emails to your clients</p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 28, background: '#F0F0F0', borderRadius: 8, overflow: 'hidden', width: 'fit-content' }}>
        {[['compose', 'Compose'], ['sent', `Sent (${emails.length})`]].map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} style={{
            padding: '9px 20px', background: tab === k ? '#fff' : 'transparent', border: 'none',
            font: `500 13px ${s.FONT}`, color: tab === k ? s.text : s.text3, cursor: 'pointer',
            borderRadius: tab === k ? 8 : 0, boxShadow: tab === k ? s.shadow : 'none',
          }}>{l}</button>
        ))}
      </div>

      {tab === 'compose' && (
        <div style={{ maxWidth: 720 }}>
          <StepIndicator />

          {/* Step 1: Audience */}
          {step === 1 && (
            <div>
              <h2 style={{ font: `600 20px ${s.FONT}`, color: s.text, marginBottom: 20 }}>Who is this for?</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
                {AUDIENCES.map(a => (
                  <button key={a.id} onClick={() => setAudience(a.id)} style={{
                    ...s.cardStyle, padding: '18px 16px', textAlign: 'left', cursor: 'pointer',
                    borderColor: audience === a.id ? s.accent : '#E5E5E5',
                    borderWidth: audience === a.id ? 2 : 1,
                  }}>
                    <div style={{ font: `600 14px ${s.FONT}`, color: audience === a.id ? s.accent : s.text, marginBottom: 4 }}>{a.name}</div>
                    <div style={{ font: `400 12px ${s.FONT}`, color: s.text3, marginBottom: 6 }}>{a.desc}</div>
                    <div style={{ font: `600 12px ${s.MONO}`, color: s.accent }}>{getAudienceCount(a.id)} clients</div>
                  </button>
                ))}
              </div>
              <button onClick={() => setStep(2)} style={{ ...s.pillAccent, marginTop: 20 }}>Next — Choose Template</button>
            </div>
          )}

          {/* Step 2: Template */}
          {step === 2 && (
            <div>
              <h2 style={{ font: `600 20px ${s.FONT}`, color: s.text, marginBottom: 20 }}>Pick a starting point</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10 }}>
                {Object.entries(TEMPLATES).map(([key, tpl]) => (
                  <button key={key} onClick={() => selectTemplate(key)} style={{
                    ...s.cardStyle, padding: '18px 16px', textAlign: 'left', cursor: 'pointer',
                    borderColor: template === key ? s.accent : '#E5E5E5',
                    borderWidth: template === key ? 2 : 1,
                  }}>
                    <div style={{ fontSize: 28, marginBottom: 8 }}>{tpl.icon}</div>
                    <div style={{ font: `600 13px ${s.FONT}`, color: template === key ? s.accent : s.text, marginBottom: 4 }}>{tpl.name}</div>
                    <div style={{ font: `400 11px ${s.FONT}`, color: s.text3 }}>{tpl.desc}</div>
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                <button onClick={() => setStep(1)} style={s.pillGhost}>Back</button>
                <button onClick={() => setStep(3)} style={s.pillAccent}>Next — Write</button>
              </div>
            </div>
          )}

          {/* Step 3: Write */}
          {step === 3 && (
            <div>
              <h2 style={{ font: `600 20px ${s.FONT}`, color: s.text, marginBottom: 20 }}>Write your email</h2>
              <div style={{ marginBottom: 20 }}>
                <label style={s.label}>Subject Line</label>
                <input value={subject} onChange={e => setSubject(e.target.value)} style={{ ...s.input, fontSize: 16, padding: '14px 16px' }} placeholder="What is this email about?" />
              </div>
              <div>
                <label style={s.label}>Body</label>
                <div style={{ border: '1px solid #E5E5E5', borderRadius: 12, overflow: 'hidden' }}>
                  <div style={{ display: 'flex', gap: 4, padding: '8px 12px', background: '#FAFAFA', borderBottom: '1px solid #F0F0F0' }}>
                    <button onClick={() => wrapText('**')} style={{ ...s.pillGhost, padding: '4px 8px', fontSize: 12, fontWeight: 700 }}>B</button>
                    <button onClick={() => wrapText('_')} style={{ ...s.pillGhost, padding: '4px 8px', fontSize: 12, fontStyle: 'italic' }}>I</button>
                    <div style={{ flex: 1 }} />
                    <span style={{ font: `400 11px ${s.FONT}`, color: s.text3, alignSelf: 'center' }}>Select text, then format</span>
                  </div>
                  <textarea ref={bodyRef} value={body} onChange={e => setBody(e.target.value)} rows={12} style={{ width: '100%', padding: 20, border: 'none', outline: 'none', font: `400 14px/1.8 ${s.FONT}`, color: s.text, resize: 'vertical', boxSizing: 'border-box' }} placeholder="Write your email here..." />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                <button onClick={() => setStep(2)} style={s.pillGhost}>Back</button>
                <button onClick={() => { if (subject.trim() && body.trim()) setStep(4); }} style={s.pillAccent}>Preview</button>
              </div>
            </div>
          )}

          {/* Step 4: Preview */}
          {step === 4 && (
            <div>
              <h2 style={{ font: `600 20px ${s.FONT}`, color: s.text, marginBottom: 20 }}>Preview & Send</h2>
              {/* Email preview */}
              <div style={{ background: '#F5F5F5', borderRadius: 12, padding: 24, marginBottom: 20 }}>
                <div style={{ background: '#fff', borderRadius: 10, overflow: 'hidden', boxShadow: s.shadow, maxWidth: 520, margin: '0 auto' }}>
                  <div style={{ background: s.accent, padding: '20px 24px', textAlign: 'center' }}>
                    <div style={{ font: `600 16px ${s.FONT}`, color: s.accentText }}>{settings.businessName || 'Pilates & Barre'}</div>
                    <div style={{ font: `400 11px ${s.FONT}`, color: s.accentText, opacity: 0.7 }}>{settings.tagline || ''}</div>
                  </div>
                  <div style={{ padding: '24px' }}>
                    <h3 style={{ font: `600 18px ${s.FONT}`, color: s.text, marginBottom: 12 }}>{subject || '(No subject)'}</h3>
                    <div style={{ font: `400 14px/1.8 ${s.FONT}`, color: '#444', whiteSpace: 'pre-wrap' }}>{body || '(No content)'}</div>
                  </div>
                  <div style={{ padding: '16px 24px', borderTop: '1px solid #F0F0F0', textAlign: 'center', font: `400 11px ${s.FONT}`, color: s.text3 }}>
                    {settings.businessName} | {settings.email}
                  </div>
                </div>
              </div>

              <div style={{ ...s.cardStyle, padding: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                  <div style={{ font: `500 14px ${s.FONT}`, color: s.text }}>Recipients</div>
                  <div style={{ font: `400 13px ${s.FONT}`, color: s.text2 }}>{audienceLabel} — {getAudienceCount()} clients</div>
                </div>
                <button onClick={() => alert('Test email sent to your inbox!')} style={s.pillOutline}>Send Test</button>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setStep(3)} style={s.pillGhost}>Back</button>
                <button onClick={handleSend} disabled={sending} style={{ ...s.pillAccent, opacity: sending ? 0.6 : 1 }}>
                  {sending ? 'Sending...' : `Send to ${getAudienceCount()} clients`}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Sent Tab */}
      {tab === 'sent' && (
        <div className="email-sent-table" style={s.tableWrap}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #E5E5E5' }}>
                {['Subject', 'Audience', 'Recipients', 'Sent', 'Open Rate', 'Click Rate'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', font: `500 11px ${s.MONO}`, textTransform: 'uppercase', letterSpacing: 1, color: s.text3, textAlign: 'left' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {emails.length === 0 ? (
                <tr><td colSpan="6" style={{ padding: 48, textAlign: 'center', font: `400 14px ${s.FONT}`, color: s.text3 }}>No emails sent yet. Compose your first email to get started.</td></tr>
              ) : emails.map(em => {
                const openRate = Math.round(25 + Math.random() * 40);
                const clickRate = Math.round(5 + Math.random() * 15);
                return (
                  <tr key={em.id} style={{ borderBottom: '1px solid #F5F5F5' }}>
                    <td style={{ padding: '14px 16px', font: `500 13px ${s.FONT}`, color: s.text, maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{em.subject}</td>
                    <td style={{ padding: '14px 16px' }}><span style={{ padding: '3px 10px', borderRadius: 100, font: `500 11px ${s.FONT}`, background: '#F5F5F5', color: s.text2 }}>{em.audience}</span></td>
                    <td style={{ padding: '14px 16px', font: `500 13px ${s.MONO}`, color: s.text }}>{em.recipientCount}</td>
                    <td style={{ padding: '14px 16px', font: `400 13px ${s.FONT}`, color: s.text2 }}>{new Date(em.sentDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 48, height: 4, background: '#F0F0F0', borderRadius: 2, overflow: 'hidden' }}>
                          <div style={{ width: `${openRate}%`, height: '100%', background: openRate > 40 ? s.success : s.accent, borderRadius: 2 }} />
                        </div>
                        <span style={{ font: `500 12px ${s.MONO}`, color: openRate > 40 ? s.success : s.accent }}>{openRate}%</span>
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px', font: `500 12px ${s.MONO}`, color: s.text2 }}>{clickRate}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <style>{`
        @media (max-width: 768px) {
          .email-sent-table {
            overflow-x: auto !important;
            -webkit-overflow-scrolling: touch;
          }
        }
      `}</style>
    </div>
  );
}
