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