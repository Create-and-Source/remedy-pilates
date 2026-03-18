// ── Wearable Provider Configs ──────────────────────────────────────────
// OAuth2 endpoints, scopes, and API URLs for each provider.
// Client IDs come from env vars (VITE_* prefix for Vite client-side access).
// Client secrets are server-side only (in Vercel env vars, used by api/ functions).

const REDIRECT_URI = typeof window !== 'undefined'
  ? `${window.location.origin}/admin/wearables`
  : '';

export const PROVIDERS = {
  fitbit: {
    name: 'Fitbit',
    icon: '📱',
    color: '#00B0B9',
    // OAuth2 with PKCE (Authorization Code Grant)
    authorizeUrl: 'https://www.fitbit.com/oauth2/authorize',
    tokenUrl: 'https://api.fitbit.com/oauth2/token',
    apiBase: 'https://api.fitbit.com',
    scopes: ['activity', 'heartrate', 'sleep', 'profile'],
    supportsPKCE: true,
    clientIdEnv: 'VITE_FITBIT_CLIENT_ID',
    // API endpoints for 7-day data
    endpoints: {
      heartRate: '/1/user/-/activities/heart/date/today/7d.json',
      hrv: '/1/user/-/hrv/date/today/7d.json',
      sleep: '/1.2/user/-/sleep/list.json?beforeDate={today}&sort=desc&offset=0&limit=7',
      steps: '/1/user/-/activities/steps/date/today/7d.json',
      calories: '/1/user/-/activities/calories/date/today/7d.json',
      activeMinutes: '/1/user/-/activities/minutesVeryActive/date/today/7d.json',
      fairlyActive: '/1/user/-/activities/minutesFairlyActive/date/today/7d.json',
    },
  },

  whoop: {
    name: 'WHOOP',
    icon: '💪',
    color: '#1DB954',
    authorizeUrl: 'https://api.prod.whoop.com/oauth/oauth2/auth',
    tokenUrl: 'https://api.prod.whoop.com/oauth/oauth2/token',
    apiBase: 'https://api.prod.whoop.com/developer/v1',
    scopes: ['read:recovery', 'read:sleep', 'read:workout', 'read:cycles', 'read:profile'],
    supportsPKCE: false,
    clientIdEnv: 'VITE_WHOOP_CLIENT_ID',
    endpoints: {
      recovery: '/recovery',
      sleep: '/activity/sleep',
      cycle: '/cycle',
    },
  },

  oura: {
    name: 'Oura Ring',
    icon: '💍',
    color: '#D4A574',
    authorizeUrl: 'https://cloud.ouraring.com/oauth/authorize',
    tokenUrl: 'https://api.ouraring.com/oauth/token',
    apiBase: 'https://api.ouraring.com/v2',
    scopes: ['daily', 'heartrate', 'personal', 'sleep'],
    supportsPKCE: false,
    clientIdEnv: 'VITE_OURA_CLIENT_ID',
    endpoints: {
      dailyReadiness: '/usercollection/daily_readiness',
      dailySleep: '/usercollection/daily_sleep',
      dailyActivity: '/usercollection/daily_activity',
      heartrate: '/usercollection/heartrate',
    },
  },

  garmin: {
    name: 'Garmin',
    icon: '🏃',
    color: '#007CC3',
    // Garmin uses OAuth1a — requires server-side signature
    // The Health API also requires a Garmin business partnership
    authorizeUrl: 'https://connect.garmin.com/oauthConfirm',
    tokenUrl: null, // OAuth1a flow handled entirely server-side
    apiBase: 'https://apis.garmin.com',
    scopes: [],
    supportsPKCE: false,
    isOAuth1: true,
    clientIdEnv: 'VITE_GARMIN_CONSUMER_KEY',
    endpoints: {
      dailies: '/wellness-api/rest/dailies',
      sleeps: '/wellness-api/rest/sleeps',
      heartRates: '/wellness-api/rest/heartRates',
    },
    note: 'Garmin Health API requires a business partnership. Contact Garmin developer relations.',
  },
};

// Apple Watch has no web API — HealthKit is iOS-native only.
// Data can be synced via:
// 1. Apple Health export (XML) → manual upload
// 2. A companion iOS app using HealthKit → your backend
// 3. Third-party bridges (e.g., Terra API, Vital)
export const APPLE_WATCH_NOTE = 'Apple Watch requires a native iOS app with HealthKit access. Consider using Terra API or Vital as a unified health data bridge.';

export function getClientId(provider) {
  const key = PROVIDERS[provider]?.clientIdEnv;
  if (!key) return null;
  // Vite injects VITE_* env vars at build time via import.meta.env
  return import.meta.env?.[key] || null;
}

export function getRedirectUri() {
  return REDIRECT_URI;
}
