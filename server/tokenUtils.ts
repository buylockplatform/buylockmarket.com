import crypto from 'crypto';

/**
 * Generate a secure, URL-safe token for public order access
 * Uses 128-bit random data encoded as base64url (~22 characters)
 */
export function generatePublicToken(): string {
  return crypto.randomBytes(16).toString('base64url');
}

/**
 * Check if a public token has expired
 */
export function isTokenExpired(expiresAt: Date | null): boolean {
  if (!expiresAt) return false; // No expiration set
  return new Date() > expiresAt;
}

/**
 * Create expiration date for new tokens (90 days from now)
 */
export function getTokenExpiration(): Date {
  const expiration = new Date();
  expiration.setDate(expiration.getDate() + 90);
  return expiration;
}