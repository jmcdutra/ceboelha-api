/**
 * Insights Schemas - Elysia/TypeBox Validation
 */

import { t } from 'elysia'

// =============================================================================
// Response Schemas (for Swagger documentation)
// =============================================================================

export const highlightSchema = t.Object({
  id: t.String(),
  type: t.Union([
    t.Literal('achievement'),
    t.Literal('pattern'),
    t.Literal('warning'),
    t.Literal('tip'),
  ]),
  emoji: t.String(),
  title: t.String(),
  message: t.String(),
  action: t.Optional(
    t.Object({
      label: t.String(),
      href: t.String(),
    })
  ),
  priority: t.Number(),
  createdAt: t.String(),
})

export const weeklySummarySchema = t.Object({
  daysLogged: t.Number(),
  totalSymptoms: t.Number(),
  avgIntensity: t.Number(),
  totalMeals: t.Number(),
  uniqueFoods: t.Number(),
  comparisonLastWeek: t.Object({
    symptoms: t.Number(),
    intensity: t.Number(),
  }),
  streak: t.Number(),
  periodStart: t.String(),
  periodEnd: t.String(),
})

export const discoverySchema = t.Object({
  id: t.String(),
  type: t.Union([
    t.Literal('trigger'),
    t.Literal('time_pattern'),
    t.Literal('combination'),
    t.Literal('safe_food'),
  ]),
  confidence: t.Union([
    t.Literal('high'),
    t.Literal('medium'),
    t.Literal('low'),
  ]),
  title: t.String(),
  description: t.String(),
  data: t.Object({
    foods: t.Optional(t.Array(t.String())),
    symptoms: t.Optional(t.Array(t.String())),
    timeRange: t.Optional(t.String()),
    occurrences: t.Number(),
  }),
  discoveredAt: t.String(),
  isNew: t.Boolean(),
})

// =============================================================================
// Response Wrappers
// =============================================================================

export const highlightsResponseSchema = t.Object({
  success: t.Boolean(),
  data: t.Array(highlightSchema),
})

export const weeklySummaryResponseSchema = t.Object({
  success: t.Boolean(),
  data: weeklySummarySchema,
})

export const discoveriesResponseSchema = t.Object({
  success: t.Boolean(),
  data: t.Array(discoverySchema),
})
