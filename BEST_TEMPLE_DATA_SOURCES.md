# Best Temple Data Sources for 1,000 Temples

**Research Date**: March 3, 2026  
**Objective**: Identify the most trusted and comprehensive sources for collecting 1,000 Hindu temple data

---

## Executive Summary

**RECOMMENDED APPROACH**: Hybrid Multi-Source Strategy

1. **Primary Source**: Wikidata (automated, structured, 800+ temples)
2. **Secondary Source**: State Endowment Departments (official, verified)
3. **Tertiary Source**: ASI & UNESCO (heritage temples, high quality)
4. **Validation**: Wikipedia + Official Temple Websites

**Estimated Coverage**: 1,000+ temples with high-quality data  
**Estimated Time**: 2-3 weeks with automation  
**Data Quality**: High (government + community verified)

---

## Source Analysis

### 1. Wikidata (RECOMMENDED - PRIMARY SOURCE)

**URL**: https://query.wikidata.org  
**Type**: Structured knowledge database  
**Status**: ✅ BEST FOR AUTOMATION

**Pros**:
- ✅ Structured data (easy to query with SPARQL)
- ✅ 800+ Hindu temples in India with coordinates
- ✅ Includes: Name, location, deity, coordinates, images
- ✅ FREE and open data
- ✅ Community-verified and maintained
- ✅ Can be automated with PowerShell script
- ✅ Links to Wikipedia articles for more details
- ✅ Multilingual names available

**Cons**:
- ⚠️ May not have all 1,000 temples
- ⚠️ Data quality varies (needs validation)
- ⚠️ Official names may need correction

**Data Quality**: 7/10  
**Coverage**: 800+ temples  
**Automation**: ✅ Excellent (SPARQL API)

**Sample SPARQL Query**:
```sparql
SELECT ?temple ?templeLabel ?stateLabel ?cityLabel ?deityLabel ?coord ?image
WHERE {
  ?temple wdt:P31 wd:Q842402 .  # Hindu temple
  ?temple wdt:P17 wd:Q668 .     # in India
  ?temple wdt:P131 ?state .     # located in state
  OPTIONAL { ?temple wdt:P625 ?coord . }
  OPTIONAL { ?temple wdt:P18 ?image . }
  OPTIONAL { ?temple wdt:P825 ?deity . }
  OPTIONAL { ?temple wdt:P131 ?city . }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en" . }
}
LIMIT 1000
```

---

### 2. State Endowment Departments (OFFICIAL SOURCE)

**Type**: Government databases  
**Status**: ✅ MOST AUTHORITATIVE

#### Tamil Nadu HR&CE (Hindu Religious & Charitable Endowments)

**URL**: https://www.hrce.tn.gov.in  
**Coverage**: 43,800+ temples (390,615 total in Tamil Nadu)  
**Data Quality**: 10/10 (official government data)

**Pros**:
- ✅ Official temple names
- ✅ Complete administrative data
- ✅ Verified locations
- ✅ Management details

**Cons**:
- ⚠️ May require manual extraction
- ⚠️ Website may not have API
- ⚠️ Only Tamil Nadu temples

---

#### Andhra Pradesh Endowments Department

**URL**: https://www.apendowments.gov.in  
**Coverage**: 105+ major temples (25 lakh+ annual income)  
**Data Quality**: 10/10

**Available Data**:
- Temple name
- Village/Mandal/District
- Annual income
- Management details

---

#### Karnataka Muzrai Department

**URL**: https://muzrai.karnataka.gov.in  
**Coverage**: Thousands of temples  
**Data Quality**: 10/10

---

#### Kerala Devaswom Boards

**URLs**:
- Travancore: https://www.tdb.kerala.gov.in
- Cochin: https://www.cochindevaswomboard.org
- Malabar: https://malabardevaswomboard.org

**Coverage**: Hundreds of temples  
**Data Quality**: 10/10

---

### 3. Archaeological Survey of India (ASI)

**URL**: https://asi.nic.in  
**Type**: Heritage monuments database  
**Status**: ✅ HIGHEST QUALITY FOR HERITAGE TEMPLES

**Coverage by State**:
- Tamil Nadu: 162 monuments (Trichy circle)
- Gujarat: 203 monuments
- Andhra Pradesh: 135 monuments
- Odisha: 78 monuments
- Uttarakhand: 44 monuments
- Assam: 55 monuments

**Total**: 3,000+ monuments (many are temples)

**Pros**:
- ✅ Highest quality data
- ✅ Official names
- ✅ Historical details
- ✅ Architectural information
- ✅ Conservation status
- ✅ Government verified

**Cons**:
- ⚠️ Only heritage/protected temples
- ⚠️ Limited to ~500-600 temples
- ⚠️ May require manual extraction

**Data Quality**: 10/10  
**Coverage**: 500-600 temples  
**Automation**: ⚠️ Moderate (may need web scraping)

---

### 4. UNESCO World Heritage Sites

**URL**: https://whc.unesco.org  
**Type**: World Heritage temple sites  
**Status**: ✅ HIGHEST PRESTIGE

**Hindu Temple Sites in India**:
1. Group of Monuments at Hampi (1986)
2. Group of Monuments at Pattadakal (1987)
3. Khajuraho Group of Monuments (1986)
4. Great Living Chola Temples (1987, 2004)
   - Brihadeeswarar Temple, Thanjavur
   - Gangaikonda Cholapuram Temple
   - Airavatesvara Temple, Darasuram
5. Sun Temple, Konark (1984)
6. Mahabodhi Temple Complex (2002)
7. Rock Shelters of Bhimbetka (2003)
8. Elephanta Caves (1987)
9. Ellora Caves - Kailasa Temple (1983)
10. Sacred Ensembles of the Hoysalas (2023)
    - Chennakeshava Temple, Belur
    - Hoysaleswara Temple, Halebidu
    - Keshava Temple, Somanathapura

**Total**: ~15-20 temple sites

**Pros**:
- ✅ Highest quality documentation
- ✅ International recognition
- ✅ Detailed historical data
- ✅ Conservation information

**Cons**:
- ⚠️ Very limited coverage (only 15-20 sites)
- ⚠️ Only world heritage temples

**Data Quality**: 10/10  
**Coverage**: 15-20 temples  
**Use Case**: Top-tier temples, must-include list

---

### 5. Wikipedia - List of Hindu Temples in India

**URL**: https://en.wikipedia.org/wiki/List_of_Hindu_temples_in_India  
**Type**: Community-curated encyclopedia  
**Status**: ✅ GOOD FOR VALIDATION

**Pros**:
- ✅ Comprehensive lists by state
- ✅ Links to individual temple articles
- ✅ Historical information
- ✅ References to sources
- ✅ FREE and accessible
- ✅ Good for cross-validation

**Cons**:
- ⚠️ Not structured data (manual extraction needed)
- ⚠️ May use popular names instead of official names
- ⚠️ Quality varies by article
- ⚠️ Not suitable for direct automation

**Data Quality**: 6/10  
**Coverage**: 500+ temples  
**Automation**: ❌ Difficult (unstructured)

**Best Use**: Cross-reference and validation

---

### 6. Open Government Data (OGD) Platform India

**URL**: https://www.data.gov.in  
**Type**: Government open data portal  
**Status**: ⚠️ LIMITED TEMPLE DATA

**Available Datasets**:
- "List of Grade Temples" (found in search)
- Various state-specific datasets

**Pros**:
- ✅ Official government data
- ✅ Structured format (CSV, JSON)
- ✅ FREE and open

**Cons**:
- ⚠️ Limited temple-specific datasets
- ⚠️ Website often slow/timeout issues
- ⚠️ Coverage unclear

**Data Quality**: 8/10 (when available)  
**Coverage**: Unknown  
**Automation**: ✅ Good (if datasets available)

---

## Recommended Multi-Source Strategy

### Phase 1: Automated Collection (Week 1)

**Source**: Wikidata SPARQL Query

**Action**:
1. Run SPARQL query to fetch 800+ temples
2. Extract: Name, state, city, deity, coordinates, images
3. Save to JSON format
4. Estimated time: 1-2 hours

**Expected Output**: 800 temples with basic data

---

### Phase 2: Official Name Verification (Week 1-2)

**Sources**: 
- State Endowment Department websites
- Official temple websites
- ASI database

**Action**:
1. For top 200 temples: Verify official names
2. Update with correct honorifics
3. Add official source URLs
4. Estimated time: 2-3 days

**Expected Output**: 200 temples with verified official names

---

### Phase 3: Heritage Temple Addition (Week 2)

**Sources**:
- ASI monuments database
- UNESCO World Heritage Sites

**Action**:
1. Add all UNESCO temple sites (15-20)
2. Add ASI protected temples not in Wikidata (100-200)
3. Prioritize famous heritage temples
4. Estimated time: 2-3 days

**Expected Output**: 300-400 additional high-quality temples

---

### Phase 4: Gap Filling (Week 2-3)

**Sources**:
- Wikipedia lists (manual extraction)
- State tourism websites
- Temple management board websites

**Action**:
1. Identify missing famous temples
2. Add state-wise to reach 1,000
3. Focus on pilgrimage sites
4. Estimated time: 3-5 days

**Expected Output**: 1,000+ temples total

---

### Phase 5: Validation & Enrichment (Week 3)

**Sources**:
- Official temple websites
- Google Maps (coordinates verification)
- Temple management boards

**Action**:
1. Validate all official names
2. Verify coordinates
3. Add missing fields
4. Check for duplicates
5. Estimated time: 3-5 days

**Expected Output**: 1,000 temples with complete, verified data

---

## Data Quality Comparison

| Source | Quality | Coverage | Automation | Official Names | Recommended |
|--------|---------|----------|------------|----------------|-------------|
| Wikidata | 7/10 | 800+ | ✅ Excellent | ⚠️ Needs verification | ✅ PRIMARY |
| State Endowments | 10/10 | State-specific | ⚠️ Moderate | ✅ Yes | ✅ VALIDATION |
| ASI | 10/10 | 500-600 | ⚠️ Moderate | ✅ Yes | ✅ HERITAGE |
| UNESCO | 10/10 | 15-20 | ✅ Easy | ✅ Yes | ✅ TOP-TIER |
| Wikipedia | 6/10 | 500+ | ❌ Difficult | ⚠️ Mixed | ⚠️ REFERENCE |
| data.gov.in | 8/10 | Unknown | ✅ Good | ✅ Yes | ⚠️ IF AVAILABLE |

---

## Recommended Prioritization

### Tier 1: Must-Include (Top 100)

**Sources**: UNESCO + ASI + Major Pilgrimage Sites

**Criteria**:
- UNESCO World Heritage Sites
- 12 Jyotirlingas
- 4 Char Dham temples
- 51 Shakti Peethas
- 108 Divya Desams
- Major state temples (TTD, Guruvayur, etc.)

**Data Quality**: 10/10 (manual verification)

---

### Tier 2: Important Temples (Next 400)

**Sources**: Wikidata + State Endowments + ASI

**Criteria**:
- State capital temples
- District headquarters temples
- Famous pilgrimage sites
- Architectural significance

**Data Quality**: 8/10 (automated + spot verification)

---

### Tier 3: Regional Temples (Next 500)

**Sources**: Wikidata + Wikipedia + State Tourism

**Criteria**:
- Regional importance
- Historical significance
- Tourist attractions
- Complete geographic coverage

**Data Quality**: 7/10 (automated + basic verification)

---

## Implementation Scripts

### Script 1: Wikidata Fetcher (Already Created)

**File**: `scripts/fetch-temples-from-wikidata.ps1`

**Status**: ✅ Ready to use

**Usage**:
```powershell
.\scripts\fetch-temples-from-wikidata.ps1
```

---

### Script 2: Official Name Validator (To Create)

**File**: `scripts/validate-official-names.ps1`

**Purpose**: Cross-check names with official sources

**Sources**:
- Temple official websites
- State endowment departments
- ASI database

---

### Script 3: Data Enricher (To Create)

**File**: `scripts/enrich-temple-data.ps1`

**Purpose**: Add missing fields

**Actions**:
- Add alternate names
- Add local language names
- Add official source URLs
- Verify coordinates

---

## Cost Analysis

### Option 1: Fully Automated (Wikidata Only)

**Time**: 1 week  
**Cost**: $0 (FREE)  
**Quality**: 7/10  
**Coverage**: 800 temples

---

### Option 2: Hybrid Automated + Manual Verification

**Time**: 2-3 weeks  
**Cost**: $0 (FREE, manual effort)  
**Quality**: 9/10  
**Coverage**: 1,000+ temples

**RECOMMENDED** ✅

---

### Option 3: Fully Manual Curation

**Time**: 2-3 months  
**Cost**: $0 (FREE, significant manual effort)  
**Quality**: 10/10  
**Coverage**: 1,000 temples

---

## Final Recommendation

### BEST APPROACH: Hybrid Multi-Source Strategy

**Week 1**:
1. Run Wikidata script → Get 800 temples
2. Add UNESCO sites → Get 15-20 top temples
3. Verify top 50 temple names manually

**Week 2**:
1. Add ASI heritage temples → Get 100-200 more
2. Verify top 200 temple names
3. Add missing famous temples from Wikipedia

**Week 3**:
1. Fill gaps to reach 1,000
2. Validate all data
3. Enrich with official sources
4. Final quality check

**Total Time**: 2-3 weeks  
**Total Cost**: $0 (FREE)  
**Expected Quality**: 9/10  
**Expected Coverage**: 1,000+ temples

---

## Quality Assurance Checklist

For each temple, ensure:

- ☐ Official name verified (not popular name)
- ☐ Official source URL documented
- ☐ Coordinates verified (Google Maps)
- ☐ State/District/City codes added
- ☐ Temple ID in correct format
- ☐ Alternate names documented
- ☐ Local language name added
- ☐ Deity information accurate
- ☐ No duplicates
- ☐ Links validated (no spaces, HTTPS)

---

## Next Steps

1. ✅ Run Wikidata script to fetch initial 800 temples
2. ⚠️ Create official name validation script
3. ⚠️ Create data enrichment script
4. ⚠️ Manual verification of top 200 temples
5. ⚠️ Add UNESCO and ASI temples
6. ⚠️ Fill gaps to reach 1,000
7. ⚠️ Final validation and quality check

---

**Last Updated**: March 3, 2026  
**Status**: Research complete, ready for implementation  
**Recommended Start**: Immediately with Wikidata script
