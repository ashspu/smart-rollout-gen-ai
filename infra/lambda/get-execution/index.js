const { docClient, GetCommand } = require('./shared/dynamodb');
const { success, error } = require('./shared/response');

exports.handler = async (event) => {
  try {
    const programId = event.pathParameters?.programId;
    const executionId = event.pathParameters?.executionId;
    if (!programId) return error('Missing programId', 400);
    if (!executionId) return error('Missing executionId', 400);

    const result = await docClient.send(new GetCommand({
      TableName: process.env.EXECUTIONS_TABLE,
      Key: { programId, executionId },
    }));

    if (!result.Item) return error('Execution not found', 404);

    return success(result.Item);
  } catch (err) {
    console.error('get-execution error:', err);
    return error(err.message);
  }
};
