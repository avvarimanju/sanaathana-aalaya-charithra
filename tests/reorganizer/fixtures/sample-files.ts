/**
 * Sample file structures for testing
 */

export const SAMPLE_ROOT_FILES = [
  'README.md',
  'ANDROID_LAUNCH_CHECKLIST.md',
  'IMMEDIATE_ACTIONS_CHECKLIST.md',
  'COMPLETE_PROJECT_STATUS.md',
  'PAYMENT_INTEGRATION_STATUS.md',
  'PRE_GENERATION_STATUS.md',
  'RAZORPAY_API_KEYS_SETUP.md',
  'QUICK_START_GUIDE.md',
  'PROJECT_GAP_ANALYSIS.md',
  'ORGANIZATION_SUMMARY.md',
  'HOW_IT_WORKS.md',
  'USER_GUIDE.md',
  '.env.example',
  '.eslintrc.json',
  '.gitignore',
  'cdk.json',
  'package.json',
  'package-lock.json',
  'template.yaml',
  'tsconfig.json'
];

export const EXPECTED_RELOCATIONS = {
  'ANDROID_LAUNCH_CHECKLIST.md': 'docs/checklists/ANDROID_LAUNCH_CHECKLIST.md',
  'IMMEDIATE_ACTIONS_CHECKLIST.md': 'docs/checklists/IMMEDIATE_ACTIONS_CHECKLIST.md',
  'COMPLETE_PROJECT_STATUS.md': 'docs/status/COMPLETE_PROJECT_STATUS.md',
  'PAYMENT_INTEGRATION_STATUS.md': 'docs/status/PAYMENT_INTEGRATION_STATUS.md',
  'PRE_GENERATION_STATUS.md': 'docs/status/PRE_GENERATION_STATUS.md',
  'RAZORPAY_API_KEYS_SETUP.md': 'docs/guides/RAZORPAY_API_KEYS_SETUP.md',
  'QUICK_START_GUIDE.md': 'docs/guides/QUICK_START_GUIDE.md',
  'PROJECT_GAP_ANALYSIS.md': 'docs/analysis/PROJECT_GAP_ANALYSIS.md',
  'ORGANIZATION_SUMMARY.md': 'docs/analysis/ORGANIZATION_SUMMARY.md',
  'HOW_IT_WORKS.md': 'docs/HOW_IT_WORKS.md',
  'USER_GUIDE.md': 'docs/USER_GUIDE.md'
};

export const FILES_TO_PRESERVE = [
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

export const SAMPLE_README_CONTENT = `# Sample Project

This is a sample project for testing.

## Documentation

See [DOCUMENTATION.md](DOCUMENTATION.md) for details.
See [HOW_IT_WORKS.md](HOW_IT_WORKS.md) for architecture.

## Guides

- [Quick Start Guide](QUICK_START_GUIDE.md)
- [Razorpay Setup](RAZORPAY_API_KEYS_SETUP.md)
`;

export const SAMPLE_FILE_WITH_REFERENCES = `# Configuration

This file references other documentation:

- See [DOCUMENTATION.md](../DOCUMENTATION.md)
- Check [PROJECT_GAP_ANALYSIS.md](../PROJECT_GAP_ANALYSIS.md)
- Review [COMPLETE_PROJECT_STATUS.md](../COMPLETE_PROJECT_STATUS.md)
`;
