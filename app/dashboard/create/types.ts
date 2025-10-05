/**
 * Shared types for Course Editor components
 * Prevents circular dependencies between useCourseEditor hook and ChapterCard component
 */

export type ChapterStatus = "idle" | "processing" | "success" | "error"

export interface ChapterGenerationStatus {
  status: ChapterStatus
  message?: string
}

export interface ChapterCardHandler {
  triggerLoad: () => Promise<void>
}
