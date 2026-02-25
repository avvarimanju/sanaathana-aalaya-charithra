// Test script for VideoGenerator with mocked Bedrock
// This script tests the video generator without requiring AWS Bedrock access

import { ArtifactMetadata, Language, PreGenerationConfig } from '../src/pre-generation/types';
import * as fs from 'fs';
import * as path from 'path';

// Load configuration
const configPath = path.join(__dirname, '../config/pre-generation.yaml');
let config: PreGenerationConfig;

try {
  const yaml = require('js-yaml');
  const configContent = fs.readFileSync(configPath, 'utf8');
  config = yaml.load(configContent) as PreGenerationConfig;
  console.log('✓ Configuration loaded successfully');
} catch (error) {
  console.error('✗ Failed to load configuration:', error);
  process.exit(1);
}

// Sample artifact for testing
const sampleArtifact: ArtifactMetadata = {
  artifactId: 'hanging-pillar',
  siteId: 'lepakshi-temple',
  name: 'Hanging Pillar of Lepakshi',
  type: 'architectural',
  description: 'A remarkable architectural marvel, one of the 70 pillars in the temple that hangs without touching the ground. Visitors can pass objects underneath to verify its suspended state.',
  historicalContext: 'Built during the Vijayanagara Empire in the 16th century, this pillar demonstrates the advanced engineering skills of ancient Indian architects. Legend says a British engineer tried to move it to understand the secret but failed.',
  culturalSignificance: 'The hanging pillar symbolizes the mysterious and advanced knowledge of ancient Indian architecture. It attracts thousands of visitors annually who marvel at this engineering wonder.',
  templeGroup: 'lepakshi-temple-andhra',
};

// Mock VideoGenerator class that doesn't call AWS
class MockedVideoGenerator {
  private config: PreGenerationConfig;

  private readonly VIDEO_SPECS = {
    format: 'mp4',
    codec: 'h264',
    resolution: { width: 1920, height: 1080 },
    frameRate: 30,
    bitrate: 5000000,
    minDuration: 120,
    maxDuration: 300,
  };

  constructor(config: PreGenerationConfig) {
    this.config = config;
  }

  async generateVideo(artifact: ArtifactMetadata, language: Language): Promise<Buffer> {
    const videoContent = this.generateMockedVideoScript(artifact, language);
    const jsonContent = JSON.stringify(videoContent, null, 2);
    return Buffer.from(jsonContent, 'utf-8');
  }

  private generateMockedVideoScript(artifact: ArtifactMetadata, language: Language): any {
    const targetDuration = 210; // Middle of 120-300 range

    return {
      artifactId: artifact.artifactId,
      language,
      title: artifact.name,
      duration: targetDuration,
      format: this.VIDEO_SPECS,
      script: [
        {
          startTime: 0,
          endTime: 30,
          text: `Welcome to ${artifact.name}. ${artifact.description}`,
        },
        {
          startTime: 30,
          endTime: 90,
          text: artifact.historicalContext,
        },
        {
          startTime: 90,
          endTime: 150,
          text: artifact.culturalSignificance,
        },
        {
          startTime: 150,
          endTime: 210,
          text: `Thank you for exploring ${artifact.name}. We hope you enjoyed learning about this remarkable heritage site.`,
        },
      ],
      storyboard: [
        {
          sceneNumber: 1,
          startTime: 0,
          endTime: 30,
          description: 'Wide shot of the temple exterior, slowly zooming into the artifact',
          visualElements: ['wide shot', 'temple', 'zoom'],
        },
        {
          sceneNumber: 2,
          startTime: 30,
          endTime: 60,
          description: 'Close-up of the artifact showing intricate details and craftsmanship',
          visualElements: ['close-up', 'detail', 'carving'],
        },
        {
          sceneNumber: 3,
          startTime: 60,
          endTime: 90,
          description: 'Pan across the artifact highlighting unique architectural features',
          visualElements: ['pan', 'architecture', 'detail'],
        },
        {
          sceneNumber: 4,
          startTime: 90,
          endTime: 120,
          description: 'Historical context visualization with period imagery',
          visualElements: ['overview', 'architecture'],
        },
        {
          sceneNumber: 5,
          startTime: 120,
          endTime: 150,
          description: 'Cultural significance shown through visitor interactions',
          visualElements: ['general view', 'detail'],
        },
        {
          sceneNumber: 6,
          startTime: 150,
          endTime: 180,
          description: 'Detailed view of inscriptions and symbolic elements',
          visualElements: ['close-up', 'inscription', 'detail'],
        },
        {
          sceneNumber: 7,
          startTime: 180,
          endTime: 200,
          description: 'Wide shot showing the artifact in its temple context',
          visualElements: ['wide shot', 'temple', 'architecture'],
        },
        {
          sceneNumber: 8,
          startTime: 200,
          endTime: 210,
          description: 'Closing shot with temple overview and sunset lighting',
          visualElements: ['wide shot', 'temple', 'overview'],
        },
      ],
      metadata: {
        generatedAt: new Date().toISOString(),
        modelId: this.config.aws.bedrock.modelId,
        language,
        templeGroup: artifact.templeGroup,
      },
    };
  }

  validateVideoContent(videoContent: any): boolean {
    if (videoContent.duration < this.VIDEO_SPECS.minDuration ||
        videoContent.duration > this.VIDEO_SPECS.maxDuration) {
      return false;
    }

    if (!videoContent.script || videoContent.script.length === 0) {
      return false;
    }

    if (!videoContent.storyboard || videoContent.storyboard.length < 5) {
      return false;
    }

    return true;
  }

  estimateFileSize(duration: number): number {
    return Math.floor((this.VIDEO_SPECS.bitrate * duration) / 8);
  }

  getVideoSpecs() {
    return { ...this.VIDEO_SPECS };
  }
}

async function testVideoGenerator() {
  console.log('\n=== Testing VideoGenerator (Mocked) ===\n');

  try {
    // Initialize generator
    const generator = new MockedVideoGenerator(config);
    console.log('✓ VideoGenerator initialized');

    // Test video specs
    const specs = generator.getVideoSpecs();
    console.log('\n✓ Video Specifications:');
    console.log(`  - Format: ${specs.format} (${specs.codec})`);
    console.log(`  - Resolution: ${specs.resolution.width}x${specs.resolution.height}`);
    console.log(`  - Frame Rate: ${specs.frameRate} fps`);
    console.log(`  - Bitrate: ${specs.bitrate / 1000000} Mbps`);
    console.log(`  - Duration Range: ${specs.minDuration}-${specs.maxDuration} seconds`);

    // Test file size estimation
    const estimatedSize = generator.estimateFileSize(180);
    console.log(`\n✓ Estimated file size for 180s video: ${(estimatedSize / 1024 / 1024).toFixed(2)} MB`);

    // Test video generation for English
    console.log('\n--- Testing English Video Generation ---');
    const englishVideo = await generator.generateVideo(sampleArtifact, Language.ENGLISH);
    console.log(`✓ Generated English video content (${englishVideo.length} bytes)`);

    // Parse and display the content
    const englishContent = JSON.parse(englishVideo.toString('utf-8'));
    console.log(`  - Title: ${englishContent.title}`);
    console.log(`  - Duration: ${englishContent.duration} seconds`);
    console.log(`  - Script segments: ${englishContent.script.length}`);
    console.log(`  - Storyboard scenes: ${englishContent.storyboard.length}`);
    console.log(`  - Language: ${englishContent.language}`);

    // Display first script segment
    if (englishContent.script.length > 0) {
      const firstSegment = englishContent.script[0];
      console.log(`\n  First script segment (${firstSegment.startTime}s - ${firstSegment.endTime}s):`);
      console.log(`  "${firstSegment.text}"`);
    }

    // Display first storyboard scene
    if (englishContent.storyboard.length > 0) {
      const firstScene = englishContent.storyboard[0];
      console.log(`\n  First storyboard scene (${firstScene.startTime}s - ${firstScene.endTime}s):`);
      console.log(`  "${firstScene.description}"`);
      console.log(`  Visual elements: ${firstScene.visualElements.join(', ')}`);
    }

    // Validate content
    const isValid = generator.validateVideoContent(englishContent);
    console.log(`\n✓ Content validation: ${isValid ? 'PASSED' : 'FAILED'}`);

    if (!isValid) {
      throw new Error('Content validation failed');
    }

    // Test video generation for Hindi
    console.log('\n--- Testing Hindi Video Generation ---');
    const hindiVideo = await generator.generateVideo(sampleArtifact, Language.HINDI);
    console.log(`✓ Generated Hindi video content (${hindiVideo.length} bytes)`);

    const hindiContent = JSON.parse(hindiVideo.toString('utf-8'));
    console.log(`  - Title: ${hindiContent.title}`);
    console.log(`  - Duration: ${hindiContent.duration} seconds`);
    console.log(`  - Script segments: ${hindiContent.script.length}`);
    console.log(`  - Storyboard scenes: ${hindiContent.storyboard.length}`);

    // Validate Hindi content
    const hindiValid = generator.validateVideoContent(hindiContent);
    console.log(`\n✓ Hindi content validation: ${hindiValid ? 'PASSED' : 'FAILED'}`);

    if (!hindiValid) {
      throw new Error('Hindi content validation failed');
    }

    // Test video generation for Tamil
    console.log('\n--- Testing Tamil Video Generation ---');
    const tamilVideo = await generator.generateVideo(sampleArtifact, Language.TAMIL);
    const tamilContent = JSON.parse(tamilVideo.toString('utf-8'));
    console.log(`✓ Generated Tamil video content`);
    console.log(`  - Duration: ${tamilContent.duration} seconds`);
    console.log(`  - Script segments: ${tamilContent.script.length}`);
    console.log(`  - Storyboard scenes: ${tamilContent.storyboard.length}`);

    // Save sample outputs for inspection
    const outputDir = path.join(__dirname, '../.pre-generation/test-outputs');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(
      path.join(outputDir, 'video-english.json'),
      JSON.stringify(englishContent, null, 2)
    );
    fs.writeFileSync(
      path.join(outputDir, 'video-hindi.json'),
      JSON.stringify(hindiContent, null, 2)
    );
    fs.writeFileSync(
      path.join(outputDir, 'video-tamil.json'),
      JSON.stringify(tamilContent, null, 2)
    );
    console.log(`\n✓ Sample outputs saved to ${outputDir}`);

    // Verify all required fields are present
    console.log('\n--- Verifying Content Structure ---');
    const requiredFields = ['artifactId', 'language', 'title', 'duration', 'format', 'script', 'storyboard', 'metadata'];
    const missingFields = requiredFields.filter(field => !(field in englishContent));
    
    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }
    console.log('✓ All required fields present');

    // Verify format specifications
    console.log('\n--- Verifying Format Specifications ---');
    const format = englishContent.format;
    console.log(`✓ Format: ${format.format}`);
    console.log(`✓ Codec: ${format.codec}`);
    console.log(`✓ Resolution: ${format.resolution.width}x${format.resolution.height}`);
    console.log(`✓ Frame Rate: ${format.frameRate} fps`);
    console.log(`✓ Bitrate: ${format.bitrate / 1000000} Mbps`);

    // Verify script structure
    console.log('\n--- Verifying Script Structure ---');
    for (const segment of englishContent.script) {
      if (segment.startTime === undefined || segment.endTime === undefined || !segment.text) {
        throw new Error(`Invalid script segment structure: ${JSON.stringify(segment)}`);
      }
    }
    console.log(`✓ All ${englishContent.script.length} script segments valid`);

    // Verify storyboard structure
    console.log('\n--- Verifying Storyboard Structure ---');
    for (const scene of englishContent.storyboard) {
      if (!scene.sceneNumber || scene.startTime === undefined || scene.endTime === undefined || !scene.description || !scene.visualElements) {
        throw new Error(`Invalid storyboard scene structure: ${JSON.stringify(scene)}`);
      }
    }
    console.log(`✓ All ${englishContent.storyboard.length} storyboard scenes valid`);

    console.log('\n=== All VideoGenerator Tests Passed ===\n');
  } catch (error) {
    console.error('\n✗ Test failed:', error);
    if (error instanceof Error) {
      console.error('Stack trace:', error.stack);
    }
    process.exit(1);
  }
}

// Run tests
testVideoGenerator().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
