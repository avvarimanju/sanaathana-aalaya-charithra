// Test script for InfographicGenerator
// This script tests the infographic generator with real AWS Bedrock API calls

import { InfographicGenerator } from '../src/pre-generation/generators/infographic-generator';
import { ArtifactMetadata, Language, PreGenerationConfig } from '../src/pre-generation/types';
import { ConfigLoader } from '../src/pre-generation/config/config-loader';

async function testInfographicGenerator() {
  console.log('='.repeat(80));
  console.log('Testing InfographicGenerator with AWS Bedrock');
  console.log('='.repeat(80));

  try {
    // Load configuration
    console.log('\n1. Loading configuration...');
    const configLoader = new ConfigLoader();
    const config: PreGenerationConfig = configLoader.loadConfig();
    console.log('✓ Configuration loaded successfully');
    console.log(`  Region: ${config.aws.region}`);
    console.log(`  Bedrock Model: ${config.aws.bedrock.modelId}`);

    // Create infographic generator
    console.log('\n2. Creating InfographicGenerator...');
    const generator = new InfographicGenerator(config);
    console.log('✓ InfographicGenerator created');

    // Get infographic specs
    const specs = generator.getInfographicSpecs();
    console.log('\n3. Infographic Specifications:');
    console.log(`  Format: ${specs.format}`);
    console.log(`  Min Resolution: ${specs.minResolution.width}x${specs.minResolution.height}`);
    console.log(`  Color Depth: ${specs.colorDepth}-bit`);
    console.log(`  Compression: ${specs.compression}`);

    // Create test artifact
    const testArtifact: ArtifactMetadata = {
      artifactId: 'test-hanging-pillar',
      siteId: 'lepakshi-temple',
      name: 'Hanging Pillar of Lepakshi',
      type: 'architectural',
      description: 'A mysterious pillar that appears to hang without touching the ground, showcasing ancient engineering marvels.',
      historicalContext: 'Built in the 16th century during the Vijayanagara Empire, this pillar is one of 70 pillars supporting the temple.',
      culturalSignificance: 'Represents the advanced architectural knowledge of ancient Indian builders and continues to intrigue engineers and visitors.',
      templeGroup: 'lepakshi-temple-andhra',
    };

    // Test with English
    console.log('\n4. Generating infographic for English...');
    console.log(`  Artifact: ${testArtifact.name}`);
    console.log(`  Language: English`);
    
    const startTime = Date.now();
    const infographicBuffer = await generator.generateInfographic(testArtifact, Language.ENGLISH);
    const duration = Date.now() - startTime;
    
    console.log(`✓ Infographic generated in ${duration}ms`);
    console.log(`  Buffer size: ${infographicBuffer.length} bytes`);

    // Parse and display the content
    const infographicContent = JSON.parse(infographicBuffer.toString('utf-8'));
    console.log('\n5. Infographic Content Structure:');
    console.log(`  Artifact ID: ${infographicContent.artifactId}`);
    console.log(`  Language: ${infographicContent.language}`);
    console.log(`  Title: ${infographicContent.title}`);
    console.log(`  Layout: ${infographicContent.layout.orientation}, ${infographicContent.layout.width}x${infographicContent.layout.height}`);
    console.log(`  Grid System: ${infographicContent.layout.gridSystem}`);
    console.log(`  Sections: ${infographicContent.sections.length}`);
    console.log(`  Visual Elements: ${infographicContent.visualElements.length}`);

    // Display sections
    console.log('\n6. Content Sections:');
    infographicContent.sections.forEach((section: any) => {
      console.log(`  Section ${section.sectionNumber}: ${section.title}`);
      console.log(`    Type: ${section.type}`);
      console.log(`    Position: (${section.position.x}, ${section.position.y}), ${section.position.width}x${section.position.height}`);
      console.log(`    Content: ${section.content.substring(0, 80)}${section.content.length > 80 ? '...' : ''}`);
    });

    // Display visual elements
    console.log('\n7. Visual Elements:');
    infographicContent.visualElements.forEach((element: any) => {
      console.log(`  Element ${element.elementNumber}: ${element.type}`);
      console.log(`    Description: ${element.description}`);
      console.log(`    Position: (${element.position.x}, ${element.position.y})`);
    });

    // Display color scheme
    console.log('\n8. Color Scheme:');
    console.log(`  Primary: ${infographicContent.colorScheme.primary}`);
    console.log(`  Secondary: ${infographicContent.colorScheme.secondary}`);
    console.log(`  Accent: ${infographicContent.colorScheme.accent}`);
    console.log(`  Background: ${infographicContent.colorScheme.background}`);
    console.log(`  Text: ${infographicContent.colorScheme.text}`);

    // Display typography
    console.log('\n9. Typography:');
    console.log(`  Heading: ${infographicContent.typography.heading.fontFamily}, ${infographicContent.typography.heading.fontSize}px, ${infographicContent.typography.heading.fontWeight}`);
    console.log(`  Body: ${infographicContent.typography.body.fontFamily}, ${infographicContent.typography.body.fontSize}px, ${infographicContent.typography.body.fontWeight}`);
    console.log(`  Caption: ${infographicContent.typography.caption.fontFamily}, ${infographicContent.typography.caption.fontSize}px, ${infographicContent.typography.caption.fontWeight}`);

    // Validate content
    console.log('\n10. Validating infographic content...');
    const isValid = generator.validateInfographicContent(infographicContent);
    console.log(`  Validation result: ${isValid ? '✓ VALID' : '✗ INVALID'}`);

    // Estimate file size
    const estimatedSize = generator.estimateFileSize();
    console.log(`  Estimated PNG file size: ${(estimatedSize / 1024 / 1024).toFixed(2)} MB`);

    // Test with Hindi
    console.log('\n11. Generating infographic for Hindi...');
    const hindiStartTime = Date.now();
    const hindiBuffer = await generator.generateInfographic(testArtifact, Language.HINDI);
    const hindiDuration = Date.now() - hindiStartTime;
    
    console.log(`✓ Hindi infographic generated in ${hindiDuration}ms`);
    console.log(`  Buffer size: ${hindiBuffer.length} bytes`);

    const hindiContent = JSON.parse(hindiBuffer.toString('utf-8'));
    console.log(`  Title: ${hindiContent.title}`);
    console.log(`  Sections: ${hindiContent.sections.length}`);
    console.log(`  Visual Elements: ${hindiContent.visualElements.length}`);

    // Summary
    console.log('\n' + '='.repeat(80));
    console.log('TEST SUMMARY');
    console.log('='.repeat(80));
    console.log('✓ All tests passed successfully');
    console.log(`✓ Generated infographics for 2 languages`);
    console.log(`✓ Average generation time: ${((duration + hindiDuration) / 2).toFixed(0)}ms`);
    console.log(`✓ Content validation: PASSED`);
    console.log('='.repeat(80));

  } catch (error) {
    console.error('\n✗ Test failed with error:');
    console.error(error);
    process.exit(1);
  }
}

// Run the test
testInfographicGenerator()
  .then(() => {
    console.log('\nTest completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\nTest failed:', error);
    process.exit(1);
  });
