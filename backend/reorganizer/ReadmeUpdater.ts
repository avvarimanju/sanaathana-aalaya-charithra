/**
 * ReadmeUpdater - Updates README.md with new documentation structure
 * 
 * This component updates the README file to reflect the new documentation
 * organization, adding a documentation index and updating file references.
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import { RelocationMap } from './types';
import { ReferenceUpdater } from './ReferenceUpdater';

/**
 * Updates README.md with new documentation structure
 */
export class ReadmeUpdater {
  private referenceUpdater: ReferenceUpdater;

  constructor() {
    this.referenceUpdater = new ReferenceUpdater();
  }

  /**
   * Updates README.md with documentation index and updated references
   * @param relocationMap - Map of old to new file paths
   * @param projectRoot - Root directory of the project
   * @returns true if README was updated successfully
   */
  async updateReadme(
    relocationMap: RelocationMap,
    projectRoot: string
  ): Promise<boolean> {
    const readmePath = path.join(projectRoot, 'README.md');

    try {
      // Read current README content
      let content = await fs.readFile(readmePath, 'utf-8');

      // Generate documentation index
      const docIndex = this.generateDocumentationIndex(relocationMap);

      // Check if documentation section already exists
      const docSectionRegex = /## Documentation\s*\n([\s\S]*?)(?=\n##|\n---|\z)/;
      const match = content.match(docSectionRegex);

      if (match) {
        // Replace existing documentation section
        content = content.replace(docSectionRegex, `## Documentation\n\n${docIndex}\n`);
      } else {
        // Insert documentation section after overview/introduction
        const insertAfterRegex = /(## Overview[\s\S]*?\n\n|## Introduction[\s\S]*?\n\n|# [^\n]+\n\n[^\n]+\n\n)/;
        const insertMatch = content.match(insertAfterRegex);
        
        if (insertMatch) {
          const insertIndex = insertMatch.index! + insertMatch[0].length;
          content = content.slice(0, insertIndex) + 
                   `## Documentation\n\n${docIndex}\n\n` +
                   content.slice(insertIndex);
        } else {
          // Append at the end if no suitable location found
          content += `\n\n## Documentation\n\n${docIndex}\n`;
        }
      }

      // Update file path references using ReferenceUpdater
      const references = await this.referenceUpdater.findReferences(readmePath, relocationMap);
      
      if (references.length > 0) {
        // Apply reference updates to content
        for (const ref of references) {
          content = content.replace(ref.oldPath, ref.newPath);
        }
      }

      // Write updated content back to README
      await fs.writeFile(readmePath, content, 'utf-8');

      return true;
    } catch (error) {
      console.error(`Failed to update README: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }

  /**
   * Generates a documentation index section
   * @param relocationMap - Map of old to new file paths
   * @returns Formatted documentation index string
   */
  private generateDocumentationIndex(relocationMap: RelocationMap): string {
    const lines: string[] = [];

    // Group files by category
    const categories: Record<string, string[]> = {
      'Checklists': [],
      'Status Reports': [],
      'Guides': [],
      'Analysis': [],
      'General': []
    };

    for (const [oldPath, newPath] of relocationMap.entries()) {
      const filename = path.basename(oldPath);
      const title = this.formatTitle(filename);

      if (newPath.includes('/checklists/')) {
        categories['Checklists'].push(`- [${title}](./${newPath})`);
      } else if (newPath.includes('/status/')) {
        categories['Status Reports'].push(`- [${title}](./${newPath})`);
      } else if (newPath.includes('/guides/')) {
        categories['Guides'].push(`- [${title}](./${newPath})`);
      } else if (newPath.includes('/analysis/')) {
        categories['Analysis'].push(`- [${title}](./${newPath})`);
      } else {
        categories['General'].push(`- [${title}](./${newPath})`);
      }
    }

    // Build documentation index
    lines.push('All project documentation has been organized into the following categories:');
    lines.push('');

    for (const [category, files] of Object.entries(categories)) {
      if (files.length > 0) {
        lines.push(`### ${category}`);
        lines.push('');
        files.forEach(file => lines.push(file));
        lines.push('');
      }
    }

    return lines.join('\n');
  }

  /**
   * Formats a filename into a readable title
   * @param filename - Filename to format
   * @returns Formatted title
   */
  private formatTitle(filename: string): string {
    // Remove .md extension
    let title = filename.replace(/\.md$/i, '');

    // Replace underscores and hyphens with spaces
    title = title.replace(/[_-]/g, ' ');

    // Convert to title case
    title = title.split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');

    return title;
  }
}
