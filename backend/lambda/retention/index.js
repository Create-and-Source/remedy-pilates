'use strict';

const { scan, query, updateItem } = require('/opt/nodejs/dynamo');
const { ok, badRequest, serverError, parseBody, pathParam, queryParam } = require('/opt/nodejs/response');

const TABLE = 'retention_alerts';

module.exports.handler = async function handler(event) {
  const method = event.requestContext.http.method;
  const id = pathParam(event, 'id');

  try {
    if (method === 'GET') {
      const status = queryParam(event, 'status');
      const clientId = queryParam(event, 'clientId');

      let items;

      if (status) {
        items = await query(
          TABLE,
          'byStatus',
          'status = :status',
          { ':status': status }
        );
      } else if (clientId) {
        items = await query(
          TABLE,
          'byClient',
          'patientId = :patientId',
          { ':patientId': clientId }
        );
      } else {
        items = await scan(TABLE);
      }

      return ok(items, event);
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
