/**
 * Problematic Foods Service - Business Logic
 */

import mongoose from 'mongoose'
import { ProblematicFood, type IProblematicFood } from './problematic-food.model'
import { Food } from '@/modules/foods/food.model'
import { User } from '@/modules/users/user.model'
import { NotFoundError } from '@/shared/errors'
import type { SymptomType, ProblematicFoodIncident } from '@/shared/types'

// =============================================================================
// Types
// =============================================================================

export interface MarkAsBadInput {
  diaryEntryId?: string
  foodId: number
  foodName?: string
  symptomTypes: SymptomType[]
  intensity: number
  notes?: string
}

// =============================================================================
// Service
// =============================================================================

export const problematicFoodsService = {
  /**
   * Get all problematic foods for a user
   */
  async getAll(userId: string): Promise<IProblematicFood[]> {
    return ProblematicFood.find({ userId })
      .sort({ lastIncident: -1 })
      .lean()
  },

  /**
   * Get a specific problematic food by foodId
   */
  async getByFoodId(userId: string, foodId: number): Promise<IProblematicFood | null> {
    return ProblematicFood.findOne({ userId, foodId }).lean()
  },

  /**
   * Get a specific problematic food by document ID
   */
  async getById(userId: string, id: string): Promise<IProblematicFood | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return null
    }
    return ProblematicFood.findOne({ _id: id, userId }).lean()
  },

  /**
   * Mark a food as problematic or add incident to existing
   */
  async markAsBad(userId: string, input: MarkAsBadInput): Promise<IProblematicFood> {
    const today = new Date().toISOString().split('T')[0]
    
    // Create incident
    const incident: ProblematicFoodIncident = {
      diaryEntryId: input.diaryEntryId || `direct-${new mongoose.Types.ObjectId().toString()}`,
      date: today,
      symptomTypes: input.symptomTypes,
      intensity: input.intensity,
      notes: input.notes,
    }

    // Check if already exists
    const existing = await ProblematicFood.findOne({ userId, foodId: input.foodId })

    if (existing) {
      // Add new incident
      existing.incidents.push(incident)
      existing.totalIncidents = existing.incidents.length
      existing.lastIncident = today
      // Status: confirmed after 3+ incidents
      existing.status = existing.totalIncidents >= 3 ? 'confirmed' : 'suspected'
      await existing.save()

      // Update user stats
      await this.updateUserStats(userId)

      return existing.toObject()
    }

    // Get food name if not provided
    let foodName = input.foodName
    if (!foodName) {
      const food = await Food.findOne({ id: input.foodId })
      foodName = food?.name || `Alimento ${input.foodId}`
    }

    // Create new problematic food
    const problematicFood = await ProblematicFood.create({
      userId,
      foodId: input.foodId,
      foodName,
      incidents: [incident],
      totalIncidents: 1,
      lastIncident: today,
      status: 'suspected',
    })

    // Update user stats
    await this.updateUserStats(userId)

    return problematicFood.toObject()
  },

  /**
   * Remove a problematic food entirely
   */
  async remove(userId: string, id: string): Promise<void> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new NotFoundError('Alimento problemático')
    }

    const result = await ProblematicFood.findOneAndDelete({ _id: id, userId })
    
    if (!result) {
      throw new NotFoundError('Alimento problemático')
    }

    // Update user stats
    await this.updateUserStats(userId)
  },

  /**
   * Remove a specific incident from a problematic food
   */
  async removeIncident(
    userId: string,
    id: string,
    incidentId: string
  ): Promise<IProblematicFood> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new NotFoundError('Alimento problemático')
    }

    const problematicFood = await ProblematicFood.findOne({ _id: id, userId })
    
    if (!problematicFood) {
      throw new NotFoundError('Alimento problemático')
    }

    // Find and remove incident by diaryEntryId
    const incidentIndex = problematicFood.incidents.findIndex(
      inc => inc.diaryEntryId === incidentId
    )

    if (incidentIndex === -1) {
      throw new NotFoundError('Incidente')
    }

    problematicFood.incidents.splice(incidentIndex, 1)
    problematicFood.totalIncidents = problematicFood.incidents.length

    // If no more incidents, delete the entire record
    if (problematicFood.incidents.length === 0) {
      await ProblematicFood.findByIdAndDelete(id)
      await this.updateUserStats(userId)
      // Return the object before deletion for response
      return problematicFood.toObject()
    }

    // Update last incident date
    const sortedIncidents = [...problematicFood.incidents].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    )
    problematicFood.lastIncident = sortedIncidents[0].date

    // Update status
    problematicFood.status = problematicFood.totalIncidents >= 3 ? 'confirmed' : 'suspected'

    await problematicFood.save()
    await this.updateUserStats(userId)

    return problematicFood.toObject()
  },

  /**
   * Update user's trigger stats
   */
  async updateUserStats(userId: string): Promise<void> {
    const confirmedCount = await ProblematicFood.countDocuments({
      userId,
      status: 'confirmed',
    })

    await User.findByIdAndUpdate(userId, {
      $set: { 'stats.triggersIdentified': confirmedCount },
    })
  },
}
