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