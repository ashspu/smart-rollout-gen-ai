import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as sfn from 'aws-cdk-lib/aws-stepfunctions';
import * as tasks from 'aws-cdk-lib/aws-stepfunctions-tasks';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

export class SmartRolloutStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // =========================================================================
    // DynamoDB Tables (multi-tenant ready via tenantId attribute)
    // =========================================================================

    const programsTable = new dynamodb.Table(this, 'ProgramsTable', {
      tableName: 'SmartRollout-Programs',
      partitionKey: { name: 'programId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });
    programsTable.addGlobalSecondaryIndex({
      indexName: 'TenantStatusIndex',
      partitionKey: { name: 'tenantId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'statusCreatedAt', type: dynamodb.AttributeType.STRING },
    });

    const templatesTable = new dynamodb.Table(this, 'TemplatesTable', {
      tableName: 'SmartRollout-Templates',
      partitionKey: { name: 'templateId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const executionsTable = new dynamodb.Table(this, 'ExecutionsTable', {
      tableName: 'SmartRollout-Executions',
      partitionKey: { name: 'programId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'executionId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      timeToLiveAttribute: 'ttl',
    });
    executionsTable.addGlobalSecondaryIndex({
      indexName: 'ExecutionLookup',
      partitionKey: { name: 'executionId', type: dynamodb.AttributeType.STRING },
    });

    // =========================================================================
    // S3 Bucket for execution data (Parquet/NDJSON output)
    // =========================================================================

    const dataBucket = new s3.Bucket(this, 'DataBucket', {
      bucketName: `smartrollout-data-${this.account}-${this.region}`,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      lifecycleRules: [
        {
          id: 'ExpireOldData',
          expiration: cdk.Duration.days(90),
          prefix: 'smartrollout/',
        },
      ],
    });

    // =========================================================================
    // Cognito User Pool (email/password auth)
    // =========================================================================

    const userPool = new cognito.UserPool(this, 'SmartRolloutUsers', {
      userPoolName: 'SmartRollout-Users',
      selfSignUpEnabled: false,
      signInAliases: { email: true },
      autoVerify: { email: true },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: false,
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const userPoolClient = new cognito.UserPoolClient(this, 'SmartRolloutWebApp', {
      userPoolClientName: 'SmartRollout-WebApp',
      userPool,
      generateSecret: false,
      authFlows: {
        userSrp: true,
        userPassword: true,
      },
      preventUserExistenceErrors: true,
    });

    // =========================================================================
    // Lambda Functions
    // =========================================================================

    const commonEnv: Record<string, string> = {
      PROGRAMS_TABLE: programsTable.tableName,
      TEMPLATES_TABLE: templatesTable.tableName,
      EXECUTIONS_TABLE: executionsTable.tableName,
      DATA_BUCKET: dataBucket.bucketName,
      REGION: this.region,
      NODE_OPTIONS: '--enable-source-maps',
    };

    const makeLambda = (name: string, dir: string, extra?: Record<string, string>, opts?: { timeout?: number; memory?: number }) => {
      return new lambda.Function(this, name, {
        functionName: `smartrollout-${dir}`,
        runtime: lambda.Runtime.NODEJS_20_X,
        handler: 'index.handler',
        code: lambda.Code.fromAsset(`lambda/${dir}`, {
          bundling: {
            image: lambda.Runtime.NODEJS_20_X.bundlingImage,
            command: ['bash', '-c', [
              'cp -r /asset-input/* /asset-output/',
              'cd /asset-output',
              'if [ -d "../shared" ]; then mkdir -p shared && cp -r /asset-input/../shared/* shared/; fi',
            ].join(' && ')],
            local: {
              tryBundle(outputDir: string) {
                const fs = require('fs');
                const path = require('path');
                const srcDir = path.join(__dirname, '..', 'lambda', dir);
                const sharedDir = path.join(__dirname, '..', 'lambda', 'shared');

                for (const f of fs.readdirSync(srcDir)) {
                  fs.copyFileSync(path.join(srcDir, f), path.join(outputDir, f));
                }
                if (fs.existsSync(sharedDir)) {
                  const sharedOut = path.join(outputDir, 'shared');
                  fs.mkdirSync(sharedOut, { recursive: true });
                  for (const f of fs.readdirSync(sharedDir)) {
                    fs.copyFileSync(path.join(sharedDir, f), path.join(sharedOut, f));
                  }
                }
                return true;
              },
            },
          },
        }),
        environment: { ...commonEnv, ...extra },
        timeout: cdk.Duration.seconds(opts?.timeout || 30),
        memorySize: opts?.memory || 256,
        tracing: lambda.Tracing.ACTIVE,
      });
    };

    // API handlers
    const createProgramFn    = makeLambda('CreateProgramFn',    'create-program');
    const listProgramsFn     = makeLambda('ListProgramsFn',     'list-programs');
    const getProgramFn       = makeLambda('GetProgramFn',       'get-program');
    const generateFlowFn     = makeLambda('GenerateFlowFn',     'generate-flow');
    const executeFlowFn      = makeLambda('ExecuteFlowFn',      'execute-flow');
    const getExecutionFn     = makeLambda('GetExecutionFn',     'get-execution');
    const listExecutionsFn   = makeLambda('ListExecutionsFn',   'list-executions');
    const saveTemplateFn     = makeLambda('SaveTemplateFn',     'save-template');
    const listTemplatesFn    = makeLambda('ListTemplatesFn',    'list-templates');

    // New execution system handlers
    const startExecutionFn   = makeLambda('StartExecutionFn',   'start-execution', {}, { timeout: 60, memory: 512 });
    const executionStatusFn  = makeLambda('ExecutionStatusFn',  'execution-status');

    // Step Functions handlers (invoked BY the state machine)
    const stepEndpointFn     = makeLambda('StepEndpointFn',     'step-endpoint', {}, { timeout: 60, memory: 512 });
    const determineNextFn    = makeLambda('DetermineNextFn',    'determine-next-step');

    // =========================================================================
    // Table permissions
    // =========================================================================

    programsTable.grantReadWriteData(createProgramFn);
    programsTable.grantReadData(listProgramsFn);
    programsTable.grantReadData(getProgramFn);
    programsTable.grantReadWriteData(generateFlowFn);
    programsTable.grantReadData(executeFlowFn);
    programsTable.grantReadData(getExecutionFn);
    programsTable.grantReadData(startExecutionFn);
    templatesTable.grantReadWriteData(saveTemplateFn);
    templatesTable.grantReadData(listTemplatesFn);
    executionsTable.grantReadWriteData(executeFlowFn);
    executionsTable.grantReadWriteData(getExecutionFn);
    executionsTable.grantReadData(listExecutionsFn);
    executionsTable.grantReadWriteData(startExecutionFn);
    executionsTable.grantReadData(executionStatusFn);
    executionsTable.grantReadWriteData(stepEndpointFn);
    executionsTable.grantReadWriteData(determineNextFn);

    // S3 permissions
    dataBucket.grantReadWrite(startExecutionFn);
    dataBucket.grantReadWrite(stepEndpointFn);

    // =========================================================================
    // Single Parameterized State Machine (loop pattern)
    // =========================================================================

    // 1. Initialize — set stepIndex to 0
    const initState = new sfn.Pass(this, 'InitializeExecution', {
      result: sfn.Result.fromObject({ stepIndex: 0 }),
      resultPath: '$.control',
    });

    // 2. Determine next step (Lambda)
    const determineNextStep = new tasks.LambdaInvoke(this, 'DetermineNextStep', {
      lambdaFunction: determineNextFn,
      resultPath: '$.routing',
      payloadResponseOnly: true,
    });

    // 3. Is flow complete? (Choice)
    const isComplete = new sfn.Choice(this, 'IsFlowComplete')
      .when(sfn.Condition.booleanEquals('$.routing.done', true),
        new sfn.Succeed(this, 'FlowComplete'))
      .otherwise(
        // 4. Execute step (Lambda) — pass step metadata + execution context from routing
        new tasks.LambdaInvoke(this, 'ExecuteStep', {
          lambdaFunction: stepEndpointFn,
          payload: sfn.TaskInput.fromObject({
            'programId.$': '$.programId',
            'executionId.$': '$.executionId',
            'rolloutInstanceId.$': '$.rolloutInstanceId',
            'tenantId.$': '$.tenantId',
            'phaseId.$': '$.routing.currentStep.phaseId',
            'phaseName.$': '$.routing.currentStep.phaseName',
            'stepId.$': '$.routing.currentStep.stepId',
            'stepName.$': '$.routing.currentStep.stepName',
            'stepDetail.$': '$.routing.currentStep.stepDetail',
            'isMilestone.$': '$.routing.currentStep.isMilestone',
            'isCustom.$': '$.routing.currentStep.isCustom',
            'conformanceTarget.$': '$.routing.currentStep.conformanceTarget',
            'scenarioParams.$': '$.scenarioParams',
            's3Prefix.$': '$.s3Prefix',
            'bucket.$': '$.bucket',
          }),
          resultPath: '$.lastResult',
          payloadResponseOnly: true,
          retryOnServiceExceptions: true,
        })
        // 5. Increment and loop back
        .next(new sfn.Pass(this, 'IncrementStepIndex', {
          resultPath: '$.control',
          parameters: {
            'stepIndex.$': 'States.MathAdd($.control.stepIndex, 1)',
          },
        }))
        .next(determineNextStep)
      );

    const definition = initState
      .next(determineNextStep)
      .next(isComplete);

    const logGroup = new logs.LogGroup(this, 'FlowExecutorLogs', {
      logGroupName: '/aws/stepfunctions/smartrollout-flow-executor',
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      retention: logs.RetentionDays.ONE_MONTH,
    });

    const stateMachine = new sfn.StateMachine(this, 'FlowExecutor', {
      stateMachineName: 'smartrollout-flow-executor',
      definitionBody: sfn.DefinitionBody.fromChainable(definition),
      stateMachineType: sfn.StateMachineType.STANDARD,
      timeout: cdk.Duration.days(365),
      tracingEnabled: true,
      logs: {
        destination: logGroup,
        level: sfn.LogLevel.ALL,
        includeExecutionData: true,
      },
    });

    // Pass state machine ARN to execution starters
    executeFlowFn.addEnvironment('STATE_MACHINE_ARN', stateMachine.stateMachineArn);
    startExecutionFn.addEnvironment('STATE_MACHINE_ARN', stateMachine.stateMachineArn);
    stateMachine.grantStartExecution(executeFlowFn);
    stateMachine.grantStartExecution(startExecutionFn);

    // get-execution needs to describe executions
    getExecutionFn.addToRolePolicy(new iam.PolicyStatement({
      actions: ['states:DescribeExecution', 'states:GetExecutionHistory'],
      resources: [stateMachine.stateMachineArn + '/*'],
    }));

    // execution-status needs to describe executions
    executionStatusFn.addToRolePolicy(new iam.PolicyStatement({
      actions: ['states:DescribeExecution'],
      resources: [stateMachine.stateMachineArn + '/*'],
    }));

    // =========================================================================
    // API Gateway
    // =========================================================================

    const api = new apigateway.RestApi(this, 'SmartRolloutApi', {
      restApiName: 'SmartRollout API',
      description: 'Smart Rollout Platform REST API',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'Authorization', 'X-Client-Request-Id'],
      },
      deployOptions: {
        stageName: 'prod',
        throttlingRateLimit: 100,
        throttlingBurstLimit: 200,
      },
    });

    // Cognito authorizer for all API methods
    const authorizer = new apigateway.CognitoUserPoolsAuthorizer(this, 'CognitoAuthorizer', {
      cognitoUserPools: [userPool],
      authorizerName: 'SmartRollout-CognitoAuth',
    });

    const authMethodOptions: apigateway.MethodOptions = {
      authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    };

    // Ensure CORS headers are returned on 401 (unauthorized) responses
    api.addGatewayResponse('Unauthorized', {
      type: apigateway.ResponseType.UNAUTHORIZED,
      responseHeaders: {
        'Access-Control-Allow-Origin': "'*'",
        'Access-Control-Allow-Headers': "'Content-Type,Authorization,X-Client-Request-Id'",
      },
      templates: {
        'application/json': '{"message":"Unauthorized"}',
      },
    });

    // /programs
    const programs = api.root.addResource('programs');
    programs.addMethod('POST', new apigateway.LambdaIntegration(createProgramFn), authMethodOptions);
    programs.addMethod('GET',  new apigateway.LambdaIntegration(listProgramsFn), authMethodOptions);

    // /programs/{programId}
    const program = programs.addResource('{programId}');
    program.addMethod('GET', new apigateway.LambdaIntegration(getProgramFn), authMethodOptions);

    // /programs/{programId}/generate-flow
    const generateFlow = program.addResource('generate-flow');
    generateFlow.addMethod('POST', new apigateway.LambdaIntegration(generateFlowFn), authMethodOptions);

    // /programs/{programId}/execute
    const execute = program.addResource('execute');
    execute.addMethod('POST', new apigateway.LambdaIntegration(executeFlowFn), authMethodOptions);

    // /programs/{programId}/executions
    const executions = program.addResource('executions');
    executions.addMethod('GET', new apigateway.LambdaIntegration(listExecutionsFn), authMethodOptions);

    // /programs/{programId}/executions/{executionId}
    const execution = executions.addResource('{executionId}');
    execution.addMethod('GET', new apigateway.LambdaIntegration(getExecutionFn), authMethodOptions);

    // /executions/start  (new — takes programId in body)
    const executionsRoot = api.root.addResource('executions');
    const startExecution = executionsRoot.addResource('start');
    startExecution.addMethod('POST', new apigateway.LambdaIntegration(startExecutionFn), authMethodOptions);

    // /executions/{rolloutInstanceId}/status
    const executionInstance = executionsRoot.addResource('{rolloutInstanceId}');
    const executionStatus = executionInstance.addResource('status');
    executionStatus.addMethod('GET', new apigateway.LambdaIntegration(executionStatusFn), authMethodOptions);

    // /templates
    const templates = api.root.addResource('templates');
    templates.addMethod('GET',  new apigateway.LambdaIntegration(listTemplatesFn), authMethodOptions);
    templates.addMethod('POST', new apigateway.LambdaIntegration(saveTemplateFn), authMethodOptions);

    // =========================================================================
    // Outputs
    // =========================================================================

    new cdk.CfnOutput(this, 'ApiUrl', {
      value: api.url,
      description: 'API Gateway endpoint URL',
    });

    new cdk.CfnOutput(this, 'StateMachineArn', {
      value: stateMachine.stateMachineArn,
      description: 'Flow executor Step Functions ARN',
    });

    new cdk.CfnOutput(this, 'StepEndpointArn', {
      value: stepEndpointFn.functionArn,
      description: 'Step endpoint Lambda ARN',
    });

    new cdk.CfnOutput(this, 'DataBucketName', {
      value: dataBucket.bucketName,
      description: 'S3 bucket for execution data',
    });

    new cdk.CfnOutput(this, 'UserPoolId', {
      value: userPool.userPoolId,
      description: 'Cognito User Pool ID',
    });

    new cdk.CfnOutput(this, 'UserPoolClientId', {
      value: userPoolClient.userPoolClientId,
      description: 'Cognito User Pool Client ID',
    });

    new cdk.CfnOutput(this, 'CognitoRegion', {
      value: this.region,
      description: 'Cognito region',
    });
  }
}
