# Local Development Guide

Complete guide for developing Sanaathana Aalaya Charithra locally.

## Development Environment

### Required Tools

- **Docker Desktop** - For LocalStack (AWS services)
- **Node.js 18+** - For backend and frontend
- **AWS CLI** - For LocalStack interaction
- **Git** - Version control
- **PowerShell** or **Git Bash** - Command line

### Optional Tools

- **Postman** or **Insomnia** - API testing
- **DynamoDB Admin** - Database GUI
- **VS Code** - Recommended IDE

## Project Structure

```
Sanaathana-Aalaya-Charithra/
├── admin-portal/          # Admin web application (React + Vite)
├── mobile-app/            # Mobile application (React Native + Expo)
├── src/                   # Backend Lambda functions
│   ├── temple-pricing/    # Temple pricing service
│   ├── state-management/  # State visibility service
│   ├── local-server/      # Local development server
│   └── shared/            # Shared utilities
├── infrastructure/        # AWS CDK infrastructure code
├── scripts/               # Utility scripts
├── tests/                 # Test files
├── config/                # Configuration files
└── docs/                  # Documentation
```

## Local Backend Setup

### 1. LocalStack Configuration

LocalStack provides local AWS services. Configuration in `docker-compose.yml`:

```yaml
services:
  localstack:
    image: localstack/localstack:latest
    ports:
      - "4566:4566"  # LocalStack gateway
    environment:
      - SERVICES=dynamodb,s3,apigateway
      - DEBUG=1
```

### 2. Database Tables

Initialize DynamoDB tables:

```powershell
.\scripts\init-local-db.ps1
```

Tables created:
- **Temples** - Temple information
- **TempleGroups** - Temple groupings
- **Artifacts** - Temple artifacts
- **PriceConfigurations** - Pricing rules
- **PriceHistory** - Price change history
- **PricingFormulas** - Dynamic pricing formulas
- **FormulaHistory** - Formula change history
- **AccessGrants** - Access control
- **PriceOverrides** - Manual price overrides
- **AuditLog** - Audit trail

### 3. Backend Server

The local server (`src/local-server/server.ts`) wraps Lambda functions as Express.js endpoints:

```typescript
// Lambda function as module
import { handler as createTemple } from '../temple-pricing/lambdas/temple-management/createTemple';

// Express endpoint
app.post('/api/temples', async (req, res) => {
  const event = { body: JSON.stringify(req.body) };
  const result = await createTemple(event);
  res.status(result.statusCode).json(JSON.parse(result.body));
});
```

Start the server:

```powershell
.\scripts\start-local-backend.ps1
```

Server runs on: http://localhost:4000

## Admin Portal Development

### Setup

```powershell
cd admin-portal
npm install
npm run dev
```

Runs on: http://localhost:5173

### Environment Configuration

Create `.env.development`:

```env
VITE_API_BASE_URL=http://localhost:4000
# AWS region loaded from global config (.env.global)
VITE_AWS_REGION=${AWS_REGION}
VITE_ENVIRONMENT=development
```

### API Integration

API clients are in `admin-portal/src/api/`:

```typescript
import { templeApi } from '../api';

// List temples
const temples = await templeApi.listTemples({ limit: 50 });

// Create temple
const temple = await templeApi.createTemple({
  name: 'Golden Temple',
  description: 'Historic temple',
  location: { state: 'Punjab', city: 'Amritsar', address: '123 Main St' },
  accessMode: 'FREE'
});

// Update temple
await templeApi.updateTemple('temple-id', { description: 'Updated' });

// Delete temple
await templeApi.deleteTemple('temple-id');
```

### Hot Reload

Vite provides instant hot module replacement (HMR). Changes to React components update immediately without full page reload.

## Mobile App Development

### Setup

```powershell
cd mobile-app
npm install
npx expo start
```

### Testing Options

1. **Expo Go App** (Easiest)
   - Install Expo Go on your phone
   - Scan QR code from terminal
   - Instant updates over WiFi

2. **Android Emulator**
   - Install Android Studio
   - Create virtual device
   - Press 'a' in Expo terminal

3. **iOS Simulator** (Mac only)
   - Install Xcode
   - Press 'i' in Expo terminal

4. **Web Browser**
   - Press 'w' in Expo terminal
   - Opens in browser at http://localhost:8081

### Environment Configuration

Create `.env.development`:

```env
EXPO_PUBLIC_API_BASE_URL=http://localhost:4000
# AWS region loaded from global config (.env.global)
EXPO_PUBLIC_AWS_REGION=${AWS_REGION}
EXPO_PUBLIC_ENVIRONMENT=development
```

## Development Workflow

### Typical Development Session

```powershell
# Terminal 1: Start LocalStack
docker-compose up -d

# Terminal 2: Start backend
.\scripts\start-local-backend.ps1

# Terminal 3: Start admin portal
cd admin-portal
npm run dev

# Terminal 4: Start mobile app (optional)
cd mobile-app
npx expo start
```

### Making Changes

1. **Backend Changes**
   - Edit Lambda function in `src/`
   - Restart backend server (Ctrl+C, then restart)
   - Changes take effect immediately

2. **Admin Portal Changes**
   - Edit React components in `admin-portal/src/`
   - Changes hot-reload automatically
   - No restart needed

3. **Mobile App Changes**
   - Edit React Native components in `mobile-app/src/`
   - Changes hot-reload automatically
   - Shake device to open dev menu

### Database Management

**View tables:**
```powershell
aws dynamodb list-tables --endpoint-url http://localhost:4566
```

**Scan table:**
```powershell
aws dynamodb scan --table-name Temples --endpoint-url http://localhost:4566
```

**Delete all data:**
```powershell
docker-compose down -v
docker-compose up -d
.\scripts\init-local-db.ps1
```

## Testing

### Run All Tests

```powershell
npm test
```

### Run Specific Test Suite

```powershell
# Backend tests
npm run test:backend

# Admin portal tests
cd admin-portal
npm test

# Mobile app tests
cd mobile-app
npm test
```

### Watch Mode

```powershell
npm run test:watch
```

See [Testing Guide](../testing/test-guide.md) for details.

## Debugging

### Backend Debugging

Add breakpoints in VS Code:

1. Open `src/local-server/server.ts`
2. Set breakpoints
3. Press F5 to start debugging
4. Make API request
5. Debugger pauses at breakpoint

### Frontend Debugging

**Admin Portal:**
- Open DevTools (F12)
- Use React DevTools extension
- Check Console for errors
- Use Network tab for API calls

**Mobile App:**
- Shake device to open dev menu
- Enable Remote JS Debugging
- Open Chrome DevTools
- Use React Native Debugger

### Common Issues

**Port already in use:**
```powershell
netstat -ano | findstr "4000"
taskkill /PID <PID> /F
```

**LocalStack not responding:**
```powershell
docker-compose restart
```

**Database not initialized:**
```powershell
.\scripts\init-local-db.ps1
```

**CORS errors:**
- Check backend server is running
- Verify API_BASE_URL in .env
- Check browser console for details

## Performance Tips

### Backend

- Use Redis caching (optional, see [Environment Setup](./environment-setup.md))
- Enable CloudWatch logging for debugging
- Use DynamoDB batch operations for bulk updates

### Frontend

- Use React.memo() for expensive components
- Implement virtual scrolling for long lists
- Lazy load routes with React.lazy()
- Optimize images (WebP format, proper sizing)

### Mobile App

- Use FlatList instead of ScrollView for long lists
- Implement pagination for API calls
- Cache images with expo-image
- Minimize re-renders with useMemo/useCallback

## Code Quality

### Linting

```powershell
npm run lint
```

### Formatting

```powershell
npm run format
```

### Type Checking

```powershell
npm run type-check
```

## Environment Variables

### Backend (.env)

```env
# AWS region loaded from global config (.env.global)
AWS_REGION=${AWS_REGION}
DYNAMODB_ENDPOINT=http://localhost:4566
LOG_LEVEL=debug
```

### Admin Portal (.env.development)

```env
VITE_API_BASE_URL=http://localhost:4000
# AWS region loaded from global config (.env.global)
VITE_AWS_REGION=${AWS_REGION}
VITE_ENVIRONMENT=development
```

### Mobile App (.env.development)

```env
EXPO_PUBLIC_API_BASE_URL=http://localhost:4000
# AWS region loaded from global config (.env.global)
EXPO_PUBLIC_AWS_REGION=${AWS_REGION}
EXPO_PUBLIC_ENVIRONMENT=development
```

## Next Steps

- [Environment Setup](./environment-setup.md) - Configure staging/production
- [API Reference](../api/backend-api.md) - Backend API documentation
- [Testing Guide](../testing/test-guide.md) - Testing strategies
- [Deployment Guide](../deployment/aws-deployment.md) - Deploy to AWS
