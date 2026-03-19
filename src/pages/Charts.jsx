// Progress Tracking — SOAP notes, injection maps, session documentation
import { useState, useEffect, useRef, useCallback } from 'react';
import { useStyles } from '../theme';
import { getPatients, getServices, getProviders, subscribe } from '../data/store';

const CHARTS_KEY = 'rp_charts';
function getCharts() { try { return JSON.parse(localStorage.getItem(CHARTS_KEY)) || []; } catch { return []; } }
function saveCharts(c) { localStorage.setItem(CHARTS_KEY, JSON.stringify(c)); }

function getEquipmentInventory() {
  try {
    const all = JSON.parse(localStorage.getItem('rp_inventory') || '[]');
    return all.filter(i => i.category === 'Equipment');
  } catch { return []; }
}

// ── Zone definitions ──────────────────────────────────────────────────────────

const FACE_ZONES = [
  { id: 'forehead', label: 'Forehead', x: 50, y: 15 },
  { id: 'glabella', label: 'Glabella (11s)', x: 50, y: 22 },
  { id: 'crow-l', label: 'Crows Feet L', x: 28, y: 28 },
  { id: 'crow-r', label: 'Crows Feet R', x: 72, y: 28 },
  { id: 'brow-l', label: 'Brow L', x: 34, y: 25 },
  { id: 'brow-r', label: 'Brow R', x: 66, y: 25 },
  { id: 'temple-l', label: 'Temple L', x: 22, y: 22 },
  { id: 'temple-r', label: 'Temple R', x: 78, y: 22 },
  { id: 'cheek-l', label: 'Cheek L', x: 32, y: 45 },
  { id: 'cheek-r', label: 'Cheek R', x: 68, y: 45 },
  { id: 'naso-l', label: 'Nasolabial L', x: 38, y: 52 },
  { id: 'naso-r', label: 'Nasolabial R', x: 62, y: 52 },
  { id: 'lips-upper', label: 'Upper Lip', x: 50, y: 58 },
  { id: 'lips-lower', label: 'Lower Lip', x: 50, y: 63 },
  { id: 'marionette-l', label: 'Marionette L', x: 40, y: 68 },
  { id: 'marionette-r', label: 'Marionette R', x: 60, y: 68 },
  { id: 'chin', label: 'Chin', x: 50, y: 73 },
  { id: 'jawline-l', label: 'Jawline L', x: 28, y: 62 },
  { id: 'jawline-r', label: 'Jawline R', x: 72, y: 62 },
  { id: 'neck', label: 'Neck', x: 50, y: 85 },
];

const BODY_ZONES = [
  { id: 'chin-neck', label: 'Chin / Neck', x: 50, y: 8 },
  { id: 'chest', label: 'Chest', x: 50, y: 18 },
  { id: 'arm-l', label: 'Left Arm', x: 18, y: 30 },
  { id: 'arm-r', label: 'Right Arm', x: 82, y: 30 },
  { id: 'abdomen', label: 'Abdomen', x: 50, y: 34 },
  { id: 'flank-l', label: 'Left Flank', x: 28, y: 38 },
  { id: 'flank-r', label: 'Right Flank', x: 72, y: 38 },
  { id: 'back', label: 'Back', x: 50, y: 45 },
  { id: 'buttocks', label: 'Buttocks', x: 50, y: 54 },
  { id: 'thigh-l', label: 'Left Thigh', x: 36, y: 66 },
  { id: 'thigh-r', label: 'Right Thigh', x: 64, y: 66 },
  { id: 'knee-l', label: 'Left Knee', x: 38, y: 78 },
  { id: 'knee-r', label: 'Right Knee', x: 62, y: 78 },
];

const SCALP_ZONES = [
  { id: 'frontal', label: 'Frontal', x: 50, y: 18 },
  { id: 'temporal-l', label: 'Temporal L', x: 18, y: 40 },
  { id: 'temporal-r', label: 'Temporal R', x: 82, y: 40 },
  { id: 'crown', label: 'Crown', x: 50, y: 42 },
  { id: 'vertex', label: 'Vertex', x: 50, y: 60 },
  { id: 'occipital', label: 'Occipital', x: 50, y: 80 },
];

// ── Map type resolver ─────────────────────────────────────────────────────────

function getMapType(serviceId, services) {
  if (!serviceId) return 'face'; // default
  const svc = services.find(s => s.id === serviceId);
  if (!svc) return 'face';

  // Hair Restoration specifically
  if (serviceId === 'SVC-25') return 'scalp';

  const cat = (svc.category || '').toLowerCase();

  // Face-oriented services
  if (['injectables', 'injectable', 'skin', 'lifting', 'laser'].includes(cat)) return 'face';

  // Body services
  if (['body', 'surgical'].includes(cat)) return 'body';

  // No-map services: Wellness (IV, HRT, Weight Loss), Consultation, Packages
  if (['wellness', 'consultation', 'packages'].includes(cat)) return 'none';

  return 'face';
}

function getZonesForType(mapType) {
  if (mapType === 'face') return FACE_ZONES;
  if (mapType === 'body') return BODY_ZONES;
  if (mapType === 'scalp') return SCALP_ZONES;
  return [];
}

function getMapLabel(mapType) {
  if (mapType === 'face') return 'Movement Map';
  if (mapType === 'body') return 'Treatment Zones';
  if (mapType === 'scalp') return 'Scalp Map';
  return null;
}

// ── Zone annotation helpers ───────────────────────────────────────────────────

// Returns true if annotation is a structured object (new format)
function isStructuredAnnotation(val) {
  return val && typeof val === 'object' && !Array.isArray(val);
}

// Format annotation as compact pill text for the map dot
function formatAnnotationPill(val) {
  if (!val) return '';
  if (isStructuredAnnotation(val)) {
    const dose = val.dose != null ? val.dose : '';
    const unitAbbrev = { units: 'u', mL: 'mL', cc: 'cc', syringes: 'syr' }[val.unit] || val.unit || '';
    const prodShort = val.product ? val.product.split(' ')[0] : '';
    return dose !== '' ? `${dose}${unitAbbrev} ${prodShort}`.trim() : prodShort;
  }
  // Legacy string — show as-is
  return String(val);
}

// Format annotation as full display string for the list/table
function formatAnnotationDisplay(val) {
  if (!val) return '';
  if (isStructuredAnnotation(val)) {
    const parts = [];
    if (val.dose != null && val.dose !== '') parts.push(`${val.dose} ${val.unit || ''}`);
    if (val.product) parts.push(val.product);
    if (val.lotNumber) parts.push(`Lot: ${val.lotNumber}`);
    if (val.notes) parts.push(`(${val.notes})`);
    return parts.join(' · ') || '—';
  }
  return String(val);
}

// ── SVG outlines ──────────────────────────────────────────────────────────────

function FaceSVG() {
  return (
    <svg viewBox="0 0 200 260" style={{ width: '100%', height: '100%', position: 'absolute' }}>
      <ellipse cx="100" cy="110" rx="72" ry="90" fill="none" stroke="#DDD" strokeWidth="1.5" />
      <ellipse cx="70" cy="85" rx="10" ry="6" fill="none" stroke="#DDD" strokeWidth="1" />
      <ellipse cx="130" cy="85" rx="10" ry="6" fill="none" stroke="#DDD" strokeWidth="1" />
      <path d="M90 120 Q100 130 110 120" fill="none" stroke="#DDD" strokeWidth="1" />
      <path d="M85 150 Q100 165 115 150" fill="none" stroke="#DDD" strokeWidth="1" />
      <line x1="100" y1="200" x2="100" y2="240" stroke="#DDD" strokeWidth="1" />
    </svg>
  );
}

function BodySVG() {
  return (
    <svg viewBox="0 0 200 320" style={{ width: '100%', height: '100%', position: 'absolute' }}>
      {/* Head */}
      <ellipse cx="100" cy="20" rx="16" ry="18" fill="none" stroke="#DDD" strokeWidth="1.5" />
      {/* Neck */}
      <line x1="94" y1="38" x2="94" y2="48" stroke="#DDD" strokeWidth="1" />
      <line x1="106" y1="38" x2="106" y2="48" stroke="#DDD" strokeWidth="1" />
      {/* Torso */}
      <path d="M94 48 L70 52 L60 80 L58 130 L68 160 L78 170 L78 170" fill="none" stroke="#DDD" strokeWidth="1.5" />
      <path d="M106 48 L130 52 L140 80 L142 130 L132 160 L122 170 L122 170" fill="none" stroke="#DDD" strokeWidth="1.5" />
      {/* Waist / hip line */}
      <path d="M78 170 Q100 178 122 170" fill="none" stroke="#DDD" strokeWidth="1" />
      {/* Left arm */}
      <path d="M70 52 L48 68 L32 110 L28 140 L34 142 L44 112 L60 80" fill="none" stroke="#DDD" strokeWidth="1.2" />
      {/* Right arm */}
      <path d="M130 52 L152 68 L168 110 L172 140 L166 142 L156 112 L140 80" fill="none" stroke="#DDD" strokeWidth="1.2" />
      {/* Left leg */}
      <path d="M78 170 L76 210 L74 250 L70 290 L64 300 L80 300 L78 290 L82 250 L84 210 L88 170" fill="none" stroke="#DDD" strokeWidth="1.2" />
      {/* Right leg */}
      <path d="M112 170 L116 210 L118 250 L122 290 L120 300 L136 300 L130 290 L126 250 L124 210 L122 170" fill="none" stroke="#DDD" strokeWidth="1.2" />
      {/* Center line (subtle) */}
      <line x1="100" y1="48" x2="100" y2="170" stroke="#EEE" strokeWidth="0.5" strokeDasharray="4 3" />
    </svg>
  );
}

function ScalpSVG() {
  return (
    <svg viewBox="0 0 200 260" style={{ width: '100%', height: '100%', position: 'absolute' }}>
      {/* Top-down head outline */}
      <ellipse cx="100" cy="120" rx="75" ry="90" fill="none" stroke="#DDD" strokeWidth="1.5" />
      {/* Ear bumps */}
      <ellipse cx="24" cy="130" rx="8" ry="16" fill="none" stroke="#DDD" strokeWidth="1" />
      <ellipse cx="176" cy="130" rx="8" ry="16" fill="none" stroke="#DDD" strokeWidth="1" />
      {/* Hairline guide */}
      <path d="M45 60 Q100 30 155 60" fill="none" stroke="#E5E5E5" strokeWidth="1" strokeDasharray="4 3" />
      {/* Region dividers (subtle) */}
      <line x1="100" y1="40" x2="100" y2="210" stroke="#EEE" strokeWidth="0.5" strokeDasharray="4 3" />
      <line x1="35" y1="120" x2="165" y2="120" stroke="#EEE" strokeWidth="0.5" strokeDasharray="4 3" />
      {/* Crown circle marker */}
      <circle cx="100" cy="110" r="18" fill="none" stroke="#E8E8E8" strokeWidth="0.8" strokeDasharray="3 3" />
    </svg>
  );
}

// ── Vitals & Measurements panel (for no-map services) ─────────────────────────

function VitalsPanel({ form, setForm, s }) {
  const measurements = form.measurements || { weight: '', bmi: '', waistCircumference: '', measurementNotes: '' };

  const updateMeasurement = (key, value) => {
    setForm({ ...form, measurements: { ...measurements, [key]: value } });
  };

  return (
    <div>
      <label style={{ ...s.label, marginBottom: 12 }}>Vitals & Measurements</label>
      <div style={{ background: '#FAFAFA', borderRadius: 12, border: '1px solid #E5E5E5', padding: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
          <div>
            <label style={{ ...s.label, fontSize: 11 }}>Weight (lbs)</label>
            <input
              value={measurements.weight || ''}
              onChange={e => updateMeasurement('weight', e.target.value)}
              style={s.input}
              placeholder="e.g., 178"
            />
          </div>
          <div>
            <label style={{ ...s.label, fontSize: 11 }}>BMI</label>
            <input
              value={measurements.bmi || ''}
              onChange={e => updateMeasurement('bmi', e.target.value)}
              style={s.input}
              placeholder="e.g., 28.7"
            />
          </div>
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={{ ...s.label, fontSize: 11 }}>Waist Circumference (in)</label>
          <input
            value={measurements.waistCircumference || ''}
            onChange={e => updateMeasurement('waistCircumference', e.target.value)}
            style={s.input}
            placeholder="e.g., 36"
          />
        </div>
        <div>
          <label style={{ ...s.label, fontSize: 11 }}>Measurement Notes</label>
          <textarea
            value={measurements.measurementNotes || ''}
            onChange={e => updateMeasurement('measurementNotes', e.target.value)}
            rows={4}
            style={{ ...s.input, resize: 'vertical', lineHeight: 1.6 }}
            placeholder="Body composition notes, progress observations, dosage adjustments..."
          />
        </div>
      </div>
    </div>
  );
}

// ── Zone Annotation Popover (structured form) ────────────────────────────────

function ZoneAnnotationPopover({ zoneId, zoneLabel, currentValue, onSave, onClose, s, mapType }) {
  const injectables = getEquipmentInventory();

  // Parse existing value to pre-populate form
  const parseInitial = () => {
    if (!currentValue) return { product: '', productId: '', dose: '', unit: 'units', lotNumber: '', notes: '' };
    if (isStructuredAnnotation(currentValue)) {
      return {
        product: currentValue.product || '',
        productId: currentValue.productId || '',
        dose: currentValue.dose != null ? String(currentValue.dose) : '',
        unit: currentValue.unit || 'units',
        lotNumber: currentValue.lotNumber || '',
        notes: currentValue.notes || '',
      };
    }
    // Legacy string — put it in notes
    return { product: '', productId: '', dose: '', unit: 'units', lotNumber: '', notes: String(currentValue) };
  };

  const [fields, setFields] = useState(parseInitial);

  const handleProductChange = (e) => {
    const id = e.target.value;
    if (!id) {
      setFields(f => ({ ...f, product: '', productId: '', lotNumber: '' }));
      return;
    }
    const item = injectables.find(i => i.id === id);
    setFields(f => ({
      ...f,
      productId: id,
      product: item ? item.name : '',
      lotNumber: item?.lotNumber || f.lotNumber,
    }));
  };

  const handleSave = () => {
    const dose = fields.dose !== '' ? parseFloat(fields.dose) : null;
    if (!fields.product && dose === null && !fields.notes.trim()) {
      onClose();
      return;
    }
    onSave({
      product: fields.product,
      productId: fields.productId,
      dose: dose,
      unit: fields.unit,
      lotNumber: fields.lotNumber,
      notes: fields.notes,
    });
  };

  const handleClear = () => {
    onSave(null);
  };

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 400 }}
      onClick={onClose}
    >
      <div
        style={{ background: '#fff', borderRadius: 14, padding: 24, width: 340, boxShadow: s.shadowLg }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ font: `600 14px ${s.FONT}`, color: s.text, marginBottom: 16 }}>{zoneLabel}</div>

        {/* Product dropdown */}
        <div style={{ marginBottom: 12 }}>
          <label style={{ ...s.label, fontSize: 11 }}>Product</label>
          <select
            value={fields.productId}
            onChange={handleProductChange}
            style={{ ...s.input, cursor: 'pointer' }}
          >
            <option value="">Select injectable...</option>
            {injectables.map(item => (
              <option key={item.id} value={item.id}>{item.name}</option>
            ))}
            {injectables.length === 0 && <option disabled>No injectables in inventory</option>}
          </select>
        </div>

        {/* Dose + Unit row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
          <div>
            <label style={{ ...s.label, fontSize: 11 }}>Dose</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={fields.dose}
              onChange={e => setFields(f => ({ ...f, dose: e.target.value }))}
              style={s.input}
              placeholder="e.g., 12"
            />
          </div>
          <div>
            <label style={{ ...s.label, fontSize: 11 }}>Unit</label>
            <select
              value={fields.unit}
              onChange={e => setFields(f => ({ ...f, unit: e.target.value }))}
              style={{ ...s.input, cursor: 'pointer' }}
            >
              <option value="units">units</option>
              <option value="mL">mL</option>
              <option value="cc">cc</option>
              <option value="syringes">syringes</option>
            </select>
          </div>
        </div>

        {/* Lot # */}
        <div style={{ marginBottom: 12 }}>
          <label style={{ ...s.label, fontSize: 11 }}>Lot #</label>
          <input
            value={fields.lotNumber}
            onChange={e => setFields(f => ({ ...f, lotNumber: e.target.value }))}
            style={s.input}
            placeholder="Auto-filled from product"
          />
        </div>

        {/* Notes */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ ...s.label, fontSize: 11 }}>Notes (optional)</label>
          <input
            value={fields.notes}
            onChange={e => setFields(f => ({ ...f, notes: e.target.value }))}
            style={s.input}
            placeholder="Additional details..."
          />
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={handleClear} style={{ ...s.pillGhost, padding: '6px 12px', fontSize: 11, color: s.danger, flex: 'none' }}>Clear</button>
          <button onClick={onClose} style={{ ...s.pillGhost, padding: '6px 12px', fontSize: 12, flex: 1 }}>Cancel</button>
          <button onClick={handleSave} style={{ ...s.pillAccent, padding: '6px 16px', fontSize: 12, flex: 1 }}>Save</button>
        </div>
      </div>
    </div>
  );
}

// ── Treatment Summary ────────────────────────────────────────────────────────

function TreatmentSummary({ injectionMap, zones, s }) {
  const annotated = Object.entries(injectionMap).filter(([, v]) => v);
  if (annotated.length === 0) return null;

  // Compute totals per product (only structured annotations)
  const productTotals = {};
  annotated.forEach(([, val]) => {
    if (isStructuredAnnotation(val) && val.product && val.dose != null) {
      const key = `${val.product}|||${val.unit}`;
      productTotals[key] = (productTotals[key] || 0) + Number(val.dose);
    }
  });

  return (
    <div style={{ marginTop: 16, borderTop: '1px solid #E5E5E5', paddingTop: 14 }}>
      <div style={{ font: `600 12px ${s.FONT}`, color: s.text, marginBottom: 10 }}>Treatment Summary</div>

      {/* Zone table */}
      <div style={{ background: '#FAFAFA', borderRadius: 10, border: '1px solid #E5E5E5', overflow: 'hidden', marginBottom: 10 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', font: `400 11px ${s.FONT}` }}>
          <thead>
            <tr style={{ background: '#F0F0F0' }}>
              <th style={{ textAlign: 'left', padding: '6px 10px', color: s.text2, fontWeight: 600, fontSize: 10 }}>Zone</th>
              <th style={{ textAlign: 'left', padding: '6px 10px', color: s.text2, fontWeight: 600, fontSize: 10 }}>Product</th>
              <th style={{ textAlign: 'right', padding: '6px 10px', color: s.text2, fontWeight: 600, fontSize: 10 }}>Dose</th>
              <th style={{ textAlign: 'left', padding: '6px 10px', color: s.text2, fontWeight: 600, fontSize: 10 }}>Lot #</th>
            </tr>
          </thead>
          <tbody>
            {annotated.map(([zoneId, val]) => {
              const zone = zones.find(z => z.id === zoneId);
              if (isStructuredAnnotation(val)) {
                return (
                  <tr key={zoneId} style={{ borderTop: '1px solid #E8E8E8' }}>
                    <td style={{ padding: '5px 10px', color: s.text }}>{zone?.label || zoneId}</td>
                    <td style={{ padding: '5px 10px', color: s.text }}>{val.product || '—'}</td>
                    <td style={{ padding: '5px 10px', color: s.accent, textAlign: 'right', fontFamily: s.MONO }}>
                      {val.dose != null ? `${val.dose} ${val.unit || ''}` : '—'}
                    </td>
                    <td style={{ padding: '5px 10px', color: s.text2, fontFamily: s.MONO, fontSize: 10 }}>{val.lotNumber || '—'}</td>
                  </tr>
                );
              }
              // Legacy string row
              return (
                <tr key={zoneId} style={{ borderTop: '1px solid #E8E8E8' }}>
                  <td style={{ padding: '5px 10px', color: s.text }}>{zone?.label || zoneId}</td>
                  <td colSpan={3} style={{ padding: '5px 10px', color: s.text2, fontFamily: s.MONO, fontSize: 10 }}>{String(val)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Totals per product */}
      {Object.keys(productTotals).length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {Object.entries(productTotals).map(([key, total]) => {
            const [product, unit] = key.split('|||');
            return (
              <span key={key} style={{
                padding: '3px 10px', borderRadius: 100, background: '#EEF6FF',
                font: `500 10px ${s.MONO}`, color: s.accent,
                border: '1px solid #DBEAFE',
              }}>
                {product}: {total} {unit} total
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Co-Sign Modal ─────────────────────────────────────────────────────────────

function CoSignModal({ onConfirm, onClose, s, providers }) {
  const mdProviders = providers.filter(p => {
    const name = (p.name || '').toLowerCase();
    const title = (p.title || '').toLowerCase();
    return name.includes('dr.') || title.includes('md') || title.includes('medical director') || title.includes('surgeon') || title.includes('physician');
  });

  const [reviewerId, setReviewerId] = useState(mdProviders[0]?.id || '');
  const [reviewNotes, setReviewNotes] = useState('');

  const handleConfirm = () => {
    const reviewer = providers.find(p => p.id === reviewerId);
    if (!reviewer) return;
    onConfirm({
      reviewedBy: reviewerId,
      reviewedByName: reviewer.name,
      reviewedAt: new Date().toISOString(),
      reviewNotes,
    });
  };

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 500 }}
      onClick={onClose}
    >
      <div
        style={{ background: '#fff', borderRadius: 14, padding: 28, width: 380, boxShadow: s.shadowLg }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ font: `600 16px ${s.FONT}`, color: s.text, marginBottom: 6 }}>Medical Director Co-Sign</div>
        <div style={{ font: `400 13px ${s.FONT}`, color: s.text2, marginBottom: 20 }}>
          Review and co-sign this chart on behalf of the Medical Director.
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={{ ...s.label, fontSize: 11 }}>Reviewing Instructor</label>
          <select
            value={reviewerId}
            onChange={e => setReviewerId(e.target.value)}
            style={{ ...s.input, cursor: 'pointer' }}
          >
            {mdProviders.map(p => (
              <option key={p.id} value={p.id}>{p.name} — {p.title}</option>
            ))}
            {mdProviders.length === 0 && <option disabled>No senior instructors found</option>}
          </select>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ ...s.label, fontSize: 11 }}>Review Notes (optional)</label>
          <textarea
            value={reviewNotes}
            onChange={e => setReviewNotes(e.target.value)}
            rows={3}
            style={{ ...s.input, resize: 'vertical', lineHeight: 1.6 }}
            placeholder="Clinical comments, recommendations, or observations..."
          />
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={s.pillGhost}>Cancel</button>
          <button
            onClick={handleConfirm}
            disabled={!reviewerId || mdProviders.length === 0}
            style={{ ...s.pillAccent, opacity: (!reviewerId || mdProviders.length === 0) ? 0.5 : 1 }}
          >
            Co-Sign & Approve
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Status badge helpers ──────────────────────────────────────────────────────

function StatusBadge({ status, s }) {
  const config = {
    draft:          { bg: '#FFF7ED', color: '#D97706', label: 'Draft' },
    pending_review: { bg: '#EFF6FF', color: '#2563EB', label: 'Pending Review' },
    signed:         { bg: '#F0FDF4', color: '#16A34A', label: 'Signed' },
    co_signed:      { bg: '#F0FDF4', color: '#16A34A', label: 'Co-Signed' },
  };
  const c = config[status] || config.draft;
  return (
    <span style={{
      padding: '3px 10px', borderRadius: 100, font: `500 10px ${s.FONT}`, textTransform: 'uppercase',
      background: c.bg, color: c.color, display: 'inline-flex', alignItems: 'center', gap: 4,
    }}>
      {status === 'co_signed' && <span style={{ fontSize: 10 }}>✦</span>}
      {c.label}
    </span>
  );
}

function avatarBg(status) {
  if (status === 'signed' || status === 'co_signed') return '#F0FDF4';
  if (status === 'pending_review') return '#EFF6FF';
  return '#FFF7ED';
}

function avatarColor(status, s) {
  if (status === 'signed' || status === 'co_signed') return s.success;
  if (status === 'pending_review') return '#2563EB';
  return s.warning;
}

// ── Seed data ─────────────────────────────────────────────────────────────────

function initCharts() {
  // Reseed if empty, old format (no mapType), or insufficient charts
  const existing = getCharts();
  const hasNewFormat = existing.length > 0 && existing[0].mapType;
  if (existing.length >= 8 && hasNewFormat) return;
  localStorage.removeItem('rp_charts_init');
  saveCharts([
    {
      id: 'CHT-1', clientId: 'CLT-1000', patientName: 'Emma Johnson', providerId: 'INS-1',
      date: '2026-03-10', serviceId: 'SVC-1', serviceName: 'Reformer',
      mapType: 'none',
      subjective: 'Client presents for weekly reformer session. Reports lower back felt tight after last session but resolved within 24 hours. No new injuries. Sleeping better and noticing improved posture at work. Motivated to increase spring resistance.',
      objective: 'Posture assessment shows notable improvement in thoracic extension compared to intake. Hip flexor tension reduced bilaterally. Core engagement consistent through footwork series. Hamstring flexibility: right 68°, left 71° straight leg raise (up from 58°/62° at intake).',
      assessment: 'Strong progress across 6 weeks. Lower back tightness likely due to increased spring resistance last session — monitor. Core stabilization improving steadily. Ready to progress footwork to red spring.',
      plan: 'Advance footwork from blue to red spring for lower body series. Introduce short box series. Continue long stretch progression. Add side-lying hip series for glute activation. Cue neutral pelvis throughout. Follow up next week; reassess lower back response to increased resistance.',
      injectionMap: {},
      measurements: { weight: '', bmi: '', waistCircumference: '', measurementNotes: 'Flexibility score: 7/10 (up from 5/10 at intake). Core strength rating: 6/10. Posture alignment: improved thoracic extension, reduced forward head. Spring resistance: progressing blue → red footwork.' },
      vitals: { bp: '', pulse: '', temp: '' },
      medications: 'None',
      status: 'signed',
      reviewRequired: false,
      createdAt: '2026-03-10T10:30:00Z',
    },
    {
      id: 'CHT-2', clientId: 'CLT-1001', patientName: 'Olivia Williams', providerId: 'INS-1',
      date: '2026-03-11', serviceId: 'SVC-2', serviceName: 'Barre',
      mapType: 'none',
      subjective: 'Client attended 3rd barre class this week. Reports significant muscle soreness in glutes and inner thighs after Tuesday class — expected DOMS. Soreness resolved by Thursday. Energy level good. Noticing less shaking at the barre compared to first two weeks.',
      objective: 'Observed improved turnout stability. Plié depth has increased — client now achieving parallel thighs in grand plié without heel lift. Core engagement noticeably more consistent through seat work. Balance on single leg improved from roughly 3 seconds to 8+ seconds at barre.',
      assessment: 'Rapid adaptation in first month. Glute and inner thigh fatigue is normal for this stage. Balance and stability improving week over week. Ready to add ankle weights for seat series.',
      plan: 'Introduce 1lb ankle weights for donkey kick and fire hydrant series. Cue shoulder blade depression throughout upper body work. Add standing arabesque balance challenge (away from barre) for last 5 minutes. Client to continue 3x/week schedule for optimal adaptation.',
      injectionMap: {},
      measurements: { weight: '', bmi: '', waistCircumference: '', measurementNotes: 'Single-leg balance: 8 seconds (up from 3 seconds at first class). Grand plié depth: full range without heel lift. Core engagement consistency: 8/10 in class observation.' },
      vitals: { bp: '', pulse: '', temp: '' },
      medications: 'None',
      status: 'signed',
      reviewRequired: false,
      createdAt: '2026-03-11T11:00:00Z',
    },
    {
      id: 'CHT-3', clientId: 'CLT-1003', patientName: 'Ava Jones', providerId: 'INS-2',
      date: '2026-03-12', serviceId: 'SVC-6', serviceName: 'Private Reformer',
      mapType: 'none',
      subjective: 'Month 2 private session. Client reports significant reduction in chronic lower back pain — "down from a 6/10 to a 2/10 most days." Physician cleared her to continue Pilates and discontinue physical therapy. Feeling stronger and more confident in movement.',
      objective: 'Great form on roll-up today — full articulation achieved for first time. Core engagement holding through complete series without instructor cueing. Shoulder alignment on reformer corrected; no longer protracted during arm series. Spinal rotation symmetrical bilaterally.',
      assessment: 'Excellent progress. Client reports reduced lower back pain after 6 weeks consistent with expected outcomes for core stabilization work. Roll-up milestone achieved. Ready to progress to intermediate repertoire.',
      plan: 'Introduce short spine stretch on reformer. Add teaser prep series. Begin elephant footwork. Progress to red spring on arm series. Set 3-month reassessment to formally document flexibility and strength gains. Recommend increasing to 3 sessions/week.',
      injectionMap: {},
      measurements: { weight: '', bmi: '', waistCircumference: '', measurementNotes: 'Lower back pain self-report: 2/10 (down from 6/10 at intake). Roll-up: full articulation achieved. Shoulder alignment corrected on reformer. Spinal rotation: symmetrical.' },
      vitals: { bp: '', pulse: '', temp: '' },
      medications: 'None reported',
      status: 'signed',
      reviewRequired: false,
      createdAt: '2026-03-12T14:00:00Z',
    },
    {
      id: 'CHT-4', clientId: 'CLT-1002', patientName: 'Sophia Brown', providerId: 'INS-3',
      date: '2026-03-13', serviceId: 'SVC-28', serviceName: 'Mat Pilates',
      mapType: 'none',
      subjective: 'Session 4 of 8-week beginner mat series. Client recovering from C-section 6 months ago, cleared by OB for low-impact exercise. Experiencing diastasis recti (2-finger separation noted at intake). Reports less "disconnected" feeling in core. No pain during class.',
      objective: 'Diastasis recti reassessment: 1.5-finger separation (down from 2 fingers at intake). Core activation pattern improving — client now initiating transverse abdominis engagement before movement. Imprint position maintained throughout supine series. No breath holding observed.',
      assessment: 'Good healing progress. Diastasis closing as expected with proper cueing and load management. Ready to introduce gentle rotation within safe range. Continue to avoid full flexion exercises until separation reaches 1 finger or less.',
      plan: 'Maintain current load — no increase in difficulty yet. Introduce gentle spine twist in seated position. Add clamshell series for hip stability. Continue to cue 3D breathing throughout. Recheck diastasis at session 6. Educate client on daily core activation habits at home.',
      injectionMap: {},
      measurements: { weight: '', bmi: '', waistCircumference: '', measurementNotes: 'Diastasis recti: 1.5-finger separation (down from 2 at intake). Core activation pattern: transverse abdominis engaging before movement. No breath holding during session.' },
      vitals: { bp: '', pulse: '', temp: '' },
      medications: 'None',
      status: 'signed',
      reviewRequired: false,
      createdAt: '2026-03-13T09:00:00Z',
    },
    {
      id: 'CHT-5', clientId: 'CLT-1004', patientName: 'Isabella Martinez', providerId: 'INS-1',
      date: '2026-03-14', serviceId: 'SVC-4', serviceName: 'Stretch & Recovery',
      mapType: 'none',
      subjective: 'Client is a competitive cyclist presenting for weekly stretch and recovery session. Reports right hip flexor tightness and left IT band tension following a 60-mile ride on Saturday. Requesting focus on hip flexors, hamstrings, and thoracic mobility.',
      objective: 'Hip flexor flexibility: right 12cm Thomas test (tight), left 8cm. IT band: left Ober test positive. Thoracic rotation: 42° right, 38° left. Hamstring flexibility: 62° bilateral straight leg raise. Breathing pattern shallow and chest-dominant.',
      assessment: 'Acute post-ride tightness in right hip flexor and left IT band as reported. Thoracic mobility restriction likely contributing to neck and shoulder tension on long rides. Diaphragmatic breathing will support recovery and nervous system downregulation.',
      plan: 'Hip flexor contract-relax PNF stretching bilateral, emphasis right side. IT band and TFL release with sustained holds. Thoracic rotation and extension mobility work over foam roller. Diaphragmatic breathing practice — 5 minutes at session end. Home routine: hip flexor stretch 2x daily, thoracic rotation 5 min pre-ride.',
      injectionMap: {},
      measurements: { weight: '', bmi: '', waistCircumference: '', measurementNotes: 'Right hip flexor Thomas test: 12cm (tight). Left Ober test: positive. Thoracic rotation: 42° R / 38° L. Hamstring flexibility: 62° bilateral. Goal: hip flexor to 6cm by month end.' },
      vitals: { bp: '', pulse: '', temp: '' },
      medications: 'None',
      status: 'pending_review',
      reviewRequired: true,
      createdAt: '2026-03-14T13:00:00Z',
    },
    {
      id: 'CHT-6', clientId: 'CLT-1007', patientName: 'Amelia Thompson', providerId: 'INS-4',
      date: '2026-03-14', serviceId: 'SVC-15', serviceName: 'Reformer — Intermediate',
      mapType: 'none',
      subjective: 'Session 10 of ongoing intermediate reformer program. Client training for a spring hiking trip — goal is leg strength and stamina on descents. Reports feeling significantly stronger in legs. No new soreness or discomfort.',
      objective: 'Increased spring resistance from blue to red for lower body series — client demonstrated solid form throughout. Single-leg footwork stable and symmetrical. Prone swan extension strong with no lower back compression. Long stretch holds 30 seconds with neutral spine.',
      assessment: 'Excellent adaptation to increased resistance. Leg strength and endurance tracking well for hiking goal. Spinal control in prone work notably improved. Ready to introduce jump board for plyometric training component.',
      plan: 'Introduce jump board — single leg press, bilateral jumps, lateral jumps. Add side split platform work. Continue red spring footwork. Progress long stretch to down stretch. Recommend adding one outdoor hike before spring trip to test conditioning. Reassess at session 12.',
      injectionMap: {},
      measurements: { weight: '', bmi: '', waistCircumference: '', measurementNotes: 'Spring resistance: advanced to red (from blue) lower body series. Single-leg footwork: symmetrical and stable. Long stretch hold: 30 seconds neutral spine. Jump board: introducing this session.' },
      vitals: { bp: '', pulse: '', temp: '' },
      medications: 'None',
      status: 'co_signed',
      reviewRequired: true,
      reviewedBy: 'INS-1',
      reviewedByName: 'Sarah Mitchell',
      reviewedAt: '2026-03-14T10:00:00Z',
      reviewNotes: 'Program progression reviewed. Instructor cues appropriate. Approved for jump board introduction.',
      createdAt: '2026-03-14T08:00:00Z',
    },
    {
      id: 'CHT-7', clientId: 'CLT-1005', patientName: 'Mia Garcia', providerId: 'INS-1',
      date: '2026-03-15', serviceId: 'SVC-11', serviceName: 'Private Training',
      mapType: 'none',
      subjective: 'Week 8 of private training program. Client\'s primary goal is postural correction and building confidence in movement after years of sedentary desk work. Reports standing taller and receiving compliments on posture from coworkers. No pain or discomfort.',
      objective: 'Posture reassessment at 8-week mark: forward head reduced by approximately 1.5cm from wall. Thoracic kyphosis visibly improved. Hip alignment symmetrical. Roll-up: smooth articulation to seated position. Teaser prep: legs to 45° with neutral lumbar, 10-second hold.',
      assessment: 'Significant postural improvement at 8 weeks. Client building genuine body awareness — self-corrects alignment without cueing during most exercises. Teaser prep milestone demonstrates strong core stability. Ready to begin intermediate program cycle.',
      plan: 'Transition to intermediate program: introduce full teaser, open leg rocker, and saw on reformer. Begin standing balance series. Set 12-week photo assessment with client consent. Discuss 3-session/week schedule to support continued progress. Client to continue daily posture reset habit (2-minute wall stand).',
      injectionMap: {},
      measurements: { weight: '', bmi: '', waistCircumference: '', measurementNotes: 'Posture: forward head reduced ~1.5cm from wall. Thoracic kyphosis: visibly improved. Flexibility score: 8/10 (up from 4/10 at intake). Core strength: 7/10. Teaser prep: 45°, 10-second hold achieved.' },
      vitals: { bp: '', pulse: '', temp: '' },
      medications: 'None',
      status: 'signed',
      reviewRequired: false,
      createdAt: '2026-03-15T10:00:00Z',
    },
    {
      id: 'CHT-8', clientId: 'CLT-1010', patientName: 'Lily Lee', providerId: 'INS-2',
      date: '2026-03-15', serviceId: 'SVC-2', serviceName: 'Barre',
      mapType: 'none',
      subjective: 'First barre class after 3-week absence (vacation). Client reports feeling "rusty" but energized. Prior to absence had completed 6 consecutive weeks. Expects some return of muscle soreness. No injuries during time off.',
      objective: 'Technique maintained well despite 3-week break — muscle memory evident. Balance slightly reduced from pre-break level but recovers quickly within class. Core engagement cueing needed more frequently than before break. Turnout consistent.',
      assessment: 'Expected detraining effect after 3-week break is minimal — client retains most technique adaptations. Muscle endurance will return within 1-2 weeks of consistent attendance. No modification needed.',
      plan: 'Resume normal class participation at prior level. Remind client that some soreness is expected this week. Encourage 2-3 classes this week to rebuild consistency. No new progressions until full endurance is re-established (approximately 1 week). Reconnect on goals at next session.',
      injectionMap: {},
      measurements: { weight: '', bmi: '', waistCircumference: '', measurementNotes: 'Post-break detraining: minimal technique loss, some endurance reduction. Balance: slightly reduced from pre-break. Muscle memory: intact. Estimated return to pre-break fitness: 1-2 weeks.' },
      vitals: { bp: '', pulse: '', temp: '' },
      medications: 'None',
      status: 'draft',
      reviewRequired: false,
      createdAt: '2026-03-15T14:00:00Z',
    },
  ]);
  localStorage.setItem('rp_charts_init', 'true');
}

// ── Main component ────────────────────────────────────────────────────────────

export default function Charts() {
  const s = useStyles();
  const [, setTick] = useState(0);
  useEffect(() => subscribe(() => setTick(t => t + 1)), []);
  useEffect(() => { initCharts(); setTick(t => t + 1); }, []);

  const [charts, setCharts] = useState(getCharts);
  const [activeId, setActiveId] = useState(null);
  const [showNew, setShowNew] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [editingZone, setEditingZone] = useState(null);
  const [showCoSign, setShowCoSign] = useState(false);
  const [coSignTargetId, setCoSignTargetId] = useState(null);

  const emptyForm = {
    clientId: '', serviceId: '', providerId: '',
    subjective: '', objective: '', assessment: '', plan: '',
    injectionMap: {}, vitals: { bp: '', pulse: '', temp: '' },
    medications: '', status: 'draft', mapType: 'face',
    measurements: { weight: '', bmi: '', waistCircumference: '', measurementNotes: '' },
    reviewRequired: false,
  };
  const [form, setForm] = useState(emptyForm);

  const clients = getPatients();
  const services = getServices();
  const providers = getProviders();

  const refresh = () => { setCharts(getCharts()); };
  const active = charts.find(c => c.id === activeId);

  // Derive current map type from selected service
  const currentMapType = getMapType(form.serviceId, services);
  const currentZones = getZonesForType(currentMapType);
  const currentMapLabel = getMapLabel(currentMapType);

  // Selected patient for allergy warning
  const selectedPatient = clients.find(p => p.id === form.clientId);

  const filtered = charts.filter(c => {
    if (search) {
      const q = search.toLowerCase();
      if (!c.patientName?.toLowerCase().includes(q) && !c.serviceName?.toLowerCase().includes(q)) return false;
    }
    if (statusFilter !== 'all' && c.status !== statusFilter) return false;
    return true;
  }).sort((a, b) => b.date.localeCompare(a.date));

  const openNew = () => {
    setActiveId(null);
    setForm(emptyForm);
    setShowNew(true);
  };

  const openChart = (chart) => {
    setActiveId(chart.id);
    setForm({
      clientId: chart.clientId, serviceId: chart.serviceId, providerId: chart.providerId,
      subjective: chart.subjective, objective: chart.objective, assessment: chart.assessment, plan: chart.plan,
      injectionMap: chart.injectionMap || {}, vitals: chart.vitals || { bp: '', pulse: '', temp: '' },
      medications: chart.medications || '', status: chart.status,
      mapType: chart.mapType || getMapType(chart.serviceId, services),
      measurements: chart.measurements || { weight: '', bmi: '', waistCircumference: '', measurementNotes: '' },
      reviewRequired: chart.reviewRequired || false,
    });
    setShowNew(true);
  };

  const handleSave = (action = 'draft') => {
    // action: 'draft' | 'sign' | 'submit_review'
    const pat = clients.find(p => p.id === form.clientId);
    const svc = services.find(sv => sv.id === form.serviceId);
    const mapType = getMapType(form.serviceId, services);

    let newStatus = 'draft';
    if (action === 'sign') newStatus = 'signed';
    else if (action === 'submit_review') newStatus = 'pending_review';

    const data = {
      ...form,
      mapType,
      patientName: pat ? `${pat.firstName} ${pat.lastName}` : 'Unknown',
      serviceName: svc?.name || 'Service',
      date: new Date().toISOString().slice(0, 10),
      status: newStatus,
    };

    const all = getCharts();
    if (activeId) {
      const idx = all.findIndex(c => c.id === activeId);
      if (idx >= 0) all[idx] = { ...all[idx], ...data };
    } else {
      data.id = `CHT-${Date.now()}`;
      data.createdAt = new Date().toISOString();
      all.unshift(data);
    }
    saveCharts(all);
    refresh();
    setShowNew(false);
  };

  const handleCoSign = (chartId, coSignData) => {
    const all = getCharts();
    const idx = all.findIndex(c => c.id === chartId);
    if (idx >= 0) {
      all[idx] = { ...all[idx], status: 'co_signed', ...coSignData };
    }
    saveCharts(all);
    refresh();
    setShowCoSign(false);
    setCoSignTargetId(null);
  };

  const addInjectionPoint = (zoneId) => {
    setEditingZone(zoneId);
  };

  const saveZone = (zoneId, value) => {
    const map = { ...form.injectionMap };
    if (value !== null) {
      // value is either a structured object or null
      if (isStructuredAnnotation(value) && !value.product && value.dose === null && !value.notes) {
        delete map[zoneId];
      } else if (value !== null) {
        map[zoneId] = value;
      }
    } else {
      delete map[zoneId];
    }
    setForm({ ...form, injectionMap: map });
    setEditingZone(null);
  };

  // Get the zone for the editing popover
  const getEditingZone = () => {
    if (!editingZone) return null;
    const allZones = [...FACE_ZONES, ...BODY_ZONES, ...SCALP_ZONES];
    return allZones.find(z => z.id === editingZone) || { id: editingZone, label: editingZone };
  };

  // Summary line for chart list cards
  const getChartZoneSummary = (chart) => {
    const count = Object.keys(chart.injectionMap || {}).length;
    const mt = chart.mapType || getMapType(chart.serviceId, services);
    if (mt === 'none' && chart.measurements?.weight) return 'vitals recorded';
    if (count === 0) return null;
    if (mt === 'body') return `${count} body zones`;
    if (mt === 'scalp') return `${count} scalp zones`;
    return `${count} injection sites`;
  };

  const editingZoneObj = getEditingZone();

  // Determine primary action button label + action
  const primaryActionLabel = form.reviewRequired ? 'Submit for Review' : 'Sign & Lock';
  const primaryAction = form.reviewRequired ? 'submit_review' : 'sign';

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ font: `600 26px ${s.FONT}`, color: s.text, marginBottom: 4 }}>Progress Tracking</h1>
          <p style={{ font: `400 14px ${s.FONT}`, color: s.text2 }}>SOAP notes, injection mapping, and session documentation</p>
        </div>
        <button onClick={openNew} style={s.pillAccent}>+ New Chart</button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search patient or service..." style={{ ...s.input, maxWidth: 260 }} />
        <div style={{ display: 'flex', gap: 6 }}>
          {[
            ['all', 'All'],
            ['draft', 'Drafts'],
            ['pending_review', 'Pending Review'],
            ['signed', 'Signed'],
            ['co_signed', 'Co-Signed'],
          ].map(([id, label]) => (
            <button key={id} onClick={() => setStatusFilter(id)} style={{
              ...s.pill, padding: '7px 14px', fontSize: 12,
              background: statusFilter === id ? s.accent : 'transparent',
              color: statusFilter === id ? s.accentText : s.text2,
              border: statusFilter === id ? `1px solid ${s.accent}` : '1px solid #E5E5E5',
            }}>{label}</button>
          ))}
        </div>
      </div>

      {/* Charts List */}
      <div style={{ display: 'grid', gap: 10 }}>
        {filtered.map(chart => {
          const prov = providers.find(p => p.id === chart.providerId);
          const zoneSummary = getChartZoneSummary(chart);
          return (
            <div key={chart.id} style={{
              ...s.cardStyle, padding: '18px 22px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.boxShadow = s.shadowMd}
            onMouseLeave={e => e.currentTarget.style.boxShadow = s.shadow}
            >
              <div
                style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1 }}
                onClick={() => openChart(chart)}
              >
                <div style={{ width: 42, height: 42, borderRadius: '50%', background: avatarBg(chart.status), display: 'flex', alignItems: 'center', justifyContent: 'center', font: `500 12px ${s.FONT}`, color: avatarColor(chart.status, s), flexShrink: 0 }}>
                  {chart.patientName?.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <div style={{ font: `500 14px ${s.FONT}`, color: s.text }}>{chart.patientName} — {chart.serviceName}</div>
                  <div style={{ font: `400 12px ${s.FONT}`, color: s.text2 }}>
                    {prov?.name?.split(',')[0] || 'Instructor'} · {chart.date}
                    {chart.status === 'co_signed' && chart.reviewedByName && (
                      <span style={{ color: '#16A34A', marginLeft: 6 }}>· Co-signed by {chart.reviewedByName}</span>
                    )}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {zoneSummary && <span style={{ padding: '3px 8px', borderRadius: 100, background: '#F5F5F5', font: `400 10px ${s.MONO}`, color: s.text2 }}>{zoneSummary}</span>}
                <StatusBadge status={chart.status} s={s} />
                {chart.status === 'pending_review' && (
                  <button
                    onClick={e => { e.stopPropagation(); setCoSignTargetId(chart.id); setShowCoSign(true); }}
                    style={{ ...s.pillAccent, padding: '5px 12px', fontSize: 11, flexShrink: 0 }}
                  >
                    Co-Sign
                  </button>
                )}
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div style={{ ...s.cardStyle, padding: 48, textAlign: 'center', font: `400 14px ${s.FONT}`, color: s.text3 }}>No charts found</div>
        )}
      </div>

      {/* Chart Editor Modal */}
      {showNew && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300 }} onClick={() => setShowNew(false)}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 32, maxWidth: 900, width: '95%', boxShadow: s.shadowLg, maxHeight: '92vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <h2 style={{ font: `600 22px ${s.FONT}`, color: s.text, marginBottom: 20 }}>{activeId ? 'Edit Chart' : 'New Clinical Chart'}</h2>

            {/* Allergy warning banner */}
            {selectedPatient?.allergies && (
              <div style={{
                background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10,
                padding: '12px 16px', marginBottom: 20,
                display: 'flex', alignItems: 'flex-start', gap: 10,
              }}>
                <span style={{ fontSize: 18, flexShrink: 0 }}>⚠</span>
                <div>
                  <div style={{ font: `600 13px ${s.FONT}`, color: '#B91C1C', marginBottom: 2 }}>Known Allergies</div>
                  <div style={{ font: `400 13px ${s.FONT}`, color: '#DC2626' }}>{selectedPatient.allergies}</div>
                </div>
              </div>
            )}

            {/* Client / Service / Instructor */}
            <div className="charts-meta-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 20 }}>
              <div>
                <label style={s.label}>Patient</label>
                <select value={form.clientId} onChange={e => setForm({ ...form, clientId: e.target.value })} style={{ ...s.input, cursor: 'pointer' }}>
                  <option value="">Select...</option>
                  {clients.map(p => <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>)}
                </select>
              </div>
              <div>
                <label style={s.label}>Service</label>
                <select value={form.serviceId} onChange={e => setForm({ ...form, serviceId: e.target.value, injectionMap: {} })} style={{ ...s.input, cursor: 'pointer' }}>
                  <option value="">Select...</option>
                  {services.map(sv => <option key={sv.id} value={sv.id}>{sv.name}</option>)}
                </select>
              </div>
              <div>
                <label style={s.label}>Instructor</label>
                <select value={form.providerId} onChange={e => setForm({ ...form, providerId: e.target.value })} style={{ ...s.input, cursor: 'pointer' }}>
                  <option value="">Select...</option>
                  {providers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
            </div>

            {/* Vitals */}
            <div className="charts-vitals-row" style={{ display: 'flex', gap: 14, marginBottom: 20 }}>
              {[['bp', 'Blood Pressure'], ['pulse', 'Pulse'], ['temp', 'Temp (F)']].map(([key, label]) => (
                <div key={key} style={{ flex: 1 }}>
                  <label style={s.label}>{label}</label>
                  <input value={form.vitals[key] || ''} onChange={e => setForm({ ...form, vitals: { ...form.vitals, [key]: e.target.value } })} style={s.input} placeholder={key === 'bp' ? '120/80' : key === 'pulse' ? '72' : '98.6'} />
                </div>
              ))}
              <div style={{ flex: 2 }}>
                <label style={s.label}>Current Medications</label>
                <input value={form.medications} onChange={e => setForm({ ...form, medications: e.target.value })} style={s.input} placeholder="List medications" />
              </div>
            </div>

            <div className="charts-editor-grid" style={{ display: 'grid', gridTemplateColumns: currentMapType === 'none' ? '1fr 320px' : '1fr 320px', gap: 20 }}>
              {/* SOAP Notes */}
              <div>
                {[
                  { key: 'subjective', label: 'S — Subjective', placeholder: 'Chief complaint, patient history, symptoms, concerns...' },
                  { key: 'objective', label: 'O — Objective', placeholder: 'Physical findings, observations, measurements...' },
                  { key: 'assessment', label: 'A — Assessment', placeholder: 'Clinical assessment, diagnosis, session candidacy...' },
                  { key: 'plan', label: 'P — Plan', placeholder: 'Treatment performed, products/units used, post-care instructions, follow-up...' },
                ].map(field => (
                  <div key={field.key} style={{ marginBottom: 14 }}>
                    <label style={{ ...s.label, color: s.accent }}>{field.label}</label>
                    <textarea value={form[field.key]} onChange={e => setForm({ ...form, [field.key]: e.target.value })} rows={3} style={{ ...s.input, resize: 'vertical', lineHeight: 1.6 }} placeholder={field.placeholder} />
                  </div>
                ))}
              </div>

              {/* Right panel: Map or Vitals based on service type */}
              <div>
                {currentMapType === 'none' ? (
                  <VitalsPanel form={form} setForm={setForm} s={s} />
                ) : (
                  <>
                    <label style={{ ...s.label, marginBottom: 12 }}>{currentMapLabel}</label>
                    <div style={{
                      position: 'relative', width: '100%',
                      aspectRatio: currentMapType === 'body' ? '0.625' : '0.75',
                      background: '#FAFAFA', borderRadius: 12, border: '1px solid #E5E5E5', overflow: 'hidden',
                    }}>
                      {/* SVG outline */}
                      {currentMapType === 'face' && <FaceSVG />}
                      {currentMapType === 'body' && <BodySVG />}
                      {currentMapType === 'scalp' && <ScalpSVG />}

                      {/* Zone points */}
                      {currentZones.map(zone => {
                        const val = form.injectionMap[zone.id];
                        const hasValue = Boolean(val);
                        const pillText = hasValue ? formatAnnotationPill(val) : '';
                        return (
                          <div key={zone.id} onClick={() => addInjectionPoint(zone.id)} style={{
                            position: 'absolute', left: `${zone.x}%`, top: `${zone.y}%`,
                            transform: 'translate(-50%, -50%)', cursor: 'pointer', zIndex: 10,
                          }}>
                            <div style={{
                              width: hasValue ? 'auto' : 14,
                              minWidth: hasValue ? 24 : 14,
                              height: hasValue ? 20 : 14,
                              borderRadius: hasValue ? 100 : '50%',
                              background: hasValue ? s.accent : 'rgba(0,0,0,0.08)',
                              border: hasValue ? 'none' : '1.5px dashed #CCC',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              padding: hasValue ? '0 5px' : 0,
                              font: `600 7px ${s.MONO}`, color: s.accentText,
                              transition: 'all 0.15s',
                              whiteSpace: 'nowrap',
                            }}>
                              {hasValue && pillText}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div style={{ font: `400 10px ${s.FONT}`, color: s.text3, marginTop: 6, textAlign: 'center' }}>
                      {currentMapType === 'face' && 'Click points to add injection details'}
                      {currentMapType === 'body' && 'Click zones to add session details'}
                      {currentMapType === 'scalp' && 'Click zones to add session details'}
                    </div>

                    {/* Treatment summary (edit mode) */}
                    <TreatmentSummary
                      injectionMap={form.injectionMap}
                      zones={currentZones}
                      s={s}
                    />
                  </>
                )}
              </div>
            </div>

            {/* MD Review checkbox */}
            <div style={{ marginTop: 20, padding: '14px 16px', background: '#FAFAFA', borderRadius: 10, border: '1px solid #E5E5E5' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', font: `400 13px ${s.FONT}`, color: s.text }}>
                <input
                  type="checkbox"
                  checked={form.reviewRequired}
                  onChange={e => setForm({ ...form, reviewRequired: e.target.checked })}
                  style={{ width: 16, height: 16, cursor: 'pointer', accentColor: s.accent }}
                />
                <span>Requires Medical Director review</span>
                {form.reviewRequired && (
                  <span style={{ padding: '2px 8px', borderRadius: 100, background: '#EFF6FF', font: `500 10px ${s.FONT}`, color: '#2563EB', border: '1px solid #BFDBFE' }}>
                    Will submit for MD co-sign
                  </span>
                )}
              </label>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowNew(false)} style={s.pillGhost}>Cancel</button>
              <button onClick={() => handleSave('draft')} style={s.pillOutline}>Save Draft</button>
              <button onClick={() => handleSave(primaryAction)} style={s.pillAccent}>{primaryActionLabel}</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .charts-editor-grid {
            grid-template-columns: 1fr !important;
          }
          .charts-meta-grid {
            grid-template-columns: 1fr !important;
          }
          .charts-vitals-row {
            flex-wrap: wrap !important;
          }
        }
      `}</style>

      {/* Zone Annotation Popover (structured form) */}
      {editingZone && editingZoneObj && (
        <ZoneAnnotationPopover
          key={editingZone}
          zoneId={editingZone}
          zoneLabel={editingZoneObj.label}
          currentValue={form.injectionMap[editingZone]}
          onSave={(val) => saveZone(editingZone, val)}
          onClose={() => setEditingZone(null)}
          s={s}
          mapType={currentMapType}
        />
      )}

      {/* Co-Sign Modal */}
      {showCoSign && coSignTargetId && (
        <CoSignModal
          providers={providers}
          onConfirm={(data) => handleCoSign(coSignTargetId, data)}
          onClose={() => { setShowCoSign(false); setCoSignTargetId(null); }}
          s={s}
        />
      )}
    </div>
  );
}
