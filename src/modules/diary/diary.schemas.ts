/**
 * Diary Schemas - TypeBox Validation Schemas
 *
 * Validation schemas for diary endpoints
 */

import { t } from 'elysia'

// =============================================================================
// Constants
// =============================================================================

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'] as const
const SYMPTOM_TYPES = [
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
] as const

// =============================================================================
// Shared Schemas
// =============================================================================

const timeSchema = t.String({
  pattern: '^([01]?[0-9]|2[0-3]):[0-5][0-9]$',
  description: 'Horário no formato HH:MM',
})

const dateSchema = t.String({
  pattern: '^\\d{4}-\\d{2}-\\d{2}$',
  description: 'Data no formato YYYY-MM-DD',
})

const calculatedNutritionSchema = t.Optional(
  t.Object({
    calories: t.Number(),
    carbs: t.Number(),
    protein: t.Number(),
    fat: t.Number(),
    sugar: t.Number(),
    fiber: t.Number(),
    sodium: t.Number(),
  })
)

const diaryFoodSchema = t.Object({
  foodId: t.Number({ description: 'ID do alimento' }),
  foodName: t.String({ minLength: 1, description: 'Nome do alimento' }),
  portion: t.Optional(t.String({ description: 'Descrição da porção' })),
  quantity_g: t.Optional(t.Number({ minimum: 0, description: 'Quantidade em gramas' })),
  markedAsBad: t.Optional(t.Boolean({ description: 'Se foi marcado como problemático' })),
  calculatedNutrition: calculatedNutritionSchema,
})

// =============================================================================
// Create Meal Schema
// =============================================================================

export const createMealBodySchema = t.Object({
  date: dateSchema,
  meal: t.Object({
    type: t.Union(MEAL_TYPES.map((type) => t.Literal(type)), {
      description: 'Tipo da refeição',
    }),
    time: timeSchema,
    foods: t.Array(diaryFoodSchema, {
      minItems: 1,
      description: 'Lista de alimentos (mínimo 1)',
    }),
    notes: t.Optional(t.String({ maxLength: 500, description: 'Observações' })),
  }),
})

// =============================================================================
// Create Symptom Schema
// =============================================================================

export const createSymptomBodySchema = t.Object({
  date: dateSchema,
  symptom: t.Object({
    type: t.Union(SYMPTOM_TYPES.map((type) => t.Literal(type)), {
      description: 'Tipo do sintoma',
    }),
    intensity: t.Number({
      minimum: 1,
      maximum: 5,
      description: 'Intensidade de 1 a 5',
    }),
    time: timeSchema,
    duration: t.Optional(t.Number({ minimum: 0, description: 'Duração em minutos' })),
    notes: t.Optional(t.String({ maxLength: 500, description: 'Observações' })),
  }),
})

// =============================================================================
// Update Entry Schema
// =============================================================================

export const updateEntryBodySchema = t.Object({
  meal: t.Optional(
    t.Object({
      type: t.Optional(t.Union(MEAL_TYPES.map((type) => t.Literal(type)))),
      time: t.Optional(timeSchema),
      foods: t.Optional(t.Array(diaryFoodSchema, { minItems: 1 })),
      notes: t.Optional(t.String({ maxLength: 500 })),
    })
  ),
  symptom: t.Optional(
    t.Object({
      type: t.Optional(t.Union(SYMPTOM_TYPES.map((type) => t.Literal(type)))),
      intensity: t.Optional(t.Number({ minimum: 1, maximum: 5 })),
      time: t.Optional(timeSchema),
      duration: t.Optional(t.Number({ minimum: 0 })),
      notes: t.Optional(t.String({ maxLength: 500 })),
    })
  ),
})

// =============================================================================
// Query Schemas
// =============================================================================

export const diaryQuerySchema = t.Object({
  date: t.Optional(dateSchema),
  startDate: t.Optional(dateSchema),
  endDate: t.Optional(dateSchema),
  type: t.Optional(t.Union([t.Literal('meal'), t.Literal('symptom'), t.Literal('all')])),
})

export const symptomsOverviewQuerySchema = t.Object({
  days: t.Optional(
    t.String({
      pattern: '^\\d+$',
      description: 'Número de dias para análise (padrão: 30)',
    })
  ),
})

// =============================================================================
// Param Schemas
// =============================================================================

export const entryIdParamSchema = t.Object({
  id: t.String({ description: 'ID da entrada do diário' }),
})

export const dayDateParamSchema = t.Object({
  date: dateSchema,
})

export const monthParamSchema = t.Object({
  year: t.String({ pattern: '^\\d{4}$', description: 'Ano (YYYY)' }),
  month: t.String({ pattern: '^(0?[1-9]|1[0-2])$', description: 'Mês (1-12)' }),
})
