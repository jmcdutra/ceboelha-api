/**
 * Rate Limiter Middleware - Request Throttling
 *
 * Features:
 * - Per-IP rate limiting
 * - Configurable windows and limits
 * - In-memory storage (can be upgraded to Redis)
 * - Special stricter limits for auth endpoints
 */

import { Elysia } from 'elysia'
import { RateLimitError } from '@/shared/errors'
import { env } from '@/config'

// =============================================================================
// Types
// =============================================================================

interface RateLimitEntry {
  count: number
  resetAt: number
}

interface RateLimitConfig {
  windowMs: number
  maxRequests: number
  message?: string
}

// =============================================================================
// In-Memory Store
// =============================================================================

class RateLimitStore {
  private store: Map<string, RateLimitEntry> = new Map()
  private cleanupInterval: Timer

  constructor() {
    // Cleanup expired entries every minute
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000)
  }

  get(key: string): RateLimitEntry | undefined {
    const entry = this.store.get(key)

    // Check if entry has expired
    if (entry && Date.now() > entry.resetAt) {
      this.store.delete(key)
      return undefined
    }

    return entry
  }

  increment(key: string, windowMs: number): RateLimitEntry {
    const now = Date.now()
    const existing = this.get(key)

    if (existing) {
      existing.count++
      return existing
    }

    const entry: RateLimitEntry = {
      count: 1,
      resetAt: now + windowMs,
    }
    this.store.set(key, entry)
    return entry
  }

  private cleanup() {
    const now = Date.now()
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.resetAt) {
        this.store.delete(key)
      }
    }
  }

  destroy() {
    clearInterval(this.cleanupInterval)
    this.store.clear()
  }
}

// Global store instance
const globalStore = new RateLimitStore()

// =============================================================================
// Rate Limiter Factory
// =============================================================================

/**
 * Create a rate limiter middleware with custom config
 */
export function createRateLimiter(config: RateLimitConfig) {
  const { windowMs, maxRequests, message } = config

  return new Elysia({ name: `rate-limiter-${windowMs}-${maxRequests}` })
    .derive({ as: 'scoped' }, ({ request }) => {
      // Get client IP
      const ip =
        request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        request.headers.get('x-real-ip') ||
        'unknown'

      // Create key based on IP and path (for endpoint-specific limits)
      const path = new URL(request.url).pathname
      const key = `${ip}:${path}`

      // Check and increment
      const entry = globalStore.increment(key, windowMs)

      // Check if limit exceeded
      if (entry.count > maxRequests) {
        const retryAfter = Math.ceil((entry.resetAt - Date.now()) / 1000)

        throw new RateLimitError(
          message || `Muitas requisições. Tente novamente em ${retryAfter} segundos.`
        )
      }

      // Add rate limit headers
      return {
        rateLimitInfo: {
          limit: maxRequests,
          remaining: Math.max(0, maxRequests - entry.count),
          reset: entry.resetAt,
        },
      }
    })
    .onAfterHandle(({ set, rateLimitInfo }) => {
      // Add rate limit headers to response
      if (rateLimitInfo) {
        set.headers['X-RateLimit-Limit'] = String(rateLimitInfo.limit)
        set.headers['X-RateLimit-Remaining'] = String(rateLimitInfo.remaining)
        set.headers['X-RateLimit-Reset'] = String(rateLimitInfo.reset)
      }
    })
}

// =============================================================================
// Pre-configured Rate Limiters
// =============================================================================

/**
 * General API rate limiter
 * 100 requests per minute (default)
 */
export const generalRateLimiter = createRateLimiter({
  windowMs: env.RATE_LIMIT_WINDOW,
  maxRequests: env.RATE_LIMIT_MAX,
  message: 'Muitas requisições. Aguarde um momento e tente novamente.',
})

/**
 * Auth rate limiter (stricter)
 * 5 requests per 15 minutes for login/register
 */
export const authRateLimiter = createRateLimiter({
  windowMs: env.AUTH_RATE_LIMIT_WINDOW,
  maxRequests: env.AUTH_RATE_LIMIT_MAX,
  message: 'Muitas tentativas de login. Aguarde 15 minutos antes de tentar novamente.',
})

/**
 * Sensitive operations rate limiter
 * 3 requests per 5 minutes for password changes, account deletion, etc.
 */
export const sensitiveRateLimiter = createRateLimiter({
  windowMs: 300000, // 5 minutes
  maxRequests: 3,
  message: 'Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.',
})

// =============================================================================
// IP-based Global Rate Limiter
// =============================================================================

/**
 * Global rate limiter by IP (across all endpoints)
 * Prevents abuse from a single IP
 */
export function createGlobalRateLimiter() {
  return new Elysia({ name: 'global-rate-limiter' }).derive(
    { as: 'scoped' },
    ({ request }) => {
      const ip =
        request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        request.headers.get('x-real-ip') ||
        'unknown'

      const key = `global:${ip}`
      const windowMs = 60000 // 1 minute
      const maxRequests = 200 // 200 requests per minute total

      const entry = globalStore.increment(key, windowMs)

      if (entry.count > maxRequests) {
        throw new RateLimitError(
          'Limite de requisições excedido. Tente novamente em breve.'
        )
      }

      return {}
    }
  )
}

export const globalRateLimiter = createGlobalRateLimiter()

// =============================================================================
// Admin Rate Limiter (stricter for security)
// =============================================================================

/**
 * Admin-specific rate limiter
 * 30 requests per minute - stricter than general API
 * Helps prevent abuse even from authenticated admins
 */
export const adminRateLimiter = createRateLimiter({
  windowMs: 60000, // 1 minute
  maxRequests: 30,
  message: 'Limite de requisições admin excedido. Aguarde antes de continuar.',
})

/**
 * Admin write operations rate limiter (most strict)
 * 10 requests per minute for create/update/delete operations
 */
export const adminWriteRateLimiter = createRateLimiter({
  windowMs: 60000, // 1 minute  
  maxRequests: 10,
  message: 'Muitas operações de escrita. Aguarde antes de continuar.',
})
