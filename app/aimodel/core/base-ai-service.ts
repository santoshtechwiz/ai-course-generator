/**
 * Base AI Service Class
 * 
 * Provides common functionality for all AI services including:
 * - Rate limiting
 * - Error handling
 * - Caching
 * - Logging
 */

import { rateLimit } from "@/lib/rate-limit"
import { logger } from "@/lib/logger"

export interface AIServiceConfig {
  name: string
  rateLimits: {
    free: { limit: number; windowInSeconds: number }
    subscribed: { limit: number; windowInSeconds: number }
  }
  cacheConfig: {
    enabled: boolean
    ttl: number // Time to live in seconds
  }
  retryConfig: {
    maxRetries: number
    backoffMs: number
  }
}

export interface AIServiceContext {
  userId: string
  isSubscribed: boolean
  sessionId?: string
  metadata?: Record<string, any>
}

export abstract class BaseAIService {
  protected config: AIServiceConfig
  protected cache: Map<string, { data: any; expiry: number }> = new Map()

  constructor(config: AIServiceConfig) {
    this.config = config
  }

  /**
   * Check if user can make a request based on rate limits
   */
  protected async checkRateLimit(context: AIServiceContext): Promise<{ success: boolean; reset?: number }> {
    const rateLimitConfig = context.isSubscribed 
      ? this.config.rateLimits.subscribed 
      : this.config.rateLimits.free

    const result = await rateLimit(context.userId, {
      limit: rateLimitConfig.limit,
      windowInSeconds: rateLimitConfig.windowInSeconds,
      identifier: `${this.config.name}:${context.isSubscribed ? 'subscribed' : 'free'}`
    })

    return result
  }

  /**
   * Get cached data if available and not expired
   */
  protected getCachedData<T>(key: string): T | null {
    if (!this.config.cacheConfig.enabled) return null

    const cached = this.cache.get(key)
    if (!cached || Date.now() > cached.expiry) {
      this.cache.delete(key)
      return null
    }

    return cached.data as T
  }

  /**
   * Cache data with TTL
   */
  protected setCachedData(key: string, data: any): void {
    if (!this.config.cacheConfig.enabled) return

    this.cache.set(key, {
      data,
      expiry: Date.now() + (this.config.cacheConfig.ttl * 1000)
    })
  }

  /**
   * Execute with retry logic
   */
  protected async executeWithRetry<T>(
    operation: () => Promise<T>,
    context: AIServiceContext
  ): Promise<T> {
    let lastError: Error | null = null
    
    for (let attempt = 0; attempt <= this.config.retryConfig.maxRetries; attempt++) {
      try {
        return await operation()
      } catch (error) {
        lastError = error as Error
        
        if (attempt === this.config.retryConfig.maxRetries) {
          logger.error(`AI Service ${this.config.name} failed after ${attempt + 1} attempts`, {
            userId: context.userId,
            error: lastError.message,
            metadata: context.metadata
          })
          break
        }

        // Wait before retry with exponential backoff
        const delay = this.config.retryConfig.backoffMs * Math.pow(2, attempt)
        await new Promise(resolve => setTimeout(resolve, delay))
        
        logger.warn(`AI Service ${this.config.name} attempt ${attempt + 1} failed, retrying...`, {
          userId: context.userId,
          error: lastError.message,
          nextRetryIn: delay
        })
      }
    }

    throw lastError || new Error('Operation failed after retries')
  }

  /**
   * Validate input data
   */
  protected validateInput(input: any, rules: ValidationRule[]): ValidationResult {
    const errors: string[] = []

    for (const rule of rules) {
      const result = rule.validate(input)
      if (!result.isValid) {
        errors.push(result.message)
      }
    }

    return {
      isValid: errors.length === 0,
      message: errors.length > 0 ? errors[0] : '',
      errors
    }
  }

  /**
   * Log service activity
   */
  protected logActivity(
    action: string, 
    context: AIServiceContext, 
    metadata?: Record<string, any>
  ): void {
    logger.info(`AI Service ${this.config.name}: ${action}`, {
      userId: context.userId,
      sessionId: context.sessionId,
      isSubscribed: context.isSubscribed,
      ...metadata
    })
  }

  /**
   * Abstract method that child classes must implement
   */
  abstract process(input: any, context: AIServiceContext): Promise<any>
}

// Validation interfaces
export interface ValidationRule {
  validate(input: any): ValidationResult
}

export interface ValidationResult {
  isValid: boolean
  message: string
  errors?: string[]
}

export class StringLengthRule implements ValidationRule {
  constructor(private min: number, private max: number, private field: string) {}

  validate(input: any): ValidationResult {
    const value = input[this.field]
    if (typeof value !== 'string') {
      return { isValid: false, message: `${this.field} must be a string` }
    }
    
    if (value.length < this.min || value.length > this.max) {
      return { 
        isValid: false, 
        message: `${this.field} must be between ${this.min} and ${this.max} characters` 
      }
    }
    
    return { isValid: true, message: '' }
  }
}

export class RequiredFieldRule implements ValidationRule {
  constructor(private field: string) {}

  validate(input: any): ValidationResult {
    const value = input[this.field]
    if (value === undefined || value === null || value === '') {
      return { isValid: false, message: `${this.field} is required` }
    }
    
    return { isValid: true, message: '' }
  }
}
