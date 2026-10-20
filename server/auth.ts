import crypto from 'crypto';
import { User } from './db.js';

export interface PasswordValidationResult {
  valid: boolean;
  errors: string[];
  strength: 'Weak' | 'Medium' | 'Strong';
  score: number; // 0 to 4
}

/**
 * Validates password against requirements:
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 */
export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = [];
  if (!password || password.length < 8) {
    errors.push('Password must be at least 8 characters long.');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must include at least one uppercase letter.');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must include at least one lowercase letter.');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must include at least one number.');
  }

  // Calculate strength score
  let score = 0;
  if (password && password.length >= 8) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (password && password.length >= 12 && /[^A-Za-z0-9]/.test(password)) score++;

  let strength: 'Weak' | 'Medium' | 'Strong' = 'Weak';
  if (score >= 4) {
    strength = 'Strong';
  } else if (score >= 3 && errors.length === 0) {
    strength = 'Medium';
  } else {
    strength = 'Weak';
  }

  return {
    valid: errors.length === 0,
    errors,
    strength,
    score,
  };
}

/**
 * Hashes password with random salt using PBKDF2
 */
export function hashPassword(password: string): { hash: string; salt: string } {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return { hash, salt };
}

/**
 * Verifies a password against hash and salt
 */
export function verifyPassword(password: string, storedHash: string, salt: string): boolean {
  if (!password || !storedHash || !salt) return false;
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(storedHash));
}

/**
 * Generates cryptographically secure session or reset token
 */
export function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Generates 6-digit numeric verification code
 */
export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Strips sensitive fields before returning user object
 */
export function sanitizeUser(user: User): Partial<User> {
  const safe = { ...user };
  delete (safe as any).passwordHash;
  delete (safe as any).passwordSalt;
  delete (safe as any).verificationCode;
  delete (safe as any).resetToken;
  return safe;
}

export interface PhoneValidationResult {
  valid: boolean;
  error?: string;
  countryCode: string;
  digitsOnly: string;
  international: string;
}

/**
 * Validates and normalizes phone number according to country code standards (e.g. India +91 10 digits 6-9, ITU-T E.164)
 */
export function validatePhoneNumber(countryCode: string, phoneNumber: string): PhoneValidationResult {
  if (!countryCode || !countryCode.trim()) {
    countryCode = '+91';
  }
  const cleanCode = countryCode.trim().startsWith('+') ? countryCode.trim() : `+${countryCode.trim()}`;
  const rawNumber = (phoneNumber || '').trim();
  const digitsOnly = rawNumber.replace(/\D/g, '');

  if (!digitsOnly) {
    return {
      valid: false,
      error: 'Mobile number is required.',
      countryCode: cleanCode,
      digitsOnly: '',
      international: '',
    };
  }

  // India (+91) validation rules: exactly 10 digits starting with 6, 7, 8, or 9
  if (cleanCode === '+91') {
    if (digitsOnly.length !== 10) {
      return {
        valid: false,
        error: 'Indian mobile number must be exactly 10 digits.',
        countryCode: cleanCode,
        digitsOnly,
        international: `${cleanCode}${digitsOnly}`,
      };
    }
    if (!/^[6-9]/.test(digitsOnly)) {
      return {
        valid: false,
        error: 'Indian mobile number must start with 6, 7, 8, or 9.',
        countryCode: cleanCode,
        digitsOnly,
        international: `${cleanCode}${digitsOnly}`,
      };
    }
  } else {
    // International numbers: 7 to 15 digits as per ITU-T E.164
    if (digitsOnly.length < 7 || digitsOnly.length > 15) {
      return {
        valid: false,
        error: 'Mobile number must be between 7 and 15 digits for international format.',
        countryCode: cleanCode,
        digitsOnly,
        international: `${cleanCode}${digitsOnly}`,
      };
    }
  }

  return {
    valid: true,
    countryCode: cleanCode,
    digitsOnly,
    international: `${cleanCode}${digitsOnly}`,
  };
}

