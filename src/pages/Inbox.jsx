// Unified DM Inbox — Instagram, Facebook, TikTok — multi-staff shared inbox
// Solves: multiple providers sharing one login, losing track of who messaged whom
import { useState, useEffect, useRef } from 'react';
import { useStyles } from '../theme';
import { getPatients, getProviders, getSettings, subscribe } from '../data/store';

const INBOX_KEY = 'ms_inbox';
const ASSIGN_KEY = 'ms_inbox_assignments';

function loadConversations() { try { return JSON.parse(localStorage.getItem(INBOX_KEY)) || []; } catch { return []; } }
function saveConversations(c) { localStorage.setItem(INBOX_KEY, JSON.stringify(c)); }
function loadAssignments() { try { return JSON.parse(localStorage.getItem(ASSIGN_KEY)) || {}; } catch { return {}; } }
function saveAssignments(a) { localStorage.setItem(ASSIGN_KEY, JSON.stringify(a)); }

function initInbox() {
  const existing = loadConversations();
  const hasResponseData = existing.length > 0 && existing.some(c => c.avgResponseTime !== undefined);
  if (existing.length >= 16 && hasResponseData) return;
  // Force clear old data and reseed
  localStorage.removeItem(INBOX_KEY);
  localStorage.removeItem(ASSIGN_KEY);
  const now = new Date();
  const ago = (min) => new Date(now - min * 60000).toISOString();

  saveConversations([
    { id: 'DM-1', handle: '@emma.glow', name: 'Emma Johnson', avatar: 'EJ', patientId: 'PAT-1000', platform: 'instagram', unread: 2, lastActivity: ago(5), avgResponseTime: 3, messages: [
      { id: 'm1', from: 'them', text: 'Hi! I saw your Botox post. How much is it per unit?', time: ago(120), read: true },
      { id: 'm2', from: 'us', text: 'Hi Emma! Botox is $14/unit. Most patients need 20-40 units depending on the area. Would you like to book a free consultation?', time: ago(90), read: true, sentBy: 'PRV-2' },
      { id: 'm3', from: 'them', text: 'That sounds great! What areas do most people treat?', time: ago(85), read: true },
      { id: 'm4', from: 'us', text: 'Forehead lines, crow\'s feet, and the "11" lines between brows are the top 3! We can go over everything at your consult.', time: ago(82), read: true, sentBy: 'PRV-2' },
      { id: 'm5', from: 'them', text: 'Yes! Do you have anything this week?', time: ago(30), read: false },
      { id: 'm6', from: 'them', text: 'Also do you do lip filler?', time: ago(5), read: false },
    ]},
    { id: 'DM-2', handle: '@sophias_skincare', name: 'Sophia Brown', avatar: 'SB', patientId: 'PAT-1002', platform: 'instagram', unread: 1, lastActivity: ago(15), avgResponseTime: 8, messages: [
      { id: 'm7', from: 'them', text: 'I had microneedling yesterday and my face is really red. Is that normal?', time: ago(180), read: true },
      { id: 'm8', from: 'us', text: 'Hi Sophia! Yes, redness for 24-48 hours is completely normal after RF microneedling. Keep your skin hydrated and avoid direct sun. If it persists past 48 hours, give us a call!', time: ago(150), read: true, sentBy: 'PRV-3' },
      { id: 'm9', from: 'them', text: 'Ok great! What moisturizer should I use?', time: ago(140), read: true },
      { id: 'm10', from: 'us', text: 'We recommend the EltaMD Barrier Renewal Complex or plain CeraVe. Avoid actives like retinol or vitamin C for at least 5 days!', time: ago(132), read: true, sentBy: 'PRV-3' },
      { id: 'm11', from: 'them', text: 'Thank you! Its already calming down. When should I book my next session?', time: ago(15), read: false },
    ]},
    { id: 'DM-3', handle: '@ava.jones.az', name: 'Ava Jones', avatar: 'AJ', patientId: 'PAT-1003', platform: 'instagram', unread: 0, lastActivity: ago(60), avgResponseTime: 18, messages: [
      { id: 'm12', from: 'them', text: 'Do you offer payment plans for PDO threads?', time: ago(300), read: true },
      { id: 'm13', from: 'us', text: 'Hi Ava! Yes we do — we offer CareCredit and Cherry financing with 0% APR options. PDO thread lifts start at $2,500. Want me to send you more details?', time: ago(240), read: true, sentBy: 'PRV-1' },
      { id: 'm14', from: 'them', text: 'That would be great, thanks!', time: ago(200), read: true },
      { id: 'm15', from: 'us', text: 'Sent! Let me know if you have questions. We can also do a virtual consultation if youd like to see if threads are right for your goals.', time: ago(60), read: true, sentBy: 'PRV-1' },
    ]},
    { id: 'DM-4', handle: '@beauty.by.charlotte', name: 'Charlotte Davis', avatar: 'CD', patientId: null, platform: 'instagram', unread: 1, lastActivity: ago(8), avgResponseTime: null, messages: [
      { id: 'm16', from: 'them', text: 'Omg I love your before and afters! How do I book a consultation?', time: ago(8), read: false },
    ]},
    { id: 'DM-5', handle: '@isabella_m', name: 'Isabella Martinez', avatar: 'IM', patientId: 'PAT-1004', platform: 'instagram', unread: 0, lastActivity: ago(1440), avgResponseTime: 4, messages: [
      { id: 'm17', from: 'them', text: 'When is my next appointment?', time: ago(2880), read: true },
      { id: 'm18', from: 'us', text: 'Hi Isabella! Your next HydraFacial is scheduled for next Thursday at 2pm. See you then!', time: ago(1440), read: true, sentBy: 'PRV-2' },
    ]},
    { id: 'DM-6', handle: '@mia.skinlove', name: 'Mia Garcia', avatar: 'MG', patientId: 'PAT-1005', platform: 'instagram', unread: 3, lastActivity: ago(2), avgResponseTime: null, messages: [
      { id: 'm19', from: 'them', text: 'I need to reschedule my appointment for tomorrow', time: ago(45), read: false },
      { id: 'm20', from: 'them', text: 'Can I move it to Friday instead?', time: ago(30), read: false },
      { id: 'm21', from: 'them', text: 'Hello?? Anyone there?', time: ago(2), read: false },
    ]},
    { id: 'DM-7', handle: '@scottsdale.harper', name: 'Harper Anderson', avatar: 'HA', patientId: null, platform: 'facebook', unread: 1, lastActivity: ago(20), avgResponseTime: null, messages: [
      { id: 'm22', from: 'them', text: 'Hi, I saw your ad on Facebook. Do you accept insurance for any treatments?', time: ago(20), read: false },
    ]},
    { id: 'DM-8', handle: '@grace.skinjourney', name: 'Grace Taylor', avatar: 'GT', patientId: null, platform: 'tiktok', unread: 2, lastActivity: ago(3), avgResponseTime: null, messages: [
      { id: 'm23', from: 'them', text: 'OMG I just saw your Botox reel!! How old do you have to be to get it? Im 24', time: ago(10), read: false },
      { id: 'm24', from: 'them', text: 'also is baby botox a thing?? My friend said you guys do it', time: ago(3), read: false },
    ]},
    { id: 'DM-9', handle: '@chloe.wellness', name: 'Chloe Martinez', avatar: 'CM', patientId: 'PAT-1014', platform: 'tiktok', unread: 1, lastActivity: ago(12), avgResponseTime: 12, messages: [
      { id: 'm25', from: 'them', text: 'I saw your weight loss transformation video. Is that semaglutide? How much is it per month?', time: ago(45), read: true },
      { id: 'm26', from: 'us', text: 'Hi Chloe! Yes, we offer both semaglutide and tirzepatide programs starting at $500/month. Includes weekly injections, provider check-ins, and nutrition guidance. Want to book a free consult?', time: ago(30), read: true, sentBy: 'PRV-1' },
      { id: 'm27', from: 'them', text: 'yes please! do you have anything next week?', time: ago(12), read: false },
    ]},
    { id: 'DM-10', handle: '@riley.az', name: 'Riley Thompson', avatar: 'RT', patientId: null, platform: 'facebook', unread: 1, lastActivity: ago(35), avgResponseTime: null, messages: [
      { id: 'm28', from: 'them', text: 'Hi! I want to get my mom a gift card for her birthday. Do you sell them online?', time: ago(35), read: false },
    ]},
    { id: 'DM-11', handle: '@scottsdale.aria', name: 'Aria Hernandez', avatar: 'AH', patientId: 'PAT-1017', platform: 'instagram', unread: 0, lastActivity: ago(180), avgResponseTime: 6, messages: [
      { id: 'm29', from: 'them', text: 'Just wanted to say THANK YOU! My skin has never looked better after the IPL series. Everyone keeps asking what I did', time: ago(240), read: true },
      { id: 'm30', from: 'us', text: 'Aria that makes our day!! Your skin really does look amazing. Would you be open to us sharing your before/after on our page? We would tag you of course!', time: ago(180), read: true, sentBy: 'PRV-3' },
    ]},
    // New conversations for more volume
    { id: 'DM-12', handle: '@luna.aesthetics', name: 'Luna Chen', avatar: 'LC', patientId: 'PAT-1020', platform: 'instagram', unread: 0, lastActivity: ago(90), avgResponseTime: 2, messages: [
      { id: 'm31', from: 'them', text: 'Hi! I just moved to Scottsdale and Im looking for a new injector. Do you have availability for a new patient consult?', time: ago(150), read: true },
      { id: 'm32', from: 'us', text: 'Welcome to Scottsdale, Luna! We would love to have you. We have openings this Thursday and Friday for new patient consults. Which works better?', time: ago(148), read: true, sentBy: 'PRV-2' },
      { id: 'm33', from: 'them', text: 'Thursday at 11am would be perfect!', time: ago(140), read: true },
      { id: 'm34', from: 'us', text: 'You are all set for Thursday at 11am! I will send you the new patient forms via email. See you then!', time: ago(138), read: true, sentBy: 'PRV-2' },
      { id: 'm35', from: 'them', text: 'Thank you so much! Can not wait!', time: ago(90), read: true },
    ]},
    { id: 'DM-13', handle: '@desert.glow.zoe', name: 'Zoe Williams', avatar: 'ZW', patientId: 'PAT-1021', platform: 'tiktok', unread: 1, lastActivity: ago(7), avgResponseTime: 5, messages: [
      { id: 'm36', from: 'them', text: 'Hey! I saw the lip filler video you posted. How much is 1 syringe?', time: ago(60), read: true },
      { id: 'm37', from: 'us', text: 'Hi Zoe! One syringe of Juvederm Ultra is $650, and Volbella is $700. Most first-timers start with 1 syringe. Want to come in for a consult?', time: ago(55), read: true, sentBy: 'PRV-2' },
      { id: 'm38', from: 'them', text: 'Yesss! Also do you have a loyalty program?', time: ago(50), read: true },
      { id: 'm39', from: 'us', text: 'We do! We have Alle rewards (Allergan) and Aspire (Galderma) plus our in-house VIP program. You earn points on every treatment!', time: ago(47), read: true, sentBy: 'PRV-2' },
      { id: 'm40', from: 'them', text: 'Amazing!! Booking now. One more q — do you do dissolving if I dont like it?', time: ago(7), read: false },
    ]},
    { id: 'DM-14', handle: '@nadia.beauty.az', name: 'Nadia Patel', avatar: 'NP', patientId: 'PAT-1022', platform: 'facebook', unread: 0, lastActivity: ago(200), avgResponseTime: 10, messages: [
      { id: 'm41', from: 'them', text: 'I had Botox with you guys 3 months ago and I think it\'s wearing off already. Is that normal?', time: ago(260), read: true },
      { id: 'm42', from: 'us', text: 'Hi Nadia! For some patients, Botox can wear off a bit faster the first time. The good news is that with consistent treatments, it tends to last longer each time. Would you like to come in for a touch-up?', time: ago(250), read: true, sentBy: 'PRV-1' },
      { id: 'm43', from: 'them', text: 'Yes please! Also interested in trying Dysport this time', time: ago(245), read: true },
      { id: 'm44', from: 'us', text: 'Great choice! Dysport can work really well for some patients who metabolize Botox quickly. I will have the front desk reach out to schedule you this week.', time: ago(200), read: true, sentBy: 'PRV-1' },
    ]},
    { id: 'DM-15', handle: '@skincare.sam', name: 'Samantha Reed', avatar: 'SR', patientId: null, platform: 'instagram', unread: 2, lastActivity: ago(1), avgResponseTime: null, messages: [
      { id: 'm45', from: 'them', text: 'Hi!! Your clinic looks so beautiful. I have a big event in 3 weeks — what can I do to look my best?', time: ago(4), read: false },
      { id: 'm46', from: 'them', text: 'I have never had any cosmetic treatments before btw!', time: ago(1), read: false },
    ]},
    { id: 'DM-16', handle: '@taylor.tempe', name: 'Taylor Brooks', avatar: 'TB', patientId: 'PAT-1025', platform: 'instagram', unread: 0, lastActivity: ago(500), avgResponseTime: 7, messages: [
      { id: 'm47', from: 'them', text: 'Can I get a copy of my treatment records? I need them for my dermatologist', time: ago(550), read: true },
      { id: 'm48', from: 'us', text: 'Of course, Taylor! I will have our records department email those over to you today. What email should we use?', time: ago(543), read: true, sentBy: 'PRV-3' },
      { id: 'm49', from: 'them', text: 'taylor.b@email.com please. Thank you!', time: ago(540), read: true },
      { id: 'm50', from: 'us', text: 'Done! You should receive them within the hour. Let us know if you need anything else!', time: ago(500), read: true, sentBy: 'PRV-3' },
    ]},
  ]);

  saveAssignments({
    'DM-1': 'PRV-2',
    'DM-2': 'PRV-3',
    'DM-3': 'PRV-1',
    'DM-5': 'PRV-2',
    'DM-6': null,
    'DM-9': 'PRV-1',
    'DM-11': 'PRV-3',
    'DM-12': 'PRV-2',
    'DM-13': 'PRV-2',
    'DM-14': 'PRV-1',
    'DM-16': 'PRV-3',
  });
}

// ── Leaderboard data computation ──
function computeLeaderboard(conversations, assignments, providers) {
  const staffStats = {};

  providers.forEach(p => {
    staffStats[p.id] = {
      id: p.id,
      name: p.name.split(',')[0],
      title: p.title || p.specialty || 'Staff',
      conversationsHandled: 0,
      totalResponseTime: 0,
      responseCount: 0,
      messagesSent: 0,
      messagesSentThisWeek: 0,
    };
  });

  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  // Count assigned conversations
  Object.values(assignments).forEach(provId => {
    if (provId && staffStats[provId]) {
      staffStats[provId].conversationsHandled++;
    }
  });

  // Count messages sent & compute response times
  conversations.forEach(conv => {
    conv.messages.forEach((msg, idx) => {
      if (msg.from === 'us' && msg.sentBy && staffStats[msg.sentBy]) {
        staffStats[msg.sentBy].messagesSent++;
        if (new Date(msg.time) >= oneWeekAgo) {
          staffStats[msg.sentBy].messagesSentThisWeek++;
        }
        // Find the preceding patient message to calc response time
        for (let i = idx - 1; i >= 0; i--) {
          if (conv.messages[i].from === 'them') {
            const responseMin = (new Date(msg.time) - new Date(conv.messages[i].time)) / 60000;
            if (responseMin > 0 && responseMin < 1440) { // ignore gaps > 1 day
              staffStats[msg.sentBy].totalResponseTime += responseMin;
              staffStats[msg.sentBy].responseCount++;
            }
            break;
          }
        }
      }
    });
  });

  // Calculate averages and scores
  return Object.values(staffStats).map(st => {
    const avgResponse = st.responseCount > 0 ? st.totalResponseTime / st.responseCount : 999;
    // Response score: higher = better. Max 100 for instant, decays with time.
    const responseScore = Math.max(0, Math.round(100 - (avgResponse * 3)));
    return {
      ...st,
      avgResponseTime: st.responseCount > 0 ? Math.round(avgResponse) : null,
      responseScore: Math.max(0, responseScore),
    };
  }).sort((a, b) => b.responseScore - a.responseScore);
}

export default function Inbox() {
  const s = useStyles();
  const [, setTick] = useState(0);
  useEffect(() => subscribe(() => setTick(t => t + 1)), []);
  useEffect(() => { initInbox(); }, []);

  const [conversations, setConversations] = useState(loadConversations);
  const [assignments, setAssignments] = useState(loadAssignments);
  const [activeId, setActiveId] = useState(null);
  const [reply, setReply] = useState('');
  const [filter, setFilter] = useState('all'); // 'all' | 'unread' | 'unassigned' | provider id
  const [search, setSearch] = useState('');
  const [currentStaff, setCurrentStaff] = useState('PRV-2'); // who is "logged in"
  const [activeTab, setActiveTab] = useState('inbox'); // 'inbox' | 'leaderboard'
  const [leaderboardPeriod, setLeaderboardPeriod] = useState('week'); // 'week' | 'alltime'
  const messagesEndRef = useRef(null);

  const providers = getProviders();
  const settings = getSettings();

  const active = conversations.find(c => c.id === activeId);

  // ── Staff-filtered and grouped conversations ──
  const searchFiltered = conversations.filter(c => {
    if (search) {
      const q = search.toLowerCase();
      if (!c.name?.toLowerCase().includes(q) && !c.handle?.toLowerCase().includes(q)) return false;
    }
    if (filter === 'unread') return c.unread > 0;
    if (filter === 'unassigned') return !assignments[c.id];
    if (filter.startsWith('PRV-')) return assignments[c.id] === filter;
    return true;
  });

  const byTime = (a, b) => new Date(b.lastActivity) - new Date(a.lastActivity);

  const yourDMs = searchFiltered.filter(c => assignments[c.id] === currentStaff).sort(byTime);
  const unassignedDMs = searchFiltered.filter(c => !assignments[c.id]).sort(byTime);
  const otherStaffDMs = searchFiltered.filter(c => assignments[c.id] && assignments[c.id] !== currentStaff).sort(byTime);

  const totalUnread = conversations.reduce((sum, c) => sum + (c.unread || 0), 0);
  const unassignedCount = conversations.filter(c => !assignments[c.id]).length;

  // ── Quick stats for current staff ──
  const myUnread = conversations.filter(c => assignments[c.id] === currentStaff && c.unread > 0).length;
  const myConversations = conversations.filter(c => assignments[c.id] === currentStaff);
  const myAvgResponse = (() => {
    const times = myConversations.filter(c => c.avgResponseTime != null).map(c => c.avgResponseTime);
    return times.length > 0 ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : 0;
  })();
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  const conversationsToday = conversations.filter(c => new Date(c.lastActivity) >= todayStart).length;

  const selectConversation = (id) => {
    setActiveId(id);
    const updated = conversations.map(c => {
      if (c.id === id) {
        return { ...c, unread: 0, messages: c.messages.map(m => ({ ...m, read: true })) };
      }
      return c;
    });
    setConversations(updated);
    saveConversations(updated);
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
  };

  const sendReply = () => {
    if (!reply.trim() || !activeId) return;
    const updated = conversations.map(c => {
      if (c.id === activeId) {
        return {
          ...c,
          lastActivity: new Date().toISOString(),
          messages: [...c.messages, {
            id: `m-${Date.now()}`,
            from: 'us',
            text: reply.trim(),
            time: new Date().toISOString(),
            read: true,
            sentBy: currentStaff,
          }],
        };
      }
      return c;
    });
    setConversations(updated);
    saveConversations(updated);
    setReply('');
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
  };

  const assignConversation = (convId, providerId) => {
    const next = { ...assignments, [convId]: providerId || null };
    setAssignments(next);
    saveAssignments(next);
  };

  const timeAgo = (isoStr) => {
    if (!isoStr) return '';
    const diff = (Date.now() - new Date(isoStr)) / 60000;
    if (diff < 1) return 'now';
    if (diff < 60) return `${Math.floor(diff)}m`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h`;
    return `${Math.floor(diff / 1440)}d`;
  };

  const getProviderName = (id) => {
    const p = providers.find(pr => pr.id === id);
    return p ? p.name.split(',')[0].split(' ').slice(-1)[0] : '?';
  };

  const currentProvName = providers.find(p => p.id === currentStaff)?.name?.split(',')[0] || 'Staff';

  // Quick replies
  const QUICK_REPLIES = [
    'Thanks for reaching out! Let me look into that for you.',
    'Would you like to book a free consultation?',
    'I will check our schedule and get back to you shortly!',
    'Great question! Let me get you the details.',
    'You can book online at our website or I can schedule you right here!',
  ];

  // ── Response time badge color ──
  const responseTimeBadge = (minutes) => {
    if (minutes == null) return null;
    if (minutes < 5) return { bg: '#ECFDF5', color: '#059669', label: `${minutes}m` };
    if (minutes <= 15) return { bg: '#FFFBEB', color: '#D97706', label: `${minutes}m` };
    return { bg: '#FEF2F2', color: '#DC2626', label: `${minutes}m` };
  };

  // ── Leaderboard data ──
  const leaderboard = computeLeaderboard(conversations, assignments, providers);

  const medalEmoji = (idx) => {
    if (idx === 0) return { icon: '1st', bg: 'linear-gradient(135deg, #FFD700, #FFA000)', color: '#7C5E00' };
    if (idx === 1) return { icon: '2nd', bg: 'linear-gradient(135deg, #E0E0E0, #BDBDBD)', color: '#555' };
    if (idx === 2) return { icon: '3rd', bg: 'linear-gradient(135deg, #FFCC80, #E65100)', color: '#6D3200' };
    return null;
  };

  // ── Render a single conversation row ──
  const renderConversation = (c, dimmed = false) => {
    const assigned = assignments[c.id];
    const assignedProv = providers.find(p => p.id === assigned);
    const lastMsg = c.messages[c.messages.length - 1];
    const rtBadge = responseTimeBadge(c.avgResponseTime);
    return (
      <div key={c.id} onClick={() => selectConversation(c.id)} style={{
        padding: '14px 16px', cursor: 'pointer', borderBottom: '1px solid #F8F8F8',
        background: activeId === c.id ? s.accentLight : c.unread > 0 ? '#FAFAFA' : 'transparent',
        opacity: dimmed ? 0.45 : 1,
        transition: 'background 0.1s, opacity 0.2s',
      }}
      onMouseEnter={e => { if (activeId !== c.id) e.currentTarget.style.background = '#FAFAFA'; }}
      onMouseLeave={e => { if (activeId !== c.id) e.currentTarget.style.background = c.unread > 0 ? '#FAFAFA' : 'transparent'; }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
            background: c.unread > 0 ? s.accentLight : '#F0F0F0',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            font: `500 12px ${s.FONT}`, color: c.unread > 0 ? s.accent : s.text2,
            position: 'relative',
          }}>
            {c.avatar}
            {c.unread > 0 && (
              <span style={{ position: 'absolute', top: -2, right: -2, width: 16, height: 16, borderRadius: '50%', background: s.danger, color: '#fff', font: `600 9px ${s.FONT}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{c.unread}</span>
            )}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
              <span style={{ font: `${c.unread > 0 ? '600' : '400'} 13px ${s.FONT}`, color: s.text }}>{c.name}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                {rtBadge && (
                  <span style={{ padding: '1px 6px', borderRadius: 4, background: rtBadge.bg, color: rtBadge.color, font: `600 8px ${s.FONT}` }}>{rtBadge.label}</span>
                )}
                <span style={{ font: `400 10px ${s.FONT}`, color: s.text3 }}>{timeAgo(c.lastActivity)}</span>
              </div>
            </div>
            <div style={{ font: `400 11px ${s.FONT}`, color: s.text3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {lastMsg?.from === 'us' ? `You: ${lastMsg.text}` : lastMsg?.text}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
              <span style={{ font: `400 10px ${s.FONT}`, color: s.text3 }}>{c.handle}</span>
              {c.platform === 'facebook' && <span style={{ padding: '1px 5px', borderRadius: 4, background: '#E7F3FF', color: '#1877F2', font: `500 8px ${s.FONT}` }}>FB</span>}
              {c.platform === 'tiktok' && <span style={{ padding: '1px 5px', borderRadius: 4, background: '#FFF0F5', color: '#FE2C55', font: `500 8px ${s.FONT}` }}>TT</span>}
              {c.platform === 'instagram' && <span style={{ padding: '1px 5px', borderRadius: 4, background: '#FEF3F8', color: '#E1306C', font: `500 8px ${s.FONT}` }}>IG</span>}
              {assigned && (
                <span style={{ padding: '1px 6px', borderRadius: 4, background: '#F0F0F0', font: `500 9px ${s.FONT}`, color: s.text2 }}>
                  {assignedProv?.name?.split(' ')[0] || 'Assigned'}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ── Section header in conversation list ──
  const renderSectionHeader = (label, count) => (
    <div style={{ padding: '10px 16px 6px', font: `600 10px ${s.MONO}`, color: s.text3, textTransform: 'uppercase', letterSpacing: 1.5, background: '#FAFAFA', borderBottom: '1px solid #F0F0F0' }}>
      {label} ({count})
    </div>
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
        <div>
          <h1 style={{ font: `600 26px ${s.FONT}`, color: s.text, marginBottom: 4 }}>DM Inbox</h1>
          <p style={{ font: `400 14px ${s.FONT}`, color: s.text2 }}>
            Instagram + Facebook + TikTok — {totalUnread} unread, {unassignedCount} unassigned
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <label style={{ font: `400 12px ${s.FONT}`, color: s.text3 }}>Viewing as:</label>
          <select value={currentStaff} onChange={e => setCurrentStaff(e.target.value)} style={{ ...s.input, width: 'auto', padding: '6px 10px', fontSize: 12, cursor: 'pointer' }}>
            {providers.map(p => <option key={p.id} value={p.id}>{p.name.split(',')[0]}</option>)}
          </select>
        </div>
      </div>

      {/* Tab toggle: Inbox | Leaderboard */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 16, borderRadius: 10, overflow: 'hidden', border: '1px solid #E5E5E5', width: 'fit-content' }}>
        <button onClick={() => setActiveTab('inbox')} style={{
          padding: '8px 24px', border: 'none', cursor: 'pointer',
          font: `500 13px ${s.FONT}`,
          background: activeTab === 'inbox' ? s.accent : '#FAFAFA',
          color: activeTab === 'inbox' ? s.accentText : s.text2,
          transition: 'all 0.2s',
        }}>Inbox</button>
        <button onClick={() => setActiveTab('leaderboard')} style={{
          padding: '8px 24px', border: 'none', cursor: 'pointer', borderLeft: '1px solid #E5E5E5',
          font: `500 13px ${s.FONT}`,
          background: activeTab === 'leaderboard' ? s.accent : '#FAFAFA',
          color: activeTab === 'leaderboard' ? s.accentText : s.text2,
          transition: 'all 0.2s',
        }}>Leaderboard</button>
      </div>

      {activeTab === 'inbox' && (
        <>
          {/* Quick Stats Bar */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
            {[
              { label: 'Your Unread', value: myUnread, color: myUnread > 0 ? s.danger : s.success },
              { label: 'Avg Response', value: myAvgResponse > 0 ? `${myAvgResponse}m` : '--', color: myAvgResponse < 5 ? s.success : myAvgResponse <= 15 ? s.warning : s.danger },
              { label: 'Conversations Today', value: conversationsToday, color: s.accent },
              { label: 'Unassigned', value: unassignedCount, color: unassignedCount > 0 ? s.warning : s.success },
            ].map((stat, i) => (
              <div key={i} style={{ ...s.cardStyle, padding: '14px 16px', textAlign: 'center' }}>
                <div style={{ font: `600 20px ${s.FONT}`, color: stat.color, marginBottom: 2 }}>{stat.value}</div>
                <div style={{ font: `500 10px ${s.MONO}`, color: s.text3, textTransform: 'uppercase', letterSpacing: 1 }}>{stat.label}</div>
              </div>
            ))}
          </div>

          <div className="inbox-grid" style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 0, height: 'calc(100vh - 310px)', ...s.cardStyle, overflow: 'hidden' }}>
            {/* Left: Conversation List */}
            <div className={`inbox-list-panel${active ? ' inbox-has-active' : ''}`} style={{ borderRight: '1px solid #E5E5E5', display: 'flex', flexDirection: 'column' }}>
              {/* Search + Filter */}
              <div style={{ padding: '12px', borderBottom: '1px solid #F0F0F0' }}>
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search conversations..." style={{ ...s.input, padding: '8px 12px', fontSize: 12, marginBottom: 8 }} />
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {[
                    ['all', 'All'],
                    ['unread', `Unread (${totalUnread})`],
                    ['unassigned', `New (${unassignedCount})`],
                  ].map(([id, label]) => (
                    <button key={id} onClick={() => setFilter(id)} style={{
                      ...s.pill, padding: '4px 10px', fontSize: 10,
                      background: filter === id ? s.accent : 'transparent',
                      color: filter === id ? s.accentText : s.text3,
                      border: filter === id ? `1px solid ${s.accent}` : '1px solid #E5E5E5',
                    }}>{label}</button>
                  ))}
                  {providers.map(p => (
                    <button key={p.id} onClick={() => setFilter(p.id)} style={{
                      ...s.pill, padding: '4px 10px', fontSize: 10,
                      background: filter === p.id ? s.accent : 'transparent',
                      color: filter === p.id ? s.accentText : s.text3,
                      border: filter === p.id ? `1px solid ${s.accent}` : '1px solid #E5E5E5',
                    }}>{p.name.split(' ')[0]}</button>
                  ))}
                </div>
              </div>

              {/* Grouped Conversations */}
              <div style={{ flex: 1, overflowY: 'auto' }}>
                {/* Your DMs */}
                {yourDMs.length > 0 && (
                  <>
                    {renderSectionHeader('Your DMs', yourDMs.length)}
                    {yourDMs.map(c => renderConversation(c, false))}
                  </>
                )}

                {/* Unassigned */}
                {unassignedDMs.length > 0 && (
                  <>
                    {renderSectionHeader('Unassigned', unassignedDMs.length)}
                    {unassignedDMs.map(c => renderConversation(c, false))}
                  </>
                )}

                {yourDMs.length === 0 && unassignedDMs.length === 0 && (
                  <div style={{ padding: 32, textAlign: 'center', font: `400 13px ${s.FONT}`, color: s.text3 }}>No conversations assigned to you</div>
                )}
              </div>
            </div>

            {/* Right: Message Thread */}
            {active ? (
              <div className="inbox-thread-panel" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                {/* Thread Header */}
                <div style={{ padding: '14px 20px', borderBottom: '1px solid #F0F0F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <button className="inbox-back-btn" onClick={() => setActiveId(null)} style={{ display: 'none', background: 'none', border: 'none', cursor: 'pointer', color: s.text2, font: `500 13px ${s.FONT}`, padding: '4px 0', marginRight: 4 }}>← Back</button>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: s.accentLight, display: 'flex', alignItems: 'center', justifyContent: 'center', font: `500 12px ${s.FONT}`, color: s.accent }}>{active.avatar}</div>
                    <div>
                      <div style={{ font: `600 14px ${s.FONT}`, color: s.text }}>{active.name}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ font: `400 11px ${s.FONT}`, color: s.text3 }}>{active.handle} · {active.platform}</span>
                        {active.avgResponseTime != null && (() => {
                          const badge = responseTimeBadge(active.avgResponseTime);
                          return badge ? <span style={{ padding: '1px 6px', borderRadius: 4, background: badge.bg, color: badge.color, font: `600 9px ${s.FONT}` }}>Avg reply: {badge.label}</span> : null;
                        })()}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <label style={{ font: `400 10px ${s.MONO}`, color: s.text3, textTransform: 'uppercase', letterSpacing: 1 }}>Assign</label>
                    <select value={assignments[active.id] || ''} onChange={e => assignConversation(active.id, e.target.value)} style={{ ...s.input, width: 'auto', padding: '5px 8px', fontSize: 11, cursor: 'pointer' }}>
                      <option value="">Unassigned</option>
                      {providers.map(p => <option key={p.id} value={p.id}>{p.name.split(',')[0]}</option>)}
                    </select>
                    {active.patientId && <span style={{ padding: '3px 8px', borderRadius: 100, background: s.accentLight, color: s.accent, font: `500 10px ${s.FONT}` }}>Patient</span>}
                    {!active.patientId && <span style={{ padding: '3px 8px', borderRadius: 100, background: '#FFF7ED', color: s.warning, font: `500 10px ${s.FONT}` }}>New Lead</span>}
                  </div>
                </div>

                {/* Messages */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
                  {active.messages.map(msg => {
                    const isUs = msg.from === 'us';
                    const sender = isUs ? providers.find(p => p.id === msg.sentBy) : null;
                    return (
                      <div key={msg.id} style={{ display: 'flex', justifyContent: isUs ? 'flex-end' : 'flex-start', marginBottom: 12 }}>
                        <div style={{ maxWidth: '70%' }}>
                          <div style={{
                            padding: '10px 14px', borderRadius: isUs ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                            background: isUs ? s.accent : '#F0F0F0',
                            color: isUs ? s.accentText : s.text,
                            font: `400 13px ${s.FONT}`, lineHeight: 1.5,
                          }}>
                            {msg.text}
                          </div>
                          <div style={{ font: `400 10px ${s.FONT}`, color: s.text3, marginTop: 4, textAlign: isUs ? 'right' : 'left' }}>
                            {timeAgo(msg.time)} ago
                            {isUs && sender && <span> · {sender.name.split(',')[0].split(' ').pop()}</span>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Quick Replies */}
                <div style={{ padding: '8px 20px 0', display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {QUICK_REPLIES.map((qr, i) => (
                    <button key={i} onClick={() => setReply(qr)} style={{
                      ...s.pill, padding: '4px 10px', fontSize: 10, background: '#F8F8F8',
                      color: s.text2, border: '1px solid #F0F0F0',
                    }}>{qr.slice(0, 40)}{qr.length > 40 ? '...' : ''}</button>
                  ))}
                </div>

                {/* Reply Input */}
                <div style={{ padding: '12px 20px', borderTop: '1px solid #F0F0F0', display: 'flex', gap: 10, alignItems: 'flex-end' }}>
                  <textarea value={reply} onChange={e => setReply(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendReply(); } }} rows={2} style={{ ...s.input, flex: 1, resize: 'none', fontSize: 13 }} placeholder={`Reply as ${currentProvName}...`} />
                  <button onClick={sendReply} disabled={!reply.trim()} style={{ ...s.pillAccent, padding: '10px 20px', opacity: reply.trim() ? 1 : 0.4 }}>Send</button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', gap: 8 }}>
                <div style={{ font: `400 32px`, color: s.text3 }}>&#x1F4AC;</div>
                <div style={{ font: `400 14px ${s.FONT}`, color: s.text3 }}>Select a conversation</div>
                <div style={{ font: `400 12px ${s.FONT}`, color: s.text3 }}>Each staff member sees their assigned DMs</div>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── Leaderboard Tab ── */}
      {activeTab === 'leaderboard' && (
        <div>
          {/* Motivational banner */}
          <div style={{ ...s.cardStyle, padding: '16px 24px', marginBottom: 20, background: `linear-gradient(135deg, ${s.accent}10, ${s.accent}05)`, borderLeft: `3px solid ${s.accent}` }}>
            <p style={{ font: `500 14px ${s.FONT}`, color: s.text, margin: 0, lineHeight: 1.6 }}>
              Fastest response wins! Patients are <strong>9x more likely to book</strong> when you reply within 5 minutes.
            </p>
          </div>

          {/* Period toggle */}
          <div style={{ display: 'flex', gap: 0, marginBottom: 20, borderRadius: 8, overflow: 'hidden', border: '1px solid #E5E5E5', width: 'fit-content' }}>
            <button onClick={() => setLeaderboardPeriod('week')} style={{
              padding: '7px 20px', border: 'none', cursor: 'pointer', font: `500 12px ${s.FONT}`,
              background: leaderboardPeriod === 'week' ? s.accent : '#FAFAFA',
              color: leaderboardPeriod === 'week' ? s.accentText : s.text2,
            }}>This Week</button>
            <button onClick={() => setLeaderboardPeriod('alltime')} style={{
              padding: '7px 20px', border: 'none', cursor: 'pointer', borderLeft: '1px solid #E5E5E5', font: `500 12px ${s.FONT}`,
              background: leaderboardPeriod === 'alltime' ? s.accent : '#FAFAFA',
              color: leaderboardPeriod === 'alltime' ? s.accentText : s.text2,
            }}>All Time</button>
          </div>

          {/* Staff Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {leaderboard.map((staff, idx) => {
              const medal = medalEmoji(idx);
              const scoreColor = staff.responseScore >= 70 ? s.success : staff.responseScore >= 40 ? s.warning : s.danger;
              return (
                <div key={staff.id} style={{
                  ...s.cardStyle, padding: '24px', position: 'relative', overflow: 'hidden',
                  border: medal ? `1.5px solid ${scoreColor}30` : s.cardStyle.border,
                }}>
                  {/* Medal badge */}
                  {medal && (
                    <div style={{
                      position: 'absolute', top: 12, right: 12,
                      width: 32, height: 32, borderRadius: '50%',
                      background: medal.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      font: `700 10px ${s.FONT}`, color: medal.color,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                    }}>{medal.icon}</div>
                  )}

                  {/* Name & title */}
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ font: `600 16px ${s.FONT}`, color: s.text, marginBottom: 2 }}>{staff.name}</div>
                    <div style={{ font: `400 12px ${s.FONT}`, color: s.text3 }}>{staff.title}</div>
                  </div>

                  {/* Response Score */}
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ font: `500 10px ${s.MONO}`, color: s.text3, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Response Score</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ flex: 1, height: 6, borderRadius: 3, background: '#F0F0F0', overflow: 'hidden' }}>
                        <div style={{ width: `${staff.responseScore}%`, height: '100%', borderRadius: 3, background: scoreColor, transition: 'width 0.5s ease' }} />
                      </div>
                      <span style={{ font: `700 16px ${s.FONT}`, color: scoreColor, minWidth: 32, textAlign: 'right' }}>{staff.responseScore}</span>
                    </div>
                  </div>

                  {/* Stats grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                    <div>
                      <div style={{ font: `600 18px ${s.FONT}`, color: s.text }}>{staff.conversationsHandled}</div>
                      <div style={{ font: `400 10px ${s.FONT}`, color: s.text3 }}>Conversations</div>
                    </div>
                    <div>
                      <div style={{ font: `600 18px ${s.FONT}`, color: staff.avgResponseTime != null ? (staff.avgResponseTime < 5 ? s.success : staff.avgResponseTime <= 15 ? s.warning : s.danger) : s.text3 }}>
                        {staff.avgResponseTime != null ? `${staff.avgResponseTime}m` : '--'}
                      </div>
                      <div style={{ font: `400 10px ${s.FONT}`, color: s.text3 }}>Avg Response</div>
                    </div>
                    <div>
                      <div style={{ font: `600 18px ${s.FONT}`, color: s.text }}>
                        {leaderboardPeriod === 'week' ? staff.messagesSentThisWeek : staff.messagesSent}
                      </div>
                      <div style={{ font: `400 10px ${s.FONT}`, color: s.text3 }}>
                        {leaderboardPeriod === 'week' ? 'Msgs (Week)' : 'Msgs (All)'}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .inbox-grid {
            grid-template-columns: 1fr !important;
            height: calc(100vh - 380px) !important;
          }
          .inbox-list-panel {
            border-right: none !important;
          }
          .inbox-list-panel.inbox-has-active {
            display: none !important;
          }
          .inbox-thread-panel {
            grid-column: 1 !important;
          }
          .inbox-back-btn {
            display: inline-flex !important;
          }
        }
      `}</style>
    </div>
  );
}
