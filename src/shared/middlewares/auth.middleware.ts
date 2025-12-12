/**
 * Auth Middleware - JWT Token Verification
 *
 * Security features:
 * - Bearer token extraction (header or httpOnly cookie)
 * - JWT verification with issuer/audience validation
 * - User status verification
 * - Request context enrichment
 */

import { Elysia } from 'elysia'
import { User, type IUser } from '@/modules/users/user.model'
import { authService } from '@/modules/auth/auth.service'
import { UnauthorizedError, ForbiddenError } from '@/shared/errors'
import {
  getTokenFromCookies,
  ACCESS_TOKEN_COOKIE,
} from '@/shared/utils'

// =============================================================================
// Types
// =============================================================================

export interface AuthContext {
  user: IUser
  userId: string
  userRole: string
  isAdmin: boolean
}

// =============================================================================
// Helper: Extract Bearer Token
// =============================================================================

function extractBearerTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader) return null
  const parts = authHeader.split(' ')
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
    return null
  }
  return parts[1]
}

// =============================================================================
// Helper: Get Auth Context from Request
// =============================================================================

async function getAuthFromRequest(request: Request): Promise<AuthContext | null> {
  // Try to get token from:
  // 1. Authorization header (Bearer token)
  // 2. httpOnly cookie (more secure)
  const authHeader = request.headers.get('authorization')
  const tokenFromHeader = extractBearerTokenFromHeader(authHeader)
  
  const cookieHeader = request.headers.get('cookie')
  const tokenFromCookie = getTokenFromCookies(cookieHeader, ACCESS_TOKEN_COOKIE)
  
  const token = tokenFromHeader || tokenFromCookie

  // If no token found, return null (unauthenticated)
  if (!token) {
    return null
  }

  try {
    // Verify the access token
    const payload = await authService.verifyAccessToken(token)

    // Find the user and verify they still exist and are active
    const user = await User.findById(payload.sub)

    if (!user) {
      return null
    }

    // Check user status
    if (user.status !== 'active') {
      return null
    }

    // Return auth context
    return {
      user,
      userId: user._id.toString(),
      userRole: user.role,
      isAdmin: user.role === 'admin',
    }
  } catch (error) {
    // Token verification failed
    return null
  }
}

// =============================================================================
// Auth Middleware Plugin (optional auth - doesn't throw)
// =============================================================================

/**
 * Optional auth middleware - populates auth context if token present
 * Does NOT throw if unauthenticated
 */
export const authMiddleware = new Elysia({ name: 'auth-middleware' })
  .derive({ as: 'scoped' }, async ({ request }): Promise<{ auth: AuthContext | null }> => {
    const auth = await getAuthFromRequest(request)
    return { auth }
  })

// =============================================================================
// Guard Decorators
// =============================================================================

/**
 * Require authentication - throws if not authenticated
 * This is a STANDALONE middleware that extracts and validates auth
 */
export const requireAuth = new Elysia({ name: 'require-auth' })
  .derive({ as: 'scoped' }, async ({ request }): Promise<{ auth: AuthContext }> => {
    const auth = await getAuthFromRequest(request)
    
    if (!auth) {
      throw new UnauthorizedError('Autenticação necessária')
    }
    
    return { auth }
  })

/**
 * Require admin role - throws if not admin
 */
export const requireAdmin = new Elysia({ name: 'require-admin' })
  .derive({ as: 'scoped' }, async ({ request }): Promise<{ auth: AuthContext }> => {
    const auth = await getAuthFromRequest(request)
    
    if (!auth) {
      throw new UnauthorizedError('Autenticação necessária')
    }
    
    if (!auth.isAdmin) {
      throw new ForbiddenError('Acesso restrito a administradores')
    }
    
    return { auth }
  })

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Extract device info from request
 */
export function getDeviceInfo(request: Request) {
  return {
    ip: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        request.headers.get('x-real-ip') ||
        'unknown',
    userAgent: request.headers.get('user-agent') || undefined,
  }
}

/**
 * Extract bearer token from Authorization header
 */
export function extractBearerToken(authHeader: string | null): string | null {
  if (!authHeader) return null

  const parts = authHeader.split(' ')
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
    return null
  }

  return parts[1]
}
