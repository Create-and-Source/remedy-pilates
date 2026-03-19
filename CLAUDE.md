# Pilates & Barre — Studio Management Platform

> Full-stack Pilates & Barre studio management platform (3 Arizona locations).
> React SPA + AWS backend + Capacitor iOS/Android native app.
> 63 pages, Body Intelligence AI suite, real ML posture detection, hybrid localStorage/API data layer.

## Tech Stack

- **Framework**: React 19.2.4 + React Router DOM 7.13.1 + Vite (latest)
- **Native**: Capacitor 8.2.0 (iOS + Android), bundle ID `com.pilatesstudio.app`
- **Backend**: AWS Lambda (Node.js 20.x) + API Gateway + DynamoDB (30 tables) + S3 + Cognito
- **IaC**: Terraform (`terraform/`) + CDK (`backend/`)
- **Hosting**: Vercel (SPA routing via `vercel.json` rewrites)
- **Deploy URL**: https://pilates-web.vercel.app
- **Styling**: CSS-in-JS via `theme.jsx` (useStyles hook) + inline styles
- **State**: React hooks (useState, useCallback, useMemo, useContext) + localStorage
- **Persistence**: Hybrid — localStorage for instant reads, AWS API for durable writes (fire-and-forget)
- **Auth**: AWS Cognito (USER_PASSWORD_AUTH, JWT tokens) + demo mode (localStorage flags)
- **ML**: @mediapipe/tasks-vision (PoseLandmarker for real-time 33-point pose detection)
- **Voice**: Web Speech API (SpeechSynthesisUtterance for voice-guided features)
- **Theme**: Dynamic brand color system with 8 presets + custom hex color picker
- **Build**: `npm run build` → Vite production build → `dist/`
- **PWA**: Service worker (`public/sw.js`), install prompt, offline page

### Commands

```bash
npm run dev      # Dev server (Vite)
npm run build    # Production build
npm run preview  # Preview production build
npm run lint     # ESLint
npx cap sync     # Sync dist/ to iOS/Android native projects
```

### Environment Variables

```
VITE_API_URL=https://zctgtqjm54.execute-api.us-west-2.amazonaws.com
VITE_COGNITO_USER_POOL_ID=us-west-2_Y0gGN3ZqQ
VITE_COGNITO_CLIENT_ID=2mur2u917rd7tvcgg267hrlof7
VITE_S3_BUCKET=pilates-uploads-092016234733
VITE_STYKU_API_URL=     # optional — STYKU 3D body scanner
VITE_STYKU_API_KEY=     # optional
VITE_INBODY_API_URL=    # optional — InBody body composition
VITE_INBODY_ACCOUNT=    # optional
VITE_INBODY_API_KEY=    # optional
```

When `VITE_API_URL` is unset, the app runs in pure demo mode (all data in localStorage, no network calls).

## Project Structure

```
src/
├── main.jsx                    # Entry point (BrowserRouter, global CSS keyframes, SW registration)
├── App.jsx                     # Root component, all routes, lazy loading, initStore()
├── theme.jsx                   # ThemeProvider, useTheme, useStyles, 8 presets, avatar gradients
├── api/
│   ├── auth.js                 # Cognito auth (signIn, refreshSession, getValidToken, signOut, signInDemo)
│   ├── client.js               # AWS API client (drop-in for store.js with 30+ CRUD endpoints)
│   ├── styku.js                # STYKU 3D body scanner API client + demo data generator
│   ├── inbody.js               # InBody body composition API client + demo data generator
│   └── wearables/              # Wearable device integrations
├── data/
│   └── store.js                # Central localStorage store (CRUD, seed data, subscribe/notify reactivity)
├── components/
│   ├── Layout.jsx              # Admin shell: dark sidebar (13 sections), topbar, command palette, theme picker
│   ├── CommandPalette.jsx      # Cmd+K search overlay for admin navigation
│   ├── HelpChat.jsx            # Floating help chat assistant (keyword-matching)
│   ├── NotificationBell.jsx    # Admin notification dropdown
│   ├── CheckoutDrawer.jsx      # Slide-out checkout drawer
│   └── ProtectedRoute.jsx      # Auth guard (role-based, demo mode passthrough)
├── pages/                      # 63 page components (all lazy-loaded, code-split)
│   ├── # ── Public ──
│   ├── Onboarding.jsx          # 4-screen first-launch intro (goals, preferences, profile)
│   ├── Home.jsx                # Client "daily studio" — next class, streak, carousels, studio info
│   ├── SignIn.jsx              # Role picker (demo) or Cognito email/password login
│   ├── BookOnline.jsx          # Online booking with calendar strip, difficulty pills, instructor avatars
│   ├── Pricing.jsx             # Pricing page
│   ├── Team.jsx                # Public instructor profiles
│   ├── FreeTrialFlow.jsx       # Free trial booking flow
│   ├── Portal.jsx              # Client portal — streak, milestones, progress ring, recommendations
│   │
│   ├── # ── Core Admin ──
│   ├── Dashboard.jsx           # Admin KPIs, sparklines, quick actions
│   ├── CheckIn.jsx             # Client check-in system
│   ├── Patients.jsx            # Client CRM
│   ├── Schedule.jsx            # Class schedule / calendar
│   ├── Treatments.jsx          # Class packages
│   ├── Charts.jsx              # Session notes — muscle body map, spring settings, flexibility tracking
│   ├── BeforeAfter.jsx         # Transformation photos
│   ├── Waivers.jsx             # Digital waivers
│   ├── Memberships.jsx         # 6 Pilates plans, KPI cards, member detail modal
│   ├── MembershipPerks.jsx     # Membership perk management
│   ├── Wallet.jsx              # Client wallet / credits
│   ├── Referrals.jsx           # Referral program
│   ├── LoyaltyProgram.jsx      # Loyalty points & rewards
│   ├── Inventory.jsx           # Equipment & retail inventory
│   ├── Retention.jsx           # Basic retention alerts
│   ├── Aftercare.jsx           # Post-class recovery tips
│   ├── Waitlist.jsx            # Class waitlist
│   ├── Reviews.jsx             # Review management
│   ├── Inbox.jsx               # DM inbox
│   ├── Email.jsx               # Email campaigns
│   ├── TextMessages.jsx        # SMS campaigns
│   ├── SocialMedia.jsx         # Social media management
│   ├── TikTokDashboard.jsx     # TikTok strategy & analytics
│   ├── GroupBookings.jsx       # Group class bookings
│   ├── OnDemandLibrary.jsx     # On-demand video class library
│   ├── BrandedFormats.jsx      # Brand guide & asset management
│   ├── Reports.jsx             # Analytics & reports
│   ├── Training.jsx            # Teacher training pipeline (PSC 450+ hours)
│   ├── Settings.jsx            # Studio settings
│   │
│   ├── # ── Body Intelligence Suite (10 pages) ──
│   ├── PostureAI.jsx           # ML-powered posture assessment (MediaPipe 33-point skeleton)
│   ├── PostureTimelapse.jsx    # Skeletal alignment transformation reel over time
│   ├── MovementRx.jsx          # Movement prescription engine
│   ├── AIIntake.jsx            # AI intake form → auto-generated 4-week Movement Rx plan
│   ├── FatigueTracker.jsx      # Muscle fatigue tracking (10 muscle groups, 72hr rolling window)
│   ├── SpringEngine.jsx        # Reformer spring recommendation engine per client
│   ├── ClassSequencer.jsx      # Exercise flow generator with voice-guided teaching cues
│   ├── WearablesHub.jsx        # Simulated Apple Watch/Fitbit/Garmin/WHOOP/Oura integration
│   ├── BodyScans.jsx           # STYKU 3D + InBody body composition lab
│   ├── ARSimulator.jsx         # AR reformer simulator concept demo
│   │
│   ├── # ── Retention & Growth (5 pages) ──
│   ├── RetentionBrain.jsx      # Churn prediction scoring (weighted 6-factor model)
│   ├── CohortAnalysis.jsx      # Cohort retention heatmap + A/B intervention experiments
│   ├── ReferralEngine.jsx      # Referral virality loop + advocate identification
│   ├── Challenges.jsx          # Gamified client challenges, badges, leaderboard
│   ├── RecoveryText.jsx        # Post-class recovery SMS system (Twilio-ready)
│   │
│   ├── # ── Studio Tech (7 pages) ──
│   ├── InstructorDashboard.jsx # Per-instructor performance metrics
│   ├── InstructorTipping.jsx   # Instructor gratuity system
│   ├── VoiceClone.jsx          # Instructor voice clone for on-demand class generation
│   ├── VirtualStudio.jsx       # Hybrid live/virtual class system + on-demand library
│   ├── AIFrontDesk.jsx         # AI front desk chatbot
│   ├── SmartInventory.jsx      # Predictive inventory with linear regression forecasting
│   ├── LiveDashboard.jsx       # Real-time studio metrics dashboard
│   ├── VoiceAI.jsx             # Voice AI phone receptionist
│   │
│   ├── # ── Intelligence (4 pages) ──
│   ├── NaturalLanguageBI.jsx   # "Ask Studio AI" — natural language data queries
│   ├── ClassRecommender.jsx    # AI class recommendation engine
│   ├── DynamicPricing.jsx      # Dynamic pricing optimization
│   │
│   ├── # ── Staff (2 pages) ──
│   ├── TraineePortal.jsx       # Teacher training client portal (trainee-facing)
│   └── Training.jsx            # Teacher training admin pipeline
```

## Routes

### Public (no auth required)

| Route | Component | Description |
|-------|-----------|-------------|
| `/onboarding` | Onboarding | 4-screen first-launch intro (shown once, sets `rp_onboarded`) |
| `/` | Home | Client daily studio — next class hero, streak widget, class carousels |
| `/signin` | SignIn | Demo role picker OR Cognito email+password login |
| `/book` | BookOnline | Online booking with 14-day calendar strip, difficulty pills |
| `/book/free-trial` | FreeTrialFlow | Free trial booking flow |
| `/pricing` | Pricing | Pricing page |
| `/team` | Team | Public instructor profiles |

### Protected (any authenticated role)

| Route | Component | Description |
|-------|-----------|-------------|
| `/portal` | Portal | Client portal — streak, milestones, progress ring, recommendations |

### Admin (roles: owner, instructor, front_desk)

All prefixed with `/admin`:

| Path | Component | Description |
|------|-----------|-------------|
| `/admin` | Dashboard | KPIs, sparklines, quick actions, attention cards |
| `/admin/checkin` | CheckIn | Client check-in system |
| `/admin/clients` | Patients | Client CRM |
| `/admin/schedule` | Schedule | Class schedule / calendar |
| `/admin/sessions` | Treatments | Class packages |
| `/admin/charts` | Charts | Session notes — muscle body map, spring settings |
| `/admin/photos` | BeforeAfter | Transformation photos |
| `/admin/waivers` | Waivers | Digital waivers |
| `/admin/memberships` | Memberships | Membership management (6 plans) |
| `/admin/membership-perks` | MembershipPerks | Membership perk management |
| `/admin/wallet` | Wallet | Client credits |
| `/admin/referrals` | Referrals | Referral program |
| `/admin/loyalty` | LoyaltyProgram | Loyalty points & rewards |
| `/admin/inventory` | Inventory | Equipment & retail stock |
| `/admin/retention` | Retention | Retention alerts |
| `/admin/recovery-tips` | Aftercare | Post-class recovery tips |
| `/admin/waitlist` | Waitlist | Class waitlist |
| `/admin/reviews` | Reviews | Review management |
| `/admin/inbox` | Inbox | DM inbox |
| `/admin/email` | Email | Email campaigns |
| `/admin/texts` | TextMessages | SMS campaigns |
| `/admin/social` | SocialMedia | Social media management |
| `/admin/tiktok` | TikTokDashboard | TikTok strategy |
| `/admin/group-bookings` | GroupBookings | Group class bookings |
| `/admin/on-demand` | OnDemandLibrary | On-demand video library |
| `/admin/brand-guide` | BrandedFormats | Brand guide & assets |
| `/admin/reports` | Reports | Analytics & reports |
| `/admin/training` | Training | Teacher training pipeline |
| `/admin/posture` | PostureAI | ML posture assessment |
| `/admin/posture-timelapse` | PostureTimelapse | Posture transformation reel |
| `/admin/movement-rx` | MovementRx | Movement prescriptions |
| `/admin/ai-intake` | AIIntake | AI intake → auto Movement Rx plan |
| `/admin/fatigue` | FatigueTracker | Muscle fatigue tracker |
| `/admin/spring-engine` | SpringEngine | Reformer spring recommendations |
| `/admin/sequencer` | ClassSequencer | Voice-guided class flow generator |
| `/admin/wearables` | WearablesHub | Wearable device integration |
| `/admin/body-scans` | BodyScans | STYKU 3D + InBody body composition lab |
| `/admin/ar-simulator` | ARSimulator | AR reformer simulator |
| `/admin/retention-brain` | RetentionBrain | Churn prediction AI |
| `/admin/cohort-analysis` | CohortAnalysis | Cohort retention + A/B experiments |
| `/admin/referral-engine` | ReferralEngine | Referral virality + advocate scoring |
| `/admin/challenges` | Challenges | Gamified challenges & leaderboard |
| `/admin/recovery-text` | RecoveryText | Post-class recovery SMS |
| `/admin/instructors` | InstructorDashboard | Instructor metrics |
| `/admin/instructor-tipping` | InstructorTipping | Instructor gratuity |
| `/admin/voice-clone` | VoiceClone | Instructor voice clone studio |
| `/admin/virtual-studio` | VirtualStudio | Hybrid live/virtual classes |
| `/admin/ai-front-desk` | AIFrontDesk | AI chatbot front desk |
| `/admin/smart-inventory` | SmartInventory | Predictive inventory forecasting |
| `/admin/live-dashboard` | LiveDashboard | Real-time studio metrics |
| `/admin/voice-ai` | VoiceAI | Voice AI phone receptionist |
| `/admin/natural-language-bi` | NaturalLanguageBI | Natural language data queries |
| `/admin/class-recommender` | ClassRecommender | AI class recommendations |
| `/admin/dynamic-pricing` | DynamicPricing | Dynamic pricing optimization |
| `/admin/trainee-portal` | TraineePortal | Trainee-facing progress dashboard |
| `/admin/settings` | Settings | Studio settings |

**Total: 63 pages across 7 public + 1 portal + 54 admin routes**

## Admin Sidebar Sections

| Section | Pages | Role Restrictions |
|---------|-------|-------------------|
| Overview | Dashboard, Check-In | all |
| Clients | Clients, Schedule, Class Packages, Progress Tracking, Transformations, Waivers, Recovery Tips | mixed |
| Billing | Memberships, Membership Perks, Client Wallet, Referrals, Loyalty Program | owner |
| Operations | Inventory, Retention, Waitlist, Reviews | mixed |
| Marketing | DM Inbox, Email, Text Messages, Social Media, TikTok Strategy, Group Bookings | mixed |
| Content | On-Demand Library, Brand Guide | owner/instructor |
| Body Intelligence | Posture AI, Posture Time-lapse, Movement Rx, AI Intake→Rx, Fatigue Tracker, Spring Engine, Class Sequencer, Wearables Hub, Body Composition Lab, AR Reformer | owner/instructor |
| Retention & Growth | Retention Brain, Cohort Analysis, Referral Engine, Challenges, Recovery Texts | owner |
| Studio Tech | Instructor Metrics, Instructor Tipping, Voice Clone, Virtual Studio, AI Front Desk, Smart Inventory, Voice AI Phone, Live Dashboard | owner |
| Intelligence | Ask Studio AI, Class Recommender, Dynamic Pricing | owner |
| Staff | Teacher Training, Trainee Portal | owner/instructor |
| Reporting | Reports | owner |
| System | Settings | owner |

## Auth & Roles

### Demo Roles (when `VITE_API_URL` is unset)

| Name | Role | Navigates To |
|------|------|-------------|
| Alex Morgan | owner | `/admin` |
| Sam Rivera | instructor | `/admin` |
| Front Desk | front_desk | `/admin` |
| Client Portal | client | `/portal` |

### Cognito Roles (when `VITE_API_URL` is set)

Role extracted from `custom:role` claim in JWT ID token. Same 4 roles + `trainee`.

### ProtectedRoute behavior

- **Demo mode**: passthrough (no auth check)
- **Production mode**: checks `rp_auth_token` → redirect to `/signin` if missing, redirect by role if wrong

## localStorage Keys — Complete

### Store Data (managed by `store.js`)

| Key | Type | Seeded | Description |
|-----|------|--------|-------------|
| `rp_clients` | Array | 30 clients | Client records (IDs: CLT-1000 to CLT-1029) |
| `rp_appointments` | Array | ~150 | Class bookings (past 7 + next 14 days) |
| `rp_class_packages` | Array | 8 packages | Treatment plans / class packages |
| `rp_instructors` | Array | 6 instructors | Instructor profiles with bios, certs, specialties |
| `rp_services` | Array | 15 services | Class/service catalog with pricing (cents) |
| `rp_locations` | Array | 3 locations | Studio locations |
| `rp_inventory` | Array | 15 items | Equipment (7), Props (4), Retail (3), Parts (1) |
| `rp_retention_alerts` | Array | Auto-generated | Clients with >80 days since last visit |
| `rp_emails` | Array | 5 | Sent email campaigns |
| `rp_texts` | Array | 5 | Sent SMS campaigns |
| `rp_social_posts` | Array | 5 | Social media posts |
| `rp_social_connections` | Object | Yes | `{instagram, facebook, x, linkedin, tiktok}` booleans |
| `rp_checkins` | Array | Up to 5 | Today's class check-ins |
| `rp_photos` | Array | Empty | Progress/transformation photos |
| `rp_trainees` | Array | 4 trainees | Teacher training pipeline |
| `rp_posture_assessments` | Array | Empty | PostureAI results with landmark data |
| `rp_prescriptions` | Array | Empty | Movement Rx prescriptions |
| `rp_bookings` | Array | Empty | Fatigue tracker bookings |
| `rp_settings` | Object | Yes | Business name, tagline, email, website, phone |
| `rp_initialized` | Boolean | true | Whether full seed has run |

### Body Scanner Data

| Key | Type | Seeded | Description |
|-----|------|--------|-------------|
| `rp_styku_scans` | Array | 8 clients × 2-3 scans | STYKU 3D body scan results |
| `rp_styku_seeded` | Boolean | true | Whether Styku demo data has been seeded |
| `rp_inbody_scans` | Array | 8 clients × 2-3 scans | InBody body composition results |
| `rp_inbody_seeded` | Boolean | true | Whether InBody demo data has been seeded |

### Auth & UI State

| Key | Type | Description |
|-----|------|-------------|
| `rp_auth_token` | String | Cognito JWT ID token (or `'demo'` in demo mode) |
| `rp_refresh_token` | String | Cognito refresh token |
| `rp_token_expires` | String | Token expiry timestamp (ms) |
| `rp_user_name` | String | User display name |
| `rp_user_role` | String | `owner`, `instructor`, `front_desk`, `trainee`, `client` |
| `rp_theme` | Object | `{id, name, accent, accentLight, accentText}` |
| `rp_onboarded` | Boolean | Whether onboarding has been completed (gates `/` route) |
| `rp_onboarding_profile` | Object | `{goals, level, injuries, classTypes, prefTime, classLength}` |

## Design System

### Theme System

Dynamic brand color with 8 presets + custom hex input. Stored in `rp_theme`.

| Preset | Accent | Description |
|--------|--------|-------------|
| Clay (default) | `#C4704B` | Warm terracotta |
| Eucalyptus | `#6B8F71` | Sage green |
| Blush | `#C47B8E` | Muted rose |
| Storm | `#5B7B8F` | Cool blue-grey |
| Linen | `#A68B6B` | Warm tan |
| Dusk | `#8B6B94` | Soft purple |
| Ember | `#B85C38` | Deep orange |
| Charcoal | `#3D3D3D` | Neutral dark |

### Colors

```
Background:     #FAF6F1 (warm linen)
Card:           rgba(255,255,255,0.72) with blur(20px) backdrop
Border:         rgba(255,255,255,0.6)
Text:           #111111
Text secondary: #555555
Text muted:     #999999
Success:        #16A34A
Warning:        #D97706
Danger:         #DC2626
Sidebar:        #111111 (always dark)
```

### Fonts (Google Fonts)

| Font | Variable | Usage |
|------|----------|-------|
| Outfit | `s.FONT` | Body text, UI elements, buttons |
| Playfair Display | `s.DISPLAY` | Headlines, page titles |
| JetBrains Mono | `s.MONO` | Labels, metadata, monospace |
| Inter | — | Sidebar, admin chrome |

### Style Helpers (from `useStyles()`)

| Key | Description |
|-----|-------------|
| `s.pill` | Base pill button (borderRadius: 100) |
| `s.pillAccent` | Accent-colored pill with shadow |
| `s.pillOutline` | Outline pill with accent border |
| `s.pillGhost` | Ghost pill with subtle background |
| `s.input` | Standard input field |
| `s.label` | JetBrains Mono 10px uppercase label |
| `s.cardStyle` | Glass morphism card |
| `s.tableWrap` | Table container with glass morphism |

### Card Pattern (Glass Morphism)

```js
background: 'rgba(255,255,255,0.72)',
backdropFilter: 'blur(20px)',
border: '1px solid rgba(255,255,255,0.6)',
borderRadius: 16,
boxShadow: '0 4px 24px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)',
```

### Difficulty Pill Colors (BookOnline, Carousels)

| Level | Background | Text |
|-------|-----------|------|
| Beginner | `#E8F0E9` (soft sage) | `#4A6B4F` |
| Intermediate | `#FDF0EA` (warm clay) | `#8B5A3C` |
| Advanced | `#F5E8EC` (muted rose) | `#8B4A5E` |

### Global CSS Keyframes (from `main.jsx`)

`fadeIn`, `fadeInUp`, `fadeInScale`, `spin`, `slideIn`, `pulse`, `shimmer`, `float`, `glow`, `orb1`, `orb2`

### Global CSS Classes

`.glass-card`, `.modal-backdrop`, `.stagger-in > *:nth-child(1-8)` (60ms delay increments)

## Data Flow

### Hybrid Data Architecture

```
App.jsx mounts
    ↓
getValidToken() — refresh JWT if expired (production) or skip (demo)
    ↓
initStore() — if VITE_API_URL set:
    ├── GET /api/init (bulk fetch 13 collections)
    ├── Map into localStorage (rp_clients, rp_appointments, etc.)
    └── seedIfEmpty() fills any gaps
    ↓ if no API:
    └── Seed localStorage with 30 clients, 150 appointments, etc.
    ↓
Pages read ONLY from localStorage (synchronous, no async waterfalls)
    ↓
Pages write to localStorage (instant) + fire-and-forget API call (async)
    ↓
subscribe() / notify() triggers cross-component reactivity
```

### `/api/init` Response Mapping

```
clients          → rp_clients
appointments     → rp_appointments
services         → rp_services
instructors      → rp_instructors
locations        → rp_locations
class_packages   → rp_class_packages
inventory        → rp_inventory
emails           → rp_emails
texts            → rp_texts
social_posts     → rp_social_posts
retention_alerts → rp_retention_alerts
trainees         → rp_trainees
checkins         → rp_checkins
settings         → rp_settings
```

### store.js — All Exported Functions

```
// Reactivity
subscribe(fn) → unsubscribe fn
notify()

// Clients: getPatients, addPatient, updatePatient, deletePatient, getPatient
// Appointments: getAppointments, addAppointment, updateAppointment, deleteAppointment
// Class Packages: getTreatmentPlans, addTreatmentPlan, updateTreatmentPlan, deleteTreatmentPlan
// Inventory: getInventory, addInventoryItem, updateInventoryItem, adjustStock, getEquipmentInventory
// Emails: getEmails, addEmail
// SMS: getTextMessages, addTextMessage
// Social: getSocialPosts, addSocialPost, updateSocialPost, deleteSocialPost
// Retention: getRetentionAlerts, updateRetentionAlert
// Services: getServices, addService, updateService, deleteService
// Instructors: getProviders, addProvider, updateProvider
// Locations: getLocations, addLocation
// Photos: getPhotos, addPhoto, deletePhoto
// Trainees: getTrainees, addTrainee, updateTrainee, deleteTrainee
// Posture: getAssessments, addAssessment, deleteAssessment
// Movement Rx: getPrescriptions, addPrescription, deletePrescription
// Fatigue: getBookings, addBooking, deleteBooking
// Settings: getSettings, updateSettings
// Helper: formatPrice(cents)
// Init: initStore() → Promise<void>
```

### client.js — Additional API-Only Functions

Beyond store.js equivalents, `client.js` adds:
- Check-ins: `getCheckins, addCheckin`
- Waivers: `getWaivers, addWaiver, updateWaiver`
- Waitlist: `getWaitlist, addWaitlistEntry, removeWaitlistEntry`
- Wallets: `getWallets, addWallet, updateWallet`
- Transactions: `getTransactions, addTransaction`
- Inbox: `getInbox, addMessage, updateMessage`
- Reviews: `getReviews, addReview, updateReview`
- Referrals: `getReferrals, addReferral, updateReferral, getReferralSettings, updateReferralSettings`
- Memberships: `getMemberships, addMembership, updateMembership, deleteMembership, getMembershipPackages, addMembershipPackage, updateMembershipPackage`
- Recovery Tips: `getRecoveryTips, addRecoveryTip, updateRecoveryTip`
- Charts: `getCharts, addChart, updateChart`

Auto-refresh: on 401 → try `getValidToken()` → retry once → `signOut()` + redirect to `/signin`.

## Seeded Data Details

### Clients (30)
IDs: `CLT-1000` through `CLT-1029`. Random membership tiers: None (40%), Silver, Gold, Platinum. Random visit counts 1-60, last visit up to 120 days ago.

### Appointments (~150)
Days -7 to +14. 4-12 per day. Past: `completed`. Future: `confirmed`/`pending`.

### Instructors (6) — Demo Mode

| ID | Name | Title | Accent | Specialties |
|----|------|-------|--------|-------------|
| INS-1 | Alex Morgan | Owner & Master Trainer | #C4704B | Reformer, Mat, Barre, Private, Teacher Training, TRX |
| INS-2 | Sam Rivera | Lead Reformer Instructor | #6B8F71 | Reformer, Reformer + Cardio, Private, Prenatal |
| INS-3 | Jordan Chen | Barre & TRX Specialist | #8B6B94 | Barre, TRX Fusion, Barre Burn, Group Apparatus |
| INS-4 | Taylor Brooks | Pilates Instructor | #5B7B8F | Mat, Reformer, Stretch & Restore, Youth |
| INS-5 | Casey Williams | Pilates Instructor | #A68B6B | Reformer, Mat, Barre, Private |
| INS-6 | Riley Kim | Teacher Training Lead | #B85C38 | Teacher Training, Reformer, Group Apparatus, Mat |

### Services / Classes (15)

| Category | Classes (price in cents) |
|----------|------------------------|
| Pilates | Reformer (3800), Mat (2800), Reformer + Cardio (4000), Group Apparatus (4200) |
| Barre | Barre (3200), Barre Burn (3200) |
| TRX | TRX Fusion (3500) |
| Wellness | Stretch & Restore (2500) |
| Private | Private Training (9500), Semi-Private (6500/person) |
| Specialty | Prenatal (3500), Youth Conditioning (3000) |
| Intro | Intro to Reformer (free), Virtual Consultation (free) |
| Training | Teacher Training Program |

### Locations (3) — Demo Mode

| Name | Address | Phone |
|------|---------|-------|
| Downtown Studio | 123 Main St, Suite 200, Phoenix, AZ 85004 | (555) 100-0001 |
| Westside Studio | 456 West Ave, Scottsdale, AZ 85251 | (555) 100-0002 |
| North Studio | 789 North Blvd, Phoenix, AZ 85014 | (555) 100-0003 |

### Memberships (6 plans)

| Plan | Price | Description |
|------|-------|-------------|
| Drop-In | $35/class | Single class |
| Starter 5-Pack | $150 ($30/class) | 5 classes, 3-month expiry |
| Core 10-Pack | $280 ($28/class) | 10 classes, 6-month expiry |
| Unlimited Monthly | $199/month | Unlimited classes |
| Unlimited Annual | $179/month | 12-month commitment |
| Private 4-Pack | $380 ($95/class) | 4 private sessions |

### Inventory (15 items)

Equipment (7): Balanced Body Reformer ×20, Cadillac ×2, Wunda Chair ×4, Ladder Barrel ×2, TRX ×10, Jump Board ×8
Props (4): Pilates Mat ×30, Resistance Bands ×20, Magic Circle ×15, Foam Roller ×12
Retail (3): Grip Socks LOC-1 ×45, Water Bottle ×20, Grip Socks LOC-2 ×3
Parts (1): Reformer Springs ×6

### Body Scanner Demo Data

- **STYKU**: 8 clients × 2-3 scans each. Progressive improvement: body fat -1.2%/scan, waist -1.2cm, posture score +5pts
- **InBody**: 8 clients × 2-3 scans each. Progressive improvement: SMM +0.4kg, body fat -0.9kg, InBody score +3pts

## Feature Details

### Onboarding (NEW)

4-screen swipeable first-launch intro:
1. **Welcome** — CSS-only spine illustration (12 vertebrae, ribcage arcs), studio philosophy
2. **Your Practice** — Goals (5 checkboxes), experience level (3 options), injuries text
3. **Find Your Flow** — Class types (5 chips), time preference, class length
4. **You're Ready** — Summary card, "Enter Studio" CTA

Touch swipe support (40px threshold). Progress bar + dot indicators. Skip button. Saves to `rp_onboarding_profile`.

### Home — Daily Studio (NEW)

Client-facing home with real-time data:
1. **"Next Up" Hero Card** — Dynamic CTA: "Check In" (within 30min), "View Booking" (booked), "Find Your First Class" (empty)
2. **Streak Widget** — Weekly class count, Mon-Sun day dots, personal best tracker
3. **3 Carousels** — "Reformer Basics", "Recovery & Stretch", "Staff Picks" with scroll snap
4. **Quick Actions** — Book, Schedule, Progress, Membership
5. **Your Studio Card** — Address, hours, directions link, call button

### BookOnline — Calendar Strip (NEW)

- 14-day horizontal scrollable date strip with scroll snap
- Dot indicators for days with classes
- Instructor avatar circles with `getAvatarGradient()`
- Difficulty pills (sage/clay/rose)
- Spots remaining indicator
- Section header with formatted date + class count

### Portal — Progress & Gamification (NEW)

- SVG progress ring (weekly goal of 3 classes)
- Streak dots (Mon-Sun)
- Total classes, minutes, favorite instructor/category stats
- 5 milestone badges: Getting Started (5), Finding My Flow (10), Dedicated (25), Committed (50), Century Club (100)
- CSS glow pulse on most recently unlocked badge
- "Recommended For You" carousel based on booking history
- 2×2 quick actions grid

### Charts — Session Notes

Muscle body map with 25 clickable dots (front/back SVG), 3 states (strong/working/needs attention). Session notes: class type, instructor, observations, spring settings, exercises. Flexibility sliders (1-10), strength benchmarks. Progress sparklines.

### Body Intelligence Suite (10 pages)

1. **Posture AI** — Real MediaPipe PoseLandmarker (33-point skeleton). Camera guidelines, angle calculations, assessment history.
2. **Posture Time-lapse** — Animated skeleton playback. Ghost overlay (day-one red vs current accent).
3. **Movement Rx** — Rule-based prescription engine. Weighted scoring → 4-week progressive plan.
4. **AI Intake** — 3-step form → simulated AI generation → deterministic plan with 10 condition mappings.
5. **Fatigue Tracker** — 10 muscle groups, intensity multipliers, 72hr rolling window. Fresh/recovering/loaded/overloaded.
6. **Spring Engine** — Per-client reformer spring recommendations. 6 exercises. Red/Blue/Green/Yellow springs. iPad mode.
7. **Class Sequencer** — Exercise flow generator. Voice-Guided Mode (Web Speech API). Countdown timer.
8. **Wearables Hub** — Simulated device integration. Recovery score formula. 7-day SparkBars.
9. **Body Composition Lab** — STYKU 3D + InBody combined view. Posture analysis, circumference grid, segmental charts.
10. **AR Reformer Simulator** — SVG reformer visualization. Animated guides. Session history.

### Retention & Growth (5 pages)

1. **Retention Brain** — 6-factor churn prediction (recency 30%, frequency 25%, cancellations 15%, variety 10%, expiry 10%, progress 10%).
2. **Cohort Analysis** — Retention heatmap, 3 A/B experiments, churn waterfall, risk donut, linear regression trends.
3. **Referral Engine** — Engagement scoring (frequency 35, consistency 30, tenure 20, variety 15). Advocates = 75+. Funnel viz.
4. **Challenges** — Points (10pts/class, streak bonuses). 12 badges. Bronze/Silver/Gold/Platinum levels.
5. **Recovery Texts** — Auto-SMS templates per class type. Fatigue-aware modifier. Twilio placeholder.

### Studio Tech (7 pages)

1. **Instructor Dashboard** — Fill rate, rebook rate, revenue attribution, class mix.
2. **Instructor Tipping** — Gratuity system.
3. **Voice Clone** — 24 calibration phrases. 4 voice styles. SpeechSynthesis demo.
4. **Virtual Studio** — 8 virtual + 8 on-demand classes. Join simulation overlay.
5. **AI Front Desk** — Keyword-matching chatbot querying localStorage.
6. **Smart Inventory** — Linear regression forecast. Equipment wear-rate modeling.
7. **Live Dashboard** — Real-time studio metrics.
8. **Voice AI** — AI phone receptionist concept.

## What's Real vs Mock

### Real / Connected
- Hybrid localStorage + AWS API data layer (DynamoDB, Lambda, Cognito)
- Capacitor native iOS/Android app (TestFlight distribution)
- Client data with visit history, membership tiers, spend tracking
- Appointment booking system with instructor/service/location assignments
- Class package progression tracking
- Inventory management with adjustment logs
- Posture AI with real MediaPipe ML (runs in browser, no server)
- Posture Time-lapse reads actual stored landmark data
- All Intelligence suite algorithms (churn prediction, cohort analysis, etc.) computed from real data
- STYKU + InBody API clients (demo data when no API keys configured)
- Theme system persists across sessions
- Command palette (Cmd+K) for admin navigation
- Onboarding profile saves and gates first visit
- Home page streak/progress computed from real appointment history
- Portal milestones computed from real booking data
- Class Sequencer voice-guided mode (Web Speech API)

### Mock / Placeholder
- Payment processing (no real payments)
- Email/SMS sending (stores locally, doesn't send)
- Social media publishing (mock OAuth, simulated publish)
- Authentication in demo mode (localStorage flags, no real auth)
- Help chat (keyword matching, no LLM)
- PWA service worker (minimal caching)
- Voice Clone (browser speech synthesis — ElevenLabs in production)
- Recovery Text Twilio integration (placeholder)
- Referral link tracking (generated links, no real tracking)
- Wearable device connections (simulated data)
- AR Reformer (concept UI, no actual AR/camera)
- Virtual Studio Zoom integration (simulated join)

## AWS Infrastructure

| Component | Details |
|-----------|---------|
| AWS Account | `092016234733` (us-west-2) |
| API Gateway | HTTP API v2, 95+ routes |
| Lambda | 28 functions, Node.js 20.x, arm64, 256MB, 30s timeout |
| DynamoDB | 30 tables, PAY_PER_REQUEST, prefix `pilates-` |
| S3 | `pilates-uploads-092016234733` (client photos/docs) |
| Cognito | Pool `us-west-2_Y0gGN3ZqQ`, Client `2mur2u917rd7tvcgg267hrlof7`, 5 groups |
| IaC | Terraform in `terraform/` (8 files), CDK in `backend/` |

## Layout Details

### Sidebar
- Expanded: 240px, Collapsed: 68px (desktop), Mobile: 260px slide-over
- Background: `#111111`, Active item: `{accent}30` bg, Inactive: `#AAAAAA`
- Section labels: `#888888`, JetBrains Mono 10px
- Bottom: Brand Color picker, Sign Out, collapse toggle
- Role defaults to `owner` in demo mode

### Topbar
- Sticky, `rgba(245,243,240,0.6)` with `blur(20px)`
- Hamburger (mobile only, >860px hidden), Cmd+K button, date, NotificationBell, "← Home"
- `?embed` query param hides NotificationBell, Home button, CommandPalette, HelpChat

## Responsive Breakpoints

- `860px` — Mobile hamburger menu, sidebar hides
- `768px` — Compact content padding (12px), topbar 46px, grids collapse
- `480px` — Smallest mobile adjustments, single column

## Performance

- All 63 pages lazy loaded via `React.lazy()` + `Suspense`
- Code split per page (each is a separate chunk)
- MediaPipe model loaded on demand (~4MB, cached by browser)
- Main bundle: ~551KB (158KB gzipped)
- PostureAI: ~188KB chunk (52KB gzipped)

## Page Count Summary

| Category | Count |
|----------|-------|
| Public + Onboarding | 7 |
| Portal | 1 |
| Core Admin | 24 |
| Body Intelligence | 10 |
| Retention & Growth | 5 |
| Studio Tech | 8 |
| Intelligence | 3 |
| Staff | 2 |
| System | 3 |
| **Total** | **63** |
