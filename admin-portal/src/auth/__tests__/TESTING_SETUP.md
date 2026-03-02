# Testing Setup Guide

The authentication module includes unit tests, but the Admin Portal project needs testing dependencies to run them.

## Required Dependencies

Add the following dependencies to `package.json`:

```json
{
  "devDependencies": {
    "@testing-library/react": "^14.1.2",
    "@testing-library/react-hooks": "^8.0.1",
    "@testing-library/jest-dom": "^6.1.5",
    "@testing-library/user-event": "^14.5.1",
    "jest": "^29.7.0",
    "jest-environment-jsdom": "^29.7.0",
    "@types/jest": "^29.5.11",
    "ts-jest": "^29.1.1"
  }
}
```

## Installation

```bash
npm install --save-dev @testing-library/react @testing-library/react-hooks @testing-library/jest-dom @testing-library/user-event jest jest-environment-jsdom @types/jest ts-jest
```

## Jest Configuration

Create `jest.config.js` in the admin-portal root:

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts?(x)'],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.example.tsx',
    '!src/**/__tests__/**',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
};
```

## Setup File

Create `src/setupTests.ts`:

```typescript
import '@testing-library/jest-dom';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock as any;

// Mock fetch
global.fetch = jest.fn();
```

## Update package.json Scripts

Add test scripts to `package.json`:

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}
```

## Running Tests

After setup, run tests with:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Test Files

The following test files are included:

1. **useAdminAuth.test.tsx**: Tests for the useAdminAuth hook
   - Tests hook behavior outside provider
   - Tests authentication state management
   - Tests login/logout functionality
   - Tests localStorage integration

2. **ProtectedRoute.test.tsx**: Tests for the ProtectedRoute component
   - Tests loading state
   - Tests error state
   - Tests redirect behavior
   - Tests custom fallback
   - Tests authenticated rendering

## Manual Testing (Without Jest)

If you prefer to test manually without setting up Jest:

1. **Test Authentication Flow**:
   - Wrap your app with `<AdminAuthProvider>`
   - Navigate to a protected route
   - Verify redirect to login
   - Login with credentials
   - Verify access to protected content

2. **Test Token Persistence**:
   - Login successfully
   - Refresh the page
   - Verify you remain logged in
   - Check localStorage for token

3. **Test Logout**:
   - While logged in, click logout
   - Verify redirect to login
   - Verify localStorage is cleared
   - Verify cannot access protected routes

4. **Test Error Handling**:
   - Try to login with invalid credentials
   - Verify error message is displayed
   - Verify authentication state remains false

## Integration with Existing Tests

If the Admin Portal already has a testing setup, integrate these tests by:

1. Ensuring the test configuration supports TypeScript and JSX
2. Adding the authentication test files to the test suite
3. Running tests as part of CI/CD pipeline

## Coverage Goals

Aim for the following coverage:

- **Statements**: 80%+
- **Branches**: 75%+
- **Functions**: 80%+
- **Lines**: 80%+

The authentication module is critical for security, so high test coverage is important.
