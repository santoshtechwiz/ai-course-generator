/**
 * Feature Flag Type Definitions
 * Centralized type system for feature flag management
 */

import type { SubscriptionPlanType } from '@/types/subscription'

export interface FeatureFlag {
  enabled: boolean
  environments?: string[]
  userGroups?: string[]
  rolloutPercentage?: number
  dependencies?: string[]
  routes?: string[]
  minimumPlan?: SubscriptionPlanType
  requiresAuth?: boolean
  requiresSubscription?: boolean
  requiresCredits?: boolean
  description: string
  version?: string
  deprecatedAt?: string
  removedAt?: string
}

export interface RouteFeatureConfig {
  feature: string
  featureFlag: string
  fallbackRoute?: string
  allowPublicAccess?: boolean
  customCheck?: (req: any) => boolean
}

export interface FeatureFlagContext {
  userId?: string
  userPlan?: SubscriptionPlanType
  userGroups?: string[]
  environment: string
  isAuthenticated: boolean
  hasSubscription: boolean
  hasCredits: boolean
}

export interface FeatureFlagResult {
  enabled: boolean
  reason?: string
  fallbackRoute?: string
  metadata?: Record<string, any>
}

export type FeatureFlagName = 
  | 'route-protection'
  | 'subscription-enforcement'
  | 'admin-panel'
  | 'quiz-creation'
  | 'course-creation'
  | 'pdf-generation'
  | 'analytics'
  | 'beta-features'
  | 'enhanced-analytics'
  | 'ai-recommendations'
  | 'collaborative-courses'
  | 'middleware-caching'
  | 'performance-monitoring'
  | 'dashboard-access'
  | 'course-browsing'
  | 'course-access'
  | 'quiz-access'
  | 'admin-access'
  | 'quiz-mcq'
  | 'quiz-openended'
  | 'quiz-blanks'
  | 'quiz-code'
  | 'quiz-flashcard'

export type EnvironmentType = 'development' | 'staging' | 'production' | 'test'