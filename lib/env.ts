/**
 * Centralized Environment Configuration
 * Type-safe, validated environment variable management
 */

import { z } from 'zod'

// ============================================================================
// ENVIRONMENT SCHEMAS
// ============================================================================

// Database Configuration Schema
const databaseSchema = z.object({
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid URL').optional(),
})

// Authentication Schema
const authSchema = z.object({
  NEXTAUTH_URL: z.string().url('NEXTAUTH_URL must be a valid URL').optional(),
  NEXTAUTH_SECRET: z.string().min(1, 'NEXTAUTH_SECRET is required').optional(),
})

// OpenAI Configuration Schema
const openaiSchema = z.object({
  OPENAI_API_KEY: z.string().min(1, 'OPENAI_API_KEY is required for AI features').optional(),
})

// Chat Configuration Schema
const chatSchema = z.object({
  CHAT_SEMANTIC_SUMMARY: z.coerce.number().int().min(0).max(1).default(1),
  CHAT_SUMMARY_MODEL: z.string().default('gpt-4o-mini'),
})

// Embedding Configuration Schema
const embeddingSchema = z.object({
  EMBEDDING_SIMILARITY_THRESHOLD: z.coerce.number().min(0).max(1).default(0.1),
  EMBEDDING_TOP_K: z.coerce.number().int().positive().default(12),
})

// AI Provider Configuration Schema
const aiProviderSchema = z.object({
  AI_PROVIDER_TYPE: z.enum(['openai', 'anthropic', 'google']).default('openai'),
  AI_MODEL_FREE: z.string().default('gpt-3.5-turbo-1106'),
  AI_MODEL_BASIC: z.string().default('gpt-3.5-turbo-1106'),
  AI_MODEL_PREMIUM: z.string().default('gpt-4-1106-preview'),
  AI_MODEL_ENTERPRISE: z.string().default('gpt-4-1106-preview'),
  // Optional API keys for different providers
  ANTHROPIC_API_KEY: z.string().optional(),
  GOOGLE_AI_API_KEY: z.string().optional(),
})

// Application Configuration Schema
const appSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url('NEXT_PUBLIC_APP_URL must be a valid URL').optional(),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
})

// Feature Flags Schema
const featureFlagsSchema = z.object({
  FEATURE_FLAG_CACHE_ENABLED: z.coerce.boolean().default(true),
  FEATURE_FLAG_DEBUG_MODE: z.coerce.boolean().default(false),
  FEATURE_FLAG_ANALYTICS: z.coerce.boolean().default(true),
})

// Monitoring Schema
const monitoringSchema = z.object({
  LOGGING_ENDPOINT: z.preprocess(
    (val) => (val === '' || val === undefined || val === null) ? undefined : val,
    z.string().url().optional()
  ),
  MONITORING_ENDPOINT: z.preprocess(
    (val) => (val === '' || val === undefined || val === null) ? undefined : val,
    z.string().url().optional()
  ),
  METRICS_ENABLED: z.coerce.boolean().default(true),
  TRACING_ENABLED: z.coerce.boolean().default(true),
})

// Security Schema
const securitySchema = z.object({
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60000),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().int().positive().default(100),
  SECURITY_HEADERS_ENABLED: z.coerce.boolean().default(true),
  CORS_ALLOWED_ORIGINS: z.string().optional(), // Comma-separated list
})

// Performance Schema
const performanceSchema = z.object({
  CACHE_TTL: z.coerce.number().int().positive().default(300),
  CACHE_MAX_KEYS: z.coerce.number().int().positive().default(1000),
  QUERY_LOGGING_ENABLED: z.coerce.boolean().default(false),
  SLOW_QUERY_THRESHOLD: z.coerce.number().int().positive().default(1000),
})

// Payment/Stripe Schema (Optional)
const paymentSchema = z.object({
  STRIPE_SECRET_KEY: z.string().optional(),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().optional(),
}).optional()

// ============================================================================
// COMBINED CONFIGURATION SCHEMA
// ============================================================================

const envSchema = z.object({
  // Required configurations
  ...databaseSchema.shape,
  ...authSchema.shape,
  ...openaiSchema.shape,

  // Optional configurations with defaults
  ...chatSchema.shape,
  ...embeddingSchema.shape,
  ...aiProviderSchema.shape,
  ...appSchema.shape,
  ...featureFlagsSchema.shape,
  ...monitoringSchema.shape,
  ...securitySchema.shape,
  ...performanceSchema.shape,

  // Optional external services
})

// Merge with payment schema if it exists
const finalEnvSchema = envSchema.merge(
  paymentSchema ? paymentSchema.unwrap() : z.object({})
)

// ============================================================================
// CONFIGURATION LOADER
// ============================================================================

/**
 * Load and validate environment configuration
 */
function loadConfig() {
  try {
    const config = finalEnvSchema.parse(process.env)

    // Log configuration status in development
    if (config.NODE_ENV === 'development') {
      console.log('✅ Environment configuration loaded successfully')
    }

    return config
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Environment configuration validation failed:')
      error.errors.forEach((err) => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`)
      })
    } else {
      console.error('❌ Environment configuration error:', error)
    }

    // In production, throw the error
    if (process.env.NODE_ENV === 'production') {
      throw error
    }

    // In development, provide helpful defaults for missing required vars
    console.warn('⚠️  Using development defaults for missing environment variables')

    return getDevelopmentDefaults()
  }
}

/**
 * Development defaults for missing environment variables
 */
function getDevelopmentDefaults() {
  return {
    // Database
    DATABASE_URL: 'postgresql://user:password@localhost:5432/courseai',

    // Auth
    NEXTAUTH_URL: 'http://localhost:3000',
    NEXTAUTH_SECRET: 'development-secret-key-change-in-production',

    // OpenAI (placeholder)
    OPENAI_API_KEY: 'sk-placeholder-key-for-development',

    // Chat defaults
    CHAT_SEMANTIC_SUMMARY: 1,
    CHAT_SUMMARY_MODEL: 'gpt-4o-mini',

    // Embedding defaults
    EMBEDDING_SIMILARITY_THRESHOLD: 0.1,
    EMBEDDING_TOP_K: 12,

    // AI Provider defaults
    AI_PROVIDER_TYPE: 'openai' as const,
    AI_MODEL_FREE: 'gpt-3.5-turbo-1106',
    AI_MODEL_BASIC: 'gpt-3.5-turbo-1106',
    AI_MODEL_PREMIUM: 'gpt-4-1106-preview',
    AI_MODEL_ENTERPRISE: 'gpt-4-1106-preview',

    // App defaults
    NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
    NODE_ENV: 'development' as const,
    PORT: 3000,

    // Feature flags
    FEATURE_FLAG_CACHE_ENABLED: true,
    FEATURE_FLAG_DEBUG_MODE: false,
    FEATURE_FLAG_ANALYTICS: true,

    // Monitoring defaults
    LOGGING_ENDPOINT: undefined,
    MONITORING_ENDPOINT: undefined,
    METRICS_ENABLED: true,
    TRACING_ENABLED: true,

    // Security defaults
    RATE_LIMIT_WINDOW_MS: 60000,
    RATE_LIMIT_MAX_REQUESTS: 100,
    SECURITY_HEADERS_ENABLED: true,

    // Performance defaults
    CACHE_TTL: 300,
    CACHE_MAX_KEYS: 1000,
    QUERY_LOGGING_ENABLED: false,
    SLOW_QUERY_THRESHOLD: 1000,
  }
}

// ============================================================================
// CONFIGURATION EXPORT
// ============================================================================

/**
 * Centralized, validated environment configuration
 */
export const env = loadConfig()

/**
 * Type-safe environment configuration
 */
export type EnvironmentConfig = typeof env

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Check if running in development mode
 */
export function isDevelopment(): boolean {
  return env.NODE_ENV === 'development'
}

/**
 * Check if running in production mode
 */
export function isProduction(): boolean {
  return env.NODE_ENV === 'production'
}

/**
 * Check if running in test mode
 */
export function isTest(): boolean {
  return env.NODE_ENV === 'test'
}

/**
 * Get the current environment name
 */
export function getEnvironment(): string {
  return env.NODE_ENV
}

/**
 * Check if a feature flag is enabled
 */
export function isFeatureEnabled(flagName: keyof typeof env): boolean {
  const value = env[flagName]
  return typeof value === 'boolean' ? value : false
}