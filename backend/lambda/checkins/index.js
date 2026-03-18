'use strict';

const { getItem, scan, query, putItem, genId } = require('/opt/nodejs/dynamo');
const { ok, created, badRequest, serverError, parseBody, queryParam } = require('/opt/nodejs/response');

const TABLE = 'checkins';
const DATE_INDEX = 'byDate';

module.exports.handler = async function handler(event) {
  const method = event.requestContext?.http?.method || event.httpMethod;

  try {
    if (method === 'GET') {
      const date = queryParam(event, 'date');
      if (date) {
        const items = await query(TABLE, DATE_INDEX, 'date = :d', { ':d': date });
        return ok(items, event);
      }
      const items = await scan(TABLE);
      return ok(items, event);
    }

    if (method === 'POST') {
      const body = parseBody(event);
      if (!body) return badRequest('Request body is required', event);

      const id = genId('CHK');
      const item = {
        ...body,
        id,
        createdAt: new Date().toISOString(),
        expiresAt: Math.floor(Date.now() / 1000) + 90 * 86400, // TTL: 90 days
      };
      await putItem(TABLE, item);
      return created(item, event);
    }

    return badRequest(`Unsupported method: ${method}`, event);
  } catch (err) {
    return serverError(err, event);
  }
};
