/**
 * System Settings Model - Mongoose Schema (Singleton)
 */

import mongoose, { Schema, type Model } from 'mongoose'

// =============================================================================
// Interface
// =============================================================================

export interface ISystemSettings {
  _id: string // Fixed ID: 'system_settings' (singleton pattern)
  maintenance: {
    enabled: boolean
    message: string
    estimated_end?: Date
  }
  features: {
    diary_enabled: boolean
    insights_enabled: boolean
    news_enabled: boolean
    problematic_foods_enabled: boolean
    achievements_enabled: boolean
    notifications_enabled: boolean
    ai_features_enabled: boolean
  }
  limits: {
    max_diary_entries_per_day: number
    max_foods_per_meal: number
    max_problematic_foods: number
    max_file_upload_size_mb: number
    rate_limit_requests_per_minute: number
  }
  notifications: {
    daily_reminder_enabled: boolean
    reminder_time: string
    achievement_notifications: boolean
    problematic_food_alerts: boolean
    news_notifications: boolean
  }
  version: {
    current: string
    minimum_required: string
    update_required: boolean
    update_message?: string
  }
  updatedAt: Date
  updatedBy?: mongoose.Types.ObjectId
}

// =============================================================================
// Schema
// =============================================================================

const systemSettingsSchema = new Schema(
  {
    _id: {
      type: String,
      default: 'system_settings',
    },
    maintenance: {
      enabled: { type: Boolean, default: false },
      message: { type: String, default: 'Sistema em manutenção. Voltamos em breve!' },
      estimated_end: Date,
    },
    features: {
      diary_enabled: { type: Boolean, default: true },
      insights_enabled: { type: Boolean, default: true },
      news_enabled: { type: Boolean, default: true },
      problematic_foods_enabled: { type: Boolean, default: true },
      achievements_enabled: { type: Boolean, default: true },
      notifications_enabled: { type: Boolean, default: true },
      ai_features_enabled: { type: Boolean, default: false },
    },
    limits: {
      max_diary_entries_per_day: { type: Number, default: 50 },
      max_foods_per_meal: { type: Number, default: 20 },
      max_problematic_foods: { type: Number, default: 50 },
      max_file_upload_size_mb: { type: Number, default: 5 },
      rate_limit_requests_per_minute: { type: Number, default: 30 },
    },
    notifications: {
      daily_reminder_enabled: { type: Boolean, default: true },
      reminder_time: { type: String, default: '20:00' },
      achievement_notifications: { type: Boolean, default: true },
      problematic_food_alerts: { type: Boolean, default: true },
      news_notifications: { type: Boolean, default: true },
    },
    version: {
      current: { type: String, default: '1.0.0' },
      minimum_required: { type: String, default: '1.0.0' },
      update_required: { type: Boolean, default: false },
      update_message: String,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: { createdAt: false, updatedAt: true },
    toJSON: {
      // biome-ignore lint/suspicious/noExplicitAny: Mongoose toJSON transform
      transform: (_, ret: any) => {
        delete ret.__v
        return ret
      },
    },
  }
)

// =============================================================================
// Static Methods
// =============================================================================

systemSettingsSchema.statics.getSettings = async function (): Promise<ISystemSettings> {
  let settings = await this.findById('system_settings')
  if (!settings) {
    settings = await this.create({ _id: 'system_settings' })
  }
  return settings
}

// =============================================================================
// Export
// =============================================================================

export const SystemSettings: Model<ISystemSettings> & {
  getSettings(): Promise<ISystemSettings>
} = mongoose.model<ISystemSettings>('SystemSettings', systemSettingsSchema) as Model<ISystemSettings> & {
  getSettings(): Promise<ISystemSettings>
}
