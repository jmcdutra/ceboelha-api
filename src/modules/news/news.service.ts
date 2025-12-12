/**
 * News Service - Business logic for news articles
 */

import { NewsArticle, type INewsArticle, type ArticleCategory, type ArticleStatus } from './news.model'

// =============================================================================
// Types
// =============================================================================

export interface GetArticlesParams {
  page?: number
  limit?: number
  category?: ArticleCategory
  tag?: string
  featured?: boolean
  search?: string
}

export interface PaginatedArticles {
  articles: INewsArticle[]
  pagination: {
    page: number
    totalPages: number
    total: number
  }
}

// =============================================================================
// Service Functions
// =============================================================================

/**
 * Get paginated list of published articles
 */
export async function getArticles(params: GetArticlesParams = {}): Promise<PaginatedArticles> {
  const {
    page = 1,
    limit = 10,
    category,
    tag,
    featured,
    search,
  } = params

  const skip = (page - 1) * limit

  // Build query - only published articles
  const query: Record<string, unknown> = {
    status: 'published',
  }

  if (category) {
    query.category = category
  }

  if (tag) {
    query.tags = tag
  }

  if (featured !== undefined) {
    query.isFeatured = featured
  }

  // Full-text search if provided
  if (search) {
    query.$text = { $search: search }
  }

  // Execute query
  const [articles, total] = await Promise.all([
    NewsArticle.find(query)
      .sort(search ? { score: { $meta: 'textScore' } } : { publishedAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-content') // Don't include full content in list
      .lean(),
    NewsArticle.countDocuments(query),
  ])

  const totalPages = Math.ceil(total / limit)

  return {
    articles: articles as INewsArticle[],
    pagination: {
      page,
      totalPages,
      total,
    },
  }
}

/**
 * Get single article by numeric ID
 */
export async function getArticleById(id: number): Promise<INewsArticle | null> {
  const article = await NewsArticle.findOne({
    id,
    status: 'published',
  }).lean()

  return article as INewsArticle | null
}

/**
 * Increment view count for an article
 */
export async function incrementViews(id: number): Promise<void> {
  await NewsArticle.updateOne(
    { id, status: 'published' },
    { $inc: { views: 1 } }
  )
}

/**
 * Toggle like for an article (simplified - in real app would track per user)
 */
export async function toggleLike(id: number, increment: boolean): Promise<number> {
  const result = await NewsArticle.findOneAndUpdate(
    { id, status: 'published' },
    { $inc: { likes: increment ? 1 : -1 } },
    { new: true }
  )

  return result?.likes ?? 0
}

/**
 * Get featured articles for homepage
 */
export async function getFeaturedArticles(limit = 3): Promise<INewsArticle[]> {
  const articles = await NewsArticle.find({
    status: 'published',
    isFeatured: true,
  })
    .sort({ publishedAt: -1 })
    .limit(limit)
    .select('-content')
    .lean()

  return articles as INewsArticle[]
}

/**
 * Get articles by category
 */
export async function getArticlesByCategory(
  category: ArticleCategory,
  limit = 10
): Promise<INewsArticle[]> {
  const articles = await NewsArticle.find({
    status: 'published',
    category,
  })
    .sort({ publishedAt: -1 })
    .limit(limit)
    .select('-content')
    .lean()

  return articles as INewsArticle[]
}

/**
 * Get all unique tags from published articles
 */
export async function getAllTags(): Promise<string[]> {
  const result = await NewsArticle.aggregate([
    { $match: { status: 'published' } },
    { $unwind: '$tags' },
    { $group: { _id: '$tags' } },
    { $sort: { _id: 1 } },
  ])

  return result.map((r) => r._id)
}

/**
 * Get recipes only (filtered by category)
 */
export async function getRecipes(params: Omit<GetArticlesParams, 'category'> = {}): Promise<PaginatedArticles> {
  return getArticles({ ...params, category: 'recipe' })
}

// =============================================================================
// Admin Functions (for Etapa 10)
// =============================================================================

/**
 * Create new article (Admin)
 */
export async function createArticle(data: Partial<INewsArticle>): Promise<INewsArticle> {
  const article = new NewsArticle(data)
  await article.save()
  return article.toObject()
}

/**
 * Update article (Admin)
 */
export async function updateArticle(
  id: number,
  data: Partial<INewsArticle>
): Promise<INewsArticle | null> {
  const article = await NewsArticle.findOneAndUpdate(
    { id },
    { $set: data },
    { new: true }
  )

  return article?.toObject() ?? null
}

/**
 * Delete article (Admin)
 */
export async function deleteArticle(id: number): Promise<boolean> {
  const result = await NewsArticle.deleteOne({ id })
  return result.deletedCount > 0
}

/**
 * Get all articles including drafts (Admin)
 */
export async function getAllArticles(params: GetArticlesParams & { status?: ArticleStatus } = {}): Promise<PaginatedArticles> {
  const {
    page = 1,
    limit = 10,
    category,
    tag,
    status,
    search,
  } = params

  const skip = (page - 1) * limit

  const query: Record<string, unknown> = {}

  if (status) {
    query.status = status
  }

  if (category) {
    query.category = category
  }

  if (tag) {
    query.tags = tag
  }

  if (search) {
    query.$text = { $search: search }
  }

  const [articles, total] = await Promise.all([
    NewsArticle.find(query)
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    NewsArticle.countDocuments(query),
  ])

  const totalPages = Math.ceil(total / limit)

  return {
    articles: articles as INewsArticle[],
    pagination: {
      page,
      totalPages,
      total,
    },
  }
}
