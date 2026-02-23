const { docClient, ScanCommand, QueryCommand } = require('./shared/dynamodb');
const { success, error } = require('./shared/response');

exports.handler = async (event) => {
  try {
    const status = event.queryStringParameters?.status;
    const tenantId = 'default';

    let result;

    if (status) {
      result = await docClient.send(new QueryCommand({
        TableName: process.env.PROGRAMS_TABLE,
        IndexName: 'TenantStatusIndex',
        KeyConditionExpression: 'tenantId = :tid AND begins_with(statusCreatedAt, :prefix)',
        ExpressionAttributeValues: {
          ':tid': tenantId,
          ':prefix': `${status}#`,
        },
        ScanIndexForward: false,
      }));
    } else {
      result = await docClient.send(new ScanCommand({
        TableName: process.env.PROGRAMS_TABLE,
        FilterExpression: 'tenantId = :tid',
        ExpressionAttributeValues: { ':tid': tenantId },
      }));
    }

    // Strip heavy fields from list view
    const programs = (result.Items || []).map(({ flowDefinition, aslDefinition, ...rest }) => rest);

    return success({ programs });
  } catch (err) {
    console.error('list-programs error:', err);
    return error(err.message);
  }
};
