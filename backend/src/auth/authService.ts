/**
 * Authentication Service
 * 
 * Handles authentication, session management, and authorization
 */

import { 
  AdminUser, 
  AdminRole, 
  Permission, 
  AuthCredentials, 
  AuthSession, 
  AuthResult, 
  SessionValidationResult,
  PERMISSIONS_BY_ROLE 
} from './types';
import { v4 as uuidv4 } from 'uuid';

export class AuthenticationService {
  private sessions: Map<string, AuthSession> = new Map();
  private users: Map<string, AdminUser> = new Map();
  private sessionTimeout = 8 * 60 * 60 * 1000; // 8 hours in milliseconds

  constructor() {
    // Initialize with some test users for property testing
    this.initializeTestUsers();
  }

  /**
   * Authenticate user with credentials
   */
  async authenticate(credentials: AuthCredentials): Promise<AuthResult> {
    try {
      // Validate input
      if (!credentials.email || !credentials.password) {
        return {
          success: false,
          error: 'Email and password are required'
        };
      }

      // Find user by email
      const userEntries = Array.from(this.users.values());
      const user = userEntries.find(u => u.email === credentials.email);
      
      if (!user) {
        // Log failed attempt
        this.logFailedAttempt(credentials.email, 'User not found');
        return {
          success: false,
          error: 'Invalid credentials'
        };
      }

      // Check if user is active
      if (user.status !== 'ACTIVE') {
        this.logFailedAttempt(credentials.email, 'User not active');
        return {
          success: false,
          error: 'Account is not active'
        };
      }

      // Simulate password validation (in real implementation, use bcrypt)
      const isValidPassword = await this.validatePassword(credentials.password, user.userId);
      
      if (!isValidPassword) {
        this.logFailedAttempt(credentials.email, 'Invalid password');
        return {
          success: false,
          error: 'Invalid credentials'
        };
      }

      // Check MFA if enabled
      if (user.mfaEnabled && !credentials.mfaCode) {
        return {
          success: false,
          requiresMfa: true,
          error: 'MFA code required'
        };
      }

      if (user.mfaEnabled && credentials.mfaCode) {
        const isValidMfa = await this.validateMfaCode(credentials.mfaCode, user.userId);
        if (!isValidMfa) {
          this.logFailedAttempt(credentials.email, 'Invalid MFA code');
          return {
            success: false,
            error: 'Invalid MFA code'
          };
        }
      }

      // Create session
      const session = this.createSession(user);
      
      // Update last login
      user.lastLogin = new Date().toISOString();
      this.users.set(user.userId, user);

      return {
        success: true,
        session,
        user
      };

    } catch (error) {
      return {
        success: false,
        error: 'Authentication failed'
      };
    }
  }

  /**
   * Validate session token
   */
  async validateSession(sessionId: string): Promise<SessionValidationResult> {
    try {
      const session = this.sessions.get(sessionId);
      
      if (!session) {
        return {
          valid: false,
          error: 'Session not found'
        };
      }

      // Check if session is expired
      if (Date.now() > session.expiresAt) {
        this.sessions.delete(sessionId);
        return {
          valid: false,
          error: 'Session expired'
        };
      }

      // Get user
      const user = this.users.get(session.userId);
      if (!user) {
        this.sessions.delete(sessionId);
        return {
          valid: false,
          error: 'User not found'
        };
      }

      // Check if user is still active
      if (user.status !== 'ACTIVE') {
        this.sessions.delete(sessionId);
        return {
          valid: false,
          error: 'User account is not active'
        };
      }

      return {
        valid: true,
        session,
        user
      };

    } catch (error) {
      return {
        valid: false,
        error: 'Session validation failed'
      };
    }
  }

  /**
   * Create a new session for authenticated user
   */
  private createSession(user: AdminUser): AuthSession {
    const sessionId = uuidv4();
    const now = Date.now();
    
    const session: AuthSession = {
      sessionId,
      userId: user.userId,
      accessToken: this.generateAccessToken(user),
      refreshToken: this.generateRefreshToken(user),
      expiresAt: now + this.sessionTimeout,
      permissions: user.permissions,
      role: user.role,
      createdAt: now
    };

    this.sessions.set(sessionId, session);
    return session;
  }

  /**
   * Terminate session
   */
  async terminateSession(sessionId: string): Promise<boolean> {
    return this.sessions.delete(sessionId);
  }

  /**
   * Terminate all sessions for a user
   */
  async terminateAllUserSessions(userId: string): Promise<number> {
    let count = 0;
    const sessionEntries = Array.from(this.sessions.entries());
    for (const [sessionId, session] of sessionEntries) {
      if (session.userId === userId) {
        this.sessions.delete(sessionId);
        count++;
      }
    }
    return count;
  }

  /**
   * Check if session is expired based on inactivity
   */
  isSessionExpired(session: AuthSession): boolean {
    return Date.now() > session.expiresAt;
  }

  /**
   * Validate password (mock implementation)
   */
  private async validatePassword(password: string, userId: string): Promise<boolean> {
    // Mock validation - in real implementation, use bcrypt.compare
    // For testing, accept any password with length >= 12
    return password.length >= 12;
  }

  /**
   * Validate MFA code (mock implementation)
   */
  private async validateMfaCode(mfaCode: string, userId: string): Promise<boolean> {
    // Mock validation - in real implementation, use TOTP library
    // For testing, accept 6-digit codes
    return /^\d{6}$/.test(mfaCode);
  }

  /**
   * Generate access token (mock implementation)
   */
  private generateAccessToken(user: AdminUser): string {
    // Mock JWT token generation
    return `access_${user.userId}_${Date.now()}`;
  }

  /**
   * Generate refresh token (mock implementation)
   */
  private generateRefreshToken(user: AdminUser): string {
    // Mock refresh token generation
    return `refresh_${user.userId}_${Date.now()}`;
  }

  /**
   * Log failed authentication attempt
   */
  private logFailedAttempt(email: string, reason: string): void {
    console.log(`Failed auth attempt: ${email} - ${reason} at ${new Date().toISOString()}`);
  }

  /**
   * Initialize test users for property testing
   */
  private initializeTestUsers(): void {
    const testUsers: AdminUser[] = [
      {
        userId: 'user-1',
        email: 'admin@temple.com',
        name: 'Super Admin',
        role: AdminRole.SUPER_ADMIN,
        permissions: PERMISSIONS_BY_ROLE[AdminRole.SUPER_ADMIN],
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
        createdBy: 'system',
        mfaEnabled: true
      },
      {
        userId: 'user-2',
        email: 'content@temple.com',
        name: 'Content Admin',
        role: AdminRole.CONTENT_ADMIN,
        permissions: PERMISSIONS_BY_ROLE[AdminRole.CONTENT_ADMIN],
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
        createdBy: 'system',
        mfaEnabled: false
      },
      {
        userId: 'user-3',
        email: 'viewer@temple.com',
        name: 'Analytics Viewer',
        role: AdminRole.ANALYTICS_VIEWER,
        permissions: PERMISSIONS_BY_ROLE[AdminRole.ANALYTICS_VIEWER],
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
        createdBy: 'system',
        mfaEnabled: false
      },
      {
        userId: 'user-4',
        email: 'deactivated@temple.com',
        name: 'Deactivated User',
        role: AdminRole.SUPPORT_ADMIN,
        permissions: PERMISSIONS_BY_ROLE[AdminRole.SUPPORT_ADMIN],
        status: 'DEACTIVATED',
        createdAt: new Date().toISOString(),
        createdBy: 'system',
        mfaEnabled: false
      }
    ];

    testUsers.forEach(user => {
      this.users.set(user.userId, user);
    });
  }

  /**
   * Get user by email (for testing)
   */
  getUserByEmail(email: string): AdminUser | undefined {
    const userEntries = Array.from(this.users.values());
    return userEntries.find(u => u.email === email);
  }

  /**
   * Get session by ID (for testing)
   */
  getSession(sessionId: string): AuthSession | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * Clear all sessions (for testing)
   */
  clearAllSessions(): void {
    this.sessions.clear();
  }
}