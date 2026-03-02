/**
 * AWS CDK Stack for Defect Tracking System
 * Feature: defect-tracking
 * 
 * This stack defines the infrastructure for the defect tracking feature including:
 * - DynamoDB tables (Defects, StatusUpdates, Notifications)
 * - Global Secondary Indexes (GSIs) for efficient queries
 * - TTL configuration for automatic notification cleanup
 * - Lambda functions (to be added in later tasks)
 * - API Gateway routes (to be added in later tasks)
 * 
 * Requirements: 9.1, 9.2, 9.3, 9.4
 */

import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import { Construct } from 'constructs';
import * as path from 'path';

export interface DefectTrackingStackProps extends cdk.StackProps {
  environment: 'dev' | 'staging' | 'prod';
}

export class DefectTrackingStack extends cdk.Stack {
  // DynamoDB Tables
  public readonly defectsTable: dynamodb.Table;
  public readonly statusUpdatesTable: dynamodb.Table;
  public readonly notificationsTable: dynamodb.Table;
  
  // API Gateway
  public readonly api: apigateway.RestApi;
  
  // Lambda Functions
  public readonly submitDefectLambda: lambda.Function;
  public readonly getUserDefectsLambda: lambda.Function;
  public readonly getDefectDetailsLambda: lambda.Function;
  public readonly getAllDefectsLambda: lambda.Function;
  public readonly updateDefectStatusLambda: lambda.Function;
  public readonly addStatusUpdateLambda: lambda.Function;
  public readonly getNotificationsLambda: lambda.Function;
  public readonly markNotificationReadLambda: lambda.Function;

  constructor(scope: Construct, id: string, props: DefectTrackingStackProps) {
    super(scope, id, props);

    // ========================================================================
    // Defects Table
    // ========================================================================

    this.defectsTable = new dynamodb.Table(this, 'DefectsTable', {
      tableName: `${props.environment}-defect-tracking-defects`,
      partitionKey: {
        name: 'defectId',
        type: dynamodb.AttributeType.STRING
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      pointInTimeRecovery: props.environment === 'prod',
      removalPolicy: props.environment === 'prod' 
        ? cdk.RemovalPolicy.RETAIN 
        : cdk.RemovalPolicy.DESTROY
    });

    // GSI-1: userId-createdAt-index
    // Used for: Retrieving all defects submitted by a specific user
    // Query pattern: Get user's defects sorted by creation time
    this.defectsTable.addGlobalSecondaryIndex({
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

    // GSI-2: status-createdAt-index
    // Used for: Admin filtering defects by status
    // Query pattern: Get all defects with a specific status sorted by creation time
    this.defectsTable.addGlobalSecondaryIndex({
      indexName: 'status-createdAt-index',
      partitionKey: {
        name: 'status',
        type: dynamodb.AttributeType.STRING
      },
      sortKey: {
        name: 'createdAt',
        type: dynamodb.AttributeType.STRING
      },
      projectionType: dynamodb.ProjectionType.ALL
    });

    // ========================================================================
    // StatusUpdates Table
    // ========================================================================

    this.statusUpdatesTable = new dynamodb.Table(this, 'StatusUpdatesTable', {
      tableName: `${props.environment}-defect-tracking-status-updates`,
      partitionKey: {
        name: 'updateId',
        type: dynamodb.AttributeType.STRING
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      removalPolicy: props.environment === 'prod' 
        ? cdk.RemovalPolicy.RETAIN 
        : cdk.RemovalPolicy.DESTROY
    });

    // GSI-1: defectId-timestamp-index
    // Used for: Retrieving all status updates for a specific defect
    // Query pattern: Get defect's update history sorted chronologically
    this.statusUpdatesTable.addGlobalSecondaryIndex({
      indexName: 'defectId-timestamp-index',
      partitionKey: {
        name: 'defectId',
        type: dynamodb.AttributeType.STRING
      },
      sortKey: {
        name: 'timestamp',
        type: dynamodb.AttributeType.STRING
      },
      projectionType: dynamodb.ProjectionType.ALL
    });

    // ========================================================================
    // Notifications Table
    // ========================================================================

    this.notificationsTable = new dynamodb.Table(this, 'NotificationsTable', {
      tableName: `${props.environment}-defect-tracking-notifications`,
      partitionKey: {
        name: 'notificationId',
        type: dynamodb.AttributeType.STRING
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      timeToLiveAttribute: 'ttl',
      removalPolicy: cdk.RemovalPolicy.DESTROY
    });

    // GSI-1: userId-createdAt-index
    // Used for: Retrieving all notifications for a specific user
    // Query pattern: Get user's notifications sorted by creation time
    this.notificationsTable.addGlobalSecondaryIndex({
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
    // Outputs
    // ========================================================================

    new cdk.CfnOutput(this, 'DefectsTableName', {
      value: this.defectsTable.tableName,
      description: 'Defects DynamoDB Table Name',
      exportName: `${props.environment}-DefectsTableName`
    });

    new cdk.CfnOutput(this, 'DefectsTableArn', {
      value: this.defectsTable.tableArn,
      description: 'Defects DynamoDB Table ARN',
      exportName: `${props.environment}-DefectsTableArn`
    });

    new cdk.CfnOutput(this, 'StatusUpdatesTableName', {
      value: this.statusUpdatesTable.tableName,
      description: 'Status Updates DynamoDB Table Name',
      exportName: `${props.environment}-StatusUpdatesTableName`
    });

    new cdk.CfnOutput(this, 'StatusUpdatesTableArn', {
      value: this.statusUpdatesTable.tableArn,
      description: 'Status Updates DynamoDB Table ARN',
      exportName: `${props.environment}-StatusUpdatesTableArn`
    });

    new cdk.CfnOutput(this, 'NotificationsTableName', {
      value: this.notificationsTable.tableName,
      description: 'Notifications DynamoDB Table Name',
      exportName: `${props.environment}-NotificationsTableName`
    });

    new cdk.CfnOutput(this, 'NotificationsTableArn', {
      value: this.notificationsTable.tableArn,
      description: 'Notifications DynamoDB Table ARN',
      exportName: `${props.environment}-NotificationsTableArn`
    });

    // ========================================================================
    // Lambda Functions
    // ========================================================================

    // Common Lambda environment variables
    const lambdaEnvironment = {
      DEFECTS_TABLE_NAME: this.defectsTable.tableName,
      STATUS_UPDATES_TABLE_NAME: this.statusUpdatesTable.tableName,
      NOTIFICATIONS_TABLE_NAME: this.notificationsTable.tableName,
      ENVIRONMENT: props.environment
    };

    // Common Lambda configuration
    const lambdaConfig = {
      runtime: lambda.Runtime.NODEJS_20_X,
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
      environment: lambdaEnvironment,
      bundling: {
        minify: true,
        sourceMap: true,
        target: 'es2020',
        externalModules: ['aws-sdk']
      }
    };

    // Submit Defect Lambda
    this.submitDefectLambda = new lambda.Function(this, 'SubmitDefectLambda', {
      ...lambdaConfig,
      functionName: `${props.environment}-defect-tracking-submit-defect`,
      code: lambda.Code.fromAsset(path.join(__dirname, '../../src/defect-tracking/lambdas')),
      handler: 'submit-defect.handler',
      description: 'Submit new defect report'
    });

    // Get User Defects Lambda
    this.getUserDefectsLambda = new lambda.Function(this, 'GetUserDefectsLambda', {
      ...lambdaConfig,
      functionName: `${props.environment}-defect-tracking-get-user-defects`,
      code: lambda.Code.fromAsset(path.join(__dirname, '../../src/defect-tracking/lambdas')),
      handler: 'get-user-defects.handler',
      description: 'Get defects for a specific user'
    });

    // Get Defect Details Lambda
    this.getDefectDetailsLambda = new lambda.Function(this, 'GetDefectDetailsLambda', {
      ...lambdaConfig,
      functionName: `${props.environment}-defect-tracking-get-defect-details`,
      code: lambda.Code.fromAsset(path.join(__dirname, '../../src/defect-tracking/lambdas')),
      handler: 'get-defect-details.handler',
      description: 'Get detailed information about a defect'
    });

    // Get All Defects Lambda (Admin)
    this.getAllDefectsLambda = new lambda.Function(this, 'GetAllDefectsLambda', {
      ...lambdaConfig,
      functionName: `${props.environment}-defect-tracking-get-all-defects`,
      code: lambda.Code.fromAsset(path.join(__dirname, '../../src/defect-tracking/lambdas')),
      handler: 'get-all-defects.handler',
      description: 'Get all defects (admin only)'
    });

    // Update Defect Status Lambda (Admin)
    this.updateDefectStatusLambda = new lambda.Function(this, 'UpdateDefectStatusLambda', {
      ...lambdaConfig,
      functionName: `${props.environment}-defect-tracking-update-status`,
      code: lambda.Code.fromAsset(path.join(__dirname, '../../src/defect-tracking/lambdas')),
      handler: 'update-defect-status.handler',
      description: 'Update defect status (admin only)'
    });

    // Add Status Update Lambda (Admin)
    this.addStatusUpdateLambda = new lambda.Function(this, 'AddStatusUpdateLambda', {
      ...lambdaConfig,
      functionName: `${props.environment}-defect-tracking-add-status-update`,
      code: lambda.Code.fromAsset(path.join(__dirname, '../../src/defect-tracking/lambdas')),
      handler: 'add-status-update.handler',
      description: 'Add status update comment (admin only)'
    });

    // Get Notifications Lambda
    this.getNotificationsLambda = new lambda.Function(this, 'GetNotificationsLambda', {
      ...lambdaConfig,
      functionName: `${props.environment}-defect-tracking-get-notifications`,
      code: lambda.Code.fromAsset(path.join(__dirname, '../../src/defect-tracking/lambdas')),
      handler: 'get-notifications.handler',
      description: 'Get user notifications'
    });

    // Mark Notification Read Lambda
    this.markNotificationReadLambda = new lambda.Function(this, 'MarkNotificationReadLambda', {
      ...lambdaConfig,
      functionName: `${props.environment}-defect-tracking-mark-notification-read`,
      code: lambda.Code.fromAsset(path.join(__dirname, '../../src/defect-tracking/lambdas')),
      handler: 'mark-notification-read.handler',
      description: 'Mark notification as read'
    });

    // ========================================================================
    // IAM Permissions
    // ========================================================================

    // Grant DynamoDB permissions to Lambda functions
    this.defectsTable.grantReadWriteData(this.submitDefectLambda);
    this.defectsTable.grantReadData(this.getUserDefectsLambda);
    this.defectsTable.grantReadData(this.getDefectDetailsLambda);
    this.defectsTable.grantReadData(this.getAllDefectsLambda);
    this.defectsTable.grantReadWriteData(this.updateDefectStatusLambda);
    this.defectsTable.grantReadWriteData(this.addStatusUpdateLambda);

    this.statusUpdatesTable.grantReadWriteData(this.updateDefectStatusLambda);
    this.statusUpdatesTable.grantReadWriteData(this.addStatusUpdateLambda);
    this.statusUpdatesTable.grantReadData(this.getDefectDetailsLambda);

    this.notificationsTable.grantReadWriteData(this.updateDefectStatusLambda);
    this.notificationsTable.grantReadWriteData(this.addStatusUpdateLambda);
    this.notificationsTable.grantReadData(this.getNotificationsLambda);
    this.notificationsTable.grantReadWriteData(this.markNotificationReadLambda);

    // ========================================================================
    // API Gateway
    // ========================================================================

    this.api = new apigateway.RestApi(this, 'DefectTrackingApi', {
      restApiName: `${props.environment}-defect-tracking-api`,
      description: 'API for Defect Tracking System',
      deployOptions: {
        stageName: props.environment,
        throttlingRateLimit: 100,  // Requests per second
        throttlingBurstLimit: 200, // Burst capacity
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: props.environment !== 'prod', // Disable in prod for performance
        metricsEnabled: true
      },
      defaultCorsPreflightOptions: {
        // Allow specific origins for mobile app and admin dashboard
        allowOrigins: props.environment === 'prod'
          ? [
              'https://app.sanaathana-aalaya-charithra.com',      // Mobile app
              'https://admin.sanaathana-aalaya-charithra.com'     // Admin dashboard
            ]
          : apigateway.Cors.ALL_ORIGINS, // Allow all in dev/staging
        allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowHeaders: [
          'Content-Type',
          'X-Amz-Date',
          'Authorization',
          'X-Api-Key',
          'X-Amz-Security-Token',
          'X-Requested-With'
        ],
        allowCredentials: true,
        maxAge: cdk.Duration.hours(1) // Cache preflight response for 1 hour
      }
    });

    // ========================================================================
    // Request/Response Models
    // ========================================================================

    // Submit Defect Request Model
    const submitDefectModel = this.api.addModel('SubmitDefectModel', {
      contentType: 'application/json',
      modelName: 'SubmitDefectRequest',
      schema: {
        schema: apigateway.JsonSchemaVersion.DRAFT4,
        title: 'Submit Defect Request',
        type: apigateway.JsonSchemaType.OBJECT,
        required: ['userId', 'title', 'description'],
        properties: {
          userId: {
            type: apigateway.JsonSchemaType.STRING,
            pattern: '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$',
            description: 'User ID (UUID format)'
          },
          title: {
            type: apigateway.JsonSchemaType.STRING,
            minLength: 5,
            maxLength: 200,
            description: 'Defect title'
          },
          description: {
            type: apigateway.JsonSchemaType.STRING,
            minLength: 10,
            maxLength: 5000,
            description: 'Detailed description of the defect'
          },
          stepsToReproduce: {
            type: apigateway.JsonSchemaType.STRING,
            maxLength: 5000,
            description: 'Steps to reproduce the defect (optional)'
          },
          expectedBehavior: {
            type: apigateway.JsonSchemaType.STRING,
            maxLength: 2000,
            description: 'Expected behavior (optional)'
          },
          actualBehavior: {
            type: apigateway.JsonSchemaType.STRING,
            maxLength: 2000,
            description: 'Actual behavior (optional)'
          },
          deviceInfo: {
            type: apigateway.JsonSchemaType.OBJECT,
            properties: {
              platform: {
                type: apigateway.JsonSchemaType.STRING,
                enum: ['android', 'ios']
              },
              osVersion: { type: apigateway.JsonSchemaType.STRING },
              appVersion: { type: apigateway.JsonSchemaType.STRING },
              deviceModel: { type: apigateway.JsonSchemaType.STRING }
            },
            required: ['platform', 'osVersion', 'appVersion']
          }
        }
      }
    });

    // Update Status Request Model
    const updateStatusModel = this.api.addModel('UpdateStatusModel', {
      contentType: 'application/json',
      modelName: 'UpdateStatusRequest',
      schema: {
        schema: apigateway.JsonSchemaVersion.DRAFT4,
        title: 'Update Status Request',
        type: apigateway.JsonSchemaType.OBJECT,
        required: ['newStatus'],
        properties: {
          newStatus: {
            type: apigateway.JsonSchemaType.STRING,
            enum: ['New', 'Acknowledged', 'In_Progress', 'Resolved', 'Closed'],
            description: 'New status for the defect'
          },
          comment: {
            type: apigateway.JsonSchemaType.STRING,
            maxLength: 2000,
            description: 'Optional comment about the status change'
          }
        }
      }
    });

    // Add Status Update Request Model
    const addStatusUpdateModel = this.api.addModel('AddStatusUpdateModel', {
      contentType: 'application/json',
      modelName: 'AddStatusUpdateRequest',
      schema: {
        schema: apigateway.JsonSchemaVersion.DRAFT4,
        title: 'Add Status Update Request',
        type: apigateway.JsonSchemaType.OBJECT,
        required: ['message'],
        properties: {
          message: {
            type: apigateway.JsonSchemaType.STRING,
            minLength: 1,
            maxLength: 2000,
            description: 'Status update message'
          }
        }
      }
    });

    // Success Response Model
    const successResponseModel = this.api.addModel('SuccessResponseModel', {
      contentType: 'application/json',
      modelName: 'SuccessResponse',
      schema: {
        schema: apigateway.JsonSchemaVersion.DRAFT4,
        title: 'Success Response',
        type: apigateway.JsonSchemaType.OBJECT,
        properties: {
          success: {
            type: apigateway.JsonSchemaType.BOOLEAN,
            description: 'Operation success indicator'
          },
          data: {
            type: apigateway.JsonSchemaType.OBJECT,
            description: 'Response data'
          }
        }
      }
    });

    // Error Response Model
    const errorResponseModel = this.api.addModel('ErrorResponseModel', {
      contentType: 'application/json',
      modelName: 'ErrorResponse',
      schema: {
        schema: apigateway.JsonSchemaVersion.DRAFT4,
        title: 'Error Response',
        type: apigateway.JsonSchemaType.OBJECT,
        required: ['error', 'message'],
        properties: {
          error: {
            type: apigateway.JsonSchemaType.STRING,
            description: 'Error code/type'
          },
          message: {
            type: apigateway.JsonSchemaType.STRING,
            description: 'Human-readable error message'
          },
          details: {
            type: apigateway.JsonSchemaType.ARRAY,
            description: 'Additional error details',
            items: {
              type: apigateway.JsonSchemaType.OBJECT
            }
          },
          requestId: {
            type: apigateway.JsonSchemaType.STRING,
            description: 'Request ID for debugging'
          }
        }
      }
    });

    // Request Validators
    const bodyValidator = new apigateway.RequestValidator(this, 'BodyValidator', {
      restApi: this.api,
      requestValidatorName: 'body-validator',
      validateRequestBody: true,
      validateRequestParameters: false
    });

    const paramsValidator = new apigateway.RequestValidator(this, 'ParamsValidator', {
      restApi: this.api,
      requestValidatorName: 'params-validator',
      validateRequestBody: false,
      validateRequestParameters: true
    });

    const fullValidator = new apigateway.RequestValidator(this, 'FullValidator', {
      restApi: this.api,
      requestValidatorName: 'full-validator',
      validateRequestBody: true,
      validateRequestParameters: true
    });

    // ========================================================================
    // API Routes - User Endpoints
    // ========================================================================

    // POST /defects - Submit defect
    const defects = this.api.root.addResource('defects');
    defects.addMethod('POST', new apigateway.LambdaIntegration(this.submitDefectLambda, {
      proxy: true,
      integrationResponses: [
        {
          statusCode: '201',
          responseParameters: {
            'method.response.header.Access-Control-Allow-Origin': "'*'"
          }
        },
        {
          statusCode: '400',
          selectionPattern: '.*VALIDATION_ERROR.*',
          responseParameters: {
            'method.response.header.Access-Control-Allow-Origin': "'*'"
          }
        }
      ]
    }), {
      apiKeyRequired: false,
      requestValidator: bodyValidator,
      requestModels: {
        'application/json': submitDefectModel
      },
      methodResponses: [
        {
          statusCode: '201',
          responseModels: {
            'application/json': successResponseModel
          },
          responseParameters: {
            'method.response.header.Access-Control-Allow-Origin': true
          }
        },
        {
          statusCode: '400',
          responseModels: {
            'application/json': errorResponseModel
          },
          responseParameters: {
            'method.response.header.Access-Control-Allow-Origin': true
          }
        },
        {
          statusCode: '401',
          responseModels: {
            'application/json': errorResponseModel
          }
        },
        {
          statusCode: '500',
          responseModels: {
            'application/json': errorResponseModel
          }
        }
      ]
    });

    // GET /defects/user/{userId} - Get user defects
    const user = defects.addResource('user');
    const userDefects = user.addResource('{userId}', {
      defaultCorsPreflightOptions: {
        allowOrigins: props.environment === 'prod'
          ? ['https://app.sanaathana-aalaya-charithra.com']
          : apigateway.Cors.ALL_ORIGINS,
        allowMethods: ['GET', 'OPTIONS']
      }
    });
    userDefects.addMethod('GET', new apigateway.LambdaIntegration(this.getUserDefectsLambda), {
      requestParameters: {
        'method.request.path.userId': true,
        'method.request.querystring.status': false,
        'method.request.querystring.limit': false,
        'method.request.querystring.lastEvaluatedKey': false
      },
      methodResponses: [
        {
          statusCode: '200',
          responseModels: {
            'application/json': successResponseModel
          }
        },
        {
          statusCode: '400',
          responseModels: {
            'application/json': errorResponseModel
          }
        },
        {
          statusCode: '403',
          responseModels: {
            'application/json': errorResponseModel
          }
        }
      ]
    });

    // GET /defects/{defectId} - Get defect details
    const defectById = defects.addResource('{defectId}');
    defectById.addMethod('GET', new apigateway.LambdaIntegration(this.getDefectDetailsLambda), {
      requestParameters: {
        'method.request.path.defectId': true
      },
      methodResponses: [
        {
          statusCode: '200',
          responseModels: {
            'application/json': successResponseModel
          }
        },
        {
          statusCode: '403',
          responseModels: {
            'application/json': errorResponseModel
          }
        },
        {
          statusCode: '404',
          responseModels: {
            'application/json': errorResponseModel
          }
        }
      ]
    });

    // ========================================================================
    // API Routes - Admin Endpoints
    // ========================================================================

    // Admin resource with authorization
    const admin = this.api.root.addResource('admin');
    const adminDefects = admin.addResource('defects', {
      defaultCorsPreflightOptions: {
        allowOrigins: props.environment === 'prod'
          ? ['https://admin.sanaathana-aalaya-charithra.com']
          : apigateway.Cors.ALL_ORIGINS,
        allowMethods: ['GET', 'POST', 'PUT', 'OPTIONS']
      }
    });

    // GET /admin/defects - Get all defects (admin)
    adminDefects.addMethod('GET', new apigateway.LambdaIntegration(this.getAllDefectsLambda), {
      apiKeyRequired: false,
      // TODO: Add authorizer for admin role verification
      requestParameters: {
        'method.request.querystring.status': false,
        'method.request.querystring.search': false,
        'method.request.querystring.limit': false,
        'method.request.querystring.lastEvaluatedKey': false
      },
      methodResponses: [
        {
          statusCode: '200',
          responseModels: {
            'application/json': successResponseModel
          }
        },
        {
          statusCode: '403',
          responseModels: {
            'application/json': errorResponseModel
          }
        }
      ]
    });

    // PUT /admin/defects/{defectId}/status - Update defect status (admin)
    const adminDefectById = adminDefects.addResource('{defectId}');
    const status = adminDefectById.addResource('status');
    status.addMethod('PUT', new apigateway.LambdaIntegration(this.updateDefectStatusLambda), {
      apiKeyRequired: false,
      // TODO: Add authorizer for admin role verification
      requestValidator: bodyValidator,
      requestModels: {
        'application/json': updateStatusModel
      },
      requestParameters: {
        'method.request.path.defectId': true
      },
      methodResponses: [
        {
          statusCode: '200',
          responseModels: {
            'application/json': successResponseModel
          }
        },
        {
          statusCode: '400',
          responseModels: {
            'application/json': errorResponseModel
          }
        },
        {
          statusCode: '403',
          responseModels: {
            'application/json': errorResponseModel
          }
        },
        {
          statusCode: '404',
          responseModels: {
            'application/json': errorResponseModel
          }
        }
      ]
    });

    // POST /admin/defects/{defectId}/updates - Add status update (admin)
    const updates = adminDefectById.addResource('updates');
    updates.addMethod('POST', new apigateway.LambdaIntegration(this.addStatusUpdateLambda), {
      apiKeyRequired: false,
      // TODO: Add authorizer for admin role verification
      requestValidator: bodyValidator,
      requestModels: {
        'application/json': addStatusUpdateModel
      },
      requestParameters: {
        'method.request.path.defectId': true
      },
      methodResponses: [
        {
          statusCode: '201',
          responseModels: {
            'application/json': successResponseModel
          }
        },
        {
          statusCode: '400',
          responseModels: {
            'application/json': errorResponseModel
          }
        },
        {
          statusCode: '403',
          responseModels: {
            'application/json': errorResponseModel
          }
        },
        {
          statusCode: '404',
          responseModels: {
            'application/json': errorResponseModel
          }
        }
      ]
    });

    // ========================================================================
    // API Routes - Notification Endpoints
    // ========================================================================

    // GET /notifications/user/{userId} - Get user notifications
    const notifications = this.api.root.addResource('notifications');
    const notificationUser = notifications.addResource('user');
    const notificationUserId = notificationUser.addResource('{userId}');
    notificationUserId.addMethod('GET', new apigateway.LambdaIntegration(this.getNotificationsLambda), {
      requestParameters: {
        'method.request.path.userId': true,
        'method.request.querystring.unreadOnly': false,
        'method.request.querystring.limit': false
      },
      methodResponses: [
        {
          statusCode: '200',
          responseModels: {
            'application/json': successResponseModel
          }
        },
        {
          statusCode: '403',
          responseModels: {
            'application/json': errorResponseModel
          }
        }
      ]
    });

    // PUT /notifications/{notificationId}/read - Mark notification as read
    const notificationById = notifications.addResource('{notificationId}');
    const read = notificationById.addResource('read');
    read.addMethod('PUT', new apigateway.LambdaIntegration(this.markNotificationReadLambda), {
      requestParameters: {
        'method.request.path.notificationId': true
      },
      methodResponses: [
        {
          statusCode: '200',
          responseModels: {
            'application/json': successResponseModel
          }
        },
        {
          statusCode: '404',
          responseModels: {
            'application/json': errorResponseModel
          }
        }
      ]
    });

    // ========================================================================
    // Additional Outputs
    // ========================================================================

    new cdk.CfnOutput(this, 'ApiUrl', {
      value: this.api.url,
      description: 'Defect Tracking API URL',
      exportName: `${props.environment}-DefectTrackingApiUrl`
    });

    new cdk.CfnOutput(this, 'ApiId', {
      value: this.api.restApiId,
      description: 'Defect Tracking API ID',
      exportName: `${props.environment}-DefectTrackingApiId`
    });
  }
}
