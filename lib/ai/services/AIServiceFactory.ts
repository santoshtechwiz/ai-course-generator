/**
 * AIServiceFactory - Factory for creating appropriate AI service based on subscription tier
 * 
 * Implements the Factory design pattern to return the correct service implementation
 * based on the user's subscription plan.
 */

import type { SubscriptionPlanType } from '@/types/subscription-plans'
import { AIBaseService, type AIServiceContext } from './AIBaseService'
import BasicAIService from './BasicAIService'
import PremiumAIService from './PremiumAIService'

export class AIServiceFactory {
  /**
   * Create the appropriate AI service based on subscription tier
   */
  static createService(context: AIServiceContext): AIBaseService {
    const { subscriptionPlan } = context

    // Determine which service to use based on plan
    switch (subscriptionPlan) {
      case 'FREE':
      case 'BASIC':
        return new BasicAIService(context)

      case 'PREMIUM':
      case 'ENTERPRISE':
        return new PremiumAIService(context)

      default:
        // Default to BasicAIService for unknown plans
        console.warn(`Unknown subscription plan: ${subscriptionPlan}, defaulting to BasicAIService`)
        return new BasicAIService({
          ...context,
          subscriptionPlan: 'FREE',
        })
    }
  }

  /**
   * Helper method to create service from user session
   */
  static async createFromSession(
    userId: string | undefined,
    subscriptionPlan: SubscriptionPlanType,
    isAuthenticated: boolean,
    credits?: number
  ): Promise<AIBaseService> {
    const context: AIServiceContext = {
      userId,
      subscriptionPlan,
      isAuthenticated,
      credits,
    }

    return this.createService(context)
  }

  /**
   * Quick check if a plan can access a specific feature
   */
  static canPlanAccessFeature(
    plan: SubscriptionPlanType,
    featureType: string
  ): boolean {
    // Create a temporary service to check feature access
    const tempContext: AIServiceContext = {
      userId: undefined,
      subscriptionPlan: plan,
      isAuthenticated: true,
      credits: 100, // Assume credits available for check
    }

    const service = this.createService(tempContext)
    
    // Check if method exists
    const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(service))
    return methods.includes(featureType)
  }

  /**
   * Get the service class name for a given plan
   */
  static getServiceType(plan: SubscriptionPlanType): string {
    switch (plan) {
      case 'FREE':
      case 'BASIC':
        return 'BasicAIService'
      case 'PREMIUM':
      case 'ENTERPRISE':
        return 'PremiumAIService'
      default:
        return 'BasicAIService'
    }
  }

  /**
   * Check if a plan is eligible for premium features
   */
  static isPremiumPlan(plan: SubscriptionPlanType): boolean {
    return plan === 'PREMIUM' || plan === 'ENTERPRISE'
  }

  /**
   * Check if a plan is eligible for basic features
   */
  static isBasicOrHigher(plan: SubscriptionPlanType): boolean {
    return ['BASIC', 'PREMIUM', 'ENTERPRISE'].includes(plan)
  }
}

export default AIServiceFactory
