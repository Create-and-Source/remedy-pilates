import { lazy, Suspense, useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './theme';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import { initStore } from './data/store';
import { getValidToken } from './api/auth';

const Home = lazy(() => import('./pages/Home'));
const SignIn = lazy(() => import('./pages/SignIn'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Patients = lazy(() => import('./pages/Patients'));
const Schedule = lazy(() => import('./pages/Schedule'));
const Treatments = lazy(() => import('./pages/Treatments'));
const Inventory = lazy(() => import('./pages/Inventory'));
const Retention = lazy(() => import('./pages/Retention'));
const Email = lazy(() => import('./pages/Email'));
const TextMessages = lazy(() => import('./pages/TextMessages'));
const SocialMedia = lazy(() => import('./pages/SocialMedia'));
const Inbox = lazy(() => import('./pages/Inbox'));
const BeforeAfter = lazy(() => import('./pages/BeforeAfter'));
const Charts = lazy(() => import('./pages/Charts'));
const Waivers = lazy(() => import('./pages/Waivers'));
const CheckIn = lazy(() => import('./pages/CheckIn'));
const Referrals = lazy(() => import('./pages/Referrals'));
const Memberships = lazy(() => import('./pages/Memberships'));
const Reviews = lazy(() => import('./pages/Reviews'));
const Waitlist = lazy(() => import('./pages/Waitlist'));
const RecoveryTips = lazy(() => import('./pages/Aftercare'));
const Wallet = lazy(() => import('./pages/Wallet'));
const Reports = lazy(() => import('./pages/Reports'));
const Settings = lazy(() => import('./pages/Settings'));
const Portal = lazy(() => import('./pages/Portal'));
const BookOnline = lazy(() => import('./pages/BookOnline'));
const Pricing = lazy(() => import('./pages/Pricing'));
const Team = lazy(() => import('./pages/Team'));
const Training = lazy(() => import('./pages/Training'));
const PostureAI = lazy(() => import('./pages/PostureAI'));
const MovementRx = lazy(() => import('./pages/MovementRx'));
const FatigueTracker = lazy(() => import('./pages/FatigueTracker'));
const RetentionBrain = lazy(() => import('./pages/RetentionBrain'));
const InstructorDashboard = lazy(() => import('./pages/InstructorDashboard'));
const ClassSequencer = lazy(() => import('./pages/ClassSequencer'));
const Challenges = lazy(() => import('./pages/Challenges'));
const SmartInventory = lazy(() => import('./pages/SmartInventory'));
const AIFrontDesk = lazy(() => import('./pages/AIFrontDesk'));
const WearablesHub = lazy(() => import('./pages/WearablesHub'));
const VirtualStudio = lazy(() => import('./pages/VirtualStudio'));
const CohortAnalysis = lazy(() => import('./pages/CohortAnalysis'));
const ARSimulator = lazy(() => import('./pages/ARSimulator'));
const PostureTimelapse = lazy(() => import('./pages/PostureTimelapse'));
const VoiceClone = lazy(() => import('./pages/VoiceClone'));
const AIIntake = lazy(() => import('./pages/AIIntake'));
const SpringEngine = lazy(() => import('./pages/SpringEngine'));
const RecoveryText = lazy(() => import('./pages/RecoveryText'));
const ReferralEngine = lazy(() => import('./pages/ReferralEngine'));
const TraineePortal = lazy(() => import('./pages/TraineePortal'));
const VoiceAI = lazy(() => import('./pages/VoiceAI'));
const NaturalLanguageBI = lazy(() => import('./pages/NaturalLanguageBI'));
const DynamicPricing = lazy(() => import('./pages/DynamicPricing'));
const LiveDashboard = lazy(() => import('./pages/LiveDashboard'));
const InstructorTipping = lazy(() => import('./pages/InstructorTipping'));
const ClassRecommender = lazy(() => import('./pages/ClassRecommender'));
const OnDemandLibrary = lazy(() => import('./pages/OnDemandLibrary'));
const BrandedFormats = lazy(() => import('./pages/BrandedFormats'));
const LoyaltyProgram = lazy(() => import('./pages/LoyaltyProgram'));
const MembershipPerks = lazy(() => import('./pages/MembershipPerks'));
const FreeTrialFlow = lazy(() => import('./pages/FreeTrialFlow'));
const GroupBookings = lazy(() => import('./pages/GroupBookings'));
const TikTokDashboard = lazy(() => import('./pages/TikTokDashboard'));
const BodyScans = lazy(() => import('./pages/BodyScans'));
const Onboarding = lazy(() => import('./pages/Onboarding'));
const TransformationPlan = lazy(() => import('./pages/TransformationPlan'));
const Breathwork = lazy(() => import('./pages/Breathwork'));
const SocialShare = lazy(() => import('./pages/SocialShare'));
const Nutrition = lazy(() => import('./pages/Nutrition'));

function Loader() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#FAF6F1',
      color: '#2D2A26',
      font: "400 14px 'Outfit', sans-serif",
      gap: 12,
    }}>
      <div style={{
        width: 36, height: 36, border: '3px solid #E8E0D8',
        borderTopColor: '#C4704B', borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <span style={{ opacity: 0.6 }}>Loading...</span>
    </div>
  );
}

function HomeGate() {
  // In the mobile app, skip the marketing Home page entirely.
  // Route users to admin (if signed in) or sign-in (if not).
  if (!localStorage.getItem('rp_onboarded')) {
    return <Navigate to="/onboarding" replace />;
  }
  if (localStorage.getItem('rp_auth_token')) {
    return <Navigate to="/admin" replace />;
  }
  return <Navigate to="/signin" replace />;
}

export default function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Refresh auth token (if expired but refresh token available), then load data
    getValidToken()
      .catch(() => {}) // Ignore if not logged in
      .then(() => initStore())
      .then(() => setReady(true));
  }, []);

  if (!ready) return <Loader />;

  return (
    <ThemeProvider>
      <Suspense fallback={<Loader />}>
        <Routes>
          {/* Onboarding — shown once on first launch */}
          <Route path="/onboarding" element={<Onboarding />} />

          {/* Public pages — no sidebar */}
          <Route path="/" element={<HomeGate />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/book" element={<BookOnline />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/team" element={<Team />} />
          <Route path="/book/free-trial" element={<FreeTrialFlow />} />

          {/* Portal — requires auth (any role) */}
          <Route path="/portal" element={
            <ProtectedRoute>
              <Portal />
            </ProtectedRoute>
          } />

          {/* Admin — requires auth (owner, instructor, front_desk) */}
          <Route path="/admin/*" element={
            <ProtectedRoute roles={['owner', 'instructor', 'front_desk']}>
              <Layout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/checkin" element={<CheckIn />} />
                <Route path="/clients" element={<Patients />} />
                <Route path="/schedule" element={<Schedule />} />
                <Route path="/sessions" element={<Treatments />} />
                <Route path="/charts" element={<Charts />} />
                <Route path="/photos" element={<BeforeAfter />} />
                <Route path="/waivers" element={<Waivers />} />
                <Route path="/memberships" element={<Memberships />} />
                <Route path="/wallet" element={<Wallet />} />
                <Route path="/referrals" element={<Referrals />} />
                <Route path="/inventory" element={<Inventory />} />
                <Route path="/retention" element={<Retention />} />
                <Route path="/recovery-tips" element={<RecoveryTips />} />
                <Route path="/waitlist" element={<Waitlist />} />
                <Route path="/reviews" element={<Reviews />} />
                <Route path="/inbox" element={<Inbox />} />
                <Route path="/email" element={<Email />} />
                <Route path="/texts" element={<TextMessages />} />
                <Route path="/social" element={<SocialMedia />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/training" element={<Training />} />
                <Route path="/posture" element={<PostureAI />} />
                <Route path="/movement-rx" element={<MovementRx />} />
                <Route path="/fatigue" element={<FatigueTracker />} />
                <Route path="/retention-brain" element={<RetentionBrain />} />
                <Route path="/instructors" element={<InstructorDashboard />} />
                <Route path="/sequencer" element={<ClassSequencer />} />
                <Route path="/challenges" element={<Challenges />} />
                <Route path="/smart-inventory" element={<SmartInventory />} />
                <Route path="/ai-front-desk" element={<AIFrontDesk />} />
                <Route path="/wearables" element={<WearablesHub />} />
                <Route path="/virtual-studio" element={<VirtualStudio />} />
                <Route path="/cohort-analysis" element={<CohortAnalysis />} />
                <Route path="/ar-simulator" element={<ARSimulator />} />
                <Route path="/posture-timelapse" element={<PostureTimelapse />} />
                <Route path="/voice-clone" element={<VoiceClone />} />
                <Route path="/ai-intake" element={<AIIntake />} />
                <Route path="/spring-engine" element={<SpringEngine />} />
                <Route path="/recovery-text" element={<RecoveryText />} />
                <Route path="/referral-engine" element={<ReferralEngine />} />
                <Route path="/trainee-portal" element={<TraineePortal />} />
                <Route path="/voice-ai" element={<VoiceAI />} />
                <Route path="/natural-language-bi" element={<NaturalLanguageBI />} />
                <Route path="/dynamic-pricing" element={<DynamicPricing />} />
                <Route path="/live-dashboard" element={<LiveDashboard />} />
                <Route path="/instructor-tipping" element={<InstructorTipping />} />
                <Route path="/class-recommender" element={<ClassRecommender />} />
                <Route path="/on-demand" element={<OnDemandLibrary />} />
                <Route path="/brand-guide" element={<BrandedFormats />} />
                <Route path="/loyalty" element={<LoyaltyProgram />} />
                <Route path="/membership-perks" element={<MembershipPerks />} />
                <Route path="/group-bookings" element={<GroupBookings />} />
                <Route path="/tiktok" element={<TikTokDashboard />} />
                <Route path="/body-scans" element={<BodyScans />} />
                <Route path="/nutrition" element={<Nutrition />} />
                <Route path="/transformation-plan" element={<TransformationPlan />} />
                <Route path="/breathwork" element={<Breathwork />} />
                <Route path="/social-share" element={<SocialShare />} />
                <Route path="/settings" element={<Settings />} />
              </Routes>
            </Layout>
            </ProtectedRoute>
          } />
        </Routes>
      </Suspense>
    </ThemeProvider>
  );
}
