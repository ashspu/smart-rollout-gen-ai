const { SFNClient, DescribeExecutionCommand } = require('@aws-sdk/client-sfn');
const { docClient, QueryCommand } = require('./shared/dynamodb');
const { success, error } = require('./shared/response');
const { getAuthContext } = require('./shared/auth');

const sfnClient = new SFNClient({});

/**
 * GET /executions/{rolloutInstanceId}/status
 *
 * Returns execution status, step progress, datasets written, S3 prefix.
 * rolloutInstanceId is used as executionId in the DynamoDB table (they are the same).
 */
exports.handler = async (event) => {
  try {
    const { tenantId } = getAuthContext(event);
    const rolloutInstanceId = event.pathParameters?.rolloutInstanceId;

    if (!rolloutInstanceId) return error('Missing rolloutInstanceId', 400);

    // Query by executionId GSI (ExecutionLookup)
    const result = await docClient.send(new QueryCommand({
      TableName: process.env.EXECUTIONS_TABLE,
      IndexName: 'ExecutionLookup',
      KeyConditionExpression: 'executionId = :eid',
      ExpressionAttributeValues: {
        ':eid': rolloutInstanceId,
      },
      Limit: 1,
    }));

    if (!result.Items || result.Items.length === 0) {
      return error('Execution not found', 404);
    }

    const exec = result.Items[0];

    // If running, check SFN for latest status
    if (exec.status === 'RUNNING' && exec.sfnExecutionArn) {
      try {
        const sfnResult = await sfnClient.send(new DescribeExecutionCommand({
          executionArn: exec.sfnExecutionArn,
        }));
        if (sfnResult.status !== 'RUNNING') {
          exec.status = sfnResult.status === 'SUCCEEDED' ? 'SUCCEEDED' : 
                        sfnResult.status === 'FAILED' ? 'FAILED' : exec.status;
          if (sfnResult.stopDate) {
            exec.completedAt = sfnResult.stopDate.toISOString();
          }
        }
      } catch (sfnErr) {
        console.warn('Could not describe SFN execution:', sfnErr.message);
      }
    }

    return success({
      rolloutInstanceId: exec.rolloutInstanceId || exec.executionId,
      programId: exec.programId,
      status: exec.status,
      stepsCompleted: exec.stepsCompleted || 0,
      stepsTotal: exec.stepsTotal || 0,
      currentPhase: exec.currentPhase,
      currentStep: exec.currentStep,
      s3Prefix: exec.s3Prefix,
      datasetsWritten: exec.datasetsWritten || [],
      scenarioParams: exec.scenarioParams,
      metersCount: exec.metersCount,
      preset: exec.preset,
      stepResults: exec.stepResults || [],
      startedAt: exec.startedAt,
      completedAt: exec.completedAt,
    });

  } catch (err) {
    console.error('execution-status error:', err);
    return error(err.message);
  }
};
