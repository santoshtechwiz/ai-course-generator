import type { SubscriptionPlanType } from '@/types/subscription'
import { hasMinimumPlan } from './planHierarchy'
import { isFeatureEnabled as isFeatureFlagEnabled, getFeatureResult, type FeatureFlagContext } from './featureFlags'

export type FeatureType = 
  | 'pdf-generation'
  | 'quiz-access'
  | 'quiz-mcq'
  | 'quiz-blanks'
  | 'quiz-openended'
  | 'quiz-code'
  | 'quiz-flashcard'
  | 'quiz-ordering'
  | 'quiz-video'
  | 'quiz-ordering'
    | 'document-quiz'
  | 'course-videos'
  | 'course-premium-content'
  | 'course-creation'
  | 'course-access'
  | 'course-browsing'
  | 'dashboard-access'
  | 'unlimited-courses'
  | 'analytics'
  | 'export-data'

export type AccessDenialReason = 'auth' | 'subscription' | 'credits' | 'expired' | 'disabled' | null

export interface FeatureAccess {
  canAccess: boolean
  isExplorable: boolean // Always true for exploration, separate from canAccess for actions
  reason: AccessDenialReason
  requiredPlan: SubscriptionPlanType | null
  currentPlan?: SubscriptionPlanType
  isAuthenticated?: boolean
  isSubscribed?: boolean
  hasCredits?: boolean
  needsUpgrade?: boolean
}

export interface FeatureRequirement {
  requiresAuth: boolean
  requiresSubscription: boolean
  minimumPlan: SubscriptionPlanType
  requiresCredits?: boolean
  requireFeature?: (plan: SubscriptionPlanType) => boolean
}

import { SUBSCRIPTION_PLANS } from '@/types/subscription-plans'

export const FEATURE_REQUIREMENTS: Record<FeatureType, FeatureRequirement> = {
  // Exploration Features (Public Access)
  'course-browsing': {
    requiresAuth: false, // Public exploration
    requiresSubscription: false,
    minimumPlan: 'FREE'
  },
  'course-access': {
    requiresAuth: false, // Public viewing, auth for actions
    requiresSubscription: false,
    minimumPlan: 'FREE'
  },
  'dashboard-access': {
    requiresAuth: false, // Public dashboard browsing
    requiresSubscription: false,
    minimumPlan: 'FREE'
  },
  
  // Content Features
  'pdf-generation': {
    requiresAuth: true,
    requiresSubscription: true,
    minimumPlan: 'BASIC',
    requireFeature: (plan) => SUBSCRIPTION_PLANS[plan].pdfDownloads
  },
  'quiz-access': {
    requiresAuth: true, // Auth required to TAKE quizzes
    requiresSubscription: true,
    minimumPlan: 'BASIC',
    requireFeature: (plan) => SUBSCRIPTION_PLANS[plan].mcqGenerator
  },
  'quiz-mcq': {
    requiresAuth: true, // Auth required to CREATE quizzes
    requiresSubscription: false,
    minimumPlan: 'FREE',
    requiresCredits: true,
    requireFeature: (plan) => SUBSCRIPTION_PLANS[plan].mcqGenerator
  },
  'quiz-blanks': {
    requiresAuth: true,
    requiresSubscription: true,
    minimumPlan: 'BASIC',
    requiresCredits: true,
    requireFeature: (plan) => SUBSCRIPTION_PLANS[plan].fillInBlanks
  },
  'quiz-openended': {
    requiresAuth: true,
    requiresSubscription: true,
    minimumPlan: 'PREMIUM',
    requiresCredits: true,
    requireFeature: (plan) => SUBSCRIPTION_PLANS[plan].openEndedQuestions
  },
  'quiz-code': {
    requiresAuth: true,
    requiresSubscription: true,
    minimumPlan: 'PREMIUM',
    requiresCredits: true,
    requireFeature: (plan) => SUBSCRIPTION_PLANS[plan].codeQuiz
  },
  'quiz-flashcard': {
    requiresAuth: true,
    requiresSubscription: false,
    minimumPlan: 'FREE',
    requiresCredits: true,
    requireFeature: (plan) => SUBSCRIPTION_PLANS[plan].mcqGenerator
  },
  'quiz-ordering': {
    requiresAuth: true, // Auth required to CREATE ordering quizzes
    requiresSubscription: false, // Available on FREE plan with daily limits
    minimumPlan: 'FREE',
    requiresCredits: false, // Uses daily quiz generation limits instead of credits
    requireFeature: (plan) => true // All plans can access (FREE tier has 2/day, PREMIUM 10/day, PRO 50/day)
  },
  'quiz-video': {
    requiresAuth: true, // Auth required to generate video quizzes
    requiresSubscription: false, // Available on FREE plan
    minimumPlan: 'FREE',
    requiresCredits: true, // Costs 2 credits
    requireFeature: (plan) => true // All plans can access video quiz generation
  },
  'document-quiz': {
    requiresAuth: true,
    requiresSubscription: true,
    minimumPlan: 'PREMIUM',
    requiresCredits: true,
    requireFeature: (plan) => SUBSCRIPTION_PLANS[plan].contentCreation && hasMinimumPlan(plan, 'PREMIUM')
  },
  'course-videos': {
    requiresAuth: false, // Allow viewing free chapters without auth
    requiresSubscription: false, // Free chapters don't require subscription
    minimumPlan: 'FREE', // Free tier can access free chapters
    requireFeature: (plan) => true // All plans can access videos (chapter-level restrictions apply)
  },
  'course-premium-content': {
    requiresAuth: true,
    requiresSubscription: true,
    minimumPlan: 'BASIC',
    requireFeature: (plan) => SUBSCRIPTION_PLANS[plan].videoTranscripts
  },
  'course-creation': {
    requiresAuth: true,
    requiresSubscription: false,
    minimumPlan: 'FREE',
    requiresCredits: true,
    requireFeature: (plan) => SUBSCRIPTION_PLANS[plan].courseCreation
  },
  'unlimited-courses': {
    requiresAuth: true,
    requiresSubscription: true,
    minimumPlan: 'BASIC',
    requireFeature: (plan) => SUBSCRIPTION_PLANS[plan].courseCreation
  },
  'analytics': {
    requiresAuth: true,
    requiresSubscription: true,
    minimumPlan: 'PREMIUM',
    requireFeature: (plan) => SUBSCRIPTION_PLANS[plan].aiAccuracy === 'premium' || SUBSCRIPTION_PLANS[plan].aiAccuracy === 'custom'
  },
  'export-data': {
    requiresAuth: true,
    requiresSubscription: true,
    minimumPlan: 'BASIC',
    requireFeature: (plan) => SUBSCRIPTION_PLANS[plan].pdfDownloads
  },
} as const

export function checkFeatureAccess(params: {
  feature: FeatureType
  isAuthenticated: boolean
  isSubscribed: boolean
  currentPlan: SubscriptionPlanType
  hasCredits: boolean
  isExpired: boolean
}): FeatureAccess {
  const { feature, isAuthenticated, isSubscribed, currentPlan, hasCredits, isExpired } = params
  const req = FEATURE_REQUIREMENTS[feature]

  // Check if feature is enabled via feature flags
  const flagContext: FeatureFlagContext = {
    isAuthenticated,
    hasSubscription: isSubscribed,
    userPlan: currentPlan,
    hasCredits,
    environment: (process.env.NODE_ENV as any) || 'development'
  }

  const featureResult = getFeatureResult(feature, flagContext)
  if (!featureResult.enabled) {
    return { 
      canAccess: false, 
      isExplorable: true, // Always allow exploration
      reason: (featureResult.reason as any) || 'disabled', 
      requiredPlan: req?.minimumPlan || 'BASIC'
    }
  }

  if (!req) {
    return { canAccess: false, isExplorable: true, reason: 'subscription', requiredPlan: 'BASIC' }
  }

  if (req.requiresAuth && !isAuthenticated) {
    return { canAccess: false, isExplorable: true, reason: 'auth', requiredPlan: req.minimumPlan }
  }

  if (req.requiresSubscription) {
    if (isExpired) return { canAccess: false, isExplorable: true, reason: 'expired', requiredPlan: req.minimumPlan }
    if (!isSubscribed) return { canAccess: false, isExplorable: true, reason: 'subscription', requiredPlan: req.minimumPlan }
    if (!hasMinimumPlan(currentPlan, req.minimumPlan))
      return { canAccess: false, isExplorable: true, reason: 'subscription', requiredPlan: req.minimumPlan }
  }

  if (req.requiresCredits && !hasCredits) {
    return { canAccess: false, isExplorable: true, reason: 'credits', requiredPlan: req.minimumPlan }
  }

  if (req.requireFeature && !req.requireFeature(currentPlan)) {
    return { canAccess: false, isExplorable: true, reason: 'subscription', requiredPlan: req.minimumPlan }
  }

  return { canAccess: true, isExplorable: true, reason: null, requiredPlan: null }
}
