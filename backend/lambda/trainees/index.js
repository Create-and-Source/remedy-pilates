'use strict';

const { scan, putItem, updateItem, deleteItem, genId } = require('/opt/nodejs/dynamo');
const { ok, created, noContent, badRequest, serverError, parseBody, pathParam } = require('/opt/nodejs/response');

const TABLE = 'trainees';

module.exports.handler = async function handler(event) {
  const method = event.requestContext.http.method;

  try {
    // DELETE /{id}
    if (method === 'DELETE') {
      const id = pathParam(event, 'id');
      if (!id) return badRequest('Missing path parameter: id', event);
      await deleteItem(TABLE, { id });
      return noContent(event);
    }

    // PUT /{id}
    if (method === 'PUT') {
      const id = pathParam(event, 'id');
      if (!id) return badRequest('Missing path parameter: id', event);
      const body = parseBody(event);
      if (!body) return badRequest('Request body is required', event);
      const updated = await updateItem(TABLE, { id }, body);
      return ok(updated, event);
    }

    // GET
    if (method === 'GET') {
      const items = await scan(TABLE);
      return ok(items, event);
    }

    // POST
    if (method === 'POST') {
      const body = parseBody(event);
      if (!body) return badRequest('Request body is required', event);
      const item = {
        ...body,
        id: genId('TRN'),
        createdAt: new Date().toISOString(),
      };
      await putItem(TABLE, item);
      return created(item, event);
    }

    return badRequest(`Unsupported method: ${method}`, event);
  } catch (err) {
    return serverError(err, event);
  }
};
