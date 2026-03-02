# Language Ordering Standard

## Official Language Order

Throughout the entire Sanaathana Aalaya Charithra project, languages MUST be listed in the following order:

### Priority Languages (First 4)
1. **English** (en) - International language
2. **Hindi** (hi) - National language of India
3. **Telugu** (te) - Primary regional language (Andhra Pradesh focus)
4. **Sanskrit** (sa) - Sacred language (Text only - limited audio support)

### Other Languages (Alphabetical Order)
5. **Bengali** (bn) - বাংলা
6. **Gujarati** (gu) - ગુજરાતી
7. **Kannada** (kn) - ಕನ್ನಡ
8. **Malayalam** (ml) - മലയാളം
9. **Marathi** (mr) - मराठी
10. **Punjabi** (pa) - ਪੰਜਾਬੀ
11. **Tamil** (ta) - தமிழ்

## Complete Ordered List

```
1. English (en)
2. Hindi (hi)
3. Telugu (te)
4. Sanskrit (sa) - संस्कृतम्
5. Bengali (bn)
6. Gujarati (gu)
7. Kannada (kn)
8. Malayalam (ml)
9. Marathi (mr)
10. Punjabi (pa)
11. Tamil (ta)
```

## Rationale

### Why This Order?

1. **English First**: 
   - International accessibility
   - Default language for tourists
   - Technical documentation standard

2. **Hindi Second**:
   - National language of India
   - Widely understood across India
   - Government documentation standard

3. **Telugu Third**:
   - Primary focus region (Andhra Pradesh)
   - Many temples in Telugu-speaking areas
   - Local language priority

4. **Sanskrit Fourth**:
   - Sacred language of Hindu scriptures
   - Culturally significant for temple content
   - Slokas, mantras, and traditional texts
   - **Note**: Limited audio support (text-only initially)

5. **Alphabetical After Top 4**:
   - Fair representation for all other languages
   - Easy to find in lists
   - No regional bias

## Where This Order Applies

### Mobile App
- ✅ Language Selection Screen
- ✅ Content Generation
- ✅ Audio Guide Options
- ✅ Settings Menu

### Admin Portal
- ✅ Content Generation Page
- ✅ Language Filters
- ✅ Reports and Analytics
- ✅ User Management

### Documentation
- ✅ Requirements Documents
- ✅ User Guides
- ✅ API Documentation
- ✅ Architecture Documents
- ✅ README files

### Backend/Database
- ✅ Language Code Enums
- ✅ Content Tables
- ✅ API Responses
- ✅ Configuration Files

### Code
- ✅ Language Constants
- ✅ Dropdown Options
- ✅ Enum Definitions
- ✅ Type Definitions

## Implementation Examples

### TypeScript/JavaScript
```typescript
const LANGUAGES = [
  { code: 'en', name: 'English', native: 'English' },
  { code: 'hi', name: 'Hindi', native: 'हिंदी' },
  { code: 'te', name: 'Telugu', native: 'తెలుగు' },
  { code: 'bn', name: 'Bengali', native: 'বাংলা' },
  { code: 'gu', name: 'Gujarati', native: 'ગુજરાતી' },
  { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ' },
  { code: 'ml', name: 'Malayalam', native: 'മലയാളം' },
  { code: 'mr', name: 'Marathi', native: 'मराठी' },
  { code: 'pa', name: 'Punjabi', native: 'ਪੰਜਾਬੀ' },
  { code: 'ta', name: 'Tamil', native: 'தமிழ்' },
];
```

### Python
```python
LANGUAGES = [
    ('en', 'English'),
    ('hi', 'Hindi'),
    ('te', 'Telugu'),
    ('bn', 'Bengali'),
    ('gu', 'Gujarati'),
    ('kn', 'Kannada'),
    ('ml', 'Malayalam'),
    ('mr', 'Marathi'),
    ('pa', 'Punjabi'),
    ('ta', 'Tamil'),
]
```

### HTML/React Select
```jsx
<select>
  <option value="en">English</option>
  <option value="hi">Hindi</option>
  <option value="te">Telugu</option>
  <option value="bn">Bengali</option>
  <option value="gu">Gujarati</option>
  <option value="kn">Kannada</option>
  <option value="ml">Malayalam</option>
  <option value="mr">Marathi</option>
  <option value="pa">Punjabi</option>
  <option value="ta">Tamil</option>
</select>
```

### JSON Configuration
```json
{
  "supportedLanguages": [
    "en", "hi", "te", "bn", "gu", "kn", "ml", "mr", "pa", "ta"
  ]
}
```

## Language Codes (ISO 639-1)

| Code | Language | Native Script |
|------|----------|---------------|
| en | English | English |
| hi | Hindi | हिंदी |
| te | Telugu | తెలుగు |
| bn | Bengali | বাংলা |
| gu | Gujarati | ગુજરાતી |
| kn | Kannada | ಕನ್ನಡ |
| ml | Malayalam | മലയാളം |
| mr | Marathi | मराठी |
| pa | Punjabi | ਪੰਜਾਬੀ |
| ta | Tamil | தமிழ் |

## Consistency Checklist

When adding language support anywhere in the project, verify:

- [ ] Languages are in the correct order (English, Hindi, Telugu, then alphabetical)
- [ ] All 10 languages are included
- [ ] Language codes match ISO 639-1 standard
- [ ] Native scripts are correctly displayed
- [ ] No duplicate entries
- [ ] Order is consistent with this document

## Future Language Additions

If adding new languages in the future:

1. Add English, Hindi, Telugu at the top (if not already present)
2. Insert new language in alphabetical position among the "other languages"
3. Update this document
4. Update all implementations across the project
5. Maintain consistency everywhere

## References

- ISO 639-1 Language Codes: https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes
- Indian Languages: https://en.wikipedia.org/wiki/Languages_of_India
- Unicode Scripts: https://unicode.org/charts/

## Version History

- v1.0 (2026-02-27): Initial standard established
  - Priority: English, Hindi, Telugu
  - Others: Alphabetical order
  - Total: 10 languages supported


## Sanskrit (संस्कृतम्) - Special Considerations

### Why Sanskrit is Important
- Sacred language of Hindu scriptures (Vedas, Upanishads, Puranas)
- Temple inscriptions and slokas are in Sanskrit
- Mantras and prayers are in Sanskrit
- Historical and cultural authenticity

### AWS Support Limitations

#### ❌ Not Supported by AWS:
- **Amazon Polly** (Text-to-Speech): No Sanskrit voice available
- **Amazon Transcribe** (Speech-to-Text): No Sanskrit support

#### ✅ Supported by AWS:
- **Amazon Bedrock** (AI Text Generation): Can generate Sanskrit text
- **Amazon Translate**: Limited/experimental Sanskrit support

### Implementation Strategy

#### Phase 1: Text-Only Sanskrit (Current)
- Generate Sanskrit text using Amazon Bedrock
- Display as text content in app
- Show slokas, mantras, inscriptions
- Infographics with Sanskrit text
- No audio initially

#### Phase 2: Third-Party Audio (Future)
- Integrate Google Cloud Text-to-Speech (has Sanskrit support)
- Or use specialized Sanskrit TTS services like:
  - IIT Madras Sanskrit TTS
  - CDAC Sanskrit TTS
  - Bhashini (Government of India)
- Hybrid approach: AWS for other languages, third-party for Sanskrit

#### Phase 3: Full Integration (Long-term)
- Wait for AWS to add Sanskrit support
- Or build custom Sanskrit TTS model
- Train on Sanskrit audio corpus

### Content Types by Language

| Content Type | Sanskrit Support | Notes |
|--------------|------------------|-------|
| Text Content | ✅ Full | Via Bedrock AI |
| Infographics | ✅ Full | Text overlays |
| Q&A Chat | ✅ Full | Text responses |
| Audio Guide | ⚠️ Limited | Requires third-party TTS |
| Video Narration | ⚠️ Limited | Requires third-party TTS |

### User Experience

When user selects Sanskrit:
1. Show note: "Sanskrit (संस्कृतम्) - Text only"
2. Provide rich text content with slokas and mantras
3. Display transliteration in Roman script
4. Offer audio in alternative language (English/Hindi)
5. Future: Enable audio when third-party TTS integrated

### Alternative Solutions

**Option A: Hybrid Language**
- Sanskrit text + English/Hindi audio
- Best of both worlds
- User reads Sanskrit, hears translation

**Option B: Transliteration**
- Provide Sanskrit in Devanagari script
- Also provide Roman transliteration (IAST)
- Easier for non-native readers

**Option C: Recorded Audio**
- Pre-record Sanskrit audio by Sanskrit scholars
- Higher quality than TTS
- More authentic pronunciation
- Limited scalability

### Recommended Approach

For Sanaathana Aalaya Charithra:

1. **Now**: Add Sanskrit as text-only language
2. **Phase 2**: Integrate Google Cloud TTS for Sanskrit audio
3. **Phase 3**: Consider pre-recorded audio for important slokas
4. **Long-term**: Build custom Sanskrit TTS if needed

### Code Example: Handling Sanskrit

```typescript
const generateContent = async (language: string, artifactId: string) => {
  if (language === 'sa') {
    // Sanskrit - text only
    const text = await generateSanskritText(artifactId);
    return {
      type: 'text',
      content: text,
      hasAudio: false,
      note: 'Audio not available for Sanskrit',
    };
  } else {
    // Other languages - full support
    const text = await generateText(language, artifactId);
    const audio = await generateAudio(language, text);
    return {
      type: 'audio',
      content: text,
      audioUrl: audio,
      hasAudio: true,
    };
  }
};
```

### Resources

- Google Cloud TTS Sanskrit: https://cloud.google.com/text-to-speech/docs/voices
- Bhashini (Govt of India): https://bhashini.gov.in/
- IIT Madras TTS: https://www.iitm.ac.in/donlab/tts/
- Sanskrit Computing: https://sanskrit.uohyd.ac.in/

