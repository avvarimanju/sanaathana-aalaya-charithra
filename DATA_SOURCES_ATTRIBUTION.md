# Data Sources and Attribution

This document lists all external data sources used in the Sanaathana Aalaya Charithra project, along with their licenses and required attributions.

## Temple Data

### Primary Source: GitHub Hindu Temples Database

**Repository**: [ShashiTharoor/hindu-temples](https://github.com/ShashiTharoor/hindu-temples)

**License**: MIT License

**License Terms**:
> The data in this repository is licensed under the terms of the MIT License. You are free to use, modify, and distribute the data for non-commercial and commercial purposes, with attribution to the original source.

**Attribution**: Required

**How We Use It**:
- Primary source for temple information
- 268 temples across 33 Indian states and union territories
- Includes comprehensive information: history, architecture, visiting guides, scripture references
- Data transformed to our internal format while preserving source attribution

**Attribution in Our System**:
Each temple record includes the following fields:
```json
{
  "dataSource": "GitHub: ShashiTharoor/hindu-temples",
  "dataSourceUrl": "https://github.com/ShashiTharoor/hindu-temples",
  "dataLicense": "MIT License"
}
```

**Data Quality**:
- ✅ 100% valid Indian state names
- ✅ Comprehensive temple information
- ✅ Community-maintained and verified
- ✅ Clean, structured JSON format
- ✅ No junk data

**Last Updated**: March 4, 2026

---

## Previous Data Sources (Deprecated)

### Wikidata (No Longer Used)

**Source**: Wikidata SPARQL Query

**Reason for Deprecation**: Poor data quality
- Only 20% had valid Indian state names
- 80% had district/city names instead of states
- Inconsistent data format
- Mixed quality information

**Replaced By**: GitHub Hindu Temples Database (March 4, 2026)

---

## Future Data Sources (Planned)

### Government Sources (Under Consideration)

We are exploring formal data access requests to:

1. **Archaeological Survey of India (ASI)**
   - 3,693 Centrally Protected Monuments
   - Government-verified historical temples
   - Status: Requires formal request

2. **Karnataka HRCE Department**
   - 34,566 notified institutions
   - Official state temple registry
   - Status: Requires formal data access request

3. **Tamil Nadu HRCE Department**
   - 390,615 registered Hindu temples
   - Largest temple database in India
   - Status: Requires formal data access request

4. **data.gov.in**
   - Open Government Data Portal
   - Various temple datasets
   - Status: API access can be requested

---

## License Compliance

### MIT License Requirements

The MIT License requires:
1. ✅ **Attribution**: We include source attribution in every temple record
2. ✅ **License Notice**: This document serves as the license notice
3. ✅ **No Warranty**: We acknowledge data is provided "as is"

### Our Compliance

We comply with the MIT License by:
- Including source attribution in database records
- Maintaining this attribution document
- Providing source URLs for verification
- Acknowledging the license in our documentation

---

## Data Transformation

### Original Format (GitHub)
```json
{
  "name": "Temple Name",
  "state": "State Name",
  "info": "Temple information...",
  "story": "Temple history...",
  "visiting_guide": "How to visit...",
  "architecture": "Architectural details...",
  "mention_in_scripture": "Scripture references..."
}
```

### Our Format
```json
{
  "templeId": "TMPL-GH-0001",
  "name": "Temple Name",
  "description": "Temple information...",
  "location": {
    "state": "State Name",
    "city": "City Name",
    "district": "",
    "address": ""
  },
  "history": "Temple history...",
  "visitingGuide": "How to visit...",
  "architecture": "Architectural details...",
  "scriptureReference": "Scripture references...",
  "dataSource": "GitHub: ShashiTharoor/hindu-temples",
  "dataSourceUrl": "https://github.com/ShashiTharoor/hindu-temples",
  "dataLicense": "MIT License",
  ...
}
```

---

## Contact for Data Issues

If you notice any data quality issues or have questions about our data sources:

1. **For GitHub data issues**: Submit an issue to [ShashiTharoor/hindu-temples](https://github.com/ShashiTharoor/hindu-temples/issues)
2. **For our transformation issues**: Submit an issue to our repository
3. **For general inquiries**: Contact the project maintainers

---

## Acknowledgments

We thank the following for making their data available:

- **ShashiTharoor** and contributors to the hindu-temples repository
- The open-source community for maintaining quality temple data
- Future government data providers (when access is granted)

---

**Last Updated**: March 4, 2026  
**Document Version**: 1.0  
**Maintained By**: Sanaathana Aalaya Charithra Project Team
