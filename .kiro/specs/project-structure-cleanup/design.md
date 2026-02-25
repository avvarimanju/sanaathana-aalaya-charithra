# Design Document: Project Structure Cleanup

## Overview

This design specifies the technical approach for reorganizing the Sanaathana Aalaya Charithra project structure by relocating documentation files from the root directory to organized subdirectories within docs/. The system will preserve git history, update all file references, and maintain project functionality throughout the reorganization.

### Goals

1. Move documentation files from root to categorized subdirectories
2. Preserve git history using git mv operations
3. Update all file path references across the project
4. Validate successful reorganization
5. Maintain a clean root directory with only essential files

### Non-Goals

1. Modifying file content (except path references)
2. Reorganizing source code or configuration files
3. Changing the existing docs/ subdirectory structure
4. Modifying git commit history beyond preserving file history

## Architecture

### System Components

The reorganization system consists of three primary components:

1. **File Classifier**: Identifies and categorizes files for relocation
2. **File Mover**: Executes file moves with git history preservation
3. **Reference Updater**: Scans and updates file path references

### Component Interaction Flow

```
┌─────────────────┐
│ File Classifier │
│                 │
│ - Scan root dir │
│ - Categorize    │
│ - Build map     │
└────────┬────────┘
         │
         │ File relocation map
         ▼
┌─────────────────┐
│   File Mover    │
│                 │
│ - Create dirs   │
│ - Execute moves │
│ - Verify        │
└────────┬────────┘
         │
         │ Old path → New path mappings
         ▼
┌─────────────────┐
│Reference Updater│
│                 │
│ - Scan files    │
│ - Update refs   │
│ - Validate      │
└─────────────────┘
```

### Technology Stack

- **Language**: TypeScript/Node.js (matches project stack)
- **File Operations**: Node.js fs/promises module
- **Git Operations**: child_process for git mv commands
- **Path Manipulation**: Node.js path module
- **Pattern Matching**: Regular expressions for reference detection

## Components and Interfaces

### File Classifier

**Purpose**: Identify documentation files in the root directory and determine their target locations.

**Interface**:

```typescript
interface FileClassifier {
  /**
   * Scans the root directory and builds a relocation map
   * @param rootPath - Absolute path to project root
   * @returns Map of source paths to destination paths
   */
  classifyFiles(rootPath: string): Promise<RelocationMap>;
  
  /**
   * Determines if a file should be moved
   * @param filename - Name of the file to check
   * @returns true if file should be relocated
   */
  shouldRelocate(filename: string): boolean;
  
  /**
   * Determines the target subdirectory for a file
   * @param filename - Name of the file to categorize
   * @returns Relative path to target directory
   */
  categorizeFile(filename: string): string;
}
```

**Classification Rules**:

```typescript
const CLASSIFICATION_RULES = {
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

const PRESERVE_IN_ROOT = [
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
```

### File Mover

**Purpose**: Execute file relocations with git history preservation.

**Interface**:

```typescript
interface FileMover {
  /**
   * Moves files according to the relocation map
   * @param relocationMap - Map of source to destination paths
   * @param useGit - Whether to use git mv (default: true)
   * @returns Results of move operations
   */
  moveFiles(
    relocationMap: RelocationMap,
    useGit?: boolean
  ): Promise<MoveResult[]>;
  
  /**
   * Creates necessary target directories
   * @param directories - Set of directory paths to create
   */
  createDirectories(directories: Set<string>): Promise<void>;
  
  /**
   * Moves a single file with git history preservation
   * @param sourcePath - Current file path
   * @param destPath - Target file path
   * @returns Success status and any error message
   */
  moveFile(
    sourcePath: string,
    destPath: string
  ): Promise<MoveResult>;
  
  /**
   * Verifies file exists at destination after move
   * @param path - Path to verify
   * @returns true if file exists
   */
  verifyFile(path: string): Promise<boolean>;
}
```

**Git Integration Strategy**:

The File Mover will attempt git mv first, falling back to standard file operations if git is unavailable or the operation fails:

```typescript
async function moveWithGit(source: string, dest: string): Promise<boolean> {
  try {
    // Attempt git mv
    await execAsync(`git mv "${source}" "${dest}"`);
    return true;
  } catch (error) {
    // Fall back to standard move
    await fs.rename(source, dest);
    return false;
  }
}
```

### Reference Updater

**Purpose**: Scan project files and update references to moved files.

**Interface**:

```typescript
interface ReferenceUpdater {
  /**
   * Updates all references to moved files across the project
   * @param relocationMap - Map of old paths to new paths
   * @param projectRoot - Root directory to scan
   * @returns List of files that were updated
   */
  updateReferences(
    relocationMap: RelocationMap,
    projectRoot: string
  ): Promise<string[]>;
  
  /**
   * Scans a file for references to moved files
   * @param filePath - Path to file to scan
   * @param relocationMap - Map of old to new paths
   * @returns Array of found references
   */
  findReferences(
    filePath: string,
    relocationMap: RelocationMap
  ): Promise<Reference[]>;
  
  /**
   * Updates references in a single file
   * @param filePath - Path to file to update
   * @param references - References to update
   * @returns true if file was modified
   */
  updateFile(
    filePath: string,
    references: Reference[]
  ): Promise<boolean>;
  
  /**
   * Validates no broken references exist
   * @param projectRoot - Root directory to validate
   * @returns Array of broken references found
   */
  validateReferences(projectRoot: string): Promise<BrokenReference[]>;
}
```

**Reference Detection Patterns**:

The system will detect references in multiple formats:

```typescript
const REFERENCE_PATTERNS = [
  // Markdown links: [text](path)
  /\[([^\]]+)\]\(([^)]+\.md)\)/g,
  
  // Markdown reference-style: [text]: path
  /\[([^\]]+)\]:\s*([^\s]+\.md)/g,
  
  // HTML links: href="path"
  /href=["']([^"']+\.md)["']/g,
  
  // Import statements: from './path'
  /from\s+['"]([^'"]+\.md)['"]/g,
  
  // Require statements: require('./path')
  /require\(['"]([^'"]+\.md)['"]\)/g,
  
  // File path comments: // path/to/file.md
  /\/\/\s*([^\s]+\.md)/g
];
```

**Path Resolution Strategy**:

When updating references, the system must handle both absolute and relative paths:

```typescript
function updateReference(
  currentFilePath: string,
  oldRefPath: string,
  newActualPath: string
): string {
  // Determine if reference is relative or absolute
  const isRelative = oldRefPath.startsWith('./') || oldRefPath.startsWith('../');
  
  if (isRelative) {
    // Calculate new relative path from current file to new location
    const currentDir = path.dirname(currentFilePath);
    return path.relative(currentDir, newActualPath);
  } else {
    // Update absolute path
    return newActualPath;
  }
}
```

## Data Models

### RelocationMap

Maps source file paths to destination paths:

```typescript
type RelocationMap = Map<string, string>;

// Example:
// {
//   'ANDROID_LAUNCH_CHECKLIST.md' => 'docs/checklists/ANDROID_LAUNCH_CHECKLIST.md',
//   'COMPLETE_PROJECT_STATUS.md' => 'docs/status/COMPLETE_PROJECT_STATUS.md',
//   ...
// }
```

### MoveResult

Represents the result of a file move operation:

```typescript
interface MoveResult {
  sourcePath: string;
  destPath: string;
  success: boolean;
  usedGit: boolean;
  error?: string;
}
```

### Reference

Represents a file reference that needs updating:

```typescript
interface Reference {
  filePath: string;        // File containing the reference
  lineNumber: number;      // Line where reference appears
  oldPath: string;         // Current reference path
  newPath: string;         // Updated reference path
  matchedPattern: string;  // Which pattern matched
}
```

### BrokenReference

Represents a reference to a non-existent file:

```typescript
interface BrokenReference {
  filePath: string;        // File containing broken reference
  lineNumber: number;      // Line where reference appears
  referencedPath: string;  // Path that doesn't exist
}
```

### FileCategory

Enumeration of documentation categories:

```typescript
enum FileCategory {
  CHECKLIST = 'checklists',
  STATUS = 'status',
  GUIDE = 'guides',
  ANALYSIS = 'analysis',
  GENERAL = 'general',
  PRESERVE = 'preserve'  // Files to keep in root
}
```

### ReorganizationConfig

Configuration for the reorganization process:

```typescript
interface ReorganizationConfig {
  projectRoot: string;
  docsBaseDir: string;      // 'docs/'
  useGit: boolean;          // Whether to use git mv
  dryRun: boolean;          // Preview without executing
  updateReadme: boolean;    // Whether to update README
  validateAfter: boolean;   // Whether to validate after completion
}
```

### ValidationReport

Summary of reorganization validation:

```typescript
interface ValidationReport {
  success: boolean;
  filesMovedCount: number;
  filesInCorrectLocation: string[];
  filesInWrongLocation: string[];
  brokenReferences: BrokenReference[];
  rootDirectoryClean: boolean;
  unexpectedRootFiles: string[];
}
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Documentation File Identification

*For any* directory structure, the file classifier should identify all markdown files (files ending in .md) in the root directory except README.md as files requiring relocation.

**Validates: Requirements 1.1**

### Property 2: Root Directory Preservation

*For any* reorganization operation, all configuration files (.env.example, .eslintrc.json, .gitignore, cdk.json, package.json, package-lock.json, template.yaml, tsconfig.json), hidden directories (starting with .), and existing project subdirectories in the root directory should remain in the root directory after the operation completes.

**Validates: Requirements 1.2, 1.3, 1.4, 5.2, 5.3, 5.4**

### Property 3: File Relocation Completeness

*For any* file identified for relocation, that file should exist at its designated destination path after the move operation, and the file should not exist at its original source path.

**Validates: Requirements 2.1, 8.1**

### Property 4: File Content and Name Preservation

*For any* file that is moved, the complete file content and filename (basename) should be identical before and after the move operation.

**Validates: Requirements 2.2, 6.1**

### Property 5: Root Directory Cleanliness

*For any* reorganization operation, after completion, the root directory should contain exactly one markdown file: README.md. All other markdown files should be located in subdirectories.

**Validates: Requirements 2.4, 5.1, 8.2**

### Property 6: Correct File Categorization

*For any* file in the relocation map, the file should be moved to its correct category subdirectory: checklist files to docs/checklists/, status files to docs/status/, guide files to docs/guides/, analysis files to docs/analysis/, and general documentation files to docs/.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**

### Property 7: Reference Scanning Completeness

*For any* file that is moved, the reference updater should scan all project files (markdown, source code, and configuration files) for references to that file's old path.

**Validates: Requirements 4.1, 4.3**

### Property 8: Reference Update Correctness

*For any* reference to a moved file found in the project, that reference should be updated to point to the file's new path, and the updated reference should resolve to an existing file.

**Validates: Requirements 4.2, 7.3, 8.3**

### Property 9: Relative Path Preservation

*For any* relative path reference (starting with ./ or ../) to a moved file, after updating the reference, the relative path relationship from the referencing file to the target file should be preserved (i.e., the reference should still correctly point to the target file from the referencing file's location).

**Validates: Requirements 4.4**

### Property 10: Git History Preservation

*For any* file move operation, the system should attempt to use git mv command first, and if git mv fails, should fall back to standard file system move operations, ensuring the file is moved regardless of git availability.

**Validates: Requirements 6.2, 6.3**

### Property 11: Move Operation Verification

*For any* file move operation, after the move completes, the system should verify that the file exists at the destination path before considering the operation successful.

**Validates: Requirements 6.4**

### Property 12: README Content Preservation

*For any* reorganization operation, all content in README.md that is not a file path reference should remain unchanged after the operation completes.

**Validates: Requirements 7.4**

### Property 13: Validation Error Reporting

*For any* validation failure (missing files, broken references), the system should generate a report identifying which specific files or references are problematic.

**Validates: Requirements 8.4**

## Error Handling

### File System Errors

**Directory Creation Failures**:
- If target directory creation fails, abort the operation before moving files
- Report which directory could not be created and the underlying error
- Leave the project in its original state

**File Move Failures**:
- If a file move fails, log the error but continue with remaining files
- Track failed moves in the MoveResult array
- At the end, report all failed moves to the user
- Do not update references for files that failed to move

**File Access Errors**:
- If a file cannot be read (permissions, locks), skip it and log the error
- If a file cannot be written during reference updates, log the error and continue
- Provide a summary of all access errors at completion

### Git Operation Errors

**Git Not Available**:
- If git command is not found, automatically fall back to standard file operations
- Log a warning that git history will not be preserved
- Continue with the reorganization

**Git Command Failures**:
- If git mv fails for a specific file, fall back to standard move for that file
- Log which files were moved without git history preservation
- Continue with remaining files

**Git Repository Issues**:
- If not in a git repository, use standard file operations
- If git repository is in a detached state, warn user but continue
- If there are uncommitted changes, warn user but continue

### Reference Update Errors

**Pattern Matching Failures**:
- If a reference pattern produces false positives, log the ambiguous matches
- Provide a dry-run mode to preview changes before applying
- Allow manual review of reference updates

**Path Resolution Errors**:
- If a relative path cannot be calculated, log the error and skip that reference
- If an absolute path is ambiguous, log the error and skip that reference
- Report all unresolved references in the validation report

**File Write Errors**:
- If a file cannot be updated (locked, permissions), log the error
- Continue with other files
- Report all files that could not be updated

### Validation Errors

**Missing Files**:
- If a file that should have been moved is not at its destination, report it
- If a file that should have been moved still exists at source, report it
- Provide a list of all missing or misplaced files

**Broken References**:
- If references point to non-existent files after updates, report them
- Provide file path, line number, and the broken reference
- Suggest possible corrections if similar paths exist

**Unexpected State**:
- If unexpected files remain in root directory, report them
- If expected files are missing from root directory, report them
- Provide a complete validation report with all discrepancies

### Recovery Strategies

**Partial Failure Recovery**:
```typescript
interface RecoveryOptions {
  // Retry failed operations
  retryFailed: boolean;
  
  // Rollback completed operations
  rollback: boolean;
  
  // Continue from last successful operation
  resume: boolean;
  
  // Generate detailed error report
  generateReport: boolean;
}
```

**Rollback Mechanism**:
- If critical errors occur, offer to rollback completed moves
- Use the relocation map in reverse to restore original locations
- Only available if git mv was used (git can restore history)
- Log all rollback operations

## Testing Strategy

### Unit Testing Approach

Unit tests will focus on specific examples, edge cases, and error conditions for each component:

**File Classifier Tests**:
- Test identification of markdown files in a known directory structure
- Test exclusion of README.md from relocation list
- Test correct categorization of each file type (checklists, status, guides, analysis, general)
- Test handling of files with unusual names or extensions
- Test behavior with empty directories
- Test behavior with nested directory structures

**File Mover Tests**:
- Test successful file move with git mv
- Test fallback to standard move when git fails
- Test directory creation before moving files
- Test file verification after moves
- Test handling of locked files
- Test handling of missing source files
- Test handling of existing destination files (conflict resolution)

**Reference Updater Tests**:
- Test detection of markdown link references: `[text](path.md)`
- Test detection of reference-style links: `[text]: path.md`
- Test detection of HTML href references
- Test relative path calculation from various source locations
- Test absolute path updates
- Test handling of references in different file types (.md, .ts, .json)
- Test preservation of non-reference content
- Test handling of ambiguous references

**Integration Tests**:
- Test complete reorganization workflow on a sample project structure
- Test README update with documentation index
- Test validation report generation
- Test error recovery and rollback mechanisms

### Property-Based Testing Approach

Property tests will verify universal properties across randomized inputs (minimum 100 iterations per test):

**Property Test 1: Documentation File Identification**
- Generate random directory structures with various file types
- Verify all .md files except README.md are identified
- **Tag: Feature: project-structure-cleanup, Property 1: For any directory structure, the file classifier should identify all markdown files except README.md**

**Property Test 2: Root Directory Preservation**
- Generate random sets of configuration files and directories
- Verify all are preserved in root after reorganization
- **Tag: Feature: project-structure-cleanup, Property 2: For any reorganization operation, configuration files, hidden directories, and subdirectories should remain in root**

**Property Test 3: File Relocation Completeness**
- Generate random sets of files to relocate
- Verify each file exists at destination and not at source
- **Tag: Feature: project-structure-cleanup, Property 3: For any file identified for relocation, it should exist at destination and not at source**

**Property Test 4: File Content and Name Preservation**
- Generate random file contents and names
- Verify content and basename are identical after move
- **Tag: Feature: project-structure-cleanup, Property 4: For any moved file, content and filename should be identical before and after**

**Property Test 5: Root Directory Cleanliness**
- Generate random initial directory structures
- Verify only README.md remains as markdown file in root after reorganization
- **Tag: Feature: project-structure-cleanup, Property 5: For any reorganization, root should contain only README.md as markdown file**

**Property Test 6: Correct File Categorization**
- Generate random files from each category
- Verify each ends up in correct subdirectory
- **Tag: Feature: project-structure-cleanup, Property 6: For any file, it should be moved to its correct category subdirectory**

**Property Test 7: Reference Scanning Completeness**
- Generate random moved files and project structures
- Verify all file types are scanned for references
- **Tag: Feature: project-structure-cleanup, Property 7: For any moved file, all project files should be scanned for references**

**Property Test 8: Reference Update Correctness**
- Generate random file references in various formats
- Verify all references are updated and resolve to existing files
- **Tag: Feature: project-structure-cleanup, Property 8: For any reference to a moved file, it should be updated to the new path**

**Property Test 9: Relative Path Preservation**
- Generate random relative path references from various locations
- Verify relative relationships are preserved after updates
- **Tag: Feature: project-structure-cleanup, Property 9: For any relative path reference, the relative relationship should be preserved**

**Property Test 10: Git History Preservation**
- Generate random file move scenarios with git available/unavailable
- Verify git mv is attempted first, with fallback to standard move
- **Tag: Feature: project-structure-cleanup, Property 10: For any file move, git mv should be attempted with fallback to standard move**

**Property Test 11: Move Operation Verification**
- Generate random file move operations
- Verify each move is verified before being marked successful
- **Tag: Feature: project-structure-cleanup, Property 11: For any file move, the system should verify file exists at destination**

**Property Test 12: README Content Preservation**
- Generate random README content with and without file references
- Verify non-reference content remains unchanged
- **Tag: Feature: project-structure-cleanup, Property 12: For any reorganization, non-reference README content should remain unchanged**

**Property Test 13: Validation Error Reporting**
- Generate random validation failures (missing files, broken references)
- Verify detailed error reports are generated
- **Tag: Feature: project-structure-cleanup, Property 13: For any validation failure, a detailed error report should be generated**

### Testing Tools

- **Unit Testing**: Jest (already in project dependencies)
- **Property-Based Testing**: fast-check (TypeScript/JavaScript PBT library)
- **File System Mocking**: memfs (in-memory file system for testing)
- **Git Mocking**: simple-git with mock implementations

### Test Configuration

```typescript
// fast-check configuration for property tests
const propertyTestConfig = {
  numRuns: 100,  // Minimum 100 iterations per property test
  verbose: true,
  seed: Date.now(),  // Reproducible with seed
  endOnFailure: false  // Run all iterations to find edge cases
};
```

### Test Execution Strategy

1. Run unit tests first to verify basic functionality
2. Run property tests to verify universal properties
3. Run integration tests to verify end-to-end workflow
4. Generate coverage report (target: >90% coverage)
5. Run tests in CI/CD pipeline before merging

