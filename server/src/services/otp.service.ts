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