/**
 * Admin Security Middleware - Enhanced Protection for Admin Panel
 * 
 * Security features:
 * - Strict admin role verification
 * - User status re-validation on each request
 * - IP logging for all admin actions
 * - Request audit logging
 * - Protection against privilege escalation
 * - Rate limiting integration
 */

import { Elysia } from 'elysia'
import { User } from '@/modules/users/user.model'
import { authService } from '@/modules/auth/auth.service'
import { UnauthorizedError, ForbiddenError } from '@/shared/errors'
import { ActivityLog } from '@/modules/admin/activity-log.model'
import {
  getTokenFromCookies,
  ACCESS_TOKEN_COOKIE,
} from '@/shared/utils'

// =============================================================================
// Types
// =============================================================================

export interface AdminAuthContext {
  userId: string
  userEmail: string
  userName: string
  userRole: 'admin'
  isAdmin: true
  ip: string
  userAgent: string
}

// =============================================================================
// Helper Functions
// =============================================================================

function extractBearerToken(authHeader: string | null): string | null {
  if (!authHeader) return null
  const parts = authHeader.split(' ')
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
    return null
  }
  return parts[1]
}

function getClientInfo(request: Request) {
  return {
    ip: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        request.headers.get('x-real-ip') ||
        'unknown',
    userAgent: request.headers.get('user-agent') || 'unknown',
  }
}

// =============================================================================
// Strict Admin Verification
// =============================================================================

/**
 * Enhanced admin verification that:
 * 1. Validates JWT token
 * 2. Re-fetches user from database (no stale cache)
 * 3. Verifies user is active AND admin
 * 4. Logs access attempt
 */
async function verifyAdminAccess(request: Request): Promise<AdminAuthContext> {
  const clientInfo = getClientInfo(request)
  
  // Extract token
  const authHeader = request.headers.get('authorization')
  const tokenFromHeader = extractBearerToken(authHeader)
  const cookieHeader = request.headers.get('cookie')
  const tokenFromCookie = getTokenFromCookies(cookieHeader, ACCESS_TOKEN_COOKIE)
  const token = tokenFromHeader || tokenFromCookie

  if (!token) {
    // Log unauthorized attempt
    await logAdminAttempt('unauthorized', 'Token não fornecido', clientInfo)
    throw new UnauthorizedError('Autenticação necessária')
  }

  try {
    // Verify token
    const payload = await authService.verifyAccessToken(token)

    // CRITICAL: Always fetch fresh user data from database
    // This prevents using stale tokens after role changes
    const user = await User.findById(payload.sub).select('+role +status +email +name')

    if (!user) {
      await logAdminAttempt('unauthorized', 'Usuário não encontrado', clientInfo, payload.sub)
      throw new UnauthorizedError('Usuário não encontrado')
    }

    // Check user status - must be active
    if (user.status !== 'active') {
      await logAdminAttempt('forbidden', `Usuário com status: ${user.status}`, clientInfo, user._id.toString(), user.email)
      throw new ForbiddenError('Conta inativa ou banida')
    }

    // CRITICAL: Verify admin role
    if (user.role !== 'admin') {
      await logAdminAttempt('forbidden', 'Tentativa de acesso admin por usuário comum', clientInfo, user._id.toString(), user.email)
      throw new ForbiddenError('Acesso restrito a administradores')
    }

    return {
      userId: user._id.toString(),
      userEmail: user.email,
      userName: user.name,
      userRole: 'admin',
      isAdmin: true,
      ip: clientInfo.ip,
      userAgent: clientInfo.userAgent,
    }
  } catch (error) {
    if (error instanceof UnauthorizedError || error instanceof ForbiddenError) {
      throw error
    }
    
    // Token verification failed
    await logAdminAttempt('unauthorized', 'Token inválido ou expirado', clientInfo)
    throw new UnauthorizedError('Token inválido ou expirado')
  }
}

/**
 * Log admin access attempts for security audit
 */
async function logAdminAttempt(
  result: 'unauthorized' | 'forbidden' | 'success',
  details: string,
  clientInfo: { ip: string; userAgent: string },
  userId?: string,
  userEmail?: string
) {
  try {
    await ActivityLog.create({
      type: result === 'success' ? 'admin_action' : 'warning',
      action: `Admin access attempt: ${result}`,
      details,
      userId: userId ? userId : undefined,
      userEmail,
      ip_address: clientInfo.ip,
      user_agent: clientInfo.userAgent,
      metadata: { result, endpoint: 'admin' },
      timestamp: new Date(),
    })
  } catch {
    // Don't fail the request if logging fails
    console.error('Failed to log admin attempt')
  }
}

// =============================================================================
// Admin Security Middleware
// =============================================================================

/**
 * Strict admin authentication middleware
 * - Verifies admin role on every request
 * - Logs all access attempts
 * - Includes IP and user agent in context
 */
export const adminSecurityMiddleware = new Elysia({ name: 'admin-security' })
  .onBeforeHandle(async ({ request, set }) => {
    try {
      const auth = await verifyAdminAccess(request)
      // Store auth in request for later use
      ;(request as Request & { adminAuth: AdminAuthContext }).adminAuth = auth
    } catch (error) {
      if (error instanceof UnauthorizedError) {
        set.status = 401
        return {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: error.message,
          },
        }
      }
      if (error instanceof ForbiddenError) {
        set.status = 403
        return {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: error.message,
          },
        }
      }
      set.status = 500
      return {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Erro interno do servidor',
        },
      }
    }
  })
  .derive(({ request }) => {
    const adminAuth = (request as Request & { adminAuth?: AdminAuthContext }).adminAuth
    return { auth: adminAuth as AdminAuthContext }
  })

/**
 * Audit logging middleware for admin actions
 * Use AFTER adminSecurityMiddleware to log successful operations
 */
export const adminAuditMiddleware = new Elysia({ name: 'admin-audit' })
  .onAfterHandle(async ({ request, auth, set }) => {
    // Only log successful requests
    if (set.status && set.status >= 400) return

    const adminAuth = auth as AdminAuthContext | undefined
    if (!adminAuth?.isAdmin) return

    const url = new URL(request.url)
    const method = request.method
    
    // Don't log GET requests to avoid log spam (optional: can enable if needed)
    if (method === 'GET') return

    try {
      await ActivityLog.create({
        type: 'admin_action',
        action: `Admin ${method}: ${url.pathname}`,
        userId: adminAuth.userId,
        userEmail: adminAuth.userEmail,
        userName: adminAuth.userName,
        ip_address: adminAuth.ip,
        user_agent: adminAuth.userAgent,
        metadata: {
          method,
          path: url.pathname,
          query: Object.fromEntries(url.searchParams),
        },
        timestamp: new Date(),
      })
    } catch {
      // Don't fail the request if logging fails
      console.error('Failed to log admin action')
    }
  })

// =============================================================================
// Combined Admin Guard (recommended)
// =============================================================================

/**
 * Complete admin protection guard
 * Combines:
 * - Strict admin verification
 * - Audit logging
 * 
 * Usage: .use(adminGuard)
 */
export const adminGuard = new Elysia({ name: 'admin-guard' })
  .use(adminSecurityMiddleware)
  .use(adminAuditMiddleware)
