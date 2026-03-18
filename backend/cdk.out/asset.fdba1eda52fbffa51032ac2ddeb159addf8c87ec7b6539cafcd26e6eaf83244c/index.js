'use strict';

const { scan, query, putItem, updateItem, genId } = require('/opt/nodejs/dynamo');
const { ok, created, badRequest, serverError, parseBody, pathParam, queryParam } = require('/opt/nodejs/response');

const TABLE = 'wallet';
const CLIENT_INDEX = 'byClient';

module.exports.handler = async function handler(event) {
  const method = event.requestContext?.http?.method || event.httpMethod;
  const id = pathParam(event, 'id');

  try {
    if (method === 'GET') {
      const clientId = queryParam(event, 'clientId');
      if (clientId) {
        const items = await query(TABLE, CLIENT_INDEX, 'clientId = :c', { ':c': clientId });
        return ok(items);
      }
      const items = await scan(TABLE);
      return ok(items);
    }

    if (method === 'POST') {
      const body = parseBody(event);
      if (!body) return badRequest('Request body is required');

      const newId = genId('WAL');
      const item = {
        ...body,
        id: newId,
      };
      await putItem(TABLE, item);
      return created(item);
    }

    if (method === 'PUT') {
      if (!id) return badRequest('id path parameter is required');
      const body = parseBody(event);
      if (!body) return badRequest('Request body is required');

      const updated = await updateItem(TABLE, { id }, body);
      return ok(updated);
    }

    return badRequest(`Unsupported method: ${method}`);
  } catch (err) {
    return serverError(err);
  }
};
