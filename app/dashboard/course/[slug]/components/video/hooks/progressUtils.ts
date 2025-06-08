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
 * Formats seconds into a human-readable time string (MM:SS or HH:MM:SS)
 *
 * @param seconds - The number of seconds to format
 * @returns A formatted time string
 */
export const formatTime = (seconds: number): string => {
  if (isNaN(seconds)) return "0:00"

  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)

  return h > 0
    ? `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
    : `${m}:${s.toString().padStart(2, "0")}`
}

/**
 * Calculates the buffer health percentage based on loaded seconds and playback position
 *
 * @param loadedSeconds - The number of seconds loaded in buffer
 * @param playedSeconds - The current playback position in seconds
 * @returns A buffer health percentage between 0 and 100
 */
export const calculateBufferHealth = (loadedSeconds: number, playedSeconds: number): number => {
  if (loadedSeconds <= playedSeconds) return 0

  // Calculate buffer ahead (seconds ahead that are loaded)
  const bufferAhead = loadedSeconds - playedSeconds

  // Buffer health increases up to 30 seconds ahead (considered 100% healthy)
  const maxBufferAhead = 30
  const bufferHealth = Math.min((bufferAhead / maxBufferAhead) * 100, 100)

  return Math.round(bufferHealth)
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
  autoPlayNext?: boolean
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
    if (preferences.autoPlayNext !== undefined) {
      localStorage.setItem("video-player-autoplay-next", preferences.autoPlayNext.toString())
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
  autoPlayNext: boolean
} {
  const defaults = {
    volume: 0.8,
    muted: false,
    playbackRate: 1.0,
    autoPlayNext: true,
  }

  try {
    const volume = localStorage.getItem("video-player-volume")
    const muted = localStorage.getItem("video-player-muted")
    const playbackRate = localStorage.getItem("video-player-playback-rate")
    const autoPlayNext = localStorage.getItem("video-player-autoplay-next")

    return {
      volume: volume ? Number.parseFloat(volume) : defaults.volume,
      muted: muted ? muted === "true" : defaults.muted,
      playbackRate: playbackRate ? Number.parseFloat(playbackRate) : defaults.playbackRate,
      autoPlayNext: autoPlayNext ? autoPlayNext === "true" : defaults.autoPlayNext,
    }
  } catch (error) {
    console.warn("Failed to load player preferences:", error)
    return defaults
  }
}
