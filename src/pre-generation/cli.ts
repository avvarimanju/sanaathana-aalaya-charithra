#!/usr/bin/env node
/**
 * CLI Interface for Content Pre-Generation System
 * 
 * Provides a command-line interface to the PreGenerationOrchestrator.
 * Supports filtering by temple groups, artifact IDs, languages, and content types.
 * Displays real-time progress and handles user confirmation for cost approval.
 * 
 * Usage:
 *   npm run pre-generate
 *   npm run pre-generate -- --temple-groups lepakshi-temple-andhra
 *   npm run pre-generate -- --languages en,hi --content-types audio_guide,video
 *   npm run pre-generate -- --force --dry-run
 * 
 * Requirements: 11.1, 11.2, 11.3, 11.4, 5.5
 */

import { PreGenerationOrchestrator } from './orchestrator';
import { Language } from '../models/common';
import { ContentType } from './types';

/**
 * Parse command-line arguments
 */
function parseArgs(): {
  templeGroups?: string[];
  artifactIds?: string[];
  siteIds?: string[];
  languages?: Language[];
  contentTypes?: ContentType[];
  force?: boolean;
  dryRun?: boolean;
  resume?: string;
  help?: boolean;
} {
  const args = process.argv.slice(2);
  const options: any = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case '--temple-groups':
        options.templeGroups = args[++i]?.split(',').map(s => s.trim());
        break;
      case '--artifact-ids':
        options.artifactIds = args[++i]?.split(',').map(s => s.trim());
        break;
      case '--site-ids':
        options.siteIds = args[++i]?.split(',').map(s => s.trim());
        break;
      case '--languages':
        options.languages = args[++i]?.split(',').map(s => s.trim());
        break;
      case '--content-types':
        options.contentTypes = args[++i]?.split(',').map(s => s.trim());
        break;
      case '--force':
        options.force = true;
        break;
      case '--dry-run':
        options.dryRun = true;
        break;
      case '--resume':
        options.resume = args[++i];
        break;
      case '--help':
      case '-h':
        options.help = true;
        break;
      default:
        if (arg.startsWith('--')) {
          console.error(`Unknown option: ${arg}`);
          process.exit(1);
        }
    }
  }

  return options;
}

/**
 * Display help message
 */
function displayHelp(): void {
  console.log(`
Content Pre-Generation System CLI

Usage:
  npm run pre-generate [options]

Options:
  --temple-groups <groups>    Comma-separated list of temple groups to process
                              Example: --temple-groups lepakshi-temple-andhra,thanjavur-temple-tamilnadu

  --artifact-ids <ids>        Comma-separated list of artifact IDs to process
                              Example: --artifact-ids hanging-pillar,venkateswara-main-temple

  --site-ids <ids>            Comma-separated list of site IDs to process
                              Example: --site-ids site1,site2

  --languages <langs>         Comma-separated list of language codes to generate
                              Supported: en, hi, ta, te, bn, mr, gu, kn, ml, pa
                              Example: --languages en,hi,ta

  --content-types <types>     Comma-separated list of content types to generate
                              Supported: audio_guide, video, infographic, qa_knowledge_base
                              Example: --content-types audio_guide,video

  --force                     Force regeneration even if cached content exists

  --dry-run                   Calculate cost estimate without generating content

  --resume <jobId>            Resume a previously interrupted job

  --help, -h                  Display this help message

Examples:
  # Generate all content for all artifacts
  npm run pre-generate

  # Generate only audio guides and videos in English and Hindi
  npm run pre-generate -- --languages en,hi --content-types audio_guide,video

  # Generate content for specific temple group
  npm run pre-generate -- --temple-groups lepakshi-temple-andhra

  # Dry run to estimate costs
  npm run pre-generate -- --dry-run

  # Force regeneration of all content
  npm run pre-generate -- --force

  # Resume interrupted job
  npm run pre-generate -- --resume job-12345
`);
}

/**
 * Validate CLI arguments
 */
function validateArgs(options: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validate languages
  if (options.languages) {
    const validLanguages = ['en', 'hi', 'ta', 'te', 'bn', 'mr', 'gu', 'kn', 'ml', 'pa'];
    for (const lang of options.languages) {
      if (!validLanguages.includes(lang)) {
        errors.push(`Invalid language code: ${lang}. Supported: ${validLanguages.join(', ')}`);
      }
    }
  }

  // Validate content types
  if (options.contentTypes) {
    const validContentTypes = ['audio_guide', 'video', 'infographic', 'qa_knowledge_base'];
    for (const type of options.contentTypes) {
      if (!validContentTypes.includes(type)) {
        errors.push(`Invalid content type: ${type}. Supported: ${validContentTypes.join(', ')}`);
      }
    }
  }

  // Validate that arrays are not empty
  if (options.templeGroups && options.templeGroups.length === 0) {
    errors.push('--temple-groups requires at least one temple group');
  }
  if (options.artifactIds && options.artifactIds.length === 0) {
    errors.push('--artifact-ids requires at least one artifact ID');
  }
  if (options.siteIds && options.siteIds.length === 0) {
    errors.push('--site-ids requires at least one site ID');
  }
  if (options.languages && options.languages.length === 0) {
    errors.push('--languages requires at least one language code');
  }
  if (options.contentTypes && options.contentTypes.length === 0) {
    errors.push('--content-types requires at least one content type');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Main CLI entry point
 */
async function main(): Promise<void> {
  try {
    // Parse arguments
    const options = parseArgs();

    // Display help if requested
    if (options.help) {
      displayHelp();
      process.exit(0);
    }

    // Validate arguments
    const validation = validateArgs(options);
    if (!validation.valid) {
      console.error('❌ Invalid arguments:\n');
      validation.errors.forEach(error => console.error(`   ${error}`));
      console.error('\nUse --help for usage information');
      process.exit(1);
    }

    // Display banner
    console.log('╔════════════════════════════════════════════════════════════════╗');
    console.log('║     Content Pre-Generation System                              ║');
    console.log('║     Sanaathana Aalaya Charithra Heritage Platform             ║');
    console.log('╚════════════════════════════════════════════════════════════════╝');
    console.log();

    // Initialize orchestrator
    const orchestrator = new PreGenerationOrchestrator();

    // Build orchestrator options
    const orchestratorOptions: any = {
      templeGroups: options.templeGroups,
      artifactIds: options.artifactIds,
      siteIds: options.siteIds,
      languages: options.languages,
      contentTypes: options.contentTypes,
      forceRegenerate: options.force || false,
      dryRun: options.dryRun || false,
      resumeJobId: options.resume,
    };

    // Display execution mode
    if (options.dryRun) {
      console.log('🔍 Mode: Dry Run (cost estimation only)');
    } else if (options.force) {
      console.log('⚡ Mode: Force Regeneration');
    } else if (options.resume) {
      console.log(`🔄 Mode: Resume Job (${options.resume})`);
    } else {
      console.log('▶️  Mode: Normal Generation');
    }

    // Display filters if any
    if (options.templeGroups) {
      console.log(`   Temple Groups: ${options.templeGroups.join(', ')}`);
    }
    if (options.artifactIds) {
      console.log(`   Artifact IDs: ${options.artifactIds.join(', ')}`);
    }
    if (options.siteIds) {
      console.log(`   Site IDs: ${options.siteIds.join(', ')}`);
    }
    if (options.languages) {
      console.log(`   Languages: ${options.languages.join(', ')}`);
    }
    if (options.contentTypes) {
      console.log(`   Content Types: ${options.contentTypes.join(', ')}`);
    }
    console.log();

    // Execute orchestrator
    const result = await orchestrator.execute(orchestratorOptions);

    // Display final summary
    console.log();
    console.log('╔════════════════════════════════════════════════════════════════╗');
    console.log('║     Generation Complete                                        ║');
    console.log('╚════════════════════════════════════════════════════════════════╝');
    console.log();
    console.log(`✅ Total Items: ${result.totalItems}`);
    console.log(`✅ Succeeded: ${result.succeeded}`);
    console.log(`⏭️  Skipped: ${result.skipped}`);
    console.log(`❌ Failed: ${result.failed}`);
    console.log(`⏱️  Duration: ${formatDuration(result.duration)}`);
    console.log(`💰 Estimated Cost: ₹${result.estimatedCost.toFixed(2)}`);
    console.log(`💰 Actual Cost: ₹${result.actualCost.toFixed(2)}`);
    console.log();

    if (result.failed > 0) {
      console.log('⚠️  Some items failed. Check the failure report for details.');
      console.log();
    }

    // Exit with appropriate code
    process.exit(result.failed > 0 ? 1 : 0);
  } catch (error) {
    console.error();
    console.error('❌ Fatal Error:');
    console.error();
    if (error instanceof Error) {
      console.error(`   ${error.message}`);
      if (error.stack) {
        console.error();
        console.error('Stack trace:');
        console.error(error.stack);
      }
    } else {
      console.error(`   ${String(error)}`);
    }
    console.error();
    process.exit(1);
  }
}

/**
 * Format duration in milliseconds to human-readable string
 */
function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

// Run CLI
if (require.main === module) {
  main();
}
