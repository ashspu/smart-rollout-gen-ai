const { docClient, UpdateCommand } = require('./shared/dynamodb');

/**
 * Called BY the state machine for each step.
 * Receives step metadata, executes the step logic, and records the result.
 *
 * Input shape (from state machine):
 *   { programId, executionId, phaseId, phaseName, stepId, stepName,
 *     stepDetail, isMilestone, isCustom, conformanceTarget }
 */
exports.handler = async (event) => {
  const {
    programId,
    executionId,
    phaseId,
    phaseName,
    stepId,
    stepName,
    stepDetail,
    isMilestone,
    isCustom,
    conformanceTarget,
  } = event;

  const startTime = Date.now();

  console.log(JSON.stringify({
    action: 'step-handler-start',
    programId,
    executionId,
    phaseId,
    stepId,
    stepName,
  }));

  try {
    // ── Step execution logic ──
    // In the prototype, steps auto-complete successfully.
    // Future: integrate with external systems, run conformance checks,
    // wait for human approval on milestone steps, etc.
    const result = {
      phaseId,
      phaseName,
      stepId,
      stepName,
      status: 'COMPLETED',
      conformanceTarget,
      conformanceActual: 100, // placeholder
      completedAt: new Date().toISOString(),
      durationMs: Date.now() - startTime,
    };

    // Update execution record with step result
    await docClient.send(new UpdateCommand({
      TableName: process.env.EXECUTIONS_TABLE,
      Key: { programId, executionId },
      UpdateExpression: `
        SET currentPhase = :phase,
            currentStep = :step,
            stepsCompleted = stepsCompleted + :one,
            stepResults = list_append(if_not_exists(stepResults, :empty), :result),
            updatedAt = :now
      `,
      ExpressionAttributeValues: {
        ':phase': phaseName,
        ':step': stepName,
        ':one': 1,
        ':result': [result],
        ':empty': [],
        ':now': new Date().toISOString(),
      },
    }));

    console.log(JSON.stringify({
      action: 'step-handler-complete',
      programId,
      executionId,
      phaseId,
      stepId,
      status: 'COMPLETED',
      durationMs: result.durationMs,
    }));

    return result;
  } catch (err) {
    console.error('step-handler error:', JSON.stringify({
      programId,
      executionId,
      phaseId,
      stepId,
      error: err.message,
    }));

    // Record failure in execution table
    try {
      await docClient.send(new UpdateCommand({
        TableName: process.env.EXECUTIONS_TABLE,
        Key: { programId, executionId },
        UpdateExpression: `
          SET currentPhase = :phase,
              currentStep = :step,
              stepResults = list_append(if_not_exists(stepResults, :empty), :result),
              updatedAt = :now
        `,
        ExpressionAttributeValues: {
          ':phase': phaseName,
          ':step': stepName,
          ':result': [{
            phaseId,
            stepId,
            stepName,
            status: 'FAILED',
            error: err.message,
            completedAt: new Date().toISOString(),
          }],
          ':empty': [],
          ':now': new Date().toISOString(),
        },
      }));
    } catch (updateErr) {
      console.error('Failed to record step failure:', updateErr.message);
    }

    throw err; // Re-throw so state machine Catch can handle it
  }
};
