/**
 * Token Manager
 *
 * Secure API key acquisition, rotation, and provider abstraction.
 * Ensures secure storage and access to AI provider credentials.
 */

import { AIProvider } from '../interfaces'
import { AIModelName } from '@/config/ai.config'
import { AIRequestContext } from '../types/context'
import { logger } from '@/lib/logger'

// Types for token management
interface TokenMetadata {
  provider: string
  expiresAt?: Date
  lastRotated?: Date
  usageCount: number
  isActive: boolean
}

interface SecureToken {
  key: string
  metadata: TokenMetadata
}

export class TokenManager {
  private tokenCache: Map<string, SecureToken> = new Map()
  private readonly CACHE_TTL = 5 * 60 * 1000 // 5 minutes
  private readonly ROTATION_THRESHOLD = 50 // Rotate after 50 uses

  /**
   * Get authenticated provider instance for a model
   */
  async getProvider(context: AIRequestContext, model: AIModelName): Promise<AIProvider> {
    const providerType = this.selectProviderForModel(model, context.subscription.plan)

    logger.debug(`[TokenManager] Getting provider ${providerType} for model ${model}`)

    // Get secure token for provider
    const token = await this.getSecureToken(providerType, context)

    // Create authenticated provider
    const provider = await this.createAuthenticatedProvider(providerType, token)

    return provider
  }

  /**
   * Select optimal provider for model and subscription
   */
  private selectProviderForModel(model: AIModelName, plan: string): string {
    // Model to provider mapping
    const modelProviders: Record<string, string> = {
      'gpt-4o-mini': 'openai',
      'gpt-4o': 'openai',
      'gpt-4-turbo': 'openai',
      'gpt-3.5-turbo': 'openai',
      'gemini-1.5-flash': 'google',
      'gemini-1.5-pro': 'google',
      'gemini-pro': 'google'
    }

    const provider = modelProviders[model]

    if (!provider) {
      throw new Error(`No provider found for model: ${model}`)
    }

    // Enterprise plans might have access to additional providers
    if (plan === 'ENTERPRISE') {
      // Could add logic for enterprise-specific providers
    }

    return provider
  }

  /**
   * Get secure token for provider with caching and rotation
   */
  private async getSecureToken(providerType: string, context: AIRequestContext): Promise<SecureToken> {
    const cacheKey = `${providerType}_${context.userId}`

    // Check cache first
    const cached = this.tokenCache.get(cacheKey)
    if (cached && this.isTokenValid(cached)) {
      cached.metadata.usageCount++
      return cached
    }

    // Get fresh token
    const token = await this.retrieveSecureToken(providerType, context)

    // Cache the token
    this.tokenCache.set(cacheKey, token)

    // Schedule cleanup
    setTimeout(() => {
      this.tokenCache.delete(cacheKey)
    }, this.CACHE_TTL)

    return token
  }

  /**
   * Retrieve secure token from storage
   */
  private async retrieveSecureToken(providerType: string, context: AIRequestContext): Promise<SecureToken> {
    try {
      // Get token from secure storage (environment variables for now)
      const tokenKey = this.getTokenKey(providerType)
      const rawToken = process.env[tokenKey]

      if (!rawToken) {
        throw new Error(`Token not found for provider: ${providerType}`)
      }

      // Validate token format
      if (!this.validateTokenFormat(providerType, rawToken)) {
        throw new Error(`Invalid token format for provider: ${providerType}`)
      }

      const token: SecureToken = {
        key: rawToken,
        metadata: {
          provider: providerType,
          expiresAt: this.getTokenExpiry(providerType),
          lastRotated: new Date(),
          usageCount: 0,
          isActive: true
        }
      }

      logger.debug(`[TokenManager] Retrieved token for ${providerType}`)

      return token

    } catch (error) {
      logger.error(`[TokenManager] Failed to retrieve token for ${providerType}:`, error)
      throw new Error(`Token retrieval failed for provider: ${providerType}`)
    }
  }

  /**
   * Create authenticated provider instance
   */
  private async createAuthenticatedProvider(providerType: string, token: SecureToken): Promise<AIProvider> {
    const { getAIProvider } = await import('../providers/provider-factory')

    // Create provider with token
    const provider = getAIProvider()

    // Set authentication (this would be provider-specific)
    if (providerType === 'openai') {
      // OpenAI provider authentication
      ;(provider as any).setApiKey(token.key)
    } else if (providerType === 'google') {
      // Google AI provider authentication
      ;(provider as any).setApiKey(token.key)
    }

    return provider
  }

  /**
   * Check if cached token is still valid
   */
  private isTokenValid(token: SecureToken): boolean {
    // Check expiry
    if (token.metadata.expiresAt && token.metadata.expiresAt < new Date()) {
      return false
    }

    // Check usage threshold
    if (token.metadata.usageCount >= this.ROTATION_THRESHOLD) {
      return false
    }

    // Check if token is marked inactive
    if (!token.metadata.isActive) {
      return false
    }

    return true
  }

  /**
   * Get environment variable key for provider
   */
  private getTokenKey(providerType: string): string {
    const keyMap: Record<string, string> = {
      'openai': 'OPENAI_API_KEY',
      'google': 'GOOGLE_AI_API_KEY',
      'anthropic': 'ANTHROPIC_API_KEY'
    }

    const key = keyMap[providerType]
    if (!key) {
      throw new Error(`Unknown provider type: ${providerType}`)
    }

    return key
  }

  /**
   * Validate token format for provider
   */
  private validateTokenFormat(providerType: string, token: string): boolean {
    // Basic format validation
    if (!token || token.length < 10) {
      return false
    }

    // Provider-specific validation
    switch (providerType) {
      case 'openai':
        return token.startsWith('sk-') && token.length > 20
      case 'google':
        return token.length > 20 // Google API keys are typically longer
      case 'anthropic':
        return token.startsWith('sk-ant-') && token.length > 30
      default:
        return false
    }
  }

  /**
   * Get token expiry (if applicable)
   */
  private getTokenExpiry(providerType: string): Date | undefined {
    // Most API keys don't expire, but this could be extended
    // to support token rotation schedules
    return undefined
  }

  /**
   * Rotate tokens (called by scheduled job)
   */
  async rotateExpiredTokens(): Promise<void> {
    logger.info('[TokenManager] Starting token rotation check')

    // Clear expired tokens from cache
    for (const [key, token] of this.tokenCache.entries()) {
      if (!this.isTokenValid(token)) {
        this.tokenCache.delete(key)
        logger.debug(`[TokenManager] Removed expired token: ${key}`)
      }
    }

    // TODO: Implement actual token rotation with external services
    // This would involve calling provider APIs to rotate keys

    logger.info('[TokenManager] Token rotation check completed')
  }

  /**
   * Get token health status
   */
  async getTokenHealth(): Promise<Record<string, { status: 'healthy' | 'warning' | 'error', details: string }>> {
    const health: Record<string, { status: 'healthy' | 'warning' | 'error', details: string }> = {}

    const providers = ['openai', 'google', 'anthropic']

    for (const provider of providers) {
      try {
        const tokenKey = this.getTokenKey(provider)
        const token = process.env[tokenKey]

        if (!token) {
          health[provider] = { status: 'error', details: 'Token not configured' }
        } else if (!this.validateTokenFormat(provider, token)) {
          health[provider] = { status: 'error', details: 'Invalid token format' }
        } else {
          health[provider] = { status: 'healthy', details: 'Token configured and valid' }
        }
      } catch (error) {
        health[provider] = { status: 'error', details: `Health check failed: ${error}` }
      }
    }

    return health
  }
}