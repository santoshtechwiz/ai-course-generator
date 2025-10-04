// Simplified auth sync for unified subscription approach
import { createListenerMiddleware } from '@reduxjs/toolkit'
import { logger } from '@/lib/logger'

export const authSubscriptionSyncMiddleware = createListenerMiddleware()

// Note: Subscription syncing is now handled by SWR in useUnifiedSubscription
// This middleware is simplified and primarily for logging
