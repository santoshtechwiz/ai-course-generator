/**
 * Storage Module
 * 
 * Central export point for all storage-related functionality
 * Now using simplified, lightweight storage system instead of over-engineered transactions
 */

// CORE STORAGE SYSTEM (replaces complex transaction manager)
export {
  transactionManager,
  storage,
  conflictDetector,
  storageStartup,
  simpleStorage,
  asyncVideoProgressSave,
  asyncChapterCompletion
} from './compatibility'

export type {
  StorageOperation,
  TransactionResult
} from './compatibility'

// Legacy storage (keeping for migration period)
export {
  UnifiedStorageService,
  storage as legacyStorage,
  safeStorage,
  safeSessionStorage
} from './legacy-storage'

export type {
  StorageOptions,
  StorageItem
} from './legacy-storage'

// Storage hooks
export {
  default as usePersistentState,
  useTemporaryState,
  useSecureState,
  usePreference,
  useQuizState,

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
/** @deprecated Use `storage` from './legacy-storage' instead */
export { storage as StorageService } from './legacy-storage'
/** @deprecated Use `storage` from './legacy-storage' instead */
export { storage as SecureStorageService } from './legacy-storage'

// Default export for convenience - NOW SIMPLIFIED!
export { simpleStorage as default } from './compatibility'
