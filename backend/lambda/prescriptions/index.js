'use strict';

const { scan, query, putItem, deleteItem, genId } = require('/opt/nodejs/dynamo');
const { ok, created, noContent, badRequest, serverError, parseBody, pathParam, queryParam } = require('/opt/nodejs/response');

const TABLE = 'prescriptions';
const GSI   = 'byClient';

module.exports.handler = async function handler(event) {
  const method = event.requestContext.http.method;

  try {
    // DELETE /{id}
    if (method === 'DELETE') {
      const id = pathParam(event, 'id');
      if (!id) return badRequest('Missing path parameter: id');
      await deleteItem(TABLE, { id });
      return noContent();
    }

    // GET
    if (method === 'GET') {
      const clientId = queryParam(event, 'clientId');
      if (clientId) {
        const items = await query(TABLE, GSI, 'patientId = :pid', { ':pid': clientId });
        return ok(items);
      }
      const items = await scan(TABLE);
      return ok(items);
    }

    // POST
    if (method === 'POST') {
      const body = parseBody(event);
      if (!body) return badRequest('Request body is required');
      const item = {
        ...body,
        id: genId('RX'),
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
