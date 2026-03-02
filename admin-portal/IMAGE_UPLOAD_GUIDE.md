# Temple Image Upload Guide

## Overview

The temple form now supports TWO ways to add images:

1. **Upload from Computer** - For temples without websites or online images
2. **Enter Image URL** - For temples with existing online images

## Current Implementation

### Features Added

✅ **File Upload Button**
- Click "Upload Image" to select from computer
- Supports all image formats (JPG, PNG, GIF, etc.)
- Maximum file size: 5MB
- Instant preview after selection

✅ **URL Input**
- Enter image URL from any website
- Useful for temples with existing online presence
- Preview shows before saving

✅ **Image Preview**
- See the image before saving
- Remove and change image easily
- Shows file name for uploaded files

✅ **Validation**
- File type validation (images only)
- File size validation (max 5MB)
- Error messages for invalid files

## How to Use

### Option 1: Upload from Computer

**Best for:** Temples without websites, photos you took yourself

1. Click "Upload Image" button
2. Select image from your computer
3. Preview appears automatically
4. Click "Create Temple" to save

**Supported formats:** JPG, JPEG, PNG, GIF, WebP, SVG

### Option 2: Enter Image URL

**Best for:** Temples with existing online images

1. Find temple image online
2. Right-click image → "Copy image address"
3. Paste URL in the input field
4. Preview appears automatically
5. Click "Create Temple" to save

## For Production: AWS S3 Integration

Currently, uploaded images are stored temporarily. To make them permanent, you need to integrate AWS S3.

### Step 1: Create S3 Bucket

```bash
# Using AWS CLI
aws s3 mb s3://sanaathana-temple-images --region ap-south-1

# Set bucket policy for public read access
aws s3api put-bucket-policy --bucket sanaathana-temple-images --policy file://bucket-policy.json
```

**bucket-policy.json:**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::sanaathana-temple-images/*"
    }
  ]
}
```

### Step 2: Install AWS SDK

```bash
cd admin-portal
npm install @aws-sdk/client-s3
```

### Step 3: Create Upload Utility

**File:** `admin-portal/src/utils/s3Upload.ts`

```typescript
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const s3Client = new S3Client({
  region: 'ap-south-1',
  credentials: {
    accessKeyId: import.meta.env.VITE_AWS_ACCESS_KEY_ID,
    secretAccessKey: import.meta.env.VITE_AWS_SECRET_ACCESS_KEY,
  },
});

export async function uploadImageToS3(
  file: File,
  templeId: string
): Promise<string> {
  // Generate unique filename
  const timestamp = Date.now();
  const extension = file.name.split('.').pop();
  const filename = `temples/${templeId}/${timestamp}.${extension}`;

  // Upload to S3
  const command = new PutObjectCommand({
    Bucket: 'sanaathana-temple-images',
    Key: filename,
    Body: file,
    ContentType: file.type,
    ACL: 'public-read',
  });

  await s3Client.send(command);

  // Return public URL
  return `https://sanaathana-temple-images.s3.ap-south-1.amazonaws.com/${filename}`;
}
```

### Step 4: Update Environment Variables

**File:** `admin-portal/.env.development`

```env
VITE_AWS_ACCESS_KEY_ID=your_access_key_here
VITE_AWS_SECRET_ACCESS_KEY=your_secret_key_here
VITE_AWS_REGION=ap-south-1
VITE_S3_BUCKET=sanaathana-temple-images
```

### Step 5: Update TempleFormPage

Replace the TODO comment in `handleSubmit`:

```typescript
import { uploadImageToS3 } from '../utils/s3Upload';

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);
  setError('');

  try {
    // Upload image to S3 if file is selected
    if (imageFile) {
      const templeId = id || `temple-${Date.now()}`;
      const s3Url = await uploadImageToS3(imageFile, templeId);
      formData.imageUrl = s3Url;
    }

    // Save temple data to backend
    if (isEditMode) {
      await templeApi.updateTemple(id!, formData);
    } else {
      await templeApi.createTemple(formData);
    }

    navigate('/temples');
  } catch (err) {
    setError('Failed to save temple. Please try again.');
    console.error(err);
  } finally {
    setLoading(false);
  }
};
```

## Alternative: Use Presigned URLs (More Secure)

Instead of using AWS credentials in the frontend, use presigned URLs:

### Backend API Endpoint

**File:** `src/local-server/server.ts`

```typescript
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Add endpoint to get presigned URL
app.post('/api/temples/upload-url', async (req, res) => {
  const { filename, contentType } = req.body;
  
  const command = new PutObjectCommand({
    Bucket: 'sanaathana-temple-images',
    Key: `temples/${Date.now()}-${filename}`,
    ContentType: contentType,
  });

  const presignedUrl = await getSignedUrl(s3Client, command, {
    expiresIn: 3600, // 1 hour
  });

  res.json({ 
    uploadUrl: presignedUrl,
    publicUrl: `https://sanaathana-temple-images.s3.ap-south-1.amazonaws.com/temples/${Date.now()}-${filename}`
  });
});
```

### Frontend Upload

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);

  try {
    if (imageFile) {
      // Get presigned URL from backend
      const { uploadUrl, publicUrl } = await fetch('/api/temples/upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: imageFile.name,
          contentType: imageFile.type,
        }),
      }).then(r => r.json());

      // Upload directly to S3 using presigned URL
      await fetch(uploadUrl, {
        method: 'PUT',
        body: imageFile,
        headers: { 'Content-Type': imageFile.type },
      });

      formData.imageUrl = publicUrl;
    }

    // Save temple data
    await templeApi.createTemple(formData);
    navigate('/temples');
  } catch (err) {
    setError('Failed to upload image');
  } finally {
    setLoading(false);
  }
};
```

## Cost Estimation

### AWS S3 Costs (Mumbai Region)

**Storage:**
- First 50 TB: $0.023 per GB/month
- 1000 temples × 500KB average = 500MB = $0.01/month

**Data Transfer:**
- First 10 TB out: $0.109 per GB
- 10,000 views × 500KB = 5GB = $0.55/month

**Requests:**
- PUT requests: $0.005 per 1000 requests
- GET requests: $0.0004 per 1000 requests
- 1000 uploads + 10,000 views = $0.01/month

**Total Monthly Cost:** ~$0.60/month for 1000 temples

**Yearly Cost:** ~$7/year

Very affordable! 💰

## Best Practices

### Image Optimization

Before uploading, consider:

1. **Resize images** - Max 1920×1080 for temples
2. **Compress images** - Use tools like TinyPNG
3. **Use WebP format** - Smaller file size, better quality
4. **Lazy loading** - Load images only when needed

### Security

1. **Validate file types** - Only allow images
2. **Limit file size** - Max 5MB per image
3. **Scan for malware** - Use AWS Lambda + ClamAV
4. **Use presigned URLs** - Don't expose AWS credentials

### Performance

1. **Use CloudFront CDN** - Faster image delivery
2. **Generate thumbnails** - Create smaller versions
3. **Cache images** - Browser and CDN caching
4. **Optimize formats** - Serve WebP to supported browsers

## Troubleshooting

### Issue: "Failed to upload image"

**Possible causes:**
- File too large (>5MB)
- Invalid file type
- Network error
- S3 bucket permissions

**Solution:**
1. Check file size and type
2. Verify S3 bucket policy
3. Check AWS credentials
4. Check browser console for errors

### Issue: "Image not displaying"

**Possible causes:**
- Invalid URL
- S3 bucket not public
- CORS issues

**Solution:**
1. Verify image URL is accessible
2. Check S3 bucket policy
3. Add CORS configuration to S3 bucket

### Issue: "Upload is slow"

**Possible causes:**
- Large file size
- Slow internet connection
- No image optimization

**Solution:**
1. Compress images before upload
2. Use image optimization tools
3. Consider using CloudFront CDN

## Summary

✅ **Current Status:**
- Image upload UI is ready
- File validation works
- Preview functionality works
- URL input works

⏳ **To Complete:**
- Set up AWS S3 bucket
- Implement S3 upload function
- Add to backend API
- Test end-to-end

📝 **For Hackathon Demo:**
- Current implementation works with mock data
- Shows upload UI and preview
- Can demonstrate the flow
- Actual S3 integration can be done post-hackathon

---

**Created:** 2026-02-28  
**Feature:** Image Upload for Temples  
**Status:** UI Complete, S3 Integration Pending
