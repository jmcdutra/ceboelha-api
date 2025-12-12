/**
 * Users Controller - Elysia Routes (Profile)
 *
 * Endpoints:
 * - GET /profile - Get current user profile
 * - PATCH /profile - Update profile
 * - POST /profile/email - Change email
 * - POST /profile/password - Change password
 * - POST /profile/avatar - Upload avatar
 * - POST /profile/delete - Delete account
 */

import { Elysia, t } from 'elysia'
import { usersService } from './users.service'
import { requireAuth } from '@/shared/middlewares'

export const usersController = new Elysia({ prefix: '/profile' })
  // All routes in this controller require authentication
  .use(requireAuth)

  // ==========================================================================
  // GET /profile - Get current user profile
  // ==========================================================================
  .get(
    '/',
    async ({ auth }) => {
      const user = await usersService.getById(auth.userId)

      return {
        success: true,
        data: user,
      }
    },
    {
      detail: {
        tags: ['Profile'],
        summary: 'Obter perfil',
        description: 'Retorna o perfil do usuário autenticado',
        security: [{ bearerAuth: [] }],
      },
    }
  )

  // ==========================================================================
  // PATCH /profile - Update profile
  // ==========================================================================
  .patch(
    '/',
    async ({ body, auth }) => {
      const user = await usersService.updateProfile(auth.userId, body)

      return {
        success: true,
        data: user,
        message: 'Perfil atualizado com sucesso!',
      }
    },
    {
      body: t.Object({
        name: t.Optional(t.String({ minLength: 2, maxLength: 100 })),
        avatar: t.Optional(t.String()),
        preferences: t.Optional(
          t.Object({
            theme: t.Optional(t.Union([t.Literal('light'), t.Literal('dark'), t.Literal('system')])),
            notifications: t.Optional(t.Boolean()),
            soundEnabled: t.Optional(t.Boolean()),
            language: t.Optional(t.Union([t.Literal('pt-BR'), t.Literal('en')])),
            fodmapPhase: t.Optional(
              t.Union([
                t.Literal('elimination'),
                t.Literal('reintroduction'),
                t.Literal('personalization'),
              ])
            ),
          })
        ),
      }),
      detail: {
        tags: ['Profile'],
        summary: 'Atualizar perfil',
        description: 'Atualiza o perfil do usuário autenticado',
        security: [{ bearerAuth: [] }],
      },
    }
  )

  // ==========================================================================
  // POST /profile/email - Change email
  // ==========================================================================
  .post(
    '/email',
    async ({ body, auth }) => {
      const user = await usersService.changeEmail(auth.userId, body)

      return {
        success: true,
        data: user,
        message: 'E-mail alterado com sucesso!',
      }
    },
    {
      body: t.Object({
        newEmail: t.String({ format: 'email' }),
        password: t.String({ minLength: 1 }),
      }),
      detail: {
        tags: ['Profile'],
        summary: 'Alterar e-mail',
        description: 'Altera o e-mail do usuário (requer senha para confirmação)',
        security: [{ bearerAuth: [] }],
      },
    }
  )

  // ==========================================================================
  // POST /profile/password - Change password
  // ==========================================================================
  .post(
    '/password',
    async ({ body, auth }) => {
      await usersService.changePassword(auth.userId, body)

      return {
        success: true,
        message: 'Senha alterada com sucesso! Por segurança, você foi deslogado de outros dispositivos.',
      }
    },
    {
      body: t.Object({
        currentPassword: t.String({ minLength: 1 }),
        newPassword: t.String({ minLength: 8 }),
      }),
      detail: {
        tags: ['Profile'],
        summary: 'Alterar senha',
        description: 'Altera a senha do usuário (requer senha atual para confirmação). Por segurança, revoga todas as sessões.',
        security: [{ bearerAuth: [] }],
      },
    }
  )

  // ==========================================================================
  // POST /profile/avatar - Upload avatar
  // ==========================================================================
  .post(
    '/avatar',
    async ({ body, auth }) => {
      // For now, just save the URL directly
      // TODO: Implement file upload to S3/Cloudinary
      const avatarFile = body.avatar

      // Generate a placeholder URL for now (in production, upload to storage)
      // When file upload is implemented, this will be the uploaded file URL
      let avatarUrl: string

      if (typeof avatarFile === 'string') {
        // If a URL was passed directly
        avatarUrl = avatarFile
      } else if (avatarFile instanceof File) {
        // For now, create a data URL (in production, upload to S3/Cloudinary)
        const buffer = await avatarFile.arrayBuffer()
        const base64 = Buffer.from(buffer).toString('base64')
        const mimeType = avatarFile.type || 'image/png'
        avatarUrl = `data:${mimeType};base64,${base64}`
      } else {
        avatarUrl = ''
      }

      const user = await usersService.updateAvatar(auth.userId, avatarUrl)

      return {
        success: true,
        avatarUrl: user.avatar || '',
        message: 'Avatar atualizado com sucesso!',
      }
    },
    {
      body: t.Object({
        avatar: t.Union([
          t.File({ maxSize: '5m', type: ['image/jpeg', 'image/png', 'image/webp'] }),
          t.String(),
        ]),
      }),
      detail: {
        tags: ['Profile'],
        summary: 'Upload de avatar',
        description: 'Faz upload da foto de perfil. Aceita JPG, PNG ou WebP até 5MB.',
        security: [{ bearerAuth: [] }],
      },
    }
  )

  // ==========================================================================
  // POST /profile/delete - Delete account
  // ==========================================================================
  .post(
    '/delete',
    async ({ body, auth }) => {
      await usersService.deleteAccount(auth.userId, body.password)

      return {
        success: true,
        message: 'Conta deletada com sucesso. Sentiremos sua falta! 🐰',
      }
    },
    {
      body: t.Object({
        password: t.String({ minLength: 1 }),
      }),
      detail: {
        tags: ['Profile'],
        summary: 'Deletar conta',
        description: 'Deleta permanentemente a conta do usuário (requer senha para confirmação)',
        security: [{ bearerAuth: [] }],
      },
    }
  )

  // ==========================================================================
  // DELETE /profile - Delete account (alternative)
  // ==========================================================================
  .delete(
    '/',
    async ({ auth }) => {
      await usersService.deleteAccount(auth.userId)

      return {
        success: true,
        message: 'Conta deletada com sucesso. Sentiremos sua falta! 🐰',
      }
    },
    {
      detail: {
        tags: ['Profile'],
        summary: 'Deletar conta (sem senha)',
        description: 'Deleta permanentemente a conta do usuário autenticado',
        security: [{ bearerAuth: [] }],
      },
    }
  )

  // ==========================================================================
  // GET /profile/diet-settings - Get diet settings
  // ==========================================================================
  .get(
    '/diet-settings',
    async ({ auth }) => {
      const dietSettings = await usersService.getDietSettings(auth.userId)

      return {
        success: true,
        data: dietSettings,
      }
    },
    {
      detail: {
        tags: ['Profile'],
        summary: 'Obter configurações de dieta',
        description: 'Retorna as configurações de dieta do usuário (limites, preset, modo)',
        security: [{ bearerAuth: [] }],
      },
    }
  )

  // ==========================================================================
  // PATCH /profile/diet-settings - Update diet settings
  // ==========================================================================
  .patch(
    '/diet-settings',
    async ({ body, auth }) => {
      const dietSettings = await usersService.updateDietSettings(auth.userId, body)

      return {
        success: true,
        data: dietSettings,
        message: 'Configurações de dieta atualizadas!',
      }
    },
    {
      body: t.Object({
        enabled: t.Optional(t.Boolean()),
        preset: t.Optional(
          t.Union([
            t.Literal('custom'),
            t.Literal('maintenance'),
            t.Literal('cutting'),
            t.Literal('bulking'),
            t.Literal('lowcarb'),
            t.Literal('balanced'),
          ])
        ),
        limits: t.Optional(
          t.Object({
            calories: t.Optional(t.Number({ minimum: 0 })),
            carbs: t.Optional(t.Number({ minimum: 0 })),
            protein: t.Optional(t.Number({ minimum: 0 })),
            fat: t.Optional(t.Number({ minimum: 0 })),
            sugar: t.Optional(t.Number({ minimum: 0 })),
            fiber: t.Optional(t.Number({ minimum: 0 })),
            sodium: t.Optional(t.Number({ minimum: 0 })),
          })
        ),
        showRemaining: t.Optional(t.Boolean()),
        showProgressBars: t.Optional(t.Boolean()),
        warningThreshold: t.Optional(t.Number({ minimum: 0, maximum: 100 })),
        diaryMode: t.Optional(t.Union([t.Literal('quick'), t.Literal('detailed')])),
      }),
      detail: {
        tags: ['Profile'],
        summary: 'Atualizar configurações de dieta',
        description: 'Atualiza as configurações de dieta do usuário (limites de macros, preset, modo do diário)',
        security: [{ bearerAuth: [] }],
      },
    }
  )
