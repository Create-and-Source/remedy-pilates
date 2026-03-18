// Pricing strategy and backend roadmap
import { useState } from 'react';
import { useStyles, useTheme } from '../theme';
import { getSettings } from '../data/store';

export default function Pricing() {
  const s = useStyles();
  const { theme } = useTheme();
  const settings = getSettings();
  const [showDetail, setShowDetail] = useState(null);

  const glass = {
    background: 'rgba(255,255,255,0.6)',
    backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid rgba(255,255,255,0.65)',
    borderRadius: 20,
    boxShadow: '0 4px 24px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)',
  };

  return (
    <div style={{ minHeight: '100vh', background: '#FAF6F1', padding: '40px 20px' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 48, animation: 'fadeIn 0.5s ease' }}>
          <div style={{ font: `500 11px ${s.MONO}`, textTransform: 'uppercase', letterSpacing: 2, color: s.text3, marginBottom: 12 }}>Pricing Strategy</div>
          <h1 style={{ font: `600 36px ${s.FONT}`, color: s.text, marginBottom: 8, letterSpacing: '-0.5px' }}>How We Got to $500/month</h1>
          <p style={{ font: `400 16px ${s.FONT}`, color: s.text2, maxWidth: 600, margin: '0 auto' }}>
            Research-backed pricing for Remedy's studio platform. Here's the math.
          </p>
        </div>

        {/* ═══ SECTION 1: What competitors charge ═══ */}
        <div style={{ ...glass, padding: 32, marginBottom: 24 }}>
          <h2 style={{ font: `600 20px ${s.FONT}`, color: s.text, marginBottom: 6 }}>1. What Competitors Charge</h2>
          <p style={{ font: `400 14px ${s.FONT}`, color: s.text2, marginBottom: 20 }}>None of them offer what we do — and they still charge this much.</p>

          <div style={{ display: 'grid', gap: 8 }}>
            {[
              { name: 'Mindbody', price: '$139-699/mo', features: 'Booking + POS + marketing', missing: 'Expensive tiers, clunky UX, nickel-and-dimes on add-ons, slow support', color: '#FEF3C7' },
              { name: 'Momence', price: '$99-399/mo', features: 'Booking + memberships', missing: 'No DM inbox, no retention engine, limited reporting, no client portal', color: '#E5E5E5' },
              { name: 'Mariana Tek', price: '$400+/mo', features: 'Premium boutique fitness', missing: 'Enterprise pricing, long contracts, no progress tracking, no social tools', color: '#FEF3C7' },
              { name: 'WellnessLiving', price: '$89-349/mo', features: 'All-in-one fitness', missing: 'Buggy app, poor onboarding, outdated UI, constant upsells', color: '#E5E5E5' },
              { name: 'Vagaro', price: '$80-195/mo', features: 'Booking + basic POS', missing: 'No class packages, no progress tracking, generic — not built for Pilates', color: '#E5E5E5' },
              { name: 'Glofox', price: '$100-300/mo', features: 'Gym/studio management', missing: 'No DM inbox, no referral system, no waitlist intelligence, gym-first design', color: '#E5E5E5' },
              { name: 'ClubReady', price: '$200-500/mo', features: 'Franchise-scale management', missing: 'Overkill for boutique, complex setup, no social media tools, rigid workflows', color: '#E5E5E5' },
            ].map(c => (
              <div key={c.name} style={{
                display: 'grid', gridTemplateColumns: '140px 100px 1fr 1fr', gap: 12, padding: '12px 16px',
                borderRadius: 12, background: 'rgba(255,255,255,0.4)', border: '1px solid rgba(0,0,0,0.04)',
                alignItems: 'center',
              }}>
                <span style={{ font: `600 14px ${s.FONT}`, color: s.text }}>{c.name}</span>
                <span style={{ font: `600 14px ${s.MONO}`, color: s.accent }}>{c.price}</span>
                <span style={{ font: `400 12px ${s.FONT}`, color: s.text2 }}>{c.features}</span>
                <span style={{ font: `400 12px ${s.FONT}`, color: s.danger }}>{c.missing}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ═══ SECTION 2: The Frankenstack ═══ */}
        <div style={{ ...glass, padding: 32, marginBottom: 24 }}>
          <h2 style={{ font: `600 20px ${s.FONT}`, color: s.text, marginBottom: 6 }}>2. What Studios Actually Pay Today (The Frankenstack)</h2>
          <p style={{ font: `400 14px ${s.FONT}`, color: s.text2, marginBottom: 20 }}>When you add up all the tools they juggle, plus staff time managing them:</p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 6 }}>
            {[
              { tool: 'Mindbody or Momence (booking + scheduling)', cost: '$139 – $399' },
              { tool: 'Mailchimp (email marketing)', cost: '$45 – $100' },
              { tool: 'SimpleTexting or Twilio (SMS reminders)', cost: '$30 – $80' },
              { tool: 'Hootsuite or Later (social media)', cost: '$49 – $99' },
              { tool: 'Birdeye or Podium (review management)', cost: '$299 – $399' },
              { tool: 'JotForm or WaiverForever (liability waivers)', cost: '$20 – $50' },
              { tool: 'Canva Pro (class graphics, promos)', cost: '$15' },
              { tool: 'Google Sheets (class packages, retention, referrals)', cost: 'Free but 10-20 hrs/mo labor' },
              { tool: 'Instagram DMs from phone (lead management)', cost: 'Free but chaos — lost leads' },
            ].map((item, i) => (
              <div key={i} style={{ display: 'contents' }}>
                <span style={{ font: `400 13px ${s.FONT}`, color: s.text, padding: '8px 0', borderBottom: '1px solid rgba(0,0,0,0.04)' }}>{item.tool}</span>
                <span style={{ font: `500 13px ${s.MONO}`, color: s.text, padding: '8px 0', borderBottom: '1px solid rgba(0,0,0,0.04)', textAlign: 'right' }}>{item.cost}</span>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 20, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            {[
              { label: 'Low End', software: '$300', labor: '$250 (10 hrs)', total: '$550/mo' },
              { label: 'Typical', software: '$550', labor: '$500 (20 hrs)', total: '$1,050/mo' },
              { label: 'High End', software: '$1,100', labor: '$750 (30 hrs)', total: '$1,850/mo' },
            ].map(t => (
              <div key={t.label} style={{
                padding: 20, borderRadius: 14, textAlign: 'center',
                background: t.label === 'Typical' ? s.accent : 'rgba(0,0,0,0.03)',
                color: t.label === 'Typical' ? s.accentText : s.text,
              }}>
                <div style={{ font: `500 11px ${s.MONO}`, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8, opacity: 0.7 }}>{t.label}</div>
                <div style={{ font: `600 24px ${s.FONT}`, marginBottom: 4 }}>{t.total}</div>
                <div style={{ font: `400 11px ${s.FONT}`, opacity: 0.7 }}>Software: {t.software}</div>
                <div style={{ font: `400 11px ${s.FONT}`, opacity: 0.7 }}>Staff labor: {t.labor}</div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 16, padding: 16, background: 'rgba(0,0,0,0.03)', borderRadius: 12, font: `400 13px ${s.FONT}`, color: s.text2, textAlign: 'center' }}>
            And they STILL don't have: DM Inbox, Client Portal, Retention Engine, Smart Waitlist, Recovery Tips Automation, or Referral Tracking.
          </div>
        </div>

        {/* ═══ SECTION 3: What we offer ═══ */}
        <div style={{ ...glass, padding: 32, marginBottom: 24 }}>
          <h2 style={{ font: `600 20px ${s.FONT}`, color: s.text, marginBottom: 6 }}>3. What We Offer — Everything, One Platform</h2>
          <p style={{ font: `400 14px ${s.FONT}`, color: s.text2, marginBottom: 20 }}>Features no competitor has, marked with a star.</p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              { name: 'Class Scheduling & Calendar', star: false },
              { name: 'Client Management (30+ fields)', star: false },
              { name: 'Progress Tracking (goals, measurements, milestones)', star: true },
              { name: 'Class Packages with session tracking', star: false },
              { name: 'Liability Waivers with e-signature', star: false },
              { name: 'Transformation Photos (progress angles)', star: true },
              { name: 'Equipment Inventory with maintenance tracking', star: false },
              { name: 'Client Check-In with class-aware health screening', star: true },
              { name: 'Recovery Tips Auto-Sequences (12 templates)', star: true },
              { name: 'DM Inbox — Instagram + Facebook + TikTok', star: true },
              { name: 'Email Marketing (6 templates, wizard)', star: false },
              { name: 'SMS Text Blasts + Individual Messages', star: false },
              { name: 'Social Media Post Creator (multi-platform)', star: false },
              { name: 'Retention Engine (lapsed client alerts)', star: true },
              { name: 'Smart Waitlist with auto-backfill', star: true },
              { name: 'Google Review Solicitation', star: true },
              { name: 'Referral Tracking + Credits', star: true },
              { name: 'Membership Wallets (class tracking, auto-deduct)', star: true },
              { name: 'Client Wallet (gift cards, credits, loyalty)', star: true },
              { name: 'Client Portal (luxury branded app)', star: true },
              { name: 'Online Booking (3-step premium flow)', star: false },
              { name: 'Reports + CSV Export', star: false },
              { name: 'White-Label Branding (instant color theming)', star: true },
              { name: '15 Class Types (Reformer, Mat, Barre, TRX, more)', star: false },
              { name: '6 Instructors with specialty matching', star: false },
              { name: 'Multi-Location Support (3 studios)', star: false },
              { name: 'PWA — installable on any phone', star: false },
              { name: 'Payment Integration (Square/Stripe)', star: false },
            ].map(f => (
              <div key={f.name} style={{
                padding: '10px 14px', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 10,
                background: f.star ? `${s.accent}08` : 'rgba(0,0,0,0.02)',
                border: f.star ? `1px solid ${s.accent}20` : '1px solid rgba(0,0,0,0.03)',
              }}>
                <span style={{ color: f.star ? s.accent : s.success, fontSize: 14, flexShrink: 0 }}>{f.star ? '★' : '✓'}</span>
                <span style={{ font: `${f.star ? '500' : '400'} 12px ${s.FONT}`, color: f.star ? s.text : s.text2 }}>{f.name}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 12, font: `400 12px ${s.FONT}`, color: s.text3 }}>★ = Features no competitor offers</div>
        </div>

        {/* ═══ SECTION 4: Our Pricing ═══ */}
        <div style={{ ...glass, padding: 32, marginBottom: 24 }}>
          <h2 style={{ font: `600 20px ${s.FONT}`, color: s.text, marginBottom: 6 }}>4. Our Price</h2>
          <p style={{ font: `400 14px ${s.FONT}`, color: s.text2, marginBottom: 24 }}>One price. Everything included. No tiers, no add-ons, no per-user fees.</p>

          <div style={{
            padding: 40, borderRadius: 20, textAlign: 'center',
            background: `linear-gradient(135deg, ${s.accent}, ${s.accent}CC)`,
            color: s.accentText, marginBottom: 24,
            boxShadow: `0 8px 40px ${s.accent}30`,
          }}>
            <div style={{ font: `500 12px ${s.MONO}`, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12, opacity: 0.8 }}>Per Location / Month</div>
            <div style={{ font: `700 56px ${s.FONT}`, letterSpacing: '-2px', marginBottom: 8 }}>$500</div>
            <div style={{ font: `400 16px ${s.FONT}`, opacity: 0.85, marginBottom: 4 }}>Everything. Unlimited users. White-label branded.</div>
            <div style={{ font: `400 14px ${s.FONT}`, opacity: 0.65 }}>+ White-glove onboarding, data migration, staff training</div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ padding: 20, borderRadius: 14, background: 'rgba(0,0,0,0.03)' }}>
              <div style={{ font: `600 15px ${s.FONT}`, color: s.text, marginBottom: 8 }}>Why $500 works</div>
              <ul style={{ font: `400 13px ${s.FONT}`, color: s.text2, lineHeight: 1.8, paddingLeft: 16 }}>
                <li>Less than half their current Frankenstack ($1,050 avg)</li>
                <li>Saves 15+ hours/month of admin labor</li>
                <li>Replaces 5-7 separate subscriptions</li>
                <li>12 features no competitor has</li>
                <li>One login instead of seven</li>
                <li>Client portal drives retention = more rebookings</li>
              </ul>
            </div>
            <div style={{ padding: 20, borderRadius: 14, background: 'rgba(0,0,0,0.03)' }}>
              <div style={{ font: `600 15px ${s.FONT}`, color: s.text, marginBottom: 8 }}>The business math</div>
              <ul style={{ font: `400 13px ${s.FONT}`, color: s.text2, lineHeight: 1.8, paddingLeft: 16 }}>
                <li>10 studios = $60K/year (manageable)</li>
                <li>20 studios = $120K/year (real business)</li>
                <li>40 studios = $240K/year (scaling)</li>
                <li>No transaction fee complexity</li>
                <li>No payment processing liability</li>
                <li>They use their own Square/Stripe — we just connect</li>
              </ul>
            </div>
          </div>
        </div>

        {/* ═══ SECTION 5: The pitch ═══ */}
        <div style={{ ...glass, padding: 32, marginBottom: 24 }}>
          <h2 style={{ font: `600 20px ${s.FONT}`, color: s.text, marginBottom: 16 }}>5. The Pitch</h2>
          <div style={{
            padding: 24, borderRadius: 16, background: 'rgba(0,0,0,0.03)',
            font: `400 15px ${s.FONT}`, color: s.text, lineHeight: 1.8, fontStyle: 'italic',
            borderLeft: `4px solid ${s.accent}`,
          }}>
            "You're paying $550 to $1,100 a month for 5 to 7 different tools that don't talk to each other, plus 20 hours a month of someone's time stitching it all together.
            <br /><br />
            We're replacing ALL of it — plus features none of those tools have — for $500 a month. One platform. Your brand. Your colors. Your clients see a portal with your studio name, not Mindbody's.
            <br /><br />
            You save money, save time, and your clients get a better experience. Can I show you?"
          </div>
        </div>

        {/* ═══ SECTION 6: Backend Buildout ═══ */}
        <div style={{ ...glass, padding: 32, marginBottom: 24 }}>
          <h2 style={{ font: `600 20px ${s.FONT}`, color: s.text, marginBottom: 6 }}>6. Backend Buildout</h2>
          <p style={{ font: `400 14px ${s.FONT}`, color: s.text2, marginBottom: 20 }}>The front-end is 100% done. Everything works with localStorage for demos. Here's what needs a backend to go live:</p>

          <div style={{ display: 'grid', gap: 10 }}>
            {[
              { priority: 'P0', task: 'Database (DynamoDB or RDS)', desc: 'Replace all localStorage with real persistence. The store.js has clean CRUD functions — same API, just swap localStorage for DB calls.', effort: '1-2 weeks' },
              { priority: 'P0', task: 'Auth (Cognito)', desc: 'Role-based login: admin, instructor, staff, client (portal). JWT tokens. The role system is already built in the UI.', effort: '3-5 days' },
              { priority: 'P1', task: 'Square/Stripe Connect (Lambda)', desc: 'OAuth flow — studio connects their existing account. We never touch money. Just store access tokens and fire charges through their account.', effort: '3-5 days' },
              { priority: 'P1', task: 'Twilio (SMS)', desc: 'Replace simulated text sends with real Twilio API calls. The message templates and audience targeting are all built.', effort: '2-3 days' },
              { priority: 'P1', task: 'Instagram Graph API', desc: 'Make DM Inbox real. OAuth connect to studio IG Business account. Webhook listener for incoming DMs. Send replies via API.', effort: '1 week' },
              { priority: 'P1', task: 'Email (SES or SendGrid)', desc: 'Replace simulated email sends. Templates are built, just need delivery.', effort: '2-3 days' },
              { priority: 'P2', task: 'S3 (Photo Storage)', desc: 'Transformation photos, profile images. Upload from the existing photo UI.', effort: '2-3 days' },
              { priority: 'P2', task: 'Google Business Profile API', desc: 'Read/reply to Google reviews from within the Reviews page.', effort: '3-5 days' },
              { priority: 'P2', task: 'Push Notifications (SNS)', desc: 'Service worker is registered. Just need SNS to send push events.', effort: '2-3 days' },
            ].map(item => (
              <div key={item.task} style={{
                display: 'grid', gridTemplateColumns: '50px 1fr auto', gap: 12, padding: '14px 18px',
                borderRadius: 12, background: 'rgba(255,255,255,0.4)', border: '1px solid rgba(0,0,0,0.04)',
                alignItems: 'center',
              }}>
                <span style={{
                  padding: '4px 10px', borderRadius: 8, textAlign: 'center',
                  font: `600 10px ${s.MONO}`, textTransform: 'uppercase',
                  background: item.priority === 'P0' ? '#FEF2F2' : item.priority === 'P1' ? '#FFF7ED' : '#F0FDF4',
                  color: item.priority === 'P0' ? s.danger : item.priority === 'P1' ? s.warning : s.success,
                }}>{item.priority}</span>
                <div>
                  <div style={{ font: `600 14px ${s.FONT}`, color: s.text, marginBottom: 2 }}>{item.task}</div>
                  <div style={{ font: `400 12px ${s.FONT}`, color: s.text2 }}>{item.desc}</div>
                </div>
                <span style={{ font: `500 12px ${s.MONO}`, color: s.text3, whiteSpace: 'nowrap' }}>{item.effort}</span>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 20, padding: 16, background: `${s.accent}08`, borderRadius: 12, border: `1px solid ${s.accent}15` }}>
            <div style={{ font: `600 14px ${s.FONT}`, color: s.text, marginBottom: 6 }}>Total estimated backend buildout: 4-6 weeks</div>
            <div style={{ font: `400 13px ${s.FONT}`, color: s.text2 }}>
              P0 items (database + auth) get you a working product. P1 items (payments, SMS, IG) make it sellable. P2 items are polish.
              The front-end architecture is clean — store.js functions map 1:1 to API endpoints. No refactoring needed.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', padding: '32px 0', font: `400 13px ${s.FONT}`, color: s.text3 }}>
          Remedy Pilates & Barre — Studio Platform, March 2026
        </div>
      </div>
    </div>
  );
}
