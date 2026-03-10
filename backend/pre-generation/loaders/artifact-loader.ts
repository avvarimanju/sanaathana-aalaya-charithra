// Artifact Loader for Pre-Generation System
import * as path from 'path';
import { ArtifactMetadata, ArtifactFilter, ValidationResult } from '../types';
import { ArtifactReference } from '../../models/common';

export class ArtifactLoader {
  private artifacts: ArtifactMetadata[] = [];
  private expectedCount: number = 49;

  /**
   * Load all artifacts from seed data
   */
  public async loadArtifacts(): Promise<ArtifactMetadata[]> {
    console.log('📦 Loading artifacts from seed data...');

    try {
      // Dynamically import the seed data module
      const seedDataPath = path.join(process.cwd(), 'scripts', 'seed-data.ts');
      
      // Since we can't directly import TypeScript in runtime, we'll need to
      // read the artifacts from the repository or parse the seed data
      // For now, let's use a direct approach by requiring the compiled version
      
      // Import artifact arrays from seed data
      const artifacts = await this.loadArtifactsFromSeedData();
      
      this.artifacts = artifacts;
      
      // Validate artifact count
      const validation = this.validateArtifacts(artifacts);
      
      if (!validation.valid) {
        console.warn('⚠️  Artifact validation warnings:');
        validation.warnings.forEach(w => console.warn(`   - ${w}`));
        
        if (validation.errors.length > 0) {
          console.error('❌ Artifact validation errors:');
          validation.errors.forEach(e => console.error(`   - ${e}`));
          throw new Error('Artifact validation failed');
        }
      }
      
      console.log(`✅ Loaded ${artifacts.length} artifacts successfully`);
      return artifacts;
    } catch (error) {
      console.error('Failed to load artifacts:', error);
      throw error;
    }
  }

  /**
   * Load artifacts from seed data
   * This method reads artifact data from the artifacts.json file
   */
  private async loadArtifactsFromSeedData(): Promise<ArtifactMetadata[]> {
    const fs = require('fs').promises;
    const artifactsJsonPath = path.join(process.cwd(), 'data', 'artifacts.json');
    
    try {
      console.log(`📂 Reading artifacts from: ${artifactsJsonPath}`);
      const fileContent = await fs.readFile(artifactsJsonPath, 'utf-8');
      const artifacts: ArtifactMetadata[] = JSON.parse(fileContent);
      
      console.log(`✅ Successfully loaded ${artifacts.length} artifacts from JSON`);
      return artifacts;
    } catch (error) {
      console.error('❌ Failed to load artifacts from JSON:', error);
      throw new Error(`Failed to load artifacts.json: ${error}`);
    }
  }

  /**
   * Validate artifacts
   */
  public validateArtifacts(artifacts: ArtifactMetadata[]): ValidationResult {
    const warnings: string[] = [];
    const errors: string[] = [];

    // Check artifact count
    if (artifacts.length !== this.expectedCount) {
      warnings.push(
        `Expected ${this.expectedCount} artifacts, but found ${artifacts.length}`
      );
    }

    // Validate each artifact has required fields
    artifacts.forEach((artifact, index) => {
      if (!artifact.artifactId) {
        errors.push(`Artifact at index ${index} missing artifactId`);
      }
      if (!artifact.siteId) {
        errors.push(`Artifact ${artifact.artifactId || index} missing siteId`);
      }
      if (!artifact.name) {
        errors.push(`Artifact ${artifact.artifactId || index} missing name`);
      }
      if (!artifact.type) {
        errors.push(`Artifact ${artifact.artifactId || index} missing type`);
      }
      if (!artifact.description) {
        warnings.push(`Artifact ${artifact.artifactId} missing description`);
      }
      if (!artifact.historicalContext) {
        warnings.push(`Artifact ${artifact.artifactId} missing historicalContext`);
      }
      if (!artifact.culturalSignificance) {
        warnings.push(`Artifact ${artifact.artifactId} missing culturalSignificance`);
      }
      if (!artifact.templeGroup) {
        warnings.push(`Artifact ${artifact.artifactId} missing templeGroup`);
      }
    });

    // Check for duplicate artifact IDs
    const artifactIds = artifacts.map(a => a.artifactId);
    const duplicates = artifactIds.filter((id, index) => artifactIds.indexOf(id) !== index);
    if (duplicates.length > 0) {
      errors.push(`Duplicate artifact IDs found: ${duplicates.join(', ')}`);
    }

    return {
      valid: errors.length === 0,
      warnings,
      errors,
    };
  }

  /**
   * Filter artifacts by criteria
   */
  public filterArtifacts(filter: ArtifactFilter): ArtifactMetadata[] {
    let filtered = [...this.artifacts];

    if (filter.templeGroups && filter.templeGroups.length > 0) {
      filtered = filtered.filter(a => 
        filter.templeGroups!.includes(a.templeGroup)
      );
    }

    if (filter.artifactIds && filter.artifactIds.length > 0) {
      filtered = filtered.filter(a => 
        filter.artifactIds!.includes(a.artifactId)
      );
    }

    if (filter.siteIds && filter.siteIds.length > 0) {
      filtered = filtered.filter(a => 
        filter.siteIds!.includes(a.siteId)
      );
    }

    console.log(`🔍 Filtered ${this.artifacts.length} artifacts to ${filtered.length}`);
    return filtered;
  }

  /**
   * Get all loaded artifacts
   */
  public getArtifacts(): ArtifactMetadata[] {
    return this.artifacts;
  }

  /**
   * Get artifact count
   */
  public getArtifactCount(): number {
    return this.artifacts.length;
  }

  /**
   * Get unique temple groups
   */
  public getTempleGroups(): string[] {
    const groups = new Set(this.artifacts.map(a => a.templeGroup));
    return Array.from(groups).sort();
  }

  /**
   * Get unique site IDs
   */
  public getSiteIds(): string[] {
    const siteIds = new Set(this.artifacts.map(a => a.siteId));
    return Array.from(siteIds).sort();
  }
}
