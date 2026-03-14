# Contributing to Sanaathana Aalaya Charithra

Thank you for your interest in contributing! This document provides guidelines and instructions for contributing to the project.

## Code of Conduct

- Be respectful and inclusive
- Welcome newcomers and help them get started
- Focus on constructive feedback
- Respect different viewpoints and experiences

## Getting Started

### 1. Fork and Clone

```powershell
# Fork the repository on GitHub, then clone your fork
# Repository URL loaded from global config
git clone https://github.com/avvarimanju/sanaathana-aalaya-charithra.git
cd Sanaathana-Aalaya-Charithra
```

**Note**: The repository URL is configured in `.env.global` and can be accessed via the global configuration system.

### 2. Set Up Development Environment

Follow the [Quick Start Guide](docs/getting-started/quick-start.md) to set up your local environment.

### 3. Create a Branch

```powershell
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix
```

## Development Workflow

### Branch Naming

- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation updates
- `refactor/` - Code refactoring
- `test/` - Test additions or updates

Examples:
- `feature/temple-search`
- `fix/pricing-calculation`
- `docs/api-reference`

### Commit Messages

Follow conventional commits format:

```
type(scope): subject

body (optional)

footer (optional)
```

**Types:**
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation
- `style` - Formatting, missing semicolons, etc.
- `refactor` - Code restructuring
- `test` - Adding tests
- `chore` - Maintenance tasks

**Examples:**
```
feat(temple): add bulk import functionality

fix(pricing): correct discount calculation for group bookings

docs(api): update temple management endpoints

test(calculator): add unit tests for price calculator
```

### Code Style

**TypeScript/JavaScript:**
- Use TypeScript for all new code
- Follow ESLint configuration
- Use 2 spaces for indentation
- Use single quotes for strings
- Add semicolons
- Use meaningful variable names

**React:**
- Use functional components with hooks
- Use TypeScript interfaces for props
- Keep components small and focused
- Extract reusable logic into custom hooks

**Example:**
```typescript
interface TempleCardProps {
  temple: Temple;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function TempleCard({ temple, onEdit, onDelete }: TempleCardProps) {
  const handleEdit = () => {
    onEdit?.(temple.id);
  };

  return (
    <div className="temple-card">
      <h3>{temple.name}</h3>
      <p>{temple.description}</p>
      {onEdit && <button onClick={handleEdit}>Edit</button>}
    </div>
  );
}
```

### Testing

**Write tests for:**
- All new features
- Bug fixes
- Critical business logic
- API endpoints
- Utility functions

**Test structure:**
```typescript
describe('TempleService', () => {
  describe('createTemple', () => {
    it('should create temple with valid data', () => {
      // Arrange
      const data = { name: 'Test Temple', ... };

      // Act
      const result = createTemple(data);

      // Assert
      expect(result.id).toBeDefined();
      expect(result.name).toBe('Test Temple');
    });

    it('should throw error when name is missing', () => {
      // Arrange
      const data = { description: 'Test' };

      // Act & Assert
      expect(() => createTemple(data)).toThrow('Name is required');
    });
  });
});
```

**Run tests before committing:**
```powershell
npm test
```

### Documentation

**Update documentation when:**
- Adding new features
- Changing APIs
- Modifying configuration
- Adding dependencies

**Documentation locations:**
- API changes → `docs/api/`
- Features → `docs/features/`
- Setup changes → `docs/getting-started/`
- Deployment changes → `docs/deployment/`

## Pull Request Process

### 1. Update Your Branch

```powershell
git fetch upstream
git rebase upstream/main
```

### 2. Run Tests and Linting

```powershell
npm test
npm run lint
npm run type-check
```

### 3. Push Your Changes

```powershell
git push origin feature/your-feature-name
```

### 4. Create Pull Request

1. Go to GitHub repository
2. Click "New Pull Request"
3. Select your branch
4. Fill in the PR template:

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] No new warnings generated
- [ ] Tests pass locally
```

### 5. Code Review

- Address reviewer feedback
- Make requested changes
- Push updates to your branch
- Request re-review when ready

### 6. Merge

Once approved, maintainers will merge your PR.

## Project Structure

```
Sanaathana-Aalaya-Charithra/
├── admin-portal/          # Admin web application
├── mobile-app/            # Mobile application
├── src/                   # Backend Lambda functions
│   ├── temple-pricing/    # Temple pricing service
│   ├── state-management/  # State visibility service
│   ├── local-server/      # Local development server
│   └── shared/            # Shared utilities
├── infrastructure/        # AWS CDK infrastructure
├── scripts/               # Utility scripts
├── tests/                 # Test files
├── docs/                  # Documentation
└── config/                # Configuration files
```

## Component Guidelines

### Backend (Lambda Functions)

**File structure:**
```
src/service-name/
├── lambdas/
│   ├── function-name/
│   │   ├── index.ts           # Lambda handler
│   │   ├── handler.ts         # Business logic
│   │   ├── validator.ts       # Input validation
│   │   └── __tests__/
│   │       └── handler.test.ts
│   └── shared/
│       └── utils.ts
└── types/
    └── index.ts
```

**Lambda handler pattern:**
```typescript
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { handleRequest } from './handler';

export async function handler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    const body = JSON.parse(event.body || '{}');
    const result = await handleRequest(body);
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(result)
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: error.statusCode || 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        error: error.message || 'Internal server error'
      })
    };
  }
}
```

### Frontend (React)

**Component structure:**
```
src/components/
├── TempleCard/
│   ├── TempleCard.tsx
│   ├── TempleCard.css
│   ├── TempleCard.test.tsx
│   └── index.ts
```

**Component pattern:**
```typescript
import React from 'react';
import './TempleCard.css';

interface TempleCardProps {
  temple: Temple;
  onEdit?: (id: string) => void;
}

export function TempleCard({ temple, onEdit }: TempleCardProps) {
  return (
    <div className="temple-card">
      <h3>{temple.name}</h3>
      <p>{temple.description}</p>
      {onEdit && (
        <button onClick={() => onEdit(temple.id)}>
          Edit
        </button>
      )}
    </div>
  );
}
```

### API Clients

**Client pattern:**
```typescript
import { apiClient } from './client';

export const templeApi = {
  async listTemples(params?: ListTemplesParams) {
    return apiClient.get<ListTemplesResponse>('/temples', { params });
  },

  async getTemple(id: string) {
    return apiClient.get<Temple>(`/temples/${id}`);
  },

  async createTemple(data: CreateTempleRequest) {
    return apiClient.post<Temple>('/temples', data);
  },

  async updateTemple(id: string, data: UpdateTempleRequest) {
    return apiClient.put<Temple>(`/temples/${id}`, data);
  },

  async deleteTemple(id: string) {
    return apiClient.delete(`/temples/${id}`);
  }
};
```

## Common Tasks

### Adding a New Lambda Function

1. Create function directory:
```powershell
mkdir src/service-name/lambdas/new-function
```

2. Create handler:
```typescript
// src/service-name/lambdas/new-function/index.ts
export async function handler(event) {
  // Implementation
}
```

3. Add tests:
```typescript
// src/service-name/lambdas/new-function/__tests__/index.test.ts
describe('newFunction', () => {
  it('should work', () => {
    // Test implementation
  });
});
```

4. Update infrastructure:
```typescript
// infrastructure/lib/service-stack.ts
new lambda.Function(this, 'NewFunction', {
  runtime: lambda.Runtime.NODEJS_18_X,
  handler: 'index.handler',
  code: lambda.Code.fromAsset('src/service-name/lambdas/new-function')
});
```

### Adding a New API Endpoint

1. Create Lambda function (see above)

2. Add API client method:
```typescript
// admin-portal/src/api/serviceApi.ts
export const serviceApi = {
  async newEndpoint(data: RequestType) {
    return apiClient.post<ResponseType>('/new-endpoint', data);
  }
};
```

3. Update types:
```typescript
// admin-portal/src/types/service.ts
export interface RequestType {
  field: string;
}

export interface ResponseType {
  result: string;
}
```

4. Use in component:
```typescript
import { serviceApi } from '../api';

const result = await serviceApi.newEndpoint({ field: 'value' });
```

### Adding a New Page

1. Create page component:
```typescript
// admin-portal/src/pages/NewPage.tsx
export function NewPage() {
  return <div>New Page</div>;
}
```

2. Add route:
```typescript
// admin-portal/src/App.tsx
import { NewPage } from './pages/NewPage';

<Route path="/new-page" element={<NewPage />} />
```

3. Add navigation:
```typescript
// admin-portal/src/components/Navigation.tsx
<Link to="/new-page">New Page</Link>
```

## Debugging

### Backend

```typescript
// Add console.log for debugging
console.log('Debug info:', { variable });

// Use debugger in VS Code
// Set breakpoint and press F5
```

### Frontend

```typescript
// Use React DevTools
// Add console.log
console.log('Component state:', state);

// Use debugger statement
debugger;
```

## Getting Help

- **Documentation:** Check `docs/` directory
- **Issues:** Search existing issues on GitHub
- **Discussions:** Use GitHub Discussions for questions
- **Email:** Contact maintainers (if provided)

## Recognition

Contributors will be recognized in:
- README.md contributors section
- Release notes
- Project documentation

Thank you for contributing to Sanaathana Aalaya Charithra!
