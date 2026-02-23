/**
 * CommonJS version of the ASL generator — used by Lambda handlers.
 * Keep in sync with index.js (the ESM source of truth).
 */

function sanitizeStateName(raw) {
  return raw
    .replace(/[^a-zA-Z0-9_\-. ]/g, '')
    .replace(/\s+/g, '_')
    .substring(0, 128);
}

function shortHash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h).toString(36).substring(0, 4);
}

function makeStateName(phaseId, stepId, usedNames) {
  let name = sanitizeStateName(`${phaseId}_${stepId}`);
  if (usedNames.has(name)) {
    name = sanitizeStateName(`${phaseId}_${stepId}_${shortHash(`${phaseId}:${stepId}`)}`);
  }
  usedNames.add(name);
  return name;
}

function generateASL(flowDefinition, options = {}) {
  const {
    stepHandlerArn = 'arn:aws:lambda:${AWS::Region}:${AWS::AccountId}:function:smartrollout-step-handler',
    programId = 'preview',
  } = options;

  const phaseEntries = flowDefinition.phases
    .map((phase) => ({
      phase,
      steps: (flowDefinition.steps[phase.id] || []).filter((s) => s.enabled),
    }))
    .filter((e) => e.steps.length > 0);

  if (phaseEntries.length === 0) {
    throw new Error('Flow definition has no enabled steps');
  }

  const orderedPairs = [];
  phaseEntries.forEach(({ phase, steps }) => {
    steps.forEach((step) => {
      orderedPairs.push({ phase, step });
    });
  });

  const usedNames = new Set(['FlowComplete']);
  const stateNameMap = new Map();

  orderedPairs.forEach(({ phase, step }) => {
    const key = `${phase.id}::${step.id}`;
    stateNameMap.set(key, makeStateName(phase.id, step.id, usedNames));
  });

  const failureNameMap = new Map();
  orderedPairs.forEach(({ phase, step }) => {
    const key = `${phase.id}::${step.id}`;
    const failName = makeStateName(`RecordFailure_${phase.id}`, step.id, usedNames);
    failureNameMap.set(key, failName);
  });

  const nameOf = (phase, step) => stateNameMap.get(`${phase.id}::${step.id}`);

  const states = {};

  orderedPairs.forEach(({ phase, step }, idx) => {
    const isLast = idx === orderedPairs.length - 1;
    const nextPair = isLast ? null : orderedPairs[idx + 1];
    const key = `${phase.id}::${step.id}`;
    const stateName = stateNameMap.get(key);
    const failStateName = failureNameMap.get(key);
    const nextStateName = isLast ? 'FlowComplete' : nameOf(nextPair.phase, nextPair.step);

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

    if (isLast) {
      delete taskState.Next;
      taskState.Next = 'FlowComplete';
    }

    states[stateName] = taskState;

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

  states['FlowComplete'] = { Type: 'Succeed' };

  const firstPair = orderedPairs[0];
  const startAt = nameOf(firstPair.phase, firstPair.step);

  return {
    Comment: `Smart Rollout Flow: ${flowDefinition.name} (program: ${programId})`,
    StartAt: startAt,
    States: states,
  };
}

function validateASL(asl) {
  const errors = [];
  if (!asl.StartAt) { errors.push('Missing StartAt'); return errors; }
  if (!asl.States || typeof asl.States !== 'object') { errors.push('Missing or invalid States'); return errors; }
  const stateNames = new Set(Object.keys(asl.States));
  if (!stateNames.has(asl.StartAt)) errors.push(`StartAt "${asl.StartAt}" does not reference an existing state`);
  for (const [name, state] of Object.entries(asl.States)) {
    if (state.Next && !stateNames.has(state.Next)) errors.push(`State "${name}" has Next "${state.Next}" which does not exist`);
    if (state.Catch) for (const c of state.Catch) { if (c.Next && !stateNames.has(c.Next)) errors.push(`State "${name}" Catch references "${c.Next}" which does not exist`); }
  }
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
  for (const name of stateNames) { if (!reachable.has(name)) errors.push(`State "${name}" is unreachable from StartAt`); }
  return errors;
}

module.exports = { generateASL, validateASL };
