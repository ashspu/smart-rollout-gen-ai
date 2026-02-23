const { randomUUID } = require('crypto');
const { SFNClient, StartExecutionCommand } = require('@aws-sdk/client-sfn');
const { docClient, GetCommand, PutCommand } = require('./shared/dynamodb');
const { success, error } = require('./shared/response');
const { getAuthContext } = require('./shared/auth');

const sfnClient = new SFNClient({});

exports.handler = async (event) => {
  try {
    const { userId, email } = getAuthContext(event);
    const programId = event.pathParameters?.programId;
    if (!programId) return error('Missing programId', 400);

    // Load program to get flowDefinition
    const program = await docClient.send(new GetCommand({
      TableName: process.env.PROGRAMS_TABLE,
      Key: { programId },
    }));

    if (!program.Item) return error('Program not found', 404);
    if (!program.Item.flowDefinition) return error('Program has no flow definition. Generate flow first.', 400);

    const executionId = randomUUID();
    const now = new Date().toISOString();

    // Start the single parameterized state machine
    const sfnResult = await sfnClient.send(new StartExecutionCommand({
      stateMachineArn: process.env.STATE_MACHINE_ARN,
      name: `${programId}-${executionId}`.substring(0, 80),
      input: JSON.stringify({
        programId,
        executionId,
        flowDefinition: program.Item.flowDefinition,
        control: { stepIndex: 0 },
      }),
    }));

    // Record execution
    const ttl = Math.floor(Date.now() / 1000) + (90 * 24 * 60 * 60); // 90 days
    await docClient.send(new PutCommand({
      TableName: process.env.EXECUTIONS_TABLE,
      Item: {
        programId,
        executionId,
        sfnExecutionArn: sfnResult.executionArn,
        status: 'RUNNING',
        currentPhase: null,
        currentStep: null,
        stepsCompleted: 0,
        stepsTotal: countEnabledSteps(program.Item.flowDefinition),
        stepResults: [],
        startedAt: now,
        completedAt: null,
        ttl,
      },
    }));

    console.log(JSON.stringify({
      action: 'execute-flow',
      programId,
      executionId,
      userId,
      email,
      sfnExecutionArn: sfnResult.executionArn,
    }));

    return success({
      executionId,
      executionArn: sfnResult.executionArn,
      status: 'RUNNING',
      startedAt: now,
    }, 201);
  } catch (err) {
    console.error('execute-flow error:', err);
    return error(err.message);
  }
};

function countEnabledSteps(flowDefinition) {
  return (flowDefinition.phases || []).reduce((sum, phase) => {
    return sum + (flowDefinition.steps?.[phase.id] || []).filter(s => s.enabled).length;
  }, 0);
}
