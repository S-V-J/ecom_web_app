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