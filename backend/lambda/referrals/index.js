'use strict';

const { scan, query, putItem, updateItem, genId } = require('/opt/nodejs/dynamo');
const { ok, created, badRequest, serverError, parseBody, pathParam, queryParam } = require('/opt/nodejs/response');

const REFERRALS_TABLE = 'referrals';
const SETTINGS_TABLE = 'referral_settings';

async function handleReferralSettings(method, event) {
  if (method === 'GET') {
    const items = await scan(SETTINGS_TABLE);
    // Merge array of { key, value } records into a single object
    const merged = items.reduce((acc, item) => {
      acc[item.key] = item.value;
      return acc;
    }, {});
    return ok(merged);
  }

  if (method === 'PUT') {
    const body = parseBody(event);
    if (!body) return badRequest('Request body is required');

    const puts = Object.entries(body).map(([key, value]) =>
      putItem(SETTINGS_TABLE, { key, value })
    );
    await Promise.all(puts);

    return ok(body);
  }

  return badRequest('Method not allowed');
}

async function handleReferrals(method, event) {
  const id = pathParam(event, 'id');

  if (method === 'GET') {
    const referrerId = queryParam(event, 'referrerId');

    let referrals;

    if (referrerId) {
      referrals = await query(
        REFERRALS_TABLE,
        'byReferrer',
        'referrerId = :referrerId',
        { ':referrerId': referrerId }
      );
    } else {
      referrals = await scan(REFERRALS_TABLE);
    }

    const settingsItems = await scan(SETTINGS_TABLE);
    const settings = settingsItems.reduce((acc, item) => {
      acc[item.key] = item.value;
      return acc;
    }, {});

    return ok({ referrals, settings });
  }

  if (method === 'POST') {
    const body = parseBody(event);
    if (!body) return badRequest('Request body is required');

    const item = {
      ...body,
      id: genId('REF'),
      createdAt: new Date().toISOString(),
    };

    await putItem(REFERRALS_TABLE, item);
    return created(item);
  }

  if (method === 'PUT') {
    if (!id) return badRequest('Missing id path parameter');
    const body = parseBody(event);
    if (!body) return badRequest('Request body is required');

    const updated = await updateItem(REFERRALS_TABLE, { id }, body);
    return ok(updated);
  }

  return badRequest('Method not allowed');
}

module.exports.handler = async function handler(event) {
  const method = event.requestContext.http.method;
  const rawPath = event.rawPath || '';

  try {
    if (rawPath.includes('referral-settings')) {
      return await handleReferralSettings(method, event);
    }

    return await handleReferrals(method, event);
  } catch (err) {
    return serverError(err);
  }
};
