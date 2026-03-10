# AWS Landing Page Deployment Guide
## S3 + CloudFront + Route 53

**Cost**: $1.52/month  
**Time**: 30-45 minutes  
**Difficulty**: Medium

---

## Prerequisites

- AWS Account
- AWS CLI installed and configured
- Domain purchased (sanaathanaaalayacharithra.org)

---

## Step 1: Create S3 Bucket

```powershell
# Create bucket (use your domain name)
aws s3 mb s3://sanaathanaaalayacharithra.org

# Enable static website hosting
aws s3 website s3://sanaathanaaalayacharithra.org `
  --index-document index.html `
  --error-document index.html
```

---

## Step 2: Upload Landing Page Files

```powershell
# Navigate to landing page folder
cd Sanaathana-Aalaya-Charithra/landing-page

# Upload files
aws s3 sync . s3://sanaathanaaalayacharithra.org `
  --acl public-read `
  --exclude ".git/*" `
  --exclude "README.md"
```

---

## Step 3: Create CloudFront Distribution

```powershell
# Create distribution config file
$config = @"
{
  "CallerReference": "landing-page-$(Get-Date -Format 'yyyyMMddHHmmss')",
  "Comment": "Landing page for Sanaathana Aalaya Charithra",
  "Enabled": true,
  "Origins": {
    "Quantity": 1,
    "Items": [
      {
        "Id": "S3-sanaathanaaalayacharithra.org",
        "DomainName": "sanaathanaaalayacharithra.org.s3.amazonaws.com",
        "S3OriginConfig": {
          "OriginAccessIdentity": ""
        }
      }
    ]
  },
  "DefaultRootObject": "index.html",
  "DefaultCacheBehavior": {
    "TargetOriginId": "S3-sanaathanaaalayacharithra.org",
    "ViewerProtocolPolicy": "redirect-to-https",
    "AllowedMethods": {
      "Quantity": 2,
      "Items": ["GET", "HEAD"]
    },
    "ForwardedValues": {
      "QueryString": true,
      "Cookies": {
        "Forward": "none"
      }
    },
    "MinTTL": 0,
    "DefaultTTL": 86400,
    "MaxTTL": 31536000
  },
  "CustomErrorResponses": {
    "Quantity": 1,
    "Items": [
      {
        "ErrorCode": 404,
        "ResponsePagePath": "/index.html",
        "ResponseCode": "200",
        "ErrorCachingMinTTL": 300
      }
    ]
  },
  "PriceClass": "PriceClass_100",
  "ViewerCertificate": {
    "CloudFrontDefaultCertificate": true
  }
}
"@

# Save config
$config | Out-File -FilePath cloudfront-config.json -Encoding utf8

# Create distribution
aws cloudfront create-distribution --distribution-config file://cloudfront-config.json
```

**Note**: Save the distribution ID and domain name from the output.

---

## Step 4: Request SSL Certificate

```powershell
# Request certificate (must be in us-east-1 for CloudFront)
aws acm request-certificate `
  --domain-name sanaathanaaalayacharithra.org `
  --subject-alternative-names www.sanaathanaaalayacharithra.org `
  --validation-method DNS `
  --region us-east-1
```

**Note**: Save the certificate ARN from the output.

---

## Step 5: Validate Certificate

```powershell
# Get validation records
aws acm describe-certificate `
  --certificate-arn YOUR_CERTIFICATE_ARN `
  --region us-east-1
```

Add the CNAME records to your domain's DNS (see Step 7).

---

## Step 6: Create Route 53 Hosted Zone

```powershell
# Create hosted zone
aws route53 create-hosted-zone `
  --name sanaathanaaalayacharithra.org `
  --caller-reference "$(Get-Date -Format 'yyyyMMddHHmmss')"
```

**Note**: Save the hosted zone ID and nameservers.

---

## Step 7: Update Domain Nameservers

Go to your domain registrar (Namecheap, Google Domains, etc.) and update nameservers to the ones from Step 6.

Example:
```
ns-1234.awsdns-12.org
ns-5678.awsdns-34.com
ns-9012.awsdns-56.net
ns-3456.awsdns-78.co.uk
```

**Wait 5-60 minutes** for DNS propagation.

---

## Step 8: Create DNS Records

```powershell
# Create A record for root domain
$aRecord = @"
{
  "Changes": [
    {
      "Action": "CREATE",
      "ResourceRecordSet": {
        "Name": "sanaathanaaalayacharithra.org",
        "Type": "A",
        "AliasTarget": {
          "HostedZoneId": "Z2FDTNDATAQYW2",
          "DNSName": "YOUR_CLOUDFRONT_DOMAIN.cloudfront.net",
          "EvaluateTargetHealth": false
        }
      }
    }
  ]
}
"@

$aRecord | Out-File -FilePath a-record.json -Encoding utf8

aws route53 change-resource-record-sets `
  --hosted-zone-id YOUR_HOSTED_ZONE_ID `
  --change-batch file://a-record.json

# Create CNAME for www
$cnameRecord = @"
{
  "Changes": [
    {
      "Action": "CREATE",
      "ResourceRecordSet": {
        "Name": "www.sanaathanaaalayacharithra.org",
        "Type": "CNAME",
        "TTL": 300,
        "ResourceRecords": [
          {
            "Value": "YOUR_CLOUDFRONT_DOMAIN.cloudfront.net"
          }
        ]
      }
    }
  ]
}
"@

$cnameRecord | Out-File -FilePath cname-record.json -Encoding utf8

aws route53 change-resource-record-sets `
  --hosted-zone-id YOUR_HOSTED_ZONE_ID `
  --change-batch file://cname-record.json
```

---

## Step 9: Update CloudFront with SSL

Once certificate is validated (Step 5), update CloudFront:

```powershell
# Get current distribution config
aws cloudfront get-distribution-config `
  --id YOUR_DISTRIBUTION_ID > dist-config.json

# Edit dist-config.json:
# 1. Update "ViewerCertificate" section:
#    "ACMCertificateArn": "YOUR_CERTIFICATE_ARN",
#    "SSLSupportMethod": "sni-only",
#    "MinimumProtocolVersion": "TLSv1.2_2021"
# 2. Add "Aliases": ["sanaathanaaalayacharithra.org", "www.sanaathanaaalayacharithra.org"]

# Update distribution
aws cloudfront update-distribution `
  --id YOUR_DISTRIBUTION_ID `
  --distribution-config file://dist-config.json `
  --if-match ETAG_FROM_GET_COMMAND
```

---

## Step 10: Test

Wait 15-20 minutes for CloudFront deployment, then test:

```
https://sanaathanaaalayacharithra.org
https://www.sanaathanaaalayacharithra.org
```

---

## Deployment Script (Automated)

Create `deploy-to-aws.ps1`:

```powershell
# Deploy landing page to AWS
param(
    [string]$BucketName = "sanaathanaaalayacharithra.org",
    [string]$DistributionId = "YOUR_DISTRIBUTION_ID"
)

Write-Host "Deploying landing page to AWS..." -ForegroundColor Green

# Upload files to S3
Write-Host "Uploading files to S3..." -ForegroundColor Yellow
aws s3 sync . s3://$BucketName `
    --acl public-read `
    --exclude ".git/*" `
    --exclude "*.ps1" `
    --exclude "*.md" `
    --delete

# Invalidate CloudFront cache
Write-Host "Invalidating CloudFront cache..." -ForegroundColor Yellow
aws cloudfront create-invalidation `
    --distribution-id $DistributionId `
    --paths "/*"

Write-Host "Deployment complete!" -ForegroundColor Green
Write-Host "URL: https://$BucketName" -ForegroundColor Cyan
```

Usage:
```powershell
cd landing-page
.\deploy-to-aws.ps1
```

---

## Cost Breakdown

| Service | Monthly Cost |
|---------|--------------|
| Route 53 Hosted Zone | $0.50 |
| S3 Storage (100MB) | $0.01 |
| S3 Requests (10K) | $0.01 |
| CloudFront (10GB) | $1.00 |
| ACM Certificate | FREE |
| **TOTAL** | **$1.52/month** |

---

## Monitoring

### CloudWatch Metrics

```powershell
# View CloudFront metrics
aws cloudwatch get-metric-statistics `
    --namespace AWS/CloudFront `
    --metric-name Requests `
    --dimensions Name=DistributionId,Value=YOUR_DISTRIBUTION_ID `
    --start-time 2026-03-01T00:00:00Z `
    --end-time 2026-03-08T00:00:00Z `
    --period 86400 `
    --statistics Sum
```

### Set Up Alarms

```powershell
# Create alarm for high error rate
aws cloudwatch put-metric-alarm `
    --alarm-name landing-page-high-errors `
    --alarm-description "Alert when error rate > 5%" `
    --metric-name 4xxErrorRate `
    --namespace AWS/CloudFront `
    --statistic Average `
    --period 300 `
    --evaluation-periods 2 `
    --threshold 5 `
    --comparison-operator GreaterThanThreshold
```

---

## Troubleshooting

### Issue: "Access Denied" errors

**Solution**: Check S3 bucket policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::sanaathanaaalayacharithra.org/*"
    }
  ]
}
```

### Issue: "Certificate not validated"

**Solution**: Check DNS records for ACM validation CNAME.

### Issue: "404 on refresh"

**Solution**: Add custom error response in CloudFront (Step 3).

---

## Maintenance

### Update Content

```powershell
cd landing-page
.\deploy-to-aws.ps1
```

### View Logs

```powershell
# Enable CloudFront logging first
aws cloudfront update-distribution --id YOUR_DISTRIBUTION_ID --logging-config ...

# View logs in S3
aws s3 ls s3://your-logs-bucket/
```

---

## Next Steps

1. ✅ Deploy landing page to AWS
2. ⚠️ Update QR codes to use new domain
3. ⚠️ Configure deep linking in mobile app
4. ⚠️ Set up monitoring and alerts
5. ⚠️ Test QR scan flow end-to-end

---

**Status**: Ready for AWS Deployment  
**Estimated Time**: 30-45 minutes  
**Cost**: $1.52/month
