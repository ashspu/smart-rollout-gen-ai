const { docClient, PutCommand, GetCommand, QueryCommand } = require('./shared/dynamodb');
const { success, error } = require('./shared/response');
const { getAuthContext } = require('./shared/auth');

const TABLE = process.env.STEP_CONFIGS_TABLE;

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return success('');
  }

  try {
    const { tenantId, email } = getAuthContext(event);
    const method = event.httpMethod;
    const programId = event.pathParameters?.programId;
    const phaseId = event.pathParameters?.phaseId;
    const stepId = event.pathParameters?.stepId;
    const version = event.pathParameters?.version;
    const resource = event.resource;

    if (!programId) return error('Missing programId', 400);

    // GET /programs/{programId}/step-configs — list all current configs
    if (method === 'GET' && resource.endsWith('/step-configs')) {
      return await listAllConfigs(programId, tenantId);
    }

    if (!phaseId || !stepId) return error('Missing phaseId or stepId', 400);

    // GET .../config/versions
    if (method === 'GET' && resource.endsWith('/versions')) {
      return await listVersions(programId, phaseId, stepId, tenantId);
    }

    // POST .../config/rollback/{version}
    if (method === 'POST' && version) {
      return await rollback(programId, phaseId, stepId, parseInt(version, 10), tenantId, email);
    }

    // GET .../config
    if (method === 'GET') {
      return await getConfig(programId, phaseId, stepId, tenantId);
    }

    // PUT .../config
    if (method === 'PUT') {
      const body = JSON.parse(event.body || '{}');
      return await saveConfig(programId, phaseId, stepId, body, tenantId, email);
    }

    // DELETE .../config
    if (method === 'DELETE') {
      return await deleteConfig(programId, phaseId, stepId, tenantId, email);
    }

    return error('Not found', 404);
  } catch (err) {
    console.error('step-config error:', err);
    return error(err.message);
  }
};

async function listAllConfigs(programId, tenantId) {
  const result = await docClient.send(new QueryCommand({
    TableName: TABLE,
    KeyConditionExpression: 'programId = :pk AND begins_with(sk, :prefix)',
    ExpressionAttributeValues: { ':pk': programId, ':prefix': 'CONFIG#' },
  }));
  const items = (result.Items || [])
    .filter(item => item.tenantId === tenantId && !item.isDeleted);
  return success({ configs: items });
}

async function getConfig(programId, phaseId, stepId, tenantId) {
  const result = await docClient.send(new GetCommand({
    TableName: TABLE,
    Key: { programId, sk: `CONFIG#${phaseId}#${stepId}` },
  }));
  if (!result.Item || result.Item.tenantId !== tenantId || result.Item.isDeleted) {
    return error('Config not found', 404);
  }
  return success(result.Item);
}

async function saveConfig(programId, phaseId, stepId, body, tenantId, email) {
  const now = new Date().toISOString();
  const configSk = `CONFIG#${phaseId}#${stepId}`;

  // Get current to determine next version
  const existing = await docClient.send(new GetCommand({
    TableName: TABLE,
    Key: { programId, sk: configSk },
  }));
  if (existing.Item && existing.Item.tenantId !== tenantId) {
    return error('Forbidden', 403);
  }

  const nextVersion = (existing.Item?.version || 0) + 1;

  // Extract the inner config payload
  const config = body.formConfig || body.apiConfig || body.webhookConfig || {};

  const item = {
    programId,
    sk: configSk,
    tenantId,
    phaseId,
    stepId,
    configType: body.configType,
    config,
    version: nextVersion,
    isDeleted: false,
    createdBy: email,
    createdAt: existing.Item?.createdAt || now,
    updatedAt: now,
  };

  // Write current config
  await docClient.send(new PutCommand({ TableName: TABLE, Item: item }));

  // Write version snapshot
  const versionSk = `VERSION#${phaseId}#${stepId}#v${String(nextVersion).padStart(4, '0')}`;
  await docClient.send(new PutCommand({
    TableName: TABLE,
    Item: { ...item, sk: versionSk },
  }));

  console.log(JSON.stringify({ action: 'save-step-config', programId, phaseId, stepId, version: nextVersion }));
  return success(item);
}

async function deleteConfig(programId, phaseId, stepId, tenantId, email) {
  const configSk = `CONFIG#${phaseId}#${stepId}`;
  const existing = await docClient.send(new GetCommand({
    TableName: TABLE,
    Key: { programId, sk: configSk },
  }));
  if (!existing.Item || existing.Item.tenantId !== tenantId) {
    return error('Config not found', 404);
  }

  const now = new Date().toISOString();
  const nextVersion = (existing.Item.version || 0) + 1;

  const deletedItem = {
    ...existing.Item,
    isDeleted: true,
    version: nextVersion,
    updatedAt: now,
    deletedBy: email,
  };
  await docClient.send(new PutCommand({ TableName: TABLE, Item: deletedItem }));

  // Version snapshot for the deletion
  const versionSk = `VERSION#${phaseId}#${stepId}#v${String(nextVersion).padStart(4, '0')}`;
  await docClient.send(new PutCommand({
    TableName: TABLE,
    Item: { ...deletedItem, sk: versionSk },
  }));

  console.log(JSON.stringify({ action: 'delete-step-config', programId, phaseId, stepId }));
  return success({ deleted: true, version: nextVersion });
}

async function listVersions(programId, phaseId, stepId, tenantId) {
  const result = await docClient.send(new QueryCommand({
    TableName: TABLE,
    KeyConditionExpression: 'programId = :pk AND begins_with(sk, :prefix)',
    ExpressionAttributeValues: {
      ':pk': programId,
      ':prefix': `VERSION#${phaseId}#${stepId}#`,
    },
    ScanIndexForward: false, // newest first
  }));
  const items = (result.Items || []).filter(item => item.tenantId === tenantId);
  return success({ versions: items });
}

async function rollback(programId, phaseId, stepId, targetVersion, tenantId, email) {
  // Fetch the target version
  const versionSk = `VERSION#${phaseId}#${stepId}#v${String(targetVersion).padStart(4, '0')}`;
  const versionResult = await docClient.send(new GetCommand({
    TableName: TABLE,
    Key: { programId, sk: versionSk },
  }));
  if (!versionResult.Item || versionResult.Item.tenantId !== tenantId) {
    return error('Version not found', 404);
  }

  // Get current to determine next version number
  const configSk = `CONFIG#${phaseId}#${stepId}`;
  const current = await docClient.send(new GetCommand({
    TableName: TABLE,
    Key: { programId, sk: configSk },
  }));
  const nextVersion = (current.Item?.version || 0) + 1;
  const now = new Date().toISOString();

  const rolledBackItem = {
    ...versionResult.Item,
    sk: configSk,
    version: nextVersion,
    isDeleted: false,
    rolledBackFrom: targetVersion,
    updatedAt: now,
    createdBy: email,
  };
  await docClient.send(new PutCommand({ TableName: TABLE, Item: rolledBackItem }));

  // Write version snapshot for the rollback
  const newVersionSk = `VERSION#${phaseId}#${stepId}#v${String(nextVersion).padStart(4, '0')}`;
  await docClient.send(new PutCommand({
    TableName: TABLE,
    Item: { ...rolledBackItem, sk: newVersionSk },
  }));

  console.log(JSON.stringify({ action: 'rollback-step-config', programId, phaseId, stepId, from: targetVersion, to: nextVersion }));
  return success(rolledBackItem);
}
