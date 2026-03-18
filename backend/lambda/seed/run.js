#!/usr/bin/env node
// ── DynamoDB Seed Script for Remedy Pilates ──────────────────────
// Mirrors initStore() from src/data/store.js → writes to DynamoDB.
// Usage: AWS_REGION=us-west-2 node lambda/seed/run.js [--force]

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, BatchWriteCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-west-2' });
const doc = DynamoDBDocumentClient.from(client, { marshallOptions: { removeUndefinedValues: true } });

const PREFIX = 'remedy-';
const t = (name) => `${PREFIX}${name}`;

async function batchPut(tableName, items) {
  const fullName = t(tableName);
  for (let i = 0; i < items.length; i += 25) {
    const chunk = items.slice(i, i + 25);
    await doc.send(new BatchWriteCommand({
      RequestItems: { [fullName]: chunk.map(item => ({ PutRequest: { Item: item } })) },
    }));
  }
  console.log(`  ✓ ${fullName}: ${items.length} items`);
}

async function putOne(tableName, item) {
  await doc.send(new PutCommand({ TableName: t(tableName), Item: item }));
  console.log(`  ✓ ${t(tableName)}: 1 item`);
}

async function isEmpty(tableName) {
  const { Items } = await doc.send(new ScanCommand({ TableName: t(tableName), Limit: 1 }));
  return !Items || Items.length === 0;
}

// ── Helpers ──────────────────────────────────────────────────────
const today = new Date();
const d = (offset) => { const dt = new Date(today); dt.setDate(dt.getDate() + offset); return dt.toISOString().slice(0, 10); };
const tt = (h, m) => `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;

// ── SEED DATA ────────────────────────────────────────────────────

const INSTRUCTORS = [
  { id: 'INS-1', name: 'Kelly Snailum', title: 'Owner & Master Trainer', specialties: ['Reformer Pilates', 'Mat Pilates', 'Barre', 'Private Training', 'Teacher Training', 'TRX'], color: '#C4704B', yearsExperience: 18, location: 'All Locations' },
  { id: 'INS-2', name: 'Megan Torres', title: 'Lead Reformer Instructor', specialties: ['Reformer Pilates', 'Reformer + Cardio', 'Private Training', 'Prenatal Pilates'], color: '#6B8F71', yearsExperience: 8, location: 'Scottsdale' },
  { id: 'INS-3', name: 'Danielle Park', title: 'Barre & TRX Specialist', specialties: ['Barre', 'TRX Fusion', 'Barre Burn', 'Group Apparatus'], color: '#8B6B94', yearsExperience: 6, location: 'Arcadia' },
  { id: 'INS-4', name: 'Rachel Kim', title: 'Pilates Instructor', specialties: ['Mat Pilates', 'Reformer Pilates', 'Stretch & Restore', 'Youth Conditioning'], color: '#5B7B8F', yearsExperience: 5, location: 'North Central' },
  { id: 'INS-5', name: 'Ava Mitchell', title: 'Pilates Instructor', specialties: ['Reformer Pilates', 'Mat Pilates', 'Barre', 'Private Training'], color: '#A68B6B', yearsExperience: 3, location: 'Scottsdale' },
  { id: 'INS-6', name: 'Jordan Reeves', title: 'Teacher Training Lead', specialties: ['Teacher Training', 'Reformer Pilates', 'Group Apparatus', 'Mat Pilates'], color: '#B85C38', yearsExperience: 12, location: 'Scottsdale' },
];

const SERVICES = [
  { id: 'SVC-1', name: 'Reformer Pilates', category: 'Pilates', duration: 55, price: 3800, unit: 'per class' },
  { id: 'SVC-2', name: 'Mat Pilates', category: 'Pilates', duration: 55, price: 2800, unit: 'per class' },
  { id: 'SVC-3', name: 'Barre', category: 'Barre', duration: 55, price: 3200, unit: 'per class' },
  { id: 'SVC-4', name: 'Barre Burn', category: 'Barre', duration: 45, price: 3200, unit: 'per class' },
  { id: 'SVC-5', name: 'TRX Fusion', category: 'TRX', duration: 45, price: 3500, unit: 'per class' },
  { id: 'SVC-6', name: 'Reformer + Cardio', category: 'Pilates', duration: 55, price: 4000, unit: 'per class' },
  { id: 'SVC-7', name: 'Stretch & Restore', category: 'Wellness', duration: 45, price: 2500, unit: 'per class' },
  { id: 'SVC-8', name: 'Private Training', category: 'Private', duration: 55, price: 9500, unit: 'per session' },
  { id: 'SVC-9', name: 'Semi-Private Training', category: 'Private', duration: 55, price: 6500, unit: 'per person' },
  { id: 'SVC-10', name: 'Group Apparatus', category: 'Pilates', duration: 55, price: 4200, unit: 'per class' },
  { id: 'SVC-11', name: 'Prenatal Pilates', category: 'Specialty', duration: 45, price: 3500, unit: 'per class' },
  { id: 'SVC-12', name: 'Youth Conditioning', category: 'Specialty', duration: 45, price: 3000, unit: 'per class' },
  { id: 'SVC-13', name: 'Teacher Training Program', category: 'Training', duration: 120, price: 0, unit: 'see pricing' },
  { id: 'SVC-14', name: 'Intro to Reformer', category: 'Intro', duration: 55, price: 0, unit: 'complimentary' },
  { id: 'SVC-15', name: 'Virtual Consultation', category: 'Consultation', duration: 30, price: 0, unit: 'complimentary' },
];

const LOCATIONS = [
  { id: 'LOC-1', name: 'Scottsdale', address: '6949 E Shea Blvd, Scottsdale, AZ 85254', phone: '(480) 699-8160', rooms: ['Reformer Studio A', 'Reformer Studio B', 'Mat Room', 'Private Suite'] },
  { id: 'LOC-2', name: 'Arcadia', address: '3629 E Indian School Rd, Phoenix, AZ 85018', phone: '(602) 237-6489', rooms: ['Reformer Studio', 'Barre Room', 'Private Suite'] },
  { id: 'LOC-3', name: 'North Central', address: '5555 N 7th St, Suite 120, Phoenix, AZ 85014', phone: '(602) 555-0300', rooms: ['Reformer Studio', 'Mat & Barre Room'] },
];

const INVENTORY = [
  { id: 'INV-1', name: 'Balanced Body Reformer', category: 'Equipment', sku: 'BB-REF', quantity: 12, reorderAt: 2, unitCost: 450000, location: 'LOC-1' },
  { id: 'INV-2', name: 'Balanced Body Reformer', category: 'Equipment', sku: 'BB-REF-2', quantity: 8, reorderAt: 2, unitCost: 450000, location: 'LOC-2' },
  { id: 'INV-3', name: 'Cadillac / Trapeze Table', category: 'Equipment', sku: 'BB-CAD', quantity: 2, reorderAt: 1, unitCost: 600000, location: 'LOC-1' },
  { id: 'INV-4', name: 'Wunda Chair', category: 'Equipment', sku: 'BB-WC', quantity: 4, reorderAt: 2, unitCost: 180000, location: 'LOC-1' },
  { id: 'INV-5', name: 'Ladder Barrel', category: 'Equipment', sku: 'BB-LB', quantity: 2, reorderAt: 1, unitCost: 250000, location: 'LOC-1' },
  { id: 'INV-6', name: 'Pilates Mat (thick)', category: 'Props', sku: 'MAT-TK', quantity: 30, reorderAt: 10, unitCost: 3500, location: 'LOC-1' },
  { id: 'INV-7', name: 'Resistance Bands (set of 5)', category: 'Props', sku: 'RB-5', quantity: 20, reorderAt: 8, unitCost: 1800, location: 'LOC-1' },
  { id: 'INV-8', name: 'Pilates Ring / Magic Circle', category: 'Props', sku: 'PR-MC', quantity: 15, reorderAt: 6, unitCost: 2200, location: 'LOC-1' },
  { id: 'INV-9', name: 'Foam Roller (36")', category: 'Props', sku: 'FR-36', quantity: 12, reorderAt: 5, unitCost: 2000, location: 'LOC-1' },
  { id: 'INV-10', name: 'TRX Suspension Trainer', category: 'Equipment', sku: 'TRX-ST', quantity: 10, reorderAt: 3, unitCost: 15000, location: 'LOC-1' },
  { id: 'INV-11', name: 'Barre Grip Socks (retail)', category: 'Retail', sku: 'GS-01', quantity: 45, reorderAt: 15, unitCost: 800, location: 'LOC-1' },
  { id: 'INV-12', name: 'Remedy Water Bottle', category: 'Retail', sku: 'RWB-01', quantity: 20, reorderAt: 8, unitCost: 1200, location: 'LOC-1' },
  { id: 'INV-13', name: 'Reformer Springs (set)', category: 'Parts', sku: 'SP-SET', quantity: 6, reorderAt: 3, unitCost: 8500, location: 'LOC-1' },
  { id: 'INV-14', name: 'Jump Board', category: 'Equipment', sku: 'JB-01', quantity: 8, reorderAt: 3, unitCost: 25000, location: 'LOC-1' },
  { id: 'INV-15', name: 'Barre Grip Socks (retail)', category: 'Retail', sku: 'GS-02', quantity: 3, reorderAt: 10, unitCost: 800, location: 'LOC-2' },
];

const SETTINGS = { businessName: 'Remedy Pilates & Barre', tagline: 'Form. Strength. Balance.', email: 'info@remedypilates.com', phone: '(480) 699-8160' };

function generateClients() {
  const firstNames = ['Emma', 'Olivia', 'Sophia', 'Ava', 'Isabella', 'Mia', 'Charlotte', 'Amelia', 'Harper', 'Evelyn', 'Abigail', 'Ella', 'Scarlett', 'Grace', 'Chloe', 'Victoria', 'Riley', 'Aria', 'Lily', 'Aubrey', 'Zoe', 'Penelope', 'Layla', 'Nora', 'Camila', 'Hannah', 'Addison', 'Luna', 'Savannah', 'Brooklyn'];
  const lastNames = ['Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Anderson', 'Taylor', 'Thomas', 'Hernandez', 'Moore', 'Martin', 'Jackson', 'Thompson', 'White', 'Lopez', 'Lee', 'Gonzalez', 'Harris', 'Clark', 'Lewis', 'Robinson', 'Walker', 'Perez', 'Hall', 'Young', 'Allen'];
  return firstNames.map((fn, i) => ({
    id: `CLT-${1000 + i}`,
    firstName: fn, lastName: lastNames[i],
    email: `${fn.toLowerCase()}.${lastNames[i].toLowerCase()}@email.com`,
    phone: `(480) 555-${String(1000 + i).slice(1)}`,
    dob: `${1970 + Math.floor(Math.random() * 30)}-${String(1 + Math.floor(Math.random() * 12)).padStart(2, '0')}-${String(1 + Math.floor(Math.random() * 28)).padStart(2, '0')}`,
    membershipTier: ['None', 'None', 'Silver', 'Gold', 'Platinum'][Math.floor(Math.random() * 5)],
    totalSpent: Math.floor(Math.random() * 500000),
    visitCount: Math.floor(1 + Math.random() * 60),
    lastVisit: d(-Math.floor(Math.random() * 120)),
    createdAt: d(-Math.floor(30 + Math.random() * 365)),
    location: ['LOC-1', 'LOC-1', 'LOC-2', 'LOC-3'][Math.floor(Math.random() * 4)],
  }));
}

function generateAppointments(clients) {
  const svcIds = ['SVC-1', 'SVC-2', 'SVC-3', 'SVC-4', 'SVC-5', 'SVC-6', 'SVC-7', 'SVC-8', 'SVC-10'];
  const insIds = ['INS-1', 'INS-2', 'INS-3', 'INS-4', 'INS-5'];
  const statuses = ['confirmed', 'confirmed', 'confirmed', 'pending', 'completed'];
  const appts = [];
  for (let dayOff = -7; dayOff <= 14; dayOff++) {
    const num = 4 + Math.floor(Math.random() * 8);
    for (let j = 0; j < num; j++) {
      const hour = 6 + Math.floor(Math.random() * 12);
      const min = [0, 15, 30, 45][Math.floor(Math.random() * 4)];
      const pat = clients[Math.floor(Math.random() * clients.length)];
      appts.push({
        id: `APT-${2000 + appts.length}`,
        patientId: pat.id,
        patientName: `${pat.firstName} ${pat.lastName}`,
        serviceId: svcIds[Math.floor(Math.random() * svcIds.length)],
        instructorId: insIds[Math.floor(Math.random() * insIds.length)],
        date: d(dayOff),
        time: tt(hour, min),
        duration: [45, 55][Math.floor(Math.random() * 2)],
        status: dayOff < 0 ? 'completed' : statuses[Math.floor(Math.random() * statuses.length)],
        location: ['LOC-1', 'LOC-1', 'LOC-2', 'LOC-3'][Math.floor(Math.random() * 4)],
        room: `Reformer Studio ${['A', 'B'][Math.floor(Math.random() * 2)]}`,
        createdAt: new Date().toISOString(),
      });
    }
  }
  return appts;
}

const EMAILS = [
  { id: 'EM-1', subject: 'March Newsletter — New Spring Schedule', audience: 'All Clients', status: 'Sent', recipientCount: 30, sentDate: d(-3) + 'T10:00:00Z' },
  { id: 'EM-2', subject: 'Exclusive: New Client Special — 3 Classes for $49', audience: 'New Clients', status: 'Sent', recipientCount: 12, sentDate: d(-7) + 'T14:00:00Z' },
  { id: 'EM-3', subject: 'Your Class is Tomorrow!', audience: 'Upcoming Bookings', status: 'Sent', recipientCount: 8, sentDate: d(-1) + 'T09:00:00Z' },
  { id: 'EM-4', subject: 'We Miss You — Come Back & Save', audience: 'Lapsed Clients', status: 'Sent', recipientCount: 15, sentDate: d(-14) + 'T11:00:00Z' },
  { id: 'EM-5', subject: 'Welcome to the Remedy Family!', audience: 'Members', status: 'Sent', recipientCount: 3, sentDate: d(-21) + 'T16:00:00Z' },
];

const TEXTS = [
  { id: 'TXT-1', message: 'Reminder: your Reformer class is tomorrow at 9am. Reply C to confirm.', audience: 'upcoming', recipientCount: 6, template: 'reminder', status: 'Sent', sentDate: d(-1) + 'T08:00:00Z' },
  { id: 'TXT-2', message: 'How are you feeling after your first Barre class? Any soreness is totally normal!', audience: 'all', recipientCount: 4, template: 'followup', status: 'Sent', sentDate: d(-2) + 'T10:00:00Z' },
  { id: 'TXT-3', message: 'Spring into shape! 20% off your first month of unlimited classes.', audience: 'all', recipientCount: 30, template: 'promo', status: 'Sent', sentDate: d(-5) + 'T12:00:00Z' },
  { id: 'TXT-4', message: 'Loved your experience? Leave us a quick review!', audience: 'all', recipientCount: 8, template: 'review', status: 'Sent', sentDate: d(-3) + 'T15:00:00Z' },
  { id: 'TXT-5', message: 'We miss you! Enjoy $25 off your next class pack. Reply BOOK to schedule.', audience: 'lapsed', recipientCount: 12, template: 'reactivation', status: 'Sent', sentDate: d(-10) + 'T11:00:00Z' },
];

const TRAINEES = [
  { id: 'TRN-1', name: 'Lily Lee', email: 'lily.lee@email.com', startDate: d(-120), expectedEnd: d(90), mentor: 'INS-6', status: 'active', phase: 'Practice Teaching', observationHours: 85, practiceHours: 32, apprenticeHours: 0 },
  { id: 'TRN-2', name: 'Sophie Chen', email: 'sophie.chen@email.com', startDate: d(-60), expectedEnd: d(150), mentor: 'INS-1', status: 'active', phase: 'Observation', observationHours: 40, practiceHours: 0, apprenticeHours: 0 },
  { id: 'TRN-3', name: 'Marcus Rivera', email: 'marcus.r@email.com', startDate: d(-200), expectedEnd: d(10), mentor: 'INS-6', status: 'active', phase: 'Apprenticeship', observationHours: 100, practiceHours: 78, apprenticeHours: 42 },
  { id: 'TRN-4', name: 'Taylor Brooks', email: 'taylor.b@email.com', startDate: d(-300), expectedEnd: d(-30), mentor: 'INS-1', status: 'graduated', phase: 'Certified', observationHours: 100, practiceHours: 80, apprenticeHours: 55 },
];

// ── MAIN ─────────────────────────────────────────────────────────
async function seed() {
  console.log('\n🧘 Remedy Pilates & Barre — DynamoDB Seed\n');

  if (!(await isEmpty('clients'))) {
    console.log('⚠️  Tables already contain data. Use --force to re-seed.');
    if (!process.argv.includes('--force')) return;
    console.log('  → Force mode: overwriting existing data\n');
  }

  const clients = generateClients();
  const appointments = generateAppointments(clients);

  // Generate retention alerts
  const alerts = [];
  clients.forEach(p => {
    const daysSince = Math.floor((today - new Date(p.lastVisit)) / (1000 * 60 * 60 * 24));
    if (daysSince > 80) {
      alerts.push({
        id: `RET-${alerts.length}`,
        patientId: p.id,
        patientName: `${p.firstName} ${p.lastName}`,
        lastVisit: p.lastVisit,
        daysSince,
        priority: 'high',
        status: 'pending',
      });
    }
  });

  await batchPut('instructors', INSTRUCTORS);
  await batchPut('services', SERVICES);
  await batchPut('locations', LOCATIONS);
  await batchPut('clients', clients);
  await batchPut('appointments', appointments);
  await batchPut('inventory', INVENTORY);
  await batchPut('emails', EMAILS);
  await batchPut('texts', TEXTS);
  await batchPut('trainees', TRAINEES);
  if (alerts.length) await batchPut('retention_alerts', alerts);

  // Settings (key-value pairs)
  for (const [key, value] of Object.entries(SETTINGS)) {
    await putOne('settings', { key, value });
  }

  console.log('\n✅ Seed complete!\n');
}

seed().catch(err => { console.error('❌ Seed failed:', err); process.exit(1); });
