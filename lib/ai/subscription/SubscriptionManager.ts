/**
 * Subscription Manager
 *
 * Centralizes subscription logic, feature gating, and credit validation.
 * Provides atomic operations for credit management and access control.
 */

import { SubscriptionPlanType, SubscriptionPlanType as SubscriptionPlans, PLAN_CONFIGURATIONS } from '@/types/subscription-plans'
import { SubscriptionContext, PermissionContext, SubscriptionTier, RateLimitConfig } from '../types/context'
import { creditService, CreditOperationType } from '@/services/credit-service'
import { getPlanLimits, getRateLimits } from '@/config/ai.config'
import { logger } from '@/lib/logger'
import { prisma } from '@/lib/db'
import type { FeatureFlagName } from '@/lib/featureFlags/types'

export class SubscriptionManager {
  /**
   * Get complete subscription context for a user
   */
  async getUserSubscription(userId: string, requestId: string): Promise<SubscriptionContext> {
    try {
      logger.debug(`[SubscriptionManager] Loading subscription for user ${userId} (${requestId})`)

      // Get user data with subscription info
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          userType: true,
          credits: true,
          creditsUsed: true,
          isActive: true,
          // subscriptionExpiresAt: true, // This field doesn't exist on User model
          // Add any other subscription-related fields
        }
      })

      if (!user) {
        throw new Error(`User not found: ${userId}`)
      }

      // Map user type to subscription plan
      const plan = this.mapUserTypeToPlan(user.userType as SubscriptionPlanType || 'FREE')
      const tier = this.mapPlanToTier(plan)

      // Calculate credit information
      const credits = {
        available: Math.max(0, (user.credits || 0) - (user.creditsUsed || 0)),
        used: user.creditsUsed || 0,
        limit: user.credits || 0
      }

      // Get available features for this plan
      const features = await this.getFeaturesForPlan(plan)

      const subscription: SubscriptionContext = {
        plan,
        tier,
        isActive: user.isActive !== false, // Default to true if not set
        expiresAt: undefined, // TODO: Get from UserSubscription model if needed
        credits,
        features
      }

      logger.debug(`[SubscriptionManager] Loaded subscription for ${userId}: ${plan} (${credits.available} credits)`)

      return subscription

    } catch (error) {
      logger.error(`[SubscriptionManager] Failed to load subscription for ${userId} (${requestId}):`, error)
      throw error
    }
  }

  /**
   * Get permissions for a subscription plan
   */
  async getPermissionsForSubscription(plan: SubscriptionPlanType): Promise<PermissionContext> {
    const rateLimits = getRateLimits(plan)
    const features = await this.getFeaturesForPlan(plan)

    // Determine if plan can use AI
    const canUseAI = plan !== 'FREE' || features.length > 0

    return {
      canUseAI,
      allowedFeatures: features,
      rateLimits: {
        requestsPerMinute: rateLimits.requestsPerMinute,
        requestsPerHour: rateLimits.requestsPerHour,
        requestsPerDay: rateLimits.requestsPerDay,
        burstLimit: Math.min(rateLimits.requestsPerMinute, 10) // Reasonable burst limit
      },
      featureFlags: this.getFeatureFlagsForPlan(plan),
      restrictions: this.getRestrictionsForPlan(plan)
    }
  }

  /**
   * Validate access to a specific feature
   */
  async validateAccess(context: SubscriptionContext, feature: string, requestId: string): Promise<{
    granted: boolean
    reason?: string
    creditCost?: number
  }> {
    try {
      // Check if subscription is active
      if (!context.isActive) {
        return { granted: false, reason: 'subscription_inactive' }
      }

      // Check if feature is available for this plan
      const planConfig = PLAN_CONFIGURATIONS[context.plan]
      
      const featureAvailability: Record<string, boolean> = {
        'quiz-mcq': planConfig.mcqGenerator,
        'quiz-blanks': planConfig.fillInBlanks,
        'quiz-openended': planConfig.openEndedQuestions,
        'quiz-code': planConfig.codeQuiz,
        'quiz-video': planConfig.videoQuiz,
        'quiz-flashcard': true, // Flashcards available for all plans
        'quiz-ordering': true, // Ordering quiz available for all plans
        'course-creation': planConfig.courseCreation,
        'content-creation': planConfig.contentCreation,
      }

      if (!(feature in featureAvailability) || !featureAvailability[feature]) {
        return { granted: false, reason: 'feature_not_available' }
      }

      // Check credit availability
      const creditCost = planConfig.creditCosts[feature as keyof typeof planConfig.creditCosts] || 0
      
      if (context.credits.available < creditCost) {
        return { granted: false, reason: 'insufficient_credits' }
      }

      logger.debug(`[SubscriptionManager] Access granted for ${feature} (${requestId})`)
      return { granted: true, creditCost }

    } catch (error) {
      logger.error(`[SubscriptionManager] Access validation failed for ${feature} (${requestId}):`, error)
      return { granted: false, reason: 'validation_error' }
    }
  }

  /**
   * Atomically deduct credits for a feature usage
   */
  async deductCredits(
    userId: string,
    amount: number,
    operation: string,
    requestId: string,
    metadata?: Record<string, any>
  ): Promise<{
    success: boolean
    newBalance: number
    transactionId?: string
    error?: string
  }> {
    try {
      logger.debug(`[SubscriptionManager] Deducting ${amount} credits for ${operation} (${requestId})`)

      const result = await creditService.executeCreditsOperation(
        userId,
        amount,
        operation as CreditOperationType,
        {
          ...metadata,
          requestId,
          timestamp: new Date().toISOString()
        }
      )

      if (result.success) {
        logger.info(`[SubscriptionManager] Deducted ${amount} credits for ${userId}, new balance: ${result.newBalance} (${requestId})`)
      } else {
        logger.warn(`[SubscriptionManager] Credit deduction failed for ${userId}: ${result.error} (${requestId})`)
      }

      return result

    } catch (error) {
      logger.error(`[SubscriptionManager] Credit deduction error for ${userId} (${requestId}):`, error)
      return {
        success: false,
        newBalance: 0,
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }

  /**
   * Check rate limits for a user
   */
  async checkRateLimit(userId: string, feature: string, requestId: string): Promise<{
    allowed: boolean
    remaining: number
    resetTime: Date
  }> {
    // TODO: Implement actual rate limiting with Redis
    // For now, return always allowed
    return {
      allowed: true,
      remaining: 100,
      resetTime: new Date(Date.now() + 60 * 1000) // 1 minute from now
    }
  }

  /**
   * Get available features for a subscription plan
   */
  private async getFeaturesForPlan(plan: SubscriptionPlanType): Promise<string[]> {
    const features: string[] = []
    const planConfig = PLAN_CONFIGURATIONS[plan]

    // Map plan config features to feature keys
    const featureMappings: Record<string, boolean> = {
      'quiz-mcq': planConfig.mcqGenerator,
      'quiz-blanks': planConfig.fillInBlanks,
      'quiz-openended': planConfig.openEndedQuestions,
      'quiz-code': planConfig.codeQuiz,
      'quiz-video': planConfig.videoQuiz,
      'course-creation': planConfig.courseCreation,
      'content-creation': planConfig.contentCreation,
      'document-quiz': planConfig.fillInBlanks, // Document quiz requires fillInBlanks
    }

    // Add available features
    for (const [featureKey, isAvailable] of Object.entries(featureMappings)) {
      if (isAvailable) {
        features.push(featureKey)
      }
    }

    return features
  }

  /**
   * Get feature flags for a plan
   */
  private getFeatureFlagsForPlan(plan: SubscriptionPlanType): Record<string, boolean> {
    const planConfig = PLAN_CONFIGURATIONS[plan]
    return planConfig.featureFlags
  }

  /**
   * Get restrictions for a plan
   */
  private getRestrictionsForPlan(plan: SubscriptionPlanType): string[] {
    const restrictions: string[] = []

    if (plan === 'FREE') {
      restrictions.push('limited_quiz_types', 'daily_limits')
    }

    return restrictions
  }

  /**
   * Map user type to subscription plan
   */
  private mapUserTypeToPlan(userType: string): SubscriptionPlanType {
    const validPlans: SubscriptionPlanType[] = ['FREE', 'BASIC', 'PREMIUM', 'ENTERPRISE']
    const plan = userType as SubscriptionPlanType

    return validPlans.includes(plan) ? plan : 'FREE'
  }

  /**
   * Map subscription plan to tier
   */
  private mapPlanToTier(plan: SubscriptionPlanType): SubscriptionTier {
    const tierMap: Record<SubscriptionPlanType, SubscriptionTier> = {
      'FREE': 'free',
      'BASIC': 'basic',
      'PREMIUM': 'premium',
      'ENTERPRISE': 'enterprise'
    }

    return tierMap[plan] || 'free'
  }

  /**
   * Check if a specific feature flag is enabled for a plan
   */
  isFeatureEnabledForPlan(plan: SubscriptionPlanType, featureFlag: FeatureFlagName): boolean {
    const planConfig = PLAN_CONFIGURATIONS[plan]
    return planConfig.featureFlags[featureFlag] || false
  }
}