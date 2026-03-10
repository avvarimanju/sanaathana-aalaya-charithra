/**
 * AWS CDK Stack for Real-Time Reports Dashboard
 * Feature: real-time-reports-dashboard
 * 
 * This stack defines the infrastructure for the dashboard feature including:
 * - DynamoDB tables
 * - Lambda functions
 * - API Gateway (REST and WebSocket)
 * - EventBridge rules
 * - S3 bucket for exports
 * 
 * NOTE: ElastiCache Redis is NOT included in initial deployment.
 * The CacheService is designed with graceful degradation and will
 * query DynamoDB directly when cache is disabled. ElastiCache can
 * be added later with zero code changes when needed for performance.
 */

import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export interface DashboardStackProps extends cdk.StackProps {
  environment: 'dev' | 'staging' | 'prod';
}

export class DashboardStack extends cdk.Stack {
  // DynamoDB Tables
  public readonly feedbackTable: dynamodb.Table;
  public readonly aggregatedMetricsTable: dynamodb.Table;
  public readonly webSocketConnectionsTable: dynamodb.Table;
  public readonly exportJobsTable: dynamodb.Table;

  // Lambda Functions
  public readonly dashboardQueryLambda: lambda.Function;
  public readonly exportLambda: lambda.Function;
  public readonly sentimentAnalysisLambda: lambda.Function;
  public readonly webSocketConnectLambda: lambda.Function;
  public readonly webSocketDisconnectLambda: lambda.Function;
  public readonly webSocketDefaultLambda: lambda.Function;

  // API Gateway
  public readonly restApi: apigateway.RestApi;
  // WebSocket API will be added in later tasks

  // S3 Bucket
  public readonly exportBucket: s3.Bucket;

  constructor(scope: Construct, id: string, props: DashboardStackProps) {
    super(scope, id, props);

    // ========================================================================
    // DynamoDB Tables
    // ========================================================================

    // Feedback Table with GSIs
    this.feedbackTable = new dynamodb.Table(this, 'FeedbackTable', {
      tableName: `${props.environment}-dashboard-feedback`,
      partitionKey: {
        name: 'feedbackId',
        type: dynamodb.AttributeType.STRING
      },
      sortKey: {
        name: 'timestamp',
        type: dynamodb.AttributeType.NUMBER
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
      removalPolicy: props.environment === 'prod' 
        ? cdk.RemovalPolicy.RETAIN 
        : cdk.RemovalPolicy.DESTROY,
      pointInTimeRecovery: props.environment === 'prod'
    });

    // GSI: templeId-timestamp-index
    this.feedbackTable.addGlobalSecondaryIndex({
      indexName: 'templeId-timestamp-index',
      partitionKey: {
        name: 'templeId',
        type: dynamodb.AttributeType.STRING
      },
      sortKey: {
        name: 'timestamp',
        type: dynamodb.AttributeType.NUMBER
      },
      projectionType: dynamodb.ProjectionType.ALL
    });

    // GSI: region-timestamp-index
    this.feedbackTable.addGlobalSecondaryIndex({
      indexName: 'region-timestamp-index',
      partitionKey: {
        name: 'region',
        type: dynamodb.AttributeType.STRING
      },
      sortKey: {
        name: 'timestamp',
        type: dynamodb.AttributeType.NUMBER
      },
      projectionType: dynamodb.ProjectionType.ALL
    });

    // GSI: sentimentLabel-timestamp-index
    this.feedbackTable.addGlobalSecondaryIndex({
      indexName: 'sentimentLabel-timestamp-index',
      partitionKey: {
        name: 'sentimentLabel',
        type: dynamodb.AttributeType.STRING
      },
      sortKey: {
        name: 'timestamp',
        type: dynamodb.AttributeType.NUMBER
      },
      projectionType: dynamodb.ProjectionType.ALL
    });

    // Aggregated Metrics Table with TTL
    this.aggregatedMetricsTable = new dynamodb.Table(this, 'AggregatedMetricsTable', {
      tableName: `${props.environment}-dashboard-aggregated-metrics`,
      partitionKey: {
        name: 'metricId',
        type: dynamodb.AttributeType.STRING
      },
      sortKey: {
        name: 'metricType',
        type: dynamodb.AttributeType.STRING
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      timeToLiveAttribute: 'ttl',
      removalPolicy: props.environment === 'prod' 
        ? cdk.RemovalPolicy.RETAIN 
        : cdk.RemovalPolicy.DESTROY
    });

    // WebSocket Connections Table with TTL
    this.webSocketConnectionsTable = new dynamodb.Table(this, 'WebSocketConnectionsTable', {
      tableName: `${props.environment}-dashboard-websocket-connections`,
      partitionKey: {
        name: 'connectionId',
        type: dynamodb.AttributeType.STRING
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      timeToLiveAttribute: 'ttl',
      removalPolicy: cdk.RemovalPolicy.DESTROY
    });

    // GSI: userId-index
    this.webSocketConnectionsTable.addGlobalSecondaryIndex({
      indexName: 'userId-index',
      partitionKey: {
        name: 'userId',
        type: dynamodb.AttributeType.STRING
      },
      projectionType: dynamodb.ProjectionType.ALL
    });

    // GSI: userRole-index
    this.webSocketConnectionsTable.addGlobalSecondaryIndex({
      indexName: 'userRole-index',
      partitionKey: {
        name: 'userRole',
        type: dynamodb.AttributeType.STRING
      },
      projectionType: dynamodb.ProjectionType.ALL
    });

    // Export Jobs Table with TTL
    this.exportJobsTable = new dynamodb.Table(this, 'ExportJobsTable', {
      tableName: `${props.environment}-dashboard-export-jobs`,
      partitionKey: {
        name: 'jobId',
        type: dynamodb.AttributeType.STRING
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      timeToLiveAttribute: 'ttl',
      removalPolicy: cdk.RemovalPolicy.DESTROY
    });

    // GSI: userId-createdAt-index
    this.exportJobsTable.addGlobalSecondaryIndex({
      indexName: 'userId-createdAt-index',
      partitionKey: {
        name: 'userId',
        type: dynamodb.AttributeType.STRING
      },
      sortKey: {
        name: 'createdAt',
        type: dynamodb.AttributeType.STRING
      },
      projectionType: dynamodb.ProjectionType.ALL
    });

    // ========================================================================
    // S3 Bucket for Exports
    // ========================================================================

    this.exportBucket = new s3.Bucket(this, 'ExportBucket', {
      bucketName: `${props.environment}-dashboard-exports-${this.account}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      lifecycleRules: [
        {
          id: 'DeleteOldExports',
          enabled: true,
          expiration: cdk.Duration.days(7)
        }
      ],
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true
    });

    // ========================================================================
    // Lambda Functions (Placeholders - will be implemented in later tasks)
    // ========================================================================

    // Note: Lambda function implementations will be added in subsequent tasks
    // For now, we're just defining the infrastructure structure

    // ========================================================================
    // API Gateway REST API (Placeholder)
    // ========================================================================

    this.restApi = new apigateway.RestApi(this, 'DashboardRestApi', {
      restApiName: `${props.environment}-dashboard-api`,
      description: 'REST API for Real-Time Reports Dashboard',
      deployOptions: {
        stageName: props.environment,
        throttlingRateLimit: 100,
        throttlingBurstLimit: 200
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'Authorization']
      }
    });

    // ========================================================================
    // Outputs
    // ========================================================================

    new cdk.CfnOutput(this, 'FeedbackTableName', {
      value: this.feedbackTable.tableName,
      description: 'Feedback DynamoDB Table Name'
    });

    new cdk.CfnOutput(this, 'AggregatedMetricsTableName', {
      value: this.aggregatedMetricsTable.tableName,
      description: 'Aggregated Metrics DynamoDB Table Name'
    });

    new cdk.CfnOutput(this, 'WebSocketConnectionsTableName', {
      value: this.webSocketConnectionsTable.tableName,
      description: 'WebSocket Connections DynamoDB Table Name'
    });

    new cdk.CfnOutput(this, 'ExportJobsTableName', {
      value: this.exportJobsTable.tableName,
      description: 'Export Jobs DynamoDB Table Name'
    });

    new cdk.CfnOutput(this, 'ExportBucketName', {
      value: this.exportBucket.bucketName,
      description: 'Export S3 Bucket Name'
    });

    new cdk.CfnOutput(this, 'RestApiUrl', {
      value: this.restApi.url,
      description: 'REST API Gateway URL'
    });
  }
}
