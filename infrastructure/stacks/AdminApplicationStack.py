"""
Admin Application Infrastructure Stack

This stack creates the infrastructure for the Admin Backend Application:
- AWS Cognito User Pool with MFA for admin authentication
- Cognito Identity Pool for AWS SDK access
- DynamoDB tables for admin data
- Lambda functions for admin APIs
- API Gateway for REST endpoints
- IAM roles and policies
"""

from aws_cdk import (
    Stack,
    Duration,
    RemovalPolicy,
    aws_cognito as cognito,
    aws_dynamodb as dynamodb,
    aws_lambda as lambda_,
    aws_apigateway as apigateway,
    aws_iam as iam,
    aws_logs as logs,
    aws_events as events,
    aws_events_targets as targets,
    CfnOutput,
)
from constructs import Construct


class AdminApplicationStack(Stack):
    """CDK Stack for Admin Backend Application Infrastructure"""

    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # ========================================
        # Cognito User Pool for Admin Authentication
        # ========================================
        self.admin_user_pool = cognito.UserPool(
            self,
            "AdminUserPool",
            user_pool_name="SanaathanaAalayaCharithra-AdminUsers",
            self_sign_up_enabled=False,
            mfa=cognito.Mfa.REQUIRED,
            mfa_second_factor=cognito.MfaSecondFactor(
                sms=True,
                otp=True,
            ),
            password_policy=cognito.PasswordPolicy(
                min_length=12,
                require_lowercase=True,
                require_uppercase=True,
                require_digits=True,
                require_symbols=True,
                temp_password_validity=Duration.days(3),
            ),
            account_recovery=cognito.AccountRecovery.EMAIL_ONLY,
            advanced_security_mode=cognito.AdvancedSecurityMode.ENFORCED,
            removal_policy=RemovalPolicy.RETAIN,
        )

        # User Pool Client
        self.admin_user_pool_client = self.admin_user_pool.add_client(
            "AdminWebClient",
            auth_flows=cognito.AuthFlow(
                user_password=True,
                user_srp=True,
            ),
            o_auth=cognito.OAuthSettings(
                flows=cognito.OAuthFlows(
                    authorization_code_grant=True,
                ),
                scopes=[
                    cognito.OAuthScope.OPENID,
                    cognito.OAuthScope.EMAIL,
                    cognito.OAuthScope.PROFILE,
                ],
            ),
        )

        # Identity Pool for AWS SDK access
        self.admin_identity_pool = cognito.CfnIdentityPool(
            self,
            "AdminIdentityPool",
            identity_pool_name="SanaathanaAalayaCharithra-AdminIdentity",
            allow_unauthenticated_identities=False,
            cognito_identity_providers=[
                cognito.CfnIdentityPool.CognitoIdentityProviderProperty(
                    client_id=self.admin_user_pool_client.user_pool_client_id,
                    provider_name=self.admin_user_pool.user_pool_provider_name,
                )
            ],
        )

        # ========================================
        # DynamoDB Tables
        # ========================================

        # AdminUsers Table
        self.admin_users_table = dynamodb.Table(
            self,
            "AdminUsersTable",
            table_name="SanaathanaAalayaCharithra-AdminUsers",
            partition_key=dynamodb.Attribute(
                name="userId", type=dynamodb.AttributeType.STRING
            ),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
            encryption=dynamodb.TableEncryption.AWS_MANAGED,
            point_in_time_recovery=True,
            removal_policy=RemovalPolicy.RETAIN,
        )

        # Add GSI for email lookup
        self.admin_users_table.add_global_secondary_index(
            index_name="EmailIndex",
            partition_key=dynamodb.Attribute(
                name="email", type=dynamodb.AttributeType.STRING
            ),
        )

        # SystemConfiguration Table
        self.system_config_table = dynamodb.Table(
            self,
            "SystemConfigTable",
            table_name="SanaathanaAalayaCharithra-SystemConfiguration",
            partition_key=dynamodb.Attribute(
                name="configId", type=dynamodb.AttributeType.STRING
            ),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
            encryption=dynamodb.TableEncryption.AWS_MANAGED,
            point_in_time_recovery=True,
            removal_policy=RemovalPolicy.RETAIN,
        )

        # AuditLog Table
        self.audit_log_table = dynamodb.Table(
            self,
            "AuditLogTable",
            table_name="SanaathanaAalayaCharithra-AuditLog",
            partition_key=dynamodb.Attribute(
                name="auditId", type=dynamodb.AttributeType.STRING
            ),
            sort_key=dynamodb.Attribute(
                name="timestamp", type=dynamodb.AttributeType.STRING
            ),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
            encryption=dynamodb.TableEncryption.AWS_MANAGED,
            time_to_live_attribute="ttl",
            removal_policy=RemovalPolicy.RETAIN,
        )

        # Add GSIs for audit log queries
        self.audit_log_table.add_global_secondary_index(
            index_name="UserIdIndex",
            partition_key=dynamodb.Attribute(
                name="userId", type=dynamodb.AttributeType.STRING
            ),
            sort_key=dynamodb.Attribute(
                name="timestamp", type=dynamodb.AttributeType.STRING
            ),
        )

        self.audit_log_table.add_global_secondary_index(
            index_name="ResourceIndex",
            partition_key=dynamodb.Attribute(
                name="resource", type=dynamodb.AttributeType.STRING
            ),
            sort_key=dynamodb.Attribute(
                name="timestamp", type=dynamodb.AttributeType.STRING
            ),
        )

        # Notifications Table
        self.notifications_table = dynamodb.Table(
            self,
            "NotificationsTable",
            table_name="SanaathanaAalayaCharithra-Notifications",
            partition_key=dynamodb.Attribute(
                name="userId", type=dynamodb.AttributeType.STRING
            ),
            sort_key=dynamodb.Attribute(
                name="notificationId", type=dynamodb.AttributeType.STRING
            ),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
            encryption=dynamodb.TableEncryption.AWS_MANAGED,
            time_to_live_attribute="ttl",
            removal_policy=RemovalPolicy.RETAIN,
        )

        # ContentModeration Table
        self.content_moderation_table = dynamodb.Table(
            self,
            "ContentModerationTable",
            table_name="SanaathanaAalayaCharithra-ContentModeration",
            partition_key=dynamodb.Attribute(
                name="contentId", type=dynamodb.AttributeType.STRING
            ),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
            encryption=dynamodb.TableEncryption.AWS_MANAGED,
            removal_policy=RemovalPolicy.RETAIN,
        )

        # Add GSI for status-based queries
        self.content_moderation_table.add_global_secondary_index(
            index_name="StatusIndex",
            partition_key=dynamodb.Attribute(
                name="status", type=dynamodb.AttributeType.STRING
            ),
            sort_key=dynamodb.Attribute(
                name="generatedAt", type=dynamodb.AttributeType.STRING
            ),
        )

        # RateLimits Table
        self.rate_limits_table = dynamodb.Table(
            self,
            "RateLimitsTable",
            table_name="SanaathanaAalayaCharithra-RateLimits",
            partition_key=dynamodb.Attribute(
                name="userId", type=dynamodb.AttributeType.STRING
            ),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
            encryption=dynamodb.TableEncryption.AWS_MANAGED,
            time_to_live_attribute="ttl",
            removal_policy=RemovalPolicy.RETAIN,
        )

        # AdminSessions Table
        self.admin_sessions_table = dynamodb.Table(
            self,
            "AdminSessionsTable",
            table_name="SanaathanaAalayaCharithra-AdminSessions",
            partition_key=dynamodb.Attribute(
                name="sessionId", type=dynamodb.AttributeType.STRING
            ),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
            encryption=dynamodb.TableEncryption.AWS_MANAGED,
            time_to_live_attribute="ttl",
            removal_policy=RemovalPolicy.RETAIN,
        )

        # Add GSI for userId lookup
        self.admin_sessions_table.add_global_secondary_index(
            index_name="UserIdIndex",
            partition_key=dynamodb.Attribute(
                name="userId", type=dynamodb.AttributeType.STRING
            ),
        )

        # CostCache Table - for caching Cost Explorer API results
        self.cost_cache_table = dynamodb.Table(
            self,
            "CostCacheTable",
            table_name="SanaathanaAalayaCharithra-CostCache",
            partition_key=dynamodb.Attribute(
                name="cacheKey", type=dynamodb.AttributeType.STRING
            ),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
            encryption=dynamodb.TableEncryption.AWS_MANAGED,
            time_to_live_attribute="ttl",
            removal_policy=RemovalPolicy.RETAIN,
        )

        # CostAlerts Table - for cost alert thresholds
        self.cost_alerts_table = dynamodb.Table(
            self,
            "CostAlertsTable",
            table_name="SanaathanaAalayaCharithra-CostAlerts",
            partition_key=dynamodb.Attribute(
                name="alertId", type=dynamodb.AttributeType.STRING
            ),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
            encryption=dynamodb.TableEncryption.AWS_MANAGED,
            removal_policy=RemovalPolicy.RETAIN,
        )

        # ========================================
        # IAM Roles
        # ========================================

        # Lambda execution role for admin functions
        self.admin_lambda_role = iam.Role(
            self,
            "AdminLambdaRole",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "service-role/AWSLambdaBasicExecutionRole"
                ),
            ],
        )

        # Grant DynamoDB permissions
        self.admin_users_table.grant_read_write_data(self.admin_lambda_role)
        self.system_config_table.grant_read_write_data(self.admin_lambda_role)
        self.audit_log_table.grant_read_write_data(self.admin_lambda_role)
        self.notifications_table.grant_read_write_data(self.admin_lambda_role)
        self.content_moderation_table.grant_read_write_data(self.admin_lambda_role)
        self.rate_limits_table.grant_read_write_data(self.admin_lambda_role)
        self.admin_sessions_table.grant_read_write_data(self.admin_lambda_role)
        self.cost_cache_table.grant_read_write_data(self.admin_lambda_role)
        self.cost_alerts_table.grant_read_write_data(self.admin_lambda_role)

        # Grant Cost Explorer permissions
        self.admin_lambda_role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "ce:GetCostAndUsage",
                    "ce:GetCostForecast",
                    "ce:GetDimensionValues",
                ],
                resources=["*"],
            )
        )

        # Grant CloudWatch permissions for resource metrics
        self.admin_lambda_role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "cloudwatch:GetMetricStatistics",
                    "cloudwatch:ListMetrics",
                ],
                resources=["*"],
            )
        )

        # Authenticated role for Identity Pool
        self.authenticated_role = iam.Role(
            self,
            "AdminAuthenticatedRole",
            assumed_by=iam.FederatedPrincipal(
                "cognito-identity.amazonaws.com",
                {
                    "StringEquals": {
                        "cognito-identity.amazonaws.com:aud": self.admin_identity_pool.ref
                    },
                    "ForAnyValue:StringLike": {
                        "cognito-identity.amazonaws.com:amr": "authenticated"
                    },
                },
                "sts:AssumeRoleWithWebIdentity",
            ),
        )

        # Grant S3 read/write permissions for content management
        self.authenticated_role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "s3:GetObject",
                    "s3:PutObject",
                    "s3:DeleteObject",
                    "s3:ListBucket",
                ],
                resources=[
                    f"arn:aws:s3:::sanaathana-aalaya-charithra-content-*/*",
                    f"arn:aws:s3:::sanaathana-aalaya-charithra-content-*",
                ],
            )
        )

        # Grant CloudWatch Logs read permissions
        self.authenticated_role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "logs:FilterLogEvents",
                    "logs:DescribeLogStreams",
                    "logs:GetLogEvents",
                ],
                resources=["*"],
            )
        )

        # Grant Cost Explorer read permissions
        self.authenticated_role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "ce:GetCostAndUsage",
                    "ce:GetCostForecast",
                    "ce:GetDimensionValues",
                ],
                resources=["*"],
            )
        )

        # Attach roles to Identity Pool
        cognito.CfnIdentityPoolRoleAttachment(
            self,
            "IdentityPoolRoleAttachment",
            identity_pool_id=self.admin_identity_pool.ref,
            roles={
                "authenticated": self.authenticated_role.role_arn,
            },
        )

        # ========================================
        # Lambda Functions (Placeholders)
        # ========================================

        # Custom Authorizer Lambda
        self.authorizer_lambda = lambda_.Function(
            self,
            "AuthorizerLambda",
            function_name="SanaathanaAalayaCharithra-AdminAuthorizer",
            runtime=lambda_.Runtime.PYTHON_3_11,
            handler="authorizer.handler",
            code=lambda_.Code.from_asset("src/admin/lambdas"),
            timeout=Duration.seconds(30),
            memory_size=256,
            environment={
                "USER_POOL_ID": self.admin_user_pool.user_pool_id,
                "ADMIN_USERS_TABLE": self.admin_users_table.table_name,
                "RATE_LIMITS_TABLE": self.rate_limits_table.table_name,
                "ADMIN_SESSIONS_TABLE": self.admin_sessions_table.table_name,
            },
            role=self.admin_lambda_role,
            log_retention=logs.RetentionDays.ONE_WEEK,
        )

        # Admin API Handler Lambda
        self.admin_api_lambda = lambda_.Function(
            self,
            "AdminAPILambda",
            function_name="SanaathanaAalayaCharithra-AdminAPI",
            runtime=lambda_.Runtime.PYTHON_3_11,
            handler="admin_api.handler",
            code=lambda_.Code.from_asset("src/admin/lambdas"),
            timeout=Duration.seconds(30),
            memory_size=512,
            environment={
                "ADMIN_USERS_TABLE": self.admin_users_table.table_name,
                "SYSTEM_CONFIG_TABLE": self.system_config_table.table_name,
                "AUDIT_LOG_TABLE": self.audit_log_table.table_name,
                "NOTIFICATIONS_TABLE": self.notifications_table.table_name,
                "CONTENT_MODERATION_TABLE": self.content_moderation_table.table_name,
                "COST_CACHE_TABLE": self.cost_cache_table.table_name,
                "COST_ALERTS_TABLE": self.cost_alerts_table.table_name,
            },
            role=self.admin_lambda_role,
            log_retention=logs.RetentionDays.ONE_WEEK,
        )

        # Cost Monitoring Lambda - for scheduled cost data refresh
        self.cost_monitoring_lambda = lambda_.Function(
            self,
            "CostMonitoringLambda",
            function_name="SanaathanaAalayaCharithra-CostMonitoring",
            runtime=lambda_.Runtime.PYTHON_3_11,
            handler="cost_monitoring.handler",
            code=lambda_.Code.from_asset("src/admin/lambdas"),
            timeout=Duration.seconds(60),
            memory_size=256,
            environment={
                "COST_CACHE_TABLE": self.cost_cache_table.table_name,
            },
            role=self.admin_lambda_role,
            log_retention=logs.RetentionDays.ONE_WEEK,
        )

        # ========================================
        # EventBridge Rule for Daily Cost Refresh
        # ========================================

        # Create EventBridge rule to trigger cost monitoring daily at 2 AM UTC
        self.cost_refresh_rule = events.Rule(
            self,
            "CostRefreshRule",
            rule_name="SanaathanaAalayaCharithra-DailyCostRefresh",
            description="Trigger cost monitoring Lambda daily to refresh cost data",
            schedule=events.Schedule.cron(
                minute="0",
                hour="2",
                month="*",
                week_day="*",
                year="*"
            ),
        )

        # Add Lambda as target
        self.cost_refresh_rule.add_target(
            targets.LambdaFunction(self.cost_monitoring_lambda)
        )

        # ========================================
        # API Gateway
        # ========================================

        # Custom authorizer
        self.authorizer = apigateway.TokenAuthorizer(
            self,
            "AdminAuthorizer",
            handler=self.authorizer_lambda,
            identity_source="method.request.header.Authorization",
            results_cache_ttl=Duration.minutes(5),
        )

        # REST API
        self.admin_api = apigateway.RestApi(
            self,
            "AdminAPI",
            rest_api_name="Sanaathana Aalaya Charithra Admin API",
            description="Admin API for Sanaathana Aalaya Charithra platform",
            default_cors_preflight_options=apigateway.CorsOptions(
                allow_origins=["*"],  # TODO: Restrict to admin domain in production
                allow_methods=apigateway.Cors.ALL_METHODS,
                allow_headers=[
                    "Content-Type",
                    "Authorization",
                    "X-Amz-Date",
                    "X-Api-Key",
                    "X-Amz-Security-Token",
                ],
            ),
            deploy_options=apigateway.StageOptions(
                stage_name="prod",
                throttling_rate_limit=100,
                throttling_burst_limit=200,
                logging_level=apigateway.MethodLoggingLevel.INFO,
                data_trace_enabled=True,
            ),
        )

        # Admin resource
        admin_resource = self.admin_api.root.add_resource("admin")

        # Lambda integration
        admin_integration = apigateway.LambdaIntegration(
            self.admin_api_lambda,
            proxy=True,
        )

        # Add proxy resource for all admin endpoints
        admin_proxy = admin_resource.add_proxy(
            default_integration=admin_integration,
            any_method=True,
            default_method_options=apigateway.MethodOptions(
                authorizer=self.authorizer,
                authorization_type=apigateway.AuthorizationType.CUSTOM,
            ),
        )

        # ========================================
        # Outputs
        # ========================================

        CfnOutput(
            self,
            "UserPoolId",
            value=self.admin_user_pool.user_pool_id,
            description="Cognito User Pool ID for admin users",
        )

        CfnOutput(
            self,
            "UserPoolClientId",
            value=self.admin_user_pool_client.user_pool_client_id,
            description="Cognito User Pool Client ID",
        )

        CfnOutput(
            self,
            "IdentityPoolId",
            value=self.admin_identity_pool.ref,
            description="Cognito Identity Pool ID",
        )

        CfnOutput(
            self,
            "AdminAPIURL",
            value=self.admin_api.url,
            description="Admin API Gateway URL",
        )

        CfnOutput(
            self,
            "AdminUsersTableName",
            value=self.admin_users_table.table_name,
            description="DynamoDB table for admin users",
        )

        CfnOutput(
            self,
            "AuditLogTableName",
            value=self.audit_log_table.table_name,
            description="DynamoDB table for audit logs",
        )
