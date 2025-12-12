/**
 * User Model - Mongoose Schema
 *
 * Security features:
 * - Password hashing with bcrypt (configurable salt rounds)
 * - Password never returned in queries
 * - Timing-safe password comparison
 * - Email normalization
 */

import mongoose, { Schema, type Document, type Model } from 'mongoose'
import bcrypt from 'bcrypt'
import crypto from 'crypto'
import { env } from '@/config'
import type {
  UserRole,
  UserStatus,
  UserPreferences,
  UserStats,
  SpecialMessage,
  DietSettings,
} from '@/shared/types'

// =============================================================================
// Interface
// =============================================================================

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId
  email: string
  password: string
  name: string
  avatar?: string
  role: UserRole
  status: UserStatus
  preferences: UserPreferences
  dietSettings: DietSettings
  stats: UserStats
  // Easter egg 💕
  isSpecial?: boolean
  specialMessage?: SpecialMessage
  // Timestamps
  createdAt: Date
  updatedAt: Date
  // Methods
  comparePassword(candidatePassword: string): Promise<boolean>
}

// =============================================================================
// Schema
// =============================================================================

const preferencesSchema = new Schema<UserPreferences>(
  {
    theme: { type: String, enum: ['light', 'dark', 'system'], default: 'system' },
    notifications: { type: Boolean, default: true },
    soundEnabled: { type: Boolean, default: true },
    language: { type: String, enum: ['pt-BR', 'en'], default: 'pt-BR' },
    fodmapPhase: {
      type: String,
      enum: ['elimination', 'reintroduction', 'personalization'],
      default: 'elimination',
    },
  },
  { _id: false }
)

const statsSchema = new Schema<UserStats>(
  {
    daysUsingApp: { type: Number, default: 0 },
    totalMealsLogged: { type: Number, default: 0 },
    totalSymptomsLogged: { type: Number, default: 0 },
    currentStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    achievementsUnlocked: { type: Number, default: 0 },
    foodsTested: { type: Number, default: 0 },
    triggersIdentified: { type: Number, default: 0 },
    lastActive: { type: Date, default: Date.now },
  },
  { _id: false }
)

const dailyLimitsSchema = new Schema(
  {
    calories: { type: Number, default: 2000 },
    carbs: { type: Number, default: 225 },
    protein: { type: Number, default: 75 },
    fat: { type: Number, default: 65 },
    sugar: { type: Number, default: 40 },
    fiber: { type: Number, default: 28 },
    sodium: { type: Number, default: 2300 },
  },
  { _id: false }
)

const dietSettingsSchema = new Schema<DietSettings>(
  {
    enabled: { type: Boolean, default: false },
    preset: {
      type: String,
      enum: ['custom', 'maintenance', 'cutting', 'bulking', 'lowcarb', 'balanced'],
      default: 'balanced',
    },
    limits: { type: dailyLimitsSchema, default: () => ({}) },
    showRemaining: { type: Boolean, default: true },
    showProgressBars: { type: Boolean, default: true },
    warningThreshold: { type: Number, default: 80 },
    diaryMode: {
      type: String,
      enum: ['quick', 'detailed'],
      default: 'quick',
    },
  },
  { _id: false }
)

const specialMessageSchema = new Schema<SpecialMessage>(
  {
    title: String,
    subtitle: String,
    messages: [String],
    emoji: String,
    loveLevel: Number,
    specialFeatures: [String],
  },
  { _id: false }
)

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: [true, 'Email é obrigatório'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: {
      type: String,
      required: [true, 'Senha é obrigatória'],
      minlength: [6, 'Senha deve ter no mínimo 6 caracteres'],
      select: false, // Não retorna password por padrão
    },
    name: {
      type: String,
      required: [true, 'Nome é obrigatório'],
      trim: true,
      maxlength: [100, 'Nome deve ter no máximo 100 caracteres'],
    },
    avatar: {
      type: String,
      default: undefined,
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'banned'],
      default: 'active',
    },
    preferences: {
      type: preferencesSchema,
      default: () => ({}),
    },
    dietSettings: {
      type: dietSettingsSchema,
      default: () => ({}),
    },
    stats: {
      type: statsSchema,
      default: () => ({}),
    },
    // Easter egg 💕
    isSpecial: {
      type: Boolean,
      default: false,
    },
    specialMessage: {
      type: specialMessageSchema,
      default: undefined,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      // biome-ignore lint/suspicious/noExplicitAny: Mongoose toJSON transform
      transform: (_, ret: any) => {
        // Transform _id to id for frontend compatibility
        ret.id = ret._id?.toString()
        delete ret._id
        delete ret.password
        delete ret.__v
        return ret
      },
    },
    toObject: {
      virtuals: true,
    },
  }
)

// =============================================================================
// Indexes
// =============================================================================

userSchema.index({ status: 1, role: 1 })
userSchema.index({ 'stats.lastActive': -1 })

// =============================================================================
// Middleware
// =============================================================================

// Normalize email before saving
userSchema.pre('save', function () {
  if (this.isModified('email')) {
    this.email = this.email.toLowerCase().trim()
  }
})

// Hash password before saving with configurable salt rounds
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return

  // Use configurable salt rounds (default 12 for security)
  const salt = await bcrypt.genSalt(env.BCRYPT_SALT_ROUNDS)
  this.password = await bcrypt.hash(this.password, salt)
})

// =============================================================================
// Methods
// =============================================================================

/**
 * Compare password using timing-safe comparison
 * This prevents timing attacks where attackers can guess passwords
 * based on response time differences
 */
userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  try {
    // bcrypt.compare is already timing-safe
    return await bcrypt.compare(candidatePassword, this.password)
  } catch {
    return false
  }
}

// =============================================================================
// Export
// =============================================================================

export const User: Model<IUser> = mongoose.model<IUser>('User', userSchema)
