/**
 * Ceboelha API - Database Configuration
 *
 * MongoDB connection using Mongoose
 */

import mongoose from 'mongoose'
import { env } from './env'

export async function connectDatabase(): Promise<typeof mongoose> {
  try {
    const connection = await mongoose.connect(env.MONGODB_URI, {
      // Mongoose 8+ has good defaults, but we can customize if needed
    })

    console.log(`✅ MongoDB connected: ${connection.connection.host}`)

    // Handle connection events
    mongoose.connection.on('error', (error) => {
      console.error('❌ MongoDB connection error:', error)
    })

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ MongoDB disconnected')
    })

    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected')
    })

    return connection
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error)
    process.exit(1)
  }
}

export async function disconnectDatabase(): Promise<void> {
  try {
    await mongoose.disconnect()
    console.log('👋 MongoDB disconnected gracefully')
  } catch (error) {
    console.error('❌ Error disconnecting from MongoDB:', error)
  }
}

export { mongoose }
