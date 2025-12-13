/**
 * Admin Service - Business Logic for Admin Panel
 * 
 * Features:
 * - Dashboard statistics
 * - Activity log management
 * - User management (list, ban, unban)
 * - Food management (CRUD via admin)
 * - News management (CRUD via admin)
 * - System settings
 * - Analytics
 */

import mongoose from 'mongoose'
import { User, type IUser } from '@/modules/users/user.model'
import { Food, type IFood } from '@/modules/foods/food.model'
import { NewsArticle, type INewsArticle, type ArticleStatus, type ArticleCategory } from '@/modules/news/news.model'
import { DiaryEntry } from '@/modules/diary/diary.model'
import { ProblematicFood } from '@/modules/problematic-foods/problematic-food.model'
import { Achievement } from '@/modules/achievements/achievement.model'
import { UserAchievement } from '@/modules/achievements/user-achievement.model'
import { ActivityLog, type IActivityLog } from './activity-log.model'
import { SystemSettings, type ISystemSettings } from './system-settings.model'
import { NotFoundError, ValidationError } from '@/shared/errors'
import type { UserRole, UserStatus, FodmapLevel, ActivityType } from '@/shared/types'

// =============================================================================
// Types
// =============================================================================

export interface DashboardStats {
  users: {
    total: number
    active: number
    newThisWeek: number
    newThisMonth: number
    verified: number
    banned: number
  }
  foods: {
    total: number
    withFodmap: number
    withoutFodmap: number
    aiGenerated: number
    byFodmapLevel: {
      low: number
      moderate: number
      high: number
    }
  }
  diary: {
    totalEntries: number
    mealsToday: number
    symptomsToday: number
    avgEntriesPerUser: number
    entriesThisWeek: number
    entriesThisMonth: number
    meals: {
      total: number
      byType: {
        breakfast: number
        lunch: number
        dinner: number
        snack: number
      }
    }
    symptoms: {
      total: number
      avgIntensity: number
      mostCommon: string[]
    }
  }
  problematicFoods: {
    total: number
    suspected: number
    confirmed: number
    topProblematic: {
      foodName: string
      affectedUsers: number
      totalIncidents: number
    }[]
  }
  achievements: {
    total: number
    active: number
    hidden: number
    totalUnlocks: number
    avgUnlocksPerUser: number
    mostUnlocked: {
      title: string
      unlocks: number
    }[]
  }
  news: {
    total: number
    published: number
    draft: number
    featured: number
    byCategory: {
      news: number
      tips: number
      science: number
      recipe: number
      lifestyle: number
    }
  }
  system: {
    uptime: string
    version: string
    environment: string
    lastDeploy: string
    maintenanceMode: boolean
    totalActivityLogs: number
    lastBackup: string
  }
}

export interface AdminUserFilters {
  search?: string
  role?: UserRole | 'all'
  status?: UserStatus | 'all'
  page?: number
  limit?: number
}

export interface AdminFoodsFilters {
  search?: string
  category?: string
  fodmapLevel?: FodmapLevel | 'none' | 'all'
  isAiGenerated?: boolean
  page?: number
  limit?: number
}

export interface AdminNewsFilters {
  search?: string
  category?: ArticleCategory | 'all'
  status?: ArticleStatus | 'all'
  page?: number
  limit?: number
}

export interface ActivityLogFilters {
  type?: ActivityType | 'all'
  userId?: string
  startDate?: string
  endDate?: string
  page?: number
  limit?: number
}

export interface AnalyticsPeriod {
  period: 'day' | 'week' | 'month'
}

export interface PaginatedResult<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// =============================================================================
// Helper Functions
// =============================================================================

function getStartOfDay(date: Date = new Date()): Date {
  const d = new Date(date)
  d.setUTCHours(0, 0, 0, 0)
  return d
}

function getStartOfWeek(): Date {
  const now = new Date()
  const dayOfWeek = now.getUTCDay()
  const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1
  now.setUTCDate(now.getUTCDate() - diff)
  return getStartOfDay(now)
}

function getStartOfMonth(): Date {
  const now = new Date()
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
}

function formatUptime(startTime: number): string {
  const uptimeMs = Date.now() - startTime
  const days = Math.floor(uptimeMs / (1000 * 60 * 60 * 24))
  const hours = Math.floor((uptimeMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  return `${days}d ${hours}h`
}

// Store server start time
const serverStartTime = Date.now()

// =============================================================================
// Dashboard Stats
// =============================================================================

export async function getDashboardStats(): Promise<DashboardStats> {
  const now = new Date()
  const startOfToday = getStartOfDay()
  const startOfWeek = getStartOfWeek()
  const startOfMonth = getStartOfMonth()

  // Run all queries in parallel for performance
  const [
    // Users
    totalUsers,
    activeUsers,
    newUsersThisWeek,
    newUsersThisMonth,
    bannedUsers,
    // Foods
    totalFoods,
    foodsWithFodmap,
    foodsWithoutFodmap,
    aiGeneratedFoods,
    fodmapLevels,
    // Diary
    totalEntries,
    entriesToday,
    entriesThisWeek,
    entriesThisMonth,
    mealsByType,
    symptomsAgg,
    // Problematic Foods
    totalProblematic,
    problematicByStatus,
    topProblematic,
    // Achievements
    totalAchievements,
    activeAchievements,
    hiddenAchievements,
    totalUnlocks,
    mostUnlocked,
    // News
    totalNews,
    newsByStatus,
    featuredNews,
    newsByCategory,
    // System
    totalActivityLogs,
    settings,
  ] = await Promise.all([
    // Users queries
    User.countDocuments(),
    User.countDocuments({ status: 'active', 'stats.lastActive': { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }),
    User.countDocuments({ createdAt: { $gte: startOfWeek } }),
    User.countDocuments({ createdAt: { $gte: startOfMonth } }),
    User.countDocuments({ status: 'banned' }),
    
    // Foods queries
    Food.countDocuments(),
    Food.countDocuments({ 'fodmap.level': { $exists: true } }),
    Food.countDocuments({ 'fodmap.level': { $exists: false } }),
    Food.countDocuments({ 'data_sources.ai_generated.is_ai_generated': true }),
    Food.aggregate([
      { $match: { 'fodmap.level': { $exists: true } } },
      { $group: { _id: '$fodmap.level', count: { $sum: 1 } } },
    ]),
    
    // Diary queries
    DiaryEntry.countDocuments(),
    DiaryEntry.countDocuments({ date: { $gte: startOfToday } }),
    DiaryEntry.countDocuments({ date: { $gte: startOfWeek } }),
    DiaryEntry.countDocuments({ date: { $gte: startOfMonth } }),
    DiaryEntry.aggregate([
      { $match: { type: 'meal' } },
      { $group: { _id: '$meal.type', count: { $sum: 1 } } },
    ]),
    DiaryEntry.aggregate([
      { $match: { type: 'symptom' } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          avgIntensity: { $avg: '$symptom.intensity' },
          types: { $push: '$symptom.type' },
        },
      },
    ]),
    
    // Problematic Foods queries
    ProblematicFood.countDocuments(),
    ProblematicFood.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    ProblematicFood.aggregate([
      {
        $group: {
          _id: { foodId: '$foodId', foodName: '$foodName' },
          affectedUsers: { $addToSet: '$userId' },
          totalIncidents: { $sum: { $size: '$incidents' } },
        },
      },
      { $project: { foodName: '$_id.foodName', affectedUsers: { $size: '$affectedUsers' }, totalIncidents: 1 } },
      { $sort: { affectedUsers: -1 } },
      { $limit: 3 },
    ]),
    
    // Achievements queries
    Achievement.countDocuments(),
    Achievement.countDocuments({ active: true }),
    Achievement.countDocuments({ hidden: true }),
    UserAchievement.countDocuments({ unlocked: true }),
    UserAchievement.aggregate([
      { $match: { unlocked: true } },
      { $group: { _id: '$achievementId', unlocks: { $sum: 1 } } },
      { $sort: { unlocks: -1 } },
      { $limit: 2 },
    ]),
    
    // News queries
    NewsArticle.countDocuments(),
    NewsArticle.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    NewsArticle.countDocuments({ isFeatured: true }),
    NewsArticle.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
    ]),
    
    // System queries
    ActivityLog.countDocuments(),
    SystemSettings.findById('system_settings').lean(),
  ])

  // Process aggregation results
  const fodmapLevelMap: Record<string, number> = {}
  for (const item of fodmapLevels) {
    fodmapLevelMap[item._id] = item.count
  }

  const mealTypeMap: Record<string, number> = {}
  for (const item of mealsByType) {
    mealTypeMap[item._id] = item.count
  }

  const symptomData = symptomsAgg[0] || { total: 0, avgIntensity: 0, types: [] }
  const symptomTypeCounts: Record<string, number> = {}
  for (const type of symptomData.types || []) {
    symptomTypeCounts[type] = (symptomTypeCounts[type] || 0) + 1
  }
  const mostCommonSymptoms = Object.entries(symptomTypeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([type]) => type)

  const statusMap: Record<string, number> = {}
  for (const item of problematicByStatus) {
    statusMap[item._id] = item.count
  }

  const newsStatusMap: Record<string, number> = {}
  for (const item of newsByStatus) {
    newsStatusMap[item._id] = item.count
  }

  const categoryMap: Record<string, number> = {}
  for (const item of newsByCategory) {
    categoryMap[item._id] = item.count
  }

  // Get achievement titles for most unlocked
  const achievementTitles = await Achievement.find({
    id: { $in: mostUnlocked.map((a) => a._id) },
  }).lean()
  const titleMap = new Map(achievementTitles.map((a) => [a.id, a.title]))

  return {
    users: {
      total: totalUsers,
      active: activeUsers,
      newThisWeek: newUsersThisWeek,
      newThisMonth: newUsersThisMonth,
      verified: totalUsers - bannedUsers, // All non-banned users are "verified"
      banned: bannedUsers,
    },
    foods: {
      total: totalFoods,
      withFodmap: foodsWithFodmap,
      withoutFodmap: foodsWithoutFodmap,
      aiGenerated: aiGeneratedFoods,
      byFodmapLevel: {
        low: (fodmapLevelMap['low'] || 0) + (fodmapLevelMap['free'] || 0),
        moderate: fodmapLevelMap['medium'] || 0,
        high: fodmapLevelMap['high'] || 0,
      },
    },
    diary: {
      totalEntries,
      mealsToday: entriesToday,
      symptomsToday: await DiaryEntry.countDocuments({ type: 'symptom', date: { $gte: startOfToday } }),
      avgEntriesPerUser: totalUsers > 0 ? Math.round((totalEntries / totalUsers) * 10) / 10 : 0,
      entriesThisWeek,
      entriesThisMonth,
      meals: {
        total: await DiaryEntry.countDocuments({ type: 'meal' }),
        byType: {
          breakfast: mealTypeMap['breakfast'] || 0,
          lunch: mealTypeMap['lunch'] || 0,
          dinner: mealTypeMap['dinner'] || 0,
          snack: mealTypeMap['snack'] || 0,
        },
      },
      symptoms: {
        total: symptomData.total || 0,
        avgIntensity: Math.round((symptomData.avgIntensity || 0) * 10) / 10,
        mostCommon: mostCommonSymptoms,
      },
    },
    problematicFoods: {
      total: totalProblematic,
      suspected: statusMap['suspected'] || 0,
      confirmed: statusMap['confirmed'] || 0,
      topProblematic: topProblematic.map((p) => ({
        foodName: p.foodName,
        affectedUsers: p.affectedUsers,
        totalIncidents: p.totalIncidents,
      })),
    },
    achievements: {
      total: totalAchievements,
      active: activeAchievements,
      hidden: hiddenAchievements,
      totalUnlocks,
      avgUnlocksPerUser: totalUsers > 0 ? Math.round((totalUnlocks / totalUsers) * 10) / 10 : 0,
      mostUnlocked: mostUnlocked.map((a) => ({
        title: titleMap.get(a._id) || a._id,
        unlocks: a.unlocks,
      })),
    },
    news: {
      total: totalNews,
      published: newsStatusMap['published'] || 0,
      draft: newsStatusMap['draft'] || 0,
      featured: featuredNews,
      byCategory: {
        news: categoryMap['news'] || 0,
        tips: categoryMap['tip'] || 0,
        science: categoryMap['article'] || 0,
        recipe: categoryMap['recipe'] || 0,
        lifestyle: categoryMap['wellness'] || 0,
      },
    },
    system: {
      uptime: formatUptime(serverStartTime),
      version: (settings as ISystemSettings)?.version?.current || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      lastDeploy: new Date().toISOString(),
      maintenanceMode: (settings as ISystemSettings)?.maintenance?.enabled || false,
      totalActivityLogs,
      lastBackup: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Mock: 24h ago
    },
  }
}

// =============================================================================
// Activity Log
// =============================================================================

export async function getActivityLogs(filters: ActivityLogFilters): Promise<PaginatedResult<IActivityLog>> {
  const {
    type,
    userId,
    startDate,
    endDate,
    page = 1,
    limit = 20,
  } = filters

  const query: Record<string, unknown> = {}

  if (type && type !== 'all') {
    query.type = type
  }

  if (userId) {
    query.userId = new mongoose.Types.ObjectId(userId)
  }

  if (startDate || endDate) {
    query.timestamp = {}
    if (startDate) {
      (query.timestamp as Record<string, Date>).$gte = new Date(startDate)
    }
    if (endDate) {
      (query.timestamp as Record<string, Date>).$lte = new Date(endDate)
    }
  }

  const skip = (page - 1) * limit

  const [logs, total] = await Promise.all([
    ActivityLog.find(query)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    ActivityLog.countDocuments(query),
  ])

  return {
    data: logs as IActivityLog[],
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }
}

export async function logActivity(
  type: ActivityType,
  action: string,
  options?: {
    userId?: string
    userName?: string
    userEmail?: string
    details?: string
    ip_address?: string
    user_agent?: string
    metadata?: Record<string, unknown>
  }
): Promise<void> {
  const log = new ActivityLog({
    type,
    action,
    userId: options?.userId ? new mongoose.Types.ObjectId(options.userId) : undefined,
    userName: options?.userName,
    userEmail: options?.userEmail,
    details: options?.details,
    ip_address: options?.ip_address,
    user_agent: options?.user_agent,
    metadata: options?.metadata,
    timestamp: new Date(),
  })

  await log.save()
}

// =============================================================================
// User Management
// =============================================================================

export async function getUsers(filters: AdminUserFilters): Promise<PaginatedResult<IUser>> {
  const {
    search,
    role,
    status,
    page = 1,
    limit = 20,
  } = filters

  const query: Record<string, unknown> = {}

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ]
  }

  if (role && role !== 'all') {
    query.role = role
  }

  if (status && status !== 'all') {
    query.status = status
  }

  const skip = (page - 1) * limit

  const [users, total] = await Promise.all([
    User.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    User.countDocuments(query),
  ])

  return {
    data: users as IUser[],
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }
}

export async function getUserById(id: string): Promise<IUser> {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new NotFoundError('Usuário não encontrado')
  }

  const user = await User.findById(id).lean()
  if (!user) {
    throw new NotFoundError('Usuário não encontrado')
  }

  return user as IUser
}

export async function createUser(data: {
  email: string
  name: string
  password: string
  role?: UserRole
}): Promise<IUser> {
  // Check if email already exists
  const existingUser = await User.findOne({ email: data.email.toLowerCase() })
  if (existingUser) {
    throw new ValidationError('E-mail já está em uso')
  }

  // Password is hashed automatically by User model pre-save middleware
  const user = new User({
    email: data.email.toLowerCase(),
    name: data.name,
    password: data.password,
    role: data.role || 'user',
    status: 'active',
  })

  await user.save()

  // Log the action
  await logActivity('admin_action', 'Usuário criado pelo admin', {
    details: `Criado usuário: ${data.email}`,
  })

  return user.toObject()
}

export async function updateUser(
  id: string,
  data: {
    name?: string
    email?: string
    role?: UserRole
    status?: UserStatus
  }
): Promise<IUser> {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new NotFoundError('Usuário não encontrado')
  }

  // If updating email, check uniqueness
  if (data.email) {
    const existingUser = await User.findOne({
      email: data.email.toLowerCase(),
      _id: { $ne: new mongoose.Types.ObjectId(id) },
    })
    if (existingUser) {
      throw new ValidationError('E-mail já está em uso')
    }
    data.email = data.email.toLowerCase()
  }

  const user = await User.findByIdAndUpdate(
    id,
    { $set: data },
    { new: true }
  ).lean()

  if (!user) {
    throw new NotFoundError('Usuário não encontrado')
  }

  // Log status changes
  if (data.status === 'banned') {
    await logActivity('user_banned', 'Usuário banido', {
      userId: id,
      userName: (user as IUser).name,
      userEmail: (user as IUser).email,
    })
  } else if (data.status === 'active') {
    const originalUser = await User.findById(id)
    if (originalUser?.status === 'banned') {
      await logActivity('user_unbanned', 'Usuário desbanido', {
        userId: id,
        userName: (user as IUser).name,
        userEmail: (user as IUser).email,
      })
    }
  }

  return user as IUser
}

export async function deleteUser(id: string): Promise<void> {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new NotFoundError('Usuário não encontrado')
  }

  const user = await User.findById(id)
  if (!user) {
    throw new NotFoundError('Usuário não encontrado')
  }

  // Delete user and related data
  await Promise.all([
    User.findByIdAndDelete(id),
    DiaryEntry.deleteMany({ userId: new mongoose.Types.ObjectId(id) }),
    ProblematicFood.deleteMany({ userId: new mongoose.Types.ObjectId(id) }),
    UserAchievement.deleteMany({ userId: new mongoose.Types.ObjectId(id) }),
  ])

  await logActivity('admin_action', 'Usuário deletado pelo admin', {
    details: `Deletado usuário: ${user.email}`,
  })
}

// =============================================================================
// Food Management
// =============================================================================

export async function getFoods(filters: AdminFoodsFilters): Promise<PaginatedResult<IFood>> {
  const {
    search,
    category,
    fodmapLevel,
    isAiGenerated,
    page = 1,
    limit = 20,
  } = filters

  const query: Record<string, unknown> = {}

  if (search) {
    query.name = { $regex: search, $options: 'i' }
  }

  if (category) {
    query.category_level_1 = category
  }

  if (fodmapLevel && fodmapLevel !== 'all') {
    if (fodmapLevel === 'none') {
      query['fodmap.level'] = { $exists: false }
    } else {
      query['fodmap.level'] = fodmapLevel
    }
  }

  if (isAiGenerated !== undefined) {
    query['data_sources.ai_generated.is_ai_generated'] = isAiGenerated
  }

  const skip = (page - 1) * limit

  const [foods, total] = await Promise.all([
    Food.find(query)
      .sort({ name: 1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Food.countDocuments(query),
  ])

  return {
    data: foods as IFood[],
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }
}

export async function getFoodById(id: number): Promise<IFood> {
  const food = await Food.findOne({ id }).lean()
  if (!food) {
    throw new NotFoundError('Alimento não encontrado')
  }
  return food as IFood
}

export async function createFood(data: {
  name: string
  category_level_1: string
  category_level_2?: string
  category_level_3?: string
  image?: string
  fodmapLevel?: FodmapLevel
  fodmapNote?: string
}): Promise<IFood> {
  // Get the next ID
  const lastFood = await Food.findOne().sort({ id: -1 })
  const nextId = (lastFood?.id || 0) + 1

  const foodData: Record<string, unknown> = {
    id: nextId,
    name: data.name,
    source: 'user_contributed',
    category_level_1: data.category_level_1,
    category_level_2: data.category_level_2 || '',
    category_level_3: data.category_level_3 || '',
    image: data.image || null,
    data_sources: {
      nutritional_data: 'admin_created',
    },
    searchCount: 0,
  }

  if (data.fodmapLevel) {
    foodData.fodmap = {
      level: data.fodmapLevel,
      portion_note: data.fodmapNote || null,
      additional_notes: null,
      search_information: {
        match_type: 'single_ingredient',
        category: data.category_level_1,
        name_english: data.name,
        detected_keyword: data.name,
      },
    }
  }

  const food = new Food(foodData)
  await food.save()

  await logActivity('food_added', 'Alimento criado pelo admin', {
    details: `Criado alimento: ${data.name}`,
  })

  return food.toObject()
}

export async function updateFood(
  id: number,
  data: {
    name?: string
    category_level_1?: string
    category_level_2?: string
    category_level_3?: string
    image?: string
    fodmapLevel?: FodmapLevel
    fodmapNote?: string
    isAiGenerated?: boolean
  }
): Promise<IFood> {
  const updateData: Record<string, unknown> = {}

  if (data.name) updateData.name = data.name
  if (data.category_level_1) updateData.category_level_1 = data.category_level_1
  if (data.category_level_2 !== undefined) updateData.category_level_2 = data.category_level_2
  if (data.category_level_3 !== undefined) updateData.category_level_3 = data.category_level_3
  if (data.image !== undefined) updateData.image = data.image
  
  if (data.fodmapLevel) {
    updateData['fodmap.level'] = data.fodmapLevel
    if (data.fodmapNote) {
      updateData['fodmap.portion_note'] = data.fodmapNote
    }
  }

  if (data.isAiGenerated !== undefined) {
    updateData['data_sources.ai_generated.is_ai_generated'] = data.isAiGenerated
  }

  const food = await Food.findOneAndUpdate(
    { id },
    { $set: updateData },
    { new: true }
  ).lean()

  if (!food) {
    throw new NotFoundError('Alimento não encontrado')
  }

  await logActivity('food_edited', 'Alimento editado pelo admin', {
    details: `Editado alimento ID ${id}: ${(food as IFood).name}`,
  })

  return food as IFood
}

export async function deleteFood(id: number): Promise<void> {
  const food = await Food.findOne({ id })
  if (!food) {
    throw new NotFoundError('Alimento não encontrado')
  }

  await Food.deleteOne({ id })

  await logActivity('admin_action', 'Alimento deletado pelo admin', {
    details: `Deletado alimento: ${food.name}`,
  })
}

// =============================================================================
// News Management
// =============================================================================

export async function getNews(filters: AdminNewsFilters): Promise<PaginatedResult<INewsArticle>> {
  const {
    search,
    category,
    status,
    page = 1,
    limit = 20,
  } = filters

  const query: Record<string, unknown> = {}

  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { summary: { $regex: search, $options: 'i' } },
    ]
  }

  if (category && category !== 'all') {
    query.category = category
  }

  if (status && status !== 'all') {
    query.status = status
  }

  const skip = (page - 1) * limit

  const [articles, total] = await Promise.all([
    NewsArticle.find(query)
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-content') // Don't return full content in list
      .lean(),
    NewsArticle.countDocuments(query),
  ])

  return {
    data: articles as INewsArticle[],
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }
}

export async function getNewsById(id: string): Promise<INewsArticle> {
  // Try to parse as number first (for numeric IDs)
  const numericId = parseInt(id, 10)
  
  let article: INewsArticle | null = null
  
  if (!isNaN(numericId)) {
    article = await NewsArticle.findOne({ id: numericId }).lean() as INewsArticle | null
  }
  
  // If not found by numeric ID, try ObjectId
  if (!article && mongoose.Types.ObjectId.isValid(id)) {
    article = await NewsArticle.findById(id).lean() as INewsArticle | null
  }

  if (!article) {
    throw new NotFoundError('Artigo não encontrado')
  }

  return article
}

export async function createNews(data: {
  title: string
  summary: string
  content?: string
  category: ArticleCategory
  imageUrl?: string
  readTime?: number
  source?: string
  isFeatured?: boolean
  status?: ArticleStatus
}): Promise<INewsArticle> {
  // Get the next ID
  const lastArticle = await NewsArticle.findOne().sort({ id: -1 })
  const nextId = (lastArticle?.id || 0) + 1

  const article = new NewsArticle({
    id: nextId,
    title: data.title,
    summary: data.summary,
    content: data.content || '',
    category: data.category,
    imageUrl: data.imageUrl,
    readTime: data.readTime || 5,
    source: data.source,
    author: {
      name: 'Ceboelha',
      bio: 'Equipe Ceboelha',
    },
    tags: [],
    status: data.status || 'draft',
    isFeatured: data.isFeatured || false,
    views: 0,
    likes: 0,
    publishedAt: data.status === 'published' ? new Date() : undefined,
  })

  await article.save()

  await logActivity('admin_action', 'Artigo criado pelo admin', {
    details: `Criado artigo: ${data.title}`,
  })

  return article.toObject()
}

export async function updateNews(
  id: string,
  data: {
    title?: string
    summary?: string
    content?: string
    category?: ArticleCategory
    imageUrl?: string
    readTime?: number
    source?: string
    isFeatured?: boolean
    status?: ArticleStatus
  }
): Promise<INewsArticle> {
  const updateData = { ...data }

  // Set publishedAt when publishing
  if (data.status === 'published') {
    const existing = await NewsArticle.findOne({ id: parseInt(id, 10) })
    if (existing && existing.status !== 'published') {
      (updateData as Record<string, unknown>).publishedAt = new Date()
    }
  }

  // Try numeric ID first
  const numericId = parseInt(id, 10)
  let article: INewsArticle | null = null

  if (!isNaN(numericId)) {
    article = await NewsArticle.findOneAndUpdate(
      { id: numericId },
      { $set: updateData },
      { new: true }
    ).lean() as INewsArticle | null
  }

  // If not found, try ObjectId
  if (!article && mongoose.Types.ObjectId.isValid(id)) {
    article = await NewsArticle.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    ).lean() as INewsArticle | null
  }

  if (!article) {
    throw new NotFoundError('Artigo não encontrado')
  }

  await logActivity('admin_action', 'Artigo editado pelo admin', {
    details: `Editado artigo: ${article.title}`,
  })

  return article
}

export async function deleteNews(id: string): Promise<void> {
  const numericId = parseInt(id, 10)
  let article: INewsArticle | null = null
  let deleted = false

  if (!isNaN(numericId)) {
    article = await NewsArticle.findOne({ id: numericId })
    if (article) {
      await NewsArticle.deleteOne({ id: numericId })
      deleted = true
    }
  }

  if (!deleted && mongoose.Types.ObjectId.isValid(id)) {
    article = await NewsArticle.findById(id)
    if (article) {
      await NewsArticle.findByIdAndDelete(id)
      deleted = true
    }
  }

  if (!deleted) {
    throw new NotFoundError('Artigo não encontrado')
  }

  await logActivity('admin_action', 'Artigo deletado pelo admin', {
    details: `Deletado artigo: ${article?.title}`,
  })
}

// =============================================================================
// System Settings
// =============================================================================

export async function getSettings(): Promise<ISystemSettings> {
  let settings = await SystemSettings.findById('system_settings')

  if (!settings) {
    // Create default settings
    settings = new SystemSettings({ _id: 'system_settings' })
    await settings.save()
  }

  return settings.toObject()
}

// Type for partial settings update from API (all fields optional, dates as strings)
interface SettingsUpdateInput {
  maintenance?: {
    enabled?: boolean
    message?: string
    estimated_end?: string | Date
  }
  features?: Partial<ISystemSettings['features']>
  limits?: Partial<ISystemSettings['limits']>
  notifications?: Partial<ISystemSettings['notifications']>
  version?: Partial<ISystemSettings['version']>
}

export async function updateSettings(
  data: SettingsUpdateInput,
  adminId?: string
): Promise<ISystemSettings> {
  const updateData: Record<string, unknown> = {}

  // Deep merge each section
  if (data.maintenance) {
    for (const [key, value] of Object.entries(data.maintenance)) {
      // Convert string dates to Date objects
      if (key === 'estimated_end' && typeof value === 'string') {
        updateData[`maintenance.${key}`] = new Date(value)
      } else {
        updateData[`maintenance.${key}`] = value
      }
    }
  }
  if (data.features) {
    for (const [key, value] of Object.entries(data.features)) {
      updateData[`features.${key}`] = value
    }
  }

  if (data.limits) {
    for (const [key, value] of Object.entries(data.limits)) {
      updateData[`limits.${key}`] = value
    }
  }

  if (data.notifications) {
    for (const [key, value] of Object.entries(data.notifications)) {
      updateData[`notifications.${key}`] = value
    }
  }

  if (data.version) {
    for (const [key, value] of Object.entries(data.version)) {
      updateData[`version.${key}`] = value
    }
  }

  if (adminId) {
    updateData.updatedBy = new mongoose.Types.ObjectId(adminId)
  }

  updateData.updatedAt = new Date()

  const settings = await SystemSettings.findByIdAndUpdate(
    'system_settings',
    { $set: updateData },
    { new: true, upsert: true }
  )

  await logActivity('admin_action', 'Configurações atualizadas', {
    details: JSON.stringify(data),
  })

  return settings.toObject()
}

// =============================================================================
// Analytics
// =============================================================================

export async function getAnalytics(period: 'day' | 'week' | 'month' = 'week') {
  const days = period === 'day' ? 1 : period === 'week' ? 7 : 30
  const today = new Date()
  today.setUTCHours(23, 59, 59, 999)

  // Generate date range
  const dateRange: Date[] = []
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today)
    date.setUTCDate(date.getUTCDate() - i)
    date.setUTCHours(0, 0, 0, 0)
    dateRange.push(date)
  }

  // Get user activity
  const userActivity = await Promise.all(
    dateRange.map(async (date) => {
      const nextDay = new Date(date)
      nextDay.setUTCDate(nextDay.getUTCDate() + 1)

      const [logins, registrations, activeUsers] = await Promise.all([
        ActivityLog.countDocuments({
          type: 'user_login',
          timestamp: { $gte: date, $lt: nextDay },
        }),
        User.countDocuments({
          createdAt: { $gte: date, $lt: nextDay },
        }),
        ActivityLog.distinct('userId', {
          timestamp: { $gte: date, $lt: nextDay },
        }).then((ids) => ids.length),
      ])

      return {
        date: date.toISOString().split('T')[0],
        logins,
        registrations,
        activeUsers,
      }
    })
  )

  // Get diary activity
  const diaryActivity = await Promise.all(
    dateRange.map(async (date) => {
      const nextDay = new Date(date)
      nextDay.setUTCDate(nextDay.getUTCDate() + 1)

      const [meals, symptoms] = await Promise.all([
        DiaryEntry.countDocuments({
          type: 'meal',
          date: { $gte: date, $lt: nextDay },
        }),
        DiaryEntry.countDocuments({
          type: 'symptom',
          date: { $gte: date, $lt: nextDay },
        }),
      ])

      return {
        date: date.toISOString().split('T')[0],
        meals,
        symptoms,
      }
    })
  )

  // Get top searched foods
  const topSearchedFoods = await Food.find()
    .sort({ searchCount: -1 })
    .limit(5)
    .select('id name searchCount')
    .lean()

  // Get top problematic foods
  const topProblematicFoods = await ProblematicFood.aggregate([
    {
      $group: {
        _id: { foodId: '$foodId', foodName: '$foodName' },
        count: { $sum: 1 },
      },
    },
    { $sort: { count: -1 } },
    { $limit: 5 },
    {
      $project: {
        foodId: '$_id.foodId',
        foodName: '$_id.foodName',
        count: 1,
        _id: 0,
      },
    },
  ])

  // Get error rate
  const errorRate = await Promise.all(
    dateRange.map(async (date) => {
      const nextDay = new Date(date)
      nextDay.setUTCDate(nextDay.getUTCDate() + 1)

      const count = await ActivityLog.countDocuments({
        type: 'error',
        timestamp: { $gte: date, $lt: nextDay },
      })

      return {
        date: date.toISOString().split('T')[0],
        count,
      }
    })
  )

  return {
    period,
    userActivity,
    diaryActivity,
    topSearchedFoods: topSearchedFoods.map((f) => ({
      foodId: f.id,
      foodName: f.name,
      count: f.searchCount || 0,
    })),
    topProblematicFoods,
    errorRate,
  }
}

// =============================================================================
// Admin Diary Management
// =============================================================================

export interface AdminDiaryFilters {
  userId?: string
  type?: 'meal' | 'symptom' | 'all'
  startDate?: string
  endDate?: string
  page?: number
  limit?: number
}

export async function getDiaryEntries(filters: AdminDiaryFilters) {
  const { DiaryEntry } = await import('@/modules/diary/diary.model')
  
  const {
    userId,
    type,
    startDate,
    endDate,
    page = 1,
    limit = 20,
  } = filters

  const query: Record<string, unknown> = {}

  if (userId) {
    query.userId = new mongoose.Types.ObjectId(userId)
  }

  if (type && type !== 'all') {
    query.type = type
  }

  if (startDate || endDate) {
    query.date = {}
    if (startDate) {
      (query.date as Record<string, Date>).$gte = new Date(startDate)
    }
    if (endDate) {
      (query.date as Record<string, Date>).$lte = new Date(endDate)
    }
  }

  const skip = (page - 1) * limit

  const [entries, total] = await Promise.all([
    DiaryEntry.find(query)
      .populate('userId', 'name email')
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    DiaryEntry.countDocuments(query),
  ])

  // Format entries with user info
  const formattedEntries = entries.map((entry) => {
    const user = entry.userId as { name?: string; email?: string; _id?: { toString(): string } } | undefined
    // Get time from meal or symptom
    const time = entry.meal?.time || entry.symptom?.time || ''
    return {
      id: (entry as unknown as { _id: { toString(): string } })._id?.toString(),
      userId: user?._id?.toString() || '',
      userName: user?.name || 'Usuário',
      userEmail: user?.email || '',
      type: entry.type,
      date: (entry.date as Date)?.toISOString(),
      time,
      meal: entry.meal,
      symptom: entry.symptom,
      createdAt: (entry.createdAt as Date)?.toISOString(),
      updatedAt: (entry.updatedAt as Date)?.toISOString(),
    }
  })

  return {
    data: formattedEntries,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }
}

export async function deleteDiaryEntry(id: string): Promise<void> {
  const { DiaryEntry } = await import('@/modules/diary/diary.model')
  
  const entry = await DiaryEntry.findById(id)
  if (!entry) {
    throw new NotFoundError('Entrada não encontrada')
  }

  await DiaryEntry.deleteOne({ _id: id })

  await logActivity('admin_action', 'Entrada do diário deletada pelo admin', {
    details: `Deletada entrada ${id}`,
  })
}

// =============================================================================
// Admin Problematic Foods Management
// =============================================================================

export interface AdminProblematicFoodsFilters {
  userId?: string
  status?: 'suspected' | 'confirmed' | 'dismissed' | 'all'
  page?: number
  limit?: number
}

export async function getProblematicFoods(filters: AdminProblematicFoodsFilters) {
  const { ProblematicFood } = await import('@/modules/problematic-foods/problematic-food.model')
  
  const {
    userId,
    status,
    page = 1,
    limit = 20,
  } = filters

  const query: Record<string, unknown> = {}

  if (userId) {
    query.userId = new mongoose.Types.ObjectId(userId)
  }

  if (status && status !== 'all') {
    query.status = status
  }

  const skip = (page - 1) * limit

  const [foods, total] = await Promise.all([
    ProblematicFood.find(query)
      .populate('userId', 'name email')
      .sort({ lastOccurrence: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    ProblematicFood.countDocuments(query),
  ])

  // Format with user info
  const formattedFoods = foods.map((food) => {
    const user = food.userId as { name?: string; email?: string; _id?: { toString(): string } } | undefined
    return {
      id: (food as unknown as { _id: { toString(): string } })._id?.toString(),
      userId: user?._id?.toString() || '',
      userName: user?.name || 'Usuário',
      userEmail: user?.email || '',
      foodId: food.foodId,
      foodName: food.foodName,
      status: food.status,
      totalIncidents: food.totalIncidents,
      incidents: food.incidents,
      lastIncident: food.lastIncident,
      createdAt: (food.createdAt as Date)?.toISOString(),
      updatedAt: (food.updatedAt as Date)?.toISOString(),
    }
  })

  return {
    data: formattedFoods,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }
}

export async function deleteProblematicFood(id: string): Promise<void> {
  const { ProblematicFood } = await import('@/modules/problematic-foods/problematic-food.model')
  
  const food = await ProblematicFood.findById(id)
  if (!food) {
    throw new NotFoundError('Alimento problemático não encontrado')
  }

  await ProblematicFood.deleteOne({ _id: id })

  await logActivity('admin_action', 'Alimento problemático deletado pelo admin', {
    details: `Deletado alimento problemático: ${food.foodName}`,
  })
}

// =============================================================================
// Admin Achievements Management
// =============================================================================

export interface AdminAchievementsFilters {
  isActive?: boolean
  isHidden?: boolean
  page?: number
  limit?: number
}

export async function getAchievements(filters: AdminAchievementsFilters) {
  const { Achievement } = await import('@/modules/achievements/achievement.model')
  const { UserAchievement } = await import('@/modules/achievements/user-achievement.model')
  
  const {
    isActive,
    isHidden,
    page = 1,
    limit = 50,
  } = filters

  const query: Record<string, unknown> = {}

  if (isActive !== undefined) {
    query.isActive = isActive
  }

  if (isHidden !== undefined) {
    query.isHidden = isHidden
  }

  const skip = (page - 1) * limit

  const [achievements, total] = await Promise.all([
    Achievement.find(query)
      .sort({ order: 1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Achievement.countDocuments(query),
  ])

  // Get unlock counts for each achievement
  const achievementsWithStats = await Promise.all(
    achievements.map(async (achievement) => {
      const achievementId = (achievement as unknown as { _id: { toString(): string } })._id
      const unlockCount = await UserAchievement.countDocuments({
        achievementId,
      })

      return {
        id: achievementId?.toString(),
        code: achievement.id, // id field is the code (e.g., 'first_meal')
        title: achievement.title,
        description: achievement.description,
        icon: achievement.icon,
        color: achievement.color,
        category: achievement.category,
        requirement: achievement.requirement,
        reward: achievement.reward,
        rarity: achievement.rarity,
        hidden: achievement.hidden,
        active: achievement.active,
        order: achievement.order,
        unlockCount,
        createdAt: (achievement.createdAt as Date)?.toISOString(),
        updatedAt: (achievement.updatedAt as Date)?.toISOString(),
      }
    })
  )

  return {
    data: achievementsWithStats,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }
}

export async function updateAchievement(
  id: string,
  data: {
    title?: string
    description?: string
    icon?: string
    category?: string
    isActive?: boolean
    isHidden?: boolean
  }
) {
  const { Achievement } = await import('@/modules/achievements/achievement.model')

  // Map frontend field names to backend field names
  const updateData: Record<string, unknown> = {}
  if (data.title !== undefined) updateData.title = data.title
  if (data.description !== undefined) updateData.description = data.description
  if (data.icon !== undefined) updateData.icon = data.icon
  if (data.category !== undefined) updateData.category = data.category
  if (data.isActive !== undefined) updateData.active = data.isActive
  if (data.isHidden !== undefined) updateData.hidden = data.isHidden

  const achievement = await Achievement.findByIdAndUpdate(
    id,
    { $set: updateData },
    { new: true }
  ).lean()

  if (!achievement) {
    throw new NotFoundError('Conquista não encontrada')
  }

  await logActivity('admin_action', 'Conquista atualizada pelo admin', {
    details: `Atualizada conquista: ${achievement.title}`,
  })

  return achievement
}
