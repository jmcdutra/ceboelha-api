/**
 * Achievements Controller - HTTP Endpoints
 * 
 * Routes:
 * - GET /insights/achievements - Get all achievements for user
 * - GET /insights/achievements/unnotified - Get newly unlocked (not yet notified)
 * - POST /insights/achievements/:id/notified - Mark as notified
 * - POST /insights/achievements/recalculate - Force recalculate all metrics
 */

import { Elysia, t } from 'elysia'
import { requireAuth } from '@/shared/middlewares'
import * as achievementsService from './achievements.service'

export const achievementsController = new Elysia({ prefix: '/insights/achievements' })
  .use(requireAuth)

  // ==========================================================================
  // GET /insights/achievements - List all achievements for authenticated user
  // ==========================================================================
  .get(
    '/',
    async ({ auth }) => {
      const achievements = await achievementsService.getAll(auth.userId)

      return {
        success: true,
        data: achievements,
      }
    },
    {
      detail: {
        tags: ['Achievements'],
        summary: 'Get all achievements',
        description: 'Returns all achievements grouped by status (unlocked, inProgress, locked) for the authenticated user',
      },
    }
  )

  // ==========================================================================
  // GET /insights/achievements/unnotified - Get newly unlocked achievements
  // ==========================================================================
  .get(
    '/unnotified',
    async ({ auth }) => {
      const achievements = await achievementsService.getUnnotified(auth.userId)

      return {
        success: true,
        data: achievements,
      }
    },
    {
      detail: {
        tags: ['Achievements'],
        summary: 'Get unnotified achievements',
        description: 'Returns achievements that were recently unlocked but not yet shown to the user',
      },
    }
  )

  // ==========================================================================
  // POST /insights/achievements/:id/notified - Mark achievement as notified
  // ==========================================================================
  .post(
    '/:id/notified',
    async ({ auth, params }) => {
      await achievementsService.markNotified(auth.userId, params.id)

      return {
        success: true,
        message: 'Achievement marked as notified',
      }
    },
    {
      params: t.Object({
        id: t.String({ description: 'Achievement ID' }),
      }),
      detail: {
        tags: ['Achievements'],
        summary: 'Mark achievement as notified',
        description: 'Marks an achievement notification as seen by the user',
      },
    }
  )

  // ==========================================================================
  // POST /insights/achievements/recalculate - Force recalculate all progress
  // ==========================================================================
  .post(
    '/recalculate',
    async ({ auth }) => {
      const newlyUnlocked = await achievementsService.recalculateMetrics(auth.userId)

      return {
        success: true,
        data: {
          newlyUnlocked,
        },
        message: `Recalculated achievements. ${newlyUnlocked.length} newly unlocked.`,
      }
    },
    {
      detail: {
        tags: ['Achievements'],
        summary: 'Recalculate achievements',
        description: 'Forces a recalculation of all achievement metrics for the user',
      },
    }
  )

  // ==========================================================================
  // POST /insights/achievements/:id/unlock - Manually unlock (for custom/easter eggs)
  // ==========================================================================
  .post(
    '/:id/unlock',
    async ({ auth, params, set }) => {
      const achievement = await achievementsService.unlockCustom(auth.userId, params.id)

      if (!achievement) {
        set.status = 400
        return {
          success: false,
          error: 'Achievement not found or already unlocked',
        }
      }

      return {
        success: true,
        data: achievement,
        message: 'Achievement unlocked!',
      }
    },
    {
      params: t.Object({
        id: t.String({ description: 'Achievement ID' }),
      }),
      detail: {
        tags: ['Achievements'],
        summary: 'Unlock achievement',
        description: 'Manually unlocks a custom or easter egg achievement',
      },
    }
  )
