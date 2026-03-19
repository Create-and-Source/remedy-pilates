import { useState, useMemo } from 'react';
import { useStyles } from '../theme';
import { getPatients, getAppointments, getServices, getSettings } from '../data/store';

// --- Recovery tip templates per class type ---
const TEMPLATES = {
  'Reformer': {
    tips: [
      'Hip flexor stretch: lunge forward, drop back knee, hold 30s each side.',
      'Cat-cow: 8 slow rounds to decompress your spine.',
      'Drink 16oz of water in the next 30 minutes — your muscles will thank you.',
    ],
  },
  'Mat Pilates': {
    tips: [
      'Standing roll-down: chin to chest, roll slowly to the floor and back up. 3x.',
      'Neck side-stretch: ear to shoulder, breathe into the opposite side. 30s each.',
      'Shoulder rolls backward, 10 slow circles — release that upper trapezius.',
    ],
  },
  'Barre': {
    tips: [
      'Calf stretch on a step or wall — 45s each side. You earned it.',
      'Standing quad stretch, wall for balance if needed. 30s each leg.',
      'Foam roll your glutes for 60s — find the tender spots and breathe.',
    ],
  },
  'Barre Burn': {
    tips: [
      'If anything feels hot or inflamed, ice for 10 min. You pushed hard today.',
      'Gentle 10-min walk in the next hour helps clear lactate.',
      'Get protein within 30 minutes — shake, Greek yogurt, whatever you have on hand.',
    ],
  },
  'TRX Fusion': {
    tips: [
      'Chest doorway stretch: arms at 90°, step through gently. Hold 30s.',
      'Lat stretch: hold a door frame overhead, let your weight pull you open. 20s each.',
      'Wrist circles — 10 each direction. TRX grips tighten everything up.',
    ],
  },
  'Stretch & Restore': {
    tips: [
      'Keep the deep breathing going tonight — in for 4, hold 4, out 6.',
      'Stay hydrated: another full glass of water before bed.',
      'Epsom salt bath tonight if you have it — 20 min, 2 cups of salts.',
    ],
  },
  'Prenatal': {
    tips: [
      'Side-lying rest on your left side for 20 min — great for circulation.',
      'Gentle pelvic tilts: flat back, 10 slow reps. Keeps the pelvis mobile.',
      'Double your hydration today — you and baby both need it.',
    ],
  },
  'Reformer + Cardio': {
    tips: [
      'Cool-down walk: even 5 minutes outside helps your heart rate settle.',
      'Hamstring stretch: fold forward from hips, soft knees. Hold 45s.',
      'Electrolytes — coconut water or a pinch of salt in your water works great.',
    ],
  },
};

const GREETINGS = [
  (name) => `Hi ${name}!`,
  (name) => `Great class today, ${name}!`,
  (name) => `Way to show up, ${name}!`,
];

const FATIGUE_NOTE = "Your body's been working hard this week — extra rest tonight. 💙";
const SIGNOFF = '— The Pilates Team';
const OPT_OUT = 'Reply STOP to opt out.';

function buildMessage(clientName, className, weekClassCount, greetingIdx = 0) {
  const template = TEMPLATES[className] || TEMPLATES['Mat Pilates'];
  const greeting = GREETINGS[greetingIdx % GREETINGS.length](clientName);
  const tips = template.tips.slice(0, 3).map((t, i) => `${i + 1}. ${t}`).join(' ');
  const fatigue = weekClassCount >= 3 ? ` ${FATIGUE_NOTE}` : '';
  return `${greeting} Here are a few recovery moves after ${className}:\n${tips}${fatigue}\n${SIGNOFF}\n${OPT_OUT}`;
}

function maskPhone(phone) {
  if (!phone) return '***-***-0000';
  const digits = phone.replace(/\D/g, '');
  return `***-***-${digits.slice(-4)}`;
}

function charCount(msg) {
  const len = msg.length;
  const segs = Math.ceil(len / 160);
  return { len, segs };
}

// Generate simulated sent messages from today's appointments
function buildSentMessages(appointments, patients) {
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const patMap = {};
  (patients || []).forEach((p) => { patMap[p.id] = p; });

  return (appointments || [])
    .filter((a) => {
      const aDate = (a.date || a.start || '').slice(0, 10);
      return aDate === todayStr && (a.status === 'completed' || a.checkedIn);
    })
    .map((a, i) => {
      const pat = patMap[a.patientId || a.clientId] || {};
      const name = pat.name || pat.firstName || 'Client';
      const firstName = name.split(' ')[0];
      const phone = pat.phone || '5550001234';
      const className = a.service || a.className || a.type || 'Mat Pilates';
      const weekCount = Math.floor(Math.random() * 5) + 1;
      const msg = buildMessage(firstName, className, weekCount, i % 3);
      const classEnd = new Date(a.end || a.date || now);
      const sentTime = new Date(classEnd.getTime() + 20 * 60 * 1000);
      const statuses = ['Delivered', 'Delivered', 'Delivered', 'Sent', 'Pending'];
      return {
        id: a.id || `msg-${i}`,
        name,
        phone: maskPhone(phone),
        className,
        sentTime,
        status: statuses[i % statuses.length],
        message: msg,
        weekCount,
      };
    });
}

// Fallback demo messages when no real data
const DEMO_MESSAGES = [
  {
    id: 'd1', name: 'Chloe Martinez', phone: '***-***-8821', className: 'Reformer',
    sentTime: new Date(Date.now() - 22 * 60000), status: 'Delivered', weekCount: 4,
    message: buildMessage('Chloe', 'Reformer', 4, 0),
  },
  {
    id: 'd2', name: 'Priya Nair', phone: '***-***-3344', className: 'Barre Burn',
    sentTime: new Date(Date.now() - 55 * 60000), status: 'Delivered', weekCount: 2,
    message: buildMessage('Priya', 'Barre Burn', 2, 1),
  },
  {
    id: 'd3', name: 'Jordan Lee', phone: '***-***-9901', className: 'Stretch & Restore',
    sentTime: new Date(Date.now() - 90 * 60000), status: 'Sent', weekCount: 1,
    message: buildMessage('Jordan', 'Stretch & Restore', 1, 2),
  },
  {
    id: 'd4', name: 'Amara Osei', phone: '***-***-6612', className: 'TRX Fusion',
    sentTime: new Date(Date.now() - 130 * 60000), status: 'Delivered', weekCount: 3,
    message: buildMessage('Amara', 'TRX Fusion', 3, 0),
  },
  {
    id: 'd5', name: 'Sofia Reyes', phone: '***-***-4477', className: 'Prenatal',
    sentTime: new Date(Date.now() - 180 * 60000), status: 'Delivered', weekCount: 2,
    message: buildMessage('Sofia', 'Prenatal', 2, 1),
  },
];

const WEEK_CHART = [14, 22, 18, 27, 31, 25, 29];
const WEEK_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const TOP_RESPONDERS = [
  { name: 'Chloe Martinez', replies: 8, last: '😊 Thank you!!' },
  { name: 'Priya Nair', replies: 6, last: '🙏 These tips are amazing' },
  { name: 'Amara Osei', replies: 5, last: 'Needed that reminder!' },
];

const DELAY_OPTIONS = ['20 min', '30 min', '1 hour'];
const CLASS_NAMES = Object.keys(TEMPLATES);

function fmtTime(date) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function RecoveryText() {
  const s = useStyles();

  const patients = useMemo(() => { try { return getPatients() || []; } catch { return []; } }, []);
  const appointments = useMemo(() => { try { return getAppointments() || []; } catch { return []; } }, []);

  const realMessages = useMemo(() => buildSentMessages(appointments, patients), [appointments, patients]);
  const messages = realMessages.length > 0 ? realMessages : DEMO_MESSAGES;

  const [autoSend, setAutoSend] = useState(true);
  const [delay, setDelay] = useState('20 min');
  const [quietHours, setQuietHours] = useState(true);
  const [freqCap, setFreqCap] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState(CLASS_NAMES[0]);
  const [templateEdits, setTemplateEdits] = useState({});
  const [expanded, setExpanded] = useState(null);
  const [testSending, setTestSending] = useState(false);
  const [testSent, setTestSent] = useState(false);

  const previewText = useMemo(() => {
    return templateEdits[selectedTemplate] || buildMessage('Alex', selectedTemplate, 1, 1);
  }, [selectedTemplate, templateEdits]);

  const { len, segs } = charCount(previewText);

  const todaySent = messages.length;
  const monthSent = todaySent + 146;
  const maxChart = Math.max(...WEEK_CHART);

  const card = {
    background: 'rgba(255,255,255,0.72)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255,255,255,0.6)',
    borderRadius: 16,
    boxShadow: s.shadow,
    padding: '24px 28px',
  };

  function handleSendTest() {
    setTestSending(true);
    setTestSent(false);
    setTimeout(() => {
      setTestSending(false);
      setTestSent(true);
      setTimeout(() => setTestSent(false), 3000);
    }, 1100);
  }

  return (
    <div style={{ padding: '36px 32px', maxWidth: 1100, margin: '0 auto', fontFamily: s.FONT }}>
      <style>{`
        @media (max-width: 768px) {
          .rt-stats-grid { grid-template-columns: 1fr 1fr !important; }
          .rt-main-grid { grid-template-columns: 1fr !important; }
          .rt-automation-grid { grid-template-columns: 1fr !important; }
          .rt-analytics-grid { grid-template-columns: 1fr !important; }
          .rt-page { padding: 16px 12px !important; }
        }
        @media (max-width: 480px) {
          .rt-stats-grid { grid-template-columns: 1fr 1fr !important; }
        }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: 36 }}>
        <div style={{ fontFamily: s.MONO, fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: s.accent, marginBottom: 8 }}>
          Automated Recovery Texts
        </div>
        <h1 style={{ fontFamily: s.DISPLAY, fontSize: 34, fontWeight: 700, color: s.text, margin: '0 0 8px' }}>
          Post-Class Recovery SMS
        </h1>
        <p style={{ color: s.text2, fontSize: 15, margin: 0 }}>
          Personalized movement tips land in clients' phones 20 minutes after they leave class. Kelly's brand touchpoint, automated.
        </p>
      </div>

      {/* Stats + Auto-send toggle */}
      <div className="rt-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr) auto', gap: 16, marginBottom: 28, alignItems: 'stretch' }}>
        {[
          { label: 'Sent Today', value: todaySent },
          { label: 'Open Rate', value: '78%' },
          { label: 'Reply Rate', value: '23%' },
          { label: 'This Month', value: monthSent },
        ].map((stat) => (
          <div key={stat.label} style={{ ...card, textAlign: 'center', padding: '20px 16px' }}>
            <div style={{ fontFamily: s.MONO, fontSize: 11, color: s.text3, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>{stat.label}</div>
            <div style={{ fontSize: 30, fontWeight: 700, color: s.accent }}>{stat.value}</div>
          </div>
        ))}
        <div style={{ ...card, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, minWidth: 130 }}>
          <div style={{ fontFamily: s.MONO, fontSize: 11, color: s.text3, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Auto-Send</div>
          <button
            onClick={() => setAutoSend(!autoSend)}
            style={{
              width: 52, height: 28, borderRadius: 14, border: 'none', cursor: 'pointer',
              background: autoSend ? s.accent : '#d1d5db',
              position: 'relative', transition: 'background 0.2s',
            }}
          >
            <span style={{
              position: 'absolute', top: 3, left: autoSend ? 27 : 3,
              width: 22, height: 22, borderRadius: '50%', background: '#fff',
              transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.18)',
            }} />
          </button>
          <div style={{ fontSize: 12, color: autoSend ? s.accent : s.text3, fontWeight: 600 }}>
            {autoSend ? 'Enabled' : 'Paused'}
          </div>
        </div>
      </div>

      <div className="rt-main-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 28 }}>

        {/* Recent Messages Feed */}
        <div style={card}>
          <div style={{ fontFamily: s.MONO, fontSize: 11, color: s.text3, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>Recent Messages</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {messages.map((msg) => {
              const isOpen = expanded === msg.id;
              return (
                <div
                  key={msg.id}
                  style={{ borderRadius: 10, border: '1px solid rgba(0,0,0,0.07)', padding: '12px 14px', background: 'rgba(255,255,255,0.6)', cursor: 'pointer' }}
                  onClick={() => setExpanded(isOpen ? null : msg.id)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14, color: s.text }}>{msg.name}</div>
                      <div style={{ fontSize: 12, color: s.text3, fontFamily: s.MONO }}>{msg.phone}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{
                        fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 6,
                        background: msg.status === 'Delivered' ? '#dcfce7' : msg.status === 'Sent' ? '#fef3c7' : '#f3f4f6',
                        color: msg.status === 'Delivered' ? '#166534' : msg.status === 'Sent' ? '#92400e' : '#6b7280',
                      }}>{msg.status}</span>
                      <div style={{ fontSize: 11, color: s.text3, marginTop: 4 }}>{fmtTime(msg.sentTime)}</div>
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: s.text2, marginTop: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>{msg.className}</span>
                    {msg.weekCount >= 3 && (
                      <span style={{ fontSize: 11, color: s.accent, fontWeight: 600 }}>⚡ High week</span>
                    )}
                  </div>
                  {!isOpen && (
                    <div style={{ fontSize: 12, color: s.text3, marginTop: 6, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {msg.message.split('\n')[0]}
                    </div>
                  )}
                  {isOpen && (
                    <div style={{ marginTop: 10, background: 'rgba(0,0,0,0.03)', borderRadius: 8, padding: '10px 12px', fontSize: 13, color: s.text, whiteSpace: 'pre-line', lineHeight: 1.6 }}>
                      {msg.message}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Template Editor + Phone Preview */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={card}>
            <div style={{ fontFamily: s.MONO, fontSize: 11, color: s.text3, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>Message Templates</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
              {CLASS_NAMES.map((cn) => (
                <button
                  key={cn}
                  onClick={() => setSelectedTemplate(cn)}
                  style={{
                    padding: '5px 12px', borderRadius: 20, border: `1.5px solid ${selectedTemplate === cn ? s.accent : 'rgba(0,0,0,0.12)'}`,
                    background: selectedTemplate === cn ? s.accent : 'transparent',
                    color: selectedTemplate === cn ? '#fff' : s.text2,
                    fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
                  }}
                >
                  {cn}
                </button>
              ))}
            </div>
            <textarea
              value={previewText}
              onChange={(e) => setTemplateEdits({ ...templateEdits, [selectedTemplate]: e.target.value })}
              style={{
                width: '100%', minHeight: 120, borderRadius: 10, border: '1px solid rgba(0,0,0,0.12)',
                padding: '10px 12px', fontSize: 13, fontFamily: s.FONT, color: s.text,
                background: 'rgba(255,255,255,0.7)', resize: 'vertical', boxSizing: 'border-box',
                lineHeight: 1.6,
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
              <div style={{ fontFamily: s.MONO, fontSize: 11, color: segs > 1 ? '#f59e0b' : s.text3 }}>
                {len} chars · {segs} SMS segment{segs !== 1 ? 's' : ''}
              </div>
              <button
                onClick={handleSendTest}
                disabled={testSending}
                style={{
                  padding: '7px 18px', borderRadius: 8, border: 'none',
                  background: testSent ? '#22c55e' : s.accent,
                  color: '#fff', fontWeight: 700, fontSize: 13, cursor: testSending ? 'wait' : 'pointer',
                  transition: 'background 0.2s',
                }}
              >
                {testSending ? 'Sending…' : testSent ? '✓ Sent!' : 'Send Test'}
              </button>
            </div>
          </div>

          {/* Phone Mockup */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div style={{
              width: 220, background: '#1c1c1e', borderRadius: 36, padding: '16px 10px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.28)', position: 'relative',
            }}>
              <div style={{ height: 10, background: '#2c2c2e', borderRadius: 6, marginBottom: 12, width: '40%', margin: '0 auto 12px' }} />
              <div style={{ background: '#fff', borderRadius: 24, minHeight: 180, padding: '14px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ fontSize: 11, color: '#6b7280', textAlign: 'center', fontFamily: s.MONO }}>Pilates Studio · Today {fmtTime(new Date())}</div>
                <div style={{
                  background: '#e5e7eb', borderRadius: '16px 16px 16px 4px',
                  padding: '10px 12px', fontSize: 11.5, color: '#111', lineHeight: 1.55, whiteSpace: 'pre-line',
                }}>
                  {previewText}
                </div>
              </div>
              <div style={{ height: 6, background: '#2c2c2e', borderRadius: 4, margin: '12px auto 0', width: '30%' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Automation Settings + Twilio */}
      <div className="rt-automation-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 28 }}>
        <div style={card}>
          <div style={{ fontFamily: s.MONO, fontSize: 11, color: s.text3, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 18 }}>Automation Settings</div>

          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: s.text, marginBottom: 8 }}>Send delay after class ends</div>
            <div style={{ display: 'flex', gap: 10 }}>
              {DELAY_OPTIONS.map((opt) => (
                <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13, color: s.text2 }}>
                  <input type="radio" name="delay" checked={delay === opt} onChange={() => setDelay(opt)} style={{ accentColor: s.accent }} />
                  {opt}
                </label>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { label: 'Quiet hours (no texts after 9pm)', val: quietHours, set: setQuietHours },
              { label: 'Frequency cap (max 3/client/week)', val: freqCap, set: setFreqCap },
            ].map((item) => (
              <label key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13, color: s.text2 }}>
                <input type="checkbox" checked={item.val} onChange={() => item.set(!item.val)} style={{ accentColor: s.accent, width: 15, height: 15 }} />
                {item.label}
              </label>
            ))}
            <div style={{ fontSize: 12, color: s.text3, marginTop: 4, padding: '8px 12px', background: 'rgba(0,0,0,0.04)', borderRadius: 8 }}>
              <strong style={{ color: s.text2 }}>Opt-out auto-appended:</strong> "Reply STOP to opt out."
            </div>
          </div>
        </div>

        <div style={card}>
          <div style={{ fontFamily: s.MONO, fontSize: 11, color: s.text3, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 18 }}>Twilio Integration</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
            {[
              { label: 'Account SID', placeholder: 'ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx' },
              { label: 'Auth Token', placeholder: '••••••••••••••••••••••••••••••••' },
              { label: 'From Number', placeholder: '+1 (480) 555-0100' },
            ].map((field) => (
              <div key={field.label}>
                <div style={{ fontSize: 12, fontWeight: 600, color: s.text2, marginBottom: 4 }}>{field.label}</div>
                <input
                  disabled
                  placeholder={field.placeholder}
                  style={{
                    width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(0,0,0,0.1)',
                    background: 'rgba(0,0,0,0.03)', color: s.text3, fontSize: 13, boxSizing: 'border-box',
                    fontFamily: field.label === 'Auth Token' ? s.MONO : s.FONT,
                  }}
                />
              </div>
            ))}
          </div>
          <button
            disabled
            style={{
              width: '100%', padding: '10px', borderRadius: 8, border: 'none',
              background: 'rgba(0,0,0,0.08)', color: s.text3, fontWeight: 600, fontSize: 13, cursor: 'not-allowed',
            }}
          >
            Connect Twilio to Enable
          </button>
        </div>
      </div>

      {/* Analytics */}
      <div style={card}>
        <div style={{ fontFamily: s.MONO, fontSize: 11, color: s.text3, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 20 }}>Analytics — Last 7 Days</div>
        <div className="rt-analytics-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 28 }}>

          {/* Bar chart */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: s.text, marginBottom: 14 }}>Messages Sent per Day</div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 90 }}>
              {WEEK_CHART.map((val, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, gap: 4 }}>
                  <div style={{ fontSize: 10, color: s.text3, fontFamily: s.MONO }}>{val}</div>
                  <div style={{
                    width: '100%', borderRadius: '4px 4px 0 0',
                    height: `${Math.round((val / maxChart) * 64)}px`,
                    background: i === WEEK_CHART.length - 1 ? s.accent : 'rgba(0,0,0,0.12)',
                    transition: 'height 0.3s',
                  }} />
                  <div style={{ fontSize: 10, color: s.text3, fontFamily: s.MONO }}>{WEEK_LABELS[i]}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Top responders */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: s.text, marginBottom: 14 }}>Top Responding Clients</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {TOP_RESPONDERS.map((r) => (
                <div key={r.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: s.text }}>{r.name}</div>
                    <div style={{ fontSize: 11, color: s.text3, fontStyle: 'italic' }}>{r.last}</div>
                  </div>
                  <div style={{ fontFamily: s.MONO, fontSize: 12, color: s.accent, fontWeight: 700, whiteSpace: 'nowrap' }}>
                    {r.replies} replies
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Opt-out + summary */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: s.text, marginBottom: 14 }}>Engagement Summary</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { label: 'Delivery rate', value: '99.1%', good: true },
                { label: 'Open rate', value: '78%', good: true },
                { label: 'Reply rate', value: '23%', good: true },
                { label: 'Opt-out rate', value: '2.1%', good: false },
              ].map((row) => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: 13, color: s.text2 }}>{row.label}</div>
                  <div style={{ fontFamily: s.MONO, fontSize: 13, fontWeight: 700, color: row.good ? '#22c55e' : '#f59e0b' }}>{row.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
