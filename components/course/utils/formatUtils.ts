/**
 * Format seconds into a human-readable time string (mm:ss or hh:mm:ss)
 */
export function formatDuration(seconds: number): string {
  if (!seconds || isNaN(seconds)) return "00:00"
  
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remainingSeconds = Math.floor(seconds % 60)
  
  // Format with leading zeros
  const mm = minutes.toString().padStart(2, "0")
  const ss = remainingSeconds.toString().padStart(2, "0")
  
  // Only include hours if needed
  return hours > 0
    ? `${hours}:${mm}:${ss}`
    : `${mm}:${ss}`
}

/**
 * Format a duration in minutes (e.g., "5 min read")
 */
export function formatMinutes(minutes: number): string {
  if (!minutes || isNaN(minutes)) return "0 min"
  
  if (minutes < 1) {
    // Less than a minute
    return "< 1 min"
  }
  
  if (minutes >= 60) {
    // More than an hour
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = Math.round(minutes % 60)
    
    if (remainingMinutes === 0) {
      return `${hours} hr`
    }
    
    return `${hours} hr ${remainingMinutes} min`
  }
  
  // Round to nearest minute
  return `${Math.round(minutes)} min`
}
