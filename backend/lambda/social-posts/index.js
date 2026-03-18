'use strict';

const { scan, putItem, updateItem, deleteItem, genId } = require('/opt/nodejs/dynamo');
const { ok, created, noContent, badRequest, serverError, parseBody, pathParam } = require('/opt/nodejs/response');

const TABLE = 'social_posts';

module.exports.handler = async function handler(event) {
  const method = event.requestContext.http.method;
  const id = pathParam(event, 'id');

  try {
    if (method === 'GET') {
      const items = await scan(TABLE);
      items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      return ok(items, event);
    }

    if (method === 'POST') {
      const body = parseBody(event);
      if (!body) return badRequest('Request body is required', event);

      const item = {
        ...body,
        id: genId('SP'),
        createdAt: new Date().toISOString(),
      };

      await putItem(TABLE, item);
      return created(item, event);
    }

    if (method === 'PUT') {
      if (!id) return badRequest('Missing id path parameter', event);
      const body = parseBody(event);
      if (!body) return badRequest('Request body is required', event);

      const updated = await updateItem(TABLE, { id }, body);
      return ok(updated, event);
    }

    if (method === 'DELETE') {
      if (!id) return badRequest('Missing id path parameter', event);
      await deleteItem(TABLE, { id });
      return noContent(event);
    }

    return badRequest('Method not allowed', event);
  } catch (err) {
    return serverError(err, event);
  }
};
