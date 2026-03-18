'use strict';

const { getItem, scan, putItem, updateItem, genId } = require('/opt/nodejs/dynamo.js');
const { ok, created, badRequest, notFound, serverError, parseBody, pathParam } = require('/opt/nodejs/response.js');

const TABLE = 'instructors';

module.exports.handler = async function handler(event) {
  const method = event.requestContext.http.method;
  const id = pathParam(event, 'id');

  try {
    // Collection routes — no {id}
    if (!id) {
      if (method === 'GET') {
        const items = await scan(TABLE);
        return ok(items, event);
      }

      if (method === 'POST') {
        const body = parseBody(event);
        if (!body) return badRequest('Request body is required', event);

        const item = {
          ...body,
          id: genId('INS'),
          createdAt: new Date().toISOString(),
        };

        await putItem(TABLE, item);
        return created(item, event);
      }

      return badRequest('Method not allowed', event);
    }

    // Item routes — with {id}
    if (method === 'GET') {
      const item = await getItem(TABLE, { id });
      if (!item) return notFound('Instructor not found', event);
      return ok(item, event);
    }

    if (method === 'PUT') {
      const body = parseBody(event);
      if (!body) return badRequest('Request body is required', event);

      const updates = { ...body, updatedAt: new Date().toISOString() };
      const updated = await updateItem(TABLE, { id }, updates);
      return ok(updated, event);
    }

    return badRequest('Method not allowed', event);
  } catch (err) {
    return serverError(err, event);
  }
};
