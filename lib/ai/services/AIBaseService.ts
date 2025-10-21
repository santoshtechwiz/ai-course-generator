/**
 * AIBaseService - Abstract Base Class for AI Services
 * 
 * Provides shared functionality for all AI services including:
 * - Model initialization
 * - Input validation and sanitization
 * - Rate limiting
 * - Subscription checking
 * - Error handling
 * - Usage logging
 */

import type { SubscriptionPlanType } from '@/types/subscription'
import type { AIModelName, ModelConfiguration, FeatureAISettings } from '@/config/ai.config'
import { 
  getModelConfig, 
  getFeatureSettings, 
  getPlanLimits,
  getRateLimits,
  AI_ERROR_MESSAGES 
} from '@/config/ai.config'
import { checkFeatureAccess, type FeatureType } from '@/lib/featureAccess'
import { type AIProvider } from '@/lib/ai'

// ============= Types =============

export interface AIServiceContext {
  userId?: string
  subscriptionPlan: SubscriptionPlanType
  isAuthenticated: boolean
  credits?: number
}

export interface AIRequestOptions {
  model?: AIModelName
  maxTokens?: number
  temperature?: number
  topP?: number
  stream?: boolean
}

export interface AIServiceResult<T = any> {
  success: boolean
  data?: T
  error?: string
  errorCode?: string
  usage?: {
    creditsUsed: number
    tokensUsed?: number
  }
  metadata?: Record<string, any>
}

export interface ValidationResult {
  isValid: boolean
  error?: string
  sanitizedInput?: any
}

// ============= Abstract Base Service =============

export abstract class AIBaseService {
  protected provider: AIProvider
  protected context: AIServiceContext
  protected modelConfig: ModelConfiguration

  constructor(context: AIServiceContext, provider?: AIProvider) {
    this.context = context
    this.provider = provider || this.getDefaultProvider()
    this.modelConfig = getModelConfig(context.subscriptionPlan)
  }

  /**
   * Lazy load the default provider to avoid circular dependencies
   */
  private getDefaultProvider(): AIProvider {
    // Dynamic import to avoid circular dependency
    const { getDefaultAIProvider } = require('@/lib/ai')
    return getDefaultAIProvider()
  }

  // ============= Abstract Methods (Must be implemented by subclasses) =============

  /**
   * Get the subscription plan type for this service
   */
  abstract getSubscriptionPlan(): SubscriptionPlanType

  /**
   * Get the name of this service
   */
  abstract getServiceName(): string

  // ============= Subscription & Feature Access =============

  /**
   * Check if user can access a specific feature
   */
  protected async checkFeatureAccess(featureType: FeatureType): Promise<AIServiceResult<boolean>> {
    const access = checkFeatureAccess({
      feature: featureType,
      isAuthenticated: this.context.isAuthenticated,
      isSubscribed: this.context.subscriptionPlan !== 'FREE',
      currentPlan: this.context.subscriptionPlan,
      hasCredits: (this.context.credits ?? 0) > 0,
      isExpired: false,
    })

    if (!access.canAccess) {
      return {
        success: false,
        error: this.getAccessDeniedMessage(access.reason),
        errorCode: `ACCESS_DENIED_${access.reason?.toUpperCase()}`,
      }
    }

    return {
      success: true,
      data: true,
    }
  }

  /**
   * Check if user has sufficient credits
   */
  protected checkCredits(requiredCredits: number): AIServiceResult<boolean> {
    if (this.context.credits === undefined) {
      return {
        success: false,
        error: AI_ERROR_MESSAGES.INSUFFICIENT_CREDITS,
        errorCode: 'INSUFFICIENT_CREDITS',
      }
    }

    if (this.context.credits < requiredCredits) {
      return {
        success: false,
        error: AI_ERROR_MESSAGES.INSUFFICIENT_CREDITS,
        errorCode: 'INSUFFICIENT_CREDITS',
        metadata: {
          required: requiredCredits,
          available: this.context.credits,
        },
      }
    }

    return {
      success: true,
      data: true,
    }
  }

  /**
   * Validate plan-specific limits (questions per quiz, daily limits, etc.)
   */
  protected validatePlanLimits(
    featureKey: string,
    requestedAmount: number
  ): AIServiceResult<boolean> {
    const limits = getPlanLimits(this.context.subscriptionPlan)
    const maxAllowed = limits.maxQuestionsPerQuiz[featureKey]

    if (maxAllowed && requestedAmount > maxAllowed) {
      return {
        success: false,
        error: `Maximum ${maxAllowed} questions allowed for your plan.`,
        errorCode: 'PLAN_LIMIT_EXCEEDED',
        metadata: {
          requested: requestedAmount,
          allowed: maxAllowed,
          plan: this.context.subscriptionPlan,
        },
      }
    }

    return {
      success: true,
      data: true,
    }
  }

  // ============= Input Validation & Sanitization =============

  /**
   * Sanitize text input (remove harmful content, trim, validate length)
   */
  protected sanitizeTextInput(
    input: string,
    maxLength: number = 5000
  ): ValidationResult {
    if (!input || typeof input !== 'string') {
      return {
        isValid: false,
        error: AI_ERROR_MESSAGES.INVALID_INPUT,
      }
    }

    // Trim whitespace
    let sanitized = input.trim()

    // Check length
    if (sanitized.length === 0) {
      return {
        isValid: false,
        error: 'Input cannot be empty.',
      }
    }

    if (sanitized.length > maxLength) {
      return {
        isValid: false,
        error: AI_ERROR_MESSAGES.INPUT_TOO_LONG,
      }
    }

    // Remove potentially harmful patterns
    sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    sanitized = sanitized.replace(/javascript:/gi, '')
    sanitized = sanitized.replace(/on\w+\s*=/gi, '')

    return {
      isValid: true,
      sanitizedInput: sanitized,
    }
  }

  /**
   * Validate number input
   */
  protected validateNumberInput(
    value: any,
    min: number,
    max: number,
    defaultValue?: number
  ): ValidationResult {
    const num = Number(value)

    if (isNaN(num)) {
      if (defaultValue !== undefined) {
        return {
          isValid: true,
          sanitizedInput: defaultValue,
        }
      }
      return {
        isValid: false,
        error: 'Invalid number provided.',
      }
    }

    if (num < min || num > max) {
      return {
        isValid: false,
        error: `Number must be between ${min} and ${max}.`,
      }
    }

    return {
      isValid: true,
      sanitizedInput: Math.floor(num),
    }
  }

  /**
   * Validate difficulty level
   */
  protected validateDifficulty(
    difficulty?: string
  ): ValidationResult {
    const validLevels = ['easy', 'medium', 'hard']
    const level = difficulty?.toLowerCase() || 'medium'

    if (!validLevels.includes(level)) {
      return {
        isValid: false,
        error: AI_ERROR_MESSAGES.INVALID_DIFFICULTY,
      }
    }

    return {
      isValid: true,
      sanitizedInput: level,
    }
  }

  // ============= Model Selection & Configuration =============

  /**
   * Get the primary model for this subscription tier
   */
  protected getPrimaryModel(): AIModelName {
    return this.modelConfig.primary
  }

  /**
   * Get the fallback model for this subscription tier
   */
  protected getFallbackModel(): AIModelName {
    return this.modelConfig.fallback
  }

  /**
   * Build AI request options with plan-specific settings
   */
  protected buildRequestOptions(overrides?: AIRequestOptions): AIRequestOptions {
    return {
      model: overrides?.model || this.modelConfig.primary,
      maxTokens: overrides?.maxTokens || this.modelConfig.maxTokens,
      temperature: overrides?.temperature || this.modelConfig.temperature,
      topP: overrides?.topP || this.modelConfig.topP,
      stream: overrides?.stream || false,
    }
  }

  // ============= Error Handling =============

  /**
   * Get user-friendly access denied message
   */
  protected getAccessDeniedMessage(reason: string | null): string {
    switch (reason) {
      case 'auth':
        return AI_ERROR_MESSAGES.AUTH_REQUIRED
      case 'subscription':
        return AI_ERROR_MESSAGES.SUBSCRIPTION_REQUIRED
      case 'credits':
        return AI_ERROR_MESSAGES.INSUFFICIENT_CREDITS
      case 'expired':
        return AI_ERROR_MESSAGES.SESSION_EXPIRED
      case 'disabled':
        return AI_ERROR_MESSAGES.FEATURE_DISABLED
      default:
        return AI_ERROR_MESSAGES.API_ERROR
    }
  }

  /**
   * Handle API errors and return standardized result
   */
  protected handleError(error: any): AIServiceResult {
    console.error(`[${this.getServiceName()}] Error:`, error)

    const errorMessage = error instanceof Error 
      ? error.message 
      : String(error)

    return {
      success: false,
      error: errorMessage,
      errorCode: 'API_ERROR',
    }
  }

  // ============= Logging & Analytics =============

  /**
   * Log AI usage for analytics and billing
   */
  protected async logUsage(params: {
    featureType: string
    creditsUsed: number
    tokensUsed?: number
    success: boolean
    metadata?: Record<string, any>
  }): Promise<void> {
    try {
      // TODO: Implement usage logging to database
      console.log(`[${this.getServiceName()}] Usage logged:`, {
        userId: this.context.userId,
        ...params,
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      console.error(`[${this.getServiceName()}] Failed to log usage:`, error)
    }
  }

  // ============= Rate Limiting =============

  /**
   * Check rate limits for the current user
   */
  protected async checkRateLimit(): Promise<AIServiceResult<boolean>> {
    // TODO: Implement actual rate limiting with Redis or similar
    const limits = getRateLimits(this.context.subscriptionPlan)
    
    // For now, just return success
    // In production, this would check against stored request counts
    return {
      success: true,
      data: true,
      metadata: {
        limits,
      },
    }
  }

  // ============= Utility Methods =============

  /**
   * Get feature settings for a specific feature
   */
  protected getFeatureSettings(featureKey: string): FeatureAISettings | undefined {
    return getFeatureSettings(featureKey)
  }

  /**
   * Check if feature is enabled
   */
  protected isFeatureEnabled(featureKey: string): boolean {
    const settings = this.getFeatureSettings(featureKey)
    return settings?.enabled ?? false
  }

  /**
   * Get credit cost for a feature
   */
  protected getCreditCost(featureKey: string): number {
    const settings = this.getFeatureSettings(featureKey)
    return settings?.creditCost ?? 0
  }
}

export default AIBaseService
