# Authentication & Persistence Flow

## Overview

The app now includes authentication and persistence, so users don't have to go through the welcome flow every time they open the app.

## Flow Diagram

### First Time User
```
App Launch
  ↓
Splash Screen (checks auth)
  ↓
Welcome Screen (not logged in)
  ↓
Login/Sign Up
  ↓
Language Selection
  ↓
Explore Temples
```

### Returning User (Logged In)
```
App Launch
  ↓
Splash Screen (checks auth)
  ↓
Explore Temples (directly!)
```

### Returning User (Logged In, No Language)
```
App Launch
  ↓
Splash Screen (checks auth)
  ↓
Language Selection
  ↓
Explore Temples
```

## Screens

### 1. Splash Screen (NEW!)
- **Purpose**: Check authentication status
- **Duration**: 2 seconds
- **Logic**:
  ```typescript
  if (isLoggedIn && hasSelectedLanguage) {
    → Go to Explore
  } else if (isLoggedIn) {
    → Go to Language Selection
  } else {
    → Go to Welcome
  }
  ```
- **Storage Checks**:
  - `authToken`: Is user logged in?
  - `selectedLanguage`: Has user chosen language?

### 2. Welcome Screen
- **When Shown**: First time users or logged out users
- **Action**: "Get Started" → Login Screen

### 3. Login Screen (NEW!)
- **Purpose**: User authentication
- **Features**:
  - Login with email/password
  - Sign up for new users
  - "Continue as Guest" option
  - Toggle between Login/Sign Up
- **Actions**:
  - Login/Sign Up → Language Selection
  - Guest Mode → Language Selection (limited features)
- **Storage**:
  - Saves `authToken` on successful login
  - Saves `userEmail` for profile

### 4. Language Selection
- **When Shown**: 
  - After login (first time)
  - Logged in users who haven't selected language
- **Action**: Continue → Explore
- **Storage**: Saves `selectedLanguage`

### 5. Explore Temples
- **When Shown**:
  - After language selection
  - Directly on app launch (if logged in + language set)

## Data Persistence

### AsyncStorage Keys

| Key | Value | Purpose |
|-----|-------|---------|
| `authToken` | JWT token | User authentication |
| `userEmail` | email@example.com | User identification |
| `selectedLanguage` | 'en', 'hi', 'te', etc. | Content language |
| `userName` | User's name | Profile display |
| `isGuest` | 'true'/'false' | Guest mode flag |

### Implementation (Production)

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

// Save auth data
await AsyncStorage.setItem('authToken', token);
await AsyncStorage.setItem('userEmail', email);
await AsyncStorage.setItem('selectedLanguage', 'en');

// Check auth status
const authToken = await AsyncStorage.getItem('authToken');
const language = await AsyncStorage.getItem('selectedLanguage');

// Clear on logout
await AsyncStorage.multiRemove(['authToken', 'userEmail']);
```

## User Scenarios

### Scenario 1: Brand New User
1. Opens app for first time
2. Sees Splash → Welcome
3. Clicks "Get Started"
4. Signs up with email/password
5. Selects language (Hindi)
6. Browses temples
7. **Closes app**
8. **Reopens app** → Goes directly to Explore! ✅

### Scenario 2: Returning User
1. Opens app
2. Sees Splash (2 seconds)
3. Automatically goes to Explore ✅
4. No need to login again
5. No need to select language again

### Scenario 3: Guest User
1. Opens app
2. Sees Splash → Welcome → Login
3. Clicks "Continue as Guest"
4. Selects language
5. Browses temples (limited features)
6. **Closes app**
7. **Reopens app** → Goes to Explore (as guest)

### Scenario 4: User Logs Out
1. User is in Explore
2. Goes to Profile → Logout
3. Auth token cleared
4. **Reopens app** → Splash → Welcome → Login

### Scenario 5: User Changes Language
1. User is in Explore
2. Goes to Settings → Change Language
3. Selects Telugu
4. Language saved
5. **Reopens app** → Explore (with Telugu content)

## Authentication Methods

### AWS Cognito Integration (Production)

```typescript
// Sign Up
const signUp = async (email: string, password: string) => {
  const response = await Auth.signUp({
    username: email,
    password: password,
  });
  return response;
};

// Login
const login = async (email: string, password: string) => {
  const user = await Auth.signIn(email, password);
  const token = user.signInUserSession.idToken.jwtToken;
  await AsyncStorage.setItem('authToken', token);
  return user;
};

// Check Auth
const checkAuth = async () => {
  try {
    const user = await Auth.currentAuthenticatedUser();
    return user;
  } catch {
    return null;
  }
};

// Logout
const logout = async () => {
  await Auth.signOut();
  await AsyncStorage.multiRemove(['authToken', 'userEmail', 'selectedLanguage']);
};
```

## Guest Mode vs Authenticated

| Feature | Guest | Authenticated |
|---------|-------|---------------|
| Browse Temples | ✅ | ✅ |
| View Artifacts | ✅ | ✅ |
| Scan QR Codes | ✅ | ✅ |
| Unlock Content | ❌ | ✅ |
| Download Offline | ❌ | ✅ |
| Save Favorites | ❌ | ✅ |
| Track History | ❌ | ✅ |
| Sync Across Devices | ❌ | ✅ |

## Session Management

### Token Expiry
- JWT tokens expire after 30 days
- App checks token validity on launch
- If expired → Redirect to Login
- Refresh token used for silent renewal

### Auto-Logout
- After 90 days of inactivity
- On security breach detection
- On password change

## Security Best Practices

1. **Never store passwords**: Only store auth tokens
2. **Secure storage**: Use encrypted storage for tokens
3. **Token refresh**: Implement refresh token mechanism
4. **Biometric auth**: Add fingerprint/face ID option
5. **Session timeout**: Auto-logout after inactivity

## Installation Requirements

### For Production (AsyncStorage)

```bash
npm install @react-native-async-storage/async-storage
```

### For AWS Cognito

```bash
npm install aws-amplify @aws-amplify/auth
```

## Testing

### Test Cases

1. **First Launch**: Should show Welcome → Login → Language → Explore
2. **Second Launch**: Should show Splash → Explore (skip everything)
3. **Logout**: Should clear storage and show Welcome on next launch
4. **Guest Mode**: Should allow browsing but limit features
5. **Language Change**: Should persist and apply on next launch
6. **Token Expiry**: Should redirect to Login

## Future Enhancements

- Social login (Google, Facebook)
- Biometric authentication
- Multi-device sync
- Remember me checkbox
- Forgot password flow
- Email verification
- Phone number authentication
- Two-factor authentication (2FA)

## Summary

**Before**: Every app launch → Welcome → Language → Explore

**After**: 
- First time → Welcome → Login → Language → Explore
- Returning → Splash → Explore (directly!)

Users stay logged in and don't have to repeat the onboarding flow!
