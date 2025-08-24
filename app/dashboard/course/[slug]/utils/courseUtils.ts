// Course utility functions to reduce duplication

/**
 * Safely converts chapter ID to string
 */
export const getChapterIdString = (chapter?: { id?: string | number } | null): string | undefined => {
  if (!chapter?.id) return undefined
  return String(chapter.id)
}

/**
 * Safely gets chapter title 
 */
export const getChapterTitle = (chapter?: { title?: string } | null): string => {
  return chapter?.title || ''
}

/**
 * Validates if a chapter object has required properties
 */
export const isValidChapter = (chapter: any): boolean => {
  return Boolean(
    chapter &&
    typeof chapter === "object" &&
    chapter.id && 
    (typeof chapter.id === "string" || typeof chapter.id === "number")
  )
}

/**
 * Gets safe initial seek seconds from course progress
 */
export const getInitialSeekSeconds = (
  courseProgress: any, 
  currentChapter?: { id?: string | number } | null
): number | undefined => {
  try {
    if (courseProgress?.videoProgress?.playedSeconds && 
        String(courseProgress.videoProgress.currentChapterId) === getChapterIdString(currentChapter)) {
      const ts = Number(courseProgress.videoProgress.playedSeconds)
      if (!isNaN(ts) && ts > 0) return ts
    }
  } catch {}
  return undefined
}