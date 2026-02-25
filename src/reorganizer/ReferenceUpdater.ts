/**
 * ReferenceUpdater - Scans and updates file references across the project
 * 
 * This component finds references to moved files and updates them to point
 * to the new locations, preserving relative path relationships.
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import { RelocationMap, Reference, BrokenReference } from './types';

/**
 * Reference patterns for detecting file references in various formats
 */
export const REFERENCE_PATTERNS = [
  // Markdown links: [text](path)
  { pattern: /\[([^\]]+)\]\(([^)]+\.md)\)/g, name: 'markdown-link' },
  
  // Markdown reference-style: [text]: path
  { pattern: /\[([^\]]+)\]:\s*([^\s]+\.md)/g, name: 'markdown-reference' },
  
  // HTML links: href="path"
  { pattern: /href=["']([^"']+\.md)["']/g, name: 'html-href' },
  
  // Import statements: from './path'
  { pattern: /from\s+['"]([^'"]+\.md)['"]/g, name: 'import-statement' },
  
  // Require statements: require('./path')
  { pattern: /require\(['"]([^'"]+\.md)['"]\)/g, name: 'require-statement' },
  
  // File path comments: // path/to/file.md
  { pattern: /\/\/\s*([^\s]+\.md)/g, name: 'comment-path' }
];

/**
 * ReferenceUpdater class for scanning and updating file references
 */
export class ReferenceUpdater {
  /**
   * Updates a reference path based on file relocation
   * @param currentFilePath - Path of file containing the reference
   * @param oldRefPath - Current reference path
   * @param newActualPath - New actual path of the referenced file
   * @returns Updated reference path
   */
  private updateReference(
    currentFilePath: string,
    oldRefPath: string,
    newActualPath: string
  ): string {
    // Determine if reference is relative or absolute
    const isRelative = oldRefPath.startsWith('./') || oldRefPath.startsWith('../');
    
    if (isRelative) {
      // Calculate new relative path from current file to new location
      const currentDir = path.dirname(currentFilePath);
      let relativePath = path.relative(currentDir, newActualPath);
      
      // Ensure forward slashes for consistency
      relativePath = relativePath.replace(/\\/g, '/');
      
      // Add ./ prefix if not already present
      if (!relativePath.startsWith('.')) {
        relativePath = './' + relativePath;
      }
      
      return relativePath;
    } else {
      // Update absolute path - ensure forward slashes
      return newActualPath.replace(/\\/g, '/');
    }
  }

  /**
   * Scans a file for references to moved files
   * @param filePath - Path to file to scan
   * @param relocationMap - Map of old to new paths
   * @returns Array of found references
   */
  async findReferences(
    filePath: string,
    relocationMap: RelocationMap
  ): Promise<Reference[]> {
    const references: Reference[] = [];

    try {
      // Read file content
      const content = await fs.readFile(filePath, 'utf-8');
      const lines = content.split('\n');

      // Apply all reference patterns to find matches
      for (const { pattern, name } of REFERENCE_PATTERNS) {
        // Reset regex state
        pattern.lastIndex = 0;
        
        let match;
        while ((match = pattern.exec(content)) !== null) {
          // Extract the path from the match (last capture group)
          const matchedPath = match[match.length - 1];
          
          // Find line number
          const matchIndex = match.index;
          let lineNumber = 0;
          let charCount = 0;
          for (let i = 0; i < lines.length; i++) {
            charCount += lines[i].length + 1; // +1 for newline
            if (charCount > matchIndex) {
              lineNumber = i + 1;
              break;
            }
          }

          // Check if this path exists in relocation map
          // Try both with and without leading ./
          const normalizedPath = matchedPath.replace(/^\.\//, '');
          
          for (const [oldPath, newPath] of relocationMap.entries()) {
            if (normalizedPath === oldPath || matchedPath === oldPath) {
              // Calculate the new reference path
              const newRefPath = this.updateReference(filePath, matchedPath, newPath);
              
              references.push({
                filePath,
                lineNumber,
                oldPath: matchedPath,
                newPath: newRefPath,
                matchedPattern: name
              });
              break;
            }
          }
        }
      }
    } catch (error) {
      // If file cannot be read, return empty array
      console.warn(`Could not read file ${filePath}: ${error instanceof Error ? error.message : String(error)}`);
    }

    return references;
  }

  /**
   * Updates references in a single file
   * @param filePath - Path to file to update
   * @param references - References to update
   * @returns true if file was modified
   */
  async updateFile(
    filePath: string,
    references: Reference[]
  ): Promise<boolean> {
    if (references.length === 0) {
      return false;
    }

    try {
      // Read file content
      let content = await fs.readFile(filePath, 'utf-8');
      let modified = false;

      // Replace each old reference with new reference
      for (const ref of references) {
        const oldContent = content;
        content = content.replace(ref.oldPath, ref.newPath);
        
        if (content !== oldContent) {
          modified = true;
        }
      }

      // Write updated content back to file if modified
      if (modified) {
        await fs.writeFile(filePath, content, 'utf-8');
      }

      return modified;
    } catch (error) {
      // Handle file write errors gracefully
      console.error(`Failed to update file ${filePath}: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }

  /**
   * Updates all references to moved files across the project
   * @param relocationMap - Map of old paths to new paths
   * @param projectRoot - Root directory to scan
   * @returns List of files that were updated
   */
  async updateReferences(
    relocationMap: RelocationMap,
    projectRoot: string
  ): Promise<string[]> {
    const modifiedFiles: string[] = [];

    try {
      // Scan all project files (markdown, TypeScript, JSON, YAML)
      const filesToScan = await this.scanProjectFiles(projectRoot);

      // For each file, find and update references
      for (const filePath of filesToScan) {
        const references = await this.findReferences(filePath, relocationMap);
        
        if (references.length > 0) {
          const wasModified = await this.updateFile(filePath, references);
          
          if (wasModified) {
            modifiedFiles.push(filePath);
          }
        }
      }
    } catch (error) {
      console.error(`Error updating references: ${error instanceof Error ? error.message : String(error)}`);
    }

    return modifiedFiles;
  }

  /**
   * Recursively scans project for files to check for references
   * @param dir - Directory to scan
   * @returns Array of file paths
   */
  private async scanProjectFiles(dir: string): Promise<string[]> {
    const files: string[] = [];
    const extensions = ['.md', '.ts', '.tsx', '.js', '.jsx', '.json', '.yaml', '.yml'];

    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        // Skip node_modules, .git, and other hidden directories
        if (entry.isDirectory()) {
          if (!entry.name.startsWith('.') && entry.name !== 'node_modules') {
            const subFiles = await this.scanProjectFiles(fullPath);
            files.push(...subFiles);
          }
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name);
          if (extensions.includes(ext)) {
            files.push(fullPath);
          }
        }
      }
    } catch (error) {
      console.warn(`Could not scan directory ${dir}: ${error instanceof Error ? error.message : String(error)}`);
    }

    return files;
  }

  /**
   * Validates no broken references exist
   * @param projectRoot - Root directory to validate
   * @returns Array of broken references found
   */
  async validateReferences(projectRoot: string): Promise<BrokenReference[]> {
    const brokenReferences: BrokenReference[] = [];

    try {
      const filesToScan = await this.scanProjectFiles(projectRoot);

      for (const filePath of filesToScan) {
        const content = await fs.readFile(filePath, 'utf-8');
        const lines = content.split('\n');

        // Check all reference patterns
        for (const { pattern } of REFERENCE_PATTERNS) {
          pattern.lastIndex = 0;
          
          let match;
          while ((match = pattern.exec(content)) !== null) {
            const referencedPath = match[match.length - 1];
            
            // Find line number
            const matchIndex = match.index;
            let lineNumber = 0;
            let charCount = 0;
            for (let i = 0; i < lines.length; i++) {
              charCount += lines[i].length + 1;
              if (charCount > matchIndex) {
                lineNumber = i + 1;
                break;
              }
            }

            // Check if referenced file exists
            const fileDir = path.dirname(filePath);
            const absolutePath = path.resolve(fileDir, referencedPath);
            
            try {
              await fs.access(absolutePath);
            } catch {
              // File doesn't exist - add to broken references
              brokenReferences.push({
                filePath,
                lineNumber,
                referencedPath
              });
            }
          }
        }
      }
    } catch (error) {
      console.error(`Error validating references: ${error instanceof Error ? error.message : String(error)}`);
    }

    return brokenReferences;
  }
}
