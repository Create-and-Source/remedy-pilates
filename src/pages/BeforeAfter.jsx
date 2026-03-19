// Transformations Photos — clinical documentation + marketing asset management
// Standardized angles, patient consent tracking, comparison views
import { useState, useEffect, useRef } from 'react';
import { useStyles } from '../theme';
import { getPhotos, addPhoto, deletePhoto, getPatients, getServices, getProviders, subscribe } from '../data/store';

const FACE_ANGLES = ['Front', 'Left 45°', 'Right 45°', 'Left Profile', 'Right Profile', 'Close-up'];
const BODY_ANGLES = ['Front', 'Back', 'Left Side', 'Right Side', 'Detail Left', 'Detail Right'];
const SCALP_ANGLES = ['Top View', 'Front Hairline', 'Left Temple', 'Right Temple', 'Back'];
const getAngles = (serviceId, services) => {
  const svc = services?.find(s => s.id === serviceId);
  const cat = svc?.category || '';
  if (['Body', 'Surgical'].includes(cat)) return BODY_ANGLES;
  if (svc?.name?.includes('Hair Restoration')) return SCALP_ANGLES;
  return FACE_ANGLES;
};
const ANGLES = [...new Set([...FACE_ANGLES, ...BODY_ANGLES, ...SCALP_ANGLES])];
const LIGHTING = ['Clinical (white)', 'Natural', 'Ring Light'];

function initPhotos() {
  if (localStorage.getItem('rp_photos_init')) return;
  const store = JSON.parse(localStorage.getItem('rp_photos') || '[]');
  if (store.length > 0) { localStorage.setItem('rp_photos_init', 'true'); return; }

  // Seed demo photo sets (no actual images — placeholders)
  const sets = [
    { id: 'PHT-1', patientId: 'PAT-1000', patientName: 'Emma Johnson', serviceId: 'SVC-1', serviceName: 'Reformer', providerId: 'PRV-1', angle: 'Front', phase: 'before', date: '2025-12-10', notes: 'Forehead lines at rest, crows feet moderate', consent: true, createdAt: '2025-12-10T10:00:00Z' },
    { id: 'PHT-2', patientId: 'PAT-1000', patientName: 'Emma Johnson', serviceId: 'SVC-1', serviceName: 'Reformer', providerId: 'PRV-1', angle: 'Front', phase: 'after', date: '2025-12-24', notes: '2 weeks post — significant reduction in forehead lines', consent: true, createdAt: '2025-12-24T10:00:00Z' },
    { id: 'PHT-3', patientId: 'PAT-1003', patientName: 'Ava Jones', serviceId: 'SVC-6', serviceName: 'TRX Photofacial', providerId: 'PRV-2', angle: 'Left 45°', phase: 'before', date: '2026-01-05', notes: 'Sun damage, dark spots on cheekbone', consent: true, createdAt: '2026-01-05T09:00:00Z' },
    { id: 'PHT-4', patientId: 'PAT-1003', patientName: 'Ava Jones', serviceId: 'SVC-6', serviceName: 'TRX Photofacial', providerId: 'PRV-2', angle: 'Left 45°', phase: 'after', date: '2026-02-15', notes: 'After 3 sessions — 80% clearing of pigmentation', consent: true, createdAt: '2026-02-15T09:00:00Z' },
    { id: 'PHT-5', patientId: 'PAT-1002', patientName: 'Sophia Brown', serviceId: 'SVC-5', serviceName: 'RF Private Session', providerId: 'PRV-3', angle: 'Front', phase: 'before', date: '2026-01-20', notes: 'Acne scarring, uneven texture', consent: true, createdAt: '2026-01-20T11:00:00Z' },
    { id: 'PHT-6', patientId: 'PAT-1002', patientName: 'Sophia Brown', serviceId: 'SVC-5', serviceName: 'RF Private Session', providerId: 'PRV-3', angle: 'Front', phase: 'after', date: '2026-03-01', notes: 'After 3 sessions — significant improvement in texture', consent: true, createdAt: '2026-03-01T11:00:00Z' },
    { id: 'PHT-7', patientId: 'PAT-1001', patientName: 'Olivia Williams', serviceId: 'SVC-2', serviceName: 'Juvederm Barre', providerId: 'PRV-1', angle: 'Front', phase: 'before', date: '2026-02-01', notes: 'Volume loss nasolabial folds', consent: true, createdAt: '2026-02-01T14:00:00Z' },
    { id: 'PHT-8', patientId: 'PAT-1001', patientName: 'Olivia Williams', serviceId: 'SVC-2', serviceName: 'Juvederm Barre', providerId: 'PRV-1', angle: 'Front', phase: 'after', date: '2026-02-01', notes: 'Immediately post — 1 syringe each side', consent: true, createdAt: '2026-02-01T15:00:00Z' },
  ];
  localStorage.setItem('rp_photos', JSON.stringify(sets));
  localStorage.setItem('rp_photos_init', 'true');
}

export default function BeforeAfter() {
  const s = useStyles();
  const [, setTick] = useState(0);
  useEffect(() => subscribe(() => setTick(t => t + 1)), []);
  useEffect(() => { initPhotos(); setTick(t => t + 1); }, []);

  const [view, setView] = useState('gallery'); // 'gallery' | 'compare' | 'upload'
  const [search, setSearch] = useState('');
  const [serviceFilter, setServiceFilter] = useState('All');
  const [showUpload, setShowUpload] = useState(false);
  const [compareSet, setCompareSet] = useState(null);
  const [form, setForm] = useState({ patientId: '', serviceId: '', angle: 'Front', phase: 'before', lighting: 'Clinical (white)', notes: '', consent: false });

  const photos = getPhotos();
  const clients = getPatients();
  const services = getServices();
  const providers = getProviders();

  // Group photos into before/after pairs by patient + service
  const photoSets = {};
  photos.forEach(p => {
    const key = `${p.patientId}-${p.serviceId}`;
    if (!photoSets[key]) photoSets[key] = { patientId: p.patientId, patientName: p.patientName, serviceId: p.serviceId, serviceName: p.serviceName, before: [], after: [] };
    if (p.phase === 'before') photoSets[key].before.push(p);
    else photoSets[key].after.push(p);
  });

  const sets = Object.values(photoSets).filter(set => {
    if (search) {
      const q = search.toLowerCase();
      if (!set.patientName?.toLowerCase().includes(q) && !set.serviceName?.toLowerCase().includes(q)) return false;
    }
    if (serviceFilter !== 'All' && set.serviceName !== serviceFilter) return false;
    return true;
  });

  const serviceNames = [...new Set(photos.map(p => p.serviceName).filter(Boolean))];

  const handleUpload = () => {
    if (!form.patientId || !form.serviceId || !form.consent) return;
    const pat = clients.find(p => p.id === form.patientId);
    const svc = services.find(sv => sv.id === form.serviceId);
    addPhoto({
      ...form,
      patientName: pat ? `${pat.firstName} ${pat.lastName}` : 'Unknown',
      serviceName: svc?.name || 'Service',
      date: new Date().toISOString().slice(0, 10),
      imageUrl: null, // placeholder — real images via AWS
    });
    setShowUpload(false);
    setForm({ patientId: '', serviceId: '', angle: 'Front', phase: 'before', lighting: 'Clinical (white)', notes: '', consent: false });
  };

  return (
    <div>
      <style>{`
        @media (max-width: 768px) {
          .ba-photo-comparison { grid-template-columns: 1fr !important; height: auto !important; }
          .ba-photo-comparison > div { height: 160px; border-right: none !important; border-bottom: 1px solid #E5E5E5; }
          .ba-upload-form-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ font: `600 26px ${s.FONT}`, color: s.text, marginBottom: 4 }}>Transformations</h1>
          <p style={{ font: `400 14px ${s.FONT}`, color: s.text2 }}>{photos.length} photos across {sets.length} session sets — clinical documentation + marketing</p>
        </div>
        <button onClick={() => setShowUpload(true)} style={s.pillAccent}>+ Upload Photos</button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Total Photos', value: photos.length },
          { label: 'Complete Sets', value: sets.filter(set => set.before.length > 0 && set.after.length > 0).length },
          { label: 'Patients Documented', value: new Set(photos.map(p => p.patientId)).size },
          { label: 'Consented', value: photos.filter(p => p.consent).length },
        ].map(k => (
          <div key={k.label} style={{ ...s.cardStyle, padding: '14px 18px' }}>
            <div style={{ font: `400 10px ${s.MONO}`, textTransform: 'uppercase', letterSpacing: 1, color: s.text3, marginBottom: 4 }}>{k.label}</div>
            <div style={{ font: `600 22px ${s.FONT}`, color: s.text }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by patient or service..." style={{ ...s.input, maxWidth: 280 }} />
        <select value={serviceFilter} onChange={e => setServiceFilter(e.target.value)} style={{ ...s.input, width: 'auto', cursor: 'pointer' }}>
          <option value="All">All Services</option>
          {serviceNames.map(sn => <option key={sn} value={sn}>{sn}</option>)}
        </select>
      </div>

      {/* Photo Sets Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
        {sets.map((set, idx) => {
          const hasComplete = set.before.length > 0 && set.after.length > 0;
          const latestBefore = set.before[set.before.length - 1];
          const latestAfter = set.after[set.after.length - 1];

          return (
            <div key={idx} style={{ ...s.cardStyle, overflow: 'hidden' }}>
              {/* Comparison Area */}
              <div className="ba-photo-comparison" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', height: 200 }}>
                <div style={{ background: '#F0F0F0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', borderRight: '1px solid #E5E5E5', position: 'relative' }}>
                  <span style={{ position: 'absolute', top: 8, left: 8, padding: '2px 8px', borderRadius: 4, background: 'rgba(0,0,0,0.6)', color: '#fff', font: `500 9px ${s.MONO}`, textTransform: 'uppercase' }}>Before</span>
                  {latestBefore ? (
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#E5E5E5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px', font: `400 20px`, color: s.text3 }}>📷</div>
                      <div style={{ font: `400 10px ${s.FONT}`, color: s.text3 }}>{latestBefore.angle}</div>
                      <div style={{ font: `400 9px ${s.FONT}`, color: s.text3 }}>{latestBefore.date}</div>
                    </div>
                  ) : (
                    <div style={{ font: `400 12px ${s.FONT}`, color: s.text3 }}>No before photo</div>
                  )}
                </div>
                <div style={{ background: '#FAFAFA', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', position: 'relative' }}>
                  <span style={{ position: 'absolute', top: 8, left: 8, padding: '2px 8px', borderRadius: 4, background: s.accent, color: s.accentText, font: `500 9px ${s.MONO}`, textTransform: 'uppercase' }}>After</span>
                  {latestAfter ? (
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#E5E5E5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px', font: `400 20px`, color: s.text3 }}>📷</div>
                      <div style={{ font: `400 10px ${s.FONT}`, color: s.text3 }}>{latestAfter.angle}</div>
                      <div style={{ font: `400 9px ${s.FONT}`, color: s.text3 }}>{latestAfter.date}</div>
                    </div>
                  ) : (
                    <div style={{ font: `400 12px ${s.FONT}`, color: s.text3 }}>Awaiting after</div>
                  )}
                </div>
              </div>

              {/* Info */}
              <div style={{ padding: '14px 16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <div style={{ font: `600 14px ${s.FONT}`, color: s.text }}>{set.patientName}</div>
                  {hasComplete && <span style={{ padding: '2px 8px', borderRadius: 100, background: '#F0FDF4', color: s.success, font: `500 9px ${s.FONT}`, textTransform: 'uppercase' }}>Complete</span>}
                  {!hasComplete && <span style={{ padding: '2px 8px', borderRadius: 100, background: '#FFF7ED', color: s.warning, font: `500 9px ${s.FONT}`, textTransform: 'uppercase' }}>In Progress</span>}
                </div>
                <div style={{ font: `400 12px ${s.FONT}`, color: s.text2, marginBottom: 6 }}>{set.serviceName}</div>
                {latestBefore?.notes && <div style={{ font: `400 11px ${s.FONT}`, color: s.text3, marginBottom: 4 }}>Before: {latestBefore.notes}</div>}
                {latestAfter?.notes && <div style={{ font: `400 11px ${s.FONT}`, color: s.accent, marginBottom: 4 }}>After: {latestAfter.notes}</div>}
                <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                  <span style={{ padding: '2px 8px', borderRadius: 100, background: '#F5F5F5', font: `400 10px ${s.FONT}`, color: s.text3 }}>{set.before.length + set.after.length} photos</span>
                  {(latestBefore?.consent || latestAfter?.consent) && <span style={{ padding: '2px 8px', borderRadius: 100, background: '#F0FDF4', font: `400 10px ${s.FONT}`, color: s.success }}>Consent ✓</span>}
                </div>
              </div>
            </div>
          );
        })}
        {sets.length === 0 && (
          <div style={{ ...s.cardStyle, padding: 48, textAlign: 'center', gridColumn: '1 / -1' }}>
            <div style={{ font: `400 14px ${s.FONT}`, color: s.text3, marginBottom: 12 }}>No photo sets yet</div>
            <button onClick={() => setShowUpload(true)} style={s.pillAccent}>Upload First Photos</button>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUpload && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300 }} onClick={() => setShowUpload(false)}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 32, maxWidth: 560, width: '90%', boxShadow: s.shadowLg, maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <h2 style={{ font: `600 20px ${s.FONT}`, color: s.text, marginBottom: 24 }}>Upload Photo</h2>

            <div className="ba-upload-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={s.label}>Patient</label>
                <select value={form.patientId} onChange={e => setForm({ ...form, patientId: e.target.value })} style={{ ...s.input, cursor: 'pointer' }}>
                  <option value="">Select patient...</option>
                  {clients.map(p => <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>)}
                </select>
              </div>
              <div>
                <label style={s.label}>Service/Treatment</label>
                <select value={form.serviceId} onChange={e => setForm({ ...form, serviceId: e.target.value })} style={{ ...s.input, cursor: 'pointer' }}>
                  <option value="">Select...</option>
                  {services.map(sv => <option key={sv.id} value={sv.id}>{sv.name}</option>)}
                </select>
              </div>
              <div>
                <label style={s.label}>Phase</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {['before', 'after'].map(p => (
                    <button key={p} onClick={() => setForm({ ...form, phase: p })} style={{
                      flex: 1, padding: '10px', borderRadius: 8, cursor: 'pointer', textTransform: 'capitalize',
                      font: `500 13px ${s.FONT}`,
                      background: form.phase === p ? (p === 'before' ? '#F5F5F5' : s.accentLight) : 'transparent',
                      color: form.phase === p ? (p === 'before' ? s.text : s.accent) : s.text3,
                      border: form.phase === p ? `2px solid ${p === 'before' ? '#DDD' : s.accent}` : '1.5px solid #E5E5E5',
                    }}>{p}</button>
                  ))}
                </div>
              </div>
              <div>
                <label style={s.label}>Angle</label>
                <select value={form.angle} onChange={e => setForm({ ...form, angle: e.target.value })} style={{ ...s.input, cursor: 'pointer' }}>
                  {getAngles(form.serviceId, services).map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              <div>
                <label style={s.label}>Lighting</label>
                <select value={form.lighting} onChange={e => setForm({ ...form, lighting: e.target.value })} style={{ ...s.input, cursor: 'pointer' }}>
                  {LIGHTING.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
            </div>

            {/* Photo drop zone */}
            <div style={{ marginTop: 16, border: '2px dashed #E5E5E5', borderRadius: 12, padding: 32, textAlign: 'center', cursor: 'pointer' }}>
              <div style={{ font: `400 24px`, color: s.text3, marginBottom: 8 }}>📷</div>
              <div style={{ font: `400 13px ${s.FONT}`, color: s.text3 }}>Drag & drop photo or click to upload</div>
              <div style={{ font: `400 11px ${s.FONT}`, color: s.text3, marginTop: 4 }}>Photos stored via AWS — placeholder for demo</div>
            </div>

            <div style={{ marginTop: 16 }}>
              <label style={s.label}>Clinical Notes</label>
              <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} style={{ ...s.input, resize: 'vertical' }} placeholder="e.g., Forehead lines at rest, moderate severity" />
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 16, cursor: 'pointer' }}>
              <input type="checkbox" checked={form.consent} onChange={e => setForm({ ...form, consent: e.target.checked })} style={{ accentColor: s.accent, width: 18, height: 18 }} />
              <span style={{ font: `400 13px ${s.FONT}`, color: s.text }}>Patient has signed photo consent form</span>
            </label>

            <div style={{ display: 'flex', gap: 12, marginTop: 24, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowUpload(false)} style={s.pillGhost}>Cancel</button>
              <button onClick={handleUpload} disabled={!form.patientId || !form.serviceId || !form.consent} style={{ ...s.pillAccent, opacity: (!form.patientId || !form.serviceId || !form.consent) ? 0.4 : 1 }}>Save Photo Record</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
