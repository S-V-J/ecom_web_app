/**
 * @file jwt.ts
 * @description Utility functions for JWT token generation and validation.
 * @systemic_role Centralizes all token logic to ensure consistent security practices across the application.
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