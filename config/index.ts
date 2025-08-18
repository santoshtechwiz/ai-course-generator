/**
 * Consolidated Configuration
 * 
 * Central configuration file that consolidates all scattered constants
 * and configuration values from various files across the codebase.
 */

// ============================================================================
// ENVIRONMENT CONFIGURATION
// ============================================================================

export const NODE_ENV = process.env.NODE_ENV || 'development'
export const IS_PRODUCTION = NODE_ENV === 'production'
export const IS_DEVELOPMENT = NODE_ENV === 'development'

// ============================================================================
// URL AND DOMAIN CONFIGURATION
// ============================================================================

export const BASE_URL = (() => {
  if (process.env.NEXT_PUBLIC_BASE_URL) return process.env.NEXT_PUBLIC_BASE_URL
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL
  if (process.env.NEXTAUTH_URL) return process.env.NEXTAUTH_URL
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return IS_PRODUCTION ? "https://courseai.io" : `http://localhost:${process.env.PORT ?? 3000}`
})()

export const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || "CourseAI"
export const SITE_DESCRIPTION = process.env.NEXT_PUBLIC_SITE_DESCRIPTION || 
  "AI-powered coding education platform with interactive courses, quizzes, and learning tools"

// ============================================================================
// API CONFIGURATION
// ============================================================================

export const API_PATHS = {
  // Quiz APIs
  MCQ: "/api/quizzes/mcq",
  CODE: "/api/quizzes/code", 
  BLANKS: "/api/quizzes/blanks",
  OPENENDED: "/api/quizzes/openended",
  COMMON: "/api/quizzes/common",
  
  // Core APIs
  COURSES: "/api/courses",
  USERS: "/api/users",
  SUBSCRIPTIONS: "/api/subscriptions",
  
  // Additional APIs
  VIDEOS: "/api/videos",
  ANALYTICS: "/api/analytics",
  WEBHOOKS: "/api/webhooks"
} as const

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504
} as const

// ============================================================================
// APPLICATION STATUS CONSTANTS
// ============================================================================

export const STATUS = {
  // Common Status
  IDLE: "idle",
  LOADING: "loading",
  SUCCEEDED: "succeeded",
  FAILED: "failed",
  ERROR: "error",
  READY: "ready",
  ACTIVE: "active",
  COMPLETED: "completed",
  SUBMITTING: "submitting",
  PENDING: "pending",
  
  // Quiz Status
  COMPLETED_WITH_ERRORS: "completed_with_errors",
  ANSWERING: "answering",
  REVIEWING: "reviewing",
  
  // Auth Status
  CHECKING: "checking",
  AUTHENTICATED: "authenticated",
  UNAUTHENTICATED: "unauthenticated",
  
  // Subscription Status
  SUBSCRIPTION_ACTIVE: "ACTIVE",
  SUBSCRIPTION_CANCELED: "CANCELED",
  SUBSCRIPTION_PAST_DUE: "PAST_DUE",
  SUBSCRIPTION_UNPAID: "UNPAID",
  SUBSCRIPTION_TRIAL: "TRIAL",
  SUBSCRIPTION_NONE: "NONE"
} as const

// ============================================================================
// QUIZ CONFIGURATION
// ============================================================================

export const QUIZ_STATUS = {
  NOT_STARTED: "not_started",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
  SUBMITTED: "submitted",
  GRADED: "graded"
} as const

export const QUESTION_TYPES = {
  MCQ: "mcq",
  CODE: "code",
  BLANKS: "blanks",
  OPENENDED: "openended",
  TRUE_FALSE: "true_false",
  MATCHING: "matching"
} as const

export const ANSWER_TYPES = {
  CORRECT: "correct",
  INCORRECT: "incorrect",
  PARTIAL: "partial",
  STILL_LEARNING: "still_learning"
} as const

export const QUIZ_TYPES = {
  FLASHCARD: "flashcard",
  PRACTICE: "practice",
  ASSESSMENT: "assessment",
  TUTORIAL: "tutorial"
} as const

export const QUIZ_TITLES = {
  FLASHCARD: "Flashcard Quiz",
  UNTITLED: "Untitled Quiz",
  DEFAULT: "Quiz"
} as const

export const DEFAULT_VALUES = {
  UNTITLED_QUIZ: "Untitled Quiz",
  QUIZ_NOT_AVAILABLE: "Quiz Not Available",
  DEFAULT_TIME_SPENT: 30,
  DEFAULT_DIFFICULTY: "medium",
  MIN_QUESTIONS: 1,
  MAX_QUESTIONS: 50,
  DEFAULT_QUESTIONS: 10
} as const

// ============================================================================
// SUBSCRIPTION PLANS
// ============================================================================

export const SUBSCRIPTION_PLANS = {
  FREE: "FREE",
  BASIC: "BASIC",
  PREMIUM: "PREMIUM",
  PRO: "PREMIUM", // Legacy alias
  ULTIMATE: "ULTIMATE",
  ENTERPRISE: "ENTERPRISE"
} as const

export const PLAN_LIMITS = {
  FREE: {
    courses: 3,
    quizzes: 10,
    credits: 100
  },
  BASIC: {
    courses: 10,
    quizzes: 50,
    credits: 500
  },
  PREMIUM: {
    courses: -1, // unlimited
    quizzes: -1,
    credits: 2000
  },
  ULTIMATE: {
    courses: -1,
    quizzes: -1,
    credits: 5000
  },
  ENTERPRISE: {
    courses: -1,
    quizzes: -1,
    credits: -1 // unlimited
  }
} as const

// ============================================================================
// USER ROLES
// ============================================================================

export const ROLES = {
  USER: "USER",
  ADMIN: "ADMIN",
  INSTRUCTOR: "INSTRUCTOR",
  STUDENT: "STUDENT",
  MODERATOR: "MODERATOR"
} as const

// ============================================================================
// STORAGE KEYS
// ============================================================================

export const STORAGE_KEYS = {
  // Quiz related
  QUIZ_RESULT: "QUIZ_RESULT",
  PENDING_QUIZ_RESULTS: "pendingQuizResults",
  PENDING_QUIZ: "pendingQuiz",
  QUIZ_STATE: "quiz_state",
  QUIZ_STATE_BACKUP: "quiz_state_backup",
  QUIZ_AUTH_TIMESTAMP: "quizAuthTimestamp",
  
  // Flashcard related
  FLASHCARD_COMPLETE_STATE: "flashcard_complete_state",
  FLASHCARD_RESULTS: "flashcard_results",
  FLASHCARD_STATE: "flashcard_state",
  FLASHCARD_EMERGENCY_BACKUP: "flashcard_emergency_backup",
  
  // User preferences
  USER_PREFERENCES: "user_preferences",
  THEME: "theme",
  LANGUAGE: "language",
  
  // Session data
  AUTH_TOKEN: "authToken",
  GUEST_ID: "guestId",
  SESSION_DATA: "session_data",
  
  // Application state
  USER_SETTINGS: "user_settings",
  SUBSCRIPTION: "subscription_data",
  TOKEN_USAGE: "token_usage",
  LAST_ACTIVITY: "last_activity"
} as const

// ============================================================================
// CACHE KEYS
// ============================================================================

export const CACHE_KEYS = {
  USER_PROFILE: "user_profile",
  COURSES: "courses",
  QUIZZES: "quizzes",
  SUBSCRIPTION_STATUS: "subscription_status",
  ANALYTICS: "analytics",
  SETTINGS: "settings"
} as const

// ============================================================================
// TIME CONSTANTS
// ============================================================================

export const TIME = {
  SECOND: 1000,
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
  WEEK: 7 * 24 * 60 * 60 * 1000,
  MONTH: 30 * 24 * 60 * 60 * 1000,
  YEAR: 365 * 24 * 60 * 60 * 1000
} as const

// ============================================================================
// PAGINATION DEFAULTS
// ============================================================================

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  DEFAULT_PAGE: 1
} as const

// ============================================================================
// VALIDATION CONSTANTS
// ============================================================================

export const VALIDATION = {
  MIN_PASSWORD_LENGTH: 8,
  MAX_PASSWORD_LENGTH: 128,
  MIN_USERNAME_LENGTH: 3,
  MAX_USERNAME_LENGTH: 30,
  MAX_TITLE_LENGTH: 200,
  MAX_DESCRIPTION_LENGTH: 2000,
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  ALLOWED_VIDEO_TYPES: ['video/mp4', 'video/webm', 'video/ogg']
} as const

// ============================================================================
// FEATURE FLAGS
// ============================================================================

export const FEATURES = {
  ENABLE_ANALYTICS: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true',
  ENABLE_CHAT: process.env.NEXT_PUBLIC_ENABLE_CHAT === 'true',
  ENABLE_NOTIFICATIONS: process.env.NEXT_PUBLIC_ENABLE_NOTIFICATIONS === 'true',
  ENABLE_DARK_MODE: process.env.NEXT_PUBLIC_ENABLE_DARK_MODE !== 'false',
  ENABLE_SOCIAL_LOGIN: process.env.NEXT_PUBLIC_ENABLE_SOCIAL_LOGIN !== 'false'
} as const

// ============================================================================
// AI MODEL CONFIGURATION
// ============================================================================

export const AI_MODELS = {
  FREE_TIER: "gpt-3.5-turbo-1106",
  BASIC_TIER: "gpt-3.5-turbo-1106",
  PREMIUM_TIER: "gpt-4-1106-preview",
  ULTIMATE_TIER: "gpt-4-1106-preview",
  DEFAULT: "gpt-3.5-turbo-1106"
} as const

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type StatusType = typeof STATUS[keyof typeof STATUS]
export type QuizStatusType = typeof QUIZ_STATUS[keyof typeof QUIZ_STATUS]
export type QuestionType = typeof QUESTION_TYPES[keyof typeof QUESTION_TYPES]
export type AnswerType = typeof ANSWER_TYPES[keyof typeof ANSWER_TYPES]
export type QuizType = typeof QUIZ_TYPES[keyof typeof QUIZ_TYPES]
export type SubscriptionPlan = typeof SUBSCRIPTION_PLANS[keyof typeof SUBSCRIPTION_PLANS]
export type UserRole = typeof ROLES[keyof typeof ROLES]
export type APIPath = typeof API_PATHS[keyof typeof API_PATHS]
export type HTTPStatus = typeof HTTP_STATUS[keyof typeof HTTP_STATUS]
