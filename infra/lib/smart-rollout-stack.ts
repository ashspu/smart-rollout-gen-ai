import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as sfn from 'aws-cdk-lib/aws-stepfunctions';
import * as tasks from 'aws-cdk-lib/aws-stepfunctions-tasks';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as cognito from 'aws-cdk-lib/aws-cognito';
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
      REGION: this.region,
      NODE_OPTIONS: '--enable-source-maps',
    };

    const makeLambda = (name: string, dir: string, extra?: Record<string, string>) => {
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
                // Local bundling: copy handler + shared
                const fs = require('fs');
                const path = require('path');
                const srcDir = path.join(__dirname, '..', 'lambda', dir);
                const sharedDir = path.join(__dirname, '..', 'lambda', 'shared');

                // Copy handler files
                for (const f of fs.readdirSync(srcDir)) {
                  fs.copyFileSync(path.join(srcDir, f), path.join(outputDir, f));
                }
                // Copy shared
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
        timeout: cdk.Duration.seconds(30),
        memorySize: 256,
        tracing: lambda.Tracing.ACTIVE,
      });
    };

    // API handlers
    const createProgramFn  = makeLambda('CreateProgramFn',  'create-program');
    const listProgramsFn   = makeLambda('ListProgramsFn',   'list-programs');
    const getProgramFn     = makeLambda('GetProgramFn',     'get-program');
    const generateFlowFn   = makeLambda('GenerateFlowFn',   'generate-flow');
    const executeFlowFn    = makeLambda('ExecuteFlowFn',    'execute-flow');
    const getExecutionFn   = makeLambda('GetExecutionFn',   'get-execution');
    const listExecutionsFn = makeLambda('ListExecutionsFn', 'list-executions');
    const saveTemplateFn   = makeLambda('SaveTemplateFn',   'save-template');
    const listTemplatesFn  = makeLambda('ListTemplatesFn',  'list-templates');

    // Step Functions handlers (invoked BY the state machine)
    const stepHandlerFn    = makeLambda('StepHandlerFn',    'step-handler');
    const determineNextFn  = makeLambda('DetermineNextFn',  'determine-next-step');

    // =========================================================================
    // Table permissions
    // =========================================================================

    programsTable.grantReadWriteData(createProgramFn);
    programsTable.grantReadData(listProgramsFn);
    programsTable.grantReadData(getProgramFn);
    programsTable.grantReadWriteData(generateFlowFn);
    programsTable.grantReadData(executeFlowFn);
    programsTable.grantReadData(getExecutionFn);
    templatesTable.grantReadWriteData(saveTemplateFn);
    templatesTable.grantReadData(listTemplatesFn);
    executionsTable.grantReadWriteData(executeFlowFn);
    executionsTable.grantReadWriteData(getExecutionFn);
    executionsTable.grantReadData(listExecutionsFn);
    executionsTable.grantReadWriteData(stepHandlerFn);

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
        // 4. Execute step (Lambda) — pass step metadata from routing
        new tasks.LambdaInvoke(this, 'ExecuteStep', {
          lambdaFunction: stepHandlerFn,
          payload: sfn.TaskInput.fromObject({
            'programId.$': '$.programId',
            'executionId.$': '$.executionId',
            'phaseId.$': '$.routing.currentStep.phaseId',
            'phaseName.$': '$.routing.currentStep.phaseName',
            'stepId.$': '$.routing.currentStep.stepId',
            'stepName.$': '$.routing.currentStep.stepName',
            'stepDetail.$': '$.routing.currentStep.stepDetail',
            'isMilestone.$': '$.routing.currentStep.isMilestone',
            'isCustom.$': '$.routing.currentStep.isCustom',
            'conformanceTarget.$': '$.routing.currentStep.conformanceTarget',
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
      timeout: cdk.Duration.days(365), // meter programs run for months
      tracingEnabled: true,
      logs: {
        destination: logGroup,
        level: sfn.LogLevel.ALL,
        includeExecutionData: true,
      },
    });

    // Pass state machine ARN to execute-flow
    executeFlowFn.addEnvironment('STATE_MACHINE_ARN', stateMachine.stateMachineArn);
    stateMachine.grantStartExecution(executeFlowFn);

    // get-execution needs to describe executions
    getExecutionFn.addToRolePolicy(new iam.PolicyStatement({
      actions: ['states:DescribeExecution', 'states:GetExecutionHistory'],
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

    new cdk.CfnOutput(this, 'StepHandlerArn', {
      value: stepHandlerFn.functionArn,
      description: 'Step handler Lambda ARN (for ASL generation)',
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
