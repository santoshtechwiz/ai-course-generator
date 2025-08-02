/**
 * Middleware exports for organized imports
 */

// Auth middlewares
export { 
  protectAdminRoutes, 
  protectAuthenticatedRoutes 
} from './auth/route-protection'

// Security middlewares
export { 
  csrfMiddleware,
  generateClientCSRFToken
} from './security/csrf-protection'

export { 
  securityHeadersMiddleware,
  corsMiddleware,
  applySecurityHeaders
} from './security/headers'

// Store middlewares
export { 
  default as authSubscriptionSyncMiddleware 
} from './store/auth-sync'

export { 
  createPersistMiddleware,
  createSlicePersistMiddleware,
  hydrateFromStorage,
  safeStorage,
  cleanupStorage
} from './store/persistence'

// Re-export types
export type { } from './auth/route-protection'
