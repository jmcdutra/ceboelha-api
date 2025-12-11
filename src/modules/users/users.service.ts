/**
 * Users Service - Business Logic
 */

import { User, type IUser } from './user.model'
import { ActivityLog } from '@/modules/admin/activity-log.model'
import { NotFoundError, ConflictError } from '@/shared/errors'
import type { UserPreferences } from '@/shared/types'

// =============================================================================
// Types
// =============================================================================

export interface UpdateProfileInput {
  name?: string
  avatar?: string
  preferences?: Partial<UserPreferences>
}

// =============================================================================
// Service
// =============================================================================

export const usersService = {
  /**
   * Get user by ID
   */
  async getById(userId: string): Promise<IUser> {
    const user = await User.findById(userId)
    if (!user) {
      throw new NotFoundError('Usuário')
    }
    return user
  },

  /**
   * Get user by email
   */
  async getByEmail(email: string): Promise<IUser | null> {
    return User.findOne({ email: email.toLowerCase() })
  },

  /**
   * Update user profile
   */
  async updateProfile(userId: string, input: UpdateProfileInput): Promise<IUser> {
    const user = await User.findById(userId)
    if (!user) {
      throw new NotFoundError('Usuário')
    }

    // Update fields
    if (input.name) user.name = input.name
    if (input.avatar !== undefined) user.avatar = input.avatar
    if (input.preferences) {
      user.preferences = { ...user.preferences, ...input.preferences }
    }

    await user.save()

    // Log activity
    await ActivityLog.create({
      type: 'profile_updated',
      userId: user._id,
      userName: user.name,
      userEmail: user.email,
      action: 'Perfil atualizado',
      timestamp: new Date(),
    })

    return user
  },

  /**
   * Update user stats
   */
  async updateStats(
    userId: string,
    stats: Partial<IUser['stats']>
  ): Promise<IUser> {
    const user = await User.findByIdAndUpdate(
      userId,
      {
        $set: Object.fromEntries(
          Object.entries(stats).map(([key, value]) => [`stats.${key}`, value])
        ),
      },
      { new: true }
    )

    if (!user) {
      throw new NotFoundError('Usuário')
    }

    return user
  },

  /**
   * Increment stat
   */
  async incrementStat(
    userId: string,
    stat: keyof IUser['stats'],
    amount: number = 1
  ): Promise<void> {
    await User.findByIdAndUpdate(userId, {
      $inc: { [`stats.${stat}`]: amount },
    })
  },

  /**
   * Update last active
   */
  async updateLastActive(userId: string): Promise<void> {
    await User.findByIdAndUpdate(userId, {
      $set: { 'stats.lastActive': new Date() },
    })
  },

  /**
   * Delete user account
   */
  async deleteAccount(userId: string): Promise<void> {
    const user = await User.findById(userId)
    if (!user) {
      throw new NotFoundError('Usuário')
    }

    // Log before deleting
    await ActivityLog.create({
      type: 'account_deleted',
      userId: user._id,
      userName: user.name,
      userEmail: user.email,
      action: 'Conta deletada pelo usuário',
      timestamp: new Date(),
    })

    await User.findByIdAndDelete(userId)
  },
}
