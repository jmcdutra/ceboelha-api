/**
 * News Controller - REST endpoints for news articles
 */

import { Elysia } from 'elysia'
import * as newsService from './news.service'
import {
  getArticlesQuerySchema,
  articleIdParamSchema,
} from './news.schemas'
import { NotFoundError } from '@/shared/errors'
import type { ArticleCategory } from './news.model'

export const newsController = new Elysia({ prefix: '/insights/news' })
  // =========================================================================
  // GET /news - List articles
  // =========================================================================
  .get(
    '/',
    async ({ query }) => {
      const result = await newsService.getArticles({
        page: query.page ? parseInt(query.page, 10) : 1,
        limit: query.limit ? parseInt(query.limit, 10) : 10,
        category: query.category as ArticleCategory | undefined,
        tag: query.tag,
        featured: query.featured === 'true' ? true : query.featured === 'false' ? false : undefined,
        search: query.search,
      })

      // Frontend expects: { success, data: articles[], pagination }
      return {
        success: true,
        data: result.articles,
        pagination: result.pagination,
      }
    },
    {
      query: getArticlesQuerySchema,
      detail: {
        tags: ['News'],
        summary: 'List news articles',
        description: 'Get paginated list of published news articles with optional filters',
      },
    }
  )

  // =========================================================================
  // GET /news/featured - Get featured articles
  // =========================================================================
  .get(
    '/featured',
    async ({ query }) => {
      const limit = query.limit ? Number(query.limit) : 3
      const articles = await newsService.getFeaturedArticles(limit)

      return {
        success: true,
        data: articles,
      }
    },
    {
      detail: {
        tags: ['News'],
        summary: 'Get featured articles',
        description: 'Get list of featured articles for homepage',
      },
    }
  )

  // =========================================================================
  // GET /news/tags - Get all tags
  // =========================================================================
  .get(
    '/tags',
    async () => {
      const tags = await newsService.getAllTags()

      return {
        success: true,
        data: tags,
      }
    },
    {
      detail: {
        tags: ['News'],
        summary: 'Get all tags',
        description: 'Get list of all unique tags from published articles',
      },
    }
  )

  // =========================================================================
  // GET /news/recipes - Get recipes only
  // =========================================================================
  .get(
    '/recipes',
    async ({ query }) => {
      const result = await newsService.getRecipes({
        page: query.page ? parseInt(query.page, 10) : 1,
        limit: query.limit ? parseInt(query.limit, 10) : 10,
        tag: query.tag,
        search: query.search,
      })

      // Frontend expects: { success, data: articles[], pagination }
      return {
        success: true,
        data: result.articles,
        pagination: result.pagination,
      }
    },
    {
      query: getArticlesQuerySchema,
      detail: {
        tags: ['News'],
        summary: 'Get recipes',
        description: 'Get paginated list of recipe articles',
      },
    }
  )

  // =========================================================================
  // GET /news/:id - Get article by ID
  // =========================================================================
  .get(
    '/:id',
    async ({ params }) => {
      const id = parseInt(params.id, 10)
      const article = await newsService.getArticleById(id)

      if (!article) {
        throw new NotFoundError('Artigo não encontrado')
      }

      // Increment view count (fire and forget)
      newsService.incrementViews(id).catch(() => {})

      return {
        success: true,
        data: article,
      }
    },
    {
      params: articleIdParamSchema,
      detail: {
        tags: ['News'],
        summary: 'Get article by ID',
        description: 'Get single article by numeric ID',
      },
    }
  )

  // =========================================================================
  // POST /news/:id/like - Like an article
  // =========================================================================
  .post(
    '/:id/like',
    async ({ params }) => {
      const id = parseInt(params.id, 10)
      const article = await newsService.getArticleById(id)

      if (!article) {
        throw new NotFoundError('Artigo não encontrado')
      }

      const likes = await newsService.toggleLike(id, true)

      return {
        success: true,
        data: { likes },
      }
    },
    {
      params: articleIdParamSchema,
      detail: {
        tags: ['News'],
        summary: 'Like an article',
        description: 'Increment like count for an article',
      },
    }
  )

  // =========================================================================
  // DELETE /news/:id/like - Unlike an article
  // =========================================================================
  .delete(
    '/:id/like',
    async ({ params }) => {
      const id = parseInt(params.id, 10)
      const article = await newsService.getArticleById(id)

      if (!article) {
        throw new NotFoundError('Artigo não encontrado')
      }

      const likes = await newsService.toggleLike(id, false)

      return {
        success: true,
        data: { likes },
      }
    },
    {
      params: articleIdParamSchema,
      detail: {
        tags: ['News'],
        summary: 'Unlike an article',
        description: 'Decrement like count for an article',
      },
    }
  )
