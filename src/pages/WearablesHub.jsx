import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useStyles } from '../theme';
import { getPatients, getAppointments } from '../data/store';
import * as wearables from '../services/wearables/index.js';
import { PROVIDERS, APPLE_WATCH_NOTE } from '../services/wearables/providers.js';
import { importAppleHealth, getCachedAppleHealth, clearAppleHealthCache } from '../services/wearables/apple-health.js';
import { connectViaTerra, handleTerraCallback, isTerraConnected, fetchTerraData, clearTerraUser } from '../services/wearables/terra.js';

// ── Wearables Hub ──
// Real OAuth2 integration with Fitbit, WHOOP, Oura Ring, Garmin
// Falls back to simulated data when no device is connected
// Shows HRV, resting HR, sleep, steps, recovery score
// Correlates wearable data with class performance

const DEVICES = [
  { id: 'apple-watch', name: 'Apple Watch', icon: '\u231A', provider: 'apple-watch' },
  { id: 'fitbit', name: 'Fitbit', icon: '\uD83D\uDCF1', provider: 'fitbit' },
  { id: 'garmin', name: 'Garmin', icon: '\uD83C\uDFC3', provider: 'garmin' },
  { id: 'whoop', name: 'WHOOP', icon: '\uD83D\uDCAA', provider: 'whoop' },
  { id: 'oura', name: 'Oura Ring', icon: '\uD83D\uDC8D', provider: 'oura' },
];

// ── Simulated Data Generator (fallback when no real device connected) ──

function generateWearableData(client, appointments) {
  const now = new Date();
  const seed = (client.id || '').split('').reduce((s, c) => s + c.charCodeAt(0), 0);
  const r = (min, max, offset = 0) => min + ((seed + offset) % (max - min + 1));

  const recentClasses = appointments.filter(a =>
    a.patientId === client.id && a.status === 'completed' &&
    (now - new Date(a.date)) / 86400000 <= 30
  ).length;

  const fitnessLevel = Math.min(1, recentClasses / 12);

  const daily = [];
  for (let d = 6; d >= 0; d--) {
    const date = new Date(now); date.setDate(date.getDate() - d);
    const hadClass = appointments.some(a =>
      a.patientId === client.id && a.date === date.toISOString().slice(0, 10) && a.status === 'completed'
    );
    daily.push({
      date: date.toLocaleDateString('en-US', { weekday: 'short' }),
      restingHR: r(52, 72, d) - Math.floor(fitnessLevel * 8),
      hrv: r(25, 65, d * 3) + Math.floor(fitnessLevel * 15),
      steps: r(3000, 12000, d * 7) + (hadClass ? 3000 : 0),
      sleep: (r(5, 9, d * 2) + r(0, 5, d) / 10).toFixed(1),
      calories: r(1400, 2600, d * 5) + (hadClass ? 400 : 0),
      activeMinutes: r(15, 60, d * 4) + (hadClass ? 55 : 0),
      hadClass,
    });
  }

  const latestHRV = daily[daily.length - 1].hrv;
  const latestRHR = daily[daily.length - 1].restingHR;
  const latestSleep = parseFloat(daily[daily.length - 1].sleep);
  const recoveryScore = Math.min(100, Math.round(
    (latestHRV / 65 * 35) + ((80 - latestRHR) / 30 * 30) + (latestSleep / 8 * 35)
  ));

  const effortScore = Math.round(60 + fitnessLevel * 30 + r(0, 10, 99));

  let recommendation = '';
  let recColor = '#16A34A';
  if (recoveryScore >= 75) {
    recommendation = 'Great recovery \u2014 clear for high-intensity classes (Reformer + Cardio, Barre Burn)';
    recColor = '#16A34A';
  } else if (recoveryScore >= 50) {
    recommendation = 'Moderate recovery \u2014 standard classes recommended (Reformer, Mat, Barre)';
    recColor = '#D97706';
  } else {
    recommendation = 'Low recovery \u2014 suggest Stretch & Restore or rest day';
    recColor = '#DC2626';
  }

  return { daily, recoveryScore, effortScore, recommendation, recColor, fitnessLevel };
}

// ── SVG Components ────────────────────────────────────────────────────

function SparkBar({ data, color, width = 120, height = 36, valueKey }) {
  const values = data.map(d => d[valueKey]);
  const max = Math.max(...values, 1);
  const barW = Math.max((width - (values.length - 1) * 3) / values.length, 6);
  return (
    <svg width={width} height={height} style={{ display: 'block' }}>
      {values.map((v, i) => {
        const h = Math.max((v / max) * (height - 4), 2);
        const isClass = data[i].hadClass;
        return (
          <rect key={i} x={i * (barW + 3)} y={height - h} width={barW} height={h} rx={3}
            fill={isClass ? color : 'rgba(0,0,0,0.08)'}
          />
        );
      })}
    </svg>
  );
}

function RecoveryGauge({ score, size = 100 }) {
  const s = useStyles();
  const r = (size - 12) / 2;
  const circ = Math.PI * r;
  const offset = circ * (1 - score / 100);
  const color = score >= 75 ? '#16A34A' : score >= 50 ? '#D97706' : '#DC2626';
  return (
    <div style={{ position: 'relative', width: size, height: size / 2 + 20 }}>
      <svg width={size} height={size / 2 + 10} style={{ overflow: 'visible' }}>
        <path d={`M 6 ${size / 2} A ${r} ${r} 0 0 1 ${size - 6} ${size / 2}`}
          fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="10" strokeLinecap="round" />
        <path d={`M 6 ${size / 2} A ${r} ${r} 0 0 1 ${size - 6} ${size / 2}`}
          fill="none" stroke={color} strokeWidth="10" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1s ease' }} />
      </svg>
      <div style={{
        position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)',
        textAlign: 'center',
      }}>
        <div style={{ font: `700 24px ${s.FONT}`, color }}>{score}</div>
        <div style={{ font: `400 9px ${s.MONO}`, color: s.text3, textTransform: 'uppercase' }}>Recovery</div>
      </div>
    </div>
  );
}

function PulsingDot({ color }) {
  return (
    <span style={{ position: 'relative', display: 'inline-block', width: 8, height: 8 }}>
      <span style={{
        position: 'absolute', inset: 0, borderRadius: '50%', background: color,
        animation: 'pulse 2s infinite',
      }} />
      <style>{`@keyframes pulse { 0%,100% { opacity:1; transform:scale(1); } 50% { opacity:.5; transform:scale(1.4); } }`}</style>
    </span>
  );
}

// ── Main Component ────────────────────────────────────────────────────

export default function WearablesHub() {
  const s = useStyles();
  const [selectedClientId, setSelectedClientId] = useState(null);
  const [connectedProviders, setConnectedProviders] = useState(() => wearables.getConnectedProviders());
  const [liveData, setLiveData] = useState(null);
  const [liveLoading, setLiveLoading] = useState(false);
  const [liveError, setLiveError] = useState(null);
  const [connectingProvider, setConnectingProvider] = useState(null);
  const [showAppleModal, setShowAppleModal] = useState(false);
  const [appleData, setAppleData] = useState(() => getCachedAppleHealth());
  const [appleUploading, setAppleUploading] = useState(false);
  const [appleProgress, setAppleProgress] = useState('');
  const [terraConnected, setTerraConnected] = useState(() => isTerraConnected());
  const fileInputRef = useRef(null);

  // Build class date set for correlating wearable data with studio attendance
  const classDateSet = useMemo(() => {
    const appts = getAppointments();
    const dates = new Set();
    appts.filter(a => a.status === 'completed').forEach(a => dates.add(a.date));
    return dates;
  }, []);

  // ── Handle OAuth + Terra callbacks on mount ──
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state');
    const terra = params.get('terra');
    const terraUserId = params.get('user_id');

    // Clean URL immediately
    if (code || terra || terraUserId) {
      window.history.replaceState({}, '', window.location.pathname);
    }

    // Standard OAuth callback (Fitbit, WHOOP, Oura, Garmin)
    if (code && state) {
      wearables.handleCallback(code, state)
        .then(provider => {
          if (provider) {
            setConnectedProviders(wearables.getConnectedProviders());
            fetchLiveData(provider);
          }
        })
        .catch(err => {
          console.error('OAuth callback failed:', err);
          setLiveError(err.message);
        });
    }

    // Terra widget callback (Apple Watch live connection)
    if (terra === 'connected' || terraUserId) {
      if (terraUserId) {
        handleTerraCallback(params);
      }
      setTerraConnected(isTerraConnected());
      if (isTerraConnected()) {
        handleFetchTerraData();
      }
    }
  }, []);

  // ── Fetch real data from connected provider ──
  const fetchLiveData = useCallback(async (provider) => {
    setLiveLoading(true);
    setLiveError(null);
    try {
      const data = await wearables.fetchData(provider, classDateSet);
      setLiveData({ provider, ...data });
    } catch (err) {
      console.error(`Failed to fetch ${provider} data:`, err);
      setLiveError(err.message);
    } finally {
      setLiveLoading(false);
    }
  }, [classDateSet]);

  // Fetch data for first connected provider on mount
  useEffect(() => {
    if (connectedProviders.length > 0 && !liveData) {
      fetchLiveData(connectedProviders[0]);
    }
  }, [connectedProviders, liveData, fetchLiveData]);

  // ── Apple Health file upload handler ──
  const handleAppleHealthUpload = async (file) => {
    if (!file) return;
    setAppleUploading(true);
    setAppleProgress('');
    try {
      const data = await importAppleHealth(file, classDateSet, setAppleProgress);
      setAppleData(data);
      setLiveData(data);
      setShowAppleModal(false);
    } catch (err) {
      setLiveError(err.message);
    } finally {
      setAppleUploading(false);
    }
  };

  // ── Terra live data fetch ──
  const handleFetchTerraData = async () => {
    setLiveLoading(true);
    setLiveError(null);
    try {
      const data = await fetchTerraData(classDateSet);
      setAppleData(data);
      setLiveData(data);
    } catch (err) {
      setLiveError(err.message);
    } finally {
      setLiveLoading(false);
    }
  };

  // ── Terra connect (opens widget) ──
  const handleTerraConnect = async () => {
    try {
      const url = await connectViaTerra();
      window.location.href = url;
    } catch (err) {
      setLiveError(err.message);
    }
  };

  // ── Apple Watch disconnect ──
  const handleAppleDisconnect = () => {
    clearAppleHealthCache();
    clearTerraUser();
    setAppleData(null);
    setTerraConnected(false);
    if (liveData?.provider === 'apple-watch') setLiveData(null);
  };

  // ── Connect / Disconnect handlers ──
  const handleConnect = async (device) => {
    // Apple Watch — special flow (modal with two options)
    if (device.provider === 'apple-watch') {
      if (appleData || terraConnected) {
        handleAppleDisconnect();
      } else {
        setShowAppleModal(true);
      }
      return;
    }

    if (wearables.isConnected(device.provider)) {
      wearables.disconnect(device.provider);
      setConnectedProviders(wearables.getConnectedProviders());
      if (liveData?.provider === device.provider) setLiveData(null);
      return;
    }

    setConnectingProvider(device.provider);
    try {
      await wearables.connect(device.provider);
    } catch (err) {
      setLiveError(err.message);
      setConnectingProvider(null);
    }
  };

  // ── Simulated client data (for the client grid) ──
  const { clients, overview } = useMemo(() => {
    const patients = getPatients().slice(0, 12);
    const appointments = getAppointments();

    const enriched = patients.map(client => ({
      ...client,
      wearable: generateWearableData(client, appointments),
    }));

    const avgRecovery = Math.round(enriched.reduce((sum, c) => sum + c.wearable.recoveryScore, 0) / enriched.length);
    const lowRecovery = enriched.filter(c => c.wearable.recoveryScore < 50).length;
    const avgEffort = Math.round(enriched.reduce((sum, c) => sum + c.wearable.effortScore, 0) / enriched.length);

    return {
      clients: enriched,
      overview: { avgRecovery, lowRecovery, avgEffort, synced: enriched.length },
    };
  }, []);

  const cardStyle = {
    background: 'rgba(255,255,255,0.72)', backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255,255,255,0.6)', borderRadius: 16,
    boxShadow: s.shadow,
  };

  const appleConnected = !!(appleData || terraConnected);
  const hasLiveData = liveData && (connectedProviders.length > 0 || appleConnected);
  const isAppleData = liveData?.provider === 'apple-watch';
  const activeProvider = isAppleData
    ? { name: 'Apple Watch', color: '#333', icon: '\u231A' }
    : liveData?.provider ? PROVIDERS[liveData.provider] : null;

  return (
    <div style={{ animation: 'fadeIn 0.5s ease' }}>
      <style>{`
        @media (max-width: 768px) {
          .wh-mini-metrics { grid-template-columns: 1fr 1fr !important; }
          .wh-trends-grid { grid-template-columns: 1fr !important; }
          .wh-page-header { margin-bottom: 16px !important; }
        }
        @media (max-width: 480px) {
          .wh-mini-metrics { grid-template-columns: 1fr 1fr !important; }
        }
      `}</style>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ font: `400 11px ${s.MONO}`, textTransform: 'uppercase', letterSpacing: 1.5, color: s.text3, marginBottom: 4 }}>
          Intelligence
        </div>
        <h1 style={{ font: `600 28px ${s.DISPLAY}`, color: s.text, margin: 0 }}>
          Wearables Hub
        </h1>
        <p style={{ font: `400 14px ${s.FONT}`, color: s.text2, margin: '6px 0 0' }}>
          Connect real devices \u2014 Fitbit, WHOOP, Oura Ring, Garmin \u2014 recovery scores, HRV, class recommendations
        </p>
      </div>

      {/* Connected Devices — real OAuth status */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        {DEVICES.map(d => {
          const isApple = d.provider === 'apple-watch';
          const isConnected = isApple ? appleConnected : (d.provider ? wearables.isConnected(d.provider) : false);
          const isConnecting = connectingProvider === d.provider;
          const providerConfig = d.provider && !isApple ? PROVIDERS[d.provider] : null;
          const deviceColor = isApple ? '#333' : providerConfig?.color || s.accent;

          return (
            <div key={d.id} onClick={() => handleConnect(d)} style={{
              ...cardStyle, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8,
              cursor: 'pointer',
              opacity: isConnected ? 1 : 0.6,
              border: isConnected ? `1px solid ${deviceColor}` : cardStyle.border,
              transition: 'all 0.2s',
            }}
              onMouseEnter={e => { e.currentTarget.style.opacity = isConnected ? '1' : '0.85'; }}
              onMouseLeave={e => { e.currentTarget.style.opacity = isConnected ? '1' : '0.6'; }}
            >
              <span style={{ fontSize: 18 }}>{d.icon}</span>
              <span style={{ font: `400 12px ${s.FONT}`, color: s.text }}>{d.name}</span>
              {isConnecting ? (
                <span style={{ font: `400 10px ${s.MONO}`, color: s.text3 }}>connecting...</span>
              ) : isConnected ? (
                <>
                  <PulsingDot color="#16A34A" />
                  {isApple && appleData?.source && (
                    <span style={{ font: `400 9px ${s.MONO}`, color: s.text3 }}>
                      {appleData.source === 'terra-api' ? 'live' : 'import'}
                    </span>
                  )}
                </>
              ) : (
                <span style={{
                  width: 8, height: 8, borderRadius: '50%', background: '#999',
                }} />
              )}
              {isConnected && (
                <span style={{
                  font: `400 9px ${s.MONO}`, color: '#DC2626', marginLeft: 4,
                  opacity: 0.6, cursor: 'pointer',
                }}
                  onClick={e => { e.stopPropagation(); handleConnect(d); }}
                >disconnect</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Apple Watch connection modal */}
      {showAppleModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 999,
          background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
        }} onClick={() => !appleUploading && setShowAppleModal(false)}>
          <div style={{
            ...cardStyle, maxWidth: 520, width: '100%', padding: 0, overflow: 'hidden',
            background: 'rgba(255,255,255,0.95)',
          }} onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div style={{
              padding: '20px 24px', borderBottom: '1px solid rgba(0,0,0,0.06)',
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <span style={{ fontSize: 28 }}>{'\u231A'}</span>
              <div style={{ flex: 1 }}>
                <div style={{ font: `600 16px ${s.FONT}`, color: s.text }}>Connect Apple Watch</div>
                <div style={{ font: `400 12px ${s.FONT}`, color: s.text3 }}>Two ways to get your HealthKit data</div>
              </div>
              <button onClick={() => !appleUploading && setShowAppleModal(false)} style={{
                background: 'none', border: 'none', cursor: 'pointer', color: '#999', fontSize: 20, padding: 4,
              }}>&times;</button>
            </div>

            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Option 1: Terra API (live) */}
              <div style={{
                border: '1px solid rgba(0,0,0,0.08)', borderRadius: 12, padding: 20,
                cursor: 'pointer', transition: 'all 0.2s',
              }}
                onClick={handleTerraConnect}
                onMouseEnter={e => { e.currentTarget.style.borderColor = s.accent; e.currentTarget.style.background = `${s.accent}06`; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(0,0,0,0.08)'; e.currentTarget.style.background = 'transparent'; }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 8, background: '#16A34A18',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    font: `600 14px ${s.FONT}`, color: '#16A34A',
                  }}>1</div>
                  <div>
                    <div style={{ font: `600 14px ${s.FONT}`, color: s.text }}>Live Connection (via Terra)</div>
                    <div style={{
                      font: `400 9px ${s.MONO}`, color: '#16A34A', textTransform: 'uppercase',
                      padding: '2px 6px', background: '#16A34A10', borderRadius: 4, display: 'inline-block',
                    }}>recommended</div>
                  </div>
                </div>
                <div style={{ font: `400 12px ${s.FONT}`, color: s.text2, lineHeight: 1.6 }}>
                  Connect through Terra's secure widget. Reads Apple Health data in real-time via their mobile SDK.
                  Automatic daily syncs — no manual exports needed.
                </div>
                <div style={{ font: `400 10px ${s.MONO}`, color: s.text3, marginTop: 8 }}>
                  Requires: Terra API account (tryterra.co) + TERRA_DEV_ID & TERRA_API_KEY in Vercel env
                </div>
              </div>

              {/* Option 2: Health Export upload */}
              <div style={{
                border: '1px solid rgba(0,0,0,0.08)', borderRadius: 12, padding: 20,
                cursor: 'pointer', transition: 'all 0.2s',
                opacity: appleUploading ? 0.7 : 1,
              }}
                onClick={() => !appleUploading && fileInputRef.current?.click()}
                onMouseEnter={e => { if (!appleUploading) { e.currentTarget.style.borderColor = s.accent; e.currentTarget.style.background = `${s.accent}06`; } }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(0,0,0,0.08)'; e.currentTarget.style.background = 'transparent'; }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 8, background: '#2563EB18',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    font: `600 14px ${s.FONT}`, color: '#2563EB',
                  }}>2</div>
                  <div>
                    <div style={{ font: `600 14px ${s.FONT}`, color: s.text }}>Import Health Export</div>
                    <div style={{
                      font: `400 9px ${s.MONO}`, color: '#2563EB', textTransform: 'uppercase',
                      padding: '2px 6px', background: '#2563EB10', borderRadius: 4, display: 'inline-block',
                    }}>no api keys needed</div>
                  </div>
                </div>
                <div style={{ font: `400 12px ${s.FONT}`, color: s.text2, lineHeight: 1.6 }}>
                  Export from your iPhone: <span style={{ font: `500 12px ${s.FONT}`, color: s.text }}>Health app &rarr; Profile &rarr; Export All Health Data</span>.
                  Upload the .zip file here. Parses HR, HRV, sleep, steps, calories, and exercise minutes from the last 7 days.
                </div>

                {/* Upload progress */}
                {appleUploading && (
                  <div style={{
                    marginTop: 12, padding: 10, background: 'rgba(0,0,0,0.03)', borderRadius: 8,
                    font: `400 11px ${s.MONO}`, color: s.accent,
                  }}>
                    {appleProgress || 'Processing...'}
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".zip,.xml"
                  style={{ display: 'none' }}
                  onChange={e => handleAppleHealthUpload(e.target.files[0])}
                />
              </div>

              {/* Drag & drop zone */}
              <div style={{
                border: '2px dashed rgba(0,0,0,0.1)', borderRadius: 12, padding: '20px 16px',
                textAlign: 'center', transition: 'all 0.2s',
              }}
                onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = s.accent; e.currentTarget.style.background = `${s.accent}06`; }}
                onDragLeave={e => { e.currentTarget.style.borderColor = 'rgba(0,0,0,0.1)'; e.currentTarget.style.background = 'transparent'; }}
                onDrop={e => {
                  e.preventDefault();
                  e.currentTarget.style.borderColor = 'rgba(0,0,0,0.1)';
                  e.currentTarget.style.background = 'transparent';
                  const file = e.dataTransfer.files[0];
                  if (file && (file.name.endsWith('.zip') || file.name.endsWith('.xml'))) {
                    handleAppleHealthUpload(file);
                  } else {
                    setLiveError('Please drop a .zip or .xml Apple Health export file');
                  }
                }}
              >
                <div style={{ font: `400 12px ${s.FONT}`, color: s.text3 }}>
                  or drag & drop your <span style={{ font: `500 12px ${s.MONO}`, color: s.text2 }}>export.zip</span> here
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error banner */}
      {liveError && (
        <div style={{
          ...cardStyle, padding: 14, marginBottom: 16,
          background: 'rgba(254,242,242,0.8)', border: '1px solid rgba(220,38,38,0.2)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ font: `400 12px ${s.FONT}`, color: '#DC2626' }}>{liveError}</div>
            <button onClick={() => setLiveError(null)} style={{
              background: 'none', border: 'none', cursor: 'pointer', color: '#999', fontSize: 16, padding: 4,
            }}>&times;</button>
          </div>
        </div>
      )}

      {/* ── Live Data Card (real device data) ── */}
      {hasLiveData && (
        <div style={{ ...cardStyle, padding: 0, overflow: 'hidden', marginBottom: 24 }}>
          <div style={{
            padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12,
            borderBottom: '1px solid rgba(0,0,0,0.04)',
            background: `linear-gradient(135deg, ${activeProvider?.color || '#333'}08, ${activeProvider?.color || '#333'}15)`,
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12, background: (activeProvider?.color || '#333') + '20',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
            }}>
              {DEVICES.find(d => d.provider === liveData.provider || (isAppleData && d.id === 'apple-watch'))?.icon}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ font: `600 15px ${s.FONT}`, color: s.text }}>
                Your {activeProvider?.name || 'Device'} Data
              </div>
              <div style={{ font: `400 11px ${s.FONT}`, color: s.text3, display: 'flex', alignItems: 'center', gap: 6 }}>
                <PulsingDot color="#16A34A" />
                {isAppleData && liveData.source === 'apple-health-export'
                  ? `Imported ${liveData.stats?.relevant?.toLocaleString() || ''} records`
                  : 'Live \u2014 last synced just now'}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ font: `700 28px ${s.FONT}`, color: liveData.recColor }}>{liveData.recoveryScore}</div>
              <div style={{ font: `400 9px ${s.MONO}`, color: s.text3, textTransform: 'uppercase' }}>Recovery</div>
            </div>
            <button onClick={() => {
              if (isAppleData && liveData.source === 'terra-api') handleFetchTerraData();
              else if (isAppleData) setShowAppleModal(true);
              else fetchLiveData(liveData.provider);
            }} disabled={liveLoading} style={{
              background: 'none', border: `1px solid ${(activeProvider?.color || '#333')}40`, borderRadius: 8,
              padding: '6px 12px', cursor: 'pointer', font: `400 11px ${s.MONO}`, color: activeProvider?.color || '#333',
              opacity: liveLoading ? 0.5 : 1,
            }}>
              {liveLoading ? 'syncing...' : isAppleData && liveData.source !== 'terra-api' ? 're-import' : 'refresh'}
            </button>
          </div>

          <div style={{ padding: 20 }}>
            {/* Recommendation */}
            <div style={{
              padding: 14, borderRadius: 10, background: liveData.recColor + '10',
              font: `400 13px ${s.FONT}`, color: liveData.recColor, lineHeight: 1.5, marginBottom: 18,
            }}>
              {liveData.recommendation}
            </div>

            {/* Today's metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: 12, marginBottom: 18 }}>
              {(() => {
                const today = liveData.daily[liveData.daily.length - 1];
                return [
                  { label: 'Resting HR', value: today.restingHR, unit: 'bpm', color: '#DC2626' },
                  { label: 'HRV', value: today.hrv, unit: 'ms', color: '#2563EB' },
                  { label: 'Sleep', value: today.sleep, unit: 'hrs', color: '#8B5CF6' },
                  { label: 'Steps', value: today.steps.toLocaleString(), unit: '', color: '#16A34A' },
                  { label: 'Calories', value: today.calories.toLocaleString(), unit: 'kcal', color: '#D97706' },
                  { label: 'Active Min', value: today.activeMinutes, unit: 'min', color: s.accent },
                ].map(m => (
                  <div key={m.label} style={{ textAlign: 'center', padding: 12, background: 'rgba(0,0,0,0.02)', borderRadius: 10 }}>
                    <div style={{ font: `600 18px ${s.FONT}`, color: m.color }}>
                      {m.value}<span style={{ font: `400 10px ${s.FONT}`, color: s.text3 }}>{m.unit}</span>
                    </div>
                    <div style={{ font: `400 9px ${s.MONO}`, color: s.text3, marginTop: 2, textTransform: 'uppercase' }}>{m.label}</div>
                  </div>
                ));
              })()}
            </div>

            {/* 7-day trends */}
            <div style={{ font: `600 11px ${s.MONO}`, color: s.text3, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 }}>
              7-Day Trends (from {activeProvider?.name || 'Apple Watch'})
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 18 }}>
              {[
                { label: 'Heart Rate', key: 'restingHR', color: '#DC2626' },
                { label: 'HRV', key: 'hrv', color: '#2563EB' },
                { label: 'Steps', key: 'steps', color: '#16A34A' },
                { label: 'Active Min', key: 'activeMinutes', color: s.accent },
              ].map(metric => (
                <div key={metric.key} style={{ padding: 12, background: 'rgba(0,0,0,0.02)', borderRadius: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ font: `400 12px ${s.FONT}`, color: s.text2 }}>{metric.label}</span>
                    <span style={{ font: `600 12px ${s.MONO}`, color: metric.color }}>
                      {liveData.daily[liveData.daily.length - 1][metric.key]}
                    </span>
                  </div>
                  <SparkBar data={liveData.daily} color={metric.color} valueKey={metric.key} width={200} height={40} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                    {liveData.daily.map((d, i) => (
                      <span key={i} style={{ font: `400 8px ${s.MONO}`, color: d.hadClass ? s.accent : s.text3 }}>{d.date}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Recovery gauge + Effort */}
            <div style={{ display: 'flex', gap: 20, alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
              <RecoveryGauge score={liveData.recoveryScore} size={120} />
              <div style={{ padding: 16, background: 'rgba(0,0,0,0.02)', borderRadius: 12, textAlign: 'center' }}>
                <div style={{ font: `700 28px ${s.FONT}`, color: s.accent }}>{liveData.effortScore}</div>
                <div style={{ font: `400 10px ${s.MONO}`, color: s.text3, textTransform: 'uppercase' }}>Pilates Effort Score</div>
                <div style={{ font: `400 11px ${s.FONT}`, color: s.text3, marginTop: 4, maxWidth: 220 }}>
                  Composite of recovery quality, movement intensity, and studio attendance
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading state for live data */}
      {liveLoading && !liveData && (
        <div style={{ ...cardStyle, padding: 32, textAlign: 'center', marginBottom: 24 }}>
          <div style={{ font: `400 13px ${s.FONT}`, color: s.text3 }}>
            Fetching data from {connectingProvider || connectedProviders[0]}...
          </div>
        </div>
      )}

      {/* Setup prompt when no devices connected */}
      {connectedProviders.length === 0 && !appleConnected && !liveLoading && (
        <div style={{
          ...cardStyle, padding: 20, marginBottom: 24,
          background: 'linear-gradient(135deg, rgba(196,112,75,0.04), rgba(196,112,75,0.08))',
          border: `1px solid ${s.accent}20`,
        }}>
          <div style={{ font: `600 14px ${s.FONT}`, color: s.text, marginBottom: 6 }}>
            Connect a real device
          </div>
          <div style={{ font: `400 12px ${s.FONT}`, color: s.text2, lineHeight: 1.6, marginBottom: 12 }}>
            Click any device above to start the OAuth flow. You'll need API credentials from each provider's developer portal.
            See <span style={{ font: `400 12px ${s.MONO}`, color: s.accent }}>.env.example</span> for setup instructions.
          </div>
          <div style={{ font: `400 11px ${s.MONO}`, color: s.text3 }}>
            Supported: Apple Watch (Health export + Terra) \u00B7 Fitbit (OAuth2 + PKCE) \u00B7 WHOOP (OAuth2) \u00B7 Oura Ring (OAuth2) \u00B7 Garmin (OAuth1a)
          </div>
        </div>
      )}

      {/* Overview KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Avg Recovery', value: hasLiveData ? liveData.recoveryScore : overview.avgRecovery, suffix: '/100', color: (hasLiveData ? liveData.recoveryScore : overview.avgRecovery) >= 65 ? '#16A34A' : '#D97706' },
          { label: 'Low Recovery', value: overview.lowRecovery, suffix: ' clients', color: '#DC2626' },
          { label: 'Avg Effort', value: hasLiveData ? liveData.effortScore : overview.avgEffort, suffix: '/100', color: s.accent },
          { label: 'Devices Synced', value: connectedProviders.length + (appleConnected ? 1 : 0) || overview.synced, suffix: (connectedProviders.length > 0 || appleConnected) ? ' real' : ' sim', color: (connectedProviders.length > 0 || appleConnected) ? '#16A34A' : '#2563EB' },
        ].map(kpi => (
          <div key={kpi.label} style={{ ...cardStyle, padding: 18, textAlign: 'center' }}>
            <div style={{ font: `700 24px ${s.FONT}`, color: kpi.color }}>{kpi.value}<span style={{ font: `400 12px ${s.FONT}`, color: s.text3 }}>{kpi.suffix}</span></div>
            <div style={{ font: `400 10px ${s.MONO}`, color: s.text3, marginTop: 4, textTransform: 'uppercase' }}>{kpi.label}</div>
          </div>
        ))}
      </div>

      {/* Section header for client grid */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div>
          <div style={{ font: `600 16px ${s.FONT}`, color: s.text }}>Client Wearable Data</div>
          <div style={{ font: `400 11px ${s.FONT}`, color: s.text3, marginTop: 2 }}>
            {(connectedProviders.length > 0 || appleConnected)
              ? 'Simulated data \u2014 clients connect their own devices via Member Portal'
              : 'Simulated data based on class attendance patterns'}
          </div>
        </div>
        <div style={{
          font: `400 9px ${s.MONO}`, color: '#fff', background: s.text3,
          padding: '3px 8px', borderRadius: 4, textTransform: 'uppercase',
        }}>
          {(connectedProviders.length > 0 || appleConnected) ? 'demo' : 'simulated'}
        </div>
      </div>

      {/* Client Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
        {clients.map(client => {
          const w = client.wearable;
          const isSelected = selectedClientId === client.id;
          return (
            <div key={client.id} style={{
              ...cardStyle, padding: 0, overflow: 'hidden', cursor: 'pointer',
              border: isSelected ? `2px solid ${s.accent}` : cardStyle.border,
            }} onClick={() => setSelectedClientId(isSelected ? null : client.id)}>
              {/* Header */}
              <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: w.recColor + '20', color: w.recColor,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  font: `600 12px ${s.FONT}`, flexShrink: 0,
                }}>{client.firstName?.[0]}{client.lastName?.[0]}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ font: `500 13px ${s.FONT}`, color: s.text }}>{client.firstName} {client.lastName?.[0]}.</div>
                  <div style={{ font: `400 11px ${s.FONT}`, color: s.text3 }}>\u231A Apple Watch synced</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ font: `700 20px ${s.FONT}`, color: w.recColor }}>{w.recoveryScore}</div>
                  <div style={{ font: `400 9px ${s.MONO}`, color: s.text3 }}>Recovery</div>
                </div>
              </div>

              {/* Mini metrics */}
              <div className="wh-mini-metrics" style={{ padding: '12px 18px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                {[
                  { label: 'Resting HR', value: `${w.daily[w.daily.length - 1].restingHR}`, unit: 'bpm' },
                  { label: 'HRV', value: `${w.daily[w.daily.length - 1].hrv}`, unit: 'ms' },
                  { label: 'Sleep', value: w.daily[w.daily.length - 1].sleep, unit: 'hrs' },
                ].map(m => (
                  <div key={m.label} style={{ textAlign: 'center' }}>
                    <div style={{ font: `600 14px ${s.FONT}`, color: s.text }}>{m.value}<span style={{ font: `400 10px ${s.FONT}`, color: s.text3 }}>{m.unit}</span></div>
                    <div style={{ font: `400 9px ${s.MONO}`, color: s.text3 }}>{m.label}</div>
                  </div>
                ))}
              </div>

              {/* Expanded */}
              {isSelected && (
                <div style={{ padding: '0 18px 18px', borderTop: '1px solid rgba(0,0,0,0.04)' }}>
                  <div style={{ display: 'flex', justifyContent: 'center', margin: '16px 0' }}>
                    <RecoveryGauge score={w.recoveryScore} />
                  </div>

                  <div style={{
                    padding: 12, borderRadius: 10, background: w.recColor + '10',
                    font: `400 12px ${s.FONT}`, color: w.recColor, lineHeight: 1.5, marginBottom: 14,
                  }}>
                    {w.recommendation}
                  </div>

                  <div style={{ font: `600 11px ${s.MONO}`, color: s.text3, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>7-Day Trends</div>
                  <div className="wh-trends-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    {[
                      { label: 'Heart Rate', key: 'restingHR', color: '#DC2626' },
                      { label: 'HRV', key: 'hrv', color: '#2563EB' },
                      { label: 'Steps', key: 'steps', color: '#16A34A' },
                      { label: 'Active Min', key: 'activeMinutes', color: s.accent },
                    ].map(metric => (
                      <div key={metric.key} style={{ padding: 10, background: 'rgba(0,0,0,0.02)', borderRadius: 8 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                          <span style={{ font: `400 11px ${s.FONT}`, color: s.text2 }}>{metric.label}</span>
                          <span style={{ font: `600 11px ${s.MONO}`, color: metric.color }}>
                            {w.daily[w.daily.length - 1][metric.key]}
                          </span>
                        </div>
                        <SparkBar data={w.daily} color={metric.color} valueKey={metric.key} />
                      </div>
                    ))}
                  </div>

                  <div style={{ marginTop: 14, padding: 12, background: 'rgba(0,0,0,0.02)', borderRadius: 10, textAlign: 'center' }}>
                    <div style={{ font: `700 24px ${s.FONT}`, color: s.accent }}>{w.effortScore}</div>
                    <div style={{ font: `400 10px ${s.MONO}`, color: s.text3, textTransform: 'uppercase' }}>Pilates Effort Score</div>
                    <div style={{ font: `400 11px ${s.FONT}`, color: s.text3, marginTop: 4 }}>
                      Based on controlled movement patterns, core engagement, and recovery metrics
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Provider tech footer */}
      <div style={{
        ...cardStyle, padding: '14px 20px', marginTop: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8,
      }}>
        <div style={{ font: `400 11px ${s.FONT}`, color: s.text3 }}>
          OAuth2 + PKCE \u00B7 HealthKit via Terra \u00B7 Apple Health XML Import \u00B7 Server-side token exchange
        </div>
        <div style={{ font: `400 10px ${s.MONO}`, color: s.text3, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <span style={{ color: appleConnected ? '#333' : s.text3 }}>
            Apple Watch {appleConnected ? '\u2713' : '\u2014'}
          </span>
          {Object.entries(PROVIDERS).map(([key, p]) => (
            <span key={key} style={{ color: wearables.isConnected(key) ? p.color : s.text3 }}>
              {p.name} {wearables.isConnected(key) ? '\u2713' : '\u2014'}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
