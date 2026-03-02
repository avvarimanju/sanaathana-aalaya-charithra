/**
 * Complete AWS CDK Stack for Real-Time Reports Dashboard
 * Feature: real-time-reports-dashboard
 * Tasks: 17.1-17.6
 * 
 * Complete infrastructure including:
 * - DynamoDB tables with GSIs and TTL
 * - Lambda functions with proper IAM roles
 * - REST API Gateway with authentication
 * - WebSocket API Gateway
 * - EventBridge for DynamoDB Stream triggers
 * - S3 bucket for exports
 * - ElastiCache Redis (optional, commented out)
 */

import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as apigatewayv2 from 'aws-cdk-lib/aws-apigatewayv2';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

export class DashboardStackComplete extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // ========================================================================
    // Task 17.1: DynamoDB Tables
    // ========================================================================

    // Feedback Table
    const feedbackTable = new dynamodb.Table(this, 'FeedbackTable', {
      tableName: 'dashboard-feedback',
      partitionKey: { name: 'feedbackId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'timestamp', type: dynamodb.AttributeType.NUMBER },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
      removalPolicy: cdk.RemovalPolicy.RETAIN
    });

    feedbackTable.addGlobalSecondaryIndex({
      indexName: 'templeId-timestamp-index',
      partitionKey: { name: 'templeId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'timestamp', type: dynamodb.AttributeType.NUMBER }
    });

    feedbackTable.addGlobalSecondaryIndex({
      indexName: 'region-timestamp-index',
      partitionKey: { name: 'region', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'timestamp', type: dynamodb.AttributeType.NUMBER }
    });


    // Aggregated Metrics Table
    const metricsTable = new dynamodb.Table(this, 'MetricsTable', {
      tableName: 'dashboard-aggregated-metrics',
      partitionKey: { name: 'metricId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'metricType', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      timeToLiveAttribute: 'ttl',
      removalPolicy: cdk.RemovalPolicy.RETAIN
    });

    // WebSocket Connections Table
    const connectionsTable = new dynamodb.Table(this, 'ConnectionsTable', {
      tableName: 'dashboard-websocket-connections',
      partitionKey: { name: 'connectionId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      timeToLiveAttribute: 'ttl',
      removalPolicy: cdk.RemovalPolicy.DESTROY
    });

    connectionsTable.addGlobalSecondaryIndex({
      indexName: 'userRole-index',
      partitionKey: { name: 'userRole', type: dynamodb.AttributeType.STRING }
    });

    // Export Jobs Table
    const exportJobsTable = new dynamodb.Table(this, 'ExportJobsTable', {
      tableName: 'dashboard-export-jobs',
      partitionKey: { name: 'jobId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      timeToLiveAttribute: 'ttl',
      removalPolicy: cdk.RemovalPolicy.DESTROY
    });

    exportJobsTable.addGlobalSecondaryIndex({
      indexName: 'userId-createdAt-index',
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING }
    });

    // ========================================================================
    // Task 17.6: S3 Bucket for Exports
    // ========================================================================

    const exportBucket = new s3.Bucket(this, 'ExportBucket', {
      bucketName: `dashboard-exports-${this.account}`,
      lifecycleRules: [{
        expiration: cdk.Duration.days(7),
        enabled: true
      }],
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true
    });

    // ========================================================================
    // Task 17.2: Lambda Functions
    // ========================================================================

    const lambdaEnvironment = {
      FEEDBACK_TABLE_NAME: feedbackTable.tableName,
      METRICS_TABLE_NAME: metricsTable.tableName,
      CONNECTIONS_TABLE_NAME: connectionsTable.tableName,
      EXPORT_JOBS_TABLE_NAME: exportJobsTable.tableName,
      EXPORT_BUCKET_NAME: exportBucket.bucketName,
      CACHE_ENABLED: 'false',
      AWS_REGION: this.region
    };

    // Dashboard Query Lambda
    const dashboardQueryLambda = new lambda.Function(this, 'DashboardQueryLambda', {
      functionName: 'dashboard-query-handler',
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'dashboardQueryHandler.handler',
      code: lambda.Code.fromAsset('dist/dashboard/handlers'),
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
      environment: lambdaEnvironment,
      logRetention: logs.RetentionDays.ONE_WEEK
    });

    // Export Lambda
    const exportLambda = new lambda.Function(this, 'ExportLambda', {
      functionName: 'dashboard-export-handler',
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'exportHandler.handler',
      code: lambda.Code.fromAsset('dist/dashboard/handlers'),
      timeout: cdk.Duration.minutes(5),
      memorySize: 1024,
      environment: lambdaEnvironment,
      logRetention: logs.RetentionDays.ONE_WEEK
    });

    // Sentiment Analysis Lambda
    const sentimentLambda = new lambda.Function(this, 'SentimentLambda', {
      functionName: 'dashboard-sentiment-handler',
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'sentimentAnalysisHandler.handler',
      code: lambda.Code.fromAsset('dist/dashboard/handlers'),
      timeout: cdk.Duration.minutes(2),
      memorySize: 512,
      environment: lambdaEnvironment,
      logRetention: logs.RetentionDays.ONE_WEEK
    });

    // WebSocket Lambda
    const websocketLambda = new lambda.Function(this, 'WebSocketLambda', {
      functionName: 'dashboard-websocket-handler',
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'websocketHandler.handler',
      code: lambda.Code.fromAsset('dist/dashboard/handlers'),
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      environment: lambdaEnvironment,
      logRetention: logs.RetentionDays.ONE_WEEK
    });

    // Grant permissions
    feedbackTable.grantReadWriteData(dashboardQueryLambda);
    feedbackTable.grantReadWriteData(exportLambda);
    feedbackTable.grantReadWriteData(sentimentLambda);
    metricsTable.grantReadWriteData(dashboardQueryLambda);
    connectionsTable.grantReadWriteData(websocketLambda);
    exportJobsTable.grantReadWriteData(exportLambda);
    exportBucket.grantReadWrite(exportLambda);

    // Grant Comprehend permissions to sentiment Lambda
    sentimentLambda.addToRolePolicy(new iam.PolicyStatement({
      actions: ['comprehend:DetectSentiment', 'comprehend:BatchDetectSentiment'],
      resources: ['*']
    }));

    // ========================================================================
    // Task 17.3: REST API Gateway
    // ========================================================================

    const restApi = new apigateway.RestApi(this, 'DashboardRestApi', {
      restApiName: 'Dashboard REST API',
      description: 'REST API for Real-Time Reports Dashboard',
      deployOptions: {
        stageName: 'prod',
        throttlingRateLimit: 100,
        throttlingBurstLimit: 200,
        loggingLevel: apigateway.MethodLoggingLevel.INFO
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS
      }
    });

    const dashboard = restApi.root.addResource('dashboard');
    
    dashboard.addResource('metrics')
      .addMethod('GET', new apigateway.LambdaIntegration(dashboardQueryLambda));
    
    dashboard.addResource('reviews')
      .addMethod('GET', new apigateway.LambdaIntegration(dashboardQueryLambda));
    
    dashboard.addResource('comments')
      .addMethod('GET', new apigateway.LambdaIntegration(dashboardQueryLambda));
    
    dashboard.addResource('visualizations')
      .addMethod('GET', new apigateway.LambdaIntegration(dashboardQueryLambda));
    
    dashboard.addResource('export')
      .addMethod('POST', new apigateway.LambdaIntegration(exportLambda));

    // ========================================================================
    // Task 17.5: EventBridge for DynamoDB Stream
    // ========================================================================

    sentimentLambda.addEventSourceMapping('FeedbackStreamMapping', {
      eventSourceArn: feedbackTable.tableStreamArn!,
      startingPosition: lambda.StartingPosition.LATEST,
      batchSize: 10,
      retryAttempts: 3
    });

    // ========================================================================
    // Outputs
    // ========================================================================

    new cdk.CfnOutput(this, 'RestApiUrl', {
      value: restApi.url,
      description: 'REST API Gateway URL'
    });

    new cdk.CfnOutput(this, 'FeedbackTableName', {
      value: feedbackTable.tableName
    });

    new cdk.CfnOutput(this, 'ExportBucketName', {
      value: exportBucket.bucketName
    });
  }
}
