const { randomUUID } = require('crypto');
const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { docClient, UpdateCommand, QueryCommand } = require('./shared/dynamodb');

const s3Client = new S3Client({});

/**
 * Step Endpoint — called BY the Step Functions state machine for each step.
 * This is the enhanced version that generates synthetic data per step
 * and writes datasets to S3 with rolloutInstanceId on every row.
 *
 * Input shape (from state machine):
 *   { programId, executionId, rolloutInstanceId, tenantId,
 *     phaseId, phaseName, stepId, stepName, stepDetail,
 *     isMilestone, isCustom, conformanceTarget,
 *     scenarioParams, s3Prefix, bucket }
 */
exports.handler = async (event) => {
  const {
    programId,
    executionId,
    rolloutInstanceId = executionId,
    tenantId = 'gqc',
    phaseId,
    phaseName,
    stepId,
    stepName,
    stepDetail,
    isMilestone,
    isCustom,
    conformanceTarget = 95,
    stepIndex = 0,
    totalSteps = 1,
    scenarioParams = {},
    s3Prefix,
    bucket,
  } = event;

  const startTime = Date.now();
  const stepRunId = randomUUID();
  const now = new Date().toISOString();

  console.log(JSON.stringify({
    action: 'step-endpoint-start',
    rolloutInstanceId,
    programId,
    phaseId,
    stepId,
    stepName,
    stepRunId,
  }));

  try {
    // ── Generate step-level synthetic data ──
    const rng = seededRandom(hashCode(`${rolloutInstanceId}-${stepId}`));
    const metersCount = scenarioParams.metersCount || 500;
    const regionCount = scenarioParams.regionCount || 2;
    const failureModeBias = scenarioParams.failureModeBias || 'none';

    // Pipeline model: all meters enter step 0, with gradual attrition per step.
    // Each step loses 1-4% of meters (failures, exceptions, opt-outs).
    // This ensures the total never exceeds metersCount and tells a coherent story.
    const attritionPerStep = 0.01 + rng() * 0.03; // 1-4% drop per step
    const stepMeters = Math.max(1, Math.floor(metersCount * Math.pow(1 - attritionPerStep, stepIndex)));

    // Generate events for this step
    const events = generateStepEvents(rolloutInstanceId, tenantId, programId, stepRunId, phaseId, stepId, stepName, stepMeters, rng, now);

    // Generate work orders for field-work steps
    const workOrders = generateWorkOrders(rolloutInstanceId, tenantId, programId, stepRunId, phaseId, stepId, stepName, stepMeters, regionCount, failureModeBias, rng, now);

    // Generate billing outcomes for billing-related steps
    const billingOutcomes = generateBillingOutcomes(rolloutInstanceId, tenantId, programId, stepRunId, phaseId, stepId, stepName, stepMeters, rng, now);

    // Generate customer contacts
    const customerContacts = generateCustomerContacts(rolloutInstanceId, tenantId, programId, stepRunId, phaseId, stepId, stepName, stepMeters, rng, now);

    // Generate cost records
    const costs = generateCosts(rolloutInstanceId, tenantId, programId, stepRunId, phaseId, stepId, stepName, stepMeters, rng, now);

    // Write datasets to S3 (append mode — load existing, add, rewrite)
    const datasetsWritten = [];
    if (bucket && s3Prefix) {
      if (events.length > 0) {
        await appendToDataset(bucket, s3Prefix, 'events', events);
        datasetsWritten.push('events');
      }
      if (workOrders.length > 0) {
        await appendToDataset(bucket, s3Prefix, 'work_orders', workOrders);
        datasetsWritten.push('work_orders');
      }
      if (billingOutcomes.length > 0) {
        await appendToDataset(bucket, s3Prefix, 'billing_outcomes', billingOutcomes);
        datasetsWritten.push('billing_outcomes');
      }
      if (customerContacts.length > 0) {
        await appendToDataset(bucket, s3Prefix, 'customer_contacts', customerContacts);
        datasetsWritten.push('customer_contacts');
      }
      if (costs.length > 0) {
        await appendToDataset(bucket, s3Prefix, 'costs', costs);
        datasetsWritten.push('costs');
      }
    }

    // Calculate conformance
    const totalEvents = events.length;
    const successEvents = events.filter(e => e.outcome === 'success').length;
    const conformanceActual = totalEvents > 0 ? Math.round((successEvents / totalEvents) * 100) : 100;

    const result = {
      rolloutInstanceId,
      stepRunId,
      phaseId,
      phaseName,
      stepId,
      stepName,
      status: 'COMPLETED',
      conformanceTarget,
      conformanceActual,
      metersProcessed: stepMeters,
      eventsGenerated: events.length,
      workOrdersGenerated: workOrders.length,
      datasetsWritten,
      completedAt: new Date().toISOString(),
      durationMs: Date.now() - startTime,
    };

    // Update execution record in DynamoDB
    await docClient.send(new UpdateCommand({
      TableName: process.env.EXECUTIONS_TABLE,
      Key: { programId, executionId: rolloutInstanceId },
      UpdateExpression: `
        SET currentPhase = :phase,
            currentStep = :step,
            stepsCompleted = stepsCompleted + :one,
            stepResults = list_append(if_not_exists(stepResults, :empty), :result),
            datasetsWritten = :datasets,
            updatedAt = :now
      `,
      ExpressionAttributeValues: {
        ':phase': phaseName,
        ':step': stepName,
        ':one': 1,
        ':result': [result],
        ':empty': [],
        ':datasets': ['executions', 'events', 'work_orders', 'billing_outcomes', 'customer_contacts', 'costs'],
        ':now': new Date().toISOString(),
      },
    }));

    console.log(JSON.stringify({
      action: 'step-endpoint-complete',
      rolloutInstanceId,
      stepRunId,
      programId,
      phaseId,
      stepId,
      status: 'COMPLETED',
      metersProcessed: stepMeters,
      eventsGenerated: events.length,
      durationMs: result.durationMs,
    }));

    return result;

  } catch (err) {
    console.error('step-endpoint error:', JSON.stringify({
      rolloutInstanceId,
      stepRunId,
      programId,
      phaseId,
      stepId,
      error: err.message,
    }));

    // Record failure
    try {
      await docClient.send(new UpdateCommand({
        TableName: process.env.EXECUTIONS_TABLE,
        Key: { programId, executionId: rolloutInstanceId },
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
            rolloutInstanceId,
            stepRunId,
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

    throw err;
  }
};

// ── Data Generators ──

function generateStepEvents(rolloutInstanceId, tenantId, programId, stepRunId, phaseId, stepId, stepName, count, rng, baseTime) {
  const events = [];
  const outcomes = ['success', 'success', 'success', 'success', 'failure', 'retry', 'skipped'];

  for (let i = 0; i < count; i++) {
    const meterId = `MTR-${String(Math.floor(rng() * 999999)).padStart(6, '0')}`;
    const outcome = outcomes[Math.floor(rng() * outcomes.length)];
    const offsetMs = Math.floor(rng() * 86400000); // within 24hrs

    events.push({
      tenantId,
      programId,
      rolloutInstanceId,
      stepRunId,
      phaseId,
      stepId,
      stepName,
      meterId,
      eventType: `step.${stepName.toLowerCase().replace(/\s+/g, '_')}.${outcome}`,
      outcome,
      details: outcome === 'failure' ? pickFailureReason(rng) : null,
      emittedAt: new Date(new Date(baseTime).getTime() + offsetMs).toISOString(),
    });
  }
  return events;
}

function generateWorkOrders(rolloutInstanceId, tenantId, programId, stepRunId, phaseId, stepId, stepName, count, regionCount, failureModeBias, rng, baseTime) {
  // Only generate work orders for field-type steps
  const fieldKeywords = ['install', 'deploy', 'exchange', 'test', 'inspect', 'commission', 'dispatch', 'field'];
  const isFieldStep = fieldKeywords.some(kw => stepName.toLowerCase().includes(kw));
  if (!isFieldStep) return [];

  const workOrders = [];
  const woCount = Math.max(5, Math.floor(count * 0.6));
  const regions = Array.from({ length: regionCount }, (_, i) => `REGION-${String.fromCharCode(65 + i)}`);
  const statuses = ['completed', 'completed', 'completed', 'in-progress', 'failed', 'cancelled'];

  for (let i = 0; i < woCount; i++) {
    const workOrderId = randomUUID();
    const meterId = `MTR-${String(Math.floor(rng() * 999999)).padStart(6, '0')}`;
    let status = statuses[Math.floor(rng() * statuses.length)];

    // Apply failure mode bias
    if (failureModeBias !== 'none' && rng() < 0.3) {
      status = 'failed';
    }

    workOrders.push({
      tenantId,
      programId,
      rolloutInstanceId,
      stepRunId,
      workOrderId,
      phaseId,
      stepId,
      stepName,
      meterId,
      region: regions[Math.floor(rng() * regions.length)],
      status,
      failureReason: status === 'failed' ? pickFieldFailure(failureModeBias, rng) : null,
      crewId: `CREW-${Math.floor(rng() * 20) + 1}`,
      scheduledDate: baseTime.split('T')[0],
      completedDate: status === 'completed' ? baseTime.split('T')[0] : null,
      emittedAt: baseTime,
    });
  }
  return workOrders;
}

function generateBillingOutcomes(rolloutInstanceId, tenantId, programId, stepRunId, phaseId, stepId, stepName, count, rng, baseTime) {
  const billingKeywords = ['billing', 'rate', 'tariff', 'bill', 'invoice', 'account'];
  const isBillingStep = billingKeywords.some(kw => stepName.toLowerCase().includes(kw));
  if (!isBillingStep) return [];

  const outcomes = [];
  const boCount = Math.max(3, Math.floor(count * 0.4));
  const resultTypes = ['first-bill-success', 'first-bill-success', 'first-bill-success', 'billing-exception', 'rate-mismatch'];

  for (let i = 0; i < boCount; i++) {
    const meterId = `MTR-${String(Math.floor(rng() * 999999)).padStart(6, '0')}`;
    const resultType = resultTypes[Math.floor(rng() * resultTypes.length)];

    outcomes.push({
      tenantId,
      programId,
      rolloutInstanceId,
      stepRunId,
      phaseId,
      stepId,
      meterId,
      resultType,
      amount: Math.round((50 + rng() * 200) * 100) / 100,
      currency: 'USD',
      billingCycleDate: baseTime.split('T')[0],
      emittedAt: baseTime,
    });
  }
  return outcomes;
}

function generateCustomerContacts(rolloutInstanceId, tenantId, programId, stepRunId, phaseId, stepId, stepName, count, rng, baseTime) {
  const contactKeywords = ['notify', 'engage', 'contact', 'outreach', 'letter', 'sms', 'call', 'appointment'];
  const isContactStep = contactKeywords.some(kw => stepName.toLowerCase().includes(kw));
  if (!isContactStep) return [];

  const contacts = [];
  const ccCount = Math.max(3, Math.floor(count * 0.5));
  const channels = ['letter', 'sms', 'email', 'phone', 'door-hanger'];
  const dispositions = ['delivered', 'delivered', 'delivered', 'bounced', 'no-answer', 'opted-out'];

  for (let i = 0; i < ccCount; i++) {
    const meterId = `MTR-${String(Math.floor(rng() * 999999)).padStart(6, '0')}`;

    contacts.push({
      tenantId,
      programId,
      rolloutInstanceId,
      stepRunId,
      phaseId,
      stepId,
      meterId,
      channel: channels[Math.floor(rng() * channels.length)],
      disposition: dispositions[Math.floor(rng() * dispositions.length)],
      attemptNumber: Math.floor(rng() * 3) + 1,
      contactDate: baseTime.split('T')[0],
      emittedAt: baseTime,
    });
  }
  return contacts;
}

function generateCosts(rolloutInstanceId, tenantId, programId, stepRunId, phaseId, stepId, stepName, count, rng, baseTime) {
  const costs = [];
  const categories = ['labor', 'materials', 'equipment', 'transport', 'overhead'];

  // Generate 1-3 cost line items per step
  const costCount = Math.floor(rng() * 3) + 1;
  for (let i = 0; i < costCount; i++) {
    const category = categories[Math.floor(rng() * categories.length)];
    const unitCost = Math.round((20 + rng() * 200) * 100) / 100;
    const units = Math.floor(rng() * count * 0.3) + 1;

    costs.push({
      tenantId,
      programId,
      rolloutInstanceId,
      stepRunId,
      phaseId,
      stepId,
      stepName,
      costCategory: category,
      unitCost,
      units,
      totalCost: Math.round(unitCost * units * 100) / 100,
      currency: 'USD',
      emittedAt: baseTime,
    });
  }
  return costs;
}

function pickFailureReason(rng) {
  const reasons = ['timeout', 'connection_error', 'validation_failed', 'meter_not_found', 'access_denied', 'comm_failure'];
  return reasons[Math.floor(rng() * reasons.length)];
}

function pickFieldFailure(bias, rng) {
  const biasMap = {
    'no-access': ['no-access', 'no-access', 'no-access', 'locked-gate', 'customer-refused'],
    'meter-defect': ['meter-defect', 'meter-defect', 'wrong-meter-type', 'damaged-socket'],
    'comm-failure': ['comm-failure', 'comm-failure', 'signal-weak', 'head-end-timeout'],
    'mixed': ['no-access', 'meter-defect', 'comm-failure', 'crew-unavailable', 'weather'],
  };
  const reasons = biasMap[bias] || ['no-access', 'meter-defect', 'comm-failure', 'crew-unavailable', 'weather', 'other'];
  return reasons[Math.floor(rng() * reasons.length)];
}

function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash) || 1;
}

function seededRandom(seed) {
  let state = seed;
  return function() {
    state ^= state << 13;
    state ^= state >> 17;
    state ^= state << 5;
    return ((state >>> 0) / 4294967296);
  };
}

/**
 * Append rows to an existing NDJSON dataset in S3.
 * Loads existing content, appends new rows, writes back.
 */
async function appendToDataset(bucket, prefix, dataset, newRows) {
  const key = `${prefix}/${dataset}.ndjson`;
  let existing = '';

  try {
    const resp = await s3Client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
    existing = await resp.Body.transformToString();
  } catch (err) {
    if (err.name !== 'NoSuchKey') throw err;
  }

  const newContent = newRows.map(r => JSON.stringify(r)).join('\n');
  const combined = existing ? `${existing}\n${newContent}` : newContent;

  await s3Client.send(new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: combined,
    ContentType: 'application/x-ndjson',
  }));
}
