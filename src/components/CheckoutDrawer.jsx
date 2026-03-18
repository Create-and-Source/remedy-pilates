// Checkout Drawer — slides in from the right when a patient visit is complete
// Handles line items, discounts (membership/gift card/credit), tax, tips, payment

import { useState, useEffect, useCallback } from 'react';
import { useStyles } from '../theme';
import { getServices, getPatients } from '../data/store';

const TAX_RATE = 0.086; // 8.6%
const TX_KEY = 'rp_transactions';

function getTransactions() {
  try { return JSON.parse(localStorage.getItem(TX_KEY)) || []; } catch { return []; }
}
function saveTransaction(tx) {
  const all = getTransactions();
  tx.id = `TX-${Date.now()}`;
  tx.completedAt = new Date().toISOString();
  all.unshift(tx);
  localStorage.setItem(TX_KEY, JSON.stringify(all));
}

function getWallet(patientId) {
  try {
    const wallets = JSON.parse(localStorage.getItem('rp_wallets')) || {};
    return wallets[patientId] || { membershipUnits: 0, giftCard: 0, credit: 0 };
  } catch { return { membershipUnits: 0, giftCard: 0, credit: 0 }; }
}

function updateWallet(patientId, updates) {
  try {
    const wallets = JSON.parse(localStorage.getItem('rp_wallets')) || {};
    wallets[patientId] = { ...getWallet(patientId), ...updates };
    localStorage.setItem('rp_wallets', JSON.stringify(wallets));
  } catch {}
}

const fmt = (cents) => `$${(Math.abs(cents) / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function CheckoutDrawer({ open, onClose, appointment }) {
  const s = useStyles();
  const [addOns, setAddOns] = useState([]);
  const [addOnInput, setAddOnInput] = useState({ name: '', price: '' });
  const [discounts, setDiscounts] = useState({ membership: 0, giftCard: 0, credit: 0 });
  const [tipType, setTipType] = useState('18');
  const [customTip, setCustomTip] = useState('');
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [complete, setComplete] = useState(false);

  const services = getServices();
  const service = services.find(sv => sv.id === appointment?.serviceId);
  const patient = appointment ? getPatients().find(p => p.id === appointment.patientId) : null;
  const wallet = appointment ? getWallet(appointment.patientId) : { membershipUnits: 0, giftCard: 0, credit: 0 };

  // Reset state when a new appointment opens
  useEffect(() => {
    if (open) {
      setAddOns([]);
      setAddOnInput({ name: '', price: '' });
      setDiscounts({ membership: 0, giftCard: 0, credit: 0 });
      setTipType('18');
      setCustomTip('');
      setPaymentMethod(null);
      setProcessing(false);
      setComplete(false);
    }
  }, [open, appointment?.id]);

  // Calculations
  const servicePrice = service?.price || 0;
  const addOnTotal = addOns.reduce((sum, a) => sum + a.price, 0);
  const subtotalBeforeDiscount = servicePrice + addOnTotal;
  const totalDiscount = discounts.membership + discounts.giftCard + discounts.credit;
  const subtotal = Math.max(0, subtotalBeforeDiscount - totalDiscount);
  const tax = Math.round(subtotal * TAX_RATE);
  const tipPercent = tipType === 'none' ? 0 : tipType === 'custom' ? 0 : parseInt(tipType);
  const tipAmount = tipType === 'custom' ? Math.round((parseFloat(customTip) || 0) * 100) : Math.round(subtotal * tipPercent / 100);
  const total = subtotal + tax + tipAmount;

  const addAddOn = () => {
    if (!addOnInput.name || !addOnInput.price) return;
    setAddOns([...addOns, { name: addOnInput.name, price: Math.round(parseFloat(addOnInput.price) * 100) }]);
    setAddOnInput({ name: '', price: '' });
  };

  const removeAddOn = (idx) => setAddOns(addOns.filter((_, i) => i !== idx));

  const processPayment = useCallback(() => {
    if (!paymentMethod) return;
    setProcessing(true);
    setTimeout(() => {
      // Save transaction
      saveTransaction({
        appointmentId: appointment?.id,
        patientId: appointment?.patientId,
        patientName: appointment?.patientName,
        serviceId: appointment?.serviceId,
        serviceName: service?.name,
        servicePrice,
        addOns,
        discounts,
        subtotal,
        tax,
        tipAmount,
        total,
        paymentMethod,
      });

      // Deduct wallet balances
      if (totalDiscount > 0) {
        const w = getWallet(appointment?.patientId);
        updateWallet(appointment?.patientId, {
          membershipUnits: Math.max(0, w.membershipUnits - discounts.membership),
          giftCard: Math.max(0, w.giftCard - discounts.giftCard),
          credit: Math.max(0, w.credit - discounts.credit),
        });
      }

      setProcessing(false);
      setComplete(true);
    }, 1500);
  }, [paymentMethod, appointment, service, servicePrice, addOns, discounts, subtotal, tax, tipAmount, total, totalDiscount]);

  const handleClose = () => {
    if (onClose) onClose();
  };

  if (!open || !appointment) return null;

  const tipOptions = [
    { label: '15%', value: '15' },
    { label: '18%', value: '18' },
    { label: '20%', value: '20' },
    { label: 'Custom', value: 'custom' },
    { label: 'No Tip', value: 'none' },
  ];

  const payOptions = [
    { label: 'Square / Card', value: 'card', icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" />
      </svg>
    )},
    { label: 'Cash', value: 'cash', icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
      </svg>
    )},
    { label: 'Cherry Financing', value: 'cherry', icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <circle cx="12" cy="12" r="10" /><path d="M8 12l3 3 5-5" />
      </svg>
    )},
  ];

  return (
    <>
      {/* Backdrop */}
      <div onClick={handleClose} style={{
        position: 'fixed', inset: 0, zIndex: 500,
        background: 'rgba(0,0,0,0.35)',
        backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)',
        animation: 'coFadeIn 0.25s ease',
      }} />

      {/* Drawer */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 501,
        width: 420, maxWidth: '95vw',
        background: 'rgba(255,255,255,0.88)',
        backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
        borderLeft: '1px solid rgba(255,255,255,0.6)',
        boxShadow: '-8px 0 40px rgba(0,0,0,0.12)',
        display: 'flex', flexDirection: 'column',
        animation: 'coSlideIn 0.3s cubic-bezier(0.16,1,0.3,1)',
      }}>

        {/* Header */}
        <div style={{
          padding: '24px 28px 16px', borderBottom: '1px solid rgba(0,0,0,0.06)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        }}>
          <div>
            <h2 style={{ font: `600 20px ${s.FONT}`, color: s.text, marginBottom: 4 }}>Checkout</h2>
            <p style={{ font: `400 13px ${s.FONT}`, color: s.text2, margin: 0 }}>
              {appointment.patientName}
            </p>
          </div>
          <button onClick={handleClose} style={{
            background: 'none', border: 'none', cursor: 'pointer', color: s.text3,
            padding: 4, borderRadius: 8,
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Scrollable content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 28px' }}>

          {complete ? (
            /* ─── Success State ─── */
            <div style={{ textAlign: 'center', paddingTop: 60 }}>
              <div style={{
                width: 80, height: 80, borderRadius: '50%',
                background: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 24px',
                animation: 'coSuccessPop 0.4s cubic-bezier(0.16,1,0.3,1)',
              }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </div>
              <h3 style={{ font: `600 22px ${s.FONT}`, color: s.text, marginBottom: 8 }}>Payment Complete</h3>
              <p style={{ font: `400 14px ${s.FONT}`, color: s.text2, marginBottom: 8 }}>{fmt(total)} charged via {paymentMethod === 'card' ? 'Square / Card' : paymentMethod === 'cash' ? 'Cash' : 'Cherry Financing'}</p>
              <p style={{ font: `400 13px ${s.FONT}`, color: s.text3, marginBottom: 32 }}>{appointment.patientName} — {service?.name}</p>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                <button onClick={() => { window.print(); }} style={{ ...s.pillOutline, padding: '10px 22px' }}>
                  Print Receipt
                </button>
                <button onClick={handleClose} style={{ ...s.pillAccent, padding: '10px 22px' }}>
                  Done
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* ─── Line Items ─── */}
              <div style={{ marginBottom: 20 }}>
                <label style={s.label}>Service</label>
                <div style={{
                  ...s.cardStyle, padding: '14px 18px',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                  <div>
                    <div style={{ font: `500 14px ${s.FONT}`, color: s.text }}>{service?.name || 'Service'}</div>
                    <div style={{ font: `400 11px ${s.FONT}`, color: s.text3 }}>{service?.unit || ''}</div>
                  </div>
                  <div style={{ font: `600 15px ${s.FONT}`, color: s.text }}>{fmt(servicePrice)}</div>
                </div>
              </div>

              {/* Add-ons */}
              <div style={{ marginBottom: 20 }}>
                <label style={s.label}>Add-Ons</label>
                {addOns.map((a, idx) => (
                  <div key={idx} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '8px 0', borderBottom: '1px solid rgba(0,0,0,0.04)',
                  }}>
                    <span style={{ font: `400 13px ${s.FONT}`, color: s.text }}>{a.name}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ font: `500 13px ${s.FONT}`, color: s.text }}>{fmt(a.price)}</span>
                      <button onClick={() => removeAddOn(idx)} style={{
                        background: 'none', border: 'none', cursor: 'pointer', color: s.danger, fontSize: 14, padding: 2,
                      }}>x</button>
                    </div>
                  </div>
                ))}
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <input
                    value={addOnInput.name} onChange={e => setAddOnInput({ ...addOnInput, name: e.target.value })}
                    placeholder="Add-on name" style={{ ...s.input, flex: 1, padding: '8px 12px', fontSize: 12 }}
                  />
                  <input
                    value={addOnInput.price} onChange={e => setAddOnInput({ ...addOnInput, price: e.target.value })}
                    placeholder="$" type="number" step="0.01"
                    style={{ ...s.input, width: 80, padding: '8px 12px', fontSize: 12 }}
                  />
                  <button onClick={addAddOn} style={{ ...s.pillOutline, padding: '8px 14px', fontSize: 11 }}>Add</button>
                </div>
              </div>

              {/* ─── Discounts ─── */}
              <div style={{ marginBottom: 20 }}>
                <label style={s.label}>Discounts</label>
                <div style={{ display: 'grid', gap: 10 }}>
                  {[
                    { key: 'membership', label: 'Membership Units', available: wallet.membershipUnits },
                    { key: 'giftCard', label: 'Gift Card', available: wallet.giftCard },
                    { key: 'credit', label: 'Account Credit', available: wallet.credit },
                  ].map(d => (
                    <div key={d.key} style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '10px 14px', borderRadius: 10,
                      background: 'rgba(255,255,255,0.5)', border: '1px solid rgba(0,0,0,0.04)',
                    }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ font: `500 12px ${s.FONT}`, color: s.text }}>{d.label}</div>
                        <div style={{ font: `400 10px ${s.FONT}`, color: s.text3 }}>Available: {fmt(d.available)}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ font: `400 12px ${s.FONT}`, color: s.text3 }}>$</span>
                        <input
                          type="number" step="0.01" min="0"
                          max={(d.available / 100).toFixed(2)}
                          value={discounts[d.key] ? (discounts[d.key] / 100).toFixed(2) : ''}
                          onChange={e => {
                            const val = Math.min(Math.round(parseFloat(e.target.value || 0) * 100), d.available);
                            setDiscounts({ ...discounts, [d.key]: val });
                          }}
                          placeholder="0.00"
                          style={{ ...s.input, width: 80, padding: '6px 10px', fontSize: 12 }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ─── Totals ─── */}
              <div style={{
                padding: '16px 18px', borderRadius: 14, marginBottom: 20,
                background: 'rgba(255,255,255,0.5)', border: '1px solid rgba(0,0,0,0.04)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ font: `400 13px ${s.FONT}`, color: s.text2 }}>Subtotal</span>
                  <span style={{ font: `500 13px ${s.FONT}`, color: s.text }}>{fmt(subtotalBeforeDiscount)}</span>
                </div>
                {totalDiscount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ font: `400 13px ${s.FONT}`, color: s.success }}>Discounts</span>
                    <span style={{ font: `500 13px ${s.FONT}`, color: s.success }}>-{fmt(totalDiscount)}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ font: `400 13px ${s.FONT}`, color: s.text2 }}>Tax (8.6%)</span>
                  <span style={{ font: `500 13px ${s.FONT}`, color: s.text }}>{fmt(tax)}</span>
                </div>
                {tipAmount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ font: `400 13px ${s.FONT}`, color: s.text2 }}>Tip</span>
                    <span style={{ font: `500 13px ${s.FONT}`, color: s.text }}>{fmt(tipAmount)}</span>
                  </div>
                )}
                <div style={{ height: 1, background: 'rgba(0,0,0,0.06)', margin: '10px 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ font: `600 15px ${s.FONT}`, color: s.text }}>Total</span>
                  <span style={{ font: `600 18px ${s.FONT}`, color: s.accent }}>{fmt(total)}</span>
                </div>
              </div>

              {/* ─── Tip Selector ─── */}
              <div style={{ marginBottom: 20 }}>
                <label style={s.label}>Tip</label>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {tipOptions.map(t => (
                    <button key={t.value} onClick={() => setTipType(t.value)} style={{
                      padding: '8px 14px', borderRadius: 10, cursor: 'pointer',
                      font: `500 12px ${s.FONT}`,
                      background: tipType === t.value ? s.accent : 'rgba(255,255,255,0.5)',
                      color: tipType === t.value ? s.accentText : s.text2,
                      border: tipType === t.value ? 'none' : '1px solid rgba(0,0,0,0.06)',
                      transition: 'all 0.2s ease',
                    }}>
                      {t.label}
                    </button>
                  ))}
                </div>
                {tipType === 'custom' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
                    <span style={{ font: `400 13px ${s.FONT}`, color: s.text2 }}>$</span>
                    <input
                      value={customTip} onChange={e => setCustomTip(e.target.value)}
                      type="number" step="0.01" min="0" placeholder="0.00"
                      style={{ ...s.input, width: 120, padding: '8px 12px', fontSize: 13 }}
                      autoFocus
                    />
                  </div>
                )}
              </div>

              {/* ─── Payment Method ─── */}
              <div style={{ marginBottom: 24 }}>
                <label style={s.label}>Payment Method</label>
                <div style={{ display: 'grid', gap: 8 }}>
                  {payOptions.map(p => (
                    <button key={p.value} onClick={() => setPaymentMethod(p.value)} style={{
                      padding: '14px 18px', borderRadius: 12, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 12,
                      font: `500 13px ${s.FONT}`,
                      background: paymentMethod === p.value ? s.accentLight : 'rgba(255,255,255,0.5)',
                      color: paymentMethod === p.value ? s.accent : s.text,
                      border: paymentMethod === p.value ? `1.5px solid ${s.accent}` : '1px solid rgba(0,0,0,0.06)',
                      transition: 'all 0.2s ease',
                    }}>
                      <span style={{ opacity: paymentMethod === p.value ? 1 : 0.5, display: 'flex' }}>{p.icon}</span>
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer — Process button */}
        {!complete && (
          <div style={{
            padding: '16px 28px 24px', borderTop: '1px solid rgba(0,0,0,0.06)',
          }}>
            <button
              onClick={processPayment}
              disabled={!paymentMethod || processing}
              style={{
                ...s.pillAccent,
                width: '100%', padding: '14px 0', fontSize: 15, borderRadius: 14,
                opacity: (!paymentMethod || processing) ? 0.5 : 1,
                cursor: (!paymentMethod || processing) ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              {processing ? (
                <>
                  <span style={{
                    width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: '#fff', borderRadius: '50%',
                    display: 'inline-block',
                    animation: 'coSpin 0.7s linear infinite',
                  }} />
                  Processing...
                </>
              ) : (
                `Process Payment — ${fmt(total)}`
              )}
            </button>
          </div>
        )}
      </div>

      {/* Animations */}
      <style>{`
        @keyframes coFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes coSlideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        @keyframes coSpin {
          to { transform: rotate(360deg); }
        }
        @keyframes coSuccessPop {
          0% { transform: scale(0.5); opacity: 0; }
          60% { transform: scale(1.1); }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </>
  );
}
