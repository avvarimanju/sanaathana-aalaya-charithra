/**
 * FileClassifier - Identifies and categorizes files for relocation
 *
 * This component scans the root directory and determines which files should be
 * moved to organized subdirectories within docs/. It implements classification
 * rules based on file types and names.
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import { RelocationMap, FileCategory } from './types';

/**
 * Classification rules mapping file categories to specific filenames
 */
export const CLASSIFICATION_RULES: Record<string, string[]> = {
  checklists: [
    'ANDROID_LAUNCH_CHECKLIST.md',
    'IMMEDIATE_ACTIONS_CHECKLIST.md'
  ],
  status: [
    'COMPLETE_PROJECT_STATUS.md',
    'PAYMENT_INTEGRATION_STATUS.md',
    'PRE_GENERATION_STATUS.md'
  ],
  guides: [
    'RAZORPAY_API_KEYS_SETUP.md',
    'QUICK_START_GUIDE.md'
  ],
  analysis: [
    'PROJECT_GAP_ANALYSIS.md',
    'ORGANIZATION_SUMMARY.md'
  ],
  general: [
    'DOCUMENTATION.md',
    'HOW_IT_WORKS.md',
    'USER_GUIDE.md'
  ]
};

/**
 * Files that should be preserved in the root directory
 */
export const PRESERVE_IN_ROOT: string[] = [
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

/**
 * FileClassifier class for identifying and categorizing files
 */
export class FileClassifier {
  /**
   * Determines if a file should be relocated
   * @param filename - Name of the file to check
   * @returns true if file should be relocated, false otherwise
   */
  shouldRelocate(filename: string): boolean {
    // Preserve files explicitly listed in PRESERVE_IN_ROOT
    if (PRESERVE_IN_ROOT.includes(filename)) {
      return false;
    }

    // Only relocate markdown files
    if (!filename.endsWith('.md')) {
      return false;
    }

    // Check if file is in any of the classification categories
    for (const category in CLASSIFICATION_RULES) {
      if (CLASSIFICATION_RULES[category].includes(filename)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Determines the target subdirectory for a file
   * @param filename - Name of the file to categorize
   * @returns Relative path to target directory (e.g., 'docs/checklists/')
   */
  categorizeFile(filename: string): string {
    // Check each category to find where this file belongs
    for (const category in CLASSIFICATION_RULES) {
      if (CLASSIFICATION_RULES[category].includes(filename)) {
        // General documentation goes directly to docs/, not docs/general/
        if (category === 'general') {
          return 'docs/';
        }
        // Return path with docs/ prefix and category subdirectory
        return `docs/${category}/`;
      }
    }

    // Default to general docs directory if not in any specific category
    return 'docs/';
  }

  /**
   * Scans the root directory and builds a relocation map
   * @param rootPath - Absolute path to project root
   * @returns Map of source paths to destination paths
   */
  async classifyFiles(rootPath: string): Promise<RelocationMap> {
    const relocationMap: RelocationMap = new Map();

    try {
      // Read all entries in the root directory
      const entries = await fs.readdir(rootPath, { withFileTypes: true });

      // Process only files (not directories)
      for (const entry of entries) {
        if (entry.isFile()) {
          const filename = entry.name;

          // Check if this file should be relocated
          if (this.shouldRelocate(filename)) {
            // Determine the target directory for this file
            const targetDir = this.categorizeFile(filename);

            // Build source and destination paths
            const sourcePath = filename;
            // Use forward slashes for consistency across platforms
            const destPath = path.join(targetDir, filename).replace(/\\/g, '/');

            // Add to relocation map
            relocationMap.set(sourcePath, destPath);
          }
        }
      }
    } catch (error) {
      throw new Error(`Failed to scan root directory: ${error instanceof Error ? error.message : String(error)}`);
    }

    return relocationMap;
  }
}
