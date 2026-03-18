import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStyles } from '../theme';
import { getPatients, getServices } from '../data/store';

// ── Page registry (all 22 admin pages) ──
const PAGES = [
  { path: '/admin', label: 'Dashboard', section: 'Overview' },
  { path: '/admin/checkin', label: 'Check-In', section: 'Overview' },
  { path: '/admin/clients', label: 'Patients', section: 'Patients' },
  { path: '/admin/schedule', label: 'Schedule', section: 'Patients' },
  { path: '/admin/sessions', label: 'Class Packages', section: 'Patients' },
  { path: '/admin/charts', label: 'Progress Tracking', section: 'Patients' },
  { path: '/admin/photos', label: 'Transformations', section: 'Patients' },
  { path: '/admin/waivers', label: 'Waivers', section: 'Patients' },
  { path: '/admin/recovery-tips', label: 'Recovery Tips', section: 'Clients' },
  { path: '/admin/memberships', label: 'Memberships', section: 'Billing' },
  { path: '/admin/wallet', label: 'Client Wallet', section: 'Billing' },
  { path: '/admin/referrals', label: 'Referrals', section: 'Billing' },
  { path: '/admin/inventory', label: 'Inventory', section: 'Operations' },
  { path: '/admin/retention', label: 'Retention', section: 'Operations' },
  { path: '/admin/waitlist', label: 'Waitlist', section: 'Operations' },
  { path: '/admin/reviews', label: 'Reviews', section: 'Operations' },
  { path: '/admin/inbox', label: 'DM Inbox', section: 'Marketing' },
  { path: '/admin/email', label: 'Email', section: 'Marketing' },
  { path: '/admin/texts', label: 'Text Messages', section: 'Marketing' },
  { path: '/admin/social', label: 'Social Media', section: 'Marketing' },
  { path: '/admin/reports', label: 'Reports', section: 'Reporting' },
  { path: '/admin/settings', label: 'Settings', section: 'System' },
];

const QUICK_ACTIONS = [
  { id: 'action-new-client', label: 'New Client', subtitle: 'Add a new patient record', path: '/admin/clients', icon: 'user-plus' },
  { id: 'action-book-apt', label: 'Book Appointment', subtitle: 'Schedule a new appointment', path: '/admin/schedule', icon: 'calendar-plus' },
  { id: 'action-send-email', label: 'Send Email', subtitle: 'Compose a marketing email', path: '/admin/email', icon: 'mail' },
  { id: 'action-send-text', label: 'Send Text', subtitle: 'Send SMS to clients', path: '/admin/texts', icon: 'message' },
  { id: 'action-new-chart', label: 'New Chart', subtitle: 'Start a clinical chart', path: '/admin/charts', icon: 'clipboard' },
];

// ── SVG Icons ──
const Icons = {
  search: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  ),
  page: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
    </svg>
  ),
  service: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
    </svg>
  ),
  'user-plus': (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/>
    </svg>
  ),
  'calendar-plus': (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="12" y1="14" x2="12" y2="18"/><line x1="10" y1="16" x2="14" y2="16"/>
    </svg>
  ),
  mail: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <rect x="2" y="4" width="20" height="16" rx="2"/><polyline points="22,7 12,13 2,7"/>
    </svg>
  ),
  message: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
    </svg>
  ),
  clipboard: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/>
    </svg>
  ),
  arrow: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
    </svg>
  ),
};

// ── Membership badge colors ──
const TIER_COLORS = {
  Platinum: { bg: '#F0EDFF', text: '#6D28D9', label: 'Platinum' },
  Gold: { bg: '#FEF3C7', text: '#92400E', label: 'Gold' },
  Silver: { bg: '#F1F5F9', text: '#475569', label: 'Silver' },
};

function formatPrice(cents) {
  if (!cents) return 'Complimentary';
  return '$' + (cents / 100).toLocaleString('en-US', { minimumFractionDigits: 0 });
}

function getInitials(first, last) {
  return ((first?.[0] || '') + (last?.[0] || '')).toUpperCase();
}

export default function CommandPalette({ open, onClose }) {
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const navigate = useNavigate();
  const s = useStyles();

  // Build flat results list
  const results = useMemo(() => {
    const q = query.toLowerCase().trim();
    const items = [];

    // Pages
    const pageMatches = q
      ? PAGES.filter(p => p.label.toLowerCase().includes(q) || p.section.toLowerCase().includes(q))
      : PAGES.slice(0, 5); // show top 5 in empty state
    if (pageMatches.length) {
      items.push({ type: 'header', label: 'Pages' });
      pageMatches.forEach(p => items.push({
        type: 'page', id: p.path, label: p.label, subtitle: p.section, path: p.path,
      }));
    }

    // Patients (only when searching)
    if (q.length >= 1) {
      const clients = getPatients();
      const patientMatches = clients
        .filter(p => `${p.firstName} ${p.lastName}`.toLowerCase().includes(q))
        .slice(0, 5);
      if (patientMatches.length) {
        items.push({ type: 'header', label: 'Patients' });
        patientMatches.forEach(p => items.push({
          type: 'client', id: p.id,
          label: `${p.firstName} ${p.lastName}`,
          firstName: p.firstName, lastName: p.lastName,
          membership: p.membershipTier,
          subtitle: p.email,
          path: '/admin/clients',
        }));
      }
    }

    // Services (only when searching)
    if (q.length >= 1) {
      const services = getServices();
      const svcMatches = services
        .filter(sv => sv.name.toLowerCase().includes(q) || sv.category?.toLowerCase().includes(q))
        .slice(0, 5);
      if (svcMatches.length) {
        items.push({ type: 'header', label: 'Services' });
        svcMatches.forEach(sv => items.push({
          type: 'service', id: sv.id,
          label: sv.name,
          subtitle: `${sv.category}  ·  ${formatPrice(sv.price)}`,
          path: '/admin/settings',
        }));
      }
    }

    // Quick Actions
    const actionMatches = q
      ? QUICK_ACTIONS.filter(a => a.label.toLowerCase().includes(q) || a.subtitle.toLowerCase().includes(q))
      : QUICK_ACTIONS;
    if (actionMatches.length) {
      items.push({ type: 'header', label: 'Actions' });
      actionMatches.forEach(a => items.push({
        type: 'action', id: a.id, label: a.label, subtitle: a.subtitle, path: a.path, icon: a.icon,
      }));
    }

    return items;
  }, [query]);

  // Selectable items only (no headers)
  const selectableIndices = useMemo(
    () => results.map((r, i) => r.type !== 'header' ? i : -1).filter(i => i >= 0),
    [results]
  );

  // Reset index when query changes
  useEffect(() => { setActiveIndex(0); }, [query]);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setQuery('');
      setActiveIndex(0);
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [open]);

  // Scroll active item into view
  useEffect(() => {
    if (!listRef.current) return;
    const realIndex = selectableIndices[activeIndex];
    const el = listRef.current.children[realIndex];
    if (el) el.scrollIntoView({ block: 'nearest' });
  }, [activeIndex, selectableIndices]);

  const handleSelect = useCallback((item) => {
    if (!item || item.type === 'header') return;
    onClose();
    navigate(item.path);
  }, [navigate, onClose]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') { onClose(); return; }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(i => Math.min(i + 1, selectableIndices.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const realIndex = selectableIndices[activeIndex];
      if (realIndex != null) handleSelect(results[realIndex]);
    }
  }, [selectableIndices, activeIndex, results, handleSelect, onClose]);

  if (!open) return null;

  // Which real index is "active"?
  const activeRealIndex = selectableIndices[activeIndex];
  let selectableCounter = -1;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 9998,
          background: 'rgba(0,0,0,0.4)',
          backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
          animation: 'cmdFadeIn 0.15s ease',
        }}
      />

      {/* Palette */}
      <div style={{
        position: 'fixed', top: '16vh', left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: 580, zIndex: 9999,
        background: '#FFFFFF',
        borderRadius: 16,
        boxShadow: '0 24px 80px rgba(0,0,0,0.2), 0 0 0 1px rgba(0,0,0,0.05)',
        overflow: 'hidden',
        animation: 'cmdSlideIn 0.2s cubic-bezier(0.16,1,0.3,1)',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      }}>

        {/* Search input */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '14px 20px',
          borderBottom: '1px solid rgba(0,0,0,0.06)',
        }}>
          <span style={{ color: '#999', flexShrink: 0, display: 'flex' }}>{Icons.search}</span>
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search pages, clients, services..."
            style={{
              flex: 1, border: 'none', outline: 'none', background: 'transparent',
              font: "400 15px 'Inter', sans-serif", color: '#111',
              caretColor: s.accent,
            }}
          />
          <kbd style={{
            font: "400 11px 'JetBrains Mono', monospace",
            color: '#BBB', background: '#F5F5F5', borderRadius: 6,
            padding: '3px 8px', border: '1px solid #E5E5E5',
          }}>ESC</kbd>
        </div>

        {/* Results list */}
        <div ref={listRef} style={{
          maxHeight: 380, overflowY: 'auto', padding: '8px',
          scrollbarWidth: 'thin',
        }}>
          {results.length === 0 && (
            <div style={{
              padding: '32px 20px', textAlign: 'center',
              font: "400 13px 'Inter', sans-serif", color: '#999',
            }}>
              No results for "{query}"
            </div>
          )}

          {results.map((item, i) => {
            if (item.type === 'header') {
              return (
                <div key={`h-${item.label}`} style={{
                  font: "500 10px 'JetBrains Mono', monospace",
                  textTransform: 'uppercase', letterSpacing: 1.2,
                  color: '#AAA', padding: '10px 12px 4px',
                  marginTop: i > 0 ? 4 : 0,
                }}>
                  {item.label}
                </div>
              );
            }

            selectableCounter++;
            const isActive = i === activeRealIndex;

            return (
              <div
                key={item.id}
                onClick={() => handleSelect(item)}
                onMouseEnter={() => setActiveIndex(selectableCounter)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 12px', borderRadius: 10,
                  cursor: 'pointer', transition: 'background 0.1s',
                  background: isActive ? s.accentLight : 'transparent',
                }}
              >
                {/* Left icon / avatar */}
                {item.type === 'client' ? (
                  <div style={{
                    width: 32, height: 32, borderRadius: 8,
                    background: isActive ? s.accent : '#F0F0F0',
                    color: isActive ? s.accentText : '#666',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    font: "600 11px 'Inter', sans-serif", flexShrink: 0,
                    transition: 'all 0.15s',
                  }}>
                    {getInitials(item.firstName, item.lastName)}
                  </div>
                ) : (
                  <div style={{
                    width: 32, height: 32, borderRadius: 8,
                    background: isActive ? (s.accent + '18') : '#F8F8F8',
                    color: isActive ? s.accent : '#999',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, transition: 'all 0.15s',
                  }}>
                    {item.type === 'page' && Icons.page}
                    {item.type === 'service' && Icons.service}
                    {item.type === 'action' && (Icons[item.icon] || Icons['user-plus'])}
                  </div>
                )}

                {/* Title + subtitle */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    font: "500 13px 'Inter', sans-serif",
                    color: isActive ? s.accent : '#111',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    transition: 'color 0.1s',
                    display: 'flex', alignItems: 'center', gap: 8,
                  }}>
                    {item.label}
                    {/* Membership badge for clients */}
                    {item.type === 'client' && item.membership && item.membership !== 'None' && TIER_COLORS[item.membership] && (
                      <span style={{
                        font: "600 9px 'Inter', sans-serif",
                        textTransform: 'uppercase', letterSpacing: 0.5,
                        padding: '2px 6px', borderRadius: 4,
                        background: TIER_COLORS[item.membership].bg,
                        color: TIER_COLORS[item.membership].text,
                      }}>
                        {TIER_COLORS[item.membership].label}
                      </span>
                    )}
                  </div>
                  {item.subtitle && (
                    <div style={{
                      font: "400 11px 'Inter', sans-serif", color: '#999', marginTop: 1,
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>
                      {item.subtitle}
                    </div>
                  )}
                </div>

                {/* Right hint */}
                {isActive && (
                  <span style={{
                    display: 'flex', alignItems: 'center', gap: 4,
                    font: "400 10px 'JetBrains Mono', monospace", color: '#BBB',
                    flexShrink: 0,
                  }}>
                    {Icons.arrow}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 16,
          padding: '10px 20px',
          borderTop: '1px solid rgba(0,0,0,0.04)',
          background: '#FAFAFA',
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, font: "400 10px 'JetBrains Mono', monospace", color: '#BBB' }}>
            <kbd style={{ background: '#F0F0F0', borderRadius: 4, padding: '1px 5px', border: '1px solid #E5E5E5' }}>&uarr;</kbd>
            <kbd style={{ background: '#F0F0F0', borderRadius: 4, padding: '1px 5px', border: '1px solid #E5E5E5' }}>&darr;</kbd>
            navigate
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, font: "400 10px 'JetBrains Mono', monospace", color: '#BBB' }}>
            <kbd style={{ background: '#F0F0F0', borderRadius: 4, padding: '1px 5px', border: '1px solid #E5E5E5' }}>&crarr;</kbd>
            select
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, font: "400 10px 'JetBrains Mono', monospace", color: '#BBB' }}>
            <kbd style={{ background: '#F0F0F0', borderRadius: 4, padding: '1px 5px', border: '1px solid #E5E5E5' }}>esc</kbd>
            close
          </span>
        </div>
      </div>

      <style>{`
        @keyframes cmdFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes cmdSlideIn {
          from { opacity: 0; transform: translateX(-50%) scale(0.96) translateY(-8px); }
          to { opacity: 1; transform: translateX(-50%) scale(1) translateY(0); }
        }
      `}</style>
    </>
  );
}
