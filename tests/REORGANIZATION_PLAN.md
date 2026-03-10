# Test Directory Reorganization Plan

## Current Issues
- Test files are scattered across multiple directories without clear categorization
- Mix of unit tests, integration tests, and E2E tests in various locations
- No clear separation between test types

## Proposed Structure

```
tests/
├── unit/                          # Unit tests (isolated component/function tests)
│   ├── models/                    # Data model tests
│   ├── repositories/              # Repository layer tests
│   ├── services/                  # Service layer tests
│   ├── lambdas/                   # Lambda function tests
│   └── utils/                     # Utility function tests
│
├── integration/                   # Integration tests (multiple components)
│   ├── api/                       # API integration tests
│   ├── dashboard/                 # Dashboard integration tests
│   ├── defect-tracking/           # Defect tracking integration tests
│   └── pre-generation/            # Pre-generation integration tests
│
├── e2e/                          # End-to-end tests (full user flows)
│   └── admin-portal/              # Admin portal E2E tests
│
├── property-based/               # Property-based tests (correctness properties)
│   ├── system/                    # System-level properties
│   ├── performance/               # Performance properties
│   └── security/                  # Security properties
│
├── fixtures/                     # Shared test fixtures and data
├── helpers/                      # Shared test utilities and helpers
├── config/                       # Test configuration files
│   ├── jest.config.js
│   ├── playwright.config.ts
│   └── setup.ts
│
├── results/                      # Test execution results (gitignored)
├── coverage/                     # Code coverage reports (gitignored)
│
├── package.json                  # Test dependencies
├── package-lock.json
└── README.md                     # Test documentation
```

## Migration Steps

1. Create new directory structure
2. Move unit tests to `unit/` directory
3. Move integration tests to `integration/` directory
4. Move E2E tests to `e2e/` directory
5. Move property-based tests to `property-based/` directory
6. Move configuration files to `config/` directory
7. Move test results to `results/` directory
8. Update import paths in test files
9. Update jest/playwright configurations
10. Update .gitignore to exclude results and coverage
11. Create README with testing guidelines

## Benefits

- Clear separation of test types
- Easier to run specific test suites
- Better organization for new developers
- Follows industry best practices
- Easier to configure different test runners for different test types
