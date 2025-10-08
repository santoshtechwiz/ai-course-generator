/**
 * Centralized Middleware System
 * Clean exports with deprecated components removed
 */

// NEW: Unified middleware system (recommended)
export {
  unifiedMiddleware,
  tokenCache,
  middleware,
  isFeatureEnabled,
  matchRouteToFeature,
  type MiddlewareContext,
  type MiddlewareResult
} from './unified'

// API auth middlewares (still needed for API routes)
export { 
  withAuth, 
  withAdminAuth 
} from './auth-middleware'

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
  authSubscriptionSyncMiddleware 
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
