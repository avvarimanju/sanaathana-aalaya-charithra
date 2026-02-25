// Audio Guide Generator for Pre-Generation System
// Uses AWS Polly for text-to-speech synthesis

import {
  PollyClient,
  SynthesizeSpeechCommand,
  SynthesizeSpeechCommandInput,
  VoiceId,
  Engine,
  OutputFormat,
} from '@aws-sdk/client-polly';
import { ArtifactMetadata, Language, PreGenerationConfig } from '../types';

/**
 * AudioGuideGenerator generates audio guides using AWS Polly text-to-speech
 * 
 * Specifications:
 * - Format: MP3, 128 kbps
 * - Sample rate: 44.1 kHz (22050 Hz for Polly)
 * - Channels: Mono
 * - Target duration: 60-180 seconds
 * - Language-appropriate voice profiles from configuration
 */
export class AudioGuideGenerator {
  private pollyClient: PollyClient;
  private config: PreGenerationConfig;

  // Voice ID mapping for supported languages
  private readonly VOICE_MAPPING: Record<Language, VoiceId> = {
    [Language.ENGLISH]: 'Joanna' as VoiceId,
    [Language.HINDI]: 'Aditi' as VoiceId,
    [Language.TAMIL]: 'Kajal' as VoiceId,
    [Language.TELUGU]: 'Kajal' as VoiceId,
    [Language.BENGALI]: 'Kajal' as VoiceId,
    [Language.MARATHI]: 'Kajal' as VoiceId,
    [Language.GUJARATI]: 'Kajal' as VoiceId,
    [Language.KANNADA]: 'Kajal' as VoiceId,
    [Language.MALAYALAM]: 'Kajal' as VoiceId,
    [Language.PUNJABI]: 'Kajal' as VoiceId,
  };

  constructor(config: PreGenerationConfig) {
    this.config = config;
    this.pollyClient = new PollyClient({
      region: config.aws.region,
    });
  }

  /**
   * Generate audio guide for an artifact in a specific language
   * @param artifact - Artifact metadata
   * @param language - Target language
   * @returns Audio content as Buffer (MP3 format)
   */
  async generateAudioGuide(
    artifact: ArtifactMetadata,
    language: Language
  ): Promise<Buffer> {
    // Generate the script for the audio guide
    const script = this.generateScript(artifact, language);

    // Get voice ID for the language
    const voiceId = this.getVoiceId(language);

    // Determine engine (neural or standard) based on voice capabilities
    const engine = this.getEngine(language, voiceId);

    // Synthesize speech using AWS Polly
    const audioBuffer = await this.synthesizeSpeech(script, voiceId, engine);

    return audioBuffer;
  }

  /**
   * Generate the script text for the audio guide
   * @param artifact - Artifact metadata
   * @param language - Target language
   * @returns Script text
   */
  private generateScript(artifact: ArtifactMetadata, language: Language): string {
    // For now, we'll create a simple script from the artifact metadata
    // In a production system, this would use AWS Bedrock to generate
    // language-appropriate, engaging narration
    
    const parts: string[] = [];

    // Introduction
    parts.push(`Welcome to ${artifact.name}.`);

    // Description
    if (artifact.description) {
      parts.push(artifact.description);
    }

    // Historical context
    if (artifact.historicalContext) {
      parts.push(artifact.historicalContext);
    }

    // Cultural significance
    if (artifact.culturalSignificance) {
      parts.push(artifact.culturalSignificance);
    }

    // Closing
    parts.push(`Thank you for exploring ${artifact.name}.`);

    return parts.join(' ');
  }

  /**
   * Get the appropriate voice ID for a language
   * @param language - Target language
   * @returns Polly voice ID
   */
  private getVoiceId(language: Language): VoiceId {
    // Check configuration for custom voice mapping
    const configVoice = this.config.aws.polly.voiceMapping[language];
    if (configVoice) {
      return configVoice as VoiceId;
    }

    // Fall back to default mapping
    return this.VOICE_MAPPING[language];
  }

  /**
   * Get the appropriate engine for a language and voice
   * @param language - Target language
   * @param voiceId - Polly voice ID
   * @returns Polly engine (neural or standard)
   */
  private getEngine(language: Language, voiceId: VoiceId): Engine {
    // Neural voices are only available for specific voices
    // Joanna (English) supports neural
    // Aditi (Hindi) supports standard only
    const neuralVoices = ['Joanna', 'Matthew', 'Salli', 'Kimberly', 'Kendra', 'Joey'];
    
    if (neuralVoices.includes(voiceId) && this.config.aws.polly.engine === 'neural') {
      return 'neural' as Engine;
    }

    // Use standard engine for all other voices
    return 'standard' as Engine;
  }

  /**
   * Synthesize speech using AWS Polly
   * @param text - Text to synthesize
   * @param voiceId - Polly voice ID
   * @param engine - Polly engine (neural or standard)
   * @returns Audio content as Buffer
   */
  private async synthesizeSpeech(
    text: string,
    voiceId: VoiceId,
    engine: Engine
  ): Promise<Buffer> {
    const params: SynthesizeSpeechCommandInput = {
      Text: text,
      VoiceId: voiceId,
      Engine: engine,
      OutputFormat: 'mp3' as OutputFormat,
      SampleRate: '22050', // Polly supports 22050 Hz for MP3
      TextType: 'text',
    };

    const command = new SynthesizeSpeechCommand(params);
    const response = await this.pollyClient.send(command);

    if (!response.AudioStream) {
      throw new Error('No audio stream returned from Polly');
    }

    // Convert the audio stream to a Buffer
    const audioBuffer = await this.streamToBuffer(response.AudioStream);

    return audioBuffer;
  }

  /**
   * Convert a readable stream to a Buffer
   * @param stream - Readable stream
   * @returns Buffer
   */
  private async streamToBuffer(stream: any): Promise<Buffer> {
    const chunks: Uint8Array[] = [];
    
    for await (const chunk of stream) {
      chunks.push(chunk);
    }

    return Buffer.concat(chunks);
  }

  /**
   * Estimate the duration of the audio guide based on text length
   * @param text - Script text
   * @returns Estimated duration in seconds
   */
  estimateDuration(text: string): number {
    // Average speaking rate: ~150 words per minute
    // Average word length: ~5 characters
    const wordsPerMinute = 150;
    const avgWordLength = 5;
    const estimatedWords = text.length / avgWordLength;
    const durationMinutes = estimatedWords / wordsPerMinute;
    const durationSeconds = durationMinutes * 60;

    return Math.round(durationSeconds);
  }

  /**
   * Validate that the script length will produce audio within target duration
   * @param text - Script text
   * @returns True if within target duration (60-180 seconds)
   */
  validateScriptLength(text: string): boolean {
    const estimatedDuration = this.estimateDuration(text);
    const minDuration = this.config.validation.audio.minDuration;
    const maxDuration = this.config.validation.audio.maxDuration;

    return estimatedDuration >= minDuration && estimatedDuration <= maxDuration;
  }
}
