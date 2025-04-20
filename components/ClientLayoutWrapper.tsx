"use client"
import type React from "react"

import NextTopLoader from "nextjs-toploader"
import { Suspense, useCallback, useRef, useState } from "react"
import { SubscriptionProvider } from "@/providers/SubscriptionProvider"
import { UserProvider } from "@/providers/userContext"
import { SessionProvider } from "next-auth/react"
import { AnimationProvider } from "@/providers/animation-provider"
import MainNavbar from "./shared/MainNavbar"
import { useEffect } from "react"
import { useSession } from "next-auth/react"
import { useSubscriptionStore } from "@/app/store/subscriptionStore"
import { usePathname } from "next/navigation"

export function ClientLayoutWrapper({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const pathname = usePathname()
  const lastRefreshRef = useRef<number>(Date.now())
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const isRefreshingRef = useRef<boolean>(false)
  const { refreshSubscription } = useSubscriptionStore()
  const [isInitialRefresh, setIsInitialRefresh] = useState(true)

  // Function to refresh user data with intelligent caching
  const refreshUserData = useCallback(async () => {
    // Prevent concurrent refreshes
    if (isRefreshingRef.current) return

    try {
      isRefreshingRef.current = true

      // Only refresh if user is authenticated
      if (status === "authenticated" && session?.user?.id) {
        // Force refresh on initial load
        const forceRefresh = isInitialRefresh

        // Call the subscription store's refresh function
        await refreshSubscription(forceRefresh)

        // Update last refresh timestamp
        lastRefreshRef.current = Date.now()

        // No longer initial refresh
        if (isInitialRefresh) {
          setIsInitialRefresh(false)
        }
      }
    } catch (error) {
      console.error("Error refreshing user data:", error)
    } finally {
      isRefreshingRef.current = false
    }
  }, [session?.user?.id, status, refreshSubscription, isInitialRefresh])

  // Set up refresh interval with exponential backoff
  useEffect(() => {
    // Clear any existing interval
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current)
    }

    // Only set up interval if user is authenticated
    if (status === "authenticated" && session?.user) {
      // Initial refresh
      refreshUserData()

      // Set up adaptive refresh interval
      let interval = 30000 // Start with 30s
      let errorCount = 0

      refreshIntervalRef.current = setInterval(() => {
        // Only refresh if it's been at least the interval time since the last refresh
        const now = Date.now()
        if (now - lastRefreshRef.current >= interval) {
          refreshUserData().catch((err) => {
            console.error("Error in refresh interval:", err)
            errorCount++

            // Exponential backoff on errors (up to 5 minutes)
            if (errorCount > 0) {
              interval = Math.min(interval * 1.5, 300000) // 5 minutes max
            }
          })
        }
      }, 10000) // Check every 10s, but only refresh based on the adaptive interval
    }

    // Cleanup interval on unmount
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current)
      }
    }
  }, [session, status, refreshUserData])

  // Refresh on route change, but with rate limiting
  useEffect(() => {
    // Only refresh if authenticated and it's been at least 1 minute since last refresh
    if (status === "authenticated" && session?.user) {
      const now = Date.now()
      if (now - lastRefreshRef.current >= 60000) {
        // 1 minute
        refreshUserData()
      }
    }
  }, [pathname, session, status, refreshUserData])

  // Force refresh when user interacts with the page after inactivity
  useEffect(() => {
    let inactivityTimer: NodeJS.Timeout | null = null
    const inactivityThreshold = 5 * 60 * 1000 // 5 minutes

    const resetInactivityTimer = () => {
      if (inactivityTimer) {
        clearTimeout(inactivityTimer)
      }

      inactivityTimer = setTimeout(() => {
        // User has been inactive, mark for refresh on next interaction
        lastRefreshRef.current = 0
      }, inactivityThreshold)
    }

    const handleUserActivity = () => {
      // If user has been inactive for a while, refresh data
      const now = Date.now()
      if (now - lastRefreshRef.current >= inactivityThreshold) {
        refreshUserData()
      }

      resetInactivityTimer()
    }

    // Set up initial timer
    resetInactivityTimer()

    // Add event listeners for user activity
    window.addEventListener("mousemove", handleUserActivity, { passive: true })
    window.addEventListener("touchstart", handleUserActivity, { passive: true })
    window.addEventListener("keydown", handleUserActivity, { passive: true })

    return () => {
      if (inactivityTimer) {
        clearTimeout(inactivityTimer)
      }
      window.removeEventListener("mousemove", handleUserActivity)
      window.removeEventListener("touchstart", handleUserActivity)
      window.removeEventListener("keydown", handleUserActivity)
    }
  }, [refreshUserData])

  return (
    <SessionProvider refetchInterval={0} refetchOnWindowFocus={false}>
      <MainNavbar />
      <UserProvider>
        <AnimationProvider initialState={true}>
          <SubscriptionProvider>
            <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
              <NextTopLoader
                color="red"
                initialPosition={0.08}
                crawlSpeed={200}
                height={3}
                crawl={true}
                showSpinner={true}
                easing="ease"
                speed={200}
                shadow="0 0 10px #2299DD,0 0 5px #2299DD"
                template='<div class="bar" role="bar"><div class="peg"></div></div> 
  <div class="spinner" role="spinner"><div class="spinner-icon"></div></div>'
                zIndex={1600}
                showAtBottom={false}
              />
              <Suspense>
                <main className="flex-1 overflow-auto">{children}</main>
              </Suspense>
            </div>
          </SubscriptionProvider>
        </AnimationProvider>
      </UserProvider>
    </SessionProvider>
  )
}
