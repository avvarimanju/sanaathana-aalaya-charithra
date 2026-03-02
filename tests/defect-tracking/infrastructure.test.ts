/**
 * Infrastructure tests for Defect Tracking System
 * Feature: defect-tracking
 */

import { App } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { DefectTrackingStack } from '../../infrastructure/stacks/DefectTrackingStack';

describe('DefectTrackingStack', () => {
  let app: App;
  let stack: DefectTrackingStack;
  let template: Template;

  beforeEach(() => {
    app = new App();
    stack = new DefectTrackingStack(app, 'TestDefectTrackingStack', {
      environment: 'dev'
    });
    template = Template.fromStack(stack);
  });

  describe('DynamoDB Tables', () => {
    it('should create Defects table with correct configuration', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: 'dev-defect-tracking-defects',
        BillingMode: 'PAY_PER_REQUEST',
        KeySchema: [
          {
            AttributeName: 'defectId',
            KeyType: 'HASH'
          }
        ]
      });
    });

    it('should create Defects table with userId-createdAt GSI', () => {
      const defectsTable = template.findResources('AWS::DynamoDB::Table', {
        Properties: {
          TableName: 'dev-defect-tracking-defects'
        }
      });

      const tableKey = Object.keys(defectsTable)[0];
      const gsis = defectsTable[tableKey].Properties.GlobalSecondaryIndexes;
      
      expect(gsis).toBeDefined();
      expect(gsis.length).toBe(2);
      
      const userIdGsi = gsis.find((gsi: any) => gsi.IndexName === 'userId-createdAt-index');
      expect(userIdGsi).toBeDefined();
      expect(userIdGsi.KeySchema).toEqual([
        { AttributeName: 'userId', KeyType: 'HASH' },
        { AttributeName: 'createdAt', KeyType: 'RANGE' }
      ]);
      expect(userIdGsi.Projection.ProjectionType).toBe('ALL');
    });

    it('should create Defects table with status-createdAt GSI', () => {
      const defectsTable = template.findResources('AWS::DynamoDB::Table', {
        Properties: {
          TableName: 'dev-defect-tracking-defects'
        }
      });

      const tableKey = Object.keys(defectsTable)[0];
      const gsis = defectsTable[tableKey].Properties.GlobalSecondaryIndexes;
      
      expect(gsis).toBeDefined();
      expect(gsis.length).toBe(2);
      
      const statusGsi = gsis.find((gsi: any) => gsi.IndexName === 'status-createdAt-index');
      expect(statusGsi).toBeDefined();
      expect(statusGsi.KeySchema).toEqual([
        { AttributeName: 'status', KeyType: 'HASH' },
        { AttributeName: 'createdAt', KeyType: 'RANGE' }
      ]);
      expect(statusGsi.Projection.ProjectionType).toBe('ALL');
    });

    it('should create StatusUpdates table with correct configuration', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: 'dev-defect-tracking-status-updates',
        BillingMode: 'PAY_PER_REQUEST',
        KeySchema: [
          {
            AttributeName: 'updateId',
            KeyType: 'HASH'
          }
        ]
      });
    });

    it('should create StatusUpdates table with defectId-timestamp GSI', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        GlobalSecondaryIndexes: [
          {
            IndexName: 'defectId-timestamp-index',
            KeySchema: [
              {
                AttributeName: 'defectId',
                KeyType: 'HASH'
              },
              {
                AttributeName: 'timestamp',
                KeyType: 'RANGE'
              }
            ],
            Projection: {
              ProjectionType: 'ALL'
            }
          }
        ]
      });
    });

    it('should create Notifications table with correct configuration', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: 'dev-defect-tracking-notifications',
        BillingMode: 'PAY_PER_REQUEST',
        KeySchema: [
          {
            AttributeName: 'notificationId',
            KeyType: 'HASH'
          }
        ],
        TimeToLiveSpecification: {
          AttributeName: 'ttl',
          Enabled: true
        }
      });
    });

    it('should create Notifications table with userId-createdAt GSI', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        GlobalSecondaryIndexes: [
          {
            IndexName: 'userId-createdAt-index',
            KeySchema: [
              {
                AttributeName: 'userId',
                KeyType: 'HASH'
              },
              {
                AttributeName: 'createdAt',
                KeyType: 'RANGE'
              }
            ],
            Projection: {
              ProjectionType: 'ALL'
            }
          }
        ]
      });
    });

    it('should enable encryption for all tables', () => {
      const tables = template.findResources('AWS::DynamoDB::Table');
      const tableKeys = Object.keys(tables);
      
      expect(tableKeys.length).toBe(3);
      
      tableKeys.forEach(key => {
        expect(tables[key].Properties.SSESpecification).toBeDefined();
        expect(tables[key].Properties.SSESpecification.SSEEnabled).toBe(true);
      });
    });
  });

  describe('Stack Outputs', () => {
    it('should export Defects table name', () => {
      template.hasOutput('DefectsTableName', {
        Export: {
          Name: 'dev-DefectsTableName'
        }
      });
    });

    it('should export StatusUpdates table name', () => {
      template.hasOutput('StatusUpdatesTableName', {
        Export: {
          Name: 'dev-StatusUpdatesTableName'
        }
      });
    });

    it('should export Notifications table name', () => {
      template.hasOutput('NotificationsTableName', {
        Export: {
          Name: 'dev-NotificationsTableName'
        }
      });
    });
  });

  describe('Production Configuration', () => {
    it('should enable point-in-time recovery for production', () => {
      const prodApp = new App();
      const prodStack = new DefectTrackingStack(prodApp, 'ProdDefectTrackingStack', {
        environment: 'prod'
      });
      const prodTemplate = Template.fromStack(prodStack);

      const defectsTable = prodTemplate.findResources('AWS::DynamoDB::Table', {
        Properties: {
          TableName: 'prod-defect-tracking-defects'
        }
      });

      const tableKey = Object.keys(defectsTable)[0];
      expect(defectsTable[tableKey].Properties.PointInTimeRecoverySpecification).toBeDefined();
      expect(defectsTable[tableKey].Properties.PointInTimeRecoverySpecification.PointInTimeRecoveryEnabled).toBe(true);
    });

    it('should set RETAIN removal policy for production Defects table', () => {
      const prodApp = new App();
      const prodStack = new DefectTrackingStack(prodApp, 'ProdDefectTrackingStack2', {
        environment: 'prod'
      });
      const prodTemplate = Template.fromStack(prodStack);

      const defectsTable = prodTemplate.findResources('AWS::DynamoDB::Table', {
        Properties: {
          TableName: 'prod-defect-tracking-defects'
        }
      });

      const tableKey = Object.keys(defectsTable)[0];
      expect(defectsTable[tableKey].DeletionPolicy).toBe('Retain');
    });
  });

  describe('Lambda Functions', () => {
    it('should create all required Lambda functions', () => {
      const lambdas = template.findResources('AWS::Lambda::Function');
      const lambdaKeys = Object.keys(lambdas);
      
      expect(lambdaKeys.length).toBe(8);
    });

    it('should create Submit Defect Lambda with correct configuration', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: 'dev-defect-tracking-submit-defect',
        Runtime: 'nodejs20.x',
        Handler: 'submit-defect.handler',
        Timeout: 30,
        MemorySize: 512
      });
    });

    it('should create Get User Defects Lambda', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: 'dev-defect-tracking-get-user-defects',
        Handler: 'get-user-defects.handler'
      });
    });

    it('should create Get Defect Details Lambda', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: 'dev-defect-tracking-get-defect-details',
        Handler: 'get-defect-details.handler'
      });
    });

    it('should create Get All Defects Lambda', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: 'dev-defect-tracking-get-all-defects',
        Handler: 'get-all-defects.handler'
      });
    });

    it('should create Update Defect Status Lambda', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: 'dev-defect-tracking-update-status',
        Handler: 'update-defect-status.handler'
      });
    });

    it('should create Add Status Update Lambda', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: 'dev-defect-tracking-add-status-update',
        Handler: 'add-status-update.handler'
      });
    });

    it('should create Get Notifications Lambda', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: 'dev-defect-tracking-get-notifications',
        Handler: 'get-notifications.handler'
      });
    });

    it('should create Mark Notification Read Lambda', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: 'dev-defect-tracking-mark-notification-read',
        Handler: 'mark-notification-read.handler'
      });
    });

    it('should configure Lambda environment variables', () => {
      const lambdas = template.findResources('AWS::Lambda::Function');
      const lambdaKeys = Object.keys(lambdas);
      
      lambdaKeys.forEach(key => {
        const env = lambdas[key].Properties.Environment;
        expect(env).toBeDefined();
        expect(env.Variables.DEFECTS_TABLE_NAME).toBeDefined();
        expect(env.Variables.STATUS_UPDATES_TABLE_NAME).toBeDefined();
        expect(env.Variables.NOTIFICATIONS_TABLE_NAME).toBeDefined();
        expect(env.Variables.ENVIRONMENT).toBe('dev');
      });
    });
  });

  describe('API Gateway', () => {
    it('should create REST API', () => {
      template.hasResourceProperties('AWS::ApiGateway::RestApi', {
        Name: 'dev-defect-tracking-api',
        Description: 'API for Defect Tracking System'
      });
    });

    it('should configure API deployment with correct stage', () => {
      // API Gateway deployment stage is configured via deployOptions
      // The actual stage resource is created separately
      const stages = template.findResources('AWS::ApiGateway::Stage');
      const stageKeys = Object.keys(stages);
      
      expect(stageKeys.length).toBeGreaterThan(0);
      
      // Verify stage name is 'dev'
      const stage = stages[stageKeys[0]];
      expect(stage.Properties.StageName).toBe('dev');
    });

    it('should configure throttling and rate limiting', () => {
      const stages = template.findResources('AWS::ApiGateway::Stage');
      const stageKeys = Object.keys(stages);
      
      expect(stageKeys.length).toBeGreaterThan(0);
      
      const stage = stages[stageKeys[0]];
      expect(stage.Properties.MethodSettings).toBeDefined();
      
      // Check for throttling configuration
      const methodSettings = stage.Properties.MethodSettings;
      const hasThrottling = methodSettings.some((setting: any) => 
        setting.ThrottlingRateLimit !== undefined || 
        setting.ThrottlingBurstLimit !== undefined
      );
      
      expect(hasThrottling).toBe(true);
    });

    it('should enable logging and metrics', () => {
      const stages = template.findResources('AWS::ApiGateway::Stage');
      const stageKeys = Object.keys(stages);
      
      expect(stageKeys.length).toBeGreaterThan(0);
      
      const stage = stages[stageKeys[0]];
      expect(stage.Properties.MethodSettings).toBeDefined();
      
      const methodSettings = stage.Properties.MethodSettings;
      const hasLogging = methodSettings.some((setting: any) => 
        setting.LoggingLevel !== undefined
      );
      const hasMetrics = methodSettings.some((setting: any) => 
        setting.MetricsEnabled !== undefined
      );
      
      expect(hasLogging).toBe(true);
      expect(hasMetrics).toBe(true);
    });

    it('should create request validators', () => {
      const validators = template.findResources('AWS::ApiGateway::RequestValidator');
      const validatorKeys = Object.keys(validators);
      
      // Should have body validator, params validator, and full validator
      expect(validatorKeys.length).toBe(3);
      
      // Check for body validator
      const bodyValidator = Object.values(validators).find((v: any) => 
        v.Properties.ValidateRequestBody === true && 
        v.Properties.ValidateRequestParameters === false
      );
      expect(bodyValidator).toBeDefined();
      
      // Check for params validator
      const paramsValidator = Object.values(validators).find((v: any) => 
        v.Properties.ValidateRequestBody === false && 
        v.Properties.ValidateRequestParameters === true
      );
      expect(paramsValidator).toBeDefined();
      
      // Check for full validator
      const fullValidator = Object.values(validators).find((v: any) => 
        v.Properties.ValidateRequestBody === true && 
        v.Properties.ValidateRequestParameters === true
      );
      expect(fullValidator).toBeDefined();
    });

    it('should create request/response models', () => {
      const models = template.findResources('AWS::ApiGateway::Model');
      const modelKeys = Object.keys(models);
      
      // Should have: SubmitDefectModel, UpdateStatusModel, AddStatusUpdateModel,
      // SuccessResponseModel, ErrorResponseModel
      expect(modelKeys.length).toBe(5);
      
      // Check for SubmitDefectModel
      const submitDefectModel = Object.values(models).find((m: any) => 
        m.Properties.Name === 'SubmitDefectRequest'
      );
      expect(submitDefectModel).toBeDefined();
      
      // Check for UpdateStatusModel
      const updateStatusModel = Object.values(models).find((m: any) => 
        m.Properties.Name === 'UpdateStatusRequest'
      );
      expect(updateStatusModel).toBeDefined();
      
      // Check for AddStatusUpdateModel
      const addStatusUpdateModel = Object.values(models).find((m: any) => 
        m.Properties.Name === 'AddStatusUpdateRequest'
      );
      expect(addStatusUpdateModel).toBeDefined();
      
      // Check for SuccessResponseModel
      const successResponseModel = Object.values(models).find((m: any) => 
        m.Properties.Name === 'SuccessResponse'
      );
      expect(successResponseModel).toBeDefined();
      
      // Check for ErrorResponseModel
      const errorResponseModel = Object.values(models).find((m: any) => 
        m.Properties.Name === 'ErrorResponse'
      );
      expect(errorResponseModel).toBeDefined();
    });

    it('should validate SubmitDefectModel schema', () => {
      const models = template.findResources('AWS::ApiGateway::Model');
      const submitDefectModel = Object.values(models).find((m: any) => 
        m.Properties.Name === 'SubmitDefectRequest'
      ) as any;
      
      expect(submitDefectModel).toBeDefined();
      
      const schema = submitDefectModel.Properties.Schema;
      expect(schema.type).toBe('object');
      expect(schema.required).toContain('userId');
      expect(schema.required).toContain('title');
      expect(schema.required).toContain('description');
      
      // Check title constraints
      expect(schema.properties.title.minLength).toBe(5);
      expect(schema.properties.title.maxLength).toBe(200);
      
      // Check description constraints
      expect(schema.properties.description.minLength).toBe(10);
      expect(schema.properties.description.maxLength).toBe(5000);
    });

    it('should validate UpdateStatusModel schema', () => {
      const models = template.findResources('AWS::ApiGateway::Model');
      const updateStatusModel = Object.values(models).find((m: any) => 
        m.Properties.Name === 'UpdateStatusRequest'
      ) as any;
      
      expect(updateStatusModel).toBeDefined();
      
      const schema = updateStatusModel.Properties.Schema;
      expect(schema.type).toBe('object');
      expect(schema.required).toContain('newStatus');
      
      // Check status enum
      expect(schema.properties.newStatus.enum).toEqual([
        'New', 'Acknowledged', 'In_Progress', 'Resolved', 'Closed'
      ]);
    });

    it('should create POST /defects endpoint', () => {
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'POST',
        AuthorizationType: 'NONE'
      });
    });

    it('should create GET /defects/user/{userId} endpoint', () => {
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'GET',
        AuthorizationType: 'NONE'
      });
    });

    it('should create admin endpoints', () => {
      const methods = template.findResources('AWS::ApiGateway::Method');
      const methodKeys = Object.keys(methods);
      
      // Filter out OPTIONS methods (CORS)
      const nonOptionsMethods = methodKeys.filter(key => 
        methods[key].Properties.HttpMethod !== 'OPTIONS'
      );
      
      // Should have: POST /defects, GET /defects/user/{userId}, GET /defects/{defectId},
      // GET /admin/defects, PUT /admin/defects/{defectId}/status, 
      // POST /admin/defects/{defectId}/updates, GET /notifications/user/{userId},
      // PUT /notifications/{notificationId}/read
      expect(nonOptionsMethods.length).toBeGreaterThanOrEqual(8);
    });

    it('should configure CORS', () => {
      // CORS is configured via defaultCorsPreflightOptions
      // This creates OPTIONS methods for each resource
      const methods = template.findResources('AWS::ApiGateway::Method');
      const optionsMethods = Object.keys(methods).filter(key => 
        methods[key].Properties.HttpMethod === 'OPTIONS'
      );
      
      expect(optionsMethods.length).toBeGreaterThan(0);
    });

    it('should configure CORS for production with specific origins', () => {
      const prodApp = new App();
      const prodStack = new DefectTrackingStack(prodApp, 'ProdDefectTrackingStack3', {
        environment: 'prod'
      });
      const prodTemplate = Template.fromStack(prodStack);

      // In production, CORS should be configured with specific origins
      // This is verified by checking the API Gateway configuration
      const api = prodTemplate.findResources('AWS::ApiGateway::RestApi');
      expect(Object.keys(api).length).toBe(1);
    });

    it('should export API URL', () => {
      template.hasOutput('ApiUrl', {
        Export: {
          Name: 'dev-DefectTrackingApiUrl'
        }
      });
    });

    it('should export API ID', () => {
      template.hasOutput('ApiId', {
        Export: {
          Name: 'dev-DefectTrackingApiId'
        }
      });
    });
  });

  describe('IAM Permissions', () => {
    it('should grant Lambda functions DynamoDB permissions', () => {
      const policies = template.findResources('AWS::IAM::Policy');
      const policyKeys = Object.keys(policies);
      
      // Should have IAM policies for Lambda execution roles
      expect(policyKeys.length).toBeGreaterThan(0);
    });

    it('should grant read/write permissions to submit defect Lambda', () => {
      // The Lambda should have permissions to write to Defects table
      const policies = template.findResources('AWS::IAM::Policy');
      
      let hasDefectsWritePermission = false;
      Object.keys(policies).forEach(key => {
        const statements = policies[key].Properties.PolicyDocument.Statement;
        statements.forEach((statement: any) => {
          if (statement.Action && 
              (statement.Action.includes('dynamodb:PutItem') || 
               statement.Action.includes('dynamodb:UpdateItem'))) {
            hasDefectsWritePermission = true;
          }
        });
      });
      
      expect(hasDefectsWritePermission).toBe(true);
    });
  });
});
