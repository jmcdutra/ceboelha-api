/**
 * Diary Controller - REST Endpoints
 *
 * Endpoints:
 * - GET /diary - List entries with filters
 * - GET /diary/symptoms/overview - Symptoms overview (must be before :id)
 * - GET /diary/summary/day/:date - Day summary
 * - GET /diary/summary/month/:year/:month - Month summary for calendar
 * - GET /diary/:id - Get entry by ID
 * - POST /diary/meal - Create meal entry
 * - POST /diary/symptom - Create symptom entry
 * - PATCH /diary/:id - Update entry
 * - DELETE /diary/:id - Delete entry
 */

import { Elysia } from 'elysia'
import * as diaryService from './diary.service'
import {
  diaryQuerySchema,
  symptomsOverviewQuerySchema,
  entryIdParamSchema,
  dayDateParamSchema,
  monthParamSchema,
  createMealBodySchema,
  createSymptomBodySchema,
  updateEntryBodySchema,
} from './diary.schemas'
import { requireAuth } from '@/shared/middlewares'
import type { SymptomData, SymptomIntensity, SymptomType } from '@/shared/types'

// =============================================================================
// Controller
// =============================================================================

export const diaryController = new Elysia({ prefix: '/diary' })
  // Apply auth middleware to all routes
  .use(requireAuth)

  // ==========================================================================
  // GET /diary/symptoms/overview - Symptoms overview
  // Note: Must be before /:id to avoid conflict
  // ==========================================================================
  .get(
    '/symptoms/overview',
    async ({ query, auth }) => {
      const days = query.days ? parseInt(query.days, 10) : 30
      const overview = await diaryService.getSymptomsOverview(auth.userId, days)

      return {
        success: true,
        data: overview,
      }
    },
    {
      query: symptomsOverviewQuerySchema,
      detail: {
        tags: ['Diary'],
        summary: 'Visão geral de sintomas',
        description: `
          Retorna estatísticas e tendências de sintomas do usuário.
          
          **Dados retornados:**
          - Total de sintomas no período
          - Intensidade média
          - Sintomas mais frequentes
          - Tendências diárias
          - Correlações com alimentos
        `,
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Visão geral de sintomas' },
          401: { description: 'Não autenticado' },
        },
      },
    }
  )

  // ==========================================================================
  // GET /diary/summary/day/:date - Day summary
  // ==========================================================================
  .get(
    '/summary/day/:date',
    async ({ params, auth }) => {
      const summary = await diaryService.getDaySummary(auth.userId, params.date)

      return {
        success: true,
        data: summary,
      }
    },
    {
      params: dayDateParamSchema,
      detail: {
        tags: ['Diary'],
        summary: 'Resumo do dia',
        description: `
          Retorna um resumo das entradas do dia especificado.
          
          **Dados retornados:**
          - Número de refeições
          - Número de sintomas
          - Pior intensidade de sintoma
          - Status do dia (great, good, okay, bad, terrible)
          - Alimentos problemáticos consumidos
        `,
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Resumo do dia' },
          401: { description: 'Não autenticado' },
        },
      },
    }
  )

  // ==========================================================================
  // GET /diary/summary/month/:year/:month - Month summary
  // ==========================================================================
  .get(
    '/summary/month/:year/:month',
    async ({ params, auth }) => {
      const year = parseInt(params.year, 10)
      const month = parseInt(params.month, 10)
      const summary = await diaryService.getMonthSummary(auth.userId, year, month)

      return {
        success: true,
        data: summary,
      }
    },
    {
      params: monthParamSchema,
      detail: {
        tags: ['Diary'],
        summary: 'Resumo do mês (calendário)',
        description: `
          Retorna um resumo de todos os dias do mês para exibição no calendário.
          
          **Dados retornados por dia:**
          - Número de refeições
          - Número de sintomas
          - Status do dia
          - Alimentos problemáticos
        `,
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Resumo do mês' },
          401: { description: 'Não autenticado' },
        },
      },
    }
  )

  // ==========================================================================
  // GET /diary - List entries with filters
  // ==========================================================================
  .get(
    '/',
    async ({ query, auth }) => {
      const entries = await diaryService.getEntries(auth.userId, {
        date: query.date,
        startDate: query.startDate,
        endDate: query.endDate,
        type: query.type as 'meal' | 'symptom' | 'all' | undefined,
      })

      return {
        success: true,
        data: entries,
      }
    },
    {
      query: diaryQuerySchema,
      detail: {
        tags: ['Diary'],
        summary: 'Listar entradas do diário',
        description: `
          Lista as entradas do diário do usuário com filtros opcionais.
          
          **Filtros disponíveis:**
          - \`date\`: Data específica (YYYY-MM-DD)
          - \`startDate\` e \`endDate\`: Range de datas
          - \`type\`: Tipo de entrada (meal, symptom, all)
        `,
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Lista de entradas' },
          401: { description: 'Não autenticado' },
        },
      },
    }
  )

  // ==========================================================================
  // GET /diary/:id - Get entry by ID
  // ==========================================================================
  .get(
    '/:id',
    async ({ params, auth }) => {
      const entry = await diaryService.getEntryById(auth.userId, params.id)

      return {
        success: true,
        data: entry,
      }
    },
    {
      params: entryIdParamSchema,
      detail: {
        tags: ['Diary'],
        summary: 'Buscar entrada por ID',
        description: 'Retorna os detalhes de uma entrada específica do diário.',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Dados da entrada' },
          401: { description: 'Não autenticado' },
          403: { description: 'Sem permissão' },
          404: { description: 'Entrada não encontrada' },
        },
      },
    }
  )

  // ==========================================================================
  // POST /diary/meal - Create meal entry
  // ==========================================================================
  .post(
    '/meal',
    async ({ body, auth }) => {
      const entry = await diaryService.createMealEntry(auth.userId, body)

      return {
        success: true,
        data: entry,
      }
    },
    {
      body: createMealBodySchema,
      detail: {
        tags: ['Diary'],
        summary: 'Registrar refeição',
        description: `
          Cria uma nova entrada de refeição no diário.
          
          **Campos obrigatórios:**
          - \`date\`: Data da refeição (YYYY-MM-DD)
          - \`meal.type\`: Tipo (breakfast, lunch, dinner, snack)
          - \`meal.time\`: Horário (HH:MM)
          - \`meal.foods\`: Lista de alimentos (mínimo 1)
        `,
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Refeição registrada' },
          401: { description: 'Não autenticado' },
          400: { description: 'Dados inválidos' },
        },
      },
    }
  )

  // ==========================================================================
  // POST /diary/symptom - Create symptom entry
  // ==========================================================================
  .post(
    '/symptom',
    async ({ body, auth }) => {
      // Cast intensity to SymptomIntensity (validated by schema to be 1-5)
      const symptomData: SymptomData = {
        type: body.symptom.type as SymptomType,
        intensity: body.symptom.intensity as SymptomIntensity,
        time: body.symptom.time,
        duration: body.symptom.duration,
        notes: body.symptom.notes,
      }

      const entry = await diaryService.createSymptomEntry(auth.userId, {
        date: body.date,
        symptom: symptomData,
      })

      return {
        success: true,
        data: entry,
      }
    },
    {
      body: createSymptomBodySchema,
      detail: {
        tags: ['Diary'],
        summary: 'Registrar sintoma',
        description: `
          Cria uma nova entrada de sintoma no diário.
          
          **Campos obrigatórios:**
          - \`date\`: Data do sintoma (YYYY-MM-DD)
          - \`symptom.type\`: Tipo do sintoma
          - \`symptom.intensity\`: Intensidade (1-5)
          - \`symptom.time\`: Horário (HH:MM)
        `,
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Sintoma registrado' },
          401: { description: 'Não autenticado' },
          400: { description: 'Dados inválidos' },
        },
      },
    }
  )

  // ==========================================================================
  // PATCH /diary/:id - Update entry
  // ==========================================================================
  .patch(
    '/:id',
    async ({ params, body, auth }) => {
      // Build update data with proper typing
      const updateData: {
        meal?: typeof body.meal
        symptom?: {
          type?: SymptomType
          intensity?: SymptomIntensity
          time?: string
          duration?: number
          notes?: string
        }
      } = {}

      if (body.meal) {
        updateData.meal = body.meal
      }

      if (body.symptom) {
        updateData.symptom = {
          type: body.symptom.type as SymptomType | undefined,
          intensity: body.symptom.intensity as SymptomIntensity | undefined,
          time: body.symptom.time,
          duration: body.symptom.duration,
          notes: body.symptom.notes,
        }
      }

      const entry = await diaryService.updateEntry(auth.userId, params.id, updateData)

      return {
        success: true,
        data: entry,
      }
    },
    {
      params: entryIdParamSchema,
      body: updateEntryBodySchema,
      detail: {
        tags: ['Diary'],
        summary: 'Atualizar entrada',
        description: 'Atualiza uma entrada existente do diário.',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Entrada atualizada' },
          401: { description: 'Não autenticado' },
          403: { description: 'Sem permissão' },
          404: { description: 'Entrada não encontrada' },
        },
      },
    }
  )

  // ==========================================================================
  // DELETE /diary/:id - Delete entry
  // ==========================================================================
  .delete(
    '/:id',
    async ({ params, auth }) => {
      await diaryService.deleteEntry(auth.userId, params.id)

      return {
        success: true,
      }
    },
    {
      params: entryIdParamSchema,
      detail: {
        tags: ['Diary'],
        summary: 'Deletar entrada',
        description: 'Remove uma entrada do diário.',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Entrada deletada' },
          401: { description: 'Não autenticado' },
          403: { description: 'Sem permissão' },
          404: { description: 'Entrada não encontrada' },
        },
      },
    }
  )
