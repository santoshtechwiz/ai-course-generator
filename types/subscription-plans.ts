/**
 * CENTRALIZED SUBSCRIPTION PLANS - CLEAN & SIMPLE
 * 
 * Single source of truth for subscription data.
 * Real pricing and features only - easy to extend.
 */

export type SubscriptionPlanType = 'FREE' | 'BASIC' | 'PREMIUM' | 'ENTERPRISE'

export const PRICING = {
  FREE: 0,
  BASIC: 9.99,
  PREMIUM: 24.99,
  ENTERPRISE: 99.00
} as const

export interface PlanConfig {
  id: SubscriptionPlanType
  name: string
  price: number
  popular: boolean
  
  // Quiz Features
  maxQuestionsPerQuiz: number | 'unlimited'
  
  // Core Features
  courseCreation: boolean
  pdfDownloads: boolean
  contentCreation: boolean
  mcqGenerator: boolean
  fillInBlanks: boolean
  openEndedQuestions: boolean
  codeQuiz: boolean
  videoQuiz: boolean
  videoTranscripts: boolean
  
  // Support & Services
  prioritySupport: boolean
  
  // Advanced Features
  aiAccuracy: 'standard' | 'enhanced' | 'premium' | 'custom'
  
  // Credits
  monthlyCredits: number
}

export const SUBSCRIPTION_PLANS: Record<SubscriptionPlanType, PlanConfig> = {
  FREE: {
    id: 'FREE',
    name: 'Free',
    price: PRICING.FREE,
    popular: false,
    maxQuestionsPerQuiz: 3,
    courseCreation: true,
    pdfDownloads: false,
    contentCreation: true,
    mcqGenerator: true,
    fillInBlanks: false,
    openEndedQuestions: false,
    codeQuiz: false,
    videoQuiz: false,
    videoTranscripts: false,
    prioritySupport: false,
    aiAccuracy: 'standard',
    monthlyCredits: 5
  },
  BASIC: {
    id: 'BASIC',
    name: 'Basic',
    price: PRICING.BASIC,
    popular: false,
    maxQuestionsPerQuiz: 5,
    courseCreation: true,
    pdfDownloads: true,
    contentCreation: true,
    mcqGenerator: true,
    fillInBlanks: true,
    openEndedQuestions: false,
    codeQuiz: false,
    videoQuiz: false,
    videoTranscripts: true,
    prioritySupport: false,
    aiAccuracy: 'enhanced',
    monthlyCredits: 50
  },
  PREMIUM: {
    id: 'PREMIUM',
    name: 'Premium',
    price: PRICING.PREMIUM,
    popular: true,
    maxQuestionsPerQuiz: 15,
    courseCreation: true,
    pdfDownloads: true,
    contentCreation: true,
    mcqGenerator: true,
    fillInBlanks: true,
    openEndedQuestions: true,
    codeQuiz: true,
    videoQuiz: false,
    videoTranscripts: true,
    prioritySupport: true,
    aiAccuracy: 'premium',
    monthlyCredits: 200
  },
  ENTERPRISE: {
    id: 'ENTERPRISE',
    name: 'Enterprise',
    price: PRICING.ENTERPRISE,
    popular: false,
    maxQuestionsPerQuiz: 20,
    courseCreation: true,
    pdfDownloads: true,
    contentCreation: true,
    mcqGenerator: true,
    fillInBlanks: true,
    openEndedQuestions: true,
    codeQuiz: true,
    videoQuiz: true,
    videoTranscripts: true,
    prioritySupport: true,
    aiAccuracy: 'custom',
    monthlyCredits: 500
  }
}

export function getPlanConfig(planType: SubscriptionPlanType): PlanConfig {
  return SUBSCRIPTION_PLANS[planType]
}

export function isQuizTypeAvailable(
  planType: SubscriptionPlanType,
  quizType: 'mcq' | 'fill-blanks' | 'open-ended' | 'code-quiz' | 'video-quiz'
): boolean {
  const plan = SUBSCRIPTION_PLANS[planType]
  switch (quizType) {
    case 'mcq': return plan.mcqGenerator
    case 'fill-blanks': return plan.fillInBlanks
    case 'open-ended': return plan.openEndedQuestions
    case 'code-quiz': return plan.codeQuiz
    case 'video-quiz': return plan.videoQuiz
    default: return false
  }
}

export function getMaxQuestions(planType: SubscriptionPlanType): number | 'unlimited' {
  return SUBSCRIPTION_PLANS[planType].maxQuestionsPerQuiz
}

export function hasReachedQuestionLimit(planType: SubscriptionPlanType, currentQuestions: number): boolean {
  const max = getMaxQuestions(planType)
  if (max === 'unlimited') return false
  return currentQuestions >= max
}

/**
 * Convert SUBSCRIPTION_PLANS Record to Array for backward compatibility
 * @deprecated Use SUBSCRIPTION_PLANS directly as a Record instead
 */
export function getPlansArray(): PlanConfig[] {
  return Object.values(SUBSCRIPTION_PLANS)
}

/**
 * Find a plan by ID from the Record
 */
export function findPlanById(planId: string): PlanConfig | undefined {
  return SUBSCRIPTION_PLANS[planId as SubscriptionPlanType]
}

export default SUBSCRIPTION_PLANS
