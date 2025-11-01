/**
 * AIServiceV2 - Next Generation AI Service Base Class
 *
 * Uses unified AIRequestContext for consistent identity, subscription, and security information.
 * Integrates with new infrastructure components for centralized management.
 */

import { AIRequestContext } from '../types/context'
import { AIServiceResult, AIRequestOptions } from './AIBaseService'
import type { AIModelName } from '@/config/ai.config'
import { SubscriptionManager } from '../subscription/SubscriptionManager'
import { TokenManager } from '../security/TokenManager'
import { UsageTracker } from '../audit/UsageTracker'
import { AIProvider } from '../interfaces'
import { logger } from '@/lib/logger'

export abstract class AIServiceV2 {
  protected context: AIRequestContext
  protected subscriptionManager: SubscriptionManager
  protected tokenManager: TokenManager
  protected usageTracker: UsageTracker

  constructor(context: AIRequestContext) {
    this.context = context
    this.subscriptionManager = new SubscriptionManager()
    this.tokenManager = new TokenManager()
    this.usageTracker = new UsageTracker()
  }

  /**
   * Execute AI operation with unified context and infrastructure
   */
  protected async executeWithContext<T>(
    operation: string,
    params: any,
    creditCost: number
  ): Promise<AIServiceResult<any>> {
    const startTime = Date.now()

    try {
      // 1. Validate access and deduct credits atomically
      const accessResult = await this.subscriptionManager.validateAccess(
        this.context.subscription,
        operation,
        this.context.request.id
      )

      if (!accessResult.granted) {
        return {
          success: false,
          error: accessResult.reason || 'Access denied',
          errorCode: 'ACCESS_DENIED'
        }
      }

      // 2. Deduct credits atomically
      const deductionResult = await this.subscriptionManager.deductCredits(
        this.context.userId,
        creditCost,
        operation,
        this.context.request.id,
        {
          description: `${operation} execution`,
          model: this.getModelForOperation(operation)
        }
      )

      if (!deductionResult.success) {
        return {
          success: false,
          error: deductionResult.error || 'Credit deduction failed',
          errorCode: 'CREDIT_DEDUCTION_FAILED'
        }
      }

      // 3. Get authenticated provider
      const provider = await this.tokenManager.getProvider(
        this.context,
        this.getModelForOperation(operation)
      )

      // 4. Execute operation
      const result = await this.executeOperation(provider, params)
      const duration = Date.now() - startTime

      // 5. Track usage for audit and analytics
      await this.usageTracker.trackUsage(this.context, {
        name: operation,
        model: this.getModelForOperation(operation),
        tokens: result.usage?.tokensUsed || 0,
        credits: creditCost,
        duration,
        success: result.success,
        error: result.error,
        metadata: {
          provider: this.getProviderForModel(this.getModelForOperation(operation)),
          featureType: operation
        }
      })

      // 6. Update context with new credit balance
      this.context = {
        ...this.context,
        subscription: {
          ...this.context.subscription,
          credits: {
            ...this.context.subscription.credits,
            available: deductionResult.newBalance
          }
        }
      }

      logger.info(`[AIServiceV2] Operation ${operation} completed successfully`, {
        userId: this.context.userId,
        duration,
        creditsUsed: creditCost,
        requestId: this.context.request.id
      })

      return result

    } catch (error) {
      const duration = Date.now() - startTime

      // Track failed usage
      await this.usageTracker.trackUsage(this.context, {
        name: operation,
        model: this.getModelForOperation(operation),
        tokens: 0,
        credits: 0, // Don't charge for failures
        duration,
        success: false,
        error: error instanceof Error ? error.message : String(error)
      })

      logger.error(`[AIServiceV2] Operation ${operation} failed`, {
        userId: this.context.userId,
        error: error instanceof Error ? error.message : String(error),
        requestId: this.context.request.id
      })

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        errorCode: 'OPERATION_FAILED'
      }
    }
  }

  /**
   * Execute the actual AI operation (implemented by subclasses)
   */
  protected abstract executeOperation(
    provider: AIProvider,
    params: any
  ): Promise<AIServiceResult<any>>

  /**
   * Get the appropriate model for an operation
   */
  protected abstract getModelForOperation(operation: string): AIModelName

  /**
   * Get provider name for a model
   */
  private getProviderForModel(model: AIModelName): string {
    const modelProviders: Record<string, string> = {
      'gpt-4o-mini': 'openai',
      'gpt-4o': 'openai',
      'gpt-4-turbo': 'openai',
      'gpt-3.5-turbo': 'openai',
      'gemini-1.5-flash': 'google',
      'gemini-1.5-pro': 'google',
      'gemini-pro': 'google'
    }

    return modelProviders[model] || 'unknown'
  }

  /**
   * Get current context (for testing/debugging)
   */
  getContext(): AIRequestContext {
    return this.context
  }

  /**
   * Update context (e.g., after credit changes)
   */
  updateContext(updates: Partial<AIRequestContext>): void {
    this.context = { ...this.context, ...updates }
  }
}