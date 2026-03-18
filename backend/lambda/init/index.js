'use strict';

const { scan } = require('/opt/nodejs/dynamo');
const { ok, serverError } = require('/opt/nodejs/response');

// All tables the frontend needs on startup (matches store.js initStore endpoints)
const TABLES = {
  clients:          'clients',
  appointments:     'appointments',
  services:         'services',
  instructors:      'instructors',
  locations:        'locations',
  class_packages:   'class_packages',
  inventory:        'inventory',
  emails:           'emails',
  texts:            'texts',
  social_posts:     'social_posts',
  retention_alerts: 'retention_alerts',
  trainees:         'trainees',
  checkins:         'checkins',
};

module.exports.handler = async function handler(event) {
  try {
    // Fetch all tables in parallel — single round trip instead of 14 serial requests
    const keys = Object.keys(TABLES);
    const results = await Promise.all(
      keys.map(key => scan(TABLES[key]).catch(() => []))
    );

    const data = {};
    keys.forEach((key, i) => {
      data[key] = results[i] || [];
    });

    // Settings is key-value, merge into flat object
    try {
      const settingsRows = await scan('settings');
      data.settings = settingsRows.reduce((acc, row) => {
        if (row.key !== undefined) acc[row.key] = row.value;
        return acc;
      }, {});
    } catch {
      data.settings = {};
    }

    return ok(data, event);
  } catch (err) {
    return serverError(err, event);
  }
};
