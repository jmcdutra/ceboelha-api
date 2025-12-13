/**
 * Admin Schemas - Elysia/TypeBox validation schemas
 */

import { t } from 'elysia'

// =============================================================================
// Common Schemas
// =============================================================================

export const paginationQuerySchema = t.Object({
  page: t.Optional(t.String({ pattern: '^[1-9][0-9]*$' })),
  limit: t.Optional(t.String({ pattern: '^[1-9][0-9]*$' })),
})

export const idParamSchema = t.Object({
  id: t.String(),
})

export const numericIdParamSchema = t.Object({
  id: t.String({ pattern: '^[0-9]+$' }),
})

// =============================================================================
// User Schemas
// =============================================================================

export const userRoleSchema = t.Union([
  t.Literal('user'),
  t.Literal('admin'),
])

export const userStatusSchema = t.Union([
  t.Literal('active'),
  t.Literal('inactive'),
  t.Literal('banned'),
])

export const adminUsersQuerySchema = t.Object({
  search: t.Optional(t.String()),
  role: t.Optional(t.Union([userRoleSchema, t.Literal('all')])),
  status: t.Optional(t.Union([userStatusSchema, t.Literal('all')])),
  page: t.Optional(t.String({ pattern: '^[1-9][0-9]*$' })),
  limit: t.Optional(t.String({ pattern: '^[1-9][0-9]*$' })),
})

export const createUserBodySchema = t.Object({
  email: t.String({ format: 'email' }),
  name: t.String({ minLength: 2, maxLength: 100 }),
  password: t.String({ minLength: 8 }),
  role: t.Optional(userRoleSchema),
})

export const updateUserBodySchema = t.Object({
  name: t.Optional(t.String({ minLength: 2, maxLength: 100 })),
  email: t.Optional(t.String({ format: 'email' })),
  role: t.Optional(userRoleSchema),
  status: t.Optional(userStatusSchema),
})

// =============================================================================
// Food Schemas
// =============================================================================

export const fodmapLevelSchema = t.Union([
  t.Literal('free'),
  t.Literal('low'),
  t.Literal('medium'),
  t.Literal('high'),
])

export const adminFoodsQuerySchema = t.Object({
  search: t.Optional(t.String()),
  category: t.Optional(t.String()),
  fodmapLevel: t.Optional(t.Union([fodmapLevelSchema, t.Literal('none'), t.Literal('all')])),
  isAiGenerated: t.Optional(t.String({ pattern: '^(true|false)$' })),
  page: t.Optional(t.String({ pattern: '^[1-9][0-9]*$' })),
  limit: t.Optional(t.String({ pattern: '^[1-9][0-9]*$' })),
})

export const createFoodBodySchema = t.Object({
  name: t.String({ minLength: 1, maxLength: 200 }),
  category_level_1: t.String({ minLength: 1 }),
  category_level_2: t.Optional(t.String()),
  category_level_3: t.Optional(t.String()),
  image: t.Optional(t.String({ format: 'uri' })),
  fodmapLevel: t.Optional(fodmapLevelSchema),
  fodmapNote: t.Optional(t.String()),
})

export const updateFoodBodySchema = t.Object({
  name: t.Optional(t.String({ minLength: 1, maxLength: 200 })),
  category_level_1: t.Optional(t.String()),
  category_level_2: t.Optional(t.String()),
  category_level_3: t.Optional(t.String()),
  image: t.Optional(t.String({ format: 'uri' })),
  fodmapLevel: t.Optional(fodmapLevelSchema),
  fodmapNote: t.Optional(t.String()),
  isAiGenerated: t.Optional(t.Boolean()),
})

// =============================================================================
// News Schemas
// =============================================================================

export const newsCategorySchema = t.Union([
  t.Literal('recipe'),
  t.Literal('article'),
  t.Literal('tip'),
  t.Literal('wellness'),
  t.Literal('news'),
])

export const newsStatusSchema = t.Union([
  t.Literal('draft'),
  t.Literal('published'),
  t.Literal('archived'),
])

export const adminNewsQuerySchema = t.Object({
  search: t.Optional(t.String()),
  category: t.Optional(t.Union([newsCategorySchema, t.Literal('all')])),
  status: t.Optional(t.Union([newsStatusSchema, t.Literal('all')])),
  page: t.Optional(t.String({ pattern: '^[1-9][0-9]*$' })),
  limit: t.Optional(t.String({ pattern: '^[1-9][0-9]*$' })),
})

export const createNewsBodySchema = t.Object({
  title: t.String({ minLength: 1, maxLength: 200 }),
  summary: t.String({ minLength: 1, maxLength: 500 }),
  content: t.Optional(t.String()),
  category: newsCategorySchema,
  imageUrl: t.Optional(t.String()),
  readTime: t.Optional(t.Number({ minimum: 1 })),
  source: t.Optional(t.String()),
  isFeatured: t.Optional(t.Boolean()),
  status: t.Optional(newsStatusSchema),
})

export const updateNewsBodySchema = t.Object({
  title: t.Optional(t.String({ minLength: 1, maxLength: 200 })),
  summary: t.Optional(t.String({ minLength: 1, maxLength: 500 })),
  content: t.Optional(t.String()),
  category: t.Optional(newsCategorySchema),
  imageUrl: t.Optional(t.String()),
  readTime: t.Optional(t.Number({ minimum: 1 })),
  source: t.Optional(t.String()),
  isFeatured: t.Optional(t.Boolean()),
  status: t.Optional(newsStatusSchema),
})

// =============================================================================
// Activity Log Schemas
// =============================================================================

export const activityTypeSchema = t.Union([
  t.Literal('user_login'),
  t.Literal('user_register'),
  t.Literal('user_logout'),
  t.Literal('password_change'),
  t.Literal('meal_logged'),
  t.Literal('symptom_logged'),
  t.Literal('entry_deleted'),
  t.Literal('food_search'),
  t.Literal('food_added'),
  t.Literal('food_edited'),
  t.Literal('problematic_food_identified'),
  t.Literal('problematic_food_status_change'),
  t.Literal('profile_updated'),
  t.Literal('account_deleted'),
  t.Literal('admin_action'),
  t.Literal('user_banned'),
  t.Literal('user_unbanned'),
  t.Literal('error'),
  t.Literal('warning'),
  t.Literal('info'),
])

export const activityLogQuerySchema = t.Object({
  type: t.Optional(t.Union([activityTypeSchema, t.Literal('all')])),
  userId: t.Optional(t.String()),
  startDate: t.Optional(t.String()),
  endDate: t.Optional(t.String()),
  page: t.Optional(t.String({ pattern: '^[1-9][0-9]*$' })),
  limit: t.Optional(t.String({ pattern: '^[1-9][0-9]*$' })),
})

// =============================================================================
// Settings Schemas
// =============================================================================

export const updateSettingsBodySchema = t.Object({
  maintenance: t.Optional(t.Object({
    enabled: t.Optional(t.Boolean()),
    message: t.Optional(t.String()),
    estimated_end: t.Optional(t.String()),
  })),
  features: t.Optional(t.Object({
    diary_enabled: t.Optional(t.Boolean()),
    insights_enabled: t.Optional(t.Boolean()),
    news_enabled: t.Optional(t.Boolean()),
    problematic_foods_enabled: t.Optional(t.Boolean()),
    achievements_enabled: t.Optional(t.Boolean()),
    notifications_enabled: t.Optional(t.Boolean()),
    ai_features_enabled: t.Optional(t.Boolean()),
  })),
  limits: t.Optional(t.Object({
    max_diary_entries_per_day: t.Optional(t.Number({ minimum: 1 })),
    max_foods_per_meal: t.Optional(t.Number({ minimum: 1 })),
    max_problematic_foods: t.Optional(t.Number({ minimum: 1 })),
    max_file_upload_size_mb: t.Optional(t.Number({ minimum: 1 })),
    rate_limit_requests_per_minute: t.Optional(t.Number({ minimum: 1 })),
  })),
  notifications: t.Optional(t.Object({
    daily_reminder_enabled: t.Optional(t.Boolean()),
    reminder_time: t.Optional(t.String()),
    achievement_notifications: t.Optional(t.Boolean()),
    problematic_food_alerts: t.Optional(t.Boolean()),
    news_notifications: t.Optional(t.Boolean()),
  })),
  version: t.Optional(t.Object({
    current: t.Optional(t.String()),
    minimum_required: t.Optional(t.String()),
    update_required: t.Optional(t.Boolean()),
    update_message: t.Optional(t.String()),
  })),
})

// =============================================================================
// Analytics Schemas
// =============================================================================

export const analyticsPeriodSchema = t.Union([
  t.Literal('day'),
  t.Literal('week'),
  t.Literal('month'),
])

export const analyticsQuerySchema = t.Object({
  period: t.Optional(analyticsPeriodSchema),
})

// =============================================================================
// Admin Diary Schemas
// =============================================================================

export const adminDiaryQuerySchema = t.Object({
  userId: t.Optional(t.String()),
  type: t.Optional(t.Union([t.Literal('meal'), t.Literal('symptom'), t.Literal('all')])),
  startDate: t.Optional(t.String()),
  endDate: t.Optional(t.String()),
  page: t.Optional(t.String({ pattern: '^[1-9][0-9]*$' })),
  limit: t.Optional(t.String({ pattern: '^[1-9][0-9]*$' })),
})

// =============================================================================
// Admin Problematic Foods Schemas
// =============================================================================

export const adminProblematicFoodsQuerySchema = t.Object({
  userId: t.Optional(t.String()),
  status: t.Optional(t.Union([t.Literal('suspected'), t.Literal('confirmed'), t.Literal('dismissed'), t.Literal('all')])),
  page: t.Optional(t.String({ pattern: '^[1-9][0-9]*$' })),
  limit: t.Optional(t.String({ pattern: '^[1-9][0-9]*$' })),
})

// =============================================================================
// Admin Achievements Schemas
// =============================================================================

export const adminAchievementsQuerySchema = t.Object({
  isActive: t.Optional(t.String({ pattern: '^(true|false)$' })),
  isHidden: t.Optional(t.String({ pattern: '^(true|false)$' })),
  page: t.Optional(t.String({ pattern: '^[1-9][0-9]*$' })),
  limit: t.Optional(t.String({ pattern: '^[1-9][0-9]*$' })),
})

export const updateAchievementBodySchema = t.Object({
  title: t.Optional(t.String()),
  description: t.Optional(t.String()),
  icon: t.Optional(t.String()),
  category: t.Optional(t.String()),
  isActive: t.Optional(t.Boolean()),
  isHidden: t.Optional(t.Boolean()),
})
