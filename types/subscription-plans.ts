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

// ============= SINGLE SOURCE OF TRUTH - ALL PLAN CONFIGURATIONS =============
export const PLAN_CONFIGURATIONS = {
  FREE: {
    price: PRICING.FREE,
    popular: false,
    maxQuestionsPerQuiz: 3,
    maxStepsPerOrderingQuiz: 5,
    monthlyCredits: 5,
    courseCreation: true,
    pdfDownloads: false,
    contentCreation: true,
    mcqGenerator: true,
    fillInBlanks: false,
    openEndedQuestions: false,
    codeQuiz: false,
    videoQuiz: true,
    videoTranscripts: false,
    prioritySupport: false,
    aiAccuracy: 'standard',
    creditCosts: {
      'quiz-mcq': 1,
      'quiz-blanks': 1,
      'quiz-openended': 2,
      'quiz-code': 2,
      'quiz-video': 2,
      'quiz-flashcard': 1,
      'quiz-ordering': 0, // Uses daily limit
      'course-creation': 5,
      'document-quiz': 3,
    },
    aiLimits: {
      maxQuestionsPerQuiz: {
        'quiz-mcq': 3,
        'quiz-blanks': 3,
        'quiz-flashcard': 3,
        'quiz-ordering': 3,
        'quiz-video': 3,
      },
      dailyQuizGenerations: {
        'quiz-mcq': 5,
        'quiz-ordering': 2,
        'quiz-flashcard': 5,
        'quiz-video': 3,
      },
      maxCourseLength: 10,
      maxDocumentSize: 1024, // 1MB
      maxFlashcardsPerSet: 20,
    },
    featureFlags: {
      'route-protection': true,
      'dashboard-access': true,
      'course-browsing': true,
      'course-access': true,
      'quiz-access': true,
      'quiz-mcq': true,
      'quiz-openended': false,
      'quiz-blanks': false,
      'quiz-code': false,
      'quiz-flashcard': true,
      'quiz-ordering': true,
      'quiz-video': true,
      'middleware-caching': true,
      'performance-monitoring': true,
      'subscription-enforcement': false,
      'quiz-creation': true,
      'course-creation': true,
      'pdf-generation': false,
      'analytics': false,
      'enhanced-analytics': false,
      'ai-recommendations': false,
      'beta-features': false,
      'collaborative-courses': false,
      'legacy-quiz-builder': false,
      'advancedAI': false,
      'prioritySupport': false,
      'customModels': false,
      'analytics-basic': false
    }
  },
  BASIC: {
    price: PRICING.BASIC,
    popular: false,
    maxQuestionsPerQuiz: 5,
    maxStepsPerOrderingQuiz: 8,
    monthlyCredits: 50,
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
    aiAccuracy: 'standard',
    creditCosts: {
      'quiz-mcq': 1,
      'quiz-blanks': 1,
      'quiz-openended': 2,
      'quiz-code': 2,
      'quiz-video': 2,
      'quiz-flashcard': 1,
      'quiz-ordering': 0, // Uses daily limit
      'course-creation': 5,
      'document-quiz': 3,
    },
    aiLimits: {
      maxQuestionsPerQuiz: {
        'quiz-mcq': 5,
        'quiz-blanks': 5,
        'quiz-flashcard': 5,
        'quiz-ordering': 5,
        'quiz-video': 5,
      },
      dailyQuizGenerations: {
        'quiz-mcq': 20,
        'quiz-blanks': 10,
        'quiz-ordering': 5,
        'quiz-flashcard': 20,
        'quiz-video': 8,
      },
      maxCourseLength: 25,
      maxDocumentSize: 5120, // 5MB
      maxFlashcardsPerSet: 50,
    },
    featureFlags: {
      'route-protection': true,
      'dashboard-access': true,
      'course-browsing': true,
      'course-access': true,
      'quiz-access': true,
      'quiz-mcq': true,
      'quiz-openended': false,
      'quiz-blanks': true,
      'quiz-code': false,
      'quiz-flashcard': true,
      'quiz-ordering': true,
      'quiz-video': true,
      'middleware-caching': true,
      'performance-monitoring': true,
      'subscription-enforcement': true,
      'quiz-creation': true,
      'course-creation': true,
      'pdf-generation': true,
      'analytics': false,
      'enhanced-analytics': false,
      'ai-recommendations': true,
      'beta-features': false,
      'collaborative-courses': false,
      'legacy-quiz-builder': false,
      'advancedAI': false,
      'prioritySupport': false,
      'customModels': false,
      'analytics-basic': true
    }
  },
  PREMIUM: {
    price: PRICING.PREMIUM,
    popular: true,
    maxQuestionsPerQuiz: 10,
    maxStepsPerOrderingQuiz: 12,
    monthlyCredits: 200,
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
    creditCosts: {
      'quiz-mcq': 1,
      'quiz-blanks': 1,
      'quiz-openended': 2,
      'quiz-code': 2,
      'quiz-video': 2,
      'quiz-flashcard': 1,
      'quiz-ordering': 0, // Uses daily limit
      'course-creation': 5,
      'document-quiz': 3,
    },
    aiLimits: {
      maxQuestionsPerQuiz: {
        'quiz-mcq': 10,
        'quiz-blanks': 10,
        'quiz-openended': 10,
        'quiz-code': 10,
        'quiz-flashcard': 10,
        'quiz-ordering': 10,
        'quiz-video': 10,
      },
      dailyQuizGenerations: {
        'quiz-mcq': 50,
        'quiz-blanks': 30,
        'quiz-openended': 20,
        'quiz-code': 20,
        'quiz-ordering': 10,
        'quiz-flashcard': 50,
        'quiz-video': 25,
      },
      maxCourseLength: 50,
      maxDocumentSize: 10240, // 10MB
      maxFlashcardsPerSet: 100,
    },
    featureFlags: {
      'route-protection': true,
      'dashboard-access': true,
      'course-browsing': true,
      'course-access': true,
      'quiz-access': true,
      'quiz-mcq': true,
      'quiz-openended': true,
      'quiz-blanks': true,
      'quiz-code': true,
      'quiz-flashcard': true,
      'quiz-ordering': true,
      'middleware-caching': true,
      'performance-monitoring': true,
      'subscription-enforcement': true,
      'quiz-creation': true,
      'course-creation': true,
      'pdf-generation': true,
      'analytics': true,
      'enhanced-analytics': true,
      'ai-recommendations': true,
      'beta-features': true,
      'collaborative-courses': false,
      'legacy-quiz-builder': false,
      'advancedAI': true,
      'prioritySupport': true,
      'customModels': false,
      'quiz-video': true,
      'analytics-basic': true
    }
  },
  ENTERPRISE: {
    price: PRICING.ENTERPRISE,
    popular: false,
    maxQuestionsPerQuiz: 15,
    maxStepsPerOrderingQuiz: 20,
    monthlyCredits: 500,
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
    creditCosts: {
      'quiz-mcq': 1,
      'quiz-blanks': 1,
      'quiz-openended': 2,
      'quiz-code': 2,
      'quiz-video': 2,
      'quiz-flashcard': 1,
      'quiz-ordering': 0, // Uses daily limit
      'course-creation': 5,
      'document-quiz': 3,
    },
    aiLimits: {
      maxQuestionsPerQuiz: {
        'quiz-mcq': 15,
        'quiz-blanks': 15,
        'quiz-openended': 15,
        'quiz-code': 15,
        'quiz-flashcard': 15,
        'quiz-ordering': 15,
        'quiz-video': 15,
      },
      dailyQuizGenerations: {
        'quiz-mcq': 200,
        'quiz-blanks': 100,
        'quiz-openended': 100,
        'quiz-code': 100,
        'quiz-ordering': 50,
        'quiz-flashcard': 200,
        'quiz-video': 100,
      },
      maxCourseLength: 100, // finite limit instead of unlimited
      maxDocumentSize: 51200, // 50MB
      maxFlashcardsPerSet: 200,
    },
    featureFlags: {
      'route-protection': true,
      'dashboard-access': true,
      'course-browsing': true,
      'course-access': true,
      'quiz-access': true,
      'quiz-mcq': true,
      'quiz-openended': true,
      'quiz-blanks': true,
      'quiz-code': true,
      'quiz-flashcard': true,
      'quiz-ordering': true,
      'middleware-caching': true,
      'performance-monitoring': true,
      'subscription-enforcement': true,
      'quiz-creation': true,
      'course-creation': true,
      'pdf-generation': true,
      'analytics': true,
      'enhanced-analytics': true,
      'ai-recommendations': true,
      'beta-features': true,
      'collaborative-courses': true,
      'legacy-quiz-builder': false,
      'advancedAI': true,
      'prioritySupport': true,
      'customModels': true,
      'analytics-basic': true
    }
  },
} as const




export interface PlanConfig {
  id: SubscriptionPlanType
  name: string
  price: number
  popular: boolean
  
  // Quiz Features
  maxQuestionsPerQuiz: number | 'unlimited'
  maxStepsPerOrderingQuiz: number
  
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
  aiAccuracy: string
  
  // Credits
  monthlyCredits: number
  creditCosts: Record<string, number>
  
  // Feature Flags - Centralized feature access control
  featureFlags: Record<string, boolean>
  
  // AI-Specific Limits
  aiLimits: {
    maxQuestionsPerQuiz: Record<string, number>
    dailyQuizGenerations: Record<string, number>
    maxCourseLength: number
    maxDocumentSize: number // in KB
    maxFlashcardsPerSet: number
  }
}

// ============= AI-Specific Limits and Configurations =============

export interface RateLimitConfig {
  requestsPerMinute: number
  requestsPerHour: number
  requestsPerDay: number
}

export const RATE_LIMITS: Record<SubscriptionPlanType, RateLimitConfig> = {
  FREE: {
    requestsPerMinute: 5,
    requestsPerHour: 50,
    requestsPerDay: 100,
  },
  BASIC: {
    requestsPerMinute: 10,
    requestsPerHour: 200,
    requestsPerDay: 500,
  },
  PREMIUM: {
    requestsPerMinute: 30,
    requestsPerHour: 1000,
    requestsPerDay: 2000,
  },
  ENTERPRISE: {
    requestsPerMinute: 100,
    requestsPerHour: 5000,
    requestsPerDay: 10000,
  },
}

export function getPlanAILimits(plan: SubscriptionPlanType): PlanConfig['aiLimits'] {
  return SubscriptionPlanType[plan].aiLimits
}

export function getRateLimits(plan: SubscriptionPlanType): RateLimitConfig {
  return RATE_LIMITS[plan]
}

// ============= AI Model Configuration =============

export const AI_MODELS = {
  // OpenAI Models
  GPT_4O_MINI: 'gpt-4o-mini',
  GPT_4O: 'gpt-4o',
  GPT_4_TURBO: 'gpt-4-turbo',
  GPT_35_TURBO: 'gpt-3.5-turbo',
  
  // Google AI Models
  GEMINI_15_FLASH: 'gemini-1.5-flash',
  GEMINI_15_PRO: 'gemini-1.5-pro',
  GEMINI_PRO: 'gemini-pro',
} as const

export type AIModelName = typeof AI_MODELS[keyof typeof AI_MODELS]

export interface ModelConfiguration {
  primary: AIModelName
  fallback: AIModelName
  maxTokens: number
  temperature: number
  topP: number
}

export const SUBSCRIPTION_MODELS: Record<SubscriptionPlanType, ModelConfiguration> = {
  FREE: {
    primary: AI_MODELS.GPT_4O_MINI,
    fallback: AI_MODELS.GPT_35_TURBO,
    maxTokens: 2048,
    temperature: 0.7,
    topP: 0.9,
  },
  BASIC: {
    primary: AI_MODELS.GPT_4O_MINI,
    fallback: AI_MODELS.GPT_35_TURBO,
    maxTokens: 3072,
    temperature: 0.7,
    topP: 0.9,
  },
  PREMIUM: {
    primary: AI_MODELS.GPT_4O,
    fallback: AI_MODELS.GPT_4O_MINI,
    maxTokens: 4096,
    temperature: 0.8,
    topP: 0.95,
  },
  ENTERPRISE: {
    primary: AI_MODELS.GPT_4_TURBO,
    fallback: AI_MODELS.GPT_4O,
    maxTokens: 8192,
    temperature: 0.8,
    topP: 0.95,
  },
}

export function getModelConfig(plan: SubscriptionPlanType): ModelConfiguration {
  return SUBSCRIPTION_MODELS[plan]
}

export function getAllAvailableModels(): AIModelName[] {
  const models = new Set<AIModelName>()
  
  Object.values(SUBSCRIPTION_MODELS).forEach(config => {
    models.add(config.primary)
    models.add(config.fallback)
  })
  
  return Array.from(models)
}

// Build PlanConfig objects from PLAN_CONFIGURATIONS
function buildPlanConfig(planType: SubscriptionPlanType): PlanConfig {
  const config = PLAN_CONFIGURATIONS[planType]
  return {
    id: planType,
    name: planType === 'FREE' ? 'Free' :
          planType === 'BASIC' ? 'Basic' :
          planType === 'PREMIUM' ? 'Premium' : 'Enterprise',
    price: config.price,
    popular: config.popular,
    maxQuestionsPerQuiz: config.maxQuestionsPerQuiz,
    maxStepsPerOrderingQuiz: config.maxStepsPerOrderingQuiz,
    courseCreation: config.courseCreation,
    pdfDownloads: config.pdfDownloads,
    contentCreation: config.contentCreation,
    mcqGenerator: config.mcqGenerator,
    fillInBlanks: config.fillInBlanks,
    openEndedQuestions: config.openEndedQuestions,
    codeQuiz: config.codeQuiz,
    videoQuiz: config.videoQuiz,
    videoTranscripts: config.videoTranscripts,
    prioritySupport: config.prioritySupport,
    aiAccuracy: config.aiAccuracy,
    monthlyCredits: config.monthlyCredits,
    creditCosts: config.creditCosts,
    featureFlags: config.featureFlags,
    aiLimits: config.aiLimits,
  }
}

export const SubscriptionPlanType: Record<SubscriptionPlanType, PlanConfig> = {
  FREE: buildPlanConfig('FREE'),
  BASIC: buildPlanConfig('BASIC'),
  PREMIUM: buildPlanConfig('PREMIUM'),
  ENTERPRISE: buildPlanConfig('ENTERPRISE'),
}

export function getPlanConfig(planType: SubscriptionPlanType): PlanConfig {
  return SubscriptionPlanType[planType]
}

export function isQuizTypeAvailable(
  planType: SubscriptionPlanType,
  quizType: 'mcq' | 'fill-blanks' | 'open-ended' | 'code-quiz' | 'video-quiz'
): boolean {
  const plan = SubscriptionPlanType[planType]
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
  return SubscriptionPlanType[planType].maxQuestionsPerQuiz
}

export function hasReachedQuestionLimit(planType: SubscriptionPlanType, currentQuestions: number): boolean {
  const max = getMaxQuestions(planType)
  if (max === 'unlimited') return false
  return currentQuestions >= max
}

/**
 * Convert SubscriptionPlanType Record to Array for backward compatibility
 * @deprecated Use SubscriptionPlanType directly as a Record instead
 */
export function getPlansArray(): PlanConfig[] {
  return Object.values(SubscriptionPlanType)
}

/**
 * Find a plan by ID from the Record
 */
export function findPlanById(planId: string): PlanConfig | undefined {
  return SubscriptionPlanType[planId as SubscriptionPlanType]
}

export default SubscriptionPlanType

// ============= Subscription Status Types =============

export type SubscriptionStatusType = 
  | "ACTIVE" 
  | "INACTIVE" 
  | "CANCELED" 
  | "PAST_DUE" 
  | "TRIALING" 
  | "UNPAID"

type SubscriptionSource = 
  | "stripe" 
  | "database" 
  | "cache" 
  | "default" 
  | "webhook" 
  | "admin"

// ============= Subscription Data Structures =============

export interface SubscriptionData {
  id: string
  userId: string
  subscriptionId: string
  credits: number
  tokensUsed: number
  isSubscribed: boolean
  subscriptionPlan: SubscriptionPlanType
  status: SubscriptionStatusType
  cancelAtPeriodEnd: boolean
  expirationDate: string | null
  createdAt: string
  updatedAt: string
  metadata?: {
    source?: string
    timestamp?: string
    stripeSubscriptionId?: string
    stripeCustomerId?: string
    [key: string]: any
  }
}

interface SubscriptionState {
  currentSubscription: SubscriptionData | null
  isLoading: boolean
  error: string | null
  lastUpdated: string | null
  cache: {
    [key: string]: {
      data: SubscriptionData
      timestamp: number
      ttl: number
    }
  }
}

// ============= API Response Types =============

interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
  timestamp?: string
}

interface SubscriptionResponse extends ApiResponse<SubscriptionData> {
  data: SubscriptionData
}

interface BillingHistoryItem {
  id: string
  date: Date
  amount: number
  status: string
  paymentMethod?: string
  nextBillingDate?: Date
}

interface PaymentMethod {
  id: string
  type: string
  card?: {
    brand: string
    last4: string
    expMonth: number
    expYear: number
  }
  isDefault: boolean
}

// ============= Service Types =============

interface SubscriptionServiceOptions {
  planId?: string
  duration?: number
  metadata?: Record<string, any>
}

interface CheckoutSessionResult {
  success: boolean
  sessionId?: string
  url?: string
  message: string
}

interface SubscriptionOperationResult {
  success: boolean
  message: string
  data?: SubscriptionData
}

interface CreditOperationResult {
  success: boolean
  message: string
  newBalance?: number
}

// ============= Hook Types =============

interface UseSubscriptionOptions {
  enableRefresh?: boolean
  refreshInterval?: number
  onError?: (error: Error) => void
  onSuccess?: (data: SubscriptionData) => void
}

interface UseSubscriptionResult {
  subscription: SubscriptionData
  isLoading: boolean
  error: Error | null
  mutate: () => Promise<SubscriptionData | undefined>
  refresh: () => Promise<void>
  isValidating: boolean
}

// ============= Validation & Cache Types =============

interface CacheConfiguration {
  ttl: number
  maxAge: number
  staleWhileRevalidate: number
  dedupingInterval: number
  refreshInterval: number
}

interface SubscriptionCacheEntry {
  data: SubscriptionData
  timestamp: number
  ttl: number
  source: SubscriptionSource
}


export const SUBSCRIPTION_CACHE_CONFIG: CacheConfiguration = {
  ttl: 30_000, // 30 seconds
  maxAge: 5 * 60_000, // 5 minutes
  staleWhileRevalidate: 60_000, // 1 minute
  dedupingInterval: 10_000, // 10 seconds
  refreshInterval: 5 * 60_000 // 5 minutes
}

// Default free subscription state
export const DEFAULT_FREE_SUBSCRIPTION: SubscriptionData = {
  id: 'free',
  userId: '',
  subscriptionId: '',
  credits: 3, // Free users get 3 credits
  tokensUsed: 0,
  isSubscribed: true, // Free users are "subscribed" to free plan
  subscriptionPlan: "FREE",
  status: "ACTIVE", // Free plan is always active
  cancelAtPeriodEnd: false,
  expirationDate: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  metadata: {
    source: "default",
    timestamp: new Date().toISOString()
  }
}

// ============= Type Guards =============

export function isSubscriptionData(data: any): data is SubscriptionData {
  if (!data || typeof data !== 'object') {
    return false
  }
  
  return (
    typeof data.id === 'string' &&
    typeof data.userId === 'string' &&
    typeof data.credits === 'number' &&
    typeof data.isSubscribed === 'boolean' &&
    ['FREE', 'BASIC', 'PREMIUM', 'ENTERPRISE'].includes(data.subscriptionPlan) &&
    ['ACTIVE', 'INACTIVE', 'CANCELED', 'PAST_DUE', 'TRIALING', 'UNPAID'].includes(data.status)
  )
}
export const SUBSCRIPTION_PLAN_IDS = {
  FREE: 'FREE' as const,
  BASIC: 'BASIC' as const,
  PREMIUM: 'PREMIUM' as const,
  ENTERPRISE: 'ENTERPRISE' as const,
} as const

// ============= TYPE GUARDS & HELPERS =============

/**
 * Check if a plan is the FREE plan
 */
export function isFreePlan(plan: string): plan is SubscriptionPlanType {
  return plan === SUBSCRIPTION_PLAN_IDS.FREE
}

/**
 * Check if a plan is the BASIC plan
 */
export function isBasicPlan(plan: string): plan is SubscriptionPlanType {
  return plan === SUBSCRIPTION_PLAN_IDS.BASIC
}

/**
 * Check if a plan is the PREMIUM plan
 */
export function isPremiumPlan(plan: string): plan is SubscriptionPlanType {
  return plan === SUBSCRIPTION_PLAN_IDS.PREMIUM
}

/**
 * Check if a plan is the ENTERPRISE plan
 */
export function isEnterprisePlan(plan: string): plan is SubscriptionPlanType {
  return plan === SUBSCRIPTION_PLAN_IDS.ENTERPRISE
}

/**
 * Generic function to check if a plan matches a specific type
 */
export function isPlan(plan: string, targetPlan: SubscriptionPlanType): boolean {
  return plan === targetPlan
}

/**
 * Check if a plan is a paid plan (not FREE)
 */
export function isPaidPlan(plan: string): boolean {
  return !isFreePlan(plan)
}

/**
 * Check if a plan has premium features (PREMIUM or ENTERPRISE)
 */
export function hasPremiumFeatures(plan: string): boolean {
  return isPremiumPlan(plan) || isEnterprisePlan(plan)
}

/**
 * Get all available plan types as an array
 */
export function getAllPlanTypes(): SubscriptionPlanType[] {
  return Object.keys(SubscriptionPlanType) as SubscriptionPlanType[]
}

/**
 * Check if a string is a valid subscription plan type
 */
export function isValidPlanType(plan: string): plan is SubscriptionPlanType {
  return getAllPlanTypes().includes(plan as SubscriptionPlanType)
}

/**
 * Get plan hierarchy level (for comparisons)
 * FREE = 0, BASIC = 1, PREMIUM = 2, ENTERPRISE = 3
 */
export function getPlanLevel(plan: string): number {
  switch (plan) {
    case SUBSCRIPTION_PLAN_IDS.FREE:
      return 0
    case SUBSCRIPTION_PLAN_IDS.BASIC:
      return 1
    case SUBSCRIPTION_PLAN_IDS.PREMIUM:
      return 2
    case SUBSCRIPTION_PLAN_IDS.ENTERPRISE:
      return 3
    default:
      return -1 // Invalid plan
  }
}

/**
 * Check if plan A is higher or equal level than plan B
 */
export function isPlanAtLeast(planA: string, planB: SubscriptionPlanType): boolean {
  return getPlanLevel(planA) >= getPlanLevel(planB)
}

/**
 * Get the next higher plan (for upgrades)
 */
export function getNextPlan(plan: string): SubscriptionPlanType | null {
  const level = getPlanLevel(plan)
  switch (level) {
    case 0:
      return SUBSCRIPTION_PLAN_IDS.BASIC
    case 1:
      return SUBSCRIPTION_PLAN_IDS.PREMIUM
    case 2:
      return SUBSCRIPTION_PLAN_IDS.ENTERPRISE
    default:
      return null
  }
}
export function isSubscriptionResponse(data: any): data is SubscriptionResponse {
  if (!data || typeof data !== 'object') {
    return false
  }
  
  return (
    typeof data.success === 'boolean' &&
    data.data !== undefined &&
    isSubscriptionData(data.data)
  )
}

export function isValidPlan(plan: string): plan is SubscriptionPlanType {
  return ['FREE', 'BASIC', 'PREMIUM', 'ENTERPRISE'].includes(plan)
}

export function isValidStatus(status: string): status is SubscriptionStatusType {
  return ['ACTIVE', 'INACTIVE', 'CANCELED', 'PAST_DUE', 'TRIALING', 'UNPAID'].includes(status)
}

// ============= Utility Functions =============

export function isActivePlan(subscription: SubscriptionData): boolean {
  return subscription.status === 'ACTIVE' && subscription.isSubscribed
}

export function getRemainingCredits(subscription: SubscriptionData): number {
  return Math.max(0, subscription.credits - subscription.tokensUsed)
}

function createSubscriptionCache(data: SubscriptionData, source: SubscriptionSource = 'default'): SubscriptionCacheEntry {
  return {
    data,
    timestamp: Date.now(),
    ttl: SUBSCRIPTION_CACHE_CONFIG.ttl,
    source
  }
}

// ============= Error Types =============

class SubscriptionError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number
  ) {
    super(message)
    this.name = 'SubscriptionError'
  }
}

class PaymentError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number
  ) {
    super(message)
    this.name = 'PaymentError'
  }
}

// ============= Webhook Types =============

interface StripeWebhookEvent {
  id: string
  type: string
  data: {
    object: any
  }
  created: number
}

interface SubscriptionWebhookPayload {
  userId: string
  subscriptionId: string
  planId: SubscriptionPlanType
  status: SubscriptionStatusType
  metadata?: Record<string, any>
}

// ============= Subscription Utility Functions =============

/**
 * Calculate savings percentage between two pricing plans
 * @param monthlyPrice - Price for monthly plan
 * @param discountPrice - Discounted price for longer duration
 * @param comparisonMonths - Number of months to compare against
 * @returns Percentage savings rounded to nearest whole number
 */
export function calculateSavings(
  monthlyPrice: number, 
  discountPrice: number, 
  comparisonMonths: number = 12
): number {
  if (monthlyPrice <= 0 || discountPrice <= 0 || comparisonMonths <= 0) {
    return 0
  }
  
  const totalMonthlyPrice = monthlyPrice * comparisonMonths
  const savings = ((totalMonthlyPrice - discountPrice) / totalMonthlyPrice) * 100
  
  return Math.round(Math.max(0, savings))
}

/**
 * Format price for display
 * @param price - Price in dollars
 * @param currency - Currency symbol (default: '$')
 * @returns Formatted price string
 */
export function formatPrice(price: number, currency: string = '$'): string {
  return `${currency}${price.toFixed(2)}`
}

/**
 * Calculate monthly equivalent price
 * @param totalPrice - Total price for duration
 * @param months - Number of months
 * @returns Monthly equivalent price
 */
export function calculateMonthlyEquivalent(totalPrice: number, months: number): number {
  if (months <= 0) return totalPrice
  return totalPrice / months
}

/**
 * Determine if a plan is considered popular
 * @param planName - Name of the subscription plan
 * @returns Boolean indicating if plan should be marked as popular
 */
export function isPlanPopular(planName: string): boolean {
  // Typically PREMIUM or BASIC plans are marked as popular
  return planName.toUpperCase() === 'PREMIUM'
}

/**
 * Calculate annual savings amount in dollars
 * @param monthlyPrice - Monthly plan price
 * @param annualPrice - Annual plan price
 * @returns Dollar amount saved annually
 */
function calculateAnnualSavingsAmount(monthlyPrice: number, annualPrice: number): number {
  const annualMonthlyTotal = monthlyPrice * 12
  return Math.max(0, annualMonthlyTotal - annualPrice)
}

/**
 * Get plan recommendation based on usage pattern
 * @param monthlyUsage - Estimated monthly usage/credits needed
 * @returns Recommended plan type
 */
export function getRecommendedPlan(monthlyUsage: number): string {
  if (monthlyUsage <= 10) return 'FREE'
  if (monthlyUsage <= 100) return 'BASIC'
  if (monthlyUsage <= 500) return 'PREMIUM'
  return 'ENTERPRISE'
}

/**
 * Validate subscription plan pricing
 * @param plans - Array of subscription plans
 * @returns Boolean indicating if pricing is valid
 */
function validatePlanPricing(plans: any[]): boolean {
  return plans.every(plan => 
    plan.price >= 0 && 
    typeof plan.price === 'number' &&
    plan.features &&
    plan.features.credits > 0
  )
}
