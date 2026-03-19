// Standard HTTP response helpers for API Gateway
// CORS: reflect the request origin if it matches allowed origins, else deny

const ALLOWED_ORIGINS = new Set([
  'http://localhost:5173',
  'https://pilatesstudio.com',
]);

function corsHeaders(event) {
  const origin = event?.headers?.origin || '';
  // If origin matches allowed list, reflect it. If no event passed (legacy call), use first allowed origin.
  const matched = ALLOWED_ORIGINS.has(origin) ? origin : (!event ? [...ALLOWED_ORIGINS][0] : '');
  return {
    'Access-Control-Allow-Origin': matched,
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Content-Type': 'application/json',
    'Vary': 'Origin',
  };
}

const ok = (body, event) => ({
  statusCode: 200,
  headers: corsHeaders(event),
  body: JSON.stringify(body),
});

const created = (body, event) => ({
  statusCode: 201,
  headers: corsHeaders(event),
  body: JSON.stringify(body),
});

const noContent = (event) => ({
  statusCode: 204,
  headers: corsHeaders(event),
  body: '',
});

const badRequest = (message = 'Bad request', event) => ({
  statusCode: 400,
  headers: corsHeaders(event),
  body: JSON.stringify({ error: message }),
});

const notFound = (message = 'Not found', event) => ({
  statusCode: 404,
  headers: corsHeaders(event),
  body: JSON.stringify({ error: message }),
});

const forbidden = (message = 'Forbidden', event) => ({
  statusCode: 403,
  headers: corsHeaders(event),
  body: JSON.stringify({ error: message }),
});

const serverError = (err, event) => {
  console.error('Lambda error:', err);
  return {
    statusCode: 500,
    headers: corsHeaders(event),
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
