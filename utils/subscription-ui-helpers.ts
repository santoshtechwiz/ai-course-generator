/**
 * Subscription UI Helper Functions
 * 
 * Centralized utility functions for rendering subscription-related UI components.
 * Reduces code duplication across PricingPage, PlanCard, and FeatureComparison.
 */

import { ReactNode } from 'react'
import type { SubscriptionPlanType, SubscriptionStatusType } from '@/types/subscription'
import { getPlanConfig, type PlanConfig } from '@/types/subscription-plans'

// ============================================================================
// FEATURE LIST BUILDER
// ============================================================================

/**
 * Feature display configuration
 */
interface FeatureDisplay {
  name: string
  available: boolean
  category?: string
}

/**
 * Build human-readable feature list from plan configuration
 * 
 * @param planConfig - The plan configuration object
 * @param includeCategories - Whether to include category information
 * @returns Array of feature strings or FeatureDisplay objects
 * 
 * @example
 * const features = buildFeatureList(planConfig)
 * // Returns: ['Course Creation', 'PDF Downloads', 'MCQ Generator', ...]
 */
export function buildFeatureList(planConfig: PlanConfig, includeCategories = false): string[] | FeatureDisplay[] {
  const features: FeatureDisplay[] = [
    // Core Features
    { name: 'Course Creation', available: planConfig.courseCreation, category: 'Core Features' },
    { name: 'Content Creation', available: planConfig.contentCreation, category: 'Core Features' },
    { name: 'PDF Downloads', available: planConfig.pdfDownloads, category: 'Core Features' },
    { name: 'Video Transcripts', available: planConfig.videoTranscripts, category: 'Core Features' },
    
    // Quiz Types
    { name: 'MCQ Generator', available: planConfig.mcqGenerator, category: 'Quiz Types' },
    { name: 'Fill in the Blanks', available: planConfig.fillInBlanks, category: 'Quiz Types' },
    { name: 'Open-ended Questions', available: planConfig.openEndedQuestions, category: 'Quiz Types' },
    { name: 'Code Quiz', available: planConfig.codeQuiz, category: 'Quiz Types' },
    { name: 'Video Quiz', available: planConfig.videoQuiz, category: 'Quiz Types' },
    
    // Support & Services
    { name: 'Priority Support', available: planConfig.prioritySupport, category: 'Support & Services' },
  ]
  
  // Filter to only available features
  const availableFeatures = features.filter(f => f.available)
  
  // Add limits as features
  const limitFeatures: FeatureDisplay[] = [
    {
      name: `Up to ${planConfig.maxQuestionsPerQuiz === 'unlimited' ? '∞' : planConfig.maxQuestionsPerQuiz} questions per quiz`,
      available: true,
      category: 'Limits & Credits'
    },
    {
      name: `${planConfig.monthlyCredits} AI credits per month`,
      available: true,
      category: 'Limits & Credits'
    },
    {
      name: `AI Accuracy: ${planConfig.aiAccuracy}`,
      available: true,
      category: 'Advanced Features'
    }
  ]
  
  const allFeatures = [...availableFeatures, ...limitFeatures]
  
  // Return with or without category information
  if (includeCategories) {
    return allFeatures
  }
  
  return allFeatures.map(f => f.name)
}

/**
 * Group features by category
 * 
 * @param features - Array of FeatureDisplay objects
 * @returns Features grouped by category
 */
function groupFeaturesByCategory(features: FeatureDisplay[]): Record<string, FeatureDisplay[]> {
  return features.reduce((acc, feature) => {
    const category = feature.category || 'Other'
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(feature)
    return acc
  }, {} as Record<string, FeatureDisplay[]>)
}

// ============================================================================
// PRICE FORMATTING
// ============================================================================

/**
 * Format price with currency symbol
 * 
 * @param price - Price in dollars
 * @param currency - Currency symbol (default: '$')
 * @returns Formatted price string
 * 
 * @example
 * formatPrice(9.99) // Returns: "$9.99"
 * formatPrice(0) // Returns: "$0"
 */
function formatPrice(price: number, currency = '$'): string {
  if (price === 0) {
    return `${currency}0`
  }
  return `${currency}${price.toFixed(2)}`
}

/**
 * Calculate and format discounted price
 * 
 * @param originalPrice - Original price in dollars
 * @param discountPercent - Discount percentage (0-100)
 * @returns Object with original and discounted price strings
 * 
 * @example
 * formatDiscountedPrice(9.99, 20)
 * // Returns: { original: "$9.99", discounted: "$7.99", savings: "$2.00" }
 */
function formatDiscountedPrice(
  originalPrice: number,
  discountPercent: number
): { original: string; discounted: string; savings: string } {
  const discountedPrice = originalPrice * (1 - discountPercent / 100)
  const savings = originalPrice - discountedPrice
  
  return {
    original: formatPrice(originalPrice),
    discounted: formatPrice(discountedPrice),
    savings: formatPrice(savings)
  }
}

/**
 * Get price display configuration for a plan
 * 
 * @param planConfig - Plan configuration
 * @param hasPromo - Whether promo code is applied
 * @param promoDiscount - Promo discount percentage
 * @returns Price display configuration
 */
export function getPriceDisplay(
  planConfig: PlanConfig,
  hasPromo = false,
  promoDiscount = 0
): {
  displayPrice: string
  originalPrice?: string
  hasDiscount: boolean
  savings?: string
} {
  const basePrice = planConfig.price
  
  if (!hasPromo || promoDiscount === 0) {
    return {
      displayPrice: formatPrice(basePrice),
      hasDiscount: false
    }
  }
  
  const { original, discounted, savings } = formatDiscountedPrice(basePrice, promoDiscount)
  
  return {
    displayPrice: discounted,
    originalPrice: original,
    hasDiscount: true,
    savings
  }
}

// ============================================================================
// PLAN BUTTON CONFIGURATION
// ============================================================================

/**
 * Context for determining button configuration
 */
interface PlanButtonContext {
  planId: SubscriptionPlanType
  currentPlan: SubscriptionPlanType | null
  status: SubscriptionStatusType | null
  isAuthenticated: boolean
  isSubscribed: boolean
  hasAnyPaidPlan: boolean
  hasAllPlans: boolean
  cancelAtPeriodEnd: boolean
  hadPreviousPaidPlan: boolean
  isLoading: boolean
  isPlanAvailable: boolean
}

/**
 * Button configuration result
 */
interface PlanButtonConfig {
  text: string
  disabled: boolean
  variant: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost'
  reason?: string
}

/**
 * Get button configuration for a subscription plan
 * 
 * @param context - Plan button context
 * @returns Button configuration
 * 
 * @example
 * const buttonConfig = getPlanButtonConfig({
 *   planId: 'PREMIUM',
 *   currentPlan: 'BASIC',
 *   status: 'ACTIVE',
 *   isAuthenticated: true,
 *   isSubscribed: true,
 *   // ... other context
 * })
 * // Returns: { text: 'Upgrade to Premium', disabled: false, variant: 'default' }
 */
export function getPlanButtonConfig(context: PlanButtonContext): PlanButtonConfig {
  const {
    planId,
    currentPlan,
    status,
    isAuthenticated,
    isSubscribed,
    hasAnyPaidPlan,
    hasAllPlans,
    cancelAtPeriodEnd,
    hadPreviousPaidPlan,
    isLoading,
    isPlanAvailable
  } = context
  
  const normalizedStatus = status?.toUpperCase().replace('CANCELLED', 'CANCELED') as SubscriptionStatusType | null
  const isCurrentActivePlan = isSubscribed && currentPlan === planId
  
  // Loading state
  if (isLoading) {
    return {
      text: 'Processing...',
      disabled: true,
      variant: 'default'
    }
  }
  
  // Authenticated user logic
  if (isAuthenticated) {
    // Current active plan
    if (isCurrentActivePlan) {
      if (planId === 'FREE') {
        return {
          text: 'Current Free Plan',
          disabled: true,
          variant: 'outline',
          reason: 'You are currently on the free plan'
        }
      }
      return {
        text: cancelAtPeriodEnd ? 'Cancels Soon' : 'Current Plan',
        disabled: true,
        variant: cancelAtPeriodEnd ? 'destructive' : 'outline',
        reason: cancelAtPeriodEnd 
          ? 'Your subscription will cancel at the end of the period'
          : 'This is your current active plan'
      }
    }
    
    // All plans active (unlikely but handled)
    if (hasAllPlans) {
      return {
        text: 'All Plans Active',
        disabled: true,
        variant: 'outline',
        reason: 'You have access to all plans'
      }
    }
    
    // FREE plan special handling
    if (planId === 'FREE') {
      // Currently on free plan
      if (currentPlan === 'FREE' && normalizedStatus === 'ACTIVE') {
        return {
          text: 'Current Free Plan',
          disabled: true,
          variant: 'outline',
          reason: 'You are currently on the free plan'
        }
      }
      
      // Has paid plan, trying to downgrade
      if (hasAnyPaidPlan) {
        return {
          text: 'Downgrade to Free',
          disabled: true,
          variant: 'destructive',
          reason: 'Downgrades are not permitted. Wait for your subscription to expire.'
        }
      }
      
      // Had paid plan before
      if (hadPreviousPaidPlan) {
        return {
          text: 'Free Plan Used',
          disabled: true,
          variant: 'outline',
          reason: 'You cannot return to the free plan after using a paid plan'
        }
      }
      
      // Plan not available
      if (!isPlanAvailable) {
        return {
          text: 'Free Plan Used',
          disabled: true,
          variant: 'outline',
          reason: 'Free plan is no longer available for your account'
        }
      }
    }
    
    // Inactive/Canceled status
    if (normalizedStatus === 'INACTIVE' || normalizedStatus === 'CANCELED') {
      if (planId === 'FREE') {
        return {
          text: hadPreviousPaidPlan ? 'Downgrade to Free' : 'Free Plan Used',
          disabled: hadPreviousPaidPlan,
          variant: hadPreviousPaidPlan ? 'destructive' : 'default',
          reason: hadPreviousPaidPlan ? 'Cannot downgrade to free plan' : undefined
        }
      }
      return {
        text: hadPreviousPaidPlan ? 'Reactivate Plan' : 'Subscribe Now',
        disabled: false,
        variant: 'default'
      }
    }
    
    // Plan not available
    if (!isPlanAvailable) {
      return {
        text: 'Unavailable',
        disabled: true,
        variant: 'outline',
        reason: 'This plan is not available for your account'
      }
    }
    
    // Different paid plan while active subscription exists
    if (hasAnyPaidPlan && normalizedStatus === 'ACTIVE' && planId !== currentPlan) {
      return {
        text: 'Switch Plans',
        disabled: true,
        variant: 'outline',
        reason: 'You cannot switch plans while your current subscription is active'
      }
    }
  }
  
  // Unauthenticated user (simple)
  if (planId === 'FREE') {
    return {
      text: 'Start for Free',
      disabled: false,
      variant: 'outline'
    }
  }
  
  return {
    text: 'Subscribe Now',
    disabled: false,
    variant: 'default'
  }
}

// ============================================================================
// PLAN STATUS & STYLING
// ============================================================================

/**
 * Context for determining plan status
 */
interface PlanStatusContext {
  planId: SubscriptionPlanType
  currentPlan: SubscriptionPlanType | null
  status: SubscriptionStatusType | null
  isSubscribed: boolean
  cancelAtPeriodEnd: boolean
  isBestValue?: boolean
  isAuthenticated: boolean
}

/**
 * Plan status configuration result
 */
interface PlanStatusConfig {
  badge?: {
    text: string
    variant: 'default' | 'destructive' | 'outline' | 'secondary'
  }
  cardClass: string
  bannerText?: string
  bannerClass?: string
}

/**
 * Get plan status configuration (badge, styling, banner)
 * 
 * @param context - Plan status context
 * @returns Status configuration
 * 
 * @example
 * const statusConfig = getPlanStatus({
 *   planId: 'PREMIUM',
 *   currentPlan: 'PREMIUM',
 *   status: 'ACTIVE',
 *   isSubscribed: true,
 *   cancelAtPeriodEnd: false,
 *   isBestValue: true,
 *   isAuthenticated: true
 * })
 * // Returns: { badge: { text: 'Active', variant: 'default' }, cardClass: '...', bannerText: 'Current Plan' }
 */
export function getPlanStatus(context: PlanStatusContext): PlanStatusConfig {
  const {
    planId,
    currentPlan,
    status,
    isSubscribed,
    cancelAtPeriodEnd,
    isBestValue,
    isAuthenticated
  } = context
  
  const normalizedStatus = status?.toUpperCase().replace('CANCELLED', 'CANCELED') as SubscriptionStatusType | null
  const isPlanActive = currentPlan === planId
  const isCurrentActivePlan = isSubscribed && isPlanActive
  
  const result: PlanStatusConfig = {
    cardClass: 'shadow-[var(--shadow-neo)]'
  }
  
  // Authenticated user - show active plan styling
  if (isAuthenticated && isPlanActive && normalizedStatus === 'ACTIVE') {
    result.badge = {
      text: cancelAtPeriodEnd ? 'Cancelling' : 'Active',
      variant: cancelAtPeriodEnd ? 'destructive' : 'default'
    }
    
    result.cardClass = cancelAtPeriodEnd
      ? 'border-6 border-[var(--color-warning)] dark:border-[var(--color-warning)]'
      : 'border-6 border-[var(--color-success)] dark:border-[var(--color-success)]'
    
    result.bannerText = cancelAtPeriodEnd ? 'Cancels at Period End' : 'Current Plan'
    result.bannerClass = cancelAtPeriodEnd ? 'bg-[var(--color-warning)]' : 'bg-[var(--color-success)]'
  }
  
  // Canceled plan styling
  if (isAuthenticated && isPlanActive && normalizedStatus === 'CANCELED') {
    result.badge = {
      text: 'Canceled',
      variant: 'destructive'
    }
    result.cardClass = 'border-6 border-[var(--color-warning)] dark:border-[var(--color-warning)]'
  }
  
  // Best value styling (if not current plan)
  if (isBestValue && !isCurrentActivePlan) {
    result.cardClass = 'shadow-lg ring-1 ring-primary'
    result.bannerText = 'Most Popular'
    result.bannerClass = 'bg-primary'
  }
  
  return result
}

// ============================================================================
// FEATURE RENDERING
// ============================================================================

/**
 * Get icon component for feature availability
 * 
 * @param available - Whether the feature is available
 * @returns Icon name for Lucide React
 */
function getFeatureIcon(available: boolean): 'check' | 'x' {
  return available ? 'check' : 'x'
}

/**
 * Get icon color class for feature availability
 * 
 * @param available - Whether the feature is available
 * @returns Tailwind color class
 */
function getFeatureIconColor(available: boolean): string {
  return available ? 'text-success' : 'text-muted-foreground'
}

/**
 * Format feature value for display
 * 
 * @param value - Feature value (boolean, string, or number)
 * @returns Formatted display value
 * 
 * @example
 * formatFeatureValue(true) // Returns: { type: 'icon', value: true }
 * formatFeatureValue('enhanced') // Returns: { type: 'text', value: 'enhanced' }
 * formatFeatureValue(100) // Returns: { type: 'text', value: '100' }
 */
function formatFeatureValue(
  value: boolean | string | number
): { type: 'icon' | 'text'; value: boolean | string } {
  if (typeof value === 'boolean') {
    return { type: 'icon', value }
  }
  
  if (typeof value === 'number') {
    return { type: 'text', value: value.toString() }
  }
  
  return { type: 'text', value }
}

// ============================================================================
// PLAN DISPLAY HELPERS
// ============================================================================

/**
 * Get display name for a plan
 * 
 * @param planId - Plan ID
 * @returns Human-readable plan name
 */
function getPlanDisplayName(planId: SubscriptionPlanType): string {
  const names: Record<SubscriptionPlanType, string> = {
    FREE: 'Free Plan',
    BASIC: 'Basic Plan',
    PREMIUM: 'Premium Plan',
    ENTERPRISE: 'Enterprise Plan'
  }
  
  return names[planId] || planId
}

/**
 * Get short description for a plan
 * 
 * @param planId - Plan ID
 * @returns Short plan description
 */
function getPlanDescription(planId: SubscriptionPlanType): string {
  const descriptions: Record<SubscriptionPlanType, string> = {
    FREE: 'Perfect for getting started',
    BASIC: 'Great for individuals and small projects',
    PREMIUM: 'Best for professionals and growing teams',
    ENTERPRISE: 'Advanced features for large organizations'
  }
  
  return descriptions[planId] || ''
}

/**
 * Check if plan is paid
 * 
 * @param planId - Plan ID
 * @returns Whether plan is paid
 */
function isPaidPlan(planId: SubscriptionPlanType): boolean {
  return planId !== 'FREE'
}

/**
 * Compare plans by tier (for upgrade/downgrade logic)
 * 
 * @param plan1 - First plan ID
 * @param plan2 - Second plan ID
 * @returns -1 if plan1 < plan2, 0 if equal, 1 if plan1 > plan2
 */
function comparePlans(plan1: SubscriptionPlanType, plan2: SubscriptionPlanType): number {
  const order: SubscriptionPlanType[] = ['FREE', 'BASIC', 'PREMIUM', 'ENTERPRISE']
  const index1 = order.indexOf(plan1)
  const index2 = order.indexOf(plan2)
  
  if (index1 < index2) return -1
  if (index1 > index2) return 1
  return 0
}

/**
 * Check if plan change is an upgrade
 * 
 * @param fromPlan - Current plan
 * @param toPlan - Target plan
 * @returns Whether this is an upgrade
 */
function isUpgrade(fromPlan: SubscriptionPlanType, toPlan: SubscriptionPlanType): boolean {
  return comparePlans(fromPlan, toPlan) < 0
}

/**
 * Check if plan change is a downgrade
 * 
 * @param fromPlan - Current plan
 * @param toPlan - Target plan
 * @returns Whether this is a downgrade
 */
function isDowngrade(fromPlan: SubscriptionPlanType, toPlan: SubscriptionPlanType): boolean {
  return comparePlans(fromPlan, toPlan) > 0
}
