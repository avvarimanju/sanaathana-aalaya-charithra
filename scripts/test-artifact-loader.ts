#!/usr/bin/env ts-node
/**
 * Test script to verify artifact loader functionality
 */

import { ArtifactLoader } from '../src/pre-generation/loaders/artifact-loader';

async function testArtifactLoader() {
  console.log('🧪 Testing Artifact Loader...\n');

  try {
    const loader = new ArtifactLoader();
    
    // Load all artifacts
    const artifacts = await loader.loadArtifacts();
    
    console.log('\n📊 Artifact Statistics:');
    console.log(`   Total artifacts: ${loader.getArtifactCount()}`);
    console.log(`   Temple groups: ${loader.getTempleGroups().length}`);
    console.log(`   Site IDs: ${loader.getSiteIds().length}`);
    
    console.log('\n🏛️  Temple Groups:');
    loader.getTempleGroups().forEach(group => {
      const count = artifacts.filter(a => a.templeGroup === group).length;
      console.log(`   - ${group}: ${count} artifacts`);
    });
    
    console.log('\n✅ Artifact loader test completed successfully!');
  } catch (error) {
    console.error('\n❌ Artifact loader test failed:', error);
    process.exit(1);
  }
}

testArtifactLoader();
