const { docClient, UpdateCommand } = require('./shared/dynamodb');

/**
 * Called BY the state machine to determine the next step to execute.
 * Reads the flowDefinition and current stepIndex to return step metadata.
 * When all steps are done, marks the execution as SUCCEEDED in DynamoDB.
 *
 * Input shape (from state machine):
 *   { programId, executionId, rolloutInstanceId, flowDefinition, control: { stepIndex } }
 *
 * Output shape:
 *   { ..., currentStep: { phaseId, phaseName, stepId, stepName, ... }, done: boolean }
 */
exports.handler = async (event) => {
  const { programId, executionId, rolloutInstanceId = executionId, flowDefinition, control } = event;
  const stepIndex = control?.stepIndex ?? 0;

  // Flatten all enabled steps across phases in order
  const allSteps = [];
  for (const phase of (flowDefinition.phases || [])) {
    const phaseSteps = (flowDefinition.steps?.[phase.id] || []).filter(s => s.enabled);
    for (const step of phaseSteps) {
      allSteps.push({
        phaseId: phase.id,
        phaseName: phase.name,
        stepId: step.id,
        stepName: step.name,
        stepDetail: step.detail || '',
        isMilestone: !!step.milestone,
        isCustom: !!step.custom,
        conformanceTarget: step.conformance ?? 100,
        stepIndex: allSteps.length,
      });
    }
  }

  console.log(JSON.stringify({
    action: 'determine-next-step',
    programId,
    executionId,
    rolloutInstanceId,
    stepIndex,
    totalSteps: allSteps.length,
  }));

  // Check if all steps are done
  if (stepIndex >= allSteps.length) {
    // Mark execution as SUCCEEDED in DynamoDB
    try {
      await docClient.send(new UpdateCommand({
        TableName: process.env.EXECUTIONS_TABLE,
        Key: { programId, executionId: rolloutInstanceId },
        UpdateExpression: 'SET #status = :s, completedAt = :now, updatedAt = :now',
        ExpressionAttributeNames: { '#status': 'status' },
        ExpressionAttributeValues: {
          ':s': 'SUCCEEDED',
          ':now': new Date().toISOString(),
        },
      }));
      console.log(JSON.stringify({ action: 'execution-complete', rolloutInstanceId, programId, status: 'SUCCEEDED' }));
    } catch (err) {
      console.error('Failed to mark execution as SUCCEEDED:', err.message);
    }

    return {
      programId,
      executionId,
      rolloutInstanceId,
      flowDefinition,
      control: { stepIndex },
      done: true,
    };
  }

  const currentStep = { ...allSteps[stepIndex], totalSteps: allSteps.length };

  return {
    programId,
    executionId,
    rolloutInstanceId,
    flowDefinition,
    control: { stepIndex },
    currentStep,
    done: false,
  };
};
