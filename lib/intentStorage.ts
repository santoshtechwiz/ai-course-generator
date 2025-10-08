/**
 * Intent Storage - Session-based backup for post-auth redirects
 * 
 * Ensures user intent is preserved through authentication flows
 * even if callbackUrl mechanism fails.
 */

interface UserIntent {
  pathname: string
  search: string
  timestamp: number
  action?: string // e.g., "create_quiz", "view_course"
  metadata?: Record<string, unknown>
}

const INTENT_KEY = 'postAuthIntent'
const INTENT_EXPIRY = 600000 // 10 minutes

/**
 * Save user's intended destination before auth redirect
 */
export function saveIntent(
  pathname: string, 
  search?: string,
  action?: string,
  metadata?: Record<string, unknown>
): void {
  if (typeof window === 'undefined') return
  
  const intent: UserIntent = {
    pathname,
    search: search || '',
    timestamp: Date.now(),
    action,
    metadata
  }
  
  sessionStorage.setItem(INTENT_KEY, JSON.stringify(intent))
  console.log('[Intent Storage] Saved:', intent)
}

/**
 * Retrieve saved intent after authentication
 * Returns null if no intent or expired
 */
export function getIntent(): UserIntent | null {
  if (typeof window === 'undefined') return null
  
  const stored = sessionStorage.getItem(INTENT_KEY)
  if (!stored) return null
  
  try {
    const intent: UserIntent = JSON.parse(stored)
    
    // Check if intent expired (10 minutes)
    if (Date.now() - intent.timestamp > INTENT_EXPIRY) {
      console.log('[Intent Storage] Intent expired, clearing')
      clearIntent()
      return null
    }
    
    console.log('[Intent Storage] Retrieved:', intent)
    return intent
  } catch (error) {
    console.error('[Intent Storage] Error parsing intent:', error)
    clearIntent()
    return null
  }
}

/**
 * Clear saved intent (call after successful restoration)
 */
export function clearIntent(): void {
  if (typeof window === 'undefined') return
  sessionStorage.removeItem(INTENT_KEY)
  console.log('[Intent Storage] Cleared')
}

/**
 * Get intent and clear it atomically
 */
export function consumeIntent(): UserIntent | null {
  const intent = getIntent()
  if (intent) {
    clearIntent()
  }
  return intent
}

/**
 * Check if there's a pending intent
 */
export function hasIntent(): boolean {
  return getIntent() !== null
}
