'use strict';

const { scan, query, putItem, genId } = require('/opt/nodejs/dynamo');
const { ok, created, badRequest, serverError, parseBody, queryParam } = require('/opt/nodejs/response');

const TABLE = 'transactions';
const CLIENT_INDEX = 'byClient';

module.exports.handler = async function handler(event) {
  const method = event.requestContext?.http?.method || event.httpMethod;

  try {
    if (method === 'GET') {
      const clientId = queryParam(event, 'clientId');
      if (clientId) {
        const items = await query(TABLE, CLIENT_INDEX, 'clientId = :c', { ':c': clientId });
        // Sort by date descending
        items.sort((a, b) => {
          if (!a.date && !b.date) return 0;
          if (!a.date) return 1;
          if (!b.date) return -1;
          return b.date.localeCompare(a.date);
        });
        return ok(items);
      }
      const items = await scan(TABLE);
      items.sort((a, b) => {
        if (!a.date && !b.date) return 0;
        if (!a.date) return 1;
        if (!b.date) return -1;
        return b.date.localeCompare(a.date);
      });
      return ok(items);
    }

    if (method === 'POST') {
      const body = parseBody(event);
      if (!body) return badRequest('Request body is required');

      const today = new Date().toISOString();
      const newId = genId('TXN');
      const item = {
        ...body,
        id: newId,
        createdAt: today,
        date: body.date || today,
      };
      await putItem(TABLE, item);
      return created(item);
    }

    return badRequest(`Unsupported method: ${method}`);
  } catch (err) {
    return serverError(err);
  }
};
