'use strict';

const { scan, query, putItem, updateItem, deleteItem, genId } = require('/opt/nodejs/dynamo');
const { ok, created, noContent, badRequest, serverError, parseBody, pathParam, queryParam } = require('/opt/nodejs/response');

const MEMBERSHIPS_TABLE = 'memberships';
const PACKAGES_TABLE = 'membership_packages';
const CLIENT_INDEX = 'byClient';
const TIER_INDEX = 'byTier';

module.exports.handler = async function handler(event) {
  const method = event.requestContext?.http?.method || event.httpMethod;
  const rawPath = event.rawPath || '';
  const isPackagesRoute = rawPath.includes('membership-packages');
  const id = pathParam(event, 'id');

  try {
    // ── membership-packages routes ──────────────────────────────────────────
    if (isPackagesRoute) {
      if (method === 'GET') {
        const packages = await scan(PACKAGES_TABLE);
        return ok(packages, event);
      }

      if (method === 'POST') {
        const body = parseBody(event);
        if (!body) return badRequest('Request body is required', event);

        const newId = genId('MPKG');
        const item = { ...body, id: newId };
        await putItem(PACKAGES_TABLE, item);
        return created(item, event);
      }

      if (method === 'PUT') {
        if (!id) return badRequest('id path parameter is required', event);
        const body = parseBody(event);
        if (!body) return badRequest('Request body is required', event);

        const updated = await updateItem(PACKAGES_TABLE, { id }, body);
        return ok(updated, event);
      }

      return badRequest(`Unsupported method for membership-packages: ${method}`, event);
    }

    // ── memberships routes ──────────────────────────────────────────────────
    if (method === 'GET') {
      const clientId = queryParam(event, 'clientId');
      const tier = queryParam(event, 'tier');

      let memberships;
      if (clientId) {
        memberships = await query(MEMBERSHIPS_TABLE, CLIENT_INDEX, 'clientId = :c', { ':c': clientId });
      } else if (tier) {
        memberships = await query(MEMBERSHIPS_TABLE, TIER_INDEX, 'tier = :t', { ':t': tier });
      } else {
        memberships = await scan(MEMBERSHIPS_TABLE);
      }

      const packages = await scan(PACKAGES_TABLE);
      return ok({ memberships, packages }, event);
    }

    if (method === 'POST') {
      const body = parseBody(event);
      if (!body) return badRequest('Request body is required', event);

      const newId = genId('MBR');
      const item = {
        ...body,
        id: newId,
        createdAt: new Date().toISOString(),
      };
      await putItem(MEMBERSHIPS_TABLE, item);
      return created(item, event);
    }

    if (method === 'PUT') {
      if (!id) return badRequest('id path parameter is required', event);
      const body = parseBody(event);
      if (!body) return badRequest('Request body is required', event);

      const updated = await updateItem(MEMBERSHIPS_TABLE, { id }, body);
      return ok(updated, event);
    }

    if (method === 'DELETE') {
      if (!id) return badRequest('id path parameter is required', event);
      await deleteItem(MEMBERSHIPS_TABLE, { id });
      return noContent(event);
    }

    return badRequest(`Unsupported method: ${method}`, event);
  } catch (err) {
    return serverError(err, event);
  }
};
