/**
 * Refresh Token Model - Secure Token Storage
 *
 * Stores refresh tokens with:
 * - Token hash (never store plain tokens)
 * - Device/session info
 * - Expiration
 * - Revocation status
 */

import mongoose, { Schema, type Document, type Model } from 'mongoose'
import crypto from 'crypto'

// =============================================================================
// Interface
// =============================================================================

export interface IRefreshToken extends Document {
  _id: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  tokenHash: string // SHA-256 hash of the token
  deviceInfo?: {
    userAgent?: string
    ip?: string
    deviceName?: string
  }
  isRevoked: boolean
  revokedAt?: Date
  revokedReason?: string
  expiresAt: Date
  createdAt: Date
  // Methods
  isExpired(): boolean
  isValid(): boolean
}

// =============================================================================
// Static Methods Interface
// =============================================================================

export interface IRefreshTokenModel extends Model<IRefreshToken> {
  hashToken(token: string): string
  createToken(
    userId: mongoose.Types.ObjectId,
    expiresIn: number,
    deviceInfo?: IRefreshToken['deviceInfo']
  ): Promise<{ token: string; doc: IRefreshToken }>
  findByToken(token: string): Promise<IRefreshToken | null>
  revokeAllForUser(userId: mongoose.Types.ObjectId, reason?: string): Promise<void>
  revokeToken(tokenHash: string, reason?: string): Promise<boolean>
  cleanupExpired(): Promise<number>
}

// =============================================================================
// Schema
// =============================================================================

const refreshTokenSchema = new Schema<IRefreshToken>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    tokenHash: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    deviceInfo: {
      userAgent: String,
      ip: String,
      deviceName: String,
    },
    isRevoked: {
      type: Boolean,
      default: false,
      index: true,
    },
    revokedAt: Date,
    revokedReason: String,
    expiresAt: {
      type: Date,
      required: true,
      // Index definido abaixo como TTL index
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
)

// =============================================================================
// Indexes
// =============================================================================

// Compound index for efficient lookups
refreshTokenSchema.index({ userId: 1, isRevoked: 1 })

// TTL index to auto-delete expired tokens after 30 days
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 2592000 })

// =============================================================================
// Methods
// =============================================================================

refreshTokenSchema.methods.isExpired = function (): boolean {
  return new Date() > this.expiresAt
}

refreshTokenSchema.methods.isValid = function (): boolean {
  return !this.isRevoked && !this.isExpired()
}

// =============================================================================
// Helper Functions (used by statics)
// =============================================================================

/**
 * Hash a token using SHA-256
 * We never store the plain token, only the hash
 */
function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex')
}

// =============================================================================
// Static Methods
// =============================================================================

refreshTokenSchema.statics.hashToken = hashToken

/**
 * Create a new refresh token
 * Returns both the plain token (to send to client) and the document
 */
refreshTokenSchema.statics.createToken = async function (
  userId: mongoose.Types.ObjectId,
  expiresInMs: number,
  deviceInfo?: IRefreshToken['deviceInfo']
): Promise<{ token: string; doc: IRefreshToken }> {
  // Generate secure random token (64 bytes = 128 hex chars)
  const token = crypto.randomBytes(64).toString('hex')
  const tokenHashValue = hashToken(token)

  const expiresAt = new Date(Date.now() + expiresInMs)

  const doc = await this.create({
    userId,
    tokenHash: tokenHashValue,
    deviceInfo,
    expiresAt,
  })

  return { token, doc }
}

/**
 * Find a refresh token by its plain token value
 */
refreshTokenSchema.statics.findByToken = async function (
  token: string
): Promise<IRefreshToken | null> {
  const tokenHashValue = hashToken(token)
  return this.findOne({ tokenHash: tokenHashValue })
}

/**
 * Revoke all refresh tokens for a user
 * Useful for "logout from all devices" or security incidents
 */
refreshTokenSchema.statics.revokeAllForUser = async function (
  userId: mongoose.Types.ObjectId,
  reason: string = 'User requested logout from all devices'
): Promise<void> {
  await this.updateMany(
    { userId, isRevoked: false },
    {
      isRevoked: true,
      revokedAt: new Date(),
      revokedReason: reason,
    }
  )
}

/**
 * Revoke a specific token
 */
refreshTokenSchema.statics.revokeToken = async function (
  tokenHash: string,
  reason: string = 'Token revoked'
): Promise<boolean> {
  const result = await this.updateOne(
    { tokenHash, isRevoked: false },
    {
      isRevoked: true,
      revokedAt: new Date(),
      revokedReason: reason,
    }
  )
  return result.modifiedCount > 0
}

/**
 * Cleanup expired tokens (can be run as a cron job)
 */
refreshTokenSchema.statics.cleanupExpired = async function (): Promise<number> {
  const result = await this.deleteMany({
    expiresAt: { $lt: new Date() },
  })
  return result.deletedCount
}

// =============================================================================
// Export
// =============================================================================

export const RefreshToken = mongoose.model<IRefreshToken, IRefreshTokenModel>(
  'RefreshToken',
  refreshTokenSchema
)
