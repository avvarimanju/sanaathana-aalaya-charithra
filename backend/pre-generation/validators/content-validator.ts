// Content Validator for Pre-Generation System
// Validates generated content meets quality requirements

import { ContentType, Language } from '../types';

export interface ValidationConfig {
  audio: {
    minDuration: number;
    maxDuration: number;
  };
  video: {
    minDuration: number;
    maxDuration: number;
    expectedDimensions: {
      width: number;
      height: number;
    };
  };
  infographic: {
    minResolution: {
      width: number;
      height: number;
    };
  };
  qaKnowledgeBase: {
    minQuestionCount: number;
  };
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  metadata?: {
    duration?: number;
    dimensions?: { width: number; height: number };
    fileSize?: number;
    format?: string;
    questionCount?: number;
  };
}

export class ContentValidator {
  private config: ValidationConfig;

  constructor(config: ValidationConfig) {
    this.config = config;
  }

  /**
   * Validate content based on type
   */
  public async validate(
    content: Buffer,
    contentType: ContentType,
    language: Language
  ): Promise<ValidationResult> {
    switch (contentType) {
      case 'audio_guide':
        return this.validateAudio(content, language);
      case 'video':
        return this.validateVideo(content, language);
      case 'infographic':
        return this.validateInfographic(content, language);
      case 'qa_knowledge_base':
        return this.validateQAKnowledgeBase(content, language);
      default:
        return {
          valid: false,
          errors: [`Unknown content type: ${contentType}`],
          warnings: [],
        };
    }
  }

  /**
   * Validate audio content
   */
  private async validateAudio(
    content: Buffer,
    language: Language
  ): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check if content is not empty
    if (content.length === 0) {
      errors.push('Audio content is empty');
      return { valid: false, errors, warnings };
    }

    // Check file size (basic validation)
    const fileSizeMB = content.length / (1024 * 1024);
    if (fileSizeMB > 50) {
      warnings.push(`Audio file size is large: ${fileSizeMB.toFixed(2)} MB`);
    }

    // Check for MP3 header (basic format validation)
    const hasMP3Header = this.checkMP3Header(content);
    if (!hasMP3Header) {
      errors.push('Invalid audio format: MP3 header not found');
    }

    // Estimate duration based on file size and bitrate
    // Assuming 128 kbps bitrate: 1 MB ≈ 66 seconds
    const estimatedDuration = (fileSizeMB * 66);
    
    if (estimatedDuration < this.config.audio.minDuration) {
      errors.push(
        `Audio duration too short: ~${estimatedDuration.toFixed(0)}s (min: ${this.config.audio.minDuration}s)`
      );
    }

    if (estimatedDuration > this.config.audio.maxDuration) {
      errors.push(
        `Audio duration too long: ~${estimatedDuration.toFixed(0)}s (max: ${this.config.audio.maxDuration}s)`
      );
    }

    // Language detection would require external library
    // For now, we'll add a warning if we can't verify language
    warnings.push('Language detection not implemented - assuming correct language');

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      metadata: {
        duration: estimatedDuration,
        fileSize: content.length,
        format: hasMP3Header ? 'MP3' : 'Unknown',
      },
    };
  }

  /**
   * Check for MP3 header
   */
  private checkMP3Header(content: Buffer): boolean {
    if (content.length < 3) return false;
    
    // Check for ID3 tag or MP3 frame sync
    const hasID3 = content[0] === 0x49 && content[1] === 0x44 && content[2] === 0x33;
    const hasFrameSync = (content[0] === 0xFF && (content[1] & 0xE0) === 0xE0);
    
    return hasID3 || hasFrameSync;
  }

  /**
   * Validate video content
   */
  private async validateVideo(
    content: Buffer,
    language: Language
  ): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check if content is not empty
    if (content.length === 0) {
      errors.push('Video content is empty');
      return { valid: false, errors, warnings };
    }

    // Check file size
    const fileSizeMB = content.length / (1024 * 1024);
    if (fileSizeMB > 500) {
      warnings.push(`Video file size is large: ${fileSizeMB.toFixed(2)} MB`);
    }

    // Check for MP4 header (basic format validation)
    const hasMP4Header = this.checkMP4Header(content);
    if (!hasMP4Header) {
      errors.push('Invalid video format: MP4 header not found');
    }

    // Estimate duration based on file size and bitrate
    // Assuming 5 Mbps bitrate: 1 MB ≈ 1.6 seconds
    const estimatedDuration = (fileSizeMB * 1.6);
    
    if (estimatedDuration < this.config.video.minDuration) {
      errors.push(
        `Video duration too short: ~${estimatedDuration.toFixed(0)}s (min: ${this.config.video.minDuration}s)`
      );
    }

    if (estimatedDuration > this.config.video.maxDuration) {
      errors.push(
        `Video duration too long: ~${estimatedDuration.toFixed(0)}s (max: ${this.config.video.maxDuration}s)`
      );
    }

    // Dimension validation would require video parsing library
    warnings.push('Video dimension validation not implemented - assuming 1920x1080');

    // Frame validation would require video parsing library
    warnings.push('Frame validation not implemented - assuming video contains frames');

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      metadata: {
        duration: estimatedDuration,
        fileSize: content.length,
        format: hasMP4Header ? 'MP4' : 'Unknown',
        dimensions: this.config.video.expectedDimensions,
      },
    };
  }

  /**
   * Check for MP4 header
   */
  private checkMP4Header(content: Buffer): boolean {
    if (content.length < 12) return false;
    
    // Check for ftyp box (MP4 file type box)
    const hasFtyp = content[4] === 0x66 && content[5] === 0x74 && 
                    content[6] === 0x79 && content[7] === 0x70;
    
    return hasFtyp;
  }

  /**
   * Validate infographic content
   */
  private async validateInfographic(
    content: Buffer,
    language: Language
  ): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check if content is not empty
    if (content.length === 0) {
      errors.push('Infographic content is empty');
      return { valid: false, errors, warnings };
    }

    // Check file size
    const fileSizeMB = content.length / (1024 * 1024);
    if (fileSizeMB > 10) {
      warnings.push(`Infographic file size is large: ${fileSizeMB.toFixed(2)} MB`);
    }

    // Check for PNG header
    const hasPNGHeader = this.checkPNGHeader(content);
    if (!hasPNGHeader) {
      errors.push('Invalid infographic format: PNG header not found');
    }

    // Extract PNG dimensions if valid PNG
    let dimensions = { width: 0, height: 0 };
    if (hasPNGHeader) {
      dimensions = this.extractPNGDimensions(content);
      
      if (dimensions.width < this.config.infographic.minResolution.width) {
        errors.push(
          `Infographic width too small: ${dimensions.width}px (min: ${this.config.infographic.minResolution.width}px)`
        );
      }

      if (dimensions.height < this.config.infographic.minResolution.height) {
        errors.push(
          `Infographic height too small: ${dimensions.height}px (min: ${this.config.infographic.minResolution.height}px)`
        );
      }
    }

    // Visual element validation would require image processing library
    warnings.push('Visual element validation not implemented - assuming infographic contains visual elements');

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      metadata: {
        fileSize: content.length,
        format: hasPNGHeader ? 'PNG' : 'Unknown',
        dimensions,
      },
    };
  }

  /**
   * Check for PNG header
   */
  private checkPNGHeader(content: Buffer): boolean {
    if (content.length < 8) return false;
    
    // PNG signature: 137 80 78 71 13 10 26 10
    return content[0] === 0x89 && content[1] === 0x50 && 
           content[2] === 0x4E && content[3] === 0x47 &&
           content[4] === 0x0D && content[5] === 0x0A &&
           content[6] === 0x1A && content[7] === 0x0A;
  }

  /**
   * Extract PNG dimensions from IHDR chunk
   */
  private extractPNGDimensions(content: Buffer): { width: number; height: number } {
    if (content.length < 24) return { width: 0, height: 0 };
    
    // IHDR chunk starts at byte 8, dimensions at bytes 16-23
    const width = content.readUInt32BE(16);
    const height = content.readUInt32BE(20);
    
    return { width, height };
  }

  /**
   * Validate Q&A knowledge base content
   */
  private async validateQAKnowledgeBase(
    content: Buffer,
    language: Language
  ): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check if content is not empty
    if (content.length === 0) {
      errors.push('Q&A knowledge base content is empty');
      return { valid: false, errors, warnings };
    }

    // Parse JSON
    let qaData: any;
    try {
      const jsonString = content.toString('utf-8');
      qaData = JSON.parse(jsonString);
    } catch (error) {
      errors.push('Invalid JSON format');
      return { valid: false, errors, warnings };
    }

    // Validate structure
    if (!Array.isArray(qaData)) {
      errors.push('Q&A data must be an array');
      return { valid: false, errors, warnings };
    }

    // Check question count
    if (qaData.length < this.config.qaKnowledgeBase.minQuestionCount) {
      errors.push(
        `Too few questions: ${qaData.length} (min: ${this.config.qaKnowledgeBase.minQuestionCount})`
      );
    }

    // Validate each Q&A pair
    qaData.forEach((item: any, index: number) => {
      if (!item.question || typeof item.question !== 'string') {
        errors.push(`Q&A item ${index + 1}: Missing or invalid question`);
      }

      if (!item.answer || typeof item.answer !== 'string') {
        errors.push(`Q&A item ${index + 1}: Missing or invalid answer`);
      }

      if (item.question && item.question.length < 10) {
        warnings.push(`Q&A item ${index + 1}: Question is very short`);
      }

      if (item.answer && item.answer.length < 20) {
        warnings.push(`Q&A item ${index + 1}: Answer is very short`);
      }

      // Optional fields validation
      if (item.confidence !== undefined) {
        if (typeof item.confidence !== 'number' || item.confidence < 0 || item.confidence > 1) {
          warnings.push(`Q&A item ${index + 1}: Invalid confidence value`);
        }
      }
    });

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      metadata: {
        questionCount: qaData.length,
        fileSize: content.length,
        format: 'JSON',
      },
    };
  }

  /**
   * Validate content by file path
   */
  public async validateFile(
    filePath: string,
    contentType: ContentType,
    language: Language
  ): Promise<ValidationResult> {
    const fs = require('fs').promises;
    
    try {
      const content = await fs.readFile(filePath);
      return this.validate(content, contentType, language);
    } catch (error) {
      return {
        valid: false,
        errors: [`Failed to read file: ${(error as Error).message}`],
        warnings: [],
      };
    }
  }

  /**
   * Batch validate multiple content items
   */
  public async validateBatch(
    items: Array<{
      content: Buffer;
      contentType: ContentType;
      language: Language;
      identifier: string;
    }>
  ): Promise<Map<string, ValidationResult>> {
    const results = new Map<string, ValidationResult>();

    for (const item of items) {
      const result = await this.validate(
        item.content,
        item.contentType,
        item.language
      );
      results.set(item.identifier, result);
    }

    return results;
  }

  /**
   * Get validation statistics from batch results
   */
  public getValidationStats(results: Map<string, ValidationResult>): {
    total: number;
    valid: number;
    invalid: number;
    totalErrors: number;
    totalWarnings: number;
  } {
    let valid = 0;
    let invalid = 0;
    let totalErrors = 0;
    let totalWarnings = 0;

    results.forEach(result => {
      if (result.valid) {
        valid++;
      } else {
        invalid++;
      }
      totalErrors += result.errors.length;
      totalWarnings += result.warnings.length;
    });

    return {
      total: results.size,
      valid,
      invalid,
      totalErrors,
      totalWarnings,
    };
  }
}
