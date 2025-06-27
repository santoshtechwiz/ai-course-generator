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

// Status Constants
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
export const AUTH_STATUS = {
  CHECKING: STATUS.CHECKING,
  AUTHENTICATED: STATUS.AUTHENTICATED,
  UNAUTHENTICATED: STATUS.UNAUTHENTICATED,
  IDLE: STATUS.IDLE
};

// Quiz status values (deprecated, use STATUS instead)
export const QUIZ_STATUS = {
  IDLE: STATUS.IDLE,
  LOADING: STATUS.LOADING,
  SUCCEEDED: STATUS.SUCCEEDED,
  FAILED: STATUS.FAILED,
  SUBMITTING: STATUS.SUBMITTING,
  COMPLETED_WITH_ERRORS: STATUS.COMPLETED_WITH_ERRORS
};

// API endpoint paths
export const API_PATHS = {
  MCQ: "/api/quizzes/mcq",
  CODE: "/api/quizzes/code",
  BLANKS: "/api/quizzes/blanks",
  OPENENDED: "/api/quizzes/openended",
  COMMON: "/api/quizzes/common"
};

// Default values
export const DEFAULT_VALUES = {
  UNTITLED_QUIZ: "Untitled Quiz",
  QUIZ_NOT_AVAILABLE: "Quiz Not Available",
  DEFAULT_TIME_SPENT: 30
};

// Question types
export const QUESTION_TYPES = {
  MCQ: "mcq",
  CODE: "code",
  BLANKS: "blanks",
  OPENENDED: "openended"
};

// Answer types
export const ANSWER_TYPES = {
  CORRECT: "correct",
  INCORRECT: "incorrect",
  STILL_LEARNING: "still_learning"
};

// Quiz types
export const QUIZ_TYPES = {
  FLASHCARD: "flashcard",
  MCQ: "mcq",
  CODE: "code",
  BLANKS: "blanks",
  OPENENDED: "openended"
};

// Default quiz titles
export const QUIZ_TITLES = {
  FLASHCARD: "Flashcard Quiz",
  UNTITLED: "Untitled Quiz"
};

// HTTP Status codes
export const HTTP_STATUS = {
  OK: 200,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500
};

// Subscription Plans
export const SUBSCRIPTION_PLANS = {
  FREE: "FREE",
  BASIC: "BASIC",
  PREMIUM: "PREMIUM",
  PRO: "PRO",
  ULTIMATE: "ULTIMATE",
  ENTERPRISE: "ENTERPRISE"
};

// Role types
export const ROLES = {
  USER: "USER",
  ADMIN: "ADMIN",
  INSTRUCTOR: "INSTRUCTOR",
  STUDENT: "STUDENT"
};

// Cache keys
export const CACHE_KEYS = {
  USER_SETTINGS: "user_settings",
  SUBSCRIPTION: "subscription_data",
  TOKEN_USAGE: "token_usage"
};

// Time constants in milliseconds
export const TIME = {
  SECOND: 1000,
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000
};
