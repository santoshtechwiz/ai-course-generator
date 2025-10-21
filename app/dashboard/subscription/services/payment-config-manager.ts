/**
 * Payment Gateway Configuration Management
 *
 * This file provides utilities for managing payment gateway configurations,
 * including environment-specific settings, validation, and security.
 */

import { PaymentProvider, Currency } from "./payment-gateway-interface"
import { logger } from "@/lib/logger"

/**
 * Environment configuration for payment gateways
 */
interface PaymentGatewayEnvironmentConfig {
  readonly provider: PaymentProvider
  readonly apiKey: string
  readonly secretKey?: string
  readonly webhookSecret?: string
  readonly environment: 'test' | 'live'
  readonly currency: Currency
  readonly timeout: number
  readonly retries: number
  readonly enableLogging: boolean
  readonly enableWebhooks: boolean
  readonly allowedOrigins: string[]
  readonly maxAmount: number
  readonly minAmount: number
}

/**
 * Default configuration values
 */
const DEFAULT_CONFIG = {
  timeout: 30000,
  retries: 3,
  enableLogging: process.env.NODE_ENV !== 'production',
  enableWebhooks: true,
  maxAmount: 100000, // $1000 in cents
  minAmount: 50, // $0.50 in cents
  allowedOrigins: ['localhost', process.env.NEXTAUTH_URL || ''].filter(Boolean),
}

/**
 * Configuration validator
 */
class PaymentConfigValidator {
  /**
   * Validate payment gateway configuration
   */
  static validate(config: Partial<PaymentGatewayEnvironmentConfig>): string[] {
    const errors: string[] = []

    if (!config.provider) {
      errors.push("Provider is required")
    }

    if (!config.apiKey) {
      errors.push("API key is required")
    }

    if (config.apiKey && config.apiKey.length < 10) {
      errors.push("API key appears to be invalid (too short)")
    }

    if (config.timeout && (config.timeout < 1000 || config.timeout > 60000)) {
      errors.push("Timeout must be between 1000ms and 60000ms")
    }

    if (config.retries && (config.retries < 0 || config.retries > 5)) {
      errors.push("Retries must be between 0 and 5")
    }

    if (config.maxAmount && config.maxAmount <= 0) {
      errors.push("Max amount must be positive")
    }

    if (config.minAmount && config.minAmount <= 0) {
      errors.push("Min amount must be positive")
    }

    if (config.maxAmount && config.minAmount && config.maxAmount <= config.minAmount) {
      errors.push("Max amount must be greater than min amount")
    }

    return errors
  }

  /**
   * Validate environment variables for a specific provider
   */
  static validateEnvironment(provider: PaymentProvider): string[] {
    const errors: string[] = []
    const isProduction = process.env.NODE_ENV === 'production'

    switch (provider) {      case PaymentProvider.STRIPE:
        // Support both new naming convention and legacy naming
        const stripeKey = isProduction 
          ? (process.env.STRIPE_SECRET_KEY || process.env.STRIPE_LIVE_SECRET_KEY)
          : (process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY)

        if (!stripeKey) {
          errors.push(`Missing Stripe ${isProduction ? 'live' : 'test'} secret key`)
        }

        if (stripeKey) {
          // Allow both test and live keys in development for flexibility
          const validPrefixes = isProduction ? ['sk_live_'] : ['sk_test_', 'sk_live_']
          const hasValidPrefix = validPrefixes.some(prefix => stripeKey.startsWith(prefix))
          
          if (!hasValidPrefix) {
            const expectedPrefix = isProduction ? 'sk_live_' : 'sk_test_'
            errors.push(`Invalid Stripe key format. Expected ${expectedPrefix}* but got key starting with '${stripeKey.substring(0, 8)}...'`)
          }
        }

        if (!process.env.STRIPE_WEBHOOK_SECRET) {
          errors.push("Missing Stripe webhook secret")
        }
        break

      case PaymentProvider.PAYPAL:
        if (!process.env.PAYPAL_CLIENT_ID) {
          errors.push("Missing PayPal client ID")
        }
        if (!process.env.PAYPAL_CLIENT_SECRET) {
          errors.push("Missing PayPal client secret")
        }
        break

      case PaymentProvider.SQUARE:
        if (!process.env.SQUARE_ACCESS_TOKEN) {
          errors.push("Missing Square access token")
        }
        if (!process.env.SQUARE_APPLICATION_SECRET) {
          errors.push("Missing Square application secret")
        }
        break

      case PaymentProvider.RAZORPAY:
        if (!process.env.RAZORPAY_KEY_ID) {
          errors.push("Missing Razorpay key ID")
        }
        if (!process.env.RAZORPAY_KEY_SECRET) {
          errors.push("Missing Razorpay key secret")
        }
        break

      default:
        errors.push(`Unknown provider: ${provider}`)
    }    return errors
  }

  /**
   * Check current environment setup and provide helpful information
   */
  static checkEnvironmentSetup(): {
    isValid: boolean;
    provider: PaymentProvider | null;
    issues: string[];
    suggestions: string[];
  } {
    const issues: string[] = []
    const suggestions: string[] = []
    const isProduction = process.env.NODE_ENV === 'production'
    
    // Check for any Stripe configuration
    const hasStripeSecret = !!(process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY)
    const hasStripeWebhook = !!process.env.STRIPE_WEBHOOK_SECRET
    
    if (!hasStripeSecret) {
      issues.push("No Stripe secret key found")
      suggestions.push(`Add ${isProduction ? 'STRIPE_SECRET_KEY' : 'STRIPE_SECRET_KEY'} to your environment`)
    }
    
    if (!hasStripeWebhook) {
      issues.push("No Stripe webhook secret found")
      suggestions.push("Add STRIPE_WEBHOOK_SECRET to your environment")
    }
    
    // Check key format
    const currentKey = process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY
    if (currentKey) {
      if (isProduction && !currentKey.startsWith('sk_live_')) {
        issues.push("Using test key in production environment")
        suggestions.push("Use a live Stripe key (sk_live_*) in production")
      } else if (!isProduction && currentKey.startsWith('sk_live_')) {
        suggestions.push("Consider using a test key (sk_test_*) in development")
      }
    }
    
    return {
      isValid: issues.length === 0,
      provider: hasStripeSecret ? PaymentProvider.STRIPE : null,
      issues,
      suggestions
    }
  }
}

/**
 * Configuration manager for payment gateways
 */
export class PaymentConfigManager {
  private static configs = new Map<string, PaymentGatewayEnvironmentConfig>()

  /**
   * Get configuration for a specific provider
   */
  static getConfig(provider: PaymentProvider): PaymentGatewayEnvironmentConfig | null {
    const cacheKey = `${provider}_${process.env.NODE_ENV}`
    
    // Check cache first
    if (this.configs.has(cacheKey)) {
      return this.configs.get(cacheKey)!
    }    // Validate environment first
    const envErrors = PaymentConfigValidator.validateEnvironment(provider)
    if (envErrors.length > 0) {
      logger.error(`Environment validation failed for ${provider}:`, envErrors)
      
      // Provide helpful suggestions
      const setupInfo = PaymentConfigValidator.checkEnvironmentSetup()
      if (setupInfo.suggestions.length > 0) {
        logger.info(`Environment setup suggestions:`, setupInfo.suggestions)
      }
      
      return null
    }

    const config = this.buildConfig(provider)
    if (!config) {
      return null
    }

    // Validate the built configuration
    const configErrors = PaymentConfigValidator.validate(config)
    if (configErrors.length > 0) {
      logger.error(`Configuration validation failed for ${provider}:`, configErrors)
      return null
    }

    // Cache the valid configuration
    this.configs.set(cacheKey, config)
    
    return config
  }

  /**
   * Build configuration for a specific provider
   */
  private static buildConfig(provider: PaymentProvider): PaymentGatewayEnvironmentConfig | null {
    const isProduction = process.env.NODE_ENV === 'production'

    const baseConfig = {
      provider,
      environment: (isProduction ? 'live' : 'test') as 'test' | 'live',
      currency: Currency.USD,
      ...DEFAULT_CONFIG,
    }

    switch (provider) {      case PaymentProvider.STRIPE:
        // Support both new naming convention and legacy naming
        const stripeApiKey = isProduction 
          ? (process.env.STRIPE_SECRET_KEY || process.env.STRIPE_LIVE_SECRET_KEY)
          : (process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY)

        if (!stripeApiKey) return null

        return {
          ...baseConfig,
          apiKey: stripeApiKey,
          webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
        }

      case PaymentProvider.PAYPAL:
        const paypalClientId = process.env.PAYPAL_CLIENT_ID
        const paypalSecret = process.env.PAYPAL_CLIENT_SECRET

        if (!paypalClientId || !paypalSecret) return null

        return {
          ...baseConfig,
          apiKey: paypalClientId,
          secretKey: paypalSecret,
        }

      case PaymentProvider.SQUARE:
        const squareToken = process.env.SQUARE_ACCESS_TOKEN
        const squareSecret = process.env.SQUARE_APPLICATION_SECRET

        if (!squareToken || !squareSecret) return null

        return {
          ...baseConfig,
          apiKey: squareToken,
          secretKey: squareSecret,
        }

      case PaymentProvider.RAZORPAY:
        const razorpayKeyId = process.env.RAZORPAY_KEY_ID
        const razorpaySecret = process.env.RAZORPAY_KEY_SECRET

        if (!razorpayKeyId || !razorpaySecret) return null

        return {
          ...baseConfig,
          apiKey: razorpayKeyId,
          secretKey: razorpaySecret,
        }

      default:
        logger.warn(`No configuration builder for provider: ${provider}`)
        return null
    }
  }

  /**
   * Validate all configured providers
   */
  static validateAllProviders(): Record<PaymentProvider, string[]> {
    const results: Record<PaymentProvider, string[]> = {} as any

    for (const provider of Object.values(PaymentProvider)) {
      results[provider] = PaymentConfigValidator.validateEnvironment(provider)
    }

    return results
  }

  /**
   * Get list of properly configured providers
   */
  static getConfiguredProviders(): PaymentProvider[] {
    const providers: PaymentProvider[] = []

    for (const provider of Object.values(PaymentProvider)) {
      const config = this.getConfig(provider)
      if (config) {
        providers.push(provider)
      }
    }

    return providers
  }

  /**
   * Clear configuration cache
   */
  static clearCache(): void {
    this.configs.clear()
    logger.info("Payment configuration cache cleared")
  }

  /**
   * Get configuration summary for debugging
   */
  static getConfigSummary(): Record<string, any> {
    const summary: Record<string, any> = {}

    for (const provider of Object.values(PaymentProvider)) {
      const config = this.getConfig(provider)
      if (config) {
        summary[provider] = {
          environment: config.environment,
          currency: config.currency,
          timeout: config.timeout,
          retries: config.retries,
          hasApiKey: !!config.apiKey,
          hasSecretKey: !!config.secretKey,
          hasWebhookSecret: !!config.webhookSecret,
        }
      } else {
        summary[provider] = null
      }
    }    return summary
  }
}

/**
 * Security utilities for payment processing
 */
export class PaymentSecurityUtils {
  /**
   * Sanitize sensitive data for logging
   */
  static sanitizeForLogging(data: any): any {
    if (typeof data !== 'object' || data === null) {
      return data
    }

    const sensitiveKeys = [
      'apiKey', 'secretKey', 'webhookSecret', 'password', 'token',
      'card', 'cardNumber', 'cvv', 'ssn', 'bankAccount'
    ]

    const sanitized = { ...data }

    for (const key of Object.keys(sanitized)) {
      if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
        if (typeof sanitized[key] === 'string') {
          sanitized[key] = this.maskSensitiveString(sanitized[key])
        } else {
          sanitized[key] = '[REDACTED]'
        }
      } else if (typeof sanitized[key] === 'object') {
        sanitized[key] = this.sanitizeForLogging(sanitized[key])
      }
    }

    return sanitized
  }

  /**
   * Mask sensitive strings for logging
   */
  private static maskSensitiveString(value: string): string {
    if (value.length <= 8) {
      return '*'.repeat(value.length)
    }
    return `${value.substring(0, 4)}${'*'.repeat(value.length - 8)}${value.substring(value.length - 4)}`
  }

  /**
   * Validate webhook signature timing
   */
  static isValidWebhookTiming(timestamp: number, tolerance = 300): boolean {
    const now = Math.floor(Date.now() / 1000)
    return Math.abs(now - timestamp) <= tolerance
  }

  /**
   * Generate secure random string for idempotency keys
   */
  static generateIdempotencyKey(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`
  }
}

