#!/usr/bin/env python3
"""
Simple Bedrock Test Script using boto3
Tests Claude 3 Haiku model access
"""

import json
import sys

try:
    import boto3
    from botocore.exceptions import ClientError, NoCredentialsError
except ImportError:
    print("❌ boto3 not installed")
    print("\nInstall it with:")
    print("  pip install boto3")
    sys.exit(1)

def test_bedrock():
    print("Testing AWS Bedrock Access...")
    print()
    
    # Check AWS credentials
    print("1. Checking AWS credentials...")
    try:
        sts = boto3.client('sts')
        identity = sts.get_caller_identity()
        print(f"   ✓ AWS Account: {identity['Account']}")
        print(f"   ✓ User/Role: {identity['Arn']}")
    except NoCredentialsError:
        print("   ✗ AWS credentials not configured")
        print("\nRun: aws configure")
        sys.exit(1)
    except Exception as e:
        print(f"   ✗ Error checking credentials: {e}")
        sys.exit(1)
    
    # Test Bedrock
    print()
    print("2. Testing Bedrock model access...")
    print("   Model: Claude 3 Haiku")
    
    # Load AWS region from global config or environment
    aws_region = os.environ.get('AWS_REGION', 'ap-south-1')
    print(f"   Region: {aws_region} (loaded from global config)")
    
    try:
        # Create Bedrock client
        bedrock = boto3.client(
            service_name='bedrock-runtime',
            region_name=aws_region
        )
        
        # Prepare request
        request_body = {
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": 100,
            "messages": [
                {
                    "role": "user",
                    "content": "Hello, respond with just 'Hi there!'"
                }
            ]
        }
        
        print("   Invoking model...")
        
        # Invoke model
        response = bedrock.invoke_model(
            modelId='anthropic.claude-3-haiku-20240307-v1:0',
            contentType='application/json',
            accept='application/json',
            body=json.dumps(request_body)
        )
        
        # Parse response
        response_body = json.loads(response['body'].read())
        response_text = response_body['content'][0]['text']
        
        print("   ✓ Model invocation successful!")
        print()
        print("Response from Claude:")
        print(f"   {response_text}")
        print()
        print("✓ SUCCESS! Bedrock is working correctly.")
        print()
        print("Next steps:")
        print("  • Run full test: .\\scripts\\test-bedrock-models.ps1")
        print("  • Start development: .\\scripts\\generate-content-locally.ps1")
        
        return True
        
    except ClientError as e:
        error_code = e.response['Error']['Code']
        error_message = e.response['Error']['Message']
        
        print("   ✗ Model invocation failed")
        print()
        print(f"Error: {error_code}")
        print(f"Message: {error_message}")
        print()
        
        if error_code == 'AccessDeniedException':
            print("Common causes:")
            print("  1. IAM permissions missing - Need bedrock:InvokeModel")
            print("  2. Anthropic models require use case submission")
            print("  3. Account verification pending")
            print()
            print("To fix IAM permissions:")
            print("  aws iam attach-user-policy \\")
            print("    --user-name YOUR_USERNAME \\")
            print("    --policy-arn arn:aws:iam::aws:policy/AmazonBedrockFullAccess")
            print()
            print("Or create a support case:")
            print("  https://console.aws.amazon.com/support/")
            
        elif error_code == 'ValidationException':
            print("Model ID or region may be incorrect")
            print("  • Verify model ID: anthropic.claude-3-haiku-20240307-v1:0")
            print(f"  • Verify region: {aws_region} (from global config)")
            
        elif error_code == 'ThrottlingException':
            print("Too many requests - wait and retry")
            
        else:
            print(f"Unexpected error: {error_code}")
            print("See BEDROCK_NEW_AUTO_ACCESS.md for troubleshooting")
        
        return False
        
    except Exception as e:
        print(f"   ✗ Unexpected error: {e}")
        print()
        print("See BEDROCK_NEW_AUTO_ACCESS.md for troubleshooting")
        return False

if __name__ == "__main__":
    success = test_bedrock()
    sys.exit(0 if success else 1)
