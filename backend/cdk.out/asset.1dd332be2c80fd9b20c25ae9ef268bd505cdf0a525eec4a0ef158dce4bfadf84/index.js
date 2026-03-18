'use strict';

const { scan, query, putItem, deleteItem, genId } = require('/opt/nodejs/dynamo');
const { ok, created, noContent, badRequest, serverError, parseBody, pathParam, queryParam } = require('/opt/nodejs/response');

const TABLE = 'waitlist';
const SERVICE_INDEX = 'byService';

module.exports.handler = async function handler(event) {
  const method = event.requestContext?.http?.method || event.httpMethod;
  const id = pathParam(event, 'id');

  try {
    if (method === 'GET') {
      const serviceId = queryParam(event, 'serviceId');
      if (serviceId) {
        const items = await query(TABLE, SERVICE_INDEX, 'serviceId = :s', { ':s': serviceId });
        return ok(items);
      }
      const items = await scan(TABLE);
      return ok(items);
    }

    if (method === 'POST') {
      const body = parseBody(event);
      if (!body) return badRequest('Request body is required');

      const newId = genId('WL');
      const item = {
        ...body,
        id: newId,
        createdAt: new Date().toISOString(),
      };
      await putItem(TABLE, item);
      return created(item);
    }

    if (method === 'DELETE') {
      if (!id) return badRequest('id path parameter is required');
      await deleteItem(TABLE, { id });
      return noContent();
    }

    return badRequest(`Unsupported method: ${method}`);
  } catch (err) {
    return serverError(err);
  }
};
