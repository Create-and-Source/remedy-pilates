'use strict';

const { scan, putItem, genId } = require('/opt/nodejs/dynamo.js');
const { ok, created, badRequest, serverError, parseBody } = require('/opt/nodejs/response.js');

const TABLE = 'locations';

module.exports.handler = async function handler(event) {
  const method = event.requestContext.http.method;

  try {
    if (method === 'GET') {
      const items = await scan(TABLE);
      return ok(items);
    }

    if (method === 'POST') {
      const body = parseBody(event);
      if (!body) return badRequest('Request body is required');

      const item = {
        ...body,
        id: genId('LOC'),
        createdAt: new Date().toISOString(),
      };

      await putItem(TABLE, item);
      return created(item);
    }

    return badRequest('Method not allowed');
  } catch (err) {
    return serverError(err);
  }
};
