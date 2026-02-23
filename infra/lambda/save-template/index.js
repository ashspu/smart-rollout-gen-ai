const { randomUUID } = require('crypto');
const { docClient, PutCommand } = require('./shared/dynamodb');
const { success, error } = require('./shared/response');

exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body || '{}');
    if (!body.name) return error('Missing template name', 400);
    if (!body.phases || !Array.isArray(body.phases) || body.phases.length === 0) {
      return error('Template must have at least one phase', 400);
    }

    const now = new Date().toISOString();
    const templateId = body.templateId || `custom-${randomUUID()}`;
    const tenantId = event.requestContext?.authorizer?.tenantId || 'default';

    const template = {
      templateId,
      tenantId,
      schemaVersion: 1,
      name: body.name.trim(),
      description: (body.description || '').trim(),
      isBuiltIn: false,
      phases: body.phases,
      createdAt: now,
      updatedAt: now,
    };

    await docClient.send(new PutCommand({
      TableName: process.env.TEMPLATES_TABLE,
      Item: template,
    }));

    console.log(JSON.stringify({ action: 'save-template', templateId, tenantId }));

    return success(template, 201);
  } catch (err) {
    console.error('save-template error:', err);
    return error(err.message);
  }
};
