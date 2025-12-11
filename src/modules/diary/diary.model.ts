/**
 * Diary Entry Model - Mongoose Schema
 */

import mongoose, { Schema, type Document, type Model } from 'mongoose'
import type {
  DiaryEntryType,
  MealType,
  SymptomType,
  SymptomIntensity,
  MealData,
  SymptomData,
  DiaryFood,
  CalculatedNutrition,
} from '@/shared/types'

// =============================================================================
// Interface
// =============================================================================

export interface IDiaryEntry extends Document {
  _id: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  type: DiaryEntryType
  date: Date
  meal?: MealData
  symptom?: SymptomData
  createdAt: Date
  updatedAt: Date
}

// =============================================================================
// Schema
// =============================================================================

const calculatedNutritionSchema = new Schema<CalculatedNutrition>(
  {
    calories: Number,
    carbs: Number,
    protein: Number,
    fat: Number,
    sugar: Number,
    fiber: Number,
    sodium: Number,
  },
  { _id: false }
)

const diaryFoodSchema = new Schema<DiaryFood>(
  {
    foodId: { type: Number, required: true },
    foodName: { type: String, required: true },
    portion: String,
    quantity_g: Number,
    markedAsBad: { type: Boolean, default: false },
    calculatedNutrition: calculatedNutritionSchema,
  },
  { _id: false }
)

const mealDataSchema = new Schema<MealData>(
  {
    type: {
      type: String,
      enum: ['breakfast', 'lunch', 'dinner', 'snack'],
      required: true,
    },
    time: {
      type: String,
      required: true,
      validate: {
        validator: (v: string) => /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v),
        message: 'Formato de hora inválido. Use HH:MM',
      },
    },
    foods: {
      type: [diaryFoodSchema],
      required: true,
      validate: {
        validator: (v: DiaryFood[]) => v.length > 0,
        message: 'Pelo menos um alimento é obrigatório',
      },
    },
    notes: String,
  },
  { _id: false }
)

const symptomDataSchema = new Schema<SymptomData>(
  {
    type: {
      type: String,
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
    time: {
      type: String,
      required: true,
      validate: {
        validator: (v: string) => /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v),
        message: 'Formato de hora inválido. Use HH:MM',
      },
    },
    duration: {
      type: Number,
      min: 0,
    },
    notes: String,
  },
  { _id: false }
)

const diaryEntrySchema = new Schema<IDiaryEntry>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['meal', 'symptom'],
      required: true,
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    meal: mealDataSchema,
    symptom: symptomDataSchema,
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

diaryEntrySchema.index({ userId: 1, date: -1 })
diaryEntrySchema.index({ userId: 1, type: 1, date: -1 })
diaryEntrySchema.index({ userId: 1, 'meal.foods.foodId': 1 })
diaryEntrySchema.index({ userId: 1, type: 1, 'symptom.intensity': -1 })

// =============================================================================
// Validation
// =============================================================================

diaryEntrySchema.pre('validate', function (next) {
  if (this.type === 'meal' && !this.meal) {
    this.invalidate('meal', 'Dados da refeição são obrigatórios quando type é "meal"')
  }
  if (this.type === 'symptom' && !this.symptom) {
    this.invalidate('symptom', 'Dados do sintoma são obrigatórios quando type é "symptom"')
  }
  next()
})

// =============================================================================
// Export
// =============================================================================

export const DiaryEntry: Model<IDiaryEntry> = mongoose.model<IDiaryEntry>(
  'DiaryEntry',
  diaryEntrySchema
)
