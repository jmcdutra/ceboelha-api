/**
 * Login Attempt Model - Brute Force Protection
 *
 * Tracks failed login attempts per IP/email to:
 * - Rate limit authentication attempts
 * - Lock accounts after too many failures
 * - Log suspicious activity
 */

import mongoose, { Schema, type Document, type Model } from 'mongoose'
import { env } from '@/config'

// =============================================================================
// Interface
// =============================================================================

export interface ILoginAttempt extends Document {
  _id: mongoose.Types.ObjectId
  email: string
  ip: string
  success: boolean
  userAgent?: string
  failureReason?: string
  timestamp: Date
}

export interface IAccountLockout extends Document {
  _id: mongoose.Types.ObjectId
  email: string
  ip?: string
  failedAttempts: number
  lastFailedAttempt: Date
  lockedUntil?: Date
  isLocked: boolean
}

// =============================================================================
// Static Methods Interface
// =============================================================================

export interface IAccountLockoutModel extends Model<IAccountLockout> {
  recordFailedAttempt(email: string, ip?: string): Promise<IAccountLockout>
  resetAttempts(email: string): Promise<void>
  isLocked(email: string): Promise<{ locked: boolean; remainingTime?: number }>
  getAttempts(email: string): Promise<IAccountLockout | null>
}

// =============================================================================
// Login Attempt Schema (for logging/auditing)
// =============================================================================

const loginAttemptSchema = new Schema<ILoginAttempt>(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      index: true,
    },
    ip: {
      type: String,
      required: true,
      index: true,
    },
    success: {
      type: Boolean,
      required: true,
    },
    userAgent: String,
    failureReason: String,
    timestamp: {
      type: Date,
      default: Date.now,
      // Index definido abaixo como TTL index
    },
  },
  {
    timestamps: false,
  }
)

// TTL index - delete logs after 30 days
loginAttemptSchema.index({ timestamp: 1 }, { expireAfterSeconds: 2592000 })

// Compound indexes for security analytics
loginAttemptSchema.index({ email: 1, timestamp: -1 })
loginAttemptSchema.index({ ip: 1, timestamp: -1 })
loginAttemptSchema.index({ success: 1, timestamp: -1 })

// =============================================================================
// Account Lockout Schema (for blocking)
// =============================================================================

const accountLockoutSchema = new Schema<IAccountLockout>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      index: true,
    },
    ip: String,
    failedAttempts: {
      type: Number,
      default: 0,
    },
    lastFailedAttempt: {
      type: Date,
      default: Date.now,
    },
    lockedUntil: Date,
    isLocked: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
)

// =============================================================================
// Static Methods
// =============================================================================

/**
 * Record a failed login attempt and potentially lock the account
 */
accountLockoutSchema.statics.recordFailedAttempt = async function (
  email: string,
  ip?: string
): Promise<IAccountLockout> {
  const normalizedEmail = email.toLowerCase()

  let lockout = await this.findOne({ email: normalizedEmail })

  if (!lockout) {
    lockout = new this({ email: normalizedEmail, ip })
  }

  // Check if lockout has expired
  if (lockout.lockedUntil && new Date() > lockout.lockedUntil) {
    // Reset after lockout period
    lockout.failedAttempts = 0
    lockout.isLocked = false
    lockout.lockedUntil = undefined
  }

  lockout.failedAttempts += 1
  lockout.lastFailedAttempt = new Date()
  lockout.ip = ip

  // Lock account if max attempts reached
  if (lockout.failedAttempts >= env.MAX_LOGIN_ATTEMPTS) {
    lockout.isLocked = true
    lockout.lockedUntil = new Date(Date.now() + env.LOCKOUT_DURATION)
  }

  await lockout.save()
  return lockout
}

/**
 * Reset failed attempts after successful login
 */
accountLockoutSchema.statics.resetAttempts = async function (
  email: string
): Promise<void> {
  const normalizedEmail = email.toLowerCase()
  await this.updateOne(
    { email: normalizedEmail },
    {
      failedAttempts: 0,
      isLocked: false,
      lockedUntil: undefined,
    }
  )
}

/**
 * Check if an account is currently locked
 */
accountLockoutSchema.statics.isLocked = async function (
  email: string
): Promise<{ locked: boolean; remainingTime?: number }> {
  const normalizedEmail = email.toLowerCase()
  const lockout = await this.findOne({ email: normalizedEmail })

  if (!lockout || !lockout.isLocked) {
    return { locked: false }
  }

  // Check if lockout has expired
  if (lockout.lockedUntil && new Date() > lockout.lockedUntil) {
    // Lockout expired, reset directly
    await this.updateOne(
      { email: normalizedEmail },
      {
        failedAttempts: 0,
        isLocked: false,
        lockedUntil: undefined,
      }
    )
    return { locked: false }
  }

  const remainingTime = lockout.lockedUntil
    ? Math.ceil((lockout.lockedUntil.getTime() - Date.now()) / 1000)
    : undefined

  return { locked: true, remainingTime }
}

/**
 * Get current attempt info for an email
 */
accountLockoutSchema.statics.getAttempts = async function (
  email: string
): Promise<IAccountLockout | null> {
  return this.findOne({ email: email.toLowerCase() })
}

// =============================================================================
// Export
// =============================================================================

export const LoginAttempt = mongoose.model<ILoginAttempt>(
  'LoginAttempt',
  loginAttemptSchema
)

export const AccountLockout = mongoose.model<IAccountLockout, IAccountLockoutModel>(
  'AccountLockout',
  accountLockoutSchema
)
