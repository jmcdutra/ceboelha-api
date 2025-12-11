/**
 * Auth Controller - Elysia Routes
 *
 * Endpoints:
 * - POST /auth/register - Create new account
 * - POST /auth/login - Authenticate user
 * - POST /auth/refresh - Refresh access token
 * - POST /auth/logout - Logout (revoke tokens)
 * - GET /auth/sessions - Get active sessions
 * - DELETE /auth/sessions/:id - Revoke specific session
 *
 * Security:
 * - Rate limiting on all endpoints
 * - Strict input validation
 * - Device tracking
 * - HttpOnly cookies for secure token storage
 */

import { Elysia, t } from 'elysia'
import { authService } from './auth.service'
import {
  registerBodySchema,
  loginBodySchema,
  refreshTokenBodySchema,
  logoutBodySchema,
} from './auth.schemas'
import {
  requireAuth,
  getDeviceInfo,
} from '@/shared/middlewares/auth.middleware'
import {
  authRateLimiter,
  sensitiveRateLimiter,
} from '@/shared/middlewares/rate-limiter.middleware'
import {
  buildCookieString,
  buildClearCookieString,
  SECURE_COOKIE_OPTIONS,
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
} from '@/shared/utils'
import { env } from '@/config'

// =============================================================================
// Cookie Helper Functions
// =============================================================================

/**
 * Calculate max age in seconds for access token
 */
function getAccessTokenMaxAge(): number {
  const duration = env.JWT_ACCESS_EXPIRES_IN
  const match = duration.match(/^(\d+)(m|h|d)$/)
  if (!match) return 900 // default 15 minutes

  const value = parseInt(match[1], 10)
  const unit = match[2]

  switch (unit) {
    case 'm': return value * 60
    case 'h': return value * 60 * 60
    case 'd': return value * 24 * 60 * 60
    default: return 900
  }
}

/**
 * Calculate max age in seconds for refresh token
 */
function getRefreshTokenMaxAge(): number {
  const duration = env.JWT_REFRESH_EXPIRES_IN
  const match = duration.match(/^(\d+)(m|h|d)$/)
  if (!match) return 7 * 24 * 60 * 60 // default 7 days

  const value = parseInt(match[1], 10)
  const unit = match[2]

  switch (unit) {
    case 'm': return value * 60
    case 'h': return value * 60 * 60
    case 'd': return value * 24 * 60 * 60
    default: return 7 * 24 * 60 * 60
  }
}

// Type for Elysia's set object (simplified for cookie handling)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ElysiaSet = { headers: any }

/**
 * Set auth cookies on response
 */
function setAuthCookies(
  set: ElysiaSet,
  accessToken: string,
  refreshToken: string
): void {
  const existingCookies = set.headers['Set-Cookie']
  const cookiesArray: string[] = Array.isArray(existingCookies)
    ? existingCookies
    : existingCookies
      ? [existingCookies]
      : []

  cookiesArray.push(
    buildCookieString(ACCESS_TOKEN_COOKIE, accessToken, {
      ...SECURE_COOKIE_OPTIONS,
      maxAge: getAccessTokenMaxAge(),
    })
  )

  cookiesArray.push(
    buildCookieString(REFRESH_TOKEN_COOKIE, refreshToken, {
      ...SECURE_COOKIE_OPTIONS,
      maxAge: getRefreshTokenMaxAge(),
    })
  )

  set.headers['Set-Cookie'] = cookiesArray
}

/**
 * Clear auth cookies on response
 */
function clearAuthCookies(set: ElysiaSet): void {
  const existingCookies = set.headers['Set-Cookie']
  const cookiesArray: string[] = Array.isArray(existingCookies)
    ? existingCookies
    : existingCookies
      ? [existingCookies]
      : []

  cookiesArray.push(buildClearCookieString(ACCESS_TOKEN_COOKIE, SECURE_COOKIE_OPTIONS))
  cookiesArray.push(buildClearCookieString(REFRESH_TOKEN_COOKIE, SECURE_COOKIE_OPTIONS))

  set.headers['Set-Cookie'] = cookiesArray
}

// =============================================================================
// Auth Controller
// =============================================================================

export const authController = new Elysia({ prefix: '/auth' })

  // ============================================================================
  // POST /auth/register - Create new account
  // ============================================================================
  .use(authRateLimiter)
  .post(
    '/register',
    async ({ body, request, set }) => {
      const deviceInfo = getDeviceInfo(request)

      const result = await authService.register(body, deviceInfo)

      // Set secure httpOnly cookies
      setAuthCookies(set, result.accessToken, result.refreshToken)

      return {
        success: true,
        data: {
          user: result.user,
          // Still return tokens in response for backward compatibility
          // Frontend should migrate to using cookies instead
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
          expiresIn: result.expiresIn,
        },
        message: result.user.isSpecial
          ? 'Conta criada com sucesso! 💕 Bem-vinda, pessoa especial!'
          : 'Conta criada com sucesso! 🐰',
      }
    },
    {
      body: registerBodySchema,
      detail: {
        tags: ['Auth'],
        summary: 'Registrar novo usuário',
        description: `
          Cria uma nova conta de usuário.
          
          **Requisitos de senha:**
          - Mínimo 8 caracteres
          - Pelo menos 1 letra maiúscula
          - Pelo menos 1 letra minúscula
          - Pelo menos 1 número
          - Pelo menos 1 caractere especial (!@#$%^&*...)
          
          **Rate Limit:** 5 requisições por 15 minutos
        `,
      },
    }
  )

  // ============================================================================
  // POST /auth/login - Authenticate user
  // ============================================================================
  .post(
    '/login',
    async ({ body, request, set }) => {
      const deviceInfo = getDeviceInfo(request)

      const result = await authService.login(body, deviceInfo)

      // Set secure httpOnly cookies
      setAuthCookies(set, result.accessToken, result.refreshToken)

      return {
        success: true,
        data: {
          user: result.user,
          // Still return tokens in response for backward compatibility
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
          expiresIn: result.expiresIn,
        },
        message: result.user.isSpecial
          ? 'Login realizado com sucesso! 💕 Que bom te ver de novo!'
          : 'Login realizado com sucesso!',
      }
    },
    {
      body: loginBodySchema,
      detail: {
        tags: ['Auth'],
        summary: 'Login',
        description: `
          Autentica um usuário existente.
          
          **Proteção contra brute force:**
          - Após 5 tentativas falhas, a conta é bloqueada por 15 minutos
          - Tentativas são contadas por e-mail
          
          **Rate Limit:** 5 requisições por 15 minutos
        `,
      },
    }
  )

  // ============================================================================
  // POST /auth/refresh - Refresh access token
  // ============================================================================
  .post(
    '/refresh',
    async ({ body, request, set }) => {
      const deviceInfo = getDeviceInfo(request)

      const result = await authService.refreshToken(body.refreshToken, deviceInfo)

      // Set secure httpOnly cookies
      setAuthCookies(set, result.accessToken, result.refreshToken)

      return {
        success: true,
        data: {
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
          expiresIn: result.expiresIn,
        },
        message: 'Token renovado com sucesso',
      }
    },
    {
      body: refreshTokenBodySchema,
      detail: {
        tags: ['Auth'],
        summary: 'Renovar token de acesso',
        description: `
          Renova o token de acesso usando o refresh token.
          
          **Rotação de tokens:**
          - O refresh token antigo é invalidado
          - Um novo refresh token é gerado
          - Isso previne reutilização de tokens roubados
          
          **Rate Limit:** 5 requisições por 15 minutos
        `,
      },
    }
  )

  // ============================================================================
  // POST /auth/logout - Logout (revoke tokens)
  // ============================================================================
  .use(requireAuth)
  .post(
    '/logout',
    async ({ body, auth, set }) => {
      await authService.logout(auth.userId, body?.refreshToken, body?.allDevices)

      // Clear auth cookies
      clearAuthCookies(set)

      return {
        success: true,
        message: body?.allDevices
          ? 'Logout realizado em todos os dispositivos'
          : 'Logout realizado com sucesso',
      }
    },
    {
      body: logoutBodySchema,
      detail: {
        tags: ['Auth'],
        summary: 'Logout',
        description: `
          Realiza logout do usuário.
          
          **Opções:**
          - \`refreshToken\`: Revoga apenas o token especificado
          - \`allDevices: true\`: Revoga TODOS os refresh tokens do usuário
          
          **Requer autenticação:** Sim
        `,
      },
    }
  )

  // ============================================================================
  // GET /auth/me - Get current user (validate token)
  // ============================================================================
  .get(
    '/me',
    async ({ auth }) => {
      // auth.user já foi validado pelo middleware requireAuth
      // Se chegou aqui, o usuário existe e o token é válido
      const user = auth.user

      return {
        success: true,
        data: {
          user: {
            id: user._id,
            email: user.email,
            name: user.name,
            role: user.role,
            isSpecial: user.isSpecial,
            specialMessage: user.specialMessage,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
          },
        },
      }
    },
    {
      detail: {
        tags: ['Auth'],
        summary: 'Obter usuário atual',
        description: `
          Retorna os dados do usuário autenticado.
          Útil para validar se o token ainda é válido e o usuário ainda existe.
          
          **Requer autenticação:** Sim
        `,
      },
    }
  )

  // ============================================================================
  // GET /auth/sessions - Get active sessions
  // ============================================================================
  .get(
    '/sessions',
    async ({ auth }) => {
      const sessions = await authService.getActiveSessions(auth.userId)

      return {
        success: true,
        data: sessions,
        message: `${sessions.length} sessão(ões) ativa(s)`,
      }
    },
    {
      detail: {
        tags: ['Auth'],
        summary: 'Listar sessões ativas',
        description: `
          Lista todas as sessões ativas do usuário (dispositivos/navegadores logados).
          
          **Requer autenticação:** Sim
        `,
      },
    }
  )

  // ============================================================================
  // DELETE /auth/sessions/:id - Revoke specific session
  // ============================================================================
  .use(sensitiveRateLimiter)
  .delete(
    '/sessions/:id',
    async ({ auth, params }) => {
      const success = await authService.revokeSession(auth.userId, params.id)

      if (!success) {
        return {
          success: false,
          message: 'Sessão não encontrada',
        }
      }

      return {
        success: true,
        message: 'Sessão encerrada com sucesso',
      }
    },
    {
      params: t.Object({
        id: t.String({ minLength: 24, maxLength: 24 }),
      }),
      detail: {
        tags: ['Auth'],
        summary: 'Encerrar sessão específica',
        description: `
          Encerra uma sessão específica (logout remoto).
          
          **Requer autenticação:** Sim
          **Rate Limit:** 3 requisições por 5 minutos
        `,
      },
    }
  )

export default authController
