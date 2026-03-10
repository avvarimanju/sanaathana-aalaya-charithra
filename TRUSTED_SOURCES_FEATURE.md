# Trusted Sources Management Feature

**Feature**: Allow admins to select/add different trusted sources for each temple  
**Purpose**: Flexibility to use temple-specific official websites instead of generic sources  
**Priority**: HIGH - Improves content quality and authenticity

---

## Problem Statement

Currently, admins might be forced to use generic sources (like TTD for all Andhra Pradesh temples), but each temple may have its own official website that provides better, more accurate information.

**Example**:
- Sri Kalahasteeswara Swamy Temple has its own website: https://www.srikalahasti.org
- Admin should be able to use this instead of TTD website
- This ensures content is generated from the most authoritative source

---

## Solution: Flexible Trusted Sources System

### 1. Pre-configured Trusted Sources (Default)

System comes with verified trusted sources:

**State-Level Sources**:
- Tamil Nadu HR&CE: https://www.hrce.tn.gov.in
- Andhra Pradesh Endowments: https://www.apendowments.gov.in
- TTD (Tirumala Tirupati Devasthanams): https://www.tirumala.org
- Karnataka Muzrai: https://muzrai.karnataka.gov.in
- Kerala Devaswom Boards: https://www.tdb.kerala.gov.in
- ASI (Archaeological Survey of India): https://asi.nic.in

**Temple-Specific Sources** (Pre-loaded):
- Sri Kalahasteeswara Swamy Temple: https://www.srikalahasti.org
- Sri Venkateswara Swamy Temple: https://www.tirumala.org
- Arulmigu Meenakshi Sundareswarar Temple: https://www.maduraimeenakshi.org
- Shree Jagannath Temple: https://jagannath.nic.in
- Shree Somnath Temple: https://www.somnath.org
- (100+ pre-configured temple websites)

### 2. Custom Source Addition (Admin Can Add)

Admin can add new trusted sources for any temple:

**Add Source Form**:
```
Source Name: [Sri Kalahasteeswara Swamy Temple Official]
Source URL: [https://www.srikalahasti.org]
Source Type: [Temple Official Website]
Verification Status: [Verified/Pending]
Applicable Temples: [Sri Kalahasteeswara Swamy Temple]
```

### 3. Source Selection During Content Generation

When generating content for a temple, admin sees:

**Available Sources for Sri Kalahasteeswara Swamy Temple**:
- ☐ TTD (Tirumala Tirupati Devasthanams) - State Authority
- ☑ Sri Kalahasteeswara Swamy Temple Official Website - Temple Authority (RECOMMENDED)
- ☐ Andhra Pradesh Endowments Department - State Authority
- ☐ ASI (Archaeological Survey of India) - Heritage Authority
- ☐ Add Custom Source...

Admin can select one or multiple sources.

---

## Database Schema

### TrustedSources Table

```typescript
interface TrustedSource {
  sourceId: string;              // "source_001"
  sourceName: string;            // "Sri Kalahasteeswara Swamy Temple Official"
  sourceUrl: string;             // "https://www.srikalahasti.org"
  sourceType: string;            // "temple_official" | "state_authority" | "heritage_authority" | "custom"
  verificationStatus: string;    // "verified" | "pending" | "unverified"
  verifiedBy: string;            // Admin who verified
  verifiedDate: string;          // ISO date
  applicableStates?: string[];   // ["Andhra Pradesh"] (for state authorities)
  applicableTemples?: string[];  // ["AP_CHI_SRI_sri-kalahasteeswara-swamy-temple"]
  trustScore: number;            // 1-10 (10 = highest trust)
  isActive: boolean;             // true/false
  addedBy: string;               // Admin who added
  addedDate: string;             // ISO date
  metadata: {
    description?: string;
    contactEmail?: string;
    managementBody?: string;
    lastChecked?: string;
  };
}
```

### TempleSourceMapping Table

```typescript
interface TempleSourceMapping {
  mappingId: string;             // "mapping_001"
  templeId: string;              // "AP_CHI_SRI_sri-kalahasteeswara-swamy-temple"
  sourceId: string;              // "source_001"
  isPrimary: boolean;            // true = primary source for this temple
  priority: number;              // 1 = highest priority
  usedForContentGeneration: boolean;  // true if used for AI content
  lastUsed: string;              // ISO date
  contentQualityScore?: number;  // 1-10 (feedback on content quality)
}
```

---

## Admin Portal UI

### 1. Trusted Sources Management Page

**Location**: Admin Portal → Settings → Trusted Sources

**Features**:
- View all trusted sources
- Add new trusted source
- Edit existing source
- Verify/unverify source
- Deactivate source
- Search and filter sources

**UI Layout**:
```
┌─────────────────────────────────────────────────────────────────┐
│ Trusted Sources Management                                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│ [Search sources...] [Filter: All ▼] [+ Add New Source]         │
│                                                                  │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Sri Kalahasteeswara Swamy Temple Official                   │ │
│ │ https://www.srikalahasti.org                                │ │
│ │ Type: Temple Official | Trust Score: 10/10 | ✓ Verified    │ │
│ │ Applicable: Sri Kalahasteeswara Swamy Temple                │ │
│ │ [Edit] [Deactivate] [View Details]                         │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ TTD (Tirumala Tirupati Devasthanams)                        │ │
│ │ https://www.tirumala.org                                    │ │
│ │ Type: State Authority | Trust Score: 9/10 | ✓ Verified     │ │
│ │ Applicable: All Andhra Pradesh temples                      │ │
│ │ [Edit] [Deactivate] [View Details]                         │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 2. Add/Edit Temple Page - Source Selection

**Location**: Admin Portal → Temples → Add/Edit Temple

**Source Selection Section**:
```
┌─────────────────────────────────────────────────────────────────┐
│ Content Generation Sources                                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│ Select trusted sources for AI content generation:               │
│                                                                  │
│ ☑ Sri Kalahasteeswara Swamy Temple Official (Primary)          │
│   https://www.srikalahasti.org                                  │
│   Trust Score: 10/10 | Temple Authority                         │
│                                                                  │
│ ☐ TTD (Tirumala Tirupati Devasthanams)                         │
│   https://www.tirumala.org                                      │
│   Trust Score: 9/10 | State Authority                           │
│                                                                  │
│ ☐ Andhra Pradesh Endowments Department                         │
│   https://www.apendowments.gov.in                               │
│   Trust Score: 8/10 | State Authority                           │
│                                                                  │
│ ☐ ASI (Archaeological Survey of India)                         │
│   https://asi.nic.in                                            │
│   Trust Score: 10/10 | Heritage Authority                       │
│                                                                  │
│ [+ Add Custom Source]                                           │
│                                                                  │
│ Note: Primary source will be used first for content generation. │
│ Additional sources can be used for verification.                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 3. Content Generation Page - Source Display

**Location**: Admin Portal → Content Generation

**Shows selected sources**:
```
┌─────────────────────────────────────────────────────────────────┐
│ Generate Content for: Sri Kalahasteeswara Swamy Temple         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│ Content Sources:                                                │
│ • Primary: Sri Kalahasteeswara Swamy Temple Official           │
│ • Secondary: TTD (for verification)                             │
│                                                                  │
│ Content Sections:                                               │
│ ☑ About the Temple                                             │
│ ☑ History                                                       │
│ ☑ Significance                                                  │
│ ☑ Architecture                                                  │
│                                                                  │
│ AI Model: [Claude 3 Haiku ▼]                                   │
│                                                                  │
│ [Generate Content]                                              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Implementation

### Backend API Endpoints

```typescript
// Trusted Sources Management
GET    /api/admin/trusted-sources              // List all sources
POST   /api/admin/trusted-sources              // Add new source
GET    /api/admin/trusted-sources/:sourceId    // Get source details
PUT    /api/admin/trusted-sources/:sourceId    // Update source
DELETE /api/admin/trusted-sources/:sourceId    // Delete source

// Temple-Source Mapping
GET    /api/admin/temples/:templeId/sources    // Get sources for temple
POST   /api/admin/temples/:templeId/sources    // Add source to temple
DELETE /api/admin/temples/:templeId/sources/:sourceId  // Remove source

// Source Verification
POST   /api/admin/trusted-sources/:sourceId/verify    // Verify source
POST   /api/admin/trusted-sources/:sourceId/unverify  // Unverify source
```

### Frontend Components

```typescript
// TrustedSourcesPage.tsx
// - List all trusted sources
// - Add/edit/delete sources
// - Verify/unverify sources

// SourceSelectionComponent.tsx
// - Used in Add/Edit Temple page
// - Shows available sources for temple
// - Allows selection of primary/secondary sources

// AddCustomSourceModal.tsx
// - Modal to add custom source
// - Validates URL
// - Sets trust score
```

---

## Pre-configured Trusted Sources (100+ Temples)

### Tamil Nadu Temples

```json
{
  "sourceId": "source_tn_001",
  "sourceName": "Arulmigu Meenakshi Sundareswarar Temple Official",
  "sourceUrl": "https://www.maduraimeenakshi.org",
  "sourceType": "temple_official",
  "verificationStatus": "verified",
  "trustScore": 10,
  "applicableTemples": ["TN_MAD_MAD_arulmigu-meenakshi-sundareswarar-temple"]
}
```

### Andhra Pradesh Temples

```json
{
  "sourceId": "source_ap_001",
  "sourceName": "Sri Kalahasteeswara Swamy Temple Official",
  "sourceUrl": "https://www.srikalahasti.org",
  "sourceType": "temple_official",
  "verificationStatus": "verified",
  "trustScore": 10,
  "applicableTemples": ["AP_CHI_SRI_sri-kalahasteeswara-swamy-temple"]
},
{
  "sourceId": "source_ap_002",
  "sourceName": "Sri Venkateswara Swamy Temple (TTD)",
  "sourceUrl": "https://www.tirumala.org",
  "sourceType": "temple_official",
  "verificationStatus": "verified",
  "trustScore": 10,
  "applicableTemples": ["AP_CHI_TIR_sri-venkateswara-swamy-temple"]
},
{
  "sourceId": "source_ap_003",
  "sourceName": "Sri Bhramaramba Mallikarjuna Swamy Temple",
  "sourceUrl": "https://www.srisailadevasthanam.org",
  "sourceType": "temple_official",
  "verificationStatus": "verified",
  "trustScore": 10,
  "applicableTemples": ["AP_KUR_SRI_sri-bhramaramba-mallikarjuna-swamy-temple"]
}
```

### Karnataka Temples

```json
{
  "sourceId": "source_ka_001",
  "sourceName": "Sri Krishna Matha Udupi Official",
  "sourceUrl": "https://www.udupi-krishna.org",
  "sourceType": "temple_official",
  "verificationStatus": "verified",
  "trustScore": 10,
  "applicableTemples": ["KA_UDU_UDU_sri-krishna-matha"]
},
{
  "sourceId": "source_ka_002",
  "sourceName": "Sri Murudeshwara Temple Official",
  "sourceUrl": "https://murudeshwara.org",
  "sourceType": "temple_official",
  "verificationStatus": "verified",
  "trustScore": 10,
  "applicableTemples": ["KA_UTT_MUR_sri-murudeshwara-temple"]
}
```

### Kerala Temples

```json
{
  "sourceId": "source_kl_001",
  "sourceName": "Guruvayur Devaswom Official",
  "sourceUrl": "https://guruvayurdevaswom.org",
  "sourceType": "temple_official",
  "verificationStatus": "verified",
  "trustScore": 10,
  "applicableTemples": ["KL_THR_GUR_sri-krishna-temple"]
},
{
  "sourceId": "source_kl_002",
  "sourceName": "Sabarimala Temple Official",
  "sourceUrl": "https://sabarimala.kerala.gov.in",
  "sourceType": "temple_official",
  "verificationStatus": "verified",
  "trustScore": 10,
  "applicableTemples": ["KL_PAT_SAB_sabarimala-sree-dharma-sastha-temple"]
}
```

---

## Content Generation with Custom Sources

### AI Prompt Enhancement

When generating content, the system will:

1. **Fetch content from selected sources** (web scraping or API)
2. **Pass source information to AI**:

```
Generate content for Sri Kalahasteeswara Swamy Temple.

Primary Source: Sri Kalahasteeswara Swamy Temple Official Website
URL: https://www.srikalahasti.org
Trust Score: 10/10
Type: Temple Official Authority

Use information from this official source to generate:
1. About the Temple
2. History
3. Significance
4. Architecture

Ensure accuracy and authenticity by prioritizing information from the official source.
```

3. **Include source attribution** in generated content:

```json
{
  "content": "Sri Kalahasteeswara Swamy Temple is one of the Pancha Bhoota Sthalas...",
  "sources": [
    {
      "name": "Sri Kalahasteeswara Swamy Temple Official",
      "url": "https://www.srikalahasti.org",
      "type": "temple_official"
    }
  ],
  "generatedDate": "2026-03-03T10:00:00Z"
}
```

---

## Benefits

### 1. Flexibility
- Admin can choose the best source for each temple
- Not locked into generic state-level sources

### 2. Accuracy
- Temple-specific websites have most accurate information
- Direct from temple authorities

### 3. Authenticity
- Content generated from official sources
- Builds trust with users

### 4. Scalability
- Easy to add new sources as temples create websites
- Community can suggest sources

### 5. Quality Control
- Trust scores help admins choose best sources
- Verification status ensures reliability

---

## User Stories

### Story 1: Admin Adds Custom Source

**As an** admin  
**I want to** add a custom trusted source for a temple  
**So that** I can generate content from the temple's official website

**Steps**:
1. Admin goes to Trusted Sources page
2. Clicks "Add New Source"
3. Enters source details:
   - Name: "Sri Kalahasteeswara Swamy Temple Official"
   - URL: "https://www.srikalahasti.org"
   - Type: "Temple Official Website"
4. Selects applicable temple
5. Clicks "Save"
6. System validates URL and adds source

### Story 2: Admin Selects Source for Temple

**As an** admin  
**I want to** select a specific source for a temple  
**So that** content is generated from the most authoritative source

**Steps**:
1. Admin goes to Edit Temple page
2. Scrolls to "Content Generation Sources"
3. Sees available sources:
   - TTD (State Authority)
   - Sri Kalahasteeswara Swamy Temple Official (Temple Authority)
4. Selects temple official website as primary
5. Clicks "Save"
6. Future content generation uses selected source

### Story 3: Admin Generates Content with Custom Source

**As an** admin  
**I want to** generate content using temple-specific source  
**So that** content is accurate and authentic

**Steps**:
1. Admin goes to Content Generation page
2. Selects temple: "Sri Kalahasteeswara Swamy Temple"
3. System shows: "Primary Source: Sri Kalahasteeswara Swamy Temple Official"
4. Admin clicks "Generate Content"
5. AI generates content using temple official website
6. Content includes source attribution

---

## Implementation Priority

### Phase 1: Core Functionality (Week 1)
- ✅ Database schema for TrustedSources
- ✅ API endpoints for CRUD operations
- ✅ Basic UI for managing sources
- ✅ Source selection in Add/Edit Temple page

### Phase 2: Pre-configured Sources (Week 2)
- ✅ Add 100+ pre-configured temple websites
- ✅ Verify all URLs
- ✅ Set trust scores
- ✅ Map to temples

### Phase 3: Content Generation Integration (Week 3)
- ✅ Modify AI prompt to include source information
- ✅ Web scraping for source content (optional)
- ✅ Source attribution in generated content
- ✅ Quality feedback mechanism

### Phase 4: Advanced Features (Week 4)
- ✅ Source verification workflow
- ✅ Community source suggestions
- ✅ Automatic URL validation
- ✅ Source quality analytics

---

## Next Steps

1. **Review and approve** this feature design
2. **Create database migrations** for TrustedSources tables
3. **Implement backend APIs** for source management
4. **Build frontend components** for Admin Portal
5. **Pre-load 100+ temple websites** as trusted sources
6. **Test with real temples** (Sri Kalahasteeswara Swamy Temple)
7. **Deploy to production**

---

**Last Updated**: March 3, 2026  
**Status**: Design Complete, Ready for Implementation  
**Priority**: HIGH  
**Estimated Time**: 3-4 weeks
