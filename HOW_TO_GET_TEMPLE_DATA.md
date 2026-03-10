# How to Get Temple Data for 1,000 Temples

Complete guide on sourcing temple information for content generation.

**Last Updated**: March 3, 2026  
**Status**: Data Collection Guide

---

## Quick Answer

You need TWO things:
1. **Temple List** - Names, locations, basic info (1,000 temples)
2. **Temple Details** - Deity, history, architecture (for AI to generate better content)

---

## Option 1: Use Existing Public Datasets (RECOMMENDED)

### A. Wikipedia + Wikidata

**What**: Structured data about Hindu temples  
**How many**: 2,000+ temples available  
**Quality**: Good, verified information  
**Cost**: FREE

**How to get it**:

```python
# Python script to fetch temple data from Wikidata
import requests

def fetch_temples_from_wikidata():
    query = """
    SELECT ?temple ?templeLabel ?stateLabel ?cityLabel ?deityLabel ?coordinates
    WHERE {
      ?temple wdt:P31 wd:Q842402.  # Instance of Hindu temple
      ?temple wdt:P17 wd:Q668.     # Country: India
      OPTIONAL { ?temple wdt:P131 ?state. }
      OPTIONAL { ?temple wdt:P276 ?city. }
      OPTIONAL { ?temple wdt:P825 ?deity. }
      OPTIONAL { ?temple wdt:P625 ?coordinates. }
      SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
    }
    LIMIT 1000
    """
    
    url = "https://query.wikidata.org/sparql"
    response = requests.get(url, params={'query': query, 'format': 'json'})
    return response.json()
```

**Output**: JSON file with 1,000 temples

---

### B. Government Tourism Websites

**Sources**:
- Ministry of Tourism (India)
- State Tourism Departments
- Archaeological Survey of India (ASI)

**What you get**:
- Official temple names
- Locations
- Historical significance
- Visiting hours

**How to collect**:
1. Visit state tourism websites
2. Copy temple lists
3. Compile into spreadsheet

**States to cover**:
- Tamil Nadu (300+ temples)
- Andhra Pradesh (200+ temples)
- Karnataka (150+ temples)
- Kerala (100+ temples)
- Maharashtra (100+ temples)
- Gujarat (50+ temples)
- Rajasthan (50+ temples)
- Uttar Pradesh (50+ temples)

---

### C. Temple Management Boards

**Major boards**:
- Tirumala Tirupati Devasthanams (TTD)
- Hindu Religious & Charitable Endowments (HR&CE) - Tamil Nadu
- Endowments Department - Andhra Pradesh
- Muzrai Department - Karnataka

**What you get**:
- Official temple lists
- Accurate information
- Contact details

---

## Option 2: Web Scraping (Semi-Automated)

### A. Temple Websites

**Popular sources**:
- templesinindiainfo.com
- templenet.com
- indiantemples.com
- templepurohit.com

**How to scrape**:

```python
# Example scraping script
import requests
from bs4 import BeautifulSoup
import json

def scrape_temple_data(url):
    response = requests.get(url)
    soup = BeautifulSoup(response.content, 'html.parser')
    
    temples = []
    for temple_div in soup.find_all('div', class_='temple-item'):
        temple = {
            'name': temple_div.find('h3').text,
            'location': temple_div.find('span', class_='location').text,
            'deity': temple_div.find('span', class_='deity').text,
            'description': temple_div.find('p').text
        }
        temples.append(temple)
    
    return temples

# Save to JSON
temples = scrape_temple_data('https://example.com/temples')
with open('temples.json', 'w', encoding='utf-8') as f:
    json.dump(temples, f, indent=2, ensure_ascii=False)
```

**⚠️ Important**: Check website's robots.txt and terms of service

---

### B. Google Maps API

**What**: Get temple locations and basic info  
**Cost**: FREE for first 28,000 requests/month  
**Quality**: Good for location data

**How to use**:

```python
import googlemaps

gmaps = googlemaps.Client(key='YOUR_API_KEY')

def find_temples_in_state(state_name):
    query = f"Hindu temples in {state_name}, India"
    places = gmaps.places(query=query)
    
    temples = []
    for place in places['results']:
        temple = {
            'name': place['name'],
            'location': place['formatted_address'],
            'latitude': place['geometry']['location']['lat'],
            'longitude': place['geometry']['location']['lng'],
            'rating': place.get('rating', 0)
        }
        temples.append(temple)
    
    return temples
```

---

## Option 3: Manual Compilation (Most Accurate)

### Step-by-Step Process

**1. Create a spreadsheet with columns**:
```
Temple ID | Temple Name | State | City | Deity | Built Year | Style | Latitude | Longitude | Description
```

**2. Start with famous temples** (100 temples):
- 12 Jyotirlingas
- 18 Shakti Peethas
- 108 Divya Desams
- 51 Shakti Peethas
- Char Dham temples
- Pancha Bhoota Sthalas

**3. Add state-wise temples** (900 temples):
- Tamil Nadu: 300 temples
- Andhra Pradesh: 200 temples
- Karnataka: 150 temples
- Kerala: 100 temples
- Others: 250 temples

**4. Sources for manual compilation**:
- Wikipedia articles
- Temple official websites
- Tourism brochures
- Books on Indian temples
- Archaeological Survey of India reports

---

## Option 4: Use Our Starter Dataset

I'll create a starter dataset with 50 famous temples that you can expand:

**Included**:
- Temple name
- Location (state, city)
- Deity
- Built year
- Architectural style
- Brief description
- Coordinates

**You can**:
- Use this as a starting point
- Add more temples gradually
- Generate content for these first
- Expand to 1,000 over time

---

## Data Structure Required

### Minimum Required Fields

```json
{
  "templeId": "temple_001",
  "name": "Brihadeeswarar Temple",
  "state": "Tamil Nadu",
  "city": "Thanjavur",
  "deity": "Lord Shiva",
  "built": "1010 CE",
  "style": "Dravidian",
  "latitude": 10.7825,
  "longitude": 79.1317
}
```

### Optional Fields (Better AI Content)

```json
{
  "templeId": "temple_001",
  "name": "Brihadeeswarar Temple",
  "state": "Tamil Nadu",
  "city": "Thanjavur",
  "deity": "Lord Shiva",
  "built": "1010 CE",
  "builtBy": "Raja Raja Chola I",
  "style": "Dravidian",
  "latitude": 10.7825,
  "longitude": 79.1317,
  "description": "UNESCO World Heritage Site, one of the largest temples in India",
  "significance": "Masterpiece of Chola architecture",
  "festivals": ["Maha Shivaratri", "Arudra Darshan"],
  "timings": {
    "morning": "6:00 AM - 12:30 PM",
    "evening": "4:00 PM - 8:30 PM"
  },
  "entryFee": "Free",
  "website": "https://example.com",
  "phone": "+91-1234567890"
}
```

---

## Recommended Approach

### Phase 1: Start Small (50 Temples)

**Week 1**: Collect data for 50 famous temples
- Use Wikipedia
- Use temple official websites
- Manual compilation

**Week 2**: Generate AI content for 50 temples
- Test content quality
- Review and edit
- Deploy to app

**Cost**: $0.46 (50 temples × $0.0092)

---

### Phase 2: Expand to 200 Temples

**Week 3-4**: Add 150 more temples
- Use Wikidata API
- Scrape temple websites
- Add state-wise temples

**Week 5**: Generate AI content
- Batch generation
- Review quality

**Cost**: $1.38 (150 temples × $0.0092)

---

### Phase 3: Complete 1,000 Temples

**Month 2-3**: Add remaining 800 temples
- Automated scraping
- Government data
- Community contributions

**Month 3**: Generate all content
- Bulk generation
- Quality review

**Cost**: $7.36 (800 temples × $0.0092)

**Total Cost**: $9.20 for 1,000 temples

---

## Tools & Scripts I'll Create for You

### 1. Temple Data Collector Script

```powershell
# Fetch temples from Wikidata
.\scripts\fetch-temples-from-wikidata.ps1 -Count 1000 -OutputFile "data/temples.json"
```

### 2. Temple Data Validator

```powershell
# Validate temple data structure
.\scripts\validate-temple-data.ps1 -InputFile "data/temples.json"
```

### 3. Temple Data Enricher

```powershell
# Add missing fields using Google Maps API
.\scripts\enrich-temple-data.ps1 -InputFile "data/temples.json"
```

### 4. Content Generator (Already Created)

```powershell
# Generate AI content for all temples
.\scripts\generate-content-locally.ps1 -InputFile "data/temples.json" -TempleCount 1000
```

---

## Sample Temple Data Format

I'll create a sample file with 50 temples:

**File**: `data/temples-sample.json`

```json
[
  {
    "templeId": "temple_001",
    "name": "Brihadeeswarar Temple",
    "state": "Tamil Nadu",
    "city": "Thanjavur",
    "deity": "Lord Shiva",
    "built": "1010 CE",
    "builtBy": "Raja Raja Chola I",
    "style": "Dravidian",
    "latitude": 10.7825,
    "longitude": 79.1317,
    "description": "UNESCO World Heritage Site, one of the largest temples in India"
  },
  {
    "templeId": "temple_002",
    "name": "Meenakshi Temple",
    "state": "Tamil Nadu",
    "city": "Madurai",
    "deity": "Goddess Meenakshi",
    "built": "17th century",
    "style": "Dravidian",
    "latitude": 9.9195,
    "longitude": 78.1193,
    "description": "Famous for its towering gopurams and thousand pillar hall"
  }
  // ... 48 more temples
]
```

---

## Data Quality Checklist

Before generating AI content, ensure:

- ✅ Temple name is accurate
- ✅ Location (state, city) is correct
- ✅ Deity name is specified
- ✅ Basic description available (optional but helpful)
- ✅ Coordinates are accurate (for maps)
- ✅ No duplicate entries
- ✅ Consistent formatting

---

## Cost Breakdown by Data Source

| Source | Temples | Cost | Time | Quality |
|--------|---------|------|------|---------|
| **Wikidata API** | 1,000+ | FREE | 1 hour | Good |
| **Web Scraping** | 500+ | FREE | 2-3 days | Medium |
| **Google Maps API** | 1,000+ | FREE* | 1 day | Good |
| **Manual Compilation** | 100 | FREE | 1 week | Excellent |
| **Combination** | 1,000 | FREE | 3-5 days | Good |

*FREE for first 28,000 requests/month

---

## Next Steps

### Immediate (This Week)

1. **I'll create** a starter dataset with 50 famous temples
2. **I'll create** data collection scripts
3. **You review** the sample data
4. **You decide** which approach to use

### Short Term (Next 2 Weeks)

1. Collect data for 200 temples
2. Generate AI content for testing
3. Review quality
4. Refine data collection process

### Long Term (Next 2 Months)

1. Expand to 1,000 temples
2. Generate all AI content
3. Deploy to production
4. Add photos and videos

---

## Community Contribution Option

**Idea**: Allow users to submit temple data

**How it works**:
1. User submits temple info via form
2. Admin reviews and approves
3. AI generates content
4. Temple added to app

**Benefits**:
- Crowdsourced data collection
- Community engagement
- Continuous growth
- User-generated content

---

## Summary

**To get 1,000 temples, you have 4 options**:

1. **Automated** (Wikidata API) - 1 hour, FREE, Good quality
2. **Semi-Automated** (Web scraping) - 3 days, FREE, Medium quality
3. **Manual** (Spreadsheet) - 1 month, FREE, Excellent quality
4. **Hybrid** (Combination) - 1 week, FREE, Good quality

**Recommended**: Start with Wikidata API (1,000 temples in 1 hour), then manually enrich top 100 temples with better descriptions.

**I'll create**:
- ✅ Data collection scripts
- ✅ Sample dataset (50 temples)
- ✅ Data validation tools
- ✅ Content generation integration

---

**Last Updated**: March 3, 2026  
**Status**: Ready to implement  
**Next**: Create data collection scripts

