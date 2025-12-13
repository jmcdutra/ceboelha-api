/**
 * Auth Service - Secure Authentication Business Logic
 *
 * Security features:
 * - JWT Access + Refresh token pattern
 * - Refresh token rotation (old token invalidated on use)
 * - Account lockout after failed attempts
 * - Login attempt logging
 * - Secure token storage (hashed)
 * - Device tracking
 */

import { SignJWT, jwtVerify, type JWTPayload as JoseJWTPayload } from 'jose'
import mongoose from 'mongoose'
import { User, type IUser } from '@/modules/users/user.model'
import { RefreshToken } from './refresh-token.model'
import { LoginAttempt, AccountLockout } from './login-attempt.model'
import * as achievementsService from '@/modules/achievements/achievements.service'
import { ActivityLog } from '@/modules/admin/activity-log.model'
import {
  ConflictError,
  UnauthorizedError,
  ValidationError,
  RateLimitError,
} from '@/shared/errors'
import { isJulia, getJuliaSpecialMessage } from '@/shared/utils'
import { validatePasswordStrength } from './auth.schemas'
import { env } from '@/config'

// =============================================================================
// Types
// =============================================================================

export interface RegisterInput {
  email: string
  password: string
  name: string
}

export interface LoginInput {
  email: string
  password: string
}

export interface DeviceInfo {
  ip?: string
  userAgent?: string
}

export interface JWTPayload {
  sub: string // user id
  email: string
  role: string
  type: 'access' | 'refresh'
  iat?: number
  exp?: number
}

export interface TokenPair {
  accessToken: string
  refreshToken: string
  expiresIn: number // seconds until access token expires
}

export interface AuthResponse {
  user: Omit<IUser, 'password'>
  accessToken: string
  refreshToken: string
  expiresIn: number
}

// =============================================================================
// JWT Utilities
// =============================================================================

const textEncoder = new TextEncoder()
const accessSecret = textEncoder.encode(env.JWT_ACCESS_SECRET)

/**
 * Parse duration string to milliseconds
 * Supports: 15m, 1h, 7d, 30d
 */
function parseDuration(duration: string): number {
  const match = duration.match(/^(\d+)(m|h|d)$/)
  if (!match) throw new Error(`Invalid duration format: ${duration}`)

  const value = parseInt(match[1], 10)
  const unit = match[2]

  switch (unit) {
    case 'm': return value * 60 * 1000
    case 'h': return value * 60 * 60 * 1000
    case 'd': return value * 24 * 60 * 60 * 1000
    default: throw new Error(`Unknown time unit: ${unit}`)
  }
}

const ACCESS_TOKEN_DURATION = parseDuration(env.JWT_ACCESS_EXPIRES_IN)
const REFRESH_TOKEN_DURATION = parseDuration(env.JWT_REFRESH_EXPIRES_IN)

// =============================================================================
// Service
// =============================================================================

export const authService = {
  /**
   * Generate JWT access token
   */
  async generateAccessToken(user: IUser): Promise<string> {
    const payload: JWTPayload = {
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
      type: 'access',
    }

    return new SignJWT(payload as unknown as JoseJWTPayload)
      .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
      .setIssuedAt()
      .setExpirationTime(env.JWT_ACCESS_EXPIRES_IN)
      .setIssuer('ceboelha-api')
      .setAudience('ceboelha-app')
      .sign(accessSecret)
  },

  /**
   * Verify JWT access token
   */
  async verifyAccessToken(token: string): Promise<JWTPayload> {
    try {
      const { payload } = await jwtVerify(token, accessSecret, {
        issuer: 'ceboelha-api',
        audience: 'ceboelha-app',
      })

      // Validate token type
      if (payload.type !== 'access') {
        throw new UnauthorizedError('Token inválido')
      }

      return payload as unknown as JWTPayload
    } catch (error) {
      if (error instanceof UnauthorizedError) throw error
      throw new UnauthorizedError('Token expirado ou inválido')
    }
  },

  /**
   * Create complete token pair (access + refresh)
   */
  async createTokenPair(user: IUser, deviceInfo?: DeviceInfo): Promise<TokenPair> {
    // Generate access token
    const accessToken = await this.generateAccessToken(user)

    // Generate and store refresh token
    const { token: refreshToken } = await RefreshToken.createToken(
      user._id,
      REFRESH_TOKEN_DURATION,
      deviceInfo
    )

    return {
      accessToken,
      refreshToken,
      expiresIn: Math.floor(ACCESS_TOKEN_DURATION / 1000),
    }
  },

  /**
   * Register a new user with strong password validation
   */
  async register(
    input: RegisterInput,
    deviceInfo?: DeviceInfo
  ): Promise<AuthResponse> {
    const { email, password, name } = input

    // Validate password strength
    const passwordError = validatePasswordStrength(password)
    if (passwordError) {
      throw new ValidationError(passwordError)
    }

    // Check if email already exists (case-insensitive)
    const existingUser = await User.findOne({
      email: email.toLowerCase().trim(),
    })
    if (existingUser) {
      throw new ConflictError('Este e-mail já está cadastrado')
    }

    // Check for special user 💕
    const isSpecialUser = isJulia(email)

    // Create user (stats always start at 0, even for special users)
    const user = await User.create({
      email,
      password,
      name: isSpecialUser ? `${name} 💕` : name,
      isSpecial: isSpecialUser,
      specialMessage: isSpecialUser ? getJuliaSpecialMessage() : undefined,
      // Stats are initialized by schema defaults (all 0)
    })

    // Log successful registration
    await LoginAttempt.create({
      email: user.email,
      ip: deviceInfo?.ip || 'unknown',
      success: true,
      userAgent: deviceInfo?.userAgent,
    })

    // Activity Log - user_register
    ActivityLog.create({
      type: 'user_register',
      userId: user._id,
      userName: user.name,
      userEmail: user.email,
      action: 'Nova conta criada',
      ip_address: deviceInfo?.ip,
      user_agent: deviceInfo?.userAgent,
      timestamp: new Date(),
    }).catch((err) => console.error('[ActivityLog] Failed to log user_register:', err))

    // Generate tokens
    const tokens = await this.createTokenPair(user, deviceInfo)

    return {
      user: user.toJSON() as Omit<IUser, 'password'>,
      ...tokens,
    }
  },

  /**
   * Login user with brute force protection
   */
  async login(
    input: LoginInput,
    deviceInfo?: DeviceInfo
  ): Promise<AuthResponse> {
    const { email, password } = input
    const normalizedEmail = email.toLowerCase().trim()

    // Check if account is locked
    const lockStatus = await AccountLockout.isLocked(normalizedEmail)
    if (lockStatus.locked) {
      await LoginAttempt.create({
        email: normalizedEmail,
        ip: deviceInfo?.ip || 'unknown',
        success: false,
        userAgent: deviceInfo?.userAgent,
        failureReason: 'Account locked',
      })

      const minutes = Math.ceil((lockStatus.remainingTime || 0) / 60)
      throw new RateLimitError(
        `Conta bloqueada temporariamente. Tente novamente em ${minutes} minutos.`
      )
    }

    // Find user with password field included
    const user = await User.findOne({ email: normalizedEmail }).select('+password')

    if (!user) {
      // Record failed attempt
      await AccountLockout.recordFailedAttempt(normalizedEmail, deviceInfo?.ip)
      await LoginAttempt.create({
        email: normalizedEmail,
        ip: deviceInfo?.ip || 'unknown',
        success: false,
        userAgent: deviceInfo?.userAgent,
        failureReason: 'User not found',
      })

      // Use generic message to prevent email enumeration
      throw new UnauthorizedError('E-mail ou senha inválidos')
    }

    // Check if user is banned or inactive
    if (user.status === 'banned') {
      throw new UnauthorizedError('Sua conta foi suspensa. Entre em contato com o suporte.')
    }
    if (user.status === 'inactive') {
      throw new UnauthorizedError('Sua conta está inativa. Entre em contato com o suporte.')
    }

    // Verify password
    const isValidPassword = await user.comparePassword(password)

    if (!isValidPassword) {
      // Record failed attempt
      const lockout = await AccountLockout.recordFailedAttempt(normalizedEmail, deviceInfo?.ip)
      await LoginAttempt.create({
        email: normalizedEmail,
        ip: deviceInfo?.ip || 'unknown',
        success: false,
        userAgent: deviceInfo?.userAgent,
        failureReason: 'Invalid password',
      })

      // Warn user about remaining attempts
      const remainingAttempts = env.MAX_LOGIN_ATTEMPTS - lockout.failedAttempts
      if (remainingAttempts > 0 && remainingAttempts <= 3) {
        throw new UnauthorizedError(
          `E-mail ou senha inválidos. ${remainingAttempts} tentativa(s) restante(s).`
        )
      }

      throw new UnauthorizedError('E-mail ou senha inválidos')
    }

    // Login successful - reset lockout and update stats
    await AccountLockout.resetAttempts(normalizedEmail)
    await LoginAttempt.create({
      email: normalizedEmail,
      ip: deviceInfo?.ip || 'unknown',
      success: true,
      userAgent: deviceInfo?.userAgent,
    })

    // Activity Log - user_login
    ActivityLog.create({
      type: 'user_login',
      userId: user._id,
      userName: user.name,
      userEmail: user.email,
      action: 'Login realizado',
      ip_address: deviceInfo?.ip,
      user_agent: deviceInfo?.userAgent,
      timestamp: new Date(),
    }).catch((err) => console.error('[ActivityLog] Failed to log user_login:', err))

    // Update last active
    user.stats.lastActive = new Date()
    await user.save()

    // Generate tokens
    const tokens = await this.createTokenPair(user, deviceInfo)

    // Give welcome achievement (first login)
    achievementsService.updateProgress(user._id.toString(), 'first_login', 1).catch((err) => {
      console.error('[Achievements] Failed to update first_login progress:', err)
    })

    return {
      user: user.toJSON() as Omit<IUser, 'password'>,
      ...tokens,
    }
  },

  /**
   * Refresh access token using refresh token
   * Implements token rotation: old refresh token is invalidated
   */
  async refreshToken(
    refreshTokenString: string,
    deviceInfo?: DeviceInfo
  ): Promise<TokenPair> {
    // Find the refresh token
    const storedToken = await RefreshToken.findByToken(refreshTokenString)

    if (!storedToken) {
      throw new UnauthorizedError('Token de refresh inválido')
    }

    // Check if token is valid
    if (!storedToken.isValid()) {
      // If token was revoked, it might be a stolen token being reused
      // Revoke ALL tokens for this user as a security measure
      if (storedToken.isRevoked) {
        await RefreshToken.revokeAllForUser(
          storedToken.userId,
          'Possible token theft detected - revoked token reuse'
        )
      }
      throw new UnauthorizedError('Token de refresh expirado ou revogado')
    }

    // Find the user
    const user = await User.findById(storedToken.userId)
    if (!user || user.status !== 'active') {
      await RefreshToken.revokeToken(
        RefreshToken.hashToken(refreshTokenString),
        'User not found or inactive'
      )
      throw new UnauthorizedError('Usuário não encontrado ou inativo')
    }

    // Revoke the old refresh token (rotation)
    await RefreshToken.revokeToken(
      RefreshToken.hashToken(refreshTokenString),
      'Token rotation'
    )

    // Generate new token pair
    return this.createTokenPair(user, deviceInfo)
  },

  /**
   * Logout - revoke refresh token(s)
   */
  async logout(
    userId: string,
    refreshTokenString?: string,
    allDevices: boolean = false
  ): Promise<void> {
    const userObjectId = new mongoose.Types.ObjectId(userId)

    if (allDevices) {
      // Revoke all refresh tokens for user
      await RefreshToken.revokeAllForUser(userObjectId, 'User logout from all devices')
    } else if (refreshTokenString) {
      // Revoke specific refresh token
      await RefreshToken.revokeToken(
        RefreshToken.hashToken(refreshTokenString),
        'User logout'
      )
    }

    // Activity Log - user_logout
    const user = await User.findById(userId)
    if (user) {
      ActivityLog.create({
        type: 'user_logout',
        userId: user._id,
        userName: user.name,
        userEmail: user.email,
        action: allDevices ? 'Logout de todos os dispositivos' : 'Logout realizado',
        timestamp: new Date(),
      }).catch((err) => console.error('[ActivityLog] Failed to log user_logout:', err))
    }
  },

  /**
   * Get active sessions for a user
   */
  async getActiveSessions(userId: string) {
    const userObjectId = new mongoose.Types.ObjectId(userId)

    const sessions = await RefreshToken.find({
      userId: userObjectId,
      isRevoked: false,
      expiresAt: { $gt: new Date() },
    }).select('deviceInfo createdAt expiresAt')

    return sessions.map((session) => ({
      id: session._id.toString(),
      device: session.deviceInfo?.userAgent || 'Unknown device',
      ip: session.deviceInfo?.ip || 'Unknown',
      createdAt: session.createdAt,
      expiresAt: session.expiresAt,
    }))
  },

  /**
   * Revoke a specific session
   */
  async revokeSession(userId: string, sessionId: string): Promise<boolean> {
    const session = await RefreshToken.findById(sessionId)

    if (!session || session.userId.toString() !== userId) {
      return false
    }

    session.isRevoked = true
    session.revokedAt = new Date()
    session.revokedReason = 'User revoked session'
    await session.save()

    return true
  },
}

export default authService
