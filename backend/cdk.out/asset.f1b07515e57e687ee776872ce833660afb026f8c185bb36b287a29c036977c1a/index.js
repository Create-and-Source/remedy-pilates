'use strict';

const { getItem, scan, putItem, updateItem, genId } = require('/opt/nodejs/dynamo.js');
const { ok, created, badRequest, notFound, serverError, parseBody, pathParam } = require('/opt/nodejs/response.js');

const TABLE = 'inventory';

module.exports.handler = async function handler(event) {
  const method = event.requestContext.http.method;
  const id = pathParam(event, 'id');
  const rawPath = event.rawPath || '';

  try {
    // POST /api/inventory/adjust — must be checked before generic POST
    if (method === 'POST' && rawPath.includes('/adjust')) {
      const body = parseBody(event);
      if (!body) return badRequest('Request body is required');

      const { id: itemId, delta, note } = body;
      if (!itemId) return badRequest('id is required');
      if (typeof delta !== 'number') return badRequest('delta must be a number');

      const existing = await getItem(TABLE, { id: itemId });
      if (!existing) return notFound('Inventory item not found');

      const updatedItem = {
        ...existing,
        qty: (existing.qty || 0) + delta,
        updatedAt: new Date().toISOString(),
        ...(note ? { lastAdjustmentNote: note } : {}),
      };

      await putItem(TABLE, updatedItem);
      return ok(updatedItem);
    }

    // Collection routes — no {id}
    if (!id) {
      if (method === 'GET') {
        const items = await scan(TABLE);
        return ok(items);
      }

      if (method === 'POST') {
        const body = parseBody(event);
        if (!body) return badRequest('Request body is required');

        const item = {
          ...body,
          id: genId('INV'),
          createdAt: new Date().toISOString(),
        };

        await putItem(TABLE, item);
        return created(item);
      }

      return badRequest('Method not allowed');
    }

    // Item routes — with {id}
    if (method === 'PUT') {
      const body = parseBody(event);
      if (!body) return badRequest('Request body is required');

      const updates = { ...body, updatedAt: new Date().toISOString() };
      const updated = await updateItem(TABLE, { id }, updates);
      return ok(updated);
    }

    return badRequest('Method not allowed');
  } catch (err) {
    return serverError(err);
  }
};
