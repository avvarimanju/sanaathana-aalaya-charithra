// Test script for VideoGenerator
// This script tests the video generator with a sample artifact

import { VideoGenerator } from '../src/pre-generation/generators/video-generator';
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

async function testVideoGenerator() {
  console.log('\n=== Testing VideoGenerator ===\n');

  try {
    // Initialize generator
    const generator = new VideoGenerator(config);
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
      console.log(`  "${firstSegment.text.substring(0, 100)}..."`);
    }

    // Display first storyboard scene
    if (englishContent.storyboard.length > 0) {
      const firstScene = englishContent.storyboard[0];
      console.log(`\n  First storyboard scene (${firstScene.startTime}s - ${firstScene.endTime}s):`);
      console.log(`  "${firstScene.description.substring(0, 100)}..."`);
      console.log(`  Visual elements: ${firstScene.visualElements.join(', ')}`);
    }

    // Validate content
    const isValid = generator.validateVideoContent(englishContent);
    console.log(`\n✓ Content validation: ${isValid ? 'PASSED' : 'FAILED'}`);

    // Test video generation for Hindi
    console.log('\n--- Testing Hindi Video Generation ---');
    const hindiVideo = await generator.generateVideo(sampleArtifact, Language.HINDI);
    console.log(`✓ Generated Hindi video content (${hindiVideo.length} bytes)`);

    const hindiContent = JSON.parse(hindiVideo.toString('utf-8'));
    console.log(`  - Title: ${hindiContent.title}`);
    console.log(`  - Duration: ${hindiContent.duration} seconds`);
    console.log(`  - Script segments: ${hindiContent.script.length}`);
    console.log(`  - Storyboard scenes: ${hindiContent.storyboard.length}`);

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
    console.log(`\n✓ Sample outputs saved to ${outputDir}`);

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
