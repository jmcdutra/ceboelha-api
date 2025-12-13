/**
 * Food Model - Mongoose Schema
 */

import mongoose, { Schema, type Document, type Model } from 'mongoose'
import type { FodmapLevel, FoodSource, FodmapInfo } from '@/shared/types'

// =============================================================================
// Interfaces
// =============================================================================

export interface INutritionInfo {
  energy_kcal: number
  energy_kj: number
  reference_portion: string
  macronutrients: {
    lipids_g: string
    saturated_fatty_acids_g: string
    monounsaturated_fatty_acids_g: string
    polyunsaturated_fatty_acids_g: string
    linoleic_acid_g: string
    trans_fatty_acids_g: string
    cholesterol_mg: string
    carbohydrates_g: string
    sugars_g: string
    oligosaccharides_g: string
    starch_g: string
    protein_g: string
    fiber_g: string
    salt_g: string
    alcohol_g: string
    water_g: string
    organic_acids_g: string
    ash_g: string
  }
  vitamins: Record<string, string | null>
  minerals: Record<string, string | null>
}

export interface IDataSources {
  nutritional_data: string
  fodmap_data?: string
  ai_generated?: {
    is_ai_generated: boolean
    ai_source?: string
    fields_affected?: string[]
  }
}

export interface IFood extends Document {
  _id: mongoose.Types.ObjectId
  id: number // Numeric ID for compatibility
  name: string
  source: FoodSource
  category_level_1: string
  category_level_2?: string
  category_level_3?: string
  image?: string
  fodmap?: FodmapInfo
  nutrition?: INutritionInfo
  data_sources: IDataSources
  searchCount: number
  createdAt: Date
  updatedAt: Date
}

// =============================================================================
// Schema
// =============================================================================

// Schema for individual ingredients in multiple_ingredients match
const fodmapIngredientSchema = new Schema(
  {
    portuguese_keyword: String,
    name_english: String,
    level: {
      type: String,
      enum: ['free', 'low', 'medium', 'high'],
    },
    portion_note: { type: String, default: null },
    category: String,
  },
  { _id: false }
)

const fodmapSearchInfoSchema = new Schema(
  {
    match_type: {
      type: String,
      enum: ['single_ingredient', 'multiple_ingredients'],
    },
    // Fields for single_ingredient match
    category: String,
    name_english: String,
    detected_keyword: String,
    // Fields for multiple_ingredients match
    total_ingredients: Number,
    ingredients: [fodmapIngredientSchema],
  },
  { _id: false }
)

const fodmapSchema = new Schema(
  {
    level: {
      type: String,
      enum: ['free', 'low', 'medium', 'high'],
    },
    portion_note: { type: String, default: null },
    additional_notes: { type: String, default: null },
    search_information: fodmapSearchInfoSchema,
  },
  { _id: false }
)

const macronutrientsSchema = new Schema(
  {
    lipids_g: String,
    saturated_fatty_acids_g: String,
    monounsaturated_fatty_acids_g: String,
    polyunsaturated_fatty_acids_g: String,
    linoleic_acid_g: String,
    trans_fatty_acids_g: String,
    cholesterol_mg: String,
    carbohydrates_g: String,
    sugars_g: String,
    oligosaccharides_g: String,
    starch_g: String,
    protein_g: String,
    fiber_g: String,
    salt_g: String,
    alcohol_g: String,
    water_g: String,
    organic_acids_g: String,
    ash_g: String,
  },
  { _id: false }
)

const nutritionSchema = new Schema(
  {
    energy_kcal: Number,
    energy_kj: Number,
    reference_portion: { type: String, default: '100g' },
    macronutrients: macronutrientsSchema,
    vitamins: { type: Map, of: Schema.Types.Mixed },
    minerals: { type: Map, of: Schema.Types.Mixed },
  },
  { _id: false }
)

const dataSourcesSchema = new Schema(
  {
    nutritional_data: String,
    fodmap_data: String,
    ai_generated: {
      is_ai_generated: Boolean,
      ai_source: String,
      fields_affected: [String],
    },
  },
  { _id: false }
)

const foodSchema = new Schema<IFood>(
  {
    id: {
      type: Number,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Nome do alimento é obrigatório'],
      trim: true,
      index: 'text',
    },
    source: {
      type: String,
      enum: ['nutritional_table', 'user_contributed', 'ai_generated'],
      default: 'nutritional_table',
    },
    category_level_1: {
      type: String,
      required: true,
      index: true,
    },
    category_level_2: String,
    category_level_3: String,
    image: {
      type: String,
      default: null,
    },
    fodmap: fodmapSchema,
    nutrition: nutritionSchema,
    data_sources: dataSourcesSchema,
    searchCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_, ret: Record<string, unknown>) => {
        delete ret.__v
        return ret
      },
    },
  }
)

// =============================================================================
// Indexes
// =============================================================================

foodSchema.index({ name: 'text', category_level_1: 'text', category_level_3: 'text' })
foodSchema.index({ 'fodmap.level': 1 })
foodSchema.index({ searchCount: -1 })
foodSchema.index({ 'data_sources.ai_generated.is_ai_generated': 1, searchCount: -1 })

// =============================================================================
// Export
// =============================================================================

export const Food: Model<IFood> = mongoose.model<IFood>('Food', foodSchema)
