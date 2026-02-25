# Implementation Plan: Project Structure Cleanup

## Overview

This implementation plan breaks down the project structure reorganization system into discrete coding tasks. The system will identify documentation files in the root directory, move them to categorized subdirectories within docs/, update all file references, and validate the reorganization. The implementation uses TypeScript/Node.js and consists of three main components: File Classifier, File Mover, and Reference Updater.

## Tasks

- [x] 1. Set up project structure and core types
  - Create src/reorganizer/ directory for reorganization components
  - Define TypeScript interfaces and types (RelocationMap, MoveResult, Reference, BrokenReference, FileCategory, ReorganizationConfig, ValidationReport)
  - Set up testing framework with Jest and fast-check
  - Create test fixtures directory with sample project structures
  - _Requirements: All requirements (foundational)_

- [x] 2. Implement File Classifier component
  - [x] 2.1 Create FileClassifier class with classification rules
    - Implement CLASSIFICATION_RULES constant with file-to-category mappings
    - Implement PRESERVE_IN_ROOT constant with files to keep in root
    - Implement shouldRelocate() method to determine if file should be moved
    - Implement categorizeFile() method to determine target subdirectory
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 3.1, 3.2, 3.3, 3.4, 3.5_
  
  - [ ]* 2.2 Write property test for documentation file identification
    - **Property 1: Documentation File Identification**
    - **Validates: Requirements 1.1**
  
  - [ ]* 2.3 Write property test for root directory preservation
    - **Property 2: Root Directory Preservation**
    - **Validates: Requirements 1.2, 1.3, 1.4, 5.2, 5.3, 5.4**
  
  - [ ]* 2.4 Write property test for correct file categorization
    - **Property 6: Correct File Categorization**
    - **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**
  
  - [x] 2.5 Implement classifyFiles() method
    - Scan root directory using fs.readdir()
    - Build RelocationMap with source-to-destination mappings
    - Filter out files that should be preserved in root
    - Return complete relocation map
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 3.1, 3.2, 3.3, 3.4, 3.5_
  
  - [ ]* 2.6 Write unit tests for FileClassifier
    - Test identification of markdown files in known directory structure
    - Test exclusion of README.md from relocation list
    - Test correct categorization of each file type
    - Test handling of empty directories
    - _Requirements: 1.1, 1.2, 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 3. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Implement File Mover component
  - [x] 4.1 Create FileMover class with directory creation
    - Implement createDirectories() method using fs.mkdir with recursive option
    - Extract unique target directories from relocation map
    - Handle directory creation errors gracefully
    - _Requirements: 2.3_
  
  - [x] 4.2 Implement git integration for file moves
    - Implement moveWithGit() helper function using child_process.exec
    - Attempt git mv command first
    - Fall back to fs.rename() if git mv fails
    - Return boolean indicating whether git was used
    - _Requirements: 6.2, 6.3_
  
  - [ ]* 4.3 Write property test for git history preservation
    - **Property 10: Git History Preservation**
    - **Validates: Requirements 6.2, 6.3**
  
  - [x] 4.4 Implement moveFile() method
    - Call moveWithGit() to execute the move
    - Verify file exists at destination using verifyFile()
    - Return MoveResult with success status and metadata
    - Handle file access errors and log failures
    - _Requirements: 2.1, 2.2, 6.1, 6.2, 6.3, 6.4_
  
  - [ ]* 4.5 Write property test for file relocation completeness
    - **Property 3: File Relocation Completeness**
    - **Validates: Requirements 2.1, 8.1**
  
  - [ ]* 4.6 Write property test for file content and name preservation
    - **Property 4: File Content and Name Preservation**
    - **Validates: Requirements 2.2, 6.1**
  
  - [ ]* 4.7 Write property test for move operation verification
    - **Property 11: Move Operation Verification**
    - **Validates: Requirements 6.4**
  
  - [x] 4.8 Implement moveFiles() method
    - Create all necessary target directories
    - Iterate through relocation map and move each file
    - Collect MoveResult for each operation
    - Continue on individual failures, report all at end
    - Return array of all MoveResults
    - _Requirements: 2.1, 2.2, 2.3, 6.1, 6.2, 6.3, 6.4_
  
  - [ ]* 4.9 Write unit tests for FileMover
    - Test successful file move with git mv
    - Test fallback to standard move when git fails
    - Test directory creation before moving files
    - Test file verification after moves
    - Test handling of locked files
    - Test handling of missing source files
    - _Requirements: 2.1, 2.2, 2.3, 6.1, 6.2, 6.3, 6.4_

- [x] 5. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Implement Reference Updater component
  - [x] 6.1 Create ReferenceUpdater class with reference patterns
    - Implement REFERENCE_PATTERNS constant with regex patterns for markdown links, HTML hrefs, import statements, require statements, and file path comments
    - Create helper function to compile patterns into RegExp objects
    - _Requirements: 4.1, 4.3_
  
  - [x] 6.2 Implement findReferences() method
    - Read file content using fs.readFile()
    - Apply all reference patterns to find matches
    - For each match, extract line number and matched path
    - Check if matched path exists in relocation map
    - Return array of Reference objects for paths that were moved
    - _Requirements: 4.1, 4.3_
  
  - [ ]* 6.3 Write property test for reference scanning completeness
    - **Property 7: Reference Scanning Completeness**
    - **Validates: Requirements 4.1, 4.3**
  
  - [x] 6.4 Implement path resolution logic
    - Create updateReference() helper function
    - Detect if reference is relative (./ or ../) or absolute
    - For relative paths, calculate new relative path using path.relative()
    - For absolute paths, replace with new absolute path
    - Preserve path format (forward slashes, etc.)
    - _Requirements: 4.2, 4.4_
  
  - [ ]* 6.5 Write property test for relative path preservation
    - **Property 9: Relative Path Preservation**
    - **Validates: Requirements 4.4**
  
  - [x] 6.6 Implement updateFile() method
    - Read file content
    - Replace each old reference with new reference
    - Write updated content back to file
    - Return boolean indicating if file was modified
    - Handle file write errors gracefully
    - _Requirements: 4.2, 4.3_
  
  - [ ]* 6.7 Write property test for reference update correctness
    - **Property 8: Reference Update Correctness**
    - **Validates: Requirements 4.2, 7.3, 8.3**
  
  - [x] 6.8 Implement updateReferences() method
    - Scan all project files (markdown, TypeScript, JSON, YAML)
    - For each file, call findReferences() to detect references to moved files
    - For each file with references, call updateFile() to update them
    - Collect list of all files that were modified
    - Return array of modified file paths
    - _Requirements: 4.1, 4.2, 4.3, 4.4_
  
  - [ ]* 6.9 Write unit tests for ReferenceUpdater
    - Test detection of markdown link references
    - Test detection of reference-style links
    - Test detection of HTML href references
    - Test relative path calculation from various source locations
    - Test absolute path updates
    - Test handling of references in different file types
    - Test preservation of non-reference content
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 7. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Implement validation and reporting
  - [x] 8.1 Implement validateReferences() method in ReferenceUpdater
    - Scan all project files for file path references
    - Check if each referenced path exists in file system
    - Collect BrokenReference objects for non-existent paths
    - Return array of broken references
    - _Requirements: 8.3, 8.4_
  
  - [x] 8.2 Create validation report generator
    - Implement generateValidationReport() function
    - Check all files are in correct locations using relocation map
    - Verify root directory contains only README.md as markdown file
    - Check for unexpected files in root directory
    - Call validateReferences() to check for broken references
    - Build ValidationReport object with all findings
    - _Requirements: 8.1, 8.2, 8.3, 8.4_
  
  - [ ]* 8.3 Write property test for root directory cleanliness
    - **Property 5: Root Directory Cleanliness**
    - **Validates: Requirements 2.4, 5.1, 8.2**
  
  - [ ]* 8.4 Write property test for validation error reporting
    - **Property 13: Validation Error Reporting**
    - **Validates: Requirements 8.4**
  
  - [ ]* 8.5 Write unit tests for validation
    - Test detection of missing files
    - Test detection of files in wrong locations
    - Test detection of broken references
    - Test detection of unexpected root files
    - Test validation report generation
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [x] 9. Implement README updater
  - [x] 9.1 Create README update functionality
    - Implement updateReadme() function
    - Generate documentation index section with categorized file listings
    - Update existing file path references in README using ReferenceUpdater
    - Preserve all other README content
    - Insert documentation index at appropriate location (after introduction)
    - _Requirements: 7.1, 7.2, 7.3, 7.4_
  
  - [ ]* 9.2 Write property test for README content preservation
    - **Property 12: README Content Preservation**
    - **Validates: Requirements 7.4**
  
  - [ ]* 9.3 Write unit tests for README updater
    - Test generation of documentation index
    - Test preservation of existing README content
    - Test update of file path references
    - Test insertion of index at correct location
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [ ] 10. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 11. Create main orchestration script
  - [x] 11.1 Implement main reorganization orchestrator
    - Create reorganize() function that accepts ReorganizationConfig
    - Instantiate FileClassifier and build relocation map
    - Instantiate FileMover and execute file moves
    - Instantiate ReferenceUpdater and update all references
    - Call updateReadme() to update README with new structure
    - Generate and return ValidationReport
    - Handle errors at each stage and provide detailed error messages
    - _Requirements: All requirements (orchestration)_
  
  - [x] 11.2 Add dry-run mode support
    - Implement dry-run flag in ReorganizationConfig
    - When dry-run is true, log planned operations without executing
    - Show which files would be moved and where
    - Show which references would be updated
    - Return preview report instead of executing changes
    - _Requirements: All requirements (safety feature)_
  
  - [ ]* 11.3 Write integration tests for complete workflow
    - Test complete reorganization on sample project structure
    - Test dry-run mode produces correct preview
    - Test validation report generation
    - Test error recovery scenarios
    - _Requirements: All requirements_

- [x] 12. Create CLI interface
  - [x] 12.1 Implement command-line interface
    - Create cli.ts entry point
    - Parse command-line arguments (project root, dry-run flag, etc.)
    - Build ReorganizationConfig from arguments
    - Call reorganize() function with config
    - Display progress messages during execution
    - Display validation report at completion
    - Exit with appropriate status code
    - _Requirements: All requirements (user interface)_
  
  - [x] 12.2 Add error handling and user feedback
    - Catch and display errors in user-friendly format
    - Show progress indicators for long operations
    - Display summary of moved files
    - Display summary of updated references
    - Highlight any validation failures
    - Provide suggestions for fixing issues
    - _Requirements: 8.4_
  
  - [ ]* 12.3 Write CLI integration tests
    - Test CLI with various command-line arguments
    - Test error handling and user feedback
    - Test dry-run mode from CLI
    - _Requirements: All requirements_

- [x] 13. Final checkpoint and documentation
  - [x] 13.1 Run complete test suite
    - Run all unit tests
    - Run all property-based tests
    - Run all integration tests
    - Verify test coverage is >90%
    - Fix any failing tests
  
  - [x] 13.2 Create usage documentation
    - Document CLI usage with examples
    - Document dry-run mode
    - Document error messages and troubleshooting
    - Document validation report interpretation
    - Add inline code comments for complex logic
  
  - [x] 13.3 Final validation
    - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- The implementation follows TypeScript/Node.js best practices
- Git operations gracefully fall back to standard file operations
- All file operations include error handling and validation
