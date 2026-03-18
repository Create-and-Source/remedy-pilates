// Standard HTTP response helpers for API Gateway
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Content-Type': 'application/json',
};

const ok = (body) => ({
  statusCode: 200,
  headers: CORS,
  body: JSON.stringify(body),
});

const created = (body) => ({
  statusCode: 201,
  headers: CORS,
  body: JSON.stringify(body),
});

const noContent = () => ({
  statusCode: 204,
  headers: CORS,
  body: '',
});

const badRequest = (message = 'Bad request') => ({
  statusCode: 400,
  headers: CORS,
  body: JSON.stringify({ error: message }),
});

const notFound = (message = 'Not found') => ({
  statusCode: 404,
  headers: CORS,
  body: JSON.stringify({ error: message }),
});

const forbidden = (message = 'Forbidden') => ({
  statusCode: 403,
  headers: CORS,
  body: JSON.stringify({ error: message }),
});

const serverError = (err) => {
  console.error('Lambda error:', err);
  return {
    statusCode: 500,
    headers: CORS,
    body: JSON.stringify({ error: 'Internal server error' }),
  };
};

// Parse body from API Gateway event
const parseBody = (event) => {
  if (!event.body) return {};
  try {
    return JSON.parse(event.isBase64Encoded
      ? Buffer.from(event.body, 'base64').toString()
      : event.body);
  } catch {
    return {};
  }
};

// Extract path parameter
const pathParam = (event, name) =>
  event.pathParameters?.[name] || null;

// Extract query parameters
const queryParam = (event, name) =>
  event.queryStringParameters?.[name] || null;

module.exports = {
  ok, created, noContent, badRequest, notFound, forbidden, serverError,
  parseBody, pathParam, queryParam,
};
