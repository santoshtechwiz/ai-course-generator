/**
 * Formatting utilities for the course player
 */

/**
 * Format seconds to human-readable duration string
 * @param seconds - Number of seconds
 * @returns Formatted string (e.g., "1h 30m", "45m", "30s")
 */
export function formatSeconds(seconds: number): string {
  if (!seconds || seconds < 0) return '0s'
  
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`
  } else if (minutes > 0) {
    return `${minutes}m`
  } else {
    return `${secs}s`
  }
}

/**
 * Format duration for display (includes seconds for short durations)
 * @param seconds - Number of seconds
 * @returns Formatted string (e.g., "1h 30m", "45m 20s", "30s")
 */
export function formatDuration(seconds: number): string {
  if (!seconds || seconds < 0) return '0s'
  
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`
  } else {
    return `${secs}s`
  }
}

/**
 * Format time to MM:SS or HH:MM:SS format
 * @param seconds - Number of seconds
 * @returns Formatted time string (e.g., "01:30" or "1:30:00")
 */
export function formatTime(seconds: number): string {
  if (!seconds || seconds < 0) return '0:00'
  
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`
}

/**
 * Parse duration string to seconds
 * @param duration - Duration string (e.g., "1h 30m", "45m")
 * @returns Number of seconds
 */
export function parseDuration(duration: string): number {
  const hours = duration.match(/(\d+)h/)
  const minutes = duration.match(/(\d+)m/)
  const seconds = duration.match(/(\d+)s/)
  
  return (
    (hours ? parseInt(hours[1]) * 3600 : 0) +
    (minutes ? parseInt(minutes[1]) * 60 : 0) +
    (seconds ? parseInt(seconds[1]) : 0)
  )
}
