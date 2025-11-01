// Global Constants

// Storage keys
export const STORAGE_KEYS = {
  QUIZ_RESULT: "QUIZ_RESULT",
  PENDING_QUIZ_RESULTS: "pendingQuizResults",
  PENDING_QUIZ: "pendingQuiz",
  QUIZ_STATE: "quiz_state",
  QUIZ_STATE_BACKUP: "quiz_state_backup",
  QUIZ_AUTH_TIMESTAMP: "quizAuthTimestamp",
  FLASHCARD_COMPLETE_STATE: "flashcard_complete_state",
  FLASHCARD_RESULTS: "flashcard_results",
  FLASHCARD_STATE: "flashcard_state",
  FLASHCARD_EMERGENCY_BACKUP: "flashcard_emergency_backup",
  QUIZ_TYPE: {
    FLASHCARD: "flashcard"
  },
  GUEST_ID: "guestId",
};

// Storage prefixes for organized localStorage management
const STORAGE_PREFIXES = {
  USER_PREFERENCES: 'user_prefs_',
  QUIZ_HISTORY: 'quiz_history_',
  QUIZ_PROGRESS: 'quiz_progress_',
  VIDEO_SETTINGS: 'video_settings_',
  COURSE_SETTINGS: 'course_settings_',
  DEBUG_LOGS: 'debug_logs_',
} as const

// Status Constants
const STATUS = {
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

  // Quiz Status
  COMPLETED_WITH_ERRORS: "completed_with_errors",
  ANSWERING: "answering",

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
};

// Auth status values (deprecated, use STATUS instead)
const AUTH_STATUS = {
  CHECKING: STATUS.CHECKING,
  AUTHENTICATED: STATUS.AUTHENTICATED,
  UNAUTHENTICATED: STATUS.UNAUTHENTICATED,
  IDLE: STATUS.IDLE
};

// Quiz status values (deprecated, use STATUS instead)
const QUIZ_STATUS = {
  IDLE: STATUS.IDLE,
  LOADING: STATUS.LOADING,
  SUCCEEDED: STATUS.SUCCEEDED,
  FAILED: STATUS.FAILED,
  SUBMITTING: STATUS.SUBMITTING,
  COMPLETED_WITH_ERRORS: STATUS.COMPLETED_WITH_ERRORS
};

// API endpoint paths
export const API_PATHS = {
  // Unified API paths
  UNIFIED: "/api/quizzes",
  // Legacy paths (maintained for backward compatibility)
  MCQ: "/api/quizzes/mcq",
  CODE: "/api/quizzes/code", 
  BLANKS: "/api/quizzes/blanks",
  OPENENDED: "/api/quizzes/openended",
  COMMON: "/api/quizzes/common",
  // Dynamic type-based paths
  byType: (quizType: string): string => `/api/quizzes/${quizType}`,
  // Dynamic type and slug paths
  byTypeAndSlug: (quizType: string, slug: string): string => `/api/quizzes/${quizType}/${slug}`,
  // Helper functions for specific quiz types with slugs
  getMcqQuiz: (slug: string): string => `/api/quizzes/mcq/${slug}`,
  getCodeQuiz: (slug: string): string => `/api/quizzes/code/${slug}`,
  getBlanksQuiz: (slug: string): string => `/api/quizzes/blanks/${slug}`,
  getOpenEndedQuiz: (slug: string): string => `/api/quizzes/openended/${slug}`,
  getFlashcardQuiz: (slug: string): string => `/api/quizzes/flashcard/${slug}`
};

// Default values
const DEFAULT_VALUES = {
  UNTITLED_QUIZ: "Untitled Quiz",
  QUIZ_NOT_AVAILABLE: "Quiz Not Available",
  DEFAULT_TIME_SPENT: 30
};

// Question types
const QUESTION_TYPES = {
  MCQ: "mcq",
  CODE: "code",
  BLANKS: "blanks",
  OPENENDED: "openended"
};

// Answer types
const ANSWER_TYPES = {
  CORRECT: "correct",
  INCORRECT: "incorrect",
  STILL_LEARNING: "still_learning"
};

// Quiz types
const QUIZ_TYPES = {
  FLASHCARD: "flashcard",
  MCQ: "mcq",
  CODE: "code",
  BLANKS: "blanks",
  OPENENDED: "openended"
};

// Default quiz titles
const QUIZ_TITLES = {
  FLASHCARD: "Flashcard Quiz",
  UNTITLED: "Untitled Quiz"
};

// HTTP Status codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500
};

// Subscription Plans
const SubscriptionPlanType = {
  FREE: "FREE",
  BASIC: "BASIC",
  PREMIUM: "PREMIUM",
  PRO: "PREMIUM",
  ULTIMATE: "ULTIMATE",
  ENTERPRISE: "ENTERPRISE"
};

// Default plan for new users
export const DEFAULT_PLAN = SubscriptionPlanType.FREE;

// Role types
const ROLES = {
  USER: "USER",
  ADMIN: "ADMIN",
  INSTRUCTOR: "INSTRUCTOR",
  STUDENT: "STUDENT"
};

// Cache keys
const CACHE_KEYS = {
  USER_SETTINGS: "user_settings",
  SUBSCRIPTION: "subscription_data",
  TOKEN_USAGE: "token_usage"
};

// Time constants in milliseconds
export const TIME = {
  SECOND: 1000,
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
  MONTH: 30 * 24 * 60 * 60 * 1000
};

// Cache duration constants in seconds
export const CACHE_DURATION = {
  PROGRESS: 30, // 30 seconds for progress data
  COURSE_DATA: 300, // 5 minutes for course data
  RECOMMENDATIONS: 300, // 5 minutes for recommendations
  USER_PROFILE: 600, // 10 minutes for user profile
  QUIZ_RESULTS: 1800, // 30 minutes for quiz results
  QUIZ_DETAILS: 900, // 15 minutes for quiz details
};

// Performance constants
export const PERFORMANCE = {
  DEBOUNCE_DELAY: 500, // Default debounce delay in milliseconds
  CONCURRENCY_LIMIT: 3, // Maximum concurrent requests
  CACHE_SIZE: 1000, // Default cache size
  REQUEST_TIMEOUT: 30000, // 30 seconds timeout
  BATCH_DELAY: 100, // Database batch delay in milliseconds
  MAX_BATCH_SIZE: 10, // Maximum batch size for database operations
};
