/**
 * Reorganizer - Main orchestrator for project structure reorganization
 * 
 * This component coordinates all reorganization operations: file classification,
 * file moving, reference updating, README updating, and validation.
 */

import * as path from 'path';
import { ReorganizationConfig, ValidationReport, RelocationMap } from './types';
import { FileClassifier } from './FileClassifier';
import { FileMover } from './FileMover';
import { ReferenceUpdater } from './ReferenceUpdater';
import { ReadmeUpdater } from './ReadmeUpdater';
import { ValidationReportGenerator } from './ValidationReportGenerator';

/**
 * Main reorganization orchestrator
 */
export class Reorganizer {
  private fileClassifier: FileClassifier;
  private fileMover: FileMover;
  private referenceUpdater: ReferenceUpdater;
  private readmeUpdater: ReadmeUpdater;
  private validationReportGenerator: ValidationReportGenerator;

  constructor() {
    this.fileClassifier = new FileClassifier();
    this.fileMover = new FileMover();
    this.referenceUpdater = new ReferenceUpdater();
    this.readmeUpdater = new ReadmeUpdater();
    this.validationReportGenerator = new ValidationReportGenerator();
  }

  /**
   * Executes the complete reorganization process
   * @param config - Reorganization configuration
   * @returns ValidationReport with results
   */
  async reorganize(config: ReorganizationConfig): Promise<ValidationReport> {
    console.log('Starting project structure reorganization...\n');

    try {
      // Step 1: Classify files and build relocation map
      console.log('Step 1: Classifying files...');
      const relocationMap = await this.fileClassifier.classifyFiles(config.projectRoot);
      console.log(`Found ${relocationMap.size} files to relocate\n`);

      if (relocationMap.size === 0) {
        console.log('No files need to be relocated. Exiting.');
        return {
          success: true,
          filesMovedCount: 0,
          filesInCorrectLocation: [],
          filesInWrongLocation: [],
          brokenReferences: [],
          rootDirectoryClean: true,
          unexpectedRootFiles: []
        };
      }

      // Dry-run mode: preview operations without executing
      if (config.dryRun) {
        console.log('DRY RUN MODE - No changes will be made\n');
        this.previewReorganization(relocationMap);
        return {
          success: true,
          filesMovedCount: 0,
          filesInCorrectLocation: [],
          filesInWrongLocation: [],
          brokenReferences: [],
          rootDirectoryClean: false,
          unexpectedRootFiles: []
        };
      }

      // Step 2: Move files
      console.log('Step 2: Moving files...');
      const moveResults = await this.fileMover.moveFiles(
        this.buildAbsoluteRelocationMap(relocationMap, config.projectRoot)
      );
      
      const successfulMoves = moveResults.filter(r => r.success).length;
      const failedMoves = moveResults.filter(r => !r.success).length;
      console.log(`Moved ${successfulMoves} files successfully`);
      
      if (failedMoves > 0) {
        console.log(`Failed to move ${failedMoves} files`);
        moveResults.filter(r => !r.success).forEach(result => {
          console.log(`  - ${result.sourcePath}: ${result.error}`);
        });
      }
      console.log('');

      // Step 3: Update references
      console.log('Step 3: Updating file references...');
      const modifiedFiles = await this.referenceUpdater.updateReferences(
        relocationMap,
        config.projectRoot
      );
      console.log(`Updated references in ${modifiedFiles.length} files\n`);

      // Step 4: Update README
      if (config.updateReadme) {
        console.log('Step 4: Updating README.md...');
        const readmeUpdated = await this.readmeUpdater.updateReadme(
          relocationMap,
          config.projectRoot
        );
        console.log(readmeUpdated ? 'README updated successfully\n' : 'Failed to update README\n');
      }

      // Step 5: Validate reorganization
      if (config.validateAfter) {
        console.log('Step 5: Validating reorganization...');
        const validationReport = await this.validationReportGenerator.generateValidationReport(
          relocationMap,
          config.projectRoot
        );
        console.log('Validation complete\n');
        return validationReport;
      }

      // Return basic success report if validation is skipped
      return {
        success: true,
        filesMovedCount: successfulMoves,
        filesInCorrectLocation: [],
        filesInWrongLocation: [],
        brokenReferences: [],
        rootDirectoryClean: true,
        unexpectedRootFiles: []
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`\nReorganization failed: ${errorMessage}`);
      
      return {
        success: false,
        filesMovedCount: 0,
        filesInCorrectLocation: [],
        filesInWrongLocation: [],
        brokenReferences: [],
        rootDirectoryClean: false,
        unexpectedRootFiles: []
      };
    }
  }

  /**
   * Previews the reorganization operations without executing them
   * @param relocationMap - Map of source to destination paths
   */
  private previewReorganization(relocationMap: RelocationMap): void {
    console.log('The following files would be moved:\n');

    // Group by category
    const categories: Record<string, Array<[string, string]>> = {
      'Checklists': [],
      'Status': [],
      'Guides': [],
      'Analysis': [],
      'General': []
    };

    for (const [source, dest] of relocationMap.entries()) {
      if (dest.includes('/checklists/')) {
        categories['Checklists'].push([source, dest]);
      } else if (dest.includes('/status/')) {
        categories['Status'].push([source, dest]);
      } else if (dest.includes('/guides/')) {
        categories['Guides'].push([source, dest]);
      } else if (dest.includes('/analysis/')) {
        categories['Analysis'].push([source, dest]);
      } else {
        categories['General'].push([source, dest]);
      }
    }

    for (const [category, files] of Object.entries(categories)) {
      if (files.length > 0) {
        console.log(`${category}:`);
        files.forEach(([source, dest]) => {
          console.log(`  ${source} -> ${dest}`);
        });
        console.log('');
      }
    }
  }

  /**
   * Converts relative paths in relocation map to absolute paths
   * @param relocationMap - Map with relative paths
   * @param projectRoot - Project root directory
   * @returns Map with absolute paths
   */
  private buildAbsoluteRelocationMap(
    relocationMap: RelocationMap,
    projectRoot: string
  ): RelocationMap {
    const absoluteMap: RelocationMap = new Map();

    for (const [source, dest] of relocationMap.entries()) {
      const absoluteSource = path.join(projectRoot, source);
      const absoluteDest = path.join(projectRoot, dest);
      absoluteMap.set(absoluteSource, absoluteDest);
    }

    return absoluteMap;
  }
}

/**
 * Main entry point for reorganization
 * @param config - Reorganization configuration
 * @returns ValidationReport with results
 */
export async function reorganize(config: ReorganizationConfig): Promise<ValidationReport> {
  const reorganizer = new Reorganizer();
  return await reorganizer.reorganize(config);
}
