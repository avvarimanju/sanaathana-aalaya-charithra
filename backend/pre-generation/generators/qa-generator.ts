// Q&A Knowledge Base Generator for Pre-Generation System
// Uses AWS Bedrock to generate question-answer pairs

import {
  BedrockRuntimeClient,
  InvokeModelCommand,
  InvokeModelCommandInput,
} from '@aws-sdk/client-bedrock-runtime';
import { ArtifactMetadata, Language, PreGenerationConfig, QAKnowledgeBase, QAPair } from '../types';

/**
 * QAKnowledgeBaseGenerator generates question-answer pairs using AWS Bedrock
 * 
 * Specifications:
 * - Format: JSON
 * - Structure: Array of {question, answer, confidence, sources}
 * - Minimum: 5 question-answer pairs
 * - Maximum: 20 question-answer pairs
 * - Language-appropriate content generation
 */
export class QAKnowledgeBaseGenerator {
  private bedrockClient: BedrockRuntimeClient;
  private config: PreGenerationConfig;

  // Q&A format specifications
  private readonly QA_SPECS = {
    format: 'json',
    minQuestionCount: 5,
    maxQuestionCount: 20,
  };

  constructor(config: PreGenerationConfig) {
    this.config = config;
    this.bedrockClient = new BedrockRuntimeClient({
      region: config.aws.region,
    });
  }

  /**
   * Generate Q&A knowledge base for an artifact in a specific language
   * @param artifact - Artifact metadata
   * @param language - Target language
   * @returns Q&A knowledge base as Buffer (JSON format)
   */
  async generateQAKnowledgeBase(
    artifact: ArtifactMetadata,
    language: Language
  ): Promise<Buffer> {
    // Generate the Q&A pairs using Bedrock
    const qaKnowledgeBase = await this.generateQAPairs(artifact, language);

    // Convert to JSON buffer for storage
    const jsonContent = JSON.stringify(qaKnowledgeBase, null, 2);
    return Buffer.from(jsonContent, 'utf-8');
  }

  /**
   * Generate Q&A pairs using AWS Bedrock
   * @param artifact - Artifact metadata
   * @param language - Target language
   * @returns Q&A knowledge base structure
   */
  private async generateQAPairs(
    artifact: ArtifactMetadata,
    language: Language
  ): Promise<QAKnowledgeBase> {
    const prompt = this.buildPrompt(artifact, language);
    const response = await this.invokeBedrockModel(prompt);

    // Parse the response and structure it
    const questionAnswerPairs = this.parseQAPairs(response, artifact);

    const qaKnowledgeBase: QAKnowledgeBase = {
      artifactId: artifact.artifactId,
      language,
      questionAnswerPairs,
    };

    return qaKnowledgeBase;
  }

  /**
   * Build the prompt for Bedrock to generate Q&A pairs
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

    return `You are creating a Q&A knowledge base for a heritage site artifact. Generate comprehensive question-answer pairs in ${targetLanguage} that visitors might ask about this artifact.

Artifact Information:
- Name: ${artifact.name}
- Type: ${artifact.type}
- Temple Group: ${artifact.templeGroup}
- Description: ${artifact.description}
- Historical Context: ${artifact.historicalContext}
- Cultural Significance: ${artifact.culturalSignificance}

Requirements:
- Generate between ${this.QA_SPECS.minQuestionCount} and ${this.QA_SPECS.maxQuestionCount} question-answer pairs
- Language: ${targetLanguage}
- Cover various aspects: history, significance, architecture, cultural context, visitor information
- Questions should be natural and conversational, as visitors would ask
- Answers should be informative, accurate, and engaging (2-4 sentences each)
- Include confidence score (0.0-1.0) for each answer based on information availability
- Include sources for each answer (e.g., "artifact description", "historical context", "cultural significance")

Format your response as a JSON array with this exact structure:

[
  {
    "question": "Question text in ${targetLanguage}?",
    "answer": "Detailed answer in ${targetLanguage}.",
    "confidence": 0.95,
    "sources": ["artifact description", "historical context"]
  },
  {
    "question": "Another question in ${targetLanguage}?",
    "answer": "Another detailed answer in ${targetLanguage}.",
    "confidence": 0.90,
    "sources": ["cultural significance"]
  }
]

Generate diverse questions covering:
1. What is this artifact?
2. When was it created/built?
3. Who created it?
4. What is its historical significance?
5. What is its cultural importance?
6. What are its unique features?
7. What materials were used?
8. What is its architectural style?
9. What religious/spiritual significance does it have?
10. What can visitors see/experience?

Provide ONLY the JSON array, no additional text or explanation.`;
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
   * Parse Q&A pairs from Bedrock response
   * @param response - Bedrock response text
   * @param artifact - Artifact metadata for fallback generation
   * @returns Array of Q&A pairs
   */
  private parseQAPairs(response: string, artifact: ArtifactMetadata): QAPair[] {
    try {
      // Try to extract JSON from the response
      // Sometimes the model includes markdown code blocks
      let jsonText = response.trim();
      
      // Remove markdown code blocks if present
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }

      // Try to find JSON array in the text
      const jsonMatch = jsonText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        jsonText = jsonMatch[0];
      }

      // Parse the JSON
      const parsed = JSON.parse(jsonText);
      
      if (!Array.isArray(parsed)) {
        throw new Error('Response is not an array');
      }

      // Validate and normalize each Q&A pair
      const qaPairs: QAPair[] = parsed
        .filter((item: any) => item.question && item.answer)
        .map((item: any) => ({
          question: String(item.question).trim(),
          answer: String(item.answer).trim(),
          confidence: typeof item.confidence === 'number' ? item.confidence : 0.85,
          sources: Array.isArray(item.sources) ? item.sources : ['artifact metadata'],
        }));

      // Ensure we have at least the minimum number of Q&A pairs
      if (qaPairs.length < this.QA_SPECS.minQuestionCount) {
        // Add fallback Q&A pairs if needed
        const fallbackPairs = this.generateFallbackQAPairs(artifact);
        qaPairs.push(...fallbackPairs.slice(0, this.QA_SPECS.minQuestionCount - qaPairs.length));
      }

      // Limit to maximum number of Q&A pairs
      return qaPairs.slice(0, this.QA_SPECS.maxQuestionCount);

    } catch (error) {
      // If parsing fails, generate fallback Q&A pairs
      console.warn('Failed to parse Q&A pairs from Bedrock response, using fallback:', error);
      return this.generateFallbackQAPairs(artifact);
    }
  }

  /**
   * Generate fallback Q&A pairs from artifact metadata
   * @param artifact - Artifact metadata
   * @returns Array of fallback Q&A pairs
   */
  private generateFallbackQAPairs(artifact: ArtifactMetadata): QAPair[] {
    const pairs: QAPair[] = [];

    // Q1: What is this artifact?
    pairs.push({
      question: `What is ${artifact.name}?`,
      answer: artifact.description || `${artifact.name} is a ${artifact.type} located at ${artifact.templeGroup}.`,
      confidence: 0.95,
      sources: ['artifact description'],
    });

    // Q2: Where is it located?
    pairs.push({
      question: `Where is ${artifact.name} located?`,
      answer: `${artifact.name} is located at ${artifact.templeGroup}.`,
      confidence: 0.95,
      sources: ['artifact metadata'],
    });

    // Q3: What is its historical significance?
    if (artifact.historicalContext) {
      pairs.push({
        question: `What is the historical significance of ${artifact.name}?`,
        answer: artifact.historicalContext,
        confidence: 0.90,
        sources: ['historical context'],
      });
    }

    // Q4: What is its cultural importance?
    if (artifact.culturalSignificance) {
      pairs.push({
        question: `What is the cultural importance of ${artifact.name}?`,
        answer: artifact.culturalSignificance,
        confidence: 0.90,
        sources: ['cultural significance'],
      });
    }

    // Q5: What type of artifact is it?
    pairs.push({
      question: `What type of artifact is ${artifact.name}?`,
      answer: `${artifact.name} is classified as a ${artifact.type}.`,
      confidence: 0.95,
      sources: ['artifact metadata'],
    });

    // Q6: Why should visitors see this?
    pairs.push({
      question: `Why should visitors see ${artifact.name}?`,
      answer: `Visitors should see ${artifact.name} because of its unique ${artifact.type} characteristics and its significance to ${artifact.templeGroup}. ${artifact.culturalSignificance || artifact.historicalContext || ''}`,
      confidence: 0.85,
      sources: ['artifact metadata', 'cultural significance'],
    });

    // Q7: What can visitors learn from this artifact?
    pairs.push({
      question: `What can visitors learn from ${artifact.name}?`,
      answer: `Visitors can learn about the rich heritage and cultural traditions represented by ${artifact.name}, including its historical context and significance to the region.`,
      confidence: 0.80,
      sources: ['artifact metadata'],
    });

    return pairs.slice(0, this.QA_SPECS.maxQuestionCount);
  }

  /**
   * Validate that the Q&A knowledge base meets specifications
   * @param qaKnowledgeBase - Q&A knowledge base structure
   * @returns True if valid
   */
  validateQAKnowledgeBase(qaKnowledgeBase: QAKnowledgeBase): boolean {
    // Check Q&A pairs exist
    if (!qaKnowledgeBase.questionAnswerPairs || !Array.isArray(qaKnowledgeBase.questionAnswerPairs)) {
      return false;
    }

    // Check minimum number of Q&A pairs
    if (qaKnowledgeBase.questionAnswerPairs.length < this.QA_SPECS.minQuestionCount) {
      return false;
    }

    // Check each Q&A pair has required fields
    for (const pair of qaKnowledgeBase.questionAnswerPairs) {
      if (!pair.question || !pair.answer) {
        return false;
      }

      // Check question is not empty
      if (pair.question.trim().length === 0) {
        return false;
      }

      // Check answer is not empty
      if (pair.answer.trim().length === 0) {
        return false;
      }

      // Check confidence is a valid number between 0 and 1
      if (typeof pair.confidence !== 'number' || pair.confidence < 0 || pair.confidence > 1) {
        return false;
      }

      // Check sources is an array
      if (!Array.isArray(pair.sources) || pair.sources.length === 0) {
        return false;
      }
    }

    return true;
  }

  /**
   * Estimate the file size of the Q&A knowledge base
   * @param qaKnowledgeBase - Q&A knowledge base structure
   * @returns Estimated file size in bytes
   */
  estimateFileSize(qaKnowledgeBase: QAKnowledgeBase): number {
    const jsonContent = JSON.stringify(qaKnowledgeBase, null, 2);
    return Buffer.byteLength(jsonContent, 'utf-8');
  }

  /**
   * Get Q&A format specifications
   * @returns Q&A format specs
   */
  getQASpecs() {
    return { ...this.QA_SPECS };
  }
}
