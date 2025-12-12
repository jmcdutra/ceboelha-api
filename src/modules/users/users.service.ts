/**
 * Users Service - Business Logic
 *
 * Handles user profile operations:
 * - Get/Update profile
 * - Change email (requires password)
 * - Change password (requires current password)
 * - Upload avatar
 * - Delete account
 */

import { User, type IUser } from './user.model'
import { ActivityLog } from '@/modules/admin/activity-log.model'
import { RefreshToken } from '@/modules/auth/refresh-token.model'
import { NotFoundError, ConflictError, UnauthorizedError, ValidationError } from '@/shared/errors'
import { validatePasswordStrength } from '@/modules/auth/auth.schemas'
import type { UserPreferences, DietSettings, DailyLimits } from '@/shared/types'

// =============================================================================
// Types
// =============================================================================

export interface UpdateProfileInput {
  name?: string
  avatar?: string
  preferences?: Partial<UserPreferences>
}

export interface ChangeEmailInput {
  newEmail: string
  password: string
}

export interface ChangePasswordInput {
  currentPassword: string
  newPassword: string
}

export interface UpdateDietSettingsInput {
  enabled?: boolean
  preset?: DietSettings['preset']
  limits?: Partial<DailyLimits>
  showRemaining?: boolean
  showProgressBars?: boolean
  warningThreshold?: number
  diaryMode?: DietSettings['diaryMode']
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

    // Track what changed for activity log
    const changes: Record<string, { from: unknown; to: unknown }> = {}

    // Update fields and track changes
    if (input.name && input.name !== user.name) {
      changes.name = { from: user.name, to: input.name }
      user.name = input.name
    }
    if (input.avatar !== undefined && input.avatar !== user.avatar) {
      changes.avatar = { from: user.avatar || null, to: input.avatar || null }
      user.avatar = input.avatar
    }
    if (input.preferences) {
      const oldPrefs = { ...user.preferences.toObject?.() || user.preferences }
      const newPrefs = { ...oldPrefs, ...input.preferences }
      
      // Check each preference for changes (use underscore for nested keys)
      for (const [key, value] of Object.entries(input.preferences)) {
        if (oldPrefs[key as keyof typeof oldPrefs] !== value) {
          changes[`preferences_${key}`] = { 
            from: oldPrefs[key as keyof typeof oldPrefs], 
            to: value 
          }
        }
      }
      
      user.preferences = newPrefs as typeof user.preferences
    }

    // Only save if something changed
    if (Object.keys(changes).length === 0) {
      return user
    }

    await user.save()

    // Build readable action description
    const changedFields = Object.keys(changes).map(k => {
      if (k === 'name') return 'nome'
      if (k === 'avatar') return 'avatar'
      if (k.startsWith('preferences_')) return k.replace('preferences_', '')
      return k
    })

    // Log activity with details (metadata as JSON string to avoid Mongoose Map issues)
    await ActivityLog.create({
      type: 'profile_updated',
      userId: user._id,
      userName: user.name,
      userEmail: user.email,
      action: `Perfil atualizado: ${changedFields.join(', ')}`,
      details: JSON.stringify(changes),
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
  async deleteAccount(userId: string, password?: string): Promise<void> {
    const user = await User.findById(userId).select('+password')
    if (!user) {
      throw new NotFoundError('Usuário')
    }

    // If password provided, verify it
    if (password) {
      const isValid = await user.comparePassword(password)
      if (!isValid) {
        throw new UnauthorizedError('Senha incorreta')
      }
    }

    // Revoke all refresh tokens
    await RefreshToken.deleteMany({ userId: user._id })

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

  /**
   * Change user email (requires password verification)
   */
  async changeEmail(userId: string, input: ChangeEmailInput): Promise<IUser> {
    const { newEmail, password } = input

    // Find user with password field
    const user = await User.findById(userId).select('+password')
    if (!user) {
      throw new NotFoundError('Usuário')
    }

    // Verify current password
    const isValid = await user.comparePassword(password)
    if (!isValid) {
      throw new UnauthorizedError('Senha incorreta')
    }

    // Check if new email is already in use
    const normalizedEmail = newEmail.toLowerCase().trim()
    const existingUser = await User.findOne({ email: normalizedEmail })
    if (existingUser && existingUser._id.toString() !== userId) {
      throw new ConflictError('Este e-mail já está em uso')
    }

    // Update email
    user.email = normalizedEmail
    await user.save()

    // Log activity with old and new email
    const oldEmail = user.email !== normalizedEmail ? user.email : undefined
    await ActivityLog.create({
      type: 'profile_updated',
      userId: user._id,
      userName: user.name,
      userEmail: normalizedEmail,
      action: 'E-mail alterado',
      details: JSON.stringify({ 
        email: { from: oldEmail, to: normalizedEmail } 
      }),
      timestamp: new Date(),
    })

    return user
  },

  /**
   * Change user password (requires current password verification)
   */
  async changePassword(userId: string, input: ChangePasswordInput): Promise<void> {
    const { currentPassword, newPassword } = input

    // Validate new password strength
    const passwordError = validatePasswordStrength(newPassword)
    if (passwordError) {
      throw new ValidationError(passwordError)
    }

    // Find user with password field
    const user = await User.findById(userId).select('+password')
    if (!user) {
      throw new NotFoundError('Usuário')
    }

    // Verify current password
    const isValid = await user.comparePassword(currentPassword)
    if (!isValid) {
      throw new UnauthorizedError('Senha atual incorreta')
    }

    // Update password (will be hashed by pre-save hook)
    user.password = newPassword
    await user.save()

    // Revoke all refresh tokens (security: force re-login on all devices)
    await RefreshToken.deleteMany({ userId: user._id })

    // Log activity
    await ActivityLog.create({
      type: 'password_change',
      userId: user._id,
      userName: user.name,
      userEmail: user.email,
      action: 'Senha alterada',
      timestamp: new Date(),
    })
  },

  /**
   * Update user avatar
   */
  async updateAvatar(userId: string, avatarUrl: string): Promise<IUser> {
    const user = await User.findById(userId)
    if (!user) {
      throw new NotFoundError('Usuário')
    }

    user.avatar = avatarUrl
    await user.save()

    // Log activity with avatar URL
    await ActivityLog.create({
      type: 'profile_updated',
      userId: user._id,
      userName: user.name,
      userEmail: user.email,
      action: 'Avatar atualizado',
      details: JSON.stringify({ avatar: avatarUrl }),
      timestamp: new Date(),
    })

    return user
  },

  /**
   * Get user diet settings
   */
  async getDietSettings(userId: string): Promise<DietSettings> {
    const user = await User.findById(userId)
    if (!user) {
      throw new NotFoundError('Usuário')
    }

    return user.dietSettings
  },

  /**
   * Update user diet settings
   */
  async updateDietSettings(
    userId: string,
    input: UpdateDietSettingsInput
  ): Promise<DietSettings> {
    const user = await User.findById(userId)
    if (!user) {
      throw new NotFoundError('Usuário')
    }

    // Build update object
    const currentSettings = user.dietSettings || {}
    const updatedSettings = { ...currentSettings }

    if (input.enabled !== undefined) {
      updatedSettings.enabled = input.enabled
    }
    if (input.preset !== undefined) {
      updatedSettings.preset = input.preset
    }
    if (input.limits) {
      updatedSettings.limits = {
        ...((currentSettings.limits as DailyLimits) || {}),
        ...input.limits,
      } as DailyLimits
    }
    if (input.showRemaining !== undefined) {
      updatedSettings.showRemaining = input.showRemaining
    }
    if (input.showProgressBars !== undefined) {
      updatedSettings.showProgressBars = input.showProgressBars
    }
    if (input.warningThreshold !== undefined) {
      updatedSettings.warningThreshold = input.warningThreshold
    }
    if (input.diaryMode !== undefined) {
      updatedSettings.diaryMode = input.diaryMode
    }

    // Update user
    user.dietSettings = updatedSettings as DietSettings
    await user.save()

    // Log activity
    await ActivityLog.create({
      type: 'profile_updated',
      userId: user._id,
      userName: user.name,
      userEmail: user.email,
      action: 'Configurações de dieta atualizadas',
      details: JSON.stringify(input),
      timestamp: new Date(),
    })

    return user.dietSettings
  },
}
