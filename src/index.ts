/**
 * Ceboelha API - Entry Point
 *
 * Initializes database connection and starts the server
 */

import { env, connectDatabase, disconnectDatabase } from '@/config'
import { app } from './app'

// =============================================================================
// Startup
// =============================================================================

async function main() {
  console.log('🧅 Ceboelha API starting...')
  console.log(`📍 Environment: ${env.NODE_ENV}`)

  // Connect to MongoDB
  await connectDatabase()

  // Start server
  app.listen(env.PORT)

  console.log(`🚀 Server running at http://localhost:${env.PORT}`)
  console.log(`📚 Swagger docs at http://localhost:${env.PORT}/docs`)

  // Easter egg 💕
  console.log('💕 Made with love for Julia')
}

// =============================================================================
// Graceful Shutdown
// =============================================================================

async function shutdown(signal: string) {
  console.log(`\n⚠️ Received ${signal}, shutting down gracefully...`)

  try {
    // Stop accepting new requests
    app.stop()
    console.log('✅ Server stopped accepting new requests')

    // Close database connection
    await disconnectDatabase()
    console.log('✅ Database connection closed')

    process.exit(0)
  } catch (error) {
    console.error('❌ Error during shutdown:', error)
    process.exit(1)
  }
}

// Handle shutdown signals
process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error)
  shutdown('uncaughtException')
})

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason)
  shutdown('unhandledRejection')
})

// Start the application
main().catch((error) => {
  console.error('❌ Failed to start server:', error)
  process.exit(1)
})
