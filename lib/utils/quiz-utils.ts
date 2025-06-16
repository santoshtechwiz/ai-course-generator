/**
 * Calculates the performance level based on a score percentage
 * @param percentage Score percentage (0-100)
 * @returns Performance level descriptor
 */
export function calculatePerformanceLevel(percentage: number): string {
  if (percentage >= 90) return "Excellent"
  if (percentage >= 80) return "Very Good"
  if (percentage >= 70) return "Good" 
  if (percentage >= 60) return "Fair"
  if (percentage >= 50) return "Needs Work"
  return "Poor"
}

/**
 * Formats time in seconds to a human-readable string
 * @param seconds Total seconds
 * @returns Formatted time string
 */
export function formatTimeSpent(seconds: number): string {
  if (seconds < 60) {
    return `${seconds} sec`
  }
  
  const minutes = Math.floor(seconds / 60)
  const remainingSecs = seconds % 60
  
  if (minutes < 60) {
    return `${minutes}m ${remainingSecs}s`
  }
  
  const hours = Math.floor(minutes / 60)
  const remainingMins = minutes % 60
  
  return `${hours}h ${remainingMins}m ${remainingSecs}s`
}

/**
 * Gets the appropriate color based on score percentage
 * @param percentage Score percentage (0-100)
 * @returns CSS color class
 */
export function getScoreColor(percentage: number): string {
  if (percentage >= 90) return "text-emerald-600 dark:text-emerald-400"
  if (percentage >= 80) return "text-blue-600 dark:text-blue-400"
  if (percentage >= 70) return "text-green-600 dark:text-green-400"
  if (percentage >= 60) return "text-yellow-600 dark:text-yellow-400"
  if (percentage >= 50) return "text-orange-600 dark:text-orange-400"
  return "text-red-600 dark:text-red-400"
}
