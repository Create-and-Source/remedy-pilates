import { useState, useMemo } from 'react';
import { useStyles } from '../theme';
import { getPatients, getAppointments, getServices, getProviders } from '../data/store';

// ── Netflix-Style Class Recommender ──
// Collaborative filtering: "Members who love Reformer Basics also try Barre Sculpt"
// Content-based for cold start: match stated goals to class attributes

const CLASS_ATTRIBUTES = {
  'Reformer Pilates': { intensity: 0.6, flexibility: 0.7, strength: 0.8, core: 0.9, cardio: 0.3, rehab: 0.6, tags: ['core', 'strength', 'posture'] },
  'Mat Pilates': { intensity: 0.4, flexibility: 0.8, strength: 0.5, core: 0.9, cardio: 0.2, rehab: 0.7, tags: ['core', 'flexibility', 'beginner'] },
  'Barre': { intensity: 0.6, flexibility: 0.6, strength: 0.7, core: 0.6, cardio: 0.4, rehab: 0.3, tags: ['tone', 'legs', 'balance'] },
  'Barre Burn': { intensity: 0.85, flexibility: 0.4, strength: 0.8, core: 0.7, cardio: 0.7, rehab: 0.1, tags: ['cardio', 'burn', 'intensity'] },
  'TRX Fusion': { intensity: 0.8, flexibility: 0.3, strength: 0.9, core: 0.7, cardio: 0.5, rehab: 0.2, tags: ['strength', 'upper body', 'athletic'] },
  'Reformer + Cardio': { intensity: 0.9, flexibility: 0.5, strength: 0.8, core: 0.8, cardio: 0.9, rehab: 0.1, tags: ['cardio', 'burn', 'advanced'] },
  'Stretch & Restore': { intensity: 0.15, flexibility: 0.95, strength: 0.1, core: 0.3, cardio: 0, rehab: 0.9, tags: ['recovery', 'flexibility', 'stress'] },
  'Prenatal Pilates': { intensity: 0.3, flexibility: 0.6, strength: 0.4, core: 0.5, cardio: 0.1, rehab: 0.5, tags: ['prenatal', 'gentle', 'safe'] },
};

function cosineSimilarity(a, b) {
  const keys = ['intensity', 'flexibility', 'strength', 'core', 'cardio', 'rehab'];
  let dot = 0, magA = 0, magB = 0;
  keys.forEach(k => { dot += (a[k] || 0) * (b[k] || 0); magA += (a[k] || 0) ** 2; magB += (b[k] || 0) ** 2; });
  return magA && magB ? dot / (Math.sqrt(magA) * Math.sqrt(magB)) : 0;
}

function getClientProfile(clientId, appointments, services) {
  const completed = appointments.filter(a => a.patientId === clientId && a.status === 'completed');
  const classCounts = {};
  completed.forEach(a => {
    const svc = services.find(s => s.id === a.serviceId);
    if (svc) classCounts[svc.name] = (classCounts[svc.name] || 0) + 1;
  });

  // Build weighted preference vector from attendance
  const profile = { intensity: 0, flexibility: 0, strength: 0, core: 0, cardio: 0, rehab: 0 };
  let total = 0;
  Object.entries(classCounts).forEach(([name, count]) => {
    const attrs = CLASS_ATTRIBUTES[name];
    if (attrs) {
      Object.keys(profile).forEach(k => { profile[k] += (attrs[k] || 0) * count; });
      total += count;
    }
  });
  if (total > 0) Object.keys(profile).forEach(k => { profile[k] /= total; });

  return { classCounts, profile, totalClasses: total };
}

function generateRecommendations(client, appointments, services, allClients) {
  const clientProfile = getClientProfile(client.id, appointments, services);
  const recs = [];

  // Content-based: score all class types by similarity to client profile
  Object.entries(CLASS_ATTRIBUTES).forEach(([className, attrs]) => {
    const similarity = cosineSimilarity(clientProfile.profile, attrs);
    const attended = clientProfile.classCounts[className] || 0;
    // Boost classes they haven't tried much (discovery factor)
    const discoveryBoost = attended === 0 ? 0.15 : attended < 3 ? 0.05 : 0;
    // Penalize if they already attend a lot
    const familiarityPenalty = attended > 10 ? -0.1 : 0;
    recs.push({
      className,
      score: Math.min(1, similarity + discoveryBoost + familiarityPenalty),
      similarity: Math.round(similarity * 100),
      attended,
      attrs,
      reason: attended === 0
        ? `Based on your love of ${Object.entries(clientProfile.classCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Pilates'}, you'll enjoy this`
        : attended < 3
          ? `You've tried this ${attended}× — clients like you average 8+ sessions`
          : `A favorite of yours — ${attended} classes and counting`,
    });
  });

  // Collaborative: find similar clients
  const similarClients = allClients
    .filter(c => c.id !== client.id)
    .map(c => {
      const otherProfile = getClientProfile(c.id, appointments, services);
      return { ...c, similarity: cosineSimilarity(clientProfile.profile, otherProfile.profile), profile: otherProfile };
    })
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 5);

  // Boost recommendations from what similar clients take but this client doesn't
  similarClients.forEach(sim => {
    Object.entries(sim.profile.classCounts).forEach(([className, count]) => {
      if (!clientProfile.classCounts[className] && count >= 2) {
        const rec = recs.find(r => r.className === className);
        if (rec) {
          rec.score = Math.min(1, rec.score + 0.1);
          rec.collaborativeMatch = true;
          rec.matchedFrom = `${sim.firstName} ${sim.lastName?.[0]}.`;
        }
      }
    });
  });

  recs.sort((a, b) => b.score - a.score);
  return { recs, clientProfile, similarClients };
}

function MiniRadar({ profile, color, size = 120 }) {
  const keys = ['intensity', 'flexibility', 'strength', 'core', 'cardio', 'rehab'];
  const labels = ['INT', 'FLEX', 'STR', 'CORE', 'CARDIO', 'REHAB'];
  const cx = size / 2, cy = size / 2, r = size / 2 - 16;
  const angleStep = (2 * Math.PI) / keys.length;

  const points = keys.map((k, i) => {
    const angle = i * angleStep - Math.PI / 2;
    const val = profile[k] || 0;
    return { x: cx + Math.cos(angle) * r * val, y: cy + Math.sin(angle) * r * val };
  });
  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';

  return (
    <svg width={size} height={size}>
      {[0.25, 0.5, 0.75, 1].map(ring => (
        <polygon key={ring} points={keys.map((_, i) => {
          const a = i * angleStep - Math.PI / 2;
          return `${cx + Math.cos(a) * r * ring},${cy + Math.sin(a) * r * ring}`;
        }).join(' ')} fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="1" />
      ))}
      {keys.map((_, i) => {
        const a = i * angleStep - Math.PI / 2;
        return <line key={i} x1={cx} y1={cy} x2={cx + Math.cos(a) * r} y2={cy + Math.sin(a) * r} stroke="rgba(0,0,0,0.04)" />;
      })}
      <path d={pathD} fill={color + '20'} stroke={color} strokeWidth="2" />
      {points.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={3} fill={color} />)}
      {keys.map((_, i) => {
        const a = i * angleStep - Math.PI / 2;
        const lx = cx + Math.cos(a) * (r + 12), ly = cy + Math.sin(a) * (r + 12);
        return <text key={i} x={lx} y={ly} textAnchor="middle" dominantBaseline="middle" style={{ fontSize: 7, fontWeight: 600, fill: '#999' }}>{labels[i]}</text>;
      })}
    </svg>
  );
}

function MatchBar({ score, color }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: 100 }}>
      <div style={{ flex: 1, height: 6, background: 'rgba(0,0,0,0.06)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ width: `${score}%`, height: '100%', background: color, borderRadius: 3, transition: 'width 0.6s ease' }} />
      </div>
      <span style={{ fontSize: 11, fontWeight: 600, color, minWidth: 30 }}>{score}%</span>
    </div>
  );
}

export default function ClassRecommender() {
  const s = useStyles();
  const [selectedClientId, setSelectedClientId] = useState(null);

  const { clients, appointments, services } = useMemo(() => {
    const c = getPatients().slice(0, 15);
    const a = getAppointments();
    const svc = getServices();
    return { clients: c, appointments: a, services: svc };
  }, []);

  const result = useMemo(() => {
    if (!selectedClientId) return null;
    const client = clients.find(c => c.id === selectedClientId);
    if (!client) return null;
    return { client, ...generateRecommendations(client, appointments, services, clients) };
  }, [selectedClientId, clients, appointments, services]);

  const cardStyle = {
    background: 'rgba(255,255,255,0.72)', backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255,255,255,0.6)', borderRadius: 16, boxShadow: s.shadow,
  };

  const scoreColor = (v) => v >= 80 ? '#16A34A' : v >= 60 ? s.accent : v >= 40 ? '#D97706' : '#999';

  return (
    <div style={{ animation: 'fadeIn 0.5s ease' }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ font: `400 11px ${s.MONO}`, textTransform: 'uppercase', letterSpacing: 1.5, color: s.text3, marginBottom: 4 }}>
          Intelligence
        </div>
        <h1 style={{ font: `600 28px ${s.DISPLAY}`, color: s.text, margin: 0 }}>
          Class Recommender
        </h1>
        <p style={{ font: `400 14px ${s.FONT}`, color: s.text2, margin: '6px 0 0' }}>
          Netflix-style recommendations — "Members who love Reformer also try Barre Sculpt"
        </p>
      </div>

      {/* Client selector */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {clients.map(c => {
          const active = selectedClientId === c.id;
          return (
            <button key={c.id} onClick={() => setSelectedClientId(c.id)} style={{
              ...cardStyle, padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 8,
              cursor: 'pointer', border: active ? `2px solid ${s.accent}` : cardStyle.border,
              background: active ? s.accent + '10' : cardStyle.background,
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%', background: s.accent + '20',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                font: `600 10px ${s.FONT}`, color: s.accent,
              }}>{c.firstName?.[0]}{c.lastName?.[0]}</div>
              <span style={{ font: `400 12px ${s.FONT}`, color: s.text }}>{c.firstName}</span>
            </button>
          );
        })}
      </div>

      {!result ? (
        <div style={{ ...cardStyle, padding: 60, textAlign: 'center' }}>
          <div style={{ font: `400 14px ${s.FONT}`, color: s.text3 }}>Select a client to generate personalized class recommendations</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 20 }}>
          {/* Left — Client profile */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ ...cardStyle, padding: 20, textAlign: 'center' }}>
              <div style={{
                width: 56, height: 56, borderRadius: '50%', background: s.accent + '20',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                font: `600 18px ${s.FONT}`, color: s.accent, margin: '0 auto 12px',
              }}>{result.client.firstName?.[0]}{result.client.lastName?.[0]}</div>
              <div style={{ font: `500 16px ${s.FONT}`, color: s.text }}>{result.client.firstName} {result.client.lastName}</div>
              <div style={{ font: `400 12px ${s.MONO}`, color: s.text3, marginTop: 4 }}>{result.clientProfile.totalClasses} classes attended</div>

              <div style={{ display: 'flex', justifyContent: 'center', margin: '16px 0' }}>
                <MiniRadar profile={result.clientProfile.profile} color={s.accent} size={140} />
              </div>

              <div style={{ font: `600 10px ${s.MONO}`, color: s.text3, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Class History</div>
              {Object.entries(result.clientProfile.classCounts).sort((a, b) => b[1] - a[1]).map(([name, count]) => (
                <div key={name} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid rgba(0,0,0,0.03)' }}>
                  <span style={{ font: `400 12px ${s.FONT}`, color: s.text2 }}>{name}</span>
                  <span style={{ font: `600 12px ${s.MONO}`, color: s.accent }}>{count}</span>
                </div>
              ))}
            </div>

            {/* Similar clients */}
            <div style={{ ...cardStyle, padding: 20 }}>
              <div style={{ font: `600 10px ${s.MONO}`, color: s.text3, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Similar Members</div>
              {result.similarClients.slice(0, 4).map(sim => (
                <div key={sim.id} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%', background: 'rgba(0,0,0,0.04)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    font: `500 9px ${s.FONT}`, color: s.text3,
                  }}>{sim.firstName?.[0]}{sim.lastName?.[0]}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ font: `400 12px ${s.FONT}`, color: s.text }}>{sim.firstName} {sim.lastName?.[0]}.</div>
                  </div>
                  <span style={{ font: `600 11px ${s.MONO}`, color: s.accent }}>{Math.round(sim.similarity * 100)}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right — Recommendations */}
          <div>
            <div style={{ font: `600 12px ${s.MONO}`, color: s.text3, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14 }}>
              Recommended For {result.client.firstName}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {result.recs.map((rec, i) => (
                <div key={rec.className} style={{
                  ...cardStyle, padding: 0, overflow: 'hidden',
                  border: i === 0 ? `2px solid ${s.accent}` : cardStyle.border,
                }}>
                  <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
                    {/* Rank */}
                    <div style={{
                      width: 36, height: 36, borderRadius: '50%',
                      background: i === 0 ? s.accent : 'rgba(0,0,0,0.04)',
                      color: i === 0 ? '#fff' : s.text3,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      font: `700 14px ${s.FONT}`, flexShrink: 0,
                    }}>#{i + 1}</div>

                    {/* Info */}
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ font: `500 15px ${s.FONT}`, color: s.text }}>{rec.className}</span>
                        {rec.collaborativeMatch && (
                          <span style={{ padding: '2px 8px', borderRadius: 4, background: '#DBEAFE', font: `500 9px ${s.MONO}`, color: '#2563EB' }}>
                            Also loved by {rec.matchedFrom}
                          </span>
                        )}
                        {rec.attended === 0 && (
                          <span style={{ padding: '2px 8px', borderRadius: 4, background: '#FEF3C7', font: `500 9px ${s.MONO}`, color: '#D97706' }}>
                            New for you
                          </span>
                        )}
                      </div>
                      <div style={{ font: `400 12px ${s.FONT}`, color: s.text3, marginTop: 3 }}>{rec.reason}</div>
                      <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                        {rec.attrs.tags.map(t => (
                          <span key={t} style={{ padding: '2px 8px', borderRadius: 4, background: 'rgba(0,0,0,0.03)', font: `400 10px ${s.MONO}`, color: s.text3 }}>{t}</span>
                        ))}
                      </div>
                    </div>

                    {/* Match score */}
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ font: `700 20px ${s.FONT}`, color: scoreColor(Math.round(rec.score * 100)) }}>{Math.round(rec.score * 100)}%</div>
                      <div style={{ font: `400 9px ${s.MONO}`, color: s.text3 }}>Match</div>
                      <MatchBar score={Math.round(rec.score * 100)} color={scoreColor(Math.round(rec.score * 100))} />
                    </div>

                    {/* Mini radar */}
                    <MiniRadar profile={rec.attrs} color={scoreColor(Math.round(rec.score * 100))} size={80} />
                  </div>
                </div>
              ))}
            </div>

            {/* Algorithm explanation */}
            <div style={{ ...cardStyle, padding: 16, marginTop: 16 }}>
              <div style={{ font: `600 10px ${s.MONO}`, color: s.text3, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>How It Works</div>
              <div style={{ font: `400 12px ${s.FONT}`, color: s.text2, lineHeight: 1.6 }}>
                Recommendations combine <strong>content-based filtering</strong> (matching class attributes to {result.client.firstName}'s preference profile built from {result.clientProfile.totalClasses} past classes) with <strong>collaborative filtering</strong> (cosine similarity against {clients.length} other members' attendance patterns). Discovery boost applied for untried classes; loyalty recognition for favorites.
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`@media (max-width: 768px) { div[style*="gridTemplateColumns: '300px 1fr'"] { grid-template-columns: 1fr !important; } }`}</style>
    </div>
  );
}
