/**
 * Centralized Middleware System
 * Main entry point for all middleware functionality
 */

// Core unified middleware
export {
  UnifiedMiddlewareService,
  unifiedMiddleware,
  type MiddlewareContext,
  type MiddlewareResult
} from '../core/unified-middleware'

// Token management
export {
  TokenCacheService,
  tokenCache
} from '../core/token-cache'

// Feature flag integration
export * from '../../lib/featureFlags'

// Route configuration
export * from '../../config/feature-routes'

// Legacy support (for gradual migration)
export { 
  withAuth, 
  withAdminAuth 
} from '../auth-middleware'

// Security middlewares (keep existing)
export { 
  csrfMiddleware,
  generateClientCSRFToken
} from '../security/csrf-protection'

export { 
  securityHeadersMiddleware,
  corsMiddleware,
  applySecurityHeaders
} from '../security/headers'

// Store middlewares (keep existing)
export { 
  authSubscriptionSyncMiddleware 
} from '../store/auth-sync'

export { 
  createPersistMiddleware,
  createSlicePersistMiddleware
} from '../store/persistence'

// Import for convenience exports
import { unifiedMiddleware } from '../core/unified-middleware'
import { tokenCache } from '../core/token-cache'

// Convenience exports for common use cases
export const middleware = {
  unified: unifiedMiddleware,
  token: tokenCache,
  
  // Quick access methods
  isFeatureEnabled: (flag: string, context?: any) => {
    const { isFeatureEnabled } = require('../lib/featureFlags')
    return isFeatureEnabled(flag, context)
  },
  
  isRouteProtected: (pathname: string) => {
    const { matchRouteToFeature } = require('../config/feature-routes')
    const config = matchRouteToFeature(pathname)
    return config && !config.allowPublicAccess
  },
  
  getTokenFromRequest: async (req: any) => {
    return await tokenCache.getCachedToken(req)
  }
}

// Performance monitoring (if enabled)
if (process.env.NODE_ENV !== 'production') {
  console.log('[Middleware] Centralized middleware system loaded')
}