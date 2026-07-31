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