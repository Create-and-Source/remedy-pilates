'use strict';

const { scan, query, putItem, updateItem, genId } = require('/opt/nodejs/dynamo');
const { ok, created, badRequest, serverError, parseBody, pathParam, queryParam } = require('/opt/nodejs/response');

const TABLE = 'charts';
const GSI   = 'byClient';

module.exports.handler = async function handler(event) {
  const method = event.requestContext.http.method;

  try {
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
      const clientId = queryParam(event, 'clientId');
      if (clientId) {
        const items = await query(TABLE, GSI, 'patientId = :pid', { ':pid': clientId });
        return ok(items, event);
      }
      const items = await scan(TABLE);
      return ok(items, event);
    }

    // POST
    if (method === 'POST') {
      const body = parseBody(event);
      if (!body) return badRequest('Request body is required', event);
      const item = {
        ...body,
        id: genId('CHT'),
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
