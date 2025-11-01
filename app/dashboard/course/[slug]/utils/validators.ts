/**
 * Validation utilities for course components
 */

/**
 * Validate if a chapter object has the required properties
 * @param chapter - Chapter object to validate
 * @returns true if chapter is valid, false otherwise
 */
export function validateChapter(chapter: any): boolean {
  return Boolean(
    chapter &&
    typeof chapter === 'object' &&
    chapter.id &&
    (typeof chapter.id === 'string' || typeof chapter.id === 'number')
  )
}

/**
 * Validate if a chapter has a video
 * @param chapter - Chapter object to validate
 * @returns true if chapter has a valid videoId, false otherwise
 */
export function validateChapterWithVideo(chapter: any): boolean {
  return validateChapter(chapter) && Boolean(chapter.videoId)
}

/**
 * Validate if a course object has the required properties
 * @param course - Course object to validate
 * @returns true if course is valid, false otherwise
 */
export function validateCourse(course: any): boolean {
  return Boolean(
    course &&
    typeof course === 'object' &&
    course.id &&
    course.title &&
    Array.isArray(course.courseUnits)
  )
}

/**
 * Validate video ID format (YouTube)
 * @param videoId - Video ID to validate
 * @returns true if videoId is valid, false otherwise
 */
export function validateVideoId(videoId: string | null | undefined): boolean {
  if (!videoId) return false
  // YouTube video IDs are typically 11 characters
  return typeof videoId === 'string' && videoId.length >= 10 && videoId.length <= 12
}

/**
 * Validate progress value
 * @param progress - Progress value to validate (0-100)
 * @returns true if progress is valid, false otherwise
 */
export function validateProgress(progress: number): boolean {
  return typeof progress === 'number' && progress >= 0 && progress <= 100
}
