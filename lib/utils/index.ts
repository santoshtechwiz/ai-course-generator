/**
 * Consolidated Utilities Index
 * 
 * Central export point for all utility functions and configurations.
 * This file provides a clean API for importing utilities throughout the application.
 */

// ============================================================================
// LOGGING UTILITIES
// ============================================================================

export { logger, info, warn, error, debug, nav } from "./logger"

// ============================================================================
// STYLING UTILITIES
// ============================================================================

export { cn, conditionalClass, buildClasses } from './styling'
export type { ClassValue } from './styling'

// ============================================================================
// STRING AND TEXT UTILITIES
// ============================================================================

export {
  // ID generation
  generateId,
  generateIdWithLength,
  
  // Slug generation
  generateSlug,
  createSlug,
  titleToSlug,
  generateUniqueSlug,
  
  // Text processing
  extractKeywords,
  normalizeWhitespace,
  truncateText,
  titleCase,
  camelToKebab,
  kebabToCamel,
  
  // Clipboard
  copyToClipboard,
  
  // Text similarity
  calculateTextSimilarity,
  getSimilarityLevel
} from './string'

export type { SimilarityLevel } from './string'

// ============================================================================
// DATE AND TIME UTILITIES
// ============================================================================

export {
  // Date formatting
  formatDate,
  formatDateShort,
  formatDateTime,
  
  // Duration formatting
  formatTimeDelta,
  formatDuration,
  formatTime,
  formatDurationMs,
  
  // Relative time
  getRelativeTime,
  
  // Validation
  isValidDate,
  isValidDateString,
  
  // Constants
  TIME_CONSTANTS
} from './date-time'

// ============================================================================
// URL AND NAVIGATION UTILITIES
// ============================================================================

export {
  // Base URLs
  getBaseUrl,
  getSiteUrl,
  
  // URL building
  buildQuizUrl,
  buildCourseUrl,
  createShareUrl,
  buildApiUrl,
  
  // URL validation
  isValidUrl,
  isExternalUrl,
  
  // URL parsing
  getUrlParams,
  extractDomain,
  extractYouTubeId,
  
  // Route utilities
  matchesRoute,
  getRouteParams,
  
  // Navigation
  navigateTo,
  goBack,
  reloadPage
} from './url'

// ============================================================================
// CLIENT-SIDE UTILITIES (currently disabled due to import issues)
// ============================================================================

// TODO: Fix client import issues
// export {
//   safeClientSide,
//   safeStorage,
//   safeSessionStorage,
//   getBrowserInfo,
//   getDeviceInfo,
//   supportsFeature,
//   getViewportSize,
//   isInViewport,
//   scrollToElement,
//   getScrollPosition
// } from './client'

// export type { BrowserInfo, DeviceInfo } from './client'

// ============================================================================
// CACHE UTILITIES
// ============================================================================

export {
  CacheService,
  courseCache,
  quizCache,
  userCache,
  generalCache
} from './cache-utils'

// ============================================================================
// REACT HOOKS
// ============================================================================

export {
  // Debounce hooks
  useDebounce,
  useDebouncedCallback,
  
  // Timing hooks
  useInterval,
  
  // Media query hooks
  useMediaQuery,
  useResponsive,
  useMobile, // Legacy alias
  
  // Storage hooks
  usePersistentState
} from './hooks'

// ============================================================================
// SPECIALIZED UTILITIES (TYPES ONLY)
// ============================================================================

export type { HintLevel, HintSystemConfig } from './hint-system'

// ============================================================================
// CONFIGURATION AND CONSTANTS
// ============================================================================

export {
  // Environment
  NODE_ENV,
  IS_PRODUCTION,
  IS_DEVELOPMENT,
  
  // URLs
  BASE_URL,
  SITE_NAME,
  SITE_DESCRIPTION,
  
  // API
  API_PATHS,
  HTTP_STATUS,
  
  // Status
  STATUS,
  QUIZ_STATUS,
  QUESTION_TYPES,
  ANSWER_TYPES,
  QUIZ_TYPES,
  QUIZ_TITLES,
  DEFAULT_VALUES,
  
  // Subscription
  SUBSCRIPTION_PLANS,
  PLAN_LIMITS,
  
  // User roles
  ROLES,
  
  // Storage
  STORAGE_KEYS,
  CACHE_KEYS,
  
  // Time
  TIME,
  
  // Pagination
  PAGINATION,
  
  // Validation
  VALIDATION,
  
  // Features
  FEATURES,
  
  // AI Models
  AI_MODELS
} from '../../config'

// ============================================================================
// LEGACY COMPATIBILITY
// ============================================================================

// Re-export commonly used functions for backward compatibility
export { fetchSubscriptionStatus, getAIModel } from '../utils'

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type {
  StatusType,
  QuizStatusType,
  QuestionType,
  AnswerType,
  QuizType,
  SubscriptionPlan,
  UserRole,
  APIPath,
  HTTPStatus
} from '../../config'
