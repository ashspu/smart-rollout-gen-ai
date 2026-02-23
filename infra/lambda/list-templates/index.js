const { docClient, ScanCommand } = require('./shared/dynamodb');
const { success, error } = require('./shared/response');
const { getAuthContext } = require('./shared/auth');

exports.handler = async (event) => {
  try {
    const { tenantId } = getAuthContext(event);

    // For now, scan with filter. When volume grows, switch to GSI query.
    const result = await docClient.send(new ScanCommand({
      TableName: process.env.TEMPLATES_TABLE,
      FilterExpression: 'tenantId = :tid OR isBuiltIn = :true',
      ExpressionAttributeValues: {
        ':tid': tenantId,
        ':true': true,
      },
    }));

    const templates = (result.Items || []).sort((a, b) => {
      // Built-ins first, then by createdAt descending
      if (a.isBuiltIn && !b.isBuiltIn) return -1;
      if (!a.isBuiltIn && b.isBuiltIn) return 1;
      return (b.createdAt || '').localeCompare(a.createdAt || '');
    });

    return success({ templates, count: templates.length });
  } catch (err) {
    console.error('list-templates error:', err);
    return error(err.message);
  }
};
