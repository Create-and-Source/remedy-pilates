import { useState, useEffect } from 'react';
import { useStyles } from '../theme';
import { getPatients, subscribe } from '../data/store';

const KEY = 'rp_recovery_tips';

function get() { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; } }
function save(data) { localStorage.setItem(KEY, JSON.stringify(data)); }

// ── Recovery Tips Templates ──
const TEMPLATES = [
  {
    id: 'tmpl-botox', service: 'Reformer', messages: [
      { delay: 0, label: 'Immediate', subject: 'Post-Reformer Instructions', body: "Don't lay down for 4 hours, no exercise for 24 hours, avoid rubbing the treated area. Mild bruising or redness is normal and should resolve within a few hours." },
      { delay: 2, label: '48 Hours', subject: '48-Hour Check-In', body: 'How are you feeling? Any bruising or tenderness? This is completely normal. Avoid heat exposure and strenuous activity for the next 24 hours.' },
      { delay: 14, label: '2 Weeks', subject: 'Results Check', body: 'Your Reformer should be fully settled! Love your results? If you notice any asymmetry or areas that need a touch-up, let us know within the next week.' },
      { delay: 84, label: '12 Weeks', subject: 'Time for a Touch-Up!', body: 'Time for a touch-up! Book your next Reformer appointment to maintain your smooth, refreshed look. Early re-session can help results last longer over time.' },
    ],
  },
  {
    id: 'tmpl-filler', service: 'Barre', messages: [
      { delay: 0, label: 'Immediate', subject: 'Post-Barre Care', body: 'Avoid touching or massaging the treated area for 6 hours. Sleep face-up tonight. Mild swelling and bruising are expected and will subside within 3-5 days.' },
      { delay: 1, label: '24 Hours', subject: '24-Hour Follow-Up', body: 'How is the swelling? Apply a cold compress gently if needed. Avoid alcohol, strenuous exercise, and extreme heat for the next 48 hours.' },
      { delay: 7, label: '1 Week', subject: 'One Week Check-In', body: 'Your filler should be settling in beautifully! Swelling should be mostly resolved. If you have any concerns about shape or symmetry, we are here to help.' },
      { delay: 180, label: '6 Months', subject: 'Maintenance Reminder', body: 'It has been 6 months since your filler appointment. Many clients choose to refresh around this time. Book your next session to maintain your look!' },
    ],
  },
  {
    id: 'tmpl-microneedling', service: 'Private Session', messages: [
      { delay: 0, label: 'Immediate', subject: 'Post-Private Session Instructions', body: 'Your skin will be red and feel warm — like a sunburn. Avoid makeup, retinols, and active ingredients for 24 hours. Use only gentle cleanser and the recovery balm provided.' },
      { delay: 1, label: '24 Hours', subject: 'Day-After Care', body: 'Redness should be fading. Keep skin hydrated with a gentle moisturizer. Avoid direct sun exposure and apply SPF 30+ before going outside.' },
      { delay: 7, label: '1 Week', subject: 'How Is Your Skin?', body: 'You may start noticing improved texture and glow! Continue using SPF daily. Avoid exfoliants for another week. Your skin is regenerating beautifully.' },
      { delay: 28, label: '4 Weeks', subject: 'Ready for Your Next Session?', body: 'For optimal results, we recommend a series of 3-4 sessions spaced 4-6 weeks apart. Ready to book your next microneedling session?' },
    ],
  },
  {
    id: 'tmpl-ipl', service: 'TRX', messages: [
      { delay: 0, label: 'Immediate', subject: 'Post-TRX Care Instructions', body: 'Treated areas may appear slightly red or feel warm. Dark spots will darken before they flake off — this is normal! Avoid sun exposure and use SPF 50 religiously.' },
      { delay: 2, label: '48 Hours', subject: 'TRX Recovery Update', body: 'Darkened spots are part of the healing process and will begin to flake off within 5-7 days. Do not pick at them. Keep the area moisturized.' },
      { delay: 10, label: '10 Days', subject: 'How Are Your Results?', body: 'Your skin should be looking clearer as those dark spots have shed. Full results continue to improve over the next 2-4 weeks as collagen remodels.' },
      { delay: 28, label: '4 Weeks', subject: 'Next TRX Session', body: 'For best results, most clients benefit from a series of 3-5 TRX sessions. Ready to schedule your next photofacial? Each session builds on the last.' },
    ],
  },
  {
    id: 'tmpl-peel', service: 'Chemical Peel', messages: [
      { delay: 0, label: 'Immediate', subject: 'Post-Peel Instructions', body: 'Your skin may feel tight and slightly red. Do not wash your face for 6 hours. Avoid retinols, AHAs, and active skincare for 5-7 days. Gentle cleanser and moisturizer only.' },
      { delay: 2, label: '48 Hours', subject: 'Peeling Update', body: 'Peeling typically starts around day 2-3. Do not pick or pull at flaking skin — let it shed naturally. Keep skin moisturized and protected with SPF.' },
      { delay: 7, label: '1 Week', subject: 'One-Week Check-In', body: 'Most peeling should be complete. Your fresh, new skin is delicate — continue with SPF and gentle products. You should be seeing a brighter, more even complexion!' },
      { delay: 42, label: '6 Weeks', subject: 'Time for Another Peel?', body: 'Chemical peels work best in a series. Schedule your next peel to continue building on your results. We recommend every 4-6 weeks for maintenance.' },
    ],
  },
  {
    id: 'tmpl-laser-hair', service: 'Laser Hair Removal', messages: [
      { delay: 0, label: 'Immediate', subject: 'Post-Laser Hair Removal Care', body: 'Mild redness and bumps are normal. Apply aloe vera or a cool compress. Avoid hot showers, saunas, and exercise for 24 hours. Do not shave the area for 48 hours.' },
      { delay: 2, label: '48 Hours', subject: 'Recovery Check-In', body: 'Redness should be subsiding. You can resume shaving if needed but avoid waxing or plucking — these remove the hair root we are targeting.' },
      { delay: 10, label: '10 Days', subject: 'Shedding Phase', body: 'You may notice treated hairs shedding or "pushing out" — this means the session is working! Gently exfoliate in the shower to help the process.' },
      { delay: 42, label: '6 Weeks', subject: 'Next Laser Session', body: 'Time for your next laser hair removal session! Treatments are spaced 4-6 weeks apart to catch hair in the active growth phase. Book now to stay on track.' },
    ],
  },
  {
    id: 'tmpl-weight-loss', service: 'Medical Weight Loss', messages: [
      { delay: 0, label: 'Day 1', subject: 'Welcome to Your Weight Loss Program', body: 'Welcome! Take your first injection as instructed. Common side effects include mild nausea — eat small, protein-rich meals. Stay hydrated (64oz+ water daily). Avoid fatty or greasy foods.' },
      { delay: 7, label: 'Week 1', subject: 'How Are You Feeling?', body: 'Checking in on your first week! Any nausea should be improving. Focus on 80-100g of protein daily to preserve muscle. Track your meals if possible.' },
      { delay: 28, label: 'Month 1', subject: 'One Month Check-In', body: 'Congratulations on completing your first month! Time for your follow-up appointment — we will check your weight, adjust your dose, and review how you are feeling. Book your visit.' },
      { delay: 84, label: '3 Months', subject: 'Lab Work Reminder', body: 'Time for your quarterly labs! We need to check your CMP, lipid panel, and A1C. Schedule your blood work before your next appointment.' },
    ],
  },
  {
    id: 'tmpl-lipo', service: 'Awake Liposuction', messages: [
      { delay: 0, label: 'Immediate', subject: 'Post-Liposuction Recovery Instructions', body: 'Wear your compression garment 24/7 (except showering). Take prescribed pain medication as directed. Walk lightly today — movement helps prevent blood clots. Expect drainage from incision sites for 24-48 hours.' },
      { delay: 1, label: 'Day 1', subject: 'Day After Surgery Check-In', body: 'How are you feeling? Swelling and bruising are completely normal. Continue wearing your compression garment. Take short walks every 2-3 hours. Stay hydrated. Call us immediately if you have fever over 101, severe pain, or signs of infection.' },
      { delay: 7, label: 'Week 1', subject: 'One Week Post-Op', body: 'You should be feeling better each day. Keep wearing your compression garment. Light activity is okay but no gym or heavy lifting for 4 weeks. Bruising will take 2-3 weeks to fully resolve. Your follow-up appointment is coming up.' },
      { delay: 21, label: 'Week 3', subject: 'Recovery Progress', body: 'Swelling is reducing but final results take 3-6 months. You can increase activity gradually. Start gentle scar care (silicone sheets or cream) on healed incisions. Maintain a stable weight — the removed fat cells are gone permanently.' },
      { delay: 90, label: '3 Months', subject: 'Results Check-In', body: 'Your results should be really showing now! Schedule your 3-month follow-up so we can assess your results and take after photos. If you are interested in additional contouring, we can discuss options.' },
    ],
  },
  {
    id: 'tmpl-body-contouring', service: 'Body Contouring', messages: [
      { delay: 0, label: 'Immediate', subject: 'After Your Body Contouring Session', body: 'You may feel tingling, numbness, or mild discomfort in the treated area — this is normal. Drink plenty of water to help your body flush the treated fat cells. Light walking is encouraged.' },
      { delay: 3, label: 'Day 3', subject: 'Swelling Update', body: 'Some swelling is normal and may peak around now. This is temporary. Continue hydrating and staying active with light walks. Avoid alcohol as it slows the elimination process.' },
      { delay: 14, label: 'Week 2', subject: 'Progress Check', body: 'You may start noticing subtle changes. Remember — full results take 8-12 weeks as your body naturally eliminates the treated fat cells. Stay active and maintain your current weight.' },
      { delay: 60, label: '8 Weeks', subject: 'Results Are Showing!', body: 'You should be seeing significant improvement! Take comparison photos and let us know how you feel. If you want to enhance your results with an additional session, now is a great time to book.' },
    ],
  },
  {
    id: 'tmpl-hrt', service: 'Hormone Replacement (HRT)', messages: [
      { delay: 0, label: 'Day 1', subject: 'After Your HRT Treatment', body: 'Your hormone pellets have been inserted. Keep the insertion site clean and dry for 24 hours. Avoid submerging in water (pools, baths) for 5 days. Mild soreness at the site is normal.' },
      { delay: 14, label: 'Week 2', subject: 'Hormones Adjusting', body: 'Your hormones are starting to optimize. You may notice improved energy, mood, or sleep. Some clients experience a brief adjustment period — this is normal. Report any unusual symptoms.' },
      { delay: 60, label: 'Month 2', subject: 'How Are You Feeling?', body: 'You should be feeling the full benefits now. Schedule your follow-up labs so we can check your hormone levels and ensure everything is optimized. Book your lab appointment.' },
      { delay: 90, label: '3 Months', subject: 'Re-Pellet Reminder', body: 'It is almost time for your next pellet insertion. Most clients need re-pelting every 3-4 months for women and 4-6 months for men. Book your appointment to maintain your levels.' },
    ],
  },
  {
    id: 'tmpl-hair-restoration', service: 'Hair Restoration', messages: [
      { delay: 0, label: 'Immediate', subject: 'After Your PRP Hair Treatment', body: 'Mild redness and tenderness at injection sites is normal. Avoid washing your hair for 24 hours. No hats or helmets for 48 hours. Avoid strenuous exercise for 24 hours.' },
      { delay: 14, label: 'Week 2', subject: 'Shedding Phase Starting', body: 'You may notice increased hair shedding — this is actually a GOOD sign. The PRP is pushing old hairs out to make room for new, stronger growth. This phase lasts 2-4 weeks.' },
      { delay: 60, label: 'Month 2', subject: 'New Growth Beginning', body: 'The shedding phase should be ending and you may start to see baby hairs emerging. Be patient — significant visible results take 3-6 months. Your next PRP session is coming up.' },
      { delay: 120, label: '4 Months', subject: 'Results Are Growing In!', body: 'You should be seeing noticeable new growth and improved density. Take comparison photos. Book your next session to continue building on your results.' },
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
    { id: 'AC-1001', patientId: clients[0]?.id, patientName: `${clients[0]?.firstName} ${clients[0]?.lastName}`, templateId: 'tmpl-botox', service: 'Reformer', startedAt: d(-5), status: 'active', messagesSent: [
      { index: 0, sentAt: d(-5), status: 'sent' },
      { index: 1, sentAt: d(-3), status: 'sent' },
    ]},
    { id: 'AC-1002', patientId: clients[1]?.id, patientName: `${clients[1]?.firstName} ${clients[1]?.lastName}`, templateId: 'tmpl-filler', service: 'Barre', startedAt: d(-2), status: 'active', messagesSent: [
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
    { id: 'AC-1005', patientId: clients[5]?.id, patientName: `${clients[5]?.firstName} ${clients[5]?.lastName}`, templateId: 'tmpl-peel', service: 'Chemical Peel', startedAt: d(-1), status: 'active', messagesSent: [
      { index: 0, sentAt: d(-1), status: 'sent' },
    ]},
    { id: 'AC-1006', patientId: clients[7]?.id, patientName: `${clients[7]?.firstName} ${clients[7]?.lastName}`, templateId: 'tmpl-laser-hair', service: 'Laser Hair Removal', startedAt: d(0), status: 'active', messagesSent: [
      { index: 0, sentAt: d(0), status: 'sent' },
    ]},
    { id: 'AC-1007', patientId: clients[9]?.id, patientName: `${clients[9]?.firstName} ${clients[9]?.lastName}`, templateId: 'tmpl-botox', service: 'Reformer', startedAt: d(-90), status: 'completed', messagesSent: [
      { index: 0, sentAt: d(-90), status: 'sent' },
      { index: 1, sentAt: d(-88), status: 'sent' },
      { index: 2, sentAt: d(-76), status: 'sent' },
      { index: 3, sentAt: d(-6), status: 'sent' },
    ]},
    { id: 'AC-1008', patientId: clients[12]?.id, patientName: `${clients[12]?.firstName} ${clients[12]?.lastName}`, templateId: 'tmpl-filler', service: 'Barre', startedAt: d(-10), status: 'active', messagesSent: [
      { index: 0, sentAt: d(-10), status: 'sent' },
      { index: 1, sentAt: d(-9), status: 'sent' },
      { index: 2, sentAt: d(-3), status: 'sent' },
    ]},
  ];

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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ font: `600 26px ${s.FONT}`, color: s.text, marginBottom: 4 }}>Recovery Tips</h1>
          <p style={{ font: `400 14px ${s.FONT}`, color: s.text2 }}>Automated post-session care sequences for every patient</p>
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
            <p style={{ font: `400 13px ${s.FONT}`, color: s.text2, marginBottom: 20 }}>Select a patient and session type to begin automated care messages</p>
            <div style={{ marginBottom: 16 }}>
              <label style={s.label}>Patient</label>
              <select value={triggerPatient} onChange={e => setTriggerPatient(e.target.value)} style={{ ...s.input, cursor: 'pointer' }}>
                <option value="">Select a patient...</option>
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
