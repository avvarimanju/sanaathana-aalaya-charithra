#!/usr/bin/env node

/**
 * CLI for project structure reorganization
 * 
 * Usage:
 *   npm run reorganize [options]
 *   
 * Options:
 *   --dry-run          Preview changes without executing
 *   --no-git           Don't use git mv (use standard file operations)
 *   --no-readme        Don't update README.md
 *   --no-validate      Skip validation after reorganization
 *   --project-root     Project root directory (default: current directory)
 *   --help             Show help message
 */

import * as path from 'path';
import { reorganize } from './Reorganizer';
import { ReorganizationConfig } from './types';
import { ValidationReportGenerator } from './ValidationReportGenerator';

/**
 * Parses command-line arguments
 * @returns Reorganization configuration
 */
function parseArgs(): ReorganizationConfig {
  const args = process.argv.slice(2);
  
  const config: ReorganizationConfig = {
    projectRoot: process.cwd(),
    docsBaseDir: 'docs/',
    useGit: true,
    dryRun: false,
    updateReadme: true,
    validateAfter: true
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case '--dry-run':
        config.dryRun = true;
        break;
      
      case '--no-git':
        config.useGit = false;
        break;
      
      case '--no-readme':
        config.updateReadme = false;
        break;
      
      case '--no-validate':
        config.validateAfter = false;
        break;
      
      case '--project-root':
        if (i + 1 < args.length) {
          config.projectRoot = path.resolve(args[i + 1]);
          i++;
        } else {
          console.error('Error: --project-root requires a path argument');
          process.exit(1);
        }
        break;
      
      case '--help':
      case '-h':
        showHelp();
        process.exit(0);
        break;
      
      default:
        console.error(`Unknown option: ${arg}`);
        console.error('Use --help to see available options');
        process.exit(1);
    }
  }

  return config;
}

/**
 * Shows help message
 */
function showHelp(): void {
  console.log(`
Project Structure Reorganization Tool

Usage:
  npm run reorganize [options]

Options:
  --dry-run          Preview changes without executing them
  --no-git           Don't use git mv (use standard file operations)
  --no-readme        Don't update README.md with documentation index
  --no-validate      Skip validation after reorganization
  --project-root     Specify project root directory (default: current directory)
  --help, -h         Show this help message

Examples:
  # Preview changes without executing
  npm run reorganize -- --dry-run

  # Reorganize without git history preservation
  npm run reorganize -- --no-git

  # Reorganize a specific project directory
  npm run reorganize -- --project-root /path/to/project

  # Full reorganization with all features
  npm run reorganize
`);
}

/**
 * Main CLI entry point
 */
async function main(): Promise<void> {
  console.log('='.repeat(60));
  console.log('PROJECT STRUCTURE REORGANIZATION TOOL');
  console.log('='.repeat(60));
  console.log('');

  try {
    // Parse command-line arguments
    const config = parseArgs();

    // Display configuration
    console.log('Configuration:');
    console.log(`  Project Root: ${config.projectRoot}`);
    console.log(`  Dry Run: ${config.dryRun ? 'Yes' : 'No'}`);
    console.log(`  Use Git: ${config.useGit ? 'Yes' : 'No'}`);
    console.log(`  Update README: ${config.updateReadme ? 'Yes' : 'No'}`);
    console.log(`  Validate After: ${config.validateAfter ? 'Yes' : 'No'}`);
    console.log('');

    // Execute reorganization
    const report = await reorganize(config);

    // Display validation report
    if (config.validateAfter && !config.dryRun) {
      const reportGenerator = new ValidationReportGenerator();
      const formattedReport = reportGenerator.formatReport(report);
      console.log(formattedReport);
    }

    // Exit with appropriate status code
    if (report.success) {
      console.log('✓ Reorganization completed successfully!');
      process.exit(0);
    } else {
      console.error('✗ Reorganization completed with errors. Please review the report above.');
      process.exit(1);
    }

  } catch (error) {
    console.error('\n✗ Fatal error during reorganization:');
    console.error(error instanceof Error ? error.message : String(error));
    
    if (error instanceof Error && error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
    
    process.exit(1);
  }
}

// Run CLI if executed directly
if (require.main === module) {
  main();
}

export { main, parseArgs, showHelp };
