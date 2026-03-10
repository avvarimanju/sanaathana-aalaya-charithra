# Test Suite Documentation

## Directory Structure

```
tests/
├── unit/                          # Unit Tests - Test individual components in isolation
│   ├── models/                    # Data model and schema tests
│   ├── repositories/              # Database repository layer tests
│   ├── services/                  # Business logic service tests
│   └── lambdas/                   # AWS Lambda function tests
│
├── integration/                   # Integration Tests - Test component interactions
│   ├── api/                       # API endpoint integration tests
│   ├── dashboard/                 # Dashboard feature integration tests
│   ├── defect-tracking/           # Defect tracking system integration tests
│   └── pre-generation/            # Content pre-generation integration tests
│
├── e2e/                          # End-to-End Tests - Test complete user workflows
│   └── admin-portal/              # Admin portal E2E tests using Playwright
│
├── property-based/               # Property-Based Tests - Test correctness properties
│   ├── system/                    # System-level invariants and properties
│   └── performance/               # Performance characteristics
│
├── fixtures/                     # Shared test data and fixtures
├── helpers/                      # Shared test utilities and helper functions
├── config/                       # Test configuration files
│   ├── jest.config.js            # Jest configuration
│   ├── playwright.config.ts      # Playwright configuration
│   └── setup.ts                  # Test environment setup
│
├── results/                      # Test execution results (gitignored)
├── node_modules/                 # Test dependencies (gitignored)
│
├── package.json                  # Test dependencies and scripts
├── package-lock.json
└── README.md                     # This file
```

## Test Types

### 1. Unit Tests (`unit/`)
Test individual functions, classes, or components in complete isolation.

**Characteristics:**
- Fast execution
- No external dependencies (databases, APIs, file system)
- Use mocks and stubs for dependencies
- High code coverage target (>80%)

**Run command:**
```bash
npm test -- unit/
```

### 2. Integration Tests (`integration/`)
Test how multiple components work together.

**Characteristics:**
- Test component interactions
- May use test databases or mock services
- Slower than unit tests
- Focus on interface contracts

**Run command:**
```bash
npm test -- integration/
```

### 3. End-to-End Tests (`e2e/`)
Test complete user workflows through the UI.

**Characteristics:**
- Test real user scenarios
- Use actual browsers (Playwright)
- Slowest test type
- Test critical user paths

**Run command:**
```bash
npm run test:e2e
```

### 4. Property-Based Tests (`property-based/`)
Test system properties and invariants using generated test cases.

**Characteristics:**
- Test correctness properties
- Generate many test cases automatically
- Find edge cases
- Verify system invariants

**Run command:**
```bash
npm test -- property-based/
```

## Running Tests

### Run All Tests
```bash
npm test
```

### Run Specific Test Suite
```bash
npm test -- unit/services/
npm test -- integration/api/
npm test -- e2e/admin-portal/
npm test -- property-based/system/
```

### Run Tests in Watch Mode
```bash
npm test -- --watch
```

### Run Tests with Coverage
```bash
npm test -- --coverage
```

### Run E2E Tests
```bash
npm run test:e2e
```

### Run E2E Tests in UI Mode
```bash
npm run test:e2e:ui
```

## Writing Tests

### Unit Test Example
```typescript
// unit/services/temple-service.test.ts
import { TempleService } from '../../../src/services/TempleService';

describe('TempleService', () => {
  let service: TempleService;

  beforeEach(() => {
    service = new TempleService();
  });

  it('should validate temple data', () => {
    const temple = { name: 'Test Temple', state: 'Karnataka' };
    expect(service.validate(temple)).toBe(true);
  });
});
```

### Integration Test Example
```typescript
// integration/api/temple-api.test.ts
import request from 'supertest';
import { app } from '../../../src/app';

describe('Temple API', () => {
  it('should return list of temples', async () => {
    const response = await request(app)
      .get('/api/temples')
      .expect(200);
    
    expect(response.body).toHaveProperty('temples');
  });
});
```

### E2E Test Example
```typescript
// e2e/admin-portal/temple-management.test.ts
import { test, expect } from '@playwright/test';

test('should add new temple', async ({ page }) => {
  await page.goto('/admin/temples');
  await page.click('button:has-text("Add Temple")');
  await page.fill('input[name="name"]', 'New Temple');
  await page.click('button:has-text("Save")');
  
  await expect(page.locator('text=New Temple')).toBeVisible();
});
```

### Property-Based Test Example
```typescript
// property-based/system/temple-id-generation.test.ts
import fc from 'fast-check';

describe('Temple ID Generation', () => {
  it('should always generate unique IDs', () => {
    fc.assert(
      fc.property(fc.array(fc.string()), (names) => {
        const ids = names.map(generateTempleId);
        const uniqueIds = new Set(ids);
        return ids.length === uniqueIds.size;
      })
    );
  });
});
```

## Best Practices

### General
1. **One assertion per test** (when possible)
2. **Clear test names** that describe what is being tested
3. **Arrange-Act-Assert** pattern
4. **Independent tests** - no test should depend on another
5. **Clean up after tests** - use afterEach/afterAll hooks

### Unit Tests
1. Mock all external dependencies
2. Test edge cases and error conditions
3. Keep tests fast (<100ms per test)
4. Aim for high code coverage

### Integration Tests
1. Use test databases or containers
2. Test happy paths and error scenarios
3. Verify data persistence and retrieval
4. Test API contracts

### E2E Tests
1. Test critical user journeys only
2. Use page objects for reusability
3. Make tests resilient to UI changes
4. Run in CI/CD pipeline

### Property-Based Tests
1. Define clear properties to test
2. Use appropriate generators
3. Start with simple properties
4. Add shrinking for better debugging

## Continuous Integration

Tests run automatically on:
- Every pull request
- Every commit to main branch
- Nightly builds (full suite including E2E)

### CI Test Strategy
- **PR builds**: Unit + Integration tests
- **Main branch**: Unit + Integration + E2E tests
- **Nightly**: Full suite + Performance tests

## Test Coverage

### Coverage Targets
- **Unit Tests**: >80% code coverage
- **Integration Tests**: >60% feature coverage
- **E2E Tests**: 100% critical path coverage

### Viewing Coverage Reports
```bash
npm test -- --coverage
open coverage/lcov-report/index.html
```

## Troubleshooting

### Tests Failing Locally
1. Ensure dependencies are installed: `npm install`
2. Clear Jest cache: `npm test -- --clearCache`
3. Check Node version matches CI environment

### E2E Tests Failing
1. Install Playwright browsers: `npx playwright install`
2. Check if services are running
3. Verify environment variables are set

### Slow Tests
1. Run specific test suites instead of all tests
2. Use `--maxWorkers=4` to limit parallel execution
3. Check for unnecessary async operations

## Contributing

When adding new tests:
1. Place tests in the appropriate directory
2. Follow naming conventions: `*.test.ts` or `*.spec.ts`
3. Update this README if adding new test patterns
4. Ensure tests pass locally before committing
5. Add tests for new features and bug fixes

## Resources

- [Jest Documentation](https://jestjs.io/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Best Practices](https://testingjavascript.com/)
- [Property-Based Testing Guide](https://fast-check.dev/)
