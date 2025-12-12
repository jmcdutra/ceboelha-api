/**
 * Foods Schemas - Elysia/TypeBox Validation
 */

import { t } from 'elysia'

// =============================================================================
// Query Schemas
// =============================================================================

/**
 * Query parameters for GET /foods
 */
export const foodsQuerySchema = t.Object({
  search: t.Optional(t.String({ minLength: 1, maxLength: 100 })),
  level: t.Optional(t.Union([
    t.Literal('free'),
    t.Literal('low'),
    t.Literal('medium'),
    t.Literal('high'),
    t.Literal('all'),
  ])),
  category: t.Optional(t.String({ minLength: 1, maxLength: 100 })),
  category2: t.Optional(t.String({ minLength: 1, maxLength: 200 })),
  category3: t.Optional(t.String({ minLength: 1, maxLength: 200 })),
  hasFodmap: t.Optional(t.Union([t.Literal('true'), t.Literal('false')])),
  hasNutrition: t.Optional(t.Union([t.Literal('true'), t.Literal('false')])),
  source: t.Optional(t.String({ minLength: 1, maxLength: 50 })),
  sortBy: t.Optional(t.Union([
    t.Literal('name'),
    t.Literal('energy'),
    t.Literal('protein'),
    t.Literal('carbs'),
    t.Literal('fat'),
  ])),
  sortOrder: t.Optional(t.Union([t.Literal('asc'), t.Literal('desc')])),
  page: t.Optional(t.String({ pattern: '^[1-9][0-9]*$' })), // Query params come as strings
  limit: t.Optional(t.String({ pattern: '^[1-9][0-9]*$' })),
})

/**
 * ID parameter for GET /foods/:id
 */
export const foodIdParamSchema = t.Object({
  id: t.String({ pattern: '^[1-9][0-9]*$' }),
})

// =============================================================================
// Types
// =============================================================================

export type FoodsQuery = typeof foodsQuerySchema.static
export type FoodIdParam = typeof foodIdParamSchema.static
