/**
 * AIServiceFactoryV2 - Next Generation AI Service Factory
 *
 * Creates AI services using unified AIRequestContext and new infrastructure.
 * Provides centralized service instantiation with proper dependency injection.
 */

import { AIRequestContext } from '../types/context'
import { AIServiceV2 } from './AIServiceV2'
import { BasicAIServiceV2 } from './BasicAIServiceV2'
import { PremiumAIServiceV2 } from './PremiumAIServiceV2'
import { PLAN_CONFIGURATIONS, getAllAvailableModels } from '@/types/subscription-plans'
import { logger } from '@/lib/logger'

export class AIServiceFactoryV2 {
  /**
   * Create the appropriate AI service based on unified context
   */
  static createService(context: AIRequestContext): BasicAIServiceV2 | PremiumAIServiceV2 {
    const { subscription } = context

    logger.debug(`[AIServiceFactoryV2] Creating service for plan: ${subscription.plan}`)

    // Determine which service to use based on subscription tier
    switch (subscription.tier) {
      case 'free':
      case 'basic':
        return new BasicAIServiceV2(context)

      case 'premium':
      case 'enterprise':
        return new PremiumAIServiceV2(context)

      default:
        // Default to basic service for unknown tiers
        logger.warn(`Unknown subscription tier: ${subscription.tier}, defaulting to BasicAIServiceV2`)
        return new BasicAIServiceV2({
          ...context,
          subscription: {
            ...context.subscription,
            plan: 'FREE',
            tier: 'free'
          }
        })
    }
  }

  /**
   * Create service from minimal context (for backward compatibility during migration)
   * @deprecated Use createService with full AIRequestContext instead
   */
  static async createFromMinimalContext(
    userId: string,
    subscriptionPlan: string,
    isAuthenticated: boolean,
    credits?: number
  ): Promise<AIServiceV2> {
    logger.warn('[AIServiceFactoryV2] Using deprecated createFromMinimalContext method')

    // Create minimal context - in production, use AIContextProvider instead
    const minimalContext: AIRequestContext = {
      userId,
      sessionId: `session_${Date.now()}`,
      isAuthenticated,
      subscription: {
        plan: subscriptionPlan as any,
        tier: subscriptionPlan === 'FREE' ? 'free' :
              subscriptionPlan === 'BASIC' ? 'basic' :
              subscriptionPlan === 'PREMIUM' ? 'premium' : 'enterprise',
        isActive: true,
        credits: {
          available: credits || 0,
          used: 0,
          limit: credits || 0
        },
        features: []
      },
      permissions: {
        canUseAI: isAuthenticated && subscriptionPlan !== 'FREE',
        allowedFeatures: [],
        rateLimits: {
          requestsPerMinute: 10,
          requestsPerHour: 100,
          requestsPerDay: 1000,
          burstLimit: 5
        },
        featureFlags: {},
        restrictions: []
      },
      request: {
        id: `req_${Date.now()}`,
        timestamp: new Date(),
        source: 'api'
      },
      security: {
        riskScore: 0,
        requiresApproval: false,
        auditLevel: 'basic',
        encryptionLevel: 'standard',
        complianceRequirements: []
      }
    }

    return this.createService(minimalContext)
  }

  /**
   * Get service capabilities for a subscription tier
   */
  static getServiceCapabilities(tier: string): {
    supportedOperations: string[]
    modelAccess: string[]
    limits: Record<string, any>
  } {
    // Map tier to plan type
    const planTypeMap: Record<string, string> = {
      'free': 'FREE',
      'basic': 'BASIC', 
      'premium': 'PREMIUM',
      'enterprise': 'ENTERPRISE'
    }
    
    const planType = planTypeMap[tier] || 'FREE'
    const planConfig = PLAN_CONFIGURATIONS[planType as keyof typeof PLAN_CONFIGURATIONS]

    // Build supported operations from plan config
    const supportedOperations: string[] = []
    
    if (planConfig.mcqGenerator) supportedOperations.push('generateMultipleChoiceQuiz')
    if (planConfig.fillInBlanks) supportedOperations.push('generateFillInTheBlanksQuiz')
    if (planConfig.openEndedQuestions) supportedOperations.push('generateOpenEndedQuestionsQuiz')
    if (planConfig.codeQuiz) supportedOperations.push('generateCodeQuiz')
    if (planConfig.videoQuiz) supportedOperations.push('generateVideoQuiz')
    // Always include basic operations
    if (!supportedOperations.includes('generateFlashcards')) supportedOperations.push('generateFlashcardQuiz')
    if (!supportedOperations.includes('generateOrderingQuiz')) supportedOperations.push('generateOrderingQuiz')
    if (planConfig.courseCreation) supportedOperations.push('generateCourse')

    return {
      supportedOperations,
      modelAccess: getAllAvailableModels(), // Available models from centralized config
      limits: {
        maxQuestionsPerQuiz: planConfig.maxQuestionsPerQuiz,
        dailyLimit: Math.floor(planConfig.monthlyCredits / 30), // Rough daily estimate
        maxCourseLength: planConfig.aiLimits.maxCourseLength,
        maxDocumentSize: planConfig.aiLimits.maxDocumentSize
      }
    }
  }

  /**
   * Validate that a service supports an operation
   */
  static validateServiceCapability(
    context: AIRequestContext,
    operation: string
  ): { supported: boolean; reason?: string } {
    const capabilities = this.getServiceCapabilities(context.subscription.tier)

    if (!capabilities.supportedOperations.includes(operation)) {
      return {
        supported: false,
        reason: `Operation '${operation}' not supported for ${context.subscription.tier} tier`
      }
    }

    return { supported: true }
  }

  /**
   * Get service health status
   */
  static async getHealthStatus(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy'
    services: Record<string, boolean>
    details: Record<string, any>
  }> {
    const status: {
      status: 'healthy' | 'degraded' | 'unhealthy'
      services: Record<string, boolean>
      details: Record<string, any>
    } = {
      status: 'healthy',
      services: {
        subscriptionManager: true,
        tokenManager: true,
        usageTracker: true
      },
      details: {}
    }

    try {
      // Check infrastructure health
      const subscriptionManager = new (await import('../subscription/SubscriptionManager')).SubscriptionManager()
      const tokenManager = new (await import('../security/TokenManager')).TokenManager()
      const usageTracker = new (await import('../audit/UsageTracker')).UsageTracker()

      // Basic health checks
      status.details.subscriptionManager = 'operational'
      status.details.tokenManager = 'operational'
      status.details.usageTracker = 'operational'

    } catch (error) {
      status.status = 'unhealthy'
      status.details.error = error instanceof Error ? error.message : String(error)
    }

    return status
  }
}