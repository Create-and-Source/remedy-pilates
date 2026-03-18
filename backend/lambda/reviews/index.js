'use strict';

const { scan, query, putItem, updateItem, genId } = require('/opt/nodejs/dynamo');
const { ok, created, badRequest, serverError, parseBody, pathParam, queryParam } = require('/opt/nodejs/response');

const TABLE = 'reviews';

module.exports.handler = async function handler(event) {
  const method = event.requestContext.http.method;
  const id = pathParam(event, 'id');

  try {
    if (method === 'GET') {
      const instructorId = queryParam(event, 'instructorId');

      let items;

      if (instructorId) {
        items = await query(
          TABLE,
          'byInstructor',
          'instructorId = :instructorId',
          { ':instructorId': instructorId }
        );
      } else {
        items = await scan(TABLE);
      }

      return ok(items, event);
    }

    if (method === 'POST') {
      const body = parseBody(event);
      if (!body) return badRequest('Request body is required', event);

      const item = {
        ...body,
        id: genId('REV'),
        createdAt: new Date().toISOString(),
      };

      await putItem(TABLE, item);
      return created(item, event);
    }

    if (method === 'PUT') {
      if (!id) return badRequest('Missing id path parameter', event);
      const body = parseBody(event);
      if (!body) return badRequest('Request body is required', event);

      const updated = await updateItem(TABLE, { id }, body);
      return ok(updated, event);
    }

    return badRequest('Method not allowed', event);
  } catch (err) {
    return serverError(err, event);
  }
};
