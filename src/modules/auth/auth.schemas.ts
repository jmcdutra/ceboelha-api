/**
 * Auth Schemas - Input Validation with TypeBox
 *
 * Strict validation schemas for authentication endpoints
 */

import { t, type Static } from 'elysia'

// =============================================================================
// Constants
// =============================================================================

const PASSWORD_MIN_LENGTH = 8
const PASSWORD_MAX_LENGTH = 128
const NAME_MIN_LENGTH = 2
const NAME_MAX_LENGTH = 100

// =============================================================================
// Register Schema
// =============================================================================

export const registerBodySchema = t.Object({
  email: t.String({
    format: 'email',
    maxLength: 255,
    error: 'E-mail inválido',
  }),
  password: t.String({
    minLength: PASSWORD_MIN_LENGTH,
    maxLength: PASSWORD_MAX_LENGTH,
    error: `Senha deve ter entre ${PASSWORD_MIN_LENGTH} e ${PASSWORD_MAX_LENGTH} caracteres`,
  }),
  name: t.String({
    minLength: NAME_MIN_LENGTH,
    maxLength: NAME_MAX_LENGTH,
    pattern: '^[^<>{}\\[\\]]*$', // Prevent XSS characters
    error: `Nome deve ter entre ${NAME_MIN_LENGTH} e ${NAME_MAX_LENGTH} caracteres`,
  }),
})

export type RegisterBody = Static<typeof registerBodySchema>

// =============================================================================
// Login Schema
// =============================================================================

export const loginBodySchema = t.Object({
  email: t.String({
    format: 'email',
    maxLength: 255,
    error: 'E-mail inválido',
  }),
  password: t.String({
    minLength: 1,
    maxLength: PASSWORD_MAX_LENGTH,
    error: 'Senha é obrigatória',
  }),
})

export type LoginBody = Static<typeof loginBodySchema>

// =============================================================================
// Refresh Token Schema
// =============================================================================

export const refreshTokenBodySchema = t.Object({
  refreshToken: t.String({
    minLength: 128,
    maxLength: 128,
    pattern: '^[a-f0-9]+$', // Hex string only
    error: 'Token de refresh inválido',
  }),
})

export type RefreshTokenBody = Static<typeof refreshTokenBodySchema>

// =============================================================================
// Logout Schema
// =============================================================================

export const logoutBodySchema = t.Object({
  refreshToken: t.Optional(
    t.String({
      minLength: 128,
      maxLength: 128,
      pattern: '^[a-f0-9]+$',
    })
  ),
  allDevices: t.Optional(t.Boolean()),
})

export type LogoutBody = Static<typeof logoutBodySchema>

// =============================================================================
// Change Password Schema
// =============================================================================

export const changePasswordBodySchema = t.Object({
  currentPassword: t.String({
    minLength: 1,
    maxLength: PASSWORD_MAX_LENGTH,
    error: 'Senha atual é obrigatória',
  }),
  newPassword: t.String({
    minLength: PASSWORD_MIN_LENGTH,
    maxLength: PASSWORD_MAX_LENGTH,
    error: `Nova senha deve ter entre ${PASSWORD_MIN_LENGTH} e ${PASSWORD_MAX_LENGTH} caracteres`,
  }),
})

export type ChangePasswordBody = Static<typeof changePasswordBodySchema>

// =============================================================================
// Response Types (for documentation)
// =============================================================================

export const authResponseSchema = t.Object({
  success: t.Boolean(),
  data: t.Object({
    user: t.Object({
      _id: t.String(),
      email: t.String(),
      name: t.String(),
      role: t.String(),
      status: t.String(),
      preferences: t.Object({
        theme: t.String(),
        notifications: t.Boolean(),
        soundEnabled: t.Boolean(),
        language: t.String(),
        fodmapPhase: t.String(),
      }),
      stats: t.Object({
        daysUsingApp: t.Number(),
        totalMealsLogged: t.Number(),
        totalSymptomsLogged: t.Number(),
        currentStreak: t.Number(),
        longestStreak: t.Number(),
        achievementsUnlocked: t.Number(),
        foodsTested: t.Number(),
        triggersIdentified: t.Number(),
        lastActive: t.String(),
      }),
      isSpecial: t.Optional(t.Boolean()),
      createdAt: t.String(),
      updatedAt: t.String(),
    }),
    accessToken: t.String(),
    refreshToken: t.String(),
    expiresIn: t.Number(),
  }),
  message: t.String(),
})

export const errorResponseSchema = t.Object({
  success: t.Boolean(),
  error: t.String(),
  code: t.Optional(t.String()),
  message: t.String(),
})

// =============================================================================
// Password Strength Validation Helper
// =============================================================================

/**
 * Validate password strength
 * Returns null if valid, error message if invalid
 */
export function validatePasswordStrength(password: string): string | null {
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `Senha deve ter no mínimo ${PASSWORD_MIN_LENGTH} caracteres`
  }

  if (password.length > PASSWORD_MAX_LENGTH) {
    return `Senha deve ter no máximo ${PASSWORD_MAX_LENGTH} caracteres`
  }

  // Check for at least one uppercase letter
  if (!/[A-Z]/.test(password)) {
    return 'Senha deve conter pelo menos uma letra maiúscula'
  }

  // Check for at least one lowercase letter
  if (!/[a-z]/.test(password)) {
    return 'Senha deve conter pelo menos uma letra minúscula'
  }

  // Check for at least one number
  if (!/[0-9]/.test(password)) {
    return 'Senha deve conter pelo menos um número'
  }

  // Check for at least one special character
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return 'Senha deve conter pelo menos um caractere especial (!@#$%^&*...)'
  }

  // Check for common passwords (basic check)
  const commonPasswords = [
    'password', '12345678', 'qwerty123', 'admin123', 'letmein1',
    'welcome1', 'password1', 'Password1', '123456789', 'qwertyui'
  ]
  if (commonPasswords.some(common => password.toLowerCase().includes(common))) {
    return 'Senha muito comum, escolha uma senha mais segura'
  }

  return null
}
