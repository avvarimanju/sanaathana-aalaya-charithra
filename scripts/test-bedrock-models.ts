/**
 * Test Script: Compare Bedrock Models (Haiku vs Sonnet)
 * 
 * This script demonstrates the difference between:
 * - Claude 3 Haiku (Staging - Fast & Cheap)
 * - Claude 3 Sonnet (Production - High Quality)
 * 
 * Usage:
 *   ts-node scripts/test-bedrock-models.ts
 */

import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';

// Configuration
const REGION = 'ap-south-1'; // Mumbai region
const MODELS = {
  haiku: 'anthropic.claude-3-haiku-20240307-v1:0',
  sonnet: 'anthropic.claude-3-sonnet-20240229-v1:0',
};

// Sample prompt for temple description
const SAMPLE_PROMPT = `Generate a detailed description for the Lepakshi Temple's famous Hanging Pillar.

Include:
1. Historical significance
2. Architectural marvel
3. Legend behind it
4. Why it's unique

Keep it engaging and informative for tourists. Maximum 200 words.`;

interface ModelResponse {
  model: string;
  content: string;
  tokensUsed: number;
  latencyMs: number;
  cost: number;
}

/**
 * Invoke Bedrock model and measure performance
 */
async function testModel(modelId: string, modelName: string): Promise<ModelResponse> {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`Testing: ${modelName} (${modelId})`);
  console.log('='.repeat(80));

  const client = new BedrockRuntimeClient({ region: REGION });
  
  const requestBody = {
    anthropic_version: 'bedrock-2023-05-31',
    max_tokens: 2048,
    temperature: 0.7,
    messages: [
      {
        role: 'user',
        content: SAMPLE_PROMPT,
      },
    ],
  };

  const startTime = Date.now();

  try {
    const command = new InvokeModelCommand({
      modelId,
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify(requestBody),
    });

    const response = await client.send(command);
    const latencyMs = Date.now() - startTime;

    // Parse response
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    const content = responseBody.content[0].text;
    const tokensUsed = responseBody.usage.input_tokens + responseBody.usage.output_tokens;

    // Calculate cost (approximate)
    const cost = calculateCost(modelName, responseBody.usage.input_tokens, responseBody.usage.output_tokens);

    console.log(`\n✅ Success!`);
    console.log(`⏱️  Latency: ${latencyMs}ms`);
    console.log(`🎯 Tokens Used: ${tokensUsed} (Input: ${responseBody.usage.input_tokens}, Output: ${responseBody.usage.output_tokens})`);
    console.log(`💰 Cost: $${cost.toFixed(6)}`);
    console.log(`\n📝 Generated Content:\n`);
    console.log(content);

    return {
      model: modelName,
      content,
      tokensUsed,
      latencyMs,
      cost,
    };
  } catch (error: any) {
    console.error(`\n❌ Error: ${error.message}`);
    
    if (error.name === 'AccessDeniedException') {
      console.log(`\n⚠️  Model access not enabled. To enable:`);
      console.log(`   1. Go to AWS Console → Bedrock → Model access`);
      console.log(`   2. Request access to Claude 3 models`);
      console.log(`   3. Wait for approval (usually instant)`);
    }

    throw error;
  }
}

/**
 * Calculate approximate cost based on token usage
 */
function calculateCost(model: string, inputTokens: number, outputTokens: number): number {
  // Pricing as of March 2026 (approximate)
  const pricing: Record<string, { input: number; output: number }> = {
    haiku: {
      input: 0.25 / 1_000_000,  // $0.25 per 1M input tokens
      output: 1.25 / 1_000_000, // $1.25 per 1M output tokens
    },
    sonnet: {
      input: 3.0 / 1_000_000,   // $3.00 per 1M input tokens
      output: 15.0 / 1_000_000, // $15.00 per 1M output tokens
    },
  };

  const modelPricing = pricing[model.toLowerCase()] || pricing.sonnet;
  return inputTokens * modelPricing.input + outputTokens * modelPricing.output;
}

/**
 * Compare both models side by side
 */
async function compareModels() {
  console.log('\n' + '='.repeat(80));
  console.log('🔬 BEDROCK MODEL COMPARISON TEST');
  console.log('='.repeat(80));
  console.log('\nComparing:');
  console.log('  • Claude 3 Haiku (Staging) - Fast & Cheap');
  console.log('  • Claude 3 Sonnet (Production) - High Quality');
  console.log('\nRegion:', REGION);
  console.log('Prompt:', SAMPLE_PROMPT.substring(0, 100) + '...');

  const results: ModelResponse[] = [];

  // Test Haiku (Staging)
  try {
    const haikuResult = await testModel(MODELS.haiku, 'Haiku');
    results.push(haikuResult);
  } catch (error) {
    console.log('\n⚠️  Haiku test failed, continuing with Sonnet...');
  }

  // Wait a bit between requests
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Test Sonnet (Production)
  try {
    const sonnetResult = await testModel(MODELS.sonnet, 'Sonnet');
    results.push(sonnetResult);
  } catch (error) {
    console.log('\n⚠️  Sonnet test failed');
  }

  // Print comparison
  if (results.length === 2) {
    printComparison(results[0], results[1]);
  } else if (results.length === 1) {
    console.log('\n⚠️  Only one model tested successfully');
  } else {
    console.log('\n❌ Both models failed. Check AWS credentials and model access.');
  }
}

/**
 * Print side-by-side comparison
 */
function printComparison(haiku: ModelResponse, sonnet: ModelResponse) {
  console.log('\n\n' + '='.repeat(80));
  console.log('📊 COMPARISON RESULTS');
  console.log('='.repeat(80));

  console.log('\n┌─────────────────────┬──────────────────┬──────────────────┐');
  console.log('│ Metric              │ Haiku (Staging)  │ Sonnet (Prod)    │');
  console.log('├─────────────────────┼──────────────────┼──────────────────┤');
  console.log(`│ Latency             │ ${haiku.latencyMs.toString().padEnd(16)} │ ${sonnet.latencyMs.toString().padEnd(16)} │`);
  console.log(`│ Tokens Used         │ ${haiku.tokensUsed.toString().padEnd(16)} │ ${sonnet.tokensUsed.toString().padEnd(16)} │`);
  console.log(`│ Cost                │ $${haiku.cost.toFixed(6).padEnd(15)} │ $${sonnet.cost.toFixed(6).padEnd(15)} │`);
  console.log('└─────────────────────┴──────────────────┴──────────────────┘');

  const speedDiff = ((sonnet.latencyMs - haiku.latencyMs) / haiku.latencyMs * 100).toFixed(1);
  const costDiff = ((sonnet.cost - haiku.cost) / haiku.cost * 100).toFixed(1);

  console.log('\n📈 Analysis:');
  console.log(`  • Haiku is ${Math.abs(Number(speedDiff))}% ${Number(speedDiff) < 0 ? 'slower' : 'faster'} than Sonnet`);
  console.log(`  • Haiku is ${Math.abs(Number(costDiff))}% ${Number(costDiff) < 0 ? 'more expensive' : 'cheaper'} than Sonnet`);

  console.log('\n💡 Recommendations:');
  console.log('  • Use Haiku for: Testing, development, QA, bulk generation');
  console.log('  • Use Sonnet for: Production content, user-facing features, high-quality needs');

  console.log('\n📝 Content Quality Comparison:');
  console.log('\nHaiku Output Length:', haiku.content.length, 'characters');
  console.log('Sonnet Output Length:', sonnet.content.length, 'characters');
  console.log('\n(Review the generated content above to compare quality)');
}

/**
 * Main execution
 */
async function main() {
  try {
    await compareModels();
    
    console.log('\n\n' + '='.repeat(80));
    console.log('✅ TEST COMPLETE');
    console.log('='.repeat(80));
    console.log('\nNext Steps:');
    console.log('  1. Review the generated content quality');
    console.log('  2. Compare latency and cost differences');
    console.log('  3. Decide which model to use for each environment');
    console.log('\nEnvironment Configuration:');
    console.log('  • Staging:    BEDROCK_MODEL=anthropic.claude-3-haiku-20240307-v1:0');
    console.log('  • Production: BEDROCK_MODEL=anthropic.claude-3-sonnet-20240229-v1:0');
    console.log('');
  } catch (error: any) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

export { testModel, compareModels };
