/**
 * Tests for npm scripts configuration
 * 
 * Verifies that the pre-generation npm scripts are correctly configured
 * and can be executed with appropriate arguments.
 * 
 * Requirements: 10.1, 10.2
 */

import { execSync } from 'child_process';
import * as path from 'path';

describe('NPM Scripts Configuration', () => {
  const projectRoot = path.resolve(__dirname, '../..');

  describe('pre-generate script', () => {
    it('should be defined in package.json', () => {
      const packageJson = require('../../package.json');
      expect(packageJson.scripts['pre-generate']).toBeDefined();
      expect(packageJson.scripts['pre-generate']).toContain('ts-node src/pre-generation/cli.ts');
    });

    it('should support --help flag', () => {
      const result = execSync('npm run pre-generate -- --help', {
        cwd: projectRoot,
        encoding: 'utf-8',
      });

      expect(result).toContain('Content Pre-Generation System CLI');
      expect(result).toContain('Usage:');
      expect(result).toContain('Options:');
      expect(result).toContain('--temple-groups');
      expect(result).toContain('--artifact-ids');
      expect(result).toContain('--languages');
      expect(result).toContain('--content-types');
      expect(result).toContain('--force');
      expect(result).toContain('--dry-run');
      expect(result).toContain('--resume');
    });
  });

  describe('pre-generate:dry-run script', () => {
    it('should be defined in package.json', () => {
      const packageJson = require('../../package.json');
      expect(packageJson.scripts['pre-generate:dry-run']).toBeDefined();
      expect(packageJson.scripts['pre-generate:dry-run']).toContain('--dry-run');
    });

    it('should execute with --dry-run flag', () => {
      const packageJson = require('../../package.json');
      const script = packageJson.scripts['pre-generate:dry-run'];
      
      // Verify the script includes the --dry-run flag
      expect(script).toMatch(/ts-node src\/pre-generation\/cli\.ts --dry-run/);
    });
  });

  describe('pre-generate:force script', () => {
    it('should be defined in package.json', () => {
      const packageJson = require('../../package.json');
      expect(packageJson.scripts['pre-generate:force']).toBeDefined();
      expect(packageJson.scripts['pre-generate:force']).toContain('--force');
    });

    it('should execute with --force flag', () => {
      const packageJson = require('../../package.json');
      const script = packageJson.scripts['pre-generate:force'];
      
      // Verify the script includes the --force flag
      expect(script).toMatch(/ts-node src\/pre-generation\/cli\.ts --force/);
    });
  });

  describe('Script argument passing', () => {
    it('should support passing additional arguments through npm run', () => {
      // Test that the help command works with additional arguments
      const result = execSync('npm run pre-generate -- --help', {
        cwd: projectRoot,
        encoding: 'utf-8',
      });

      expect(result).toContain('Content Pre-Generation System CLI');
    });

    it('should support combining multiple flags', () => {
      const packageJson = require('../../package.json');
      
      // Verify base script allows additional arguments
      const baseScript = packageJson.scripts['pre-generate'];
      expect(baseScript).toBe('ts-node src/pre-generation/cli.ts');
      
      // The base script should not have hardcoded flags, allowing flexibility
      expect(baseScript).not.toContain('--');
    });
  });

  describe('Script execution modes', () => {
    it('should support local execution mode', () => {
      const packageJson = require('../../package.json');
      const script = packageJson.scripts['pre-generate'];
      
      // Verify it uses ts-node for local execution
      expect(script).toContain('ts-node');
      expect(script).toContain('src/pre-generation/cli.ts');
    });

    it('should use proper Node.js execution', () => {
      const packageJson = require('../../package.json');
      const script = packageJson.scripts['pre-generate'];
      
      // Verify it uses ts-node (TypeScript execution)
      expect(script).toMatch(/ts-node/);
    });
  });
});
