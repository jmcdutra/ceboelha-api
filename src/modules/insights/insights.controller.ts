/**
 * Insights Controller - REST Endpoints
 *
 * Endpoints:
 * - GET /insights/highlights - Daily highlights
 * - GET /insights/weekly-summary - Weekly statistics
 * - GET /insights/discoveries - Identified patterns
 */

import { Elysia } from 'elysia'
import * as insightsService from './insights.service'
import {
  highlightsResponseSchema,
  weeklySummaryResponseSchema,
  discoveriesResponseSchema,
} from './insights.schemas'
import { requireAuth } from '@/shared/middlewares'

// =============================================================================
// Controller
// =============================================================================

export const insightsController = new Elysia({ prefix: '/insights' })
  // Apply auth middleware to all routes
  .use(requireAuth)

  // ==========================================================================
  // GET /insights/highlights - Daily highlights
  // ==========================================================================
  .get(
    '/highlights',
    async ({ auth }) => {
      const highlights = await insightsService.getHighlights(auth.userId)

      return {
        success: true,
        data: highlights,
      }
    },
    {
      response: highlightsResponseSchema,
      detail: {
        tags: ['Insights'],
        summary: 'Destaques do dia',
        description: `
          Retorna destaques personalizados para o usuário.
          
          **Tipos de destaques:**
          - \`achievement\` - Conquistas e marcos alcançados
          - \`pattern\` - Padrões identificados nos dados
          - \`warning\` - Alertas sobre alimentos problemáticos
          - \`tip\` - Dicas diárias de bem-estar
          
          Os destaques são ordenados por prioridade (1 = mais importante).
        `,
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Destaques do dia' },
          401: { description: 'Não autenticado' },
        },
      },
    }
  )

  // ==========================================================================
  // GET /insights/weekly-summary - Weekly statistics
  // ==========================================================================
  .get(
    '/weekly-summary',
    async ({ auth }) => {
      const summary = await insightsService.getWeeklySummary(auth.userId)

      return {
        success: true,
        data: summary,
      }
    },
    {
      response: weeklySummaryResponseSchema,
      detail: {
        tags: ['Insights'],
        summary: 'Resumo semanal',
        description: `
          Retorna estatísticas dos últimos 7 dias.
          
          **Dados retornados:**
          - Dias com registro
          - Total de sintomas e intensidade média
          - Total de refeições
          - Alimentos únicos consumidos
          - Comparação com semana anterior (%)
          - Sequência atual de dias
        `,
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Resumo semanal' },
          401: { description: 'Não autenticado' },
        },
      },
    }
  )

  // ==========================================================================
  // GET /insights/discoveries - Identified patterns
  // ==========================================================================
  .get(
    '/discoveries',
    async ({ auth }) => {
      const discoveries = await insightsService.getDiscoveries(auth.userId)

      return {
        success: true,
        data: discoveries,
      }
    },
    {
      response: discoveriesResponseSchema,
      detail: {
        tags: ['Insights'],
        summary: 'Descobertas e padrões',
        description: `
          Retorna padrões identificados nos dados do usuário.
          
          **Tipos de descobertas:**
          - \`trigger\` - Alimentos que parecem causar sintomas
          - \`time_pattern\` - Horários com mais sintomas
          - \`combination\` - Combinações problemáticas
          - \`safe_food\` - Alimentos seguros (sem reações)
          
          **Níveis de confiança:**
          - \`high\` - Alta confiança (5+ ocorrências)
          - \`medium\` - Média confiança (3-4 ocorrências)
          - \`low\` - Baixa confiança (2 ocorrências)
        `,
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Descobertas' },
          401: { description: 'Não autenticado' },
        },
      },
    }
  )
