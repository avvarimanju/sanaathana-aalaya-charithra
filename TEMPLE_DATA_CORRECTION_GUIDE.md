# Temple Data Correction Guide

**MANDATORY**: All temple data must follow these standards going forward.

**Last Updated**: March 3, 2026  
**Status**: CRITICAL - Must be implemented before production

---

## Critical Issues Found

### 1. Incorrect Temple Names

**WRONG NAMES IN CURRENT DATA**:

| Current Name | Correct Official Name | Source |
|--------------|----------------------|--------|
| "Tirupati Balaji Temple" | "Sri Venkateswara Swamy Temple" | https://www.tirumala.org |
| "Meenakshi Temple" | "Arulmigu Meenakshi Sundareswarar Temple" | https://www.maduraimeenakshi.org |
| "Golden Temple (Kashi Vishwanath)" | "Sri Harmandir Sahib" | https://sgpc.net |
| "Jagannath Temple" | "Shree Jagannath Temple" | https://jagannath.nic.in |
| "Somnath Temple" | "Shree Somnath Jyotirlinga Temple" | https://www.somnath.org |
| "Dwarkadhish Temple" | "Shree Dwarkadhish Temple" | https://dwarkadhish.org |
| "Kashi Vishwanath Temple" | "Shri Kashi Vishwanath Temple" | https://shrikashivishwanath.org |
| "Padmanabhaswamy Temple" | "Sri Padmanabhaswamy Temple" | https://www.tdb.kerala.gov.in |
| "Guruvayur Temple" | "Sri Krishna Temple, Guruvayur" | https://guruvayurdevaswom.org |
| "Sabarimala Temple" | "Sabarimala Sree Dharma Sastha Temple" | https://sabarimala.kerala.gov.in |
| "Kamakhya Temple" | "Kamakhya Temple" | https://kamakhyatemple.org |
| "Siddhivinayak Temple" | "Shree Siddhivinayak Temple" | https://www.siddhivinayak.org |
| "Virupaksha Temple" | "Sri Virupaksha Temple" | https://asi.nic.in |
| "Chennakeshava Temple" | "Sri Chennakeshava Temple" | https://muzrai.karnataka.gov.in |
| "Mahakaleshwar Temple" | "Mahakaleshwar Jyotirlinga Temple" | https://www.mahakaleshwar.nic.in |
| "Udupi Krishna Temple" | "Sri Krishna Matha, Udupi" | https://www.udupi-krishna.org |
| "Murudeshwar Temple" | "Sri Murudeshwara Temple" | https://murudeshwara.org |

---

### 2. Broken Links

**FIXED**:
- ❌ `https://www.travancore devaswomboard.org` (had space)
- ✅ `https://www.tdb.kerala.gov.in` (correct)

---

### 3. Missing Required Fields

All temple entries MUST include:

```json
{
  "templeId": "STATE-CODE_DISTRICT-CODE_CITY-CODE_temple-name",
  "name": "Official Temple Name with Honorifics",
  "alternateNames": ["Popular Name", "Tourist Name", "Local Variant"],
  "localName": "Name in local language script",
  "popularName": "Most common tourist/popular name",
  "officialSource": "https://verified-official-website.org",
  "state": "Full State Name",
  "stateCode": "2-letter code",
  "district": "District Name",
  "districtCode": "3-letter code",
  "city": "City/Town Name",
  "cityCode": "3-letter code",
  "deity": "Primary Deity",
  "built": "Construction period",
  "builtBy": "Builder/Dynasty (if known)",
  "style": "Architectural style",
  "latitude": 0.0000,
  "longitude": 0.0000,
  "description": "Brief description"
}
```

---

## Correction Process

### Step 1: Verify Official Name

For each temple:

1. **Visit official website** (use VERIFIED_TEMPLE_RESOURCES.md)
2. **Check temple signboard** (if available in photos)
3. **Verify with management board** website
4. **Cross-reference with ASI** (for heritage temples)

### Step 2: Update Temple ID

Use the standardized format:
```
STATE-CODE_DISTRICT-CODE_CITY-CODE_temple-name
```

**Example**:
- Old: `temple_003`
- New: `AP_CHI_TIR_sri-venkateswara-swamy-temple`

### Step 3: Add All Required Fields

Ensure every temple has:
- ✅ Official name with honorifics
- ✅ Alternate names array
- ✅ Local language name
- ✅ Popular name (for search)
- ✅ Official source URL (verified)
- ✅ Complete location codes
- ✅ Verified coordinates

### Step 4: Validate Links

Run the validation script:
```powershell
.\scripts\validate-temple-links.ps1 -FilePath "data/temples-sample.json"
```

---

## Automated Correction Script

Create a PowerShell script to help with corrections:

```powershell
# Usage: .\scripts\correct-temple-data.ps1

$corrections = @{
    "Tirupati Balaji Temple" = "Sri Venkateswara Swamy Temple"
    "Meenakshi Temple" = "Arulmigu Meenakshi Sundareswarar Temple"
    "Golden Temple" = "Sri Harmandir Sahib"
    "Jagannath Temple" = "Shree Jagannath Temple"
    # Add more corrections
}

# Read temple data
$temples = Get-Content "data/temples-sample.json" | ConvertFrom-Json

# Apply corrections
foreach ($temple in $temples) {
    if ($corrections.ContainsKey($temple.name)) {
        $temple.name = $corrections[$temple.name]
        Write-Host "✅ Corrected: $($temple.templeId)" -ForegroundColor Green
    }
}

# Save corrected data
$temples | ConvertTo-Json -Depth 10 | Set-Content "data/temples-sample-corrected.json"
```

---

## Verification Checklist

Before marking a temple as "corrected":

- ☐ Official name verified from temple website
- ☐ Official website URL tested (no spaces, HTTPS)
- ☐ Alternate names documented
- ☐ Local language name added
- ☐ Temple ID follows new format
- ☐ All location codes added
- ☐ Coordinates verified
- ☐ Official source documented
- ☐ Links validated with script

---

## Priority Temples to Correct

### High Priority (Top 20 Most Visited)

1. ✅ Sri Venkateswara Swamy Temple (Tirumala)
2. ✅ Arulmigu Meenakshi Sundareswarar Temple (Madurai)
3. ⚠️ Shree Jagannath Temple (Puri) - needs honorific
4. ⚠️ Sri Padmanabhaswamy Temple (Thiruvananthapuram) - needs honorific
5. ⚠️ Sri Krishna Temple (Guruvayur) - needs official name
6. ⚠️ Sabarimala Sree Dharma Sastha Temple - needs full name
7. ⚠️ Shri Kashi Vishwanath Temple (Varanasi) - needs honorific
8. ⚠️ Sri Harmandir Sahib (Amritsar) - wrong name in data
9. ✅ Shree Somnath Jyotirlinga Temple (Prabhas Patan)
10. ⚠️ Shree Dwarkadhish Temple (Dwarka) - needs honorific

### Medium Priority (Next 30)

11-40: All temples in current sample data need review

---

## Implementation Timeline

### Phase 1: Fix Top 50 Temples (Week 1)
- Correct all names
- Add all required fields
- Validate all links
- Update temple IDs

### Phase 2: Expand to 100 Temples (Week 2)
- Apply same standards
- Use Wikidata for initial data
- Manual verification required

### Phase 3: Complete 1,000 Temples (Weeks 3-8)
- Batch processing with scripts
- Manual verification for top 200
- Automated verification for remaining 800

---

## Quality Assurance

### Automated Checks

Run these scripts before committing:

```powershell
# 1. Validate temple IDs
.\scripts\validate-temple-ids.ps1

# 2. Validate links
.\scripts\validate-temple-links.ps1 -CheckAll

# 3. Check for missing fields
.\scripts\check-required-fields.ps1

# 4. Verify official names
.\scripts\verify-temple-names.ps1
```

### Manual Review

For top 100 temples:
- ✅ Visit official website personally
- ✅ Cross-check with multiple sources
- ✅ Verify local language spelling
- ✅ Confirm coordinates with Google Maps

---

## Reference Documents

**MUST READ**:
1. `TEMPLE_NAMING_STANDARDS.md` - Official naming guidelines
2. `VERIFIED_TEMPLE_RESOURCES.md` - All verified links
3. `TEMPLE_ID_FORMAT_GUIDE.md` - ID format standards

**MUST USE**:
1. `scripts/validate-temple-links.ps1` - Link validation
2. `scripts/update-temple-ids.ps1` - ID format conversion
3. `data/temples-sample-corrected.json` - Example of correct format

---

## Common Mistakes to Avoid

### ❌ WRONG

```json
{
  "templeId": "temple_003",
  "name": "Tirupati Balaji Temple",
  "state": "Andhra Pradesh",
  "city": "Tirupati"
}
```

### ✅ CORRECT

```json
{
  "templeId": "AP_CHI_TIR_sri-venkateswara-swamy-temple",
  "name": "Sri Venkateswara Swamy Temple",
  "alternateNames": ["Tirupati Balaji Temple", "Tirumala Temple"],
  "localName": "శ్రీ వేంకటేశ్వర స్వామి వారి దేవస్థానం",
  "popularName": "Tirupati Balaji Temple",
  "officialSource": "https://www.tirumala.org",
  "state": "Andhra Pradesh",
  "stateCode": "AP",
  "district": "Chittoor",
  "districtCode": "CHI",
  "city": "Tirumala",
  "cityCode": "TIR",
  "deity": "Lord Venkateswara",
  "built": "300 CE",
  "style": "Dravidian",
  "latitude": 13.6833,
  "longitude": 79.3472,
  "description": "Richest and most visited Hindu temple in the world"
}
```

---

## Support

If you find:
- ❌ Broken links → Check `VERIFIED_TEMPLE_RESOURCES.md`
- ❌ Incorrect names → Check `TEMPLE_NAMING_STANDARDS.md`
- ❌ Invalid IDs → Check `TEMPLE_ID_FORMAT_GUIDE.md`
- ❌ Missing data → Use Wikidata or official websites

---

## Status Tracking

**Current Status**:
- ✅ 4 temples corrected (sample)
- ⚠️ 46 temples need correction
- ❌ 950 temples not yet added

**Target**:
- ✅ 1,000 temples with correct data
- ✅ All links verified
- ✅ All names official
- ✅ All IDs standardized

---

**Last Updated**: March 3, 2026  
**Next Review**: After Phase 1 completion  
**Priority**: CRITICAL - Must complete before production deployment
