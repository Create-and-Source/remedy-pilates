import { useState, useRef, useEffect, useCallback } from 'react';
import { useStyles } from '../theme';
import { getSettings } from '../data/store';

// ── Knowledge Base ──
const KNOWLEDGE = [
  {
    keywords: ['dashboard', 'home', 'overview', 'kpi'],
    response: "Your Dashboard is command central! 📊 It shows today's key metrics — revenue, appointments, new clients, and membership stats. You'll also see upcoming appointments, quick-action buttons, and any alerts that need attention. It refreshes every time you visit so you're always up to date.",
    suggestions: ['How do appointments work?', 'Tell me about clients', 'What are reports?'],
  },
  {
    keywords: ['client', 'clients', 'add client', 'search client', 'filter'],
    response: "The Patients page is your full client directory. You can search by name, filter by membership tier or location, and click any patient to see their full profile — visit history, membership status, wallet balance, class packages, and more. To add a new patient, just hit the + button in the top right. 🙌",
    suggestions: ['How do memberships work?', 'What about class packages?', 'Tell me about the wallet'],
  },
  {
    keywords: ['schedule', 'appointment', 'appointments', 'booking', 'book', 'calendar'],
    response: "The Schedule page shows all your appointments in Day, Week, or List view. You can book new appointments from here — just pick a patient, service, provider, date, and time. Each appointment card shows the status (pending, confirmed, completed) and you can update it with a click. Drag-and-drop coming soon!",
    suggestions: ['How does check-in work?', 'What about class packages?', 'Tell me about the waitlist'],
  },
  {
    keywords: ['class package', 'class packages', 'multi-session', 'progress'],
    response: "Class Packages let you map out multi-session protocols for a patient — like a 6-session laser series or a Reformer + filler combo plan. Each session has its own status, date, and notes. You can track progress over time and see everything in a visual timeline. Great for keeping clients on track! ✨",
    suggestions: ['How do clinical charts work?', 'Tell me about photos', 'What about clients?'],
  },
  {
    keywords: ['clinical chart', 'clinical charts', 'soap', 'charting', 'chart', 'notes'],
    response: "Progress Tracking is where you document everything. Create SOAP notes (Subjective, Objective, Assessment, Plan) for each visit. There are interactive face, body, and scalp maps where you can mark injection sites, session areas, and observations. Everything saves to the client's chart history.",
    suggestions: ['How do photos work?', 'What about waivers?', 'Tell me about class packages'],
  },
  {
    keywords: ['photo', 'photos', 'before and after', 'before after', 'documentation'],
    response: "The Transformations page lets you capture and organize photo documentation. Take photos at standard angles for consistency, tag them by session type, and track visual progress over time. Consent for photo usage is tracked per patient so you know what's cleared for marketing. 📸",
    suggestions: ['How do waivers work?', 'Tell me about social media', 'What about clinical charts?'],
  },
  {
    keywords: ['waiver', 'waivers', 'consent', 'signature', 'e-sign'],
    response: "Waivers has 15 built-in templates covering sessions, photo releases, general consent, and more. Patients can e-sign right on a tablet or you can send waivers digitally for them to sign before they arrive. All signed documents are stored in the client's profile.",
    suggestions: ['How does check-in work?', 'Tell me about recovery tips', 'What about clients?'],
  },
  {
    keywords: ['recovery tips', 'post-care', 'follow up', 'follow-up', 'sequence'],
    response: "Recovery Tips automates your post-session communication. There are 12 templates for different sessions — Reformer, fillers, laser, peels, and more. When a session is completed, the recovery tips sequence triggers automatically: day-of instructions, 24-hour check-in, 1-week follow-up, and so on. Patients feel taken care of without your team lifting a finger! 💛",
    suggestions: ['How do text messages work?', 'What about email?', 'Tell me about retention'],
  },
  {
    keywords: ['inventory', 'stock', 'reorder', 'expiration', 'supplies'],
    response: "Inventory tracks everything you have on hand — injectables, retail products, supplies. Each item shows current quantity, reorder threshold, unit cost, and expiration date. When stock drops below the reorder level, you get an alert. You can adjust stock manually and every change is logged with a reason.",
    suggestions: ['How do reports work?', 'Tell me about settings', 'What about the dashboard?'],
  },
  {
    keywords: ['retention', 'lapsed', 'win back', 'inactive'],
    response: "The Retention page uses smart alerts to flag clients who haven't been in for a while. You'll see how many days since their last visit, what service they had, and a suggested re-engagement action. Mark clients as contacted once you've reached out so your team stays coordinated. It's your secret weapon for keeping clients coming back! 🎯",
    suggestions: ['How do text messages work?', 'What about email?', 'Tell me about the waitlist'],
  },
  {
    keywords: ['waitlist', 'backfill', 'cancellation', 'wait list'],
    response: "The Waitlist is a smart backfill tool. When clients want a specific time slot that's not available, add them to the waitlist. If a cancellation opens up, the system can notify waitlisted clients automatically. It helps you keep your schedule full and reduce no-show gaps.",
    suggestions: ['How does the schedule work?', 'Tell me about retention', 'What about check-in?'],
  },
  {
    keywords: ['review', 'reviews', 'google review', 'star', 'rating', 'reputation'],
    response: "The Reviews page helps you manage your online reputation. After appointments, you can trigger Google review requests to happy clients. Track your star ratings, see recent reviews, and monitor your reputation score over time. More 5-star reviews = more new clients finding you!",
    suggestions: ['How does email work?', 'Tell me about text messages', 'What about social media?'],
  },
  {
    keywords: ['dm', 'inbox', 'instagram', 'messages', 'direct message', 'message'],
    response: "The DM Inbox is a shared team inbox that pulls in messages from Instagram (and more platforms coming soon). Your whole team can see and respond to messages, assign conversations to specific staff members, and keep track of response times. No more missed DMs! 💬",
    suggestions: ['How does email work?', 'What about text messages?', 'Tell me about social media'],
  },
  {
    keywords: ['email', 'newsletter', 'email blast', 'email wizard'],
    response: "The Email page has a visual email builder — pick a template, customize the content, choose your audience (all clients, members only, lapsed clients, etc.), and preview before sending. You can see stats on past emails like recipient count and send date. Perfect for newsletters, promotions, and announcements.",
    suggestions: ['How do text messages work?', 'What about the DM inbox?', 'Tell me about social media'],
  },
  {
    keywords: ['text', 'sms', 'text message', 'text blast'],
    response: "Text Messages lets you send individual texts or blasts to patient groups. There are templates for reminders, follow-ups, promotions, review requests, and re-engagement. Pick your audience, customize the message, and send. Texts have way higher open rates than email — your clients will actually see these!",
    suggestions: ['How does email work?', 'What about the DM inbox?', 'Tell me about recovery tips'],
  },
  {
    keywords: ['social media', 'social', 'post', 'instagram post', 'facebook', 'tiktok', 'scheduling'],
    response: "The Social Media page is your content hub. Create posts with the visual editor, adapt the same content for different platforms (Instagram, Facebook, TikTok, LinkedIn), and schedule them in advance. You can save drafts, preview how posts will look, and see your published content history. Multi-platform posting from one place! 🚀",
    suggestions: ['How does the DM inbox work?', 'What about email?', 'Tell me about reviews'],
  },
  {
    keywords: ['membership', 'memberships', 'tier', 'member', 'auto-deduct', 'unit tracking'],
    response: "Memberships lets you set up tiered membership programs — think Silver, Gold, Platinum. Each tier can include monthly unit allocations (like Reformer units), discounts on services, and wallet credits. Units auto-deduct when sessions are done, and you can track each member's usage and remaining balance.",
    suggestions: ['How does the wallet work?', 'Tell me about referrals', 'What about clients?'],
  },
  {
    keywords: ['wallet', 'gift card', 'gift cards', 'credits', 'loyalty', 'points', 'patient wallet'],
    response: "Client Wallet tracks every client's stored value — gift card balances, loyalty points, membership credits, and prepaid packages. You can add or deduct manually, issue gift cards, and clients can see their balance in the client portal. It's like a personal account for each client.",
    suggestions: ['How do memberships work?', 'Tell me about referrals', 'What about the client portal?'],
  },
  {
    keywords: ['referral', 'referrals', 'refer', 'refer a friend'],
    response: "Referrals tracks your client-to-patient referral program. Each patient gets a unique referral link they can share (available in the client portal). When a referred friend books, both the referrer and the new patient can receive rewards — credits, discounts, whatever you configure. Word of mouth, tracked and rewarded!",
    suggestions: ['How does the wallet work?', 'What about the client portal?', 'Tell me about memberships'],
  },
  {
    keywords: ['report', 'reports', 'revenue', 'analytics', 'csv', 'export'],
    response: "Reports gives you the business insights you need — revenue breakdowns, top services, provider performance, patient acquisition trends, and more. Every report can be filtered by date range and exported to CSV for your accountant or team meetings. Knowledge is power! 📈",
    suggestions: ['Tell me about the dashboard', 'What about settings?', 'How do memberships work?'],
  },
  {
    keywords: ['setting', 'settings', 'business info', 'branding', 'payment', 'integration', 'configure'],
    response: "Settings is where you configure everything — your business name, contact info, tagline, brand colors, payment processing, and integrations. This is also where you manage locations, providers, service menu, and more. If something looks off or you want to customize, Settings is the place to go.",
    suggestions: ['How do I change brand colors?', 'Tell me about the dashboard', 'What about reports?'],
  },
  {
    keywords: ['check-in', 'check in', 'checkin', 'front desk', 'arrival', 'verification', 'pregnancy'],
    response: "Check-In is your front desk flow. When a patient arrives, find their appointment and start the check-in process. It verifies their contact info, date of birth, allergies, medications, and includes a pregnancy screening question. Once checked in, the patient status updates across the system so providers know who's ready.",
    suggestions: ['How does the schedule work?', 'Tell me about waivers', 'What about clients?'],
  },
  {
    keywords: ['portal', 'client portal', 'self-service'],
    response: "The Client Portal lives at /portal and gives your clients self-service access. They can view upcoming appointments, see their wallet balance, check membership status, access recovery tips instructions, sign waivers, and share referral links. It's branded to match your studio's look and feel.",
    suggestions: ['How does online booking work?', 'Tell me about referrals', 'What about waivers?'],
  },
  {
    keywords: ['book online', 'online booking', 'public booking', 'booking page'],
    response: "Your public booking page at /book lets new and existing clients schedule appointments online. They can browse your service menu, pick a provider and time, and confirm their booking. It's fully branded and mobile-friendly — perfect for linking from your website, Instagram, or Google listing.",
    suggestions: ['What about the client portal?', 'Tell me about the schedule', 'How does check-in work?'],
  },
  {
    keywords: ['branding', 'brand', 'colors', 'theme', 'color', 'accent'],
    response: "You can change your brand color anytime from the sidebar — look for the colored circle at the bottom. Pick from preset color themes (Gold, Rose, Ocean, Sage, Plum, Coral, Slate) or set a completely custom hex color. Your accent color flows through the entire platform — buttons, highlights, badges, everything. 🎨",
    suggestions: ['Tell me about settings', 'What about the client portal?', 'How does online booking work?'],
  },
  {
    keywords: ['help', 'what can you do', 'topics', 'menu'],
    response: [
      "I can help you with pretty much any feature on the platform! Here are some topics you can ask about:",
      "📋 Dashboard, Patients, Schedule, Class Packages\n🏥 Progress Tracking, Photos, Waivers, Recovery Tips\n📦 Inventory, Retention, Waitlist, Reviews\n💬 DM Inbox, Email, Text Messages, Social Media\n💳 Memberships, Wallet & Gift Cards, Referrals\n📊 Reports, Settings, Check-In, Client Portal\n🎨 Branding & Colors, Online Booking",
      "Just ask about any of those and I'll walk you through it!"
    ],
    suggestions: ['How does the dashboard work?', 'Tell me about clients', 'What about memberships?'],
  },
  {
    keywords: ['pricing', 'price', 'cost', 'plan', 'subscription'],
    response: "For pricing details, head over to the /pricing page where you can see the full breakdown. The platform runs on a straightforward model designed for studio businesses.",
    suggestions: ['Tell me about settings', 'What about reports?', 'How does the dashboard work?'],
  },
  {
    keywords: ['how much', 'per month', 'monthly'],
    response: "The platform is $1,500/month — that includes everything you see here: scheduling, charting, marketing tools, client portal, online booking, memberships, the whole suite. No hidden fees, no per-user charges. One price, full platform.",
    suggestions: ['Tell me about settings', 'What can you help with?', 'How does the dashboard work?'],
  },
];

const FALLBACK = {
  response: "I'm not sure about that one! Try asking about a specific feature like \"how do DMs work\" or \"show me the schedule\". You can also check Settings for configuration options. 🤔",
  suggestions: ['What can you help with?', 'Tell me about the dashboard', 'How do settings work?'],
};

function matchTopic(input) {
  const words = input.toLowerCase().replace(/[?!.,]/g, '').split(/\s+/);
  let bestMatch = null;
  let bestScore = 0;

  for (const entry of KNOWLEDGE) {
    let score = 0;
    for (const kw of entry.keywords) {
      const kwWords = kw.split(/\s+/);
      // Check if the full keyword phrase appears in the input
      if (input.toLowerCase().includes(kw)) {
        score += kwWords.length * 2; // Phrase match scores higher
      } else {
        // Check individual keyword words against input words
        for (const kwWord of kwWords) {
          if (words.some(w => w === kwWord || w.startsWith(kwWord) || kwWord.startsWith(w))) {
            score += 1;
          }
        }
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestMatch = entry;
    }
  }

  return bestScore > 0 ? bestMatch : FALLBACK;
}

// ── Chat Icon SVG ──
const ChatIcon = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
  </svg>
);

const CloseIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const SendIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
  </svg>
);

// ── Typing Indicator ──
function TypingDots() {
  return (
    <div style={{ display: 'flex', gap: 4, padding: '12px 16px', alignItems: 'center' }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{
          width: 7, height: 7, borderRadius: '50%', background: '#BBB',
          animation: `helpChatBounce 1.2s ease-in-out ${i * 0.15}s infinite`,
        }} />
      ))}
    </div>
  );
}

// ── Main Component ──
export default function HelpChat() {
  const s = useStyles();
  const settings = getSettings();
  const businessName = settings.businessName || 'Pilates';

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [showPulse, setShowPulse] = useState(true);
  const [panelAnim, setPanelAnim] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const hasGreeted = useRef(false);

  // Stop pulse after 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => setShowPulse(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [open]);

  // Greeting on first open
  const handleOpen = useCallback(() => {
    setOpen(true);
    setPanelAnim(true);
    if (!hasGreeted.current) {
      hasGreeted.current = true;
      setTyping(true);
      setTimeout(() => {
        setTyping(false);
        setMessages([{
          from: 'bot',
          text: `Hey! 👋 Welcome to ${businessName}. I can help you navigate the platform, explain any feature, or point you in the right direction. What can I help with?`,
          suggestions: ['Show me what you can do', 'How does the dashboard work?', 'Tell me about clients'],
        }]);
      }, 500);
    }
  }, [businessName]);

  const handleClose = () => {
    setPanelAnim(false);
    setTimeout(() => setOpen(false), 250);
  };

  const sendMessage = useCallback((text) => {
    if (!text.trim()) return;

    const userMsg = { from: 'user', text: text.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setTyping(true);

    const match = matchTopic(text);

    setTimeout(() => {
      setTyping(false);
      const responseText = Array.isArray(match.response) ? match.response : match.response;
      setMessages(prev => [...prev, {
        from: 'bot',
        text: responseText,
        suggestions: match.suggestions,
      }]);
    }, 500);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleSuggestion = (text) => {
    sendMessage(text);
  };

  return (
    <>
      {/* Keyframes */}
      <style>{`
        @keyframes helpChatPulse {
          0%, 100% { box-shadow: 0 4px 20px rgba(var(--accent-rgb), 0.3); }
          50% { box-shadow: 0 4px 30px rgba(var(--accent-rgb), 0.6), 0 0 0 8px rgba(var(--accent-rgb), 0.1); }
        }
        @keyframes helpChatSlideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes helpChatSlideDown {
          from { opacity: 1; transform: translateY(0) scale(1); }
          to { opacity: 0; transform: translateY(20px) scale(0.95); }
        }
        @keyframes helpChatBounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-6px); }
        }
        @keyframes helpChatFadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Floating Button */}
      {!open && (
        <button
          onClick={handleOpen}
          aria-label="Open help chat"
          style={{
            position: 'fixed', bottom: 24, right: 24, zIndex: 1000,
            width: 60, height: 60, borderRadius: '50%', border: 'none',
            background: s.accent, color: s.accentText,
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 4px 20px ${s.accent}44`,
            transition: 'transform 0.2s cubic-bezier(0.16,1,0.3,1), box-shadow 0.2s',
            animation: showPulse ? 'helpChatPulse 2s ease-in-out infinite' : 'none',
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.08)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
        >
          <ChatIcon />
        </button>
      )}

      {/* Chat Panel */}
      {open && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 1000,
          width: 360, height: 500, maxHeight: 'calc(100vh - 48px)',
          display: 'flex', flexDirection: 'column',
          background: 'rgba(255,255,255,0.85)',
          backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(255,255,255,0.7)',
          borderRadius: 20,
          boxShadow: '0 20px 60px rgba(0,0,0,0.15), 0 4px 16px rgba(0,0,0,0.06)',
          overflow: 'hidden',
          animation: panelAnim ? 'helpChatSlideUp 0.35s cubic-bezier(0.16,1,0.3,1) forwards' : 'helpChatSlideDown 0.25s ease forwards',
        }}>

          {/* Header */}
          <div style={{
            padding: '18px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            borderBottom: '1px solid rgba(0,0,0,0.06)',
            background: 'rgba(255,255,255,0.6)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%', background: s.accent,
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.accentText,
                fontSize: 16, flexShrink: 0,
              }}>
                <ChatIcon />
              </div>
              <div>
                <div style={{ font: "600 14px 'Inter', sans-serif", color: '#111' }}>
                  Hi! I'm here to help
                </div>
                <div style={{ font: "400 11px 'Inter', sans-serif", color: '#999', marginTop: 1 }}>
                  Ask me about any feature
                </div>
              </div>
            </div>
            <button onClick={handleClose} style={{
              background: 'rgba(0,0,0,0.04)', border: 'none', borderRadius: '50%',
              width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: '#666', transition: 'background 0.15s',
            }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.08)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.04)'; }}
            >
              <CloseIcon />
            </button>
          </div>

          {/* Messages */}
          <div style={{
            flex: 1, overflowY: 'auto', padding: '16px 16px 8px',
            display: 'flex', flexDirection: 'column', gap: 6,
          }}>
            {messages.map((msg, i) => (
              <div key={i} style={{
                animation: 'helpChatFadeIn 0.3s ease forwards',
              }}>
                {/* Message bubble */}
                <div style={{
                  display: 'flex',
                  justifyContent: msg.from === 'user' ? 'flex-end' : 'flex-start',
                  marginBottom: 2,
                }}>
                  <div style={{
                    maxWidth: '85%',
                    padding: '10px 14px',
                    borderRadius: msg.from === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                    background: msg.from === 'user' ? s.accent : 'rgba(0,0,0,0.05)',
                    color: msg.from === 'user' ? s.accentText : '#222',
                    font: "400 13px/1.55 'Inter', sans-serif",
                    wordBreak: 'break-word',
                  }}>
                    {Array.isArray(msg.text)
                      ? msg.text.map((para, pi) => (
                          <p key={pi} style={{ margin: pi === 0 ? 0 : '10px 0 0', whiteSpace: 'pre-line' }}>{para}</p>
                        ))
                      : msg.text
                    }
                  </div>
                </div>

                {/* Quick reply suggestions */}
                {msg.from === 'bot' && msg.suggestions && i === messages.length - 1 && (
                  <div style={{
                    display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8, marginBottom: 4,
                    animation: 'helpChatFadeIn 0.4s ease 0.15s forwards',
                    opacity: 0,
                  }}>
                    {msg.suggestions.map((sug, si) => (
                      <button key={si} onClick={() => handleSuggestion(sug)} style={{
                        padding: '6px 12px', borderRadius: 100,
                        border: `1.5px solid ${s.accent}30`,
                        background: 'rgba(255,255,255,0.7)',
                        color: s.accent,
                        font: "500 11px 'Inter', sans-serif",
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                        backdropFilter: 'blur(8px)',
                      }}
                        onMouseEnter={e => {
                          e.currentTarget.style.background = s.accent;
                          e.currentTarget.style.color = s.accentText;
                          e.currentTarget.style.borderColor = s.accent;
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.background = 'rgba(255,255,255,0.7)';
                          e.currentTarget.style.color = s.accent;
                          e.currentTarget.style.borderColor = s.accent + '30';
                        }}
                      >
                        {sug}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {typing && <TypingDots />}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} style={{
            padding: '12px 16px', borderTop: '1px solid rgba(0,0,0,0.06)',
            display: 'flex', gap: 8, alignItems: 'center',
            background: 'rgba(255,255,255,0.5)',
          }}>
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask me anything..."
              style={{
                flex: 1, padding: '10px 14px', borderRadius: 12,
                border: '1px solid rgba(0,0,0,0.06)',
                background: 'rgba(255,255,255,0.8)',
                font: "400 13px 'Inter', sans-serif",
                color: '#111', outline: 'none',
                transition: 'border-color 0.2s',
              }}
              onFocus={e => { e.target.style.borderColor = s.accent + '60'; }}
              onBlur={e => { e.target.style.borderColor = 'rgba(0,0,0,0.06)'; }}
            />
            <button type="submit" disabled={!input.trim()} style={{
              width: 38, height: 38, borderRadius: '50%', border: 'none',
              background: input.trim() ? s.accent : 'rgba(0,0,0,0.06)',
              color: input.trim() ? s.accentText : '#CCC',
              cursor: input.trim() ? 'pointer' : 'default',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.2s',
              flexShrink: 0,
            }}>
              <SendIcon />
            </button>
          </form>
        </div>
      )}
    </>
  );
}