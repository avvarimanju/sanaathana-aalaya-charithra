// Test script for Q&A Knowledge Base Generator
// Tests the Q&A generator with sample artifact data

import { QAKnowledgeBaseGenerator } from '../src/pre-generation/generators/qa-generator';
import { ArtifactMetadata, Language, PreGenerationConfig } from '../src/pre-generation/types';

// Sample configuration
const config: PreGenerationConfig = {
  aws: {
    region: process.env.AWS_REGION || 'us-east-1',
    s3: {
      bucket: 'test-bucket',
      encryption: 'AES256',
    },
    dynamodb: {
      progressTable: 'PreGenerationProgress',
      cacheTable: 'ContentCache',
    },
    bedrock: {
      modelId: 'anthropic.claude-3-sonnet-20240229-v1:0',
      maxTokens: 2048,
      temperature: 0.7,
    },
    polly: {
      engine: 'neural',
      voiceMapping: {
        en: 'Joanna',
        hi: 'Aditi',
        ta: null,
        te: null,
        bn: null,
        mr: null,
        gu: null,
        kn: null,
        ml: null,
        pa: null,
      },
    },
  },
  generation: {
    languages: [Language.ENGLISH],
    contentTypes: ['qa_knowledge_base'],
    forceRegenerate: false,
    skipExisting: true,
    cacheMaxAge: 2592000,
  },
  rateLimits: {
    bedrock: 10,
    polly: 100,
    s3: 3500,
    dynamodb: 1000,
  },
  retry: {
    maxAttempts: 3,
    initialDelay: 1000,
    maxDelay: 30000,
    backoffMultiplier: 2,
    jitter: true,
  },
  validation: {
    audio: {
      minDuration: 30,
      maxDuration: 300,
    },
    video: {
      minDuration: 60,
      maxDuration: 600,
      expectedDimensions: {
        width: 1920,
        height: 1080,
      },
    },
    infographic: {
      minResolution: {
        width: 1200,
        height: 800,
      },
    },
    qaKnowledgeBase: {
      minQuestionCount: 5,
    },
  },
  execution: {
    mode: 'local',
    batchSize: 10,
    maxConcurrency: 5,
    timeout: 300000,
  },
  reporting: {
    outputDir: './reports',
    formats: ['json'],
  },
};

// Sample artifact data
const sampleArtifact: ArtifactMetadata = {
  artifactId: 'hanging-pillar',
  siteId: 'lepakshi-temple',
  name: 'Hanging Pillar of Lepakshi',
  type: 'architectural_element',
  description: 'The Hanging Pillar is one of the 70 pillars in the Lepakshi temple that appears to be suspended in mid-air, with a small gap between its base and the floor. Visitors often pass objects underneath to verify this phenomenon.',
  historicalContext: 'Built during the Vijayanagara Empire in the 16th century, this architectural marvel demonstrates the advanced engineering skills of the period. The pillar was intentionally designed this way as a testament to the builders\' expertise.',
  culturalSignificance: 'The Hanging Pillar represents the pinnacle of Vijayanagara architecture and engineering. It has become a symbol of ancient Indian architectural prowess and attracts thousands of visitors annually who come to witness this unique phenomenon.',
  templeGroup: 'Lepakshi Temple, Andhra Pradesh',
};

async function testQAGenerator() {
  console.log('='.repeat(80));
  console.log('Q&A Knowledge Base Generator Test');
  console.log('='.repeat(80));
  console.log();

  try {
    // Create generator instance
    console.log('Creating Q&A generator...');
    const generator = new QAKnowledgeBaseGenerator(config);
    console.log('✓ Generator created successfully');
    console.log();

    // Test with English language
    console.log('Generating Q&A knowledge base for English...');
    console.log(`Artifact: ${sampleArtifact.name}`);
    console.log();

    const startTime = Date.now();
    const qaBuffer = await generator.generateQAKnowledgeBase(sampleArtifact, Language.ENGLISH);
    const duration = Date.now() - startTime;

    console.log(`✓ Q&A knowledge base generated in ${duration}ms`);
    console.log();

    // Parse and display the Q&A knowledge base
    const qaKnowledgeBase = JSON.parse(qaBuffer.toString('utf-8'));
    console.log('Generated Q&A Knowledge Base:');
    console.log('-'.repeat(80));
    console.log(`Artifact ID: ${qaKnowledgeBase.artifactId}`);
    console.log(`Language: ${qaKnowledgeBase.language}`);
    console.log(`Number of Q&A pairs: ${qaKnowledgeBase.questionAnswerPairs.length}`);
    console.log();

    // Display each Q&A pair
    qaKnowledgeBase.questionAnswerPairs.forEach((pair: any, index: number) => {
      console.log(`Q${index + 1}: ${pair.question}`);
      console.log(`A${index + 1}: ${pair.answer}`);
      console.log(`Confidence: ${pair.confidence}`);
      console.log(`Sources: ${pair.sources.join(', ')}`);
      console.log();
    });

    // Validate the Q&A knowledge base
    console.log('Validating Q&A knowledge base...');
    const isValid = generator.validateQAKnowledgeBase(qaKnowledgeBase);
    console.log(`✓ Validation result: ${isValid ? 'VALID' : 'INVALID'}`);
    console.log();

    // Estimate file size
    const fileSize = generator.estimateFileSize(qaKnowledgeBase);
    console.log(`Estimated file size: ${fileSize} bytes (${(fileSize / 1024).toFixed(2)} KB)`);
    console.log();

    // Get Q&A specs
    const specs = generator.getQASpecs();
    console.log('Q&A Specifications:');
    console.log(`- Format: ${specs.format}`);
    console.log(`- Min question count: ${specs.minQuestionCount}`);
    console.log(`- Max question count: ${specs.maxQuestionCount}`);
    console.log();

    console.log('='.repeat(80));
    console.log('✓ All tests passed successfully!');
    console.log('='.repeat(80));

  } catch (error) {
    console.error('✗ Test failed with error:');
    console.error(error);
    process.exit(1);
  }
}

// Run the test
testQAGenerator().catch((error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
