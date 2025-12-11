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
import { bearer } from '@elysiajs/bearer'
import { User, type IUser } from '@/modules/users/user.model'
import { authService, type JWTPayload } from '@/modules/auth/auth.service'
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
// Auth Middleware Plugin
// =============================================================================

/**
 * Creates the auth middleware plugin
 * Adds bearer token handling and user verification
 * 
 * SECURITY: Supports both:
 * 1. Authorization: Bearer <token> header
 * 2. httpOnly cookie (preferred, XSS-safe)
 */
export const authMiddleware = new Elysia({ name: 'auth-middleware' })
  .use(bearer())
  .derive({ as: 'scoped' }, async ({ bearer, request }): Promise<{ auth: AuthContext | null }> => {
    // Try to get token from:
    // 1. Bearer header (backward compatibility)
    // 2. httpOnly cookie (more secure)
    const cookieHeader = request.headers.get('cookie')
    const tokenFromCookie = getTokenFromCookies(cookieHeader, ACCESS_TOKEN_COOKIE)
    const token = bearer || tokenFromCookie

    // If no token found, return null (unauthenticated)
    if (!token) {
      return { auth: null }
    }

    try {
      // Verify the access token
      const payload = await authService.verifyAccessToken(token)

      // Find the user and verify they still exist and are active
      const user = await User.findById(payload.sub)

      if (!user) {
        return { auth: null }
      }

      // Check user status
      if (user.status !== 'active') {
        return { auth: null }
      }

      // Return auth context
      return {
        auth: {
          user,
          userId: user._id.toString(),
          userRole: user.role,
          isAdmin: user.role === 'admin',
        },
      }
    } catch (error) {
      // Token verification failed
      return { auth: null }
    }
  })

// =============================================================================
// Guard Decorators
// =============================================================================

/**
 * Require authentication - throws if not authenticated
 */
export const requireAuth = new Elysia({ name: 'require-auth' })
  .use(authMiddleware)
  .derive({ as: 'scoped' }, ({ auth }) => {
    if (!auth) {
      throw new UnauthorizedError('Autenticação necessária')
    }
    return { auth: auth as AuthContext }
  })

/**
 * Require admin role - throws if not admin
 */
export const requireAdmin = new Elysia({ name: 'require-admin' })
  .use(requireAuth)
  .derive({ as: 'scoped' }, ({ auth }) => {
    if (!auth || !auth.isAdmin) {
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
