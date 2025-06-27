"use client"
import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"

interface ProgressBarProps {
  value: number
  streak?: number
  className?: string
}

export function ProgressBar({ value, streak = 0, className }: ProgressBarProps) {
  const [bestStreak, setBestStreak] = useState<number>(() => {
    if (typeof window !== "undefined") {
      return Number(localStorage.getItem("flashcard_best_streak") || 0)
    }
    return 0
  })
  const prevStreak = useRef(streak)
  const [streakAnim, setStreakAnim] = useState(false)

  useEffect(() => {
    if (streak > bestStreak) {
      setBestStreak(streak)
      localStorage.setItem("flashcard_best_streak", String(streak))
    }
    if (streak > prevStreak.current) {
      setStreakAnim(true)
      setTimeout(() => setStreakAnim(false), 400)
    }
    prevStreak.current = streak
  }, [streak, bestStreak])

  // Color feedback
  let barColor = "bg-primary"
  if (value >= 80) barColor = "bg-green-500"
  else if (value >= 50) barColor = "bg-yellow-400"
  else barColor = "bg-red-400"

  return (
    <div className={cn("w-full space-y-1", className)}>
      <div className="flex justify-between text-sm text-muted-foreground">
        <span>Progress</span>
        <span>{Math.round(value)}%</span>
      </div>
      <div
        className="relative h-2 w-full overflow-hidden rounded-full bg-secondary"
        aria-label="Progress"
        role="progressbar"
        aria-valuenow={Math.round(value)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={cn("h-full transition-all", barColor)}
          style={{ width: `${value}%` }}
        />
        {streak > 0 && (
          <div
            className={cn(
              "absolute right-0 top-0 flex items-center gap-1 pr-2 text-xs transition-transform",
              streakAnim && "scale-125"
            )}
          >
            <span className="text-amber-500">🔥</span>
            <span className="font-medium text-amber-600">{streak}</span>
          </div>
        )}
        {bestStreak > 0 && (
          <div className="absolute left-0 top-0 flex items-center gap-1 pl-2 text-xs text-purple-600">
            <span>🏅</span>
            <span>Best: {bestStreak}</span>
          </div>
        )}
      </div>
    </div>
  )
}