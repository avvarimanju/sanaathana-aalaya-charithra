# Admin Authentication Module

This module provides authentication functionality for the Admin Portal, including context management, protected routes, and token handling.

## Components

### AdminAuthProvider

React Context Provider that manages authentication state throughout the application.

**Features:**
- Stores JWT token in localStorage
- Automatically sets token in adminDefectApi on mount and login
- Provides authentication state and methods to child components
- Handles token persistence across page refreshes

**Usage:**
```tsx
import { AdminAuthProvider } from './auth';

function App() {
  return (
    <AdminAuthProvider>
      <YourApp />
    </AdminAuthProvider>
  );
}
```

### ProtectedRoute

Component that wraps routes requiring authentication. Redirects to login page if not authenticated.

**Features:**
- Shows loading state while checking authentication
- Redirects to login page if not authenticated
- Displays error messages for authentication failures
- Customizable fallback and redirect paths

**Usage:**
```tsx
import { ProtectedRoute } from './auth';

function AdminDashboard() {
  return (
    <ProtectedRoute>
      <DefectListPage />
    </ProtectedRoute>
  );
}

// With custom redirect
<ProtectedRoute redirectTo="/admin/login">
  <DefectDetailPage />
</ProtectedRoute>

// With custom fallback
<ProtectedRoute fallback={<CustomLoginPrompt />}>
  <AdminContent />
</ProtectedRoute>
```

### useAdminAuth Hook

Custom hook to access authentication context.

**Features:**
- Provides authentication state (isAuthenticated, adminToken, adminUser)
- Provides authentication methods (login, logout, refreshAuth)
- Throws error if used outside AdminAuthProvider

**Usage:**
```tsx
import { useAdminAuth } from './auth';

function MyComponent() {
  const { isAuthenticated, adminUser, login, logout } = useAdminAuth();

  const handleLogin = async () => {
    try {
      await login({ email: 'admin@example.com', password: 'password' });
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return (
    <div>
      {isAuthenticated ? (
        <div>
          <p>Welcome, {adminUser?.name}</p>
          <button onClick={logout}>Logout</button>
        </div>
      ) : (
        <button onClick={handleLogin}>Login</button>
      )}
    </div>
  );
}
```

## Types

### AdminUser
```typescript
interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'super_admin';
}
```

### AuthState
```typescript
interface AuthState {
  isAuthenticated: boolean;
  adminToken: string | null;
  adminUser: AdminUser | null;
  loading: boolean;
  error: string | null;
}
```

### LoginCredentials
```typescript
interface LoginCredentials {
  email: string;
  password: string;
}
```

## Integration with adminDefectApi

The authentication module automatically integrates with the `adminDefectApi` client:

1. **On Mount**: If a token exists in localStorage, it's automatically set in the API client
2. **On Login**: The new token is set in the API client
3. **On Logout**: The token is cleared from the API client

This ensures all API requests include the proper authentication headers.

## Token Storage

Tokens are stored in localStorage with the following keys:
- `admin_auth_token`: JWT authentication token
- `admin_user`: Serialized AdminUser object

**Security Considerations:**
- Tokens are stored in localStorage for persistence across page refreshes
- In production, consider using httpOnly cookies for enhanced security
- Implement token expiration and refresh mechanisms
- Always use HTTPS in production

## Authentication Flow

1. **Initial Load**:
   - Check localStorage for existing token
   - If found, restore authentication state
   - Set token in adminDefectApi

2. **Login**:
   - Call login method with credentials
   - Receive token and user data from API
   - Store in localStorage
   - Set token in adminDefectApi
   - Update authentication state

3. **Logout**:
   - Clear localStorage
   - Clear token from adminDefectApi
   - Reset authentication state

4. **Protected Routes**:
   - Check authentication state
   - Show loading while checking
   - Redirect to login if not authenticated
   - Render content if authenticated

## TODO: Integration with Real Authentication API

The current implementation uses a mock authentication API. To integrate with a real authentication system:

1. Replace `mockLoginAPI` in `AdminAuthContext.tsx` with actual API call:
```tsx
async function loginAPI(credentials: LoginCredentials): Promise<LoginResponse> {
  const response = await fetch('https://your-api.com/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    throw new Error('Login failed');
  }

  return response.json();
}
```

2. Implement token refresh mechanism:
```tsx
async function refreshToken(token: string): Promise<string> {
  const response = await fetch('https://your-api.com/admin/refresh', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Token refresh failed');
  }

  const data = await response.json();
  return data.token;
}
```

3. Add token expiration handling:
```tsx
useEffect(() => {
  if (!adminToken) return;

  // Decode JWT to get expiration time
  const tokenData = parseJWT(adminToken);
  const expiresAt = tokenData.exp * 1000; // Convert to milliseconds
  const now = Date.now();
  const timeUntilExpiry = expiresAt - now;

  // Refresh token 5 minutes before expiration
  const refreshTime = timeUntilExpiry - (5 * 60 * 1000);

  if (refreshTime > 0) {
    const timeoutId = setTimeout(async () => {
      try {
        const newToken = await refreshToken(adminToken);
        // Update token in state and localStorage
      } catch (error) {
        // Handle refresh failure (logout user)
        logout();
      }
    }, refreshTime);

    return () => clearTimeout(timeoutId);
  }
}, [adminToken]);
```

## Error Handling

The authentication module handles various error scenarios:

- **Invalid Credentials**: Shows error message from API
- **Network Errors**: Shows generic network error message
- **Token Expiration**: Automatically logs out user
- **Missing Provider**: Throws error if hook used outside provider

## Testing

Example test for useAdminAuth hook:
```tsx
import { renderHook } from '@testing-library/react-hooks';
import { AdminAuthProvider, useAdminAuth } from './auth';

describe('useAdminAuth', () => {
  it('should throw error when used outside provider', () => {
    const { result } = renderHook(() => useAdminAuth());
    expect(result.error).toBeDefined();
  });

  it('should provide auth context when used inside provider', () => {
    const wrapper = ({ children }) => (
      <AdminAuthProvider>{children}</AdminAuthProvider>
    );
    const { result } = renderHook(() => useAdminAuth(), { wrapper });
    expect(result.current).toBeDefined();
    expect(result.current.isAuthenticated).toBe(false);
  });
});
```

## Requirements Validation

This module satisfies the following requirements:

- **Requirement 10.1**: Verifies Administrator privileges before allowing status changes (token required for API calls)
- **Requirement 10.2**: Verifies Administrator privileges before allowing Status_Updates (token required for API calls)
- **Requirement 10.3**: Rejects End_User attempts to change Defect_Status (no admin token = rejection)
- **Requirement 10.4**: Rejects End_User attempts to add Status_Update (no admin token = rejection)

The authentication system ensures that only authenticated administrators can access protected routes and make privileged API calls.
