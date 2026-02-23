const { docClient, QueryCommand } = require('./shared/dynamodb');
const { success, error } = require('./shared/response');
const { getAuthContext } = require('./shared/auth');

exports.handler = async (event) => {
  try {
    const { userId } = getAuthContext(event);
    const programId = event.pathParameters?.programId;
    if (!programId) return error('Missing programId', 400);

    const limit = parseInt(event.queryStringParameters?.limit || '25', 10);

    const result = await docClient.send(new QueryCommand({
      TableName: process.env.EXECUTIONS_TABLE,
      KeyConditionExpression: 'programId = :pid',
      ExpressionAttributeValues: { ':pid': programId },
      ScanIndexForward: false, // newest first
      Limit: Math.min(limit, 100),
    }));

    return success({
      executions: result.Items || [],
      count: result.Count || 0,
    });
  } catch (err) {
    console.error('list-executions error:', err);
    return error(err.message);
  }
};
