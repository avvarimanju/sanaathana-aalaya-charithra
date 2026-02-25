# Project Structure Reorganization Tool

A TypeScript-based tool for reorganizing project documentation files into categorized subdirectories while preserving git history and updating all file references.

## Features

- Automatically identifies and categorizes documentation files
- Moves files to organized subdirectories (checklists/, status/, guides/, analysis/)
- Preserves git history using `git mv` (with fallback to standard file operations)
- Updates all file references across the project (markdown links, imports, etc.)
- Updates README.md with documentation index
- Validates reorganization success
- Dry-run mode for previewing changes

## Usage

### Quick Start

```bash
# Preview changes without executing
npm run reorganize:dry-run

# Execute reorganization
npm run reorganize
```

### Command-Line Options

```bash
npm run reorganize -- [options]
```

Options:
- `--dry-run` - Preview changes without executing them
- `--no-git` - Don't use git mv (use standard file operations)
- `--no-readme` - Don't update README.md with documentation index
- `--no-validate` - Skip validation after reorganization
- `--project-root <path>` - Specify project root directory (default: current directory)
- `--help, -h` - Show help message

### Examples

```bash
# Preview changes
npm run reorganize -- --dry-run

# Reorganize without git history preservation
npm run reorganize -- --no-git

# Reorganize a specific project directory
npm run reorganize -- --project-root /path/to/project

# Full reorganization with all features (default)
npm run reorganize
```

## File Categorization

The tool automatically categorizes files based on their names:

### Checklists (`docs/checklists/`)
- ANDROID_LAUNCH_CHECKLIST.md
- IMMEDIATE_ACTIONS_CHECKLIST.md

### Status Reports (`docs/status/`)
- COMPLETE_PROJECT_STATUS.md
- PAYMENT_INTEGRATION_STATUS.md
- PRE_GENERATION_STATUS.md

### Guides (`docs/guides/`)
- RAZORPAY_API_KEYS_SETUP.md
- QUICK_START_GUIDE.md

### Analysis (`docs/analysis/`)
- PROJECT_GAP_ANALYSIS.md
- ORGANIZATION_SUMMARY.md

### General Documentation (`docs/`)
- DOCUMENTATION.md
- HOW_IT_WORKS.md
- USER_GUIDE.md

## Files Preserved in Root

The following files remain in the root directory:
- README.md
- Configuration files (.env.example, .eslintrc.json, .gitignore, cdk.json, package.json, package-lock.json, template.yaml, tsconfig.json)

## Reference Detection

The tool detects and updates references in multiple formats:
- Markdown links: `[text](path.md)`
- Markdown reference-style: `[text]: path.md`
- HTML links: `href="path.md"`
- Import statements: `from './path.md'`
- Require statements: `require('./path.md')`
- File path comments: `// path/to/file.md`

## Validation

After reorganization, the tool validates:
- All files are in correct locations
- Root directory contains only expected files
- No broken file references exist

## Architecture

The system consists of five main components:

1. **FileClassifier** - Identifies and categorizes files for relocation
2. **FileMover** - Executes file moves with git history preservation
3. **ReferenceUpdater** - Scans and updates file references
4. **ReadmeUpdater** - Updates README.md with documentation index
5. **ValidationReportGenerator** - Validates reorganization success

## Programmatic Usage

```typescript
import { reorganize, ReorganizationConfig } from './reorganizer';

const config: ReorganizationConfig = {
  projectRoot: '/path/to/project',
  docsBaseDir: 'docs/',
  useGit: true,
  dryRun: false,
  updateReadme: true,
  validateAfter: true
};

const report = await reorganize(config);

if (report.success) {
  console.log('Reorganization completed successfully!');
} else {
  console.error('Reorganization failed:', report);
}
```

## Error Handling

The tool handles errors gracefully:
- Continues processing even if individual file moves fail
- Falls back to standard file operations if git is unavailable
- Provides detailed error messages and validation reports
- Logs warnings for files that cannot be read or updated

## Testing

Run the test suite:

```bash
# Run all reorganizer tests
npm test -- --testPathPattern=reorganizer

# Run specific test file
npm test -- FileClassifier.test

# Run with coverage
npm test -- --coverage --testPathPattern=reorganizer
```

## License

MIT
