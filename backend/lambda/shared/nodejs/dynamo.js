// Shared DynamoDB helpers for all Lambda functions
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const {
  DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand,
  DeleteCommand, ScanCommand, QueryCommand, BatchWriteCommand,
} = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({});
const doc = DynamoDBDocumentClient.from(client, {
  marshallOptions: { removeUndefinedValues: true },
});

const PREFIX = process.env.TABLE_PREFIX || 'remedy-';
const table = (name) => `${PREFIX}${name}`;

// ── Read ────────────────────────────────────────────────────────

async function getItem(tableName, key) {
  const { Item } = await doc.send(new GetCommand({
    TableName: table(tableName),
    Key: key,
  }));
  return Item || null;
}

// Full scan (all pages) — use for small tables or admin views
async function scan(tableName, filterExpr, exprValues, exprNames) {
  const params = { TableName: table(tableName) };
  if (filterExpr) {
    params.FilterExpression = filterExpr;
    if (exprValues) params.ExpressionAttributeValues = exprValues;
    if (exprNames) params.ExpressionAttributeNames = exprNames;
  }
  const items = [];
  let lastKey;
  do {
    if (lastKey) params.ExclusiveStartKey = lastKey;
    const result = await doc.send(new ScanCommand(params));
    items.push(...(result.Items || []));
    lastKey = result.LastEvaluatedKey;
  } while (lastKey);
  return items;
}

// Paginated scan — returns { items, lastKey } for cursor-based pagination
async function scanPage(tableName, { limit = 50, startKey, filterExpr, exprValues, exprNames } = {}) {
  const params = { TableName: table(tableName), Limit: limit };
  if (startKey) params.ExclusiveStartKey = startKey;
  if (filterExpr) {
    params.FilterExpression = filterExpr;
    if (exprValues) params.ExpressionAttributeValues = exprValues;
    if (exprNames) params.ExpressionAttributeNames = exprNames;
  }
  const result = await doc.send(new ScanCommand(params));
  return { items: result.Items || [], lastKey: result.LastEvaluatedKey || null };
}

// Full query (all pages)
async function query(tableName, indexName, keyExpr, exprValues, exprNames) {
  const params = {
    TableName: table(tableName),
    KeyConditionExpression: keyExpr,
    ExpressionAttributeValues: exprValues,
  };
  if (indexName) params.IndexName = indexName;
  if (exprNames) params.ExpressionAttributeNames = exprNames;
  const items = [];
  let lastKey;
  do {
    if (lastKey) params.ExclusiveStartKey = lastKey;
    const result = await doc.send(new QueryCommand(params));
    items.push(...(result.Items || []));
    lastKey = result.LastEvaluatedKey;
  } while (lastKey);
  return items;
}

// Paginated query — returns { items, lastKey }
async function queryPage(tableName, indexName, keyExpr, exprValues, { limit = 50, startKey, exprNames, scanForward = true } = {}) {
  const params = {
    TableName: table(tableName),
    KeyConditionExpression: keyExpr,
    ExpressionAttributeValues: exprValues,
    Limit: limit,
    ScanIndexForward: scanForward,
  };
  if (indexName) params.IndexName = indexName;
  if (exprNames) params.ExpressionAttributeNames = exprNames;
  if (startKey) params.ExclusiveStartKey = startKey;
  const result = await doc.send(new QueryCommand(params));
  return { items: result.Items || [], lastKey: result.LastEvaluatedKey || null };
}

// ── Write ───────────────────────────────────────────────────────

async function putItem(tableName, item) {
  await doc.send(new PutCommand({
    TableName: table(tableName),
    Item: item,
  }));
  return item;
}

async function updateItem(tableName, key, updates) {
  const entries = Object.entries(updates).filter(([k]) => !Object.keys(key).includes(k));
  if (entries.length === 0) return;

  const expr = [];
  const values = {};
  const names = {};

  for (const [k, v] of entries) {
    const safeKey = k.replace(/[^a-zA-Z0-9]/g, '_');
    expr.push(`#${safeKey} = :${safeKey}`);
    values[`:${safeKey}`] = v;
    names[`#${safeKey}`] = k;
  }

  const { Attributes } = await doc.send(new UpdateCommand({
    TableName: table(tableName),
    Key: key,
    UpdateExpression: `SET ${expr.join(', ')}`,
    ExpressionAttributeValues: values,
    ExpressionAttributeNames: names,
    ReturnValues: 'ALL_NEW',
  }));
  return Attributes;
}

async function deleteItem(tableName, key) {
  await doc.send(new DeleteCommand({
    TableName: table(tableName),
    Key: key,
  }));
}

async function batchWrite(tableName, items) {
  const fullName = table(tableName);
  const chunks = [];
  for (let i = 0; i < items.length; i += 25) {
    chunks.push(items.slice(i, i + 25));
  }
  for (const chunk of chunks) {
    let unprocessed = {
      [fullName]: chunk.map(item => ({ PutRequest: { Item: item } })),
    };
    // Retry unprocessed items with exponential backoff
    let retries = 0;
    while (unprocessed && Object.keys(unprocessed).length > 0 && retries < 5) {
      const result = await doc.send(new BatchWriteCommand({ RequestItems: unprocessed }));
      unprocessed = result.UnprocessedItems;
      if (unprocessed && Object.keys(unprocessed).length > 0) {
        retries++;
        await new Promise(r => setTimeout(r, Math.pow(2, retries) * 50));
      }
    }
  }
}

// ── ID generation ───────────────────────────────────────────────

function genId(prefix = '') {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 8);
  return prefix ? `${prefix}_${ts}${rand}` : `${ts}${rand}`;
}

module.exports = {
  getItem, scan, scanPage, query, queryPage,
  putItem, updateItem, deleteItem, batchWrite,
  genId, table, doc,
};
