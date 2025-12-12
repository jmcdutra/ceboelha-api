/**
 * Achievements Service - Business Logic
 * 
 * Features:
 * - Get all achievements with user progress
 * - Update progress and check for unlocks
 * - Initialize achievements for new users
 */

import mongoose from 'mongoose'
import { Achievement, type IAchievement, type MetricType } from './achievement.model'
import { UserAchievement, type IUserAchievement } from './user-achievement.model'
import { DiaryEntry } from '@/modules/diary/diary.model'
import { ProblematicFood } from '@/modules/problematic-foods/problematic-food.model'
import { User } from '@/modules/users/user.model'

// =============================================================================
// Types (Frontend Compatible)
// =============================================================================

export interface AchievementProgress {
  current: number
  target: number
}

export interface AchievementDTO {
  id: string
  name: string // Frontend usa 'name' em vez de 'title'
  description: string
  emoji: string // Frontend usa 'emoji' em vez de 'icon'
  xpReward: number // Frontend usa 'xpReward' em vez de 'reward.points'
  unlockedAt?: string
  progress?: AchievementProgress
}

export interface AchievementsData {
  unlocked: AchievementDTO[]
  inProgress: AchievementDTO[]
  locked: AchievementDTO[]
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Convert Achievement + UserAchievement to frontend-compatible DTO
 */
function toDTO(
  achievement: IAchievement,
  userAchievement?: IUserAchievement
): AchievementDTO {
  const dto: AchievementDTO = {
    id: achievement.id,
    name: achievement.title,
    description: achievement.description,
    emoji: achievement.icon,
    xpReward: achievement.reward.points,
  }

  if (userAchievement?.unlocked && userAchievement.unlockedAt) {
    dto.unlockedAt = userAchievement.unlockedAt.toISOString()
  }

  // Add progress for non-unlocked achievements
  if (userAchievement && !userAchievement.unlocked) {
    dto.progress = {
      current: userAchievement.progress,
      target: achievement.requirement.target,
    }
  }

  return dto
}

// =============================================================================
// Service Functions
// =============================================================================

/**
 * Get all achievements organized by status for a user
 */
export async function getAll(userId: string): Promise<AchievementsData> {
  const userObjectId = new mongoose.Types.ObjectId(userId)

  // Get all active achievements (excluding hidden ones that aren't unlocked)
  const achievements = await Achievement.find({ active: true })
    .sort({ order: 1 })
    .lean()

  // Get user's progress for all achievements
  const userAchievements = await UserAchievement.find({ userId: userObjectId }).lean()

  // Create a map for quick lookup
  const userProgressMap = new Map<string, IUserAchievement>()
  for (const ua of userAchievements) {
    userProgressMap.set(ua.achievementId, ua as IUserAchievement)
  }

  const result: AchievementsData = {
    unlocked: [],
    inProgress: [],
    locked: [],
  }

  for (const achievement of achievements) {
    const userProgress = userProgressMap.get(achievement.id)

    // Skip hidden achievements that user hasn't started
    if (achievement.hidden && !userProgress) {
      continue
    }

    const dto = toDTO(achievement as IAchievement, userProgress)

    if (userProgress?.unlocked) {
      result.unlocked.push(dto)
    } else if (userProgress && userProgress.progress > 0) {
      result.inProgress.push(dto)
    } else {
      // Don't show progress for locked achievements (no user record yet)
      result.locked.push(dto)
    }
  }

  // Sort unlocked by unlock date (most recent first)
  result.unlocked.sort((a, b) => {
    if (!a.unlockedAt || !b.unlockedAt) return 0
    return new Date(b.unlockedAt).getTime() - new Date(a.unlockedAt).getTime()
  })

  return result
}

/**
 * Update progress for a specific metric and check for unlocks
 */
export async function updateProgress(
  userId: string,
  metric: MetricType,
  value: number
): Promise<AchievementDTO[]> {
  const userObjectId = new mongoose.Types.ObjectId(userId)
  const newlyUnlocked: AchievementDTO[] = []

  // Find all achievements that use this metric
  const achievements = await Achievement.find({
    active: true,
    'requirement.metric': metric,
  }).lean()

  for (const achievement of achievements) {
    // Get or create user achievement record
    let userAchievement = await UserAchievement.findOne({
      userId: userObjectId,
      achievementId: achievement.id,
    })

    if (!userAchievement) {
      userAchievement = new UserAchievement({
        userId: userObjectId,
        achievementId: achievement.id,
        progress: 0,
        unlocked: false,
        startedAt: new Date(),
      })
    }

    // Skip if already unlocked
    if (userAchievement.unlocked) {
      continue
    }

    // Update progress based on requirement type
    const { type, target } = achievement.requirement

    switch (type) {
      case 'count':
        // For count, value is the new total count
        userAchievement.progress = value
        break

      case 'streak':
        // For streak, value is current streak days
        userAchievement.progress = value
        break

      case 'unique':
        // For unique, value is count of unique items
        userAchievement.progress = value
        break

      case 'custom':
        // For custom, just set to value (usually 0 or 1)
        userAchievement.progress = value
        break
    }

    // Check if achievement should be unlocked
    if (userAchievement.progress >= target) {
      userAchievement.unlocked = true
      userAchievement.unlockedAt = new Date()
      userAchievement.progress = target // Cap at target

      newlyUnlocked.push(toDTO(achievement as IAchievement, userAchievement))
    }

    await userAchievement.save()
  }

  return newlyUnlocked
}

/**
 * Initialize achievements for a new user
 * Creates records with 0 progress for common achievements
 */
export async function initializeForUser(userId: string): Promise<void> {
  const userObjectId = new mongoose.Types.ObjectId(userId)

  // Get all active, non-hidden achievements
  const achievements = await Achievement.find({
    active: true,
    hidden: false,
  }).lean()

  // Check if user already has any achievements
  const existingCount = await UserAchievement.countDocuments({ userId: userObjectId })
  if (existingCount > 0) {
    return // Already initialized
  }

  // Create initial records
  const records = achievements.map((a) => ({
    userId: userObjectId,
    achievementId: a.id,
    progress: 0,
    unlocked: false,
    startedAt: new Date(),
  }))

  if (records.length > 0) {
    await UserAchievement.insertMany(records)
  }
}

/**
 * Calculate and update metrics from diary entries
 * Should be called after diary changes
 */
export async function recalculateMetrics(userId: string): Promise<AchievementDTO[]> {
  const userObjectId = new mongoose.Types.ObjectId(userId)
  let allUnlocked: AchievementDTO[] = []

  // Calculate meals logged
  const mealsCount = await DiaryEntry.countDocuments({
    userId: userObjectId,
    type: 'meal',
  })
  const mealsUnlocked = await updateProgress(userId, 'meals_logged', mealsCount)
  allUnlocked = allUnlocked.concat(mealsUnlocked)

  // Calculate symptoms logged
  const symptomsCount = await DiaryEntry.countDocuments({
    userId: userObjectId,
    type: 'symptom',
  })
  const symptomsUnlocked = await updateProgress(userId, 'symptoms_logged', symptomsCount)
  allUnlocked = allUnlocked.concat(symptomsUnlocked)

  // Calculate unique foods tested
  const uniqueFoods = await DiaryEntry.aggregate([
    { $match: { userId: userObjectId, type: 'meal' } },
    { $unwind: '$meal.foods' },
    { $group: { _id: '$meal.foods.foodId' } },
    { $count: 'total' },
  ])
  const foodsCount = uniqueFoods[0]?.total || 0
  const foodsUnlocked = await updateProgress(userId, 'foods_tested', foodsCount)
  allUnlocked = allUnlocked.concat(foodsUnlocked)

  // Calculate problematic foods marked
  const problematicCount = await ProblematicFood.countDocuments({
    userId: userObjectId,
  })
  const problematicUnlocked = await updateProgress(userId, 'problematic_foods_marked', problematicCount)
  allUnlocked = allUnlocked.concat(problematicUnlocked)

  // Calculate days with entries (for streak)
  const daysWithEntries = await DiaryEntry.aggregate([
    { $match: { userId: userObjectId } },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$date' },
        },
      },
    },
    { $count: 'total' },
  ])
  const daysLogged = daysWithEntries[0]?.total || 0
  const daysUnlocked = await updateProgress(userId, 'days_logged', daysLogged)
  allUnlocked = allUnlocked.concat(daysUnlocked)

  // Calculate current streak
  const streak = await calculateStreak(userId)
  const streakUnlocked = await updateProgress(userId, 'days_streak', streak)
  allUnlocked = allUnlocked.concat(streakUnlocked)

  // Check for weekend_warrior achievement
  const weekendWarrior = await checkWeekendWarrior(userId)
  if (weekendWarrior) {
    const unlocked = await unlockCustom(userId, 'weekend_warrior')
    if (unlocked) allUnlocked.push(unlocked)
  }

  // Check for ceboelha_fan achievement (6 months of usage)
  const ceboelhaFan = await checkCeboelhaFan(userId)
  if (ceboelhaFan) {
    const unlocked = await unlockCustom(userId, 'ceboelha_fan')
    if (unlocked) allUnlocked.push(unlocked)
  }

  return allUnlocked
}

/**
 * Calculate current streak (consecutive days with entries)
 */
async function calculateStreak(userId: string): Promise<number> {
  const userObjectId = new mongoose.Types.ObjectId(userId)

  // Get all unique dates with entries, sorted desc
  const dates = await DiaryEntry.aggregate([
    { $match: { userId: userObjectId } },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$date' },
        },
      },
    },
    { $sort: { _id: -1 } },
  ])

  if (dates.length === 0) return 0

  // Check if there's an entry for today or yesterday
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  const todayStr = today.toISOString().split('T')[0]
  const yesterdayStr = yesterday.toISOString().split('T')[0]

  // Streak must include today or yesterday to be active
  if (dates[0]._id !== todayStr && dates[0]._id !== yesterdayStr) {
    return 0
  }

  // Count consecutive days
  let streak = 1
  let currentDate = new Date(dates[0]._id)

  for (let i = 1; i < dates.length; i++) {
    const prevDate = new Date(currentDate)
    prevDate.setDate(prevDate.getDate() - 1)
    const prevDateStr = prevDate.toISOString().split('T')[0]

    if (dates[i]._id === prevDateStr) {
      streak++
      currentDate = prevDate
    } else {
      break // Streak broken
    }
  }

  return streak
}

/**
 * Unlock a custom achievement (e.g., easter eggs)
 */
export async function unlockCustom(
  userId: string,
  achievementId: string
): Promise<AchievementDTO | null> {
  const userObjectId = new mongoose.Types.ObjectId(userId)

  // Find the achievement
  const achievement = await Achievement.findOne({
    id: achievementId,
    active: true,
  }).lean()

  if (!achievement) return null

  // Get or create user achievement
  let userAchievement = await UserAchievement.findOne({
    userId: userObjectId,
    achievementId,
  })

  if (userAchievement?.unlocked) {
    return null // Already unlocked
  }

  if (!userAchievement) {
    userAchievement = new UserAchievement({
      userId: userObjectId,
      achievementId,
      progress: 0,
      unlocked: false,
      startedAt: new Date(),
    })
  }

  // Unlock it
  userAchievement.progress = achievement.requirement.target
  userAchievement.unlocked = true
  userAchievement.unlockedAt = new Date()
  await userAchievement.save()

  return toDTO(achievement as IAchievement, userAchievement)
}

/**
 * Mark achievement notification as seen
 */
export async function markNotified(
  userId: string,
  achievementId: string
): Promise<void> {
  const userObjectId = new mongoose.Types.ObjectId(userId)

  await UserAchievement.updateOne(
    { userId: userObjectId, achievementId },
    { $set: { notified: true } }
  )
}

/**
 * Get unnotified achievements for a user
 */
export async function getUnnotified(userId: string): Promise<AchievementDTO[]> {
  const userObjectId = new mongoose.Types.ObjectId(userId)

  const unnotified = await UserAchievement.find({
    userId: userObjectId,
    unlocked: true,
    notified: false,
  }).lean()

  if (unnotified.length === 0) return []

  const achievementIds = unnotified.map((u) => u.achievementId)
  const achievements = await Achievement.find({
    id: { $in: achievementIds },
  }).lean()

  const achievementMap = new Map<string, IAchievement>()
  for (const a of achievements) {
    achievementMap.set(a.id, a as IAchievement)
  }

  return unnotified
    .map((ua) => {
      const achievement = achievementMap.get(ua.achievementId)
      if (!achievement) return null
      return toDTO(achievement, ua as IUserAchievement)
    })
    .filter((a): a is AchievementDTO => a !== null)
}

// =============================================================================
// Special Achievement Checks
// =============================================================================

/**
 * Check if user has logged meals on all weekends of any complete month
 * Weekend = Saturday and Sunday
 */
async function checkWeekendWarrior(userId: string): Promise<boolean> {
  const userObjectId = new mongoose.Types.ObjectId(userId)

  // Get all dates with meal entries
  const mealDates = await DiaryEntry.aggregate([
    { $match: { userId: userObjectId, type: 'meal' } },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$date' },
        },
      },
    },
  ])

  if (mealDates.length === 0) return false

  // Convert to Set for O(1) lookup
  const dateSet = new Set(mealDates.map((d) => d._id))

  // Check each month the user has entries
  const sortedDates = mealDates.map((d) => d._id).sort()
  const firstDate = new Date(sortedDates[0])
  const lastDate = new Date(sortedDates[sortedDates.length - 1])

  // Check complete months only
  const currentDate = new Date(firstDate.getFullYear(), firstDate.getMonth(), 1)
  const today = new Date()

  while (currentDate <= lastDate) {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()

    // Only check months that have already ended (complete months)
    const monthEnd = new Date(year, month + 1, 0)
    if (monthEnd > today) {
      currentDate.setMonth(currentDate.getMonth() + 1)
      continue
    }

    // Find all weekends in this month
    const weekends: string[] = []
    for (let day = 1; day <= monthEnd.getDate(); day++) {
      const date = new Date(year, month, day)
      const dayOfWeek = date.getDay()
      // 0 = Sunday, 6 = Saturday
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        weekends.push(date.toISOString().split('T')[0])
      }
    }

    // Check if user has entries on ALL weekends of this month
    const hasAllWeekends = weekends.every((weekend) => dateSet.has(weekend))

    if (hasAllWeekends && weekends.length >= 8) {
      // At least 4 weekends (8 days)
      return true
    }

    currentDate.setMonth(currentDate.getMonth() + 1)
  }

  return false
}

/**
 * Check if user has been active for 6 consecutive months
 * Active = at least 1 entry per month
 */
async function checkCeboelhaFan(userId: string): Promise<boolean> {
  const userObjectId = new mongoose.Types.ObjectId(userId)

  // Get user creation date
  const user = await User.findById(userObjectId).lean()
  if (!user) return false

  const createdAt = new Date(user.createdAt)
  const today = new Date()

  // User must have been registered for at least 6 months
  const sixMonthsAgo = new Date(today)
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

  if (createdAt > sixMonthsAgo) return false

  // Get months with entries
  const monthsWithEntries = await DiaryEntry.aggregate([
    { $match: { userId: userObjectId } },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m', date: '$date' },
        },
      },
    },
    { $sort: { _id: 1 } },
  ])

  if (monthsWithEntries.length < 6) return false

  // Check for 6 consecutive months
  const months = monthsWithEntries.map((m) => m._id)

  for (let i = 0; i <= months.length - 6; i++) {
    let consecutive = true
    for (let j = 0; j < 5; j++) {
      const current = new Date(months[i + j] + '-01')
      const next = new Date(months[i + j + 1] + '-01')

      // Check if next month is exactly 1 month after current
      const expectedNext = new Date(current)
      expectedNext.setMonth(expectedNext.getMonth() + 1)

      if (
        next.getFullYear() !== expectedNext.getFullYear() ||
        next.getMonth() !== expectedNext.getMonth()
      ) {
        consecutive = false
        break
      }
    }

    if (consecutive) return true
  }

  return false
}
