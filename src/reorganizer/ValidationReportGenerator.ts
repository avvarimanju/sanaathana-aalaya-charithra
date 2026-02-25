/**
 * ValidationReportGenerator - Generates validation reports for reorganization
 * 
 * This component validates that the reorganization completed successfully by
 * checking file locations, root directory cleanliness, and reference integrity.
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import { RelocationMap, ValidationReport } from './types';
import { ReferenceUpdater } from './ReferenceUpdater';

/**
 * Generates a validation report for the reorganization
 */
export class ValidationReportGenerator {
  private referenceUpdater: ReferenceUpdater;

  constructor() {
    this.referenceUpdater = new ReferenceUpdater();
  }

  /**
   * Generates a complete validation report
   * @param relocationMap - Map of source to destination paths
   * @param projectRoot - Root directory of the project
   * @returns ValidationReport with all findings
   */
  async generateValidationReport(
    relocationMap: RelocationMap,
    projectRoot: string
  ): Promise<ValidationReport> {
    const report: ValidationReport = {
      success: true,
      filesMovedCount: relocationMap.size,
      filesInCorrectLocation: [],
      filesInWrongLocation: [],
      brokenReferences: [],
      rootDirectoryClean: false,
      unexpectedRootFiles: []
    };

    // Check all files are in correct locations
    for (const [sourcePath, destPath] of relocationMap.entries()) {
      const fullDestPath = path.join(projectRoot, destPath);
      const fullSourcePath = path.join(projectRoot, sourcePath);

      try {
        // Check if file exists at destination
        await fs.access(fullDestPath);
        report.filesInCorrectLocation.push(destPath);

        // Check if file still exists at source (shouldn't)
        try {
          await fs.access(fullSourcePath);
          report.filesInWrongLocation.push(sourcePath);
          report.success = false;
        } catch {
          // Good - file no longer at source
        }
      } catch {
        // File not at destination
        report.filesInWrongLocation.push(destPath);
        report.success = false;
      }
    }

    // Check root directory cleanliness
    const rootCleanResult = await this.checkRootDirectoryClean(projectRoot);
    report.rootDirectoryClean = rootCleanResult.clean;
    report.unexpectedRootFiles = rootCleanResult.unexpectedFiles;
    
    if (!rootCleanResult.clean) {
      report.success = false;
    }

    // Check for broken references
    report.brokenReferences = await this.referenceUpdater.validateReferences(projectRoot);
    
    if (report.brokenReferences.length > 0) {
      report.success = false;
    }

    return report;
  }

  /**
   * Checks if root directory contains only expected files
   * @param projectRoot - Root directory to check
   * @returns Object with clean status and list of unexpected files
   */
  private async checkRootDirectoryClean(projectRoot: string): Promise<{
    clean: boolean;
    unexpectedFiles: string[];
  }> {
    const expectedFiles = [
      'README.md',
      '.env.example',
      '.eslintrc.json',
      '.gitignore',
      'cdk.json',
      'package.json',
      'package-lock.json',
      'template.yaml',
      'tsconfig.json'
    ];

    const unexpectedFiles: string[] = [];

    try {
      const entries = await fs.readdir(projectRoot, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.isFile()) {
          const filename = entry.name;
          
          // Check if it's a markdown file
          if (filename.endsWith('.md') && filename !== 'README.md') {
            unexpectedFiles.push(filename);
          }
          
          // Check if it's an unexpected file
          if (!expectedFiles.includes(filename) && !filename.startsWith('.')) {
            // Allow some common files that might exist
            const allowedExtensions = ['.json', '.js', '.ts', '.yaml', '.yml', '.txt'];
            const ext = path.extname(filename);
            
            if (!allowedExtensions.includes(ext)) {
              unexpectedFiles.push(filename);
            }
          }
        }
      }
    } catch (error) {
      console.error(`Error checking root directory: ${error instanceof Error ? error.message : String(error)}`);
      return { clean: false, unexpectedFiles: [] };
    }

    return {
      clean: unexpectedFiles.length === 0,
      unexpectedFiles
    };
  }

  /**
   * Formats a validation report as a human-readable string
   * @param report - ValidationReport to format
   * @returns Formatted report string
   */
  formatReport(report: ValidationReport): string {
    const lines: string[] = [];

    lines.push('='.repeat(60));
    lines.push('REORGANIZATION VALIDATION REPORT');
    lines.push('='.repeat(60));
    lines.push('');

    // Overall status
    lines.push(`Status: ${report.success ? '✓ SUCCESS' : '✗ FAILED'}`);
    lines.push(`Files moved: ${report.filesMovedCount}`);
    lines.push('');

    // File locations
    lines.push(`Files in correct location: ${report.filesInCorrectLocation.length}`);
    if (report.filesInWrongLocation.length > 0) {
      lines.push(`Files in wrong location: ${report.filesInWrongLocation.length}`);
      report.filesInWrongLocation.forEach(file => {
        lines.push(`  - ${file}`);
      });
      lines.push('');
    }

    // Root directory cleanliness
    lines.push(`Root directory clean: ${report.rootDirectoryClean ? '✓ Yes' : '✗ No'}`);
    if (report.unexpectedRootFiles.length > 0) {
      lines.push('Unexpected files in root:');
      report.unexpectedRootFiles.forEach(file => {
        lines.push(`  - ${file}`);
      });
      lines.push('');
    }

    // Broken references
    if (report.brokenReferences.length > 0) {
      lines.push(`Broken references found: ${report.brokenReferences.length}`);
      report.brokenReferences.forEach(ref => {
        lines.push(`  - ${ref.filePath}:${ref.lineNumber} -> ${ref.referencedPath}`);
      });
      lines.push('');
    } else {
      lines.push('Broken references: None');
      lines.push('');
    }

    lines.push('='.repeat(60));

    return lines.join('\n');
  }
}
