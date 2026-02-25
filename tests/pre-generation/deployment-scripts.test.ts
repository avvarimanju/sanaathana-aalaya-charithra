/**
 * Tests for Lambda deployment scripts
 * 
 * Verifies that deployment scripts exist and are properly configured
 * for deploying the Pre-Generation Lambda function to AWS.
 */

import * as fs from 'fs';
import * as path from 'path';

describe('Lambda Deployment Scripts', () => {
  const projectRoot = path.join(__dirname, '../..');
  
  describe('Bash deployment script', () => {
    const scriptPath = path.join(projectRoot, 'scripts/deploy-pre-generation-lambda.sh');
    
    it('should exist', () => {
      expect(fs.existsSync(scriptPath)).toBe(true);
    });
    
    it('should be a shell script', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      expect(content).toMatch(/^#!\/bin\/bash/);
    });
    
    it('should have proper documentation', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      expect(content).toContain('Pre-Generation Lambda Deployment Script');
      expect(content).toContain('Usage:');
      expect(content).toContain('Options:');
      expect(content).toContain('Requirements:');
    });
    
    it('should support command line options', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      expect(content).toContain('--skip-build');
      expect(content).toContain('--skip-bundle');
      expect(content).toContain('--skip-deploy');
      expect(content).toContain('--verify-only');
      expect(content).toContain('--help');
    });
    
    it('should check prerequisites', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      expect(content).toContain('node');
      expect(content).toContain('npm');
      expect(content).toContain('aws');
      expect(content).toContain('cdk');
    });
    
    it('should perform build, bundle, and deploy steps', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      expect(content).toContain('npm run build');
      expect(content).toContain('npm run bundle');
      expect(content).toContain('cdk deploy');
    });
    
    it('should verify deployment', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      expect(content).toContain('aws lambda get-function');
      expect(content).toContain('SanaathanaAalayaCharithra-PreGeneration');
    });
    
    it('should check environment variables', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      expect(content).toContain('S3_BUCKET');
      expect(content).toContain('DYNAMODB_PROGRESS_TABLE');
      expect(content).toContain('DYNAMODB_CACHE_TABLE');
      expect(content).toContain('BATCH_SIZE');
    });
  });
  
  describe('PowerShell deployment script', () => {
    const scriptPath = path.join(projectRoot, 'scripts/deploy-pre-generation-lambda.ps1');
    
    it('should exist', () => {
      expect(fs.existsSync(scriptPath)).toBe(true);
    });
    
    it('should be a PowerShell script', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      expect(content).toContain('param(');
      expect(content).toContain('[switch]');
    });
    
    it('should have proper documentation', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      expect(content).toContain('Pre-Generation Lambda Deployment Script');
      expect(content).toContain('Usage:');
      expect(content).toContain('Options:');
      expect(content).toContain('Requirements:');
    });
    
    it('should support command line parameters', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      expect(content).toContain('SkipBuild');
      expect(content).toContain('SkipBundle');
      expect(content).toContain('SkipDeploy');
      expect(content).toContain('VerifyOnly');
      expect(content).toContain('Help');
    });
    
    it('should check prerequisites', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      expect(content).toContain('node');
      expect(content).toContain('npm');
      expect(content).toContain('aws');
      expect(content).toContain('cdk');
    });
    
    it('should perform build, bundle, and deploy steps', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      expect(content).toContain('npm run build');
      expect(content).toContain('npm run bundle');
      expect(content).toContain('cdk deploy');
    });
    
    it('should verify deployment', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      expect(content).toContain('aws lambda get-function');
      expect(content).toContain('SanaathanaAalayaCharithra-PreGeneration');
    });
    
    it('should check environment variables', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      expect(content).toContain('S3_BUCKET');
      expect(content).toContain('DYNAMODB_PROGRESS_TABLE');
      expect(content).toContain('DYNAMODB_CACHE_TABLE');
      expect(content).toContain('BATCH_SIZE');
    });
  });
  
  describe('NPM deployment scripts', () => {
    it('should have deploy:pre-generation script', () => {
      const packageJson = require('../../package.json');
      expect(packageJson.scripts['deploy:pre-generation']).toBeDefined();
      expect(packageJson.scripts['deploy:pre-generation']).toContain('deploy-pre-generation-lambda.sh');
    });
    
    it('should have deploy:pre-generation:verify script', () => {
      const packageJson = require('../../package.json');
      expect(packageJson.scripts['deploy:pre-generation:verify']).toBeDefined();
      expect(packageJson.scripts['deploy:pre-generation:verify']).toContain('--verify-only');
    });
  });
  
  describe('Deployment documentation', () => {
    const docPath = path.join(projectRoot, 'docs/PRE_GENERATION_LAMBDA_DEPLOYMENT.md');
    
    it('should exist', () => {
      expect(fs.existsSync(docPath)).toBe(true);
    });
    
    it('should have comprehensive content', () => {
      const content = fs.readFileSync(docPath, 'utf-8');
      
      // Check main sections
      expect(content).toContain('# Pre-Generation Lambda Deployment Guide');
      expect(content).toContain('## Overview');
      expect(content).toContain('## Prerequisites');
      expect(content).toContain('## Deployment Methods');
      expect(content).toContain('## Quick Start');
      expect(content).toContain('## Verification');
      expect(content).toContain('## Invoking the Lambda Function');
      expect(content).toContain('## Monitoring and Logs');
      expect(content).toContain('## Troubleshooting');
      expect(content).toContain('## Cost Considerations');
    });
    
    it('should document all deployment methods', () => {
      const content = fs.readFileSync(docPath, 'utf-8');
      expect(content).toContain('npm run deploy:pre-generation');
      expect(content).toContain('deploy-pre-generation-lambda.sh');
      expect(content).toContain('deploy-pre-generation-lambda.ps1');
    });
    
    it('should include Lambda invocation examples', () => {
      const content = fs.readFileSync(docPath, 'utf-8');
      expect(content).toContain('aws lambda invoke');
      expect(content).toContain('SanaathanaAalayaCharithra-PreGeneration');
      expect(content).toContain('response.json');
    });
    
    it('should document environment variables', () => {
      const content = fs.readFileSync(docPath, 'utf-8');
      expect(content).toContain('S3_BUCKET');
      expect(content).toContain('DYNAMODB_PROGRESS_TABLE');
      expect(content).toContain('DYNAMODB_CACHE_TABLE');
      expect(content).toContain('BATCH_SIZE');
    });
    
    it('should include troubleshooting section', () => {
      const content = fs.readFileSync(docPath, 'utf-8');
      expect(content).toContain('Common Issues');
      expect(content).toContain('CDK not bootstrapped');
      expect(content).toContain('Lambda Timeout');
      expect(content).toContain('Bedrock Throttling');
    });
    
    it('should include cost information', () => {
      const content = fs.readFileSync(docPath, 'utf-8');
      expect(content).toContain('Lambda Costs');
      expect(content).toContain('Service Costs');
      expect(content).toContain('Cost Optimization');
    });
  });
  
  describe('CDK infrastructure', () => {
    const stackPath = path.join(projectRoot, 'infrastructure/stacks/sanaathana-aalaya-charithra-stack.ts');
    
    it('should define Pre-Generation Lambda function', () => {
      const content = fs.readFileSync(stackPath, 'utf-8');
      expect(content).toContain('PreGenerationLambda');
      expect(content).toContain('SanaathanaAalayaCharithra-PreGeneration');
    });
    
    it('should configure Lambda with correct settings', () => {
      const content = fs.readFileSync(stackPath, 'utf-8');
      expect(content).toContain('runtime: lambda.Runtime.NODEJS_18_X');
      expect(content).toContain('handler: \'pre-generation.handler\'');
      expect(content).toContain('timeout: cdk.Duration.minutes(5)');
      expect(content).toContain('memorySize: 1024');
    });
    
    it('should set required environment variables', () => {
      const content = fs.readFileSync(stackPath, 'utf-8');
      expect(content).toContain('S3_BUCKET');
      expect(content).toContain('DYNAMODB_PROGRESS_TABLE');
      expect(content).toContain('DYNAMODB_CACHE_TABLE');
      expect(content).toContain('BATCH_SIZE');
    });
    
    it('should configure IAM role with necessary permissions', () => {
      const content = fs.readFileSync(stackPath, 'utf-8');
      expect(content).toContain('PreGenerationLambdaExecutionRole');
      expect(content).toContain('bedrock:InvokeModel');
      expect(content).toContain('polly:SynthesizeSpeech');
      expect(content).toContain('s3:GetObject');
      expect(content).toContain('s3:PutObject');
      expect(content).toContain('dynamodb:GetItem');
      expect(content).toContain('dynamodb:PutItem');
      expect(content).toContain('lambda:InvokeFunction');
    });
    
    it('should output Lambda function details', () => {
      const content = fs.readFileSync(stackPath, 'utf-8');
      expect(content).toContain('PreGenerationLambdaArn');
      expect(content).toContain('PreGenerationLambdaName');
    });
  });
  
  describe('Integration with existing build process', () => {
    it('should use existing build script', () => {
      const packageJson = require('../../package.json');
      expect(packageJson.scripts['build']).toBe('tsc');
    });
    
    it('should use existing bundle script', () => {
      const packageJson = require('../../package.json');
      expect(packageJson.scripts['bundle']).toBeDefined();
      expect(packageJson.scripts['bundle']).toContain('esbuild');
    });
    
    it('should use existing deploy script', () => {
      const packageJson = require('../../package.json');
      expect(packageJson.scripts['deploy']).toBeDefined();
      expect(packageJson.scripts['deploy']).toContain('cdk deploy');
    });
  });
});
