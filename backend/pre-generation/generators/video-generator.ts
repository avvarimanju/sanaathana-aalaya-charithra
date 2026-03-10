// Video Generator for Pre-Generation System
// Uses AWS Bedrock to generate video scripts/storyboards

import {
  BedrockRuntimeClient,
  InvokeModelCommand,
  InvokeModelCommandInput,
} from '@aws-sdk/client-bedrock-runtime';
import { ArtifactMetadata, Language, PreGenerationConfig } from '../types';

/**
 * VideoGenerator generates video content metadata and scripts using AWS Bedrock
 * 
 * Specifications:
 * - Format: MP4 (H.264)
 * - Resolution: 1920x1080 (1080p)
 * - Frame rate: 30 fps
 * - Bitrate: 5 Mbps
 * - Target duration: 120-300 seconds
 * - Language-appropriate content generation
 * 
 * Note: AWS Bedrock doesn't directly generate video files. This implementation
 * generates detailed video scripts and storyboards that can be used with video
 * generation services, or creates placeholder video metadata with proper format
 * specifications for the pre-generation system.
 */
export class VideoGenerator {
  private bedrockClient: BedrockRuntimeClient;
  private config: PreGenerationConfig;

  // Video format specifications
  private readonly VIDEO_SPECS = {
    format: 'mp4',
    codec: 'h264',
    resolution: { width: 1920, height: 1080 },
    frameRate: 30,
    bitrate: 5000000, // 5 Mbps in bits per second
    minDuration: 120, // seconds
    maxDuration: 300, // seconds
  };

  constructor(config: PreGenerationConfig) {
    this.config = config;
    this.bedrockClient = new BedrockRuntimeClient({
      region: config.aws.region,
    });
  }

  /**
   * Generate video content for an artifact in a specific language
   * @param artifact - Artifact metadata
   * @param language - Target language
   * @returns Video script and metadata as Buffer (JSON format)
   */
  async generateVideo(
    artifact: ArtifactMetadata,
    language: Language
  ): Promise<Buffer> {
    // Generate the video script and storyboard using Bedrock
    const videoContent = await this.generateVideoScript(artifact, language);

    // Convert to JSON buffer for storage
    const jsonContent = JSON.stringify(videoContent, null, 2);
    return Buffer.from(jsonContent, 'utf-8');
  }

  /**
   * Generate video script and storyboard using AWS Bedrock
   * @param artifact - Artifact metadata
   * @param language - Target language
   * @returns Video content structure
   */
  private async generateVideoScript(
    artifact: ArtifactMetadata,
    language: Language
  ): Promise<VideoContent> {
    const prompt = this.buildPrompt(artifact, language);
    const response = await this.invokeBedrockModel(prompt);

    // Parse the response and structure it
    const videoContent: VideoContent = {
      artifactId: artifact.artifactId,
      language,
      title: artifact.name,
      duration: this.calculateTargetDuration(),
      format: this.VIDEO_SPECS,
      script: this.parseScript(response),
      storyboard: this.parseStoryboard(response),
      metadata: {
        generatedAt: new Date().toISOString(),
        modelId: this.config.aws.bedrock.modelId,
        language,
        templeGroup: artifact.templeGroup,
      },
    };

    return videoContent;
  }

  /**
   * Build the prompt for Bedrock to generate video script
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
    const targetDuration = this.calculateTargetDuration();

    return `You are creating a video script for a heritage site artifact. Generate a detailed video script and storyboard in ${targetLanguage}.

Artifact Information:
- Name: ${artifact.name}
- Type: ${artifact.type}
- Temple Group: ${artifact.templeGroup}
- Description: ${artifact.description}
- Historical Context: ${artifact.historicalContext}
- Cultural Significance: ${artifact.culturalSignificance}

Requirements:
- Target duration: ${targetDuration} seconds (${Math.floor(targetDuration / 60)} minutes)
- Language: ${targetLanguage}
- Format: Educational and engaging video for heritage site visitors
- Include visual descriptions for each scene
- Include narration text for voiceover

Please provide:
1. A complete narration script with timestamps
2. A storyboard with 8-12 scenes describing visual elements
3. Suggested camera angles and transitions

Format your response as:

NARRATION SCRIPT:
[Provide timestamped narration text]

STORYBOARD:
Scene 1 (0:00-0:15): [Visual description]
Scene 2 (0:15-0:30): [Visual description]
[Continue for all scenes]

PRODUCTION NOTES:
[Any additional notes about camera work, transitions, or visual effects]`;
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
   * Parse the narration script from Bedrock response
   * @param response - Bedrock response text
   * @returns Structured script with timestamps
   */
  private parseScript(response: string): ScriptSegment[] {
    const scriptSection = this.extractSection(response, 'NARRATION SCRIPT:', 'STORYBOARD:');
    const segments: ScriptSegment[] = [];

    // Parse timestamped segments
    const lines = scriptSection.split('\n').filter(line => line.trim());
    
    for (const line of lines) {
      // Look for timestamp patterns like [0:00-0:15] or (0:00-0:15)
      const timestampMatch = line.match(/[\[\(](\d+:\d+)-(\d+:\d+)[\]\)]/);
      
      if (timestampMatch) {
        const startTime = this.parseTimestamp(timestampMatch[1]);
        const endTime = this.parseTimestamp(timestampMatch[2]);
        const text = line.replace(timestampMatch[0], '').trim();

        segments.push({
          startTime,
          endTime,
          text,
        });
      }
    }

    // If no timestamps found, create default segments
    if (segments.length === 0) {
      const targetDuration = this.calculateTargetDuration();
      segments.push({
        startTime: 0,
        endTime: targetDuration,
        text: scriptSection.trim(),
      });
    }

    return segments;
  }

  /**
   * Parse the storyboard from Bedrock response
   * @param response - Bedrock response text
   * @returns Structured storyboard scenes
   */
  private parseStoryboard(response: string): StoryboardScene[] {
    const storyboardSection = this.extractSection(response, 'STORYBOARD:', 'PRODUCTION NOTES:');
    const scenes: StoryboardScene[] = [];

    // Parse scene descriptions
    const sceneMatches = storyboardSection.matchAll(/Scene\s+(\d+)\s*[\(\[]([^)\]]+)[\)\]]:\s*(.+?)(?=Scene\s+\d+|$)/gs);
    
    let sceneNumber = 1;
    for (const match of sceneMatches) {
      const timeRange = match[2].trim();
      const description = match[3].trim();
      
      const timeMatch = timeRange.match(/(\d+:\d+)-(\d+:\d+)/);
      if (timeMatch) {
        scenes.push({
          sceneNumber,
          startTime: this.parseTimestamp(timeMatch[1]),
          endTime: this.parseTimestamp(timeMatch[2]),
          description,
          visualElements: this.extractVisualElements(description),
        });
        sceneNumber++;
      }
    }

    // If no scenes found, create default scenes
    if (scenes.length === 0) {
      const targetDuration = this.calculateTargetDuration();
      const sceneDuration = targetDuration / 8; // Default 8 scenes

      for (let i = 0; i < 8; i++) {
        scenes.push({
          sceneNumber: i + 1,
          startTime: i * sceneDuration,
          endTime: (i + 1) * sceneDuration,
          description: `Scene ${i + 1}: Visual representation of the artifact`,
          visualElements: ['artifact view', 'details', 'context'],
        });
      }
    }

    return scenes;
  }

  /**
   * Extract a section from the response text
   * @param text - Full response text
   * @param startMarker - Section start marker
   * @param endMarker - Section end marker
   * @returns Extracted section text
   */
  private extractSection(text: string, startMarker: string, endMarker: string): string {
    const startIndex = text.indexOf(startMarker);
    if (startIndex === -1) return '';

    const contentStart = startIndex + startMarker.length;
    const endIndex = text.indexOf(endMarker, contentStart);
    
    if (endIndex === -1) {
      return text.substring(contentStart).trim();
    }

    return text.substring(contentStart, endIndex).trim();
  }

  /**
   * Parse timestamp string to seconds
   * @param timestamp - Timestamp string (e.g., "1:30" or "0:15")
   * @returns Time in seconds
   */
  private parseTimestamp(timestamp: string): number {
    const parts = timestamp.split(':').map(p => parseInt(p, 10));
    if (parts.length === 2) {
      return parts[0] * 60 + parts[1];
    }
    return 0;
  }

  /**
   * Extract visual elements from scene description
   * @param description - Scene description text
   * @returns Array of visual element keywords
   */
  private extractVisualElements(description: string): string[] {
    const elements: string[] = [];
    const keywords = [
      'close-up', 'wide shot', 'pan', 'zoom', 'detail', 'overview',
      'architecture', 'sculpture', 'inscription', 'carving', 'pillar',
      'temple', 'shrine', 'deity', 'ornament', 'pattern',
    ];

    const lowerDesc = description.toLowerCase();
    for (const keyword of keywords) {
      if (lowerDesc.includes(keyword)) {
        elements.push(keyword);
      }
    }

    return elements.length > 0 ? elements : ['general view'];
  }

  /**
   * Calculate target duration within the specified range
   * @returns Target duration in seconds
   */
  private calculateTargetDuration(): number {
    // Use middle of the range (120-300 seconds)
    const minDuration = this.VIDEO_SPECS.minDuration;
    const maxDuration = this.VIDEO_SPECS.maxDuration;
    return Math.floor((minDuration + maxDuration) / 2);
  }

  /**
   * Estimate the video file size based on specifications
   * @param duration - Video duration in seconds
   * @returns Estimated file size in bytes
   */
  estimateFileSize(duration: number): number {
    // File size = (bitrate * duration) / 8
    // bitrate is in bits per second, convert to bytes
    return Math.floor((this.VIDEO_SPECS.bitrate * duration) / 8);
  }

  /**
   * Validate that the video content meets specifications
   * @param videoContent - Video content structure
   * @returns True if valid
   */
  validateVideoContent(videoContent: VideoContent): boolean {
    // Check duration is within range
    if (videoContent.duration < this.VIDEO_SPECS.minDuration ||
        videoContent.duration > this.VIDEO_SPECS.maxDuration) {
      return false;
    }

    // Check script exists and has content
    if (!videoContent.script || videoContent.script.length === 0) {
      return false;
    }

    // Check storyboard exists and has minimum scenes
    if (!videoContent.storyboard || videoContent.storyboard.length < 5) {
      return false;
    }

    return true;
  }

  /**
   * Get video format specifications
   * @returns Video format specs
   */
  getVideoSpecs() {
    return { ...this.VIDEO_SPECS };
  }
}

// ============================================================================
// Type Definitions
// ============================================================================

interface VideoContent {
  artifactId: string;
  language: Language;
  title: string;
  duration: number;
  format: {
    format: string;
    codec: string;
    resolution: { width: number; height: number };
    frameRate: number;
    bitrate: number;
    minDuration: number;
    maxDuration: number;
  };
  script: ScriptSegment[];
  storyboard: StoryboardScene[];
  metadata: {
    generatedAt: string;
    modelId: string;
    language: Language;
    templeGroup: string;
  };
}

interface ScriptSegment {
  startTime: number;
  endTime: number;
  text: string;
}

interface StoryboardScene {
  sceneNumber: number;
  startTime: number;
  endTime: number;
  description: string;
  visualElements: string[];
}
