'use strict';

const { scan, query, putItem, updateItem, genId } = require('/opt/nodejs/dynamo');
const { ok, created, badRequest, serverError, parseBody, pathParam, queryParam } = require('/opt/nodejs/response');

const TABLE = 'inbox';

module.exports.handler = async function handler(event) {
  const method = event.requestContext.http.method;
  const id = pathParam(event, 'id');

  try {
    if (method === 'GET') {
      const clientId = queryParam(event, 'clientId');

      let items;

      if (clientId) {
        items = await query(
          TABLE,
          'byClient',
          'clientId = :clientId',
          { ':clientId': clientId }
        );
      } else {
        items = await scan(TABLE);
      }

      items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      return ok(items);
    }

    if (method === 'POST') {
      const body = parseBody(event);
      if (!body) return badRequest('Request body is required');

      const item = {
        ...body,
        id: genId('MSG'),
        createdAt: new Date().toISOString(),
        read: false,
      };

      await putItem(TABLE, item);
      return created(item);
    }

    if (method === 'PUT') {
      if (!id) return badRequest('Missing id path parameter');
      const body = parseBody(event);
      if (!body) return badRequest('Request body is required');

      const updated = await updateItem(TABLE, { id }, body);
      return ok(updated);
    }

    return badRequest('Method not allowed');
  } catch (err) {
    return serverError(err);
  }
};
