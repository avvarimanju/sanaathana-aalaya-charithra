"""
Pytest configuration and fixtures for backend tests
"""

import pytest
import boto3
from moto import mock_aws
import os
from decimal import Decimal

# Set test environment variables
os.environ["AWS_DEFAULT_REGION"] = "us-east-1"
os.environ["CONTENT_BUCKET"] = "test-content-bucket"


@pytest.fixture(scope="function")
def aws_credentials():
    """Mock AWS Credentials for moto"""
    os.environ["AWS_ACCESS_KEY_ID"] = "testing"
    os.environ["AWS_SECRET_ACCESS_KEY"] = "testing"
    os.environ["AWS_SECURITY_TOKEN"] = "testing"
    os.environ["AWS_SESSION_TOKEN"] = "testing"


@pytest.fixture(scope="function")
def dynamodb_mock(aws_credentials):
    """Create mock DynamoDB tables"""
    with mock_aws():
        # Create DynamoDB resource
        dynamodb = boto3.resource("dynamodb", region_name="us-east-1")
        
        # Create HeritageSites table
        heritage_sites_table = dynamodb.create_table(
            TableName="SanaathanaAalayaCharithra-HeritageSites",
            KeySchema=[{"AttributeName": "siteId", "KeyType": "HASH"}],
            AttributeDefinitions=[{"AttributeName": "siteId", "AttributeType": "S"}],
            BillingMode="PAY_PER_REQUEST",
        )
        
        # Create Artifacts table
        artifacts_table = dynamodb.create_table(
            TableName="SanaathanaAalayaCharithra-Artifacts",
            KeySchema=[{"AttributeName": "artifactId", "KeyType": "HASH"}],
            AttributeDefinitions=[{"AttributeName": "artifactId", "AttributeType": "S"}],
            BillingMode="PAY_PER_REQUEST",
        )
        
        # Create ContentCache table
        content_cache_table = dynamodb.create_table(
            TableName="SanaathanaAalayaCharithra-ContentCache",
            KeySchema=[{"AttributeName": "cacheKey", "KeyType": "HASH"}],
            AttributeDefinitions=[{"AttributeName": "cacheKey", "AttributeType": "S"}],
            BillingMode="PAY_PER_REQUEST",
        )
        
        yield {
            "heritage_sites": heritage_sites_table,
            "artifacts": artifacts_table,
            "content_cache": content_cache_table,
        }


@pytest.fixture(scope="function")
def s3_mock(aws_credentials):
    """Create mock S3 bucket"""
    with mock_aws():
        s3 = boto3.client("s3", region_name="us-east-1")
        s3.create_bucket(Bucket="test-content-bucket")
        yield s3


@pytest.fixture
def sample_temple_data():
    """Sample temple data for testing"""
    return {
        "siteName": "Test Temple",
        "stateLocation": "Karnataka",
        "description": "A beautiful test temple",
        "latitude": Decimal("12.9716"),
        "longitude": Decimal("77.5946"),
        "city": "Bangalore",
        "district": "Bangalore Urban",
        "pincode": "560001",
        "images": [],
        "status": "ACTIVE",
    }


@pytest.fixture
def sample_artifact_data():
    """Sample artifact data for testing"""
    return {
        "artifactName": "Test Artifact",
        "siteId": "test-site-id",
        "description": "A beautiful test artifact",
        "category": "Sculpture",
        "historicalPeriod": "Medieval",
        "images": [],
        "videos": [],
        "status": "ACTIVE",
    }
