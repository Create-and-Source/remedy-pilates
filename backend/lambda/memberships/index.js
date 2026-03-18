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
        return ok(packages);
      }

      if (method === 'POST') {
        const body = parseBody(event);
        if (!body) return badRequest('Request body is required');

        const newId = genId('MPKG');
        const item = { ...body, id: newId };
        await putItem(PACKAGES_TABLE, item);
        return created(item);
      }

      if (method === 'PUT') {
        if (!id) return badRequest('id path parameter is required');
        const body = parseBody(event);
        if (!body) return badRequest('Request body is required');

        const updated = await updateItem(PACKAGES_TABLE, { id }, body);
        return ok(updated);
      }

      return badRequest(`Unsupported method for membership-packages: ${method}`);
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
      return ok({ memberships, packages });
    }

    if (method === 'POST') {
      const body = parseBody(event);
      if (!body) return badRequest('Request body is required');

      const newId = genId('MBR');
      const item = {
        ...body,
        id: newId,
        createdAt: new Date().toISOString(),
      };
      await putItem(MEMBERSHIPS_TABLE, item);
      return created(item);
    }

    if (method === 'PUT') {
      if (!id) return badRequest('id path parameter is required');
      const body = parseBody(event);
      if (!body) return badRequest('Request body is required');

      const updated = await updateItem(MEMBERSHIPS_TABLE, { id }, body);
      return ok(updated);
    }

    if (method === 'DELETE') {
      if (!id) return badRequest('id path parameter is required');
      await deleteItem(MEMBERSHIPS_TABLE, { id });
      return noContent();
    }

    return badRequest(`Unsupported method: ${method}`);
  } catch (err) {
    return serverError(err);
  }
};
