import { useEffect, useRef, useCallback } from 'react'

interface SavedPosition {
  chapterId: string
  seconds: number
  timestamp: number
}

const STORAGE_KEY_PREFIX = 'video_position_'
const STORAGE_EXPIRY_DAYS = 30

/**
 * Hook to manage video position persistence locally
 * Stores the last watched position in localStorage and syncs to DB on chapter complete or page unload
 */
export function useVideoPositionMemory(courseId: string | number, chapterId: string | number) {
  const saveTimeoutRef = useRef<NodeJS.Timeout>()
  const lastSavedRef = useRef<number>(0)
  const MIN_SAVE_INTERVAL = 5000 // Save at most every 5 seconds

  const getStorageKey = useCallback((cId: string | number, chId: string | number) => {
    return `${STORAGE_KEY_PREFIX}${String(cId)}_${String(chId)}`
  }, [])

  // Get saved position from localStorage
  const getSavedPosition = useCallback((): SavedPosition | null => {
    try {
      const key = getStorageKey(courseId, chapterId)
      const saved = localStorage.getItem(key)
      
      if (!saved) return null

      const parsed = JSON.parse(saved) as SavedPosition
      const expiryDate = new Date(parsed.timestamp)
      expiryDate.setDate(expiryDate.getDate() + STORAGE_EXPIRY_DAYS)

      // Return null if data is older than STORAGE_EXPIRY_DAYS
      if (Date.now() > expiryDate.getTime()) {
        localStorage.removeItem(key)
        return null
      }

      return parsed
    } catch (e) {
      console.warn('[useVideoPositionMemory] Error reading saved position:', e)
      return null
    }
  }, [courseId, chapterId, getStorageKey])

  // Save position to localStorage (throttled)
  const savePosition = useCallback((seconds: number) => {
    const now = Date.now()

    // Throttle saves to MAX once per MIN_SAVE_INTERVAL
    if (now - lastSavedRef.current < MIN_SAVE_INTERVAL) {
      return
    }

    lastSavedRef.current = now

    try {
      const key = getStorageKey(courseId, chapterId)
      const position: SavedPosition = {
        chapterId: String(chapterId),
        seconds,
        timestamp: now,
      }

      localStorage.setItem(key, JSON.stringify(position))
      console.log(`[useVideoPositionMemory] Saved position: ${seconds}s for chapter ${chapterId}`)
    } catch (e) {
      // Ignore localStorage quota exceeded errors
      if (e instanceof Error && e.name === 'QuotaExceededError') {
        console.warn('[useVideoPositionMemory] localStorage quota exceeded, skipping save')
      } else {
        console.warn('[useVideoPositionMemory] Error saving position:', e)
      }
    }
  }, [courseId, chapterId, getStorageKey])

  // Save position on page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      // This will be called when page unloads
      // The actual position saving should be done by the component tracking player state
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [])

  return {
    getSavedPosition,
    savePosition,
  }
}
