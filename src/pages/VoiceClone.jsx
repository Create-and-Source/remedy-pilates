import { useState, useRef, useCallback } from 'react';
import { useStyles } from '../theme';
import { getProviders } from '../data/store';

// ── Instructor Voice Clone for On-Demand ──
// Record an instructor cueing a class once, then use voice synthesis to generate
// new cues for any class variation without re-recording.
// Pairs with the Class Sequencer for hands-free teaching.

const VOICE_STYLES = [
  { id: 'calm', label: 'Calm & Centered', desc: 'Soothing tone, slower pace — perfect for Stretch & Restore' },
  { id: 'energetic', label: 'Energetic & Upbeat', desc: 'High energy, faster tempo — great for Barre Burn' },
  { id: 'precise', label: 'Precise & Clinical', desc: 'Clear articulation, measured pace — ideal for Reformer technique' },
  { id: 'warm', label: 'Warm & Encouraging', desc: 'Supportive, motivational — good for beginners and prenatal' },
];

const SAMPLE_CUES = [
  { id: 1, text: 'Inhale to prepare, exhale and draw your navel to spine as you curl forward', category: 'Core', duration: 4.2 },
  { id: 2, text: 'Press out through your heels, keeping the carriage controlled on the return', category: 'Reformer', duration: 3.8 },
  { id: 3, text: 'Beautiful work everyone — hold here, find your balance, breathe into it', category: 'Encouragement', duration: 3.5 },
  { id: 4, text: 'Lower the bar halfway, pause, squeeze your glutes, then press all the way up', category: 'Barre', duration: 4.0 },
  { id: 5, text: 'Relax your shoulders away from your ears — let the tension melt with each exhale', category: 'Stretch', duration: 4.5 },
  { id: 6, text: 'Three more reps, you\'ve got this — keep your core engaged the entire time', category: 'Motivation', duration: 3.2 },
];

const CLASS_TEMPLATES = [
  { id: 'reformer-45', name: '45-Min Reformer Flow', cueCount: 28, duration: '45 min' },
  { id: 'barre-55', name: '55-Min Barre Burn', cueCount: 35, duration: '55 min' },
  { id: 'mat-30', name: '30-Min Express Mat', cueCount: 18, duration: '30 min' },
  { id: 'stretch-45', name: '45-Min Stretch & Restore', cueCount: 22, duration: '45 min' },
  { id: 'prenatal-45', name: '45-Min Prenatal Reformer', cueCount: 24, duration: '45 min' },
];

function WaveformVis({ active, color, width = 200, height = 40 }) {
  const bars = 32;
  return (
    <svg width={width} height={height} style={{ display: 'block' }}>
      {Array.from({ length: bars }).map((_, i) => {
        const h = active
          ? Math.max(4, Math.abs(Math.sin((i * 0.4) + Date.now() * 0.002)) * (height - 8))
          : Math.max(2, Math.abs(Math.sin(i * 0.7)) * 8);
        return (
          <rect key={i}
            x={i * (width / bars)} y={(height - h) / 2}
            width={width / bars - 2} height={h}
            rx={2} fill={color} opacity={active ? 0.8 : 0.3}
          />
        );
      })}
    </svg>
  );
}

function ProgressRing({ progress, size = 100, color }) {
  const r = (size - 10) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - progress / 100);
  return (
    <svg width={size} height={size}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="8" />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="8"
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        transform={`rotate(-90 ${size/2} ${size/2})`}
        style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
      <text x={size/2} y={size/2 + 6} textAnchor="middle" style={{ fontSize: 18, fontWeight: 700, fill: color }}>{progress}%</text>
    </svg>
  );
}

export default function VoiceClone() {
  const s = useStyles();
  const [tab, setTab] = useState('voices'); // voices | generate | library
  const [selectedInstructor, setSelectedInstructor] = useState(null);
  const [selectedStyle, setSelectedStyle] = useState('calm');
  const [recording, setRecording] = useState(false);
  const [recordProgress, setRecordProgress] = useState(0);
  const [voiceModels, setVoiceModels] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [genProgress, setGenProgress] = useState(0);
  const [genStep, setGenStep] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [playingCue, setPlayingCue] = useState(null);
  const [generatedClasses, setGeneratedClasses] = useState([]);
  const timerRef = useRef(null);

  const instructors = getProviders();

  const startRecording = useCallback(() => {
    if (!selectedInstructor) return;
    setRecording(true);
    setRecordProgress(0);
    let p = 0;
    timerRef.current = setInterval(() => {
      p += 2;
      setRecordProgress(p);
      if (p >= 100) {
        clearInterval(timerRef.current);
        setRecording(false);
        const inst = instructors.find(i => i.id === selectedInstructor);
        setVoiceModels(prev => [...prev.filter(v => v.instructorId !== selectedInstructor), {
          instructorId: selectedInstructor,
          name: `${inst?.firstName || 'Instructor'}'s Voice`,
          style: selectedStyle,
          created: new Date().toISOString(),
          samples: 24,
          quality: 94,
        }]);
      }
    }, 120);
  }, [selectedInstructor, selectedStyle, instructors]);

  const generateClass = useCallback(() => {
    if (!selectedTemplate || voiceModels.length === 0) return;
    setGenerating(true);
    setGenProgress(0);
    const steps = ['Analyzing voice model...', 'Matching cue patterns...', 'Synthesizing audio...', 'Applying prosody...', 'Finalizing class audio...'];
    let stepIdx = 0;
    setGenStep(steps[0]);
    timerRef.current = setInterval(() => {
      setGenProgress(prev => {
        const next = prev + 4;
        const newStepIdx = Math.min(steps.length - 1, Math.floor(next / 20));
        if (newStepIdx !== stepIdx) { stepIdx = newStepIdx; setGenStep(steps[stepIdx]); }
        if (next >= 100) {
          clearInterval(timerRef.current);
          setGenerating(false);
          const tpl = CLASS_TEMPLATES.find(t => t.id === selectedTemplate);
          const model = voiceModels[0];
          setGeneratedClasses(prev => [...prev, {
            id: `gc-${Date.now()}`,
            template: tpl.name,
            voice: model.name,
            duration: tpl.duration,
            cues: tpl.cueCount,
            created: new Date().toISOString(),
            quality: 92 + Math.floor(Math.random() * 6),
          }]);
        }
        return Math.min(100, next);
      });
    }, 150);
  }, [selectedTemplate, voiceModels]);

  const playCue = (cue) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(cue.text);
      utter.rate = 0.85;
      utter.pitch = 1.0;
      utter.onstart = () => setPlayingCue(cue.id);
      utter.onend = () => setPlayingCue(null);
      window.speechSynthesis.speak(utter);
    }
  };

  const cardStyle = {
    background: 'rgba(255,255,255,0.72)', backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255,255,255,0.6)', borderRadius: 16, boxShadow: s.shadow,
  };

  return (
    <div style={{ animation: 'fadeIn 0.5s ease' }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ font: `400 11px ${s.MONO}`, textTransform: 'uppercase', letterSpacing: 1.5, color: s.text3, marginBottom: 4 }}>
          Creative Tools
        </div>
        <h1 style={{ font: `600 28px ${s.DISPLAY}`, color: s.text, margin: 0 }}>
          Voice Clone Studio
        </h1>
        <p style={{ font: `400 14px ${s.FONT}`, color: s.text2, margin: '6px 0 0' }}>
          Clone instructor voices to generate on-demand class cues — build a library without re-recording
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {[
          { id: 'voices', label: `Voice Models (${voiceModels.length})` },
          { id: 'generate', label: 'Generate Class' },
          { id: 'library', label: `Library (${generatedClasses.length})` },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: '8px 18px', borderRadius: 10, border: 'none', cursor: 'pointer',
            background: tab === t.id ? s.accent : 'rgba(0,0,0,0.04)',
            color: tab === t.id ? '#fff' : s.text2,
            font: `500 13px ${s.FONT}`, transition: 'all 0.2s',
          }}>{t.label}</button>
        ))}
      </div>

      {/* Voice Models Tab */}
      {tab === 'voices' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {/* Record new voice */}
          <div style={{ ...cardStyle, padding: 24 }}>
            <div style={{ font: `600 14px ${s.FONT}`, color: s.text, marginBottom: 16 }}>Create Voice Model</div>

            {/* Instructor select */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ font: `600 11px ${s.MONO}`, color: s.text3, textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 8 }}>Instructor</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {instructors.map(inst => (
                  <button key={inst.id} onClick={() => setSelectedInstructor(inst.id)} style={{
                    padding: '8px 14px', borderRadius: 8,
                    border: selectedInstructor === inst.id ? `2px solid ${s.accent}` : '1px solid rgba(0,0,0,0.06)',
                    background: selectedInstructor === inst.id ? s.accent + '15' : 'transparent',
                    font: `400 12px ${s.FONT}`, color: selectedInstructor === inst.id ? s.accent : s.text2, cursor: 'pointer',
                  }}>{inst.firstName}</button>
                ))}
              </div>
            </div>

            {/* Voice style */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ font: `600 11px ${s.MONO}`, color: s.text3, textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 8 }}>Voice Style</label>
              {VOICE_STYLES.map(vs => (
                <label key={vs.id} onClick={() => setSelectedStyle(vs.id)} style={{
                  display: 'block', padding: '10px 14px', borderRadius: 8, marginBottom: 6, cursor: 'pointer',
                  border: selectedStyle === vs.id ? `2px solid ${s.accent}` : '1px solid rgba(0,0,0,0.04)',
                  background: selectedStyle === vs.id ? s.accent + '08' : 'transparent',
                }}>
                  <div style={{ font: `500 12px ${s.FONT}`, color: s.text }}>{vs.label}</div>
                  <div style={{ font: `400 11px ${s.FONT}`, color: s.text3, marginTop: 2 }}>{vs.desc}</div>
                </label>
              ))}
            </div>

            {/* Record button + progress */}
            {recording ? (
              <div style={{ textAlign: 'center', padding: 20 }}>
                <ProgressRing progress={recordProgress} color={s.accent} />
                <div style={{ font: `400 12px ${s.FONT}`, color: s.text2, marginTop: 12 }}>
                  Recording sample phrases... ({Math.floor(recordProgress / 4)}/24)
                </div>
                <div style={{ marginTop: 12 }}>
                  <WaveformVis active={true} color={s.accent} width={240} height={36} />
                </div>
              </div>
            ) : (
              <button onClick={startRecording} disabled={!selectedInstructor} style={{
                width: '100%', padding: '14px', borderRadius: 12, border: 'none',
                background: selectedInstructor ? s.accent : 'rgba(0,0,0,0.1)',
                color: selectedInstructor ? '#fff' : '#999',
                font: `600 14px ${s.FONT}`, cursor: selectedInstructor ? 'pointer' : 'not-allowed',
              }}>
                {selectedInstructor ? 'Start Recording Session' : 'Select an instructor first'}
              </button>
            )}

            <div style={{ font: `400 11px ${s.FONT}`, color: s.text3, marginTop: 12, lineHeight: 1.5 }}>
              The instructor reads 24 calibration phrases (~3 minutes). The AI learns their unique vocal patterns, cadence, and teaching style.
            </div>
          </div>

          {/* Existing voice models */}
          <div>
            {voiceModels.length === 0 ? (
              <div style={{ ...cardStyle, padding: 40, textAlign: 'center' }}>
                <div style={{ font: `400 36px`, marginBottom: 12 }}>🎙️</div>
                <div style={{ font: `500 14px ${s.FONT}`, color: s.text }}>No voice models yet</div>
                <div style={{ font: `400 12px ${s.FONT}`, color: s.text3, marginTop: 4 }}>Record an instructor to create your first voice model</div>
              </div>
            ) : voiceModels.map(vm => {
              const inst = instructors.find(i => i.id === vm.instructorId);
              return (
                <div key={vm.instructorId} style={{ ...cardStyle, padding: 20, marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: '50%', background: s.accent + '20',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      font: `600 16px ${s.FONT}`, color: s.accent,
                    }}>{inst?.firstName?.[0]}</div>
                    <div>
                      <div style={{ font: `500 14px ${s.FONT}`, color: s.text }}>{vm.name}</div>
                      <div style={{ font: `400 11px ${s.MONO}`, color: s.text3 }}>
                        {VOICE_STYLES.find(v => v.id === vm.style)?.label} · {vm.samples} samples
                      </div>
                    </div>
                    <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                      <div style={{ font: `700 18px ${s.FONT}`, color: '#16A34A' }}>{vm.quality}%</div>
                      <div style={{ font: `400 9px ${s.MONO}`, color: s.text3 }}>Quality</div>
                    </div>
                  </div>
                  <WaveformVis active={false} color={s.accent} width={260} height={28} />
                  <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                    <button onClick={() => playCue(SAMPLE_CUES[0])} style={{
                      flex: 1, padding: '8px', borderRadius: 8, border: '1px solid rgba(0,0,0,0.06)',
                      background: 'rgba(255,255,255,0.6)', font: `400 11px ${s.FONT}`, color: s.text2, cursor: 'pointer',
                    }}>Preview Voice</button>
                    <button style={{
                      flex: 1, padding: '8px', borderRadius: 8, border: '1px solid rgba(0,0,0,0.06)',
                      background: 'rgba(255,255,255,0.6)', font: `400 11px ${s.FONT}`, color: '#DC2626', cursor: 'pointer',
                    }} onClick={() => setVoiceModels(prev => prev.filter(v => v.instructorId !== vm.instructorId))}>Delete Model</button>
                  </div>
                </div>
              );
            })}

            {/* Sample cues preview */}
            <div style={{ ...cardStyle, padding: 20, marginTop: 12 }}>
              <div style={{ font: `600 12px ${s.MONO}`, color: s.text3, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
                Sample Cue Library
              </div>
              {SAMPLE_CUES.map(cue => (
                <div key={cue.id} onClick={() => playCue(cue)} style={{
                  padding: '10px 14px', borderRadius: 8, marginBottom: 6, cursor: 'pointer',
                  background: playingCue === cue.id ? s.accent + '10' : 'rgba(0,0,0,0.02)',
                  border: playingCue === cue.id ? `1px solid ${s.accent}30` : '1px solid transparent',
                  display: 'flex', alignItems: 'center', gap: 10, transition: 'all 0.2s',
                }}>
                  <span style={{ font: `400 14px`, flexShrink: 0 }}>{playingCue === cue.id ? '🔊' : '▶️'}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ font: `400 12px ${s.FONT}`, color: s.text, lineHeight: 1.4 }}>"{cue.text}"</div>
                    <div style={{ font: `400 10px ${s.MONO}`, color: s.text3, marginTop: 2 }}>{cue.category} · {cue.duration}s</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Generate Class Tab */}
      {tab === 'generate' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div style={{ ...cardStyle, padding: 24 }}>
            <div style={{ font: `600 14px ${s.FONT}`, color: s.text, marginBottom: 16 }}>Generate Class Audio</div>

            {voiceModels.length === 0 ? (
              <div style={{ padding: 30, textAlign: 'center' }}>
                <div style={{ font: `400 14px ${s.FONT}`, color: s.text3 }}>Create a voice model first</div>
                <button onClick={() => setTab('voices')} style={{
                  marginTop: 12, padding: '8px 20px', borderRadius: 8, border: 'none',
                  background: s.accent, color: '#fff', font: `500 12px ${s.FONT}`, cursor: 'pointer',
                }}>Go to Voice Models</button>
              </div>
            ) : (
              <>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ font: `600 11px ${s.MONO}`, color: s.text3, textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 8 }}>
                    Voice: {voiceModels[0].name}
                  </label>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ font: `600 11px ${s.MONO}`, color: s.text3, textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 8 }}>Class Template</label>
                  {CLASS_TEMPLATES.map(tpl => (
                    <button key={tpl.id} onClick={() => setSelectedTemplate(tpl.id)} style={{
                      display: 'block', width: '100%', padding: '12px 14px', borderRadius: 8, marginBottom: 6, textAlign: 'left',
                      border: selectedTemplate === tpl.id ? `2px solid ${s.accent}` : '1px solid rgba(0,0,0,0.04)',
                      background: selectedTemplate === tpl.id ? s.accent + '08' : 'transparent', cursor: 'pointer',
                    }}>
                      <div style={{ font: `500 13px ${s.FONT}`, color: s.text }}>{tpl.name}</div>
                      <div style={{ font: `400 10px ${s.MONO}`, color: s.text3, marginTop: 2 }}>{tpl.cueCount} cues · {tpl.duration}</div>
                    </button>
                  ))}
                </div>

                {generating ? (
                  <div style={{ textAlign: 'center', padding: 20 }}>
                    <ProgressRing progress={genProgress} color={s.accent} />
                    <div style={{ font: `400 12px ${s.FONT}`, color: s.text2, marginTop: 12 }}>{genStep}</div>
                  </div>
                ) : (
                  <button onClick={generateClass} disabled={!selectedTemplate} style={{
                    width: '100%', padding: '14px', borderRadius: 12, border: 'none',
                    background: selectedTemplate ? s.accent : 'rgba(0,0,0,0.1)',
                    color: selectedTemplate ? '#fff' : '#999',
                    font: `600 14px ${s.FONT}`, cursor: selectedTemplate ? 'pointer' : 'not-allowed',
                  }}>Generate Class Audio</button>
                )}
              </>
            )}
          </div>

          {/* How it works */}
          <div style={{ ...cardStyle, padding: 24 }}>
            <div style={{ font: `600 14px ${s.FONT}`, color: s.text, marginBottom: 16 }}>How Voice Clone Works</div>
            {[
              { step: '1', title: 'Record Calibration', desc: 'Instructor reads 24 phrases (~3 min). We capture pitch, cadence, breath patterns, and teaching personality.' },
              { step: '2', title: 'Train Voice Model', desc: 'AI learns the unique vocal fingerprint — not just the sound, but how they teach. Pauses, emphasis, encouragement timing.' },
              { step: '3', title: 'Generate Classes', desc: 'Pick any class template from the Sequencer. The AI generates full audio with natural transitions, countdowns, and form cues.' },
              { step: '4', title: 'Review & Publish', desc: 'Preview the generated class, edit any cues that need tweaking, then publish to your On-Demand library.' },
            ].map(item => (
              <div key={item.step} style={{ display: 'flex', gap: 14, marginBottom: 16 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%', background: s.accent + '15',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  font: `600 14px ${s.FONT}`, color: s.accent, flexShrink: 0,
                }}>{item.step}</div>
                <div>
                  <div style={{ font: `500 13px ${s.FONT}`, color: s.text }}>{item.title}</div>
                  <div style={{ font: `400 12px ${s.FONT}`, color: s.text3, marginTop: 2, lineHeight: 1.5 }}>{item.desc}</div>
                </div>
              </div>
            ))}
            <div style={{
              padding: 14, borderRadius: 10, background: '#FEF3C7', marginTop: 8,
              font: `400 12px ${s.FONT}`, color: '#92400E', lineHeight: 1.5,
            }}>
              <strong>ElevenLabs Integration</strong> — In production, voice models are powered by ElevenLabs Professional Voice Cloning. Demo mode uses browser speech synthesis.
            </div>
          </div>
        </div>
      )}

      {/* Library Tab */}
      {tab === 'library' && (
        <div>
          {generatedClasses.length === 0 ? (
            <div style={{ ...cardStyle, padding: 60, textAlign: 'center' }}>
              <div style={{ font: `400 36px`, marginBottom: 12 }}>🎧</div>
              <div style={{ font: `500 14px ${s.FONT}`, color: s.text }}>No generated classes yet</div>
              <div style={{ font: `400 12px ${s.FONT}`, color: s.text3, marginTop: 4 }}>Create a voice model and generate your first class</div>
              <button onClick={() => setTab('generate')} style={{
                marginTop: 16, padding: '10px 24px', borderRadius: 10, border: 'none',
                background: s.accent, color: '#fff', font: `500 13px ${s.FONT}`, cursor: 'pointer',
              }}>Generate a Class</button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
              {generatedClasses.map(gc => (
                <div key={gc.id} style={{ ...cardStyle, padding: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div>
                      <div style={{ font: `500 14px ${s.FONT}`, color: s.text }}>{gc.template}</div>
                      <div style={{ font: `400 11px ${s.MONO}`, color: s.text3, marginTop: 2 }}>
                        {gc.voice} · {gc.cues} cues · {gc.duration}
                      </div>
                    </div>
                    <div style={{
                      padding: '4px 10px', borderRadius: 6, background: '#DCFCE7',
                      font: `600 11px ${s.MONO}`, color: '#16A34A',
                    }}>{gc.quality}% match</div>
                  </div>
                  <WaveformVis active={false} color={s.accent} width={260} height={28} />
                  <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                    <button onClick={() => {
                      const utter = new SpeechSynthesisUtterance('Inhale to prepare. Exhale, draw your navel to spine, and curl forward. Beautiful. Hold here.');
                      utter.rate = 0.85;
                      window.speechSynthesis?.speak(utter);
                    }} style={{
                      flex: 1, padding: '8px', borderRadius: 8, border: 'none',
                      background: s.accent, color: '#fff', font: `400 11px ${s.FONT}`, cursor: 'pointer',
                    }}>Preview</button>
                    <button style={{
                      flex: 1, padding: '8px', borderRadius: 8, border: '1px solid rgba(0,0,0,0.06)',
                      background: 'rgba(255,255,255,0.6)', font: `400 11px ${s.FONT}`, color: s.text2, cursor: 'pointer',
                    }}>Publish to On-Demand</button>
                  </div>
                  <div style={{ font: `400 10px ${s.MONO}`, color: s.text3, marginTop: 8 }}>
                    Generated {new Date(gc.created).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          div[style*="gridTemplateColumns: '1fr 1fr'"] { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
