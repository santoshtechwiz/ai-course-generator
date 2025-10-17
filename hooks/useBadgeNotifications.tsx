"use client"

import { useEffect, useRef } from "react"
import { toast } from "sonner"
import { Trophy } from "lucide-react"

export function useBadgeNotifications(userId: string | undefined, enabled = true) {
  const lastCheckRef = useRef<number>(Date.now())
  const checkedBadgesRef = useRef<Set<string>>(new Set())
  const isCheckingRef = useRef<boolean>(false)

  useEffect(() => {
    if (!userId || !enabled) return

    const checkForNewBadges = async () => {
      if (isCheckingRef.current) return
      isCheckingRef.current = true
      
      try {
        const response = await fetch('/api/badges')
        if (!response.ok) return

        const data = await response.json()
        const badges = data.badges || []

        const newBadges = badges.filter((badge: any) => {
          const earnedAt = new Date(badge.earnedAt).getTime()
          const isNew = earnedAt > lastCheckRef.current
          const notChecked = !checkedBadgesRef.current.has(badge.badgeId)
          return isNew && notChecked
        })

        newBadges.forEach((badge: any) => {
          checkedBadgesRef.current.add(badge.badgeId)
          
          toast.success(
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                <Trophy className="h-5 w-5 text-yellow-500" />
              </div>
              <div>
                <p className="font-semibold">Badge Unlocked!</p>
                <p className="text-sm text-muted-foreground">
                  {badge.badge?.name || "Achievement earned"}
                </p>
                {badge.badge?.description && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {badge.badge.description}
                  </p>
                )}
              </div>
            </div>,
            {
              duration: 5000,
              position: "top-right",
            }
          )
        })

        if (newBadges.length > 0) {
          lastCheckRef.current = Date.now()
        }
      } catch (error) {
        console.error('[useBadgeNotifications] Error checking badges:', error)
      } finally {
        isCheckingRef.current = false
      }
    }

    checkForNewBadges()
    const interval = setInterval(checkForNewBadges, 30000)

    return () => clearInterval(interval)
  }, [userId, enabled])
}

export function useStreakNotifications(userId: string | undefined, enabled = true) {
  const lastStreakRef = useRef<number | null>(null)
  const isCheckingRef = useRef<boolean>(false)

  useEffect(() => {
    if (!userId || !enabled) return

    const checkStreak = async () => {
      if (isCheckingRef.current) return
      isCheckingRef.current = true
      
      try {
        const response = await fetch('/api/flashcards/streak')
        if (!response.ok) return

        const data = await response.json()
        const currentStreak = data.streak || 0

        if (lastStreakRef.current !== null && currentStreak > lastStreakRef.current) {
          const streakDiff = currentStreak - lastStreakRef.current
          
          toast.success(
            <div>
              <p className="font-semibold">Streak Updated! ���</p>
              <p className="text-sm text-muted-foreground">
                {currentStreak} day streak! 
                {streakDiff > 1 && ` (+${streakDiff} days)`}
              </p>
            </div>,
            {
              duration: 4000,
              position: "top-right",
            }
          )
        }

        lastStreakRef.current = currentStreak
      } catch (error) {
        console.error('[useStreakNotifications] Error checking streak:', error)
      } finally {
        isCheckingRef.current = false
      }
    }

    checkStreak()
    const interval = setInterval(checkStreak, 60000)

    return () => clearInterval(interval)
  }, [userId, enabled])
}
