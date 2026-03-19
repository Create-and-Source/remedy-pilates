import { useState, useEffect, useCallback } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useTheme, useStyles, PRESETS } from '../theme';
import { getSettings } from '../data/store';
import { signOut } from '../api/auth';
import HelpChat from './HelpChat';
import CommandPalette from './CommandPalette';
import NotificationBell from './NotificationBell';

// roles: which roles can see this item. Omit to show for all roles.
// owner always sees everything. client should not reach the admin sidebar.
const NAV_ITEMS = [
  { section: 'Overview', items: [
    { path: '/admin', label: 'Dashboard', icon: 'grid' },
    { path: '/admin/checkin', label: 'Check-In', icon: 'clipboard', roles: ['owner', 'instructor', 'front_desk'] },
  ]},
  { section: 'Clients', items: [
    { path: '/admin/clients', label: 'Clients', icon: 'users', roles: ['owner', 'instructor', 'front_desk'] },
    { path: '/admin/schedule', label: 'Schedule', icon: 'calendar', roles: ['owner', 'instructor', 'front_desk'] },
    { path: '/admin/sessions', label: 'Class Packages', icon: 'clipboard', roles: ['owner'] },
    { path: '/admin/charts', label: 'Progress Tracking', icon: 'clipboard', roles: ['owner', 'instructor'] },
    { path: '/admin/photos', label: 'Transformations', icon: 'heart', roles: ['owner', 'instructor'] },
    { path: '/admin/waivers', label: 'Waivers', icon: 'clipboard', roles: ['owner'] },
    { path: '/admin/recovery-tips', label: 'Recovery Tips', icon: 'heart', roles: ['owner', 'instructor'] },
    { path: '/admin/transformation-plan', label: '30-Day Plan', icon: 'plan', roles: ['owner', 'instructor'] },
  ]},
  { section: 'Billing', items: [
    { path: '/admin/memberships', label: 'Memberships', icon: 'users', roles: ['owner'] },
    { path: '/admin/membership-perks', label: 'Membership Perks', icon: 'heart', roles: ['owner'] },
    { path: '/admin/wallet', label: 'Client Wallet', icon: 'package', roles: ['owner'] },
    { path: '/admin/referrals', label: 'Referrals', icon: 'share', roles: ['owner'] },
    { path: '/admin/loyalty', label: 'Loyalty Program', icon: 'heart', roles: ['owner'] },
  ]},
  { section: 'Operations', items: [
    { path: '/admin/inventory', label: 'Inventory', icon: 'package', roles: ['owner', 'front_desk'] },
    { path: '/admin/retention', label: 'Retention', icon: 'heart', roles: ['owner'] },
    { path: '/admin/waitlist', label: 'Waitlist', icon: 'calendar', roles: ['owner', 'front_desk'] },
    { path: '/admin/reviews', label: 'Reviews', icon: 'heart', roles: ['owner'] },
  ]},
  { section: 'Marketing', items: [
    { path: '/admin/inbox', label: 'DM Inbox', icon: 'message', roles: ['owner', 'instructor', 'front_desk'] },
    { path: '/admin/email', label: 'Email', icon: 'mail', roles: ['owner'] },
    { path: '/admin/texts', label: 'Text Messages', icon: 'message', roles: ['owner'] },
    { path: '/admin/social', label: 'Social Media', icon: 'share', roles: ['owner'] },
    { path: '/admin/tiktok', label: 'TikTok Strategy', icon: 'share', roles: ['owner'] },
    { path: '/admin/group-bookings', label: 'Group Bookings', icon: 'calendar', roles: ['owner', 'front_desk'] },
    { path: '/admin/social-share', label: 'Share Journey', icon: 'upload', roles: ['owner'] },
  ]},
  { section: 'Content', items: [
    { path: '/admin/on-demand', label: 'On-Demand Library', icon: 'share', roles: ['owner', 'instructor'] },
    { path: '/admin/brand-guide', label: 'Brand Guide', icon: 'clipboard', roles: ['owner'] },
  ]},
  { section: 'Body Intelligence', items: [
    { path: '/admin/posture', label: 'Posture AI', icon: 'heart', roles: ['owner', 'instructor'] },
    { path: '/admin/posture-timelapse', label: 'Posture Time-lapse', icon: 'heart', roles: ['owner', 'instructor'] },
    { path: '/admin/movement-rx', label: 'Movement Rx', icon: 'clipboard', roles: ['owner', 'instructor'] },
    { path: '/admin/ai-intake', label: 'AI Intake → Rx', icon: 'clipboard', roles: ['owner', 'instructor'] },
    { path: '/admin/fatigue', label: 'Fatigue Tracker', icon: 'heart', roles: ['owner', 'instructor'] },
    { path: '/admin/spring-engine', label: 'Spring Engine', icon: 'settings', roles: ['owner', 'instructor'] },
    { path: '/admin/sequencer', label: 'Class Sequencer', icon: 'calendar', roles: ['owner', 'instructor'] },
    { path: '/admin/wearables', label: 'Wearables Hub', icon: 'heart', roles: ['owner', 'instructor'] },
    { path: '/admin/body-scans', label: 'Body Composition Lab', icon: 'bar-chart', roles: ['owner', 'instructor'] },
    { path: '/admin/ar-simulator', label: 'AR Reformer', icon: 'grid', roles: ['owner', 'instructor'] },
    { path: '/admin/breathwork', label: 'Breathwork', icon: 'wind', roles: ['owner', 'instructor'] },
    { path: '/admin/nutrition', label: 'Nutrition', icon: 'leaf', roles: ['owner', 'instructor'] },
  ]},
  { section: 'Retention & Growth', items: [
    { path: '/admin/retention-brain', label: 'Retention Brain', icon: 'users', roles: ['owner'] },
    { path: '/admin/cohort-analysis', label: 'Cohort Analysis', icon: 'bar-chart', roles: ['owner'] },
    { path: '/admin/referral-engine', label: 'Referral Engine', icon: 'share', roles: ['owner'] },
    { path: '/admin/challenges', label: 'Challenges', icon: 'heart', roles: ['owner'] },
    { path: '/admin/recovery-text', label: 'Recovery Texts', icon: 'message', roles: ['owner'] },
  ]},
  { section: 'Studio Tech', items: [
    { path: '/admin/instructors', label: 'Instructor Metrics', icon: 'bar-chart', roles: ['owner'] },
    { path: '/admin/voice-clone', label: 'Voice Clone', icon: 'message', roles: ['owner'] },
    { path: '/admin/virtual-studio', label: 'Virtual Studio', icon: 'share', roles: ['owner'] },
    { path: '/admin/ai-front-desk', label: 'AI Front Desk', icon: 'message', roles: ['owner'] },
    { path: '/admin/smart-inventory', label: 'Smart Inventory', icon: 'package', roles: ['owner'] },
    { path: '/admin/voice-ai', label: 'Voice AI Phone', icon: 'message', roles: ['owner'] },
    { path: '/admin/live-dashboard', label: 'Live Dashboard', icon: 'grid', roles: ['owner'] },
  ]},
  { section: 'Intelligence', items: [
    { path: '/admin/natural-language-bi', label: 'Ask Studio AI', icon: 'message', roles: ['owner'] },
    { path: '/admin/class-recommender', label: 'Class Recommender', icon: 'heart', roles: ['owner'] },
    { path: '/admin/dynamic-pricing', label: 'Dynamic Pricing', icon: 'bar-chart', roles: ['owner'] },
    { path: '/admin/instructor-tipping', label: 'Instructor Tipping', icon: 'heart', roles: ['owner'] },
  ]},
  { section: 'Staff', items: [
    { path: '/admin/training', label: 'Teacher Training', icon: 'clipboard', roles: ['owner', 'instructor'] },
    { path: '/admin/trainee-portal', label: 'Trainee Portal', icon: 'users', roles: ['owner', 'instructor'] },
  ]},
  { section: 'Reporting', items: [
    { path: '/admin/reports', label: 'Reports', icon: 'bar-chart', roles: ['owner'] },
  ]},
  { section: 'System', items: [
    { path: '/admin/settings', label: 'Settings', icon: 'settings', roles: ['owner'] },
  ]},
];

function getFilteredNavItems(role) {
  // owner sees everything; no role defaults to showing all items
  if (!role || role === 'owner') return NAV_ITEMS;
  return NAV_ITEMS.reduce((acc, section) => {
    const visibleItems = section.items.filter(item =>
      !item.roles || item.roles.includes(role)
    );
    if (visibleItems.length > 0) {
      acc.push({ ...section, items: visibleItems });
    }
    return acc;
  }, []);
}

const ICONS = {
  grid: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
  users: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>,
  calendar: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  clipboard: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/></svg>,
  package: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M12.89 1.45l8 4A2 2 0 0122 7.24v9.53a2 2 0 01-1.11 1.79l-8 4a2 2 0 01-1.79 0l-8-4A2 2 0 012 16.76V7.24a2 2 0 011.11-1.79l8-4a2 2 0 011.78 0z"/><polyline points="2.32 6.16 12 11 21.68 6.16"/><line x1="12" y1="22.76" x2="12" y2="11"/></svg>,
  heart: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>,
  mail: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="2" y="4" width="20" height="16" rx="2"/><polyline points="22,7 12,13 2,7"/></svg>,
  message: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>,
  share: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>,
  'bar-chart': <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg>,
  settings: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>,
  plan: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="8" y1="14" x2="10" y2="14"/><line x1="8" y1="18" x2="14" y2="18"/><circle cx="16" cy="16" r="3" fill="none"/><polyline points="14.8 16 15.8 17 17.5 15"/></svg>,
  upload: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>,
  menu: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
  x: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  palette: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="8" r="1.5" fill="currentColor"/><circle cx="8" cy="14" r="1.5" fill="currentColor"/><circle cx="16" cy="14" r="1.5" fill="currentColor"/></svg>,
  wind: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M9.59 4.59A2 2 0 1111 8H2m10.59 11.41A2 2 0 1014 16H2m15.73-8.27A2.5 2.5 0 1119.5 12H2"/></svg>,
  leaf: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M11 20A7 7 0 014 13c0-4.177 3-9 9-13 0 7-4.154 11.085-4.154 11.085C9 13 11 13 13 14c2.5 1.5 3 4 2 6-.5 1-2 1-4 0z"/><line x1="4.5" y1="13.5" x2="12" y2="21"/></svg>,
};

function ThemePicker({ show, onClose }) {
  const { theme, setTheme, setCustomColor } = useTheme();
  const s = useStyles();
  if (!show) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 999 }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        position: 'absolute', bottom: 60, left: 16, width: 260,
        background: '#fff', border: '1px solid #e5e5e5', borderRadius: 14,
        boxShadow: '0 12px 40px rgba(0,0,0,0.15)', padding: 20,
        animation: 'fadeIn 0.2s ease',
      }}>
        <div style={{ font: "600 13px 'Inter', sans-serif", color: '#111', marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Brand Color
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#999' }}>{ICONS.x}</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 14 }}>
          {PRESETS.map(p => (
            <button key={p.id} onClick={() => setTheme(p)} style={{
              width: '100%', aspectRatio: '1', borderRadius: 10, border: theme.id === p.id ? '2.5px solid #111' : '2px solid #e5e5e5',
              background: p.accent, cursor: 'pointer', transition: 'all 0.15s',
              outline: theme.id === p.id ? '2px solid #fff' : 'none',
              outlineOffset: '-4px',
            }} title={p.name} />
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <label style={{ font: "500 12px 'Inter', sans-serif", color: '#666' }}>Custom</label>
          <input type="color" value={theme.accent} onChange={e => setCustomColor(e.target.value)} style={{
            width: 32, height: 32, border: '1px solid #e5e5e5', borderRadius: 8,
            cursor: 'pointer', padding: 2,
          }} />
          <span style={{ font: "400 11px 'JetBrains Mono', monospace", color: '#999' }}>{theme.accent}</span>
        </div>
      </div>
    </div>
  );
}

export default function Layout({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showTheme, setShowTheme] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const { theme } = useTheme();
  const isEmbed = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('embed');
  const s = useStyles();
  const location = useLocation();
  const settings = getSettings();
  const userRole = typeof window !== 'undefined' ? (localStorage.getItem('rp_user_role') || 'owner') : 'owner';
  const filteredNavItems = getFilteredNavItems(userRole);

  // Global Cmd+K / Ctrl+K listener
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCmdOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const sidebarWidth = collapsed ? 68 : 240;

  const linkStyle = (isActive) => ({
    display: 'flex', alignItems: 'center', gap: 12, padding: collapsed ? '10px 0' : '10px 16px',
    justifyContent: collapsed ? 'center' : 'flex-start',
    borderRadius: 8, textDecoration: 'none', transition: 'all 0.15s',
    font: `${isActive ? '500' : '400'} 13px 'Inter', sans-serif`,
    color: isActive ? theme.accent : '#666',
    background: isActive ? theme.accentLight : 'transparent',
  });

  // Dark sidebar — always dark with accent as highlight color
  const sidebarBg = '#111111';
  const sidebarText = '#FFFFFF';
  const sidebarMuted = '#888888';
  const sidebarBorder = '#222222';
  const sidebarHover = '#1A1A1A';
  const sidebarActive = theme.accent + '30';
  const sidebarAccent = theme.accent;

  const linkStyleNew = (isActive) => ({
    display: 'flex', alignItems: 'center', gap: 12, padding: collapsed ? '10px 0' : '10px 16px',
    justifyContent: collapsed ? 'center' : 'flex-start',
    borderRadius: 8, textDecoration: 'none', transition: 'all 0.15s',
    font: `${isActive ? '500' : '400'} 13px 'Inter', sans-serif`,
    color: isActive ? sidebarAccent : '#AAAAAA',
    background: isActive ? sidebarActive : 'transparent',
  });

  const Sidebar = ({ mobile }) => (
    <div style={{
      width: mobile ? 260 : sidebarWidth,
      height: '100vh', position: 'fixed', left: 0, top: 0,
      background: sidebarBg,
      display: 'flex', flexDirection: 'column',
      transition: 'all 0.3s ease',
      zIndex: mobile ? 200 : 100,
      paddingTop: 'env(safe-area-inset-top)',
      paddingLeft: 'env(safe-area-inset-left)',
      paddingBottom: 'env(safe-area-inset-bottom)',
      ...(mobile ? { boxShadow: '4px 0 24px rgba(0,0,0,0.2)' } : {}),
    }}>
      {/* Logo */}
      <div style={{
        padding: collapsed ? '20px 10px' : '20px 20px', borderBottom: `1px solid ${sidebarBorder}`,
        display: 'flex', alignItems: 'center', gap: 12, minHeight: 68,
      }}>
        <div style={{
          width: 34, height: 34, borderRadius: 10, background: sidebarAccent,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: theme.accentText, font: "700 14px 'Inter', sans-serif", flexShrink: 0,
        }}>
          {(settings.businessName || 'M')[0]}
        </div>
        {!collapsed && (
          <div>
            <div style={{ font: "600 14px 'Inter', sans-serif", color: '#FFFFFF', lineHeight: 1.2 }}>
              {settings.businessName || 'Pilates'}
            </div>
            <div style={{ font: "400 11px 'Inter', sans-serif", color: sidebarMuted }}>
              {settings.tagline || 'Pilates & Barre'}
            </div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '12px 12px', WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain', paddingBottom: 'calc(12px + env(safe-area-inset-bottom))' }}>
        {filteredNavItems.map(section => (
          <div key={section.section} style={{ marginBottom: 16 }}>
            {!collapsed && (
              <div style={{
                font: "500 10px 'JetBrains Mono', monospace", textTransform: 'uppercase',
                letterSpacing: 1.2, color: sidebarMuted, padding: '0 16px 6px',
              }}>
                {section.section}
              </div>
            )}
            {section.items.map(item => (
              <NavLink key={item.path} to={item.path} end={item.path === '/admin'}
                onClick={() => mobile && setMobileOpen(false)}
                style={({ isActive }) => linkStyleNew(isActive)}
              >
                <span style={{ flexShrink: 0, display: 'flex' }}>{ICONS[item.icon]}</span>
                {!collapsed && <span>{item.label}</span>}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* Theme picker button */}
      <div style={{ padding: '12px', borderTop: `1px solid ${sidebarBorder}` }}>
        <button onClick={() => setShowTheme(true)} style={{
          display: 'flex', alignItems: 'center', gap: 10, width: '100%',
          padding: collapsed ? '10px 0' : '10px 16px', justifyContent: collapsed ? 'center' : 'flex-start',
          background: 'transparent', border: 'none', borderRadius: 8, cursor: 'pointer',
          font: "400 13px 'Inter', sans-serif", color: sidebarMuted, transition: 'all 0.15s',
        }}>
          <span style={{ width: 18, height: 18, borderRadius: '50%', background: sidebarAccent, flexShrink: 0 }} />
          {!collapsed && 'Brand Color'}
        </button>
        {/* Sign out */}
        <button onClick={() => { signOut(); window.location.href = '/signin'; }} style={{
          display: 'flex', alignItems: 'center', gap: 10, width: '100%',
          padding: collapsed ? '10px 0' : '10px 16px', justifyContent: collapsed ? 'center' : 'flex-start',
          background: 'transparent', border: 'none', borderRadius: 8, cursor: 'pointer',
          font: "400 13px 'Inter', sans-serif", color: sidebarMuted, transition: 'all 0.15s',
          marginTop: 4,
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          {!collapsed && 'Sign Out'}
        </button>
        {!mobile && (
          <button onClick={() => setCollapsed(!collapsed)} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%',
            padding: '8px', background: 'transparent', border: 'none', borderRadius: 8,
            cursor: 'pointer', color: sidebarMuted, marginTop: 4,
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" style={{ transform: collapsed ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#FAF6F1', position: 'relative' }}>

      {/* Desktop sidebar */}
      <div className="sidebar-desktop" style={{ display: 'block' }}>
        <Sidebar />
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)', zIndex: 199 }}
          onClick={() => setMobileOpen(false)} />
      )}
      {mobileOpen && <Sidebar mobile />}

      {/* Main content */}
      <div className="layout-main" style={{ marginLeft: sidebarWidth, minHeight: '100vh', transition: 'margin-left 0.25s cubic-bezier(0.16,1,0.3,1)', position: 'relative', zIndex: 1 }}>
        {/* Topbar — glassmorphism */}
        <div style={{
          position: 'sticky', top: 0, zIndex: 50,
          background: 'rgba(245,243,240,0.6)',
          backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(0,0,0,0.04)',
          padding: '0 32px', minHeight: 56,
          paddingTop: 'env(safe-area-inset-top)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }} className="layout-topbar">
          <button className="mobile-menu-btn" onClick={() => setMobileOpen(true)} style={{
            display: 'none', background: 'none', border: 'none', cursor: 'pointer', color: '#666',
          }}>
            {ICONS.menu}
          </button>
          <div />
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Search / Cmd+K trigger */}
            <button onClick={() => setCmdOpen(true)} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '6px 12px 6px 10px', borderRadius: 100,
              border: '1px solid rgba(0,0,0,0.08)',
              background: 'rgba(255,255,255,0.5)',
              font: "400 12px 'Inter', sans-serif", color: '#AAA',
              cursor: 'pointer', backdropFilter: 'blur(8px)',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.8)'; e.currentTarget.style.color = '#666'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.5)'; e.currentTarget.style.color = '#AAA'; }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <span className="cmd-k-label" style={{ font: "400 11px 'JetBrains Mono', monospace", color: '#CCC' }}>
                {typeof navigator !== 'undefined' && navigator.platform?.includes('Mac') ? '\u2318K' : 'Ctrl K'}
              </span>
            </button>
            <div className="topbar-divider" style={{ width: 1, height: 20, background: 'rgba(0,0,0,0.08)' }} />
            <span className="topbar-date" style={{ font: "400 12px 'JetBrains Mono', monospace", color: '#AAA', letterSpacing: 0.5 }}>
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </span>
            <div className="topbar-divider" style={{ width: 1, height: 20, background: 'rgba(0,0,0,0.08)' }} />
            {!isEmbed && <NotificationBell />}
            {!isEmbed && <div className="topbar-divider" style={{ width: 1, height: 20, background: 'rgba(0,0,0,0.08)' }} />}
            {!isEmbed && <button onClick={() => window.location.href = '/'} style={{
              padding: '6px 14px', borderRadius: 100, border: '1px solid rgba(0,0,0,0.08)',
              background: 'rgba(255,255,255,0.5)', font: "400 11px 'Inter', sans-serif", color: '#AAA',
              cursor: 'pointer', backdropFilter: 'blur(8px)', transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = '#666'; }}
            onMouseLeave={e => { e.currentTarget.style.color = '#AAA'; }}
            >← Home</button>}
          </div>
        </div>

        {/* Page content */}
        <div className="layout-content" style={{ padding: '32px 36px', maxWidth: 1400, animation: 'fadeIn 0.4s cubic-bezier(0.16,1,0.3,1)' }}>
          {children}
        </div>
      </div>

      {!isEmbed && <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} />}
      <ThemePicker show={showTheme} onClose={() => setShowTheme(false)} />
      {/* HelpChat removed — was breaking mobile layout */}

      <style>{`
        @media (max-width: 860px) {
          .sidebar-desktop { display: none !important; }
          .mobile-menu-btn { display: flex !important; }
          .layout-main { margin-left: 0 !important; }
        }
        @media (max-width: 768px) {
          .layout-content {
            padding: 14px 12px !important;
          }
          .layout-topbar {
            padding: env(safe-area-inset-top) 10px 0 10px !important;
            min-height: calc(46px + env(safe-area-inset-top)) !important;
            height: auto !important;
          }
          .mobile-menu-btn {
            flex-shrink: 0 !important;
            margin-right: 4px !important;
            min-width: 44px !important;
            min-height: 44px !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
          }
          .cmd-k-label { display: none !important; }
          .topbar-date { display: none !important; }
          .topbar-divider { display: none !important; }
        }
      `}</style>
    </div>
  );
}
