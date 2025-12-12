/**
 * News Schemas - Elysia/TypeBox validation schemas
 */

import { t } from 'elysia'

// =============================================================================
// Enums
// =============================================================================

export const articleCategorySchema = t.Union([
  t.Literal('recipe'),
  t.Literal('article'),
  t.Literal('tip'),
  t.Literal('wellness'),
  t.Literal('news'),
])

export const articleStatusSchema = t.Union([
  t.Literal('draft'),
  t.Literal('published'),
  t.Literal('archived'),
])

export const recipeDifficultySchema = t.Union([
  t.Literal('easy'),
  t.Literal('medium'),
  t.Literal('hard'),
])

export const fodmapPhaseSchema = t.Union([
  t.Literal('elimination'),
  t.Literal('reintroduction'),
  t.Literal('maintenance'),
])

// =============================================================================
// Sub-schemas
// =============================================================================

export const authorSchema = t.Object({
  name: t.String(),
  avatar: t.Optional(t.String()),
  bio: t.Optional(t.String()),
})

export const recipeNutritionSchema = t.Object({
  calories: t.Number(),
  protein_g: t.Number(),
  carbs_g: t.Number(),
  fat_g: t.Number(),
  fiber_g: t.Number(),
})

export const recipeSchema = t.Object({
  prep_time: t.Number(),
  cook_time: t.Number(),
  servings: t.Number(),
  difficulty: recipeDifficultySchema,
  ingredients: t.Array(t.String()),
  instructions: t.Array(t.String()),
  nutrition: t.Optional(recipeNutritionSchema),
  fodmap_friendly: t.Boolean(),
  fodmap_phase: t.Optional(fodmapPhaseSchema),
})

// =============================================================================
// Article Schema
// =============================================================================

export const articleSchema = t.Object({
  id: t.Number(),
  title: t.String(),
  excerpt: t.String(),
  content: t.Optional(t.String()), // Optional in list, present in detail
  image_url: t.Optional(t.String()),
  category: articleCategorySchema,
  tags: t.Array(t.String()),
  author: authorSchema,
  publishedAt: t.Optional(t.String()),
  updatedAt: t.String(),
  status: articleStatusSchema,
  featured: t.Boolean(),
  views: t.Number(),
  likes: t.Number(),
  recipe: t.Optional(recipeSchema),
  createdAt: t.String(),
})

// Article list item (without content)
export const articleListItemSchema = t.Omit(articleSchema, ['content'])

// =============================================================================
// Query Schemas
// =============================================================================

export const getArticlesQuerySchema = t.Object({
  page: t.Optional(t.String({ pattern: '^[1-9][0-9]*$' })),
  limit: t.Optional(t.String({ pattern: '^[1-9][0-9]*$' })),
  category: t.Optional(articleCategorySchema),
  tag: t.Optional(t.String()),
  featured: t.Optional(t.Union([t.Literal('true'), t.Literal('false')])),
  search: t.Optional(t.String()),
})

export const articleIdParamSchema = t.Object({
  id: t.String({ pattern: '^[1-9][0-9]*$' }),
})

// =============================================================================
// Response Schemas
// =============================================================================

export const paginationSchema = t.Object({
  page: t.Number(),
  limit: t.Number(),
  total: t.Number(),
  totalPages: t.Number(),
  hasMore: t.Boolean(),
})

export const articlesListResponseSchema = t.Object({
  success: t.Boolean(),
  data: t.Object({
    articles: t.Array(articleListItemSchema),
    pagination: paginationSchema,
  }),
})

export const articleDetailResponseSchema = t.Object({
  success: t.Boolean(),
  data: articleSchema,
})

export const featuredArticlesResponseSchema = t.Object({
  success: t.Boolean(),
  data: t.Array(articleListItemSchema),
})

export const tagsResponseSchema = t.Object({
  success: t.Boolean(),
  data: t.Array(t.String()),
})

export const likeResponseSchema = t.Object({
  success: t.Boolean(),
  data: t.Object({
    likes: t.Number(),
  }),
})

// =============================================================================
// Request Body Schemas (for Admin - Etapa 10)
// =============================================================================

export const createArticleBodySchema = t.Object({
  title: t.String({ minLength: 1, maxLength: 200 }),
  excerpt: t.String({ minLength: 1, maxLength: 500 }),
  content: t.String({ minLength: 1 }),
  image_url: t.Optional(t.String()),
  category: articleCategorySchema,
  tags: t.Optional(t.Array(t.String())),
  author: authorSchema,
  status: t.Optional(articleStatusSchema),
  featured: t.Optional(t.Boolean()),
  recipe: t.Optional(recipeSchema),
})

export const updateArticleBodySchema = t.Partial(createArticleBodySchema)
