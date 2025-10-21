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
  
  simpleStorage,
  
  
} from './compatibility'


// Legacy storage (keeping for migration period)



// Storage hooks
export {
  default as usePersistentState,
  
  
  
  

  
  
  // New specialized hooks
  
  
  
  
  
  useIncompleteQuizzes
} from './hooks'

export type {
  
  
  // New specialized types
  
  
} from './hooks'

// Migration utilities
export {
  migrateStorageData,
  
  migratedStorage
} from './services/migration-helper'

// Cleanup utilities
export {
  performStorageCleanup,
  validateStorageMigration,
  
} from './services/cleanup'

// Verification utilities (development)


// Legacy compatibility - these will be marked deprecated
/** @deprecated Use `storage` from './legacy-storage' instead */

/** @deprecated Use `storage` from './legacy-storage' instead */


// Default export for convenience - NOW SIMPLIFIED!

