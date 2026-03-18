'use strict';

const { getItem, scan, query, putItem, updateItem, deleteItem, genId } = require('/opt/nodejs/dynamo.js');
const { ok, created, noContent, badRequest, notFound, serverError, parseBody, pathParam, queryParam } = require('/opt/nodejs/response.js');

const TABLE = 'clients';

module.exports.handler = async function handler(event) {
  const method = event.requestContext.http.method;
  const id = pathParam(event, 'id');

  try {
    // Collection routes — no {id}
    if (!id) {
      if (method === 'GET') {
        const instructor = queryParam(event, 'instructor');
        const email = queryParam(event, 'email');

        if (instructor) {
          const items = await query(
            TABLE,
            'byInstructor',
            'preferredInstructor = :v',
            { ':v': instructor }
          );
          return ok(items);
        }

        if (email) {
          const items = await query(
            TABLE,
            'byEmail',
            'email = :v',
            { ':v': email }
          );
          return ok(items);
        }

        const items = await scan(TABLE);
        return ok(items);
      }

      if (method === 'POST') {
        const body = parseBody(event);
        if (!body) return badRequest('Request body is required');

        const item = {
          ...body,
          id: genId('CLT'),
          createdAt: new Date().toISOString(),
        };

        await putItem(TABLE, item);
        return created(item);
      }

      return badRequest('Method not allowed');
    }

    // Item routes — with {id}
    if (method === 'GET') {
      const item = await getItem(TABLE, { id });
      if (!item) return notFound('Client not found');
      return ok(item);
    }

    if (method === 'PUT') {
      const body = parseBody(event);
      if (!body) return badRequest('Request body is required');

      const updates = { ...body, updatedAt: new Date().toISOString() };
      const updated = await updateItem(TABLE, { id }, updates);
      return ok(updated);
    }

    if (method === 'DELETE') {
      await deleteItem(TABLE, { id });
      return noContent();
    }

    return badRequest('Method not allowed');
  } catch (err) {
    return serverError(err);
  }
};
