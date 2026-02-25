/**
 * Unit tests for FileMover class
 */

import { FileMover } from '../../src/reorganizer/FileMover';
import { RelocationMap } from '../../src/reorganizer/types';
import * as path from 'path';
import { createTestDirectory, cleanupTestDirectory, fileExists, readFileContent } from './setup';

describe('FileMover', () => {
  let fileMover: FileMover;
  const testDir = path.join(__dirname, 'test-file-mover');

  beforeEach(() => {
    fileMover = new FileMover();
  });

  afterEach(async () => {
    await cleanupTestDirectory(testDir);
  });

  describe('createDirectories', () => {
    it('should create all necessary target directories', async () => {
      const relocationMap: RelocationMap = new Map([
        ['file1.md', path.join(testDir, 'docs/checklists/file1.md')],
        ['file2.md', path.join(testDir, 'docs/status/file2.md')],
        ['file3.md', path.join(testDir, 'docs/guides/file3.md')]
      ]);

      await fileMover.createDirectories(relocationMap);

      // Verify directories were created
      expect(await fileExists(path.join(testDir, 'docs/checklists'))).toBe(true);
      expect(await fileExists(path.join(testDir, 'docs/status'))).toBe(true);
      expect(await fileExists(path.join(testDir, 'docs/guides'))).toBe(true);
    });

    it('should handle nested directory creation', async () => {
      const relocationMap: RelocationMap = new Map([
        ['file1.md', path.join(testDir, 'docs/deep/nested/path/file1.md')]
      ]);

      await fileMover.createDirectories(relocationMap);

      expect(await fileExists(path.join(testDir, 'docs/deep/nested/path'))).toBe(true);
    });

    it('should not fail if directories already exist', async () => {
      const relocationMap: RelocationMap = new Map([
        ['file1.md', path.join(testDir, 'docs/checklists/file1.md')]
      ]);

      // Create directory first
      await fileMover.createDirectories(relocationMap);
      
      // Should not throw when called again
      await expect(fileMover.createDirectories(relocationMap)).resolves.not.toThrow();
    });
  });

  describe('moveFile', () => {
    it('should successfully move a file', async () => {
      // Create test file
      const sourceFile = path.join(testDir, 'source.md');
      const destFile = path.join(testDir, 'dest/source.md');
      
      await createTestDirectory(testDir, ['source.md']);
      await fileMover.createDirectories(new Map([['source.md', destFile]]));

      const result = await fileMover.moveFile(sourceFile, destFile);

      expect(result.success).toBe(true);
      expect(result.sourcePath).toBe(sourceFile);
      expect(result.destPath).toBe(destFile);
      expect(await fileExists(destFile)).toBe(true);
      expect(await fileExists(sourceFile)).toBe(false);
    });

    it('should preserve file content during move', async () => {
      const sourceFile = path.join(testDir, 'content.md');
      const destFile = path.join(testDir, 'dest/content.md');
      const testContent = '# Test Content\n\nThis is test content.';
      
      await createTestDirectory(testDir, []);
      const fs = require('fs/promises');
      await fs.writeFile(sourceFile, testContent);
      await fileMover.createDirectories(new Map([['content.md', destFile]]));

      await fileMover.moveFile(sourceFile, destFile);

      const movedContent = await readFileContent(destFile);
      expect(movedContent).toBe(testContent);
    });

    it('should return error when source file does not exist', async () => {
      const sourceFile = path.join(testDir, 'nonexistent.md');
      const destFile = path.join(testDir, 'dest/nonexistent.md');

      const result = await fileMover.moveFile(sourceFile, destFile);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should verify file exists at destination', async () => {
      const sourceFile = path.join(testDir, 'verify.md');
      const destFile = path.join(testDir, 'dest/verify.md');
      
      await createTestDirectory(testDir, ['verify.md']);
      await fileMover.createDirectories(new Map([['verify.md', destFile]]));

      const result = await fileMover.moveFile(sourceFile, destFile);

      expect(result.success).toBe(true);
      expect(await fileExists(destFile)).toBe(true);
    });
  });

  describe('moveFiles', () => {
    it('should move multiple files successfully', async () => {
      const files = ['file1.md', 'file2.md', 'file3.md'];
      await createTestDirectory(testDir, files);

      const relocationMap: RelocationMap = new Map([
        [path.join(testDir, 'file1.md'), path.join(testDir, 'docs/checklists/file1.md')],
        [path.join(testDir, 'file2.md'), path.join(testDir, 'docs/status/file2.md')],
        [path.join(testDir, 'file3.md'), path.join(testDir, 'docs/guides/file3.md')]
      ]);

      const results = await fileMover.moveFiles(relocationMap);

      expect(results).toHaveLength(3);
      expect(results.every(r => r.success)).toBe(true);
      expect(await fileExists(path.join(testDir, 'docs/checklists/file1.md'))).toBe(true);
      expect(await fileExists(path.join(testDir, 'docs/status/file2.md'))).toBe(true);
      expect(await fileExists(path.join(testDir, 'docs/guides/file3.md'))).toBe(true);
    });

    it('should create all necessary directories before moving', async () => {
      const files = ['file1.md'];
      await createTestDirectory(testDir, files);

      const relocationMap: RelocationMap = new Map([
        [path.join(testDir, 'file1.md'), path.join(testDir, 'docs/new/directory/file1.md')]
      ]);

      const results = await fileMover.moveFiles(relocationMap);

      expect(results[0].success).toBe(true);
      expect(await fileExists(path.join(testDir, 'docs/new/directory'))).toBe(true);
    });

    it('should continue on individual failures and report all results', async () => {
      await createTestDirectory(testDir, ['exists.md']);

      const relocationMap: RelocationMap = new Map([
        [path.join(testDir, 'exists.md'), path.join(testDir, 'docs/exists.md')],
        [path.join(testDir, 'missing.md'), path.join(testDir, 'docs/missing.md')],
        [path.join(testDir, 'another-missing.md'), path.join(testDir, 'docs/another-missing.md')]
      ]);

      const results = await fileMover.moveFiles(relocationMap);

      expect(results).toHaveLength(3);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(false);
      expect(results[2].success).toBe(false);
    });

    it('should return empty array for empty relocation map', async () => {
      const relocationMap: RelocationMap = new Map();

      const results = await fileMover.moveFiles(relocationMap);

      expect(results).toHaveLength(0);
    });

    it('should collect MoveResult for each operation', async () => {
      const files = ['file1.md', 'file2.md'];
      await createTestDirectory(testDir, files);

      const relocationMap: RelocationMap = new Map([
        [path.join(testDir, 'file1.md'), path.join(testDir, 'docs/file1.md')],
        [path.join(testDir, 'file2.md'), path.join(testDir, 'docs/file2.md')]
      ]);

      const results = await fileMover.moveFiles(relocationMap);

      expect(results).toHaveLength(2);
      results.forEach(result => {
        expect(result).toHaveProperty('sourcePath');
        expect(result).toHaveProperty('destPath');
        expect(result).toHaveProperty('success');
        expect(result).toHaveProperty('usedGit');
      });
    });
  });
});
