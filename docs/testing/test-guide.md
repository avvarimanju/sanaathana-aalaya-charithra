# Testing Guide

Comprehensive testing guide for Sanaathana Aalaya Charithra.

## Test Coverage Overview

| Component | Tests | Coverage | Status |
|-----------|-------|----------|--------|
| Backend | 118 tests | ~40% | ✅ Passing |
| Admin Portal | 7 tests | ~10% | ⚠️ Configured |
| Mobile App | 6 tests | ~5% | ⚠️ Configured |
| **Total** | **131 tests** | **~30%** | **Partial** |

## Running Tests

### Run All Tests

```powershell
# From project root
npm test
```

This runs tests for all three components sequentially.

### Run Specific Test Suites

**Backend tests:**
```powershell
npm run test:backend
```

**Admin Portal tests:**
```powershell
cd admin-portal
npm test
```

**Mobile App tests:**
```powershell
cd mobile-app
npm test
```

### Watch Mode

```powershell
# Backend
npm run test:backend -- --watch

# Admin Portal
cd admin-portal
npm test -- --watch

# Mobile App
cd mobile-app
npm test -- --watch
```

### Coverage Reports

```powershell
# Backend
npm run test:backend -- --coverage

# Admin Portal
cd admin-portal
npm test -- --coverage

# Mobile App
cd mobile-app
npm test -- --coverage
```

Coverage reports are generated in `coverage/` directory.

## Test Structure

### Backend Tests

Located in `src/*/lambdas/**/__tests__/`

**Example structure:**
```
src/temple-pricing/lambdas/
├── temple-management/
│   ├── createTemple.ts
│   ├── updateTemple.ts
│   └── __tests__/
│       ├── createTemple.test.ts
│       ├── updateTemple.test.ts
│       └── bulkOperations.test.ts
```

**Test framework:** Jest + AWS SDK mocks

**Example test:**
```typescript
import { handler } from '../createTemple';
import { DynamoDB } from 'aws-sdk';

jest.mock('aws-sdk');

describe('createTemple', () => {
  it('should create a temple', async () => {
    const mockPut = jest.fn().mockReturnValue({
      promise: () => Promise.resolve({})
    });
    
    (DynamoDB.DocumentClient as jest.Mock).mockImplementation(() => ({
      put: mockPut
    }));

    const event = {
      body: JSON.stringify({
        name: 'Test Temple',
        location: { state: 'Karnataka', city: 'Bangalore' }
      })
    };

    const result = await handler(event);
    
    expect(result.statusCode).toBe(201);
    expect(mockPut).toHaveBeenCalled();
  });
});
```

### Admin Portal Tests

Located in `admin-portal/src/**/__tests__/`

**Test framework:** Jest + React Testing Library

**Example test:**
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { TempleCard } from '../TempleCard';

describe('TempleCard', () => {
  it('should render temple information', () => {
    const temple = {
      id: '1',
      name: 'Golden Temple',
      location: { state: 'Punjab', city: 'Amritsar' }
    };

    render(<TempleCard temple={temple} />);
    
    expect(screen.getByText('Golden Temple')).toBeInTheDocument();
    expect(screen.getByText('Punjab')).toBeInTheDocument();
  });

  it('should call onEdit when edit button clicked', () => {
    const onEdit = jest.fn();
    const temple = { id: '1', name: 'Test' };

    render(<TempleCard temple={temple} onEdit={onEdit} />);
    
    fireEvent.click(screen.getByText('Edit'));
    expect(onEdit).toHaveBeenCalledWith('1');
  });
});
```

### Mobile App Tests

Located in `mobile-app/src/**/__tests__/`

**Test framework:** Jest + React Native Testing Library

**Example test:**
```typescript
import { render, screen, fireEvent } from '@testing-library/react-native';
import { TempleListScreen } from '../TempleListScreen';

describe('TempleListScreen', () => {
  it('should render temple list', () => {
    const temples = [
      { id: '1', name: 'Temple 1' },
      { id: '2', name: 'Temple 2' }
    ];

    render(<TempleListScreen temples={temples} />);
    
    expect(screen.getByText('Temple 1')).toBeTruthy();
    expect(screen.getByText('Temple 2')).toBeTruthy();
  });
});
```

## Test Categories

### Unit Tests

Test individual functions/components in isolation.

**Backend example:**
```typescript
import { calculatePrice } from '../priceCalculator';

describe('calculatePrice', () => {
  it('should calculate base price', () => {
    const result = calculatePrice({ basePrice: 100, quantity: 2 });
    expect(result).toBe(200);
  });

  it('should apply discount', () => {
    const result = calculatePrice({ 
      basePrice: 100, 
      quantity: 2, 
      discount: 0.1 
    });
    expect(result).toBe(180);
  });
});
```

**Frontend example:**
```typescript
import { formatCurrency } from '../utils';

describe('formatCurrency', () => {
  it('should format INR currency', () => {
    expect(formatCurrency(1000)).toBe('₹1,000');
  });
});
```

### Integration Tests

Test multiple components working together.

**Backend example:**
```typescript
import { handler as createTemple } from '../createTemple';
import { handler as getTemple } from '../getTemple';

describe('Temple Management Integration', () => {
  it('should create and retrieve temple', async () => {
    // Create temple
    const createResult = await createTemple({
      body: JSON.stringify({ name: 'Test Temple' })
    });
    const temple = JSON.parse(createResult.body);

    // Retrieve temple
    const getResult = await getTemple({
      pathParameters: { id: temple.id }
    });
    const retrieved = JSON.parse(getResult.body);

    expect(retrieved.name).toBe('Test Temple');
  });
});
```

**Frontend example:**
```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TempleManagementPage } from '../TempleManagementPage';
import { templeApi } from '../../api';

jest.mock('../../api');

describe('Temple Management Integration', () => {
  it('should create and display temple', async () => {
    (templeApi.createTemple as jest.Mock).mockResolvedValue({
      id: '1',
      name: 'New Temple'
    });

    render(<TempleManagementPage />);
    
    fireEvent.change(screen.getByLabelText('Name'), {
      target: { value: 'New Temple' }
    });
    fireEvent.click(screen.getByText('Create'));

    await waitFor(() => {
      expect(screen.getByText('New Temple')).toBeInTheDocument();
    });
  });
});
```

### End-to-End Tests

Test complete user workflows.

**Example (using Playwright):**
```typescript
import { test, expect } from '@playwright/test';

test('create temple workflow', async ({ page }) => {
  // Login
  await page.goto('http://localhost:5173/login');
  await page.fill('[name="email"]', 'admin@example.com');
  await page.fill('[name="password"]', 'password');
  await page.click('button[type="submit"]');

  // Navigate to temples
  await page.click('text=Temples');
  await expect(page).toHaveURL(/.*temples/);

  // Create temple
  await page.click('text=Create Temple');
  await page.fill('[name="name"]', 'E2E Test Temple');
  await page.fill('[name="state"]', 'Karnataka');
  await page.click('button[type="submit"]');

  // Verify creation
  await expect(page.locator('text=E2E Test Temple')).toBeVisible();
});
```

## Test Configuration

### Backend (Jest)

**package.json:**
```json
{
  "jest": {
    "preset": "ts-jest",
    "testEnvironment": "node",
    "roots": ["<rootDir>/src"],
    "testMatch": ["**/__tests__/**/*.test.ts"],
    "collectCoverageFrom": [
      "src/**/*.ts",
      "!src/**/*.d.ts",
      "!src/**/__tests__/**"
    ]
  }
}
```

### Admin Portal (Jest + React Testing Library)

**package.json:**
```json
{
  "jest": {
    "preset": "ts-jest",
    "testEnvironment": "jsdom",
    "setupFilesAfterEnv": ["<rootDir>/src/setupTests.ts"],
    "moduleNameMapper": {
      "\\.(css|less|scss)$": "identity-obj-proxy"
    }
  }
}
```

**setupTests.ts:**
```typescript
import '@testing-library/jest-dom';

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});
```

### Mobile App (Jest + React Native Testing Library)

**package.json:**
```json
{
  "jest": {
    "preset": "jest-expo",
    "setupFilesAfterEnv": ["<rootDir>/jest-setup.js"],
    "transformIgnorePatterns": [
      "node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)"
    ]
  }
}
```

**jest-setup.js:**
```javascript
import '@testing-library/jest-native/extend-expect';

// Mock Expo modules
jest.mock('expo-font');
jest.mock('expo-asset');
jest.mock('expo-constants', () => ({
  expoConfig: {
    extra: {
      apiBaseUrl: 'http://localhost:4000'
    }
  }
}));
```

## Mocking Strategies

### AWS SDK Mocking

```typescript
import { DynamoDB } from 'aws-sdk';

jest.mock('aws-sdk', () => ({
  DynamoDB: {
    DocumentClient: jest.fn(() => ({
      get: jest.fn().mockReturnValue({
        promise: () => Promise.resolve({ Item: { id: '1' } })
      }),
      put: jest.fn().mockReturnValue({
        promise: () => Promise.resolve({})
      }),
      query: jest.fn().mockReturnValue({
        promise: () => Promise.resolve({ Items: [] })
      })
    }))
  }
}));
```

### API Mocking

```typescript
import { templeApi } from '../api';

jest.mock('../api', () => ({
  templeApi: {
    listTemples: jest.fn(),
    createTemple: jest.fn(),
    updateTemple: jest.fn(),
    deleteTemple: jest.fn()
  }
}));

// In test
(templeApi.listTemples as jest.Mock).mockResolvedValue({
  items: [{ id: '1', name: 'Temple 1' }]
});
```

### React Navigation Mocking

```typescript
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn()
  }),
  useRoute: () => ({
    params: { id: '1' }
  })
}));
```

## Test Data Management

### Test Fixtures

Create reusable test data:

```typescript
// fixtures/temples.ts
export const mockTemple = {
  id: 'temple-1',
  name: 'Test Temple',
  description: 'A test temple',
  location: {
    state: 'Karnataka',
    city: 'Bangalore',
    address: '123 Test St'
  },
  accessMode: 'HYBRID',
  createdAt: '2026-01-01T00:00:00Z'
};

export const mockTemples = [
  mockTemple,
  { ...mockTemple, id: 'temple-2', name: 'Temple 2' },
  { ...mockTemple, id: 'temple-3', name: 'Temple 3' }
];
```

### Factory Functions

```typescript
// factories/temple.ts
export function createMockTemple(overrides = {}) {
  return {
    id: `temple-${Date.now()}`,
    name: 'Test Temple',
    description: 'Test description',
    location: {
      state: 'Karnataka',
      city: 'Bangalore',
      address: '123 Test St'
    },
    accessMode: 'HYBRID',
    createdAt: new Date().toISOString(),
    ...overrides
  };
}
```

## Continuous Integration

### GitHub Actions

**.github/workflows/test.yml:**
```yaml
name: Run Tests

on: [push, pull_request]

jobs:
  test-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm run test:backend -- --coverage
      - uses: codecov/codecov-action@v2
        with:
          files: ./coverage/lcov.info

  test-admin-portal:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: cd admin-portal && npm install
      - run: cd admin-portal && npm test -- --coverage

  test-mobile-app:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: cd mobile-app && npm install
      - run: cd mobile-app && npm test -- --coverage
```

## Test Best Practices

### 1. Test Naming

Use descriptive test names:

```typescript
// ❌ Bad
it('works', () => { ... });

// ✅ Good
it('should create temple with valid data', () => { ... });
it('should return 400 when name is missing', () => { ... });
```

### 2. Arrange-Act-Assert Pattern

```typescript
it('should calculate total price', () => {
  // Arrange
  const items = [
    { price: 100, quantity: 2 },
    { price: 50, quantity: 1 }
  ];

  // Act
  const total = calculateTotal(items);

  // Assert
  expect(total).toBe(250);
});
```

### 3. Test One Thing

```typescript
// ❌ Bad - tests multiple things
it('should handle temple operations', () => {
  const temple = createTemple({ name: 'Test' });
  expect(temple.name).toBe('Test');
  
  updateTemple(temple.id, { name: 'Updated' });
  expect(temple.name).toBe('Updated');
  
  deleteTemple(temple.id);
  expect(getTemple(temple.id)).toBeNull();
});

// ✅ Good - separate tests
it('should create temple', () => { ... });
it('should update temple', () => { ... });
it('should delete temple', () => { ... });
```

### 4. Avoid Test Interdependence

```typescript
// ❌ Bad - tests depend on each other
let templeId;

it('should create temple', () => {
  templeId = createTemple({ name: 'Test' }).id;
});

it('should get temple', () => {
  const temple = getTemple(templeId);
  expect(temple).toBeDefined();
});

// ✅ Good - independent tests
it('should create temple', () => {
  const temple = createTemple({ name: 'Test' });
  expect(temple.id).toBeDefined();
});

it('should get temple', () => {
  const created = createTemple({ name: 'Test' });
  const temple = getTemple(created.id);
  expect(temple).toBeDefined();
});
```

### 5. Clean Up After Tests

```typescript
afterEach(async () => {
  // Clean up database
  await clearDatabase();
  
  // Reset mocks
  jest.clearAllMocks();
});
```

## Troubleshooting

### Tests Hanging

If tests don't complete:

```powershell
# Add timeout and force exit flags
npm test -- --forceExit --detectOpenHandles
```

### Mock Not Working

```typescript
// Ensure mock is before import
jest.mock('../api');
import { templeApi } from '../api';

// Or use jest.doMock for dynamic mocking
jest.doMock('../api', () => ({
  templeApi: { ... }
}));
```

### Coverage Not Accurate

```json
{
  "jest": {
    "collectCoverageFrom": [
      "src/**/*.{ts,tsx}",
      "!src/**/*.d.ts",
      "!src/**/__tests__/**",
      "!src/**/index.ts"
    ]
  }
}
```

## Next Steps

- [Quick Start](../getting-started/quick-start.md) - Set up development environment
- [Local Development](../getting-started/local-development.md) - Development workflow
- [API Reference](../api/backend-api.md) - Backend API documentation
- [Contributing Guide](../../CONTRIBUTING.md) - Contribution guidelines
