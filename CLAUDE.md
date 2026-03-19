# Pilates & Barre — Studio Management Platform

> Pilates & Barre studio management platform for Pilates & Barre (3 Arizona locations).
> Founded by Kelly Snailum in 2008. This is a full admin + client-facing demo with Body Intelligence AI features.

## Tech Stack

- **Framework**: React 19 + React Router DOM 7.13.1 + Vite (latest)
- **Hosting**: Vercel (SPA routing via `vercel.json` rewrites)
- **Deploy URL**: https://pilates-web.vercel.app
- **Styling**: CSS-in-JS via `theme.jsx` (useStyles hook) + inline styles
- **State**: React hooks (useState, useCallback, useMemo, useContext) + localStorage
- **Persistence**: All data in localStorage — no backend, no database, no API
- **ML**: @mediapipe/tasks-vision (PoseLandmarker for real-time pose detection)
- **Voice**: Web Speech API (SpeechSynthesisUtterance for voice-guided features)
- **Theme**: Dynamic brand color system with 8 presets + custom color picker
- **Build**: `npm run build` → Vite production build → `dist/`
- **PWA**: Service worker (`public/sw.js`), install prompt, offline page

### Commands

```bash
npm run dev      # Dev server (Vite)
npm run build    # Production build
npm run preview  # Preview production build
npm run lint     # ESLint
```

## Project Structure

```
src/
├── main.jsx                    # Entry point (BrowserRouter, SW registration)
├── App.jsx                     # Root component, routes, lazy loading, initStore()
├── theme.jsx                   # ThemeProvider, useTheme, useStyles, PRESETS, avatar gradients
├── data/
│   └── store.js                # Central localStorage store (CRUD for everything, seed data)
├── components/
│   ├── Layout.jsx              # Admin shell: dark sidebar, topbar, command palette, theme picker
│   ├── CommandPalette.jsx      # Cmd+K search overlay for admin navigation
│   ├── HelpChat.jsx            # Floating help chat assistant
│   ├── NotificationBell.jsx    # Admin notification dropdown
│   └── CheckoutDrawer.jsx      # Slide-out checkout drawer
├── pages/
│   ├── Home.jsx                # Public landing page
│   ├── Portal.jsx              # Client portal
│   ├── BookOnline.jsx          # Online booking page
│   ├── Pricing.jsx             # Pricing page
│   ├── Team.jsx                # Public team/instructors page
│   ├── Dashboard.jsx           # Admin dashboard with KPIs
│   ├── CheckIn.jsx             # Client check-in system
│   ├── Patients.jsx            # Client management (CRM)
│   ├── Schedule.jsx            # Class schedule / calendar
│   ├── Treatments.jsx          # Class packages
│   ├── Charts.jsx              # Progress tracking
│   ├── BeforeAfter.jsx         # Transformation photos
│   ├── Waivers.jsx             # Digital waivers
│   ├── Memberships.jsx         # Membership management
│   ├── Wallet.jsx              # Client wallet / credits
│   ├── Referrals.jsx           # Referral program
│   ├── Inventory.jsx           # Equipment & retail inventory
│   ├── Retention.jsx           # Basic retention alerts
│   ├── Aftercare.jsx           # Recovery tips
│   ├── Waitlist.jsx            # Class waitlist
│   ├── Reviews.jsx             # Review management
│   ├── Inbox.jsx               # DM inbox
│   ├── Email.jsx               # Email campaigns
│   ├── TextMessages.jsx        # SMS campaigns
│   ├── SocialMedia.jsx         # Social media management
│   ├── Reports.jsx             # Analytics & reports
│   ├── Training.jsx            # Teacher training pipeline (PSC 450+ hours)
│   ├── Settings.jsx            # Studio settings
│   │
│   │── # ── Body Intelligence Suite ──
│   ├── PostureAI.jsx           # ML-powered posture assessment (MediaPipe)
│   ├── PostureTimelapse.jsx    # Skeletal alignment transformation reel over time
│   ├── MovementRx.jsx          # Movement prescription engine
│   ├── AIIntake.jsx            # AI intake form → auto-generated 4-week Movement Rx plan
│   ├── FatigueTracker.jsx      # Muscle fatigue tracking
│   ├── SpringEngine.jsx        # Reformer spring recommendation engine per client
│   ├── ClassSequencer.jsx      # Exercise flow generator with voice-guided teaching cues
│   ├── WearablesHub.jsx        # Simulated Apple Watch/Fitbit/Garmin wearable integration
│   ├── ARSimulator.jsx         # AR reformer simulator concept demo
│   │
│   │── # ── Retention & Growth ──
│   ├── RetentionBrain.jsx      # Churn prediction scoring (weighted 6-factor model)
│   ├── CohortAnalysis.jsx      # Cohort retention heatmap + A/B intervention experiments
│   ├── ReferralEngine.jsx      # Referral virality loop + advocate identification
│   ├── Challenges.jsx          # Gamified client challenges, badges, leaderboard
│   ├── RecoveryText.jsx        # Post-class recovery SMS system (Twilio-ready)
│   │
│   │── # ── Studio Tech ──
│   ├── InstructorDashboard.jsx # Per-instructor performance metrics
│   ├── VoiceClone.jsx          # Instructor voice clone for on-demand class generation
│   ├── VirtualStudio.jsx       # Hybrid live/virtual class system + on-demand library
│   ├── AIFrontDesk.jsx         # AI front desk chatbot (keyword-matching + store queries)
│   ├── SmartInventory.jsx      # Predictive inventory with linear regression forecasting
│   │
│   │── # ── Staff ──
│   └── TraineePortal.jsx       # Teacher training client portal (trainee-facing dashboard)
```

## Routes

| Route | Component | Description |
|-------|-----------|-------------|
| `/` | Home | Public landing page |
| `/portal` | Portal | Client portal |
| `/book` | BookOnline | Online booking |
| `/pricing` | Pricing | Pricing page |
| `/team` | Team | Public instructor profiles |
| `/admin` | Dashboard | Admin dashboard with KPIs |
| `/admin/checkin` | CheckIn | Client check-in |
| `/admin/clients` | Patients | Client CRM |
| `/admin/schedule` | Schedule | Class calendar |
| `/admin/sessions` | Treatments | Class packages |
| `/admin/charts` | Charts | Progress tracking |
| `/admin/photos` | BeforeAfter | Transformation photos |
| `/admin/waivers` | Waivers | Digital waivers |
| `/admin/memberships` | Memberships | Membership management |
| `/admin/wallet` | Wallet | Client credits |
| `/admin/referrals` | Referrals | Referral program |
| `/admin/inventory` | Inventory | Equipment & retail stock |
| `/admin/retention` | Retention | Basic retention alerts |
| `/admin/recovery-tips` | Aftercare | Recovery tips |
| `/admin/waitlist` | Waitlist | Class waitlist |
| `/admin/reviews` | Reviews | Review management |
| `/admin/inbox` | Inbox | DM inbox |
| `/admin/email` | Email | Email campaigns |
| `/admin/texts` | TextMessages | SMS campaigns |
| `/admin/social` | SocialMedia | Social media |
| `/admin/reports` | Reports | Analytics |
| `/admin/training` | Training | Teacher training pipeline |
| `/admin/posture` | PostureAI | ML posture assessment |
| `/admin/posture-timelapse` | PostureTimelapse | Posture transformation reel |
| `/admin/movement-rx` | MovementRx | Movement prescriptions |
| `/admin/ai-intake` | AIIntake | AI intake → auto Movement Rx plan |
| `/admin/fatigue` | FatigueTracker | Muscle fatigue tracker |
| `/admin/spring-engine` | SpringEngine | Reformer spring recommendations |
| `/admin/sequencer` | ClassSequencer | Voice-guided class flow generator |
| `/admin/wearables` | WearablesHub | Wearable device integration |
| `/admin/ar-simulator` | ARSimulator | AR reformer simulator |
| `/admin/retention-brain` | RetentionBrain | Churn prediction AI |
| `/admin/cohort-analysis` | CohortAnalysis | Cohort retention + A/B experiments |
| `/admin/referral-engine` | ReferralEngine | Referral virality + advocate scoring |
| `/admin/challenges` | Challenges | Gamified challenges & leaderboard |
| `/admin/recovery-text` | RecoveryText | Post-class recovery SMS |
| `/admin/instructors` | InstructorDashboard | Instructor metrics |
| `/admin/voice-clone` | VoiceClone | Instructor voice clone studio |
| `/admin/virtual-studio` | VirtualStudio | Hybrid live/virtual classes |
| `/admin/ai-front-desk` | AIFrontDesk | AI chatbot front desk |
| `/admin/smart-inventory` | SmartInventory | Predictive inventory forecasting |
| `/admin/trainee-portal` | TraineePortal | Trainee-facing progress dashboard |
| `/admin/settings` | Settings | Studio settings |

## Admin Sidebar Sections

| Section | Pages |
|---------|-------|
| Overview | Dashboard, Check-In |
| Clients | Clients, Schedule, Class Packages, Progress Tracking, Transformations, Waivers, Recovery Tips |
| Billing | Memberships, Client Wallet, Referrals |
| Operations | Inventory, Retention, Waitlist, Reviews |
| Marketing | DM Inbox, Email, Text Messages, Social Media |
| Body Intelligence | Posture AI, Posture Time-lapse, Movement Rx, AI Intake → Rx, Fatigue Tracker, Spring Engine, Class Sequencer, Wearables Hub, AR Reformer |
| Retention & Growth | Retention Brain, Cohort Analysis, Referral Engine, Challenges, Recovery Texts |
| Studio Tech | Instructor Metrics, Voice Clone, Virtual Studio, AI Front Desk, Smart Inventory |
| Staff | Teacher Training, Trainee Portal |
| Reporting | Reports |
| System | Settings |

## localStorage Keys

### Store Data (managed by `store.js`)

| Key | Type | Seeded | Description |
|-----|------|--------|-------------|
| `rp_clients` | Array | 30 clients | Client records with name, email, membership, visit history |
| `rp_appointments` | Array | ~150 appts | Class bookings (past 7 + next 14 days) |
| `rp_class_packages` | Array | 8 packages | Treatment plans / class packages |
| `rp_instructors` | Array | 6 instructors | Instructor profiles with bios, certs, specialties |
| `rp_services` | Array | 15 services | Class/service catalog with pricing |
| `rp_locations` | Array | 3 locations | Studio locations (Scottsdale, Arcadia, North Central) |
| `rp_inventory` | Array | 15 items | Equipment, props, retail, parts |
| `rp_retention_alerts` | Array | Auto-generated | Retention alerts for lapsed clients (>80 days) |
| `rp_emails` | Array | 5 emails | Sent email campaigns |
| `rp_texts` | Array | 5 messages | Sent SMS campaigns |
| `rp_social_posts` | Array | 5 posts | Social media posts (draft/scheduled/published) |
| `rp_social_connections` | Object | Yes | Mock social platform connections |
| `rp_checkins` | Array | Up to 5 | Today's class check-ins |
| `rp_photos` | Array | Empty | Progress/transformation photos |
| `rp_trainees` | Array | 4 trainees | Teacher training pipeline (PSC program) |
| `rp_posture_assessments` | Array | Empty | Posture AI assessment results (includes landmark data) |
| `rp_prescriptions` | Array | Empty | Movement Rx prescriptions |
| `rp_bookings` | Array | Empty | Fatigue tracker class bookings |
| `rp_settings` | Object | Yes | Business name, tagline, contact info |

### UI State

| Key | Type | Description |
|-----|------|-------------|
| `rp_initialized` | Boolean | Whether seed data has been initialized |
| `rp_theme` | Object | Selected theme preset (id, name, accent, accentLight, accentText) |

## Design System

### Theme System

Dynamic brand color with 8 presets + custom hex input. Stored in `rp_theme` localStorage key.

| Preset | Accent | Light BG |
|--------|--------|----------|
| Clay (default) | `#C4704B` | `#FDF5F0` |
| Eucalyptus | `#6B8F71` | `#F0F5F1` |
| Blush | `#C47B8E` | `#FDF2F5` |
| Storm | `#5B7B8F` | `#F0F4F7` |
| Linen | `#A68B6B` | `#F9F5F0` |
| Dusk | `#8B6B94` | `#F5F0F7` |
| Ember | `#B85C38` | `#FDF0EA` |
| Charcoal | `#3D3D3D` | `#F5F5F5` |

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
Sidebar:        #111111 (dark)
Sidebar muted:  #888888
```

### Fonts (Google Fonts)

| Font | Variable | Usage |
|------|----------|-------|
| Outfit | `s.FONT` | Body text, UI elements, buttons |
| Playfair Display | `s.DISPLAY` | Headlines, page titles |
| JetBrains Mono | `s.MONO` | Labels, metadata, monospace elements |
| Inter | — | Sidebar, admin chrome |

### Style Helpers (from `useStyles()`)

| Key | Description |
|-----|-------------|
| `s.pill` | Base pill button (borderRadius: 100) |
| `s.pillAccent` | Accent-colored pill button with shadow |
| `s.pillOutline` | Outline pill with accent border |
| `s.pillGhost` | Ghost pill with subtle background |
| `s.input` | Standard input field styling |
| `s.label` | JetBrains Mono 10px uppercase label |
| `s.cardStyle` | Glass morphism card (blur, border, shadow) |
| `s.tableWrap` | Table container with glass morphism |

### Card Pattern

All admin cards use glass morphism:
```js
background: 'rgba(255,255,255,0.72)',
backdropFilter: 'blur(20px)',
border: '1px solid rgba(255,255,255,0.6)',
borderRadius: 16,
boxShadow: '0 4px 24px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)',
```

## Data Flow

### Store Pattern

```
initStore() called in App.jsx (module level)
    ↓
Seeds localStorage with 30 clients, 150 appointments, 6 instructors,
15 services, 3 locations, 8 packages, 15 inventory items, etc.
    ↓
seedIfEmpty() runs every load to fill gaps (emails, texts, social, checkins)
    ↓
Pages read/write via store.js CRUD functions (getX, addX, updateX, deleteX)
    ↓
subscribe() / notify() pattern for cross-component reactivity
```

## Feature Details

### Body Intelligence Suite (9 pages)

1. **Posture AI** (`PostureAI.jsx`) — Real MediaPipe PoseLandmarker for 33-point skeleton detection. Camera guidelines, real-time validation, angle calculations (head alignment, shoulder balance, spinal alignment, hip level, pelvic tilt, knee tracking). Assessment history with before/after. Stores landmark data in `rp_posture_assessments`.

2. **Posture Time-lapse** (`PostureTimelapse.jsx`) — Reads stored skeletal landmark data from posture assessments. Generates synthetic 6-month history for demo clients. Plays back alignment transformation as animated skeleton overlays on dark viewfinder. Ghost overlay shows day-one skeleton (red) vs current (accent). Per-metric trend bars, score-over-time area chart. Export/print buttons. Clients share these obsessively.

3. **Movement Rx** (`MovementRx.jsx`) — Rule-based prescription engine. Intake form (injuries, goals, lifestyle, experience). Weighted scoring → class type recommendations → 4-week progressive plan with clinical notes.

4. **AI Intake → Auto Movement Rx** (`AIIntake.jsx`) — 3-step intake form (Profile → Health History → Preferences). Simulated AI generation phase (~6s with animated progress). Deterministic `generatePlan()` function (~130 lines) maps 10 conditions to contraindications/alternatives, selects instructors by specialty, progresses intensity across 4 weeks. Outputs clinical assessment, weekly plan cards, contraindication alerts, home practice, recommended package. "Save Client & Plan" calls `addPatient()`.

5. **Fatigue Tracker** (`FatigueTracker.jsx`) — Muscle fatigue model with 10 muscle groups, intensity multipliers, 72hr rolling window. Tracks per-client load with fresh/recovering/loaded/overloaded status. "Safe to Book Next" recommendations.

6. **Spring Recommendation Engine** (`SpringEngine.jsx`) — Per-client reformer spring recommendations for 6 exercises (Footwork, Leg Circles, Short Box, Long Stretch, Elephant, Knee Stretches). Factors: fatigue score, injury history, age, experience level. Compact iPad mode for on-the-reformer use. Spring color system: Red (5.5 lbs), Blue (3.5 lbs), Green (2.5 lbs), Yellow (1 lb). Special rules for prenatal and post-rehab clients.

7. **Class Sequencer** (`ClassSequencer.jsx`) — Exercise flow generator for 8 class types with curated libraries. Warm-up/main/cool-down phases. Focus area targeting. Contraindication filtering. Level-adjusted reps. **Voice-Guided Mode**: Web Speech API reads exercise names, spring settings, reps, and teaching cues aloud. Countdown timer auto-advances exercises with "10 seconds remaining" spoken warning. Click any card during voice mode to jump narration.

8. **Wearables Hub** (`WearablesHub.jsx`) — Simulated Apple Watch/Fitbit/Garmin/WHOOP/Oura integration. Recovery score formula: `(HRV/65 × 35) + ((80-RHR)/30 × 30) + (sleep/8 × 35)`. 7-day SparkBar charts highlight class days. Pilates Effort Score. Recommendation engine (green/yellow/red readiness).

9. **AR Reformer Simulator** (`ARSimulator.jsx`) — Conceptual AR demo with SVG reformer visualization (rails, carriage, springs, footbar). Animated alignment guides, form analysis panel (alignment score, L/R symmetry, tempo, core engagement), 6-exercise library, session history, device setup guide. CSS keyframe animations (arScan, guideFlicker, springOscillate, coreGlow).

### Retention & Growth (5 pages)

1. **Retention Brain** (`RetentionBrain.jsx`) — Churn prediction scoring (0-100). Weighted factors: recency (30%), booking frequency trend (25%), cancellation rate (15%), class variety (10%), package expiry (10%), posture progress (10%). Risk levels: Critical (70+), High Risk (50-69), Watch (30-49), Healthy (0-29). Context-specific suggested interventions. Studio health trend (8-week chart).

2. **Cohort Analysis** (`CohortAnalysis.jsx`) — Retention heatmap by signup month (M+0 through M+6). 3 simulated A/B intervention experiments (Welcome Back discount, personal outreach vs email, free guest pass vs loyalty points) with conversion rates, lift %, confidence indicators (z-score approximation). Churn waterfall chart (Starting → New → Reactivated → Churned → Current). Risk segment donut. Predictive engagement timeline with linear regression trend lines.

3. **Referral Virality Loop** (`ReferralEngine.jsx`) — Engagement scoring: frequency (35pts), consistency (30pts), tenure (20pts), variety (15pts). Clients 75+ = Advocates. Unique referral links (`pilates.link/ref/XX-1234`). 3 auto-trigger nudge templates (Milestone, Streak, Post-Class High). Full funnel visualization (Shared → Clicked → Booked → Attended → Converted). Leaderboard with reward tiers (Bronze/Silver/Gold). Location breakdown.

4. **Gamified Challenges** (`Challenges.jsx`) — Points system (10pts/class, streak bonuses: 3-day=25, 5-day=50, 7-day=100). 12 unlockable badges with condition functions. 4 studio challenges with progress tracking. Bronze/Silver/Gold/Platinum leveling (0/200/500/1000 pts). Podium layout for top 3 on leaderboard.

5. **Post-Class Recovery Texts** (`RecoveryText.jsx`) — Auto-SMS 20 min after class with 2-3 recovery movements per class type. Templates for all 8 class types. Fatigue-aware modifier for high-frequency clients. Phone mockup preview (iPhone SMS bubbles). Template editor with character/segment counter. Automation settings (delay, quiet hours, frequency cap). Twilio integration placeholder. Analytics (daily send chart, response rate, opt-out tracking).

### Studio Tech (5 pages)

1. **Instructor Dashboard** (`InstructorDashboard.jsx`) — Per-instructor: fill rate, rebook rate (14-day window), revenue attribution, class mix, weekly trend, avg improvement. Studio-wide KPI rollups. DonutChart and MiniBar SVG components.

2. **Voice Clone Studio** (`VoiceClone.jsx`) — Record 24 calibration phrases from an instructor (~3 min). 4 voice styles (Calm, Energetic, Precise, Warm). Simulated voice model training with progress ring. Generate full class audio from any Class Sequencer template. Waveform visualizations. Sample cue library with browser SpeechSynthesis playback. ElevenLabs integration note for production. Library tab for generated classes.

3. **Virtual Studio** (`VirtualStudio.jsx`) — 8 virtual classes (live, on-demand, series, workshop formats). 8 on-demand library entries with views/ratings. Enrollment capacity bars. Join simulation overlay (fullscreen dark modal). Analytics tab with revenue-by-format bars. Posture AI overlay concept card.

4. **AI Front Desk** (`AIFrontDesk.jsx`) — Keyword-matching chatbot querying localStorage for client lookup, availability, instructor info, pricing, hours, cancellation policy, membership info, studio stats. 6 quick-action presets. Chat UI with typing indicator and auto-scroll. 400-1000ms simulated response delay.

5. **Smart Inventory** (`SmartInventory.jsx`) — Linear regression on 8-week appointment volumes to forecast next 4 weeks. Equipment wear-rate modeling: Equipment (3yr lifespan), Props (1yr), Retail (sales-based), Parts (6mo). Alert system: critical/soon/ok urgency. MiniChart SVG with solid history + dashed forecast bars.

### Staff (2 pages)

1. **Teacher Training** (`Training.jsx`) — Admin-facing PSC 450+ hour certification tracking. 4 trainees at various stages. 9 modules. Hour logging. Exam scores. Mentor assignment.

2. **Trainee Portal** (`TraineePortal.jsx`) — Trainee-facing dashboard with: certification progress ring, module timeline (completed/in-progress/locked with prerequisites), hours log with mentor verification, exam center with score breakdowns (written/practical/teaching demo), mentor connection card with contextual feedback. Confetti celebration on milestones. 5 tabs (Dashboard, Modules, Hours Log, Exam Center, Mentor).

## Locations

| Location | Address | Phone |
|----------|---------|-------|
| Scottsdale | 6949 E Shea Blvd, Scottsdale, AZ 85254 | (480) 699-8160 |
| Arcadia | 3629 E Indian School Rd, Phoenix, AZ 85018 | (602) 237-6489 |
| North Central | 5555 N 7th St, Suite 120, Phoenix, AZ 85014 | (602) 555-0300 |

## Instructors (Seeded)

| ID | Name | Title | Color | Specialties |
|----|------|-------|-------|-------------|
| INS-1 | Kelly Snailum | Owner & Master Trainer | #C4704B | Reformer, Mat, Barre, Private, Teacher Training, TRX |
| INS-2 | Megan Torres | Lead Reformer Instructor | #6B8F71 | Reformer, Reformer + Cardio, Private, Prenatal |
| INS-3 | Danielle Park | Barre & TRX Specialist | #8B6B94 | Barre, TRX Fusion, Barre Burn, Group Apparatus |
| INS-4 | Rachel Kim | Pilates Instructor | #5B7B8F | Mat, Reformer, Stretch & Restore, Youth |
| INS-5 | Ava Mitchell | Pilates Instructor | #A68B6B | Reformer, Mat, Barre, Private |
| INS-6 | Jordan Reeves | Teacher Training Lead | #B85C38 | Teacher Training, Reformer, Group Apparatus, Mat |

## Services / Classes (15)

| Category | Classes |
|----------|---------|
| Pilates | Reformer ($38), Mat ($28), Reformer + Cardio ($40), Group Apparatus ($42) |
| Barre | Barre ($32), Barre Burn ($32) |
| TRX | TRX Fusion ($35) |
| Wellness | Stretch & Restore ($25) |
| Private | Private Training ($95), Semi-Private ($65/person) |
| Specialty | Prenatal ($35), Youth Conditioning ($30) |
| Intro | Intro to Reformer (free), Virtual Consultation (free) |
| Training | Teacher Training Program (see pricing) |

Prices stored in cents (e.g., 3800 = $38.00).

## What's Real vs Mock

### Real / Connected
- Client data with visit history, membership tiers, spend tracking
- Appointment booking system with instructor/service/location assignments
- Class package progression tracking
- Inventory management with adjustment logs
- Retention alerts auto-generated from client visit patterns
- Posture AI with real MediaPipe ML (runs in browser, no server)
- Posture Time-lapse reads actual stored landmark data from assessments
- Movement Rx rule engine (real scoring algorithm)
- AI Intake generates personalized plans based on actual store data (instructors, services, prices)
- Fatigue tracker muscle load model
- Spring Engine computes recommendations from real client injury/fatigue/appointment data
- Retention Brain churn prediction (real weighted scoring)
- Cohort Analysis retention heatmap computed from real appointment data
- Referral Engine engagement scoring from real appointment frequency/consistency
- Instructor metrics computed from appointment data
- Class Sequencer with curated exercise libraries + voice-guided mode (Web Speech API)
- Voice Clone uses browser SpeechSynthesis for demo playback
- Recovery Text generates messages from real appointment/service data
- Challenges points/badges computed from real appointment history
- Smart Inventory forecasting from real appointment volume data
- Teacher training pipeline with module/hour/exam tracking
- Trainee Portal reads trainee data from store
- Theme system persists across sessions
- Command palette (Cmd+K) for admin navigation

### Mock / Placeholder
- Payment processing (no real payments)
- Email/SMS sending (stores locally, doesn't actually send)
- Social media publishing (mock OAuth, simulated publish)
- Online booking (no real booking backend)
- Authentication (no real auth — localStorage flags)
- Help chat (keyword matching, no AI)
- PWA service worker (minimal caching)
- Voice Clone (browser speech synthesis — ElevenLabs in production)
- Recovery Text Twilio integration (placeholder fields, simulated send)
- Referral link tracking (generated links, no real tracking)
- Wearable device connections (simulated data, no real device APIs)
- AR Reformer (concept UI, no actual AR/camera)
- Virtual Studio Zoom integration (simulated join overlay)
- AI Front Desk (keyword matching, no LLM API)

## Responsive Breakpoints

- `860px` — Mobile hamburger menu, sidebar hides
- `768px` — Compact content padding (14px 12px), topbar 46px, hide date/dividers

## Performance Features

- All 40+ admin pages lazy loaded via `React.lazy()` + `Suspense`
- Code split per page (each is a separate chunk)
- MediaPipe model loaded on demand (~4MB, cached by browser)
- PostureAI: ~182KB chunk (50KB gzipped) including MediaPipe JS SDK
- Main bundle: ~328KB (99KB gzipped)
- Total: 51 page chunks, all individually code-split

## Page Count Summary

| Category | Count | Pages |
|----------|-------|-------|
| Public | 5 | Home, Portal, Book Online, Pricing, Team |
| Core Admin | 20 | Dashboard, Check-In, Clients, Schedule, Packages, Charts, Photos, Waivers, Memberships, Wallet, Referrals, Inventory, Retention, Recovery Tips, Waitlist, Reviews, Inbox, Email, Texts, Social |
| Body Intelligence | 9 | Posture AI, Posture Time-lapse, Movement Rx, AI Intake, Fatigue, Spring Engine, Sequencer, Wearables, AR Simulator |
| Retention & Growth | 5 | Retention Brain, Cohort Analysis, Referral Engine, Challenges, Recovery Texts |
| Studio Tech | 5 | Instructor Metrics, Voice Clone, Virtual Studio, AI Front Desk, Smart Inventory |
| Staff | 2 | Teacher Training, Trainee Portal |
| System | 2 | Reports, Settings |
| **Total** | **48** | |
