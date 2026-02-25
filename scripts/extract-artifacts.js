#!/usr/bin/env node
/**
 * Extract artifacts from seed-data.ts and create JSON export
 * This script parses the TypeScript seed data and extracts all artifact definitions
 */

const fs = require('fs');
const path = require('path');

// Read the seed-data.ts file
const seedDataPath = path.join(__dirname, 'seed-data.ts');
const content = fs.readFileSync(seedDataPath, 'utf8');

// Extract artifact objects using regex
// This is a simplified parser - in production, use a proper TypeScript parser
const artifacts = [];

// Find all artifact definitions between { artifactId: and }
const artifactPattern = /\{\s*artifactId:\s*'([^']+)',\s*siteId:\s*'([^']+)',\s*name:\s*'([^']+)',\s*type:\s*ArtifactType\.(\w+),\s*description:\s*'([^']*)',\s*historicalContext:\s*'([^']*)',\s*culturalSignificance:\s*'([^']*)',/g;

let match;
while ((match = artifactPattern.exec(content)) !== null) {
  const [, artifactId, siteId, name, type, description, historicalContext, culturalSignificance] = match;
  
  // Determine temple group from siteId
  const templeGroup = siteId;
  
  artifacts.push({
    artifactId,
    siteId,
    name,
    type: type.toLowerCase(),
    description,
    historicalContext,
    culturalSignificance,
    templeGroup,
  });
}

console.log(`Extracted ${artifacts.length} artifacts`);

// Write to JSON file
const outputPath = path.join(__dirname, '..', 'data', 'artifacts.json');
const outputDir = path.dirname(outputPath);

// Create data directory if it doesn't exist
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

fs.writeFileSync(outputPath, JSON.stringify(artifacts, null, 2));
console.log(`✅ Artifacts exported to ${outputPath}`);
console.log(`\nSummary:`);
console.log(`  Total artifacts: ${artifacts.length}`);

// Count by temple group
const byTemple = {};
artifacts.forEach(a => {
  byTemple[a.templeGroup] = (byTemple[a.templeGroup] || 0) + 1;
});

console.log(`\nArtifacts by temple:`);
Object.entries(byTemple).sort((a, b) => b[1] - a[1]).forEach(([temple, count]) => {
  console.log(`  ${temple}: ${count}`);
});
