/**
 * Core types for the project structure reorganization system
 */

/**
 * Maps source file paths to destination paths
 */
export type RelocationMap = Map<string, string>;

/**
 * Result of a file move operation
 */
export interface MoveResult {
  sourcePath: string;
  destPath: string;
  success: boolean;
  usedGit: boolean;
  error?: string;
}

/**
 * Represents a file reference that needs updating
 */
export interface Reference {
  filePath: string;        // File containing the reference
  lineNumber: number;      // Line where reference appears
  oldPath: string;         // Current reference path
  newPath: string;         // Updated reference path
  matchedPattern: string;  // Which pattern matched
}

/**
 * Represents a reference to a non-existent file
 */
export interface BrokenReference {
  filePath: string;        // File containing broken reference
  lineNumber: number;      // Line where reference appears
  referencedPath: string;  // Path that doesn't exist
}

/**
 * Enumeration of documentation categories
 */
export enum FileCategory {
  CHECKLIST = 'checklists',
  STATUS = 'status',
  GUIDE = 'guides',
  ANALYSIS = 'analysis',
  GENERAL = 'general',
  PRESERVE = 'preserve'  // Files to keep in root
}

/**
 * Configuration for the reorganization process
 */
export interface ReorganizationConfig {
  projectRoot: string;
  docsBaseDir: string;      // 'docs/'
  useGit: boolean;          // Whether to use git mv
  dryRun: boolean;          // Preview without executing
  updateReadme: boolean;    // Whether to update README
  validateAfter: boolean;   // Whether to validate after completion
}

/**
 * Summary of reorganization validation
 */
export interface ValidationReport {
  success: boolean;
  filesMovedCount: number;
  filesInCorrectLocation: string[];
  filesInWrongLocation: string[];
  brokenReferences: BrokenReference[];
  rootDirectoryClean: boolean;
  unexpectedRootFiles: string[];
}
