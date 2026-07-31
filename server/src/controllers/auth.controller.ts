/**
 * @file auth.controller.ts
 * @description Core authentication endpoints: email/password register/login, phone OTP, mock OAuth, me, and refresh.
 * @systemic_role Handles user credential validation, password hashing, OTP verification, OAuth simulation, and JWT issuance.
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
      return res.status(400).json({ success: false, error: 'Phone number is required' });
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
      return res.status(400).json({ success: false, error: 'Mock OAuth code is required' });
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

  res.status(200).json({ success: true, data: { accessToken: newAccessToken } });
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