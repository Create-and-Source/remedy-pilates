# Pilates & Barre

> Full-stack studio management platform — 55 pages across client-facing booking, member portal, and admin dashboard.

Built with React 18 + React Router DOM + Vite. All data persisted in localStorage (no backend required).

## Quick Start

```bash
npm install
npm run dev      # Dev server (Vite)
npm run build    # Production build
npm run preview  # Preview production build
```

## Routes — 55 Pages

### Public (6 pages, no sidebar)

| Route | Component | Description |
|-------|-----------|-------------|
| `/` | Home | Landing page with hero, KPIs, class preview |
| `/portal` | Portal | Client portal dashboard |
| `/book` | BookOnline | Online class booking |
| `/book/free-trial` | FreeTrialFlow | 4-step free trial booking wizard |
| `/pricing` | Pricing | Membership pricing tiers |
| `/team` | Team | Instructor profiles |

### Admin (49 pages, sidebar layout at `/admin/*`)

#### Core

| Route | Component | Description |
|-------|-----------|-------------|
| `/admin` | Dashboard | KPIs, sparklines, quick actions |
| `/admin/checkin` | CheckIn | Class check-in kiosk |
| `/admin/clients` | Patients | Client roster + profiles |
| `/admin/schedule` | Schedule | Weekly class calendar |
| `/admin/sessions` | Treatments | Session types + pricing |
| `/admin/settings` | Settings | Studio configuration |

#### Client Management

| Route | Component | Description |
|-------|-----------|-------------|
| `/admin/charts` | Charts | Client progress charts |
| `/admin/photos` | BeforeAfter | Before/after progress photos |
| `/admin/waivers` | Waivers | Digital waiver management |
| `/admin/memberships` | Memberships | Membership plan management |
| `/admin/wallet` | Wallet | Client credit/package balances |
| `/admin/referrals` | Referrals | Referral tracking |
| `/admin/retention` | Retention | Client retention alerts |
| `/admin/recovery-tips` | RecoveryTips | Post-class recovery content |
| `/admin/waitlist` | Waitlist | Class waitlist management |
| `/admin/reviews` | Reviews | Client review management |

#### Communication

| Route | Component | Description |
|-------|-----------|-------------|
| `/admin/inbox` | Inbox | DM inbox |
| `/admin/email` | Email | Email campaign composer |
| `/admin/texts` | TextMessages | SMS messaging |
| `/admin/social` | SocialMedia | Social media scheduler |

#### Operations

| Route | Component | Description |
|-------|-----------|-------------|
| `/admin/inventory` | Inventory | Product inventory |
| `/admin/reports` | Reports | Analytics + CSV export |
| `/admin/training` | Training | Staff training modules |

#### AI & Smart Features

| Route | Component | Description |
|-------|-----------|-------------|
| `/admin/posture` | PostureAI | AI posture analysis |
| `/admin/movement-rx` | MovementRx | AI movement prescriptions |
| `/admin/fatigue` | FatigueTracker | Client fatigue monitoring |
| `/admin/retention-brain` | RetentionBrain | AI retention predictions |
| `/admin/ai-front-desk` | AIFrontDesk | AI receptionist |
| `/admin/ai-intake` | AIIntake | AI client intake forms |
| `/admin/voice-ai` | VoiceAI | Voice AI assistant |
| `/admin/voice-clone` | VoiceClone | Instructor voice cloning |
| `/admin/natural-language-bi` | NaturalLanguageBI | Natural language analytics |
| `/admin/class-recommender` | ClassRecommender | AI class recommendations |

#### Studio Tech

| Route | Component | Description |
|-------|-----------|-------------|
| `/admin/instructors` | InstructorDashboard | Instructor performance |
| `/admin/sequencer` | ClassSequencer | Class sequence builder |
| `/admin/challenges` | Challenges | Client challenge programs |
| `/admin/smart-inventory` | SmartInventory | AI inventory forecasting |
| `/admin/wearables` | WearablesHub | Wearable device integrations |
| `/admin/virtual-studio` | VirtualStudio | Virtual class streaming |
| `/admin/cohort-analysis` | CohortAnalysis | Client cohort analytics |
| `/admin/ar-simulator` | ARSimulator | AR form simulator |
| `/admin/posture-timelapse` | PostureTimelapse | Posture progress timelapse |
| `/admin/spring-engine` | SpringEngine | Reformer spring calculator |
| `/admin/recovery-text` | RecoveryText | Post-class recovery texts |
| `/admin/referral-engine` | ReferralEngine | Automated referral campaigns |
| `/admin/trainee-portal` | TraineePortal | Instructor trainee portal |
| `/admin/dynamic-pricing` | DynamicPricing | Dynamic class pricing |
| `/admin/live-dashboard` | LiveDashboard | Real-time studio dashboard |
| `/admin/instructor-tipping` | InstructorTipping | Client-to-instructor tipping |

#### Content & Growth (new)

| Route | Component | Description |
|-------|-----------|-------------|
| `/admin/on-demand` | OnDemandLibrary | On-demand video library (24 classes, 6 instructors, collections) |
| `/admin/brand-guide` | BrandedFormats | STUDIO-branded class format guide (13 formats) |
| `/admin/loyalty` | LoyaltyProgram | Points-based rewards program (4 tiers, leaderboard) |
| `/admin/membership-perks` | MembershipPerks | Membership perks manager (friend passes, birthdays, booking windows) |
| `/admin/group-bookings` | GroupBookings | Group event packages + quote builder (6 event types) |
| `/admin/tiktok` | TikTokDashboard | TikTok content strategy (5 pillars, schedule, trending audio) |

## Tech Stack

- **React 18** + React Router DOM 7 + Vite 5
- **Styling**: CSS-in-JS inline styles, glass morphism design system
- **Fonts**: Playfair Display, Outfit, JetBrains Mono
- **Accent**: `#C4704B` (warm terracotta)
- **State**: React hooks + localStorage persistence
- **Code splitting**: Every page lazy-loaded via `React.lazy()`
