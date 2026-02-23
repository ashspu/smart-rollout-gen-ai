#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { SmartRolloutStack } from '../lib/smart-rollout-stack';

const app = new cdk.App();

new SmartRolloutStack(app, 'SmartRolloutStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
  description: 'Smart Rollout Platform — API, DynamoDB, Step Functions, Lambda',
});
