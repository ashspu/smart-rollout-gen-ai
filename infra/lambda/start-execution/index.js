const { randomUUID } = require('crypto');
const { SFNClient, StartExecutionCommand } = require('@aws-sdk/client-sfn');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { docClient, GetCommand, PutCommand } = require('./shared/dynamodb');
const { success, error } = require('./shared/response');
const { getAuthContext } = require('./shared/auth');

const sfnClient = new SFNClient({});
const s3Client = new S3Client({});

/**
 * POST /executions/start
 *
 * Body: {
 *   programId: string,
 *   scenarioParams: {
 *     preset: 'small' | 'medium' | 'large' | 'custom',
 *     metersCount: number,
 *     durationDays: number,
 *     startDate: string (ISO),
 *     seed: number | null,
 *     regionCount: number,
 *     failureModeBias: 'none' | 'no-access' | 'meter-defect' | 'comm-failure' | 'mixed',
 *     includeDownstreamImpacts: boolean,
 *     endpointMappingMode: 'auto' | 'manual',
 *     endpointOverrides?: Record<string, string>
 *   }
 * }
 *
 * Returns: { rolloutInstanceId, status, s3Prefix, scenarioParams, startedAt }
 */
exports.handler = async (event) => {
  try {
    const { tenantId, userId, email } = getAuthContext(event);
    const body = JSON.parse(event.body || '{}');
    const { programId, scenarioParams } = body;

    if (!programId) return error('Missing programId', 400);
    if (!scenarioParams) return error('Missing scenarioParams', 400);

    // Load program to get flowDefinition
    const program = await docClient.send(new GetCommand({
      TableName: process.env.PROGRAMS_TABLE,
      Key: { programId },
    }));

    if (!program.Item) return error('Program not found', 404);
    if (!program.Item.flowDefinition) return error('Program has no flow definition. Generate flow first.', 400);

    // Enforce tenantId
    const effectiveTenantId = program.Item.tenantId || tenantId || 'gqc';

    // Generate rolloutInstanceId — this is the PRIMARY case key
    const rolloutInstanceId = randomUUID();
    const now = new Date().toISOString();

    // Resolve scenario preset defaults
    const resolvedParams = resolvePreset(scenarioParams);

    // S3 prefix for all parquet outputs
    const bucket = process.env.DATA_BUCKET;
    const s3Prefix = `smartrollout/${effectiveTenantId}/${programId}/${rolloutInstanceId}/parquet`;

    // Build step list from flowDefinition
    const steps = buildStepList(program.Item.flowDefinition);

    // Generate synthetic data based on scenario params
    const syntheticData = generateSyntheticData(rolloutInstanceId, effectiveTenantId, programId, resolvedParams, steps);

    // Write initial execution dataset to S3
    await writeParquetJson(bucket, s3Prefix, 'executions', syntheticData.executions);

    // Start Step Functions execution
    const sfnResult = await sfnClient.send(new StartExecutionCommand({
      stateMachineArn: process.env.STATE_MACHINE_ARN,
      name: `${programId}-${rolloutInstanceId}`.substring(0, 80),
      input: JSON.stringify({
        programId,
        executionId: rolloutInstanceId,
        rolloutInstanceId,
        tenantId: effectiveTenantId,
        flowDefinition: program.Item.flowDefinition,
        scenarioParams: resolvedParams,
        s3Prefix,
        bucket,
        control: { stepIndex: 0 },
      }),
    }));

    // Record execution in DynamoDB
    const ttl = Math.floor(Date.now() / 1000) + (90 * 24 * 60 * 60);
    const executionRecord = {
      programId,
      executionId: rolloutInstanceId,
      rolloutInstanceId,
      tenantId: effectiveTenantId,
      sfnExecutionArn: sfnResult.executionArn,
      status: 'RUNNING',
      scenarioParams: resolvedParams,
      s3Prefix: `s3://${bucket}/${s3Prefix}`,
      currentPhase: null,
      currentStep: null,
      stepsCompleted: 0,
      stepsTotal: steps.length,
      stepResults: [],
      datasetsWritten: ['executions'],
      metersCount: resolvedParams.metersCount,
      preset: resolvedParams.preset,
      startedAt: now,
      completedAt: null,
      createdBy: email,
      ttl,
    };

    await docClient.send(new PutCommand({
      TableName: process.env.EXECUTIONS_TABLE,
      Item: executionRecord,
    }));

    console.log(JSON.stringify({
      action: 'start-execution',
      rolloutInstanceId,
      programId,
      tenantId: effectiveTenantId,
      userId,
      email,
      preset: resolvedParams.preset,
      metersCount: resolvedParams.metersCount,
      sfnExecutionArn: sfnResult.executionArn,
    }));

    return success({
      rolloutInstanceId,
      status: 'RUNNING',
      s3Prefix: `s3://${bucket}/${s3Prefix}`,
      scenarioParams: resolvedParams,
      startedAt: now,
      stepsTotal: steps.length,
    }, 201);

  } catch (err) {
    console.error('start-execution error:', err);
    return error(err.message);
  }
};

/**
 * Resolve preset to concrete scenario parameters
 */
function resolvePreset(params) {
  const presets = {
    small:  { metersCount: 500,    durationDays: 30,  regionCount: 2 },
    medium: { metersCount: 5000,   durationDays: 90,  regionCount: 4 },
    large:  { metersCount: 50000,  durationDays: 365, regionCount: 8 },
  };

  const base = presets[params.preset] || {};
  return {
    preset: params.preset || 'small',
    metersCount: params.metersCount || base.metersCount || 500,
    durationDays: params.durationDays || base.durationDays || 30,
    startDate: params.startDate || new Date().toISOString().split('T')[0],
    seed: params.seed || null,
    regionCount: params.regionCount || base.regionCount || 2,
    failureModeBias: params.failureModeBias || 'none',
    includeDownstreamImpacts: params.includeDownstreamImpacts !== false,
    endpointMappingMode: params.endpointMappingMode || 'auto',
    endpointOverrides: params.endpointOverrides || {},
  };
}

/**
 * Build ordered step list from flowDefinition
 */
function buildStepList(flowDefinition) {
  const steps = [];
  for (const phase of (flowDefinition.phases || [])) {
    const phaseSteps = flowDefinition.steps?.[phase.id] || [];
    for (const step of phaseSteps) {
      if (step.enabled === false) continue;
      steps.push({
        phaseId: phase.id,
        phaseName: phase.name,
        stepId: step.id,
        stepName: step.name,
        stepDetail: step.detail || '',
        isMilestone: step.isMilestone || false,
        isCustom: step.isCustom || false,
        conformanceTarget: step.conformanceTarget || 95,
      });
    }
  }
  return steps;
}

/**
 * Generate synthetic data rows for all datasets
 */
function generateSyntheticData(rolloutInstanceId, tenantId, programId, params, steps) {
  const now = new Date().toISOString();
  const rng = seededRandom(params.seed || Date.now());

  // Execution record row
  const executions = [{
    tenantId,
    programId,
    rolloutInstanceId,
    preset: params.preset,
    metersCount: params.metersCount,
    durationDays: params.durationDays,
    startDate: params.startDate,
    regionCount: params.regionCount,
    failureModeBias: params.failureModeBias,
    status: 'RUNNING',
    startedAt: now,
    completedAt: null,
    emittedAt: now,
  }];

  return { executions };
}

/**
 * Simple seeded PRNG (xorshift32)
 */
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
 * Write dataset as JSON lines (Parquet placeholder — real Parquet needs native lib)
 * Writing as .ndjson with .parquet extension for now; Celonis can ingest both.
 */
async function writeParquetJson(bucket, prefix, dataset, rows) {
  if (!rows || rows.length === 0) return;

  const key = `${prefix}/${dataset}.ndjson`;
  const body = rows.map(r => JSON.stringify(r)).join('\n');

  await s3Client.send(new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: body,
    ContentType: 'application/x-ndjson',
  }));

  console.log(`Wrote ${rows.length} rows to s3://${bucket}/${key}`);
}
