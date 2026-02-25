/**
 * Tests for core types
 */

import {
  RelocationMap,
  MoveResult,
  Reference,
  BrokenReference,
  FileCategory,
  ReorganizationConfig,
  ValidationReport
} from '../../src/reorganizer/types';

describe('Core Types', () => {
  describe('RelocationMap', () => {
    it('should create a map of source to destination paths', () => {
      const map: RelocationMap = new Map();
      map.set('source.md', 'dest/source.md');
      
      expect(map.get('source.md')).toBe('dest/source.md');
      expect(map.size).toBe(1);
    });
  });

  describe('MoveResult', () => {
    it('should represent a successful move operation', () => {
      const result: MoveResult = {
        sourcePath: 'source.md',
        destPath: 'dest/source.md',
        success: true,
        usedGit: true
      };
      
      expect(result.success).toBe(true);
      expect(result.usedGit).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should represent a failed move operation', () => {
      const result: MoveResult = {
        sourcePath: 'source.md',
        destPath: 'dest/source.md',
        success: false,
        usedGit: false,
        error: 'File not found'
      };
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('File not found');
    });
  });

  describe('Reference', () => {
    it('should represent a file reference', () => {
      const ref: Reference = {
        filePath: 'README.md',
        lineNumber: 10,
        oldPath: 'DOCUMENTATION.md',
        newPath: 'docs/DOCUMENTATION.md',
        matchedPattern: 'markdown-link'
      };
      
      expect(ref.filePath).toBe('README.md');
      expect(ref.lineNumber).toBe(10);
      expect(ref.oldPath).toBe('DOCUMENTATION.md');
      expect(ref.newPath).toBe('docs/DOCUMENTATION.md');
    });
  });

  describe('BrokenReference', () => {
    it('should represent a broken reference', () => {
      const broken: BrokenReference = {
        filePath: 'README.md',
        lineNumber: 15,
        referencedPath: 'missing.md'
      };
      
      expect(broken.filePath).toBe('README.md');
      expect(broken.referencedPath).toBe('missing.md');
    });
  });

  describe('FileCategory', () => {
    it('should have all expected categories', () => {
      expect(FileCategory.CHECKLIST).toBe('checklists');
      expect(FileCategory.STATUS).toBe('status');
      expect(FileCategory.GUIDE).toBe('guides');
      expect(FileCategory.ANALYSIS).toBe('analysis');
      expect(FileCategory.GENERAL).toBe('general');
      expect(FileCategory.PRESERVE).toBe('preserve');
    });
  });

  describe('ReorganizationConfig', () => {
    it('should represent configuration options', () => {
      const config: ReorganizationConfig = {
        projectRoot: '/path/to/project',
        docsBaseDir: 'docs/',
        useGit: true,
        dryRun: false,
        updateReadme: true,
        validateAfter: true
      };
      
      expect(config.projectRoot).toBe('/path/to/project');
      expect(config.docsBaseDir).toBe('docs/');
      expect(config.useGit).toBe(true);
      expect(config.dryRun).toBe(false);
    });
  });

  describe('ValidationReport', () => {
    it('should represent a successful validation', () => {
      const report: ValidationReport = {
        success: true,
        filesMovedCount: 12,
        filesInCorrectLocation: ['docs/DOCUMENTATION.md', 'docs/HOW_IT_WORKS.md'],
        filesInWrongLocation: [],
        brokenReferences: [],
        rootDirectoryClean: true,
        unexpectedRootFiles: []
      };
      
      expect(report.success).toBe(true);
      expect(report.filesMovedCount).toBe(12);
      expect(report.rootDirectoryClean).toBe(true);
      expect(report.brokenReferences).toHaveLength(0);
    });

    it('should represent a failed validation', () => {
      const report: ValidationReport = {
        success: false,
        filesMovedCount: 10,
        filesInCorrectLocation: ['docs/DOCUMENTATION.md'],
        filesInWrongLocation: ['DOCUMENTATION.md'],
        brokenReferences: [
          {
            filePath: 'README.md',
            lineNumber: 10,
            referencedPath: 'missing.md'
          }
        ],
        rootDirectoryClean: false,
        unexpectedRootFiles: ['DOCUMENTATION.md']
      };
      
      expect(report.success).toBe(false);
      expect(report.rootDirectoryClean).toBe(false);
      expect(report.brokenReferences).toHaveLength(1);
      expect(report.unexpectedRootFiles).toContain('DOCUMENTATION.md');
    });
  });
});
