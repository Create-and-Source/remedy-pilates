import { useState, useRef, useEffect, useCallback } from 'react';
import { useStyles } from '../theme';
import { getPatients, getAppointments, getProviders, getServices, getSettings } from '../data/store';

// ── AI Front Desk — Contextual Studio Chatbot ──
// Understands studio lingo, checks availability, looks up clients, answers FAQs
// Powered by keyword matching + store data queries (no external API)

const QUICK_ACTIONS = [
  { label: 'Check availability', prompt: 'What classes are available tomorrow?' },
  { label: 'Look up a client', prompt: 'Look up client Emma Johnson' },
  { label: 'Studio hours', prompt: 'What are the studio hours?' },
  { label: 'Class prices', prompt: 'How much is a reformer class?' },
  { label: 'Instructor info', prompt: 'Tell me about Kelly Snailum' },
  { label: 'Cancel policy', prompt: 'What is the cancellation policy?' },
];

function processQuery(query) {
  const q = query.toLowerCase().trim();
  const patients = getPatients();
  const appointments = getAppointments();
  const providers = getProviders();
  const services = getServices();
  const settings = getSettings();
  const now = new Date();
  const today = now.toISOString().slice(0, 10);

  // ── Client lookup ──
  const lookupMatch = q.match(/look\s*up|find|search|client|member/);
  if (lookupMatch) {
    const words = q.replace(/look\s*up|find|search|client|member|info|about|for/gi, '').trim().split(/\s+/);
    const found = patients.filter(p => {
      const name = `${p.firstName} ${p.lastName}`.toLowerCase();
      return words.some(w => w.length > 2 && name.includes(w));
    });
    if (found.length > 0) {
      const c = found[0];
      const visits = appointments.filter(a => a.patientId === c.id && a.status === 'completed').length;
      const upcoming = appointments.filter(a => a.patientId === c.id && a.date >= today && a.status !== 'cancelled');
      return {
        text: `Found **${c.firstName} ${c.lastName}**`,
        details: [
          `📧 ${c.email}`,
          `📞 ${c.phone}`,
          `🏷️ Membership: ${c.membershipTier || 'None'}`,
          `📊 ${visits} completed classes`,
          `📅 ${upcoming.length} upcoming booking${upcoming.length !== 1 ? 's' : ''}`,
          `💰 Total spent: $${((c.totalSpent || 0) / 100).toLocaleString()}`,
          c.lastVisit ? `🕐 Last visit: ${new Date(c.lastVisit).toLocaleDateString()}` : '🕐 No visits recorded',
        ],
        type: 'client',
      };
    }
    return { text: "I couldn't find a client matching that name. Try searching by first or last name.", type: 'info' };
  }

  // ── Availability check ──
  if (q.includes('available') || q.includes('availability') || q.includes('open') || q.includes('class') && (q.includes('tomorrow') || q.includes('today') || q.includes('next') || q.includes('schedule'))) {
    let targetDate = today;
    let label = 'today';
    if (q.includes('tomorrow')) {
      const tmrw = new Date(now); tmrw.setDate(tmrw.getDate() + 1);
      targetDate = tmrw.toISOString().slice(0, 10);
      label = 'tomorrow';
    } else if (q.match(/next\s*(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/)) {
      const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const target = days.indexOf(q.match(/next\s*(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/)[1]);
      const diff = (target - now.getDay() + 7) % 7 || 7;
      const d = new Date(now); d.setDate(d.getDate() + diff);
      targetDate = d.toISOString().slice(0, 10);
      label = d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
    }
    const dayAppts = appointments.filter(a => a.date === targetDate && a.status !== 'cancelled');
    if (dayAppts.length === 0) {
      return { text: `No classes scheduled for **${label}** yet. Would you like to add one?`, type: 'info' };
    }
    const lines = dayAppts.slice(0, 8).map(a => {
      const svc = services.find(s => s.id === a.serviceId);
      const ins = providers.find(p => p.id === a.providerId);
      return `🕐 **${a.time}** — ${svc?.name || a.serviceId} with ${ins?.name || 'TBD'} (${a.status})`;
    });
    return {
      text: `**${label.charAt(0).toUpperCase() + label.slice(1)}** — ${dayAppts.length} classes scheduled:`,
      details: lines,
      type: 'schedule',
    };
  }

  // ── Instructor info ──
  const instructorMatch = providers.find(p => q.includes(p.name.toLowerCase()) || q.includes(p.name.split(' ')[0].toLowerCase()));
  if (instructorMatch || q.includes('instructor') || q.includes('teacher') || q.includes('trainer')) {
    if (instructorMatch) {
      const insAppts = appointments.filter(a => a.providerId === instructorMatch.id && a.status === 'completed');
      return {
        text: `**${instructorMatch.name}** — ${instructorMatch.title}`,
        details: [
          `🎯 Specialties: ${(instructorMatch.specialties || []).join(', ')}`,
          `📍 Location: ${instructorMatch.location || 'All'}`,
          `⏱️ ${instructorMatch.yearsExperience || '—'} years experience`,
          `📋 Certifications: ${(instructorMatch.certifications || []).slice(0, 2).join(', ')}`,
          `📊 ${insAppts.length} classes taught (all time)`,
          instructorMatch.bio ? `\n💬 "${instructorMatch.bio.slice(0, 150)}..."` : '',
        ].filter(Boolean),
        type: 'instructor',
      };
    }
    const list = providers.map(p => `• **${p.name}** — ${p.title} (${(p.specialties || []).slice(0, 2).join(', ')})`);
    return { text: 'Our instructor team:', details: list, type: 'instructor' };
  }

  // ── Pricing ──
  if (q.includes('price') || q.includes('cost') || q.includes('how much') || q.includes('rate')) {
    const svcMatch = services.find(sv => q.includes(sv.name.toLowerCase()));
    if (svcMatch) {
      return {
        text: `**${svcMatch.name}** — $${(svcMatch.price / 100).toFixed(2)} ${svcMatch.unit}`,
        details: [`⏱️ ${svcMatch.duration} minutes`, `📂 ${svcMatch.category}`, `📝 ${svcMatch.description}`],
        type: 'pricing',
      };
    }
    const priceList = services.filter(sv => sv.price > 0).map(sv =>
      `• **${sv.name}** — $${(sv.price / 100).toFixed(2)} ${sv.unit} (${sv.duration}min)`
    );
    return { text: 'Class pricing:', details: priceList, type: 'pricing' };
  }

  // ── Hours / Location ──
  if (q.includes('hour') || q.includes('open') || q.includes('location') || q.includes('address') || q.includes('where')) {
    return {
      text: `**${settings.businessName || 'Remedy Pilates & Barre'}**`,
      details: [
        '📍 **Scottsdale** — 6949 E Shea Blvd, Scottsdale, AZ 85254',
        '📍 **Arcadia** — 3629 E Indian School Rd, Phoenix, AZ 85018',
        '📍 **North Central** — 5555 N 7th St, Suite 120, Phoenix, AZ 85014',
        '',
        '🕐 Mon–Fri: 6am – 8pm',
        '🕐 Sat: 7am – 1pm',
        '🕐 Sun: 8am – 12pm',
        '',
        `📞 ${settings.phone || '(480) 699-8160'}`,
        `📧 ${settings.email || 'info@remedypilates.com'}`,
      ],
      type: 'info',
    };
  }

  // ── Cancellation policy ──
  if (q.includes('cancel') || q.includes('reschedule') || q.includes('policy') || q.includes('no show')) {
    return {
      text: '**Cancellation Policy**',
      details: [
        '⏰ Cancel or reschedule **12 hours** before class start time',
        '❌ Late cancellations will be charged the full class rate',
        '🚫 No-shows forfeit the class from your package',
        '💡 First-time late cancel? We\'ll waive the fee — just let us know!',
        '',
        'To reschedule, reply with the class details or call the studio.',
      ],
      type: 'policy',
    };
  }

  // ── Membership ──
  if (q.includes('member') || q.includes('package') || q.includes('unlimited') || q.includes('plan')) {
    return {
      text: '**Membership Options**',
      details: [
        '🥉 **Silver** — 4 classes/month, 10% retail discount',
        '🥇 **Gold** — 8 classes/month, 15% retail, guest passes',
        '💎 **Platinum** — Unlimited classes, 20% retail, priority booking, free guest passes',
        '',
        '📦 **Class Packs**: 5-pack, 10-pack, 20-pack (save up to 20%)',
        '🎁 **New Client Special**: 3 classes for $49',
        '',
        'Interested? I can help you find the right plan!',
      ],
      type: 'membership',
    };
  }

  // ── Stats ──
  if (q.includes('stats') || q.includes('how many') || q.includes('total') || q.includes('overview')) {
    const completed = appointments.filter(a => a.status === 'completed').length;
    const upcoming = appointments.filter(a => a.date >= today && a.status !== 'cancelled').length;
    return {
      text: '**Studio Overview**',
      details: [
        `👥 ${patients.length} total clients`,
        `📅 ${completed} completed classes`,
        `📋 ${upcoming} upcoming bookings`,
        `👩‍🏫 ${providers.length} instructors`,
        `🏷️ ${services.length} class types offered`,
      ],
      type: 'stats',
    };
  }

  // ── Default ──
  return {
    text: "I'm not sure about that, but I can help with:",
    details: [
      '• **Class availability** — "What classes are available tomorrow?"',
      '• **Client lookup** — "Look up Emma Johnson"',
      '• **Pricing** — "How much is reformer?"',
      '• **Instructors** — "Tell me about Kelly"',
      '• **Hours & locations** — "Where are you located?"',
      '• **Policies** — "Cancellation policy"',
      '• **Memberships** — "What membership plans do you have?"',
      '• **Studio stats** — "How many clients do we have?"',
    ],
    type: 'help',
  };
}

export default function AIFrontDesk() {
  const s = useStyles();
  const [messages, setMessages] = useState([
    { role: 'assistant', text: `Welcome to **${getSettings().businessName || 'Remedy Pilates & Barre'}**! I'm your AI front desk assistant. Ask me about classes, clients, pricing, or anything else.`, details: null, type: 'greeting' },
  ]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = useCallback((text) => {
    const query = text || input.trim();
    if (!query) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: query }]);
    setTyping(true);

    // Simulate thinking delay
    setTimeout(() => {
      const response = processQuery(query);
      setMessages(prev => [...prev, { role: 'assistant', ...response }]);
      setTyping(false);
    }, 400 + Math.random() * 600);
  }, [input]);

  const cardStyle = {
    background: 'rgba(255,255,255,0.72)', backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255,255,255,0.6)', borderRadius: 16,
    boxShadow: s.shadow,
  };

  return (
    <div className="afd-root" style={{ animation: 'fadeIn 0.5s ease', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 150px)', maxHeight: 800 }}>
      {/* Header */}
      <div style={{ marginBottom: 20, flexShrink: 0 }}>
        <div style={{ font: `400 11px ${s.MONO}`, textTransform: 'uppercase', letterSpacing: 1.5, color: s.text3, marginBottom: 4 }}>
          Intelligence
        </div>
        <h1 style={{ font: `600 28px ${s.DISPLAY}`, color: s.text, margin: 0 }}>
          AI Front Desk
        </h1>
        <p style={{ font: `400 14px ${s.FONT}`, color: s.text2, margin: '6px 0 0' }}>
          Contextual studio assistant — availability, client lookup, pricing, FAQs
        </p>
      </div>

      {/* Chat container */}
      <div style={{ ...cardStyle, flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 20px 10px' }}>
          {messages.map((msg, i) => (
            <div key={i} style={{
              display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
              marginBottom: 12,
            }}>
              <div style={{
                maxWidth: '80%', padding: '12px 16px', borderRadius: 14,
                background: msg.role === 'user' ? s.accent : 'rgba(0,0,0,0.03)',
                color: msg.role === 'user' ? '#fff' : s.text,
                borderBottomRightRadius: msg.role === 'user' ? 4 : 14,
                borderBottomLeftRadius: msg.role === 'user' ? 14 : 4,
              }}>
                <div style={{
                  font: `400 13px ${s.FONT}`, lineHeight: 1.6,
                  whiteSpace: 'pre-wrap',
                }} dangerouslySetInnerHTML={{
                  __html: (msg.text || '').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>'),
                }} />
                {msg.details && (
                  <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {msg.details.map((d, j) => (
                      <div key={j} style={{
                        font: `400 12px ${s.FONT}`, color: msg.role === 'user' ? 'rgba(255,255,255,0.8)' : s.text2,
                        lineHeight: 1.5, paddingLeft: d.startsWith('•') || d.startsWith('🕐') || d.startsWith('📍') ? 0 : 0,
                      }} dangerouslySetInnerHTML={{
                        __html: d.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>'),
                      }} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          {typing && (
            <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 12 }}>
              <div style={{ padding: '12px 18px', borderRadius: 14, borderBottomLeftRadius: 4, background: 'rgba(0,0,0,0.03)' }}>
                <div style={{ display: 'flex', gap: 4 }}>
                  {[0, 1, 2].map(i => (
                    <div key={i} style={{
                      width: 6, height: 6, borderRadius: '50%', background: s.text3,
                      animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
                    }} />
                  ))}
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick actions */}
        <div style={{ padding: '8px 20px', display: 'flex', gap: 6, flexWrap: 'wrap', borderTop: '1px solid rgba(0,0,0,0.04)' }}>
          {QUICK_ACTIONS.map(qa => (
            <button key={qa.label} onClick={() => handleSend(qa.prompt)} style={{
              padding: '5px 12px', borderRadius: 20, border: '1px solid rgba(0,0,0,0.06)',
              background: 'rgba(255,255,255,0.5)', font: `400 11px ${s.FONT}`, color: s.text2,
              cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = s.accentLight || 'rgba(196,112,75,0.06)'; e.currentTarget.style.color = s.accent; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.5)'; e.currentTarget.style.color = s.text2; }}
            >{qa.label}</button>
          ))}
        </div>

        {/* Input */}
        <div style={{ padding: '12px 20px 16px', borderTop: '1px solid rgba(0,0,0,0.04)', display: 'flex', gap: 10 }}>
          <input
            ref={inputRef}
            type="text" value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="Ask me anything about the studio..."
            style={{
              flex: 1, padding: '12px 16px', borderRadius: 12,
              border: '1px solid rgba(0,0,0,0.06)', background: 'rgba(0,0,0,0.02)',
              font: `400 13px ${s.FONT}`, color: s.text, outline: 'none',
            }}
          />
          <button onClick={() => handleSend()} style={{
            padding: '12px 20px', borderRadius: 12, border: 'none',
            background: s.accent, color: '#fff', font: `500 13px ${s.FONT}`,
            cursor: 'pointer', transition: 'all 0.2s', flexShrink: 0,
          }}>Send</button>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
          40% { opacity: 1; transform: scale(1); }
        }
        @media (max-width: 768px) {
          .afd-root { height: calc(100vh - 120px) !important; }
        }
      `}</style>
    </div>
  );
}
