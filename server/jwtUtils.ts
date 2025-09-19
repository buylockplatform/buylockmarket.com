import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'buylock-jwt-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d'; // 7 days
const REFRESH_TOKEN_EXPIRES_IN = '30d'; // 30 days

export interface JWTPayload {
  userId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  type: 'access' | 'refresh';
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

/**
 * Generate JWT access and refresh tokens for a user
 */
export function generateTokens(user: {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
}): TokenPair {
  const accessPayload: JWTPayload = {
    userId: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    type: 'access'
  };

  const refreshPayload: JWTPayload = {
    userId: user.id,
    email: user.email,
    type: 'refresh'
  };

  const accessToken = jwt.sign(accessPayload, JWT_SECRET, { 
    expiresIn: JWT_EXPIRES_IN,
    issuer: 'buylock-api',
    audience: 'buylock-client'
  });

  const refreshToken = jwt.sign(refreshPayload, JWT_SECRET, { 
    expiresIn: REFRESH_TOKEN_EXPIRES_IN,
    issuer: 'buylock-api',
    audience: 'buylock-client'
  });

  // Convert 7d to seconds for frontend
  const expiresIn = 7 * 24 * 60 * 60; // 7 days in seconds

  return {
    accessToken,
    refreshToken,
    expiresIn
  };
}

/**
 * Verify and decode a JWT token
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'buylock-api',
      audience: 'buylock-client'
    }) as JWTPayload;

    return decoded;
  } catch (error: any) {
    console.error('JWT verification failed:', error.message);
    return null;
  }
}

/**
 * Extract bearer token from Authorization header
 */
export function extractBearerToken(authHeader: string | undefined): string | null {
  if (!authHeader) return null;
  
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null;
  
  return parts[1];
}

/**
 * Check if client wants token-based authentication
 * This is determined by the presence of 'X-Auth-Type: token' header
 */
export function wantsTokenAuth(req: any): boolean {
  return req.headers['x-auth-type'] === 'token' || 
         req.headers['x-auth-type'] === 'bearer' ||
         req.query.auth_type === 'token';
}

/**
 * Refresh an access token using a refresh token
 */
export function refreshAccessToken(refreshToken: string): { accessToken: string; expiresIn: number } | null {
  try {
    const decoded = verifyToken(refreshToken);
    
    if (!decoded || decoded.type !== 'refresh') {
      return null;
    }

    // Generate new access token
    const accessPayload: JWTPayload = {
      userId: decoded.userId,
      email: decoded.email,
      firstName: decoded.firstName,
      lastName: decoded.lastName,
      type: 'access'
    };

    const accessToken = jwt.sign(accessPayload, JWT_SECRET, { 
      expiresIn: JWT_EXPIRES_IN,
      issuer: 'buylock-api',
      audience: 'buylock-client'
    });

    const expiresIn = 7 * 24 * 60 * 60; // 7 days in seconds

    return {
      accessToken,
      expiresIn
    };
  } catch (error: any) {
    console.error('Token refresh failed:', error.message);
    return null;
  }
}