/**
 * Configuration for AI providers
 */

import { env } from '@/lib/env'

/**
 * Get the AI provider configuration from centralized environment
 */
export function getAIProviderConfig() {
  return {
    // The provider type to use (openai, google, etc.)
    providerType: env.AI_PROVIDER_TYPE,

    // API key for OpenAI only
    apiKey: env.OPENAI_API_KEY,

    // Default models to use for different user tiers
    models: {
      FREE: env.AI_MODEL_FREE,
      BASIC: env.AI_MODEL_BASIC,
      PREMIUM: env.AI_MODEL_PREMIUM,
      ENTERPRISE: env.AI_MODEL_ENTERPRISE,
    }
  }
}
