/**
 * Diary Service - Business Logic
 *
 * Features:
 * - CRUD for diary entries (meals and symptoms)
 * - Day summary with status calculation
 * - Month summary for calendar view
 * - Symptoms overview with trends and correlations
 * - User stats update on entry creation
 */

import mongoose from 'mongoose'
import { DiaryEntry, type IDiaryEntry } from './diary.model'
import { User } from '@/modules/users/user.model'
import { NotFoundError, ForbiddenError, ValidationError } from '@/shared/errors'
import { achievementsService } from '@/modules/achievements'
import { ActivityLog } from '@/modules/admin/activity-log.model'
import type {
  DiaryEntryType,
  MealData,
  SymptomData,
  SymptomType,
} from '@/shared/types'

// =============================================================================
// Types
// =============================================================================

export interface DiaryQueryParams {
  date?: string
  startDate?: string
  endDate?: string
  type?: 'meal' | 'symptom' | 'all'
}

export interface DaySummary {
  date: string
  mealsCount: number
  symptomsCount: number
  worstSymptomIntensity: number
  status: 'great' | 'good' | 'okay' | 'bad' | 'terrible' | 'empty'
  problematicFoodsCount: number
}

export interface MonthSummary {
  year: number
  month: number
  days: DaySummary[]
}

export interface SymptomCount {
  type: SymptomType
  count: number
  avgIntensity: number
}

export interface SymptomTrend {
  date: string
  count: number
  avgIntensity: number
}

export interface FoodCorrelation {
  foodId: number
  foodName: string
  occurrences: number
  avgIntensity: number
}

export interface SymptomsOverview {
  totalSymptoms: number
  avgIntensity: number
  mostFrequent: SymptomCount[]
  trends: SymptomTrend[]
  foodCorrelations: FoodCorrelation[]
  periodStart: string
  periodEnd: string
}

export interface CreateMealData {
  date: string
  meal: MealData
}

export interface CreateSymptomData {
  date: string
  symptom: SymptomData
}

export interface UpdateEntryData {
  meal?: Partial<MealData>
  symptom?: Partial<SymptomData>
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Calculate day status based on symptoms
 */
function calculateDayStatus(
  worstIntensity: number,
  symptomsCount: number
): DaySummary['status'] {
  if (symptomsCount === 0) return 'great'
  if (worstIntensity <= 2) return 'good'
  if (worstIntensity === 3) return 'okay'
  if (worstIntensity === 4) return 'bad'
  return 'terrible'
}

/**
 * Parse date string to start and end of day in UTC
 */
function getDateRange(dateStr: string): { start: Date; end: Date } {
  const start = new Date(`${dateStr}T00:00:00.000Z`)
  const end = new Date(`${dateStr}T23:59:59.999Z`)
  return { start, end }
}

/**
 * Format entry for API response
 */
function formatEntry(entry: IDiaryEntry) {
  return {
    id: entry._id.toString(),
    userId: entry.userId.toString(),
    type: entry.type,
    date: entry.date.toISOString().split('T')[0],
    meal: entry.meal,
    symptom: entry.symptom,
    createdAt: entry.createdAt.toISOString(),
    updatedAt: entry.updatedAt.toISOString(),
  }
}

// =============================================================================
// Service Functions
// =============================================================================

/**
 * Get diary entries with filters
 */
export async function getEntries(
  userId: string,
  params: DiaryQueryParams
) {
  const query: Record<string, unknown> = {
    userId: new mongoose.Types.ObjectId(userId),
  }

  // Date filters
  if (params.date) {
    const { start, end } = getDateRange(params.date)
    query.date = { $gte: start, $lte: end }
  } else if (params.startDate && params.endDate) {
    const { start } = getDateRange(params.startDate)
    const { end } = getDateRange(params.endDate)
    query.date = { $gte: start, $lte: end }
  }

  // Type filter
  if (params.type && params.type !== 'all') {
    query.type = params.type
  }

  const entries = await DiaryEntry.find(query)
    .sort({ date: -1, 'meal.time': -1, 'symptom.time': -1 })
    .lean()
    .exec()

  return entries.map(formatEntry)
}

/**
 * Get entry by ID
 */
export async function getEntryById(userId: string, entryId: string) {
  if (!mongoose.Types.ObjectId.isValid(entryId)) {
    throw new NotFoundError('Entrada do diário')
  }

  const entry = await DiaryEntry.findById(entryId).lean().exec()

  if (!entry) {
    throw new NotFoundError('Entrada do diário')
  }

  // Verify ownership
  if (entry.userId.toString() !== userId) {
    throw new ForbiddenError('Você não tem permissão para acessar esta entrada')
  }

  return formatEntry(entry as IDiaryEntry)
}

/**
 * Get day summary
 */
export async function getDaySummary(userId: string, date: string): Promise<DaySummary> {
  const { start, end } = getDateRange(date)

  const entries = await DiaryEntry.find({
    userId: new mongoose.Types.ObjectId(userId),
    date: { $gte: start, $lte: end },
  })
    .lean()
    .exec()

  const meals = entries.filter((e) => e.type === 'meal')
  const symptoms = entries.filter((e) => e.type === 'symptom')

  const worstIntensity = symptoms.reduce((max, entry) => {
    return Math.max(max, entry.symptom?.intensity || 0)
  }, 0)

  const problematicFoodsCount = meals.reduce((count, entry) => {
    const badFoods = entry.meal?.foods.filter((f) => f.markedAsBad) || []
    return count + badFoods.length
  }, 0)

  return {
    date,
    mealsCount: meals.length,
    symptomsCount: symptoms.length,
    worstSymptomIntensity: worstIntensity,
    status: entries.length === 0 ? 'empty' : calculateDayStatus(worstIntensity, symptoms.length),
    problematicFoodsCount,
  }
}

/**
 * Get month summary for calendar
 */
export async function getMonthSummary(
  userId: string,
  year: number,
  month: number
): Promise<MonthSummary> {
  const daysInMonth = new Date(year, month, 0).getDate()
  const startDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0))
  const endDate = new Date(Date.UTC(year, month - 1, daysInMonth, 23, 59, 59, 999))

  const entries = await DiaryEntry.find({
    userId: new mongoose.Types.ObjectId(userId),
    date: { $gte: startDate, $lte: endDate },
  })
    .lean()
    .exec()

  // Group entries by day
  const entriesByDay = new Map<string, typeof entries>()
  for (const entry of entries) {
    const dateStr = entry.date.toISOString().split('T')[0]
    if (!entriesByDay.has(dateStr)) {
      entriesByDay.set(dateStr, [])
    }
    entriesByDay.get(dateStr)!.push(entry)
  }

  // Build days array
  const days: DaySummary[] = []
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    const dayEntries = entriesByDay.get(dateStr) || []

    const meals = dayEntries.filter((e) => e.type === 'meal')
    const symptoms = dayEntries.filter((e) => e.type === 'symptom')

    const worstIntensity = symptoms.reduce((max, entry) => {
      return Math.max(max, entry.symptom?.intensity || 0)
    }, 0)

    const problematicFoodsCount = meals.reduce((count, entry) => {
      const badFoods = entry.meal?.foods.filter((f) => f.markedAsBad) || []
      return count + badFoods.length
    }, 0)

    days.push({
      date: dateStr,
      mealsCount: meals.length,
      symptomsCount: symptoms.length,
      worstSymptomIntensity: worstIntensity,
      status:
        dayEntries.length === 0 ? 'empty' : calculateDayStatus(worstIntensity, symptoms.length),
      problematicFoodsCount,
    })
  }

  return { year, month, days }
}

/**
 * Get symptoms overview with trends and correlations
 */
export async function getSymptomsOverview(
  userId: string,
  days: number = 30
): Promise<SymptomsOverview> {
  const today = new Date()
  const startDate = new Date(today)
  startDate.setDate(today.getDate() - days)
  startDate.setUTCHours(0, 0, 0, 0)

  const endDate = new Date(today)
  endDate.setUTCHours(23, 59, 59, 999)

  const startDateStr = startDate.toISOString().split('T')[0]
  const endDateStr = endDate.toISOString().split('T')[0]

  // Get all entries in the period
  const entries = await DiaryEntry.find({
    userId: new mongoose.Types.ObjectId(userId),
    date: { $gte: startDate, $lte: endDate },
  })
    .lean()
    .exec()

  const symptomEntries = entries.filter((e) => e.type === 'symptom')
  const mealEntries = entries.filter((e) => e.type === 'meal')

  // Calculate totals
  const totalSymptoms = symptomEntries.length
  const intensities = symptomEntries.map((e) => e.symptom!.intensity)
  const avgIntensity =
    totalSymptoms > 0 ? intensities.reduce((a, b) => a + b, 0) / totalSymptoms : 0

  // Count symptom types
  const symptomCounts: Record<string, { count: number; intensities: number[] }> = {}
  for (const entry of symptomEntries) {
    const type = entry.symptom!.type
    if (!symptomCounts[type]) {
      symptomCounts[type] = { count: 0, intensities: [] }
    }
    symptomCounts[type].count += 1
    symptomCounts[type].intensities.push(entry.symptom!.intensity)
  }

  // Build mostFrequent array
  const mostFrequent: SymptomCount[] = Object.entries(symptomCounts)
    .map(([type, data]) => ({
      type: type as SymptomType,
      count: data.count,
      avgIntensity:
        Math.round((data.intensities.reduce((a, b) => a + b, 0) / data.intensities.length) * 10) /
        10,
    }))
    .sort((a, b) => b.count - a.count)

  // Build trends (last 14 days max)
  const trendDays = Math.min(days, 14)
  const trends: SymptomTrend[] = []
  for (let i = trendDays - 1; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(today.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]

    const daySymptoms = symptomEntries.filter(
      (e) => e.date.toISOString().split('T')[0] === dateStr
    )
    const dayIntensities = daySymptoms.map((e) => e.symptom!.intensity)

    trends.push({
      date: dateStr,
      count: daySymptoms.length,
      avgIntensity:
        daySymptoms.length > 0
          ? Math.round((dayIntensities.reduce((a, b) => a + b, 0) / daySymptoms.length) * 10) / 10
          : 0,
    })
  }

  // Build food correlations (foods marked as bad)
  const foodCorrelationsMap: Record<
    number,
    { foodName: string; occurrences: number; intensities: number[] }
  > = {}

  for (const meal of mealEntries) {
    const badFoods = meal.meal?.foods.filter((f) => f.markedAsBad) || []
    for (const food of badFoods) {
      if (!foodCorrelationsMap[food.foodId]) {
        foodCorrelationsMap[food.foodId] = {
          foodName: food.foodName,
          occurrences: 0,
          intensities: [],
        }
      }
      foodCorrelationsMap[food.foodId].occurrences += 1
      // Find symptoms close to this meal (same day)
      const mealDate = meal.date.toISOString().split('T')[0]
      const relatedSymptoms = symptomEntries.filter(
        (s) => s.date.toISOString().split('T')[0] === mealDate
      )
      for (const symptom of relatedSymptoms) {
        foodCorrelationsMap[food.foodId].intensities.push(symptom.symptom!.intensity)
      }
    }
  }

  const foodCorrelations: FoodCorrelation[] = Object.entries(foodCorrelationsMap)
    .map(([foodId, data]) => ({
      foodId: parseInt(foodId, 10),
      foodName: data.foodName,
      occurrences: data.occurrences,
      avgIntensity:
        data.intensities.length > 0
          ? Math.round(
              (data.intensities.reduce((a, b) => a + b, 0) / data.intensities.length) * 10
            ) / 10
          : 0,
    }))
    .sort((a, b) => b.occurrences - a.occurrences)

  return {
    totalSymptoms,
    avgIntensity: Math.round(avgIntensity * 10) / 10,
    mostFrequent,
    trends,
    foodCorrelations,
    periodStart: startDateStr,
    periodEnd: endDateStr,
  }
}

/**
 * Create meal entry
 */
export async function createMealEntry(userId: string, data: CreateMealData) {
  const { date, meal } = data
  const entryDate = new Date(`${date}T${meal.time}:00.000Z`)

  const entry = new DiaryEntry({
    userId: new mongoose.Types.ObjectId(userId),
    type: 'meal' as DiaryEntryType,
    date: entryDate,
    meal,
  })

  await entry.save()

  // Update user stats in background
  updateUserStats(userId, 'meal').catch(() => {
    // Silently ignore errors
  })

  // Update achievements in background
  achievementsService.recalculateMetrics(userId).catch(() => {
    // Silently ignore errors - achievements are not critical
  })

  // Check for special achievements (night_owl, early_bird)
  const hour = parseInt(meal.time.split(':')[0], 10)
  if (hour >= 0 && hour < 6) {
    // Between midnight and 6am
    if (hour < 5) {
      // Night owl: after midnight but before 5am
      achievementsService.unlockCustom(userId, 'night_owl').catch(() => {})
    } else {
      // Early bird: 5am-6am
      achievementsService.unlockCustom(userId, 'early_bird').catch(() => {})
    }
  }

  // Activity Log - meal_logged
  const user = await User.findById(userId)
  if (user) {
    ActivityLog.create({
      type: 'meal_logged',
      userId: user._id,
      userName: user.name,
      userEmail: user.email,
      action: `Refeição registrada: ${meal.type}`,
      details: JSON.stringify({ 
        mealType: meal.type, 
        foodsCount: meal.foods?.length || 0,
        date 
      }),
      timestamp: new Date(),
    }).catch(() => {}) // Fire and forget
  }

  return formatEntry(entry)
}

/**
 * Create symptom entry
 */
export async function createSymptomEntry(userId: string, data: CreateSymptomData) {
  const { date, symptom } = data
  const entryDate = new Date(`${date}T${symptom.time}:00.000Z`)

  const entry = new DiaryEntry({
    userId: new mongoose.Types.ObjectId(userId),
    type: 'symptom' as DiaryEntryType,
    date: entryDate,
    symptom,
  })

  await entry.save()

  // Update user stats in background
  updateUserStats(userId, 'symptom').catch(() => {
    // Silently ignore errors
  })

  // Update achievements in background
  achievementsService.recalculateMetrics(userId).catch(() => {
    // Silently ignore errors - achievements are not critical
  })

  // Activity Log - symptom_logged
  const user = await User.findById(userId)
  if (user) {
    ActivityLog.create({
      type: 'symptom_logged',
      userId: user._id,
      userName: user.name,
      userEmail: user.email,
      action: `Sintoma registrado: ${symptom.type}`,
      details: JSON.stringify({ 
        symptomType: symptom.type, 
        intensity: symptom.intensity,
        date 
      }),
      timestamp: new Date(),
    }).catch(() => {}) // Fire and forget
  }

  return formatEntry(entry)
}

/**
 * Update entry
 */
export async function updateEntry(
  userId: string,
  entryId: string,
  data: UpdateEntryData
) {
  if (!mongoose.Types.ObjectId.isValid(entryId)) {
    throw new NotFoundError('Entrada do diário')
  }

  const entry = await DiaryEntry.findById(entryId)

  if (!entry) {
    throw new NotFoundError('Entrada do diário')
  }

  // Verify ownership
  if (entry.userId.toString() !== userId) {
    throw new ForbiddenError('Você não tem permissão para editar esta entrada')
  }

  // Update based on entry type
  if (entry.type === 'meal' && data.meal) {
    if (data.meal.type) entry.meal!.type = data.meal.type
    if (data.meal.time) entry.meal!.time = data.meal.time
    if (data.meal.foods) entry.meal!.foods = data.meal.foods
    if (data.meal.notes !== undefined) entry.meal!.notes = data.meal.notes
  } else if (entry.type === 'symptom' && data.symptom) {
    if (data.symptom.type) entry.symptom!.type = data.symptom.type
    if (data.symptom.intensity) entry.symptom!.intensity = data.symptom.intensity
    if (data.symptom.time) entry.symptom!.time = data.symptom.time
    if (data.symptom.duration !== undefined) entry.symptom!.duration = data.symptom.duration
    if (data.symptom.notes !== undefined) entry.symptom!.notes = data.symptom.notes
  }

  await entry.save()
  return formatEntry(entry)
}

/**
 * Delete entry
 */
export async function deleteEntry(userId: string, entryId: string) {
  if (!mongoose.Types.ObjectId.isValid(entryId)) {
    throw new NotFoundError('Entrada do diário')
  }

  const entry = await DiaryEntry.findById(entryId)

  if (!entry) {
    throw new NotFoundError('Entrada do diário')
  }

  // Verify ownership
  if (entry.userId.toString() !== userId) {
    throw new ForbiddenError('Você não tem permissão para deletar esta entrada')
  }

  const entryType = entry.type

  await entry.deleteOne()

  // Activity Log - entry_deleted
  const user = await User.findById(userId)
  if (user) {
    ActivityLog.create({
      type: 'entry_deleted',
      userId: user._id,
      userName: user.name,
      userEmail: user.email,
      action: `Entrada do diário deletada: ${entryType}`,
      details: JSON.stringify({ entryId, entryType }),
      timestamp: new Date(),
    }).catch(() => {}) // Fire and forget
  }
}

/**
 * Update user stats after creating entry
 */
async function updateUserStats(userId: string, entryType: 'meal' | 'symptom') {
  const update: Record<string, number> = {
    'stats.lastActive': Date.now(),
  }

  if (entryType === 'meal') {
    update['stats.totalMealsLogged'] = 1
  } else {
    update['stats.totalSymptomsLogged'] = 1
  }

  await User.updateOne(
    { _id: new mongoose.Types.ObjectId(userId) },
    {
      $inc: update,
      $set: { lastActive: new Date() },
    }
  )

  // Calculate and update streak
  await updateUserStreak(userId)
}

/**
 * Update user streak
 */
async function updateUserStreak(userId: string) {
  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)

  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  // Check if there's an entry today
  const todayEntry = await DiaryEntry.findOne({
    userId: new mongoose.Types.ObjectId(userId),
    date: { $gte: today },
  })

  if (!todayEntry) return

  // Check if there was an entry yesterday
  const yesterdayEntry = await DiaryEntry.findOne({
    userId: new mongoose.Types.ObjectId(userId),
    date: {
      $gte: yesterday,
      $lt: today,
    },
  })

  const user = await User.findById(userId)
  if (!user) return

  const currentStreak = user.stats?.currentStreak || 0
  const longestStreak = user.stats?.longestStreak || 0

  let newStreak = currentStreak

  if (yesterdayEntry) {
    // Continue streak
    newStreak = currentStreak + 1
  } else {
    // Reset streak to 1 (today counts)
    newStreak = 1
  }

  await User.updateOne(
    { _id: new mongoose.Types.ObjectId(userId) },
    {
      $set: {
        'stats.currentStreak': newStreak,
        'stats.longestStreak': Math.max(longestStreak, newStreak),
      },
    }
  )
}
