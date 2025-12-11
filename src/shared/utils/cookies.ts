/**
 * Cookie Utilities for Secure Token Management
 *
 * Security features:
 * - httpOnly: Prevents JavaScript access (XSS protection)
 * - secure: HTTPS only in production
 * - sameSite: CSRF protection
 * - path: Restrict cookie scope
 */

import { env } from '@/config'

export interface CookieOptions {
  httpOnly?: boolean
  secure?: boolean
  sameSite?: 'strict' | 'lax' | 'none'
  maxAge?: number
  path?: string
  domain?: string
}

/**
 * Default secure cookie options
 */
export const SECURE_COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  secure: env.IS_PROD, // HTTPS only in production
  sameSite: env.IS_PROD ? 'strict' : 'lax', // Strict in prod, lax in dev for localhost
  path: '/',
}

/**
 * Access token cookie name
 */
export const ACCESS_TOKEN_COOKIE = 'ceboelha_access_token'

/**
 * Refresh token cookie name
 */
export const REFRESH_TOKEN_COOKIE = 'ceboelha_refresh_token'

/**
 * Build cookie string from options
 */
export function buildCookieString(
  name: string,
  value: string,
  options: CookieOptions = {}
): string {
  const parts = [`${name}=${encodeURIComponent(value)}`]

  if (options.httpOnly) {
    parts.push('HttpOnly')
  }

  if (options.secure) {
    parts.push('Secure')
  }

  if (options.sameSite) {
    parts.push(`SameSite=${options.sameSite}`)
  }

  if (options.maxAge !== undefined) {
    parts.push(`Max-Age=${options.maxAge}`)
  }

  if (options.path) {
    parts.push(`Path=${options.path}`)
  }

  if (options.domain) {
    parts.push(`Domain=${options.domain}`)
  }

  return parts.join('; ')
}

/**
 * Build cookie clear string (sets Max-Age=0)
 */
export function buildClearCookieString(
  name: string,
  options: CookieOptions = {}
): string {
  return buildCookieString(name, '', { ...options, maxAge: 0 })
}

/**
 * Parse cookies from request header
 */
export function parseCookies(cookieHeader: string | null): Record<string, string> {
  if (!cookieHeader) return {}

  const cookies: Record<string, string> = {}

  cookieHeader.split(';').forEach((cookie) => {
    const [name, ...rest] = cookie.trim().split('=')
    if (name) {
      cookies[name] = decodeURIComponent(rest.join('='))
    }
  })

  return cookies
}

/**
 * Get token from cookie header
 */
export function getTokenFromCookies(
  cookieHeader: string | null,
  tokenName: string
): string | null {
  const cookies = parseCookies(cookieHeader)
  return cookies[tokenName] || null
}
