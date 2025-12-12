/**
 * Insights Service - Business Logic
 *
 * Features:
 * - Daily highlights (achievements, patterns, warnings, tips)
 * - Weekly summary with statistics
 * - Discoveries (triggers, safe foods, patterns)
 *
 * Note: This module doesn't have its own model.
 * It analyzes data from Diary, ProblematicFoods, and User.
 */

import mongoose from 'mongoose'
import { DiaryEntry } from '@/modules/diary/diary.model'
import { ProblematicFood } from '@/modules/problematic-foods/problematic-food.model'
import { User } from '@/modules/users/user.model'
import type { SymptomType } from '@/shared/types'

// =============================================================================
// Types
// =============================================================================

export type HighlightType = 'achievement' | 'pattern' | 'warning' | 'tip'
export type DiscoveryType = 'trigger' | 'time_pattern' | 'combination' | 'safe_food'
export type ConfidenceLevel = 'high' | 'medium' | 'low'

export interface DailyHighlight {
  id: string
  type: HighlightType
  emoji: string
  title: string
  message: string
  action?: {
    label: string
    href: string
  }
  priority: number
  createdAt: string
}

export interface WeekComparison {
  symptoms: number // Percentage change
  intensity: number
}

export interface WeeklySummary {
  daysLogged: number
  totalSymptoms: number
  avgIntensity: number
  totalMeals: number
  uniqueFoods: number
  comparisonLastWeek: WeekComparison
  streak: number
  periodStart: string
  periodEnd: string
}

export interface DiscoveryData {
  foods?: string[]
  symptoms?: string[]
  timeRange?: string
  occurrences: number
}

export interface Discovery {
  id: string
  type: DiscoveryType
  confidence: ConfidenceLevel
  title: string
  description: string
  data: DiscoveryData
  discoveredAt: string
  isNew: boolean
}

// =============================================================================
// Tips Database
// =============================================================================

const DAILY_TIPS = [
  {
    emoji: '💡',
    title: 'dica do dia',
    message: 'mastigar devagar ajuda na digestão! tente contar até 20 antes de engolir.',
  },
  {
    emoji: '💡',
    title: 'dica do dia',
    message: 'beber água entre as refeições é melhor do que durante. ajuda na digestão!',
  },
  {
    emoji: '💡',
    title: 'dica do dia',
    message: 'exercícios leves após as refeições podem ajudar a aliviar desconfortos.',
  },
  {
    emoji: '💡',
    title: 'dica do dia',
    message: 'o estresse pode piorar os sintomas. que tal uma pausa para respirar fundo?',
  },
  {
    emoji: '💡',
    title: 'dica do dia',
    message: 'manter um horário regular para as refeições ajuda seu intestino a funcionar melhor.',
  },
  {
    emoji: '💡',
    title: 'dica do dia',
    message: 'porções menores e mais frequentes podem ser mais fáceis de digerir.',
  },
  {
    emoji: '💡',
    title: 'dica do dia',
    message: 'uma boa noite de sono também é importante para a saúde intestinal!',
  },
  {
    emoji: '💡',
    title: 'dica do dia',
    message: 'anote como você está se sentindo - padrões podem aparecer com o tempo.',
  },
  {
    emoji: '💡',
    title: 'dica do dia',
    message: 'chás de hortelã e gengibre podem ajudar a aliviar desconfortos digestivos.',
  },
  {
    emoji: '💡',
    title: 'dica do dia',
    message: 'evite deitar logo após comer. espere pelo menos 2 horas!',
  },
]

// =============================================================================
// Helper Functions
// =============================================================================

function generateId(): string {
  return new mongoose.Types.ObjectId().toString()
}

function getDateStr(date: Date): string {
  return date.toISOString().split('T')[0]
}

function getDateRange(days: number): { start: Date; end: Date } {
  const end = new Date()
  end.setUTCHours(23, 59, 59, 999)

  const start = new Date()
  start.setDate(start.getDate() - days)
  start.setUTCHours(0, 0, 0, 0)

  return { start, end }
}

function calculatePercentageChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0
  return Math.round(((current - previous) / previous) * 100)
}

// =============================================================================
// Service Functions
// =============================================================================

/**
 * Get daily highlights for a user
 */
export async function getHighlights(userId: string): Promise<DailyHighlight[]> {
  const highlights: DailyHighlight[] = []
  const today = getDateStr(new Date())
  const userObjectId = new mongoose.Types.ObjectId(userId)

  // Get user data
  const user = await User.findById(userObjectId).lean()
  if (!user) return highlights

  // Get recent data
  const { start: weekStart } = getDateRange(7)
  const recentEntries = await DiaryEntry.find({
    userId: userObjectId,
    date: { $gte: weekStart },
  }).lean()

  const problematicFoods = await ProblematicFood.find({ userId: userObjectId }).lean()

  // 1. Achievement highlight (based on streak or days using app)
  if (user.stats) {
    const daysUsing = user.stats.daysUsingApp || 0
    const streak = user.stats.currentStreak || 0

    // Milestones
    const milestones = [3, 7, 14, 30, 60, 90, 180, 365]
    const milestone = milestones.find((m) => daysUsing === m)

    if (milestone) {
      highlights.push({
        id: generateId(),
        type: 'achievement',
        emoji: '🎉',
        title: `${milestone} dias usando o app!`,
        message: 'legal! o ceboelha tá sempre aqui pra te ajudar 💕',
        priority: 1,
        createdAt: today,
      })
    } else if (streak >= 3 && streak % 7 === 0) {
      highlights.push({
        id: generateId(),
        type: 'achievement',
        emoji: '🔥',
        title: `${streak} dias de sequência!`,
        message: 'você tá arrasando! continue assim!',
        priority: 1,
        createdAt: today,
      })
    }
  }

  // 2. Pattern highlight (if we found discoveries)
  const discoveries = await getDiscoveries(userId)
  const newDiscoveries = discoveries.filter((d) => d.isNew)
  if (newDiscoveries.length > 0) {
    highlights.push({
      id: generateId(),
      type: 'pattern',
      emoji: '🔍',
      title: 'olha o que achei...',
      message: 'suas anotações têm uns padrões interessantes! dá uma olhada:',
      action: {
        label: 'ver descobertas',
        href: '/dashboard/insights#discoveries',
      },
      priority: 2,
      createdAt: today,
    })
  }

  // 3. Warning highlight (problematic foods with recent incidents)
  const recentProblematic = problematicFoods.filter((pf) => {
    if (!pf.lastIncident) return false
    const lastDate = new Date(pf.lastIncident)
    const threeDaysAgo = new Date()
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)
    return lastDate >= threeDaysAgo
  })

  if (recentProblematic.length > 0) {
    const food = recentProblematic[0]
    highlights.push({
      id: generateId(),
      type: 'warning',
      emoji: '👀',
      title: `lembrete sobre ${food.foodName.toLowerCase()}`,
      message: 'você marcou esse alimento algumas vezes. só pra lembrar!',
      action: {
        label: 'ver alimento',
        href: `/dashboard/foods/${food.foodId}`,
      },
      priority: 3,
      createdAt: today,
    })
  }

  // 4. Tip highlight (always show a random tip)
  const tipIndex = Math.floor(Math.random() * DAILY_TIPS.length)
  const tip = DAILY_TIPS[tipIndex]
  highlights.push({
    id: generateId(),
    type: 'tip',
    ...tip,
    priority: 4,
    createdAt: today,
  })

  return highlights.sort((a, b) => a.priority - b.priority)
}

/**
 * Get weekly summary with statistics
 */
export async function getWeeklySummary(userId: string): Promise<WeeklySummary> {
  const userObjectId = new mongoose.Types.ObjectId(userId)
  const today = new Date()

  // Current week (last 7 days)
  const { start: currentWeekStart, end: currentWeekEnd } = getDateRange(7)

  // Previous week (7-14 days ago)
  const prevWeekEnd = new Date(currentWeekStart)
  prevWeekEnd.setDate(prevWeekEnd.getDate() - 1)
  prevWeekEnd.setUTCHours(23, 59, 59, 999)

  const prevWeekStart = new Date(prevWeekEnd)
  prevWeekStart.setDate(prevWeekStart.getDate() - 6)
  prevWeekStart.setUTCHours(0, 0, 0, 0)

  // Get current week entries
  const currentEntries = await DiaryEntry.find({
    userId: userObjectId,
    date: { $gte: currentWeekStart, $lte: currentWeekEnd },
  }).lean()

  // Get previous week entries
  const prevEntries = await DiaryEntry.find({
    userId: userObjectId,
    date: { $gte: prevWeekStart, $lte: prevWeekEnd },
  }).lean()

  // Get user for streak
  const user = await User.findById(userObjectId).lean()

  // Calculate current week stats
  const currentMeals = currentEntries.filter((e) => e.type === 'meal')
  const currentSymptoms = currentEntries.filter((e) => e.type === 'symptom')

  // Days logged (unique dates with entries)
  const daysWithEntries = new Set(
    currentEntries.map((e) => getDateStr(e.date))
  )

  // Unique foods
  const uniqueFoods = new Set<number>()
  for (const entry of currentMeals) {
    if (entry.meal?.foods) {
      for (const food of entry.meal.foods) {
        uniqueFoods.add(food.foodId)
      }
    }
  }

  // Average intensity
  const intensities: number[] = currentSymptoms.map((e) => e.symptom?.intensity || 0)
  const avgIntensity =
    intensities.length > 0
      ? Math.round((intensities.reduce((a, b) => a + b, 0) / intensities.length) * 10) / 10
      : 0

  // Calculate previous week stats for comparison
  const prevSymptoms = prevEntries.filter((e) => e.type === 'symptom')
  const prevIntensities: number[] = prevSymptoms.map((e) => e.symptom?.intensity || 0)
  const prevAvgIntensity =
    prevIntensities.length > 0
      ? prevIntensities.reduce((a, b) => a + b, 0) / prevIntensities.length
      : 0

  const symptomsChange = calculatePercentageChange(currentSymptoms.length, prevSymptoms.length)
  const intensityChange = calculatePercentageChange(avgIntensity, prevAvgIntensity)

  return {
    daysLogged: daysWithEntries.size,
    totalSymptoms: currentSymptoms.length,
    avgIntensity,
    totalMeals: currentMeals.length,
    uniqueFoods: uniqueFoods.size,
    comparisonLastWeek: {
      symptoms: symptomsChange,
      intensity: intensityChange,
    },
    streak: user?.stats?.currentStreak || 0,
    periodStart: getDateStr(currentWeekStart),
    periodEnd: getDateStr(currentWeekEnd),
  }
}

/**
 * Get discoveries (patterns identified from data)
 */
export async function getDiscoveries(userId: string): Promise<Discovery[]> {
  const discoveries: Discovery[] = []
  const userObjectId = new mongoose.Types.ObjectId(userId)
  const today = new Date()

  // Get last 30 days of data
  const { start: thirtyDaysAgo } = getDateRange(30)

  const entries = await DiaryEntry.find({
    userId: userObjectId,
    date: { $gte: thirtyDaysAgo },
  }).lean()

  const meals = entries.filter((e) => e.type === 'meal')
  const symptoms = entries.filter((e) => e.type === 'symptom')

  // Get problematic foods
  const problematicFoods = await ProblematicFood.find({ userId: userObjectId }).lean()

  // 1. TRIGGERS - Foods marked as problematic multiple times
  for (const pf of problematicFoods) {
    if (pf.totalIncidents >= 2) {
      const uniqueSymptoms = new Set<string>()
      for (const incident of pf.incidents) {
        for (const symptom of incident.symptomTypes) {
          uniqueSymptoms.add(symptom)
        }
      }

      // Determine confidence based on incidents
      let confidence: ConfidenceLevel = 'low'
      if (pf.totalIncidents >= 5) confidence = 'high'
      else if (pf.totalIncidents >= 3) confidence = 'medium'

      // Check if recent (last 7 days)
      const lastIncidentDate = pf.lastIncident ? new Date(pf.lastIncident) : null
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      const isNew = lastIncidentDate ? lastIncidentDate >= sevenDaysAgo : false

      discoveries.push({
        id: generateId(),
        type: 'trigger',
        confidence,
        title: `você marcou ${pf.foodName.toLowerCase()}`,
        description: `parece que ${pf.foodName.toLowerCase()} não combina muito... você anotou algumas vezes.`,
        data: {
          foods: [pf.foodName],
          symptoms: Array.from(uniqueSymptoms),
          occurrences: pf.totalIncidents,
        },
        discoveredAt: pf.lastIncident || getDateStr(today),
        isNew,
      })
    }
  }

  // 2. TIME PATTERNS - Analyze when symptoms occur most
  if (symptoms.length >= 5) {
    const hourCounts: Record<string, number> = {
      morning: 0,   // 6-12
      afternoon: 0, // 12-18
      evening: 0,   // 18-24
      night: 0,     // 0-6
    }

    for (const entry of symptoms) {
      const hour = entry.date.getHours()
      if (hour >= 6 && hour < 12) hourCounts.morning++
      else if (hour >= 12 && hour < 18) hourCounts.afternoon++
      else if (hour >= 18 && hour < 24) hourCounts.evening++
      else hourCounts.night++
    }

    // Find dominant period
    const sortedPeriods = Object.entries(hourCounts).sort((a, b) => b[1] - a[1])
    const [dominantPeriod, count] = sortedPeriods[0]
    const percentage = (count / symptoms.length) * 100

    // Only show if > 40% of symptoms in one period
    if (percentage > 40 && count >= 3) {
      const periodLabels: Record<string, string> = {
        morning: '6h e 12h (manhã)',
        afternoon: '12h e 18h (tarde)',
        evening: '18h e 22h (noite)',
        night: '22h e 6h (madrugada)',
      }

      const timeRangeMap: Record<string, string> = {
        morning: '06:00 - 12:00',
        afternoon: '12:00 - 18:00',
        evening: '18:00 - 22:00',
        night: '22:00 - 06:00',
      }

      discoveries.push({
        id: generateId(),
        type: 'time_pattern',
        confidence: percentage > 60 ? 'high' : 'medium',
        title: 'mais anotações à ' + dominantPeriod.replace('evening', 'noite').replace('morning', 'manhã').replace('afternoon', 'tarde').replace('night', 'madrugada'),
        description: `a maioria das suas anotações são entre ${periodLabels[dominantPeriod]}.`,
        data: {
          timeRange: timeRangeMap[dominantPeriod],
          occurrences: count,
        },
        discoveredAt: getDateStr(today),
        isNew: false,
      })
    }
  }

  // 3. SAFE FOODS - Foods eaten multiple times without marking as bad
  const foodConsumption: Record<number, { name: string; count: number; markedBad: boolean }> = {}

  for (const meal of meals) {
    if (meal.meal?.foods) {
      for (const food of meal.meal.foods) {
        if (!foodConsumption[food.foodId]) {
          foodConsumption[food.foodId] = { name: food.foodName, count: 0, markedBad: false }
        }
        foodConsumption[food.foodId].count++
        if (food.markedAsBad) {
          foodConsumption[food.foodId].markedBad = true
        }
      }
    }
  }

  // Foods eaten 5+ times without being marked as bad
  const safeFoods = Object.entries(foodConsumption)
    .filter(([_, data]) => data.count >= 5 && !data.markedBad)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 3) // Top 3 safe foods

  for (const [foodId, data] of safeFoods) {
    discoveries.push({
      id: generateId(),
      type: 'safe_food',
      confidence: data.count >= 10 ? 'high' : 'medium',
      title: `${data.name.toLowerCase()} tá de boa!`,
      description: `você comeu ${data.name.toLowerCase()} várias vezes e nunca marcou nada negativo.`,
      data: {
        foods: [data.name],
        occurrences: data.count,
      },
      discoveredAt: getDateStr(today),
      isNew: false,
    })
  }

  // Sort by confidence (high first) and type
  const confidenceOrder: Record<ConfidenceLevel, number> = { high: 1, medium: 2, low: 3 }
  const typeOrder: Record<DiscoveryType, number> = {
    trigger: 1,
    combination: 2,
    time_pattern: 3,
    safe_food: 4,
  }

  return discoveries.sort((a, b) => {
    const confDiff = confidenceOrder[a.confidence] - confidenceOrder[b.confidence]
    if (confDiff !== 0) return confDiff
    return typeOrder[a.type] - typeOrder[b.type]
  })
}
