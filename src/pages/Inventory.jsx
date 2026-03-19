import { useState, useEffect } from 'react';
import { useStyles } from '../theme';
import { getInventory, addInventoryItem, updateInventoryItem, adjustStock, getLocations, subscribe } from '../data/store';

// Format a quantity: show decimals only when needed (e.g. 47 → "47", 47.5 → "47.5")
const fmtQty = (q) => {
  const n = parseFloat(q);
  if (isNaN(n)) return '0';
  return n % 1 === 0 ? String(n) : n.toFixed(2).replace(/\.?0+$/, '');
};

const fmt = (cents) => `$${(cents / 100).toFixed(2)}`;

export default function Inventory() {
  const s = useStyles();
  const [, setTick] = useState(0);
  useEffect(() => subscribe(() => setTick(t => t + 1)), []);

  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('All');
  const [locFilter, setLocFilter] = useState('All');
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [showAdjust, setShowAdjust] = useState(null);
  const [adjustQty, setAdjustQty] = useState(0);
  const [adjustReason, setAdjustReason] = useState('');
  const [form, setForm] = useState({ name: '', category: 'Equipment', sku: '', lotNumber: '', ndc: '', quantity: 0, reorderAt: 5, unitCost: 0, location: 'LOC-1', expirationDate: '' });

  const inventory = getInventory();
  const locations = getLocations();

  const categories = [...new Set(inventory.map(i => i.category))];

  const filtered = inventory.filter(i => {
    if (search && !i.name.toLowerCase().includes(search.toLowerCase()) && !i.sku?.toLowerCase().includes(search.toLowerCase())) return false;
    if (catFilter !== 'All' && i.category !== catFilter) return false;
    if (locFilter !== 'All' && i.location !== locFilter) return false;
    return true;
  });

  const totalValue = filtered.reduce((sum, i) => sum + (i.quantity * (i.unitCost || 0)), 0);
  const lowStockCount = inventory.filter(i => i.quantity <= i.reorderAt).length;
  const expiringCount = inventory.filter(i => {
    if (!i.expirationDate) return false;
    const daysUntil = (new Date(i.expirationDate) - new Date()) / (1000 * 60 * 60 * 24);
    return daysUntil <= 90 && daysUntil > 0;
  }).length;

  const handleSave = () => {
    if (!form.name.trim()) return;
    if (editItem) {
      updateInventoryItem(editItem.id, form);
    } else {
      addInventoryItem({ ...form, adjustmentLog: [] });
    }
    setShowForm(false);
  };

  const handleAdjust = () => {
    if (adjustQty === 0) return;
    adjustStock(showAdjust.id, adjustQty, adjustReason || 'Manual adjustment');
    setShowAdjust(null);
    setAdjustQty(0);
    setAdjustReason('');
  };

  const openEdit = (item) => {
    setEditItem(item);
    setForm({ name: item.name, category: item.category, sku: item.sku || '', lotNumber: item.lotNumber || '', ndc: item.ndc || '', quantity: item.quantity, reorderAt: item.reorderAt, unitCost: item.unitCost || 0, location: item.location, expirationDate: item.expirationDate || '' });
    setShowForm(true);
  };

  const stockLevel = (item) => {
    if (item.quantity === 0) return { label: 'Out', color: s.danger, bg: '#FEF2F2' };
    if (item.quantity <= item.reorderAt / 2) return { label: 'Critical', color: s.danger, bg: '#FEF2F2' };
    if (item.quantity <= item.reorderAt) return { label: 'Low', color: s.warning, bg: '#FFFBEB' };
    return { label: 'Good', color: s.success, bg: '#F0FDF4' };
  };

  return (
    <div>
      <style>{`
        @media (max-width: 768px) {
          .inv-modal-grid {
            grid-template-columns: 1fr !important;
          }
          .inv-modal-grid > div[style*="1 / -1"] {
            grid-column: 1 !important;
          }
        }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ font: `600 26px ${s.FONT}`, color: s.text, marginBottom: 4 }}>Inventory</h1>
          <p style={{ font: `400 14px ${s.FONT}`, color: s.text2 }}>{inventory.length} items — Track equipment, retail products, and studio supplies</p>
        </div>
        <button onClick={() => { setEditItem(null); setForm({ name: '', category: 'Equipment', sku: '', lotNumber: '', ndc: '', quantity: 0, reorderAt: 5, unitCost: 0, location: 'LOC-1', expirationDate: '' }); setShowForm(true); }} style={s.pillAccent}>
          + Add Item
        </button>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 24 }}>
        <div style={{ ...s.cardStyle, padding: '16px 20px' }}>
          <div style={{ font: `400 10px ${s.MONO}`, textTransform: 'uppercase', letterSpacing: 1, color: s.text3, marginBottom: 6 }}>Total Value</div>
          <div style={{ font: `600 22px ${s.FONT}`, color: s.text }}>{fmt(totalValue)}</div>
        </div>
        <div style={{ ...s.cardStyle, padding: '16px 20px' }}>
          <div style={{ font: `400 10px ${s.MONO}`, textTransform: 'uppercase', letterSpacing: 1, color: s.text3, marginBottom: 6 }}>Low Stock</div>
          <div style={{ font: `600 22px ${s.FONT}`, color: lowStockCount > 0 ? s.warning : s.success }}>{lowStockCount} items</div>
        </div>
        <div style={{ ...s.cardStyle, padding: '16px 20px' }}>
          <div style={{ font: `400 10px ${s.MONO}`, textTransform: 'uppercase', letterSpacing: 1, color: s.text3, marginBottom: 6 }}>Expiring Soon</div>
          <div style={{ font: `600 22px ${s.FONT}`, color: expiringCount > 0 ? s.danger : s.success }}>{expiringCount} items</div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or SKU..." style={{ ...s.input, maxWidth: 280 }} />
        <select value={catFilter} onChange={e => setCatFilter(e.target.value)} style={{ ...s.input, width: 'auto', cursor: 'pointer' }}>
          <option value="All">All Categories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={locFilter} onChange={e => setLocFilter(e.target.value)} style={{ ...s.input, width: 'auto', cursor: 'pointer' }}>
          <option value="All">All Locations</option>
          {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
        </select>
      </div>

      {/* Table */}
      <div style={s.tableWrap}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #E5E5E5' }}>
                {['Item', 'SKU', 'Category', 'Stock', 'Status', 'Unit Cost', 'Value', 'Expires', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '12px 14px', font: `500 11px ${s.MONO}`, textTransform: 'uppercase', letterSpacing: 1, color: s.text3, textAlign: 'left' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(item => {
                const sl = stockLevel(item);
                const loc = locations.find(l => l.id === item.location);
                const daysUntilExp = item.expirationDate ? Math.floor((new Date(item.expirationDate) - new Date()) / (1000 * 60 * 60 * 24)) : null;
                return (
                  <tr key={item.id} style={{ borderBottom: '1px solid #F5F5F5' }}>
                    <td style={{ padding: '14px', font: `500 13px ${s.FONT}`, color: s.text }}>
                      {item.name}
                      {loc && <div style={{ font: `400 11px ${s.FONT}`, color: s.text3 }}>{loc.name}</div>}
                      {item.lotNumber && <div style={{ font: `400 11px ${s.MONO}`, color: s.text3, marginTop: 2 }}>Lot: {item.lotNumber}</div>}
                    </td>
                    <td style={{ padding: '14px', font: `400 12px ${s.MONO}`, color: s.text3 }}>{item.sku || '—'}</td>
                    <td style={{ padding: '14px' }}>
                      <span style={{ padding: '3px 10px', borderRadius: 100, font: `500 11px ${s.FONT}`, background: '#F5F5F5', color: s.text2 }}>{item.category}</span>
                    </td>
                    <td style={{ padding: '14px', font: `600 14px ${s.MONO}`, color: s.text }}>{fmtQty(item.quantity)}</td>
                    <td style={{ padding: '14px' }}>
                      <span style={{ padding: '3px 10px', borderRadius: 100, font: `500 10px ${s.FONT}`, textTransform: 'uppercase', background: sl.bg, color: sl.color }}>{sl.label}</span>
                    </td>
                    <td style={{ padding: '14px', font: `400 13px ${s.MONO}`, color: s.text2 }}>{fmt(item.unitCost)}</td>
                    <td style={{ padding: '14px', font: `500 13px ${s.MONO}`, color: s.text }}>{fmt(item.quantity * item.unitCost)}</td>
                    <td style={{ padding: '14px', font: `400 12px ${s.FONT}`, color: daysUntilExp !== null && daysUntilExp <= 90 ? s.danger : s.text3 }}>
                      {item.expirationDate ? `${daysUntilExp}d` : '—'}
                    </td>
                    <td style={{ padding: '14px' }}>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button onClick={() => { setShowAdjust(item); setAdjustQty(0); setAdjustReason(''); }} style={{ ...s.pillGhost, padding: '4px 8px', fontSize: 10 }}>±</button>
                        <button onClick={() => openEdit(item)} style={{ ...s.pillGhost, padding: '4px 8px', fontSize: 10 }}>Edit</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Adjust Stock Modal */}
      {showAdjust && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300 }} onClick={() => setShowAdjust(null)}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 32, maxWidth: 400, width: '90%', boxShadow: s.shadowLg }} onClick={e => e.stopPropagation()}>
            <h2 style={{ font: `600 18px ${s.FONT}`, color: s.text, marginBottom: 8 }}>Adjust Stock</h2>
            <p style={{ font: `400 14px ${s.FONT}`, color: s.text2, marginBottom: 20 }}>{showAdjust.name} — Current: {fmtQty(showAdjust.quantity)}</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <button onClick={() => setAdjustQty(parseFloat((adjustQty - 1).toFixed(2)))} style={{ ...s.pillGhost, width: 40, height: 40, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>−</button>
              <input type="number" step="any" value={adjustQty} onChange={e => setAdjustQty(parseFloat(e.target.value) || 0)} style={{ ...s.input, width: 80, textAlign: 'center', font: `600 18px ${s.MONO}` }} />
              <button onClick={() => setAdjustQty(parseFloat((adjustQty + 1).toFixed(2)))} style={{ ...s.pillGhost, width: 40, height: 40, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>+</button>
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={s.label}>Reason</label>
              <select value={adjustReason} onChange={e => setAdjustReason(e.target.value)} style={{ ...s.input, cursor: 'pointer' }}>
                <option value="">Select reason...</option>
                <option value="Received shipment">Received shipment</option>
                <option value="Used in session">Used in session</option>
                <option value="Damaged/expired">Damaged / Expired</option>
                <option value="Returned to vendor">Returned to vendor</option>
                <option value="Inventory count correction">Count correction</option>
                <option value="Transferred">Transferred</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowAdjust(null)} style={s.pillGhost}>Cancel</button>
              <button onClick={handleAdjust} style={{ ...s.pillAccent, background: adjustQty > 0 ? s.success : adjustQty < 0 ? s.danger : s.accent }}>
                {adjustQty > 0 ? `Add ${fmtQty(adjustQty)}` : adjustQty < 0 ? `Remove ${fmtQty(Math.abs(adjustQty))}` : 'No Change'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300 }} onClick={() => setShowForm(false)}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 32, maxWidth: 520, width: '90%', boxShadow: s.shadowLg, maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <h2 style={{ font: `600 20px ${s.FONT}`, color: s.text, marginBottom: 24 }}>{editItem ? 'Edit Item' : 'Add Inventory Item'}</h2>
            <div className="inv-modal-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={s.label}>Item Name</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={s.input} placeholder="e.g., Reformer (100u vial)" />
              </div>
              <div>
                <label style={s.label}>Category</label>
                <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} style={{ ...s.input, cursor: 'pointer' }}>
                  <option>Equipment</option><option>Wellness</option><option>Supplies</option><option>Retail</option>
                </select>
              </div>
              <div>
                <label style={s.label}>SKU</label>
                <input value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })} style={s.input} />
              </div>
              <div>
                <label style={s.label}>Lot Number</label>
                <input value={form.lotNumber} onChange={e => setForm({ ...form, lotNumber: e.target.value })} style={s.input} placeholder="e.g., BTX-2026-0312" />
              </div>
              {form.category === 'Equipment' && (
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={s.label}>NDC (National Drug Code)</label>
                  <input value={form.ndc} onChange={e => setForm({ ...form, ndc: e.target.value })} style={s.input} placeholder="e.g., 0023-1145-01" />
                </div>
              )}
              <div>
                <label style={s.label}>Quantity</label>
                <input type="number" step="any" value={form.quantity} onChange={e => setForm({ ...form, quantity: parseFloat(e.target.value) || 0 })} style={s.input} />
              </div>
              <div>
                <label style={s.label}>Reorder At</label>
                <input type="number" step="any" value={form.reorderAt} onChange={e => setForm({ ...form, reorderAt: parseFloat(e.target.value) || 0 })} style={s.input} />
              </div>
              <div>
                <label style={s.label}>Unit Cost (cents)</label>
                <input type="number" value={form.unitCost} onChange={e => setForm({ ...form, unitCost: parseInt(e.target.value) || 0 })} style={s.input} />
              </div>
              <div>
                <label style={s.label}>Location</label>
                <select value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} style={{ ...s.input, cursor: 'pointer' }}>
                  {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={s.label}>Expiration Date</label>
                <input type="date" value={form.expirationDate} onChange={e => setForm({ ...form, expirationDate: e.target.value })} style={s.input} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 24, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowForm(false)} style={s.pillGhost}>Cancel</button>
              <button onClick={handleSave} style={s.pillAccent}>{editItem ? 'Save' : 'Add Item'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
