"""
Authentication Infrastructure Stack

This stack creates the infrastructure for Social Media Authentication:
- AWS Cognito User Pool for user identity management
- DynamoDB tables for user profiles and rate limiting
- Lambda layer for shared Python dependencies
- AWS Secrets Manager placeholders for OAuth credentials
- IAM roles and policies for Lambda execution
"""

from aws_cdk import (
    Stack,
    Duration,
    RemovalPolicy,
    aws_cognito as cognito,
    aws_dynamodb as dynamodb,
    aws_lambda as lambda_,
    aws_secretsmanager as secretsmanager,
    aws_iam as iam,
    aws_logs as logs,
    aws_apigateway as apigateway,
    aws_cloudwatch as cloudwatch,
    aws_cloudwatch_actions as cw_actions,
    aws_sns as sns,
    CfnOutput,
)
from constructs import Construct
from typing import Optional


class AuthenticationStack(Stack):
    """CDK Stack for Social Media Authentication Infrastructure"""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        environment: str = "dev",
        alarm_email: Optional[str] = None,
        **kwargs
    ) -> None:
        super().__init__(scope, construct_id, **kwargs)
        
        self.environment = environment
        
        # Environment-specific configuration
        self.config = self._get_environment_config(environment)

        self.environment = environment
        
        # Environment-specific configuration
        self.config = self._get_environment_config(environment)
        
        # Create SNS topic for alarms if email provided
        if alarm_email:
            self.alarm_topic = sns.Topic(
                self,
                "AuthAlarmTopic",
                display_name=f"Authentication Alarms - {environment}"
            )
            self.alarm_topic.add_subscription(
                sns.Subscription(
                    self,
                    "AlarmEmailSubscription",
                    protocol=sns.SubscriptionProtocol.EMAIL,
                    endpoint=alarm_email
                )
            )
        else:
            self.alarm_topic = None

        # ========================================
        # Cognito User Pool for User Authentication
        # ========================================
        self.user_pool = cognito.UserPool(
            self,
            "UserPool",
            user_pool_name=f"SanaathanaAalayaCharithra-Users-{environment}",
            self_sign_up_enabled=False,  # Users created via social auth only
            sign_in_aliases=cognito.SignInAliases(email=True),
            password_policy=cognito.PasswordPolicy(
                min_length=12,
                require_lowercase=True,
                require_uppercase=True,
                require_digits=True,
                require_symbols=True,
            ),
            account_recovery=cognito.AccountRecovery.EMAIL_ONLY,
            removal_policy=self.config["removal_policy"],
        )

        # User Pool Client for mobile app
        self.user_pool_client = self.user_pool.add_client(
            "MobileAppClient",
            auth_flows=cognito.AuthFlow(
                user_password=True,
                user_srp=True,
                custom=True,
            ),
            access_token_validity=Duration.hours(1),
            refresh_token_validity=Duration.days(30),
            id_token_validity=Duration.hours(1),
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

        # ========================================
        # DynamoDB Tables
        # ========================================

        # UserProfiles Table
        self.user_profiles_table = dynamodb.Table(
            self,
            "UserProfilesTable",
            table_name=f"SanaathanaAalayaCharithra-UserProfiles-{environment}",
            partition_key=dynamodb.Attribute(
                name="user_id", type=dynamodb.AttributeType.STRING
            ),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
            encryption=dynamodb.TableEncryption.AWS_MANAGED,
            point_in_time_recovery=self.config["enable_pitr"],
            removal_policy=self.config["removal_policy"],
        )

        # Add GSI for provider user ID lookup
        self.user_profiles_table.add_global_secondary_index(
            index_name="ProviderUserIdIndex",
            partition_key=dynamodb.Attribute(
                name="provider_user_id", type=dynamodb.AttributeType.STRING
            ),
            sort_key=dynamodb.Attribute(
                name="provider", type=dynamodb.AttributeType.STRING
            ),
        )

        # AuthRateLimits Table
        self.rate_limits_table = dynamodb.Table(
            self,
            "AuthRateLimitsTable",
            table_name=f"SanaathanaAalayaCharithra-AuthRateLimits-{environment}",
            partition_key=dynamodb.Attribute(
                name="device_id", type=dynamodb.AttributeType.STRING
            ),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
            encryption=dynamodb.TableEncryption.AWS_MANAGED,
            time_to_live_attribute="ttl",
            removal_policy=RemovalPolicy.DESTROY,
        )

        # ========================================
        # Lambda Layer for Shared Dependencies
        # ========================================
        self.dependencies_layer = lambda_.LayerVersion(
            self,
            "AuthDependenciesLayer",
            code=lambda_.Code.from_asset("src/auth/layers/dependencies"),
            compatible_runtimes=[lambda_.Runtime.PYTHON_3_11],
            description="Shared dependencies for authentication lambdas (boto3, PyJWT, cryptography, requests)",
        )

        # ========================================
        # Secrets Manager for OAuth Credentials
        # ========================================

        # Google OAuth credentials
        self.google_secret = secretsmanager.Secret(
            self,
            "GoogleOAuthSecret",
            secret_name="social-auth/google/credentials",
            description="OAuth credentials for Google authentication",
            generate_secret_string=secretsmanager.SecretStringGenerator(
                secret_string_template='{"client_id":"PLACEHOLDER","redirect_uris":["https://app.example.com/callback"],"scopes":["openid","email","profile"]}',
                generate_string_key="client_secret",
            ),
        )

        # Facebook OAuth credentials
        self.facebook_secret = secretsmanager.Secret(
            self,
            "FacebookOAuthSecret",
            secret_name="social-auth/facebook/credentials",
            description="OAuth credentials for Facebook authentication",
            generate_secret_string=secretsmanager.SecretStringGenerator(
                secret_string_template='{"client_id":"PLACEHOLDER","redirect_uris":["https://app.example.com/callback"],"scopes":["email","public_profile"]}',
                generate_string_key="client_secret",
            ),
        )

        # Instagram OAuth credentials
        self.instagram_secret = secretsmanager.Secret(
            self,
            "InstagramOAuthSecret",
            secret_name="social-auth/instagram/credentials",
            description="OAuth credentials for Instagram authentication",
            generate_secret_string=secretsmanager.SecretStringGenerator(
                secret_string_template='{"client_id":"PLACEHOLDER","redirect_uris":["https://app.example.com/callback"],"scopes":["user_profile","user_media"]}',
                generate_string_key="client_secret",
            ),
        )

        # Apple OAuth credentials
        self.apple_secret = secretsmanager.Secret(
            self,
            "AppleOAuthSecret",
            secret_name="social-auth/apple/credentials",
            description="OAuth credentials for Apple Sign In",
            generate_secret_string=secretsmanager.SecretStringGenerator(
                secret_string_template='{"client_id":"PLACEHOLDER","redirect_uris":["https://app.example.com/callback"],"scopes":["name","email"]}',
                generate_string_key="client_secret",
            ),
        )

        # Twitter/X OAuth credentials
        self.twitter_secret = secretsmanager.Secret(
            self,
            "TwitterOAuthSecret",
            secret_name="social-auth/twitter/credentials",
            description="OAuth credentials for Twitter/X authentication",
            generate_secret_string=secretsmanager.SecretStringGenerator(
                secret_string_template='{"client_id":"PLACEHOLDER","redirect_uris":["https://app.example.com/callback"],"scopes":["tweet.read","users.read"]}',
                generate_string_key="client_secret",
            ),
        )

        # GitHub OAuth credentials
        self.github_secret = secretsmanager.Secret(
            self,
            "GitHubOAuthSecret",
            secret_name="social-auth/github/credentials",
            description="OAuth credentials for GitHub authentication",
            generate_secret_string=secretsmanager.SecretStringGenerator(
                secret_string_template='{"client_id":"PLACEHOLDER","redirect_uris":["https://app.example.com/callback"],"scopes":["read:user","user:email"]}',
                generate_string_key="client_secret",
            ),
        )

        # Microsoft OAuth credentials
        self.microsoft_secret = secretsmanager.Secret(
            self,
            "MicrosoftOAuthSecret",
            secret_name="social-auth/microsoft/credentials",
            description="OAuth credentials for Microsoft authentication",
            generate_secret_string=secretsmanager.SecretStringGenerator(
                secret_string_template='{"client_id":"PLACEHOLDER","redirect_uris":["https://app.example.com/callback"],"scopes":["openid","email","profile"]}',
                generate_string_key="client_secret",
            ),
        )

        # ========================================
        # IAM Role for Lambda Execution
        # ========================================
        self.auth_lambda_role = iam.Role(
            self,
            "AuthLambdaRole",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "service-role/AWSLambdaBasicExecutionRole"
                ),
            ],
        )

        # Grant DynamoDB permissions
        self.user_profiles_table.grant_read_write_data(self.auth_lambda_role)
        self.rate_limits_table.grant_read_write_data(self.auth_lambda_role)

        # Grant Secrets Manager read permissions for all OAuth credentials
        self.google_secret.grant_read(self.auth_lambda_role)
        self.facebook_secret.grant_read(self.auth_lambda_role)
        self.instagram_secret.grant_read(self.auth_lambda_role)
        self.apple_secret.grant_read(self.auth_lambda_role)
        self.twitter_secret.grant_read(self.auth_lambda_role)
        self.github_secret.grant_read(self.auth_lambda_role)
        self.microsoft_secret.grant_read(self.auth_lambda_role)

        # Grant Cognito permissions for user management and token operations
        self.auth_lambda_role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "cognito-idp:AdminCreateUser",
                    "cognito-idp:AdminUpdateUserAttributes",
                    "cognito-idp:AdminInitiateAuth",
                    "cognito-idp:AdminGetUser",
                    "cognito-idp:AdminSetUserPassword",
                    "cognito-idp:AdminUserGlobalSignOut",
                ],
                resources=[self.user_pool.user_pool_arn],
            )
        )

        # ========================================
        # Lambda Functions
        # ========================================

        # Common environment variables for all Lambda functions
        common_env = {
            "USER_POOL_ID": self.user_pool.user_pool_id,
            "USER_POOL_CLIENT_ID": self.user_pool_client.user_pool_client_id,
            "USER_PROFILES_TABLE": self.user_profiles_table.table_name,
            "RATE_LIMITS_TABLE": self.rate_limits_table.table_name,
            "ENCRYPTION_KEY_SECRET": "social-auth/encryption-key",
            "LOG_LEVEL": self.config["log_level"],
            "ENVIRONMENT": environment,
            "ALLOWED_REDIRECT_URIS": self.config["allowed_redirect_uris"],
            "CORS_ALLOWED_ORIGINS": self.config["cors_allowed_origins"],
        }

        # Authentication Handler Lambda
        self.auth_handler = lambda_.Function(
            self,
            "AuthHandler",
            function_name=f"SanaathanaAalayaCharithra-AuthHandler-{environment}",
            runtime=lambda_.Runtime.PYTHON_3_11,
            handler="auth_handler.handler",
            code=lambda_.Code.from_asset("src/auth/lambdas"),
            layers=[self.dependencies_layer],
            role=self.auth_lambda_role,
            environment=common_env,
            timeout=Duration.seconds(30),
            memory_size=512,
            log_retention=self.config["log_retention"],
        )

        # Token Handler Lambda
        self.token_handler = lambda_.Function(
            self,
            "TokenHandler",
            function_name=f"SanaathanaAalayaCharithra-TokenHandler-{environment}",
            runtime=lambda_.Runtime.PYTHON_3_11,
            handler="token_handler.handler",
            code=lambda_.Code.from_asset("src/auth/lambdas"),
            layers=[self.dependencies_layer],
            role=self.auth_lambda_role,
            environment=common_env,
            timeout=Duration.seconds(30),
            memory_size=256,
            log_retention=self.config["log_retention"],
        )

        # Profile Handler Lambda
        self.profile_handler = lambda_.Function(
            self,
            "ProfileHandler",
            function_name=f"SanaathanaAalayaCharithra-ProfileHandler-{environment}",
            runtime=lambda_.Runtime.PYTHON_3_11,
            handler="profile_handler.handler",
            code=lambda_.Code.from_asset("src/auth/lambdas"),
            layers=[self.dependencies_layer],
            role=self.auth_lambda_role,
            environment=common_env,
            timeout=Duration.seconds(30),
            memory_size=256,
            log_retention=self.config["log_retention"],
        )

        # ========================================
        # API Gateway REST API
        # ========================================

        # Create REST API
        self.api = apigateway.RestApi(
            self,
            "AuthenticationAPI",
            rest_api_name="SanaathanaAalayaCharithra-Authentication",
            description="Social Media Authentication API for Sanaathana Aalaya Charithra",
            deploy_options=apigateway.StageOptions(
                stage_name="prod",
                logging_level=apigateway.MethodLoggingLevel.INFO,
                data_trace_enabled=True,
                metrics_enabled=True,
            ),
            default_cors_preflight_options=apigateway.CorsOptions(
                allow_origins=["https://app.sanaathana-aalaya-charithra.com"],
                allow_methods=["GET", "POST", "DELETE", "OPTIONS"],
                allow_headers=[
                    "Content-Type",
                    "Authorization",
                    "X-Device-Id",
                    "X-Amz-Date",
                    "X-Api-Key",
                    "X-Amz-Security-Token",
                ],
                allow_credentials=True,
                max_age=Duration.hours(1),
            ),
        )

        # Request/Response Models
        error_response_model = self.api.add_model(
            "ErrorResponse",
            content_type="application/json",
            model_name="ErrorResponse",
            schema=apigateway.JsonSchema(
                schema=apigateway.JsonSchemaVersion.DRAFT4,
                type=apigateway.JsonSchemaType.OBJECT,
                properties={
                    "error": apigateway.JsonSchema(
                        type=apigateway.JsonSchemaType.OBJECT,
                        properties={
                            "code": apigateway.JsonSchema(
                                type=apigateway.JsonSchemaType.STRING
                            ),
                            "message": apigateway.JsonSchema(
                                type=apigateway.JsonSchemaType.STRING
                            ),
                            "details": apigateway.JsonSchema(
                                type=apigateway.JsonSchemaType.OBJECT
                            ),
                        },
                        required=["code", "message"],
                    )
                },
                required=["error"],
            ),
        )

        # /auth resource
        auth_resource = self.api.root.add_resource("auth")

        # /auth/initiate/{provider} - POST
        initiate_resource = auth_resource.add_resource("initiate")
        provider_initiate_resource = initiate_resource.add_resource("{provider}")
        provider_initiate_resource.add_method(
            "POST",
            apigateway.LambdaIntegration(
                self.auth_handler,
                proxy=True,
                integration_responses=[
                    apigateway.IntegrationResponse(
                        status_code="200",
                        response_parameters={
                            "method.response.header.Access-Control-Allow-Origin": "'https://app.sanaathana-aalaya-charithra.com'"
                        },
                    )
                ],
            ),
            method_responses=[
                apigateway.MethodResponse(
                    status_code="200",
                    response_parameters={
                        "method.response.header.Access-Control-Allow-Origin": True
                    },
                ),
                apigateway.MethodResponse(
                    status_code="400",
                    response_models={"application/json": error_response_model},
                ),
                apigateway.MethodResponse(
                    status_code="429",
                    response_models={"application/json": error_response_model},
                ),
                apigateway.MethodResponse(
                    status_code="500",
                    response_models={"application/json": error_response_model},
                ),
            ],
        )

        # /auth/callback/{provider} - POST
        callback_resource = auth_resource.add_resource("callback")
        provider_callback_resource = callback_resource.add_resource("{provider}")
        provider_callback_resource.add_method(
            "POST",
            apigateway.LambdaIntegration(
                self.auth_handler,
                proxy=True,
                integration_responses=[
                    apigateway.IntegrationResponse(
                        status_code="200",
                        response_parameters={
                            "method.response.header.Access-Control-Allow-Origin": "'https://app.sanaathana-aalaya-charithra.com'"
                        },
                    )
                ],
            ),
            method_responses=[
                apigateway.MethodResponse(
                    status_code="200",
                    response_parameters={
                        "method.response.header.Access-Control-Allow-Origin": True
                    },
                ),
                apigateway.MethodResponse(
                    status_code="400",
                    response_models={"application/json": error_response_model},
                ),
                apigateway.MethodResponse(
                    status_code="401",
                    response_models={"application/json": error_response_model},
                ),
                apigateway.MethodResponse(
                    status_code="500",
                    response_models={"application/json": error_response_model},
                ),
            ],
        )

        # /auth/refresh - POST
        refresh_resource = auth_resource.add_resource("refresh")
        refresh_resource.add_method(
            "POST",
            apigateway.LambdaIntegration(
                self.token_handler,
                proxy=True,
                integration_responses=[
                    apigateway.IntegrationResponse(
                        status_code="200",
                        response_parameters={
                            "method.response.header.Access-Control-Allow-Origin": "'https://app.sanaathana-aalaya-charithra.com'"
                        },
                    )
                ],
            ),
            method_responses=[
                apigateway.MethodResponse(
                    status_code="200",
                    response_parameters={
                        "method.response.header.Access-Control-Allow-Origin": True
                    },
                ),
                apigateway.MethodResponse(
                    status_code="401",
                    response_models={"application/json": error_response_model},
                ),
                apigateway.MethodResponse(
                    status_code="500",
                    response_models={"application/json": error_response_model},
                ),
            ],
        )

        # /auth/signout - POST
        signout_resource = auth_resource.add_resource("signout")
        signout_resource.add_method(
            "POST",
            apigateway.LambdaIntegration(
                self.token_handler,
                proxy=True,
                integration_responses=[
                    apigateway.IntegrationResponse(
                        status_code="200",
                        response_parameters={
                            "method.response.header.Access-Control-Allow-Origin": "'https://app.sanaathana-aalaya-charithra.com'"
                        },
                    )
                ],
            ),
            method_responses=[
                apigateway.MethodResponse(
                    status_code="200",
                    response_parameters={
                        "method.response.header.Access-Control-Allow-Origin": True
                    },
                ),
                apigateway.MethodResponse(
                    status_code="401",
                    response_models={"application/json": error_response_model},
                ),
                apigateway.MethodResponse(
                    status_code="500",
                    response_models={"application/json": error_response_model},
                ),
            ],
        )

        # /profile resource
        profile_resource = self.api.root.add_resource("profile")

        # /profile/me - GET
        me_resource = profile_resource.add_resource("me")
        me_resource.add_method(
            "GET",
            apigateway.LambdaIntegration(
                self.profile_handler,
                proxy=True,
                integration_responses=[
                    apigateway.IntegrationResponse(
                        status_code="200",
                        response_parameters={
                            "method.response.header.Access-Control-Allow-Origin": "'https://app.sanaathana-aalaya-charithra.com'"
                        },
                    )
                ],
            ),
            method_responses=[
                apigateway.MethodResponse(
                    status_code="200",
                    response_parameters={
                        "method.response.header.Access-Control-Allow-Origin": True
                    },
                ),
                apigateway.MethodResponse(
                    status_code="401",
                    response_models={"application/json": error_response_model},
                ),
                apigateway.MethodResponse(
                    status_code="404",
                    response_models={"application/json": error_response_model},
                ),
                apigateway.MethodResponse(
                    status_code="500",
                    response_models={"application/json": error_response_model},
                ),
            ],
        )

        # /profile/link/{provider} - POST
        link_resource = profile_resource.add_resource("link")
        provider_link_resource = link_resource.add_resource("{provider}")
        provider_link_resource.add_method(
            "POST",
            apigateway.LambdaIntegration(
                self.profile_handler,
                proxy=True,
                integration_responses=[
                    apigateway.IntegrationResponse(
                        status_code="200",
                        response_parameters={
                            "method.response.header.Access-Control-Allow-Origin": "'https://app.sanaathana-aalaya-charithra.com'"
                        },
                    )
                ],
            ),
            method_responses=[
                apigateway.MethodResponse(
                    status_code="200",
                    response_parameters={
                        "method.response.header.Access-Control-Allow-Origin": True
                    },
                ),
                apigateway.MethodResponse(
                    status_code="400",
                    response_models={"application/json": error_response_model},
                ),
                apigateway.MethodResponse(
                    status_code="401",
                    response_models={"application/json": error_response_model},
                ),
                apigateway.MethodResponse(
                    status_code="409",
                    response_models={"application/json": error_response_model},
                ),
                apigateway.MethodResponse(
                    status_code="500",
                    response_models={"application/json": error_response_model},
                ),
            ],
        )

        # /profile/unlink/{provider} - DELETE
        unlink_resource = profile_resource.add_resource("unlink")
        provider_unlink_resource = unlink_resource.add_resource("{provider}")
        provider_unlink_resource.add_method(
            "DELETE",
            apigateway.LambdaIntegration(
                self.profile_handler,
                proxy=True,
                integration_responses=[
                    apigateway.IntegrationResponse(
                        status_code="200",
                        response_parameters={
                            "method.response.header.Access-Control-Allow-Origin": "'https://app.sanaathana-aalaya-charithra.com'"
                        },
                    )
                ],
            ),
            method_responses=[
                apigateway.MethodResponse(
                    status_code="200",
                    response_parameters={
                        "method.response.header.Access-Control-Allow-Origin": True
                    },
                ),
                apigateway.MethodResponse(
                    status_code="400",
                    response_models={"application/json": error_response_model},
                ),
                apigateway.MethodResponse(
                    status_code="401",
                    response_models={"application/json": error_response_model},
                ),
                apigateway.MethodResponse(
                    status_code="404",
                    response_models={"application/json": error_response_model},
                ),
                apigateway.MethodResponse(
                    status_code="500",
                    response_models={"application/json": error_response_model},
                ),
            ],
        )
        
        # ========================================
        # CloudWatch Alarms
        # ========================================
        self._create_cloudwatch_alarms()

        # ========================================
        # Outputs
        # ========================================

        CfnOutput(
            self,
            "UserPoolId",
            value=self.user_pool.user_pool_id,
            description="Cognito User Pool ID for social media authentication",
        )

        CfnOutput(
            self,
            "UserPoolClientId",
            value=self.user_pool_client.user_pool_client_id,
            description="Cognito User Pool Client ID for mobile app",
        )

        CfnOutput(
            self,
            "UserProfilesTableName",
            value=self.user_profiles_table.table_name,
            description="DynamoDB table for user profiles",
        )

        CfnOutput(
            self,
            "RateLimitsTableName",
            value=self.rate_limits_table.table_name,
            description="DynamoDB table for authentication rate limiting",
        )

        CfnOutput(
            self,
            "DependenciesLayerArn",
            value=self.dependencies_layer.layer_version_arn,
            description="Lambda layer ARN for shared authentication dependencies",
        )

        CfnOutput(
            self,
            "AuthLambdaRoleArn",
            value=self.auth_lambda_role.role_arn,
            description="IAM role ARN for authentication Lambda functions",
        )

        CfnOutput(
            self,
            "ApiGatewayUrl",
            value=self.api.url,
            description="API Gateway endpoint URL for authentication API",
        )

        CfnOutput(
            self,
            "AuthHandlerArn",
            value=self.auth_handler.function_arn,
            description="Lambda function ARN for authentication handler",
        )

        CfnOutput(
            self,
            "TokenHandlerArn",
            value=self.token_handler.function_arn,
            description="Lambda function ARN for token handler",
        )

        CfnOutput(
            self,
            "ProfileHandlerArn",
            value=self.profile_handler.function_arn,
            description="Lambda function ARN for profile handler",
        )
    
    def _get_environment_config(self, environment: str) -> dict:
        """
        Get environment-specific configuration.
        
        Args:
            environment: Environment name (dev, staging, prod)
            
        Returns:
            dict: Environment configuration
        """
        configs = {
            "dev": {
                "log_level": "DEBUG",
                "log_retention": logs.RetentionDays.ONE_WEEK,
                "removal_policy": RemovalPolicy.DESTROY,
                "enable_pitr": False,
                "allowed_redirect_uris": "http://localhost:3000/callback,https://dev.sanaathana-aalaya-charithra.com/callback",
                "cors_allowed_origins": "http://localhost:3000,https://dev.sanaathana-aalaya-charithra.com",
            },
            "staging": {
                "log_level": "INFO",
                "log_retention": logs.RetentionDays.TWO_WEEKS,
                "removal_policy": RemovalPolicy.RETAIN,
                "enable_pitr": True,
                "allowed_redirect_uris": "https://staging.sanaathana-aalaya-charithra.com/callback",
                "cors_allowed_origins": "https://staging.sanaathana-aalaya-charithra.com",
            },
            "prod": {
                "log_level": "INFO",
                "log_retention": logs.RetentionDays.ONE_MONTH,
                "removal_policy": RemovalPolicy.RETAIN,
                "enable_pitr": True,
                "allowed_redirect_uris": "https://app.sanaathana-aalaya-charithra.com/callback",
                "cors_allowed_origins": "https://app.sanaathana-aalaya-charithra.com",
            }
        }
        
        return configs.get(environment, configs["dev"])
    
    def _create_cloudwatch_alarms(self) -> None:
        """Create CloudWatch alarms for monitoring authentication service."""
        if not self.alarm_topic:
            return
        
        # Lambda Error Alarms
        for function_name, function in [
            ("AuthHandler", self.auth_handler),
            ("TokenHandler", self.token_handler),
            ("ProfileHandler", self.profile_handler),
        ]:
            # Error rate alarm
            error_alarm = cloudwatch.Alarm(
                self,
                f"{function_name}ErrorAlarm",
                alarm_name=f"{function_name}-Errors-{self.environment}",
                metric=function.metric_errors(
                    statistic="Sum",
                    period=Duration.minutes(5)
                ),
                threshold=5,
                evaluation_periods=1,
                comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
                alarm_description=f"Alert when {function_name} has more than 5 errors in 5 minutes",
            )
            error_alarm.add_alarm_action(cw_actions.SnsAction(self.alarm_topic))
            
            # Throttle alarm
            throttle_alarm = cloudwatch.Alarm(
                self,
                f"{function_name}ThrottleAlarm",
                alarm_name=f"{function_name}-Throttles-{self.environment}",
                metric=function.metric_throttles(
                    statistic="Sum",
                    period=Duration.minutes(5)
                ),
                threshold=10,
                evaluation_periods=1,
                comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
                alarm_description=f"Alert when {function_name} is throttled more than 10 times in 5 minutes",
            )
            throttle_alarm.add_alarm_action(cw_actions.SnsAction(self.alarm_topic))
            
            # Duration alarm (p99 latency)
            duration_alarm = cloudwatch.Alarm(
                self,
                f"{function_name}DurationAlarm",
                alarm_name=f"{function_name}-HighLatency-{self.environment}",
                metric=function.metric_duration(
                    statistic="p99",
                    period=Duration.minutes(5)
                ),
                threshold=5000,  # 5 seconds
                evaluation_periods=2,
                comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
                alarm_description=f"Alert when {function_name} p99 latency exceeds 5 seconds",
            )
            duration_alarm.add_alarm_action(cw_actions.SnsAction(self.alarm_topic))
        
        # API Gateway 4xx/5xx Error Alarms
        api_4xx_alarm = cloudwatch.Alarm(
            self,
            "Api4xxErrorAlarm",
            alarm_name=f"AuthAPI-4xxErrors-{self.environment}",
            metric=self.api.metric_client_error(
                statistic="Sum",
                period=Duration.minutes(5)
            ),
            threshold=50,
            evaluation_periods=1,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
            alarm_description="Alert when API has more than 50 4xx errors in 5 minutes",
        )
        api_4xx_alarm.add_alarm_action(cw_actions.SnsAction(self.alarm_topic))
        
        api_5xx_alarm = cloudwatch.Alarm(
            self,
            "Api5xxErrorAlarm",
            alarm_name=f"AuthAPI-5xxErrors-{self.environment}",
            metric=self.api.metric_server_error(
                statistic="Sum",
                period=Duration.minutes(5)
            ),
            threshold=10,
            evaluation_periods=1,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
            alarm_description="Alert when API has more than 10 5xx errors in 5 minutes",
        )
        api_5xx_alarm.add_alarm_action(cw_actions.SnsAction(self.alarm_topic))
        
        # DynamoDB Throttle Alarms
        for table_name, table in [
            ("UserProfiles", self.user_profiles_table),
            ("RateLimits", self.rate_limits_table),
        ]:
            read_throttle_alarm = cloudwatch.Alarm(
                self,
                f"{table_name}ReadThrottleAlarm",
                alarm_name=f"{table_name}-ReadThrottles-{self.environment}",
                metric=table.metric_user_errors(
                    statistic="Sum",
                    period=Duration.minutes(5)
                ),
                threshold=5,
                evaluation_periods=1,
                comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
                alarm_description=f"Alert when {table_name} table has read throttles",
            )
            read_throttle_alarm.add_alarm_action(cw_actions.SnsAction(self.alarm_topic))
