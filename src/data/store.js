// Central store — hybrid localStorage cache + AWS API backend
// Reads: synchronous from localStorage (instant UI — no component changes needed)
// Writes: localStorage (instant) + API (background sync)
// Init: fetches from API if VITE_API_URL is set, else seeds localStorage

const API = import.meta.env.VITE_API_URL || '';

// ── Reactive subscribe system ──
const listeners = new Set();
export function subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); }
function notify() { listeners.forEach(fn => fn()); }

// ── localStorage helpers ──
function get(key, fallback = []) {
  try { return JSON.parse(localStorage.getItem(key)) || fallback; } catch { return fallback; }
}
function set(key, data) { localStorage.setItem(key, JSON.stringify(data)); notify(); }

// ── API helpers (fire-and-forget — never block UI) ──
function authHeaders() {
  const h = { 'Content-Type': 'application/json' };
  const token = localStorage.getItem('rp_auth_token');
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}
function apiGet(path) { return fetch(`${API}${path}`, { headers: authHeaders() }).then(r => r.ok ? r.json() : null).catch(() => null); }
function apiPost(path, body) { if (API) fetch(`${API}${path}`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(body) }).catch(() => {}); }
function apiPut(path, body) { if (API) fetch(`${API}${path}`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify(body) }).catch(() => {}); }
function apiDel(path) { if (API) fetch(`${API}${path}`, { method: 'DELETE', headers: authHeaders() }).catch(() => {}); }

// ── Clients ──
export function getPatients() { return get('rp_clients', []); }
export function addPatient(p) { const all = getPatients(); p.id = `CLT-${Date.now()}`; p.createdAt = new Date().toISOString(); all.unshift(p); set('rp_clients', all); apiPost('/api/clients', p); return p; }
export function updatePatient(id, updates) { const all = getPatients().map(p => p.id === id ? { ...p, ...updates } : p); set('rp_clients', all); apiPut(`/api/clients/${id}`, updates); }
export function deletePatient(id) { set('rp_clients', getPatients().filter(p => p.id !== id)); apiDel(`/api/clients/${id}`); }
export function getPatient(id) { return getPatients().find(p => p.id === id) || null; }

// ── Appointments / Class Bookings ──
export function getAppointments() { return get('rp_appointments', []); }
export function addAppointment(a) { const all = getAppointments(); a.id = `APT-${Date.now()}`; a.createdAt = new Date().toISOString(); all.push(a); set('rp_appointments', all); apiPost('/api/appointments', a); return a; }
export function updateAppointment(id, updates) { set('rp_appointments', getAppointments().map(a => a.id === id ? { ...a, ...updates } : a)); apiPut(`/api/appointments/${id}`, updates); }
export function deleteAppointment(id) { set('rp_appointments', getAppointments().filter(a => a.id !== id)); apiDel(`/api/appointments/${id}`); }

// ── Class Packages ──
export function getTreatmentPlans() { return get('rp_class_packages', []); }
export function addTreatmentPlan(t) { const all = getTreatmentPlans(); t.id = `PKG-${Date.now()}`; t.createdAt = new Date().toISOString(); all.unshift(t); set('rp_class_packages', all); apiPost('/api/packages', t); return t; }
export function updateTreatmentPlan(id, updates) { set('rp_class_packages', getTreatmentPlans().map(t => t.id === id ? { ...t, ...updates } : t)); apiPut(`/api/packages/${id}`, updates); }
export function deleteTreatmentPlan(id) { set('rp_class_packages', getTreatmentPlans().filter(t => t.id !== id)); apiDel(`/api/packages/${id}`); }

// ── Inventory ──
export function getInventory() { return get('rp_inventory', []); }
export function addInventoryItem(item) { const all = getInventory(); item.id = `INV-${Date.now()}`; item.createdAt = new Date().toISOString(); all.unshift(item); set('rp_inventory', all); apiPost('/api/inventory', item); return item; }
export function updateInventoryItem(id, updates) { set('rp_inventory', getInventory().map(i => i.id === id ? { ...i, ...updates } : i)); apiPut(`/api/inventory/${id}`, updates); }
export function adjustStock(id, qty, reason) {
  const delta = parseFloat(qty) || 0;
  const all = getInventory().map(i => {
    if (i.id === id) {
      const log = i.adjustmentLog || [];
      log.push({ qty: delta, reason, date: new Date().toISOString() });
      return { ...i, quantity: Math.max(0, parseFloat(i.quantity) + delta), adjustmentLog: log };
    }
    return i;
  });
  set('rp_inventory', all);
  apiPost('/api/inventory/adjust', { id, delta, note: reason });
}

export function getEquipmentInventory() {
  return getInventory().filter(i => i.category === 'Equipment');
}

// ── Emails ──
export function getEmails() { return get('rp_emails', []); }
export function addEmail(e) { const all = getEmails(); e.id = `EM-${Date.now()}`; e.sentDate = new Date().toISOString(); all.unshift(e); set('rp_emails', all); apiPost('/api/emails', e); return e; }

// ── Text Messages (SMS) ──
export function getTextMessages() { return get('rp_texts', []); }
export function addTextMessage(t) { const all = getTextMessages(); t.id = `TXT-${Date.now()}`; t.sentDate = new Date().toISOString(); all.unshift(t); set('rp_texts', all); apiPost('/api/texts', t); return t; }

// ── Social Media Posts ──
export function getSocialPosts() { return get('rp_social_posts', []); }
export function addSocialPost(p) { const all = getSocialPosts(); p.id = `SP-${Date.now()}`; p.createdAt = new Date().toISOString(); all.unshift(p); set('rp_social_posts', all); apiPost('/api/social-posts', p); return p; }
export function updateSocialPost(id, updates) { set('rp_social_posts', getSocialPosts().map(p => p.id === id ? { ...p, ...updates } : p)); apiPut(`/api/social-posts/${id}`, updates); }
export function deleteSocialPost(id) { set('rp_social_posts', getSocialPosts().filter(p => p.id !== id)); apiDel(`/api/social-posts/${id}`); }

// ── Retention Alerts ──
export function getRetentionAlerts() { return get('rp_retention_alerts', []); }
export function updateRetentionAlert(id, updates) { set('rp_retention_alerts', getRetentionAlerts().map(a => a.id === id ? { ...a, ...updates } : a)); apiPut(`/api/retention/${id}`, updates); }

// ── Services / Classes ──
export function getServices() { return get('rp_services', []); }
export function addService(s) { const all = getServices(); s.id = `SVC-${Date.now()}`; all.push(s); set('rp_services', all); apiPost('/api/services', s); return s; }
export function updateService(id, updates) { set('rp_services', getServices().map(s => s.id === id ? { ...s, ...updates } : s)); apiPut(`/api/services/${id}`, updates); }
export function deleteService(id) { set('rp_services', getServices().filter(s => s.id !== id)); apiDel(`/api/services/${id}`); }

// ── Instructors (Providers) ──
export function getProviders() { return get('rp_instructors', []); }
export function addProvider(p) { const all = getProviders(); p.id = `INS-${Date.now()}`; all.push(p); set('rp_instructors', all); apiPost('/api/instructors', p); return p; }
export function updateProvider(id, updates) { set('rp_instructors', getProviders().map(p => p.id === id ? { ...p, ...updates } : p)); apiPut(`/api/instructors/${id}`, updates); }

// ── Locations ──
export function getLocations() { return get('rp_locations', []); }
export function addLocation(l) { const all = getLocations(); l.id = `LOC-${Date.now()}`; all.push(l); set('rp_locations', all); apiPost('/api/locations', l); return l; }

// ── Progress Photos (Before/After) ──
export function getPhotos() { return get('rp_photos', []); }
export function addPhoto(p) { const all = getPhotos(); p.id = `PHT-${Date.now()}`; p.createdAt = new Date().toISOString(); all.unshift(p); set('rp_photos', all); apiPost('/api/photos', p); return p; }
export function deletePhoto(id) { set('rp_photos', getPhotos().filter(p => p.id !== id)); apiDel(`/api/photos/${id}`); }

// ── Teacher Training ──
export function getTrainees() { return get('rp_trainees', []); }
export function addTrainee(t) { const all = getTrainees(); t.id = `TRN-${Date.now()}`; t.createdAt = new Date().toISOString(); all.push(t); set('rp_trainees', all); apiPost('/api/trainees', t); notify(); return t; }
export function updateTrainee(id, updates) { set('rp_trainees', getTrainees().map(t => t.id === id ? { ...t, ...updates } : t)); apiPut(`/api/trainees/${id}`, updates); notify(); }
export function deleteTrainee(id) { set('rp_trainees', getTrainees().filter(t => t.id !== id)); apiDel(`/api/trainees/${id}`); notify(); }

// ── Posture Assessments ──
export function getAssessments() { return get('rp_posture_assessments', []); }
export function addAssessment(a) { const all = getAssessments(); a.id = `PA-${Date.now()}`; a.date = new Date().toISOString(); all.push(a); set('rp_posture_assessments', all); apiPost('/api/posture', a); notify(); return a; }
export function deleteAssessment(id) { set('rp_posture_assessments', getAssessments().filter(a => a.id !== id)); apiDel(`/api/posture/${id}`); notify(); }

// ── Movement Prescriptions ──
export function getPrescriptions() { return get('rp_prescriptions', []); }
export function addPrescription(p) { const all = getPrescriptions(); p.id = `RX-${Date.now()}`; p.date = new Date().toISOString(); all.push(p); set('rp_prescriptions', all); apiPost('/api/prescriptions', p); notify(); return p; }
export function deletePrescription(id) { set('rp_prescriptions', getPrescriptions().filter(p => p.id !== id)); apiDel(`/api/prescriptions/${id}`); notify(); }

// ── Client Bookings (for fatigue tracker) ──
export function getBookings() { return get('rp_bookings', []); }
export function addBooking(b) { const all = getBookings(); b.id = `BK-${Date.now()}`; all.push(b); set('rp_bookings', all); apiPost('/api/bookings', b); notify(); return b; }
export function deleteBooking(id) { set('rp_bookings', getBookings().filter(b => b.id !== id)); apiDel(`/api/bookings/${id}`); notify(); }

// ── Settings ──
export function getSettings() { return get('rp_settings', {}); }
export function updateSettings(updates) { set('rp_settings', { ...getSettings(), ...updates }); apiPut('/api/settings', updates); }

// ── Format helper ──
export function formatPrice(cents) { return '$' + (cents / 100).toFixed(2); }

// ══════════════════════════════════════════════════════════════════════════════
// Init — async: fetches from API if available, seeds localStorage for gaps
// ══════════════════════════════════════════════════════════════════════════════
export async function initStore() {
  const today = new Date();
  const d = (offset) => { const dt = new Date(today); dt.setDate(dt.getDate() + offset); return dt.toISOString().slice(0, 10); };
  const t = (h, m) => `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;

  // ── API mode: pull from backend into localStorage cache ──
  if (API) {
    // Single request replaces 14 individual endpoint calls
    const initData = await apiGet('/api/init');

    if (initData) {
      // Map API response keys to localStorage keys
      const keyMap = {
        clients:          'rp_clients',
        appointments:     'rp_appointments',
        services:         'rp_services',
        instructors:      'rp_instructors',
        locations:        'rp_locations',
        class_packages:   'rp_class_packages',
        inventory:        'rp_inventory',
        emails:           'rp_emails',
        texts:            'rp_texts',
        social_posts:     'rp_social_posts',
        retention_alerts: 'rp_retention_alerts',
        trainees:         'rp_trainees',
        checkins:         'rp_checkins',
      };

      for (const [apiKey, lsKey] of Object.entries(keyMap)) {
        const data = initData[apiKey];
        if (Array.isArray(data) && data.length > 0) {
          localStorage.setItem(lsKey, JSON.stringify(data));
        }
      }

      // Settings is an object, not an array
      if (initData.settings && Object.keys(initData.settings).length > 0) {
        localStorage.setItem('rp_settings', JSON.stringify(initData.settings));
      }
    }

    // Seed any gaps the API didn't have
    seedIfEmpty(d, today, t);
    return;
  }

  // ── Local mode: original localStorage seeding ──
  seedIfEmpty(d, today, t);
  const alreadyInit = localStorage.getItem('rp_initialized');
  if (alreadyInit) return;

  // Instructors (6 — led by Alex Morgan, founder)
  set('rp_instructors', [
    { id: 'INS-1', name: 'Alex Morgan', title: 'Owner & Master Trainer', specialties: ['Reformer Pilates', 'Mat Pilates', 'Barre', 'Private Training', 'Teacher Training', 'TRX'], color: '#C4704B', certifications: ['PMA-CPT', 'ACE Certified Personal Trainer', 'Balanced Body Master Instructor', 'TRX Certified'], bio: 'Alex founded the studio with a single reformer and a vision for movement that transforms. With over 15 years of teaching experience and thousands of hours on the apparatus, they have built the studio into a respected center for Pilates education. Alex leads the teacher training program and has mentored dozens of instructors through their certifications.', yearsExperience: 15, location: 'All Locations' },
    { id: 'INS-2', name: 'Sam Rivera', title: 'Lead Reformer Instructor', specialties: ['Reformer Pilates', 'Reformer + Cardio', 'Private Training', 'Prenatal Pilates'], color: '#6B8F71', certifications: ['Balanced Body Reformer/Mat', 'NCPT Certified', 'Prenatal/Postnatal Pilates Certification', 'CPR/AED'], bio: 'Sam brings athletic precision to every class. A former professional dancer, they discovered Pilates during injury recovery and never looked back. Sam specializes in Reformer work and has a gift for making complex exercises feel accessible. Their prenatal classes are among the studio\'s most waitlisted.', yearsExperience: 8, location: 'Downtown Studio' },
    { id: 'INS-3', name: 'Jordan Chen', title: 'Prenatal & Postnatal Specialist', specialties: ['Prenatal Pilates', 'Mat Pilates', 'Reformer Pilates', 'Stretch & Restore'], color: '#8B6B94', certifications: ['NCPT Certified', 'Prenatal/Postnatal Pilates Certification', 'Balanced Body Reformer', 'CPR/AED'], bio: 'Jordan specializes in supporting clients through pregnancy and postpartum recovery. With 5 years of teaching experience and deep expertise in pelvic floor health and safe movement modifications, Jordan\'s classes create a welcoming space for all stages of the prenatal journey.', yearsExperience: 5, location: 'Westside Studio' },
    { id: 'INS-4', name: 'Taylor Brooks', title: 'Mat & Barre Specialist', specialties: ['Mat Pilates', 'Barre', 'Barre Burn', 'Group Apparatus'], color: '#5B7B8F', certifications: ['Barre Above Certified', 'ACE Certified', 'Balanced Body Mat', 'CPR/AED'], bio: 'Taylor brings six years of teaching experience and boundless energy to every class. With a background in dance and a passion for functional movement, they blend classical Pilates principles with contemporary barre technique. Their Barre Burn class has developed a dedicated following among regulars.', yearsExperience: 6, location: 'North Studio' },
    { id: 'INS-5', name: 'Casey Williams', title: 'Athletic Performance Instructor', specialties: ['Reformer Pilates', 'TRX Fusion', 'Reformer + Cardio', 'Private Training'], color: '#A68B6B', certifications: ['Balanced Body Comprehensive', 'TRX Group Training Certified', 'NASM CPT', 'CPR/AED'], bio: 'Casey works extensively with athletes and active clients looking to improve performance and prevent injury. With four years of teaching experience and a sports conditioning background, Casey designs sessions that challenge strength, stability, and endurance on and off the reformer.', yearsExperience: 4, location: 'Downtown Studio' },
    { id: 'INS-6', name: 'Riley Kim', title: 'Beginner & Foundations Instructor', specialties: ['Mat Pilates', 'Reformer Pilates', 'Intro to Reformer', 'Stretch & Restore'], color: '#B85C38', certifications: ['Balanced Body Mat/Reformer', 'NCPT Certified', 'CPR/AED'], bio: 'Riley is known for their warm, encouraging approach that makes first-time clients feel completely at ease. With three years of teaching experience and a talent for clear, patient instruction, Riley runs the studio\'s new client orientation program and Intro to Reformer sessions. Every beginner leaves their class confident and excited to return.', yearsExperience: 3, location: 'North Studio' },
  ]);

  // Services / Classes
  set('rp_services', [
    { id: 'SVC-1', name: 'Reformer Pilates', category: 'Pilates', duration: 55, price: 3800, unit: 'per class', description: 'Small group reformer class — core, strength, flexibility' },
    { id: 'SVC-2', name: 'Mat Pilates', category: 'Pilates', duration: 55, price: 2800, unit: 'per class', description: 'Classical mat work focused on core strength and body awareness' },
    { id: 'SVC-3', name: 'Barre', category: 'Barre', duration: 55, price: 3200, unit: 'per class', description: 'Ballet-inspired strength training — isometric holds, micro-movements' },
    { id: 'SVC-4', name: 'Barre Burn', category: 'Barre', duration: 45, price: 3200, unit: 'per class', description: 'High-intensity barre with cardio bursts and resistance bands' },
    { id: 'SVC-5', name: 'TRX Fusion', category: 'TRX', duration: 45, price: 3500, unit: 'per class', description: 'Suspension training combined with Pilates principles' },
    { id: 'SVC-6', name: 'Reformer + Cardio', category: 'Pilates', duration: 55, price: 4000, unit: 'per class', description: 'Reformer work with cardio intervals — jumpboard, standing work' },
    { id: 'SVC-7', name: 'Stretch & Restore', category: 'Wellness', duration: 45, price: 2500, unit: 'per class', description: 'Deep stretching and myofascial release for recovery' },
    { id: 'SVC-8', name: 'Private Training', category: 'Private', duration: 55, price: 9500, unit: 'per session', description: 'One-on-one session with a certified instructor — customized to your goals' },
    { id: 'SVC-9', name: 'Semi-Private Training', category: 'Private', duration: 55, price: 6500, unit: 'per person', description: '2-3 person session — personalized attention at a shared price' },
    { id: 'SVC-10', name: 'Group Apparatus', category: 'Pilates', duration: 55, price: 4200, unit: 'per class', description: 'Cadillac, chair, barrel — full apparatus rotation in small groups' },
    { id: 'SVC-11', name: 'Prenatal Pilates', category: 'Specialty', duration: 45, price: 3500, unit: 'per class', description: 'Safe, supportive Pilates for all trimesters — modified for pregnancy' },
    { id: 'SVC-12', name: 'Youth Conditioning', category: 'Specialty', duration: 45, price: 3000, unit: 'per class', description: 'Age-appropriate strength and flexibility for young athletes (12-17)' },
    { id: 'SVC-13', name: 'Teacher Training Program', category: 'Training', duration: 120, price: 0, unit: 'see pricing', description: 'Pilates Sports Center certified teacher training — 450+ hour program' },
    { id: 'SVC-14', name: 'Intro to Reformer', category: 'Intro', duration: 55, price: 0, unit: 'complimentary', description: 'First-timer orientation — learn the reformer basics before your first class' },
    { id: 'SVC-15', name: 'Virtual Consultation', category: 'Consultation', duration: 30, price: 0, unit: 'complimentary', description: 'Video call with an instructor to discuss your goals and find the right classes' },
  ]);

  // Locations (3 studios)
  set('rp_locations', [
    { id: 'LOC-1', name: 'Downtown Studio', address: '123 Main Street, Suite 200', phone: '(555) 123-4567', rooms: ['Reformer Studio A', 'Reformer Studio B', 'Mat Room', 'Private Suite'] },
    { id: 'LOC-2', name: 'Westside Studio', address: '456 Oak Avenue', phone: '(555) 234-5678', rooms: ['Reformer Studio', 'Barre Room', 'Private Suite'] },
    { id: 'LOC-3', name: 'North Studio', address: '789 Elm Street, Suite 120', phone: '(555) 345-6789', rooms: ['Reformer Studio', 'Mat & Barre Room'] },
  ]);

  // Clients (30)
  const firstNames = ['Emma', 'Olivia', 'Sophia', 'Ava', 'Isabella', 'Mia', 'Charlotte', 'Amelia', 'Harper', 'Evelyn', 'Abigail', 'Ella', 'Scarlett', 'Grace', 'Chloe', 'Victoria', 'Riley', 'Aria', 'Lily', 'Aubrey', 'Zoe', 'Penelope', 'Layla', 'Nora', 'Camila', 'Hannah', 'Addison', 'Luna', 'Savannah', 'Brooklyn'];
  const lastNames = ['Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Anderson', 'Taylor', 'Thomas', 'Hernandez', 'Moore', 'Martin', 'Jackson', 'Thompson', 'White', 'Lopez', 'Lee', 'Gonzalez', 'Harris', 'Clark', 'Lewis', 'Robinson', 'Walker', 'Perez', 'Hall', 'Young', 'Allen'];
  const patients = firstNames.map((fn, i) => ({
    id: `CLT-${1000 + i}`,
    firstName: fn,
    lastName: lastNames[i],
    email: `${fn.toLowerCase()}.${lastNames[i].toLowerCase()}@email.com`,
    phone: `(555) 555-${String(1000 + i).slice(1)}`,
    dob: `${1970 + Math.floor(Math.random() * 30)}-${String(1 + Math.floor(Math.random() * 12)).padStart(2, '0')}-${String(1 + Math.floor(Math.random() * 28)).padStart(2, '0')}`,
    gender: ['Female', 'Female', 'Female', 'Male'][Math.floor(Math.random() * 4)],
    allergies: '',
    notes: '',
    membershipTier: ['None', 'None', 'Silver', 'Gold', 'Platinum'][Math.floor(Math.random() * 5)],
    totalSpent: Math.floor(Math.random() * 500000),
    visitCount: Math.floor(1 + Math.random() * 60),
    lastVisit: d(-Math.floor(Math.random() * 120)),
    createdAt: d(-Math.floor(30 + Math.random() * 365)),
    location: ['LOC-1', 'LOC-1', 'LOC-2', 'LOC-3'][Math.floor(Math.random() * 4)],
  }));
  set('rp_clients', patients);

  // Class Bookings / Appointments (next 14 days + past 7 days)
  const svcIds = ['SVC-1', 'SVC-2', 'SVC-3', 'SVC-4', 'SVC-5', 'SVC-6', 'SVC-7', 'SVC-8', 'SVC-10'];
  const insIds = ['INS-1', 'INS-2', 'INS-3', 'INS-4', 'INS-5'];
  const statuses = ['confirmed', 'confirmed', 'confirmed', 'pending', 'completed'];
  const appts = [];
  for (let dayOff = -7; dayOff <= 14; dayOff++) {
    const numAppts = 4 + Math.floor(Math.random() * 8);
    for (let j = 0; j < numAppts; j++) {
      const hour = 6 + Math.floor(Math.random() * 12);
      const min = [0, 15, 30, 45][Math.floor(Math.random() * 4)];
      const pat = patients[Math.floor(Math.random() * patients.length)];
      const svc = svcIds[Math.floor(Math.random() * svcIds.length)];
      const ins = insIds[Math.floor(Math.random() * insIds.length)];
      const status = dayOff < 0 ? 'completed' : statuses[Math.floor(Math.random() * statuses.length)];
      appts.push({
        id: `APT-${2000 + appts.length}`,
        patientId: pat.id,
        patientName: `${pat.firstName} ${pat.lastName}`,
        serviceId: svc,
        providerId: ins,
        date: d(dayOff),
        time: t(hour, min),
        duration: [45, 55][Math.floor(Math.random() * 2)],
        status,
        location: ['LOC-1', 'LOC-1', 'LOC-2', 'LOC-3'][Math.floor(Math.random() * 4)],
        room: `Reformer Studio ${['A', 'B'][Math.floor(Math.random() * 2)]}`,
        notes: '',
        createdAt: new Date().toISOString(),
      });
    }
  }
  set('rp_appointments', appts);

  // Class Packages
  set('rp_class_packages', [
    { id: 'PKG-1', patientId: 'CLT-1000', patientName: 'Emma Johnson', name: 'New Client Starter Package', sessions: [
      { serviceId: 'SVC-14', name: 'Intro to Reformer', status: 'completed', date: d(-60), notes: 'Great first session — learned spring settings' },
      { serviceId: 'SVC-1', name: 'Reformer Pilates — Week 1', status: 'completed', date: d(-53), notes: '2 classes, building fundamentals' },
      { serviceId: 'SVC-1', name: 'Reformer Pilates — Week 2', status: 'completed', date: d(-46), notes: 'Good form on footwork' },
      { serviceId: 'SVC-1', name: 'Reformer Pilates — Week 3', status: 'completed', date: d(-39), notes: 'Added long box series' },
      { serviceId: 'SVC-1', name: 'Reformer Pilates — Week 4', status: 'upcoming', date: d(5), notes: '' },
    ], createdAt: d(-65), providerId: 'INS-2' },
    { id: 'PKG-2', patientId: 'CLT-1003', patientName: 'Ava Jones', name: 'Barre & Pilates Combo', sessions: [
      { serviceId: 'SVC-3', name: 'Barre — Foundations', status: 'completed', date: d(-30), notes: 'Strong ballet background' },
      { serviceId: 'SVC-1', name: 'Reformer Pilates', status: 'completed', date: d(-23), notes: 'Loved the reformer' },
      { serviceId: 'SVC-4', name: 'Barre Burn', status: 'completed', date: d(-16), notes: 'Great cardio effort' },
      { serviceId: 'SVC-6', name: 'Reformer + Cardio', status: 'upcoming', date: d(7), notes: '' },
      { serviceId: 'SVC-3', name: 'Barre — Advanced', status: 'upcoming', date: d(14), notes: '' },
    ], createdAt: d(-35), providerId: 'INS-3' },
    { id: 'PKG-3', patientId: 'CLT-1007', patientName: 'Amelia Thompson', name: 'Prenatal Wellness Journey', sessions: [
      { serviceId: 'SVC-11', name: 'Prenatal Pilates — 1st Trimester', status: 'completed', date: d(-28), notes: 'Gentle start, focus on pelvic floor' },
      { serviceId: 'SVC-11', name: 'Prenatal Pilates — Week 2', status: 'completed', date: d(-21), notes: 'Side-lying work, breathing' },
      { serviceId: 'SVC-7', name: 'Stretch & Restore', status: 'in-progress', date: d(0), notes: 'Hip and back release' },
      { serviceId: 'SVC-11', name: 'Prenatal Pilates — 2nd Trimester', status: 'upcoming', date: d(7), notes: '' },
      { serviceId: 'SVC-7', name: 'Stretch & Restore', status: 'upcoming', date: d(14), notes: '' },
    ], createdAt: d(-30), providerId: 'INS-2' },
    { id: 'PKG-4', patientId: 'CLT-1004', patientName: 'Isabella Martinez', name: 'Private Training — Core Rehab', sessions: [
      { serviceId: 'SVC-8', name: 'Private Session #1 — Assessment', status: 'completed', date: d(-50), notes: 'Post-surgical core weakness, cleared by PT' },
      { serviceId: 'SVC-8', name: 'Private Session #2 — Foundation', status: 'completed', date: d(-43), notes: 'Imprint, breathing, gentle activation' },
      { serviceId: 'SVC-8', name: 'Private Session #3 — Progression', status: 'completed', date: d(-36), notes: 'Added reformer footwork, light springs' },
      { serviceId: 'SVC-8', name: 'Private Session #4', status: 'in-progress', date: d(3), notes: 'Ready for more challenge' },
      { serviceId: 'SVC-8', name: 'Private Session #5', status: 'upcoming', date: d(10), notes: '' },
      { serviceId: 'SVC-1', name: 'Transition to Group Reformer', status: 'upcoming', date: d(17), notes: '' },
    ], createdAt: d(-55), providerId: 'INS-1' },
    { id: 'PKG-5', patientId: 'CLT-1005', patientName: 'Mia Garcia', name: 'Runner\'s Cross-Training', sessions: [
      { serviceId: 'SVC-1', name: 'Reformer — Hip & Glute Focus', status: 'completed', date: d(-42), notes: 'Targeted hip stability' },
      { serviceId: 'SVC-5', name: 'TRX Fusion — Lower Body', status: 'completed', date: d(-35), notes: 'Great ankle stability work' },
      { serviceId: 'SVC-7', name: 'Stretch & Restore — IT Band', status: 'completed', date: d(-28), notes: 'Foam roller + stretch' },
      { serviceId: 'SVC-1', name: 'Reformer — Single Leg Work', status: 'upcoming', date: d(7), notes: '' },
      { serviceId: 'SVC-5', name: 'TRX Fusion', status: 'upcoming', date: d(14), notes: '' },
    ], createdAt: d(-45), providerId: 'INS-4' },
    { id: 'PKG-6', patientId: 'CLT-1010', patientName: 'Lily Lee', name: 'Teacher Training Prep', sessions: [
      { serviceId: 'SVC-1', name: 'Reformer — Master Class', status: 'completed', date: d(-30), notes: 'Strong technique, good cueing awareness' },
      { serviceId: 'SVC-2', name: 'Mat Pilates — Classical Order', status: 'completed', date: d(-23), notes: 'Knows full classical mat' },
      { serviceId: 'SVC-10', name: 'Group Apparatus — All Equipment', status: 'in-progress', date: d(0), notes: 'Cadillac, chair, barrel rotation' },
      { serviceId: 'SVC-13', name: 'Teacher Training Orientation', status: 'upcoming', date: d(14), notes: '' },
    ], createdAt: d(-32), providerId: 'INS-6' },
    { id: 'PKG-7', patientId: 'CLT-1012', patientName: 'Aubrey Robinson', name: 'Wedding Countdown Package', sessions: [
      { serviceId: 'SVC-1', name: 'Reformer 3x/week — Month 1', status: 'completed', date: d(-60), notes: 'Building consistency, 12 classes' },
      { serviceId: 'SVC-4', name: 'Barre Burn 2x/week — Month 1', status: 'completed', date: d(-45), notes: '8 classes, great tone' },
      { serviceId: 'SVC-1', name: 'Reformer 3x/week — Month 2', status: 'completed', date: d(-30), notes: '12 classes, visible definition' },
      { serviceId: 'SVC-6', name: 'Reformer + Cardio — Intensity', status: 'upcoming', date: d(0), notes: '' },
      { serviceId: 'SVC-7', name: 'Stretch & Restore — Week Before', status: 'upcoming', date: d(21), notes: 'Relax before the big day' },
    ], createdAt: d(-65), providerId: 'INS-2' },
    { id: 'PKG-8', patientId: 'CLT-1015', patientName: 'Nora Lewis', name: 'Youth Athlete Development', sessions: [
      { serviceId: 'SVC-12', name: 'Youth Conditioning — Assessment', status: 'completed', date: d(-28), notes: 'Volleyball player, needs core stability' },
      { serviceId: 'SVC-12', name: 'Youth Conditioning #2', status: 'completed', date: d(-21), notes: 'Balance and proprioception' },
      { serviceId: 'SVC-12', name: 'Youth Conditioning #3', status: 'upcoming', date: d(0), notes: '' },
      { serviceId: 'SVC-12', name: 'Youth Conditioning #4', status: 'upcoming', date: d(7), notes: '' },
    ], createdAt: d(-30), providerId: 'INS-4' },
  ]);

  // Inventory (equipment, props, retail)
  set('rp_inventory', [
    { id: 'INV-1', name: 'Balanced Body Reformer', category: 'Equipment', sku: 'BB-REF', quantity: 12, reorderAt: 2, unitCost: 450000, location: 'LOC-1', adjustmentLog: [] },
    { id: 'INV-2', name: 'Balanced Body Reformer', category: 'Equipment', sku: 'BB-REF-2', quantity: 8, reorderAt: 2, unitCost: 450000, location: 'LOC-2', adjustmentLog: [] },
    { id: 'INV-3', name: 'Cadillac / Trapeze Table', category: 'Equipment', sku: 'BB-CAD', quantity: 2, reorderAt: 1, unitCost: 600000, location: 'LOC-1', adjustmentLog: [] },
    { id: 'INV-4', name: 'Wunda Chair', category: 'Equipment', sku: 'BB-WC', quantity: 4, reorderAt: 2, unitCost: 180000, location: 'LOC-1', adjustmentLog: [] },
    { id: 'INV-5', name: 'Ladder Barrel', category: 'Equipment', sku: 'BB-LB', quantity: 2, reorderAt: 1, unitCost: 250000, location: 'LOC-1', adjustmentLog: [] },
    { id: 'INV-6', name: 'Pilates Mat (thick)', category: 'Props', sku: 'MAT-TK', quantity: 30, reorderAt: 10, unitCost: 3500, location: 'LOC-1', adjustmentLog: [] },
    { id: 'INV-7', name: 'Resistance Bands (set of 5)', category: 'Props', sku: 'RB-5', quantity: 20, reorderAt: 8, unitCost: 1800, location: 'LOC-1', adjustmentLog: [] },
    { id: 'INV-8', name: 'Pilates Ring / Magic Circle', category: 'Props', sku: 'PR-MC', quantity: 15, reorderAt: 6, unitCost: 2200, location: 'LOC-1', adjustmentLog: [] },
    { id: 'INV-9', name: 'Foam Roller (36")', category: 'Props', sku: 'FR-36', quantity: 12, reorderAt: 5, unitCost: 2000, location: 'LOC-1', adjustmentLog: [] },
    { id: 'INV-10', name: 'TRX Suspension Trainer', category: 'Equipment', sku: 'TRX-ST', quantity: 10, reorderAt: 3, unitCost: 15000, location: 'LOC-1', adjustmentLog: [] },
    { id: 'INV-11', name: 'Barre Grip Socks (retail)', category: 'Retail', sku: 'GS-01', quantity: 45, reorderAt: 15, unitCost: 800, location: 'LOC-1', adjustmentLog: [] },
    { id: 'INV-12', name: 'Pilates Water Bottle', category: 'Retail', sku: 'RWB-01', quantity: 20, reorderAt: 8, unitCost: 1200, location: 'LOC-1', adjustmentLog: [] },
    { id: 'INV-13', name: 'Reformer Springs (set)', category: 'Parts', sku: 'SP-SET', quantity: 6, reorderAt: 3, unitCost: 8500, location: 'LOC-1', adjustmentLog: [] },
    { id: 'INV-14', name: 'Jump Board', category: 'Equipment', sku: 'JB-01', quantity: 8, reorderAt: 3, unitCost: 25000, location: 'LOC-1', adjustmentLog: [] },
    { id: 'INV-15', name: 'Barre Grip Socks (retail)', category: 'Retail', sku: 'GS-02', quantity: 3, reorderAt: 10, unitCost: 800, location: 'LOC-2', adjustmentLog: [] },
  ]);

  // Retention Alerts
  const alerts = [];
  patients.forEach(p => {
    const daysSince = Math.floor((today - new Date(p.lastVisit)) / (1000 * 60 * 60 * 24));
    if (daysSince > 80) {
      const classes = ['Reformer', 'Barre', 'Mat Pilates', 'TRX Fusion', 'Private Session'];
      const cls = classes[Math.floor(Math.random() * classes.length)];
      alerts.push({
        id: `RET-${alerts.length}`,
        patientId: p.id,
        patientName: `${p.firstName} ${p.lastName}`,
        lastVisit: p.lastVisit,
        daysSince,
        lastService: cls,
        suggestedAction: daysSince > 100 ? `${cls} follow-up overdue — send re-engagement` : `Time for ${cls} — encourage return`,
        priority: 'high',
        status: 'pending',
        contacted: false,
      });
    }
  });
  set('rp_retention_alerts', alerts);

  set('rp_social_connections', { instagram: true, facebook: true, x: false, linkedin: false, tiktok: true });
  set('rp_settings', { businessName: 'Pilates & Barre', tagline: 'Form. Strength. Balance.', email: 'hello@pilatesstudio.com', website: 'pilatesstudio.com', phone: '(555) 123-4567' });

  // Teacher Training Pipeline
  set('rp_trainees', [
    { id: 'TRN-1', name: 'Lily Lee', email: 'lily.lee@email.com', phone: '(555) 234-0110', startDate: d(-120), expectedEnd: d(90), mentor: 'INS-6', status: 'active', phase: 'Practice Teaching', observationHours: 85, observationRequired: 100, practiceHours: 32, practiceRequired: 80, apprenticeHours: 0, apprenticeRequired: 50, anatomyExam: 88, writtenExam: null, practicalExam: null, modules: [{ name: 'Mat Fundamentals', status: 'completed', date: d(-110) }, { name: 'Reformer I', status: 'completed', date: d(-90) }, { name: 'Reformer II', status: 'completed', date: d(-60) }, { name: 'Anatomy & Kinesiology', status: 'completed', date: d(-45) }, { name: 'Cadillac / Trapeze', status: 'in-progress', date: null }, { name: 'Chair & Barrel', status: 'upcoming', date: null }, { name: 'Practice Teaching Lab', status: 'in-progress', date: null }, { name: 'Business of Pilates', status: 'upcoming', date: null }, { name: 'Final Practicum', status: 'upcoming', date: null }], notes: 'Strong technique on reformer. Needs more cueing practice — tends to demonstrate instead of verbalize. Great rapport with clients.' },
    { id: 'TRN-2', name: 'Sophie Chen', email: 'sophie.chen@email.com', phone: '(555) 234-0220', startDate: d(-60), expectedEnd: d(150), mentor: 'INS-1', status: 'active', phase: 'Observation', observationHours: 40, observationRequired: 100, practiceHours: 0, practiceRequired: 80, apprenticeHours: 0, apprenticeRequired: 50, anatomyExam: null, writtenExam: null, practicalExam: null, modules: [{ name: 'Mat Fundamentals', status: 'completed', date: d(-50) }, { name: 'Reformer I', status: 'in-progress', date: null }, { name: 'Reformer II', status: 'upcoming', date: null }, { name: 'Anatomy & Kinesiology', status: 'upcoming', date: null }, { name: 'Cadillac / Trapeze', status: 'upcoming', date: null }, { name: 'Chair & Barrel', status: 'upcoming', date: null }, { name: 'Practice Teaching Lab', status: 'upcoming', date: null }, { name: 'Business of Pilates', status: 'upcoming', date: null }, { name: 'Final Practicum', status: 'upcoming', date: null }], notes: 'Former yoga teacher — excellent body awareness. Transitioning to Pilates. Very motivated, attends 5-6 classes/week.' },
    { id: 'TRN-3', name: 'Marcus Rivera', email: 'marcus.r@email.com', phone: '(555) 234-0330', startDate: d(-200), expectedEnd: d(10), mentor: 'INS-6', status: 'active', phase: 'Apprenticeship', observationHours: 100, observationRequired: 100, practiceHours: 78, practiceRequired: 80, apprenticeHours: 42, apprenticeRequired: 50, anatomyExam: 92, writtenExam: 87, practicalExam: null, modules: [{ name: 'Mat Fundamentals', status: 'completed', date: d(-190) }, { name: 'Reformer I', status: 'completed', date: d(-170) }, { name: 'Reformer II', status: 'completed', date: d(-140) }, { name: 'Anatomy & Kinesiology', status: 'completed', date: d(-120) }, { name: 'Cadillac / Trapeze', status: 'completed', date: d(-90) }, { name: 'Chair & Barrel', status: 'completed', date: d(-70) }, { name: 'Practice Teaching Lab', status: 'completed', date: d(-40) }, { name: 'Business of Pilates', status: 'completed', date: d(-20) }, { name: 'Final Practicum', status: 'in-progress', date: null }], notes: 'Almost done! Exceptional anatomy knowledge. Planning to teach at the Westside Studio after certification. Final practical exam scheduled next week.' },
    { id: 'TRN-4', name: 'Taylor Brooks', email: 'taylor.b@email.com', phone: '(555) 456-7890', startDate: d(-300), expectedEnd: d(-30), mentor: 'INS-1', status: 'graduated', phase: 'Certified', observationHours: 100, observationRequired: 100, practiceHours: 80, practiceRequired: 80, apprenticeHours: 55, apprenticeRequired: 50, anatomyExam: 95, writtenExam: 91, practicalExam: 94, modules: [{ name: 'Mat Fundamentals', status: 'completed', date: d(-290) }, { name: 'Reformer I', status: 'completed', date: d(-270) }, { name: 'Reformer II', status: 'completed', date: d(-240) }, { name: 'Anatomy & Kinesiology', status: 'completed', date: d(-210) }, { name: 'Cadillac / Trapeze', status: 'completed', date: d(-180) }, { name: 'Chair & Barrel', status: 'completed', date: d(-150) }, { name: 'Practice Teaching Lab', status: 'completed', date: d(-100) }, { name: 'Business of Pilates', status: 'completed', date: d(-60) }, { name: 'Final Practicum', status: 'completed', date: d(-30) }], notes: 'Now teaching Mat and Reformer at a nearby studio. Outstanding graduate — Alex recommended them for a Balanced Body mentorship.' },
  ]);

  localStorage.setItem('rp_initialized', 'true');
}

// Seeds data for keys that are empty — runs every load to fill gaps
function seedIfEmpty(d, today, t) {
  // Ensure settings always exist
  if (!localStorage.getItem('rp_settings')) {
    set('rp_settings', { businessName: 'Pilates & Barre', tagline: 'Form. Strength. Balance.', email: 'hello@pilatesstudio.com', website: 'pilatesstudio.com', phone: '(555) 123-4567' });
  }
  if (!localStorage.getItem('rp_social_connections')) {
    set('rp_social_connections', { instagram: true, facebook: true, x: false, linkedin: false, tiktok: true });
  }

  // Seed Sent Emails
  if (get('rp_emails', []).length === 0) set('rp_emails', [
    { id: 'EM-1', subject: 'March Newsletter — New Spring Schedule', body: 'Hi there, here is what is new this month at Pilates Studio...', audience: 'All Clients', status: 'Sent', recipientCount: 30, sentDate: d(-3) + 'T10:00:00Z' },
    { id: 'EM-2', subject: 'Exclusive: New Client Special — 3 Classes for $49', body: 'Special offer for new members...', audience: 'New Clients', status: 'Sent', recipientCount: 12, sentDate: d(-7) + 'T14:00:00Z' },
    { id: 'EM-3', subject: 'Your Class is Tomorrow!', body: 'Hi [Client], reminder about your upcoming Reformer class...', audience: 'Upcoming Bookings', status: 'Sent', recipientCount: 8, sentDate: d(-1) + 'T09:00:00Z' },
    { id: 'EM-4', subject: 'We Miss You — Come Back & Save', body: 'It has been a while since your last class...', audience: 'Lapsed Clients', status: 'Sent', recipientCount: 15, sentDate: d(-14) + 'T11:00:00Z' },
    { id: 'EM-5', subject: 'Welcome to the Pilates Family!', body: 'Thank you for becoming a member...', audience: 'Members', status: 'Sent', recipientCount: 3, sentDate: d(-21) + 'T16:00:00Z' },
  ]);

  // Seed Sent Text Messages
  if (get('rp_texts', []).length === 0) set('rp_texts', [
    { id: 'TXT-1', message: 'Hi! Reminder: your Reformer class is tomorrow at 9am. Reply C to confirm or R to reschedule.', audience: 'upcoming', recipientCount: 6, template: 'reminder', status: 'Sent', sentDate: d(-1) + 'T08:00:00Z' },
    { id: 'TXT-2', message: 'Hi! How are you feeling after your first Barre class? Any soreness is totally normal — you did great! Reply with any questions.', audience: 'all', recipientCount: 4, template: 'followup', status: 'Sent', sentDate: d(-2) + 'T10:00:00Z' },
    { id: 'TXT-3', message: 'Spring into shape! 20% off your first month of unlimited classes. Reply BOOK or visit pilatesstudio.com', audience: 'all', recipientCount: 30, template: 'promo', status: 'Sent', sentDate: d(-5) + 'T12:00:00Z' },
    { id: 'TXT-4', message: 'Thanks for taking class with us! Loved your experience? Leave us a quick review: [Google link]', audience: 'all', recipientCount: 8, template: 'review', status: 'Sent', sentDate: d(-3) + 'T15:00:00Z' },
    { id: 'TXT-5', message: 'Hi! It has been a while — we would love to see you back on the reformer. Enjoy $25 off your next class pack. Reply BOOK to schedule.', audience: 'lapsed', recipientCount: 12, template: 'reactivation', status: 'Sent', sentDate: d(-10) + 'T11:00:00Z' },
  ]);

  // Seed Social Media Posts
  if (get('rp_social_posts', []).length === 0) set('rp_social_posts', [
    { id: 'SP-1', contentType: 'service', platforms: ['instagram', 'facebook'], posts: [{ platform: 'instagram', text: 'Find your form on the reformer\n\nStrength. Balance. Control.\n\nBook your intro class — link in bio\n\n#PilatesStudio #Reformer #PilatesLife' }, { platform: 'facebook', text: 'Reformer Pilates classes for all levels. Small groups, personal attention. Book your intro today!' }], status: 'published', publishedAt: d(-2) + 'T10:00:00Z', createdAt: d(-2) + 'T09:00:00Z' },
    { id: 'SP-2', contentType: 'before-after', platforms: ['instagram'], posts: [{ platform: 'instagram', text: 'The transformation is real\n\n8 weeks of consistent Pilates\n\nStronger core. Better posture. More confidence.\n\n#PilatesTransformation #PilatesStudio #Results' }], status: 'published', publishedAt: d(-5) + 'T14:00:00Z', createdAt: d(-5) + 'T13:00:00Z' },
    { id: 'SP-3', contentType: 'promo', platforms: ['instagram', 'facebook', 'tiktok'], posts: [{ platform: 'instagram', text: 'SPRING INTO STRENGTH\n\nNew client special: 3 classes for $49\n\nLink in bio\n\n#PilatesStudio #NewClient' }, { platform: 'facebook', text: 'Spring into strength — new clients get 3 classes for just $49!' }, { platform: 'tiktok', text: 'POV: You just finished your first reformer class and you are HOOKED' }], status: 'scheduled', scheduledAt: d(2) + 'T10:00:00Z', createdAt: d(-1) + 'T16:00:00Z' },
    { id: 'SP-4', contentType: 'education', platforms: ['instagram', 'linkedin'], posts: [{ platform: 'instagram', text: 'DID YOU KNOW?\n\nPilates was originally called "Contrology" — the art of controlled movement.\n\n#PilatesFacts #PilatesStudio' }, { platform: 'linkedin', text: 'Fun fact: Joseph Pilates designed the reformer from hospital bed springs during WWI. The equipment has evolved, but the principles remain.' }], status: 'draft', createdAt: d(0) + 'T08:00:00Z' },
    { id: 'SP-5', contentType: 'team', platforms: ['instagram'], posts: [{ platform: 'instagram', text: 'Meet Alex Morgan\n\nOur founder & master trainer has been transforming bodies through Pilates for 15+ years. Named Best Pilates Studio 5 years running.\n\n#MeetTheTeam #PilatesStudio' }], status: 'published', publishedAt: d(-8) + 'T11:00:00Z', createdAt: d(-8) + 'T10:00:00Z' },
  ]);

  // Seed Check-Ins (for today's classes)
  if (get('rp_checkins', []).length === 0) {
    const appts = get('rp_appointments', []);
    const todayStr = today.toISOString().slice(0, 10);
    const todayAppts = appts.filter(a => a.date === todayStr);
    const checkins = [];
    todayAppts.slice(0, Math.min(5, todayAppts.length)).forEach((a, i) => {
      const sts = ['checked-in', 'in-class', 'complete', 'checked-in', 'in-class'];
      const minutesAgo = [45, 30, 60, 15, 8];
      checkins.push({
        id: `CK-${3000 + i}`,
        appointmentId: a.id,
        patientId: a.patientId,
        patientName: a.patientName,
        checkedInAt: new Date(today - minutesAgo[i] * 60000).toISOString(),
        verifiedInfo: { phone: '(555) 555-0100', dob: '1990-01-01', allergies: 'None', medications: 'None', pregnant: false },
        status: sts[i],
      });
    });
    set('rp_checkins', checkins);
  }
}
