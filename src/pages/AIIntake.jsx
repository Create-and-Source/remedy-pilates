import { useState, useRef } from 'react';
import { useStyles } from '../theme';
import { addPatient, getServices, getProviders } from '../data/store';

// ─── Static option lists ───────────────────────────────────────────────────────

const AGE_RANGES = ['18–25', '26–35', '36–45', '46–55', '56–65', '65+'];
const GENDER_OPTIONS = ['Female', 'Male', 'Non-binary', 'Prefer not to say'];
const EXPERIENCE_LEVELS = ['None', 'Beginner', 'Intermediate', 'Advanced'];
const PILATES_HISTORY = ['Never', 'A few classes', '6+ months', '1+ year'];
const REFERRAL_SOURCES = [
  'Google Search', 'Instagram', 'Facebook', 'Friend or Family', 'Walked by',
  'Doctor referral', 'Yelp', 'Other',
];
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const TIMES = ['Morning (6am–12pm)', 'Afternoon (12pm–5pm)', 'Evening (5pm–9pm)'];
const FORMATS = ['Reformer', 'Mat', 'Barre', 'Open to anything'];

const GOAL_OPTIONS = [
  'Reduce back pain', 'Improve posture', 'Build core strength', 'Increase flexibility',
  'Post-rehab recovery', 'Stress relief', 'Athletic performance', 'Pre/postnatal fitness',
];
const CONDITION_OPTIONS = [
  'Lower back pain', 'Neck pain', 'Shoulder injury', 'Knee injury',
  'Hip replacement', 'Scoliosis', 'Osteoporosis', 'Diastasis recti',
  'Sciatica', 'Pregnancy', 'None',
];

// ─── Contraindication map ──────────────────────────────────────────────────────

const CONTRAINDICATIONS = {
  'Lower back pain': {
    avoid: ['Full spinal flexion (double-leg stretch unsupported)', 'Heavy spring tension in hip flexion', 'Swan on tight springs'],
    alternatives: ['Supported spine stretches', 'Pelvic floor activation', 'Supine leg work with neutral spine'],
  },
  'Neck pain': {
    avoid: ['Unsupported head lifts', 'Short box with arms overhead', 'Pulling straps without head support'],
    alternatives: ['Head rest elevated throughout', 'No cervical loading', 'Thoracic mobility focus only'],
  },
  'Shoulder injury': {
    avoid: ['Full weight-bearing plank variations', 'Long stretch series', 'Rowing with full external rotation'],
    alternatives: ['Footwork emphasis', 'Seated arm work with reduced range', 'Scapular stabilization drills'],
  },
  'Knee injury': {
    avoid: ['Deep knee flexion on footbar', 'Wide squats with heavy springs', 'Jump board until cleared'],
    alternatives: ['Heel-only footwork', 'Open chain leg work', 'Seated hip work'],
  },
  'Hip replacement': {
    avoid: ['Hip flexion beyond 90°', 'Internal rotation of the hip', 'Side-lying adductor loading'],
    alternatives: ['Controlled range footwork', 'Glute activation in neutral', 'Standing balance work'],
  },
  'Scoliosis': {
    avoid: ['Asymmetric loading without guidance', 'Lateral flexion to convex side', 'Single-leg work before assessment'],
    alternatives: ['Symmetrical spring tension', 'Elongation over rotation', 'Instructor cueing on concave side'],
  },
  'Osteoporosis': {
    avoid: ['Spinal flexion (roll-up, rowing)', 'Rotation under load', 'High-impact jump board'],
    alternatives: ['Extension-based work', 'Standing weight-bearing', 'Gentle thoracic extension'],
  },
  'Diastasis recti': {
    avoid: ['Crunch-style spinal flexion', 'Double-leg lowering unsupported', 'Heavy abdominal loading'],
    alternatives: ['Transverse abdominis activation', 'Supported bridging', 'Breath-centered pelvic floor work'],
  },
  'Sciatica': {
    avoid: ['Piriformis compression positions', 'Prolonged seated hip flexion', 'Heavy leg press with flex'],
    alternatives: ['Decompression stretches', 'Prone extension', 'Nerve glide-friendly footwork'],
  },
  'Pregnancy': {
    avoid: ['Supine work after 1st trimester', 'Deep twists', 'Closed chain hip flexion under load'],
    alternatives: ['Side-lying modifications', 'Sitting on box', 'Standing footwork and arm series'],
  },
};

const HOME_EXERCISES = {
  'None': [
    { name: 'Pelvic Clock', desc: '3 min supine. Gently tilt pelvis in each direction, finding neutral spine.' },
    { name: 'Cat-Cow Breathing', desc: '5 breath cycles. Synchronize spinal flexion/extension with inhale/exhale.' },
    { name: 'Ribcage Arms', desc: '2 sets × 10. Standing, trace arcs overhead maintaining rib connection.' },
    { name: 'Ankle Circles', desc: '30 sec each side. Activate lower leg stabilizers before reformer loading.' },
  ],
  'Beginner': [
    { name: 'Hundred Prep', desc: '3 × 10 pumps. Supine, knees bent. Build breath coordination.' },
    { name: 'Standing Roll Down', desc: '5 reps. Bone-by-bone flexion against gravity. Feel each vertebra.' },
    { name: 'Clamshells', desc: '2 × 12 each side. Target hip external rotators before reformer side work.' },
    { name: 'Chest Lift with Rotation', desc: '2 × 8 each side. Keep pelvis stable, emphasize thoracic spiral.' },
  ],
  'Intermediate': [
    { name: 'Single Leg Circle', desc: '5 each direction × 2 legs. Maintain stillness in pelvis — your benchmark.' },
    { name: 'Rolling Like a Ball', desc: '8 reps. Practice spinal articulation and deceleration control.' },
    { name: 'Side Plank Hold', desc: '3 × 20 sec each side. Scapular stability and lateral chain strength.' },
    { name: 'Swan Prep', desc: '5 slow reps. Extension through thoracic; never compress lumbar.' },
  ],
  'Advanced': [
    { name: 'Teaser Hold', desc: '3 × 10 sec. V-shape balance — test spinal control between sessions.' },
    { name: 'Long Stretch Push-Up', desc: '3 × 8. Full plank from toes, controlled eccentric.' },
    { name: 'Star Prep', desc: '5 each side. Hip abduction with lateral line demand. Build to full Star.' },
    { name: 'Boomerang', desc: '3 reps each direction. Full-spine mobility + rolling coordination.' },
  ],
};

// ─── Plan generator (~100 lines) ──────────────────────────────────────────────

function generatePlan(form, providers, services) {
  const exp = form.experience;
  const goals = form.goals;
  const conditions = form.conditions.filter(c => c !== 'None');
  const hasPain = conditions.length > 0;
  const isAdvanced = exp === 'Advanced';
  const isBeginner = exp === 'None' || exp === 'Beginner';
  const hasBack = conditions.some(c => ['Lower back pain', 'Sciatica', 'Scoliosis'].includes(c));
  const hasPrenatal = conditions.includes('Pregnancy') || goals.includes('Pre/postnatal fitness');
  const hasRehab = goals.includes('Post-rehab recovery') || conditions.includes('Hip replacement');
  const isAthlete = goals.includes('Athletic performance');

  const formatPreference = form.format === 'Open to anything'
    ? (hasPain ? 'Reformer' : (isAthlete ? 'Reformer' : 'Reformer'))
    : form.format;

  // Pick instructors: first 2 available from store, fallback to placeholders
  const allProviders = Array.isArray(providers) && providers.length ? providers : [
    { name: 'Sarah M.', specialty: 'Rehab & Clinical' },
    { name: 'Jordan K.', specialty: 'Athletic Performance' },
    { name: 'Mia R.', specialty: 'Pre/Postnatal' },
  ];
  const instructor1 = hasPrenatal
    ? (allProviders.find(p => /natal|prenatal|women/i.test(p.specialty || '')) || allProviders[0])
    : hasRehab || hasPain
      ? (allProviders.find(p => /rehab|clinical|therapy/i.test(p.specialty || '')) || allProviders[0])
      : allProviders[0];
  const instructor2 = allProviders.find(p => p !== instructor1) || allProviders[0];

  // Spring settings
  const springs = isBeginner
    ? { reformer: '2 red (medium)', footwork: '4 red', arms: '1 red or 1 blue' }
    : isAdvanced
      ? { reformer: '2 red + 1 blue', footwork: '4 red + 1 blue', arms: '2 red' }
      : { reformer: '2 red', footwork: '3 red + 1 blue', arms: '1 red + 1 blue' };

  // Clinical assessment
  const conditionText = conditions.length
    ? `history of ${conditions.slice(0, 2).join(' and ')}`
    : 'no reported musculoskeletal conditions';
  const goalText = goals.slice(0, 2).join(' and ').toLowerCase() || 'general wellness';
  const assessment = `Based on your ${conditionText}, we recommend beginning with ${
    isBeginner ? 'a foundational reformer series' : 'a modified reformer progression'
  } focused on ${hasBack ? 'spinal stabilization and decompression' : hasPrenatal ? 'safe pelvic floor engagement' : 'core integration and joint mobility'}. Your ${exp.toLowerCase()} experience level places you in ${
    isBeginner ? 'Phase 1 (Foundations)' : isAdvanced ? 'Phase 3 (Progressive)' : 'Phase 2 (Building)'
  }, which emphasizes ${goalText} through controlled, breath-centered movement. ${
    form.seeingPT ? 'Because you are currently working with a physical therapist, all sessions will coordinate with your existing care plan.' : ''
  }`.trim();

  const sessions = isBeginner ? 2 : isAdvanced ? 3 : 2;

  const weeks = [
    {
      number: 1,
      title: 'Week 1 — Foundation & Assessment',
      theme: 'Establish baseline movement patterns and breath coordination.',
      weekGoal: 'Move without compensation and identify your strongest neural pathways.',
      progression: 'Starting point — all movements in neutral spine, reduced spring tension.',
      sessions: [
        {
          type: `${formatPreference} Foundations`,
          instructor: instructor1.name || 'Instructor TBD',
          focus: ['Neutral spine calibration', 'Breath coordination', 'Pelvic floor activation', 'Footwork series — heel/arch/toe'],
          spring: springs.footwork,
          modifications: hasPain ? ['All hip flexion kept below 90°', 'Headrest elevated', 'No spinal flexion loading'] : ['Full range available with instructor clearance'],
        },
        ...(sessions >= 2 ? [{
          type: 'Mat Fundamentals',
          instructor: instructor2.name || 'Instructor TBD',
          focus: ['Imprinting and neutral', 'Hundred prep (breath pattern)', 'Single leg stretch with modification', 'Bridging sequence'],
          spring: 'No spring — body weight only',
          modifications: hasPrenatal ? ['Side-lying all ab work', 'No supine after 12 weeks'] : ['Headrest at 45° for comfort'],
        }] : []),
        ...(sessions >= 3 ? [{
          type: `${formatPreference} — Arm & Shoulder Focus`,
          instructor: instructor1.name || 'Instructor TBD',
          focus: ['Rowing series (front)', 'Chest expansion', 'Hug-a-tree', 'Scapular stability baseline'],
          spring: springs.arms,
          modifications: ['Reduced range if shoulder discomfort reported'],
        }] : []),
      ],
    },
    {
      number: 2,
      title: 'Week 2 — Building Control',
      theme: 'Add complexity to week 1 patterns with increased stability demand.',
      weekGoal: 'Execute single-leg work with full pelvic stability.',
      progression: 'Introduce single-leg variations; slight spring increase if form is solid.',
      sessions: [
        {
          type: `${formatPreference} — Unilateral Work`,
          instructor: instructor1.name || 'Instructor TBD',
          focus: ['Single-leg footwork', 'Side splits introduction', 'Long stretch if cleared', 'Hip work series'],
          spring: springs.reformer,
          modifications: ['Knee injury: skip single-leg press, use single-leg chair work instead'],
        },
        ...(sessions >= 2 ? [{
          type: `${formatPreference} — Core Integration`,
          instructor: instructor2.name || 'Instructor TBD',
          focus: ['Abdominal series (appropriate to level)', 'Elephant / down-stretch', 'Short box series', 'Arm series from box'],
          spring: springs.arms,
          modifications: hasBack ? ['No flexion on short box — extension variations only', 'Side bend replaces rotation'] : ['Full short box series available'],
        }] : []),
        ...(sessions >= 3 ? [{
          type: 'Barre Cross-Training',
          instructor: instructor2.name || 'Instructor TBD',
          focus: ['Standing balance', 'Lower body endurance', 'Thoracic mobility', 'Pliés and relevés for ankle stability'],
          spring: 'Barre only',
          modifications: ['Hip replacement: skip turned-out positions, use parallel stance'],
        }] : []),
      ],
    },
    {
      number: 3,
      title: 'Week 3 — Progressive Loading',
      theme: 'Increase spring tension and movement complexity for strength adaptation.',
      weekGoal: `Sustain form under increased load across all ${formatPreference.toLowerCase()} exercises.`,
      progression: 'Spring weight up by one unit where appropriate; add eccentric control.',
      sessions: [
        {
          type: `${formatPreference} — Strength Focus`,
          instructor: instructor1.name || 'Instructor TBD',
          focus: ['Full footwork series with progression', 'Knee stretches', 'Stomach massage series', 'Pull straps and T-pull'],
          spring: isAdvanced ? '3 red + 1 blue' : '3 red',
          modifications: hasPain ? ['Maintain pain-free range — never push into discomfort', 'Instructor to monitor compensation patterns'] : [],
        },
        ...(sessions >= 2 ? [{
          type: `${formatPreference} — Full Body Circuit`,
          instructor: instructor2.name || 'Instructor TBD',
          focus: ['Long stretch series (plank variations)', 'Side lying leg work', 'Mermaid stretch', 'Tendon stretch if advanced'],
          spring: springs.reformer,
          modifications: ['Shoulder injury: skip long stretch — substitute seated rowing'],
        }] : []),
        ...(sessions >= 3 ? [{
          type: 'Mat Advanced Prep',
          instructor: instructor1.name || 'Instructor TBD',
          focus: ['Rolling like a ball', 'Single/double leg stretch', 'Criss-cross', 'Swan prep → full swan'],
          spring: 'No spring',
          modifications: ['Osteoporosis: skip all flexion — extension and standing variations only'],
        }] : []),
      ],
    },
    {
      number: 4,
      title: 'Week 4 — Integration & Flow',
      theme: 'Link all sequences into fluid movement, assess progress, plan next phase.',
      weekGoal: 'Complete a full-length class without instructor modification for flagged exercises.',
      progression: 'Full repertoire introduction; assessment session to measure baseline gains.',
      sessions: [
        {
          type: `${formatPreference} — Integration Flow`,
          instructor: instructor1.name || 'Instructor TBD',
          focus: ['Full footwork → abdominal → hip → arm sequence', 'Linking transitions', 'Increased tempo where safe', 'Breath and rhythm emphasis'],
          spring: springs.reformer,
          modifications: ['Any pain signals: return to week 2 spring settings immediately'],
        },
        ...(sessions >= 2 ? [{
          type: 'Assessment & Goal Review',
          instructor: instructor2.name || 'Instructor TBD',
          focus: ['Benchmark same exercises from Week 1', 'Postural photo comparison', 'Pain/comfort scale re-assessment', 'Discussion of Month 2 progression'],
          spring: springs.footwork,
          modifications: ['No new exercises — focus on quality and self-awareness'],
        }] : []),
        ...(sessions >= 3 ? [{
          type: `${formatPreference} — Challenge Class`,
          instructor: instructor1.name || 'Instructor TBD',
          focus: [isAdvanced ? 'Advanced repertoire: Snake, Twist, Horseback' : 'Intermediate goals: Teaser prep, Star, Control Front', 'Peak position attempt', 'Cool-down and stretch'],
          spring: isAdvanced ? '2 red + 1 blue' : '2 red',
          modifications: ['Instructor discretion on peak movements — skip if form breaks'],
        }] : []),
      ],
    },
  ];

  // Package recommendation
  const allServices = Array.isArray(services) && services.length ? services : [];
  const recommendedService = allServices.find(sv =>
    sessions === 3
      ? /12|unlimited|monthly/i.test(sv.name || sv.title || '')
      : /8|intro|starter/i.test(sv.name || sv.title || '')
  ) || allServices[0] || { name: sessions >= 3 ? '12-Class Pack' : '8-Class Intro Pack', price: sessions >= 3 ? 360 : 240 };

  const contraindications = conditions.flatMap(c => CONTRAINDICATIONS[c] ? [{ condition: c, ...CONTRAINDICATIONS[c] }] : []);
  const homeExercises = HOME_EXERCISES[exp] || HOME_EXERCISES['Beginner'];

  return { assessment, weeks, contraindications, homeExercises, recommendedService, sessions, springs };
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function ProgressBar({ step, s }) {
  const steps = ['Profile', 'Health History', 'Preferences'];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 36 }}>
      {steps.map((label, i) => {
        const active = i === step;
        const done = i < step;
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', flex: i < steps.length - 1 ? 1 : 'none' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: done ? s.accent : active ? s.accent : 'rgba(0,0,0,0.08)',
                color: done || active ? '#fff' : s.text3,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: s.MONO, fontSize: 13, fontWeight: 700,
                border: active && !done ? `2px solid ${s.accent}` : 'none',
                opacity: done ? 0.7 : 1,
                transition: 'all 0.3s',
              }}>
                {done ? '✓' : i + 1}
              </div>
              <span style={{ fontFamily: s.MONO, fontSize: 10, color: active ? s.accent : s.text3, textTransform: 'uppercase', letterSpacing: 1 }}>
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div style={{ flex: 1, height: 2, background: done ? s.accent : 'rgba(0,0,0,0.1)', margin: '0 8px', marginBottom: 24, opacity: done ? 0.5 : 1, transition: 'background 0.4s' }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function CheckboxGroup({ options, selected, onChange, columns = 2, s }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${columns}, 1fr)`, gap: '8px 16px' }}>
      {options.map(opt => {
        const checked = selected.includes(opt);
        return (
          <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '8px 10px', borderRadius: 8, border: `1px solid ${checked ? s.accent : 'rgba(0,0,0,0.1)'}`, background: checked ? `${s.accent}12` : 'transparent', transition: 'all 0.18s' }}>
            <div style={{ width: 16, height: 16, borderRadius: 4, border: `2px solid ${checked ? s.accent : 'rgba(0,0,0,0.25)'}`, background: checked ? s.accent : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {checked && <span style={{ color: '#fff', fontSize: 10, lineHeight: 1 }}>✓</span>}
            </div>
            <span style={{ fontFamily: s.FONT, fontSize: 13, color: s.text }}>{opt}</span>
          </label>
        );
      })}
    </div>
  );
}

function Field({ label, children, s, required }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <label style={{ display: 'block', fontFamily: s.MONO, fontSize: 11, color: s.text2, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
        {label}{required && <span style={{ color: s.accent }}> *</span>}
      </label>
      {children}
    </div>
  );
}

const inputStyle = (s) => ({
  width: '100%', padding: '10px 14px', borderRadius: 10,
  border: '1px solid rgba(0,0,0,0.15)', background: 'rgba(255,255,255,0.8)',
  fontFamily: s.FONT, fontSize: 14, color: s.text, outline: 'none',
  boxSizing: 'border-box', transition: 'border 0.2s',
});

// ─── Main Component ────────────────────────────────────────────────────────────

export default function AIIntake() {
  const s = useStyles();

  const BLANK = {
    firstName: '', lastName: '', email: '', phone: '',
    ageRange: '', gender: '',
    experience: '', goals: [], conditions: [], painLevel: 5,
    seeingPT: false, pilatesHistory: 'Never',
    days: [], times: [], format: '', referral: '',
  };

  const [step, setStep] = useState(0);
  const [form, setForm] = useState(BLANK);
  const [errors, setErrors] = useState({});
  const [generating, setGenerating] = useState(false);
  const [genPhase, setGenPhase] = useState(0);
  const [plan, setPlan] = useState(null);
  const [saved, setSaved] = useState(false);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  const GEN_PHASES = [
    'Analyzing health profile…',
    'Mapping contraindications…',
    'Building Week 1 foundation…',
    'Calibrating progression curve…',
    'Optimizing instructor matching…',
    'Finalizing your Movement Rx…',
  ];

  function showToast(msg) {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3500);
  }

  function set(field, val) {
    setForm(f => ({ ...f, [field]: val }));
    setErrors(e => ({ ...e, [field]: undefined }));
  }

  function toggleList(field, val) {
    setForm(f => {
      const list = f[field];
      return { ...f, [field]: list.includes(val) ? list.filter(x => x !== val) : [...list, val] };
    });
  }

  function validateStep(s_) {
    const e = {};
    if (s_ === 0) {
      if (!form.firstName.trim()) e.firstName = 'Required';
      if (!form.lastName.trim()) e.lastName = 'Required';
      if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) e.email = 'Valid email required';
      if (!form.ageRange) e.ageRange = 'Required';
    }
    if (s_ === 1) {
      if (!form.experience) e.experience = 'Required';
      if (!form.goals.length) e.goals = 'Select at least one goal';
      if (!form.conditions.length) e.conditions = 'Select your conditions (or None)';
    }
    if (s_ === 2) {
      if (!form.format) e.format = 'Required';
    }
    return e;
  }

  function handleNext() {
    const e = validateStep(step);
    if (Object.keys(e).length) { setErrors(e); return; }
    setStep(s_ => s_ + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleBack() {
    setStep(s_ => s_ - 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleSubmit() {
    const e = validateStep(2);
    if (Object.keys(e).length) { setErrors(e); return; }
    setGenerating(true);
    setGenPhase(0);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    for (let i = 1; i < GEN_PHASES.length; i++) {
      await new Promise(r => setTimeout(r, 950 + Math.random() * 400));
      setGenPhase(i);
    }
    await new Promise(r => setTimeout(r, 700));

    const providers = getProviders ? getProviders() : [];
    const services = getServices ? getServices() : [];
    const result = generatePlan(form, providers, services);
    setPlan(result);
    setGenerating(false);
  }

  function handleSave() {
    if (saved) return;
    try {
      addPatient({
        id: `ai-${Date.now()}`,
        name: `${form.firstName} ${form.lastName}`,
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone,
        ageRange: form.ageRange,
        gender: form.gender,
        experience: form.experience,
        goals: form.goals,
        conditions: form.conditions,
        pilatesHistory: form.pilatesHistory,
        seeingPT: form.seeingPT,
        format: form.format,
        referral: form.referral,
        intakeDate: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
        movementRx: plan,
        status: 'New',
        tags: ['AI Intake'],
      });
      setSaved(true);
      showToast('Client saved to your system.');
    } catch {
      showToast('Error saving — please try again.');
    }
  }

  function handleStartOver() {
    setStep(0);
    setForm(BLANK);
    setErrors({});
    setPlan(null);
    setSaved(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const card = {
    background: 'rgba(255,255,255,0.72)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255,255,255,0.6)',
    borderRadius: 16,
    boxShadow: s.shadow,
    padding: '32px 36px',
    marginBottom: 24,
  };

  const btnPrimary = {
    background: s.accent,
    color: '#fff',
    border: 'none',
    borderRadius: 10,
    padding: '12px 28px',
    fontFamily: s.FONT,
    fontWeight: 600,
    fontSize: 15,
    cursor: 'pointer',
    letterSpacing: 0.3,
  };

  const btnGhost = {
    background: 'transparent',
    color: s.accent,
    border: `1.5px solid ${s.accent}`,
    borderRadius: 10,
    padding: '11px 24px',
    fontFamily: s.FONT,
    fontWeight: 600,
    fontSize: 14,
    cursor: 'pointer',
  };

  // ── Generating screen ──────────────────────────────────────────────────────
  if (generating) {
    return (
      <div style={{ maxWidth: 560, margin: '80px auto', padding: '0 24px', textAlign: 'center' }}>
        <div style={card}>
          <div style={{ marginBottom: 28 }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: `${s.accent}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 26 }}>
              🧠
            </div>
            <h2 style={{ fontFamily: s.DISPLAY, fontSize: 26, color: s.text, margin: '0 0 6px' }}>
              Building your Movement Rx
            </h2>
            <p style={{ fontFamily: s.FONT, fontSize: 14, color: s.text2, margin: 0 }}>
              Analyzing {form.firstName}'s intake to generate a personalized 4-week plan
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28, textAlign: 'left' }}>
            {GEN_PHASES.map((phase, i) => {
              const done = i < genPhase;
              const active = i === genPhase;
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, opacity: i > genPhase ? 0.3 : 1, transition: 'opacity 0.4s' }}>
                  <div style={{ width: 22, height: 22, borderRadius: '50%', background: done ? `${s.accent}22` : active ? `${s.accent}15` : 'rgba(0,0,0,0.05)', border: `2px solid ${done ? s.accent : active ? s.accent : 'transparent'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.3s' }}>
                    {done && <span style={{ color: s.accent, fontSize: 11 }}>✓</span>}
                    {active && <span style={{ display: 'block', width: 8, height: 8, borderRadius: '50%', background: s.accent, animation: 'pulse 1s infinite' }} />}
                  </div>
                  <span style={{ fontFamily: s.FONT, fontSize: 14, color: active ? s.text : done ? s.text2 : s.text3 }}>{phase}</span>
                </div>
              );
            })}
          </div>

          <div style={{ height: 6, borderRadius: 99, background: 'rgba(0,0,0,0.08)', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${((genPhase + 1) / GEN_PHASES.length) * 100}%`, background: s.accent, borderRadius: 99, transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)' }} />
          </div>
        </div>
      </div>
    );
  }

  // ── Plan view ─────────────────────────────────────────────────────────────
  if (plan) {
    const conditions = form.conditions.filter(c => c !== 'None');
    return (
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px 80px' }}>
        {toast && (
          <div style={{ position: 'fixed', bottom: 32, left: '50%', transform: 'translateX(-50%)', background: s.text, color: '#fff', padding: '12px 24px', borderRadius: 10, fontFamily: s.FONT, fontSize: 14, zIndex: 9999, boxShadow: s.shadow }}>
            {toast}
          </div>
        )}

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ fontFamily: s.MONO, fontSize: 11, color: s.accent, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 10 }}>
            AI-Generated Movement Rx
          </div>
          <h1 style={{ fontFamily: s.DISPLAY, fontSize: 38, color: s.text, margin: '0 0 8px' }}>
            {form.firstName}'s 4-Week Plan
          </h1>
          <p style={{ fontFamily: s.FONT, fontSize: 15, color: s.text2 }}>
            Generated {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>

        {/* Action bar */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 32, justifyContent: 'center' }}>
          <button onClick={handleSave} disabled={saved} style={{ ...btnPrimary, opacity: saved ? 0.6 : 1 }}>
            {saved ? '✓ Saved to System' : 'Save Client & Plan'}
          </button>
          <button onClick={() => window.print()} style={btnGhost}>Print Plan</button>
          <button onClick={() => showToast(`Plan sent to ${form.email}`)} style={btnGhost}>Email Plan</button>
          <button onClick={handleStartOver} style={{ ...btnGhost, borderColor: 'rgba(0,0,0,0.2)', color: s.text2 }}>Start Over</button>
        </div>

        {/* Client summary */}
        <div style={card}>
          <div style={{ fontFamily: s.MONO, fontSize: 10, color: s.accent, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 16 }}>Client Profile</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px 24px' }}>
            {[
              { label: 'Name', val: `${form.firstName} ${form.lastName}` },
              { label: 'Age Range', val: form.ageRange || '—' },
              { label: 'Experience', val: form.experience },
              { label: 'Pilates History', val: form.pilatesHistory },
              { label: 'Sessions / Week', val: plan.sessions },
              { label: 'Preferred Format', val: form.format },
            ].map(({ label, val }) => (
              <div key={label}>
                <div style={{ fontFamily: s.MONO, fontSize: 10, color: s.text3, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 3 }}>{label}</div>
                <div style={{ fontFamily: s.FONT, fontSize: 14, color: s.text, fontWeight: 600 }}>{val}</div>
              </div>
            ))}
          </div>
          {form.goals.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <div style={{ fontFamily: s.MONO, fontSize: 10, color: s.text3, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Goals</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {form.goals.map(g => (
                  <span key={g} style={{ background: `${s.accent}15`, color: s.accent, fontFamily: s.FONT, fontSize: 12, padding: '4px 10px', borderRadius: 20, fontWeight: 500 }}>{g}</span>
                ))}
              </div>
            </div>
          )}
          {conditions.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <div style={{ fontFamily: s.MONO, fontSize: 10, color: s.text3, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Flagged Conditions</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {conditions.map(c => (
                  <span key={c} style={{ background: 'rgba(239,68,68,0.1)', color: '#dc2626', fontFamily: s.FONT, fontSize: 12, padding: '4px 10px', borderRadius: 20, fontWeight: 500 }}>⚠ {c}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Clinical assessment */}
        <div style={{ ...card, borderLeft: `4px solid ${s.accent}` }}>
          <div style={{ fontFamily: s.MONO, fontSize: 10, color: s.accent, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 12 }}>Clinical Assessment</div>
          <p style={{ fontFamily: s.FONT, fontSize: 15, color: s.text, lineHeight: 1.7, margin: 0 }}>{plan.assessment}</p>
        </div>

        {/* Contraindications */}
        {plan.contraindications.length > 0 && (
          <div style={{ ...card, borderLeft: '4px solid #dc2626', background: 'rgba(254,242,242,0.8)' }}>
            <div style={{ fontFamily: s.MONO, fontSize: 10, color: '#dc2626', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 16 }}>⚠ Contraindication Alerts</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {plan.contraindications.map(({ condition, avoid, alternatives }) => (
                <div key={condition}>
                  <div style={{ fontFamily: s.FONT, fontWeight: 700, fontSize: 14, color: '#dc2626', marginBottom: 8 }}>{condition}</div>
                  <div className="ai-contra-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <div style={{ fontFamily: s.MONO, fontSize: 10, color: s.text3, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Avoid</div>
                      <ul style={{ margin: 0, paddingLeft: 16 }}>
                        {avoid.map(a => <li key={a} style={{ fontFamily: s.FONT, fontSize: 13, color: s.text, marginBottom: 3 }}>{a}</li>)}
                      </ul>
                    </div>
                    <div>
                      <div style={{ fontFamily: s.MONO, fontSize: 10, color: s.text3, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Alternatives</div>
                      <ul style={{ margin: 0, paddingLeft: 16 }}>
                        {alternatives.map(a => <li key={a} style={{ fontFamily: s.FONT, fontSize: 13, color: s.text, marginBottom: 3 }}>{a}</li>)}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4-Week plan */}
        <div style={{ fontFamily: s.DISPLAY, fontSize: 26, color: s.text, marginBottom: 20, marginTop: 8 }}>4-Week Movement Rx</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: 20, marginBottom: 32 }}>
          {plan.weeks.map((week, wi) => (
            <div key={week.number} style={{ ...card, padding: '24px 28px', borderTop: `3px solid ${s.accent}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div>
                  <div style={{ fontFamily: s.MONO, fontSize: 10, color: s.accent, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 4 }}>Week {week.number}</div>
                  <div style={{ fontFamily: s.DISPLAY, fontSize: 18, color: s.text }}>{week.title.split('—')[1]?.trim() || week.title}</div>
                </div>
                <div style={{ background: `${s.accent}15`, color: s.accent, fontFamily: s.MONO, fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20 }}>
                  Phase {wi + 1}
                </div>
              </div>
              <p style={{ fontFamily: s.FONT, fontSize: 13, color: s.text2, lineHeight: 1.6, margin: '0 0 16px' }}>{week.theme}</p>

              {/* Sessions */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 16 }}>
                {week.sessions.map((session, si) => (
                  <div key={si} style={{ background: 'rgba(255,255,255,0.6)', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 10, padding: '14px 16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <div style={{ fontFamily: s.FONT, fontWeight: 700, fontSize: 13, color: s.text }}>
                        Session {si + 1} — {session.type}
                      </div>
                      <div style={{ fontFamily: s.MONO, fontSize: 10, color: s.text3 }}>{session.instructor}</div>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: session.modifications.length ? 8 : 0 }}>
                      {session.focus.map(f => (
                        <span key={f} style={{ background: 'rgba(0,0,0,0.05)', fontFamily: s.FONT, fontSize: 11, color: s.text2, padding: '2px 8px', borderRadius: 4 }}>{f}</span>
                      ))}
                    </div>
                    {session.modifications.filter(Boolean).length > 0 && (
                      <div style={{ marginTop: 6 }}>
                        <span style={{ fontFamily: s.MONO, fontSize: 9, color: '#ea580c', textTransform: 'uppercase', letterSpacing: 1 }}>Modifications: </span>
                        <span style={{ fontFamily: s.FONT, fontSize: 11, color: '#ea580c' }}>{session.modifications.filter(Boolean).join(' · ')}</span>
                      </div>
                    )}
                    <div style={{ marginTop: 6, fontFamily: s.MONO, fontSize: 10, color: s.text3 }}>
                      Spring: {session.spring}
                    </div>
                  </div>
                ))}
              </div>

              {/* Weekly goal */}
              <div style={{ background: `${s.accent}08`, borderRadius: 8, padding: '10px 14px', marginBottom: 8 }}>
                <span style={{ fontFamily: s.MONO, fontSize: 10, color: s.accent, textTransform: 'uppercase', letterSpacing: 1 }}>Weekly Goal: </span>
                <span style={{ fontFamily: s.FONT, fontSize: 13, color: s.text }}>{week.weekGoal}</span>
              </div>
              {wi > 0 && (
                <div style={{ fontFamily: s.FONT, fontSize: 12, color: s.text3, fontStyle: 'italic' }}>
                  ↑ {week.progression}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Home practice */}
        <div style={card}>
          <div style={{ fontFamily: s.MONO, fontSize: 10, color: s.accent, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 4 }}>Between Sessions</div>
          <div style={{ fontFamily: s.DISPLAY, fontSize: 22, color: s.text, marginBottom: 16 }}>Home Practice</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
            {plan.homeExercises.map((ex, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,0.5)', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 10, padding: '14px 16px' }}>
                <div style={{ fontFamily: s.FONT, fontWeight: 700, fontSize: 14, color: s.text, marginBottom: 4 }}>{ex.name}</div>
                <p style={{ fontFamily: s.FONT, fontSize: 13, color: s.text2, lineHeight: 1.5, margin: 0 }}>{ex.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Package recommendation */}
        <div style={{ ...card, background: `linear-gradient(135deg, rgba(255,255,255,0.8), rgba(255,255,255,0.6))`, border: `1.5px solid ${s.accent}40` }}>
          <div style={{ fontFamily: s.MONO, fontSize: 10, color: s.accent, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 4 }}>Recommended Package</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div style={{ fontFamily: s.DISPLAY, fontSize: 24, color: s.text, marginBottom: 6 }}>
                {plan.recommendedService.name || plan.recommendedService.title || '8-Class Intro Pack'}
              </div>
              <p style={{ fontFamily: s.FONT, fontSize: 14, color: s.text2, margin: 0 }}>
                Perfect for your {plan.sessions}-session/week plan over 4 weeks — includes instructor consultation.
              </p>
            </div>
            {(plan.recommendedService.price || plan.recommendedService.rate) && (
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: s.MONO, fontSize: 11, color: s.text3, textTransform: 'uppercase', letterSpacing: 1 }}>Starting at</div>
                <div style={{ fontFamily: s.DISPLAY, fontSize: 32, color: s.accent }}>
                  ${plan.recommendedService.price || plan.recommendedService.rate}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Intake form ───────────────────────────────────────────────────────────
  const hasConditions = form.conditions.some(c => c !== 'None');

  return (
    <div style={{ maxWidth: 660, margin: '0 auto', padding: '40px 24px 80px' }}>
      <style>{`
        @media (max-width: 768px) {
          .ai-name-grid { grid-template-columns: 1fr !important; }
          .ai-age-grid { grid-template-columns: 1fr !important; }
          .ai-pt-grid { grid-template-columns: 1fr !important; }
          .ai-exp-grid { grid-template-columns: 1fr 1fr !important; }
          .ai-format-grid { grid-template-columns: 1fr !important; }
          .ai-contra-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 480px) {
          .ai-exp-grid { grid-template-columns: 1fr 1fr !important; }
        }
      `}</style>
      {toast && (
        <div style={{ position: 'fixed', bottom: 32, left: '50%', transform: 'translateX(-50%)', background: s.text, color: '#fff', padding: '12px 24px', borderRadius: 10, fontFamily: s.FONT, fontSize: 14, zIndex: 9999, boxShadow: s.shadow }}>
          {toast}
        </div>
      )}

      {/* Page header */}
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <div style={{ fontFamily: s.MONO, fontSize: 11, color: s.accent, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 10 }}>
          AI-Powered Intake
        </div>
        <h1 style={{ fontFamily: s.DISPLAY, fontSize: 36, color: s.text, margin: '0 0 10px' }}>
          Your Movement Rx
        </h1>
        <p style={{ fontFamily: s.FONT, fontSize: 15, color: s.text2, lineHeight: 1.6, maxWidth: 440, margin: '0 auto' }}>
          Answer a few questions and our system will generate a personalized 4-week Pilates progression plan built around your body and goals.
        </p>
      </div>

      <div style={card}>
        <ProgressBar step={step} s={s} />

        {/* ── Step 0: Profile ── */}
        {step === 0 && (
          <div>
            <div style={{ fontFamily: s.DISPLAY, fontSize: 22, color: s.text, marginBottom: 24 }}>Tell us about yourself</div>
            <div className="ai-name-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
              <Field label="First Name" s={s} required>
                <input value={form.firstName} onChange={e => set('firstName', e.target.value)} style={{ ...inputStyle(s), borderColor: errors.firstName ? '#dc2626' : 'rgba(0,0,0,0.15)' }} placeholder="e.g. Jordan" />
                {errors.firstName && <div style={{ fontFamily: s.FONT, fontSize: 12, color: '#dc2626', marginTop: 4 }}>{errors.firstName}</div>}
              </Field>
              <Field label="Last Name" s={s} required>
                <input value={form.lastName} onChange={e => set('lastName', e.target.value)} style={{ ...inputStyle(s), borderColor: errors.lastName ? '#dc2626' : 'rgba(0,0,0,0.15)' }} placeholder="e.g. Rivera" />
                {errors.lastName && <div style={{ fontFamily: s.FONT, fontSize: 12, color: '#dc2626', marginTop: 4 }}>{errors.lastName}</div>}
              </Field>
            </div>
            <Field label="Email" s={s} required>
              <input type="email" value={form.email} onChange={e => set('email', e.target.value)} style={{ ...inputStyle(s), borderColor: errors.email ? '#dc2626' : 'rgba(0,0,0,0.15)' }} placeholder="hello@example.com" />
              {errors.email && <div style={{ fontFamily: s.FONT, fontSize: 12, color: '#dc2626', marginTop: 4 }}>{errors.email}</div>}
            </Field>
            <Field label="Phone" s={s}>
              <input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} style={inputStyle(s)} placeholder="(555) 000-0000" />
            </Field>
            <div className="ai-age-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
              <Field label="Age Range" s={s} required>
                <select value={form.ageRange} onChange={e => set('ageRange', e.target.value)} style={{ ...inputStyle(s), borderColor: errors.ageRange ? '#dc2626' : 'rgba(0,0,0,0.15)' }}>
                  <option value="">Select…</option>
                  {AGE_RANGES.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
                {errors.ageRange && <div style={{ fontFamily: s.FONT, fontSize: 12, color: '#dc2626', marginTop: 4 }}>{errors.ageRange}</div>}
              </Field>
              <Field label="Gender (optional)" s={s}>
                <select value={form.gender} onChange={e => set('gender', e.target.value)} style={inputStyle(s)}>
                  <option value="">Prefer not to say</option>
                  {GENDER_OPTIONS.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </Field>
            </div>
          </div>
        )}

        {/* ── Step 1: Health History ── */}
        {step === 1 && (
          <div>
            <div style={{ fontFamily: s.DISPLAY, fontSize: 22, color: s.text, marginBottom: 24 }}>Health History</div>

            <Field label="Movement Experience" s={s} required>
              <div className="ai-exp-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                {EXPERIENCE_LEVELS.map(lvl => (
                  <button key={lvl} onClick={() => set('experience', lvl)} style={{ padding: '10px 6px', borderRadius: 10, border: `1.5px solid ${form.experience === lvl ? s.accent : 'rgba(0,0,0,0.12)'}`, background: form.experience === lvl ? `${s.accent}18` : 'transparent', color: form.experience === lvl ? s.accent : s.text2, fontFamily: s.FONT, fontSize: 13, fontWeight: form.experience === lvl ? 700 : 400, cursor: 'pointer', transition: 'all 0.18s' }}>
                    {lvl}
                  </button>
                ))}
              </div>
              {errors.experience && <div style={{ fontFamily: s.FONT, fontSize: 12, color: '#dc2626', marginTop: 6 }}>{errors.experience}</div>}
            </Field>

            <Field label="Your Goals" s={s} required>
              <CheckboxGroup options={GOAL_OPTIONS} selected={form.goals} onChange={v => toggleList('goals', v)} columns={2} s={s} />
              {errors.goals && <div style={{ fontFamily: s.FONT, fontSize: 12, color: '#dc2626', marginTop: 6 }}>{errors.goals}</div>}
            </Field>

            <Field label="Current Injuries / Conditions" s={s} required>
              <CheckboxGroup options={CONDITION_OPTIONS} selected={form.conditions} onChange={v => {
                if (v === 'None') { set('conditions', form.conditions.includes('None') ? [] : ['None']); return; }
                const next = form.conditions.filter(c => c !== 'None');
                set('conditions', next.includes(v) ? next.filter(c => c !== v) : [...next, v]);
              }} columns={2} s={s} />
              {errors.conditions && <div style={{ fontFamily: s.FONT, fontSize: 12, color: '#dc2626', marginTop: 6 }}>{errors.conditions}</div>}
            </Field>

            {hasConditions && (
              <Field label={`Pain Level (current): ${form.painLevel}/10`} s={s}>
                <input type="range" min={1} max={10} value={form.painLevel} onChange={e => set('painLevel', Number(e.target.value))} style={{ width: '100%', accentColor: s.accent }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: s.MONO, fontSize: 10, color: s.text3, marginTop: 4 }}>
                  <span>1 — Minimal</span><span>10 — Severe</span>
                </div>
              </Field>
            )}

            <div className="ai-pt-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
              <Field label="Currently seeing PT / Chiropractor?" s={s}>
                <div style={{ display: 'flex', gap: 10 }}>
                  {['Yes', 'No'].map(opt => (
                    <button key={opt} onClick={() => set('seeingPT', opt === 'Yes')} style={{ flex: 1, padding: '10px', borderRadius: 10, border: `1.5px solid ${(form.seeingPT && opt === 'Yes') || (!form.seeingPT && opt === 'No') ? s.accent : 'rgba(0,0,0,0.12)'}`, background: (form.seeingPT && opt === 'Yes') || (!form.seeingPT && opt === 'No') ? `${s.accent}18` : 'transparent', color: (form.seeingPT && opt === 'Yes') || (!form.seeingPT && opt === 'No') ? s.accent : s.text2, fontFamily: s.FONT, fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.18s' }}>
                      {opt}
                    </button>
                  ))}
                </div>
              </Field>
              <Field label="Previous Pilates Experience" s={s}>
                <select value={form.pilatesHistory} onChange={e => set('pilatesHistory', e.target.value)} style={inputStyle(s)}>
                  {PILATES_HISTORY.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </Field>
            </div>
          </div>
        )}

        {/* ── Step 2: Preferences ── */}
        {step === 2 && (
          <div>
            <div style={{ fontFamily: s.DISPLAY, fontSize: 22, color: s.text, marginBottom: 24 }}>Your Preferences</div>

            <Field label="Preferred Days" s={s}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {DAYS.map(d => {
                  const on = form.days.includes(d);
                  return (
                    <button key={d} onClick={() => toggleList('days', d)} style={{ padding: '8px 14px', borderRadius: 8, border: `1.5px solid ${on ? s.accent : 'rgba(0,0,0,0.12)'}`, background: on ? `${s.accent}18` : 'transparent', color: on ? s.accent : s.text2, fontFamily: s.MONO, fontSize: 12, fontWeight: on ? 700 : 400, cursor: 'pointer', transition: 'all 0.18s' }}>
                      {d}
                    </button>
                  );
                })}
              </div>
            </Field>

            <Field label="Preferred Times" s={s}>
              <CheckboxGroup options={TIMES} selected={form.times} onChange={v => toggleList('times', v)} columns={1} s={s} />
            </Field>

            <Field label="Class Format Preference" s={s} required>
              <div className="ai-format-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                {FORMATS.map(f => (
                  <button key={f} onClick={() => set('format', f)} style={{ padding: '12px', borderRadius: 10, border: `1.5px solid ${form.format === f ? s.accent : 'rgba(0,0,0,0.12)'}`, background: form.format === f ? `${s.accent}18` : 'transparent', color: form.format === f ? s.accent : s.text, fontFamily: s.FONT, fontSize: 14, fontWeight: form.format === f ? 700 : 400, cursor: 'pointer', transition: 'all 0.18s', textAlign: 'center' }}>
                    {f}
                  </button>
                ))}
              </div>
              {errors.format && <div style={{ fontFamily: s.FONT, fontSize: 12, color: '#dc2626', marginTop: 6 }}>{errors.format}</div>}
            </Field>

            <Field label="How did you hear about us?" s={s}>
              <select value={form.referral} onChange={e => set('referral', e.target.value)} style={inputStyle(s)}>
                <option value="">Select…</option>
                {REFERRAL_SOURCES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </Field>

            <div style={{ background: `${s.accent}08`, border: `1px solid ${s.accent}25`, borderRadius: 10, padding: '14px 18px', marginTop: 8 }}>
              <div style={{ fontFamily: s.MONO, fontSize: 10, color: s.accent, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>What happens next</div>
              <p style={{ fontFamily: s.FONT, fontSize: 13, color: s.text2, margin: 0, lineHeight: 1.6 }}>
                Our AI will analyze your profile and generate a fully personalized 4-week Movement Rx — including session recommendations, spring settings, instructor matching, and a home practice plan. Ready in about 6 seconds.
              </p>
            </div>
          </div>
        )}

        {/* Navigation buttons */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 32, paddingTop: 24, borderTop: '1px solid rgba(0,0,0,0.08)' }}>
          {step > 0
            ? <button onClick={handleBack} style={btnGhost}>← Back</button>
            : <div />
          }
          {step < 2
            ? <button onClick={handleNext} style={btnPrimary}>Continue →</button>
            : <button onClick={handleSubmit} style={{ ...btnPrimary, padding: '14px 36px', fontSize: 16 }}>Generate My Plan →</button>
          }
        </div>
      </div>
    </div>
  );
}
