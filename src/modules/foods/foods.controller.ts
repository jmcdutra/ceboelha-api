/**
 * Foods Controller - REST Endpoints
 *
 * Endpoints:
 * - GET /foods - Search and list foods
 * - GET /foods/categories - List available categories
 * - GET /foods/:id - Get food by ID
 */

import { Elysia } from 'elysia'
import * as foodsService from './foods.service'
import { foodsQuerySchema, foodIdParamSchema } from './foods.schemas'
import { generalRateLimiter } from '@/shared/middlewares'
import type { FodmapLevel } from '@/shared/types'

// =============================================================================
// Controller
// =============================================================================

export const foodsController = new Elysia({ prefix: '/foods' })
  // Apply rate limiting to prevent scraping
  .use(generalRateLimiter)

  // ==========================================================================
  // GET /foods/categories - List available categories
  // Note: Must be before /:id to avoid conflict
  // ==========================================================================
  .get(
    '/categories',
    async () => {
      const categories = await foodsService.getCategories()

      return {
        success: true,
        data: categories,
      }
    },
    {
      detail: {
        tags: ['Foods'],
        summary: 'Listar categorias',
        description: 'Retorna todas as categorias de alimentos disponíveis.',
        responses: {
          200: {
            description: 'Lista de categorias',
          },
        },
      },
    }
  )

  // ==========================================================================
  // GET /foods/filters - Get all filter options
  // ==========================================================================
  .get(
    '/filters',
    async () => {
      const options = await foodsService.getFilterOptions()

      return {
        success: true,
        data: options,
      }
    },
    {
      detail: {
        tags: ['Foods'],
        summary: 'Opções de filtros',
        description: 'Retorna todas as opções disponíveis para filtros (categorias, fontes, etc.).',
        responses: {
          200: {
            description: 'Opções de filtros',
          },
        },
      },
    }
  )

  // ==========================================================================
  // GET /foods - Search and list foods
  // ==========================================================================
  .get(
    '/',
    async ({ query }) => {
      const { 
        search, level, category, category2, category3,
        hasFodmap, hasNutrition, source, sortBy, sortOrder,
        page, limit 
      } = query

      const result = await foodsService.searchFoods({
        search,
        level: level as FodmapLevel | 'all' | undefined,
        category,
        category2,
        category3,
        hasFodmap: hasFodmap === 'true' ? true : hasFodmap === 'false' ? false : undefined,
        hasNutrition: hasNutrition === 'true' ? true : hasNutrition === 'false' ? false : undefined,
        source,
        sortBy: sortBy as 'name' | 'energy' | 'protein' | 'carbs' | 'fat' | undefined,
        sortOrder: sortOrder as 'asc' | 'desc' | undefined,
        page: page ? parseInt(page, 10) : 1,
        limit: limit ? parseInt(limit, 10) : 50,
      })

      return {
        success: true,
        data: result.foods,
        pagination: result.pagination,
      }
    },
    {
      query: foodsQuerySchema,
      detail: {
        tags: ['Foods'],
        summary: 'Buscar alimentos',
        description: `
          Busca alimentos na base de dados com filtros opcionais.
          
          **Parâmetros de busca:**
          - \`search\`: Busca textual por nome/categoria
          - \`level\`: Filtrar por nível FODMAP (free, low, medium, high, all)
          - \`category\`: Filtrar por categoria principal (level 1)
          - \`category2\`: Filtrar por subcategoria (level 2)
          - \`category3\`: Filtrar por subcategoria (level 3)
          - \`hasFodmap\`: Filtrar por ter ou não info FODMAP (true/false)
          - \`hasNutrition\`: Filtrar por ter ou não info nutricional (true/false)
          - \`source\`: Filtrar por fonte de dados
          - \`sortBy\`: Ordenar por (name, energy, protein, carbs, fat)
          - \`sortOrder\`: Ordem (asc, desc)
          - \`page\`: Número da página (padrão: 1)
          - \`limit\`: Itens por página (padrão: 50, máximo: 100)
        `,
        responses: {
          200: {
            description: 'Lista de alimentos com paginação',
          },
        },
      },
    }
  )

  // ==========================================================================
  // GET /foods/:id - Get food by ID
  // ==========================================================================
  .get(
    '/:id',
    async ({ params }) => {
      const id = parseInt(params.id, 10)
      const food = await foodsService.getFoodById(id)

      return {
        success: true,
        data: food,
      }
    },
    {
      params: foodIdParamSchema,
      detail: {
        tags: ['Foods'],
        summary: 'Buscar alimento por ID',
        description: 'Retorna os detalhes completos de um alimento específico.',
        responses: {
          200: {
            description: 'Dados do alimento',
          },
          404: {
            description: 'Alimento não encontrado',
          },
        },
      },
    }
  )
