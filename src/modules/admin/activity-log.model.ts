/**
 * Activity Log Model - Mongoose Schema
 */

import mongoose, { Schema, type Document, type Model } from 'mongoose'
import type { ActivityType } from '@/shared/types'

// =============================================================================
// Interface
// =============================================================================

export interface IActivityLog extends Document {
  _id: mongoose.Types.ObjectId
  type: ActivityType
  userId?: mongoose.Types.ObjectId
  userName?: string
  userEmail?: string
  action: string
  details?: string
  ip_address?: string
  user_agent?: string
  metadata?: Record<string, unknown>
  timestamp: Date
  createdAt: Date
}

// =============================================================================
// Schema
// =============================================================================

const activityLogSchema = new Schema<IActivityLog>(
  {
    type: {
      type: String,
      enum: [
        'user_login',
        'user_register',
        'user_logout',
        'password_change',
        'meal_logged',
        'symptom_logged',
        'entry_deleted',
        'food_search',
        'food_added',
        'food_edited',
        'problematic_food_identified',
        'problematic_food_status_change',
        'profile_updated',
        'account_deleted',
        'admin_action',
        'user_banned',
        'user_unbanned',
        'error',
        'warning',
        'info',
      ],
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    userName: String,
    userEmail: String,
    action: {
      type: String,
      required: true,
    },
    details: String,
    ip_address: String,
    user_agent: String,
    metadata: {
      type: Map,
      of: Schema.Types.Mixed,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      required: true,
      index: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    toJSON: {
      transform: (_, ret) => {
        delete ret.__v
        return ret
      },
    },
  }
)

// =============================================================================
// Indexes
// =============================================================================

activityLogSchema.index({ timestamp: -1 })
activityLogSchema.index({ type: 1, timestamp: -1 })
activityLogSchema.index({ userId: 1, timestamp: -1 })
activityLogSchema.index({ type: 1, userId: 1, timestamp: -1 })

// =============================================================================
// Export
// =============================================================================

export const ActivityLog: Model<IActivityLog> = mongoose.model<IActivityLog>(
  'ActivityLog',
  activityLogSchema
)
