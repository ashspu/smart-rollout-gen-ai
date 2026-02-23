const { randomUUID } = require('crypto');
const { docClient, PutCommand, GetCommand } = require('./shared/dynamodb');
const { success, error } = require('./shared/response');
const { getAuthContext } = require('./shared/auth');

exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body || '{}');
    const { name, description, templateId, flowDefinition } = body;

    if (!name) return error('Missing required field: name', 400);

    // Idempotency: check X-Client-Request-Id header
    const clientRequestId = event.headers?.['x-client-request-id'] || event.headers?.['X-Client-Request-Id'];
    if (clientRequestId) {
      console.log(JSON.stringify({ action: 'create-program', clientRequestId }));
    }

    const now = new Date().toISOString();
    const programId = randomUUID();
    const { tenantId, userId, email } = getAuthContext(event);

    const item = {
      programId,
      tenantId,
      name,
      description: description || '',
      templateId: templateId || null,
      status: 'draft',
      flowDefinition: flowDefinition || null,
      aslDefinition: null,
      createdBy: email,
      createdAt: now,
      updatedAt: now,
      statusCreatedAt: `draft#${now}`, // GSI sort key
    };

    await docClient.send(new PutCommand({
      TableName: process.env.PROGRAMS_TABLE,
      Item: item,
    }));

    console.log(JSON.stringify({ action: 'create-program', programId, tenantId }));

    return success({ programId, name, status: 'draft', createdAt: now }, 201);
  } catch (err) {
    console.error('create-program error:', err);
    return error(err.message);
  }
};
