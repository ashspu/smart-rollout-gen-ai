/**
 * Smart Rollout ASL Generator
 *
 * Converts a flowDefinition (as produced by templateToFlowDefinition) into a
 * valid AWS Step Functions Amazon States Language (ASL) JSON object.
 *
 * Design decisions (see plan for rationale):
 *  - Phases are sequential; steps within a phase are sequential.
 *  - State names use {phaseId}_{stepId} (already unique per template).
 *  - ResultPath is always $.lastResult — accumulated results live in DynamoDB.
 *  - On error, a Pass state records the failure then continues to the next step.
 *  - Standard (not Express) execution type — long-running, durable.
 */

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Sanitise a string so it is a valid ASL state name.
 * Allowed: alphanumeric, underscore, hyphen, period, space.  Max 128 chars.
 */
function sanitizeStateName(raw) {
  return raw
    .replace(/[^a-zA-Z0-9_\-. ]/g, '')
    .replace(/\s+/g, '_')
    .substring(0, 128);
}

/**
 * 4-char deterministic hash of a string — used as a suffix when a collision
 * is detected among generated state names.
 */
function shortHash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h).toString(36).substring(0, 4);
}

/**
 * Build a unique state name for a step, detecting and resolving collisions.
 *
 * @param {string} phaseId
 * @param {string} stepId
 * @param {Set<string>} usedNames – mutated: the generated name is added.
 * @returns {string}
 */
function makeStateName(phaseId, stepId, usedNames) {
  let name = sanitizeStateName(`${phaseId}_${stepId}`);
  if (usedNames.has(name)) {
    name = sanitizeStateName(`${phaseId}_${stepId}_${shortHash(`${phaseId}:${stepId}`)}`);
  }
  usedNames.add(name);
  return name;
}

// ---------------------------------------------------------------------------
// Main generator
// ---------------------------------------------------------------------------

/**
 * @param {object} flowDefinition – the runtime flow object
 * @param {object} [options]
 * @param {string} [options.stepHandlerArn] – ARN of the step-handler Lambda
 * @param {string} [options.programId]      – program identifier (metadata only)
 * @returns {object} Valid ASL JSON
 */
export function generateASL(flowDefinition, options = {}) {
  const {
    stepHandlerArn = 'arn:aws:lambda:${AWS::Region}:${AWS::AccountId}:function:smartrollout-step-handler',
    programId = 'preview',
  } = options;

  // 1. Collect enabled steps per phase, dropping empty phases.
  const phaseEntries = flowDefinition.phases
    .map((phase) => ({
      phase,
      steps: (flowDefinition.steps[phase.id] || []).filter((s) => s.enabled),
    }))
    .filter((e) => e.steps.length > 0);

  if (phaseEntries.length === 0) {
    throw new Error('Flow definition has no enabled steps');
  }

  // 2. Build a flat ordered list of (phase, step) pairs so we can look ahead.
  const orderedPairs = [];
  phaseEntries.forEach(({ phase, steps }) => {
    steps.forEach((step) => {
      orderedPairs.push({ phase, step });
    });
  });

  // 3. Pre-generate unique state names.
  const usedNames = new Set(['FlowComplete']);
  const stateNameMap = new Map(); // key: `${phaseId}::${stepId}` → stateName

  orderedPairs.forEach(({ phase, step }) => {
    const key = `${phase.id}::${step.id}`;
    stateNameMap.set(key, makeStateName(phase.id, step.id, usedNames));
  });

  // Also pre-generate failure-record state names.
  const failureNameMap = new Map();
  orderedPairs.forEach(({ phase, step }) => {
    const key = `${phase.id}::${step.id}`;
    const failName = makeStateName(`RecordFailure_${phase.id}`, step.id, usedNames);
    failureNameMap.set(key, failName);
  });

  // Helper to look up the state name for a pair.
  const nameOf = (phase, step) => stateNameMap.get(`${phase.id}::${step.id}`);

  // 4. Build ASL States.
  const states = {};

  orderedPairs.forEach(({ phase, step }, idx) => {
    const isLast = idx === orderedPairs.length - 1;
    const nextPair = isLast ? null : orderedPairs[idx + 1];
    const key = `${phase.id}::${step.id}`;
    const stateName = stateNameMap.get(key);
    const failStateName = failureNameMap.get(key);

    // Determine the "next" state (after success or after recording a failure).
    const nextStateName = isLast ? 'FlowComplete' : nameOf(nextPair.phase, nextPair.step);

    // --- Task state (the actual step execution) ---
    const taskState = {
      Type: 'Task',
      Comment: `${phase.name} > ${step.name}`,
      Resource: stepHandlerArn,
      Parameters: {
        'programId.$': '$.programId',
        'executionId.$': '$.executionId',
        phaseId: phase.id,
        phaseName: phase.name,
        stepId: step.id,
        stepName: step.name,
        stepDetail: step.detail || '',
        isMilestone: !!step.milestone,
        isCustom: !!step.custom,
        conformanceTarget: step.conformance ?? 100,
      },
      ResultPath: '$.lastResult',
      Retry: [
        {
          ErrorEquals: ['States.TaskFailed', 'Lambda.ServiceException'],
          IntervalSeconds: 5,
          MaxAttempts: 2,
          BackoffRate: 2.0,
        },
      ],
      Catch: [
        {
          ErrorEquals: ['States.ALL'],
          ResultPath: '$.stepError',
          Next: failStateName,
        },
      ],
      Next: nextStateName,
    };

    // If this is the last step, use End instead of Next after success.
    if (isLast) {
      delete taskState.Next;
      taskState.Next = 'FlowComplete';
    }

    states[stateName] = taskState;

    // --- Pass state to record failure then continue ---
    states[failStateName] = {
      Type: 'Pass',
      Comment: `Record failure for ${phase.name} > ${step.name} and continue`,
      ResultPath: '$.stepError',
      Result: {
        phaseId: phase.id,
        stepId: step.id,
        stepName: step.name,
        status: 'FAILED',
      },
      Next: nextStateName,
    };
  });

  // Terminal states.
  states['FlowComplete'] = {
    Type: 'Succeed',
  };

  // 5. Determine StartAt.
  const firstPair = orderedPairs[0];
  const startAt = nameOf(firstPair.phase, firstPair.step);

  return {
    Comment: `Smart Rollout Flow: ${flowDefinition.name} (program: ${programId})`,
    StartAt: startAt,
    States: states,
  };
}

/**
 * Validate a generated ASL object for common issues.
 * Returns an array of error strings (empty = valid).
 */
export function validateASL(asl) {
  const errors = [];

  if (!asl.StartAt) {
    errors.push('Missing StartAt');
    return errors;
  }

  if (!asl.States || typeof asl.States !== 'object') {
    errors.push('Missing or invalid States');
    return errors;
  }

  const stateNames = new Set(Object.keys(asl.States));

  if (!stateNames.has(asl.StartAt)) {
    errors.push(`StartAt "${asl.StartAt}" does not reference an existing state`);
  }

  // Check that every Next reference resolves.
  for (const [name, state] of Object.entries(asl.States)) {
    if (state.Next && !stateNames.has(state.Next)) {
      errors.push(`State "${name}" has Next "${state.Next}" which does not exist`);
    }
    if (state.Catch) {
      for (const c of state.Catch) {
        if (c.Next && !stateNames.has(c.Next)) {
          errors.push(`State "${name}" Catch references "${c.Next}" which does not exist`);
        }
      }
    }
  }

  // Check for orphan states (unreachable from StartAt).
  const reachable = new Set();
  const queue = [asl.StartAt];
  while (queue.length > 0) {
    const current = queue.pop();
    if (reachable.has(current)) continue;
    reachable.add(current);
    const state = asl.States[current];
    if (!state) continue;
    if (state.Next) queue.push(state.Next);
    if (state.Catch) state.Catch.forEach((c) => c.Next && queue.push(c.Next));
    if (state.Choices) state.Choices.forEach((c) => c.Next && queue.push(c.Next));
    if (state.Default) queue.push(state.Default);
  }

  for (const name of stateNames) {
    if (!reachable.has(name)) {
      errors.push(`State "${name}" is unreachable from StartAt`);
    }
  }

  return errors;
}
