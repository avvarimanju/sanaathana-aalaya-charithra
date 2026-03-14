# Project Structure

## Monorepo Organization
The project follows a **monorepo pattern** with npm workspaces for code sharing and unified dependency management.

## Root Level Structure
```
Sanaathana-Aalaya-Charithra/
├── .github/                   # CI/CD workflows and templates
├── .kiro/                     # Kiro configuration and specs
│   ├── hooks/                 # Agent hooks
│   ├── specs/                 # Feature specifications
│   └── steering/              # Project guidance documents
├── .pre-generation/           # Content generation progress files
├── admin-portal/              # React admin web application
├── mobile-app/                # React Native mobile application  
├── backend/                   # AWS Lambda serverless backend
├── scripts/                   # Build, deployment, and utility scripts
├── docs/                      # Project documentation
├── package.json               # Root workspace configuration
└── README.md                  # Project overview
```

## Application Structure

### Admin Portal (`admin-portal/`)
```
admin-portal/
├── src/
│   ├── api/                   # API client layer and service calls
│   ├── auth/                  # Authentication context and hooks
│   ├── components/            # Reusable React components
│   ├── pages/                 # Page-level components
│   └── types/                 # TypeScript type definitions
├── package.json
└── README.md
```

### Mobile App (`mobile-app/`)
```
mobile-app/
├── src/
│   ├── components/            # React Native components
│   ├── screens/               # Screen components
│   ├── navigation/            # Navigation configuration
│   ├── api/                   # API client
│   └── types/                 # TypeScript types
├── package.json
└── README.md
```

### Backend (`backend/`)
```
backend/
├── src/                       # Source code
├── lambdas/                   # Lambda function handlers
├── infrastructure/            # AWS CDK infrastructure code
├── models/                    # Data models and schemas
├── repositories/              # Data access layer
├── services/                  # Business logic services
├── utils/                     # Utility functions
├── tests/                     # Test files
├── template.yaml              # SAM template
├── cdk.json                   # CDK configuration
└── package.json
```

## Key Conventions

### File Naming
- **Components**: PascalCase (e.g., `TempleListPage.tsx`)
- **Utilities**: camelCase (e.g., `apiClient.ts`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `API_ENDPOINTS.ts`)
- **Types**: PascalCase with `.types.ts` suffix

### Directory Organization
- **Feature-based**: Group related files by feature/domain
- **Layer separation**: API, components, pages, services in separate directories
- **Test co-location**: `__tests__` directories alongside source code

### Import Patterns
- **Absolute imports**: Use `@/` alias for src directory (admin portal)
- **Barrel exports**: Use `index.ts` files for clean imports
- **Type imports**: Use `import type` for TypeScript types

### Testing Structure
- **Unit tests**: Co-located with source files in `__tests__/` directories
- **Integration tests**: In dedicated `tests/` directory at workspace root
- **Test naming**: `*.test.ts` or `*.spec.ts`

## Configuration Files

### Root Level
- `package.json`: Workspace configuration and scripts
- `tsconfig.json`: Root TypeScript configuration
- `docker-compose.yml`: LocalStack development environment

### Workspace Level
- Each workspace has its own `package.json`, `tsconfig.json`
- Workspace-specific configuration (Jest, ESLint, Vite)

## Scripts Organization
The `scripts/` directory contains PowerShell and Bash scripts organized by purpose:
- **Development**: `start-dev-environment.ps1`, `init-local-db.ps1`
- **Testing**: `test-*.ps1`, `run-all-tests.ps1`
- **Deployment**: `deploy-*.ps1`, `deploy-*.sh`
- **Utilities**: Data seeding, content generation, troubleshooting

## Documentation Structure
- **Getting Started**: Setup and quick start guides
- **Architecture**: System design and infrastructure
- **API**: Endpoint documentation
- **Features**: Feature-specific documentation
- **Deployment**: Environment-specific deployment guides

## Environment Files
- `.env.development`: Local development configuration
- `.env.production.example`: Production configuration template
- Workspace-specific `.env` files for service-specific settings