/**
 * Configuration for AI providers
 */

/**
 * Get the AI provider configuration from environment variables
 */
export function getAIProviderConfig() {
  return {
    // The provider type to use (openai, google, etc.)
    providerType: process.env.AI_PROVIDER_TYPE || 'openai',
    
    // API key for OpenAI only
    apiKey: process.env.OPENAI_API_KEY,
    // Default models to use for different user tiers
    models: {
      FREE: process.env.AI_MODEL_FREE || 'gpt-3.5-turbo-1106',
      BASIC: process.env.AI_MODEL_BASIC || 'gpt-3.5-turbo-1106',
      PREMIUM: process.env.AI_MODEL_PREMIUM || 'gpt-4-1106-preview',
      ULTIMATE: process.env.AI_MODEL_ULTIMATE || 'gpt-4-1106-preview',
    }
  }
}
