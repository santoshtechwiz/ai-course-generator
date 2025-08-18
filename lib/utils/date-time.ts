/**
 * Date and Time Utilities
 * 
 * Consolidated date/time formatting and manipulation utilities.
 */

// ============================================================================
// DATE FORMATTING
// ============================================================================

/**
 * Format a date object or string with options
 */
export function formatDate(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }

  const parsedDate = date instanceof Date ? date : new Date(date)
  if (isNaN(parsedDate.getTime())) {
    return 'Invalid Date'
  }
  
  return new Intl.DateTimeFormat("en-US", { ...defaultOptions, ...options }).format(parsedDate)
}

/**
 * Format date for display (short format)
 */
export function formatDateShort(date: Date | string): string {
  return formatDate(date, {
    year: "numeric",
    month: "short",
    day: "numeric"
  })
}

/**
 * Format date and time separately
 */
export function formatDateTime(date: Date | string): { date: string; time: string } {
  const parsedDate = date instanceof Date ? date : new Date(date)
  return {
    date: formatDate(parsedDate, { year: "numeric", month: "short", day: "numeric" }),
    time: formatDate(parsedDate, { hour: "2-digit", minute: "2-digit" })
  }
}

// ============================================================================
// TIME DURATION FORMATTING
// ============================================================================

/**
 * Format time delta in seconds to readable format
 */
export function formatTimeDelta(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remainingSeconds = Math.floor(seconds % 60)

  if (hours > 0) {
    return `${hours}h ${minutes}m ${remainingSeconds}s`
  } else if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`
  } else {
    return `${remainingSeconds}s`
  }
}

/**
 * Format seconds into minutes:seconds format (e.g., "5:23")
 */
export function formatDuration(seconds: number): string {
  if (!seconds || isNaN(seconds)) return "--:--"
  
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.floor(seconds % 60)
  
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

/**
 * Legacy format time function (for compatibility)
 */
export function formatTime(time: number): string {
  const roundedTime = Math.round(time)
  const minutes = Math.floor(roundedTime / 60)
  const seconds = roundedTime - minutes * 60
  const formattedSeconds = seconds < 10 ? "0" + seconds : seconds.toString()
  return `${minutes}:${formattedSeconds}`
}

/**
 * Format duration in milliseconds to human readable format
 */
export function formatDurationMs(ms: number): string {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) return `${days}d ${hours % 24}h`
  if (hours > 0) return `${hours}h ${minutes % 60}m`
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`
  return `${seconds}s`
}

// ============================================================================
// RELATIVE TIME
// ============================================================================

/**
 * Get relative time string (e.g., "2 hours ago")
 */
export function getRelativeTime(date: Date | string): string {
  const now = new Date()
  const past = date instanceof Date ? date : new Date(date)
  const diffMs = now.getTime() - past.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)
  const diffWeek = Math.floor(diffDay / 7)
  const diffMonth = Math.floor(diffDay / 30)
  const diffYear = Math.floor(diffDay / 365)

  if (diffYear > 0) return `${diffYear} year${diffYear > 1 ? 's' : ''} ago`
  if (diffMonth > 0) return `${diffMonth} month${diffMonth > 1 ? 's' : ''} ago`
  if (diffWeek > 0) return `${diffWeek} week${diffWeek > 1 ? 's' : ''} ago`
  if (diffDay > 0) return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`
  if (diffHour > 0) return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`
  if (diffMin > 0) return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`
  return 'Just now'
}

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Check if a date is valid
 */
export function isValidDate(date: any): boolean {
  return date instanceof Date && !isNaN(date.getTime())
}

/**
 * Check if a date string is valid
 */
export function isValidDateString(dateString: string): boolean {
  const date = new Date(dateString)
  return isValidDate(date)
}

// ============================================================================
// TIME CONSTANTS
// ============================================================================

export const TIME_CONSTANTS = {
  SECOND: 1000,
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
  WEEK: 7 * 24 * 60 * 60 * 1000,
  MONTH: 30 * 24 * 60 * 60 * 1000,
  YEAR: 365 * 24 * 60 * 60 * 1000
} as const
