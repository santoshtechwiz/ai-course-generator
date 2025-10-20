/**
 * AI Service Context Helper
 * 
 * Utility functions to create AIServiceContext from various sources
 */

import type { Session } from 'next-auth'
import type { SubscriptionPlanType } from '@/types/subscription'
import type { AIServiceContext } from '@/lib/ai/services'

/**
 * Create AIServiceContext from NextAuth session
 */
export function createContextFromSession(session: Session | null): AIServiceContext {
  if (!session || !session.user) {
    return {
      userId: undefined,
      subscriptionPlan: 'FREE',
      isAuthenticated: false,
      credits: 0,
    }
  }

  // Map userType to SubscriptionPlanType
  const userType = session.user.userType || 'FREE'
  const subscriptionPlan: SubscriptionPlanType = 
    (userType.toUpperCase() as SubscriptionPlanType) || 'FREE'

  return {
    userId: session.user.id,
    subscriptionPlan,
    isAuthenticated: true,
    credits: session.user.credits || 0,
  }
}

/**
 * Create AIServiceContext from individual parameters
 */
export function createContext(
  userId: string | undefined,
  userType: string = 'FREE',
  isAuthenticated: boolean = false,
  credits: number = 0
): AIServiceContext {
  const subscriptionPlan: SubscriptionPlanType = 
    (userType.toUpperCase() as SubscriptionPlanType) || 'FREE'

  return {
    userId,
    subscriptionPlan,
    isAuthenticated,
    credits,
  }
}

/**
 * Map legacy userType to SubscriptionPlanType
 */
export function mapUserTypeToSubscriptionPlan(userType: string): SubscriptionPlanType {
  const normalized = userType.toUpperCase()
  
  switch (normalized) {
    case 'FREE':
      return 'FREE'
    case 'BASIC':
      return 'BASIC'
    case 'PREMIUM':
    case 'PRO': // Map PRO to PREMIUM for backward compatibility
      return 'PREMIUM'
    case 'ENTERPRISE':
      return 'ENTERPRISE'
    default:
      return 'FREE'
  }
}
