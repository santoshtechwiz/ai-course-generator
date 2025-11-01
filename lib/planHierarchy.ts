import { SubscriptionPlanType, type PlanConfig } from '@/types/subscription-plans'

// Plan hierarchy definition - maps plans to numeric levels
const PLAN_HIERARCHY: Record<SubscriptionPlanType, number> = {
  FREE: 0,
  BASIC: 1,
  PREMIUM: 2,
  ENTERPRISE: 3
}

/**
 * Helper function to convert plan config to feature list
 */
function getPlanFeatureList(plan: PlanConfig): string[] {
  const features: string[] = []

  if (plan.courseCreation) features.push('Course creation')
  if (plan.pdfDownloads) features.push('PDF downloads')
  if (plan.contentCreation) features.push('Content creation')
  if (plan.mcqGenerator) features.push('MCQ quizzes')
  if (plan.fillInBlanks) features.push('Fill-in-blank quizzes')
  if (plan.openEndedQuestions) features.push('Open-ended questions')
  if (plan.codeQuiz) features.push('Code quizzes')
  if (plan.videoQuiz) features.push('Video quizzes')
  if (plan.videoTranscripts) features.push('Video transcripts')
  if (plan.prioritySupport) features.push('Priority support')
  
  features.push(`${plan.monthlyCredits} monthly credits`)
  features.push(`${plan.aiAccuracy} AI accuracy`)
  
  return features
}

// Features by plan, derived from subscription plans config
const PLAN_FEATURES: Record<SubscriptionPlanType, string[]> = {
  FREE: getPlanFeatureList(SubscriptionPlanType.FREE),
  BASIC: getPlanFeatureList(SubscriptionPlanType.BASIC),
  PREMIUM: getPlanFeatureList(SubscriptionPlanType.PREMIUM),
  ENTERPRISE: getPlanFeatureList(SubscriptionPlanType.ENTERPRISE)
}

/**
 * Check if a plan meets minimum required level
 */
export function hasMinimumPlan(
  currentPlan: SubscriptionPlanType,
  requiredPlan: SubscriptionPlanType
): boolean {
  const currentLevel = PLAN_HIERARCHY[currentPlan] ?? 0
  const requiredLevel = PLAN_HIERARCHY[requiredPlan] ?? 0
  return currentLevel >= requiredLevel
}

/**
 * Get all features available for a plan
 */
function getPlanFeatures(plan: SubscriptionPlanType): string[] {
  return PLAN_FEATURES[plan] || []
}

/**
 * Get next upgrade plan suggestion
 */
function getNextPlan(currentPlan: SubscriptionPlanType): SubscriptionPlanType | null {
  const currentLevel = PLAN_HIERARCHY[currentPlan]
  const nextLevel = currentLevel + 1
  
  return Object.entries(PLAN_HIERARCHY).find(
    ([, level]) => level === nextLevel
  )?.[0] as SubscriptionPlanType || null
}

/**
 * Compare two plans
 * Returns: -1 if plan1 < plan2, 0 if equal, 1 if plan1 > plan2
 */
function comparePlans(
  plan1: SubscriptionPlanType,
  plan2: SubscriptionPlanType
): number {
  const level1 = PLAN_HIERARCHY[plan1] ?? 0
  const level2 = PLAN_HIERARCHY[plan2] ?? 0
  return Math.sign(level1 - level2)
}