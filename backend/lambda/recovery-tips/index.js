'use strict';

const { scan, putItem, updateItem, genId } = require('/opt/nodejs/dynamo');
const { ok, created, badRequest, serverError, parseBody, pathParam } = require('/opt/nodejs/response');

const TABLE = 'recovery_tips';

module.exports.handler = async function handler(event) {
  const method = event.requestContext.http.method;

  try {
    // PUT /{id}
    if (method === 'PUT') {
      const id = pathParam(event, 'id');
      if (!id) return badRequest('Missing path parameter: id');
      const body = parseBody(event);
      if (!body) return badRequest('Request body is required');
      const updated = await updateItem(TABLE, { id }, body);
      return ok(updated);
    }

    // GET
    if (method === 'GET') {
      const items = await scan(TABLE);
      return ok(items);
    }

    // POST
    if (method === 'POST') {
      const body = parseBody(event);
      if (!body) return badRequest('Request body is required');
      const item = {
        ...body,
        id: genId('TIP'),
        createdAt: new Date().toISOString(),
      };
      await putItem(TABLE, item);
      return created(item);
    }

    return badRequest(`Unsupported method: ${method}`);
  } catch (err) {
    return serverError(err);
  }
};
