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
 * Format seconds into a human-readable duration string (MM:SS)
 */
export function formatDuration(seconds: number): string {
  if (!seconds || isNaN(seconds)) return "--:--"

  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.floor(seconds % 60)

  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
}

/**
 * Calculate lesson number from chapter ID and course units
 */
export function getLessonNumber(chapterId: string | number | undefined, courseUnits: any[]): {
  current: number;
  total: number;
} {
  if (!chapterId || !courseUnits || !courseUnits.length) {
    return { current: 1, total: 0 }
  }
  
  const allChapters = courseUnits.flatMap(unit => unit.chapters || [])
  const currentIndex = allChapters.findIndex(chapter => chapter.id === chapterId)
  
  return {
    current: currentIndex >= 0 ? currentIndex + 1 : 1,
    total: allChapters.length
  }
}

/**
 * Check if content is fully loaded
 */
export function isContentLoaded(chapter?: any, course?: any): boolean {
  return !!(
    chapter && 
    chapter.title && 
    course && 
    course.courseUnits && 
    course.courseUnits.length > 0
  )
}
