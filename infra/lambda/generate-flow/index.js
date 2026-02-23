const { docClient, GetCommand, UpdateCommand } = require('./shared/dynamodb');
const { generateASL, validateASL } = require('./shared/asl-generator');
const { success, error } = require('./shared/response');
const { getAuthContext } = require('./shared/auth');

exports.handler = async (event) => {
  try {
    const { userId, email } = getAuthContext(event);
    const programId = event.pathParameters?.programId;
    if (!programId) return error('Missing programId', 400);

    const body = JSON.parse(event.body || '{}');
    const { flowDefinition } = body;
    if (!flowDefinition) return error('Missing flowDefinition in body', 400);

    // Validate flow has enabled steps
    const enabledStepCount = (flowDefinition.phases || []).reduce((sum, phase) => {
      return sum + (flowDefinition.steps?.[phase.id] || []).filter(s => s.enabled).length;
    }, 0);

    if (enabledStepCount === 0) {
      return error('Flow definition has no enabled steps', 400);
    }

    // Generate ASL artifact
    const stepHandlerArn = process.env.STEP_HANDLER_ARN ||
      'arn:aws:lambda:us-east-1:000000000000:function:smartrollout-step-handler';

    const aslDefinition = generateASL(flowDefinition, {
      stepHandlerArn,
      programId,
    });

    // Validate the generated ASL
    const validationErrors = validateASL(aslDefinition);
    if (validationErrors.length > 0) {
      console.error('ASL validation errors:', validationErrors);
      return error(`ASL validation failed: ${validationErrors.join('; ')}`, 400);
    }

    // Store in DynamoDB (ASL as artifact, not deployed as state machine)
    const now = new Date().toISOString();
    await docClient.send(new UpdateCommand({
      TableName: process.env.PROGRAMS_TABLE,
      Key: { programId },
      UpdateExpression: 'SET flowDefinition = :fd, aslDefinition = :asl, updatedAt = :now, #s = :status, statusCreatedAt = :sc',
      ExpressionAttributeNames: { '#s': 'status' },
      ExpressionAttributeValues: {
        ':fd': flowDefinition,
        ':asl': aslDefinition,
        ':now': now,
        ':status': 'active',
        ':sc': `active#${now}`,
      },
    }));

    const stateCount = Object.keys(aslDefinition.States).length;
    const phaseCount = (flowDefinition.phases || []).length;

    console.log(JSON.stringify({
      action: 'generate-flow',
      programId,
      userId,
      email,
      stateCount,
      phaseCount,
      enabledStepCount,
    }));

    return success({
      programId,
      aslDefinition,
      stateCount,
      phaseCount,
      stepCount: enabledStepCount,
      startAt: aslDefinition.StartAt,
      generatedAt: now,
    });
  } catch (err) {
    console.error('generate-flow error:', err);
    return error(err.message);
  }
};
