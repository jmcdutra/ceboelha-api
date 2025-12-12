/**
 * Achievement Model - Master Data (Definições)
 * 
 * Armazena as definições de todas as conquistas disponíveis no sistema.
 * Estas são as "templates" - o progresso do usuário fica em UserAchievement.
 */

import mongoose, { Schema, type Document, type Model } from 'mongoose'

// =============================================================================
// Types
// =============================================================================

export type AchievementCategory = 'diary' | 'streak' | 'exploration' | 'social' | 'special'
export type AchievementRarity = 'common' | 'rare' | 'epic' | 'legendary'
export type RequirementType = 'count' | 'streak' | 'unique' | 'custom'

// Métricas suportadas pelo sistema
export type MetricType =
  | 'first_login'
  | 'meals_logged'
  | 'symptoms_logged'
  | 'days_logged'
  | 'days_streak'
  | 'foods_tested'
  | 'problematic_foods_marked'
  | 'safe_foods_found'
  | 'custom'

// =============================================================================
// Interfaces
// =============================================================================

export interface IRequirement {
  type: RequirementType
  target: number
  metric: MetricType
}

export interface IReward {
  points: number // XP
  badge?: string
  unlocks?: string[] // Features ou conquistas desbloqueadas
}

export interface IAchievement extends Document {
  _id: mongoose.Types.ObjectId
  id: string // ID único (ex: 'first_meal', 'week_streak')
  
  // Informações
  title: string
  description: string
  icon: string // Emoji
  color: string // Hex color
  
  // Categoria
  category: AchievementCategory
  
  // Condições
  requirement: IRequirement
  
  // Recompensa
  reward: IReward
  
  // Raridade
  rarity: AchievementRarity
  
  // Controle
  hidden: boolean // Conquista secreta
  active: boolean
  order: number
  
  createdAt: Date
  updatedAt: Date
}

// =============================================================================
// Schema
// =============================================================================

const requirementSchema = new Schema<IRequirement>(
  {
    type: {
      type: String,
      enum: ['count', 'streak', 'unique', 'custom'],
      required: true,
    },
    target: {
      type: Number,
      required: true,
      min: 1,
    },
    metric: {
      type: String,
      required: true,
    },
  },
  { _id: false }
)

const rewardSchema = new Schema<IReward>(
  {
    points: {
      type: Number,
      required: true,
      min: 0,
    },
    badge: String,
    unlocks: [String],
  },
  { _id: false }
)

const achievementSchema = new Schema<IAchievement>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    
    // Informações
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 300,
    },
    icon: {
      type: String,
      required: true,
      default: '🏆',
    },
    color: {
      type: String,
      required: true,
      default: '#22c55e',
    },
    
    // Categoria
    category: {
      type: String,
      enum: ['diary', 'streak', 'exploration', 'social', 'special'],
      required: true,
    },
    
    // Condições
    requirement: {
      type: requirementSchema,
      required: true,
    },
    
    // Recompensa
    reward: {
      type: rewardSchema,
      required: true,
    },
    
    // Raridade
    rarity: {
      type: String,
      enum: ['common', 'rare', 'epic', 'legendary'],
      default: 'common',
    },
    
    // Controle
    hidden: {
      type: Boolean,
      default: false,
    },
    active: {
      type: Boolean,
      default: true,
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    collection: 'achievements',
  }
)

// =============================================================================
// Indexes
// =============================================================================

achievementSchema.index({ category: 1, order: 1 })
achievementSchema.index({ active: 1 })
achievementSchema.index({ 'requirement.metric': 1 })

// =============================================================================
// Model
// =============================================================================

export const Achievement: Model<IAchievement> = mongoose.model<IAchievement>(
  'Achievement',
  achievementSchema
)
