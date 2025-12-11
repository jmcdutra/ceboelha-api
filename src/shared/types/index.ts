/**
 * Ceboelha API - Shared TypeScript Types
 */

// =============================================================================
// API Response Types
// =============================================================================

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// =============================================================================
// User Types
// =============================================================================

export type UserRole = 'user' | 'admin'
export type UserStatus = 'active' | 'inactive' | 'banned'
export type Theme = 'light' | 'dark' | 'system'
export type Language = 'pt-BR' | 'en'
export type FodmapPhase = 'elimination' | 'reintroduction' | 'personalization'

export interface UserPreferences {
  theme: Theme
  notifications: boolean
  soundEnabled: boolean
  language: Language
  fodmapPhase: FodmapPhase
}

export interface UserStats {
  daysUsingApp: number
  totalMealsLogged: number
  totalSymptomsLogged: number
  currentStreak: number
  longestStreak: number
  achievementsUnlocked: number
  foodsTested: number
  triggersIdentified: number
  lastActive?: Date
}

export interface SpecialMessage {
  title: string
  subtitle: string
  messages: string[]
  emoji: string
  loveLevel: number
  specialFeatures: string[]
}

// =============================================================================
// Food Types
// =============================================================================

export type FodmapLevel = 'free' | 'low' | 'medium' | 'high'
export type FoodSource = 'nutritional_table' | 'user_contributed' | 'ai_generated'

export interface FodmapSearchInfo {
  match_type: 'single_ingredient' | 'multiple_ingredients'
  category: string
  name_english: string
  detected_keyword: string
}

export interface FodmapInfo {
  level: FodmapLevel
  portion_note: string | null
  additional_notes: string | null
  search_information: FodmapSearchInfo
}

// =============================================================================
// Diary Types
// =============================================================================

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack'
export type SymptomType =
  | 'bloating'
  | 'gas'
  | 'cramps'
  | 'nausea'
  | 'diarrhea'
  | 'constipation'
  | 'reflux'
  | 'fatigue'
  | 'headache'
  | 'brain_fog'
  | 'other'

export type SymptomIntensity = 1 | 2 | 3 | 4 | 5
export type DiaryEntryType = 'meal' | 'symptom'

export interface CalculatedNutrition {
  calories: number
  carbs: number
  protein: number
  fat: number
  sugar: number
  fiber: number
  sodium: number
}

export interface DiaryFood {
  foodId: number
  foodName: string
  portion?: string
  quantity_g?: number
  markedAsBad?: boolean
  calculatedNutrition?: CalculatedNutrition
}

export interface MealData {
  type: MealType
  time: string
  foods: DiaryFood[]
  notes?: string
}

export interface SymptomData {
  type: SymptomType
  intensity: SymptomIntensity
  time: string
  duration?: number
  notes?: string
}

// =============================================================================
// Problematic Food Types
// =============================================================================

export type ProblematicFoodStatus = 'suspected' | 'confirmed'

export interface ProblematicFoodIncident {
  diaryEntryId: string
  date: string
  symptomTypes: SymptomType[]
  intensity: number
  notes?: string
}

// =============================================================================
// News Types
// =============================================================================

export type NewsCategory = 'recipe' | 'article' | 'tip' | 'wellness' | 'news'
export type NewsStatus = 'draft' | 'published' | 'archived'
export type RecipeDifficulty = 'easy' | 'medium' | 'hard'

// =============================================================================
// Achievement Types
// =============================================================================

export type AchievementCategory = 'diary' | 'streak' | 'exploration' | 'social' | 'special'
export type AchievementRarity = 'common' | 'rare' | 'epic' | 'legendary'
export type RequirementType = 'count' | 'streak' | 'unique' | 'custom'

// =============================================================================
// Activity Log Types
// =============================================================================

export type ActivityType =
  // Auth
  | 'user_login'
  | 'user_register'
  | 'user_logout'
  | 'password_change'
  // Diary
  | 'meal_logged'
  | 'symptom_logged'
  | 'entry_deleted'
  // Foods
  | 'food_search'
  | 'food_added'
  | 'food_edited'
  // Insights
  | 'problematic_food_identified'
  | 'problematic_food_status_change'
  // Profile
  | 'profile_updated'
  | 'account_deleted'
  // Admin
  | 'admin_action'
  | 'user_banned'
  | 'user_unbanned'
  // System
  | 'error'
  | 'warning'
  | 'info'

// =============================================================================
// JWT Payload
// =============================================================================

export interface JWTPayload {
  userId: string
  email: string
  role: UserRole
}
