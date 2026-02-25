// Test script for AudioGuideGenerator
// Tests AWS Polly integration for text-to-speech synthesis

import { AudioGuideGenerator } from '../src/pre-generation/generators/audio-guide-generator';
import { ConfigLoader } from '../src/pre-generation/config/config-loader';
import { ArtifactMetadata, Language } from '../src/pre-generation/types';
import * as fs from 'fs';
import * as path from 'path';

async function testAudioGuideGenerator() {
  console.log('=== Audio Guide Generator Test ===\n');

  try {
    // Load configuration
    console.log('Loading configuration...');
    const configLoader = new ConfigLoader();
    const config = await configLoader.loadConfig();
    console.log('✓ Configuration loaded\n');

    // Create audio guide generator
    console.log('Creating AudioGuideGenerator...');
    const generator = new AudioGuideGenerator(config);
    console.log('✓ AudioGuideGenerator created\n');

    // Create test artifact
    const testArtifact: ArtifactMetadata = {
      artifactId: 'test-artifact-001',
      siteId: 'test-site-001',
      name: 'Test Heritage Artifact',
      type: 'sculpture',
      description: 'This is a magnificent sculpture from the ancient temple complex. It showcases intricate carvings and detailed craftsmanship that represents the artistic excellence of the period.',
      historicalContext: 'This artifact dates back to the 12th century and was created during the reign of the Hoysala dynasty. It represents a significant period in South Indian temple architecture.',
      culturalSignificance: 'The sculpture holds immense cultural importance as it depicts scenes from ancient Hindu mythology and serves as a testament to the religious devotion of the era.',
      templeGroup: 'test-temple-group',
    };

    // Test languages
    const testLanguages: Language[] = [Language.ENGLISH, Language.HINDI];

    // Create output directory
    const outputDir = path.join(process.cwd(), '.pre-generation', 'test-audio');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Generate audio guides for each language
    for (const language of testLanguages) {
      console.log(`\n--- Testing ${language} ---`);

      try {
        // Generate audio guide
        console.log(`Generating audio guide for ${language}...`);
        const startTime = Date.now();
        const audioBuffer = await generator.generateAudioGuide(testArtifact, language);
        const duration = Date.now() - startTime;

        console.log(`✓ Audio guide generated in ${duration}ms`);
        console.log(`  Buffer size: ${audioBuffer.length} bytes (${(audioBuffer.length / 1024).toFixed(2)} KB)`);

        // Estimate duration
        const script = (generator as any).generateScript(testArtifact, language);
        const estimatedDuration = generator.estimateDuration(script);
        console.log(`  Estimated duration: ${estimatedDuration} seconds`);
        console.log(`  Script length: ${script.length} characters`);

        // Validate script length
        const isValid = generator.validateScriptLength(script);
        console.log(`  Script validation: ${isValid ? '✓ PASS' : '✗ FAIL'}`);

        // Save to file
        const outputFile = path.join(outputDir, `test-audio-${language}.mp3`);
        fs.writeFileSync(outputFile, audioBuffer);
        console.log(`  Saved to: ${outputFile}`);

        // Verify MP3 header (Polly generates valid MP3 with ID3 tags)
        const mp3Header = audioBuffer.slice(0, 3);
        // Check for ID3 tag (ID3v2) or MP3 frame sync
        const hasID3 = mp3Header[0] === 0x49 && mp3Header[1] === 0x44 && mp3Header[2] === 0x33; // "ID3"
        const hasMP3Sync = mp3Header[0] === 0xFF && (mp3Header[1] & 0xE0) === 0xE0;
        const isMP3 = hasID3 || hasMP3Sync;
        console.log(`  MP3 format: ${isMP3 ? '✓ Valid' : '✗ Invalid'} ${hasID3 ? '(ID3 tag)' : hasMP3Sync ? '(MP3 frame)' : ''}`);

      } catch (error) {
        console.error(`✗ Error generating audio for ${language}:`, error);
      }
    }

    console.log('\n=== Test Summary ===');
    console.log('✓ Audio guide generator test completed');
    console.log(`✓ Generated audio files saved to: ${outputDir}`);
    console.log('\nYou can play the generated MP3 files to verify audio quality.');

  } catch (error) {
    console.error('✗ Test failed:', error);
    process.exit(1);
  }
}

// Run the test
testAudioGuideGenerator().catch((error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
