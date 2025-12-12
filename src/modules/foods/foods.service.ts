/**
 * Foods Service - Business Logic for Food Database
 *
 * Features:
 * - Text search with MongoDB
 * - FODMAP level filtering
 * - Category filtering
 * - Efficient pagination
 * - Search count analytics
 */

import { Food, type IFood } from './food.model'
import { NotFoundError } from '@/shared/errors'
import type { FodmapLevel } from '@/shared/types'

// =============================================================================
// Types
// =============================================================================

export interface FoodsSearchParams {
  search?: string
  level?: FodmapLevel | 'all'
  category?: string
  category2?: string
  category3?: string
  hasFodmap?: boolean
  hasNutrition?: boolean
  source?: string
  sortBy?: 'name' | 'energy' | 'protein' | 'carbs' | 'fat'
  sortOrder?: 'asc' | 'desc'
  page?: number
  limit?: number
}

export interface FoodsSearchResult {
  foods: IFood[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// =============================================================================
// Service
// =============================================================================

/**
 * Escape special regex characters in a string
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Search foods with filters and pagination
 * Uses regex for partial/prefix matching (better UX for autocomplete)
 */
export async function searchFoods(params: FoodsSearchParams): Promise<FoodsSearchResult> {
  const {
    search,
    level,
    category,
    category2,
    category3,
    hasFodmap,
    hasNutrition,
    source,
    sortBy = 'name',
    sortOrder = 'asc',
    page = 1,
    limit = 50,
  } = params

  // Build query
  const query: Record<string, unknown> = {}

  // Search: use regex for partial matching (prefix search)
  // This allows "alh" to match "alho", "alface", etc.
  if (search && search.trim()) {
    const searchTerm = escapeRegex(search.trim())
    // Case-insensitive regex that matches anywhere in the name
    query.name = { $regex: searchTerm, $options: 'i' }
  }

  // FODMAP level filter
  if (level && level !== 'all') {
    query['fodmap.level'] = level
  }

  // Category filters (level 1, 2, 3)
  if (category && category.trim()) {
    query.category_level_1 = category.trim()
  }
  if (category2 && category2.trim()) {
    query.category_level_2 = category2.trim()
  }
  if (category3 && category3.trim()) {
    query.category_level_3 = category3.trim()
  }

  // Has FODMAP data filter
  if (hasFodmap !== undefined) {
    if (hasFodmap) {
      query['fodmap.level'] = { $exists: true }
    } else {
      query['fodmap.level'] = { $exists: false }
    }
  }

  // Has Nutrition data filter
  if (hasNutrition !== undefined) {
    if (hasNutrition) {
      query['nutrition.energy_kcal'] = { $exists: true, $ne: null }
    } else {
      query.$or = [
        { 'nutrition.energy_kcal': { $exists: false } },
        { 'nutrition.energy_kcal': null },
      ]
    }
  }

  // Source filter
  if (source && source.trim()) {
    query.source = source.trim()
  }

  // Calculate pagination
  const skip = (page - 1) * limit
  const safeLimit = Math.min(Math.max(1, limit), 100) // Between 1 and 100

  // Build sort object
  const sortField: Record<string, 1 | -1> = {}
  const order = sortOrder === 'desc' ? -1 : 1
  
  switch (sortBy) {
    case 'energy':
      sortField['nutrition.energy_kcal'] = order
      break
    case 'protein':
      sortField['nutrition.macronutrients.protein_g'] = order
      break
    case 'carbs':
      sortField['nutrition.macronutrients.carbohydrates_g'] = order
      break
    case 'fat':
      sortField['nutrition.macronutrients.lipids_g'] = order
      break
    default:
      sortField.name = order
  }

  // Execute query
  const foodsQuery = Food.find(query).sort(sortField)

  const [foods, total] = await Promise.all([
    foodsQuery
      .skip(skip)
      .limit(safeLimit)
      .lean()
      .exec(),
    Food.countDocuments(query).exec(),
  ])

  return {
    foods: foods as IFood[],
    pagination: {
      page,
      limit: safeLimit,
      total,
      totalPages: Math.ceil(total / safeLimit),
    },
  }
}

/**
 * Get food by numeric ID
 */
export async function getFoodById(id: number): Promise<IFood> {
  const food = await Food.findOne({ id }).lean().exec()

  if (!food) {
    throw new NotFoundError('Alimento')
  }

  // Increment search count in background (fire and forget)
  Food.updateOne({ id }, { $inc: { searchCount: 1 } }).exec().catch(() => {
    // Silently ignore errors
  })

  return food as IFood
}

/**
 * Get all unique categories (level 1)
 */
export async function getCategories(): Promise<string[]> {
  const categories = await Food.distinct('category_level_1').exec()
  return categories.sort()
}

/**
 * Get all filter options (categories, sources, etc.)
 */
export async function getFilterOptions(): Promise<{
  categories: { level1: string[]; level2: string[]; level3: string[] }
  sources: string[]
  fodmapLevels: string[]
}> {
  const [level1, level2, level3, sources] = await Promise.all([
    Food.distinct('category_level_1').exec(),
    Food.distinct('category_level_2').exec(),
    Food.distinct('category_level_3').exec(),
    Food.distinct('source').exec(),
  ])

  return {
    categories: {
      level1: level1.filter(Boolean).sort(),
      level2: level2.filter(Boolean).sort(),
      level3: level3.filter(Boolean).sort(),
    },
    sources: sources.filter(Boolean).sort(),
    fodmapLevels: ['free', 'low', 'medium', 'high'],
  }
}

/**
 * Get total count of foods in database
 */
export async function getFoodsCount(): Promise<number> {
  return Food.countDocuments().exec()
}

/**
 * Increment search count for a food (analytics)
 */
export async function incrementSearchCount(id: number): Promise<void> {
  await Food.updateOne({ id }, { $inc: { searchCount: 1 } }).exec()
}
