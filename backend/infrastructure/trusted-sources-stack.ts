// Trusted Sources Infrastructure Stack
// DynamoDB tables and Lambda functions for trusted sources management

import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export class TrustedSourcesStack extends cdk.Stack {
  public readonly trustedSourcesTable: dynamodb.Table;
  public readonly templeSourceMappingTable: dynamodb.Table;
  public readonly trustedSourcesApi: apigateway.RestApi;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // ============================================================================
    // DynamoDB Tables
    // ============================================================================

    // TrustedSources Table
    this.trustedSourcesTable = new dynamodb.Table(this, 'TrustedSourcesTable', {
      tableName: 'TrustedSources',
      partitionKey: {
        name: 'sourceId',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      pointInTimeRecovery: true,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
    });

    // Add GSI for querying by source type
    this.trustedSourcesTable.addGlobalSecondaryIndex({
      indexName: 'SourceTypeIndex',
      partitionKey: {
        name: 'sourceType',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'trustScore',
        type: dynamodb.AttributeType.NUMBER,
      },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // Add GSI for querying by verification status
    this.trustedSourcesTable.addGlobalSecondaryIndex({
      indexName: 'VerificationStatusIndex',
      partitionKey: {
        name: 'verificationStatus',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'addedDate',
        type: dynamodb.AttributeType.STRING,
      },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // TempleSourceMapping Table
    this.templeSourceMappingTable = new dynamodb.Table(this, 'TempleSourceMappingTable', {
      tableName: 'TempleSourceMapping',
      partitionKey: {
        name: 'mappingId',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      pointInTimeRecovery: true,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
    });

    // Add GSI for querying by temple ID
    this.templeSourceMappingTable.addGlobalSecondaryIndex({
      indexName: 'TempleIdIndex',
      partitionKey: {
        name: 'templeId',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'priority',
        type: dynamodb.AttributeType.NUMBER,
      },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // Add GSI for querying by source ID
    this.templeSourceMappingTable.addGlobalSecondaryIndex({
      indexName: 'SourceIdIndex',
      partitionKey: {
        name: 'sourceId',
        type: dynamodb.AttributeType.STRING,
      },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // ============================================================================
    // Lambda Functions
    // ============================================================================

    // Trusted Sources Lambda
    const trustedSourcesLambda = new lambda.Function(this, 'TrustedSourcesLambda', {
      functionName: 'TrustedSourcesHandler',
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'trusted-sources.handler',
      code: lambda.Code.fromAsset('../lambdas'),
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
      environment: {
        TRUSTED_SOURCES_TABLE: this.trustedSourcesTable.tableName,
        NODE_ENV: 'production',
      },
    });

    // Temple Sources Lambda
    const templeSourcesLambda = new lambda.Function(this, 'TempleSourcesLambda', {
      functionName: 'TempleSourcesHandler',
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'temple-sources.handler',
      code: lambda.Code.fromAsset('../lambdas'),
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
      environment: {
        TEMPLE_SOURCE_MAPPING_TABLE: this.templeSourceMappingTable.tableName,
        TRUSTED_SOURCES_TABLE: this.trustedSourcesTable.tableName,
        NODE_ENV: 'production',
      },
    });

    // Grant DynamoDB permissions
    this.trustedSourcesTable.grantReadWriteData(trustedSourcesLambda);
    this.templeSourceMappingTable.grantReadWriteData(templeSourcesLambda);
    this.trustedSourcesTable.grantReadData(templeSourcesLambda);

    // ============================================================================
    // API Gateway
    // ============================================================================

    this.trustedSourcesApi = new apigateway.RestApi(this, 'TrustedSourcesApi', {
      restApiName: 'Trusted Sources API',
      description: 'API for managing trusted sources',
      deployOptions: {
        stageName: 'prod',
        throttlingRateLimit: 100,
        throttlingBurstLimit: 200,
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'Authorization'],
      },
    });

    // /admin/trusted-sources
    const adminResource = this.trustedSourcesApi.root.addResource('admin');
    const trustedSourcesResource = adminResource.addResource('trusted-sources');

    // GET /admin/trusted-sources - List all sources
    trustedSourcesResource.addMethod(
      'GET',
      new apigateway.LambdaIntegration(trustedSourcesLambda)
    );

    // POST /admin/trusted-sources - Create new source
    trustedSourcesResource.addMethod(
      'POST',
      new apigateway.LambdaIntegration(trustedSourcesLambda)
    );

    // /admin/trusted-sources/{sourceId}
    const sourceIdResource = trustedSourcesResource.addResource('{sourceId}');

    // GET /admin/trusted-sources/{sourceId} - Get source details
    sourceIdResource.addMethod(
      'GET',
      new apigateway.LambdaIntegration(trustedSourcesLambda)
    );

    // PUT /admin/trusted-sources/{sourceId} - Update source
    sourceIdResource.addMethod(
      'PUT',
      new apigateway.LambdaIntegration(trustedSourcesLambda)
    );

    // DELETE /admin/trusted-sources/{sourceId} - Delete source
    sourceIdResource.addMethod(
      'DELETE',
      new apigateway.LambdaIntegration(trustedSourcesLambda)
    );

    // /admin/trusted-sources/{sourceId}/verify
    const verifyResource = sourceIdResource.addResource('verify');
    verifyResource.addMethod(
      'POST',
      new apigateway.LambdaIntegration(trustedSourcesLambda)
    );

    // /admin/trusted-sources/{sourceId}/unverify
    const unverifyResource = sourceIdResource.addResource('unverify');
    unverifyResource.addMethod(
      'POST',
      new apigateway.LambdaIntegration(trustedSourcesLambda)
    );

    // /admin/temples/{templeId}/sources
    const templesResource = adminResource.addResource('temples');
    const templeIdResource = templesResource.addResource('{templeId}');
    const sourcesResource = templeIdResource.addResource('sources');

    // GET /admin/temples/{templeId}/sources - Get sources for temple
    sourcesResource.addMethod(
      'GET',
      new apigateway.LambdaIntegration(templeSourcesLambda)
    );

    // POST /admin/temples/{templeId}/sources - Add source to temple
    sourcesResource.addMethod(
      'POST',
      new apigateway.LambdaIntegration(templeSourcesLambda)
    );

    // DELETE /admin/temples/{templeId}/sources/{sourceId} - Remove source from temple
    const templeSourceIdResource = sourcesResource.addResource('{sourceId}');
    templeSourceIdResource.addMethod(
      'DELETE',
      new apigateway.LambdaIntegration(templeSourcesLambda)
    );

    // ============================================================================
    // Outputs
    // ============================================================================

    new cdk.CfnOutput(this, 'TrustedSourcesTableName', {
      value: this.trustedSourcesTable.tableName,
      description: 'Trusted Sources DynamoDB Table Name',
    });

    new cdk.CfnOutput(this, 'TempleSourceMappingTableName', {
      value: this.templeSourceMappingTable.tableName,
      description: 'Temple Source Mapping DynamoDB Table Name',
    });

    new cdk.CfnOutput(this, 'TrustedSourcesApiUrl', {
      value: this.trustedSourcesApi.url,
      description: 'Trusted Sources API Gateway URL',
    });

    new cdk.CfnOutput(this, 'TrustedSourcesLambdaArn', {
      value: trustedSourcesLambda.functionArn,
      description: 'Trusted Sources Lambda Function ARN',
    });

    new cdk.CfnOutput(this, 'TempleSourcesLambdaArn', {
      value: templeSourcesLambda.functionArn,
      description: 'Temple Sources Lambda Function ARN',
    });
  }
}
