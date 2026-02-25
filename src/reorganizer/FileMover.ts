import { promises as fs } from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import { RelocationMap, MoveResult } from './types';

const execAsync = promisify(exec);

/**
 * FileMover class handles file relocation operations with git history preservation
 */
export class FileMover {
  /**
   * Helper function to move a file using git mv with fallback to standard move
   * @param source - Source file path
   * @param dest - Destination file path
   * @returns Boolean indicating whether git was used
   */
  private async moveWithGit(source: string, dest: string): Promise<boolean> {
    try {
      // Attempt git mv command first
      await execAsync(`git mv "${source}" "${dest}"`);
      return true;
    } catch (error) {
      // Fall back to standard file system move
      try {
        await fs.rename(source, dest);
        return false;
      } catch (renameError) {
        // Re-throw the rename error if both operations fail
        throw renameError;
      }
    }
  }

  /**
   * Verifies that a file exists at the specified path
   * @param filePath - Path to verify
   * @returns True if file exists
   */
  private async verifyFile(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Creates necessary target directories from the relocation map
   * @param relocationMap - Map of source to destination paths
   */
  async createDirectories(relocationMap: RelocationMap): Promise<void> {
    // Extract unique target directories from relocation map
    const directories = new Set<string>();
    
    for (const destPath of relocationMap.values()) {
      const dir = path.dirname(destPath);
      directories.add(dir);
    }

    // Create each directory with recursive option
    for (const dir of directories) {
      try {
        await fs.mkdir(dir, { recursive: true });
      } catch (error) {
        // Handle directory creation errors gracefully
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error(`Failed to create directory ${dir}: ${errorMessage}`);
      }
    }
  }

  /**
   * Moves a single file with git history preservation
   * @param sourcePath - Current file path
   * @param destPath - Target file path
   * @returns MoveResult with success status and metadata
   */
  async moveFile(sourcePath: string, destPath: string): Promise<MoveResult> {
    try {
      // Call moveWithGit to execute the move
      const usedGit = await this.moveWithGit(sourcePath, destPath);
      
      // Verify file exists at destination
      const verified = await this.verifyFile(destPath);
      
      if (!verified) {
        return {
          sourcePath,
          destPath,
          success: false,
          usedGit,
          error: 'File verification failed: file not found at destination'
        };
      }

      return {
        sourcePath,
        destPath,
        success: true,
        usedGit
      };
    } catch (error) {
      // Handle file access errors and log failures
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        sourcePath,
        destPath,
        success: false,
        usedGit: false,
        error: errorMessage
      };
    }
  }

  /**
   * Moves multiple files according to the relocation map
   * @param relocationMap - Map of source to destination paths
   * @returns Array of MoveResult for each operation
   */
  async moveFiles(relocationMap: RelocationMap): Promise<MoveResult[]> {
    const results: MoveResult[] = [];

    try {
      // Create all necessary target directories
      await this.createDirectories(relocationMap);
    } catch (error) {
      // If directory creation fails, return early with error for all files
      const errorMessage = error instanceof Error ? error.message : String(error);
      for (const [sourcePath, destPath] of relocationMap.entries()) {
        results.push({
          sourcePath,
          destPath,
          success: false,
          usedGit: false,
          error: `Directory creation failed: ${errorMessage}`
        });
      }
      return results;
    }

    // Iterate through relocation map and move each file
    for (const [sourcePath, destPath] of relocationMap.entries()) {
      // Move the file and collect result
      const result = await this.moveFile(sourcePath, destPath);
      results.push(result);
      
      // Continue on individual failures - don't stop the process
      if (!result.success) {
        console.error(`Failed to move ${sourcePath} to ${destPath}: ${result.error}`);
      }
    }

    // Return array of all MoveResults
    return results;
  }
}
