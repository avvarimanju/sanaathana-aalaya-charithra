# Sanaathana Aalaya Charithra - Admin Portal

Admin Portal for managing defect reports in the Sanaathana Aalaya Charithra temple history application.

## Overview

This Admin Portal provides a web interface for administrators to:
- View all defect reports submitted by users
- Filter and search defects by status, ID, or title
- Update defect status through a validated workflow
- Add status updates and comments to defects
- Track defect resolution progress

## Features

### Defect Management
- **View All Defects**: Paginated list of all defect reports
- **Filter by Status**: Filter defects by their current status (New, Acknowledged, In Progress, Resolved, Closed)
- **Search**: Search defects by ID or title
- **Defect Details**: View complete defect information including status history

### Status Management
- **Update Status**: Change defect status with workflow validation
- **Add Comments**: Add status updates and comments to defects
- **Status Workflow**: Enforced status transitions to maintain consistency

### Admin Features
- **Authentication**: Secure admin authentication with JWT tokens
- **Authorization**: Admin-only access to management functions
- **Audit Trail**: All status changes and updates are logged with admin information

## Project Structure

```
admin-portal/
├── src/
│   ├── api/
│   │   ├── adminDefectApi.ts          # Admin API client
│   │   ├── adminDefectApi.example.ts  # Usage examples
│   │   ├── __tests__/
│   │   │   └── adminDefectApi.test.ts # Unit tests
│   │   └── README.md                  # API documentation
│   ├── components/                     # React components (to be implemented)
│   ├── pages/                          # Page components (to be implemented)
│   └── utils/                          # Utility functions (to be implemented)
├── .env.example                        # Environment variables template
├── package.json                        # Dependencies and scripts
├── tsconfig.json                       # TypeScript configuration
└── README.md                           # This file
```

## Getting Started

### Prerequisites

- Node.js 18.x or higher
- npm or yarn package manager
- Admin authentication credentials

### Important: Workspace Architecture

This project uses **npm workspaces** as part of a monorepo structure. All dependencies for admin-portal, mobile-app, and backend are managed from the root directory.

**Do NOT run `npm install` in this directory.** Instead, install from the project root.

### Installation

1. Navigate to the project root:
```bash
cd Sanaathana-Aalaya-Charithra
```

2. Install all workspace dependencies:
```bash
npm install --legacy-peer-deps
```

Or use the automated deployment script (recommended):
```bash
.\scripts\start-dev-environment.ps1
```

3. Create environment configuration:
```bash
cd admin-portal
cp .env.example .env
```

4. Update `.env` with your API configuration:
```env
REACT_APP_API_BASE_URL=https://your-api-url.com
```

### TypeScript Configuration

The project uses TypeScript with automatic type discovery. The `tsconfig.json` is configured to:
- Auto-discover type definitions from `node_modules/@types`
- Support path aliases (`@/*` maps to `src/*`)
- Enable strict type checking
- Generate source maps and declaration files

After running `npm install`, TypeScript will automatically find all type definitions including testing libraries.

### Development

**Important:** All npm scripts should be run from the project root using workspace commands.

Start the admin portal development server:
```bash
# From project root
cd Sanaathana-Aalaya-Charithra
npm run dev:admin
```

Or start all services:
```bash
npm run dev:backend   # Start backend API
npm run dev:admin     # Start admin portal
npm run dev:mobile    # Start mobile app
```

The dashboard will be available at `http://localhost:5173` (default Vite port).

### Building for Production

Build the production bundle (from project root):
```bash
cd Sanaathana-Aalaya-Charithra
npm run build --workspace=admin-portal
```

Or build all workspaces:
```bash
npm run build:all
```

Preview the production build:
```bash
npm run preview --workspace=admin-portal
```

### Type Checking

Run TypeScript type checking (from project root):
```bash
cd Sanaathana-Aalaya-Charithra
npm run type-check --workspace=admin-portal
```

### Linting

Run ESLint (from project root):
```bash
npm run lint --workspace=admin-portal
```

Or lint all workspaces:
```bash
npm run lint:all
```

## API Client Usage

The Admin Portal includes a fully-typed API client for interacting with the defect tracking backend.

### Basic Setup

```typescript
import { adminDefectApi } from './api/adminDefectApi';

// Set admin authentication token
adminDefectApi.setAdminToken('your-admin-jwt-token');
```

### Fetch All Defects

```typescript
const response = await adminDefectApi.getAllDefects({
  status: 'New',
  limit: 20,
});

if (response.success) {
  console.log('Defects:', response.data.defects);
}
```

### Update Defect Status

```typescript
const response = await adminDefectApi.updateDefectStatus('defect-id', {
  newStatus: 'Acknowledged',
  comment: 'We are investigating this issue',
});

if (response.success) {
  console.log('Status updated:', response.data.newStatus);
}
```

### Add Status Update

```typescript
const response = await adminDefectApi.addStatusUpdate('defect-id', {
  message: 'We have identified the root cause and are working on a fix',
});

if (response.success) {
  console.log('Update added:', response.data.updateId);
}
```

For more examples, see `src/api/adminDefectApi.example.ts` and `src/api/README.md`.

## Status Workflow

The defect tracking system enforces a strict status workflow:

```
New → Acknowledged → In Progress → Resolved → Closed
                                      ↓
                                  In Progress (reopen)
```

### Valid Transitions

- **New** → Acknowledged
- **Acknowledged** → In Progress
- **In Progress** → Resolved
- **Resolved** → Closed or In Progress (reopen)
- **Closed** → (terminal state, no transitions)

The API client includes client-side validation to check transitions before making API calls:

```typescript
const isValid = adminDefectApi.isValidStatusTransition('New', 'Acknowledged');
const allowedTransitions = adminDefectApi.getAllowedTransitions('New');
```

## Authentication

The Admin Portal requires admin authentication. The API client expects a JWT token to be set:

```typescript
// After successful admin login
adminDefectApi.setAdminToken(jwtToken);

// On logout
adminDefectApi.clearAdminToken();
```

All API requests include the `Authorization: Bearer <token>` header.

## Error Handling

The API client provides comprehensive error handling:

```typescript
const response = await adminDefectApi.getAllDefects();

if (response.success) {
  // Handle success
  const defects = response.data.defects;
} else {
  // Handle error
  switch (response.error?.error) {
    case 'UNAUTHORIZED':
      // Redirect to login
      break;
    case 'FORBIDDEN':
      // Show permission denied
      break;
    case 'INVALID_STATUS_TRANSITION':
      // Show allowed transitions
      console.log('Allowed:', response.error.allowedTransitions);
      break;
    case 'NETWORK_ERROR':
      // Show network error
      break;
  }
}
```

## Testing

Run unit tests:
```bash
npm test
```

Run tests with coverage:
```bash
npm test -- --coverage
```

The API client includes comprehensive unit tests in `src/api/__tests__/adminDefectApi.test.ts`.

## Requirements Validation

This Admin Portal implements the following requirements from the defect tracking specification:

- **Requirement 3.1**: Admin interface to view all defects
- **Requirement 3.2**: Filter defects by status
- **Requirement 3.3**: Search defects by ID
- **Requirement 3.4**: View complete defect details
- **Requirement 3.5**: View status update history
- **Requirement 4.1**: Update defect status
- **Requirement 5.1**: Add status updates
- **Requirement 6.6**: Enforce valid status transitions
- **Requirement 10.1**: Admin authentication for status changes
- **Requirement 10.2**: Admin authentication for status updates
- **Requirement 10.6**: Admin access to all defects

## Technology Stack

- **React 18**: UI framework
- **TypeScript**: Type-safe development
- **Vite**: Build tool and dev server
- **React Router**: Client-side routing (to be integrated)
- **Fetch API**: HTTP client

**Note:** This is a web application using Vite + React. It does not use Expo or React Native, which are for mobile apps.

## Future Enhancements

- [ ] Implement React components for UI
- [ ] Add real-time updates with WebSocket
- [ ] Implement defect analytics dashboard
- [ ] Add bulk operations for multiple defects
- [ ] Implement defect assignment to developers
- [ ] Add export functionality (CSV/PDF)
- [ ] Implement advanced search with filters
- [ ] Add defect priority management

## Related Documentation

- [API Client Documentation](src/api/README.md)
- [API Client Examples](src/api/adminDefectApi.example.ts)
- [Defect Tracking Specification](../.kiro/specs/defect-tracking/)
- [Mobile App Integration](../mobile-app/src/services/defect-api.service.ts)

## Support

For issues or questions, please refer to the main project documentation or contact the development team.

## License

This project is part of the Sanaathana Aalaya Charithra application.
