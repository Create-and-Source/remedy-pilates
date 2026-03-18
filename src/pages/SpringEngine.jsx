import { useState, useMemo } from 'react';
import { useStyles } from '../theme';
import { getPatients, getAppointments, getAssessments, getTreatmentPlans } from '../data/store';

// Spring color system
const SPRINGS = {
  red:    { label: 'Red',    weight: 5.5,  hex: '#E53E3E' },
  blue:   { label: 'Blue',   weight: 3.5,  hex: '#3182CE' },
  green:  { label: 'Green',  weight: 2.5,  hex: '#38A169' },
  yellow: { label: 'Yellow', weight: 1.0,  hex: '#D69E2E' },
};

const CLASS_TYPES = ['Reformer', 'Reformer + Cardio', 'Prenatal Reformer'];

const EXERCISES = [
  { key: 'footwork',     label: 'Footwork' },
  { key: 'legCircles',   label: 'Leg Circles' },
  { key: 'shortBox',     label: 'Short Box' },
  { key: 'longStretch',  label: 'Long Stretch' },
  { key: 'elephant',     label: 'Elephant' },
  { key: 'kneeSt',       label: 'Knee Stretches' },
];

// Base spring configs per exercise [red, blue, green, yellow]
const BASE_SPRINGS = {
  footwork:    { r: 3, b: 1, g: 0, y: 0 },
  legCircles:  { r: 2, b: 1, g: 0, y: 0 },
  shortBox:    { r: 1, b: 1, g: 0, y: 0 },
  longStretch: { r: 3, b: 0, g: 0, y: 0 },
  elephant:    { r: 2, b: 1, g: 0, y: 0 },
  kneeSt:      { r: 2, b: 1, g: 0, y: 0 },
};

// Upper body exercises affected by shoulder injuries
const UPPER_BODY_EX = new Set(['shortBox', 'longStretch']);

function totalWeight(cfg) {
  return (cfg.r * 5.5 + cfg.b * 3.5 + cfg.g * 2.5 + cfg.y * 1.0).toFixed(1);
}

function cfgToLabel(cfg) {
  const parts = [];
  if (cfg.r) parts.push(`${cfg.r} Red`);
  if (cfg.b) parts.push(`${cfg.b} Blue`);
  if (cfg.g) parts.push(`${cfg.g} Green`);
  if (cfg.y) parts.push(`${cfg.y} Yellow`);
  return parts.join(' + ') || 'Yellow only';
}

function clampCfg(cfg) {
  // Ensure no negatives
  return {
    r: Math.max(0, cfg.r),
    b: Math.max(0, cfg.b),
    g: Math.max(0, cfg.g),
    y: Math.max(0, cfg.y),
  };
}

function reduceLoad(cfg) {
  // Step down: remove one red → add one blue, or one blue → add one green, etc.
  if (cfg.r > 0) return clampCfg({ ...cfg, r: cfg.r - 1, b: cfg.b + 1 });
  if (cfg.b > 0) return clampCfg({ ...cfg, b: cfg.b - 1, g: cfg.g + 1 });
  if (cfg.g > 0) return clampCfg({ ...cfg, g: cfg.g - 1, y: cfg.y + 1 });
  return { r: 0, b: 0, g: 0, y: Math.max(1, cfg.y) };
}

function increaseLoad(cfg) {
  // Step up: swap lightest spring up
  if (cfg.y > 0) return clampCfg({ ...cfg, y: cfg.y - 1, g: cfg.g + 1 });
  if (cfg.g > 0) return clampCfg({ ...cfg, g: cfg.g - 1, b: cfg.b + 1 });
  if (cfg.b > 0) return clampCfg({ ...cfg, b: cfg.b - 1, r: cfg.r + 1 });
  return { ...cfg, r: cfg.r + 1 };
}

function computeFatigue(client, appointments) {
  const now = Date.now();
  const oneWeek = 7 * 24 * 60 * 60 * 1000;
  const clientAppts = (appointments || []).filter(a => a.patientId === client.id || a.clientId === client.id);
  if (!clientAppts.length) return 20; // no data → assume rested

  const sorted = [...clientAppts].sort((a, b) => new Date(b.date || b.start) - new Date(a.date || a.start));
  const lastAppt = sorted[0];
  const lastDate = new Date(lastAppt.date || lastAppt.start);
  const daysSinceLast = Math.max(0, (now - lastDate.getTime()) / (1000 * 60 * 60 * 24));

  const recentAppts = clientAppts.filter(a => {
    const d = new Date(a.date || a.start);
    return now - d.getTime() < oneWeek;
  });
  const weekFreq = recentAppts.length;

  // Fatigue formula: base from recency + frequency load
  let fatigue = 0;
  if (daysSinceLast < 1)      fatigue += 50;
  else if (daysSinceLast < 2) fatigue += 35;
  else if (daysSinceLast < 3) fatigue += 20;
  else if (daysSinceLast < 5) fatigue += 10;
  else                         fatigue += 0;

  fatigue += Math.min(40, weekFreq * 10); // 4 classes/week = max 40 pts
  return Math.min(100, fatigue);
}

function detectInjuries(client, assessments, plans) {
  const injuries = [];
  const clientAssessments = (assessments || []).filter(a => a.patientId === client.id || a.clientId === client.id);
  const clientPlans = (plans || []).filter(p => p.patientId === client.id || p.clientId === client.id);

  clientAssessments.forEach(a => {
    if (a.injuries) injuries.push(...(Array.isArray(a.injuries) ? a.injuries : [a.injuries]));
    if (a.painAreas) injuries.push(...(Array.isArray(a.painAreas) ? a.painAreas : [a.painAreas]));
    if (a.conditions) injuries.push(...(Array.isArray(a.conditions) ? a.conditions : [a.conditions]));
  });
  clientPlans.forEach(p => {
    if (p.diagnosis) injuries.push(p.diagnosis);
    if (p.condition) injuries.push(p.condition);
    if (p.restrictions) injuries.push(...(Array.isArray(p.restrictions) ? p.restrictions : [p.restrictions]));
  });
  // Check client object itself
  if (client.injuries) injuries.push(...(Array.isArray(client.injuries) ? client.injuries : [client.injuries]));
  if (client.conditions) injuries.push(...(Array.isArray(client.conditions) ? client.conditions : [client.conditions]));

  return injuries.filter(Boolean).map(i => String(i).toLowerCase());
}

function hasInjuryFor(injuries, exercise) {
  const lowerBack = ['lower back', 'lumbar', 'sacral', 'si joint', 'sciatica'];
  const shoulder  = ['shoulder', 'rotator', 'cuff', 'impingement', 'ac joint'];
  const knee      = ['knee', 'meniscus', 'patella', 'acl', 'mcl'];
  const hip       = ['hip', 'piriformis', 'it band', 'illiotibial', 'psoas'];

  const hasAny = (list) => injuries.some(inj => list.some(kw => inj.includes(kw)));

  if (exercise === 'footwork')    return hasAny(knee) || hasAny(hip);
  if (exercise === 'legCircles')  return hasAny(hip) || hasAny(lowerBack);
  if (exercise === 'shortBox')    return hasAny(shoulder) || hasAny(lowerBack);
  if (exercise === 'longStretch') return hasAny(shoulder) || hasAny(lowerBack);
  if (exercise === 'elephant')    return hasAny(lowerBack) || hasAny(hip);
  if (exercise === 'kneeSt')      return hasAny(knee) || hasAny(lowerBack);
  return false;
}

function computeSpringRecommendation(client, exercise, appointments, assessments, plans, classType) {
  const fatigue  = computeFatigue(client, appointments);
  const injuries = detectInjuries(client, assessments, plans);
  const isPrenatal = classType === 'Prenatal Reformer' || client.prenatal || (client.conditions || '').toLowerCase().includes('prenatal');
  const isAdvanced = (client.level || '').toLowerCase() === 'advanced';
  const isBeginner = (client.level || '').toLowerCase() === 'beginner' || !client.level;
  const isPostRehab = injuries.some(i => i.includes('post') || i.includes('rehab') || i.includes('recovery'));
  const age = client.age || client.dob ? (client.age || Math.floor((Date.now() - new Date(client.dob)) / (365.25 * 24 * 3600 * 1000))) : 35;
  const isOlder = age > 60;
  const hasShoulder = injuries.some(i => ['shoulder','rotator','cuff','impingement'].some(kw => i.includes(kw)));
  const hasInjury = hasInjuryFor(injuries, exercise);

  let cfg = { ...BASE_SPRINGS[exercise] };
  const reasons = [];
  let modified = false;

  // Prenatal — always reduce to minimum green
  if (isPrenatal) {
    cfg = { r: 0, b: 0, g: 2, y: 1 };
    reasons.push('Prenatal protocol — green minimum always applied');
    modified = true;
    return { springs: cfgToLabel(cfg), total: `${totalWeight(cfg)} lbs`, reason: reasons.join('. '), modified };
  }

  // Post-rehab — green + blue only
  if (isPostRehab) {
    cfg = { r: 0, b: 1, g: 1, y: 0 };
    reasons.push('Post-rehab protocol — limited to green + blue');
    modified = true;
    return { springs: cfgToLabel(cfg), total: `${totalWeight(cfg)} lbs`, reason: reasons.join('. '), modified };
  }

  // Reduce factors
  if (hasInjury) {
    cfg = reduceLoad(cfg);
    reasons.push(`Reduced — active ${exercise === 'footwork' ? 'lower extremity' : exercise === 'longStretch' || exercise === 'shortBox' ? 'upper body' : 'relevant'} injury`);
    modified = true;
  }
  if (hasShoulder && UPPER_BODY_EX.has(exercise)) {
    cfg = reduceLoad(cfg);
    reasons.push('Additional reduction — shoulder restriction on upper body work');
    modified = true;
  }
  if (fatigue > 60) {
    cfg = reduceLoad(cfg);
    reasons.push(`Reduced — high fatigue score (${fatigue}/100)`);
    modified = true;
  }
  if (isBeginner) {
    cfg = reduceLoad(cfg);
    reasons.push('Beginner — reduced from standard');
    modified = true;
  }
  if (isOlder) {
    cfg = reduceLoad(cfg);
    reasons.push(`Reduced — client age ${age}`);
    modified = true;
  }

  // Increase factors
  if (isAdvanced && !hasInjury && fatigue < 30) {
    cfg = increaseLoad(cfg);
    reasons.push('Advanced client + low fatigue — increased load');
  }

  cfg = clampCfg(cfg);
  if (!reasons.length) reasons.push('Standard — no modifications needed');

  return {
    springs: cfgToLabel(cfg),
    total: `${totalWeight(cfg)} lbs`,
    reason: reasons.join('. '),
    modified,
    fatigue,
  };
}

function getReadiness(fatigue, injuries) {
  const hasActive = injuries.length > 0;
  if (fatigue > 70 || (fatigue > 50 && hasActive)) return 'red';
  if (fatigue > 40 || hasActive) return 'yellow';
  return 'green';
}

const READINESS_LABEL = { green: 'Ready', yellow: 'Caution', red: 'Modified' };
const READINESS_COLOR = { green: '#38A169', yellow: '#D69E2E', red: '#E53E3E' };
const READINESS_BG    = { green: '#F0FFF4', yellow: '#FFFBEB', red: '#FFF5F5' };

export default function SpringEngine() {
  const s = useStyles();
  const patients     = useMemo(() => getPatients()    || [], []);
  const appointments = useMemo(() => getAppointments()|| [], []);
  const assessments  = useMemo(() => getAssessments() || [], []);
  const plans        = useMemo(() => getTreatmentPlans() || [], []);

  const [classType, setClassType]       = useState('Reformer');
  const [selected, setSelected]         = useState([]);
  const [generated, setGenerated]       = useState(false);
  const [compact, setCompact]           = useState(false);
  const [legendOpen, setLegendOpen]     = useState(false);

  const displayPatients = patients.slice(0, 12);

  function toggleClient(id) {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    setGenerated(false);
  }

  const selectedClients = displayPatients.filter(p => selected.includes(p.id));

  const cards = useMemo(() => {
    if (!generated) return [];
    return selectedClients.map(client => {
      const injuries = detectInjuries(client, assessments, plans);
      const fatigue  = computeFatigue(client, appointments);
      const readiness = getReadiness(fatigue, injuries);
      const exRecs = EXERCISES.map(ex => ({
        ...ex,
        rec: computeSpringRecommendation(client, ex.key, appointments, assessments, plans, classType),
      }));
      const anyModified = exRecs.some(e => e.rec.modified);
      return { client, injuries, fatigue, readiness, exRecs, anyModified };
    });
  }, [generated, selectedClients, appointments, assessments, plans, classType]);

  const initials = (c) => {
    const name = c.name || `${c.firstName || ''} ${c.lastName || ''}`.trim() || '?';
    return name.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase();
  };
  const clientName = (c) => c.name || `${c.firstName || ''} ${c.lastName || ''}`.trim() || 'Client';

  const card = {
    background: 'rgba(255,255,255,0.72)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255,255,255,0.6)',
    borderRadius: 16,
    boxShadow: s.shadow,
  };

  return (
    <div style={{ padding: '32px 28px', maxWidth: 1200, margin: '0 auto', fontFamily: s.FONT }}>

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontFamily: s.MONO, fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: s.accent, marginBottom: 8 }}>
          Spring Recommendation Engine
        </div>
        <h1 style={{ fontFamily: s.DISPLAY, fontSize: 34, fontWeight: 700, color: s.text, margin: '0 0 8px' }}>
          Reformer Spring Advisor
        </h1>
        <p style={{ color: s.text2, fontSize: 15, margin: 0, maxWidth: 560 }}>
          Real-time spring suggestions per client based on fatigue, injury history, and training level — so you never have to guess at the carriage.
        </p>
      </div>

      {/* Class Setup Panel */}
      <div style={{ ...card, padding: 24, marginBottom: 24 }}>
        <div style={{ fontFamily: s.MONO, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: s.text3, marginBottom: 16 }}>
          Class Setup
        </div>

        {/* Class type selector */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: s.text, marginBottom: 10 }}>Class Type</div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {CLASS_TYPES.map(ct => (
              <button
                key={ct}
                onClick={() => { setClassType(ct); setGenerated(false); }}
                style={{
                  padding: '8px 18px', borderRadius: 999, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: s.FONT,
                  background: classType === ct ? s.accent : 'rgba(0,0,0,0.06)',
                  color: classType === ct ? '#fff' : s.text2,
                  transition: 'all 0.15s',
                }}
              >
                {ct}
              </button>
            ))}
          </div>
        </div>

        {/* Client multi-select */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: s.text, marginBottom: 10 }}>
            Select Clients in Class &nbsp;<span style={{ color: s.text3, fontWeight: 400 }}>({selected.length} selected, max 12)</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {displayPatients.map(p => {
              const sel = selected.includes(p.id);
              return (
                <button
                  key={p.id}
                  onClick={() => toggleClient(p.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '7px 14px',
                    borderRadius: 10, border: sel ? `2px solid ${s.accent}` : '2px solid rgba(0,0,0,0.1)',
                    background: sel ? `${s.accent}14` : '#fff', cursor: 'pointer',
                    fontFamily: s.FONT, fontSize: 13, fontWeight: sel ? 600 : 400, color: s.text,
                    transition: 'all 0.15s',
                  }}
                >
                  <span style={{
                    width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: sel ? s.accent : 'rgba(0,0,0,0.1)',
                    color: sel ? '#fff' : s.text2, fontSize: 11, fontWeight: 700, fontFamily: s.MONO, flexShrink: 0,
                  }}>
                    {initials(p)}
                  </span>
                  {clientName(p)}
                </button>
              );
            })}
            {displayPatients.length === 0 && (
              <div style={{ color: s.text3, fontSize: 13 }}>No clients found — add patients first.</div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button
            onClick={() => setGenerated(true)}
            disabled={selected.length === 0}
            style={{
              padding: '10px 28px', borderRadius: 10, border: 'none', cursor: selected.length ? 'pointer' : 'not-allowed',
              background: selected.length ? s.accent : 'rgba(0,0,0,0.1)',
              color: selected.length ? '#fff' : s.text3,
              fontSize: 14, fontWeight: 700, fontFamily: s.FONT, transition: 'all 0.15s',
            }}
          >
            Generate Spring Cards
          </button>
          {generated && (
            <button
              onClick={() => setCompact(v => !v)}
              style={{
                padding: '10px 18px', borderRadius: 10, border: `1.5px solid ${s.accent}`,
                background: 'transparent', color: s.accent, fontSize: 13, fontWeight: 600, fontFamily: s.FONT, cursor: 'pointer',
              }}
            >
              {compact ? 'Full View' : 'Compact (iPad)'}
            </button>
          )}
        </div>
      </div>

      {/* Spring Card Grid */}
      {generated && cards.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontFamily: s.MONO, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: s.text3, marginBottom: 16 }}>
            Spring Cards — {classType}
          </div>

          {compact ? (
            // Compact iPad mode
            <div style={{ ...card, padding: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
                {cards.map(({ client, readiness, exRecs, anyModified }) => (
                  <div key={client.id} style={{
                    background: READINESS_BG[readiness], border: `1.5px solid ${READINESS_COLOR[readiness]}40`,
                    borderRadius: 12, padding: 12,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <span style={{
                        width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: READINESS_COLOR[readiness], color: '#fff', fontSize: 12, fontWeight: 700, fontFamily: s.MONO,
                      }}>
                        {initials(client)}
                      </span>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: s.text }}>{clientName(client)}</div>
                        {anyModified && <div style={{ fontSize: 10, color: '#E53E3E', fontWeight: 600 }}>MODIFIED</div>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      {exRecs.map(({ key, label, rec }) => (
                        <div key={key} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                          <span style={{ color: s.text2 }}>{label}</span>
                          <span style={{ fontWeight: 700, color: s.text, fontFamily: s.MONO, fontSize: 11 }}>{rec.springs}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            // Full mode
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 18 }}>
              {cards.map(({ client, injuries, fatigue, readiness, exRecs, anyModified }) => (
                <div key={client.id} style={{ ...card, padding: 0, overflow: 'hidden' }}>

                  {/* Card header */}
                  <div style={{
                    padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14,
                    borderBottom: '1px solid rgba(0,0,0,0.06)',
                    background: READINESS_BG[readiness],
                  }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: READINESS_COLOR[readiness], color: '#fff', fontSize: 15, fontWeight: 700, fontFamily: s.MONO, flexShrink: 0,
                    }}>
                      {initials(client)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 16, fontWeight: 700, color: s.text }}>{clientName(client)}</div>
                      <div style={{ fontSize: 12, color: s.text2 }}>{client.level || 'Intermediate'}{client.age ? ` · Age ${client.age}` : ''}</div>
                    </div>
                    <div style={{
                      padding: '4px 12px', borderRadius: 999, fontSize: 12, fontWeight: 700, fontFamily: s.MONO,
                      background: READINESS_COLOR[readiness], color: '#fff',
                    }}>
                      {READINESS_LABEL[readiness]}
                    </div>
                  </div>

                  {/* Modifications banner */}
                  {anyModified && (
                    <div style={{
                      background: '#FFF5F5', borderBottom: '1px solid #FED7D7',
                      padding: '7px 20px', fontSize: 12, color: '#C53030', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6,
                    }}>
                      <span>⚠</span>
                      Active modifications — springs adjusted from standard
                    </div>
                  )}

                  <div style={{ padding: '16px 20px' }}>

                    {/* Fatigue indicator */}
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: s.text2 }}>Estimated Fatigue</span>
                        <span style={{ fontFamily: s.MONO, fontSize: 12, fontWeight: 700, color: fatigue > 60 ? '#E53E3E' : fatigue > 40 ? '#D69E2E' : '#38A169' }}>
                          {fatigue}/100
                        </span>
                      </div>
                      <div style={{ height: 6, borderRadius: 99, background: 'rgba(0,0,0,0.08)', overflow: 'hidden' }}>
                        <div style={{
                          height: '100%', borderRadius: 99, width: `${fatigue}%`,
                          background: fatigue > 60 ? '#E53E3E' : fatigue > 40 ? '#D69E2E' : '#38A169',
                          transition: 'width 0.5s ease',
                        }} />
                      </div>
                    </div>

                    {/* Per-exercise recommendations */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {exRecs.map(({ key, label, rec }) => (
                        <div key={key} style={{
                          background: rec.modified ? 'rgba(229,62,62,0.04)' : 'rgba(0,0,0,0.025)',
                          border: rec.modified ? '1px solid rgba(229,62,62,0.15)' : '1px solid rgba(0,0,0,0.07)',
                          borderRadius: 10, padding: '10px 12px',
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                            <span style={{ fontSize: 13, fontWeight: 600, color: s.text }}>{label}</span>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontFamily: s.MONO, fontSize: 12, fontWeight: 700, color: s.accent }}>{rec.springs}</div>
                              <div style={{ fontFamily: s.MONO, fontSize: 10, color: s.text3 }}>{rec.total}</div>
                            </div>
                          </div>
                          {/* Spring color pills */}
                          <div style={{ display: 'flex', gap: 4, marginBottom: 5 }}>
                            {rec.springs.split(' + ').map((part, i) => {
                              const match = part.match(/(\d+)\s+(\w+)/);
                              if (!match) return null;
                              const [, count, color] = match;
                              const sp = SPRINGS[color.toLowerCase()];
                              if (!sp) return null;
                              return Array.from({ length: parseInt(count) }).map((_, j) => (
                                <span key={`${i}-${j}`} style={{
                                  width: 12, height: 12, borderRadius: '50%', display: 'inline-block',
                                  background: sp.hex, border: '1.5px solid rgba(0,0,0,0.15)',
                                }} />
                              ));
                            })}
                          </div>
                          <div style={{ fontSize: 11, color: s.text3, lineHeight: 1.4 }}>{rec.reason}</div>
                        </div>
                      ))}
                    </div>

                    {/* Injury tags */}
                    {injuries.length > 0 && (
                      <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                        {[...new Set(injuries)].slice(0, 4).map(inj => (
                          <span key={inj} style={{
                            padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 600,
                            background: 'rgba(229,62,62,0.08)', color: '#C53030', border: '1px solid rgba(229,62,62,0.2)',
                          }}>
                            {inj}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Spring Legend */}
      <div style={{ ...card, overflow: 'hidden' }}>
        <button
          onClick={() => setLegendOpen(v => !v)}
          style={{
            width: '100%', padding: '14px 20px', background: 'none', border: 'none', cursor: 'pointer',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: s.FONT,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {Object.values(SPRINGS).map(sp => (
              <span key={sp.label} style={{ width: 14, height: 14, borderRadius: '50%', background: sp.hex, display: 'inline-block', border: '1.5px solid rgba(0,0,0,0.15)' }} />
            ))}
            <span style={{ fontFamily: s.MONO, fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: s.text2, marginLeft: 4 }}>
              Spring Color Reference
            </span>
          </div>
          <span style={{ fontSize: 18, color: s.text3 }}>{legendOpen ? '−' : '+'}</span>
        </button>

        {legendOpen && (
          <div style={{ padding: '0 20px 20px', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12, marginTop: 16 }}>
              {Object.entries(SPRINGS).map(([key, sp]) => (
                <div key={key} style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
                  background: 'rgba(0,0,0,0.025)', borderRadius: 10, border: `2px solid ${sp.hex}30`,
                }}>
                  <span style={{ width: 20, height: 20, borderRadius: '50%', background: sp.hex, flexShrink: 0, border: '2px solid rgba(0,0,0,0.12)' }} />
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: s.text }}>{sp.label}</div>
                    <div style={{ fontFamily: s.MONO, fontSize: 12, color: s.text3 }}>~{sp.weight} lbs each</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 14, padding: '12px 14px', background: 'rgba(0,0,0,0.025)', borderRadius: 10 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: s.text, marginBottom: 6 }}>Example Total Resistance</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {[
                  { combo: '3 Red + 1 Blue', total: 3*5.5 + 3.5 },
                  { combo: '2 Red + 1 Blue', total: 2*5.5 + 3.5 },
                  { combo: '1 Blue + 1 Green', total: 3.5 + 2.5 },
                  { combo: '2 Green + 1 Yellow', total: 2*2.5 + 1.0 },
                ].map(({ combo, total }) => (
                  <div key={combo} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                    <span style={{ color: s.text2 }}>{combo}</span>
                    <span style={{ fontFamily: s.MONO, fontWeight: 700, color: s.accent }}>{total.toFixed(1)} lbs</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
