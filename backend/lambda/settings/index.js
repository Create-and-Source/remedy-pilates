'use strict';

const { scan, putItem } = require('/opt/nodejs/dynamo.js');
const { ok, badRequest, serverError, parseBody } = require('/opt/nodejs/response.js');

const TABLE = 'settings';

module.exports.handler = async function handler(event) {
  const method = event.requestContext.http.method;

  try {
    if (method === 'GET') {
      const items = await scan(TABLE);

      // Merge all rows (each is { key, value }) into a single flat object
      const merged = items.reduce((acc, row) => {
        if (row.key !== undefined) {
          acc[row.key] = row.value;
        }
        return acc;
      }, {});

      return ok(merged, event);
    }

    if (method === 'PUT') {
      const body = parseBody(event);
      if (!body || typeof body !== 'object') return badRequest('Request body must be a key-value object', event);

      const entries = Object.entries(body);
      if (entries.length === 0) return badRequest('Request body must contain at least one key-value pair', event);

      await Promise.all(
        entries.map(([k, v]) => putItem(TABLE, { key: k, value: v }))
      );

      return ok({ updated: entries.length }, event);
    }

    return badRequest('Method not allowed', event);
  } catch (err) {
    return serverError(err, event);
  }
};
