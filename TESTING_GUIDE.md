# Testing Guide

Complete guide for running unit tests, integration tests, and end-to-end tests for the Sanaathana Aalaya Charithra project.

## Test Structure

```
tests/
├── integration/          # API integration tests
│   └── api.integration.test.ts
├── e2e/                 # End-to-end functional tests
│   └── admin-portal.e2e.test.ts
├── jest.config.js       # Jest configuration
├── playwright.config.ts # Playwright configuration
└── setup.ts            # Test setup file

admin-portal/src/
└── pages/__tests__/     # Component unit tests
    ├── DashboardPage.test.tsx
    └── TempleListPage.test.tsx
```

## Prerequisites

### For All Tests
```powershell
# Install dependencies
npm install

# Install test dependencies
npm install --save-dev @testing-library/react @testing-library/jest-dom @testing-library/user-event
npm install --save-dev @playwright/test
npm install --save-dev ts-jest @types/jest
npm install --save-dev axios
```

### For E2E Tests
```powershell
# Install Playwright browsers
npx playwright install
```

### For Integration Tests
```powershell
# Start backend server
npx tsx src/local-server/server.ts

# Or use the script
.\scripts\start-local-backend-simple.ps1
```

## Running Tests

### 1. Unit Tests (Admin Portal Components)

Unit tests verify individual components work correctly in isolation.

```powershell
# Run all unit tests
cd admin-portal
npm test

# Run specific test file
npm test DashboardPage.test.tsx

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage
```

**What's Tested:**
- Component rendering
- User interactions (button clicks, form inputs)
- Navigation between pages
- State management
- Props handling
- Error boundaries

**Example Test:**
```typescript
it('should navigate to temple form when Add Temple is clicked', () => {
  renderDashboard();
  const addTempleButton = screen.getByText('➕ Add Temple');
  fireEvent.click(addTempleButton);
  expect(mockNavigate).toHaveBeenCalledWith('/temples/new');
});
```

### 2. Integration Tests (Backend API)

Integration tests verify the backend API endpoints work correctly with the database.

```powershell
# Start backend server first
cd Sanaathana-Aalaya-Charithra
npx tsx src/local-server/server.ts

# In another terminal, run integration tests
cd tests
npm test -- --config jest.config.js

# Run specific integration test
npm test api.integration.test.ts

# Run with verbose output
npm test -- --verbose
```

**What's Tested:**
- API endpoint responses
- Data structure validation
- CRUD operations (Create, Read, Update, Delete)
- Error handling
- Query parameters and filtering
- Response status codes
- CORS headers

**Example Test:**
```typescript
it('should return list of temples', async () => {
  const response = await axios.get(`${API_BASE_URL}/api/temples`);
  expect(response.status).toBe(200);
  expect(response.data).toHaveProperty('items');
  expect(Array.isArray(response.data.items)).toBe(true);
});
```

### 3. End-to-End Tests (Full User Workflows)

E2E tests verify complete user workflows from UI to backend.

```powershell
# Start all services first
# Terminal 1: Backend
npx tsx src/local-server/server.ts

# Terminal 2: Admin Portal
cd admin-portal
npm run dev

# Terminal 3: Run E2E tests
cd tests
npx playwright test

# Run specific test file
npx playwright test admin-portal.e2e.test.ts

# Run in headed mode (see browser)
npx playwright test --headed

# Run in debug mode
npx playwright test --debug

# Run specific browser
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit

# Run on mobile
npx playwright test --project="Mobile Chrome"
```

**What's Tested:**
- Complete user workflows
- Navigation between pages
- Form submissions
- Data persistence
- UI interactions
- Error handling
- Responsive design
- Cross-browser compatibility

**Example Test:**
```typescript
test('should navigate via Quick Actions - Add Temple', async ({ page }) => {
  await page.goto(`${ADMIN_PORTAL_URL}/dashboard`);
  await page.getByText('➕ Add Temple').click();
  await expect(page).toHaveURL(/\/temples\/new/);
});
```

## Test Scenarios Covered

### Dashboard Tests
- ✅ Display stats cards (temples, artifacts, scans, users)
- ✅ Display recent activity
- ✅ Display top artifacts
- ✅ Quick Actions navigation (Add Temple, Add Artifact, Generate Content, View Analytics)
- ✅ Responsive layout

### Temple Management Tests
- ✅ List all temples
- ✅ Search temples by name/location
- ✅ Filter temples by state/status
- ✅ View temple details
- ✅ Navigate to add temple form
- ✅ Navigate to edit temple
- ✅ Navigate to temple artifacts
- ✅ Display temple statistics
- ✅ Handle API errors

### Artifact Management Tests
- ✅ List all artifacts
- ✅ Filter artifacts by temple
- ✅ Search artifacts by name
- ✅ Display artifact details
- ✅ QR code display
- ✅ Content indicators (audio, video, languages)

### Pricing Management Tests
- ✅ Display pricing suggestions
- ✅ Filter by entity type (temple/group)
- ✅ Search pricing entities
- ✅ Open custom price modal
- ✅ Display current vs suggested prices
- ✅ Show price differences

### Content Generation Tests
- ✅ Display artifact selection
- ✅ Display content type options
- ✅ Display trusted sources
- ✅ Switch between tabs (Generate/Jobs)
- ✅ Display generation jobs
- ✅ Create content generation job

### Defect Tracking Tests
- ✅ Display defects list
- ✅ Filter by status/priority/type
- ✅ Open create defect modal
- ✅ Create new defect
- ✅ Add comments to defects
- ✅ Update defect status

### State Management Tests
- ✅ Display states list
- ✅ Search states
- ✅ Toggle state visibility
- ✅ Filter by visibility
- ✅ Save changes
- ✅ Display temple counts

### Backend API Tests
- ✅ GET /api/temples - List temples
- ✅ GET /api/temples/:id - Get temple by ID
- ✅ POST /api/temples - Create temple
- ✅ PUT /api/temples/:id - Update temple
- ✅ DELETE /api/temples/:id - Delete temple
- ✅ GET /api/artifacts - List artifacts
- ✅ POST /api/artifacts - Create artifact
- ✅ GET /api/pricing/suggestions - Get pricing suggestions
- ✅ GET /api/pricing/formula - Get pricing formula
- ✅ GET /api/content/jobs - List content jobs
- ✅ POST /api/content/generate - Create content job
- ✅ GET /api/defects - List defects
- ✅ POST /api/defects - Create defect
- ✅ POST /api/defects/:id/comments - Add comment
- ✅ GET /api/states - List states

## Test Reports

### Unit Test Coverage Report
```powershell
cd admin-portal
npm test -- --coverage

# View HTML report
start coverage/lcov-report/index.html
```

### Integration Test Results
```powershell
cd tests
npm test -- --config jest.config.js

# Results are displayed in terminal
```

### E2E Test Report
```powershell
cd tests
npx playwright test

# View HTML report
npx playwright show-report ../test-results/e2e-report
```

## Continuous Integration

### GitHub Actions Workflow

Create `.github/workflows/test.yml`:

```yaml
name: Tests

on: [push, pull_request]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm test -- --coverage
      - uses: codecov/codecov-action@v3

  integration-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run start:backend &
      - run: sleep 10
      - run: npm run test:integration

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run start:backend &
      - run: npm run start:admin &
      - run: sleep 20
      - run: npx playwright test
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: test-results/
```

## Debugging Tests

### Debug Unit Tests
```powershell
# Run in debug mode
node --inspect-brk node_modules/.bin/jest --runInBand

# Use VS Code debugger
# Add breakpoint in test file
# Press F5 to start debugging
```

### Debug Integration Tests
```powershell
# Add console.log statements
console.log('Response:', response.data);

# Use --verbose flag
npm test -- --verbose
```

### Debug E2E Tests
```powershell
# Run in headed mode
npx playwright test --headed

# Run in debug mode (step through)
npx playwright test --debug

# Pause on failure
npx playwright test --pause-on-failure

# Generate trace
npx playwright test --trace on
npx playwright show-trace trace.zip
```

## Best Practices

### Writing Tests
1. **Arrange-Act-Assert Pattern**
   ```typescript
   // Arrange: Set up test data
   const mockData = { ... };
   
   // Act: Perform action
   const result = await someFunction(mockData);
   
   // Assert: Verify result
   expect(result).toBe(expected);
   ```

2. **Use Descriptive Test Names**
   ```typescript
   // Good
   it('should navigate to temple form when Add Temple is clicked', ...)
   
   // Bad
   it('test 1', ...)
   ```

3. **Test One Thing at a Time**
   ```typescript
   // Good - tests one behavior
   it('should display error message on API failure', ...)
   
   // Bad - tests multiple behaviors
   it('should display error and allow retry and show success', ...)
   ```

4. **Clean Up After Tests**
   ```typescript
   afterEach(() => {
     jest.clearAllMocks();
     cleanup();
   });
   ```

5. **Use Test Data Builders**
   ```typescript
   const createMockTemple = (overrides = {}) => ({
     templeId: 'test-1',
     name: 'Test Temple',
     ...overrides
   });
   ```

### Running Tests Efficiently
1. Run only changed tests during development
2. Use watch mode for rapid feedback
3. Run full suite before committing
4. Use parallel execution for faster runs
5. Skip slow tests during development

### Test Coverage Goals
- **Unit Tests**: 80%+ coverage
- **Integration Tests**: All API endpoints
- **E2E Tests**: Critical user workflows

## Troubleshooting

### Common Issues

**Issue: Tests timeout**
```powershell
# Increase timeout
jest.setTimeout(30000);

# Or in test
it('test', async () => { ... }, 30000);
```

**Issue: Port already in use**
```powershell
# Kill process on port 4000
netstat -ano | findstr :4000
taskkill /PID <PID> /F
```

**Issue: Module not found**
```powershell
# Clear cache
npm cache clean --force
rm -rf node_modules
npm install
```

**Issue: Playwright browser not found**
```powershell
# Reinstall browsers
npx playwright install --force
```

## Quick Reference

### Run All Tests
```powershell
# Unit tests
cd admin-portal && npm test

# Integration tests
cd tests && npm test -- --config jest.config.js

# E2E tests
cd tests && npx playwright test
```

### Run Specific Test
```powershell
# Unit test
npm test DashboardPage.test.tsx

# Integration test
npm test api.integration.test.ts

# E2E test
npx playwright test admin-portal.e2e.test.ts
```

### View Reports
```powershell
# Unit test coverage
start admin-portal/coverage/lcov-report/index.html

# E2E test report
npx playwright show-report test-results/e2e-report
```

## Next Steps

1. Run unit tests to verify component functionality
2. Run integration tests to verify API endpoints
3. Run E2E tests to verify complete workflows
4. Review test coverage reports
5. Add more tests for edge cases
6. Set up CI/CD pipeline
7. Monitor test results in production

## Support

For issues or questions:
- Check test logs for error messages
- Review test documentation
- Check GitHub Issues
- Contact development team
