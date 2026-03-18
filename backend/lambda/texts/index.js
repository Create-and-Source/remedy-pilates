'use strict';

const { scan, putItem, genId } = require('/opt/nodejs/dynamo');
const { ok, created, badRequest, serverError, parseBody } = require('/opt/nodejs/response');

const TABLE = 'texts';

module.exports.handler = async function handler(event) {
  const method = event.requestContext.http.method;

  try {
    if (method === 'GET') {
      const items = await scan(TABLE);
      items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      return ok(items);
    }

    if (method === 'POST') {
      const body = parseBody(event);
      if (!body) return badRequest('Request body is required');

      const item = {
        ...body,
        id: genId('TXT'),
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
