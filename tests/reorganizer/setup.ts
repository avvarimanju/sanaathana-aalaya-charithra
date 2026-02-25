/**
 * Test setup for reorganizer tests
 */

import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Creates a temporary test directory with sample files
 */
export async function createTestDirectory(baseDir: string, files: string[]): Promise<void> {
  await fs.mkdir(baseDir, { recursive: true });
  
  for (const file of files) {
    const filePath = path.join(baseDir, file);
    const dir = path.dirname(filePath);
    
    // Create parent directory if needed
    if (dir !== baseDir) {
      await fs.mkdir(dir, { recursive: true });
    }
    
    // Create file with sample content
    await fs.writeFile(filePath, `# ${file}\n\nSample content for ${file}\n`);
  }
}

/**
 * Cleans up a test directory
 */
export async function cleanupTestDirectory(baseDir: string): Promise<void> {
  try {
    await fs.rm(baseDir, { recursive: true, force: true });
  } catch (error) {
    // Ignore errors if directory doesn't exist
  }
}

/**
 * Checks if a file exists
 */
export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Reads file content
 */
export async function readFileContent(filePath: string): Promise<string> {
  return await fs.readFile(filePath, 'utf-8');
}
