/**
 * Problematic Foods Controller - Elysia Routes
 *
 * Endpoints:
 * - GET /problematic-foods - Lista de alimentos problemáticos
 * - GET /problematic-foods/food/:foodId - Buscar por foodId
 * - POST /problematic-foods - Marcar alimento como problemático
 * - DELETE /problematic-foods/:id - Remover da lista
 * - DELETE /problematic-foods/:id/incidents/:incidentId - Remover incidente
 * 
 * NOTE: Prefixo mudou de /diary/problematic-foods para /problematic-foods
 * O frontend deve usar /api/problematic-foods
 */

import { Elysia } from 'elysia'
import { problematicFoodsService } from './problematic-foods.service'
import {
  markAsBadBodySchema,
  idParamSchema,
  foodIdParamSchema,
  incidentParamsSchema,
} from './problematic-foods.schemas'
import { requireAuth } from '@/shared/middlewares'

export const problematicFoodsController = new Elysia({ prefix: '/problematic-foods' })
  // All routes require authentication
  .use(requireAuth)

  // ==========================================================================
  // GET /problematic-foods - Lista de alimentos problemáticos
  // ==========================================================================
  .get(
    '/',
    async ({ auth }) => {
      const foods = await problematicFoodsService.getAll(auth.userId)

      return {
        success: true,
        data: foods,
      }
    },
    {
      detail: {
        tags: ['Diary - Problematic Foods'],
        summary: 'Listar alimentos problemáticos',
        description: 'Retorna todos os alimentos marcados como problemáticos pelo usuário',
        security: [{ bearerAuth: [] }],
      },
    }
  )

  // ==========================================================================
  // GET /diary/problematic-foods/food/:foodId - Buscar por foodId
  // ==========================================================================
  .get(
    '/food/:foodId',
    async ({ params, auth }) => {
      const foodId = parseInt(params.foodId)
      const food = await problematicFoodsService.getByFoodId(auth.userId, foodId)

      if (!food) {
        return {
          success: false,
          error: 'Alimento não encontrado na lista de problemáticos',
        }
      }

      return {
        success: true,
        data: food,
      }
    },
    {
      params: foodIdParamSchema,
      detail: {
        tags: ['Diary - Problematic Foods'],
        summary: 'Buscar alimento problemático por foodId',
        description: 'Retorna um alimento problemático específico pelo ID do alimento',
        security: [{ bearerAuth: [] }],
      },
    }
  )

  // ==========================================================================
  // POST /diary/problematic-foods - Marcar alimento como problemático
  // ==========================================================================
  .post(
    '/',
    async ({ body, auth, set }) => {
      const problematicFood = await problematicFoodsService.markAsBad(auth.userId, body)

      // Check if it's a new record (totalIncidents === 1 and only one incident)
      const isNew = problematicFood.totalIncidents === 1

      if (isNew) {
        set.status = 201
      }

      return {
        success: true,
        data: problematicFood,
        message: isNew
          ? 'Alimento adicionado à lista de problemáticos'
          : 'Novo incidente registrado',
      }
    },
    {
      body: markAsBadBodySchema,
      detail: {
        tags: ['Diary - Problematic Foods'],
        summary: 'Marcar alimento como problemático',
        description: 'Adiciona um alimento à lista de problemáticos ou registra novo incidente',
        security: [{ bearerAuth: [] }],
      },
    }
  )

  // ==========================================================================
  // DELETE /diary/problematic-foods/:id - Remover da lista
  // ==========================================================================
  .delete(
    '/:id',
    async ({ params, auth }) => {
      await problematicFoodsService.remove(auth.userId, params.id)

      return {
        success: true,
        message: 'Alimento removido da lista de problemáticos',
      }
    },
    {
      params: idParamSchema,
      detail: {
        tags: ['Diary - Problematic Foods'],
        summary: 'Remover alimento problemático',
        description: 'Remove completamente um alimento da lista de problemáticos',
        security: [{ bearerAuth: [] }],
      },
    }
  )

  // ==========================================================================
  // DELETE /diary/problematic-foods/:id/incidents/:incidentId - Remover incidente
  // ==========================================================================
  .delete(
    '/:id/incidents/:incidentId',
    async ({ params, auth }) => {
      const result = await problematicFoodsService.removeIncident(
        auth.userId,
        params.id,
        params.incidentId
      )

      const wasDeleted = result.incidents.length === 0

      return {
        success: true,
        data: wasDeleted ? null : result,
        message: wasDeleted
          ? 'Último incidente removido, alimento removido da lista'
          : 'Incidente removido com sucesso',
      }
    },
    {
      params: incidentParamsSchema,
      detail: {
        tags: ['Diary - Problematic Foods'],
        summary: 'Remover incidente específico',
        description: 'Remove um incidente específico de um alimento problemático',
        security: [{ bearerAuth: [] }],
      },
    }
  )
