# Shared Code

This directory contains code shared across multiple applications (backend, admin-portal, mobile-app).

## Structure

```
shared/
├── types/         # TypeScript type definitions
├── utils/         # Utility functions
└── constants/     # Shared constants
```

## Usage

### In Backend
```typescript
import { TempleType } from '../shared/types';
import { formatDate } from '../shared/utils';
```

### In Admin Portal
```typescript
import { TempleType } from '../shared/types';
import { API_ENDPOINTS } from '../shared/constants';
```

### In Mobile App
```typescript
import { TempleType } from '../shared/types';
import { formatTempleData } from '../shared/utils';
```

## Guidelines

- Keep shared code minimal and well-documented
- Only add code that is truly shared across 2+ applications
- Avoid application-specific logic
- Use clear, descriptive names
- Add tests for shared utilities
