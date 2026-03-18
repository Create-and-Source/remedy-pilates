// Remedy Pilates — Frontend API Client
// Drop-in replacement for the localStorage store.js.
// All functions are async and communicate with the AWS Lambda backend.
// Auto-refreshes Cognito tokens on 401 responses.

import { getValidToken, signOut } from './auth';

const API = import.meta.env.VITE_API_URL || '';

async function request(path, options = {}, retry = true) {
  const token = localStorage.getItem('rp_auth_token');
  const res = await fetch(`${API}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...options,
  });

  // Auto-refresh token on 401 and retry once
  if (res.status === 401 && retry) {
    const newToken = await getValidToken();
    if (newToken) {
      return request(path, options, false); // retry with fresh token
    }
    // Refresh failed — sign out and redirect
    signOut();
    window.location.href = '/signin';
    throw new Error('Session expired');
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

const get = (path) => request(path);
const post = (path, body) => request(path, { method: 'POST', body: JSON.stringify(body) });
const put = (path, body) => request(path, { method: 'PUT', body: JSON.stringify(body) });
const del = (path) => request(path, { method: 'DELETE' });

// ── Init / Subscribe (no-ops — backend handles seeding) ────────────────────
export async function initStore() {}
export const subscribe = (_fn) => () => {};

// ── Clients (was "Patients" in store.js) ───────────────────────────────────
export const getPatients = () => get('/api/clients');
export const getPatient = (id) => get(`/api/clients/${id}`);
export const addPatient = (data) => post('/api/clients', data);
export const updatePatient = (id, changes) => put(`/api/clients/${id}`, changes);
export const deletePatient = (id) => del(`/api/clients/${id}`);

// ── Appointments ───────────────────────────────────────────────────────────
export const getAppointments = () => get('/api/appointments');
export const getAppointment = (id) => get(`/api/appointments/${id}`);
export const addAppointment = (data) => post('/api/appointments', data);
export const updateAppointment = (id, changes) => put(`/api/appointments/${id}`, changes);
export const deleteAppointment = (id) => del(`/api/appointments/${id}`);

// ── Services ───────────────────────────────────────────────────────────────
export const getServices = () => get('/api/services');
export const getService = (id) => get(`/api/services/${id}`);
export const addService = (data) => post('/api/services', data);
export const updateService = (id, changes) => put(`/api/services/${id}`, changes);
export const deleteService = (id) => del(`/api/services/${id}`);

// ── Instructors (was "Providers") ──────────────────────────────────────────
export const getProviders = () => get('/api/instructors');
export const addProvider = (data) => post('/api/instructors', data);
export const updateProvider = (id, changes) => put(`/api/instructors/${id}`, changes);

// ── Locations ──────────────────────────────────────────────────────────────
export const getLocations = () => get('/api/locations');
export const addLocation = (data) => post('/api/locations', data);

// ── Class Packages (was "Treatment Plans") ─────────────────────────────────
export const getTreatmentPlans = () => get('/api/packages');
export const addTreatmentPlan = (data) => post('/api/packages', data);
export const updateTreatmentPlan = (id, changes) => put(`/api/packages/${id}`, changes);
export const deleteTreatmentPlan = (id) => del(`/api/packages/${id}`);

// ── Inventory ──────────────────────────────────────────────────────────────
export const getInventory = () => get('/api/inventory');
export const addInventoryItem = (data) => post('/api/inventory', data);
export const updateInventoryItem = (id, changes) => put(`/api/inventory/${id}`, changes);
export const adjustStock = (id, delta, note) => post('/api/inventory/adjust', { id, delta, note });

// ── Emails ─────────────────────────────────────────────────────────────────
export const getEmails = () => get('/api/emails');
export const addEmail = (data) => post('/api/emails', data);

// ── Text Messages ──────────────────────────────────────────────────────────
export const getTexts = () => get('/api/texts');
export const addText = (data) => post('/api/texts', data);

// ── Social Posts ───────────────────────────────────────────────────────────
export const getSocialPosts = () => get('/api/social-posts');
export const addSocialPost = (data) => post('/api/social-posts', data);
export const updateSocialPost = (id, changes) => put(`/api/social-posts/${id}`, changes);
export const deleteSocialPost = (id) => del(`/api/social-posts/${id}`);

// ── Retention Alerts ───────────────────────────────────────────────────────
export const getRetentionAlerts = () => get('/api/retention');
export const updateRetentionAlert = (id, changes) => put(`/api/retention/${id}`, changes);

// ── Photos ─────────────────────────────────────────────────────────────────
export const getPhotos = () => get('/api/photos');
export const addPhoto = (data) => post('/api/photos', data);
export const deletePhoto = (id) => del(`/api/photos/${id}`);

// ── Trainees ───────────────────────────────────────────────────────────────
export const getTrainees = () => get('/api/trainees');
export const addTrainee = (data) => post('/api/trainees', data);
export const updateTrainee = (id, changes) => put(`/api/trainees/${id}`, changes);
export const deleteTrainee = (id) => del(`/api/trainees/${id}`);

// ── Posture Assessments ────────────────────────────────────────────────────
export const getPostureAssessments = () => get('/api/posture');
export const addPostureAssessment = (data) => post('/api/posture', data);
export const deletePostureAssessment = (id) => del(`/api/posture/${id}`);

// ── Prescriptions ──────────────────────────────────────────────────────────
export const getPrescriptions = () => get('/api/prescriptions');
export const addPrescription = (data) => post('/api/prescriptions', data);
export const deletePrescription = (id) => del(`/api/prescriptions/${id}`);

// ── Bookings ───────────────────────────────────────────────────────────────
export const getBookings = () => get('/api/bookings');
export const addBooking = (data) => post('/api/bookings', data);
export const deleteBooking = (id) => del(`/api/bookings/${id}`);

// ── Settings ───────────────────────────────────────────────────────────────
export const getSettings = () => get('/api/settings');
export const updateSettings = (data) => put('/api/settings', data);

// ── Check-ins ──────────────────────────────────────────────────────────────
export const getCheckins = () => get('/api/checkins');
export const addCheckin = (data) => post('/api/checkins', data);

// ── Waivers ────────────────────────────────────────────────────────────────
export const getWaivers = () => get('/api/waivers');
export const addWaiver = (data) => post('/api/waivers', data);
export const updateWaiver = (id, changes) => put(`/api/waivers/${id}`, changes);

// ── Waitlist ───────────────────────────────────────────────────────────────
export const getWaitlist = () => get('/api/waitlist');
export const addWaitlistEntry = (data) => post('/api/waitlist', data);
export const removeWaitlistEntry = (id) => del(`/api/waitlist/${id}`);

// ── Wallet ─────────────────────────────────────────────────────────────────
export const getWallets = () => get('/api/wallet');
export const addWallet = (data) => post('/api/wallet', data);
export const updateWallet = (id, changes) => put(`/api/wallet/${id}`, changes);

// ── Transactions ───────────────────────────────────────────────────────────
export const getTransactions = () => get('/api/transactions');
export const addTransaction = (data) => post('/api/transactions', data);

// ── Inbox ──────────────────────────────────────────────────────────────────
export const getInbox = () => get('/api/inbox');
export const addMessage = (data) => post('/api/inbox', data);
export const updateMessage = (id, changes) => put(`/api/inbox/${id}`, changes);

// ── Reviews ────────────────────────────────────────────────────────────────
export const getReviews = () => get('/api/reviews');
export const addReview = (data) => post('/api/reviews', data);
export const updateReview = (id, changes) => put(`/api/reviews/${id}`, changes);

// ── Referrals ──────────────────────────────────────────────────────────────
export const getReferrals = () => get('/api/referrals');
export const addReferral = (data) => post('/api/referrals', data);
export const updateReferral = (id, changes) => put(`/api/referrals/${id}`, changes);
export const getReferralSettings = () => get('/api/referral-settings');
export const updateReferralSettings = (data) => put('/api/referral-settings', data);

// ── Memberships ────────────────────────────────────────────────────────────
export const getMemberships = async () => {
  const data = await get('/api/memberships');
  return data.memberships || data;
};
export const addMembership = (data) => post('/api/memberships', data);
export const updateMembership = (id, changes) => put(`/api/memberships/${id}`, changes);
export const deleteMembership = (id) => del(`/api/memberships/${id}`);
export const getMembershipPackages = () => get('/api/membership-packages');
export const addMembershipPackage = (data) => post('/api/membership-packages', data);
export const updateMembershipPackage = (id, changes) => put(`/api/membership-packages/${id}`, changes);

// ── Recovery Tips ──────────────────────────────────────────────────────────
export const getRecoveryTips = () => get('/api/recovery-tips');
export const addRecoveryTip = (data) => post('/api/recovery-tips', data);
export const updateRecoveryTip = (id, changes) => put(`/api/recovery-tips/${id}`, changes);

// ── Charts ─────────────────────────────────────────────────────────────────
export const getCharts = () => get('/api/charts');
export const addChart = (data) => post('/api/charts', data);
export const updateChart = (id, changes) => put(`/api/charts/${id}`, changes);

// ── Helpers (client-side) ──────────────────────────────────────────────────
export const formatPrice = (cents) => '$' + (cents / 100).toFixed(2);
