"""
Property-Based Tests for Temple Image Upload Operations

**Property 8: Temple image uploads result in S3 URLs**
**Validates: Requirements 2.6**

These tests use Hypothesis to verify temple image upload operations
across a wide range of inputs, ensuring the image upload system
behaves correctly under all conditions.
"""

import pytest
import base64
import uuid
from unittest.mock import Mock, patch, MagicMock
from hypothesis import given, strategies as st, settings
from hypothesis.strategies import composite
import boto3
from moto import mock_s3, mock_dynamodb
from admin.handlers.temple_handler import handle_temple_image_upload


# Test data generators using Hypothesis
@composite
def valid_site_id(draw):
    """Generate valid temple site IDs"""
    return draw(st.text(
        alphabet=st.characters(whitelist_categories=('Lu', 'Ll', 'Nd'), whitelist_characters='-_'),
        min_size=10,
        max_size=50
    ).filter(lambda x: x and not x.startswith('-') and not x.endswith('-')))


@composite
def valid_file_extension(draw):
    """Generate valid image file extensions"""
    return draw(st.sampled_from(['jpg', 'jpeg', 'png', 'gif', 'webp']))


@composite
def valid_base64_image(draw):
    """Generate valid base64 encoded image data"""
    # Generate random bytes representing image data (100 bytes to 1MB)
    image_bytes = draw(st.binary(min_size=100, max_size=1024*1024))
    return base64.b64encode(image_bytes).decode('utf-8')


@composite
def oversized_base64_image(draw):
    """Generate oversized base64 encoded image data (>10MB)"""
    # Generate oversized bytes (11MB to 20MB)
    size = draw(st.integers(min_value=11*1024*1024, max_value=20*1024*1024))
    image_bytes = b'0' * size
    return base64.b64encode(image_bytes).decode('utf-8')


@composite
def valid_image_upload_request(draw):
    """Generate valid image upload request data"""
    return {
        'base64Data': draw(valid_base64_image()),
        'fileExtension': draw(valid_file_extension()),
        'fileName': draw(st.one_of(st.none(), st.text(min_size=5, max_size=50)))
    }


@composite
def valid_temple_data(draw):
    """Generate valid temple data"""
    return {
        'siteId': draw(valid_site_id()),
        'siteName': draw(st.text(min_size=3, max_size=100)),
        'stateLocation': draw(st.sampled_from([
            'Andhra Pradesh', 'Karnataka', 'Tamil Nadu', 
            'Maharashtra', 'Madhya Pradesh', 'Kerala'
        ])),
        'description': draw(st.text(min_size=10, max_size=1000)),
        'images': draw(st.lists(st.text(), max_size=5)),
        'deleted': False,
        'createdAt': '2024-01-01T00:00:00Z',
        'updatedAt': '2024-01-01T00:00:00Z',
        'createdBy': 'test-user'
    }


@composite
def valid_user_id(draw):
    """Generate valid user IDs"""
    return draw(st.text(min_size=5, max_size=50))


class TestTempleImageUploadProperties:
    """Property-based tests for temple image upload functionality"""

    @pytest.fixture
    def mock_dynamodb_table(self):
        """Mock DynamoDB table for testing"""
        with mock_dynamodb():
            # Create mock table
            dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
            table = dynamodb.create_table(
                TableName='HeritageSites',
                KeySchema=[{'AttributeName': 'siteId', 'KeyType': 'HASH'}],
                AttributeDefinitions=[{'AttributeName': 'siteId', 'AttributeType': 'S'}],
                BillingMode='PAY_PER_REQUEST'
            )
            yield table

    @pytest.fixture
    def mock_s3_client(self):
        """Mock S3 client for testing"""
        with mock_s3():
            s3 = boto3.client('s3', region_name='us-east-1')
            s3.create_bucket(Bucket='sanaathana-aalaya-charithra-content')
            yield s3

    @given(
        temple_data=valid_temple_data(),
        upload_request=valid_image_upload_request(),
        user_id=valid_user_id()
    )
    @settings(max_examples=50, deadline=None)
    def test_property_8_image_uploads_result_in_s3_urls(
        self, 
        temple_data, 
        upload_request, 
        user_id,
        mock_dynamodb_table,
        mock_s3_client
    ):
        """
        **Property 8: Temple image uploads result in S3 URLs**
        **Validates: Requirements 2.6**
        
        Test that image uploads always result in valid S3 URLs
        """
        # Setup: Add temple to DynamoDB
        mock_dynamodb_table.put_item(Item=temple_data)
        
        # Mock the heritage_sites_table in the handler
        with patch('admin.handlers.temple_handler.heritage_sites_table', mock_dynamodb_table):
            with patch('admin.handlers.temple_handler.boto3.client', return_value=mock_s3_client):
                # Execute: Upload image
                result = handle_temple_image_upload(
                    temple_data['siteId'], 
                    upload_request, 
                    user_id
                )
                
                # Verify: Response structure
                assert 'imageUrl' in result
                assert 'message' in result
                assert result['message'] == 'Image uploaded successfully'
                
                # Verify: S3 URL format
                expected_pattern = f"https://sanaathana-aalaya-charithra-content.s3.amazonaws.com/temples/{temple_data['siteId']}/"
                assert result['imageUrl'].startswith(expected_pattern)
                assert result['imageUrl'].endswith(f".{upload_request['fileExtension']}")
                
                # Verify: URL contains image ID pattern
                import re
                url_pattern = r'https://sanaathana-aalaya-charithra-content\.s3\.amazonaws\.com/temples/[^/]+/[a-f0-9-]+\.(jpg|jpeg|png|gif|webp)$'
                assert re.match(url_pattern, result['imageUrl'])
                
                # Verify: Temple images array is updated
                updated_temple = mock_dynamodb_table.get_item(Key={'siteId': temple_data['siteId']})['Item']
                assert result['imageUrl'] in updated_temple['images']
                assert len(updated_temple['images']) == len(temple_data['images']) + 1

    @given(
        temple_data=valid_temple_data(),
        upload_requests=st.lists(valid_image_upload_request(), min_size=2, max_size=5),
        user_id=valid_user_id()
    )
    @settings(max_examples=30, deadline=None)
    def test_multiple_image_uploads_generate_unique_urls(
        self, 
        temple_data, 
        upload_requests, 
        user_id,
        mock_dynamodb_table,
        mock_s3_client
    ):
        """Test that multiple image uploads generate unique S3 URLs"""
        # Setup: Add temple to DynamoDB
        mock_dynamodb_table.put_item(Item=temple_data)
        initial_image_count = len(temple_data['images'])
        
        uploaded_urls = []
        
        with patch('admin.handlers.temple_handler.heritage_sites_table', mock_dynamodb_table):
            with patch('admin.handlers.temple_handler.boto3.client', return_value=mock_s3_client):
                # Execute: Upload multiple images
                for upload_request in upload_requests:
                    result = handle_temple_image_upload(
                        temple_data['siteId'], 
                        upload_request, 
                        user_id
                    )
                    uploaded_urls.append(result['imageUrl'])
                    
                    # Verify each upload returns valid S3 URL
                    assert result['imageUrl'].startswith('https://sanaathana-aalaya-charithra-content.s3.amazonaws.com/')
                
                # Verify: All URLs are unique
                assert len(set(uploaded_urls)) == len(upload_requests)
                
                # Verify: Temple images array contains all uploaded images
                updated_temple = mock_dynamodb_table.get_item(Key={'siteId': temple_data['siteId']})['Item']
                assert len(updated_temple['images']) == initial_image_count + len(upload_requests)
                
                for url in uploaded_urls:
                    assert url in updated_temple['images']

    @given(
        temple_data=valid_temple_data(),
        file_extension=valid_file_extension(),
        user_id=valid_user_id(),
        oversized_data=oversized_base64_image()
    )
    @settings(max_examples=20, deadline=None)
    def test_file_size_validation_rejects_oversized_images(
        self, 
        temple_data, 
        file_extension, 
        user_id, 
        oversized_data,
        mock_dynamodb_table,
        mock_s3_client
    ):
        """Test that file size validation rejects images larger than 10MB"""
        # Setup: Add temple to DynamoDB
        mock_dynamodb_table.put_item(Item=temple_data)
        
        oversized_request = {
            'base64Data': oversized_data,
            'fileExtension': file_extension
        }
        
        with patch('admin.handlers.temple_handler.heritage_sites_table', mock_dynamodb_table):
            with patch('admin.handlers.temple_handler.boto3.client', return_value=mock_s3_client):
                # Execute & Verify: Should raise ValueError for oversized files
                with pytest.raises(ValueError, match='Image size exceeds 10MB limit'):
                    handle_temple_image_upload(
                        temple_data['siteId'], 
                        oversized_request, 
                        user_id
                    )

    @given(
        non_existent_site_id=valid_site_id(),
        upload_request=valid_image_upload_request(),
        user_id=valid_user_id()
    )
    @settings(max_examples=30, deadline=None)
    def test_upload_rejects_non_existent_temples(
        self, 
        non_existent_site_id, 
        upload_request, 
        user_id,
        mock_dynamodb_table,
        mock_s3_client
    ):
        """Test that uploads are rejected for non-existent temples"""
        with patch('admin.handlers.temple_handler.heritage_sites_table', mock_dynamodb_table):
            with patch('admin.handlers.temple_handler.boto3.client', return_value=mock_s3_client):
                # Execute & Verify: Should raise ValueError for non-existent temple
                with pytest.raises(ValueError, match=f'Temple not found: {non_existent_site_id}'):
                    handle_temple_image_upload(
                        non_existent_site_id, 
                        upload_request, 
                        user_id
                    )

    @given(
        temple_data=valid_temple_data(),
        file_extension=valid_file_extension(),
        user_id=valid_user_id()
    )
    @settings(max_examples=20, deadline=None)
    def test_upload_rejects_missing_base64_data(
        self, 
        temple_data, 
        file_extension, 
        user_id,
        mock_dynamodb_table,
        mock_s3_client
    ):
        """Test that uploads are rejected when base64Data is missing"""
        # Setup: Add temple to DynamoDB
        mock_dynamodb_table.put_item(Item=temple_data)
        
        invalid_request = {
            'base64Data': '',
            'fileExtension': file_extension
        }
        
        with patch('admin.handlers.temple_handler.heritage_sites_table', mock_dynamodb_table):
            with patch('admin.handlers.temple_handler.boto3.client', return_value=mock_s3_client):
                # Execute & Verify: Should raise ValueError for missing base64 data
                with pytest.raises(ValueError, match='Missing base64Data in request body'):
                    handle_temple_image_upload(
                        temple_data['siteId'], 
                        invalid_request, 
                        user_id
                    )

    @given(
        temple_data=valid_temple_data(),
        file_extension=valid_file_extension(),
        user_id=valid_user_id(),
        invalid_base64=st.text(min_size=10, max_size=100).filter(
            lambda s: not _is_valid_base64(s)
        )
    )
    @settings(max_examples=20, deadline=None)
    def test_upload_rejects_invalid_base64_data(
        self, 
        temple_data, 
        file_extension, 
        user_id, 
        invalid_base64,
        mock_dynamodb_table,
        mock_s3_client
    ):
        """Test that uploads are rejected when base64Data is invalid"""
        # Setup: Add temple to DynamoDB
        mock_dynamodb_table.put_item(Item=temple_data)
        
        invalid_request = {
            'base64Data': invalid_base64,
            'fileExtension': file_extension
        }
        
        with patch('admin.handlers.temple_handler.heritage_sites_table', mock_dynamodb_table):
            with patch('admin.handlers.temple_handler.boto3.client', return_value=mock_s3_client):
                # Execute & Verify: Should raise ValueError for invalid base64 data
                with pytest.raises(ValueError, match='Invalid base64 data'):
                    handle_temple_image_upload(
                        temple_data['siteId'], 
                        invalid_request, 
                        user_id
                    )


def _is_valid_base64(s: str) -> bool:
    """Helper function to check if a string is valid base64"""
    try:
        base64.b64decode(s, validate=True)
        return True
    except Exception:
        return False