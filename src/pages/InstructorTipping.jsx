import { useState, useMemo } from 'react';
import { useStyles } from '../theme';
import { getProviders, getAppointments, getPatients } from '../data/store';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'fri', 'Sat'];
const CLASS_TYPES = ['Reformer', 'Mat', 'Tower', 'Chair', 'Barre', 'HIIT'];
const TIME_SLOTS = ['Morning (6–10)', 'Midday (10–2)', 'Afternoon (2–6)', 'Evening (6–9)'];

function seedRng(n) { let x = Math.sin(n + 1) * 10000; return x - Math.floor(x); }

function generateTipData(providers, appointments) {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const tips = [];
  let id = 0;
  (appointments || []).forEach((appt, i) => {
    const apptDate = new Date(appt.date || appt.start || now);
    const r = seedRng(i * 7 + 3);
    const r2 = seedRng(i * 13 + 5);
    const shouldTip = r < 0.34;
    if (!shouldTip) return;
    const amounts = [3, 5, 10, 15, 20];
    const amt = amounts[Math.floor(r2 * amounts.length)];
    const instructor = appt.providerId || appt.provider || (providers[i % providers.length]?.id);
    tips.push({ id: id++, instructorId: instructor, amount: amt, date: apptDate, classType: CLASS_TYPES[i % CLASS_TYPES.length], isThisMonth: apptDate >= monthStart });
  });
  if (tips.length < 12) {
    for (let i = 0; i < 40; i++) {
      const r = seedRng(i * 11 + 2);
      const r2 = seedRng(i * 17 + 4);
      const r3 = seedRng(i * 23 + 6);
      const daysAgo = Math.floor(r3 * 60);
      const d = new Date(now); d.setDate(d.getDate() - daysAgo);
      const amounts = [3, 5, 5, 10, 10, 10, 15, 20];
      const amt = amounts[Math.floor(r2 * amounts.length)];
      const prov = providers[Math.floor(r * providers.length)];
      if (!prov) continue;
      tips.push({ id: id++, instructorId: prov.id, amount: amt, date: d, classType: CLASS_TYPES[Math.floor(r2 * CLASS_TYPES.length)], isThisMonth: d >= monthStart });
    }
  }
  return tips;
}

function Sparkline({ data, color, w = 80, h = 28 }) {
  if (!data || data.length < 2) return <svg width={w} height={h} />;
  const max = Math.max(...data, 1);
  const step = w / (data.length - 1);
  const pts = data.map((v, i) => `${i * step},${h - (v / max) * (h - 2) - 1}`).join(' ');
  return (
    <svg width={w} height={h} style={{ display: 'block' }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth={1.8} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

function BarChart({ data, color, labelKey, valueKey, maxVal }) {
  const mx = maxVal || Math.max(...data.map(d => d[valueKey]), 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 64 }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
          <div style={{ width: '100%', background: color, borderRadius: 3, height: Math.max(4, (d[valueKey] / mx) * 52), opacity: 0.85 }} />
          <span style={{ fontSize: 9, color: '#888', textAlign: 'center', lineHeight: 1 }}>{d[labelKey]}</span>
        </div>
      ))}
    </div>
  );
}

function HBar({ label, value, max, color }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3, fontSize: 12 }}>
        <span>{label}</span><span style={{ fontWeight: 600 }}>${value.toFixed(2)}</span>
      </div>
      <div style={{ background: 'rgba(0,0,0,0.07)', borderRadius: 4, height: 7, overflow: 'hidden' }}>
        <div style={{ background: color, width: `${Math.min(100, (value / max) * 100)}%`, height: '100%', borderRadius: 4, transition: 'width 0.6s ease' }} />
      </div>
    </div>
  );
}

export default function InstructorTipping() {
  const s = useStyles();
  const providers = useMemo(() => getProviders() || [], []);
  const appointments = useMemo(() => getAppointments() || [], []);

  const tips = useMemo(() => generateTipData(providers, appointments), [providers, appointments]);
  const monthTips = tips.filter(t => t.isThisMonth);

  const [selectedTip, setSelectedTip] = useState(null);
  const [tippedAmount, setTippedAmount] = useState(null);
  const [showThankYou, setShowThankYou] = useState(false);
  const [previewInstructor, setPreviewInstructor] = useState(providers[0] || null);
  const [platformFee, setPlatformFee] = useState(5);
  const [promptDelay, setPromptDelay] = useState(2);
  const [presets, setPresets] = useState([3, 5, 10]);
  const [activeTab, setActiveTab] = useState('board');

  const totalThisMonth = monthTips.reduce((s, t) => s + t.amount, 0);
  const avgTip = monthTips.length ? (totalThisMonth / monthTips.length) : 6.40;
  const participationRate = appointments.length ? Math.round((monthTips.length / Math.max(appointments.length, 1)) * 100) : 34;

  const instructorStats = useMemo(() => providers.map((p, pi) => {
    const myTips = tips.filter(t => t.instructorId === p.id);
    const myMonthTips = myTips.filter(t => t.isThisMonth);
    const total = myMonthTips.reduce((s, t) => s + t.amount, 0);
    const avg = myMonthTips.length ? total / myMonthTips.length : 0;
    const weeks = Array.from({ length: 8 }, (_, wi) => {
      const wkTips = myTips.filter(t => {
        const age = (Date.now() - t.date.getTime()) / 86400000;
        return age >= wi * 7 && age < (wi + 1) * 7;
      });
      return wkTips.reduce((s, t) => s + t.amount, 0);
    }).reverse();
    const stripeStatuses = ['Connected', 'Connected', 'Connected', 'Pending', 'Connected', 'Pending'];
    const payoutSchedules = ['Weekly', 'Bi-weekly', 'Weekly', 'Bi-weekly', 'Weekly', 'Weekly'];
    return { provider: p, total, count: myMonthTips.length, avg, weeks, stripeStatus: stripeStatuses[pi % 6], payoutSchedule: payoutSchedules[pi % 6] };
  }), [providers, tips]);

  const topInstructor = instructorStats.reduce((best, s) => s.total > (best?.total || 0) ? s : best, null);

  const dayData = DAYS.map((label, i) => ({ label, value: tips.filter(t => t.date.getDay() === i).reduce((s, t) => s + t.amount, 0) }));
  const classData = CLASS_TYPES.map(label => ({ label: label.slice(0, 3), value: tips.filter(t => t.classType === label).reduce((s, t) => s + t.amount, 0) }));
  const timeData = TIME_SLOTS.map((label, i) => {
    const hours = [[6, 10], [10, 14], [14, 18], [18, 21]][i];
    return { label: label.split(' ')[0], value: tips.filter(t => { const h = t.date.getHours(); return h >= hours[0] && h < hours[1]; }).reduce((s, t) => s + t.amount, 0) };
  });

  const accentColor = s.accent || '#7C6FCD';

  const card = { background: 'rgba(255,255,255,0.72)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.6)', borderRadius: 16, boxShadow: s.shadow, padding: 20 };
  const kpiCard = { ...card, padding: '16px 20px' };
  const tabBtn = (active) => ({ padding: '7px 16px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 13, fontFamily: s.FONT, fontWeight: active ? 600 : 400, background: active ? accentColor : 'rgba(0,0,0,0.06)', color: active ? '#fff' : s.text2, transition: 'all 0.2s' });

  function handleTipTap(amount) {
    setTippedAmount(amount);
    setShowThankYou(true);
    setTimeout(() => { setShowThankYou(false); setTippedAmount(null); }, 2200);
  }

  return (
    <div style={{ padding: '32px 28px', maxWidth: 1100, margin: '0 auto', fontFamily: s.FONT, color: s.text }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontFamily: s.MONO, fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: accentColor, marginBottom: 8 }}>Digital Tipping</div>
        <h1 style={{ fontFamily: s.DISPLAY, fontSize: 32, fontWeight: 700, margin: '0 0 8px', color: s.text }}>Instructor Tipping</h1>
        <p style={{ color: s.text2, fontSize: 15, margin: 0 }}>Stripe Connect-powered digital tips — post-class prompts, instant payouts.</p>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 28 }}>
        {[
          { label: 'Tips This Month', value: `$${totalThisMonth.toFixed(0)}`, sub: `${monthTips.length} transactions` },
          { label: 'Avg Tip Amount', value: `$${avgTip.toFixed(2)}`, sub: 'per transaction' },
          { label: 'Tip Participation', value: `${participationRate}%`, sub: 'of classes tipped' },
          { label: 'Top Instructor', value: topInstructor?.provider?.name?.split(' ')[0] || '—', sub: topInstructor ? `$${topInstructor.total} this month` : '' },
          { label: 'vs Last Month', value: '+22%', sub: 'tip revenue trend' },
        ].map((k, i) => (
          <div key={i} style={kpiCard}>
            <div style={{ fontFamily: s.MONO, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.2, color: s.text3, marginBottom: 6 }}>{k.label}</div>
            <div style={{ fontSize: 26, fontWeight: 700, color: i === 3 ? accentColor : s.text, lineHeight: 1.1 }}>{k.value}</div>
            <div style={{ fontSize: 12, color: s.text2, marginTop: 4 }}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {['board', 'flow', 'analytics', 'settings'].map(t => (
          <button key={t} style={tabBtn(activeTab === t)} onClick={() => setActiveTab(t)}>
            {t === 'board' ? 'Earnings Board' : t === 'flow' ? 'Client Flow' : t === 'analytics' ? 'Analytics' : 'Settings'}
          </button>
        ))}
      </div>

      {/* Earnings Board */}
      {activeTab === 'board' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16, marginBottom: 24 }}>
            {instructorStats.map((ist, i) => (
              <div key={i} style={card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{ist.provider.name}</div>
                    <div style={{ fontSize: 12, color: s.text2 }}>{ist.provider.specialty || ist.provider.title || 'Instructor'}</div>
                  </div>
                  <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: ist.stripeStatus === 'Connected' ? 'rgba(52,199,89,0.12)' : 'rgba(255,159,10,0.12)', color: ist.stripeStatus === 'Connected' ? '#1a8a3a' : '#b45309', fontFamily: s.MONO }}>
                    {ist.stripeStatus}
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 14 }}>
                  {[['Total', `$${ist.total.toFixed(0)}`], ['Tips', ist.count], ['Avg', `$${ist.avg.toFixed(2)}`]].map(([l, v]) => (
                    <div key={l} style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 18, fontWeight: 700, color: s.text }}>{v}</div>
                      <div style={{ fontSize: 10, color: s.text3, fontFamily: s.MONO, textTransform: 'uppercase', letterSpacing: 1 }}>{l}</div>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Sparkline data={ist.weeks} color={accentColor} />
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 10, color: s.text3, fontFamily: s.MONO }}>Payout</div>
                    <div style={{ fontSize: 12, fontWeight: 600 }}>{ist.payoutSchedule}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {/* Revenue Impact */}
          <div style={{ ...card, background: `linear-gradient(135deg, ${accentColor}18, rgba(255,255,255,0.72))`, border: `1px solid ${accentColor}30` }}>
            <div style={{ fontFamily: s.MONO, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.5, color: accentColor, marginBottom: 8 }}>Revenue Impact</div>
            <p style={{ margin: '0 0 6px', fontSize: 15, fontWeight: 600 }}>Digital tipping platforms report an <span style={{ color: accentColor }}>85% increase</span> in tip earnings vs cash.</p>
            <p style={{ margin: 0, color: s.text2, fontSize: 14 }}>Projected annual tip revenue: <strong>$18,400</strong> across {providers.length || 6} instructors — at current participation rates.</p>
          </div>
        </>
      )}

      {/* Client Tipping Flow */}
      {activeTab === 'flow' && (
        <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <div style={{ flex: '0 0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ fontFamily: s.MONO, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.5, color: s.text3, marginBottom: 14 }}>Post-Class Screen</div>
            {/* Phone shell */}
            <div style={{ width: 280, background: '#1a1a2e', borderRadius: 44, padding: '14px 6px', boxShadow: '0 24px 64px rgba(0,0,0,0.32)', border: '6px solid #2a2a3e', position: 'relative' }}>
              <div style={{ background: '#111', borderRadius: 4, width: 60, height: 5, margin: '0 auto 12px' }} />
              <div style={{ background: '#fff', borderRadius: 32, overflow: 'hidden', minHeight: 480, display: 'flex', flexDirection: 'column', padding: 24, alignItems: 'center' }}>
                {showThankYou ? (
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                    <div style={{ fontSize: 52, marginBottom: 12 }}>🎉</div>
                    <div style={{ fontFamily: s.DISPLAY, fontSize: 22, fontWeight: 700, color: s.text, marginBottom: 8 }}>Thank You!</div>
                    <div style={{ color: s.text2, fontSize: 14 }}>${tippedAmount} sent to {previewInstructor?.name?.split(' ')[0] || 'your instructor'}</div>
                    <div style={{ marginTop: 16, fontSize: 12, color: '#aaa' }}>They'll receive it on their next payout.</div>
                  </div>
                ) : (
                  <>
                    <div style={{ width: 64, height: 64, borderRadius: 32, background: `linear-gradient(135deg, ${accentColor}, ${accentColor}99)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, marginBottom: 14, color: '#fff', fontWeight: 700 }}>
                      {(previewInstructor?.name || 'I').charAt(0)}
                    </div>
                    <div style={{ fontFamily: s.DISPLAY, fontSize: 18, fontWeight: 700, textAlign: 'center', color: s.text, marginBottom: 4 }}>Great class!</div>
                    <div style={{ fontSize: 13, color: s.text2, textAlign: 'center', marginBottom: 24 }}>with {previewInstructor?.name || 'your instructor'}</div>
                    <div style={{ fontSize: 12, color: s.text3, textTransform: 'uppercase', fontFamily: s.MONO, letterSpacing: 1, marginBottom: 12 }}>Leave a tip?</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, width: '100%', marginBottom: 10 }}>
                      {presets.map(amt => (
                        <button key={amt} onClick={() => handleTipTap(amt)} style={{ padding: '14px 8px', borderRadius: 12, border: `2px solid ${accentColor}`, background: tippedAmount === amt ? accentColor : 'transparent', color: tippedAmount === amt ? '#fff' : accentColor, fontSize: 18, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s', fontFamily: s.FONT }}>
                          ${amt}
                        </button>
                      ))}
                      <button onClick={() => handleTipTap('custom')} style={{ padding: '14px 8px', borderRadius: 12, border: '2px solid #ddd', background: 'transparent', color: s.text2, fontSize: 13, cursor: 'pointer', fontFamily: s.FONT, gridColumn: '1 / -1' }}>
                        Custom amount
                      </button>
                    </div>
                    <button style={{ width: '100%', padding: '10px', borderRadius: 10, border: 'none', background: 'transparent', color: '#aaa', fontSize: 12, cursor: 'pointer', fontFamily: s.FONT }}>No thanks</button>
                  </>
                )}
              </div>
            </div>
          </div>
          <div style={{ flex: 1, minWidth: 240 }}>
            <div style={{ ...card, marginBottom: 16 }}>
              <div style={{ fontWeight: 600, marginBottom: 12 }}>Preview Instructor</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {providers.slice(0, 6).map((p, i) => (
                  <label key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '8px 10px', borderRadius: 10, background: previewInstructor?.id === p.id ? `${accentColor}15` : 'transparent', border: `1px solid ${previewInstructor?.id === p.id ? accentColor + '40' : 'transparent'}` }}>
                    <input type="radio" name="preview" checked={previewInstructor?.id === p.id} onChange={() => setPreviewInstructor(p)} style={{ accentColor }} />
                    <span style={{ fontSize: 14 }}>{p.name}</span>
                  </label>
                ))}
              </div>
            </div>
            <div style={{ ...card, fontSize: 13, color: s.text2, lineHeight: 1.6 }}>
              <div style={{ fontWeight: 700, color: s.text, marginBottom: 8 }}>How it works</div>
              <ol style={{ margin: 0, paddingLeft: 18 }}>
                <li>Client receives push notification {promptDelay} min after class ends.</li>
                <li>Taps preset or enters custom amount.</li>
                <li>Charged to card on file via Stripe.</li>
                <li>Platform retains {platformFee}% fee.</li>
                <li>Instructor receives payout on their schedule.</li>
              </ol>
            </div>
          </div>
        </div>
      )}

      {/* Analytics */}
      {activeTab === 'analytics' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 18 }}>
          <div style={card}>
            <div style={{ fontFamily: s.MONO, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.2, color: s.text3, marginBottom: 14 }}>Tips by Day of Week</div>
            <BarChart data={dayData} color={accentColor} labelKey="label" valueKey="value" />
          </div>
          <div style={card}>
            <div style={{ fontFamily: s.MONO, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.2, color: s.text3, marginBottom: 14 }}>Tips by Class Type</div>
            <BarChart data={classData} color={`${accentColor}bb`} labelKey="label" valueKey="value" />
          </div>
          <div style={card}>
            <div style={{ fontFamily: s.MONO, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.2, color: s.text3, marginBottom: 14 }}>Tips by Time of Day</div>
            <BarChart data={timeData} color="#5cb85c" labelKey="label" valueKey="value" />
          </div>
          <div style={card}>
            <div style={{ fontFamily: s.MONO, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.2, color: s.text3, marginBottom: 16 }}>Avg Tip by Instructor</div>
            {instructorStats.slice(0, 6).map((ist, i) => (
              <HBar key={i} label={ist.provider.name?.split(' ')[0] || '—'} value={ist.avg} max={Math.max(...instructorStats.map(x => x.avg), 20)} color={accentColor} />
            ))}
          </div>
        </div>
      )}

      {/* Settings */}
      {activeTab === 'settings' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 18 }}>
          <div style={card}>
            <div style={{ fontWeight: 700, marginBottom: 16 }}>Platform Settings</div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, color: s.text2, display: 'block', marginBottom: 6 }}>Platform Fee (%)</label>
              <input type="number" value={platformFee} min={0} max={20} onChange={e => setPlatformFee(+e.target.value)} style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #ddd', fontFamily: s.FONT, fontSize: 15 }} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, color: s.text2, display: 'block', marginBottom: 6 }}>Auto-Prompt Delay (minutes after class)</label>
              <input type="number" value={promptDelay} min={0} max={60} onChange={e => setPromptDelay(+e.target.value)} style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #ddd', fontFamily: s.FONT, fontSize: 15 }} />
            </div>
            <div>
              <label style={{ fontSize: 13, color: s.text2, display: 'block', marginBottom: 6 }}>Tip Presets (comma-separated, $)</label>
              <input type="text" value={presets.join(', ')} onChange={e => { const vals = e.target.value.split(',').map(v => parseInt(v.trim())).filter(n => !isNaN(n) && n > 0); if (vals.length) setPresets(vals); }} style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #ddd', fontFamily: s.FONT, fontSize: 15 }} />
            </div>
          </div>
          <div style={card}>
            <div style={{ fontWeight: 700, marginBottom: 16 }}>Stripe Connect Status</div>
            {instructorStats.map((ist, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: i < instructorStats.length - 1 ? '1px solid rgba(0,0,0,0.06)' : 'none' }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{ist.provider.name}</div>
                  <div style={{ fontSize: 11, color: s.text3 }}>{ist.payoutSchedule} payouts</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: ist.stripeStatus === 'Connected' ? 'rgba(52,199,89,0.12)' : 'rgba(255,159,10,0.12)', color: ist.stripeStatus === 'Connected' ? '#1a8a3a' : '#b45309', fontFamily: s.MONO }}>
                    {ist.stripeStatus}
                  </span>
                  {ist.stripeStatus === 'Pending' && <button style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, border: `1px solid ${accentColor}`, background: 'transparent', color: accentColor, cursor: 'pointer', fontFamily: s.FONT }}>Invite</button>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
