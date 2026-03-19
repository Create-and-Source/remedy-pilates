// Body Composition Lab — STYKU 3D + InBody Analysis
import { useState, useEffect } from 'react';
import { useStyles } from '../theme';
import { getPatients, subscribe } from '../data/store';
import { getScans as getStykuScans, getAllScans as getAllStykuScans, seedStykuData } from '../api/styku';
import { getScans as getInBodyScans, getAllScans as getAllInBodyScans, seedInBodyData } from '../api/inbody';

const STYKU_CONNECTED = !!(import.meta.env.VITE_STYKU_API_URL && import.meta.env.VITE_STYKU_API_KEY);
const INBODY_CONNECTED = !!(import.meta.env.VITE_INBODY_API_URL && import.meta.env.VITE_INBODY_API_KEY);

const ANIM_ID = 'body-scans-anims';
if (!document.getElementById(ANIM_ID)) {
  const s = document.createElement('style');
  s.id = ANIM_ID;
  s.textContent = `
    @keyframes bsFadeUp { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
    @keyframes bsBarGrow { from { width: 0; } to { width: var(--bar-w); } }
    .bs-card-hover:hover { transform: translateY(-2px) !important; box-shadow: 0 10px 36px rgba(0,0,0,0.09) !important; }
  `;
  document.head.appendChild(s);
}

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ── Tiny inline sparkline (div-based bars) ──────────────────────────────────
function MiniBarChart({ values, accent, labels }) {
  if (!values || values.length === 0) return null;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 48 }}>
      {values.map((v, i) => {
        const pct = Math.max(8, ((v - min) / range) * 100);
        const isLast = i === values.length - 1;
        return (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
            <div title={`${labels?.[i] || ''}: ${v}`} style={{
              width: '100%', height: `${pct}%`,
              background: isLast ? accent : `${accent}55`,
              borderRadius: '3px 3px 0 0',
              transition: 'height 0.6s cubic-bezier(0.16,1,0.3,1)',
              minHeight: 4,
            }} />
            {labels && (
              <span style={{ fontSize: 8, color: '#aaa', whiteSpace: 'nowrap', overflow: 'hidden', maxWidth: '100%', textOverflow: 'ellipsis' }}>
                {labels[i]}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Progress trend sparkline (SVG line) ────────────────────────────────────
function TrendLine({ values, accent, inverse = false }) {
  if (!values || values.length < 2) return <span style={{ fontSize: 11, color: '#aaa' }}>—</span>;
  const delta = values[values.length - 1] - values[0];
  const improving = inverse ? delta < 0 : delta > 0;
  const color = improving ? '#16A34A' : delta === 0 ? '#aaa' : '#DC2626';
  const arrow = improving ? '↓' : delta === 0 ? '→' : '↑';
  return (
    <span style={{ fontSize: 12, fontWeight: 600, color }}>
      {arrow} {Math.abs(delta).toFixed(1)}
    </span>
  );
}

// ── Connection status badge ─────────────────────────────────────────────────
function ConnectionBadge({ connected, label, s }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px',
      background: connected ? '#F0FDF4' : 'rgba(0,0,0,0.03)',
      border: `1px solid ${connected ? '#86EFAC' : 'rgba(0,0,0,0.08)'}`,
      borderRadius: 100, fontSize: 12, fontWeight: 500,
      color: connected ? '#16A34A' : '#999',
    }}>
      <span style={{
        width: 7, height: 7, borderRadius: '50%',
        background: connected ? '#16A34A' : '#ccc',
        flexShrink: 0,
      }} />
      {label}
      {!connected && (
        <button style={{
          marginLeft: 4, padding: '2px 10px', borderRadius: 100, border: `1px solid ${s.accent}44`,
          background: 'white', color: s.accent, fontSize: 11, cursor: 'pointer', fontWeight: 500,
        }}>Connect</button>
      )}
    </div>
  );
}

// ── Posture score indicator ─────────────────────────────────────────────────
function PostureScore({ score }) {
  const color = score >= 88 ? '#16A34A' : score >= 72 ? '#D97706' : '#DC2626';
  const label = score >= 88 ? 'Excellent' : score >= 72 ? 'Good' : 'Needs Work';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <div style={{
        width: 52, height: 52, borderRadius: '50%',
        background: `conic-gradient(${color} ${score * 3.6}deg, #eee ${score * 3.6}deg)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative',
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: '50%', background: 'white',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, fontWeight: 700, color,
        }}>{score}</div>
      </div>
      <span style={{ fontSize: 10, color, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</span>
    </div>
  );
}

// ── Segmental adequacy bar (InBody style) ──────────────────────────────────
function SegmentalBar({ label, massKg, adequacyPct, accent }) {
  const pct = Math.min(adequacyPct, 120);
  const color = adequacyPct >= 100 ? '#16A34A' : adequacyPct >= 90 ? '#D97706' : '#DC2626';
  const barW = Math.min(100, pct);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0' }}>
      <div style={{ width: 72, fontSize: 11, color: '#666', textAlign: 'right', flexShrink: 0 }}>{label}</div>
      <div style={{ flex: 1, height: 10, background: '#f0f0f0', borderRadius: 5, overflow: 'hidden', position: 'relative' }}>
        <div style={{
          width: `${barW}%`, height: '100%', background: color,
          borderRadius: 5, transition: 'width 0.7s cubic-bezier(0.16,1,0.3,1)',
        }} />
        {/* 100% marker */}
        <div style={{
          position: 'absolute', left: `${Math.min(100, 100)}%`, top: 0, bottom: 0,
          width: 1.5, background: 'rgba(0,0,0,0.15)',
        }} />
      </div>
      <div style={{ width: 52, fontSize: 11, color, fontWeight: 600, flexShrink: 0 }}>
        {adequacyPct}% · {massKg}kg
      </div>
    </div>
  );
}

// ── Body composition stack bar ─────────────────────────────────────────────
function CompositionStack({ water, protein, minerals, fat, total }) {
  if (!total) return null;
  const pct = (v) => `${Math.round((v / total) * 100)}%`;
  const segments = [
    { label: 'Water', value: water, color: '#60A5FA' },
    { label: 'Protein', value: protein, color: '#34D399' },
    { label: 'Minerals', value: minerals, color: '#FBBF24' },
    { label: 'Body Fat', value: fat, color: '#F87171' },
  ];
  return (
    <div>
      <div style={{ display: 'flex', height: 20, borderRadius: 6, overflow: 'hidden', marginBottom: 10 }}>
        {segments.map(seg => (
          <div key={seg.label} title={`${seg.label}: ${seg.value?.toFixed(1)} kg (${pct(seg.value)})`}
            style={{ width: pct(seg.value), background: seg.color, transition: 'width 0.6s ease' }} />
        ))}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 16px' }}>
        {segments.map(seg => (
          <div key={seg.label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11 }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: seg.color, display: 'inline-block' }} />
            <span style={{ color: '#666' }}>{seg.label}</span>
            <span style={{ fontWeight: 600, color: '#333' }}>{seg.value?.toFixed(1)} kg</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main page ───────────────────────────────────────────────────────────────
export default function BodyScans() {
  const s = useStyles();
  const [, setTick] = useState(0);
  const [activeTab, setActiveTab] = useState('styku');
  const [selectedClientId, setSelectedClientId] = useState('');
  const [stykuScans, setStykuScans] = useState([]);
  const [inbodyScans, setInbodyScans] = useState([]);
  const [expandedScan, setExpandedScan] = useState(null);

  useEffect(() => subscribe(() => setTick(t => t + 1)), []);

  // Seed demo data on first load
  useEffect(() => {
    const clients = getPatients();
    seedStykuData(clients);
    seedInBodyData(clients);
    // Default to first client that has scans
    const allStyku = getAllStykuScans();
    if (allStyku.length > 0 && !selectedClientId) {
      setSelectedClientId(allStyku[0].clientId);
    }
  }, []);

  // Load scans for selected client
  useEffect(() => {
    if (!selectedClientId) return;
    getStykuScans(selectedClientId).then(setStykuScans).catch(() => setStykuScans([]));
    getInBodyScans(selectedClientId).then(setInbodyScans).catch(() => setInbodyScans([]));
  }, [selectedClientId]);

  const clients = getPatients();
  // Only clients with at least one scan
  const allStykuIds = new Set(getAllStykuScans().map(s => s.clientId));
  const allInBodyIds = new Set(getAllInBodyScans().map(s => s.clientId));
  const scannedClients = clients.filter(c => allStykuIds.has(c.id) || allInBodyIds.has(c.id));

  // Sorted by date (oldest first for charts)
  const sortedStyku = [...stykuScans].sort((a, b) => a.scannedAt.localeCompare(b.scannedAt));
  const sortedInBody = [...inbodyScans].sort((a, b) => a.measurementDate.localeCompare(b.measurementDate));

  const latestStyku = sortedStyku[sortedStyku.length - 1];
  const latestInBody = sortedInBody[sortedInBody.length - 1];

  // Chart data arrays
  const stykuDates = sortedStyku.map(s => fmtDate(s.scannedAt).replace(', 2026', '').replace(', 2025', ''));
  const stykuBF = sortedStyku.map(s => s.bodyFatPercent);
  const stykuWaist = sortedStyku.map(s => s.circumferencesCm?.naturalWaist);
  const stykuPosture = sortedStyku.map(s => s.posture?.postureScore);
  const inbodyDates = sortedInBody.map(s => fmtDate(s.measurementDate).replace(', 2026', '').replace(', 2025', ''));
  const inbodySMM = sortedInBody.map(s => s.bodyComposition?.SMM);
  const inbodyBF = sortedInBody.map(s => s.bodyComposition?.PBF);
  const inbodyScore = sortedInBody.map(s => s.bodyComposition?.inBodyScore);

  const glass = {
    background: 'rgba(255,255,255,0.65)',
    backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid rgba(255,255,255,0.65)',
    borderRadius: 18,
    boxShadow: '0 4px 24px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)',
  };

  const kpiCard = (label, value, unit, delta, deltaInverse, idx) => (
    <div key={label} className="bs-card-hover" style={{
      ...glass, padding: '20px 22px',
      animation: `bsFadeUp 0.4s cubic-bezier(0.16,1,0.3,1) ${idx * 70}ms backwards`,
      transition: 'all 0.3s cubic-bezier(0.16,1,0.3,1)',
      cursor: 'default',
    }}>
      <div style={{ fontFamily: s.MONO, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.4, color: s.text3, marginBottom: 10 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 6 }}>
        <span style={{ fontSize: 28, fontWeight: 700, color: s.text, letterSpacing: '-0.5px', fontFamily: s.FONT }}>
          {value ?? '—'}
        </span>
        {unit && <span style={{ fontSize: 13, color: s.text3, fontFamily: s.FONT }}>{unit}</span>}
      </div>
      {delta !== null && <div style={{ fontSize: 12 }}>{delta}</div>}
    </div>
  );

  return (
    <div style={{ animation: 'bsFadeUp 0.4s cubic-bezier(0.16,1,0.3,1) both' }}>

      {/* ── Header ── */}
      <div style={{
        ...glass,
        padding: '24px 28px', marginBottom: 24,
        background: `linear-gradient(135deg, rgba(255,255,255,0.75) 0%, ${s.accentLight} 100%)`,
        borderLeft: `3px solid ${s.accent}`,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16,
      }}>
        <div>
          <h1 style={{ font: `700 22px ${s.FONT}`, color: s.text, margin: 0, letterSpacing: '-0.3px' }}>
            Body Composition Lab
          </h1>
          <p style={{ font: `400 13px ${s.FONT}`, color: s.text2, margin: '4px 0 0' }}>
            STYKU 3D Scans · InBody Analysis
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <ConnectionBadge connected={STYKU_CONNECTED} label="STYKU" s={s} />
          <ConnectionBadge connected={INBODY_CONNECTED} label="InBody 570" s={s} />
        </div>
      </div>

      {/* ── Client Selector ── */}
      <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
        <label style={s.label}>Client</label>
        <select
          value={selectedClientId}
          onChange={e => setSelectedClientId(e.target.value)}
          style={{
            ...s.input, width: 'auto', minWidth: 220, paddingRight: 36,
            appearance: 'none', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23999' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center',
          }}
        >
          <option value="">Select a client…</option>
          {scannedClients.map(c => (
            <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>
          ))}
        </select>
        {selectedClientId && (
          <span style={{ fontFamily: s.MONO, fontSize: 11, color: s.text3 }}>
            {stykuScans.length} STYKU · {inbodyScans.length} InBody
          </span>
        )}
      </div>

      {!selectedClientId ? (
        <div style={{ ...glass, padding: 56, textAlign: 'center', color: s.text3, font: `400 14px ${s.FONT}` }}>
          Select a client above to view body composition data
        </div>
      ) : (
        <>
          {/* ── KPI Overview Cards ── */}
          <div className="bs-kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14, marginBottom: 24 }}>
            {kpiCard(
              'Body Fat %',
              latestStyku?.bodyFatPercent ?? latestInBody?.bodyComposition?.PBF,
              '%',
              <TrendLine values={stykuBF.length >= 2 ? stykuBF : inbodyBF} accent={s.accent} inverse />,
              true, 0,
            )}
            {kpiCard(
              'Lean Mass',
              latestStyku?.leanMassKg ?? latestInBody?.bodyComposition?.leanBodyMass,
              'kg',
              <TrendLine values={sortedStyku.map(s => s.leanMassKg)} accent={s.accent} />,
              false, 1,
            )}
            {kpiCard(
              'Posture Score',
              latestStyku?.posture?.postureScore,
              '/ 100',
              <TrendLine values={stykuPosture} accent={s.accent} />,
              false, 2,
            )}
            {kpiCard(
              'InBody Score',
              latestInBody?.bodyComposition?.inBodyScore,
              '/ 100',
              <TrendLine values={inbodyScore} accent={s.accent} />,
              false, 3,
            )}
            {kpiCard(
              'Visceral Fat',
              latestInBody?.bodyComposition?.visceralFatLevel,
              'lvl',
              <TrendLine values={sortedInBody.map(s => s.bodyComposition?.visceralFatLevel)} accent={s.accent} inverse />,
              true, 4,
            )}
          </div>

          {/* ── Tab Bar ── */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: 'rgba(255,255,255,0.5)', borderRadius: 12, padding: 4, width: 'fit-content', border: '1px solid rgba(0,0,0,0.05)' }}>
            {['styku', 'inbody'].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} style={{
                padding: '8px 22px', borderRadius: 9, border: 'none', cursor: 'pointer',
                font: `500 13px ${s.FONT}`,
                background: activeTab === tab ? s.accent : 'transparent',
                color: activeTab === tab ? s.accentText : s.text2,
                transition: 'all 0.2s ease',
                boxShadow: activeTab === tab ? `0 2px 10px ${s.accent}33` : 'none',
              }}>
                {tab === 'styku' ? 'STYKU 3D Scans' : 'InBody Analysis'}
              </button>
            ))}
          </div>

          {/* ══════════════════════════════════════════════════════════════════ */}
          {/* STYKU TAB                                                         */}
          {/* ══════════════════════════════════════════════════════════════════ */}
          {activeTab === 'styku' && (
            <div>
              {sortedStyku.length === 0 ? (
                <div style={{ ...glass, padding: 40, textAlign: 'center', color: s.text3, font: `400 13px ${s.FONT}` }}>
                  No STYKU scans found for this client
                </div>
              ) : (
                <div className="bs-styku-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

                  {/* Progress Charts */}
                  <div style={{ ...glass, padding: '22px 24px', animation: 'bsFadeUp 0.4s ease 100ms backwards' }}>
                    <div style={{ font: `600 14px ${s.FONT}`, color: s.text, marginBottom: 16 }}>Body Fat % Progress</div>
                    <MiniBarChart values={stykuBF} accent={s.accent} labels={stykuDates} />
                    {stykuBF.length >= 2 && (
                      <div style={{ marginTop: 12, fontFamily: s.MONO, fontSize: 11, color: s.text3 }}>
                        Change: {(stykuBF[stykuBF.length - 1] - stykuBF[0]).toFixed(1)}% since baseline
                      </div>
                    )}
                  </div>

                  <div style={{ ...glass, padding: '22px 24px', animation: 'bsFadeUp 0.4s ease 150ms backwards' }}>
                    <div style={{ font: `600 14px ${s.FONT}`, color: s.text, marginBottom: 16 }}>Posture Score Progress</div>
                    <MiniBarChart values={stykuPosture} accent={s.accent} labels={stykuDates} />
                    {stykuPosture.length >= 2 && (
                      <div style={{ marginTop: 12, fontFamily: s.MONO, fontSize: 11, color: '#16A34A' }}>
                        +{stykuPosture[stykuPosture.length - 1] - stykuPosture[0]} pts since baseline
                      </div>
                    )}
                  </div>

                  {/* Waist circumference trend */}
                  <div style={{ ...glass, padding: '22px 24px', animation: 'bsFadeUp 0.4s ease 180ms backwards' }}>
                    <div style={{ font: `600 14px ${s.FONT}`, color: s.text, marginBottom: 16 }}>Natural Waist (cm)</div>
                    <MiniBarChart values={stykuWaist} accent={s.accent} labels={stykuDates} />
                    {stykuWaist.length >= 2 && (
                      <div style={{ marginTop: 12, fontFamily: s.MONO, fontSize: 11, color: '#16A34A' }}>
                        {(stykuWaist[stykuWaist.length - 1] - stykuWaist[0]).toFixed(1)} cm since baseline
                      </div>
                    )}
                  </div>

                  {/* Latest posture analysis */}
                  {latestStyku?.posture && (
                    <div style={{ ...glass, padding: '22px 24px', animation: 'bsFadeUp 0.4s ease 200ms backwards' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                        <span style={{ font: `600 14px ${s.FONT}`, color: s.text }}>Posture Analysis</span>
                        <PostureScore score={latestStyku.posture.postureScore} />
                      </div>
                      {[
                        { label: 'Anterior Sway', val: latestStyku.posture.anteriorSwayDeg, unit: '°', threshold: 2 },
                        { label: 'Lateral Sway', val: latestStyku.posture.lateralSwayDeg, unit: '°', threshold: 1 },
                        { label: 'Shoulder Tilt', val: latestStyku.posture.shoulderTiltDeg, unit: '°', threshold: 1.5 },
                        { label: 'Hip Tilt', val: latestStyku.posture.hipTiltDeg, unit: '°', threshold: 1 },
                      ].map(row => {
                        const color = row.val <= row.threshold ? '#16A34A' : row.val <= row.threshold * 1.5 ? '#D97706' : '#DC2626';
                        return (
                          <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                            <span style={{ font: `400 13px ${s.FONT}`, color: s.text2 }}>{row.label}</span>
                            <span style={{ font: `600 13px ${s.MONO}`, color }}>
                              {row.val}{row.unit}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Circumference measurements */}
                  {latestStyku?.circumferencesCm && (
                    <div style={{ ...glass, padding: '22px 24px', gridColumn: '1 / -1', animation: 'bsFadeUp 0.4s ease 220ms backwards' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <span style={{ font: `600 14px ${s.FONT}`, color: s.text }}>Circumference Measurements</span>
                        <span style={{ fontFamily: s.MONO, fontSize: 11, color: s.text3 }}>{fmtDate(latestStyku.scannedAt)}</span>
                      </div>
                      <div className="bs-circ-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                        {Object.entries(latestStyku.circumferencesCm).map(([key, val]) => {
                          const label = key.replace(/([A-Z])/g, ' $1').replace(/Left|Right/, m => m === 'Left' ? 'L' : 'R').trim();
                          // Find baseline for comparison
                          const baseline = sortedStyku[0]?.circumferencesCm?.[key];
                          const delta = baseline != null ? val - baseline : null;
                          return (
                            <div key={key} style={{
                              padding: '12px 14px', borderRadius: 12,
                              background: 'rgba(255,255,255,0.6)', border: '1px solid rgba(0,0,0,0.04)',
                            }}>
                              <div style={{ fontFamily: s.MONO, fontSize: 9, textTransform: 'uppercase', letterSpacing: 1.2, color: s.text3, marginBottom: 6 }}>{label}</div>
                              <div style={{ font: `600 18px ${s.FONT}`, color: s.text }}>{val} <span style={{ fontSize: 11, fontWeight: 400, color: s.text3 }}>cm</span></div>
                              {delta != null && delta !== 0 && (
                                <div style={{ fontSize: 11, color: delta < 0 ? '#16A34A' : '#DC2626', fontWeight: 500, marginTop: 2 }}>
                                  {delta > 0 ? '+' : ''}{delta.toFixed(1)} from baseline
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════ */}
          {/* INBODY TAB                                                        */}
          {/* ══════════════════════════════════════════════════════════════════ */}
          {activeTab === 'inbody' && (
            <div>
              {sortedInBody.length === 0 ? (
                <div style={{ ...glass, padding: 40, textAlign: 'center', color: s.text3, font: `400 13px ${s.FONT}` }}>
                  No InBody scans found for this client
                </div>
              ) : (
                <div className="bs-inbody-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

                  {/* SMM trend */}
                  <div style={{ ...glass, padding: '22px 24px', animation: 'bsFadeUp 0.4s ease 100ms backwards' }}>
                    <div style={{ font: `600 14px ${s.FONT}`, color: s.text, marginBottom: 16 }}>Skeletal Muscle Mass (kg)</div>
                    <MiniBarChart values={inbodySMM} accent={s.accent} labels={inbodyDates} />
                    {inbodySMM.length >= 2 && (
                      <div style={{ marginTop: 12, fontFamily: s.MONO, fontSize: 11, color: '#16A34A' }}>
                        +{(inbodySMM[inbodySMM.length - 1] - inbodySMM[0]).toFixed(1)} kg muscle gained
                      </div>
                    )}
                  </div>

                  {/* Body fat % trend */}
                  <div style={{ ...glass, padding: '22px 24px', animation: 'bsFadeUp 0.4s ease 140ms backwards' }}>
                    <div style={{ font: `600 14px ${s.FONT}`, color: s.text, marginBottom: 16 }}>Body Fat % Progress</div>
                    <MiniBarChart values={inbodyBF} accent={s.accent} labels={inbodyDates} />
                    {inbodyBF.length >= 2 && (
                      <div style={{ marginTop: 12, fontFamily: s.MONO, fontSize: 11, color: '#16A34A' }}>
                        {(inbodyBF[inbodyBF.length - 1] - inbodyBF[0]).toFixed(1)}% change
                      </div>
                    )}
                  </div>

                  {/* Body composition breakdown */}
                  {latestInBody?.bodyComposition && (
                    <div style={{ ...glass, padding: '22px 24px', animation: 'bsFadeUp 0.4s ease 160ms backwards' }}>
                      <div style={{ font: `600 14px ${s.FONT}`, color: s.text, marginBottom: 16 }}>Body Composition</div>
                      <CompositionStack
                        water={latestInBody.bodyComposition.TBW}
                        protein={latestInBody.bodyComposition.protein}
                        minerals={latestInBody.bodyComposition.minerals}
                        fat={latestInBody.bodyComposition.bodyFatMass}
                        total={latestInBody.bodyComposition.weight}
                      />
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 16 }}>
                        {[
                          { l: 'Weight', v: `${latestInBody.bodyComposition.weight} kg` },
                          { l: 'BMI', v: latestInBody.bodyComposition.BMI },
                          { l: 'BMR', v: `${latestInBody.bodyComposition.BMR} kcal` },
                          { l: 'ECW/TBW', v: latestInBody.bodyComposition.ECW_TBW_ratio },
                        ].map(item => (
                          <div key={item.l} style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.6)', borderRadius: 8, border: '1px solid rgba(0,0,0,0.04)' }}>
                            <div style={{ fontFamily: s.MONO, fontSize: 9, textTransform: 'uppercase', letterSpacing: 1, color: s.text3, marginBottom: 3 }}>{item.l}</div>
                            <div style={{ font: `600 14px ${s.FONT}`, color: s.text }}>{item.v}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* InBody Score trend */}
                  <div style={{ ...glass, padding: '22px 24px', animation: 'bsFadeUp 0.4s ease 180ms backwards' }}>
                    <div style={{ font: `600 14px ${s.FONT}`, color: s.text, marginBottom: 16 }}>InBody Score</div>
                    <MiniBarChart values={inbodyScore} accent={s.accent} labels={inbodyDates} />
                    {latestInBody?.bodyComposition && (
                      <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{
                          width: 48, height: 48, borderRadius: '50%',
                          background: `conic-gradient(${s.accent} ${(latestInBody.bodyComposition.inBodyScore / 100) * 360}deg, #eee ${(latestInBody.bodyComposition.inBodyScore / 100) * 360}deg)`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
                        }}>
                          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: s.accent }}>
                            {latestInBody.bodyComposition.inBodyScore}
                          </div>
                        </div>
                        <div style={{ font: `400 12px ${s.FONT}`, color: s.text2 }}>
                          Visceral Fat Level: <strong style={{ color: latestInBody.bodyComposition.visceralFatLevel <= 5 ? '#16A34A' : '#D97706' }}>
                            {latestInBody.bodyComposition.visceralFatLevel}
                          </strong>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Segmental lean analysis */}
                  {latestInBody?.segmentalLean && (
                    <div style={{ ...glass, padding: '22px 24px', animation: 'bsFadeUp 0.4s ease 200ms backwards' }}>
                      <div style={{ font: `600 14px ${s.FONT}`, color: s.text, marginBottom: 16 }}>Segmental Lean Mass</div>
                      {Object.entries(latestInBody.segmentalLean).map(([seg, data]) => (
                        <SegmentalBar
                          key={seg}
                          label={seg.replace(/([A-Z])/, ' $1').replace(/^./, m => m.toUpperCase())}
                          massKg={data.massKg}
                          adequacyPct={data.adequacyPct}
                          accent={s.accent}
                        />
                      ))}
                      <div style={{ marginTop: 10, fontFamily: s.MONO, fontSize: 10, color: s.text3 }}>
                        Bar shows % of ideal. Green ≥100%, Amber ≥90%, Red &lt;90%
                      </div>
                    </div>
                  )}

                  {/* Segmental fat distribution */}
                  {latestInBody?.segmentalFat && (
                    <div style={{ ...glass, padding: '22px 24px', animation: 'bsFadeUp 0.4s ease 220ms backwards' }}>
                      <div style={{ font: `600 14px ${s.FONT}`, color: s.text, marginBottom: 16 }}>Segmental Fat Distribution</div>
                      {Object.entries(latestInBody.segmentalFat).map(([seg, data]) => {
                        const baseline = sortedInBody[0]?.segmentalFat?.[seg]?.massKg;
                        const delta = baseline != null ? data.massKg - baseline : null;
                        return (
                          <div key={seg} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                            <span style={{ font: `400 13px ${s.FONT}`, color: s.text2 }}>
                              {seg.replace(/([A-Z])/, ' $1').replace(/^./, m => m.toUpperCase())}
                            </span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              {delta != null && delta !== 0 && (
                                <span style={{ fontSize: 11, color: delta < 0 ? '#16A34A' : '#DC2626', fontWeight: 500 }}>
                                  {delta > 0 ? '+' : ''}{delta.toFixed(2)} kg
                                </span>
                              )}
                              <span style={{ font: `600 13px ${s.MONO}`, color: s.text }}>{data.massKg} kg</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── Scan History Table ── */}
          <div style={{ ...glass, overflow: 'hidden', marginTop: 24, animation: 'bsFadeUp 0.4s ease 280ms backwards' }}>
            <div style={{ padding: '16px 24px', borderBottom: '1px solid rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ font: `600 14px ${s.FONT}`, color: s.text }}>Scan History</span>
              <span style={{ fontFamily: s.MONO, fontSize: 11, color: s.text3 }}>
                {stykuScans.length + inbodyScans.length} total scans
              </span>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', font: `400 13px ${s.FONT}` }}>
                <thead>
                  <tr style={{ background: 'rgba(0,0,0,0.02)' }}>
                    {['Date', 'Source', 'Body Fat %', 'Lean Mass (kg)', 'Key Score', 'Waist / SMM', ''].map(h => (
                      <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontFamily: s.MONO, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.2, color: s.text3, fontWeight: 500, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    ...sortedStyku.map(scan => ({ ...scan, _type: 'styku' })),
                    ...sortedInBody.map(scan => ({ ...scan, _type: 'inbody' })),
                  ].sort((a, b) => {
                    const da = a._type === 'styku' ? a.scannedAt : a.measurementDate;
                    const db = b._type === 'styku' ? b.scannedAt : b.measurementDate;
                    return db.localeCompare(da);
                  }).map((scan, idx) => {
                    const isStyku = scan._type === 'styku';
                    const date = fmtDate(isStyku ? scan.scannedAt : scan.measurementDate);
                    const bf = isStyku ? scan.bodyFatPercent : scan.bodyComposition?.PBF;
                    const lean = isStyku ? scan.leanMassKg : scan.bodyComposition?.leanBodyMass;
                    const score = isStyku ? scan.posture?.postureScore : scan.bodyComposition?.inBodyScore;
                    const scoreLabel = isStyku ? 'Posture' : 'InBody';
                    const extra = isStyku ? `${scan.circumferencesCm?.naturalWaist} cm waist` : `${scan.bodyComposition?.SMM} kg SMM`;
                    const expanded = expandedScan === scan.id;

                    return (
                      <tr key={scan.id} onClick={() => setExpandedScan(expanded ? null : scan.id)} style={{
                        cursor: 'pointer',
                        background: idx % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.01)',
                        transition: 'background 0.15s',
                      }}
                        onMouseEnter={e => e.currentTarget.style.background = s.accentLight}
                        onMouseLeave={e => e.currentTarget.style.background = idx % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.01)'}
                      >
                        <td style={{ padding: '11px 16px', color: s.text }}>{date}</td>
                        <td style={{ padding: '11px 16px' }}>
                          <span style={{
                            padding: '3px 10px', borderRadius: 100, fontSize: 11, fontWeight: 600,
                            background: isStyku ? `${s.accentLight}` : '#F0F9FF',
                            color: isStyku ? s.accent : '#0369A1',
                          }}>
                            {isStyku ? 'STYKU' : 'InBody'}
                          </span>
                        </td>
                        <td style={{ padding: '11px 16px', fontFamily: s.MONO, fontSize: 12, color: s.text }}>{bf != null ? `${bf}%` : '—'}</td>
                        <td style={{ padding: '11px 16px', fontFamily: s.MONO, fontSize: 12, color: s.text }}>{lean != null ? `${lean} kg` : '—'}</td>
                        <td style={{ padding: '11px 16px', fontSize: 12 }}>
                          {score != null ? (
                            <span style={{ color: score >= 80 ? '#16A34A' : score >= 65 ? '#D97706' : '#DC2626', fontWeight: 600 }}>
                              {score} <span style={{ fontSize: 10, color: s.text3, fontWeight: 400 }}>{scoreLabel}</span>
                            </span>
                          ) : '—'}
                        </td>
                        <td style={{ padding: '11px 16px', fontFamily: s.MONO, fontSize: 11, color: s.text2 }}>{extra}</td>
                        <td style={{ padding: '11px 16px', color: s.text3, fontSize: 12 }}>
                          {expanded ? '▲' : '▼'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      <style>{`
        @media (max-width: 960px) {
          .bs-kpi-grid { grid-template-columns: repeat(3, 1fr) !important; }
          .bs-styku-grid, .bs-inbody-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 680px) {
          .bs-kpi-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .bs-circ-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 440px) {
          .bs-kpi-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
