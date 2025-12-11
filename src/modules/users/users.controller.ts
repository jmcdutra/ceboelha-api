/**
 * Users Controller - Elysia Routes (Profile)
 */

import { Elysia, t } from 'elysia'
import { usersService } from './users.service'
import type { JWTPayload } from '@/shared/types'

export const usersController = new Elysia({ prefix: '/profile' })

  // ==========================================================================
  // GET /profile - Get current user profile
  // ==========================================================================
  .get(
    '/',
    async ({ store }) => {
      const { userId } = store as { userId: string }
      const user = await usersService.getById(userId)

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
    async ({ body, store }) => {
      const { userId } = store as { userId: string }
      const user = await usersService.updateProfile(userId, body)

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
  // DELETE /profile - Delete account
  // ==========================================================================
  .delete(
    '/',
    async ({ store }) => {
      const { userId } = store as { userId: string }
      await usersService.deleteAccount(userId)

      return {
        success: true,
        message: 'Conta deletada com sucesso. Sentiremos sua falta! 🐰',
      }
    },
    {
      detail: {
        tags: ['Profile'],
        summary: 'Deletar conta',
        description: 'Deleta permanentemente a conta do usuário',
        security: [{ bearerAuth: [] }],
      },
    }
  )
