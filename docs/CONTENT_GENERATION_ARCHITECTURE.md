# Content Generation Architecture

Visual guide to how different content formats are generated and delivered.

**Last Updated**: March 3, 2026  
**Status**: Architecture Documentation

---

## Content Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          CONTENT GENERATION FLOW                        │
└─────────────────────────────────────────────────────────────────────────┘

┌──────────────────┐
│  ADMIN PORTAL    │
│  (Pre-Launch)    │
└────────┬─────────┘
         │
         ├─────────────────────────────────────────────────────────────┐
         │                                                             │
         ▼                                                             ▼
┌─────────────────────┐                                    ┌──────────────────┐
│  TEXT GENERATION    │                                    │ MANUAL UPLOADS   │
│  (AWS Bedrock)      │                                    │ (Photos/Videos)  │
└──────────┬──────────┘                                    └────────┬─────────┘
           │                                                        │
           │ Generate 4 sections:                                  │
           │ • About                                                │
           │ • History                                              │
           │ • Significance                                         │
           │ • Architecture                                         │
           │                                                        │
           ▼                                                        ▼
    ┌─────────────┐                                        ┌─────────────┐
    │  DynamoDB   │                                        │     S3      │
    │  (Text)     │                                        │  (Media)    │
    └──────┬──────┘                                        └──────┬──────┘
           │                                                      │
           └──────────────────────┬───────────────────────────────┘
                                  │
                                  ▼
                        ┌──────────────────┐
                        │   API GATEWAY    │
                        │   (REST API)     │
                        └────────┬─────────┘
                                 │
                                 ▼
                        ┌──────────────────┐
                        │   MOBILE APP     │
                        │   (User Device)  │
                        └──────────────────┘
                                 │
                                 │ User clicks "Play Audio"
                                 │
                                 ▼
                        ┌──────────────────┐
                        │  AUDIO SERVICE   │
                        │  (Google TTS)    │
                        └────────┬─────────┘
                                 │
                                 │ Generate & Cache
                                 │
                                 ▼
                        ┌──────────────────┐
                        │   S3 (Audio)     │
                        │   Cached         │
                        └──────────────────┘
```

---

## Content Type Details

### 1. TEXT Content (Pre-Generated)

```
┌─────────────────────────────────────────────────────────────┐
│                    TEXT GENERATION FLOW                     │
└─────────────────────────────────────────────────────────────┘

Admin Portal
    │
    ├─ Select Temple
    │
    ├─ Choose Model (Haiku/Sonnet)
    │
    ├─ Click "Generate Content"
    │
    ▼
AWS Bedrock API
    │
    ├─ Process temple data
    │
    ├─ Generate 4 sections:
    │   • About (150-200 words)
    │   • History (250-300 words)
    │   • Significance (200-250 words)
    │   • Architecture (250-300 words)
    │
    ▼
DynamoDB
    │
    ├─ Store as JSON:
    │   {
    │     "templeId": "temple_001",
    │     "content": {
    │       "about": "...",
    │       "history": "...",
    │       "significance": "...",
    │       "architecture": "..."
    │     }
    │   }
    │
    ▼
Available to ALL users immediately

Cost: $0.0092 per temple (one-time)
Time: ~5 seconds per temple
Storage: ~2KB per temple
```

---

### 2. AUDIO Content (On-Demand)

```
┌─────────────────────────────────────────────────────────────┐
│                    AUDIO GENERATION FLOW                    │
└─────────────────────────────────────────────────────────────┘

User clicks "Play Audio" button
    │
    ▼
Check S3 Cache
    │
    ├─ Audio exists? ──YES──> Stream from S3 (FREE)
    │                          │
    │                          ▼
    │                     User hears audio
    │
    └─ Audio missing? ──NO──> Generate with Google TTS
                               │
                               ├─ Convert text to speech
                               │
                               ├─ Save to S3 (cache)
                               │
                               ├─ Stream to user
                               │
                               ▼
                          Next user gets cached version (FREE)

Cost: $0.000016 first time, FREE after caching
Time: ~2 seconds first time, instant after caching
Storage: ~500KB per audio file
```

---

### 3. PHOTOS (Manual Upload)

```
┌─────────────────────────────────────────────────────────────┐
│                    PHOTO UPLOAD FLOW                        │
└─────────────────────────────────────────────────────────────┘

Admin Portal
    │
    ├─ Select Temple
    │
    ├─ Click "Upload Photos"
    │
    ├─ Drag & drop images
    │
    ▼
Image Processing
    │
    ├─ Resize to multiple sizes:
    │   • Thumbnail (200x200)
    │   • Medium (800x600)
    │   • Large (1920x1080)
    │
    ├─ Compress (optimize file size)
    │
    ▼
S3 Bucket
    │
    ├─ Store in folder:
    │   /temples/temple_001/photos/
    │     ├─ photo1_thumb.jpg
    │     ├─ photo1_medium.jpg
    │     ├─ photo1_large.jpg
    │
    ▼
Available to users immediately

Cost: Storage only (~$0.001 per temple)
Time: Instant upload
Storage: ~2MB per photo (3 sizes)
```

---

### 4. VIDEOS (Manual Upload or YouTube)

```
┌─────────────────────────────────────────────────────────────┐
│                    VIDEO INTEGRATION FLOW                   │
└─────────────────────────────────────────────────────────────┘

OPTION A: YouTube Embed (RECOMMENDED)
───────────────────────────────────────
Admin Portal
    │
    ├─ Select Temple
    │
    ├─ Add YouTube URL
    │
    ▼
DynamoDB
    │
    ├─ Store URL:
    │   {
    │     "videoUrl": "https://youtube.com/watch?v=..."
    │   }
    │
    ▼
Mobile App
    │
    ├─ Embed YouTube player
    │
    ▼
User watches video

Cost: FREE
Storage: 0 bytes (external link)


OPTION B: S3 Upload (NOT RECOMMENDED - EXPENSIVE)
───────────────────────────────────────────────────
Admin Portal
    │
    ├─ Upload video file
    │
    ▼
S3 Bucket
    │
    ├─ Store video:
    │   /temples/temple_001/videos/video1.mp4
    │
    ▼
CloudFront CDN
    │
    ├─ Stream to users
    │
    ▼
User watches video

Cost: $0.23/month per temple (EXPENSIVE!)
Storage: ~100-500MB per video
```

---

## Data Storage Structure

### DynamoDB Schema (Text Content)

```json
{
  "PK": "TEMPLE#temple_001",
  "SK": "CONTENT",
  "templeId": "temple_001",
  "templeName": "Brihadeeswarar Temple",
  "location": "Thanjavur, Tamil Nadu",
  "content": {
    "about": "The Brihadeeswarar Temple, also known as...",
    "history": "Built in 1010 CE by Raja Raja Chola I...",
    "significance": "This UNESCO World Heritage Site...",
    "architecture": "The temple showcases Dravidian style..."
  },
  "metadata": {
    "generatedBy": "bedrock",
    "model": "claude-3-sonnet",
    "generatedAt": "2026-03-03T10:30:00Z",
    "cost": 0.0092,
    "tokensUsed": 1234
  },
  "audioEnabled": true,
  "photosCount": 5,
  "videosCount": 1
}
```

### S3 Bucket Structure

```
temple-content-bucket/
├── audio/
│   ├── temple_001/
│   │   ├── about_en.mp3
│   │   ├── about_hi.mp3
│   │   ├── about_ta.mp3
│   │   ├── history_en.mp3
│   │   └── ...
│   └── temple_002/
│       └── ...
├── photos/
│   ├── temple_001/
│   │   ├── photo1_thumb.jpg
│   │   ├── photo1_medium.jpg
│   │   ├── photo1_large.jpg
│   │   ├── photo2_thumb.jpg
│   │   └── ...
│   └── temple_002/
│       └── ...
└── videos/ (if using S3)
    ├── temple_001/
    │   └── video1.mp4
    └── temple_002/
        └── ...
```

---

## API Endpoints

### Get Temple Content (Text)

```
GET /api/temples/{templeId}

Response:
{
  "templeId": "temple_001",
  "templeName": "Brihadeeswarar Temple",
  "content": {
    "about": "...",
    "history": "...",
    "significance": "...",
    "architecture": "..."
  },
  "audioAvailable": true,
  "photosCount": 5,
  "videosCount": 1
}

Cost per request: $0.000004
Source: DynamoDB (cached)
```

### Get Audio (On-Demand)

```
GET /api/temples/{templeId}/audio?section=about&language=en

Flow:
1. Check S3: /audio/temple_001/about_en.mp3
2. If exists → Return S3 URL (FREE)
3. If not exists:
   a. Get text from DynamoDB
   b. Generate audio with Google TTS
   c. Save to S3
   d. Return S3 URL

Cost: $0.000016 first time, FREE after caching
```

### Get Photos

```
GET /api/temples/{templeId}/photos

Response:
{
  "photos": [
    {
      "id": "photo1",
      "thumbnail": "https://s3.../photo1_thumb.jpg",
      "medium": "https://s3.../photo1_medium.jpg",
      "large": "https://s3.../photo1_large.jpg"
    }
  ]
}

Cost per request: $0.00001
Source: S3 (direct links)
```

---

## Cost Analysis by Format

### For 1,000 Temples with 10,000 Users/Month

```
┌─────────────────────────────────────────────────────────────┐
│                    COST BREAKDOWN                           │
└─────────────────────────────────────────────────────────────┘

TEXT CONTENT:
─────────────
Generation:  $9.20 (one-time)
Storage:     $0.01/month (DynamoDB)
Delivery:    $0.04/month (API Gateway + Lambda)
Total:       $9.20 one-time + $0.05/month


AUDIO CONTENT:
──────────────
Generation:  $0.14 (one-time, first user per language)
Storage:     $0.20/month (S3)
Delivery:    $0.30/month (CloudFront)
Total:       $0.14 one-time + $0.50/month


PHOTOS (2-3 per temple):
────────────────────────
Generation:  $0 (manual upload)
Storage:     $1.00/month (S3)
Delivery:    $0.10/month (CloudFront)
Total:       $0 one-time + $1.10/month


VIDEOS (YouTube embeds):
────────────────────────
Generation:  $0 (external)
Storage:     $0 (external)
Delivery:    $0 (external)
Total:       FREE


VIDEOS (S3 storage):
────────────────────
Generation:  $0 (manual upload)
Storage:     $230/month (S3)
Delivery:    $100/month (CloudFront)
Total:       $0 one-time + $330/month (EXPENSIVE!)


TOTAL RECOMMENDED (Text + Audio + Photos + YouTube):
────────────────────────────────────────────────────
One-time:    $9.34
Monthly:     $1.65
```

---

## Performance Metrics

### Response Times

```
Content Type    | First Request | Cached Request | Size
----------------|---------------|----------------|--------
Text            | 50ms          | 10ms           | 2KB
Audio           | 2000ms        | 100ms          | 500KB
Photo (thumb)   | 200ms         | 50ms           | 50KB
Photo (medium)  | 500ms         | 100ms          | 200KB
Photo (large)   | 1000ms        | 200ms          | 1MB
Video (YouTube) | 1000ms        | 500ms          | Streaming
Video (S3)      | 3000ms        | 1000ms         | 100MB+
```

---

## Scalability

### How System Scales with Users

```
Users/Month     | Text Cost | Audio Cost | Photo Cost | Total/Month
----------------|-----------|------------|------------|-------------
1,000           | $0.01     | $0.05      | $0.11      | $0.17
10,000          | $0.05     | $0.50      | $1.10      | $1.65
100,000         | $0.40     | $5.00      | $11.00     | $16.40
1,000,000       | $4.00     | $50.00     | $110.00    | $164.00

Note: Costs scale linearly with users
      Text is cheapest to scale
      Audio benefits from caching
      Photos have moderate cost
```

---

## Decision Matrix

### Choose Your Configuration

```
┌─────────────────────────────────────────────────────────────┐
│                    CONFIGURATION MATRIX                     │
└─────────────────────────────────────────────────────────────┘

Budget      | Users/Month | Recommended Config
------------|-------------|------------------------------------
< $10/month | < 1,000     | Text only
$10-$20     | 1,000-10K   | Text + Audio
$20-$50     | 10K-50K     | Text + Audio + Photos
$50-$100    | 50K-100K    | Text + Audio + Photos + YouTube
$100+       | 100K+       | Everything (including S3 videos)


Timeline    | Team Size   | Recommended Config
------------|-------------|------------------------------------
< 1 week    | Solo        | Text only (auto-generated)
1-2 weeks   | 1-2 people  | Text + Audio (mostly auto)
1 month     | 2-5 people  | Text + Audio + Photos
3+ months   | 5+ people   | Everything


User Needs  | Priority    | Recommended Config
------------|-------------|------------------------------------
Basic info  | Low         | Text only
Good UX     | Medium      | Text + Audio
Rich media  | High        | Text + Audio + Photos
Premium     | Very High   | Everything
```

---

## Summary

**Pre-Generated Content**:
- ✅ TEXT (AWS Bedrock) - $9.20 one-time

**On-Demand Content**:
- ✅ AUDIO (Google TTS) - $0.14 one-time + $0.50/month

**Manual Content**:
- ✅ PHOTOS (Admin uploads) - $1.10/month
- ✅ VIDEOS (YouTube embeds) - FREE
- ❌ VIDEOS (S3 storage) - $330/month (NOT RECOMMENDED)
- ❌ INFOGRAPHICS (Admin creates) - $0.60/month (OPTIONAL)

**Recommended for Launch**:
- Text + Audio + Photos + YouTube = $9.34 one-time + $1.65/month

---

**Last Updated**: March 3, 2026  
**Status**: Architecture Documentation  
**Recommended**: Text + Audio + Photos + YouTube embeds

