import { useState, useEffect, useMemo } from 'react';
import { useStyles, useTheme } from '../theme';
import { getAppointments } from '../data/store';

// ── Nutrition data by class category ───────────────────────────────────────
const CLASS_NUTRITION = [
  {
    id: 'reformer',
    label: 'Reformer / High Intensity',
    emoji: '⚡',
    accentColor: '#E8763A',
    bgGradient: 'linear-gradient(135deg, #FFF5EE 0%, #FFF0E8 100%)',
    keywords: ['reformer', 'high intensity', 'hiit', 'cardio', 'jumpboard'],
    pre: 'Light snack 1–2 hours before — banana + almond butter',
    post: 'Protein smoothie — Greek yogurt, berries, honey, protein powder',
    hydration: '16–24 oz water, add electrolytes if >60 min',
    timing: 'Eat within 30–60 minutes after class',
    macros: { protein: 25, carbs: 35, fat: 8 },
    extras: [],
  },
  {
    id: 'mat',
    label: 'Mat / Core Focus',
    emoji: '🧘',
    accentColor: '#6B8F71',
    bgGradient: 'linear-gradient(135deg, #F2F7F2 0%, #EDF5ED 100%)',
    keywords: ['mat', 'core', 'foundation', 'beginner', 'floor'],
    pre: 'Toast with avocado, 1 hour before',
    post: 'Grilled chicken salad with quinoa and roasted vegetables',
    hydration: '16 oz water with lemon',
    timing: 'Eat within 45–60 minutes after class',
    macros: { protein: 30, carbs: 40, fat: 12 },
    extras: [],
  },
  {
    id: 'barre',
    label: 'Barre / Sculpt',
    emoji: '🩰',
    accentColor: '#C47B8E',
    bgGradient: 'linear-gradient(135deg, #FDF2F5 0%, #FAF0F4 100%)',
    keywords: ['barre', 'sculpt', 'toning', 'ballet', 'fusion'],
    pre: 'Overnight oats with berries',
    post: 'Salmon bowl — rice, edamame, avocado, sesame',
    hydration: 'Coconut water or electrolyte drink',
    timing: 'Eat within 30–45 minutes after class',
    macros: { protein: 28, carbs: 45, fat: 15 },
    extras: [],
  },
  {
    id: 'restore',
    label: 'Stretch & Restore / Recovery',
    emoji: '🌿',
    accentColor: '#5B8FA8',
    bgGradient: 'linear-gradient(135deg, #F0F6FA 0%, #EBF3F8 100%)',
    keywords: ['stretch', 'restore', 'recovery', 'yin', 'restorative', 'flexibility'],
    pre: 'Light — herbal tea and a few nuts',
    post: 'Anti-inflammatory smoothie — turmeric, ginger, mango, coconut milk',
    hydration: 'Warm water with lemon and honey',
    timing: 'Light snack 30 minutes after, full meal within 90 min',
    macros: { protein: 12, carbs: 30, fat: 8 },
    extras: [],
  },
  {
    id: 'private',
    label: 'Private Training',
    emoji: '🎯',
    accentColor: '#8B6B94',
    bgGradient: 'linear-gradient(135deg, #F7F2FA 0%, #F2EDF7 100%)',
    keywords: ['private', 'one-on-one', 'personal', 'semi-private'],
    pre: 'Egg white omelet with spinach, 1.5 hours before',
    post: 'Lean protein + complex carbs — turkey wrap with sweet potato',
    hydration: '20–24 oz water, BCAAs optional',
    timing: 'Eat within 30 minutes of session',
    macros: { protein: 35, carbs: 40, fat: 10 },
    extras: [],
  },
  {
    id: 'prenatal',
    label: 'Prenatal',
    emoji: '🤱',
    accentColor: '#B8956A',
    bgGradient: 'linear-gradient(135deg, #FBF6EF 0%, #F8F1E8 100%)',
    keywords: ['prenatal', 'pregnancy', 'mama', 'postnatal', 'postnatal'],
    pre: 'Crackers with cheese, small portions',
    post: 'Iron-rich meal — lentil soup with whole grain bread',
    hydration: 'Frequent small sips, room temperature water',
    timing: 'Small frequent meals — every 2–3 hours',
    macros: { protein: 20, carbs: 35, fat: 12 },
    extras: ['+Folate', '+Iron'],
  },
];

const QUICK_TIPS = [
  { icon: '🚫', tip: "Don't eat a heavy meal within 2 hours of Reformer — your core will thank you." },
  { icon: '🍫', tip: 'Magnesium helps with muscle recovery — try dark chocolate or almonds after class.' },
  { icon: '☕', tip: 'Caffeine before morning Pilates can improve focus, but skip it before evening classes.' },
  { icon: '✨', tip: 'Collagen peptides support joint health — add to your smoothie or morning coffee.' },
  { icon: '🍒', tip: 'Tart cherry juice reduces muscle soreness by up to 20% when taken post-workout.' },
  { icon: '💧', tip: 'You lose 16–24 oz of water per hour of exercise — sip before you feel thirsty.' },
  { icon: '🥚', tip: 'Leucine-rich foods (eggs, chicken, Greek yogurt) trigger muscle protein synthesis fastest.' },
  { icon: '🌿', tip: 'Anti-inflammatory herbs like turmeric and ginger are just as powerful as NSAIDs for soreness.' },
];

const GROCERY_TEMPLATE = {
  Protein: [
    { item: 'Greek yogurt (plain, full-fat)', id: 'gy' },
    { item: 'Chicken breast', id: 'cb' },
    { item: 'Salmon fillets', id: 'sf' },
    { item: 'Eggs / egg whites', id: 'eg' },
    { item: 'Turkey breast (sliced)', id: 'tb' },
    { item: 'Lentils (red or green)', id: 'ln' },
    { item: 'Protein powder (whey or plant)', id: 'pp' },
  ],
  Produce: [
    { item: 'Bananas', id: 'bn' },
    { item: 'Mixed berries (or frozen)', id: 'mb' },
    { item: 'Spinach / arugula', id: 'sp' },
    { item: 'Avocados', id: 'av' },
    { item: 'Sweet potato', id: 'sw' },
    { item: 'Mango (fresh or frozen)', id: 'mg' },
    { item: 'Lemons', id: 'lm' },
    { item: 'Edamame (shelled)', id: 'ed' },
  ],
  Grains: [
    { item: 'Quinoa', id: 'qn' },
    { item: 'Brown rice', id: 'br' },
    { item: 'Whole grain bread', id: 'wg' },
    { item: 'Overnight oats / rolled oats', id: 'oo' },
    { item: 'Whole wheat wraps', id: 'ww' },
    { item: 'Whole grain crackers', id: 'wc' },
  ],
  Dairy: [
    { item: 'Cottage cheese', id: 'cc' },
    { item: 'Cheese slices (sharp cheddar)', id: 'cs' },
    { item: 'Coconut milk (carton)', id: 'cm' },
  ],
  Pantry: [
    { item: 'Almond butter', id: 'ab' },
    { item: 'Raw almonds / mixed nuts', id: 'an' },
    { item: 'Honey (raw)', id: 'hn' },
    { item: 'Sesame seeds / tahini', id: 'ss' },
    { item: 'Turmeric + ginger (ground)', id: 'tg' },
    { item: 'Electrolyte packets', id: 'ep' },
    { item: 'Coconut water (unsweetened)', id: 'cw' },
    { item: 'Herbal tea (chamomile / peppermint)', id: 'ht' },
  ],
};

// ── Helpers ─────────────────────────────────────────────────────────────────
function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function matchClassType(classTitle = '') {
  const lower = (classTitle || '').toLowerCase();
  for (const cat of CLASS_NUTRITION) {
    if (cat.keywords.some(k => lower.includes(k))) return cat;
  }
  // Default to reformer if no match
  return CLASS_NUTRITION[0];
}

function formatTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d)) return iso;
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function MacroBar({ macros, accent }) {
  const total = macros.protein + macros.carbs + macros.fat;
  const proteinPct = Math.round((macros.protein / total) * 100);
  const carbsPct = Math.round((macros.carbs / total) * 100);
  const fatPct = Math.round((macros.fat / total) * 100);

  return (
    <div>
      <div style={{ display: 'flex', gap: 4, height: 6, borderRadius: 99, overflow: 'hidden', marginBottom: 8 }}>
        <div style={{ width: `${proteinPct}%`, background: '#6B8F71', borderRadius: '99px 0 0 99px' }} />
        <div style={{ width: `${carbsPct}%`, background: '#C9963A' }} />
        <div style={{ width: `${fatPct}%`, background: '#5B8FA8', borderRadius: '0 99px 99px 0' }} />
      </div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <MacroChip label="Protein" value={`${macros.protein}g`} color="#6B8F71" bg="#F0F5F1" />
        <MacroChip label="Carbs" value={`${macros.carbs}g`} color="#C9963A" bg="#FBF5E8" />
        <MacroChip label="Fat" value={`${macros.fat}g`} color="#5B8FA8" bg="#EBF3F8" />
      </div>
    </div>
  );
}

function MacroChip({ label, value, color, bg }) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      background: bg, borderRadius: 99, padding: '3px 10px',
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, flexShrink: 0 }} />
      <span style={{ font: "500 11px 'JetBrains Mono', monospace", color }}>
        {label} {value}
      </span>
    </div>
  );
}

function WaterGlass({ filled, onClick, index }) {
  return (
    <button
      onClick={onClick}
      title={`Glass ${index + 1}${filled ? ' (filled)' : ''}`}
      style={{
        background: 'none', border: 'none', cursor: 'pointer', padding: 4,
        transition: 'transform 0.15s',
      }}
      onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.15)'}
      onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
    >
      <svg width="32" height="40" viewBox="0 0 32 40" fill="none">
        {/* Glass outline */}
        <path
          d="M6 4 L8 36 L24 36 L26 4 Z"
          fill={filled ? '#BAE4F8' : 'transparent'}
          stroke={filled ? '#5B8FA8' : '#CBD5E1'}
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        {/* Water fill ripple when filled */}
        {filled && (
          <path
            d="M8.5 18 Q16 14 23.5 18"
            stroke="#93C9E8"
            strokeWidth="1.2"
            fill="none"
            opacity="0.7"
          />
        )}
        {/* Shine */}
        <line x1="10" y1="8" x2="11" y2="28" stroke="rgba(255,255,255,0.5)" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    </button>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────
export default function Nutrition() {
  const s = useStyles();
  const { theme } = useTheme();
  const A = theme.accent;

  // Today's class
  const [todayClass, setTodayClass] = useState(null);

  // Grocery list checkbox state
  const [checkedItems, setCheckedItems] = useState(() => {
    try { return JSON.parse(localStorage.getItem('rp_grocery_list')) || {}; } catch { return {}; }
  });

  // Hydration state — object keyed by date string
  const [hydration, setHydration] = useState(() => {
    try { return JSON.parse(localStorage.getItem('rp_hydration')) || {}; } catch { return {}; }
  });

  // Weekly class summary
  const [weekClasses, setWeekClasses] = useState([]);

  useEffect(() => {
    const today = todayStr();
    const apts = getAppointments();

    // Find today's appointment
    const todays = apts.filter(a => {
      const d = (a.date || a.start || a.createdAt || '').slice(0, 10);
      return d === today && a.status !== 'cancelled';
    });
    if (todays.length > 0) {
      const apt = todays[0];
      setTodayClass({
        title: apt.service || apt.title || apt.className || 'Pilates Class',
        time: formatTime(apt.start || apt.date),
        instructor: apt.instructorName || apt.instructor || '',
        nutrition: matchClassType(apt.service || apt.title || apt.className || ''),
      });
    }

    // Weekly classes (next 7 days)
    const now = new Date();
    const week = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() + i);
      const ds = d.toISOString().slice(0, 10);
      const dayApts = apts.filter(a => (a.date || a.start || '').slice(0, 10) === ds && a.status !== 'cancelled');
      dayApts.forEach(a => {
        week.push({
          date: ds,
          title: a.service || a.title || a.className || 'Pilates Class',
          nutrition: matchClassType(a.service || a.title || a.className || ''),
        });
      });
    }
    setWeekClasses(week);
  }, []);

  // Hydration helpers
  const today = todayStr();
  const hasClassToday = !!todayClass;
  const waterGoal = hasClassToday ? 10 : 8;
  const waterCount = hydration[today] || 0;

  function toggleWater(i) {
    const next = i < waterCount ? i : waterCount + 1;
    const updated = { ...hydration, [today]: next === waterCount ? waterCount - 1 : waterCount + 1 };
    // Clamp
    updated[today] = Math.max(0, Math.min(waterGoal, i + 1 === waterCount ? waterCount - 1 : i + 1));
    // Actually: clicking glass i fills up to i+1 or empties to i if already filled
    const newCount = i < waterCount ? i : i + 1;
    const clamped = { ...hydration, [today]: newCount };
    setHydration(clamped);
    localStorage.setItem('rp_hydration', JSON.stringify(clamped));
  }

  // Grocery helpers
  function toggleGrocery(id) {
    const updated = { ...checkedItems, [id]: !checkedItems[id] };
    setCheckedItems(updated);
    localStorage.setItem('rp_grocery_list', JSON.stringify(updated));
  }

  function clearChecked() {
    const updated = {};
    Object.keys(checkedItems).forEach(k => { updated[k] = false; });
    setCheckedItems(updated);
    localStorage.setItem('rp_grocery_list', JSON.stringify(updated));
  }

  // Weekly summary
  const weekSummary = useMemo(() => {
    const counts = {};
    weekClasses.forEach(c => {
      const lbl = c.nutrition.label;
      counts[lbl] = (counts[lbl] || 0) + 1;
    });
    return counts;
  }, [weekClasses]);

  const weekSummaryText = useMemo(() => {
    const entries = Object.entries(weekSummary);
    if (entries.length === 0) return null;
    return entries.map(([lbl, n]) => `${n} ${lbl}`).join(', ');
  }, [weekSummary]);

  // Styles
  const pageStyle = {
    maxWidth: 960,
    margin: '0 auto',
    fontFamily: "'Outfit', -apple-system, sans-serif",
  };

  const sectionTitle = {
    font: "600 22px 'Outfit', sans-serif",
    color: '#111',
    marginBottom: 4,
  };

  const sectionSubtitle = {
    font: "400 14px 'Outfit', sans-serif",
    color: '#777',
    marginBottom: 24,
    lineHeight: 1.5,
  };

  const cardBase = {
    background: 'rgba(255,255,255,0.75)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid rgba(255,255,255,0.7)',
    borderRadius: 20,
    boxShadow: '0 4px 24px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)',
  };

  return (
    <div style={pageStyle}>
      <style>{`
        .nutrition-tip-scroll {
          display: flex;
          gap: 16px;
          overflow-x: auto;
          padding-bottom: 8px;
          scrollbar-width: thin;
          scrollbar-color: rgba(0,0,0,0.1) transparent;
          -webkit-overflow-scrolling: touch;
        }
        .nutrition-tip-scroll::-webkit-scrollbar { height: 4px; }
        .nutrition-tip-scroll::-webkit-scrollbar-track { background: transparent; }
        .nutrition-tip-scroll::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 99px; }

        .class-card-scroll {
          display: flex;
          gap: 16px;
          overflow-x: auto;
          padding-bottom: 12px;
          scrollbar-width: thin;
          scrollbar-color: rgba(0,0,0,0.1) transparent;
          -webkit-overflow-scrolling: touch;
        }
        .class-card-scroll::-webkit-scrollbar { height: 4px; }
        .class-card-scroll::-webkit-scrollbar-track { background: transparent; }
        .class-card-scroll::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.12); border-radius: 99px; }

        .grocery-item:hover { background: rgba(0,0,0,0.02) !important; }
        .water-glass-row { display: flex; flex-wrap: wrap; gap: 4; }

        @media (max-width: 640px) {
          .nutrition-two-col { flex-direction: column !important; }
          .grocery-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* ── Hero ── */}
      <div style={{ marginBottom: 40 }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: `${A}15`, borderRadius: 99, padding: '5px 14px', marginBottom: 14,
        }}>
          <span style={{ fontSize: 14 }}>🥗</span>
          <span style={{
            font: "500 11px 'JetBrains Mono', monospace",
            color: A, textTransform: 'uppercase', letterSpacing: 1.2,
          }}>Body Intelligence</span>
        </div>
        <h1 style={{
          font: "600 38px 'Playfair Display', serif",
          color: '#111', margin: '0 0 12px',
          lineHeight: 1.15,
        }}>
          Fuel Your Practice
        </h1>
        <p style={{
          font: "400 17px 'Outfit', sans-serif",
          color: '#666', margin: 0, maxWidth: 540, lineHeight: 1.6,
        }}>
          Personalized nutrition suggestions based on your classes. What you eat before and after shapes how you feel, recover, and grow.
        </p>
      </div>

      {/* ── Today's Class Card ── */}
      {todayClass ? (
        <div style={{ ...cardBase, padding: 28, marginBottom: 40, borderLeft: `4px solid ${todayClass.nutrition.accentColor}` }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
            <div>
              <div style={{
                font: "500 10px 'JetBrains Mono', monospace",
                textTransform: 'uppercase', letterSpacing: 1.4,
                color: '#999', marginBottom: 6,
              }}>Today's Class</div>
              <div style={{ font: "600 22px 'Outfit', sans-serif", color: '#111', marginBottom: 4 }}>
                {todayClass.emoji || todayClass.nutrition.emoji} {todayClass.title}
              </div>
              <div style={{ font: "400 14px 'Outfit', sans-serif", color: '#777' }}>
                {todayClass.time && <span>{todayClass.time}</span>}
                {todayClass.time && todayClass.instructor && <span style={{ margin: '0 8px', opacity: 0.4 }}>·</span>}
                {todayClass.instructor && <span>with {todayClass.instructor}</span>}
              </div>
            </div>
            <div style={{
              background: `${todayClass.nutrition.accentColor}15`,
              color: todayClass.nutrition.accentColor,
              borderRadius: 12, padding: '8px 14px',
              font: "500 12px 'Outfit', sans-serif",
              whiteSpace: 'nowrap',
            }}>
              {todayClass.nutrition.label}
            </div>
          </div>

          <div style={{
            background: `${todayClass.nutrition.accentColor}08`,
            border: `1px solid ${todayClass.nutrition.accentColor}20`,
            borderRadius: 14, padding: '18px 20px', marginBottom: 16,
          }}>
            <div style={{
              font: "500 10px 'JetBrains Mono', monospace",
              textTransform: 'uppercase', letterSpacing: 1.4,
              color: todayClass.nutrition.accentColor, marginBottom: 8,
            }}>Post-Class Fuel</div>
            <div style={{ font: "500 15px 'Outfit', sans-serif", color: '#222', marginBottom: 6 }}>
              {todayClass.nutrition.post}
            </div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'rgba(255,255,255,0.7)', borderRadius: 99,
              padding: '4px 12px', font: "400 12px 'Outfit', sans-serif", color: '#777',
            }}>
              ⏱ {todayClass.nutrition.timing}
            </div>
          </div>

          <MacroBar macros={todayClass.nutrition.macros} accent={todayClass.nutrition.accentColor} />
        </div>
      ) : (
        <div style={{
          ...cardBase,
          padding: '24px 28px', marginBottom: 40,
          border: '1px dashed rgba(0,0,0,0.10)',
          background: 'rgba(255,255,255,0.4)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: `${A}15`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22,
            }}>🗓️</div>
            <div>
              <div style={{ font: "500 15px 'Outfit', sans-serif", color: '#333', marginBottom: 3 }}>No class scheduled for today</div>
              <div style={{ font: "400 13px 'Outfit', sans-serif", color: '#999' }}>Browse nutrition by class type below to plan ahead.</div>
            </div>
          </div>
        </div>
      )}

      {/* ── Nutrition by Class Type ── */}
      <div style={{ marginBottom: 48 }}>
        <div style={sectionTitle}>Nutrition by Class Type</div>
        <div style={sectionSubtitle}>Pre-class fuel, post-class recovery, and hydration for every format.</div>

        <div className="class-card-scroll">
          {CLASS_NUTRITION.map(cat => (
            <div key={cat.id} style={{
              minWidth: 300, maxWidth: 340,
              background: cat.bgGradient,
              border: `1.5px solid ${cat.accentColor}25`,
              borderRadius: 20,
              padding: 24,
              flexShrink: 0,
              boxShadow: `0 4px 20px ${cat.accentColor}12`,
            }}>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 10,
                  background: `${cat.accentColor}20`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 20,
                }}>
                  {cat.emoji}
                </div>
                <div>
                  <div style={{ font: "600 14px 'Outfit', sans-serif", color: '#111', lineHeight: 1.2 }}>
                    {cat.label}
                  </div>
                </div>
              </div>

              {/* Pre / Post / Hydration */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
                <NutritionRow icon="🌅" color="#C9963A" bg="#FBF5E8" label="Pre" value={cat.pre} />
                <NutritionRow icon="⚡" color={cat.accentColor} bg={`${cat.accentColor}12`} label="Post" value={cat.post} />
                <NutritionRow icon="💧" color="#5B8FA8" bg="#EBF3F8" label="Hydration" value={cat.hydration} />
              </div>

              {/* Macros */}
              <div style={{
                background: 'rgba(255,255,255,0.55)',
                borderRadius: 12, padding: '12px 14px',
              }}>
                <div style={{
                  font: "500 10px 'JetBrains Mono', monospace",
                  textTransform: 'uppercase', letterSpacing: 1.2,
                  color: '#888', marginBottom: 8,
                }}>Target Macros</div>
                <MacroBar macros={cat.macros} accent={cat.accentColor} />
                {cat.extras.length > 0 && (
                  <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {cat.extras.map(e => (
                      <span key={e} style={{
                        font: "500 10px 'JetBrains Mono', monospace",
                        background: `${cat.accentColor}20`, color: cat.accentColor,
                        borderRadius: 99, padding: '2px 8px',
                      }}>{e}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Weekly Meal Prep ── */}
      <div style={{ ...cardBase, padding: 28, marginBottom: 40 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
          <div>
            <div style={sectionTitle}>Weekly Meal Prep</div>
            {weekSummaryText ? (
              <div style={sectionSubtitle}>
                This week you have: <strong style={{ color: '#333' }}>{weekSummaryText}</strong>
              </div>
            ) : (
              <div style={sectionSubtitle}>No upcoming classes found. Here's a general prep list to keep you fueled.</div>
            )}
          </div>
          <button
            onClick={clearChecked}
            style={{
              ...s.pillGhost, fontSize: 12, padding: '7px 14px',
            }}
          >
            Clear checked
          </button>
        </div>

        <div className="grocery-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20 }}>
          {Object.entries(GROCERY_TEMPLATE).map(([category, items]) => (
            <GroceryCategory
              key={category}
              category={category}
              items={items}
              checked={checkedItems}
              onToggle={toggleGrocery}
              accent={A}
            />
          ))}
        </div>
      </div>

      {/* ── Hydration Tracker + Tips side by side ── */}
      <div className="nutrition-two-col" style={{ display: 'flex', gap: 24, marginBottom: 48 }}>

        {/* Hydration */}
        <div style={{ ...cardBase, padding: 28, flex: '1 1 300px' }}>
          <div style={sectionTitle}>Hydration Today</div>
          <div style={{ ...sectionSubtitle, marginBottom: 20 }}>
            Goal: <strong style={{ color: '#333' }}>{waterGoal} glasses</strong>
            {hasClassToday && (
              <span style={{
                marginLeft: 8,
                background: `${A}15`, color: A,
                borderRadius: 99, padding: '2px 10px',
                font: "500 11px 'Outfit', sans-serif",
              }}>+2 for class day</span>
            )}
          </div>

          <div className="water-glass-row" style={{ marginBottom: 20 }}>
            {Array.from({ length: waterGoal }).map((_, i) => (
              <WaterGlass key={i} index={i} filled={i < waterCount} onClick={() => toggleWater(i)} />
            ))}
          </div>

          <div style={{
            background: waterCount >= waterGoal ? '#F0F9F1' : `${A}08`,
            border: `1px solid ${waterCount >= waterGoal ? '#A8D5A2' : `${A}20`}`,
            borderRadius: 12, padding: '12px 16px',
            font: "500 14px 'Outfit', sans-serif",
            color: waterCount >= waterGoal ? '#2E7D32' : '#555',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            {waterCount >= waterGoal
              ? '🎉 Goal reached! Great hydration today.'
              : `💧 ${waterCount} of ${waterGoal} glasses · ${waterGoal - waterCount} to go`}
          </div>

          <div style={{
            marginTop: 14,
            font: "400 12px 'Outfit', sans-serif",
            color: '#AAA', lineHeight: 1.5,
          }}>
            Tap a glass to track your intake. Resets each day.
          </div>
        </div>

        {/* Hydration guide */}
        <div style={{ ...cardBase, padding: 28, flex: '1 1 260px', background: 'linear-gradient(135deg, #EBF3F8 0%, #EEF5FA 100%)', border: '1px solid #C5DDED' }}>
          <div style={{ fontSize: 28, marginBottom: 12 }}>💧</div>
          <div style={{ font: "600 16px 'Outfit', sans-serif", color: '#1A4A6B', marginBottom: 16 }}>
            Hydration Guide
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { when: 'On waking', amount: '16 oz', note: 'Rehydrate after sleep' },
              { when: '60 min pre-class', amount: '16 oz', note: 'Top up your tank' },
              { when: 'During class', amount: '4–8 oz', note: 'Sip every 15 min' },
              { when: 'Post-class', amount: '16–24 oz', note: 'Replace what you lost' },
              { when: 'With meals', amount: '8 oz', note: 'Aids digestion' },
            ].map(row => (
              <div key={row.when} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  minWidth: 90, font: "500 12px 'JetBrains Mono', monospace",
                  color: '#2C6E9B', fontSize: 11,
                }}>
                  {row.when}
                </div>
                <div style={{
                  font: "600 13px 'Outfit', sans-serif", color: '#1A4A6B',
                  minWidth: 52,
                }}>
                  {row.amount}
                </div>
                <div style={{ font: "400 12px 'Outfit', sans-serif", color: '#5B8FA8' }}>
                  {row.note}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Quick Tips Carousel ── */}
      <div style={{ marginBottom: 48 }}>
        <div style={sectionTitle}>Quick Tips</div>
        <div style={{ ...sectionSubtitle, marginBottom: 20 }}>Evidence-based nutrition insights for Pilates practitioners.</div>

        <div className="nutrition-tip-scroll">
          {QUICK_TIPS.map((t, i) => (
            <div key={i} style={{
              minWidth: 240, maxWidth: 280,
              background: 'rgba(255,255,255,0.72)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: '1px solid rgba(255,255,255,0.7)',
              borderRadius: 18,
              padding: '20px 20px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
              flexShrink: 0,
            }}>
              <div style={{ fontSize: 28, marginBottom: 10 }}>{t.icon}</div>
              <p style={{
                font: "400 13px 'Outfit', sans-serif",
                color: '#444', lineHeight: 1.65, margin: 0,
              }}>
                {t.tip}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Footer note ── */}
      <div style={{
        textAlign: 'center',
        font: "400 12px 'Outfit', sans-serif",
        color: '#BBB', paddingBottom: 32,
        lineHeight: 1.6,
      }}>
        Nutrition suggestions are general guidelines. Consult a registered dietitian for personalized advice.
      </div>
    </div>
  );
}

// ── Sub-components ───────────────────────────────────────────────────────────

function NutritionRow({ icon, color, bg, label, value }) {
  return (
    <div style={{
      background: bg,
      borderRadius: 10, padding: '9px 12px',
      display: 'flex', gap: 10, alignItems: 'flex-start',
    }}>
      <span style={{ fontSize: 14, lineHeight: 1.3, flexShrink: 0 }}>{icon}</span>
      <div>
        <span style={{
          font: "600 10px 'JetBrains Mono', monospace",
          textTransform: 'uppercase', letterSpacing: 1.1,
          color, display: 'block', marginBottom: 2,
        }}>{label}</span>
        <span style={{ font: "400 12px 'Outfit', sans-serif", color: '#333', lineHeight: 1.5 }}>
          {value}
        </span>
      </div>
    </div>
  );
}

function GroceryCategory({ category, items, checked, onToggle, accent }) {
  const categoryColors = {
    Protein: { color: '#6B8F71', bg: '#F0F5F1', icon: '🥩' },
    Produce: { color: '#4E8B36', bg: '#EFF7EB', icon: '🥦' },
    Grains: { color: '#C9963A', bg: '#FBF5E8', icon: '🌾' },
    Dairy: { color: '#5B8FA8', bg: '#EBF3F8', icon: '🥛' },
    Pantry: { color: '#8B6B94', bg: '#F5F0F7', icon: '🫙' },
  };
  const cc = categoryColors[category] || { color: '#777', bg: '#F5F5F5', icon: '📦' };
  const checkedCount = items.filter(i => checked[i.id]).length;

  return (
    <div style={{
      background: 'rgba(255,255,255,0.5)',
      border: '1px solid rgba(0,0,0,0.05)',
      borderRadius: 16, overflow: 'hidden',
    }}>
      {/* Category header */}
      <div style={{
        background: cc.bg,
        padding: '10px 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 16 }}>{cc.icon}</span>
          <span style={{ font: "600 13px 'Outfit', sans-serif", color: cc.color }}>{category}</span>
        </div>
        {checkedCount > 0 && (
          <span style={{
            font: "500 11px 'JetBrains Mono', monospace",
            color: cc.color, opacity: 0.7,
          }}>
            {checkedCount}/{items.length}
          </span>
        )}
      </div>

      {/* Items */}
      <div style={{ padding: '6px 0' }}>
        {items.map(item => {
          const isDone = !!checked[item.id];
          return (
            <button
              key={item.id}
              className="grocery-item"
              onClick={() => onToggle(item.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                width: '100%', padding: '8px 16px',
                background: 'transparent', border: 'none',
                cursor: 'pointer', transition: 'background 0.12s',
                textAlign: 'left',
              }}
            >
              {/* Checkbox */}
              <div style={{
                width: 18, height: 18, borderRadius: 5, flexShrink: 0,
                border: isDone ? `2px solid ${cc.color}` : '1.5px solid #CCC',
                background: isDone ? cc.color : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.15s',
              }}>
                {isDone && (
                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
              <span style={{
                font: "400 13px 'Outfit', sans-serif",
                color: isDone ? '#BBB' : '#333',
                textDecoration: isDone ? 'line-through' : 'none',
                transition: 'all 0.15s',
              }}>
                {item.item}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
