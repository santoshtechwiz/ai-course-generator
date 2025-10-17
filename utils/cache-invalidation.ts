/**
 * Cache Invalidation Utilities
 * 
 * Provides event-based cache invalidation for immediate dashboard updates
 * after user actions like quiz completion or course progress updates.
 * 
 * Usage:
 * 1. After quiz completion: invalidateDashboardCache()
 * 2. In dashboard hooks: useCacheInvalidation(mutate)
 */

export const CACHE_EVENTS = {
  QUIZ_COMPLETED: 'cache:quiz-completed',
  COURSE_PROGRESS_UPDATED: 'cache:course-progress-updated',
  USER_DATA_UPDATED: 'cache:user-data-updated'
} as const

/**
 * Invalidate dashboard cache to trigger immediate data refetch
 * Call this after quiz completion or course progress updates
 */
export function invalidateDashboardCache(eventType: keyof typeof CACHE_EVENTS = 'QUIZ_COMPLETED') {
  if (typeof window === 'undefined') return
  
  console.log(`[CacheInvalidation] Triggering cache invalidation: ${CACHE_EVENTS[eventType]}`)
  
  const event = new CustomEvent(CACHE_EVENTS[eventType], {
    detail: { timestamp: Date.now() }
  })
  
  window.dispatchEvent(event)
}

/**
 * Hook to listen for cache invalidation events and trigger SWR mutate
 * Use this in hooks that fetch dashboard data (useUserData, useUserStats)
 * 
 * @param mutate - SWR mutate function to trigger data refetch
 * @param events - Array of event types to listen for (defaults to all)
 */
export function useCacheInvalidation(
  mutate: () => void,
  events: Array<keyof typeof CACHE_EVENTS> = ['QUIZ_COMPLETED', 'COURSE_PROGRESS_UPDATED', 'USER_DATA_UPDATED']
) {
  if (typeof window === 'undefined') return
  
  // Set up event listeners for specified events
  const handlers = events.map(eventType => {
    const handler = (event: Event) => {
      console.log(`[CacheInvalidation] Received event: ${CACHE_EVENTS[eventType]}, revalidating data...`)
      mutate()
    }
    
    window.addEventListener(CACHE_EVENTS[eventType], handler)
    
    return { eventType, handler }
  })
  
  // Cleanup on unmount
  return () => {
    handlers.forEach(({ eventType, handler }) => {
      window.removeEventListener(CACHE_EVENTS[eventType], handler)
    })
  }
}

/**
 * Trigger cache invalidation after a delay
 * Useful for operations that need database consistency before refetching
 * 
 * @param delayMs - Delay in milliseconds before invalidation (default: 500ms)
 */
export function invalidateDashboardCacheDelayed(
  delayMs: number = 500,
  eventType: keyof typeof CACHE_EVENTS = 'QUIZ_COMPLETED'
) {
  setTimeout(() => {
    invalidateDashboardCache(eventType)
  }, delayMs)
}
