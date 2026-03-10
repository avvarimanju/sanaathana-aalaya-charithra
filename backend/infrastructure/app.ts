#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { SanaathanaAalayaCharithraStack } from './stacks/sanaathana-aalaya-charithra-stack';
import { DefectTrackingStack } from './stacks/DefectTrackingStack';

const app = new cdk.App();

// Get environment configuration
const account = process.env.CDK_DEFAULT_ACCOUNT;
// IMPORTANT: Always deploy to Mumbai region (ap-south-1) for Indian users
// Set CDK_DEFAULT_REGION=ap-south-1 before deployment
const region = process.env.CDK_DEFAULT_REGION || 'ap-south-1';
const environment = (process.env.ENVIRONMENT || 'dev') as 'dev' | 'staging' | 'prod';

// Validate region to prevent accidental deployment to wrong region
if (region !== 'ap-south-1') {
  console.warn(`⚠️  WARNING: Deploying to ${region} instead of ap-south-1 (Mumbai)`);
  console.warn('⚠️  Set CDK_DEFAULT_REGION=ap-south-1 to deploy to Mumbai region');
}

// Create the main stack
new SanaathanaAalayaCharithraStack(app, `SanaathanaAalayaCharithraStack-${environment}`, {
  env: {
    account,
    region,
  },
  description: 'Sanaathana Aalaya Charithra - Temple Heritage Digitization Platform',
  tags: {
    Project: 'Sanaathana-Aalaya-Charithra',
    Environment: environment,
  },
});

// Create the Defect Tracking stack
new DefectTrackingStack(app, `DefectTrackingStack-${environment}`, {
  environment,
  env: {
    account,
    region,
  },
  description: 'Defect Tracking System - DynamoDB tables, Lambda functions, and API Gateway',
  tags: {
    Project: 'Sanaathana-Aalaya-Charithra',
    Feature: 'defect-tracking',
    Environment: environment,
  },
});

app.synth();