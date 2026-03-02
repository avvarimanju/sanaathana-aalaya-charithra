#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { AvvarIStack } from './stacks/avvari-stack';
import { DefectTrackingStack } from './stacks/DefectTrackingStack';

const app = new cdk.App();

// Get environment configuration
const account = process.env.CDK_DEFAULT_ACCOUNT;
const region = process.env.CDK_DEFAULT_REGION || 'ap-south-1';  // Mumbai region for Indian users
const environment = (process.env.ENVIRONMENT || 'dev') as 'dev' | 'staging' | 'prod';

// Create the main stack
new AvvarIStack(app, 'AvvarIForBharatStack', {
  env: {
    account,
    region,
  },
  description: 'AvvarI for Bharat - AI-Powered Heritage Site Digitization Platform',
  tags: {
    Project: 'AvvarI-for-Bharat',
    Environment: environment,
    Owner: 'AvvarI-Team',
  },
});

// Create the Defect Tracking stack
new DefectTrackingStack(app, `DefectTrackingStack-${environment}`, {
  env: {
    account,
    region,
  },
  environment,
  description: 'Defect Tracking System - DynamoDB tables, Lambda functions, and API Gateway',
  tags: {
    Project: 'Sanaathana-Aalaya-Charithra',
    Feature: 'defect-tracking',
    Environment: environment,
    Owner: 'AvvarI-Team',
  },
});

app.synth();