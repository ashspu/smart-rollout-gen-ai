const { docClient, GetCommand } = require('./shared/dynamodb');
const { success, error } = require('./shared/response');
const { getAuthContext } = require('./shared/auth');

exports.handler = async (event) => {
  try {
    const { tenantId } = getAuthContext(event);
    const programId = event.pathParameters?.programId;
    if (!programId) return error('Missing programId', 400);

    const result = await docClient.send(new GetCommand({
      TableName: process.env.PROGRAMS_TABLE,
      Key: { programId },
    }));

    if (!result.Item) return error('Program not found', 404);
    if (result.Item.tenantId !== tenantId) return error('Program not found', 404);

    return success(result.Item);
  } catch (err) {
    console.error('get-program error:', err);
    return error(err.message);
  }
};
