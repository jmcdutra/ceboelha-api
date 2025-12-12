/**
 * User Achievement Model - Progresso por Usuário
 * 
 * Armazena o progresso e status das conquistas para cada usuário.
 * Relaciona com Achievement (master data) via achievementId.
 */

import mongoose, { Schema, type Document, type Model } from 'mongoose'

// =============================================================================
// Interface
// =============================================================================

export interface IUserAchievement extends Document {
  _id: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  achievementId: string // Referência ao Achievement.id
  
  // Status
  unlocked: boolean
  progress: number // 0 até target
  
  // Datas
  startedAt: Date
  unlockedAt?: Date
  
  // Notificação
  notified: boolean
  
  createdAt: Date
  updatedAt: Date
}

// =============================================================================
// Schema
// =============================================================================

const userAchievementSchema = new Schema<IUserAchievement>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    achievementId: {
      type: String,
      required: true,
      index: true,
    },
    
    // Status
    unlocked: {
      type: Boolean,
      default: false,
    },
    progress: {
      type: Number,
      default: 0,
      min: 0,
    },
    
    // Datas
    startedAt: {
      type: Date,
      default: Date.now,
    },
    unlockedAt: Date,
    
    // Notificação
    notified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    collection: 'user_achievements',
  }
)

// =============================================================================
// Indexes
// =============================================================================

// Índice composto para buscar progresso do usuário
userAchievementSchema.index({ userId: 1, achievementId: 1 }, { unique: true })

// Índice para buscar conquistas desbloqueadas
userAchievementSchema.index({ userId: 1, unlocked: 1 })

// Índice para notificações pendentes
userAchievementSchema.index({ userId: 1, unlocked: 1, notified: 1 })

// =============================================================================
// Model
// =============================================================================

export const UserAchievement: Model<IUserAchievement> = mongoose.model<IUserAchievement>(
  'UserAchievement',
  userAchievementSchema
)
