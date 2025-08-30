/**
 * Unified Storage Module
 * 
 * Central export point for all storage-related functionality
 */

// Core storage service
export {
  UnifiedStorageService,
  storage,
  safeStorage,
  safeSessionStorage
} from './unified-storage'

export type {
  StorageOptions,
  StorageItem
} from './unified-storage'

// Storage hooks
export {
  default as usePersistentState,
  useTemporaryState,
  useSecureState,
  usePreference,
  useQuizState,
  useLocalStorage,
  useStorageStats,
  useStorageCleaner,
  // New specialized hooks
  useUserPreferences,
  useQuizHistory,
  useQuizProgress,
  useVideoSettings,
  useCourseSettings,
  useIncompleteQuizzes
} from './hooks'

export type {
  UsePersistentStateOptions,
  UseStorageOptions,
  // New specialized types
  QuizHistoryEntry,
  QuizProgress
} from './hooks'

// Migration utilities
export {
  migrateStorageData,
  createLegacyStorageAdapter,
  migratedStorage
} from './services/migration-helper'

// Cleanup utilities
export {
  performStorageCleanup,
  validateStorageMigration,
  generateStorageReport
} from './services/cleanup'

// Verification utilities (development)
export { default as runStorageVerification } from './services/verification'

// Legacy compatibility - these will be marked deprecated
/** @deprecated Use `storage` from './unified-storage' instead */
export { storage as StorageService } from './unified-storage'
/** @deprecated Use `storage` from './unified-storage' instead */
export { storage as SecureStorageService } from './unified-storage'

// Default export for convenience
export { storage as default } from './unified-storage'
