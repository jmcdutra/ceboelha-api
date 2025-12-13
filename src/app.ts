/**
 * Ceboelha API - Main Application
 *
 * Features:
 * - CORS configuration
 * - Swagger documentation
 * - Global error handling
 * - Rate limiting
 * - Security headers
 */

import { Elysia } from 'elysia'
import { cors } from '@elysiajs/cors'
import { swagger } from '@elysiajs/swagger'
import { env } from '@/config'
import { errorHandler } from '@/shared/errors'
import { globalRateLimiter } from '@/shared/middlewares'
import { authController } from '@/modules/auth'
import { usersController } from '@/modules/users'
import { foodsController } from '@/modules/foods'
import { diaryController } from '@/modules/diary'
import { problematicFoodsController } from '@/modules/problematic-foods'
import { insightsController } from '@/modules/insights'
import { newsController } from '@/modules/news'
import { achievementsController } from '@/modules/achievements'
import { adminController } from '@/modules/admin'

// =============================================================================
// Create App
// =============================================================================

export const app = new Elysia({ name: 'ceboelha-api' })

  // ============================================================================
  // Security Headers
  // ============================================================================
  .onAfterHandle({ as: 'global' }, ({ set, request }) => {
    // Prevent clickjacking
    set.headers['X-Frame-Options'] = 'DENY'
    // Prevent MIME type sniffing
    set.headers['X-Content-Type-Options'] = 'nosniff'
    // Enable XSS filter
    set.headers['X-XSS-Protection'] = '1; mode=block'
    // Control referrer information
    set.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
    
    // Content Security Policy - Relaxed for Swagger docs
    const isDocsRoute = request.url.includes('/docs')
    if (isDocsRoute) {
      // Allow Swagger/Scalar to load from CDN
      set.headers['Content-Security-Policy'] = [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net",
        "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net",
        "font-src 'self' data: https://fonts.scalar.com",
        "img-src 'self' data: https:",
        "connect-src 'self'",
      ].join('; ')
    } else {
      // Strict CSP for API routes
      set.headers['Content-Security-Policy'] = "default-src 'self'"
    }
    
    // Remove server signature
    set.headers['X-Powered-By'] = 'Ceboelha'
    // HSTS - Force HTTPS (only in production)
    if (env.IS_PROD) {
      set.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains; preload'
    }
    // Permissions Policy - Restrict browser features
    set.headers['Permissions-Policy'] = 'camera=(), microphone=(), geolocation=()'
  })

  // ============================================================================
  // CORS
  // ============================================================================
  .use(
    cors({
      origin: env.CORS_ORIGIN.split(',').map((o) => o.trim()),
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
      credentials: true,
      maxAge: 86400, // 24 hours
    })
  )

  // ============================================================================
  // Swagger Documentation
  // ============================================================================
  .use(
    swagger({
      scalarVersion: '1.25.55', // Pin specific version for stability
      documentation: {
        info: {
          title: 'Ceboelha API',
          version: '1.0.0',
          description: `
            API do Ceboelha - Aplicativo para gerenciamento de dieta FODMAP e IBS.
            
            ## Autenticação
            
            A API usa JWT (JSON Web Tokens) para autenticação.
            
            - **Access Token**: Válido por 15 minutos, usado em todas as requisições autenticadas
            - **Refresh Token**: Válido por 7 dias, usado para obter novos access tokens
            
            ### Como usar:
            1. Faça login ou registro para obter os tokens
            2. Inclua o access token no header: \`Authorization: Bearer {token}\`
            3. Quando o access token expirar, use o refresh token para obter um novo
            
            ## Rate Limiting
            
            - Geral: 100 requisições por minuto
            - Auth: 5 requisições por 15 minutos
            - Operações sensíveis: 3 requisições por 5 minutos
            
            ## Segurança
            
            - Senhas são hasheadas com bcrypt (12 salt rounds)
            - Proteção contra brute force com lockout de conta
            - Refresh token rotation (token antigo é invalidado ao usar)
            - Detecção de reutilização de token revogado
          `,
          contact: {
            name: 'Ceboelha Support',
            email: 'support@ceboelha.app',
          },
        },
        tags: [
          { name: 'Auth', description: 'Autenticação e gerenciamento de sessão' },
          { name: 'Profile', description: 'Perfil do usuário' },
          { name: 'Foods', description: 'Base de dados de alimentos' },
          { name: 'Diary', description: 'Diário alimentar' },
          { name: 'Problematic Foods', description: 'Alimentos problemáticos' },
          { name: 'Insights', description: 'Insights e estatísticas' },
          { name: 'News', description: 'Artigos, receitas e conteúdo educacional' },
          { name: 'Achievements', description: 'Sistema de conquistas e gamificação' },
          { name: 'Admin', description: 'Administração (requer role admin)' },
        ],
        components: {
          securitySchemes: {
            bearerAuth: {
              type: 'http',
              scheme: 'bearer',
              bearerFormat: 'JWT',
              description: 'JWT Access Token',
            },
          },
        },
        security: [{ bearerAuth: [] }],
      },
      path: '/docs',
      exclude: ['/docs', '/docs/json'],
    })
  )

  // ============================================================================
  // Global Plugins
  // ============================================================================
  .use(errorHandler)
  .use(globalRateLimiter)

  // ============================================================================
  // Health Check
  // ============================================================================
  .get('/health', () => ({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: env.NODE_ENV,
  }), {
    detail: {
      tags: ['Health'],
      summary: 'Health check',
      description: 'Verifica se a API está online',
    },
  })

  // ============================================================================
  // API Routes (prefixo /api)
  // ============================================================================
  .group('/api', (app) =>
    app
      .use(authController)
      .use(usersController)
      .use(foodsController)
      .use(diaryController)
      .use(problematicFoodsController)
      .use(insightsController)
      .use(newsController)
      .use(achievementsController)
      .use(adminController)
  )

  // ============================================================================
  // 404 Handler
  // ============================================================================
  .all('*', ({ set }) => {
    set.status = 404
    return {
      success: false,
      error: 'NotFoundError',
      code: 'NOT_FOUND',
      message: 'Endpoint não encontrado',
    }
  })

export default app
