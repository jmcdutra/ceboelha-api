/**
 * Error Handler - Global Error Processing
 *
 * Features:
 * - Standardized error responses
 * - Different behavior for dev/prod
 * - Logging integration
 */

import { Elysia } from 'elysia'
import { AppError } from './index'
import { env } from '@/config'

// =============================================================================
// Error Response Type
// =============================================================================

export interface ErrorResponse {
  success: false
  error: string
  code?: string
  message: string
  stack?: string
}

// =============================================================================
// Error Handler Plugin
// =============================================================================

export const errorHandler = new Elysia({ name: 'error-handler' })
  .onError({ as: 'global' }, ({ error, code, set }) => {
    // Log error in development
    if (env.IS_DEV) {
      console.error('❌ Error:', error)
    }

    // Handle known AppError instances
    if (error instanceof AppError) {
      set.status = error.statusCode

      const response: ErrorResponse = {
        success: false,
        error: error.name,
        code: error.code,
        message: error.message,
      }

      if (env.IS_DEV && error.stack) {
        response.stack = error.stack
      }

      return response
    }

    // Handle Elysia validation errors
    if (code === 'VALIDATION') {
      set.status = 400

      // Extract validation message
      const validationError = error as { message?: string; validator?: { Errors?: unknown[] } }
      let message = 'Dados inválidos'

      if (validationError.message) {
        // Try to extract a cleaner message
        try {
          const parsed = JSON.parse(validationError.message)
          if (parsed.summary) {
            message = parsed.summary
          } else if (Array.isArray(parsed) && parsed[0]?.message) {
            message = parsed[0].message
          }
        } catch {
          // Use original message if not JSON
          message = validationError.message
        }
      }

      return {
        success: false,
        error: 'ValidationError',
        code: 'VALIDATION_ERROR',
        message,
      }
    }

    // Handle Elysia NOT_FOUND
    if (code === 'NOT_FOUND') {
      set.status = 404
      return {
        success: false,
        error: 'NotFoundError',
        code: 'NOT_FOUND',
        message: 'Endpoint não encontrado',
      }
    }

    // Handle Elysia PARSE error
    if (code === 'PARSE') {
      set.status = 400
      return {
        success: false,
        error: 'ParseError',
        code: 'PARSE_ERROR',
        message: 'Erro ao processar requisição',
      }
    }

    // Handle unknown errors (500)
    set.status = 500

    const response: ErrorResponse = {
      success: false,
      error: 'InternalServerError',
      code: 'INTERNAL_ERROR',
      message: env.IS_PROD
        ? 'Erro interno do servidor'
        : (error as Error).message || 'Erro desconhecido',
    }

    if (env.IS_DEV && (error as Error).stack) {
      response.stack = (error as Error).stack
    }

    return response
  })

export default errorHandler
