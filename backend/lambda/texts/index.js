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
      return ok(items, event);
    }

    if (method === 'POST') {
      const body = parseBody(event);
      if (!body) return badRequest('Request body is required', event);

      const item = {
        ...body,
        id: genId('TXT'),
        createdAt: new Date().toISOString(),
      };

      await putItem(TABLE, item);
      return created(item, event);
    }

    return badRequest('Method not allowed', event);
  } catch (err) {
    return serverError(err, event);
  }
};
