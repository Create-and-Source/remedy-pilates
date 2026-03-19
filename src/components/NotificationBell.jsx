import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStyles } from '../theme';
import {
  getAppointments,
  getInventory,
  getRetentionAlerts,
} from '../data/store';

const READ_KEY = 'rp_notif_read';

function getReadIds() {
  try {
    return new Set(JSON.parse(localStorage.getItem(READ_KEY)) || []);
  } catch {
    return new Set();
  }
}

function saveReadIds(ids) {
  localStorage.setItem(READ_KEY, JSON.stringify([...ids]));
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function lsGet(key, fallback = []) {
  try { return JSON.parse(localStorage.getItem(key)) || fallback; } catch { return fallback; }
}

// SVG icon components
const NOTIF_ICONS = {
  dm: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
    </svg>
  ),
  stock: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M12.89 1.45l8 4A2 2 0 0122 7.24v9.53a2 2 0 01-1.11 1.79l-8 4a2 2 0 01-1.79 0l-8-4A2 2 0 012 16.76V7.24a2 2 0 011.11-1.79l8-4a2 2 0 011.78 0z"/>
      <polyline points="2.32 6.16 12 11 21.68 6.16"/>
      <line x1="12" y1="22.76" x2="12" y2="11"/>
    </svg>
  ),
  retention: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  appointment: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <rect x="3" y="4" width="18" height="18" rx="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  ),
  waiver: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/>
      <rect x="8" y="2" width="8" height="4" rx="1"/>
      <line x1="9" y1="12" x2="15" y2="12"/>
      <line x1="9" y1="16" x2="13" y2="16"/>
    </svg>
  ),
  waitlist: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 00-3-3.87"/>
      <path d="M16 3.13a4 4 0 010 7.75"/>
    </svg>
  ),
  review: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  ),
};

function generateNotifications() {
  const notifications = [];
  const now = new Date().toISOString();

  // 1. DM notifications — check ms_inbox for unread conversations
  const inbox = lsGet('rp_inbox', []);
  inbox.forEach(convo => {
    if (convo.unread > 0) {
      const handle = convo.handle || convo.name || 'Someone';
      notifications.push({
        id: `notif-dm-${convo.id}`,
        type: 'dm',
        icon: 'dm',
        text: `New DM from @${handle.replace('@', '')}`,
        link: '/admin/inbox',
        time: convo.lastMessageAt || convo.updatedAt || now,
        color: '#0369A1',
      });
    }
  });

  // 2. Low stock — check ms_inventory for items at or below reorderAt
  const inventory = getInventory();
  inventory.forEach(item => {
    if (item.quantity <= item.reorderAt) {
      notifications.push({
        id: `notif-stock-${item.id}`,
        type: 'stock',
        icon: 'stock',
        text: `Low stock: ${item.name} (${item.quantity} remaining)`,
        link: '/admin/inventory',
        time: now,
        color: '#D97706',
      });
    }
  });

  // 3. Retention alerts — check for pending
  const retentionAlerts = getRetentionAlerts();
  retentionAlerts.filter(a => a.status === 'pending').forEach(alert => {
    notifications.push({
      id: `notif-ret-${alert.id}`,
      type: 'retention',
      icon: 'retention',
      text: `${alert.patientName} hasn't visited in ${alert.daysSince} days`,
      link: '/admin/retention',
      time: now,
      color: '#DC2626',
    });
  });

  // 4. Today's appointments
  const todayStr = new Date().toISOString().slice(0, 10);
  const appointments = getAppointments();
  const todayAppts = appointments.filter(a => a.date === todayStr);
  if (todayAppts.length > 0) {
    notifications.push({
      id: 'notif-appts-today',
      type: 'appointment',
      icon: 'appointment',
      text: `${todayAppts.length} appointment${todayAppts.length !== 1 ? 's' : ''} today`,
      link: '/admin/schedule',
      time: now,
      color: '#16A34A',
    });
  }

  // 5. Pending waivers
  const waivers = lsGet('rp_waivers', []);
  const pendingWaivers = waivers.filter(w => w.status === 'pending');
  if (pendingWaivers.length > 0) {
    // Show individual notifications for first 2, then a summary
    pendingWaivers.slice(0, 2).forEach(w => {
      notifications.push({
        id: `notif-waiver-${w.id}`,
        type: 'waiver',
        icon: 'waiver',
        text: `${w.patientName || 'A client'} has unsigned waivers`,
        link: '/admin/waivers',
        time: w.createdAt || now,
        color: '#D97706',
      });
    });
    if (pendingWaivers.length > 2) {
      notifications.push({
        id: 'notif-waivers-extra',
        type: 'waiver',
        icon: 'waiver',
        text: `${pendingWaivers.length - 2} more pending waiver${pendingWaivers.length - 2 !== 1 ? 's' : ''}`,
        link: '/admin/waivers',
        time: now,
        color: '#D97706',
      });
    }
  }

  // 6. Waitlist
  const waitlist = lsGet('rp_waitlist', []);
  const waiting = waitlist.filter(w => w.status === 'waiting');
  if (waiting.length > 0) {
    notifications.push({
      id: 'notif-waitlist',
      type: 'waitlist',
      icon: 'waitlist',
      text: `${waiting.length} client${waiting.length !== 1 ? 's' : ''} on waitlist`,
      link: '/admin/waitlist',
      time: now,
      color: '#7C3AED',
    });
  }

  // 7. Reviews
  const reviews = lsGet('rp_reviews', []);
  const pendingReviews = reviews.filter(r => r.status === 'pending' || r.status === 'requested');
  if (pendingReviews.length > 0) {
    notifications.push({
      id: 'notif-reviews',
      type: 'review',
      icon: 'review',
      text: `${pendingReviews.length} review request${pendingReviews.length !== 1 ? 's' : ''} pending`,
      link: '/admin/reviews',
      time: now,
      color: '#BE185D',
    });
  }

  return notifications;
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [readIds, setReadIds] = useState(getReadIds);
  const panelRef = useRef(null);
  const bellRef = useRef(null);
  const s = useStyles();
  const navigate = useNavigate();

  // Generate notifications on mount
  useEffect(() => {
    setNotifications(generateNotifications());
  }, []);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target) &&
          bellRef.current && !bellRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const unreadCount = notifications.filter(n => !readIds.has(n.id)).length;

  const markAllRead = () => {
    const allIds = new Set(notifications.map(n => n.id));
    setReadIds(allIds);
    saveReadIds(allIds);
  };

  const handleClick = (notif) => {
    const updated = new Set(readIds);
    updated.add(notif.id);
    setReadIds(updated);
    saveReadIds(updated);
    setOpen(false);
    navigate(notif.link);
  };

  return (
    <div style={{ position: 'relative' }}>
      {/* Bell button */}
      <button
        ref={bellRef}
        onClick={() => setOpen(!open)}
        style={{
          position: 'relative',
          width: 36, height: 36, borderRadius: 100,
          border: '1px solid rgba(0,0,0,0.08)',
          background: open ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.5)',
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'blur(8px)',
          transition: 'all 0.2s',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.8)'; }}
        onMouseLeave={e => { if (!open) e.currentTarget.style.background = 'rgba(255,255,255,0.5)'; }}
      >
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 01-3.46 0"/>
        </svg>
        {/* Badge */}
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute', top: -3, right: -3,
            minWidth: 18, height: 18, borderRadius: 100,
            background: '#DC2626',
            color: '#fff',
            font: "600 10px 'Inter', sans-serif",
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '0 5px',
            boxShadow: '0 2px 8px rgba(220,38,38,0.4)',
            border: '2px solid rgba(245,243,240,0.9)',
          }}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          ref={panelRef}
          style={{
            position: 'absolute',
            top: 'calc(100% + 10px)',
            right: 0,
            width: 320,
            maxHeight: 460,
            background: 'rgba(255,255,255,0.82)',
            backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
            border: '1px solid rgba(255,255,255,0.7)',
            borderRadius: 16,
            boxShadow: '0 20px 60px rgba(0,0,0,0.12), 0 4px 8px rgba(0,0,0,0.04)',
            overflow: 'hidden',
            animation: 'notifSlideDown 0.25s cubic-bezier(0.16,1,0.3,1)',
            zIndex: 999,
          }}
        >
          {/* Header */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 18px 12px',
            borderBottom: '1px solid rgba(0,0,0,0.05)',
          }}>
            <span style={{
              font: "600 14px 'Inter', sans-serif",
              color: '#111',
            }}>
              Notifications
              {unreadCount > 0 && (
                <span style={{
                  marginLeft: 8,
                  font: "500 11px 'Inter', sans-serif",
                  color: '#DC2626',
                }}>
                  {unreadCount} new
                </span>
              )}
            </span>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  font: "500 12px 'Inter', sans-serif",
                  color: s.accent,
                  padding: '4px 8px', borderRadius: 6,
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = s.accentLight; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}
              >
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div style={{ overflowY: 'auto', maxHeight: 390 }}>
            {notifications.length === 0 ? (
              <div style={{
                padding: '40px 20px',
                textAlign: 'center',
                font: "400 13px 'Inter', sans-serif",
                color: '#999',
              }}>
                No notifications
              </div>
            ) : (
              notifications.map(notif => {
                const isRead = readIds.has(notif.id);
                return (
                  <button
                    key={notif.id}
                    onClick={() => handleClick(notif)}
                    style={{
                      display: 'flex', alignItems: 'flex-start', gap: 12,
                      width: '100%', textAlign: 'left',
                      padding: '12px 18px',
                      background: isRead ? 'transparent' : 'rgba(0,0,0,0.02)',
                      border: 'none', borderBottom: '1px solid rgba(0,0,0,0.03)',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.04)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = isRead ? 'transparent' : 'rgba(0,0,0,0.02)'; }}
                  >
                    {/* Icon */}
                    <div style={{
                      width: 32, height: 32, borderRadius: 10, flexShrink: 0,
                      background: notif.color + '12',
                      color: notif.color,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      marginTop: 1,
                    }}>
                      {NOTIF_ICONS[notif.icon]}
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        font: `${isRead ? '400' : '500'} 13px 'Inter', sans-serif`,
                        color: isRead ? '#666' : '#111',
                        lineHeight: 1.4,
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      }}>
                        {notif.text}
                      </div>
                      <div style={{
                        font: "400 11px 'Inter', sans-serif",
                        color: '#AAA',
                        marginTop: 2,
                      }}>
                        {timeAgo(notif.time)}
                      </div>
                    </div>

                    {/* Unread dot */}
                    {!isRead && (
                      <div style={{
                        width: 7, height: 7, borderRadius: '50%',
                        background: s.accent,
                        flexShrink: 0, marginTop: 6,
                      }} />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Slide-down animation */}
      <style>{`
        @keyframes notifSlideDown {
          from { opacity: 0; transform: translateY(-8px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}
