# How to Add/Manage Trusted Sources

## Quick Guide

You can manage trusted sources by editing the `content-sources.json` file in this directory.

## Step-by-Step Instructions

### Adding a New Source

1. Open `content-sources.json` in any text editor
2. Find the appropriate section:
   - `primary` - Government, temple authorities, official sources
   - `secondary` - Research institutions, NGOs
   - `traditional` - Scriptures, ancient texts
3. Copy an existing source object
4. Modify the fields:
   - `id`: Unique identifier (lowercase, no spaces)
   - `name`: Full name of the source
   - `type`: Type of source (see types below)
   - `url`: Website URL (optional)
   - `trustLevel`: high, medium-high, or medium
   - `categories`: Array of relevant categories
   - `note`: Optional description
5. Save the file

### Example: Adding a New Temple Authority

```json
{
  "id": "srisailam_temple",
  "name": "Srisailam Devasthanam",
  "type": "temple_authority",
  "url": "https://www.srisailamonline.com",
  "trustLevel": "high",
  "categories": ["srisailam", "rituals", "history"],
  "note": "Official authority for Srisailam Temple"
}
```

### Source Types

- `government` - Government departments (ASI, Ministry of Culture)
- `temple_authority` - Official temple management (TTD, Devasthanams)
- `state_government` - State archaeology departments
- `research` - Research institutions (ICHR, universities)
- `ngo` - Non-profit organizations (INTACH)
- `scripture` - Traditional texts (Agamas, Puranas)
- `primary_evidence` - Inscriptions, archaeological evidence

### Trust Levels

- `high` - Official government sources, temple authorities, primary evidence
- `medium-high` - Established research institutions, reputable NGOs
- `medium` - Traditional texts, secondary sources

### Categories

Common categories you can use:
- `architecture` - Building design and construction
- `history` - Historical facts and dates
- `rituals` - Religious ceremonies and practices
- `art` - Sculptures, paintings, crafts
- `mythology` - Legends and traditional stories
- `conservation` - Preservation and restoration
- `epigraphy` - Inscriptions and stone carvings
- Temple-specific: `lepakshi`, `tirumala`, `srisailam`, `hampi`, etc.
- Region-specific: `andhra_pradesh`, `karnataka`, `tamil_nadu`, etc.

## Removing a Source

1. Open `content-sources.json`
2. Find the source you want to remove
3. Delete the entire source object (including the curly braces)
4. Make sure to remove any trailing commas
5. Save the file

## Modifying a Source

1. Open `content-sources.json`
2. Find the source you want to modify
3. Update the relevant fields
4. Save the file

## Adding to Excluded Sources

If you want to explicitly exclude certain sources:

1. Find the `excludedSources` array at the bottom of the file
2. Add the source name or type
3. Save the file

Example:
```json
"excludedSources": [
  "wikipedia",
  "personal_blogs",
  "social_media",
  "unverified_tourist_sites",
  "your-excluded-source-here"
]
```

## Validation

After editing, you can validate your JSON file:
1. Use an online JSON validator (jsonlint.com)
2. Or open the file in VS Code - it will show errors if the JSON is invalid

## Using Your Sources

Once you've added sources to `content-sources.json`, you can reference them when generating content:

**Example:**
```
Generate audio guide content about [artifact name].
Use sources from: asi, ttd, srisailam_temple
Include proper citations.
```

## Complete Example

Here's a complete example of adding a new source:

**Before:**
```json
"primary": [
  {
    "id": "ttd",
    "name": "Tirumala Tirupati Devasthanams",
    "type": "temple_authority",
    "url": "https://www.tirumala.org",
    "trustLevel": "high",
    "categories": ["tirumala", "rituals", "history"]
  }
]
```

**After (adding Srisailam):**
```json
"primary": [
  {
    "id": "ttd",
    "name": "Tirumala Tirupati Devasthanams",
    "type": "temple_authority",
    "url": "https://www.tirumala.org",
    "trustLevel": "high",
    "categories": ["tirumala", "rituals", "history"]
  },
  {
    "id": "srisailam_temple",
    "name": "Srisailam Devasthanam",
    "type": "temple_authority",
    "url": "https://www.srisailamonline.com",
    "trustLevel": "high",
    "categories": ["srisailam", "rituals", "history", "jyotirlinga"],
    "note": "Official authority for Mallikarjuna Jyotirlinga Temple"
  }
]
```

## Tips

1. **Keep IDs simple**: Use lowercase with underscores (e.g., `sri_kalahasti`)
2. **Be specific with categories**: This helps in content generation
3. **Add notes**: Helps others understand the source's relevance
4. **Verify URLs**: Make sure links are correct and active
5. **Backup before editing**: Keep a copy of the original file

## Need Help?

If you're unsure about:
- JSON syntax
- What trust level to assign
- Which category to use
- Whether a source is appropriate

Just ask in the chat and I'll help you add it correctly!

---

**File Location:** `Sanaathana-Aalaya-Charithra/config/content-sources.json`

**Last Updated:** 2026-02-27
