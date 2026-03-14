/**
 * Property-Based Tests for Authentication System
 * 
 * **Validates: Requirements 1.1, 1.2, 1.3, 1.6**
 * 
 * These tests use fast-check to verify authentication properties across
 * a wide range of inputs, ensuring the authentication system behaves
 * correctly under all conditions.
 */

import fc from 'fast-check';
import { AuthenticationService } from '../authService';
import { 
  AdminRole, 
  AuthCredentials, 
  PERMISSIONS_BY_ROLE 
} from '../types';

// Jest types
declare global {
  namespace jest {
    interface Matchers<R> {
      toBe(expected: any): R;
      toBeDefined(): R;
      toBeUndefined(): R;
      toEqual(expected: any): R;
      toContain(expected: any): R;
      toBeGreaterThan(expected: number): R;
    }
  }
}

declare const describe: (name: string, fn: () => void) => void;
declare const it: (name: string, fn: () => void | Promise<void>) => void;
declare const beforeEach: (fn: () => void) => void;
declare const afterEach: (fn: () => void) => void;
declare const expect: (actual: any) => jest.Matchers<any>;

describe('Authentication Properties', () => {
  let authService: AuthenticationService;

  beforeEach(() => {
    authService = new AuthenticationService();
  });

  afterEach(() => {
    authService.clearAllSessions();
  });

  /**
   * **Property 1: Authentication with valid credentials creates session**
   * **Validates: Requirements 1.1, 1.2**
   * 
   * For any valid administrator credentials (email, password, role), 
   * authenticating with those credentials should create a session with 
   * permissions matching the administrator's role.
   */
  describe('Property 1: Authentication with valid credentials creates session', () => {
    it('should create session with valid credentials', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            email: fc.constantFrom(
              'admin@temple.com',
              'content@temple.com', 
              'viewer@temple.com'
            ),
            password: fc.string({ minLength: 12, maxLength: 50 }),
            mfaCode: fc.option(fc.string({ minLength: 6, maxLength: 6 }).filter(s => /^\d{6}$/.test(s)))
          }),
          async (credentials) => {
            // Get the user to check MFA requirement
            const user = authService.getUserByEmail(credentials.email);
            
            // If user requires MFA, provide MFA code
            const authCredentials: AuthCredentials = {
              email: credentials.email,
              password: credentials.password,
              mfaCode: user?.mfaEnabled ? (credentials.mfaCode || '123456') : credentials.mfaCode || undefined
            };

            const result = await authService.authenticate(authCredentials);

            // Should succeed for valid credentials
            expect(result.success).toBe(true);
            expect(result.session).toBeDefined();
            expect(result.user).toBeDefined();
            
            if (result.session && result.user) {
              // Session should have correct user ID
              expect(result.session.userId).toBe(result.user.userId);
              
              // Session should have permissions matching user's role
              const expectedPermissions = PERMISSIONS_BY_ROLE[result.user.role];
              expect(result.session.permissions).toEqual(expectedPermissions);
              
              // Session should have valid tokens
              expect(result.session.accessToken).toBeDefined();
              expect(result.session.refreshToken).toBeDefined();
              
              // Session should not be expired
              expect(result.session.expiresAt).toBeGreaterThan(Date.now());
              
              // User should have last login updated
              expect(result.user.lastLogin).toBeDefined();
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should create sessions with role-appropriate permissions', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom(...Object.values(AdminRole)),
          fc.string({ minLength: 12, maxLength: 50 }),
          async (role, password) => {
            // Find a user with the specified role
            const testEmails = {
              [AdminRole.SUPER_ADMIN]: 'admin@temple.com',
              [AdminRole.CONTENT_ADMIN]: 'content@temple.com',
              [AdminRole.ANALYTICS_VIEWER]: 'viewer@temple.com',
              [AdminRole.SUPPORT_ADMIN]: 'admin@temple.com' // Use super admin for support admin test
            };

            const email = testEmails[role];
            const result = await authService.authenticate({ email, password });

            if (result.success && result.session && result.user) {
              // Permissions should match the role
              const expectedPermissions = PERMISSIONS_BY_ROLE[role];
              expect(result.session.permissions).toEqual(expectedPermissions);
              expect(result.user.permissions).toEqual(expectedPermissions);
              expect(result.user.role).toBe(role);
            }
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  /**
   * **Property 2: Authentication with invalid credentials is rejected**
   * **Validates: Requirements 1.3**
   * 
   * For any invalid credentials (wrong password, non-existent email, 
   * malformed input), authentication attempts should be rejected and 
   * the failure should be logged.
   */
  describe('Property 2: Authentication with invalid credentials is rejected', () => {
    it('should reject authentication with invalid credentials', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.oneof(
            // Invalid email formats
            fc.record({
              email: fc.oneof(
                fc.string().filter(s => !s.includes('@')),
                fc.string().filter(s => s.length === 0),
                fc.constant('nonexistent@temple.com')
              ),
              password: fc.string({ minLength: 12, maxLength: 50 })
            }),
            // Invalid passwords (too short)
            fc.record({
              email: fc.constantFrom('admin@temple.com', 'content@temple.com'),
              password: fc.string({ maxLength: 11 })
            }),
            // Empty credentials
            fc.record({
              email: fc.constant(''),
              password: fc.constant('')
            }),
            // Invalid MFA codes
            fc.record({
              email: fc.constant('admin@temple.com'), // MFA enabled user
              password: fc.string({ minLength: 12, maxLength: 50 }),
              mfaCode: fc.oneof(
                fc.string({ minLength: 1, maxLength: 5 }),
                fc.string({ minLength: 7, maxLength: 10 }),
                fc.string({ minLength: 6, maxLength: 6 }).filter(s => !/^\d{6}$/.test(s))
              )
            })
          ),
          async (credentials) => {
            const result = await authService.authenticate(credentials);

            // Should fail for invalid credentials
            expect(result.success).toBe(false);
            expect(result.session).toBeUndefined();
            expect(result.error).toBeDefined();
            
            // Should not create any session
            expect(result.session).toBeUndefined();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject deactivated users', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 12, maxLength: 50 }),
          async (password) => {
            const result = await authService.authenticate({
              email: 'deactivated@temple.com',
              password
            });

            // Should fail for deactivated user
            expect(result.success).toBe(false);
            expect(result.session).toBeUndefined();
            expect(result.error).toBeDefined();
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  /**
   * **Property 3: Expired sessions are rejected**
   * **Validates: Requirements 1.6**
   * 
   * For any session that exceeds the timeout period (8 hours of inactivity),
   * session validation should reject the session and require re-authentication.
   */
  describe('Property 3: Expired sessions are rejected', () => {
    it('should reject expired sessions', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            email: fc.constantFrom('admin@temple.com', 'content@temple.com'),
            password: fc.string({ minLength: 12, maxLength: 50 })
          }),
          async (credentials) => {
            // First, create a valid session
            const authResult = await authService.authenticate(credentials);
            
            if (authResult.success && authResult.session) {
              const sessionId = authResult.session.sessionId;
              
              // Verify session is initially valid
              const initialValidation = await authService.validateSession(sessionId);
              expect(initialValidation.valid).toBe(true);
              
              // Manually expire the session by modifying its expiration time
              const session = authService.getSession(sessionId);
              if (session) {
                session.expiresAt = Date.now() - 1000; // Expired 1 second ago
                
                // Now validation should fail
                const expiredValidation = await authService.validateSession(sessionId);
                expect(expiredValidation.valid).toBe(false);
                expect(expiredValidation.error).toContain('expired');
                
                // Session should be removed from storage
                const removedSession = authService.getSession(sessionId);
                expect(removedSession).toBeUndefined();
              }
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should handle session timeout correctly', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            email: fc.constantFrom('admin@temple.com', 'content@temple.com'),
            password: fc.string({ minLength: 12, maxLength: 50 })
          }),
          fc.integer({ min: 1, max: 10000 }), // milliseconds in the past
          async (credentials, pastTime) => {
            // Create a session
            const authResult = await authService.authenticate(credentials);
            
            if (authResult.success && authResult.session) {
              const session = authResult.session;
              
              // Check if session would be expired with the given past time
              const wouldBeExpired = authService.isSessionExpired({
                ...session,
                expiresAt: Date.now() - pastTime
              });
              
              // Should be expired if past time is positive
              expect(wouldBeExpired).toBe(true);
              
              // Check if session is not expired with future time
              const wouldNotBeExpired = authService.isSessionExpired({
                ...session,
                expiresAt: Date.now() + pastTime
              });
              
              // Should not be expired if time is in future
              expect(wouldNotBeExpired).toBe(false);
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should terminate sessions for deactivated users', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 12, maxLength: 50 }),
          async (password) => {
            // First authenticate with an active user
            const authResult = await authService.authenticate({
              email: 'content@temple.com',
              password
            });
            
            if (authResult.success && authResult.session && authResult.user) {
              const sessionId = authResult.session.sessionId;
              
              // Verify session is valid
              const validation1 = await authService.validateSession(sessionId);
              expect(validation1.valid).toBe(true);
              
              // Simulate user deactivation by changing status
              authResult.user.status = 'DEACTIVATED';
              
              // Session validation should now fail
              const validation2 = await authService.validateSession(sessionId);
              expect(validation2.valid).toBe(false);
              expect(validation2.error).toContain('not active');
            }
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  /**
   * **Additional Property: Session management operations work correctly**
   * 
   * Verifies that session termination and bulk operations work as expected.
   */
  describe('Additional Property: Session management', () => {
    it('should terminate individual sessions correctly', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            email: fc.constantFrom('admin@temple.com', 'content@temple.com'),
            password: fc.string({ minLength: 12, maxLength: 50 })
          }),
          async (credentials) => {
            // Create session
            const authResult = await authService.authenticate(credentials);
            
            if (authResult.success && authResult.session) {
              const sessionId = authResult.session.sessionId;
              
              // Verify session exists
              expect(authService.getSession(sessionId)).toBeDefined();
              
              // Terminate session
              const terminated = await authService.terminateSession(sessionId);
              expect(terminated).toBe(true);
              
              // Session should no longer exist
              expect(authService.getSession(sessionId)).toBeUndefined();
              
              // Validation should fail
              const validation = await authService.validateSession(sessionId);
              expect(validation.valid).toBe(false);
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should terminate all user sessions correctly', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            email: fc.constantFrom('admin@temple.com', 'content@temple.com'),
            password: fc.string({ minLength: 12, maxLength: 50 })
          }),
          fc.integer({ min: 1, max: 5 }), // Number of sessions to create
          async (credentials, sessionCount) => {
            const sessionIds: string[] = [];
            
            // Create multiple sessions for the same user
            for (let i = 0; i < sessionCount; i++) {
              const authResult = await authService.authenticate(credentials);
              if (authResult.success && authResult.session) {
                sessionIds.push(authResult.session.sessionId);
              }
            }
            
            if (sessionIds.length > 0) {
              // Get user ID from first session
              const firstSession = authService.getSession(sessionIds[0]);
              if (firstSession) {
                const userId = firstSession.userId;
                
                // Terminate all sessions for this user
                const terminatedCount = await authService.terminateAllUserSessions(userId);
                expect(terminatedCount).toBe(sessionIds.length);
                
                // All sessions should be gone
                sessionIds.forEach(sessionId => {
                  expect(authService.getSession(sessionId)).toBeUndefined();
                });
              }
            }
          }
        ),
        { numRuns: 30 }
      );
    });
  });
});