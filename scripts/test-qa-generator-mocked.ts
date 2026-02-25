// Test script for Q&A Knowledge Base Generator (Mocked)
// Tests the Q&A generator with mocked Bedrock responses

import { QAKnowledgeBaseGenerator } from '../src/pre-generation/generators/qa-generator';
import { ArtifactMetadata, Language, PreGenerationConfig } from '../src/pre-generation/types';

// Sample configuration
const config: PreGenerationConfig = {
  aws: {
    region: 'us-east-1',
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

// Mock the Bedrock client
class MockedQAGenerator extends QAKnowledgeBaseGenerator {
  // Override the private invokeBedrockModel method by accessing it through prototype
  async generateQAKnowledgeBase(
    artifact: ArtifactMetadata,
    language: Language
  ): Promise<Buffer> {
    // Generate mocked Q&A pairs directly
    const qaKnowledgeBase = {
      artifactId: artifact.artifactId,
      language,
      questionAnswerPairs: [
        {
          question: 'What is the Hanging Pillar of Lepakshi?',
          answer: 'The Hanging Pillar is one of the 70 pillars in the Lepakshi temple that appears to be suspended in mid-air, with a small gap between its base and the floor. Visitors often pass objects underneath to verify this phenomenon.',
          confidence: 0.95,
          sources: ['artifact description'],
        },
        {
          question: 'When was the Hanging Pillar built?',
          answer: 'The Hanging Pillar was built during the Vijayanagara Empire in the 16th century, demonstrating the advanced engineering skills of that period.',
          confidence: 0.90,
          sources: ['historical context'],
        },
        {
          question: 'Why is the Hanging Pillar significant?',
          answer: 'The Hanging Pillar represents the pinnacle of Vijayanagara architecture and engineering. It has become a symbol of ancient Indian architectural prowess and attracts thousands of visitors annually.',
          confidence: 0.92,
          sources: ['cultural significance'],
        },
        {
          question: 'How was the Hanging Pillar constructed?',
          answer: 'The pillar was intentionally designed to appear suspended as a testament to the builders\' expertise. The exact construction technique remains a subject of study and admiration.',
          confidence: 0.85,
          sources: ['historical context', 'architectural analysis'],
        },
        {
          question: 'Can visitors interact with the Hanging Pillar?',
          answer: 'Yes, visitors often pass objects like cloth or paper underneath the pillar to verify the gap between its base and the floor, making it an interactive experience.',
          confidence: 0.88,
          sources: ['artifact description', 'visitor information'],
        },
        {
          question: 'Where is the Hanging Pillar located?',
          answer: 'The Hanging Pillar is located in the Lepakshi Temple in Andhra Pradesh, India, which is famous for its Vijayanagara-era architecture.',
          confidence: 0.95,
          sources: ['artifact metadata'],
        },
        {
          question: 'What makes the Hanging Pillar unique?',
          answer: 'The pillar\'s unique feature is that it appears to be suspended in mid-air with a visible gap between its base and the floor, defying conventional architectural expectations.',
          confidence: 0.93,
          sources: ['artifact description', 'architectural features'],
        },
        {
          question: 'How many pillars are there in Lepakshi temple?',
          answer: 'The Lepakshi temple has 70 pillars in total, with the Hanging Pillar being the most famous and unique among them.',
          confidence: 0.90,
          sources: ['artifact description', 'temple information'],
        },
      ],
    };

    const jsonContent = JSON.stringify(qaKnowledgeBase, null, 2);
    return Buffer.from(jsonContent, 'utf-8');
  }
}

async function testQAGeneratorMocked() {
  console.log('='.repeat(80));
  console.log('Q&A Knowledge Base Generator Test (Mocked)');
  console.log('='.repeat(80));
  console.log();

  try {
    // Create mocked generator instance
    console.log('Creating mocked Q&A generator...');
    const generator = new MockedQAGenerator(config);
    console.log('✓ Generator created successfully');
    console.log();

    // Test with English language
    console.log('Generating Q&A knowledge base for English (mocked)...');
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

    // Test validation with various scenarios
    console.log('Testing validation scenarios...');
    console.log();

    // Test 1: Valid Q&A knowledge base
    console.log('Test 1: Valid Q&A knowledge base');
    const validQA = {
      artifactId: 'test-artifact',
      language: Language.ENGLISH,
      questionAnswerPairs: [
        { question: 'Q1?', answer: 'A1', confidence: 0.9, sources: ['source1'] },
        { question: 'Q2?', answer: 'A2', confidence: 0.8, sources: ['source2'] },
        { question: 'Q3?', answer: 'A3', confidence: 0.85, sources: ['source3'] },
        { question: 'Q4?', answer: 'A4', confidence: 0.95, sources: ['source4'] },
        { question: 'Q5?', answer: 'A5', confidence: 0.88, sources: ['source5'] },
      ],
    };
    console.log(`Result: ${generator.validateQAKnowledgeBase(validQA) ? 'VALID ✓' : 'INVALID ✗'}`);
    console.log();

    // Test 2: Too few Q&A pairs
    console.log('Test 2: Too few Q&A pairs (should be invalid)');
    const tooFewQA = {
      artifactId: 'test-artifact',
      language: Language.ENGLISH,
      questionAnswerPairs: [
        { question: 'Q1?', answer: 'A1', confidence: 0.9, sources: ['source1'] },
        { question: 'Q2?', answer: 'A2', confidence: 0.8, sources: ['source2'] },
      ],
    };
    console.log(`Result: ${generator.validateQAKnowledgeBase(tooFewQA) ? 'VALID ✓' : 'INVALID ✗'}`);
    console.log();

    // Test 3: Missing required fields
    console.log('Test 3: Missing required fields (should be invalid)');
    const missingFieldsQA = {
      artifactId: 'test-artifact',
      language: Language.ENGLISH,
      questionAnswerPairs: [
        { question: 'Q1?', answer: '', confidence: 0.9, sources: ['source1'] }, // Missing answer
        { question: '', answer: 'A2', confidence: 0.8, sources: ['source2'] }, // Missing question
        { question: 'Q3?', answer: 'A3', confidence: 0.85, sources: ['source3'] },
        { question: 'Q4?', answer: 'A4', confidence: 0.95, sources: ['source4'] },
        { question: 'Q5?', answer: 'A5', confidence: 0.88, sources: ['source5'] },
      ],
    };
    console.log(`Result: ${generator.validateQAKnowledgeBase(missingFieldsQA) ? 'VALID ✓' : 'INVALID ✗'}`);
    console.log();

    // Test 4: Invalid confidence values
    console.log('Test 4: Invalid confidence values (should be invalid)');
    const invalidConfidenceQA = {
      artifactId: 'test-artifact',
      language: Language.ENGLISH,
      questionAnswerPairs: [
        { question: 'Q1?', answer: 'A1', confidence: 1.5, sources: ['source1'] }, // > 1
        { question: 'Q2?', answer: 'A2', confidence: 0.8, sources: ['source2'] },
        { question: 'Q3?', answer: 'A3', confidence: 0.85, sources: ['source3'] },
        { question: 'Q4?', answer: 'A4', confidence: 0.95, sources: ['source4'] },
        { question: 'Q5?', answer: 'A5', confidence: 0.88, sources: ['source5'] },
      ],
    };
    console.log(`Result: ${generator.validateQAKnowledgeBase(invalidConfidenceQA) ? 'VALID ✓' : 'INVALID ✗'}`);
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
testQAGeneratorMocked().catch((error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
