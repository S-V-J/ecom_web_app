# 🚀 Phase 4: Authentication & Authorization System - Execution Log & Reference
**Project:** Universal E-Commerce System – Interactive Demo
**Target Runtime:** Google Chrome (locally, self-contained)
**Development Environment:** WSL2 (Ubuntu) + VS Code Remote
**Overall Phase Status:** ✅ **100% COMPLETED AND VERIFIED**

---

## 📋 Executive Summary
Phase 4 established a production-grade, secure authentication and authorization layer. Key achievements include:
- Dual-token JWT architecture (short-lived Access Token + HTTP-only Refresh Token).
- Strict Role-Based Access Control (RBAC) middleware.
- Multiple registration flows: Email/Password, Phone OTP (Mock), and Gmail OAuth (Mock).
- Super Admin CRUD operations for user and team management.
- Client-side React Auth Context with Axios interceptors for seamless, automatic token rotation.

---

## 🛠️ Step-by-Step Execution Log & File Placeholders

### Sub-Phase 4.1: Implement User Model & Update DAO for Auth
**Objective:** Extend the existing DAO and shared types to support authentication fields (`password_hash`, `phone`, `status`) and optimize lookup methods.
**Actions Taken:**
- Updated `shared/types/index.ts` to include auth-specific interfaces.
- Enhanced `server/src/repositories/UserRepo.ts` with `findByEmail`, `findByPhone`, and nullable `password_hash` handling.
**Verification:** TypeScript compilation passed (`npx tsc --noEmit`) with zero errors.

<details>
<summary>📂 Click to expand: File Placeholders for Sub-Phase 4.1</summary>

#### `shared/types/index.ts`
```typescript
/**
 * @file index.ts
 * @description Centralized TypeScript types and interfaces shared between client and server.
 * @systemic_role Defines the strict API contract. Database-specific types (like DbUser) 
 * must remain encapsulated within the server's DAO layer.
 */

export type UserRole = 'SUPER_ADMIN' | 'TEAM_LEAD' | 'STAFF' | 'CUSTOMER';
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

/**
 * Sanitized User object returned by the API to the client.
 * Excludes sensitive fields like password_hash and internal DB IDs.
 */
export interface User {
  id: string;
  email: string;
  phone: string | null;
  role: UserRole;
  teamId: string | null;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  name: string;
  price: number; // Note: API layer will convert price_cents to this number
  description: string;
  category: string;
  stock: number;
  imageUrl?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// ==========================================
// AUTHENTICATION SPECIFIC TYPES (API Contract)
// ==========================================

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  phone?: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  // Note: refreshToken is intentionally omitted here as it is sent via httpOnly cookie
}
```

#### `server/src/repositories/UserRepo.ts`
```typescript
/**
 * @file UserRepo.ts
 * @description Data Access Object for the 'users' table.
 * @systemic_role Abstracts SQL operations for user management, authentication lookups, 
 * and profile updates. Includes JOINs to fetch human-readable role and team names.
 */

import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';

// ==========================================
// LOCAL TYPES (Encapsulated within the Server DAO layer)
// ==========================================
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

export interface DbUser {
  id: string;
  email: string;
  password_hash: string | null;
  phone: string | null;
  role_id: string;
  team_id: string | null;
  status: UserStatus;
  created_at: string;
  updated_at: string;
}

export interface UserWithDetails extends DbUser {
  role_name: string;
  team_name: string | null;
}

export class UserRepository {
  private db: Database.Database;

  constructor(db: Database.Database) {
    this.db = db;
  }

  /**
   * Retrieves all users with joined role and team names for admin dashboards.
   */
  public findAll(): UserWithDetails[] {
    const stmt = this.db.prepare(`
      SELECT 
        u.*, 
        r.name as role_name, 
        t.name as team_name
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      LEFT JOIN teams t ON u.team_id = t.id
      ORDER BY u.created_at DESC
    `);
    return stmt.all() as UserWithDetails[];
  }

  /**
   * Retrieves a single user by UUID with joined details.
   */
  public findById(id: string): UserWithDetails | undefined {
    const stmt = this.db.prepare(`
      SELECT 
        u.*, 
        r.name as role_name, 
        t.name as team_name
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      LEFT JOIN teams t ON u.team_id = t.id
      WHERE u.id = ?
    `);
    return stmt.get(id) as UserWithDetails | undefined;
  }

  /**
   * Retrieves a user by email. Used primarily for authentication login.
   * CRITICAL: This query is fast due to the idx_users_email index.
   */
  public findByEmail(email: string): DbUser | undefined {
    const stmt = this.db.prepare('SELECT * FROM users WHERE email = ?');
    return stmt.get(email) as DbUser | undefined;
  }

  /**
   * Retrieves a user by phone number. Used for OTP authentication.
   * CRITICAL: This query is fast due to the idx_users_phone index.
   */
  public findByPhone(phone: string): DbUser | undefined {
    const stmt = this.db.prepare('SELECT * FROM users WHERE phone = ?');
    return stmt.get(phone) as DbUser | undefined;
  }

  /**
   * Creates a new user. Returns the created DbUser object.
   * Properly handles nullable password_hash for OTP/OAuth users.
   */
  public create(data: {
    email: string;
    password_hash?: string | null;
    phone?: string | null;
    role_id: string;
    team_id?: string | null;
    status?: UserStatus;
  }): DbUser {
    const id = uuidv4();
    const now = new Date().toISOString();
    const stmt = this.db.prepare(`
      INSERT INTO users (id, email, password_hash, phone, role_id, team_id,status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      id,
      data.email,
      data.password_hash || null,
      data.phone || null,
      data.role_id,
      data.team_id || null,
      data.status || 'ACTIVE',
      now,
      now
    );
    return {
      id,
      email: data.email,
      password_hash: data.password_hash || null,
      phone: data.phone || null,
      role_id: data.role_id,
      team_id: data.team_id || null,
      status: data.status || 'ACTIVE',
      created_at: now,
      updated_at: now,
    };
  }

  /**
   * Updates a user's password hash. Used for password resets or initial OAuth linking.
   */
  public updatePassword(id: string, passwordHash: string): boolean {
    const stmt = this.db.prepare(`
      UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?
    `);
    const result = stmt.run(passwordHash, new Date().toISOString(), id);
    return result.changes > 0;
  }

  /**
   * Updates a user's role. Returns true if successful.
   * ADDED: Required by admin.controller.ts for reassigning user roles.
   */
  public updateRole(id: string, role_id: string): boolean {
    const stmt = this.db.prepare(`
      UPDATE users SET role_id = ?, updated_at = ? WHERE id = ?
    `);
    const result = stmt.run(role_id, new Date().toISOString(), id);
    return result.changes > 0;
  }

  /**
   * Updates a user's activation status. Returns true if successful.
   */
  public updateStatus(id: string, status: UserStatus): boolean {
    const stmt = this.db.prepare(`
      UPDATE users SET status = ?, updated_at = ? WHERE id = ?
    `);
    const result = stmt.run(status, new Date().toISOString(), id);
    return result.changes > 0;
  }

  /**
   * Updates a user's team assignment. Returns true if successful.
   */
  public updateTeam(id: string, team_id: string | null): boolean {
    const stmt = this.db.prepare(`
      UPDATE users SET team_id = ?, updated_at = ? WHERE id = ?
    `);
    const result = stmt.run(team_id, new Date().toISOString(), id);
    return result.changes > 0;
  }

  /**
   * Deletes a user by UUID. Returns true if a row was deleted.
   */
  public delete(id: string): boolean {
    const stmt = this.db.prepare('DELETE FROM users WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }
}
```
</details>

---

### Sub-Phase 4.2: Implement JWT Auth Middleware (Dual-Token Architecture)
**Objective:** Secure routes using a short-lived Access Token and a long-lived, HTTP-only Refresh Token with automatic rotation.
**Actions Taken:**
- Installed dependencies: `npm install jsonwebtoken cookie-parser`
- Created `server/src/utils/jwt.ts` for token generation/verification (with metadata stripping to prevent `exp` conflicts).
- Created `server/src/middleware/auth.middleware.ts` to handle header validation, cookie parsing, and seamless token rotation.
**Verification:** `curl http://localhost:3001/auth/me -H "Authorization: Bearer <token>"` returned valid user data.

<details>
<summary>📂 Click to expand: File Placeholders for Sub-Phase 4.2</summary>

#### `server/src/utils/jwt.ts`
```typescript
/**
 * @file jwt.ts
 * @description Utility functions for JWT token generation and validation.
 * @systemic_role Centralizes all token logic to ensure consistent securitypractices across the application.
 */
import jwt from 'jsonwebtoken';
import { UserRole } from '@shared/types';

// In production, these MUST be loaded from process.env and be cryptographically secure random strings.
const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || 'dev-access-secret';
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'dev-refresh-secret';

const ACCESS_TOKEN_EXPIRY = '15m'; // Short-lived for security
const REFRESH_TOKEN_EXPIRY = '7d';  // Long-lived for user convenience

export interface JWTPayload {
  id: string;
  email: string;
  role: UserRole;
  teamId: string | null;
}

/**
 * Generates a short-lived Access Token.
 * Explicitly constructs a clean payload to prevent 'exp' property conflicts during token rotation.
 */
export const generateAccessToken = (payload: JWTPayload): string => {
  const cleanPayload = {
    id: payload.id,
    email: payload.email,
    role: payload.role,
    teamId: payload.teamId
  };
  return jwt.sign(cleanPayload, ACCESS_TOKEN_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
};

/**
 * Generates a long-lived Refresh Token.
 * Explicitly constructs a clean payload to prevent 'exp' property conflicts during token rotation.
 */
export const generateRefreshToken = (payload: JWTPayload): string => {
  const cleanPayload = {
    id: payload.id,
    email: payload.email,
    role: payload.role,
    teamId: payload.teamId
  };
  return jwt.sign(cleanPayload, REFRESH_TOKEN_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRY });
};

/**
 * Verifies an Access Token. Returns the payload if valid, null otherwise.
 * Strips JWT metadata (exp, iat) to ensure type safety and clean rotation.
 */
export const verifyAccessToken = (token: string): JWTPayload | null => {
  try {
    const decoded = jwt.verify(token, ACCESS_TOKEN_SECRET);
    if (typeof decoded === 'string') return null;
    return {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      teamId: decoded.teamId
    };
  } catch (error) {
    return null; // Token is invalid or expired
  }
};

/**
 * Verifies a Refresh Token. Returns the payload if valid, null otherwise.
 * Strips JWT metadata (exp, iat) to ensure type safety and clean rotation.
 */
export const verifyRefreshToken = (token: string): JWTPayload | null => {
  try {
    const decoded = jwt.verify(token, REFRESH_TOKEN_SECRET);
    if (typeof decoded === 'string') return null;
    return {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      teamId: decoded.teamId
    };
  } catch (error) {
    return null; // Token is invalid or expired
  }
};
```

#### `server/src/middleware/auth.middleware.ts`
```typescript
/**
 * @file auth.middleware.ts
 * @description Express middleware for JWT authentication and Role-Based Access Control (RBAC).
 * @systemic_role Protects routes by validating tokens, seamlessly rotatingexpired access tokens, 
 * and verifying the user's role against an allowed list of roles.
 */
import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@shared/types';
import { 
  verifyAccessToken, 
  verifyRefreshToken, 
  generateAccessToken, 
  generateRefreshToken, 
  JWTPayload 
} from '../utils/jwt';

// Extend Express Request interface to include the authenticated user
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

/**
 * @description Middleware to authenticate requests. 
 * Checks Access Token first. If expired/missing, checks Refresh Token and rotates both if valid.
 */
export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const accessToken = authHeader && authHeader.split(' ')[1]; // Extract "Bearer <token>"
  const refreshToken = req.cookies?.refreshToken;

  // 1. Try to validate the Access Token
  if (accessToken) {
    const payload = verifyAccessToken(accessToken);
    if (payload) {
      req.user = payload;
      return next(); // Access token is valid, proceed
    }
  }

  // 2. Access token is missing or expired. Try to validate the Refresh Token
  if (refreshToken) {
    const payload = verifyRefreshToken(refreshToken);
    if (payload) {
      // Token Rotation: Issue brand new tokens
      const newAccessToken = generateAccessToken(payload);
      const newRefreshToken = generateRefreshToken(payload);

      // Set new Refresh Token as an httpOnly cookie
      res.cookie('refreshToken', newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // true in HTTPS, false in local dev
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
      });

      req.user = payload;
      
      // Send the new Access Token in a custom header for the client to capture and store
      res.setHeader('X-New-Access-Token', newAccessToken);
      
      return next(); // Authentication successful via rotation
    }
  }

  // 3. Both tokens are missing or invalid
  return res.status(401).json({ 
    success: false, 
    error: 'Unauthorized: Invalid or missing authentication tokens' 
  });
};

/**
 * @description Middleware to authorize requests based on user role (RBAC).
 * Must be used AFTER the `authenticate` middleware.
 * @param allowedRoles Array of roles permitted to access the route (e.g., ['SUPER_ADMIN']).
 */
export const authorize = (allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Edge-case: Ensure authenticate middleware ran first
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Unauthorized: User not authenticated' });
    }

    // Check if the user's role is in the allowed list
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        error: `Forbidden: Role '${req.user.role}' is not authorized to access this resource` 
      });
    }

    next(); // User has the required role, proceed to the controller
  };
};
```
</details>

---

### Sub-Phase 4.3: Implement Role-Based Access Control (RBAC) Middleware
**Objective:** Protect routes by verifying the user's role against an allowed list and optionally verifying team membership.
**Actions Taken:**
- Created `server/src/middleware/rbac.middleware.ts` (or integrated `authorize` function) that intercepts requests post-authentication and checks `req.user.role`.
**Verification:** Attempting to access `/admin/users` with a `CUSTOMER` token returned `403 Forbidden`.

<details>
<summary>📂 Click to expand: File Placeholders for Sub-Phase 4.3</summary>

#### `server/src/middleware/rbac.middleware.ts`
```typescript
/**
 * @file rbac.middleware.ts
 * @description Role-Based Access Control (RBAC) middleware.
 * @systemic_role Protects routes by verifying the user's role and optionally team membership 
 * against an allowed list, preventing privilege escalation.
 */
import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../../shared/types';

/**
 * @description Middleware to authorize requests based on user role.
 * Must be chained AFTER the `authenticate` middleware so `req.user` is populated.
 * @param allowedRoles Array of roles permitted to access the route.
 * @param requiredTeamId Optional: If provided, verifies the user belongs to this specific team.
 */
export const requireRole = (allowedRoles: UserRole[], requiredTeamId?: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // 1. Ensure the user is authenticated (req.user must exist)
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        error: 'Unauthorized: Authentication required before authorization' 
      });
    }

    // 2. Check if the user's role is in the allowed list
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        error: `Forbidden: Role '${req.user.role}' is not authorized. Allowed: ${allowedRoles.join(', ')}` 
      });
    }

    // 3. Optional: Verify team membership if requiredTeamId is provided
    if (requiredTeamId && req.user.teamId !== requiredTeamId) {
      return res.status(403).json({ 
        success: false, 
        error: `Forbidden: Access restricted to members of team '${requiredTeamId}'` 
      });
    }

    // 4. All checks passed, proceed to the route handler
    next();
  };
};
```
</details>

---

### Sub-Phase 4.4: Implement Email/Password Registration & Login Endpoints
**Objective:** Build core auth endpoints with secure password hashing.
**Actions Taken:**
- Installed dependency: `npm install bcrypt`
- Created `server/src/controllers/auth.controller.ts` with `register`, `login`, `me`, and `refresh` logic.
- Created `server/src/routes/auth.routes.ts` to map endpoints.
**Verification:** 
```bash
curl -X POST http://localhost:3001/auth/register -H "Content-Type: application/json" -d '{"email":"test@demo.com","password":"password123"}'
```
Returned `201 Created` with a valid JWT.

<details>
<summary>📂 Click to expand: File Placeholders for Sub-Phase 4.4</summary>

#### `server/src/controllers/auth.controller.ts`
```typescript
/**
 * @file auth.controller.ts
 * @description Core authentication endpoints: email/password register/login, phone OTP, mock OAuth, me, and refresh.
 * @systemic_role Handles user credential validation, password hashing, OTPverification, OAuth simulation, and JWT issuance.
 */
import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import path from 'path';
import Database from 'better-sqlite3';
import { UserRepository } from '../repositories/UserRepo';
import { RoleRepository } from '../repositories/RoleRepo';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken, JWTPayload } from '../utils/jwt';
import { requestOTP, verifyOTP } from '../services/otp.service';
import { User, RegisterRequest, LoginRequest } from '../../shared/types';

// ==========================================
// DATABASE INITIALIZATION
// ==========================================
const dbPath = path.resolve(__dirname, '../../../db/ecommerce.db');
const db = new Database(dbPath, { fileMustExist: true });

const userRepo = new UserRepository(db);
const roleRepo = new RoleRepository(db);

const SALT_ROUNDS = 10;

/**
 * @route POST /auth/register
 * @description Registers a new user with email and password.
 */
export const register = async (req: Request<{}, {}, RegisterRequest>, res: Response) => {
  try {
    const { email, password, phone } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, error: 'Password must be at least 6 characters' });
    }

    const existingUser = userRepo.findByEmail(email);
    if (existingUser) {
      return res.status(409).json({ success: false, error: 'Email already registered' });
    }

    if (phone) {
      const existingPhoneUser = userRepo.findByPhone(phone);
      if (existingPhoneUser) {
        return res.status(409).json({ success: false, error: 'Phone number already registered' });
      }
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const customerRole = roleRepo.findByName('CUSTOMER');
    if (!customerRole) {
      return res.status(500).json({ success: false, error: 'Default role not found in database' });
    }

    const newUser = userRepo.create({
      email,
      password_hash: passwordHash,
      phone: phone || null,
      role_id: customerRole.id,
      status: 'ACTIVE'
    });

    const payload: JWTPayload = {
      id: newUser.id,
      email: newUser.email,
      role: customerRole.name as any,
      teamId: newUser.team_id
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    const sanitizedUser: User = {
      id: newUser.id,
      email: newUser.email,
      phone: newUser.phone,
      role: customerRole.name as any,
      teamId: newUser.team_id,
      status: newUser.status,
      createdAt: newUser.created_at,
      updatedAt: newUser.updated_at
    };

    res.status(201).json({ success: true, data: { user: sanitizedUser, accessToken } });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, error: 'Internal server error during registration' });
  }
};

/**
 * @route POST /auth/login
 * @description Authenticates a user and issues JWTs.
 */
export const login = async (req: Request<{}, {}, LoginRequest>, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required' });
    }

    const user = userRepo.findByEmail(email);
    if (!user || !user.password_hash) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    if (user.status !== 'ACTIVE') {
      return res.status(403).json({ success: false, error: 'Account is inactive or suspended' });
    }

    const role = roleRepo.findById(user.role_id);
    const payload: JWTPayload = {
      id: user.id,
      email: user.email,
      role: (role?.name || 'CUSTOMER') as any,
      teamId: user.team_id
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    const sanitizedUser: User = {
      id: user.id,
      email: user.email,
      phone: user.phone,
      role: payload.role,
      teamId: user.team_id,
      status: user.status,
      createdAt: user.created_at,
      updatedAt: user.updated_at
    };

    res.status(200).json({ success: true, data: { user: sanitizedUser, accessToken } });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, error: 'Internal server error during login' });
  }
};

/**
 * @route POST /auth/phone/request-otp
 * @description Requests a mock OTP for phone number registration.
 */
export const requestPhoneOtp = (req: Request, res: Response) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({ success: false, error: 'Phone number isrequired' });
    }

    const existingUser = userRepo.findByPhone(phone);
    if (existingUser) {
      return res.status(409).json({ success: false, error: 'Phone number already registered' });
    }

    const result = requestOTP(phone, 'PHONE');
    return res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    console.error('Request OTP error:', error);
    res.status(500).json({ success: false, error: 'Internal server error requesting OTP' });
  }
};

/**
 * @route POST /auth/phone/verify-and-register
 * @description Verifies the OTP and creates a new CUSTOMER account if valid.
 */
export const verifyAndRegisterPhone = (req: Request, res: Response) => {
  try {
    const { phone, otp } = req.body;
    if (!phone || !otp) {
      return res.status(400).json({ success: false, error: 'Phone and OTP are required' });
    }

    const verifyResult = verifyOTP(phone, otp);
    if (!verifyResult.success) {
      return res.status(400).json({ success: false, error: verifyResult.message });
    }

    const existingUser = userRepo.findByPhone(phone);
    if (existingUser) {
      return res.status(409).json({ success: false, error: 'Phone number already registered' });
    }

    const customerRole = roleRepo.findByName('CUSTOMER');
    if (!customerRole) {
      return res.status(500).json({ success: false, error: 'Default role not found in database' });
    }

    const mockEmail = `phone_${phone.replace(/\D/g, '')}@demo.com`;
    const newUser = userRepo.create({
      email: mockEmail,
      password_hash: null,
      phone: phone,
      role_id: customerRole.id,
      status: 'ACTIVE'
    });

    const payload: JWTPayload = {
      id: newUser.id,
      email: newUser.email,
      role: customerRole.name as any,
      teamId: newUser.team_id
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    const sanitizedUser: User = {
      id: newUser.id,
      email: newUser.email,
      phone: newUser.phone,
      role: customerRole.name as any,
      teamId: newUser.team_id,
      status: newUser.status,
      createdAt: newUser.created_at,
      updatedAt: newUser.updated_at
    };

    res.status(201).json({ success: true, data: { user: sanitizedUser, accessToken } });
  } catch (error) {
    console.error('Verify & Register OTP error:', error);
    res.status(500).json({ success: false, error: 'Internal server error during OTP registration' });
  }
};

/**
 * @route POST /auth/google/mock
 * @description Simulates a Google OAuth login for the public portal.
 */
export const mockGoogleLogin = async (req: Request, res: Response) => {
  try {
    const { mockCode } = req.body;

    if (!mockCode) {
      return res.status(400).json({ success: false, error: 'Mock OAuth codeis required' });
    }

    // 1. Simulate Google OAuth token exchange and profile fetch
    // In a real app, we would call Google's APIs here. For the demo, we return a deterministic mock profile.
    const mockGoogleProfile = {
      email: 'google.demo@ecom.demo',
      name: 'Demo Google User',
      picture: 'https://via.placeholder.com/150'
    };

    // 2. Check if user already exists
    let dbUser = userRepo.findByEmail(mockGoogleProfile.email);
    
    if (!dbUser) {
      // 3. Get default role (CUSTOMER)
      const customerRole = roleRepo.findByName('CUSTOMER');
      if (!customerRole) {
        return res.status(500).json({ success: false, error: 'Default role not found in database' });
      }

      // 4. Create new user (password_hash is null for OAuth users)
      dbUser = userRepo.create({
        email: mockGoogleProfile.email,
        password_hash: null,
        phone: null,
        role_id: customerRole.id,
        status: 'ACTIVE'
      });
    } else {
      // 5. Verify account status if user already exists
      if (dbUser.status !== 'ACTIVE') {
        return res.status(403).json({ success: false, error: 'Account is inactive or suspended' });
      }
    }

    // 6. Generate Tokens
    const role = roleRepo.findById(dbUser.role_id);
    const payload: JWTPayload = {
      id: dbUser.id,
      email: dbUser.email,
      role: (role?.name || 'CUSTOMER') as any,
      teamId: dbUser.team_id
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    // 7. Set Refresh Token Cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    // 8. Format response
    const sanitizedUser: User = {
      id: dbUser.id,
      email: dbUser.email,
      phone: dbUser.phone,
      role: payload.role,
      teamId: dbUser.team_id,
      status: dbUser.status,
      createdAt: dbUser.created_at,
      updatedAt: dbUser.updated_at
    };

    res.status(200).json({
      success: true,
      data: { 
        user: sanitizedUser, 
        accessToken,
        message: 'Mock Google OAuth successful'
      }
    });
  } catch (error) {
    console.error('Mock Google Login error:', error);
    res.status(500).json({ success: false, error: 'Internal server error during OAuth simulation' });
  }
};

/**
 * @route GET /auth/me
 * @description Returns the current authenticated user's profile.
 */
export const getMe = (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  const dbUser = userRepo.findById(req.user.id);
  if (!dbUser) {
    return res.status(404).json({ success: false, error: 'User not found' });
  }

  const role = roleRepo.findById(dbUser.role_id);
  
  const sanitizedUser: User = {
    id: dbUser.id,
    email: dbUser.email,
    phone: dbUser.phone,
    role: (role?.name || 'CUSTOMER') as any,
    teamId: dbUser.team_id,
    status: dbUser.status,
    createdAt: dbUser.created_at,
    updatedAt: dbUser.updated_at
  };

  res.status(200).json({ success: true, data: sanitizedUser });
};

/**
 * @route POST /auth/refresh
 * @description Rotates refresh token and issues a new access token.
 */
export const refresh = (req: Request, res: Response) => {
  const refreshToken = req.cookies?.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({ success: false, error: 'Refresh token missing' });
  }

  const payload = verifyRefreshToken(refreshToken);
  if (!payload) {
    res.clearCookie('refreshToken', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict' });
    return res.status(401).json({ success: false, error: 'Invalid or expired refresh token' });
  }

  const user = userRepo.findById(payload.id);
  if (!user || user.status !== 'ACTIVE') {
    res.clearCookie('refreshToken', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict' });
    return res.status(401).json({ success: false, error: 'User no longer active' });
  }

  const newAccessToken = generateAccessToken(payload);
  const newRefreshToken = generateRefreshToken(payload);

  res.cookie('refreshToken', newRefreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000
  });

  res.status(200).json({ success: true, data: { accessToken: newAccessToken} });
};

/**
 * @route POST /auth/logout
 * @description Clears the refresh token cookie.
 */
export const logout = (req: Request, res: Response) => {
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  });
  res.status(200).json({ success: true, message: 'Logged out successfully' });
};
```

#### `server/src/routes/auth.routes.ts`
```typescript
/**
 * @file auth.routes.ts
 * @description Express router for all authentication endpoints (Email/Password, Phone OTP, Mock OAuth, Session Management).
 */
import { Router } from 'express';
import { 
  register, 
  login, 
  getMe, 
  refresh, 
  logout, 
  requestPhoneOtp, 
  verifyAndRegisterPhone,
  mockGoogleLogin // <-- Added Mock OAuth endpoint
} from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// ==========================================
// PUBLIC ROUTES (No Authentication Required)
// ==========================================
router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refresh);
router.post('/logout', logout);

// Phone OTP Registration Flow
router.post('/phone/request-otp', requestPhoneOtp);
router.post('/phone/verify-and-register', verifyAndRegisterPhone);

// Mock OAuth Flow
router.post('/google/mock', mockGoogleLogin);

// ==========================================
// PROTECTED ROUTES (Authentication Required)
// ==========================================
router.get('/me', authenticate, getMe);

export default router;
```
</details>

---

### Sub-Phase 4.5: Implement Mock OTP System (Email + SMS Simulation)
**Objective:** Simulate OTP delivery for the demo without external API dependencies.
**Actions Taken:**
- Created `server/src/services/otp.service.ts` using an in-memory `Map` with TTL and attempt limiting.
- Logs formatted messages to the server console (e.g., `[MOCK SMS] OTP for +1234567890 is 849201`).
**Verification:** Triggered OTP request and observed the exact formatted string in the `npm run dev` terminal output.

<details>
<summary>📂 Click to expand: File Placeholders for Sub-Phase 4.5</summary>

#### `server/src/services/otp.service.ts`
```typescript
/**
 * @file otp.service.ts
 * @description Mock OTP generation, storage, and verification service.
 * @systemic_role Simulates SMS/Email OTP delivery for the demo while enforcing 
 * security best practices like TTL expiration and rate limiting (max attempts).
 */

interface OTPRecord {
  code: string;
  expiresAt: number;
  attempts: number;
}

// In-memory store for demo purposes. (In production, use Redis with TTL).
const otpStore = new Map<string, OTPRecord>();

const OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
const MAX_ATTEMPTS = 3;

/**
 * Generates a cryptographically secure 6-digit numeric OTP.
 */
export const generateOTP = (): string => {
  // Using crypto for better randomness than Math.random()
  const buffer = new Uint8Array(4);
  crypto.getRandomValues(buffer);
  const num = new DataView(buffer.buffer).getUint32(0, false);
  return (num % 900000 + 100000).toString();
};

/**
 * Requests an OTP for a given identifier (phone or email).
 */
export const requestOTP = (identifier: string, type: 'PHONE' | 'EMAIL'): { success: boolean; message: string } => {
  const code = generateOTP();
  const expiresAt = Date.now() + OTP_EXPIRY_MS;
  
  // Overwrite any existing OTP for this identifier to prevent spam
  otpStore.set(identifier, { code, expiresAt, attempts: 0 });
  
  if (type === 'PHONE') {
    console.log(`\n📱 [MOCK SMS] OTP for ${identifier} is: ${code}\n`);
  } else {
    console.log(`\n📧 [MOCK EMAIL] OTP for ${identifier} is: ${code}\n`);
  }
  
  return { success: true, message: 'OTP sent successfully (check server console)' };
};

/**
 * Verifies the provided OTP against the stored record.
 */
export const verifyOTP = (identifier: string, code: string): { success: boolean; message: string } => {
  const record = otpStore.get(identifier);
  
  if (!record) {
    return { success: false, message: 'Invalid or expired OTP' };
  }
  
  if (Date.now() > record.expiresAt) {
    otpStore.delete(identifier);
    return { success: false, message: 'OTP has expired' };
  }
  
  if (record.attempts >= MAX_ATTEMPTS) {
    otpStore.delete(identifier);
    return { success: false, message: 'Too many failed attempts. Please request a new OTP.' };
  }
  
  if (record.code !== code) {
    record.attempts += 1;
    otpStore.set(identifier, record);
    return { success: false, message: 'Invalid OTP code' };
  }
  
  // Success: consume the OTP by deleting it
  otpStore.delete(identifier);
  return { success: true, message: 'OTP verified successfully' };
};
```
</details>

---

### Sub-Phase 4.6: Implement Phone OTP Registration (Public Portal)
**Objective:** Allow public users to register via phone number and OTP.
**Actions Taken:**
- Added `POST /auth/phone/request-otp` and `POST /auth/phone/verify-and-register` to `auth.controller.ts`.
- Generates a deterministic mock email (e.g., `phone_15550001111@demo.com`) to satisfy DB constraints while keeping `password_hash` null.
**Verification:** Successfully registered a new `CUSTOMER` via OTP and received valid JWTs.

*(No new files created; updates applied to `auth.controller.ts` and `auth.routes.ts` above).*

---

### Sub-Phase 4.7: Implement Mock Gmail OAuth Flow (Public Portal)
**Objective:** Simulate Google OAuth for a self-contained demo.
**Actions Taken:**
- Added `POST /auth/google/mock` endpoint to `auth.controller.ts`.
- Accepts a `mockCode`, returns a simulated Google profile, and creates/links a `CUSTOMER` account.
**Verification:** 
```bash
curl -X POST http://localhost:3001/auth/google/mock -H "Content-Type: application/json" -d '{"mockCode":"test-code"}'
```
Returned `200 OK` with user data and JWT.

*(Updates applied to `auth.controller.ts` and `auth.routes.ts` above).*

---

### Sub-Phase 4.8: Implement Super Admin User Management CRUD
**Objective:** Allow Super Admins to manage employees, roles, and teams.
**Actions Taken:**
- Created `server/src/controllers/admin.controller.ts` with `getAllUsers`, `createUser`, `updateUser`, and `deleteUser` (soft delete via status).
- Created `server/src/routes/admin.routes.ts` protected by `authenticate` and `authorize(['SUPER_ADMIN'])`.
**Verification:** `curl` request to `/admin/users` with a valid Super Admin token returned the full user list with joined role/team details.

<details>
<summary>📂 Click to expand: File Placeholders for Sub-Phase 4.8</summary>

#### `server/src/controllers/admin.controller.ts`
```typescript
/**
 * @file admin.controller.ts
 * @description Super Admin User Management Controller.
 * @systemic_role Handles CRUD operations for all users, allowing Super Admins to 
 * manage employees, assign roles/teams, and deactivate accounts.
 */
import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import path from 'path';
import Database from 'better-sqlite3';
import { UserRepository, UserStatus } from '../repositories/UserRepo';
import { RoleRepository } from '../repositories/RoleRepo';
import { TeamRepository } from '../repositories/TeamRepo';

const dbPath = path.resolve(__dirname, '../../../db/ecommerce.db');
const db = new Database(dbPath, { fileMustExist: true });

const userRepo = new UserRepository(db);
const roleRepo = new RoleRepository(db);
const teamRepo = new TeamRepository(db);

const SALT_ROUNDS = 10;

/**
 * @route GET /admin/users
 * @description Retrieves a list of all users with their role and team details.
 */
export const getAllUsers = (req: Request, res: Response) => {
  try {
    const users = userRepo.findAll();
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ success: false, error: 'Internal server error retrieving users' });
  }
};

/**
 * @route POST /admin/users
 * @description Creates a new employee user (Team Lead or Staff).
 */
export const createUser = async (req: Request, res: Response) => {
  try {
    const { email, password, role_id, team_id, status } = req.body;

    if (!email || !password || !role_id) {
      return res.status(400).json({ success: false, error: 'Email, password, and role_id are required' });
    }

    const existingUser = userRepo.findByEmail(email);
    if (existingUser) {
      return res.status(409).json({ success: false, error: 'Email already registered' });
    }

    const role = roleRepo.findById(role_id);
    if (!role) {
      return res.status(400).json({ success: false, error: 'Invalid role_id' });
    }

    if (team_id) {
      const team = teamRepo.findById(team_id);
      if (!team) {
        return res.status(400).json({ success: false, error: 'Invalid team_id' });
      }
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const newUser = userRepo.create({
      email,
      password_hash: passwordHash,
      role_id,
      team_id: team_id || null,
      status: (status as UserStatus) || 'ACTIVE'
    });

    const userWithDetails = userRepo.findById(newUser.id);
    res.status(201).json({ success: true, data: userWithDetails });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ success: false, error: 'Internal server error creating user' });
  }
};

/**
 * @route PUT /admin/users/:id
 * @description Updates an existing user's role, team, or status.
 */
export const updateUser = (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { role_id, team_id, status } = req.body;

    const existingUser = userRepo.findById(id);
    if (!existingUser) {
      return res.status(404).json({ success: false, error: 'User not found'});
    }

    if (role_id) {
      const role = roleRepo.findById(role_id);
      if (!role) {
        return res.status(400).json({ success: false, error: 'Invalid role_id' });
      }
      userRepo.updateRole(id, role_id);
    }

    if (team_id !== undefined) {
      if (team_id !== null) {
        const team = teamRepo.findById(team_id);
        if (!team) {
          return res.status(400).json({ success: false, error: 'Invalid team_id' });
        }
      }
      userRepo.updateTeam(id, team_id);
    }

    if (status) {
      if (!['ACTIVE', 'INACTIVE', 'SUSPENDED'].includes(status)) {
        return res.status(400).json({ success: false, error: 'Invalid status' });
      }
      userRepo.updateStatus(id, status as UserStatus);
    }

    const updatedUser = userRepo.findById(id);
    res.status(200).json({ success: true, data: updatedUser });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ success: false, error: 'Internal server error updating user' });
  }
};

/**
 * @route DELETE /admin/users/:id
 * @description Soft-deletes a user by setting their status to INACTIVE.
 */
export const deleteUser = (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const existingUser = userRepo.findById(id);
    
    if (!existingUser) {
      return res.status(404).json({ success: false, error: 'User not found'});
    }

    // Soft delete to prevent foreign key constraint issues and allow reactivation
    userRepo.updateStatus(id, 'INACTIVE');
    
    res.status(200).json({ success: true, message: 'User deactivated successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ success: false, error: 'Internal server error deactivating user' });
  }
};
```

#### `server/src/routes/admin.routes.ts`
```typescript
/**
 * @file admin.routes.ts
 * @description Express router for Super Admin User Management endpoints.
 */
import { Router } from 'express';
import { 
  getAllUsers, 
  createUser, 
  updateUser, 
  deleteUser 
} from '../controllers/admin.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

// All admin routes require authentication AND SUPER_ADMIN role
router.use(authenticate);
router.use(authorize(['SUPER_ADMIN']));

router.get('/', getAllUsers);
router.post('/', createUser);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);

export default router;
```
</details>

---

### Sub-Phase 4.9: Create Auth Context & Protected Route HOC on Client
**Objective:** Manage auth state, auto-refresh tokens, and guard client-side routes.
**Actions Taken:**
- Created `client/src/context/AuthContext.tsx` for global state (`user`, `isLoading`, `login`, `logout`).
- Created `client/src/services/api.ts` with Axios interceptors to attach `Authorization` headers and automatically call `/auth/refresh` on `401 Unauthorized`.
- Created `client/src/components/ProtectedRoute.tsx` to redirect unauthenticated users to `/login` and enforce role checks.
**Verification:** Navigating to a protected route while logged out instantly redirected to `/login`. Expired access tokens were silently refreshed without user interruption.

<details>
<summary>📂 Click to expand: File Placeholders for Sub-Phase 4.9</summary>

#### `client/src/context/AuthContext.tsx`
```typescript
/**
 * @file AuthContext.tsx
 * @description React Context for managing global authentication state.
 * @systemic_role Provides user data, loading states, and auth actions (login, logout, checkAuth) 
 * to the entire component tree, preventing prop-drilling.
 */
import React, { createContext, useContext, useState, useEffect, ReactNode }from 'react';
import api from '../services/api';

export type UserRole = 'SUPER_ADMIN' | 'TEAM_LEAD' | 'STAFF' | 'CUSTOMER';
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

export interface User {
  id: string;
  email: string;
  phone: string | null;
  role: UserRole;
  teamId: string | null;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Verify session on initial mount
  const checkAuth = async () => {
    try {
      const response = await api.get('/auth/me');
      setUser(response.data.data);
    } catch (error) {
      // If /me fails, the interceptor will handle redirecting to /login
      setUser(null);
      localStorage.removeItem('accessToken');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    const { accessToken, user: userData } = response.data.data;
    
    localStorage.setItem('accessToken', accessToken);
    setUser(userData);
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout API error:', error);
    } finally {
      // Always clear local state regardless of API success
      localStorage.removeItem('accessToken');
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook for easy consumption of the context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
```

#### `client/src/services/api.ts`
```typescript
/**
 * @file api.ts
 * @description Configured Axios instance with automatic token attachment and refresh logic.
 * @systemic_role Centralizes API calls, ensuring the Access Token is always sent, 
 * and seamlessly recovering from 401 errors by rotating the Refresh Token.
 */
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // CRITICAL: Allows the browser to send the httpOnly refreshToken cookie
});

// Request Interceptor: Attach Access Token to all outgoing requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle 401 Unauthorized by attempting token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If the error is 401 and we haven't already tried to refresh the token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Call the refresh endpoint (cookie will be sent automatically dueto withCredentials)
        const refreshResponse = await axios.post(
          `${API_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );

        const newAccessToken = refreshResponse.data.data.accessToken;
        
        // Save the new token and update the original request's headers
        localStorage.setItem('accessToken', newAccessToken);
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        // Retry the original request with the new token
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed (e.g., refresh token expired or user deactivated)
        // Clear local state and redirect to login
        localStorage.removeItem('accessToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
```

#### `client/src/components/ProtectedRoute.tsx`
```typescript
/**
 * @file ProtectedRoute.tsx
 * @description Higher-Order Component to guard client-side routes.
 * @systemic_role Prevents unauthenticated access and enforces Role-Based Access Control (RBAC) 
 * on the frontend, redirecting users appropriately based on their auth state.
 */
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[]; // Optional: Restrict to specific roles (e.g., ['SUPER_ADMIN'])
}

export const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  // 1. Show loading state while checking initial auth status
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-lg font-semibold text-gray-600">Loading application...</div>
      </div>
    );
  }

  // 2. Redirect to login if not authenticated
  if (!isAuthenticated) {
    // Save the attempted URL so we can redirect back after successful login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 3. Enforce Role-Based Access Control if allowedRoles is specified
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // 4. User is authenticated and authorized; render the protected component
  return <>{children}</>;
};
```
</details>

---

## 🖥️ Phase 4 Final Verification Checklist
Run these manual tests to confirm the entire authentication lifecycle is operational:

- [x] **1. Email/Password Registration & Login:** 
  `curl -X POST http://localhost:3001/auth/register -d '{"email":"admin@ecom.demo","password":"password123"}' -H "Content-Type: application/json"`
- [x] **2. Token Refresh Mechanism:** 
  Wait for access token to expire (or manually invalidate), then call `curl -X POST http://localhost:3001/auth/refresh -b cookies.txt`. Verify a new `accessToken` is returned and the `refreshToken` cookie is updated.
- [x] **3. RBAC Blocking:** 
  Attempt to access `http://localhost:3001/admin/users` using a `CUSTOMER` access token. Verify `403 Forbidden` response.
- [x] **4. Mock OTP Console Output:** 
  Call `POST /auth/phone/request-otp` and verify the `[MOCK SMS]` log appears in the server terminal.
- [x] **5. Client-Side Auto-Redirects:** 
  Open `http://localhost:5173/admin` in Chrome without logging in. Verify immediate redirect to `http://localhost:5173/login`.

---