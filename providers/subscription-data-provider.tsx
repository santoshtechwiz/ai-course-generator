"use client"

import type React from "react"

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react"
import { useSession } from "next-auth/react"
import { usePathname } from "next/navigation"
import useSubscriptionStore from "@/store/useSubscriptionStore"
import { throttle } from "lodash"

type SubscriptionDataContextType = {
  isLoading: boolean
  lastRefreshed: number
  refreshSubscriptionData: (force?: boolean) => Promise<void>
}

const SubscriptionDataContext = createContext<SubscriptionDataContextType>({
  isLoading: false,
  lastRefreshed: 0,
  refreshSubscriptionData: async () => {},
})

export const useSubscriptionData = () => useContext(SubscriptionDataContext)

export function SubscriptionDataProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const pathname = usePathname()
  const { refreshSubscription } = useSubscriptionStore()
  const [isLoading, setIsLoading] = useState(false)
  const [lastRefreshed, setLastRefreshed] = useState(0)
  const isRefreshingRef = useRef(false)
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Throttled refresh function to prevent too many refreshes
  const refreshSubscriptionData = useCallback(
    async (force = false) => {
      // Prevent concurrent refreshes
      if (isRefreshingRef.current) return

      // Skip if not authenticated
      if (status !== "authenticated" || !session?.user?.id) return

      // Skip if recently refreshed and not forced
      if (!force && Date.now() - lastRefreshed < 60000) return

      try {
        isRefreshingRef.current = true
        setIsLoading(true)

        await refreshSubscription(force)

        setLastRefreshed(Date.now())
      } catch (error) {
        console.error("Error refreshing subscription data:", error)
      } finally {
        setIsLoading(false)
        isRefreshingRef.current = false
      }
    },
    [status, session?.user?.id, lastRefreshed, refreshSubscription],
  )

  // Throttled version for event listeners
  const throttledRefresh = useCallback(
    throttle(() => refreshSubscriptionData(false), 5000, { leading: true, trailing: false }),
    [refreshSubscriptionData],
  )

  // Set up refresh interval
  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      // Initial refresh
      refreshSubscriptionData(true)

      // Set up interval
      refreshIntervalRef.current = setInterval(
        () => {
          refreshSubscriptionData(false)
        },
        5 * 60 * 1000,
      ) // Every 5 minutes
    }

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current)
      }
    }
  }, [session, status, refreshSubscriptionData])

  // Refresh on route change
  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      throttledRefresh()
    }
  }, [pathname, session, status, throttledRefresh])

  // User activity monitoring
  useEffect(() => {
    if (status !== "authenticated") return

    const inactivityThreshold = 5 * 60 * 1000 // 5 minutes
    let inactivityTimer: NodeJS.Timeout | null = null

    const resetInactivityTimer = () => {
      if (inactivityTimer) clearTimeout(inactivityTimer)

      inactivityTimer = setTimeout(() => {
        // Force refresh on next interaction after inactivity
        setLastRefreshed(0)
      }, inactivityThreshold)
    }

    const handleUserActivity = () => {
      if (Date.now() - lastRefreshed >= inactivityThreshold) {
        throttledRefresh()
      }
      resetInactivityTimer()
    }

    // Set up initial timer
    resetInactivityTimer()

    // Add event listeners
    window.addEventListener("mousemove", handleUserActivity, { passive: true })
    window.addEventListener("touchstart", handleUserActivity, { passive: true })
    window.addEventListener("keydown", handleUserActivity, { passive: true })

    return () => {
      if (inactivityTimer) clearTimeout(inactivityTimer)
      window.removeEventListener("mousemove", handleUserActivity)
      window.removeEventListener("touchstart", handleUserActivity)
      window.removeEventListener("keydown", handleUserActivity)
    }
  }, [status, lastRefreshed, throttledRefresh])

  return (
    <SubscriptionDataContext.Provider
      value={{
        isLoading,
        lastRefreshed,
        refreshSubscriptionData,
      }}
    >
      {children}
    </SubscriptionDataContext.Provider>
  )
}
