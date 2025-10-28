import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is not defined');
}

export interface JWTPayload {
  userId: number
  username: string
  role: string
  iat?: number
  exp?: number
}

export const jwtConfig = {
  algorithm: 'HS256' as const,
  expiresIn: '1h',
  issuer: 'CURACADET',
  audience: 'web-app'
};

export function verifyToken(token: string): JWTPayload | null {
  const secrets = [
    process.env.JWT_SECRET,
    process.env.PREV_JWT_SECRET || ''
  ].filter(Boolean);

  for (const secret of secrets) {
    try {
      const decoded = jwt.verify(token, secret as string, { algorithms: [jwtConfig.algorithm] }) as unknown as JWTPayload;
      return decoded;
    } catch (error) {
      // Try next secret
    }
  }
  console.error('JWT verification failed with all secrets');
  return null;
}

export function getTokenFromRequest(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization')
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7)
  }
  return null
}

export function createAuthMiddleware(requiredRoles: string[] = []) {
  return function authMiddleware(request: NextRequest) {
    const token = getTokenFromRequest(request)

    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      )
    }

    // Check role permissions if required
    if (requiredRoles.length > 0 && !requiredRoles.includes(payload.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // Add user info to request for use in route handlers
    const requestWithUser = request as NextRequest & { user: JWTPayload }
    requestWithUser.user = payload

    return null // Continue to route handler
  }
}
