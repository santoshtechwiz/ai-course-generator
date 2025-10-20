/**
 * Centralized AI Configuration
 * 
 * All AI models, limits, and feature configurations for subscription-aware AI services.
 * This is the single source of truth for AI-related settings across all subscription tiers.
 */

import type { SubscriptionPlanType } from '@/types/subscription'

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

// ============= Subscription-Based Model Selection =============

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

// ============= Feature-Specific AI Settings =============

export interface FeatureAISettings {
  enabled: boolean
  model?: AIModelName
  maxQuestions?: number
  maxTokensOverride?: number
  temperatureOverride?: number
  requiresAuth: boolean
  requiresSubscription: boolean
  minimumPlan: SubscriptionPlanType
  dailyLimit?: number // For features with daily limits instead of credit costs
  creditCost?: number // Credit cost per generation
}

export const AI_FEATURE_SETTINGS: Record<string, FeatureAISettings> = {
  // MCQ Quiz Generation
  'quiz-mcq': {
    enabled: true,
    maxQuestions: 50,
    requiresAuth: true,
    requiresSubscription: false,
    minimumPlan: 'FREE',
    creditCost: 1,
  },
  
  // Fill-in-the-Blanks Quiz
  'quiz-blanks': {
    enabled: true,
    maxQuestions: 30,
    requiresAuth: true,
    requiresSubscription: true,
    minimumPlan: 'BASIC',
    creditCost: 1,
  },
  
  // Open-Ended Questions
  'quiz-openended': {
    enabled: true,
    maxQuestions: 20,
    requiresAuth: true,
    requiresSubscription: true,
    minimumPlan: 'PREMIUM',
    creditCost: 2,
  },
  
  // Code Quiz
  'quiz-code': {
    enabled: true,
    maxQuestions: 20,
    requiresAuth: true,
    requiresSubscription: true,
    minimumPlan: 'PREMIUM',
    creditCost: 2,
  },
  
  // Flashcard Generation
  'quiz-flashcard': {
    enabled: true,
    maxQuestions: 100,
    requiresAuth: true,
    requiresSubscription: false,
    minimumPlan: 'FREE',
    creditCost: 1,
  },
  
  // Ordering Quiz
  'quiz-ordering': {
    enabled: true,
    maxQuestions: 10,
    requiresAuth: true,
    requiresSubscription: false,
    minimumPlan: 'FREE',
    dailyLimit: 2, // FREE tier: 2/day
    creditCost: 0, // Uses daily limit instead of credits
  },
  
  // Course Creation
  'course-creation': {
    enabled: true,
    requiresAuth: true,
    requiresSubscription: false,
    minimumPlan: 'FREE',
    creditCost: 5,
    maxTokensOverride: 4096,
  },
  
  // Document Quiz
  'document-quiz': {
    enabled: true,
    maxQuestions: 30,
    requiresAuth: true,
    requiresSubscription: true,
    minimumPlan: 'BASIC',
    creditCost: 3,
    maxTokensOverride: 6144,
  },
  
  // Video Quiz
  'quiz-video': {
    enabled: true,
    maxQuestions: 20,
    requiresAuth: true,
    requiresSubscription: false,
    minimumPlan: 'FREE',
    creditCost: 2,
    maxTokensOverride: 4096, // Video transcripts can be long
  },
}

// ============= Plan-Specific Limits =============

export interface PlanLimits {
  maxQuestionsPerQuiz: Record<string, number>
  dailyQuizGenerations: Record<string, number>
  maxCourseLength: number
  maxDocumentSize: number // in KB
  maxFlashcardsPerSet: number
}

export const PLAN_LIMITS: Record<SubscriptionPlanType, PlanLimits> = {
  FREE: {
    maxQuestionsPerQuiz: {
      'quiz-mcq': 10,
      'quiz-blanks': 5,
      'quiz-flashcard': 10,
      'quiz-ordering': 5,
      'quiz-video': 5,
    },
    dailyQuizGenerations: {
      'quiz-mcq': 5,
      'quiz-ordering': 2,
      'quiz-flashcard': 5,
      'quiz-video': 3,
    },
    maxCourseLength: 10, // chapters
    maxDocumentSize: 1024, // 1MB
    maxFlashcardsPerSet: 20,
  },
  BASIC: {
    maxQuestionsPerQuiz: {
      'quiz-mcq': 20,
      'quiz-blanks': 15,
      'quiz-flashcard': 30,
      'quiz-ordering': 10,
      'quiz-video': 10,
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
  PREMIUM: {
    maxQuestionsPerQuiz: {
      'quiz-mcq': 50,
      'quiz-blanks': 30,
      'quiz-openended': 20,
      'quiz-code': 20,
      'quiz-flashcard': 50,
      'quiz-ordering': 20,
      'quiz-video': 20,
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
  ENTERPRISE: {
    maxQuestionsPerQuiz: {
      'quiz-mcq': 100,
      'quiz-blanks': 50,
      'quiz-openended': 50,
      'quiz-code': 50,
      'quiz-flashcard': 100,
      'quiz-ordering': 50,
      'quiz-video': 50,
    },
    dailyQuizGenerations: {
      'quiz-mcq': -1, // unlimited
      'quiz-blanks': -1,
      'quiz-openended': -1,
      'quiz-code': -1,
      'quiz-ordering': 50,
      'quiz-flashcard': -1,
      'quiz-video': -1,
    },
    maxCourseLength: -1, // unlimited
    maxDocumentSize: 51200, // 50MB
    maxFlashcardsPerSet: 200,
  },
}

// ============= Error Messages =============

export const AI_ERROR_MESSAGES = {
  // Authentication Errors
  AUTH_REQUIRED: 'You must be logged in to use this feature.',
  SESSION_EXPIRED: 'Your session has expired. Please log in again.',
  
  // Subscription Errors
  SUBSCRIPTION_REQUIRED: 'This feature requires an active subscription.',
  UPGRADE_REQUIRED: 'Please upgrade your plan to access this feature.',
  PLAN_LIMIT_REACHED: 'You have reached your plan limit for this feature.',
  
  // Credit Errors
  INSUFFICIENT_CREDITS: 'You do not have enough credits for this action.',
  DAILY_LIMIT_REACHED: 'You have reached your daily limit for this feature.',
  
  // Feature Errors
  FEATURE_DISABLED: 'This feature is currently disabled.',
  FEATURE_NOT_AVAILABLE: 'This feature is not available on your current plan.',
  
  // Input Errors
  INVALID_INPUT: 'Invalid input provided.',
  INPUT_TOO_LONG: 'Input exceeds maximum allowed length.',
  DOCUMENT_TOO_LARGE: 'Document size exceeds maximum allowed size.',
  
  // API Errors
  API_ERROR: 'An error occurred while processing your request.',
  RATE_LIMIT_EXCEEDED: 'Rate limit exceeded. Please try again later.',
  MODEL_UNAVAILABLE: 'The selected AI model is currently unavailable.',
  
  // Validation Errors
  INVALID_QUESTION_COUNT: 'Invalid number of questions requested.',
  INVALID_DIFFICULTY: 'Invalid difficulty level specified.',
} as const

// ============= Success Messages =============

export const AI_SUCCESS_MESSAGES = {
  QUIZ_GENERATED: 'Quiz generated successfully!',
  FLASHCARDS_GENERATED: 'Flashcards generated successfully!',
  COURSE_CREATED: 'Course created successfully!',
  DOCUMENT_PROCESSED: 'Document processed successfully!',
} as const

// ============= Rate Limiting Configuration =============

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
    requestsPerHour: -1, // unlimited
    requestsPerDay: -1, // unlimited
  },
}

// ============= Helper Functions =============

/**
 * Get model configuration for a subscription plan
 */
export function getModelConfig(plan: SubscriptionPlanType): ModelConfiguration {
  return SUBSCRIPTION_MODELS[plan]
}

/**
 * Get feature settings for a specific feature
 */
export function getFeatureSettings(featureKey: string): FeatureAISettings | undefined {
  return AI_FEATURE_SETTINGS[featureKey]
}

/**
 * Get plan limits for a subscription plan
 */
export function getPlanLimits(plan: SubscriptionPlanType): PlanLimits {
  return PLAN_LIMITS[plan]
}

/**
 * Get rate limits for a subscription plan
 */
export function getRateLimits(plan: SubscriptionPlanType): RateLimitConfig {
  return RATE_LIMITS[plan]
}

/**
 * Check if a plan can access a feature
 */
export function canPlanAccessFeature(
  userPlan: SubscriptionPlanType,
  featureKey: string
): boolean {
  const settings = getFeatureSettings(featureKey)
  if (!settings || !settings.enabled) return false
  
  const planHierarchy: Record<SubscriptionPlanType, number> = {
    FREE: 0,
    BASIC: 1,
    PREMIUM: 2,
    ENTERPRISE: 3,
  }
  
  return planHierarchy[userPlan] >= planHierarchy[settings.minimumPlan]
}

export default {
  AI_MODELS,
  SUBSCRIPTION_MODELS,
  AI_FEATURE_SETTINGS,
  PLAN_LIMITS,
  RATE_LIMITS,
  AI_ERROR_MESSAGES,
  AI_SUCCESS_MESSAGES,
  getModelConfig,
  getFeatureSettings,
  getPlanLimits,
  getRateLimits,
  canPlanAccessFeature,
}
