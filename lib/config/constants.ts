/**
 * Configuration Constants
 * 
 * Centralized configuration management for the entire application.
 * Consolidates all scattered constants and configuration values.
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
  MCQ: "/api/quizzes/mcq",
  CODE: "/api/quizzes/code", 
  BLANKS: "/api/quizzes/blanks",
  OPENENDED: "/api/quizzes/openended",
  COMMON: "/api/quizzes/common",
  COURSES: "/api/courses",
  USERS: "/api/users",
  SUBSCRIPTIONS: "/api/subscriptions"
} as const

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500
} as const

// ============================================================================
// APPLICATION STATUS CONSTANTS
// ============================================================================

export const STATUS = {
  IDLE: "idle",
  LOADING: "loading", 
  PENDING: "pending",
  SUCCESS: "success",
  SUCCEEDED: "succeeded",
  ERROR: "error",
  FAILED: "failed",
  SUBMITTING: "submitting",
  COMPLETED: "completed",
  COMPLETED_WITH_ERRORS: "completed_with_errors"
} as const

export const QUIZ_STATUS = {
  IDLE: STATUS.IDLE,
  LOADING: STATUS.LOADING,
  SUCCEEDED: STATUS.SUCCEEDED,
  FAILED: STATUS.FAILED,
  SUBMITTING: STATUS.SUBMITTING,
  COMPLETED_WITH_ERRORS: STATUS.COMPLETED_WITH_ERRORS
} as const

// ============================================================================
// QUIZ AND QUESTION TYPE CONSTANTS
// ============================================================================

export const QUESTION_TYPES = {
  MCQ: "mcq",
  CODE: "code",
  BLANKS: "blanks",
  OPENENDED: "openended"
} as const

export const QUIZ_TYPES = {
  FLASHCARD: "flashcard",
  MCQ: "mcq",
  CODE: "code", 
  BLANKS: "blanks",
  OPENENDED: "openended"
} as const

export const ANSWER_TYPES = {
  CORRECT: "correct",
  INCORRECT: "incorrect",
  STILL_LEARNING: "still_learning"
} as const

// ============================================================================
// USER AND SUBSCRIPTION CONSTANTS
// ============================================================================

export const ROLES = {
  USER: "USER",
  ADMIN: "ADMIN",
  INSTRUCTOR: "INSTRUCTOR",
  STUDENT: "STUDENT"
} as const

export const SUBSCRIPTION_PLANS = {
  FREE: "FREE",
  BASIC: "BASIC",
  PREMIUM: "PREMIUM",
  PRO: "PREMIUM", // Alias for PREMIUM
  ULTIMATE: "ULTIMATE",
  ENTERPRISE: "ENTERPRISE"
} as const

// ============================================================================
// CACHE CONFIGURATION
// ============================================================================

export const CACHE_KEYS = {
  USER_SETTINGS: "user_settings",
  SUBSCRIPTION: "subscription_data",
  TOKEN_USAGE: "token_usage",
  COURSES: "courses_cache",
  QUIZZES: "quizzes_cache",
  USER_PROGRESS: "user_progress",
  COURSE_CONTENT: "course_content"
} as const

export const CACHE_TTL = {
  SHORT: 5 * 60, // 5 minutes
  MEDIUM: 30 * 60, // 30 minutes
  LONG: 60 * 60, // 1 hour
  EXTRA_LONG: 24 * 60 * 60 // 24 hours
} as const

// ============================================================================
// STORAGE KEYS
// ============================================================================

export const STORAGE_KEYS = {
  AUTH_TOKEN: "auth_token",
  USER_PREFERENCES: "user_preferences",
  QUIZ_STATE: "quiz_state",
  COURSE_PROGRESS: "course_progress",
  THEME: "theme",
  LANGUAGE: "language"
} as const

// ============================================================================
// TIME CONSTANTS
// ============================================================================

export const TIME = {
  SECOND: 1000,
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
  WEEK: 7 * 24 * 60 * 60 * 1000
} as const

// ============================================================================
// DEFAULT VALUES
// ============================================================================

export const DEFAULT_VALUES = {
  UNTITLED_QUIZ: "Untitled Quiz",
  QUIZ_NOT_AVAILABLE: "Quiz Not Available",
  DEFAULT_TIME_SPENT: 30,
  DEFAULT_PAGINATION_LIMIT: 10,
  MAX_RETRY_ATTEMPTS: 3,
  DEFAULT_DEBOUNCE_DELAY: 300
} as const

export const QUIZ_TITLES = {
  FLASHCARD: "Flashcard Quiz",
  UNTITLED: DEFAULT_VALUES.UNTITLED_QUIZ
} as const

// ============================================================================
// FEATURE FLAGS
// ============================================================================

export const FEATURE_FLAGS = {
  ENABLE_ANALYTICS: IS_PRODUCTION,
  ENABLE_ERROR_REPORTING: IS_PRODUCTION,
  ENABLE_DEBUG_MODE: IS_DEVELOPMENT,
  ENABLE_EXPERIMENTAL_FEATURES: IS_DEVELOPMENT
} as const

// ============================================================================
// LIMITS AND CONSTRAINTS
// ============================================================================

export const LIMITS = {
  MAX_QUIZ_QUESTIONS: 50,
  MAX_COURSE_CHAPTERS: 100,
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_TITLE_LENGTH: 100,
  MAX_DESCRIPTION_LENGTH: 1000,
  MIN_PASSWORD_LENGTH: 8
} as const
