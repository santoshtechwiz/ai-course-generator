"use client"

import type React from "react"
import { useEffect } from "react"
import { useDispatch } from "react-redux"
import { fetchSubscriptionStatus, fetchSubscriptionDetails, hydrateState } 
from "@/app//store/subscriptionSlice"

// Broadcast channel for cross-tab communication
let broadcastChannel: BroadcastChannel | null = null

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useDispatch()

  // Initialize subscription data and set up cross-tab communication
  useEffect(() => {
    // Hydrate state from localStorage on mount
    const storedData = localStorage.getItem("subscription-storage")
    if (storedData) {
      try {
        const parsedData = JSON.parse(storedData)
        if (parsedData.state) {
          dispatch(hydrateState(parsedData.state))
        }
      } catch (error) {
        console.error("Error parsing stored subscription data:", error)
      }
    }

    // Fetch initial data - only if needed
    dispatch(fetchSubscriptionStatus(false))
    dispatch(fetchSubscriptionDetails(false))

    // Set up broadcast channel for cross-tab communication
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      broadcastChannel = new BroadcastChannel("subscription-updates")

      // Listen for updates from other tabs
      broadcastChannel.onmessage = (event) => {
        if (event.data && event.data.type === "SUBSCRIPTION_UPDATE") {
          // Hydrate state from the received data
          dispatch(hydrateState(event.data.payload))
        }
      }
    }

    // Set up storage event listener for browsers that don't support BroadcastChannel
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "subscription-storage" && e.newValue) {
        try {
          const parsedData = JSON.parse(e.newValue)
          if (parsedData.state) {
            dispatch(hydrateState(parsedData.state))
          }
        } catch (error) {
          console.error("Error parsing subscription storage update:", error)
        }
      }
    }

    window.addEventListener("storage", handleStorageChange)

    // Set up interval to periodically refresh subscription data (less frequently)
    const refreshInterval = setInterval(
      () => {
        // Only refresh if the document is visible to the user
        if (document.visibilityState === "visible") {
          dispatch(fetchSubscriptionStatus(false))
        }
      },
      5 * 60 * 1000, // Refresh every 5 minutes
    )

    // Add visibility change listener to refresh when tab becomes visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        // Check if we need to refresh based on last fetch time
        const storedData = localStorage.getItem("subscription-storage")
        if (storedData) {
          try {
            const parsedData = JSON.parse(storedData)
            const lastFetched = parsedData.state?.lastFetched || 0
            const now = Date.now()

            // If it's been more than 2 minutes since last fetch, refresh
            if (now - lastFetched > 2 * 60 * 1000) {
              dispatch(fetchSubscriptionStatus(false))
            }
          } catch (error) {
            console.error("Error checking last fetch time:", error)
          }
        }
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)

    // Clean up on unmount
    return () => {
      if (broadcastChannel) {
        broadcastChannel.close()
      }
      window.removeEventListener("storage", handleStorageChange)
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      clearInterval(refreshInterval)
    }
  }, [dispatch])

  return <>{children}</>
}

// Middleware to sync Redux state to localStorage and broadcast to other tabs
export const subscriptionStorageMiddleware = (store: any) => (next: any) => (action: any) => {
  // Call the next dispatch method in the middleware chain
  const result = next(action)

  // Check if the action is related to subscription state
  if (
    action.type.startsWith("subscription/") &&
    action.type !== "subscription/fetchStatus/pending" &&
    action.type !== "subscription/fetchDetails/pending"
  ) {
    // Get the current state
    const state = store.getState().subscription

    // Save to localStorage
    try {
      localStorage.setItem(
        "subscription-storage",
        JSON.stringify({
          state: {
            data: state.data,
            lastFetched: state.lastFetched,
            detailsData: state.detailsData,
            lastDetailsFetched: state.lastDetailsFetched,
          },
        }),
      )

      // Broadcast to other tabs
      if (broadcastChannel) {
        broadcastChannel.postMessage({
          type: "SUBSCRIPTION_UPDATE",
          payload: {
            data: state.data,
            lastFetched: state.lastFetched,
            detailsData: state.detailsData,
            lastDetailsFetched: state.lastDetailsFetched,
          },
        })
      }
    } catch (error) {
      console.error("Error saving subscription state:", error)
    }
  }

  return result
}
