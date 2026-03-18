'use strict';

const { getItem, scan, query, putItem, updateItem, deleteItem, genId } = require('/opt/nodejs/dynamo.js');
const { ok, created, noContent, badRequest, notFound, serverError, parseBody, pathParam, queryParam } = require('/opt/nodejs/response.js');

const TABLE = 'class_packages';

module.exports.handler = async function handler(event) {
  const method = event.requestContext.http.method;
  const id = pathParam(event, 'id');

  try {
    // Collection routes — no {id}
    if (!id) {
      if (method === 'GET') {
        const clientId = queryParam(event, 'clientId');

        if (clientId) {
          const items = await query(
            TABLE,
            'byClient',
            'patientId = :v',
            { ':v': clientId }
          );
          return ok(items, event);
        }

        const items = await scan(TABLE);
        return ok(items, event);
      }

      if (method === 'POST') {
        const body = parseBody(event);
        if (!body) return badRequest('Request body is required', event);

        const item = {
          ...body,
          id: genId('PKG'),
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
      if (!item) return notFound('Package not found', event);
      return ok(item, event);
    }

    if (method === 'PUT') {
      const body = parseBody(event);
      if (!body) return badRequest('Request body is required', event);

      const updates = { ...body, updatedAt: new Date().toISOString() };
      const updated = await updateItem(TABLE, { id }, updates);
      return ok(updated, event);
    }

    if (method === 'DELETE') {
      await deleteItem(TABLE, { id });
      return noContent(event);
    }

    return badRequest('Method not allowed', event);
  } catch (err) {
    return serverError(err, event);
  }
};
