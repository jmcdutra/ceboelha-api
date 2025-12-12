/**
 * News Article Model - Mongoose Schema
 * Artigos, receitas e conteúdos educacionais sobre IBS e dieta FODMAP
 */

import mongoose, { Schema, type Document, type Model } from 'mongoose'

// =============================================================================
// Types
// =============================================================================

export type ArticleCategory = 'recipe' | 'article' | 'tip' | 'wellness' | 'news'
export type ArticleStatus = 'draft' | 'published' | 'archived'
export type RecipeDifficulty = 'easy' | 'medium' | 'hard'
export type FodmapPhase = 'elimination' | 'reintroduction' | 'maintenance'

// =============================================================================
// Interfaces
// =============================================================================

export interface IAuthor {
  name: string
  avatar?: string
  bio?: string
}

export interface IRecipeNutrition {
  calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
  fiber_g: number
}

export interface IRecipe {
  prep_time: number // minutos
  cook_time: number // minutos
  servings: number
  difficulty: RecipeDifficulty
  ingredients: string[]
  instructions: string[]
  nutrition?: IRecipeNutrition
  fodmap_friendly: boolean
  fodmap_phase?: FodmapPhase
}

export interface INewsArticle extends Document {
  _id: mongoose.Types.ObjectId
  id: number // ID numérico (autoincrement) para compatibilidade
  
  // Conteúdo
  title: string
  summary: string // Resumo/preview (excerpt)
  content: string // Markdown
  imageUrl?: string // URL da imagem de capa
  readTime: number // Tempo de leitura em minutos
  
  // Categorização
  category: ArticleCategory
  tags: string[]
  
  // Metadata
  author: IAuthor
  source?: string // Fonte externa (ex: "Monash University")
  
  // Datas
  publishedAt?: Date
  updatedAt: Date
  
  // Controle (Admin)
  status: ArticleStatus
  isFeatured: boolean // Se é destaque na home
  
  // Analytics
  views: number
  likes: number
  
  // Receitas específicas
  recipe?: IRecipe
  
  createdAt: Date
}

// =============================================================================
// Schema
// =============================================================================

const authorSchema = new Schema<IAuthor>(
  {
    name: { type: String, required: true },
    avatar: String,
    bio: String,
  },
  { _id: false }
)

const recipeNutritionSchema = new Schema<IRecipeNutrition>(
  {
    calories: { type: Number, required: true },
    protein_g: { type: Number, required: true },
    carbs_g: { type: Number, required: true },
    fat_g: { type: Number, required: true },
    fiber_g: { type: Number, required: true },
  },
  { _id: false }
)

const recipeSchema = new Schema<IRecipe>(
  {
    prep_time: { type: Number, required: true },
    cook_time: { type: Number, required: true },
    servings: { type: Number, required: true },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      required: true,
    },
    ingredients: {
      type: [String],
      required: true,
      validate: {
        validator: (v: string[]) => v.length > 0,
        message: 'Receita deve ter pelo menos 1 ingrediente',
      },
    },
    instructions: {
      type: [String],
      required: true,
      validate: {
        validator: (v: string[]) => v.length > 0,
        message: 'Receita deve ter pelo menos 1 instrução',
      },
    },
    nutrition: recipeNutritionSchema,
    fodmap_friendly: { type: Boolean, default: true },
    fodmap_phase: {
      type: String,
      enum: ['elimination', 'reintroduction', 'maintenance'],
    },
  },
  { _id: false }
)

const newsArticleSchema = new Schema<INewsArticle>(
  {
    id: {
      type: Number,
      unique: true,
      // Not required - auto-generated in pre('save') middleware
    },
    
    // Conteúdo
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    summary: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    content: {
      type: String,
      required: true,
    },
    imageUrl: String,
    readTime: {
      type: Number,
      default: 3,
    },
    
    // Categorização
    category: {
      type: String,
      enum: ['recipe', 'article', 'tip', 'wellness', 'news'],
      required: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    
    // Metadata
    author: {
      type: authorSchema,
      required: true,
    },
    source: String,
    
    // Datas
    publishedAt: Date,
    
    // Controle (Admin)
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'draft',
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    
    // Analytics
    views: {
      type: Number,
      default: 0,
    },
    likes: {
      type: Number,
      default: 0,
    },
    
    // Receitas específicas
    recipe: recipeSchema,
  },
  {
    timestamps: true,
    collection: 'news_articles',
  }
)

// =============================================================================
// Indexes
// =============================================================================

// Índice de texto para busca full-text
newsArticleSchema.index(
  {
    title: 'text',
    excerpt: 'text',
    content: 'text',
    tags: 'text',
  },
  {
    weights: {
      title: 10,
      tags: 5,
      excerpt: 3,
      content: 1,
    },
  }
)

// Índice para listagem por status e data
newsArticleSchema.index({ status: 1, publishedAt: -1 })

// Índice para categorias
newsArticleSchema.index({ category: 1, publishedAt: -1 })

// Índice para featured
newsArticleSchema.index({ featured: 1, status: 1, publishedAt: -1 })

// Índice para analytics
newsArticleSchema.index({ status: 1, views: -1 })

// Índice para tags
newsArticleSchema.index({ tags: 1 })

// =============================================================================
// Middleware
// =============================================================================

// Auto-generate numeric ID before saving
newsArticleSchema.pre('save', async function () {
  if (this.isNew && !this.id) {
    const lastArticle = await NewsArticle.findOne({}, {}, { sort: { id: -1 } })
    this.id = lastArticle ? lastArticle.id + 1 : 1
  }
  
  // Se status mudou para published e não tem publishedAt, define agora
  if (this.isModified('status') && this.status === 'published' && !this.publishedAt) {
    this.publishedAt = new Date()
  }
})

// =============================================================================
// Model
// =============================================================================

export const NewsArticle: Model<INewsArticle> = mongoose.model<INewsArticle>(
  'NewsArticle',
  newsArticleSchema
)
