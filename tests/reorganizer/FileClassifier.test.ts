/**
 * Unit tests for FileClassifier
 */

import { FileClassifier, CLASSIFICATION_RULES, PRESERVE_IN_ROOT } from '../../src/reorganizer/FileClassifier';

describe('FileClassifier', () => {
  let classifier: FileClassifier;

  beforeEach(() => {
    classifier = new FileClassifier();
  });

  describe('shouldRelocate', () => {
    it('should return false for README.md', () => {
      expect(classifier.shouldRelocate('README.md')).toBe(false);
    });

    it('should return false for configuration files', () => {
      expect(classifier.shouldRelocate('package.json')).toBe(false);
      expect(classifier.shouldRelocate('.gitignore')).toBe(false);
      expect(classifier.shouldRelocate('tsconfig.json')).toBe(false);
    });

    it('should return true for checklist files', () => {
      expect(classifier.shouldRelocate('ANDROID_LAUNCH_CHECKLIST.md')).toBe(true);
      expect(classifier.shouldRelocate('IMMEDIATE_ACTIONS_CHECKLIST.md')).toBe(true);
    });

    it('should return true for status files', () => {
      expect(classifier.shouldRelocate('COMPLETE_PROJECT_STATUS.md')).toBe(true);
      expect(classifier.shouldRelocate('PAYMENT_INTEGRATION_STATUS.md')).toBe(true);
    });

    it('should return true for guide files', () => {
      expect(classifier.shouldRelocate('RAZORPAY_API_KEYS_SETUP.md')).toBe(true);
      expect(classifier.shouldRelocate('QUICK_START_GUIDE.md')).toBe(true);
    });

    it('should return true for analysis files', () => {
      expect(classifier.shouldRelocate('PROJECT_GAP_ANALYSIS.md')).toBe(true);
      expect(classifier.shouldRelocate('ORGANIZATION_SUMMARY.md')).toBe(true);
    });

    it('should return true for general documentation files', () => {
      expect(classifier.shouldRelocate('DOCUMENTATION.md')).toBe(true);
      expect(classifier.shouldRelocate('HOW_IT_WORKS.md')).toBe(true);
      expect(classifier.shouldRelocate('USER_GUIDE.md')).toBe(true);
    });

    it('should return false for non-markdown files', () => {
      expect(classifier.shouldRelocate('some-file.txt')).toBe(false);
      expect(classifier.shouldRelocate('script.js')).toBe(false);
    });

    it('should return false for markdown files not in classification rules', () => {
      expect(classifier.shouldRelocate('UNKNOWN_FILE.md')).toBe(false);
    });
  });

  describe('categorizeFile', () => {
    it('should categorize checklist files to docs/checklists/', () => {
      expect(classifier.categorizeFile('ANDROID_LAUNCH_CHECKLIST.md')).toBe('docs/checklists/');
      expect(classifier.categorizeFile('IMMEDIATE_ACTIONS_CHECKLIST.md')).toBe('docs/checklists/');
    });

    it('should categorize status files to docs/status/', () => {
      expect(classifier.categorizeFile('COMPLETE_PROJECT_STATUS.md')).toBe('docs/status/');
      expect(classifier.categorizeFile('PAYMENT_INTEGRATION_STATUS.md')).toBe('docs/status/');
      expect(classifier.categorizeFile('PRE_GENERATION_STATUS.md')).toBe('docs/status/');
    });

    it('should categorize guide files to docs/guides/', () => {
      expect(classifier.categorizeFile('RAZORPAY_API_KEYS_SETUP.md')).toBe('docs/guides/');
      expect(classifier.categorizeFile('QUICK_START_GUIDE.md')).toBe('docs/guides/');
    });

    it('should categorize analysis files to docs/analysis/', () => {
      expect(classifier.categorizeFile('PROJECT_GAP_ANALYSIS.md')).toBe('docs/analysis/');
      expect(classifier.categorizeFile('ORGANIZATION_SUMMARY.md')).toBe('docs/analysis/');
    });

    it('should categorize general documentation files to docs/', () => {
      expect(classifier.categorizeFile('DOCUMENTATION.md')).toBe('docs/');
      expect(classifier.categorizeFile('HOW_IT_WORKS.md')).toBe('docs/');
      expect(classifier.categorizeFile('USER_GUIDE.md')).toBe('docs/');
    });

    it('should default to docs/ for unknown files', () => {
      expect(classifier.categorizeFile('UNKNOWN_FILE.md')).toBe('docs/');
    });
  });

  describe('CLASSIFICATION_RULES', () => {
    it('should have all expected categories', () => {
      expect(CLASSIFICATION_RULES).toHaveProperty('checklists');
      expect(CLASSIFICATION_RULES).toHaveProperty('status');
      expect(CLASSIFICATION_RULES).toHaveProperty('guides');
      expect(CLASSIFICATION_RULES).toHaveProperty('analysis');
      expect(CLASSIFICATION_RULES).toHaveProperty('general');
    });

    it('should have correct number of files in each category', () => {
      expect(CLASSIFICATION_RULES.checklists).toHaveLength(2);
      expect(CLASSIFICATION_RULES.status).toHaveLength(3);
      expect(CLASSIFICATION_RULES.guides).toHaveLength(2);
      expect(CLASSIFICATION_RULES.analysis).toHaveLength(2);
      expect(CLASSIFICATION_RULES.general).toHaveLength(3);
    });
  });

  describe('PRESERVE_IN_ROOT', () => {
    it('should include README.md', () => {
      expect(PRESERVE_IN_ROOT).toContain('README.md');
    });

    it('should include all configuration files', () => {
      expect(PRESERVE_IN_ROOT).toContain('.env.example');
      expect(PRESERVE_IN_ROOT).toContain('.eslintrc.json');
      expect(PRESERVE_IN_ROOT).toContain('.gitignore');
      expect(PRESERVE_IN_ROOT).toContain('cdk.json');
      expect(PRESERVE_IN_ROOT).toContain('package.json');
      expect(PRESERVE_IN_ROOT).toContain('package-lock.json');
      expect(PRESERVE_IN_ROOT).toContain('template.yaml');
      expect(PRESERVE_IN_ROOT).toContain('tsconfig.json');
    });
  });

  describe('classifyFiles', () => {
    const testDir = './test-temp-classify';

    afterEach(async () => {
      // Clean up test directory
      const { cleanupTestDirectory } = await import('./setup');
      await cleanupTestDirectory(testDir);
    });

    it('should build a relocation map for files in root directory', async () => {
      const { createTestDirectory } = await import('./setup');
      const { SAMPLE_ROOT_FILES, EXPECTED_RELOCATIONS } = await import('./fixtures/sample-files');

      // Create test directory with sample files
      await createTestDirectory(testDir, SAMPLE_ROOT_FILES);

      // Run classifyFiles
      const relocationMap = await classifier.classifyFiles(testDir);

      // Verify the map has the correct number of entries
      expect(relocationMap.size).toBe(Object.keys(EXPECTED_RELOCATIONS).length);

      // Verify each expected relocation is in the map
      for (const [source, dest] of Object.entries(EXPECTED_RELOCATIONS)) {
        expect(relocationMap.get(source)).toBe(dest);
      }
    });

    it('should exclude README.md from relocation map', async () => {
      const { createTestDirectory } = await import('./setup');

      await createTestDirectory(testDir, ['README.md', 'DOCUMENTATION.md']);

      const relocationMap = await classifier.classifyFiles(testDir);

      expect(relocationMap.has('README.md')).toBe(false);
      expect(relocationMap.has('DOCUMENTATION.md')).toBe(true);
    });

    it('should exclude configuration files from relocation map', async () => {
      const { createTestDirectory } = await import('./setup');

      await createTestDirectory(testDir, [
        'package.json',
        '.gitignore',
        'tsconfig.json',
        'DOCUMENTATION.md'
      ]);

      const relocationMap = await classifier.classifyFiles(testDir);

      expect(relocationMap.has('package.json')).toBe(false);
      expect(relocationMap.has('.gitignore')).toBe(false);
      expect(relocationMap.has('tsconfig.json')).toBe(false);
      expect(relocationMap.has('DOCUMENTATION.md')).toBe(true);
    });

    it('should handle empty directory', async () => {
      const { createTestDirectory } = await import('./setup');

      await createTestDirectory(testDir, []);

      const relocationMap = await classifier.classifyFiles(testDir);

      expect(relocationMap.size).toBe(0);
    });

    it('should ignore subdirectories', async () => {
      const { createTestDirectory } = await import('./setup');

      // Create files including some in subdirectories
      await createTestDirectory(testDir, [
        'DOCUMENTATION.md',
        'src/index.ts',
        'docs/existing.md'
      ]);

      const relocationMap = await classifier.classifyFiles(testDir);

      // Should only include the root-level markdown file
      expect(relocationMap.size).toBe(1);
      expect(relocationMap.has('DOCUMENTATION.md')).toBe(true);
      expect(relocationMap.has('src/index.ts')).toBe(false);
      expect(relocationMap.has('docs/existing.md')).toBe(false);
    });

    it('should throw error for non-existent directory', async () => {
      await expect(classifier.classifyFiles('./non-existent-dir')).rejects.toThrow();
    });

    it('should correctly map checklist files', async () => {
      const { createTestDirectory } = await import('./setup');

      await createTestDirectory(testDir, [
        'ANDROID_LAUNCH_CHECKLIST.md',
        'IMMEDIATE_ACTIONS_CHECKLIST.md'
      ]);

      const relocationMap = await classifier.classifyFiles(testDir);

      expect(relocationMap.get('ANDROID_LAUNCH_CHECKLIST.md')).toBe('docs/checklists/ANDROID_LAUNCH_CHECKLIST.md');
      expect(relocationMap.get('IMMEDIATE_ACTIONS_CHECKLIST.md')).toBe('docs/checklists/IMMEDIATE_ACTIONS_CHECKLIST.md');
    });

    it('should correctly map status files', async () => {
      const { createTestDirectory } = await import('./setup');

      await createTestDirectory(testDir, [
        'COMPLETE_PROJECT_STATUS.md',
        'PAYMENT_INTEGRATION_STATUS.md'
      ]);

      const relocationMap = await classifier.classifyFiles(testDir);

      expect(relocationMap.get('COMPLETE_PROJECT_STATUS.md')).toBe('docs/status/COMPLETE_PROJECT_STATUS.md');
      expect(relocationMap.get('PAYMENT_INTEGRATION_STATUS.md')).toBe('docs/status/PAYMENT_INTEGRATION_STATUS.md');
    });

    it('should correctly map guide files', async () => {
      const { createTestDirectory } = await import('./setup');

      await createTestDirectory(testDir, [
        'RAZORPAY_API_KEYS_SETUP.md',
        'QUICK_START_GUIDE.md'
      ]);

      const relocationMap = await classifier.classifyFiles(testDir);

      expect(relocationMap.get('RAZORPAY_API_KEYS_SETUP.md')).toBe('docs/guides/RAZORPAY_API_KEYS_SETUP.md');
      expect(relocationMap.get('QUICK_START_GUIDE.md')).toBe('docs/guides/QUICK_START_GUIDE.md');
    });

    it('should correctly map analysis files', async () => {
      const { createTestDirectory } = await import('./setup');

      await createTestDirectory(testDir, [
        'PROJECT_GAP_ANALYSIS.md',
        'ORGANIZATION_SUMMARY.md'
      ]);

      const relocationMap = await classifier.classifyFiles(testDir);

      expect(relocationMap.get('PROJECT_GAP_ANALYSIS.md')).toBe('docs/analysis/PROJECT_GAP_ANALYSIS.md');
      expect(relocationMap.get('ORGANIZATION_SUMMARY.md')).toBe('docs/analysis/ORGANIZATION_SUMMARY.md');
    });

    it('should correctly map general documentation files', async () => {
      const { createTestDirectory } = await import('./setup');

      await createTestDirectory(testDir, [
        'DOCUMENTATION.md',
        'HOW_IT_WORKS.md',
        'USER_GUIDE.md'
      ]);

      const relocationMap = await classifier.classifyFiles(testDir);

      expect(relocationMap.get('DOCUMENTATION.md')).toBe('docs/DOCUMENTATION.md');
      expect(relocationMap.get('HOW_IT_WORKS.md')).toBe('docs/HOW_IT_WORKS.md');
      expect(relocationMap.get('USER_GUIDE.md')).toBe('docs/USER_GUIDE.md');
    });
  });
});
