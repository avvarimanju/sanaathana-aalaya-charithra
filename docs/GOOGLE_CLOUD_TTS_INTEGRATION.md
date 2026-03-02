# Google Cloud Text-to-Speech Integration for Sanskrit

## Overview

This document describes the integration of Google Cloud TTS for Sanskrit audio generation, while continuing to use AWS Polly for other languages.

## Architecture

```
Content Generation Flow:
┌─────────────────────────────────────────────────────────────┐
│ Admin Portal - Content Generation                        │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Select Language: Sanskrit                                │ │
│ │ Select Artifact: Hanging Pillar                          │ │
│ │ Click: Generate Content                                  │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Lambda Function: Content Generator                          │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 1. Generate text using Amazon Bedrock                   │ │
│ │ 2. Check language:                                       │ │
│ │    - If Sanskrit → Use Google Cloud TTS                 │ │
│ │    - If Other → Use AWS Polly                           │ │
│ │ 3. Store audio in S3                                     │ │
│ │ 4. Save metadata in DynamoDB                             │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Storage                                                      │
│ ┌──────────────────┐  ┌──────────────────┐                 │
│ │ S3 Bucket        │  │ DynamoDB         │                 │
│ │ audio/sa/        │  │ Content Table    │                 │
│ │ artifact-123.mp3 │  │ {                │                 │
│ │                  │  │   audioUrl: ...  │                 │
│ │                  │  │   language: sa   │                 │
│ └──────────────────┘  └──────────────────┘                 │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Mobile App                                                   │
│ User plays Sanskrit audio → Streams from CloudFront/S3      │
└─────────────────────────────────────────────────────────────┘
```

## Setup Instructions

### 1. Create Google Cloud Project

```bash
# Install Google Cloud SDK
# Visit: https://cloud.google.com/sdk/docs/install

# Login
gcloud auth login

# Create project
gcloud projects create sanaathana-aalaya-tts --name="Sanaathana Aalaya TTS"

# Set project
gcloud config set project sanaathana-aalaya-tts

# Enable Text-to-Speech API
gcloud services enable texttospeech.googleapis.com
```

### 2. Create Service Account

```bash
# Create service account
gcloud iam service-accounts create tts-service-account \
    --display-name="TTS Service Account"

# Grant permissions
gcloud projects add-iam-policy-binding sanaathana-aalaya-tts \
    --member="serviceAccount:tts-service-account@sanaathana-aalaya-tts.iam.gserviceaccount.com" \
    --role="roles/cloudtexttospeech.user"

# Create and download key
gcloud iam service-accounts keys create ~/tts-service-key.json \
    --iam-account=tts-service-account@sanaathana-aalaya-tts.iam.gserviceaccount.com
```

### 3. Store Credentials in AWS Secrets Manager

```bash
# Store Google Cloud credentials in AWS Secrets Manager
aws secretsmanager create-secret \
    --name sanaathana/google-cloud-tts-credentials \
    --description "Google Cloud TTS service account credentials" \
    --secret-string file://~/tts-service-key.json \
    --region us-east-1
```

### 4. Update Lambda Function

Add Google Cloud TTS SDK to Lambda layer:

```bash
# Create layer directory
mkdir -p lambda-layers/google-tts/python

# Install dependencies
pip install google-cloud-texttospeech -t lambda-layers/google-tts/python/

# Create layer zip
cd lambda-layers/google-tts
zip -r google-tts-layer.zip python/

# Upload to AWS
aws lambda publish-layer-version \
    --layer-name google-cloud-tts \
    --zip-file fileb://google-tts-layer.zip \
    --compatible-runtimes python3.11 \
    --region us-east-1
```

## Implementation

### Lambda Function Code

```python
# lambda/content-generator/handler.py

import json
import boto3
import os
from google.cloud import texttospeech
from google.oauth2 import service_account

# Initialize clients
s3 = boto3.client('s3')
polly = boto3.client('polly')
secrets = boto3.client('secretsmanager')
bedrock = boto3.client('bedrock-runtime')

# Language to TTS service mapping
TTS_SERVICE = {
    'en': 'aws',
    'hi': 'aws',
    'te': 'aws',
    'sa': 'google',  # Sanskrit uses Google
    'bn': 'aws',
    'gu': 'aws',
    'kn': 'aws',
    'ml': 'aws',
    'mr': 'aws',
    'pa': 'aws',
    'ta': 'aws',
}

def get_google_tts_client():
    """Initialize Google Cloud TTS client with credentials from Secrets Manager"""
    # Get credentials from AWS Secrets Manager
    secret = secrets.get_secret_value(
        SecretId='sanaathana/google-cloud-tts-credentials'
    )
    credentials_json = json.loads(secret['SecretString'])
    
    # Create credentials object
    credentials = service_account.Credentials.from_service_account_info(
        credentials_json
    )
    
    # Initialize client
    return texttospeech.TextToSpeechClient(credentials=credentials)

def generate_audio_google(text, language_code='sa-IN'):
    """Generate audio using Google Cloud TTS"""
    client = get_google_tts_client()
    
    # Set up the synthesis input
    synthesis_input = texttospeech.SynthesisInput(text=text)
    
    # Build the voice request
    voice = texttospeech.VoiceSelectionParams(
        language_code=language_code,
        name='sa-IN-Standard-A',  # Sanskrit voice
    )
    
    # Select the audio format
    audio_config = texttospeech.AudioConfig(
        audio_encoding=texttospeech.AudioEncoding.MP3,
        speaking_rate=0.9,  # Slightly slower for Sanskrit
        pitch=0.0,
    )
    
    # Perform the text-to-speech request
    response = client.synthesize_speech(
        input=synthesis_input,
        voice=voice,
        audio_config=audio_config
    )
    
    return response.audio_content

def generate_audio_aws(text, language_code, voice_id):
    """Generate audio using AWS Polly"""
    response = polly.synthesize_speech(
        Text=text,
        OutputFormat='mp3',
        VoiceId=voice_id,
        LanguageCode=language_code,
        Engine='neural'
    )
    
    return response['AudioStream'].read()

def lambda_handler(event, context):
    """Main handler for content generation"""
    
    # Parse input
    artifact_id = event['artifactId']
    language = event['language']
    content_type = event.get('contentType', 'audio_guide')
    
    # Step 1: Generate text using Amazon Bedrock
    text_content = generate_text_content(artifact_id, language)
    
    # Step 2: Generate audio based on language
    tts_service = TTS_SERVICE.get(language, 'aws')
    
    if tts_service == 'google':
        # Use Google Cloud TTS for Sanskrit
        audio_data = generate_audio_google(
            text=text_content,
            language_code='sa-IN'
        )
        tts_provider = 'google'
    else:
        # Use AWS Polly for other languages
        voice_config = get_aws_voice_config(language)
        audio_data = generate_audio_aws(
            text=text_content,
            language_code=voice_config['language_code'],
            voice_id=voice_config['voice_id']
        )
        tts_provider = 'aws'
    
    # Step 3: Upload to S3
    bucket_name = os.environ['AUDIO_BUCKET']
    s3_key = f'audio/{language}/{artifact_id}.mp3'
    
    s3.put_object(
        Bucket=bucket_name,
        Key=s3_key,
        Body=audio_data,
        ContentType='audio/mpeg',
        Metadata={
            'artifact-id': artifact_id,
            'language': language,
            'tts-provider': tts_provider,
        }
    )
    
    # Step 4: Generate CloudFront URL
    cloudfront_domain = os.environ['CLOUDFRONT_DOMAIN']
    audio_url = f'https://{cloudfront_domain}/{s3_key}'
    
    # Step 5: Save metadata to DynamoDB
    save_content_metadata(
        artifact_id=artifact_id,
        language=language,
        content_type=content_type,
        text_content=text_content,
        audio_url=audio_url,
        tts_provider=tts_provider,
    )
    
    return {
        'statusCode': 200,
        'body': json.dumps({
            'message': 'Content generated successfully',
            'artifactId': artifact_id,
            'language': language,
            'audioUrl': audio_url,
            'ttsProvider': tts_provider,
        })
    }

def get_aws_voice_config(language):
    """Get AWS Polly voice configuration for language"""
    voice_map = {
        'en': {'language_code': 'en-IN', 'voice_id': 'Kajal'},
        'hi': {'language_code': 'hi-IN', 'voice_id': 'Kajal'},
        'te': {'language_code': 'te-IN', 'voice_id': 'Kajal'},
        'ta': {'language_code': 'ta-IN', 'voice_id': 'Kajal'},
        'bn': {'language_code': 'bn-IN', 'voice_id': 'Kajal'},
        'kn': {'language_code': 'kn-IN', 'voice_id': 'Kajal'},
        'ml': {'language_code': 'ml-IN', 'voice_id': 'Kajal'},
        'mr': {'language_code': 'mr-IN', 'voice_id': 'Kajal'},
        'gu': {'language_code': 'gu-IN', 'voice_id': 'Kajal'},
        'pa': {'language_code': 'pa-IN', 'voice_id': 'Kajal'},
    }
    return voice_map.get(language, voice_map['en'])

def generate_text_content(artifact_id, language):
    """Generate text content using Amazon Bedrock"""
    # Implementation here
    pass

def save_content_metadata(artifact_id, language, content_type, text_content, audio_url, tts_provider):
    """Save content metadata to DynamoDB"""
    # Implementation here
    pass
```

### Environment Variables

Add to Lambda function:

```bash
AUDIO_BUCKET=sanaathana-aalaya-audio
CLOUDFRONT_DOMAIN=d1234567890.cloudfront.net
GOOGLE_CLOUD_PROJECT=sanaathana-aalaya-tts
```

### IAM Permissions

Update Lambda execution role:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue"
      ],
      "Resource": "arn:aws:secretsmanager:*:*:secret:sanaathana/google-cloud-tts-credentials-*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject"
      ],
      "Resource": "arn:aws:s3:::sanaathana-aalaya-audio/*"
    }
  ]
}
```

## Testing

### Test Sanskrit Audio Generation

```python
# test_sanskrit_tts.py

import json
import boto3

lambda_client = boto3.client('lambda')

# Test payload
payload = {
    'artifactId': 'test-hanging-pillar',
    'language': 'sa',
    'contentType': 'audio_guide',
}

# Invoke Lambda
response = lambda_client.invoke(
    FunctionName='content-generator',
    InvocationType='RequestResponse',
    Payload=json.dumps(payload)
)

result = json.loads(response['Payload'].read())
print(json.dumps(result, indent=2))
```

### Expected Output

```json
{
  "statusCode": 200,
  "body": {
    "message": "Content generated successfully",
    "artifactId": "test-hanging-pillar",
    "language": "sa",
    "audioUrl": "https://d1234567890.cloudfront.net/audio/sa/test-hanging-pillar.mp3",
    "ttsProvider": "google"
  }
}
```

## Cost Monitoring

### CloudWatch Metrics

Create custom metrics to track TTS usage:

```python
import boto3

cloudwatch = boto3.client('cloudwatch')

def log_tts_usage(provider, language, character_count):
    """Log TTS usage to CloudWatch"""
    cloudwatch.put_metric_data(
        Namespace='SanaathanaAalaya/TTS',
        MetricData=[
            {
                'MetricName': 'CharacterCount',
                'Value': character_count,
                'Unit': 'Count',
                'Dimensions': [
                    {'Name': 'Provider', 'Value': provider},
                    {'Name': 'Language', 'Value': language},
                ]
            }
        ]
    )
```

### Cost Dashboard

Monitor costs in CloudWatch:
- Google TTS character usage
- AWS Polly character usage
- S3 storage costs
- CloudFront bandwidth

## Deployment Checklist

- [ ] Create Google Cloud project
- [ ] Enable Text-to-Speech API
- [ ] Create service account and download key
- [ ] Store credentials in AWS Secrets Manager
- [ ] Create Lambda layer with Google Cloud SDK
- [ ] Update Lambda function code
- [ ] Add environment variables
- [ ] Update IAM permissions
- [ ] Test Sanskrit audio generation
- [ ] Monitor costs in first month
- [ ] Update mobile app to remove "(Text only)" note

## Rollback Plan

If issues occur:

1. Revert Lambda function to previous version
2. Disable Sanskrit in language selection
3. Show "Coming soon" message for Sanskrit
4. Investigate and fix issues
5. Re-deploy when ready

## Maintenance

### Monthly Tasks
- Review Google Cloud TTS usage
- Check if still within free tier
- Monitor audio quality
- Update voice settings if needed

### Quarterly Tasks
- Review cost optimization
- Consider caching strategies
- Evaluate voice quality improvements
- Check for new Sanskrit voices

## Support

- Google Cloud TTS Docs: https://cloud.google.com/text-to-speech/docs
- AWS Secrets Manager: https://docs.aws.amazon.com/secretsmanager/
- Sanskrit Voice Samples: https://cloud.google.com/text-to-speech/docs/voices

## Next Steps

1. Set up Google Cloud project (1 hour)
2. Implement Lambda function (2 hours)
3. Test with sample Sanskrit text (30 mins)
4. Deploy to staging (30 mins)
5. Test in mobile app (1 hour)
6. Deploy to production (30 mins)

Total estimated time: 5.5 hours
