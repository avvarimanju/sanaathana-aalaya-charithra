// Infographic Generator for Pre-Generation System
// Uses AWS Bedrock to generate infographic content specifications

import {
  BedrockRuntimeClient,
  InvokeModelCommand,
  InvokeModelCommandInput,
} from '@aws-sdk/client-bedrock-runtime';
import { ArtifactMetadata, Language, PreGenerationConfig } from '../types';

/**
 * InfographicGenerator generates infographic content specifications using AWS Bedrock
 * 
 * Specifications:
 * - Format: PNG
 * - Resolution: 1920x1080 minimum
 * - Color depth: 24-bit
 * - Compression: Lossless
 * - Language-appropriate content generation
 * 
 * Note: AWS Bedrock doesn't directly generate image files. This implementation
 * generates detailed infographic designs and specifications that can be used with
 * image generation services, or creates structured data describing the infographic
 * layout and content for the pre-generation system.
 */
export class InfographicGenerator {
  private bedrockClient: BedrockRuntimeClient;
  private config: PreGenerationConfig;

  // Infographic format specifications
  private readonly INFOGRAPHIC_SPECS = {
    format: 'png',
    minResolution: { width: 1920, height: 1080 },
    colorDepth: 24, // 24-bit color
    compression: 'lossless',
  };

  constructor(config: PreGenerationConfig) {
    this.config = config;
    this.bedrockClient = new BedrockRuntimeClient({
      region: config.aws.region,
    });
  }

  /**
   * Generate infographic content for an artifact in a specific language
   * @param artifact - Artifact metadata
   * @param language - Target language
   * @returns Infographic specification as Buffer (JSON format)
   */
  async generateInfographic(
    artifact: ArtifactMetadata,
    language: Language
  ): Promise<Buffer> {
    // Generate the infographic design and content using Bedrock
    const infographicContent = await this.generateInfographicDesign(artifact, language);

    // Convert to JSON buffer for storage
    const jsonContent = JSON.stringify(infographicContent, null, 2);
    return Buffer.from(jsonContent, 'utf-8');
  }

  /**
   * Generate infographic design and content using AWS Bedrock
   * @param artifact - Artifact metadata
   * @param language - Target language
   * @returns Infographic content structure
   */
  private async generateInfographicDesign(
    artifact: ArtifactMetadata,
    language: Language
  ): Promise<InfographicContent> {
    const prompt = this.buildPrompt(artifact, language);
    const response = await this.invokeBedrockModel(prompt);

    // Parse the response and structure it
    const infographicContent: InfographicContent = {
      artifactId: artifact.artifactId,
      language,
      title: artifact.name,
      format: this.INFOGRAPHIC_SPECS,
      layout: this.parseLayout(response),
      sections: this.parseSections(response),
      visualElements: this.parseVisualElements(response),
      colorScheme: this.parseColorScheme(response),
      typography: this.parseTypography(response),
      metadata: {
        generatedAt: new Date().toISOString(),
        modelId: this.config.aws.bedrock.modelId,
        language,
        templeGroup: artifact.templeGroup,
      },
    };

    return infographicContent;
  }

  /**
   * Build the prompt for Bedrock to generate infographic design
   * @param artifact - Artifact metadata
   * @param language - Target language
   * @returns Prompt text
   */
  private buildPrompt(artifact: ArtifactMetadata, language: Language): string {
    const languageNames: Record<Language, string> = {
      [Language.ENGLISH]: 'English',
      [Language.HINDI]: 'Hindi',
      [Language.TAMIL]: 'Tamil',
      [Language.TELUGU]: 'Telugu',
      [Language.BENGALI]: 'Bengali',
      [Language.MARATHI]: 'Marathi',
      [Language.GUJARATI]: 'Gujarati',
      [Language.KANNADA]: 'Kannada',
      [Language.MALAYALAM]: 'Malayalam',
      [Language.PUNJABI]: 'Punjabi',
    };

    const targetLanguage = languageNames[language];

    return `You are creating an infographic design for a heritage site artifact. Generate a detailed infographic specification in ${targetLanguage}.

Artifact Information:
- Name: ${artifact.name}
- Type: ${artifact.type}
- Temple Group: ${artifact.templeGroup}
- Description: ${artifact.description}
- Historical Context: ${artifact.historicalContext}
- Cultural Significance: ${artifact.culturalSignificance}

Requirements:
- Resolution: 1920x1080 pixels (landscape orientation)
- Language: ${targetLanguage}
- Format: Educational and visually engaging infographic for heritage site visitors
- Include key facts, timeline, and visual hierarchy
- Use culturally appropriate colors and design elements

Please provide:
1. Layout structure with sections and positioning
2. Content sections with headings and text
3. Visual elements (icons, illustrations, diagrams)
4. Color scheme (primary, secondary, accent colors)
5. Typography specifications (fonts, sizes, weights)

Format your response as:

LAYOUT:
[Describe the overall layout structure, grid system, and section positioning]

SECTIONS:
Section 1: [Title]
Position: [x, y, width, height]
Content: [Text content]

Section 2: [Title]
Position: [x, y, width, height]
Content: [Text content]

[Continue for all sections]

VISUAL ELEMENTS:
Element 1: [Type] - [Description] - Position: [x, y]
Element 2: [Type] - [Description] - Position: [x, y]
[Continue for all elements]

COLOR SCHEME:
Primary: [Color name/hex]
Secondary: [Color name/hex]
Accent: [Color name/hex]
Background: [Color name/hex]
Text: [Color name/hex]

TYPOGRAPHY:
Heading Font: [Font name] - Size: [size]px - Weight: [weight]
Body Font: [Font name] - Size: [size]px - Weight: [weight]
Caption Font: [Font name] - Size: [size]px - Weight: [weight]`;
  }

  /**
   * Invoke AWS Bedrock model to generate content
   * @param prompt - Input prompt
   * @returns Generated text response
   */
  private async invokeBedrockModel(prompt: string): Promise<string> {
    const payload = {
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: this.config.aws.bedrock.maxTokens,
      temperature: this.config.aws.bedrock.temperature,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    };

    const input: InvokeModelCommandInput = {
      modelId: this.config.aws.bedrock.modelId,
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify(payload),
    };

    const command = new InvokeModelCommand(input);
    const response = await this.bedrockClient.send(command);

    if (!response.body) {
      throw new Error('No response body from Bedrock');
    }

    // Parse the response
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    
    if (!responseBody.content || !responseBody.content[0] || !responseBody.content[0].text) {
      throw new Error('Invalid response format from Bedrock');
    }

    return responseBody.content[0].text;
  }

  /**
   * Parse the layout structure from Bedrock response
   * @param response - Bedrock response text
   * @returns Layout structure
   */
  private parseLayout(response: string): LayoutStructure {
    const layoutSection = this.extractSection(response, 'LAYOUT:', 'SECTIONS:');
    
    return {
      orientation: 'landscape',
      width: this.INFOGRAPHIC_SPECS.minResolution.width,
      height: this.INFOGRAPHIC_SPECS.minResolution.height,
      gridSystem: this.extractGridSystem(layoutSection),
      description: layoutSection.trim(),
    };
  }

  /**
   * Extract grid system information from layout description
   * @param layoutText - Layout description text
   * @returns Grid system specification
   */
  private extractGridSystem(layoutText: string): string {
    // Look for grid-related keywords
    const gridKeywords = ['grid', 'column', 'row', '3-column', '2-column', 'thirds', 'quarters'];
    const lowerText = layoutText.toLowerCase();
    
    for (const keyword of gridKeywords) {
      if (lowerText.includes(keyword)) {
        return keyword;
      }
    }
    
    return '3-column'; // Default grid system
  }

  /**
   * Parse content sections from Bedrock response
   * @param response - Bedrock response text
   * @returns Array of content sections
   */
  private parseSections(response: string): ContentSection[] {
    const sectionsText = this.extractSection(response, 'SECTIONS:', 'VISUAL ELEMENTS:');
    const sections: ContentSection[] = [];

    // Parse section blocks
    const sectionMatches = sectionsText.matchAll(/Section\s+(\d+):\s*(.+?)\nPosition:\s*(.+?)\nContent:\s*(.+?)(?=Section\s+\d+:|$)/gs);
    
    let sectionNumber = 1;
    for (const match of sectionMatches) {
      const title = match[2].trim();
      const positionStr = match[3].trim();
      const content = match[4].trim();
      
      const position = this.parsePosition(positionStr);
      
      sections.push({
        sectionNumber,
        title,
        position,
        content,
        type: this.inferSectionType(title, content),
      });
      sectionNumber++;
    }

    // If no sections found, create default sections
    if (sections.length === 0) {
      sections.push(
        {
          sectionNumber: 1,
          title: 'Overview',
          position: { x: 50, y: 100, width: 800, height: 200 },
          content: 'Artifact overview and introduction',
          type: 'header',
        },
        {
          sectionNumber: 2,
          title: 'Historical Context',
          position: { x: 50, y: 350, width: 550, height: 300 },
          content: 'Historical background and significance',
          type: 'text',
        },
        {
          sectionNumber: 3,
          title: 'Key Facts',
          position: { x: 650, y: 350, width: 550, height: 300 },
          content: 'Important facts and details',
          type: 'facts',
        },
        {
          sectionNumber: 4,
          title: 'Cultural Significance',
          position: { x: 50, y: 700, width: 1150, height: 250 },
          content: 'Cultural importance and legacy',
          type: 'text',
        }
      );
    }

    return sections;
  }

  /**
   * Parse position string to coordinates
   * @param positionStr - Position string (e.g., "50, 100, 800, 200" or "x:50, y:100, w:800, h:200")
   * @returns Position object
   */
  private parsePosition(positionStr: string): Position {
    // Try to extract numbers from various formats
    const numbers = positionStr.match(/\d+/g);
    
    if (numbers && numbers.length >= 4) {
      return {
        x: parseInt(numbers[0], 10),
        y: parseInt(numbers[1], 10),
        width: parseInt(numbers[2], 10),
        height: parseInt(numbers[3], 10),
      };
    }

    // Default position
    return { x: 0, y: 0, width: 400, height: 300 };
  }

  /**
   * Infer section type from title and content
   * @param title - Section title
   * @param content - Section content
   * @returns Section type
   */
  private inferSectionType(title: string, content: string): string {
    const lowerTitle = title.toLowerCase();
    const lowerContent = content.toLowerCase();
    
    if (lowerTitle.includes('timeline') || lowerContent.includes('timeline')) {
      return 'timeline';
    }
    if (lowerTitle.includes('fact') || lowerTitle.includes('statistic')) {
      return 'facts';
    }
    if (lowerTitle.includes('overview') || lowerTitle.includes('introduction')) {
      return 'header';
    }
    if (lowerTitle.includes('diagram') || lowerTitle.includes('chart')) {
      return 'diagram';
    }
    
    return 'text';
  }

  /**
   * Parse visual elements from Bedrock response
   * @param response - Bedrock response text
   * @returns Array of visual elements
   */
  private parseVisualElements(response: string): VisualElement[] {
    const elementsText = this.extractSection(response, 'VISUAL ELEMENTS:', 'COLOR SCHEME:');
    const elements: VisualElement[] = [];

    // Parse element descriptions
    const elementMatches = elementsText.matchAll(/Element\s+(\d+):\s*(.+?)\s*-\s*(.+?)\s*-\s*Position:\s*(.+?)(?=Element\s+\d+:|$)/gs);
    
    let elementNumber = 1;
    for (const match of elementMatches) {
      const type = match[2].trim();
      const description = match[3].trim();
      const positionStr = match[4].trim();
      
      const position = this.parseSimplePosition(positionStr);
      
      elements.push({
        elementNumber,
        type,
        description,
        position,
      });
      elementNumber++;
    }

    // If no elements found, create default elements
    if (elements.length === 0) {
      elements.push(
        {
          elementNumber: 1,
          type: 'icon',
          description: 'Heritage site icon',
          position: { x: 100, y: 50 },
        },
        {
          elementNumber: 2,
          type: 'illustration',
          description: 'Artifact illustration',
          position: { x: 1400, y: 400 },
        },
        {
          elementNumber: 3,
          type: 'decorative',
          description: 'Cultural pattern border',
          position: { x: 0, y: 0 },
        }
      );
    }

    return elements;
  }

  /**
   * Parse simple position (x, y only)
   * @param positionStr - Position string
   * @returns Simple position object
   */
  private parseSimplePosition(positionStr: string): { x: number; y: number } {
    const numbers = positionStr.match(/\d+/g);
    
    if (numbers && numbers.length >= 2) {
      return {
        x: parseInt(numbers[0], 10),
        y: parseInt(numbers[1], 10),
      };
    }

    return { x: 0, y: 0 };
  }

  /**
   * Parse color scheme from Bedrock response
   * @param response - Bedrock response text
   * @returns Color scheme
   */
  private parseColorScheme(response: string): ColorScheme {
    const colorText = this.extractSection(response, 'COLOR SCHEME:', 'TYPOGRAPHY:');
    
    const extractColor = (label: string): string => {
      const regex = new RegExp(`${label}:\\s*(.+?)(?=\\n|$)`, 'i');
      const match = colorText.match(regex);
      return match ? match[1].trim() : '';
    };

    return {
      primary: extractColor('Primary') || '#8B4513', // Saddle brown (temple color)
      secondary: extractColor('Secondary') || '#DAA520', // Goldenrod
      accent: extractColor('Accent') || '#FF6347', // Tomato
      background: extractColor('Background') || '#FFF8DC', // Cornsilk
      text: extractColor('Text') || '#2F4F4F', // Dark slate gray
    };
  }

  /**
   * Parse typography specifications from Bedrock response
   * @param response - Bedrock response text
   * @returns Typography specifications
   */
  private parseTypography(response: string): Typography {
    const typoText = this.extractSection(response, 'TYPOGRAPHY:', '');
    
    const extractFont = (label: string): FontSpec => {
      const regex = new RegExp(`${label}\\s+Font:\\s*(.+?)\\s*-\\s*Size:\\s*(\\d+)px\\s*-\\s*Weight:\\s*(\\w+)`, 'i');
      const match = typoText.match(regex);
      
      if (match) {
        return {
          fontFamily: match[1].trim(),
          fontSize: parseInt(match[2], 10),
          fontWeight: match[3].trim(),
        };
      }
      
      // Defaults
      return {
        fontFamily: 'Arial',
        fontSize: label === 'Heading' ? 36 : label === 'Body' ? 18 : 14,
        fontWeight: label === 'Heading' ? 'bold' : 'normal',
      };
    };

    return {
      heading: extractFont('Heading'),
      body: extractFont('Body'),
      caption: extractFont('Caption'),
    };
  }

  /**
   * Extract a section from the response text
   * @param text - Full response text
   * @param startMarker - Section start marker
   * @param endMarker - Section end marker (empty string for end of text)
   * @returns Extracted section text
   */
  private extractSection(text: string, startMarker: string, endMarker: string): string {
    const startIndex = text.indexOf(startMarker);
    if (startIndex === -1) return '';

    const contentStart = startIndex + startMarker.length;
    
    if (!endMarker) {
      return text.substring(contentStart).trim();
    }
    
    const endIndex = text.indexOf(endMarker, contentStart);
    
    if (endIndex === -1) {
      return text.substring(contentStart).trim();
    }

    return text.substring(contentStart, endIndex).trim();
  }

  /**
   * Estimate the infographic file size
   * @returns Estimated file size in bytes
   */
  estimateFileSize(): number {
    // PNG file size estimation for 1920x1080 24-bit image
    // Uncompressed: width * height * 3 bytes (RGB)
    // With lossless compression, typically 30-50% of uncompressed size
    const uncompressed = this.INFOGRAPHIC_SPECS.minResolution.width * 
                        this.INFOGRAPHIC_SPECS.minResolution.height * 3;
    return Math.floor(uncompressed * 0.4); // 40% compression ratio
  }

  /**
   * Validate that the infographic content meets specifications
   * @param infographicContent - Infographic content structure
   * @returns True if valid
   */
  validateInfographicContent(infographicContent: InfographicContent): boolean {
    // Check layout exists
    if (!infographicContent.layout) {
      return false;
    }

    // Check minimum resolution
    if (infographicContent.layout.width < this.INFOGRAPHIC_SPECS.minResolution.width ||
        infographicContent.layout.height < this.INFOGRAPHIC_SPECS.minResolution.height) {
      return false;
    }

    // Check sections exist and have content
    if (!infographicContent.sections || infographicContent.sections.length < 3) {
      return false;
    }

    // Check visual elements exist
    if (!infographicContent.visualElements || infographicContent.visualElements.length === 0) {
      return false;
    }

    // Check color scheme is defined
    if (!infographicContent.colorScheme || !infographicContent.colorScheme.primary) {
      return false;
    }

    return true;
  }

  /**
   * Get infographic format specifications
   * @returns Infographic format specs
   */
  getInfographicSpecs() {
    return { ...this.INFOGRAPHIC_SPECS };
  }
}

// ============================================================================
// Type Definitions
// ============================================================================

interface InfographicContent {
  artifactId: string;
  language: Language;
  title: string;
  format: {
    format: string;
    minResolution: { width: number; height: number };
    colorDepth: number;
    compression: string;
  };
  layout: LayoutStructure;
  sections: ContentSection[];
  visualElements: VisualElement[];
  colorScheme: ColorScheme;
  typography: Typography;
  metadata: {
    generatedAt: string;
    modelId: string;
    language: Language;
    templeGroup: string;
  };
}

interface LayoutStructure {
  orientation: 'landscape' | 'portrait';
  width: number;
  height: number;
  gridSystem: string;
  description: string;
}

interface ContentSection {
  sectionNumber: number;
  title: string;
  position: Position;
  content: string;
  type: string; // 'header', 'text', 'facts', 'timeline', 'diagram'
}

interface Position {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface VisualElement {
  elementNumber: number;
  type: string; // 'icon', 'illustration', 'diagram', 'decorative'
  description: string;
  position: { x: number; y: number };
}

interface ColorScheme {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
}

interface Typography {
  heading: FontSpec;
  body: FontSpec;
  caption: FontSpec;
}

interface FontSpec {
  fontFamily: string;
  fontSize: number;
  fontWeight: string;
}
