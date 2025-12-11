/**
 * Problematic Food Model - Mongoose Schema
 */

import mongoose, { Schema, type Document, type Model } from 'mongoose'
import type { ProblematicFoodStatus, ProblematicFoodIncident, SymptomType } from '@/shared/types'

// =============================================================================
// Interface
// =============================================================================

export interface IProblematicFood extends Document {
  _id: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  foodId: number
  foodName: string
  totalIncidents: number
  lastIncident: string
  status: ProblematicFoodStatus
  incidents: ProblematicFoodIncident[]
  createdAt: Date
  updatedAt: Date
}

// =============================================================================
// Schema
// =============================================================================

const incidentSchema = new Schema<ProblematicFoodIncident>(
  {
    diaryEntryId: { type: String, required: true },
    date: { type: String, required: true },
    symptomTypes: {
      type: [String],
      enum: [
        'bloating',
        'gas',
        'cramps',
        'nausea',
        'diarrhea',
        'constipation',
        'reflux',
        'fatigue',
        'headache',
        'brain_fog',
        'other',
      ],
      required: true,
    },
    intensity: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },
    notes: String,
  },
  { _id: false }
)

const problematicFoodSchema = new Schema<IProblematicFood>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    foodId: {
      type: Number,
      required: true,
    },
    foodName: {
      type: String,
      required: true,
    },
    totalIncidents: {
      type: Number,
      default: 0,
    },
    lastIncident: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['suspected', 'confirmed'],
      default: 'suspected',
    },
    incidents: {
      type: [incidentSchema],
      default: [],
    },
  },
  {
    timestamps: true,
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

// Unique compound index - one record per user+food
problematicFoodSchema.index({ userId: 1, foodId: 1 }, { unique: true })
problematicFoodSchema.index({ userId: 1, status: 1 })
problematicFoodSchema.index({ userId: 1, lastIncident: -1 })

// =============================================================================
// Export
// =============================================================================

export const ProblematicFood: Model<IProblematicFood> = mongoose.model<IProblematicFood>(
  'ProblematicFood',
  problematicFoodSchema
)
