import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as elasticache from 'aws-cdk-lib/aws-elasticache';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export interface TemplePricingStackProps extends cdk.StackProps {
  vpc?: ec2.IVpc;
  jwtSecretArn?: string;
}

export class TemplePricingStack extends cdk.Stack {
  public readonly api: apigateway.RestApi;
  public readonly contentBucket: s3.Bucket;
  public readonly qrCodeBucket: s3.Bucket;
  public readonly distribution: cloudfront.Distribution;
  public readonly tables: { [key: string]: dynamodb.Table };

  constructor(scope: Construct, id: string, props?: TemplePricingStackProps) {
    super(scope, id, props);

    // ========================================
    // DynamoDB Tables (12 tables)
    // ========================================

    // 1. Temples Table
    const templesTable = new dynamodb.Table(this, 'TemplesTable', {
      tableName: 'Temples',
      partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecovery: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    templesTable.addGlobalSecondaryIndex({
      indexName: 'GSI1',
      partitionKey: { name: 'GSI1PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'GSI1SK', type: dynamodb.AttributeType.STRING },
    });

    templesTable.addGlobalSecondaryIndex({
      indexName: 'GSI2',
      partitionKey: { name: 'GSI2PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'GSI2SK', type: dynamodb.AttributeType.STRING },
    });

    // 2. Temple Groups Table
    const templeGroupsTable = new dynamodb.Table(this, 'TempleGroupsTable', {
      tableName: 'TempleGroups',
      partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecovery: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    templeGroupsTable.addGlobalSecondaryIndex({
      indexName: 'GSI1',
      partitionKey: { name: 'GSI1PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'GSI1SK', type: dynamodb.AttributeType.STRING },
    });

    // 3. Temple Group Associations Table
    const associationsTable = new dynamodb.Table(this, 'TempleGroupAssociationsTable', {
      tableName: 'TempleGroupAssociations',
      partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecovery: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    associationsTable.addGlobalSecondaryIndex({
      indexName: 'GSI1',
      partitionKey: { name: 'GSI1PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'GSI1SK', type: dynamodb.AttributeType.STRING },
    });

    // 4. Artifacts Table
    const artifactsTable = new dynamodb.Table(this, 'ArtifactsTable', {
      tableName: 'Artifacts',
      partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecovery: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    artifactsTable.addGlobalSecondaryIndex({
      indexName: 'GSI1',
      partitionKey: { name: 'GSI1PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'GSI1SK', type: dynamodb.AttributeType.STRING },
    });

    // 5. Price Configurations Table
    const priceConfigsTable = new dynamodb.Table(this, 'PriceConfigurationsTable', {
      tableName: 'PriceConfigurations',
      partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecovery: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    priceConfigsTable.addGlobalSecondaryIndex({
      indexName: 'GSI1',
      partitionKey: { name: 'GSI1PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'GSI1SK', type: dynamodb.AttributeType.STRING },
    });

    // 6. Price History Table
    const priceHistoryTable = new dynamodb.Table(this, 'PriceHistoryTable', {
      tableName: 'PriceHistory',
      partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecovery: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    priceHistoryTable.addGlobalSecondaryIndex({
      indexName: 'GSI1',
      partitionKey: { name: 'GSI1PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'GSI1SK', type: dynamodb.AttributeType.STRING },
    });

    // 7. Pricing Formulas Table
    const formulasTable = new dynamodb.Table(this, 'PricingFormulasTable', {
      tableName: 'PricingFormulas',
      partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecovery: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // 8. Formula History Table
    const formulaHistoryTable = new dynamodb.Table(this, 'FormulaHistoryTable', {
      tableName: 'FormulaHistory',
      partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecovery: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // 9. Access Grants Table
    const accessGrantsTable = new dynamodb.Table(this, 'AccessGrantsTable', {
      tableName: 'AccessGrants',
      partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecovery: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    accessGrantsTable.addGlobalSecondaryIndex({
      indexName: 'GSI1',
      partitionKey: { name: 'GSI1PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'GSI1SK', type: dynamodb.AttributeType.STRING },
    });

    // 10. Price Overrides Table
    const overridesTable = new dynamodb.Table(this, 'PriceOverridesTable', {
      tableName: 'PriceOverrides',
      partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecovery: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    overridesTable.addGlobalSecondaryIndex({
      indexName: 'GSI1',
      partitionKey: { name: 'GSI1PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'GSI1SK', type: dynamodb.AttributeType.STRING },
    });

    // 11. Audit Log Table
    const auditLogTable = new dynamodb.Table(this, 'AuditLogTable', {
      tableName: 'AuditLog',
      partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecovery: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    auditLogTable.addGlobalSecondaryIndex({
      indexName: 'GSI1',
      partitionKey: { name: 'GSI1PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'GSI1SK', type: dynamodb.AttributeType.STRING },
    });

    auditLogTable.addGlobalSecondaryIndex({
      indexName: 'GSI2',
      partitionKey: { name: 'GSI2PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'GSI2SK', type: dynamodb.AttributeType.STRING },
    });

    // 12. Content Packages Table
    const contentPackagesTable = new dynamodb.Table(this, 'ContentPackagesTable', {
      tableName: 'ContentPackages',
      partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecovery: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    contentPackagesTable.addGlobalSecondaryIndex({
      indexName: 'GSI1',
      partitionKey: { name: 'GSI1PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'GSI1SK', type: dynamodb.AttributeType.STRING },
    });

    contentPackagesTable.addGlobalSecondaryIndex({
      indexName: 'GSI2',
      partitionKey: { name: 'GSI2PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'GSI2SK', type: dynamodb.AttributeType.STRING },
    });

    // 13. Download History Table
    const downloadHistoryTable = new dynamodb.Table(this, 'DownloadHistoryTable', {
      tableName: 'DownloadHistory',
      partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecovery: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    downloadHistoryTable.addGlobalSecondaryIndex({
      indexName: 'GSI1',
      partitionKey: { name: 'GSI1PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'GSI1SK', type: dynamodb.AttributeType.STRING },
    });

    downloadHistoryTable.addGlobalSecondaryIndex({
      indexName: 'GSI2',
      partitionKey: { name: 'GSI2PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'GSI2SK', type: dynamodb.AttributeType.STRING },
    });

    // Store tables for reference
    this.tables = {
      temples: templesTable,
      templeGroups: templeGroupsTable,
      associations: associationsTable,
      artifacts: artifactsTable,
      priceConfigs: priceConfigsTable,
      priceHistory: priceHistoryTable,
      formulas: formulasTable,
      formulaHistory: formulaHistoryTable,
      accessGrants: accessGrantsTable,
      overrides: overridesTable,
      auditLog: auditLogTable,
      contentPackages: contentPackagesTable,
      downloadHistory: downloadHistoryTable,
    };

    // ========================================
    // S3 Buckets
    // ========================================

    // QR Code Images Bucket
    this.qrCodeBucket = new s3.Bucket(this, 'QRCodeBucket', {
      bucketName: `temple-qr-codes-${this.account}-${this.region}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      lifecycleRules: [
        {
          id: 'DeleteOldVersions',
          noncurrentVersionExpiration: cdk.Duration.days(90),
        },
      ],
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // Content Packages Bucket
    this.contentBucket = new s3.Bucket(this, 'ContentPackagesBucket', {
      bucketName: `temple-content-packages-${this.account}-${this.region}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      lifecycleRules: [
        {
          id: 'ArchiveOldVersions',
          noncurrentVersionTransitions: [
            {
              storageClass: s3.StorageClass.GLACIER,
              transitionAfter: cdk.Duration.days(90),
            },
          ],
          noncurrentVersionExpiration: cdk.Duration.days(365),
        },
        {
          id: 'IntelligentTiering',
          transitions: [
            {
              storageClass: s3.StorageClass.INTELLIGENT_TIERING,
              transitionAfter: cdk.Duration.days(0),
            },
          ],
        },
      ],
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // ========================================
    // CloudFront Distribution
    // ========================================

    this.distribution = new cloudfront.Distribution(this, 'ContentDistribution', {
      defaultBehavior: {
        origin: new origins.S3Origin(this.contentBucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.HTTPS_ONLY,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        compress: true,
      },
      priceClass: cloudfront.PriceClass.PRICE_CLASS_ALL,
      enableLogging: true,
      comment: 'Temple Content Package Distribution',
    });

    // ========================================
    // VPC for ElastiCache (if not provided)
    // ========================================

    const vpc = props?.vpc || new ec2.Vpc(this, 'TemplePricingVPC', {
      maxAzs: 2,
      natGateways: 1,
    });

    // ========================================
    // ElastiCache Redis Cluster
    // ========================================

    const cacheSubnetGroup = new elasticache.CfnSubnetGroup(this, 'CacheSubnetGroup', {
      description: 'Subnet group for Temple Pricing Redis cache',
      subnetIds: vpc.privateSubnets.map(subnet => subnet.subnetId),
      cacheSubnetGroupName: 'temple-pricing-cache-subnet-group',
    });

    const cacheSecurityGroup = new ec2.SecurityGroup(this, 'CacheSecurityGroup', {
      vpc,
      description: 'Security group for Temple Pricing Redis cache',
      allowAllOutbound: true,
    });

    cacheSecurityGroup.addIngressRule(
      ec2.Peer.ipv4(vpc.vpcCidrBlock),
      ec2.Port.tcp(6379),
      'Allow Redis access from VPC'
    );

    const redisCluster = new elasticache.CfnCacheCluster(this, 'RedisCluster', {
      cacheNodeType: 'cache.t3.micro',
      engine: 'redis',
      numCacheNodes: 1,
      cacheSubnetGroupName: cacheSubnetGroup.cacheSubnetGroupName,
      vpcSecurityGroupIds: [cacheSecurityGroup.securityGroupId],
      clusterName: 'temple-pricing-cache',
    });

    redisCluster.addDependency(cacheSubnetGroup);

    // ========================================
    // Lambda Layer for Shared Code
    // ========================================

    const sharedLayer = new lambda.LayerVersion(this, 'TemplePricingSharedLayer', {
      code: lambda.Code.fromAsset('src/temple-pricing/shared'),
      compatibleRuntimes: [lambda.Runtime.NODEJS_18_X],
      description: 'Shared utilities and types for Temple Pricing',
    });

    // ========================================
    // Lambda Functions (5 services)
    // ========================================

    const lambdaEnvironment = {
      TEMPLES_TABLE: templesTable.tableName,
      TEMPLE_GROUPS_TABLE: templeGroupsTable.tableName,
      ASSOCIATIONS_TABLE: associationsTable.tableName,
      ARTIFACTS_TABLE: artifactsTable.tableName,
      PRICE_CONFIGS_TABLE: priceConfigsTable.tableName,
      PRICE_HISTORY_TABLE: priceHistoryTable.tableName,
      FORMULAS_TABLE: formulasTable.tableName,
      FORMULA_HISTORY_TABLE: formulaHistoryTable.tableName,
      ACCESS_GRANTS_TABLE: accessGrantsTable.tableName,
      OVERRIDES_TABLE: overridesTable.tableName,
      AUDIT_LOG_TABLE: auditLogTable.tableName,
      CONTENT_PACKAGES_TABLE: contentPackagesTable.tableName,
      DOWNLOAD_HISTORY_TABLE: downloadHistoryTable.tableName,
      QR_CODE_BUCKET: this.qrCodeBucket.bucketName,
      CONTENT_BUCKET: this.contentBucket.bucketName,
      CLOUDFRONT_DOMAIN: this.distribution.distributionDomainName,
      REDIS_ENDPOINT: redisCluster.attrRedisEndpointAddress,
      REDIS_PORT: redisCluster.attrRedisEndpointPort,
    };

    // 1. Temple Management Service Lambda
    const templeManagementLambda = new lambda.Function(this, 'TempleManagementFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('src/temple-pricing/lambdas/temple-management'),
      environment: lambdaEnvironment,
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
      layers: [sharedLayer],
      vpc,
      logRetention: logs.RetentionDays.ONE_MONTH,
    });

    // 2. Pricing Service Lambda
    const pricingServiceLambda = new lambda.Function(this, 'PricingServiceFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('src/temple-pricing/lambdas/pricing-service'),
      environment: lambdaEnvironment,
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
      layers: [sharedLayer],
      vpc,
      logRetention: logs.RetentionDays.ONE_MONTH,
    });

    // 3. Price Calculator Lambda
    const priceCalculatorLambda = new lambda.Function(this, 'PriceCalculatorFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('src/temple-pricing/lambdas/price-calculator'),
      environment: lambdaEnvironment,
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
      layers: [sharedLayer],
      vpc,
      logRetention: logs.RetentionDays.ONE_MONTH,
    });

    // 4. Access Control Service Lambda
    const accessControlLambda = new lambda.Function(this, 'AccessControlFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('src/temple-pricing/lambdas/access-control'),
      environment: lambdaEnvironment,
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
      layers: [sharedLayer],
      vpc,
      logRetention: logs.RetentionDays.ONE_MONTH,
    });

    // 5. Content Package Service Lambda
    const contentPackageLambda = new lambda.Function(this, 'ContentPackageFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('src/temple-pricing/lambdas/content-package'),
      environment: lambdaEnvironment,
      timeout: cdk.Duration.minutes(5),
      memorySize: 1024,
      layers: [sharedLayer],
      vpc,
      logRetention: logs.RetentionDays.ONE_MONTH,
    });

    // Grant DynamoDB permissions to all Lambdas
    const lambdas = [
      templeManagementLambda,
      pricingServiceLambda,
      priceCalculatorLambda,
      accessControlLambda,
      contentPackageLambda,
    ];

    Object.values(this.tables).forEach(table => {
      lambdas.forEach(lambda => {
        table.grantReadWriteData(lambda);
      });
    });

    // Grant S3 permissions
    this.qrCodeBucket.grantReadWrite(templeManagementLambda);
    this.contentBucket.grantReadWrite(contentPackageLambda);
    this.contentBucket.grantRead(accessControlLambda);

    // Grant CloudFront permissions
    contentPackageLambda.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['cloudfront:CreateInvalidation'],
        resources: [`arn:aws:cloudfront::${this.account}:distribution/${this.distribution.distributionId}`],
      })
    );

    // ========================================
    // API Gateway
    // ========================================

    this.api = new apigateway.RestApi(this, 'TemplePricingApi', {
      restApiName: 'Temple Pricing Management API',
      description: 'API for Temple Pricing Management System',
      deployOptions: {
        stageName: 'prod',
        throttlingRateLimit: 100,
        throttlingBurstLimit: 200,
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: true,
        metricsEnabled: true,
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'Authorization', 'X-Api-Key'],
        maxAge: cdk.Duration.hours(1),
      },
    });

    // JWT Authorizer (if JWT secret provided)
    let authorizer: apigateway.IAuthorizer | undefined;
    if (props?.jwtSecretArn) {
      // Create custom authorizer Lambda
      const authorizerLambda = new lambda.Function(this, 'JwtAuthorizerFunction', {
        runtime: lambda.Runtime.NODEJS_18_X,
        handler: 'index.handler',
        code: lambda.Code.fromAsset('src/temple-pricing/lambdas/authorizer'),
        environment: {
          JWT_SECRET_ARN: props.jwtSecretArn,
        },
        timeout: cdk.Duration.seconds(10),
      });

      authorizer = new apigateway.TokenAuthorizer(this, 'JwtAuthorizer', {
        handler: authorizerLambda,
        identitySource: 'method.request.header.Authorization',
        resultsCacheTtl: cdk.Duration.minutes(5),
      });
    }

    // API Resources and Methods
    const adminApi = this.api.root.addResource('api').addResource('admin');
    const mobileApi = this.api.root.addResource('api').addResource('mobile');

    // Temple Management endpoints
    const templesResource = adminApi.addResource('temples');
    templesResource.addMethod('POST', new apigateway.LambdaIntegration(templeManagementLambda), { authorizer });
    templesResource.addMethod('GET', new apigateway.LambdaIntegration(templeManagementLambda), { authorizer });

    const templeResource = templesResource.addResource('{templeId}');
    templeResource.addMethod('GET', new apigateway.LambdaIntegration(templeManagementLambda), { authorizer });
    templeResource.addMethod('PUT', new apigateway.LambdaIntegration(templeManagementLambda), { authorizer });
    templeResource.addMethod('DELETE', new apigateway.LambdaIntegration(templeManagementLambda), { authorizer });

    // Pricing endpoints
    const pricingResource = adminApi.addResource('pricing');
    const entityPriceResource = pricingResource.addResource('entity').addResource('{entityId}');
    entityPriceResource.addMethod('GET', new apigateway.LambdaIntegration(pricingServiceLambda), { authorizer });
    entityPriceResource.addMethod('POST', new apigateway.LambdaIntegration(pricingServiceLambda), { authorizer });

    // Mobile pricing endpoints
    const mobilePricingResource = mobileApi.addResource('pricing').addResource('{entityId}');
    mobilePricingResource.addMethod('GET', new apigateway.LambdaIntegration(pricingServiceLambda));

    // Access control endpoints
    const accessResource = this.api.root.addResource('api').addResource('access');
    accessResource.addResource('verify').addMethod('POST', new apigateway.LambdaIntegration(accessControlLambda));
    accessResource.addResource('grant').addMethod('POST', new apigateway.LambdaIntegration(accessControlLambda));

    // Content package endpoints
    const contentResource = mobileApi.addResource('content-packages');
    const packageResource = contentResource.addResource('{entityId}');
    packageResource.addResource('info').addMethod('GET', new apigateway.LambdaIntegration(contentPackageLambda));
    packageResource.addResource('download-url').addMethod('POST', new apigateway.LambdaIntegration(contentPackageLambda));

    // ========================================
    // CloudWatch Alarms
    // ========================================

    // API Gateway 5xx errors
    const apiErrorAlarm = this.api.metricServerError().createAlarm(this, 'ApiErrorAlarm', {
      threshold: 10,
      evaluationPeriods: 2,
      alarmDescription: 'Alert when API Gateway 5xx errors exceed threshold',
    });

    // Lambda errors
    lambdas.forEach((lambda, index) => {
      lambda.metricErrors().createAlarm(this, `Lambda${index}ErrorAlarm`, {
        threshold: 5,
        evaluationPeriods: 2,
        alarmDescription: `Alert when Lambda ${lambda.functionName} errors exceed threshold`,
      });
    });

    // ========================================
    // Outputs
    // ========================================

    new cdk.CfnOutput(this, 'ApiEndpoint', {
      value: this.api.url,
      description: 'Temple Pricing API Gateway endpoint',
    });

    new cdk.CfnOutput(this, 'CloudFrontDomain', {
      value: this.distribution.distributionDomainName,
      description: 'CloudFront distribution domain for content packages',
    });

    new cdk.CfnOutput(this, 'RedisEndpoint', {
      value: `${redisCluster.attrRedisEndpointAddress}:${redisCluster.attrRedisEndpointPort}`,
      description: 'Redis cache endpoint',
    });
  }
}
