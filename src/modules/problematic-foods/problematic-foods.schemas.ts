/**
 * Problematic Foods Schemas - TypeBox Validation
 */

import { t } from 'elysia'

// =============================================================================
// Types
// =============================================================================

const symptomTypeValues = [
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

const statusValues = ['suspected', 'confirmed'] as const

// =============================================================================
// Body Schemas
// =============================================================================

/**
 * Schema for marking a food as problematic
 * POST /diary/problematic-foods
 */
export const markAsBadBodySchema = t.Object({
  diaryEntryId: t.Optional(t.String()), // Opcional - quando é registro direto sem refeição
  foodId: t.Number({ minimum: 1 }),
  foodName: t.Optional(t.String()), // Se não vier, buscar do banco
  symptomTypes: t.Array(
    t.Union(symptomTypeValues.map(v => t.Literal(v))),
    { minItems: 1 }
  ),
  intensity: t.Number({ minimum: 1, maximum: 5 }),
  notes: t.Optional(t.String({ maxLength: 500 })),
})

// =============================================================================
// Param Schemas
// =============================================================================

/**
 * Schema for :id param
 */
export const idParamSchema = t.Object({
  id: t.String({ minLength: 1 }),
})

/**
 * Schema for :foodId param
 */
export const foodIdParamSchema = t.Object({
  foodId: t.String({ pattern: '^[0-9]+$' }),
})

/**
 * Schema for :id/incidents/:incidentId params
 */
export const incidentParamsSchema = t.Object({
  id: t.String({ minLength: 1 }),
  incidentId: t.String({ minLength: 1 }),
})

// =============================================================================
// Types Export
// =============================================================================

export type MarkAsBadBody = typeof markAsBadBodySchema.static
