/**
 * Unit tests for ReferenceUpdater class
 */

import { ReferenceUpdater, REFERENCE_PATTERNS } from '../../src/reorganizer/ReferenceUpdater';
import { RelocationMap } from '../../src/reorganizer/types';
import * as path from 'path';
import { createTestDirectory, cleanupTestDirectory, fileExists, readFileContent } from './setup';
import { promises as fs } from 'fs';

describe('ReferenceUpdater', () => {
  let updater: ReferenceUpdater;
  const testDir = path.join(__dirname, 'test-reference-updater');

  beforeEach(() => {
    updater = new ReferenceUpdater();
  });

  afterEach(async () => {
    await cleanupTestDirectory(testDir);
  });

  describe('REFERENCE_PATTERNS', () => {
    it('should have all expected pattern types', () => {
      const patternNames = REFERENCE_PATTERNS.map(p => p.name);
      expect(patternNames).toContain('markdown-link');
      expect(patternNames).toContain('markdown-reference');
      expect(patternNames).toContain('html-href');
      expect(patternNames).toContain('import-statement');
      expect(patternNames).toContain('require-statement');
      expect(patternNames).toContain('comment-path');
    });

    it('should have 6 reference patterns', () => {
      expect(REFERENCE_PATTERNS).toHaveLength(6);
    });
  });

  describe('findReferences', () => {
    it('should detect markdown link references', async () => {
      const testFile = path.join(testDir, 'test.md');
      const content = '# Test\n\nSee [documentation](docs/docs/docs/docs/docs/DOCUMENTATION.md) for details.';
      
      await createTestDirectory(testDir, []);
      await fs.writeFile(testFile, content);

      const relocationMap: RelocationMap = new Map([
        ['DOCUMENTATION.md', 'docs/DOCUMENTATION.md']
      ]);

      const references = await updater.findReferences(testFile, relocationMap);

      expect(references).toHaveLength(1);
      expect(references[0].oldPath).toBe('DOCUMENTATION.md');
      expect(references[0].matchedPattern).toBe('markdown-link');
    });

    it('should detect markdown reference-style links', async () => {
      const testFile = path.join(testDir, 'test.md');
      const content = '# Test\n\n[docs]: DOCUMENTATION.md';
      
      await createTestDirectory(testDir, []);
      await fs.writeFile(testFile, content);

      const relocationMap: RelocationMap = new Map([
        ['DOCUMENTATION.md', 'docs/DOCUMENTATION.md']
      ]);

      const references = await updater.findReferences(testFile, relocationMap);

      expect(references).toHaveLength(1);
      expect(references[0].oldPath).toBe('DOCUMENTATION.md');
      expect(references[0].matchedPattern).toBe('markdown-reference');
    });

    it('should detect HTML href references', async () => {
      const testFile = path.join(testDir, 'test.html');
      const content = '<a href="DOCUMENTATION.md">Docs</a>';
      
      await createTestDirectory(testDir, []);
      await fs.writeFile(testFile, content);

      const relocationMap: RelocationMap = new Map([
        ['DOCUMENTATION.md', 'docs/DOCUMENTATION.md']
      ]);

      const references = await updater.findReferences(testFile, relocationMap);

      expect(references).toHaveLength(1);
      expect(references[0].oldPath).toBe('DOCUMENTATION.md');
      expect(references[0].matchedPattern).toBe('html-href');
    });

    it('should detect relative path references', async () => {
      const testFile = path.join(testDir, 'src/test.md');
      const content = 'See [docs](../../docs/DOCUMENTATION.md)';
      
      await createTestDirectory(testDir, []);
      await fs.mkdir(path.join(testDir, 'src'), { recursive: true });
      await fs.writeFile(testFile, content);

      const relocationMap: RelocationMap = new Map([
        ['DOCUMENTATION.md', 'docs/DOCUMENTATION.md']
      ]);

      const references = await updater.findReferences(testFile, relocationMap);

      expect(references).toHaveLength(1);
      expect(references[0].oldPath).toBe('./DOCUMENTATION.md');
    });

    it('should return correct line numbers', async () => {
      const testFile = path.join(testDir, 'test.md');
      const content = '# Line 1\n\nLine 3 has [link](FILE1.md)\n\nLine 5 has [another](FILE2.md)';
      
      await createTestDirectory(testDir, []);
      await fs.writeFile(testFile, content);

      const relocationMap: RelocationMap = new Map([
        ['FILE1.md', 'docs/FILE1.md'],
        ['FILE2.md', 'docs/FILE2.md']
      ]);

      const references = await updater.findReferences(testFile, relocationMap);

      expect(references).toHaveLength(2);
      expect(references[0].lineNumber).toBe(3);
      expect(references[1].lineNumber).toBe(5);
    });

    it('should handle files with no references', async () => {
      const testFile = path.join(testDir, 'test.md');
      const content = '# Test\n\nNo references here.';
      
      await createTestDirectory(testDir, []);
      await fs.writeFile(testFile, content);

      const relocationMap: RelocationMap = new Map([
        ['DOCUMENTATION.md', 'docs/DOCUMENTATION.md']
      ]);

      const references = await updater.findReferences(testFile, relocationMap);

      expect(references).toHaveLength(0);
    });

    it('should handle non-existent files gracefully', async () => {
      const testFile = path.join(testDir, 'nonexistent.md');
      const relocationMap: RelocationMap = new Map([
        ['DOCUMENTATION.md', 'docs/DOCUMENTATION.md']
      ]);

      const references = await updater.findReferences(testFile, relocationMap);

      expect(references).toHaveLength(0);
    });

    it('should detect multiple references in same file', async () => {
      const testFile = path.join(testDir, 'test.md');
      const content = `
# Test

See [doc1](FILE1.md) and [doc2](FILE2.md).
Also check [doc3](FILE3.md).
`;
      
      await createTestDirectory(testDir, []);
      await fs.writeFile(testFile, content);

      const relocationMap: RelocationMap = new Map([
        ['FILE1.md', 'docs/FILE1.md'],
        ['FILE2.md', 'docs/FILE2.md'],
        ['FILE3.md', 'docs/FILE3.md']
      ]);

      const references = await updater.findReferences(testFile, relocationMap);

      expect(references).toHaveLength(3);
    });
  });

  describe('updateFile', () => {
    it('should update references in a file', async () => {
      const testFile = path.join(testDir, 'test.md');
      const content = 'See [documentation](DOCUMENTATION.md) for details.';
      
      await createTestDirectory(testDir, []);
      await fs.writeFile(testFile, content);

      const references = [{
        filePath: testFile,
        lineNumber: 1,
        oldPath: 'DOCUMENTATION.md',
        newPath: 'docs/DOCUMENTATION.md',
        matchedPattern: 'markdown-link'
      }];

      const wasModified = await updater.updateFile(testFile, references);

      expect(wasModified).toBe(true);
      
      const updatedContent = await readFileContent(testFile);
      expect(updatedContent).toContain('docs/DOCUMENTATION.md');
      expect(updatedContent).not.toContain('](DOCUMENTATION.md)');
    });

    it('should preserve non-reference content', async () => {
      const testFile = path.join(testDir, 'test.md');
      const content = '# Title\n\nSome content.\n\nSee [doc](DOC.md).';
      
      await createTestDirectory(testDir, []);
      await fs.writeFile(testFile, content);

      const references = [{
        filePath: testFile,
        lineNumber: 4,
        oldPath: 'DOC.md',
        newPath: 'docs/DOC.md',
        matchedPattern: 'markdown-link'
      }];

      await updater.updateFile(testFile, references);

      const updatedContent = await readFileContent(testFile);
      expect(updatedContent).toContain('# Title');
      expect(updatedContent).toContain('Some content.');
    });

    it('should return false when no references provided', async () => {
      const testFile = path.join(testDir, 'test.md');
      const content = 'Test content';
      
      await createTestDirectory(testDir, []);
      await fs.writeFile(testFile, content);

      const wasModified = await updater.updateFile(testFile, []);

      expect(wasModified).toBe(false);
    });

    it('should handle multiple references in same file', async () => {
      const testFile = path.join(testDir, 'test.md');
      const content = 'See [doc1](FILE1.md) and [doc2](FILE2.md).';
      
      await createTestDirectory(testDir, []);
      await fs.writeFile(testFile, content);

      const references = [
        {
          filePath: testFile,
          lineNumber: 1,
          oldPath: 'FILE1.md',
          newPath: 'docs/FILE1.md',
          matchedPattern: 'markdown-link'
        },
        {
          filePath: testFile,
          lineNumber: 1,
          oldPath: 'FILE2.md',
          newPath: 'docs/FILE2.md',
          matchedPattern: 'markdown-link'
        }
      ];

      await updater.updateFile(testFile, references);

      const updatedContent = await readFileContent(testFile);
      expect(updatedContent).toContain('docs/FILE1.md');
      expect(updatedContent).toContain('docs/FILE2.md');
    });

    it('should handle file write errors gracefully', async () => {
      const testFile = path.join(testDir, 'nonexistent/test.md');

      const references = [{
        filePath: testFile,
        lineNumber: 1,
        oldPath: 'DOC.md',
        newPath: 'docs/DOC.md',
        matchedPattern: 'markdown-link'
      }];

      const wasModified = await updater.updateFile(testFile, references);

      expect(wasModified).toBe(false);
    });
  });

  describe('updateReferences', () => {
    it('should update references across multiple files', async () => {
      await createTestDirectory(testDir, []);
      
      const file1 = path.join(testDir, 'file1.md');
      const file2 = path.join(testDir, 'file2.md');
      
      await fs.writeFile(file1, 'See [doc](DOCUMENTATION.md)');
      await fs.writeFile(file2, 'Check [guide](docs/USER_GUIDE.md)');

      const relocationMap: RelocationMap = new Map([
        ['DOCUMENTATION.md', 'docs/DOCUMENTATION.md'],
        ['USER_GUIDE.md', 'docs/USER_GUIDE.md']
      ]);

      const modifiedFiles = await updater.updateReferences(relocationMap, testDir);

      expect(modifiedFiles).toHaveLength(2);
      expect(modifiedFiles).toContain(file1);
      expect(modifiedFiles).toContain(file2);
    });

    it('should return empty array when no files need updates', async () => {
      await createTestDirectory(testDir, []);
      
      const file1 = path.join(testDir, 'file1.md');
      await fs.writeFile(file1, 'No references here');

      const relocationMap: RelocationMap = new Map([
        ['DOCUMENTATION.md', 'docs/DOCUMENTATION.md']
      ]);

      const modifiedFiles = await updater.updateReferences(relocationMap, testDir);

      expect(modifiedFiles).toHaveLength(0);
    });

    it('should scan markdown, TypeScript, and JSON files', async () => {
      await createTestDirectory(testDir, []);
      
      const mdFile = path.join(testDir, 'test.md');
      const tsFile = path.join(testDir, 'test.ts');
      const jsonFile = path.join(testDir, 'test.json');
      
      await fs.writeFile(mdFile, '[doc](DOC.md)');
      await fs.writeFile(tsFile, '// DOC.md');
      await fs.writeFile(jsonFile, '{"path": "DOC.md"}');

      const relocationMap: RelocationMap = new Map([
        ['DOC.md', 'docs/DOC.md']
      ]);

      const modifiedFiles = await updater.updateReferences(relocationMap, testDir);

      // At least the markdown file should be updated
      expect(modifiedFiles.length).toBeGreaterThan(0);
    });
  });

  describe('validateReferences', () => {
    it('should detect broken references', async () => {
      await createTestDirectory(testDir, []);
      
      const testFile = path.join(testDir, 'test.md');
      await fs.writeFile(testFile, 'See [missing](nonexistent.md)');

      const brokenRefs = await updater.validateReferences(testDir);

      expect(brokenRefs.length).toBeGreaterThan(0);
      const broken = brokenRefs.find(ref => ref.referencedPath === 'nonexistent.md');
      expect(broken).toBeDefined();
    });

    it('should return empty array when all references are valid', async () => {
      await createTestDirectory(testDir, []);
      
      const testFile = path.join(testDir, 'test.md');
      const targetFile = path.join(testDir, 'target.md');
      
      await fs.writeFile(targetFile, '# Target');
      await fs.writeFile(testFile, 'See [target](target.md)');

      const brokenRefs = await updater.validateReferences(testDir);

      expect(brokenRefs).toHaveLength(0);
    });
  });
});
