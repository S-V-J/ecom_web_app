/**
 * @file auth.middleware.ts
 * @description Express middleware for JWT authentication and Role-Based Access Control (RBAC).
 * @systemic_role Protects routes by validating tokens, seamlessly rotating expired access tokens, 
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