import { useState, useEffect } from 'react';
import { useStyles } from '../theme';
import { getPatients, subscribe } from '../data/store';

const KEY = 'rp_recovery_tips';

function get() { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; } }
function save(data) { localStorage.setItem(KEY, JSON.stringify(data)); }

// ── Recovery Tips Templates ──
const TEMPLATES = [
  {
    id: 'tmpl-reformer', service: 'Reformer', messages: [
      { delay: 0, label: 'Immediate', subject: 'Post-Reformer Instructions', body: "Great session today! Drink plenty of water to help your muscles recover. Light stretching is encouraged. Avoid high-impact activity for the rest of the day to let your body integrate the work." },
      { delay: 2, label: '48 Hours', subject: '48-Hour Check-In', body: 'How are you feeling? Some muscle soreness in the first 24-48 hours is completely normal, especially after your first few sessions. Stay hydrated and keep moving gently.' },
      { delay: 14, label: '2 Weeks', subject: 'Progress Check-In', body: 'You have been at it for two weeks — great work! Many clients start noticing improved posture, core strength, and flexibility around this point. Keep it up!' },
      { delay: 84, label: '12 Weeks', subject: 'Stay on Track!', body: 'Consistency is key to seeing lasting results with Pilates. If it has been a while since your last session, now is a great time to get back on the Reformer and reconnect with your practice.' },
    ],
  },
  {
    id: 'tmpl-barre', service: 'Barre', messages: [
      { delay: 0, label: 'Immediate', subject: 'Post-Barre Care', body: 'Fantastic Barre class today! Your muscles worked hard — stay hydrated and eat a protein-rich snack to support recovery. Expect some muscle fatigue in your legs and glutes over the next day or two.' },
      { delay: 1, label: '24 Hours', subject: '24-Hour Follow-Up', body: 'How are your legs feeling? DOMS (delayed onset muscle soreness) after Barre is a great sign that the small stabilizing muscles are being activated. Light walking or stretching can help.' },
      { delay: 7, label: '1 Week', subject: 'One Week Check-In', body: 'One week in — you are building a great habit! Aim for at least 2-3 Barre sessions per week for best results. Your balance and posture will improve noticeably over the next month.' },
      { delay: 30, label: '1 Month', subject: 'Monthly Check-In', body: 'One month of Barre — you should be seeing real changes in strength, stability, and body composition. Keep going and let us know how you are feeling!' },
    ],
  },
  {
    id: 'tmpl-microneedling', service: 'Private Session', messages: [
      { delay: 0, label: 'Immediate', subject: 'Post-Private Session Instructions', body: 'Great one-on-one session today! Take note of the exercises and cues your instructor focused on. Drink water and do some gentle stretching this evening to support recovery.' },
      { delay: 1, label: '24 Hours', subject: 'Day-After Check-In', body: 'How are you feeling after your private session? Some muscle awareness or mild soreness is normal. The personalized work from yesterday is doing its job!' },
      { delay: 7, label: '1 Week', subject: 'How Is Your Progress?', body: 'You may be noticing improved alignment, core engagement, or ease of movement from your private session. Try incorporating those instructor cues into your group classes this week.' },
      { delay: 28, label: '4 Weeks', subject: 'Ready for Your Next Private Session?', body: 'Private sessions are a great way to accelerate your progress. Consider booking another one-on-one to keep building on your gains and address any areas you want to focus on.' },
    ],
  },
  {
    id: 'tmpl-ipl', service: 'TRX', messages: [
      { delay: 0, label: 'Immediate', subject: 'Post-TRX Session Instructions', body: 'Excellent TRX session today! Your core and stabilizers worked hard. Hydrate well and keep moving with light activity. Avoid intense training for the next 24 hours.' },
      { delay: 2, label: '48 Hours', subject: 'TRX Recovery Update', body: 'Muscle soreness from TRX suspension training is normal, especially in the core, shoulders, and glutes. Gentle movement and hydration will help speed recovery.' },
      { delay: 10, label: '10 Days', subject: 'How Are You Progressing?', body: 'You should be feeling stronger and more stable after consistent TRX work. Focus on maintaining proper form — quality over quantity in every rep.' },
      { delay: 28, label: '4 Weeks', subject: 'Next TRX Session', body: 'Ready to level up? TRX training progresses beautifully over time. Let us know which muscle groups you want to target in your next session and we will tailor it for you.' },
    ],
  },
  {
    id: 'tmpl-peel', service: 'Group Reformer', messages: [
      { delay: 0, label: 'Immediate', subject: 'Post-Group Reformer Instructions', body: 'Great group class today! You worked alongside some amazing people. Hydrate, stretch gently, and give your muscles time to recover. Light walking later today is encouraged.' },
      { delay: 2, label: '48 Hours', subject: '48-Hour Check-In', body: 'How is your body feeling two days after your Group Reformer class? Some muscle soreness is normal, especially in the core and legs. Keep moving to help recovery.' },
      { delay: 7, label: '1 Week', subject: 'One-Week Check-In', body: 'Great work this week! Consistent Group Reformer attendance builds strength, flexibility, and community. Try to keep your regular class schedule going — consistency is where the results happen.' },
      { delay: 42, label: '6 Weeks', subject: 'Keep the Momentum!', body: 'Six weeks of Group Reformer — your body has adapted significantly. This is a great time to challenge yourself with a new class time or add a private session to keep advancing.' },
    ],
  },
  {
    id: 'tmpl-laser-hair', service: 'Pilates for Seniors', messages: [
      { delay: 0, label: 'Immediate', subject: 'After Your Pilates for Seniors Class', body: 'Wonderful session today! Pilates for Seniors focuses on balance, joint mobility, and gentle strength — exactly what keeps you moving and independent. Rest well tonight and stay hydrated.' },
      { delay: 2, label: '48 Hours', subject: 'Recovery Check-In', body: 'How are you feeling after your class? Any muscle awareness is a sign the right muscles are being activated. If anything felt uncomfortable, let your instructor know at your next session.' },
      { delay: 10, label: '10 Days', subject: 'Building Your Practice', body: 'You should be noticing improved ease of movement and balance in daily activities. Pilates for Seniors works best with regular attendance — even twice a week makes a measurable difference.' },
      { delay: 42, label: '6 Weeks', subject: 'Your Progress Matters!', body: 'Six weeks of consistent Pilates for Seniors — this is where real, lasting changes in mobility, strength, and confidence take hold. We are so proud of your commitment. See you in class!' },
    ],
  },
  {
    id: 'tmpl-weight-loss', service: 'Mat Pilates', messages: [
      { delay: 0, label: 'Day 1', subject: 'Welcome to Mat Pilates!', body: 'Welcome to your Mat Pilates practice! Your first session is all about learning the fundamentals — breath, neutral spine, and core activation. Be patient with yourself as you build the mind-body connection.' },
      { delay: 7, label: 'Week 1', subject: 'How Are You Feeling?', body: 'Checking in on your first week! Mat Pilates challenges muscles you may not be used to activating. Focus on quality of movement over quantity. If anything felt unclear, let your instructor know.' },
      { delay: 28, label: 'Month 1', subject: 'One Month Check-In', body: 'Congratulations on your first month of Mat Pilates! Clients typically notice improved core strength, posture, and flexibility by now. How are you feeling? Book your next session to keep the momentum going.' },
      { delay: 84, label: '3 Months', subject: 'Progress Milestone!', body: 'Three months of Mat Pilates is a real achievement! This is where clients often see the most dramatic improvements in body awareness and strength. Consider adding a private session to keep advancing your practice.' },
    ],
  },
  {
    id: 'tmpl-lipo', service: 'Cardio Pilates', messages: [
      { delay: 0, label: 'Immediate', subject: 'Post-Cardio Pilates Instructions', body: 'Great high-energy session! Cardio Pilates gets your heart rate up while building strength — the best of both worlds. Hydrate well and eat a balanced meal within an hour of your session.' },
      { delay: 1, label: 'Day 1', subject: 'Day After Check-In', body: 'How are you feeling after your Cardio Pilates class? Expect some whole-body muscle fatigue — that is a sign the session was effective. Keep moving today with light stretching or a walk.' },
      { delay: 7, label: 'Week 1', subject: 'One Week Update', body: 'You should be recovering faster and feeling more energized as your body adapts to Cardio Pilates. Aim for 2-3 sessions per week for best cardiovascular and strength results.' },
      { delay: 21, label: 'Week 3', subject: 'Building Momentum', body: 'Three weeks in — your endurance and coordination are improving. Notice how your transitions between exercises are getting smoother? That is your nervous system and muscles working together.' },
      { delay: 90, label: '3 Months', subject: '3-Month Milestone!', body: 'Three months of Cardio Pilates — your fitness level has come a long way! This is a great time to reassess your goals and try a more advanced class or consider adding private sessions.' },
    ],
  },
  {
    id: 'tmpl-body-contouring', service: 'Body Sculpt', messages: [
      { delay: 0, label: 'Immediate', subject: 'After Your Body Sculpt Session', body: 'Excellent work in Body Sculpt today! You targeted key muscle groups with precision Pilates exercises. Stay hydrated and give your muscles time to recover — avoid intense training for 24 hours.' },
      { delay: 3, label: 'Day 3', subject: 'Recovery Update', body: 'Muscle soreness from Body Sculpt is normal and a sign of effective training. Light movement and stretching will help. Keep hydrating and prioritize sleep for optimal recovery.' },
      { delay: 14, label: 'Week 2', subject: 'Progress Check', body: 'You may start noticing subtle changes in muscle tone and body composition. Remember — visible results from Pilates typically become noticeable after 4-6 consistent weeks. Stay the course!' },
      { delay: 60, label: '8 Weeks', subject: 'Results Are Showing!', body: 'Eight weeks of Body Sculpt — you should be seeing real improvements in muscle definition and posture. Take comparison photos and celebrate your progress. Ready to take it to the next level?' },
    ],
  },
  {
    id: 'tmpl-hrt', service: 'Prenatal Pilates', messages: [
      { delay: 0, label: 'Day 1', subject: 'Welcome to Prenatal Pilates!', body: 'Welcome to your Prenatal Pilates journey! This is a wonderful way to stay active, reduce back pain, and prepare your body for birth. Always listen to your body and let your instructor know how you are feeling each session.' },
      { delay: 14, label: 'Week 2', subject: 'How Are You Feeling?', body: 'You are building a great foundation! Prenatal Pilates helps strengthen the pelvic floor and deep core muscles, which are essential for a healthy pregnancy and recovery. Keep up the great work.' },
      { delay: 60, label: 'Month 2', subject: 'Continuing Strong!', body: 'Two months in — your body is adapting beautifully. As you progress through your pregnancy, your instructor will modify exercises to keep you comfortable and safe. Communicate any new discomfort right away.' },
      { delay: 90, label: '3 Months', subject: 'Check-In', body: 'You are doing amazingly well! Consistent Prenatal Pilates supports better posture, reduced swelling, and improved sleep. We are here for you through every trimester and beyond — postnatal classes are available when you are ready.' },
    ],
  },
  {
    id: 'tmpl-hair-restoration', service: 'Pilates for Rehabilitation', messages: [
      { delay: 0, label: 'Immediate', subject: 'After Your Rehab Pilates Session', body: 'Great session today! Pilates-based rehabilitation works gently and precisely to retrain movement patterns. Do not push through pain — mild muscle awareness is normal, but sharp pain is not. Contact us with any concerns.' },
      { delay: 14, label: 'Week 2', subject: 'Progress Check', body: 'You may notice improved ease of movement or reduced discomfort in daily activities — that is the rehab work taking effect. Consistency between sessions matters; try to practice the exercises your instructor gave you at home.' },
      { delay: 60, label: 'Month 2', subject: 'Building Strength', body: 'Two months of rehab Pilates represents real progress. Your body is relearning how to move safely and efficiently. This is a great time to discuss your goals with your instructor and adjust your program as you advance.' },
      { delay: 120, label: '4 Months', subject: 'Milestone Check-In', body: 'You have come a long way! Many clients transition from rehabilitation to general Pilates classes around this stage. Talk to your instructor about whether you are ready to expand your practice.' },
    ],
  },
];

function initRecoveryTips() {
  if (localStorage.getItem('rp_recovery_tips_init')) return;

  const clients = getPatients();
  if (clients.length === 0) return;

  const now = new Date();
  const d = (offset) => { const dt = new Date(now); dt.setDate(dt.getDate() + offset); return dt.toISOString(); };

  const sequences = [
    { id: 'AC-1001', patientId: clients[0]?.id, patientName: `${clients[0]?.firstName} ${clients[0]?.lastName}`, templateId: 'tmpl-reformer', service: 'Reformer', startedAt: d(-5), status: 'active', messagesSent: [
      { index: 0, sentAt: d(-5), status: 'sent' },
      { index: 1, sentAt: d(-3), status: 'sent' },
    ]},
    { id: 'AC-1002', patientId: clients[1]?.id, patientName: `${clients[1]?.firstName} ${clients[1]?.lastName}`, templateId: 'tmpl-barre', service: 'Barre', startedAt: d(-2), status: 'active', messagesSent: [
      { index: 0, sentAt: d(-2), status: 'sent' },
      { index: 1, sentAt: d(-1), status: 'sent' },
    ]},
    { id: 'AC-1003', patientId: clients[2]?.id, patientName: `${clients[2]?.firstName} ${clients[2]?.lastName}`, templateId: 'tmpl-microneedling', service: 'Private Session', startedAt: d(-8), status: 'active', messagesSent: [
      { index: 0, sentAt: d(-8), status: 'sent' },
      { index: 1, sentAt: d(-7), status: 'sent' },
      { index: 2, sentAt: d(-1), status: 'sent' },
    ]},
    { id: 'AC-1004', patientId: clients[3]?.id, patientName: `${clients[3]?.firstName} ${clients[3]?.lastName}`, templateId: 'tmpl-ipl', service: 'TRX', startedAt: d(-3), status: 'active', messagesSent: [
      { index: 0, sentAt: d(-3), status: 'sent' },
      { index: 1, sentAt: d(-1), status: 'sent' },
    ]},
    { id: 'AC-1005', patientId: clients[5]?.id, patientName: `${clients[5]?.firstName} ${clients[5]?.lastName}`, templateId: 'tmpl-peel', service: 'Group Reformer', startedAt: d(-1), status: 'active', messagesSent: [
      { index: 0, sentAt: d(-1), status: 'sent' },
    ]},
    { id: 'AC-1006', patientId: clients[7]?.id, patientName: `${clients[7]?.firstName} ${clients[7]?.lastName}`, templateId: 'tmpl-laser-hair', service: 'Pilates for Seniors', startedAt: d(0), status: 'active', messagesSent: [
      { index: 0, sentAt: d(0), status: 'sent' },
    ]},
    { id: 'AC-1007', patientId: clients[9]?.id, patientName: `${clients[9]?.firstName} ${clients[9]?.lastName}`, templateId: 'tmpl-reformer', service: 'Reformer', startedAt: d(-90), status: 'completed', messagesSent: [
      { index: 0, sentAt: d(-90), status: 'sent' },
      { index: 1, sentAt: d(-88), status: 'sent' },
      { index: 2, sentAt: d(-76), status: 'sent' },
      { index: 3, sentAt: d(-6), status: 'sent' },
    ]},
    { id: 'AC-1008', patientId: clients[12]?.id, patientName: `${clients[12]?.firstName} ${clients[12]?.lastName}`, templateId: 'tmpl-barre', service: 'Barre', startedAt: d(-10), status: 'active', messagesSent: [
      { index: 0, sentAt: d(-10), status: 'sent' },
      { index: 1, sentAt: d(-9), status: 'sent' },
      { index: 2, sentAt: d(-3), status: 'sent' },
    ]},
  ]; // seed data uses original template IDs — service names updated in TEMPLATES above

  save(sequences);
  localStorage.setItem('rp_recovery_tips_init', 'true');
}

export default function RecoveryTips() {
  const s = useStyles();
  const [, setTick] = useState(0);
  useEffect(() => subscribe(() => setTick(t => t + 1)), []);
  useEffect(() => { initRecoveryTips(); }, []);

  const [tab, setTab] = useState('dashboard');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [showTemplates, setShowTemplates] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [showTrigger, setShowTrigger] = useState(false);
  const [triggerPatient, setTriggerPatient] = useState('');
  const [triggerTemplate, setTriggerTemplate] = useState('');
  const [expandedSeq, setExpandedSeq] = useState(null);

  const sequences = get();
  const clients = getPatients();
  const now = new Date();

  // Dashboard stats
  const activeCount = sequences.filter(sq => sq.status === 'active').length;
  const totalSent = sequences.reduce((sum, sq) => sum + sq.messagesSent.length, 0);
  const sentToday = sequences.reduce((sum, sq) => {
    return sum + sq.messagesSent.filter(m => {
      const d = new Date(m.sentAt);
      return d.toDateString() === now.toDateString();
    }).length;
  }, 0);

  // Upcoming messages
  const upcoming = [];
  sequences.filter(sq => sq.status === 'active').forEach(sq => {
    const tmpl = TEMPLATES.find(t => t.id === sq.templateId);
    if (!tmpl) return;
    const nextIdx = sq.messagesSent.length;
    if (nextIdx < tmpl.messages.length) {
      const msg = tmpl.messages[nextIdx];
      const startDate = new Date(sq.startedAt);
      const dueDate = new Date(startDate);
      dueDate.setDate(dueDate.getDate() + msg.delay);
      upcoming.push({ sequence: sq, message: msg, index: nextIdx, dueDate, template: tmpl });
    }
  });
  upcoming.sort((a, b) => a.dueDate - b.dueDate);

  const upcomingToday = upcoming.filter(u => u.dueDate.toDateString() === now.toDateString()).length;

  // Filtered sequences
  const filtered = sequences.filter(sq => {
    if (filter === 'active' && sq.status !== 'active') return false;
    if (filter === 'completed' && sq.status !== 'completed') return false;
    if (search) {
      const q = search.toLowerCase();
      return sq.patientName?.toLowerCase().includes(q) || sq.service?.toLowerCase().includes(q);
    }
    return true;
  });

  const handleTrigger = () => {
    if (!triggerPatient || !triggerTemplate) return;
    const pat = clients.find(p => p.id === triggerPatient);
    const tmpl = TEMPLATES.find(t => t.id === triggerTemplate);
    if (!pat || !tmpl) return;
    const all = get();
    const newSeq = {
      id: `AC-${Date.now()}`,
      patientId: pat.id,
      patientName: `${pat.firstName} ${pat.lastName}`,
      templateId: tmpl.id,
      service: tmpl.service,
      startedAt: new Date().toISOString(),
      status: 'active',
      messagesSent: [{ index: 0, sentAt: new Date().toISOString(), status: 'sent' }],
    };
    all.unshift(newSeq);
    save(all);
    setShowTrigger(false);
    setTriggerPatient('');
    setTriggerTemplate('');
    setTick(t => t + 1);
  };

  const sendNow = (seqId, msgIndex) => {
    const all = get().map(sq => {
      if (sq.id === seqId) {
        return { ...sq, messagesSent: [...sq.messagesSent, { index: msgIndex, sentAt: new Date().toISOString(), status: 'sent' }] };
      }
      return sq;
    });
    // Check if sequence is now complete
    all.forEach(sq => {
      if (sq.id === seqId) {
        const tmpl = TEMPLATES.find(t => t.id === sq.templateId);
        if (tmpl && sq.messagesSent.length >= tmpl.messages.length) {
          sq.status = 'completed';
        }
      }
    });
    save(all);
    setTick(t => t + 1);
  };

  const fmtDate = (iso) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const fmtRelative = (date) => {
    const diff = Math.floor((date - now) / (1000 * 60 * 60 * 24));
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Tomorrow';
    if (diff < 0) return `${Math.abs(diff)}d overdue`;
    return `In ${diff}d`;
  };

  return (
    <div>
      <style>{`
        @media (max-width: 768px) {
          .ac-upcoming-row { flex-direction: column !important; align-items: flex-start !important; gap: 10px !important; }
          .ac-upcoming-right { flex-direction: row !important; justify-content: space-between; width: 100%; }
          .ac-upcoming-body { flex: 1 !important; min-width: 0; }
        }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ font: `600 26px ${s.FONT}`, color: s.text, marginBottom: 4 }}>Recovery Tips</h1>
          <p style={{ font: `400 14px ${s.FONT}`, color: s.text2 }}>Automated post-session care sequences for every client</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setShowTemplates(true)} style={s.pillOutline}>View Templates</button>
          <button onClick={() => setShowTrigger(true)} style={s.pillAccent}>+ Start Sequence</button>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Active Sequences', value: activeCount, color: s.accent },
          { label: 'Messages Sent Today', value: sentToday, color: sentToday > 0 ? s.success : s.text3 },
          { label: 'Upcoming Today', value: upcomingToday, color: upcomingToday > 0 ? s.warning : s.text3 },
          { label: 'Total Messages Sent', value: totalSent, color: s.text },
        ].map(k => (
          <div key={k.label} style={{ ...s.cardStyle, padding: '16px 20px' }}>
            <div style={{ font: `400 10px ${s.MONO}`, textTransform: 'uppercase', letterSpacing: 1, color: s.text3, marginBottom: 6 }}>{k.label}</div>
            <div style={{ font: `600 24px ${s.FONT}`, color: k.color }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
        {[['dashboard', 'Upcoming'], ['sequences', 'All Sequences'], ['templates', 'Templates']].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} style={{
            ...s.pill, padding: '7px 14px', fontSize: 12,
            background: tab === id ? s.accent : 'transparent',
            color: tab === id ? s.accentText : s.text2,
            border: tab === id ? `1px solid ${s.accent}` : '1px solid #E5E5E5',
          }}>{label}</button>
        ))}
      </div>

      {/* ── Upcoming Messages Tab ── */}
      {tab === 'dashboard' && (
        <div style={{ display: 'grid', gap: 8 }}>
          {upcoming.length === 0 && (
            <div style={{ ...s.cardStyle, padding: 48, textAlign: 'center', font: `400 14px ${s.FONT}`, color: s.text3 }}>
              No upcoming messages — all sequences are up to date
            </div>
          )}
          {upcoming.map((u, i) => {
            const isOverdue = u.dueDate < now;
            const isToday = u.dueDate.toDateString() === now.toDateString();
            return (
              <div key={`${u.sequence.id}-${u.index}`} style={{
                ...s.cardStyle, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16,
                borderLeftWidth: 3, borderLeftStyle: 'solid',
                borderLeftColor: isOverdue ? s.danger : isToday ? s.warning : s.accent,
              }}>
                <div style={{
                  width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                  background: isOverdue ? '#FEF2F2' : isToday ? '#FFFBEB' : s.accentLight,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  font: `500 14px ${s.FONT}`, color: isOverdue ? s.danger : isToday ? s.warning : s.accent,
                }}>
                  {u.sequence.patientName?.split(' ').map(n => n[0]).join('')}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                    <span style={{ font: `500 14px ${s.FONT}`, color: s.text }}>{u.sequence.patientName}</span>
                    <span style={{ padding: '2px 8px', borderRadius: 100, font: `500 9px ${s.FONT}`, textTransform: 'uppercase', background: s.accentLight, color: s.accent }}>{u.sequence.service}</span>
                  </div>
                  <div style={{ font: `500 13px ${s.FONT}`, color: s.text2 }}>{u.message.subject}</div>
                  <div style={{ font: `400 12px ${s.FONT}`, color: s.text3, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.message.body.substring(0, 100)}...</div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ font: `600 13px ${s.MONO}`, color: isOverdue ? s.danger : isToday ? s.warning : s.text2, marginBottom: 4 }}>{fmtRelative(u.dueDate)}</div>
                  <div style={{ font: `400 10px ${s.FONT}`, color: s.text3 }}>{u.message.label}</div>
                </div>
                <button onClick={() => sendNow(u.sequence.id, u.index)} style={{ ...s.pillAccent, padding: '6px 12px', fontSize: 11, flexShrink: 0 }}>Send Now</button>
              </div>
            );
          })}
        </div>
      )}

      {/* ── All Sequences Tab ── */}
      {tab === 'sequences' && (
        <div>
          <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search clients or services..." style={{ ...s.input, maxWidth: 260 }} />
            <div style={{ display: 'flex', gap: 6 }}>
              {[['all', 'All'], ['active', 'Active'], ['completed', 'Completed']].map(([id, label]) => (
                <button key={id} onClick={() => setFilter(id)} style={{
                  ...s.pill, padding: '7px 14px', fontSize: 12,
                  background: filter === id ? s.accent : 'transparent',
                  color: filter === id ? s.accentText : s.text2,
                  border: filter === id ? `1px solid ${s.accent}` : '1px solid #E5E5E5',
                }}>{label}</button>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gap: 8 }}>
            {filtered.map(sq => {
              const tmpl = TEMPLATES.find(t => t.id === sq.templateId);
              const progress = tmpl ? sq.messagesSent.length / tmpl.messages.length : 0;
              const isExpanded = expandedSeq === sq.id;
              return (
                <div key={sq.id} style={{ ...s.cardStyle, overflow: 'hidden' }}>
                  <div onClick={() => setExpandedSeq(isExpanded ? null : sq.id)} style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer' }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                      background: sq.status === 'completed' ? '#F0FDF4' : s.accentLight,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      font: `500 14px ${s.FONT}`, color: sq.status === 'completed' ? s.success : s.accent,
                    }}>
                      {sq.patientName?.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                        <span style={{ font: `500 14px ${s.FONT}`, color: s.text }}>{sq.patientName}</span>
                        <span style={{ padding: '2px 8px', borderRadius: 100, font: `500 9px ${s.FONT}`, textTransform: 'uppercase', background: s.accentLight, color: s.accent }}>{sq.service}</span>
                        <span style={{
                          padding: '2px 8px', borderRadius: 100, font: `500 9px ${s.FONT}`, textTransform: 'uppercase',
                          background: sq.status === 'completed' ? '#F0FDF4' : '#FFFBEB',
                          color: sq.status === 'completed' ? s.success : s.warning,
                        }}>{sq.status}</span>
                      </div>
                      <div style={{ font: `400 12px ${s.FONT}`, color: s.text3 }}>Started {fmtDate(sq.startedAt)} — {sq.messagesSent.length}/{tmpl?.messages.length || '?'} messages sent</div>
                    </div>
                    {/* Progress bar */}
                    <div style={{ width: 80, flexShrink: 0 }}>
                      <div style={{ height: 4, background: '#F0F0F0', borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{ width: `${progress * 100}%`, height: '100%', background: sq.status === 'completed' ? s.success : s.accent, borderRadius: 2, transition: 'width 0.3s' }} />
                      </div>
                      <div style={{ font: `400 10px ${s.MONO}`, color: s.text3, marginTop: 4, textAlign: 'center' }}>{Math.round(progress * 100)}%</div>
                    </div>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={s.text3} strokeWidth="1.5" strokeLinecap="round" style={{ transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }}>
                      <polyline points="6 9 12 15 18 9"/>
                    </svg>
                  </div>

                  {/* Expanded message timeline */}
                  {isExpanded && tmpl && (
                    <div style={{ borderTop: '1px solid #F0F0F0', padding: '16px 20px 16px 80px' }}>
                      {tmpl.messages.map((msg, idx) => {
                        const sent = sq.messagesSent.find(m => m.index === idx);
                        const isSent = !!sent;
                        const isNext = !isSent && idx === sq.messagesSent.length;
                        return (
                          <div key={idx} style={{ display: 'flex', gap: 16, marginBottom: idx < tmpl.messages.length - 1 ? 16 : 0, position: 'relative' }}>
                            {/* Timeline dot */}
                            <div style={{ position: 'relative', flexShrink: 0 }}>
                              <div style={{
                                width: 10, height: 10, borderRadius: '50%', marginTop: 4,
                                background: isSent ? s.success : isNext ? s.warning : '#E5E5E5',
                                border: isNext ? `2px solid ${s.warning}` : 'none',
                              }} />
                              {idx < tmpl.messages.length - 1 && (
                                <div style={{ position: 'absolute', top: 16, left: 4, width: 2, height: 'calc(100% + 4px)', background: '#F0F0F0' }} />
                              )}
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ font: `500 13px ${s.FONT}`, color: isSent ? s.text : s.text3 }}>{msg.subject}</span>
                                <span style={{ font: `400 10px ${s.MONO}`, color: s.text3 }}>{msg.label}</span>
                                {isSent && <span style={{ padding: '1px 6px', borderRadius: 100, font: `500 9px ${s.FONT}`, background: '#F0FDF4', color: s.success }}>SENT</span>}
                                {isNext && (
                                  <button onClick={(e) => { e.stopPropagation(); sendNow(sq.id, idx); }} style={{ ...s.pillAccent, padding: '3px 10px', fontSize: 10 }}>Send Now</button>
                                )}
                              </div>
                              <div style={{ font: `400 12px ${s.FONT}`, color: s.text3, marginTop: 2 }}>{msg.body.substring(0, 120)}{msg.body.length > 120 ? '...' : ''}</div>
                              {isSent && <div style={{ font: `400 10px ${s.MONO}`, color: s.text3, marginTop: 2 }}>Sent {fmtDate(sent.sentAt)}</div>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
            {filtered.length === 0 && (
              <div style={{ ...s.cardStyle, padding: 48, textAlign: 'center', font: `400 14px ${s.FONT}`, color: s.text3 }}>
                No sequences match this filter
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Templates Tab ── */}
      {tab === 'templates' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 12 }}>
          {TEMPLATES.map(tmpl => (
            <div key={tmpl.id} style={{ ...s.cardStyle, padding: '20px', cursor: 'pointer' }} onClick={() => setSelectedTemplate(selectedTemplate === tmpl.id ? null : tmpl.id)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10, background: s.accentLight,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  font: `600 14px ${s.FONT}`, color: s.accent, flexShrink: 0,
                }}>{tmpl.service[0]}</div>
                <div>
                  <div style={{ font: `500 14px ${s.FONT}`, color: s.text }}>{tmpl.service}</div>
                  <div style={{ font: `400 11px ${s.FONT}`, color: s.text3 }}>{tmpl.messages.length} messages in sequence</div>
                </div>
              </div>
              {/* Message preview */}
              {tmpl.messages.map((msg, idx) => (
                <div key={idx} style={{ display: 'flex', gap: 10, marginBottom: idx < tmpl.messages.length - 1 ? 8 : 0 }}>
                  <div style={{
                    padding: '2px 8px', borderRadius: 100, font: `500 9px ${s.MONO}`, textTransform: 'uppercase',
                    background: '#F5F5F5', color: s.text3, flexShrink: 0, height: 'fit-content', marginTop: 2,
                    minWidth: 60, textAlign: 'center',
                  }}>{msg.label}</div>
                  <div>
                    <div style={{ font: `500 12px ${s.FONT}`, color: s.text2 }}>{msg.subject}</div>
                    {selectedTemplate === tmpl.id && (
                      <div style={{ font: `400 11px ${s.FONT}`, color: s.text3, marginTop: 2 }}>{msg.body}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* ── View Templates Modal ── */}
      {showTemplates && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300 }} onClick={() => setShowTemplates(false)}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 32, maxWidth: 640, width: '90%', boxShadow: s.shadowLg, maxHeight: '85vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <h2 style={{ font: `600 20px ${s.FONT}`, color: s.text, marginBottom: 4 }}>Recovery Tips Templates</h2>
            <p style={{ font: `400 13px ${s.FONT}`, color: s.text2, marginBottom: 20 }}>Pre-built message sequences for each service type</p>
            {TEMPLATES.map(tmpl => (
              <div key={tmpl.id} style={{ marginBottom: 20, padding: 16, background: '#FAFAFA', borderRadius: 10 }}>
                <div style={{ font: `500 15px ${s.FONT}`, color: s.text, marginBottom: 10 }}>{tmpl.service}</div>
                {tmpl.messages.map((msg, idx) => (
                  <div key={idx} style={{ marginBottom: 8, paddingLeft: 12, borderLeft: `2px solid ${s.accent}` }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span style={{ font: `500 10px ${s.MONO}`, color: s.accent }}>{msg.label}</span>
                      <span style={{ font: `500 12px ${s.FONT}`, color: s.text }}>{msg.subject}</span>
                    </div>
                    <div style={{ font: `400 11px ${s.FONT}`, color: s.text3, marginTop: 2 }}>{msg.body}</div>
                  </div>
                ))}
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowTemplates(false)} style={s.pillGhost}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Trigger Sequence Modal ── */}
      {showTrigger && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300 }} onClick={() => setShowTrigger(false)}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 32, maxWidth: 480, width: '90%', boxShadow: s.shadowLg }} onClick={e => e.stopPropagation()}>
            <h2 style={{ font: `600 20px ${s.FONT}`, color: s.text, marginBottom: 4 }}>Start Recovery Tips Sequence</h2>
            <p style={{ font: `400 13px ${s.FONT}`, color: s.text2, marginBottom: 20 }}>Select a client and session type to begin automated care messages</p>
            <div style={{ marginBottom: 16 }}>
              <label style={s.label}>Client</label>
              <select value={triggerPatient} onChange={e => setTriggerPatient(e.target.value)} style={{ ...s.input, cursor: 'pointer' }}>
                <option value="">Select a client...</option>
                {clients.map(p => <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: 24 }}>
              <label style={s.label}>Treatment Template</label>
              <select value={triggerTemplate} onChange={e => setTriggerTemplate(e.target.value)} style={{ ...s.input, cursor: 'pointer' }}>
                <option value="">Select a template...</option>
                {TEMPLATES.map(t => <option key={t.id} value={t.id}>{t.service} ({t.messages.length} messages)</option>)}
              </select>
            </div>
            {triggerTemplate && (
              <div style={{ marginBottom: 20, padding: 12, background: '#FAFAFA', borderRadius: 10 }}>
                <div style={{ font: `500 11px ${s.MONO}`, color: s.accent, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Sequence Preview</div>
                {TEMPLATES.find(t => t.id === triggerTemplate)?.messages.map((msg, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
                    <span style={{ font: `400 10px ${s.MONO}`, color: s.text3, minWidth: 65 }}>{msg.label}</span>
                    <span style={{ font: `400 12px ${s.FONT}`, color: s.text2 }}>{msg.subject}</span>
                  </div>
                ))}
              </div>
            )}
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowTrigger(false)} style={s.pillGhost}>Cancel</button>
              <button onClick={handleTrigger} style={{ ...s.pillAccent, opacity: triggerPatient && triggerTemplate ? 1 : 0.5 }}>Start Sequence</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
