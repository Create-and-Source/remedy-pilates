// Teacher Training Pipeline — admin page for tracking trainees through PSC certification
import { useState, useEffect } from 'react';
import { useStyles, getAvatarGradient } from '../theme';
import { getTrainees, addTrainee, updateTrainee, deleteTrainee, getProviders, subscribe } from '../data/store';

export default function Training() {
  const s = useStyles();
  const [, setTick] = useState(0);
  useEffect(() => subscribe(() => setTick(t => t + 1)), []);

  const trainees = getTrainees();
  const instructors = getProviders();
  const [selected, setSelected] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [filter, setFilter] = useState('all');
  const [logHours, setLogHours] = useState(null);

  const active = trainees.filter(t => t.status === 'active');
  const graduated = trainees.filter(t => t.status === 'graduated');
  const filtered = filter === 'all' ? trainees : filter === 'active' ? active : graduated;

  const totalHours = (t) => t.observationHours + t.practiceHours + t.apprenticeHours;
  const totalRequired = (t) => t.observationRequired + t.practiceRequired + t.apprenticeRequired;
  const pct = (t) => Math.round((totalHours(t) / totalRequired(t)) * 100);
  const modulePct = (t) => {
    const completed = t.modules.filter(m => m.status === 'completed').length;
    return Math.round((completed / t.modules.length) * 100);
  };

  const glass = {
    background: 'rgba(255,255,255,0.6)',
    backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid rgba(255,255,255,0.65)',
    borderRadius: 18,
    boxShadow: '0 4px 24px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)',
  };

  function ProgressRing({ value, size = 56, stroke = 5, color }) {
    const r = (size - stroke) / 2;
    const circ = 2 * Math.PI * r;
    const offset = circ - (value / 100) * circ;
    return (
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth={stroke} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color || s.accent} strokeWidth={stroke}
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
        <text x={size/2} y={size/2} textAnchor="middle" dy="0.35em" fill={s.text}
          style={{ font: `600 ${size/4}px ${s.FONT}`, transform: 'rotate(90deg)', transformOrigin: 'center' }}>
          {value}%
        </text>
      </svg>
    );
  }

  function HoursBar({ label, current, required, color }) {
    const p = Math.min(100, Math.round((current / required) * 100));
    return (
      <div style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ font: `500 12px ${s.FONT}`, color: s.text }}>{label}</span>
          <span style={{ font: `500 11px ${s.MONO}`, color: p >= 100 ? s.success : s.text2 }}>
            {current} / {required} hrs {p >= 100 ? '✓' : ''}
          </span>
        </div>
        <div style={{ height: 6, borderRadius: 3, background: 'rgba(0,0,0,0.06)', overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: 3, width: `${p}%`,
            background: p >= 100 ? s.success : color || s.accent,
            transition: 'width 0.6s ease',
          }} />
        </div>
      </div>
    );
  }

  function handleAddTrainee(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    addTrainee({
      name: fd.get('name'),
      email: fd.get('email'),
      phone: fd.get('phone'),
      startDate: fd.get('startDate'),
      expectedEnd: fd.get('expectedEnd'),
      mentor: fd.get('mentor'),
      status: 'active',
      phase: 'Observation',
      observationHours: 0, observationRequired: 100,
      practiceHours: 0, practiceRequired: 80,
      apprenticeHours: 0, apprenticeRequired: 50,
      anatomyExam: null, writtenExam: null, practicalExam: null,
      modules: [
        { name: 'Mat Fundamentals', status: 'upcoming', date: null },
        { name: 'Reformer I', status: 'upcoming', date: null },
        { name: 'Reformer II', status: 'upcoming', date: null },
        { name: 'Anatomy & Kinesiology', status: 'upcoming', date: null },
        { name: 'Cadillac / Trapeze', status: 'upcoming', date: null },
        { name: 'Chair & Barrel', status: 'upcoming', date: null },
        { name: 'Practice Teaching Lab', status: 'upcoming', date: null },
        { name: 'Business of Pilates', status: 'upcoming', date: null },
        { name: 'Final Practicum', status: 'upcoming', date: null },
      ],
      notes: '',
    });
    setShowAdd(false);
  }

  function handleLogHours(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    const type = fd.get('type');
    const hours = parseFloat(fd.get('hours'));
    if (!hours || !logHours) return;
    const t = trainees.find(tr => tr.id === logHours);
    if (!t) return;
    const updates = {};
    if (type === 'observation') updates.observationHours = Math.min(t.observationRequired, t.observationHours + hours);
    if (type === 'practice') updates.practiceHours = Math.min(t.practiceRequired, t.practiceHours + hours);
    if (type === 'apprentice') updates.apprenticeHours = Math.min(t.apprenticeRequired, t.apprenticeHours + hours);
    updateTrainee(logHours, updates);
    setLogHours(null);
  }

  function toggleModule(traineeId, moduleIdx) {
    const t = trainees.find(tr => tr.id === traineeId);
    if (!t) return;
    const modules = [...t.modules];
    const m = modules[moduleIdx];
    if (m.status === 'upcoming') { m.status = 'in-progress'; m.date = null; }
    else if (m.status === 'in-progress') { m.status = 'completed'; m.date = new Date().toISOString().slice(0, 10); }
    else { m.status = 'upcoming'; m.date = null; }
    updateTrainee(traineeId, { modules });
  }

  const detail = selected ? trainees.find(t => t.id === selected) : null;
  const mentor = detail ? instructors.find(i => i.id === detail.mentor) : null;

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ font: `600 26px ${s.FONT}`, color: s.text, marginBottom: 4 }}>Teacher Training Pipeline</h1>
          <p style={{ font: `400 13px ${s.FONT}`, color: s.text2 }}>Pilates Sports Center — 450+ Hour Comprehensive Program</p>
        </div>
        <button onClick={() => setShowAdd(true)} style={{ ...s.pillAccent }}>+ New Trainee</button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Active Trainees', value: active.length, color: s.accent },
          { label: 'Graduated', value: graduated.length, color: s.success },
          { label: 'Avg. Completion', value: active.length ? Math.round(active.reduce((s, t) => s + pct(t), 0) / active.length) + '%' : '—', color: s.warning },
          { label: 'Total Hours Logged', value: trainees.reduce((s, t) => s + totalHours(t), 0), color: s.text },
        ].map(stat => (
          <div key={stat.label} style={{ ...glass, padding: '18px 20px' }}>
            <div style={{ font: `500 10px ${s.MONO}`, textTransform: 'uppercase', letterSpacing: 1.5, color: s.text3, marginBottom: 6 }}>{stat.label}</div>
            <div style={{ font: `600 28px ${s.FONT}`, color: stat.color }}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
        {['all', 'active', 'graduated'].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            ...s.pill, textTransform: 'capitalize',
            background: filter === f ? s.accent : 'rgba(255,255,255,0.5)',
            color: filter === f ? s.accentText : s.text2,
            border: filter === f ? 'none' : '1px solid rgba(0,0,0,0.06)',
          }}>{f} {f === 'active' ? `(${active.length})` : f === 'graduated' ? `(${graduated.length})` : `(${trainees.length})`}</button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: detail ? '1fr 1.3fr' : '1fr', gap: 20 }}>
        {/* Trainee List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map(t => {
            const m = instructors.find(i => i.id === t.mentor);
            return (
              <div key={t.id} onClick={() => setSelected(t.id)} style={{
                ...glass, padding: '18px 20px', cursor: 'pointer',
                borderLeft: selected === t.id ? `3px solid ${s.accent}` : '3px solid transparent',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => { if (selected !== t.id) e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                    background: getAvatarGradient(t.name),
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    font: `600 16px ${s.FONT}`, color: '#fff',
                  }}>{t.name.split(' ').map(n => n[0]).join('')}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ font: `600 15px ${s.FONT}`, color: s.text }}>{t.name}</span>
                      <span style={{
                        padding: '2px 10px', borderRadius: 100, font: `500 10px ${s.MONO}`, textTransform: 'uppercase',
                        background: t.status === 'active' ? `${s.accent}15` : '#F0FDF4',
                        color: t.status === 'active' ? s.accent : s.success,
                      }}>{t.phase}</span>
                    </div>
                    <div style={{ font: `400 12px ${s.FONT}`, color: s.text2, marginTop: 2 }}>
                      Mentor: {m?.name || 'Unassigned'} · {pct(t)}% complete
                    </div>
                  </div>
                </div>
                {/* Mini progress bar */}
                <div style={{ marginTop: 10, height: 4, borderRadius: 2, background: 'rgba(0,0,0,0.06)', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', borderRadius: 2, width: `${pct(t)}%`,
                    background: t.status === 'graduated' ? s.success : s.accent,
                    transition: 'width 0.4s ease',
                  }} />
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div style={{ ...glass, padding: 40, textAlign: 'center', font: `400 14px ${s.FONT}`, color: s.text3 }}>
              No trainees in this category
            </div>
          )}
        </div>

        {/* Detail Panel */}
        {detail && (
          <div style={{ ...glass, padding: 28, position: 'sticky', top: 80, alignSelf: 'start' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                <div style={{
                  width: 56, height: 56, borderRadius: 16,
                  background: getAvatarGradient(detail.name),
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  font: `600 20px ${s.FONT}`, color: '#fff',
                }}>{detail.name.split(' ').map(n => n[0]).join('')}</div>
                <div>
                  <h2 style={{ font: `600 20px ${s.FONT}`, color: s.text }}>{detail.name}</h2>
                  <div style={{ font: `400 13px ${s.FONT}`, color: s.text2 }}>{detail.email}</div>
                  <div style={{ font: `400 12px ${s.MONO}`, color: s.text3, marginTop: 2 }}>
                    Mentor: {mentor?.name || '—'} · Started {new Date(detail.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                </div>
              </div>
              <button onClick={() => setSelected(null)} style={{
                width: 28, height: 28, borderRadius: 8, border: '1px solid rgba(0,0,0,0.08)',
                background: 'rgba(255,255,255,0.5)', cursor: 'pointer', font: `400 14px ${s.FONT}`, color: s.text3,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>×</button>
            </div>

            {/* Hours Breakdown */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ font: `600 14px ${s.FONT}`, color: s.text }}>Hours Progress</span>
                <button onClick={() => setLogHours(detail.id)} style={{ ...s.pillGhost, padding: '4px 12px', fontSize: 11 }}>+ Log Hours</button>
              </div>
              <HoursBar label="Observation" current={detail.observationHours} required={detail.observationRequired} color="#5B7B8F" />
              <HoursBar label="Practice Teaching" current={detail.practiceHours} required={detail.practiceRequired} color={s.accent} />
              <HoursBar label="Apprenticeship" current={detail.apprenticeHours} required={detail.apprenticeRequired} color="#6B8F71" />
            </div>

            {/* Exams */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ font: `600 14px ${s.FONT}`, color: s.text, marginBottom: 10 }}>Exams</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                {[
                  { label: 'Anatomy', score: detail.anatomyExam },
                  { label: 'Written', score: detail.writtenExam },
                  { label: 'Practical', score: detail.practicalExam },
                ].map(ex => (
                  <div key={ex.label} style={{
                    padding: '12px 14px', borderRadius: 12, textAlign: 'center',
                    background: ex.score ? (ex.score >= 80 ? '#F0FDF4' : '#FFFBEB') : 'rgba(0,0,0,0.03)',
                    border: ex.score ? `1px solid ${ex.score >= 80 ? s.success : s.warning}20` : '1px solid rgba(0,0,0,0.04)',
                  }}>
                    <div style={{ font: `500 9px ${s.MONO}`, textTransform: 'uppercase', color: s.text3, marginBottom: 4 }}>{ex.label}</div>
                    <div style={{
                      font: `600 18px ${s.FONT}`,
                      color: ex.score ? (ex.score >= 80 ? s.success : s.warning) : s.text3,
                    }}>{ex.score ? `${ex.score}%` : '—'}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Modules */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ font: `600 14px ${s.FONT}`, color: s.text }}>Modules ({modulePct(detail)}%)</span>
                <span style={{ font: `400 11px ${s.FONT}`, color: s.text3 }}>Click to toggle status</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {detail.modules.map((mod, idx) => (
                  <div key={mod.name} onClick={() => toggleModule(detail.id, idx)} style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px',
                    borderRadius: 10, cursor: 'pointer',
                    background: mod.status === 'completed' ? '#F0FDF4' : mod.status === 'in-progress' ? `${s.accent}08` : 'transparent',
                    border: mod.status === 'in-progress' ? `1px solid ${s.accent}20` : '1px solid transparent',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = mod.status === 'completed' ? '#E5F9EC' : `${s.accent}10`; }}
                  onMouseLeave={e => { e.currentTarget.style.background = mod.status === 'completed' ? '#F0FDF4' : mod.status === 'in-progress' ? `${s.accent}08` : 'transparent'; }}
                  >
                    <div style={{
                      width: 20, height: 20, borderRadius: 6, flexShrink: 0,
                      border: mod.status === 'completed' ? 'none' : mod.status === 'in-progress' ? `2px solid ${s.accent}` : '2px solid rgba(0,0,0,0.12)',
                      background: mod.status === 'completed' ? s.success : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {mod.status === 'completed' && (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
                      )}
                      {mod.status === 'in-progress' && (
                        <div style={{ width: 8, height: 8, borderRadius: 3, background: s.accent }} />
                      )}
                    </div>
                    <span style={{
                      font: `${mod.status === 'completed' ? '400' : '500'} 13px ${s.FONT}`,
                      color: mod.status === 'completed' ? s.text2 : s.text,
                      textDecoration: mod.status === 'completed' ? 'line-through' : 'none',
                      flex: 1,
                    }}>{mod.name}</span>
                    {mod.date && <span style={{ font: `400 10px ${s.MONO}`, color: s.text3 }}>{mod.date}</span>}
                  </div>
                ))}
              </div>
            </div>

            {/* Notes */}
            {detail.notes && (
              <div style={{
                padding: 16, borderRadius: 12, background: 'rgba(0,0,0,0.03)',
                font: `400 13px ${s.FONT}`, color: s.text2, lineHeight: 1.6,
                borderLeft: `3px solid ${s.accent}30`,
              }}>
                <div style={{ font: `500 10px ${s.MONO}`, textTransform: 'uppercase', letterSpacing: 1, color: s.text3, marginBottom: 6 }}>Mentor Notes</div>
                {detail.notes}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Trainee Modal */}
      {showAdd && (
        <div onClick={() => setShowAdd(false)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
        }}>
          <form onSubmit={handleAddTrainee} onClick={e => e.stopPropagation()} style={{
            ...glass, padding: 32, width: 440, background: '#fff', borderRadius: 20,
          }}>
            <h3 style={{ font: `600 18px ${s.FONT}`, color: s.text, marginBottom: 20 }}>New Trainee</h3>
            {[
              { name: 'name', label: 'Full Name', type: 'text', required: true },
              { name: 'email', label: 'Email', type: 'email', required: true },
              { name: 'phone', label: 'Phone', type: 'tel', required: false },
              { name: 'startDate', label: 'Start Date', type: 'date', required: true },
              { name: 'expectedEnd', label: 'Expected Completion', type: 'date', required: true },
            ].map(f => (
              <div key={f.name} style={{ marginBottom: 14 }}>
                <label style={s.label}>{f.label}</label>
                <input name={f.name} type={f.type} required={f.required} style={s.input} />
              </div>
            ))}
            <div style={{ marginBottom: 20 }}>
              <label style={s.label}>Mentor</label>
              <select name="mentor" style={{ ...s.input, cursor: 'pointer' }}>
                {instructors.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setShowAdd(false)} style={s.pillGhost}>Cancel</button>
              <button type="submit" style={s.pillAccent}>Add Trainee</button>
            </div>
          </form>
        </div>
      )}

      {/* Log Hours Modal */}
      {logHours && (
        <div onClick={() => setLogHours(null)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
        }}>
          <form onSubmit={handleLogHours} onClick={e => e.stopPropagation()} style={{
            ...glass, padding: 32, width: 380, background: '#fff', borderRadius: 20,
          }}>
            <h3 style={{ font: `600 18px ${s.FONT}`, color: s.text, marginBottom: 20 }}>Log Hours</h3>
            <div style={{ marginBottom: 14 }}>
              <label style={s.label}>Type</label>
              <select name="type" style={{ ...s.input, cursor: 'pointer' }}>
                <option value="observation">Observation</option>
                <option value="practice">Practice Teaching</option>
                <option value="apprentice">Apprenticeship</option>
              </select>
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={s.label}>Hours</label>
              <input name="hours" type="number" step="0.5" min="0.5" max="8" required style={s.input} placeholder="e.g. 2" />
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setLogHours(null)} style={s.pillGhost}>Cancel</button>
              <button type="submit" style={s.pillAccent}>Log Hours</button>
            </div>
          </form>
        </div>
      )}

      <style>{`
        @media (max-width: 860px) {
          .training-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
