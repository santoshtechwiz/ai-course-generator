// hooks/usePlayerMilestones.ts
import { useEffect, useRef, useCallback } from "react"

interface Milestone {
  percent: number
  label: string
  message: string
  emoji: string
}

const MILESTONES: Milestone[] = [
  { percent: 0.25, label: "Quarter way!", message: "Keep it up! 🌟", emoji: "🚀" },
  { percent: 0.5, label: "Halfway there!", message: "You're crushing it! 💪", emoji: "⭐" },
  { percent: 0.75, label: "Almost done!", message: "Just a bit more! 🔥", emoji: "💯" },
  { percent: 0.9, label: "Nearly finished!", message: "Finish strong! 🎯", emoji: "✨" },
]

export function usePlayerMilestones(
  played: number,
  duration: number | null,
  onMilestoneReached?: (milestone: Milestone) => void
) {
  const reachedMilestonesRef = useRef<Set<number>>(new Set())

  useEffect(() => {
    if (!duration || duration === 0) return

    const progress = played / duration

    MILESTONES.forEach((milestone) => {
      if (progress >= milestone.percent && !reachedMilestonesRef.current.has(milestone.percent)) {
        reachedMilestonesRef.current.add(milestone.percent)
        onMilestoneReached?.(milestone)
      }
    })
  }, [played, duration, onMilestoneReached])

  const resetMilestones = useCallback(() => {
    reachedMilestonesRef.current.clear()
  }, [])

  return { resetMilestones }
}
