#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');

try {
  console.log('Running property-based tests for authentication...');
  
  // Run Jest directly with specific test file
  const result = execSync(
    'npx jest src/auth/__tests__/auth.property.test.ts --verbose --runInBand --forceExit --no-coverage',
    {
      cwd: __dirname,
      stdio: 'inherit',
      env: {
        ...process.env,
        NODE_ENV: 'test'
      }
    }
  );
  
  console.log('Property tests completed successfully!');
  process.exit(0);
} catch (error) {
  console.error('Property tests failed:', error.message);
  process.exit(1);
}