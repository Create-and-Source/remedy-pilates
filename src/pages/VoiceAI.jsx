import { useState, useRef, useCallback, useEffect } from 'react';
import { useStyles } from '../theme';
import { getServices, getProviders, getPatients, getAppointments } from '../data/store';

const WAVEFORM_CSS = `
@keyframes waveBar {
  0%, 100% { transform: scaleY(0.25); }
  50% { transform: scaleY(1); }
}
@keyframes waveBarSlow {
  0%, 100% { transform: scaleY(0.4); }
  50% { transform: scaleY(0.85); }
}
@keyframes waveBarFast {
  0%, 100% { transform: scaleY(0.15); }
  50% { transform: scaleY(1); }
}
@keyframes fadeSlideIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes pulseDot {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(0.85); }
}
@keyframes callRing {
  0%, 100% { box-shadow: 0 0 0 0 rgba(74, 222, 128, 0.4); }
  50% { box-shadow: 0 0 0 12px rgba(74, 222, 128, 0); }
}
.wave-bar {
  width: 3px;
  border-radius: 2px;
  transform-origin: center bottom;
  transition: background 0.3s;
}
.wave-bar.speaking { animation: waveBar 0.5s ease-in-out infinite; }
.wave-bar.speaking:nth-child(2n) { animation-name: waveBarSlow; animation-duration: 0.7s; }
.wave-bar.speaking:nth-child(3n) { animation-name: waveBarFast; animation-duration: 0.4s; }
.wave-bar:not(.speaking) { transform: scaleY(0.2); }
.chat-bubble { animation: fadeSlideIn 0.35s ease forwards; }
.active-dot { animation: pulseDot 1.5s ease-in-out infinite; }
.call-ring { animation: callRing 1.8s ease-in-out infinite; }
@media (max-width: 768px) {
  .vai-root { padding: 20px 16px !important; }
  .vai-phone { width: 100% !important; max-width: 320px; margin: 0 auto; }
}
`;

const RECENT_CALLS = [
  { time: '2:14 PM', dur: '1:52', intent: 'Class Booking', outcome: 'Booked', type: 'New' },
  { time: '1:58 PM', dur: '0:38', intent: 'Hours & Location', outcome: 'Answered', type: 'Existing' },
  { time: '1:33 PM', dur: '2:11', intent: 'Pricing Info', outcome: 'Answered', type: 'New' },
  { time: '12:47 PM', dur: '3:05', intent: 'Account Change', outcome: 'Transferred', type: 'Existing' },
  { time: '12:19 PM', dur: '1:18', intent: 'Class Booking', outcome: 'Booked', type: 'New' },
  { time: '11:55 AM', dur: '0:44', intent: 'Class Info', outcome: 'Answered', type: 'Existing' },
];

const BAR_HEIGHTS = [42, 56, 38, 61, 48, 53, 45];
const BAR_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const BAR_CALLS = [38, 52, 44, 61, 55, 47, 41];

const PIE_DATA = [
  { label: 'Booking', pct: 45, color: '#7C5CFF' },
  { label: 'Hours / Location', pct: 22, color: '#06B6D4' },
  { label: 'Pricing', pct: 18, color: '#F59E0B' },
  { label: 'Class Info', pct: 10, color: '#10B981' },
  { label: 'Other', pct: 5, color: '#94A3B8' },
];

function buildScript(providers, services) {
  const introService = services.find(s =>
    /intro|beginner|reformer/i.test(s.name)
  ) || services[0] || { name: 'Intro to Reformer' };

  const rehabProvider = providers.find(p =>
    /rehab|physical|back|corrective/i.test((p.specialty || p.bio || ''))
  ) || providers[0] || { name: 'Sarah Mitchell' };

  const instructor = rehabProvider.name || rehabProvider.firstName
    ? `${rehabProvider.firstName || ''} ${rehabProvider.lastName || rehabProvider.name || 'Sarah'}`.trim()
    : 'Sarah Mitchell';

  return [
    {
      role: 'ai',
      text: `Thank you for calling Pilates & Barre! I'm your AI assistant. How can I help you today?`,
      intent: null,
      confidence: null,
    },
    {
      role: 'caller',
      text: "Hi, I'm interested in trying Pilates but I've never done it before. I also have some lower back issues.",
      intent: null,
      confidence: null,
    },
    {
      role: 'ai',
      text: `Welcome! Great news — we have a ${introService.name} class that's completely free and perfect for beginners. For lower back concerns, I'd recommend starting with ${instructor}, who specializes in corrective movement. Let me check availability…`,
      intent: 'booking_inquiry',
      confidence: 0.97,
    },
    {
      role: 'ai',
      text: `I see openings this Thursday at 9:00 AM and 5:30 PM at our Scottsdale location. Would either of those work for you?`,
      intent: 'booking_inquiry',
      confidence: 0.97,
    },
    {
      role: 'caller',
      text: "The 5:30 works!",
      intent: null,
      confidence: null,
    },
    {
      role: 'ai',
      text: `Perfect! I've reserved a spot for you in the 5:30 PM ${introService.name} at Scottsdale with ${instructor}. You'll receive a text confirmation shortly. Is there anything else I can help with?`,
      intent: 'booking_confirmed',
      confidence: 0.99,
    },
    {
      role: 'caller',
      text: "What should I wear?",
      intent: null,
      confidence: null,
    },
    {
      role: 'ai',
      text: `Wear form-fitting, comfortable clothing — think leggings and a fitted top. Grip socks are recommended but we have them available for purchase. Plan to arrive 10 minutes early to fill out a quick health form. We're located at 6949 E Shea Blvd, Scottsdale.`,
      intent: 'class_info',
      confidence: 0.94,
    },
    {
      role: 'caller',
      text: "Great, thanks!",
      intent: null,
      confidence: null,
    },
    {
      role: 'ai',
      text: `You're welcome! We're so excited to meet you. Have a wonderful day! 🌟`,
      intent: null,
      confidence: null,
    },
  ];
}

function WaveformBars({ speaking }) {
  const bars = Array.from({ length: 18 });
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 3, height: 36, justifyContent: 'center' }}>
      {bars.map((_, i) => (
        <div
          key={i}
          className={`wave-bar${speaking ? ' speaking' : ''}`}
          style={{
            height: 28,
            background: speaking
              ? `rgba(74, 222, 128, ${0.5 + (i % 3) * 0.2})`
              : 'rgba(255,255,255,0.18)',
            animationDelay: `${(i * 0.07).toFixed(2)}s`,
          }}
        />
      ))}
    </div>
  );
}

function PieChart({ data }) {
  const size = 120;
  const cx = size / 2;
  const cy = size / 2;
  const r = 42;
  let cumAngle = -Math.PI / 2;

  const slices = data.map(d => {
    const angle = (d.pct / 100) * 2 * Math.PI;
    const x1 = cx + r * Math.cos(cumAngle);
    const y1 = cy + r * Math.sin(cumAngle);
    cumAngle += angle;
    const x2 = cx + r * Math.cos(cumAngle);
    const y2 = cy + r * Math.sin(cumAngle);
    const large = angle > Math.PI ? 1 : 0;
    return { ...d, d: `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z` };
  });

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {slices.map((s, i) => (
        <path key={i} d={s.d} fill={s.color} opacity={0.9} />
      ))}
      <circle cx={cx} cy={cy} r={22} fill="white" />
    </svg>
  );
}

export default function VoiceAI() {
  const s = useStyles();
  const providers = getProviders() || [];
  const services = getServices() || [];
  const script = buildScript(providers, services);

  const [callState, setCallState] = useState('idle'); // idle | ringing | active | ended
  const [messages, setMessages] = useState([]);
  const [currentIntent, setCurrentIntent] = useState(null);
  const [currentConfidence, setCurrentConfidence] = useState(null);
  const [aISpeaking, setAISpeaking] = useState(false);
  const [callSeconds, setCallSeconds] = useState(0);
  const [configOpen, setConfigOpen] = useState(false);
  const [voiceStyle, setVoiceStyle] = useState('friendly');
  const [afterHours, setAfterHours] = useState(true);
  const [greeting, setGreeting] = useState(
    "Thank you for calling Pilates & Barre! I'm your AI assistant. How can I help you today?"
  );

  const timerRef = useRef(null);
  const chatRef = useRef(null);
  const scriptIdx = useRef(0);
  const timeoutRefs = useRef([]);

  const clearTimeouts = () => {
    timeoutRefs.current.forEach(clearTimeout);
    timeoutRefs.current = [];
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s2 = secs % 60;
    return `${m}:${s2.toString().padStart(2, '0')}`;
  };

  const scrollChat = useCallback(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, []);

  const playScript = useCallback(() => {
    let delay = 600;
    script.forEach((line, idx) => {
      const speakDelay = line.role === 'ai' ? 1200 + idx * 80 : 700;
      delay += speakDelay;
      const t = setTimeout(() => {
        if (line.role === 'ai') {
          setAISpeaking(true);
          if (line.intent) setCurrentIntent(line.intent);
          if (line.confidence) setCurrentConfidence(line.confidence);
        }
        setMessages(prev => [...prev, line]);
        scrollChat();

        if (line.role === 'ai') {
          const speakDuration = Math.min(line.text.length * 38, 3200);
          const t2 = setTimeout(() => setAISpeaking(false), speakDuration);
          timeoutRefs.current.push(t2);
        }
      }, delay);
      timeoutRefs.current.push(t);
      delay += line.role === 'ai' ? Math.min(line.text.length * 40, 3500) : 900;
    });

    const endDelay = delay + 800;
    const endT = setTimeout(() => {
      setCallState('ended');
      setAISpeaking(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }, endDelay);
    timeoutRefs.current.push(endT);
  }, [script, scrollChat]);

  const startCall = useCallback(() => {
    clearTimeouts();
    setMessages([]);
    setCallSeconds(0);
    setCurrentIntent(null);
    setCurrentConfidence(null);
    setAISpeaking(false);
    scriptIdx.current = 0;

    setCallState('ringing');
    const t = setTimeout(() => {
      setCallState('active');
      timerRef.current = setInterval(() => setCallSeconds(s => s + 1), 1000);
      playScript();
    }, 1800);
    timeoutRefs.current.push(t);
  }, [playScript]);

  const endCall = useCallback(() => {
    clearTimeouts();
    setCallState('idle');
    setMessages([]);
    setCurrentIntent(null);
    setCurrentConfidence(null);
    setAISpeaking(false);
    setCallSeconds(0);
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  useEffect(() => {
    return () => {
      clearTimeouts();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    scrollChat();
  }, [messages, scrollChat]);

  const card = {
    background: 'rgba(255,255,255,0.72)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255,255,255,0.6)',
    borderRadius: 16,
    boxShadow: s.shadow,
  };

  const outcomeColor = (o) =>
    o === 'Booked' ? '#10B981' : o === 'Transferred' ? '#F59E0B' : s.text2;

  const maxBarCalls = Math.max(...BAR_CALLS);

  return (
    <div className="vai-root" style={{ padding: '32px 28px', fontFamily: s.FONT, color: s.text, maxWidth: 1200, margin: '0 auto' }}>
      <style>{WAVEFORM_CSS}</style>

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontFamily: s.MONO, fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: s.accent, marginBottom: 8 }}>
          Voice AI · Powered by Vapi.ai
        </div>
        <h1 style={{ fontFamily: s.DISPLAY, fontSize: 32, fontWeight: 700, margin: '0 0 8px', color: s.text }}>
          AI Phone Receptionist
        </h1>
        <p style={{ color: s.text2, margin: 0, fontSize: 15 }}>
          Answers every call 24/7 — books classes, answers questions, and handles inquiries in under 800ms.
        </p>
      </div>

      {/* Hero: Phone Simulator + Side Info */}
      <div style={{ display: 'flex', gap: 28, marginBottom: 28, alignItems: 'flex-start', flexWrap: 'wrap' }}>

        {/* Phone */}
        <div className="vai-phone" style={{
          width: 320, flexShrink: 0,
          background: '#0F0F14',
          borderRadius: 44,
          boxShadow: '0 32px 80px rgba(0,0,0,0.45), 0 0 0 2px #2A2A35, inset 0 1px 0 rgba(255,255,255,0.08)',
          padding: '18px 18px 28px',
          display: 'flex', flexDirection: 'column', gap: 0,
          minHeight: 580,
        }}>
          {/* Notch */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
            <div style={{ width: 100, height: 6, background: '#1E1E28', borderRadius: 3 }} />
          </div>

          {/* Caller ID */}
          <div style={{ textAlign: 'center', padding: '16px 0 12px' }}>
            <div style={{
              width: 72, height: 72, borderRadius: '50%', margin: '0 auto 12px',
              background: 'linear-gradient(135deg, #7C5CFF 0%, #06B6D4 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28,
              ...(callState === 'ringing' ? { className: 'call-ring' } : {}),
              boxShadow: callState === 'ringing' ? '0 0 0 0 rgba(74,222,128,0.4)' : 'none',
              animation: callState === 'ringing' ? 'callRing 1.8s ease-in-out infinite' : 'none',
            }}>
              🎙️
            </div>
            <div style={{ color: '#F0F0F8', fontWeight: 700, fontSize: 18, letterSpacing: '-0.01em' }}>
              Pilates Studio AI
            </div>
            <div style={{ color: '#6B6B80', fontSize: 13, marginTop: 3, fontFamily: s.MONO }}>
              (480) 699-8160
            </div>

            {/* Status line */}
            <div style={{ marginTop: 10, minHeight: 22 }}>
              {callState === 'idle' && (
                <span style={{ color: '#6B6B80', fontSize: 13 }}>Ready to answer calls</span>
              )}
              {callState === 'ringing' && (
                <span style={{ color: '#FBBF24', fontSize: 13, fontFamily: s.MONO }}>Incoming call…</span>
              )}
              {callState === 'active' && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <div className="active-dot" style={{ width: 8, height: 8, borderRadius: '50%', background: '#4ADE80' }} />
                  <span style={{ color: '#4ADE80', fontSize: 13, fontFamily: s.MONO }}>
                    {formatTime(callSeconds)}
                  </span>
                </div>
              )}
              {callState === 'ended' && (
                <span style={{ color: '#4ADE80', fontSize: 13 }}>Call ended · {formatTime(callSeconds)}</span>
              )}
            </div>
          </div>

          {/* Waveform */}
          <div style={{
            margin: '8px 0',
            padding: '12px 16px',
            background: 'rgba(255,255,255,0.04)',
            borderRadius: 12,
          }}>
            <WaveformBars speaking={aISpeaking} />
            <div style={{ textAlign: 'center', marginTop: 6 }}>
              {aISpeaking
                ? <span style={{ color: '#4ADE80', fontSize: 11, fontFamily: s.MONO }}>AI Speaking</span>
                : <span style={{ color: '#3A3A50', fontSize: 11, fontFamily: s.MONO }}>
                    {callState === 'active' ? 'Listening…' : 'Standby'}
                  </span>
              }
            </div>
          </div>

          {/* Intent badges */}
          {(currentIntent || currentConfidence) && callState === 'active' && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', padding: '6px 4px 2px' }}>
              {currentIntent && (
                <div style={{
                  background: 'rgba(124,92,255,0.18)', border: '1px solid rgba(124,92,255,0.4)',
                  color: '#A78BFA', borderRadius: 20, padding: '3px 10px', fontSize: 11, fontFamily: s.MONO,
                }}>
                  Intent: {currentIntent}
                </div>
              )}
              {currentConfidence && (
                <div style={{
                  background: 'rgba(74,222,128,0.12)', border: '1px solid rgba(74,222,128,0.3)',
                  color: '#4ADE80', borderRadius: 20, padding: '3px 10px', fontSize: 11, fontFamily: s.MONO,
                }}>
                  {(currentConfidence * 100).toFixed(0)}% confidence
                </div>
              )}
            </div>
          )}

          {/* Chat transcript */}
          <div
            ref={chatRef}
            style={{
              flex: 1, overflowY: 'auto', padding: '8px 4px', marginTop: 6,
              display: 'flex', flexDirection: 'column', gap: 8,
              scrollBehavior: 'smooth', minHeight: 180, maxHeight: 200,
            }}
          >
            {messages.length === 0 && callState === 'idle' && (
              <div style={{ color: '#3A3A50', fontSize: 12, textAlign: 'center', marginTop: 24, fontFamily: s.MONO }}>
                Press Start Demo Call to begin
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className="chat-bubble" style={{
                alignSelf: msg.role === 'caller' ? 'flex-end' : 'flex-start',
                maxWidth: '85%',
              }}>
                <div style={{
                  background: msg.role === 'ai'
                    ? 'rgba(124,92,255,0.22)'
                    : 'rgba(74,222,128,0.14)',
                  border: msg.role === 'ai'
                    ? '1px solid rgba(124,92,255,0.3)'
                    : '1px solid rgba(74,222,128,0.25)',
                  borderRadius: msg.role === 'ai' ? '4px 14px 14px 14px' : '14px 4px 14px 14px',
                  padding: '8px 12px',
                  color: msg.role === 'ai' ? '#C4B8FF' : '#A7F3C5',
                  fontSize: 12,
                  lineHeight: 1.5,
                }}>
                  {msg.text}
                </div>
                <div style={{
                  fontSize: 10, color: '#3A3A50', marginTop: 2, fontFamily: s.MONO,
                  textAlign: msg.role === 'caller' ? 'right' : 'left',
                }}>
                  {msg.role === 'ai' ? 'Pilates AI' : 'Caller'}
                </div>
              </div>
            ))}
          </div>

          {/* Post-call badges */}
          {callState === 'ended' && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
              {['Booking Created', 'SMS Sent', '1:42 Duration'].map(badge => (
                <div key={badge} style={{
                  background: 'rgba(74,222,128,0.12)', border: '1px solid rgba(74,222,128,0.3)',
                  color: '#4ADE80', borderRadius: 20, padding: '4px 10px', fontSize: 11, fontFamily: s.MONO,
                }}>
                  ✓ {badge}
                </div>
              ))}
            </div>
          )}

          {/* Phone buttons */}
          <div style={{ marginTop: 14, display: 'flex', gap: 10, justifyContent: 'center' }}>
            {callState === 'idle' || callState === 'ended' ? (
              <button
                onClick={startCall}
                style={{
                  flex: 1, padding: '13px 0', borderRadius: 14, border: 'none', cursor: 'pointer',
                  background: 'linear-gradient(135deg, #22C55E, #16A34A)',
                  color: '#fff', fontWeight: 700, fontSize: 14, fontFamily: s.FONT,
                  boxShadow: '0 4px 16px rgba(34,197,94,0.4)',
                  transition: 'transform 0.15s, box-shadow 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.03)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
              >
                {callState === 'ended' ? '↺ Replay Demo' : '▶ Start Demo Call'}
              </button>
            ) : (
              <button
                onClick={endCall}
                style={{
                  flex: 1, padding: '13px 0', borderRadius: 14, border: 'none', cursor: 'pointer',
                  background: 'linear-gradient(135deg, #EF4444, #DC2626)',
                  color: '#fff', fontWeight: 700, fontSize: 14, fontFamily: s.FONT,
                  boxShadow: '0 4px 16px rgba(239,68,68,0.4)',
                }}
              >
                ✕ End Call
              </button>
            )}
          </div>
        </div>

        {/* Right column: KPIs + recent calls */}
        <div style={{ flex: 1, minWidth: 280, display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* KPI row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
            {[
              { label: 'Calls Today', value: '47', sub: '+8 vs yesterday', color: '#7C5CFF' },
              { label: 'Avg Response', value: '680ms', sub: 'under 800ms target', color: '#10B981' },
              { label: 'Booking Rate', value: '34%', sub: 'of all calls', color: s.accent },
              { label: 'AI Handled', value: '91%', sub: 'no human needed', color: '#06B6D4' },
            ].map(k => (
              <div key={k.label} style={{ ...card, padding: '16px 18px' }}>
                <div style={{ fontFamily: s.MONO, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: s.text3, marginBottom: 4 }}>
                  {k.label}
                </div>
                <div style={{ fontSize: 26, fontWeight: 800, color: k.color, letterSpacing: '-0.02em', lineHeight: 1 }}>
                  {k.value}
                </div>
                <div style={{ fontSize: 11, color: s.text3, marginTop: 4 }}>{k.sub}</div>
              </div>
            ))}
          </div>

          {/* Call volume bar chart */}
          <div style={{ ...card, padding: '20px 22px' }}>
            <div style={{ fontFamily: s.MONO, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: s.text3, marginBottom: 14 }}>
              Call Volume · Last 7 Days
            </div>
            <svg width="100%" height="80" viewBox="0 0 280 80" preserveAspectRatio="none">
              {BAR_CALLS.map((calls, i) => {
                const barW = 28;
                const barH = (calls / maxBarCalls) * 64;
                const x = i * 40 + 6;
                const y = 70 - barH;
                return (
                  <g key={i}>
                    <rect x={x} y={y} width={barW} height={barH} rx={4}
                      fill={`rgba(124,92,255,${0.35 + (calls / maxBarCalls) * 0.5})`} />
                    <text x={x + barW / 2} y={78} textAnchor="middle" fontSize="9"
                      fill={s.text3} fontFamily={s.MONO}>{BAR_DAYS[i]}</text>
                    <text x={x + barW / 2} y={y - 3} textAnchor="middle" fontSize="9"
                      fill={s.text2} fontFamily={s.MONO}>{calls}</text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Intents + recent calls */}
          <div style={{ display: 'flex', gap: 14 }}>
            {/* Pie */}
            <div style={{ ...card, padding: '18px 18px', flex: '0 0 auto' }}>
              <div style={{ fontFamily: s.MONO, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: s.text3, marginBottom: 12 }}>
                Top Intents
              </div>
              <PieChart data={PIE_DATA} />
              <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 5 }}>
                {PIE_DATA.map(d => (
                  <div key={d.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: d.color, flexShrink: 0 }} />
                    <span style={{ fontSize: 11, color: s.text2 }}>{d.label}</span>
                    <span style={{ fontSize: 11, color: s.text3, marginLeft: 'auto', fontFamily: s.MONO }}>{d.pct}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent calls */}
            <div style={{ ...card, padding: '18px 16px', flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: s.MONO, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: s.text3, marginBottom: 12 }}>
                Recent Calls
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {RECENT_CALLS.map((c, i) => (
                  <div key={i} style={{ borderBottom: i < RECENT_CALLS.length - 1 ? '1px solid rgba(0,0,0,0.06)' : 'none', paddingBottom: i < RECENT_CALLS.length - 1 ? 10 : 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 12, color: s.text, fontWeight: 500 }}>{c.intent}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: outcomeColor(c.outcome) }}>{c.outcome}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 10, marginTop: 2 }}>
                      <span style={{ fontSize: 11, color: s.text3, fontFamily: s.MONO }}>{c.time}</span>
                      <span style={{ fontSize: 11, color: s.text3, fontFamily: s.MONO }}>{c.dur}</span>
                      <span style={{
                        fontSize: 10, padding: '1px 7px', borderRadius: 10,
                        background: c.type === 'New' ? 'rgba(124,92,255,0.1)' : 'rgba(0,0,0,0.06)',
                        color: c.type === 'New' ? '#7C5CFF' : s.text3,
                      }}>
                        {c.type}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom row: Cost Savings + Integrations + Config */}
      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>

        {/* Cost Savings */}
        <div style={{ ...card, padding: '24px 26px', flex: '0 0 260px' }}>
          <div style={{ fontFamily: s.MONO, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: s.text3, marginBottom: 14 }}>
            Cost Savings
          </div>
          {[
            { label: 'Monthly call volume', value: '~6,000 min', muted: true },
            { label: 'AI cost (Vapi)', value: '$420 / mo', color: '#10B981' },
            { label: 'Human receptionist', value: '$3,200 / mo', color: '#EF4444' },
            { label: 'Annual savings', value: '$33,360', color: s.accent, bold: true },
            { label: 'ROI', value: '7.9× return', color: '#7C5CFF', bold: true },
          ].map(r => (
            <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
              <span style={{ fontSize: 13, color: r.muted ? s.text3 : s.text }}>{r.label}</span>
              <span style={{ fontSize: 14, fontWeight: r.bold ? 800 : 600, color: r.color || s.text, fontFamily: r.bold ? s.DISPLAY : s.FONT }}>
                {r.value}
              </span>
            </div>
          ))}
        </div>

        {/* Integrations */}
        <div style={{ ...card, padding: '24px 26px', flex: '0 0 220px' }}>
          <div style={{ fontFamily: s.MONO, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: s.text3, marginBottom: 14 }}>
            Integration Status
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { name: 'Vapi.ai', note: '$0.07/min avg', connected: true },
              { name: 'Twilio SMS', note: 'Confirmations', connected: true },
              { name: 'Booking System', note: 'Real-time sync', connected: true },
              { name: 'CRM', note: 'New client creation', connected: true },
            ].map(int => (
              <div key={int.name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div className="active-dot" style={{ width: 8, height: 8, borderRadius: '50%', background: '#4ADE80', flexShrink: 0, animation: 'pulseDot 2s ease-in-out infinite' }} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: s.text }}>{int.name}</div>
                  <div style={{ fontSize: 11, color: s.text3, fontFamily: s.MONO }}>{int.note}</div>
                </div>
                <div style={{
                  marginLeft: 'auto', fontSize: 10, padding: '2px 8px', borderRadius: 10,
                  background: 'rgba(74,222,128,0.12)', border: '1px solid rgba(74,222,128,0.25)', color: '#4ADE80',
                  fontFamily: s.MONO,
                }}>
                  Live
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Config Panel */}
        <div style={{ ...card, flex: 1, minWidth: 260 }}>
          <button
            onClick={() => setConfigOpen(o => !o)}
            style={{
              width: '100%', background: 'none', border: 'none', cursor: 'pointer',
              padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              fontFamily: s.FONT,
            }}
          >
            <span style={{ fontFamily: s.MONO, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: s.text3 }}>
              Configuration
            </span>
            <span style={{ color: s.text3, fontSize: 14, transform: configOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▾</span>
          </button>

          {configOpen && (
            <div style={{ padding: '0 24px 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>
              {/* Greeting */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: s.text2, display: 'block', marginBottom: 6 }}>
                  Greeting Message
                </label>
                <textarea
                  value={greeting}
                  onChange={e => setGreeting(e.target.value)}
                  rows={3}
                  style={{
                    width: '100%', padding: '10px 12px', borderRadius: 10, resize: 'vertical',
                    border: '1px solid rgba(0,0,0,0.12)', fontFamily: s.FONT, fontSize: 13, color: s.text,
                    background: 'rgba(255,255,255,0.7)', boxSizing: 'border-box', lineHeight: 1.5,
                  }}
                />
              </div>

              {/* Voice style */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: s.text2, display: 'block', marginBottom: 8 }}>
                  Voice Style
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {['professional', 'friendly', 'casual'].map(v => (
                    <button
                      key={v}
                      onClick={() => setVoiceStyle(v)}
                      style={{
                        padding: '7px 14px', borderRadius: 20, border: 'none', cursor: 'pointer',
                        background: voiceStyle === v ? s.accent : 'rgba(0,0,0,0.06)',
                        color: voiceStyle === v ? '#fff' : s.text2,
                        fontSize: 12, fontWeight: 600, fontFamily: s.FONT, textTransform: 'capitalize',
                        transition: 'all 0.15s',
                      }}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              {/* After hours */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: s.text }}>After-Hours Greeting</div>
                  <div style={{ fontSize: 11, color: s.text3, marginTop: 2 }}>Modified greeting outside business hours</div>
                </div>
                <button
                  onClick={() => setAfterHours(h => !h)}
                  style={{
                    width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
                    background: afterHours ? s.accent : '#D1D5DB', position: 'relative', transition: 'background 0.2s',
                  }}
                >
                  <div style={{
                    position: 'absolute', top: 2, left: afterHours ? 22 : 2,
                    width: 20, height: 20, borderRadius: '50%', background: '#fff',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.2)', transition: 'left 0.2s',
                  }} />
                </button>
              </div>

              {/* Transfer conditions */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: s.text2, display: 'block', marginBottom: 8 }}>
                  Transfer to Human When…
                </label>
                {['Unable to answer question', 'Caller explicitly requests', '3+ failed intent matches'].map(c => (
                  <div key={c} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <div style={{ width: 14, height: 14, borderRadius: 4, background: s.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ color: '#fff', fontSize: 10, fontWeight: 700 }}>✓</span>
                    </div>
                    <span style={{ fontSize: 12, color: s.text2 }}>{c}</span>
                  </div>
                ))}
              </div>

              {/* Connected number */}
              <div style={{ padding: '12px 14px', background: 'rgba(0,0,0,0.04)', borderRadius: 10 }}>
                <div style={{ fontSize: 11, color: s.text3, fontFamily: s.MONO, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Connected Number
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: s.text, fontFamily: s.MONO }}>
                  (480) 699-8160
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ADE80' }} />
                  <span style={{ fontSize: 11, color: s.text3 }}>Active · Provider: Vapi.ai</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
