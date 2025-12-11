/**
 * Ceboelha API - Environment Configuration
 *
 * Validates and exports environment variables with strict security
 */

const requiredEnvVars = [
  'MONGODB_URI',
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
] as const

// Validate required environment variables
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`❌ Missing required environment variable: ${envVar}`)
  }
}

// Validate JWT secrets minimum length (security)
const MIN_SECRET_LENGTH = 32
if (process.env.JWT_ACCESS_SECRET!.length < MIN_SECRET_LENGTH) {
  throw new Error(`❌ JWT_ACCESS_SECRET must be at least ${MIN_SECRET_LENGTH} characters`)
}
if (process.env.JWT_REFRESH_SECRET!.length < MIN_SECRET_LENGTH) {
  throw new Error(`❌ JWT_REFRESH_SECRET must be at least ${MIN_SECRET_LENGTH} characters`)
}

export const env = {
  // Server
  PORT: Number(process.env.PORT) || 3333,
  NODE_ENV: (process.env.NODE_ENV as 'development' | 'production' | 'test') || 'development',
  IS_DEV: process.env.NODE_ENV !== 'production',
  IS_PROD: process.env.NODE_ENV === 'production',

  // Database
  MONGODB_URI: process.env.MONGODB_URI!,

  // JWT - Access Token (short-lived)
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET!,
  JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN || '15m', // 15 minutes

  // JWT - Refresh Token (long-lived)
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET!,
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d', // 7 days

  // CORS
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000',

  // Rate Limiting - General
  RATE_LIMIT_MAX: Number(process.env.RATE_LIMIT_MAX) || 100,
  RATE_LIMIT_WINDOW: Number(process.env.RATE_LIMIT_WINDOW) || 60000, // 1 minute

  // Rate Limiting - Auth (stricter)
  AUTH_RATE_LIMIT_MAX: Number(process.env.AUTH_RATE_LIMIT_MAX) || 5,
  AUTH_RATE_LIMIT_WINDOW: Number(process.env.AUTH_RATE_LIMIT_WINDOW) || 900000, // 15 minutes

  // Security - Account Lockout
  MAX_LOGIN_ATTEMPTS: Number(process.env.MAX_LOGIN_ATTEMPTS) || 5,
  LOCKOUT_DURATION: Number(process.env.LOCKOUT_DURATION) || 900000, // 15 minutes

  // Security - Password
  BCRYPT_SALT_ROUNDS: Number(process.env.BCRYPT_SALT_ROUNDS) || 12,
} as const

export type Env = typeof env
