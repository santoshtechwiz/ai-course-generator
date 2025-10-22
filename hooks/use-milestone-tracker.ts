import { useEffect, useCallback, useRef } from "react"
import { useAppSelector } from "@/store/hooks"
import { useToast } from "@/hooks/use-toast"

interface MilestoneRecord {
  courseId: string
  milestone: number // 25, 50, 75, 100
  notifiedAt: number
}

// In-memory storage for shown milestones in current session
const shownMilestones = new Map<string, Set<number>>()

/**
 * Track and notify when users hit learning milestones (25%, 50%, 75%, 100%)
 * Prevents duplicate notifications within same session
 */
export function useMilestoneTracker(courseId: string | number) {
  const { toast } = useToast()
  const courseIdStr = String(courseId)
  const shownRef = useRef<Set<number>>(shownMilestones.get(courseIdStr) || new Set())

  // Get current progress from Redux
  const courseProgress = useAppSelector((state) => {
    const byCourseId = state.courseProgress?.byCourseId
    return byCourseId?.[courseIdStr]?.videoProgress?.progress || 0
  })

  // Get completed chapters count for engagement context
  const completedChapters = useAppSelector((state) => {
    const byCourseId = state.courseProgress?.byCourseId
    return byCourseId?.[courseIdStr]?.videoProgress?.completedChapters?.length || 0
  })

  // Get total chapters for percentage calculation
  const totalChapters = useAppSelector((state) => {
    const byCourseId = state.courseProgress?.byCourseId
    // Use completed chapters count or default to 10
    return 10
  })

  const checkAndNotifyMilestone = useCallback(() => {
    // Calculate progress percentage based on completed chapters
    const progressPercent = totalChapters > 0 
      ? Math.round((completedChapters / totalChapters) * 100)
      : courseProgress

    // Define milestones with messages and emojis
    const milestones = [
      { percent: 25, emoji: "🔥", message: "Great start! You're 25% through this course!" },
      { percent: 50, emoji: "⚡", message: "Halfway there! You're 50% complete - keep it up!" },
      { percent: 75, emoji: "🚀", message: "Almost done! You're 75% through this course!" },
      { percent: 100, emoji: "🎉", message: "Congratulations! You've completed this course!" },
    ]

    // Check each milestone
    milestones.forEach(({ percent, emoji, message }) => {
      if (progressPercent >= percent && !shownRef.current.has(percent)) {
        // Mark as shown
        shownRef.current.add(percent)
        shownMilestones.set(courseIdStr, shownRef.current)

        // Show toast notification
        toast({
          title: `${emoji} Milestone Reached!`,
          description: message,
          duration: 5000,
        })

        // Log milestone achievement
        console.log(`[Milestone] Course ${courseIdStr}: ${percent}% complete`, {
          completedChapters,
          totalChapters,
          timestamp: new Date().toISOString(),
        })
      }
    })
  }, [courseId, completedChapters, totalChapters, courseProgress, toast, courseIdStr])

  // Check for milestones whenever progress changes
  useEffect(() => {
    if (completedChapters > 0) {
      checkAndNotifyMilestone()
    }
  }, [completedChapters, checkAndNotifyMilestone])

  return {
    progressPercent: totalChapters > 0 
      ? Math.round((completedChapters / totalChapters) * 100)
      : courseProgress,
    completedChapters,
    totalChapters,
    shownMilestones: Array.from(shownRef.current),
  }
}

/**
 * Reset milestone tracker for a course (useful for testing or when refreshing)
 */
export function resetMilestoneTracker(courseId: string | number) {
  shownMilestones.delete(String(courseId))
}

/**
 * Reset all milestone trackers
 */
export function resetAllMilestoneTrackers() {
  shownMilestones.clear()
}
