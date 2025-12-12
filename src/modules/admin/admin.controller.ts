/**
 * Admin Controller - REST endpoints for Admin Panel
 * 
 * All endpoints require admin authentication.
 * 
 * Endpoints:
 * - GET /admin/dashboard/stats - Dashboard statistics
 * - GET /admin/activity-log - Activity logs (paginated)
 * - GET /admin/users - List users (paginated)
 * - GET /admin/users/:id - Get user by ID
 * - POST /admin/users - Create user
 * - PATCH /admin/users/:id - Update user
 * - DELETE /admin/users/:id - Delete user
 * - GET /admin/foods - List foods (paginated)
 * - GET /admin/foods/:id - Get food by ID
 * - POST /admin/foods - Create food
 * - PATCH /admin/foods/:id - Update food
 * - DELETE /admin/foods/:id - Delete food
 * - GET /admin/news - List news (paginated)
 * - GET /admin/news/:id - Get news by ID
 * - POST /admin/news - Create news
 * - PATCH /admin/news/:id - Update news
 * - DELETE /admin/news/:id - Delete news
 * - GET /admin/settings - Get system settings
 * - PATCH /admin/settings - Update system settings
 * - GET /admin/analytics - Get analytics data
 */

import { Elysia } from 'elysia'
import { adminGuard, adminRateLimiter, adminWriteRateLimiter } from '@/shared/middlewares'
import * as adminService from './admin.service'
import {
  adminUsersQuerySchema,
  createUserBodySchema,
  updateUserBodySchema,
  idParamSchema,
  numericIdParamSchema,
  adminFoodsQuerySchema,
  createFoodBodySchema,
  updateFoodBodySchema,
  adminNewsQuerySchema,
  createNewsBodySchema,
  updateNewsBodySchema,
  activityLogQuerySchema,
  updateSettingsBodySchema,
  analyticsQuerySchema,
  adminDiaryQuerySchema,
  adminProblematicFoodsQuerySchema,
  adminAchievementsQuerySchema,
  updateAchievementBodySchema,
} from './admin.schemas'
import type { UserRole, UserStatus, FodmapLevel, ActivityType } from '@/shared/types'
import type { ArticleCategory, ArticleStatus } from '@/modules/news/news.model'

// =============================================================================
// Helper: Format Admin User for Response
// =============================================================================

function formatAdminUser(user: Record<string, unknown>) {
  return {
    id: (user._id as { toString: () => string })?.toString() || user.id,
    email: user.email,
    name: user.name,
    avatar: user.avatar,
    role: user.role,
    status: user.status,
    stats: {
      daysUsingApp: (user.stats as Record<string, unknown>)?.daysUsingApp || 0,
      totalMealsLogged: (user.stats as Record<string, unknown>)?.totalMealsLogged || 0,
      totalSymptomsLogged: (user.stats as Record<string, unknown>)?.totalSymptomsLogged || 0,
      lastActive: ((user.stats as Record<string, unknown>)?.lastActive as Date)?.toISOString() || new Date().toISOString(),
    },
    createdAt: (user.createdAt as Date)?.toISOString(),
    updatedAt: (user.updatedAt as Date)?.toISOString(),
  }
}

// =============================================================================
// Helper: Format Admin Food for Response
// =============================================================================

function formatAdminFood(food: Record<string, unknown>) {
  const fodmap = food.fodmap as Record<string, unknown> | undefined
  const dataSources = food.data_sources as Record<string, unknown> | undefined
  const aiGenerated = dataSources?.ai_generated as Record<string, unknown> | undefined
  
  return {
    id: food.id,
    name: food.name,
    source: food.source,
    category_level_1: food.category_level_1,
    category_level_2: food.category_level_2 || '',
    category_level_3: food.category_level_3 || '',
    hasFodmap: !!fodmap?.level,
    fodmapLevel: fodmap?.level,
    hasNutrition: !!(food.nutrition as Record<string, unknown>)?.energy_kcal,
    isAiGenerated: aiGenerated?.is_ai_generated || false,
    searchCount: food.searchCount || 0,
    createdAt: (food.createdAt as Date)?.toISOString(),
    updatedAt: (food.updatedAt as Date)?.toISOString(),
    // Include full data for detail view
    fodmap: food.fodmap,
    nutrition: food.nutrition,
    data_sources: food.data_sources,
  }
}

// =============================================================================
// Helper: Format Admin News for Response
// =============================================================================

function formatAdminNews(article: Record<string, unknown>) {
  return {
    id: (article._id as { toString: () => string })?.toString() || article.id?.toString(),
    title: article.title,
    summary: article.summary,
    content: article.content,
    category: article.category,
    status: article.status,
    imageUrl: article.imageUrl,
    readTime: article.readTime || 5,
    source: article.source,
    isFeatured: article.isFeatured || false,
    viewCount: article.views || 0,
    publishedAt: (article.publishedAt as Date)?.toISOString(),
    createdAt: (article.createdAt as Date)?.toISOString(),
    updatedAt: (article.updatedAt as Date)?.toISOString(),
  }
}

// =============================================================================
// Helper: Format Activity Log for Response
// =============================================================================

function formatActivityLog(log: Record<string, unknown>) {
  return {
    id: (log._id as { toString: () => string })?.toString(),
    type: log.type,
    action: log.action,
    details: log.details,
    userId: (log.userId as { toString: () => string })?.toString(),
    userName: log.userName,
    userEmail: log.userEmail,
    ip_address: log.ip_address,
    user_agent: log.user_agent,
    metadata: log.metadata,
    timestamp: (log.timestamp as Date)?.toISOString(),
    createdAt: (log.createdAt as Date)?.toISOString(),
  }
}

// =============================================================================
// Controller
// =============================================================================

export const adminController = new Elysia({ prefix: '/admin' })
  // Apply rate limiting for all admin routes
  .use(adminRateLimiter)
  
  // Apply enhanced admin security with guard() - CRITICAL: This ensures ALL routes are protected
  .guard(
    {
      async beforeHandle({ request, set }) {
        // Import inline to avoid circular dependency issues
        const { User } = await import('@/modules/users/user.model')
        const { authService } = await import('@/modules/auth/auth.service')
        const { getTokenFromCookies, ACCESS_TOKEN_COOKIE } = await import('@/shared/utils')
        
        // Extract token from header or cookie
        const authHeader = request.headers.get('authorization')
        let token: string | null = null
        
        if (authHeader) {
          const parts = authHeader.split(' ')
          if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
            token = parts[1]
          }
        }
        
        if (!token) {
          const cookieHeader = request.headers.get('cookie')
          token = getTokenFromCookies(cookieHeader, ACCESS_TOKEN_COOKIE)
        }
        
        if (!token) {
          set.status = 401
          return {
            success: false,
            error: { code: 'UNAUTHORIZED', message: 'Autenticação necessária' },
          }
        }
        
        try {
          // Verify token
          const payload = await authService.verifyAccessToken(token)
          
          // CRITICAL: Always fetch fresh user from database
          const user = await User.findById(payload.sub).select('+role +status +email +name')
          
          if (!user) {
            set.status = 401
            return {
              success: false,
              error: { code: 'UNAUTHORIZED', message: 'Usuário não encontrado' },
            }
          }
          
          if (user.status !== 'active') {
            set.status = 403
            return {
              success: false,
              error: { code: 'FORBIDDEN', message: 'Conta inativa ou banida' },
            }
          }
          
          // CRITICAL: Verify admin role
          if (user.role !== 'admin') {
            set.status = 403
            return {
              success: false,
              error: { code: 'FORBIDDEN', message: 'Acesso restrito a administradores' },
            }
          }
          
          // Store auth info in request for later use
          ;(request as Request & { adminAuth: { userId: string; userEmail: string; userName: string } }).adminAuth = {
            userId: user._id.toString(),
            userEmail: user.email,
            userName: user.name,
          }
          
          // Auth passed - don't return anything to continue
        } catch {
          set.status = 401
          return {
            success: false,
            error: { code: 'UNAUTHORIZED', message: 'Token inválido ou expirado' },
          }
        }
      },
    },
    (app) => app
    // Derive auth context for all routes
    .derive(({ request }) => {
      const adminAuth = (request as Request & { adminAuth?: { userId: string; userEmail: string; userName: string } }).adminAuth
      return { auth: adminAuth || { userId: '', userEmail: '', userName: '' } }
    })

  // =========================================================================
  // Dashboard
  // =========================================================================
  .get(
    '/dashboard/stats',
    async () => {
      const stats = await adminService.getDashboardStats()
      return {
        success: true,
        data: stats,
      }
    },
    {
      detail: {
        tags: ['Admin'],
        summary: 'Get dashboard statistics',
        description: 'Returns comprehensive statistics for the admin dashboard',
        security: [{ bearerAuth: [] }],
      },
    }
  )

  // =========================================================================
  // Activity Log
  // =========================================================================
  .get(
    '/activity-log',
    async ({ query }) => {
      const filters = {
        type: query.type as ActivityType | 'all' | undefined,
        userId: query.userId,
        startDate: query.startDate,
        endDate: query.endDate,
        page: query.page ? parseInt(query.page, 10) : 1,
        limit: query.limit ? parseInt(query.limit, 10) : 20,
      }

      const result = await adminService.getActivityLogs(filters)

      return {
        success: true,
        data: result.data.map((log) => formatActivityLog(log as unknown as Record<string, unknown>)),
        pagination: result.pagination,
      }
    },
    {
      query: activityLogQuerySchema,
      detail: {
        tags: ['Admin'],
        summary: 'Get activity logs',
        description: 'Returns paginated activity logs with optional filters',
        security: [{ bearerAuth: [] }],
      },
    }
  )

  // =========================================================================
  // Users - List
  // =========================================================================
  .get(
    '/users',
    async ({ query }) => {
      const filters = {
        search: query.search,
        role: query.role as UserRole | 'all' | undefined,
        status: query.status as UserStatus | 'all' | undefined,
        page: query.page ? parseInt(query.page, 10) : 1,
        limit: query.limit ? parseInt(query.limit, 10) : 20,
      }

      const result = await adminService.getUsers(filters)

      return {
        success: true,
        data: result.data.map((user) => formatAdminUser(user as unknown as Record<string, unknown>)),
        pagination: result.pagination,
      }
    },
    {
      query: adminUsersQuerySchema,
      detail: {
        tags: ['Admin'],
        summary: 'List users',
        description: 'Returns paginated list of users with optional filters',
        security: [{ bearerAuth: [] }],
      },
    }
  )

  // =========================================================================
  // Users - Get by ID
  // =========================================================================
  .get(
    '/users/:id',
    async ({ params }) => {
      const user = await adminService.getUserById(params.id)
      return {
        success: true,
        data: formatAdminUser(user as unknown as Record<string, unknown>),
      }
    },
    {
      params: idParamSchema,
      detail: {
        tags: ['Admin'],
        summary: 'Get user by ID',
        description: 'Returns detailed user information',
        security: [{ bearerAuth: [] }],
      },
    }
  )

  // =========================================================================
  // Users - Create
  // =========================================================================
  .post(
    '/users',
    async ({ body }) => {
      const user = await adminService.createUser({
        email: body.email,
        name: body.name,
        password: body.password,
        role: body.role,
      })
      return {
        success: true,
        data: formatAdminUser(user as unknown as Record<string, unknown>),
      }
    },
    {
      body: createUserBodySchema,
      detail: {
        tags: ['Admin'],
        summary: 'Create user',
        description: 'Creates a new user (admin can set role)',
        security: [{ bearerAuth: [] }],
      },
    }
  )

  // =========================================================================
  // Users - Update
  // =========================================================================
  .patch(
    '/users/:id',
    async ({ params, body }) => {
      const user = await adminService.updateUser(params.id, body)
      return {
        success: true,
        data: formatAdminUser(user as unknown as Record<string, unknown>),
      }
    },
    {
      params: idParamSchema,
      body: updateUserBodySchema,
      detail: {
        tags: ['Admin'],
        summary: 'Update user',
        description: 'Updates user information (name, email, role, status)',
        security: [{ bearerAuth: [] }],
      },
    }
  )

  // =========================================================================
  // Users - Delete
  // =========================================================================
  .delete(
    '/users/:id',
    async ({ params }) => {
      await adminService.deleteUser(params.id)
      return { success: true }
    },
    {
      params: idParamSchema,
      detail: {
        tags: ['Admin'],
        summary: 'Delete user',
        description: 'Permanently deletes a user and all associated data',
        security: [{ bearerAuth: [] }],
      },
    }
  )

  // =========================================================================
  // Foods - List
  // =========================================================================
  .get(
    '/foods',
    async ({ query }) => {
      const filters = {
        search: query.search,
        category: query.category,
        fodmapLevel: query.fodmapLevel as FodmapLevel | 'none' | 'all' | undefined,
        isAiGenerated: query.isAiGenerated === 'true' ? true : query.isAiGenerated === 'false' ? false : undefined,
        page: query.page ? parseInt(query.page, 10) : 1,
        limit: query.limit ? parseInt(query.limit, 10) : 20,
      }

      const result = await adminService.getFoods(filters)

      return {
        success: true,
        data: result.data.map((food) => formatAdminFood(food as unknown as Record<string, unknown>)),
        pagination: result.pagination,
      }
    },
    {
      query: adminFoodsQuerySchema,
      detail: {
        tags: ['Admin'],
        summary: 'List foods',
        description: 'Returns paginated list of foods with optional filters',
        security: [{ bearerAuth: [] }],
      },
    }
  )

  // =========================================================================
  // Foods - Get by ID
  // =========================================================================
  .get(
    '/foods/:id',
    async ({ params }) => {
      const id = parseInt(params.id, 10)
      const food = await adminService.getFoodById(id)
      return {
        success: true,
        data: formatAdminFood(food as unknown as Record<string, unknown>),
      }
    },
    {
      params: numericIdParamSchema,
      detail: {
        tags: ['Admin'],
        summary: 'Get food by ID',
        description: 'Returns detailed food information',
        security: [{ bearerAuth: [] }],
      },
    }
  )

  // =========================================================================
  // Foods - Create
  // =========================================================================
  .post(
    '/foods',
    async ({ body }) => {
      const food = await adminService.createFood({
        name: body.name,
        category_level_1: body.category_level_1,
        category_level_2: body.category_level_2,
        category_level_3: body.category_level_3,
        fodmapLevel: body.fodmapLevel,
        fodmapNote: body.fodmapNote,
      })
      return {
        success: true,
        data: formatAdminFood(food as unknown as Record<string, unknown>),
      }
    },
    {
      body: createFoodBodySchema,
      detail: {
        tags: ['Admin'],
        summary: 'Create food',
        description: 'Creates a new food entry',
        security: [{ bearerAuth: [] }],
      },
    }
  )

  // =========================================================================
  // Foods - Update
  // =========================================================================
  .patch(
    '/foods/:id',
    async ({ params, body }) => {
      const id = parseInt(params.id, 10)
      const food = await adminService.updateFood(id, body)
      return {
        success: true,
        data: formatAdminFood(food as unknown as Record<string, unknown>),
      }
    },
    {
      params: numericIdParamSchema,
      body: updateFoodBodySchema,
      detail: {
        tags: ['Admin'],
        summary: 'Update food',
        description: 'Updates food information',
        security: [{ bearerAuth: [] }],
      },
    }
  )

  // =========================================================================
  // Foods - Delete
  // =========================================================================
  .delete(
    '/foods/:id',
    async ({ params }) => {
      const id = parseInt(params.id, 10)
      await adminService.deleteFood(id)
      return { success: true }
    },
    {
      params: numericIdParamSchema,
      detail: {
        tags: ['Admin'],
        summary: 'Delete food',
        description: 'Permanently deletes a food entry',
        security: [{ bearerAuth: [] }],
      },
    }
  )

  // =========================================================================
  // News - List
  // =========================================================================
  .get(
    '/news',
    async ({ query }) => {
      const filters = {
        search: query.search,
        category: query.category as ArticleCategory | 'all' | undefined,
        status: query.status as ArticleStatus | 'all' | undefined,
        page: query.page ? parseInt(query.page, 10) : 1,
        limit: query.limit ? parseInt(query.limit, 10) : 20,
      }

      const result = await adminService.getNews(filters)

      return {
        success: true,
        data: result.data.map((article) => formatAdminNews(article as unknown as Record<string, unknown>)),
        pagination: result.pagination,
      }
    },
    {
      query: adminNewsQuerySchema,
      detail: {
        tags: ['Admin'],
        summary: 'List news articles',
        description: 'Returns paginated list of news articles (including drafts)',
        security: [{ bearerAuth: [] }],
      },
    }
  )

  // =========================================================================
  // News - Get by ID
  // =========================================================================
  .get(
    '/news/:id',
    async ({ params }) => {
      const article = await adminService.getNewsById(params.id)
      return {
        success: true,
        data: formatAdminNews(article as unknown as Record<string, unknown>),
      }
    },
    {
      params: idParamSchema,
      detail: {
        tags: ['Admin'],
        summary: 'Get news article by ID',
        description: 'Returns detailed news article information',
        security: [{ bearerAuth: [] }],
      },
    }
  )

  // =========================================================================
  // News - Create
  // =========================================================================
  .post(
    '/news',
    async ({ body }) => {
      const article = await adminService.createNews({
        title: body.title,
        summary: body.summary,
        content: body.content,
        category: body.category,
        imageUrl: body.imageUrl,
        readTime: body.readTime,
        source: body.source,
        isFeatured: body.isFeatured,
        status: body.status,
      })
      return {
        success: true,
        data: formatAdminNews(article as unknown as Record<string, unknown>),
      }
    },
    {
      body: createNewsBodySchema,
      detail: {
        tags: ['Admin'],
        summary: 'Create news article',
        description: 'Creates a new news article',
        security: [{ bearerAuth: [] }],
      },
    }
  )

  // =========================================================================
  // News - Update
  // =========================================================================
  .patch(
    '/news/:id',
    async ({ params, body }) => {
      const article = await adminService.updateNews(params.id, body)
      return {
        success: true,
        data: formatAdminNews(article as unknown as Record<string, unknown>),
      }
    },
    {
      params: idParamSchema,
      body: updateNewsBodySchema,
      detail: {
        tags: ['Admin'],
        summary: 'Update news article',
        description: 'Updates news article information',
        security: [{ bearerAuth: [] }],
      },
    }
  )

  // =========================================================================
  // News - Delete
  // =========================================================================
  .delete(
    '/news/:id',
    async ({ params }) => {
      await adminService.deleteNews(params.id)
      return { success: true }
    },
    {
      params: idParamSchema,
      detail: {
        tags: ['Admin'],
        summary: 'Delete news article',
        description: 'Permanently deletes a news article',
        security: [{ bearerAuth: [] }],
      },
    }
  )

  // =========================================================================
  // Settings - Get
  // =========================================================================
  .get(
    '/settings',
    async () => {
      const settings = await adminService.getSettings()
      return {
        success: true,
        data: {
          ...settings,
          updatedAt: settings.updatedAt?.toISOString(),
        },
      }
    },
    {
      detail: {
        tags: ['Admin'],
        summary: 'Get system settings',
        description: 'Returns current system settings',
        security: [{ bearerAuth: [] }],
      },
    }
  )

  // =========================================================================
  // Settings - Update
  // =========================================================================
  .patch(
    '/settings',
    async ({ body, auth }) => {
      const settings = await adminService.updateSettings(body, auth.userId)
      return {
        success: true,
        data: {
          ...settings,
          updatedAt: settings.updatedAt?.toISOString(),
        },
      }
    },
    {
      body: updateSettingsBodySchema,
      detail: {
        tags: ['Admin'],
        summary: 'Update system settings',
        description: 'Updates system settings (partial update supported)',
        security: [{ bearerAuth: [] }],
      },
    }
  )

  // =========================================================================
  // Analytics
  // =========================================================================
  .get(
    '/analytics',
    async ({ query }) => {
      const period = (query.period as 'day' | 'week' | 'month') || 'week'
      const data = await adminService.getAnalytics(period)
      return {
        success: true,
        data,
      }
    },
    {
      query: analyticsQuerySchema,
      detail: {
        tags: ['Admin'],
        summary: 'Get analytics data',
        description: 'Returns analytics data for the specified period',
        security: [{ bearerAuth: [] }],
      },
    }
  )

  // =========================================================================
  // Diary - List
  // =========================================================================
  .get(
    '/diary',
    async ({ query }) => {
      const filters = {
        userId: query.userId,
        type: query.type as 'meal' | 'symptom' | 'all' | undefined,
        startDate: query.startDate,
        endDate: query.endDate,
        page: query.page ? parseInt(query.page, 10) : 1,
        limit: query.limit ? parseInt(query.limit, 10) : 20,
      }

      const result = await adminService.getDiaryEntries(filters)
      return {
        success: true,
        data: result.data,
        pagination: result.pagination,
      }
    },
    {
      query: adminDiaryQuerySchema,
      detail: {
        tags: ['Admin'],
        summary: 'List diary entries',
        description: 'Returns paginated diary entries with optional filters',
        security: [{ bearerAuth: [] }],
      },
    }
  )

  // =========================================================================
  // Diary - Delete
  // =========================================================================
  .delete(
    '/diary/:id',
    async ({ params }) => {
      await adminService.deleteDiaryEntry(params.id)
      return {
        success: true,
        message: 'Entrada deletada com sucesso',
      }
    },
    {
      params: idParamSchema,
      detail: {
        tags: ['Admin'],
        summary: 'Delete diary entry',
        description: 'Deletes a diary entry by ID',
        security: [{ bearerAuth: [] }],
      },
    }
  )

  // =========================================================================
  // Problematic Foods - List
  // =========================================================================
  .get(
    '/problematic-foods',
    async ({ query }) => {
      const filters = {
        userId: query.userId,
        status: query.status as 'suspected' | 'confirmed' | 'dismissed' | 'all' | undefined,
        page: query.page ? parseInt(query.page, 10) : 1,
        limit: query.limit ? parseInt(query.limit, 10) : 20,
      }

      const result = await adminService.getProblematicFoods(filters)
      return {
        success: true,
        data: result.data,
        pagination: result.pagination,
      }
    },
    {
      query: adminProblematicFoodsQuerySchema,
      detail: {
        tags: ['Admin'],
        summary: 'List problematic foods',
        description: 'Returns paginated problematic foods with optional filters',
        security: [{ bearerAuth: [] }],
      },
    }
  )

  // =========================================================================
  // Problematic Foods - Delete
  // =========================================================================
  .delete(
    '/problematic-foods/:id',
    async ({ params }) => {
      await adminService.deleteProblematicFood(params.id)
      return {
        success: true,
        message: 'Alimento problemático deletado com sucesso',
      }
    },
    {
      params: idParamSchema,
      detail: {
        tags: ['Admin'],
        summary: 'Delete problematic food',
        description: 'Deletes a problematic food entry by ID',
        security: [{ bearerAuth: [] }],
      },
    }
  )

  // =========================================================================
  // Achievements - List
  // =========================================================================
  .get(
    '/achievements',
    async ({ query }) => {
      const filters = {
        isActive: query.isActive === 'true' ? true : query.isActive === 'false' ? false : undefined,
        isHidden: query.isHidden === 'true' ? true : query.isHidden === 'false' ? false : undefined,
        page: query.page ? parseInt(query.page, 10) : 1,
        limit: query.limit ? parseInt(query.limit, 10) : 50,
      }

      const result = await adminService.getAchievements(filters)
      return {
        success: true,
        data: result.data,
        pagination: result.pagination,
      }
    },
    {
      query: adminAchievementsQuerySchema,
      detail: {
        tags: ['Admin'],
        summary: 'List achievements',
        description: 'Returns paginated achievements with unlock counts',
        security: [{ bearerAuth: [] }],
      },
    }
  )

  // =========================================================================
  // Achievements - Update
  // =========================================================================
  .patch(
    '/achievements/:id',
    async ({ params, body }) => {
      const achievement = await adminService.updateAchievement(params.id, body)
      return {
        success: true,
        data: achievement,
      }
    },
    {
      params: idParamSchema,
      body: updateAchievementBodySchema,
      detail: {
        tags: ['Admin'],
        summary: 'Update achievement',
        description: 'Updates an achievement (active/hidden status, etc)',
        security: [{ bearerAuth: [] }],
      },
    }
  )
  ) // Close guard
