// Progress tracking milestones (percentages)
export const PROGRESS_MILESTONES = [0.1, 0.25, 0.5, 0.75, 0.9, 1.0] as const

// Debounce delay for progress updates (ms)
export const PROGRESS_UPDATE_DELAY = 2000

// Throttle delay for frequent updates (ms)
export const PROGRESS_THROTTLE_DELAY = 500

/**
 * Check if a milestone has been reached
 */
export function checkMilestoneReached(
  currentProgress: number,
  milestone: number,
  reachedMilestones: Set<number>,
): boolean {
  const threshold = 0.02 // 2% threshold for milestone detection
  return (
    currentProgress >= milestone - threshold &&
    currentProgress <= milestone + threshold &&
    !reachedMilestones.has(milestone)
  )
}

/**
 * Get the next milestone to track
 */
export function getNextMilestone(currentProgress: number): number | null {
  return PROGRESS_MILESTONES.find((milestone) => currentProgress < milestone) || null
}

/**
 * Calculate buffer health level
 */
export function calculateBufferHealth(loaded: number, played: number): number {
  const bufferAhead = Math.max(0, loaded - played)
  return Math.min(100, bufferAhead * 100)
}

/**
 * Format time for display
 */
export function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return "0:00"

  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)

  if (h > 0) {
    return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
  }

  return `${m}:${s.toString().padStart(2, "0")}`
}

/**
 * Create a debounced function
 */
export function debounce<T extends (...args: any[]) => any>(func: T, delay: number): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    timeoutId = setTimeout(() => {
      func(...args)
    }, delay)
  }
}

/**
 * Create a throttled function
 */
export function throttle<T extends (...args: any[]) => any>(func: T, delay: number): (...args: Parameters<T>) => void {
  let lastCall = 0

  return (...args: Parameters<T>) => {
    const now = Date.now()

    if (now - lastCall >= delay) {
      lastCall = now
      func(...args)
    }
  }
}

/**
 * Save player preferences to localStorage
 */
export function savePlayerPreferences(preferences: {
  volume?: number
  muted?: boolean
  playbackRate?: number
}): void {
  try {
    if (preferences.volume !== undefined) {
      localStorage.setItem("video-player-volume", preferences.volume.toString())
    }
    if (preferences.muted !== undefined) {
      localStorage.setItem("video-player-muted", preferences.muted.toString())
    }
    if (preferences.playbackRate !== undefined) {
      localStorage.setItem("video-player-playback-rate", preferences.playbackRate.toString())
    }
  } catch (error) {
    console.warn("Failed to save player preferences:", error)
  }
}

/**
 * Load player preferences from localStorage
 */
export function loadPlayerPreferences(): {
  volume: number
  muted: boolean
  playbackRate: number
} {
  const defaults = {
    volume: 0.8,
    muted: false,
    playbackRate: 1.0,
  }

  try {
    const volume = localStorage.getItem("video-player-volume")
    const muted = localStorage.getItem("video-player-muted")
    const playbackRate = localStorage.getItem("video-player-playback-rate")

    return {
      volume: volume ? Number.parseFloat(volume) : defaults.volume,
      muted: muted ? muted === "true" : defaults.muted,
      playbackRate: playbackRate ? Number.parseFloat(playbackRate) : defaults.playbackRate,
    }
  } catch (error) {
    console.warn("Failed to load player preferences:", error)
    return defaults
  }
}
