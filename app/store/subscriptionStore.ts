import { create } from "zustand"
import { devtools, persist } from "zustand/middleware"
import type {
  SubscriptionPlanType,
  SubscriptionStatusType,
  SubscriptionData,
} from "../dashboard/subscription/types/subscription"
import { dispatchSubscriptionEvent, SUBSCRIPTION_EVENTS } from "../dashboard/subscription/utils/events"
import { validateSubscriptionResponse } from "../dashboard/subscription/utils/validation"

// Define the subscription state interface
interface SubscriptionState {
  status: "idle" | "loading" | "succeeded" | "failed"
  error: string | null
  data: SubscriptionData | null
  lastFetched: number
  detailsData: any | null
  lastDetailsFetched: number
  isRefreshing: boolean
  isLoading: boolean
  isError: boolean

  // Actions
  fetchSubscriptionStatus: (forceRefresh?: boolean) => Promise<void>
  fetchSubscriptionDetails: (forceRefresh?: boolean) => Promise<void>
  cancelSubscription: (reason: string) => Promise<void>
  resumeSubscription: () => Promise<void>
  activateFreePlan: () => Promise<void>
  clearSubscriptionCache: () => void
  setRefreshing: (isRefreshing: boolean) => void

  // Derived state
  canDownloadPDF: () => boolean
}

// Utility to debounce API calls
let fetchStatusTimeout: NodeJS.Timeout | null = null
let fetchDetailsTimeout: NodeJS.Timeout | null = null

export const useSubscriptionStore = create<SubscriptionState>()(
  devtools(
    persist(
      (set, get) => ({
        // State
        status: "idle",
        error: null,
        data: null,
        lastFetched: 0,
        detailsData: null,
        lastDetailsFetched: 0,
        isRefreshing: false,
        isLoading: false,
        isError: false,

        // Actions
        fetchSubscriptionStatus: async (forceRefresh = false) => {
          const state = get()
          const now = Date.now()

          // Debounce API calls
          if (fetchStatusTimeout) clearTimeout(fetchStatusTimeout)
          fetchStatusTimeout = setTimeout(async () => {
            if (!forceRefresh && state.lastFetched > 0 && now - state.lastFetched < 30000 && state.data) {
              return
            }

            // Don't change status to loading if we already have data and are just refreshing
            set({
              status: state.data && state.status === "succeeded" ? "succeeded" : "loading",
              isRefreshing: true,
              isLoading: true,
              isError: false,
              error: null,
            })

            try {
              const response = await fetch("/api/subscriptions/status", {
                credentials: "include",
                headers: {
                  "x-force-refresh": forceRefresh ? "true" : "false",
                  "Cache-Control": "no-cache",
                },
              })

              if (!response.ok) {
                if (response.status === 401) {
                  console.warn("Unauthorized access. Please log in again.")
                  set({
                    status: "failed",
                    error: "Unauthorized access. Please log in again.",
                    isRefreshing: false,
                    isLoading: false,
                    isError: true,
                  })
                  return
                }
                throw new Error(`Failed to fetch subscription status: ${response.statusText}`)
              }

              const rawData = await response.json()

              // Validate and transform the API response to match expected types
              const validatedData = validateSubscriptionResponse(rawData)

              set({
                status: "succeeded",
                data: validatedData,
                lastFetched: Date.now(),
                error: null,
                isRefreshing: false,
                isLoading: false,
                isError: false,
              })
            } catch (error) {
              console.error("Error fetching subscription status:", error)

              // Keep existing data if available, just update status and error
              set((state) => ({
                status: "failed",
                error: error instanceof Error ? error.message : "Unknown error",
                isRefreshing: false,
                isLoading: false,
                isError: true,
                // Keep existing data if we have it
                data: state.data,
              }))
            }
          }, 300) // Debounce delay
        },

        fetchSubscriptionDetails: async (forceRefresh = false) => {
          const state = get()
          const now = Date.now()

          // Debounce API calls
          if (fetchDetailsTimeout) clearTimeout(fetchDetailsTimeout)
          fetchDetailsTimeout = setTimeout(async () => {
            if (
              !forceRefresh &&
              state.lastDetailsFetched > 0 &&
              now - state.lastDetailsFetched < 120000 &&
              state.detailsData
            ) {
              return
            }

            set({ isRefreshing: true, isLoading: true, isError: false })

            try {
              const response = await fetch("/api/subscriptions", {
                credentials: "include",
                headers: {
                  "x-data-type": "details",
                  "Cache-Control": "no-cache",
                },
              })

              if (!response.ok) {
                if (response.status === 401) {
                  throw new Error("Unauthorized")
                }
                throw new Error(`Failed to fetch subscription details: ${response.statusText}`)
              }

              const detailsData = await response.json()

              // Validate token usage data if it exists
              const tokenUsage = detailsData?.tokenUsage
                ? {
                    used: typeof detailsData.tokenUsage.used === "number" ? detailsData.tokenUsage.used : 0,
                    total: typeof detailsData.tokenUsage.total === "number" ? detailsData.tokenUsage.total : 0,
                  }
                : null

              set((state) => {
                // Update tokensUsed if available in details
                const updatedData =
                  state.data && tokenUsage
                    ? {
                        ...state.data,
                        tokensUsed: tokenUsage.used,
                        credits: tokenUsage.total,
                      }
                    : state.data

                return {
                  detailsData,
                  lastDetailsFetched: Date.now(),
                  isRefreshing: false,
                  isLoading: false,
                  isError: false,
                  data: updatedData,
                }
              })
            } catch (error) {
              console.error("Error fetching subscription details:", error)

              // Keep existing details data if available
              set((state) => ({
                isRefreshing: false,
                isLoading: false,
                isError: true,
                // Don't clear existing details data on error
                detailsData: state.detailsData,
              }))
            }
          }, 300) // Debounce delay
        },

        cancelSubscription: async (reason: string) => {
          try {
            set({ isLoading: true, isError: false })
            const response = await fetch("/api/subscriptions/cancel", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ reason }),
            })

            if (!response.ok) {
              throw new Error(`Failed to cancel subscription: ${response.statusText}`)
            }

            const result = await response.json()

            // Update local state
            set((state) => ({
              data: state.data
                ? {
                    ...state.data,
                    cancelAtPeriodEnd: true,
                    status: "CANCELED" as SubscriptionStatusType,
                  }
                : null,
              lastFetched: 0, // Force refresh on next fetch
              isLoading: false,
              isError: false,
            }))

            // Dispatch event for other components
            dispatchSubscriptionEvent(SUBSCRIPTION_EVENTS.CANCELED, { reason })

            return result
          } catch (error) {
            console.error("Error canceling subscription:", error)
            set({ isLoading: false, isError: true })
            throw error
          }
        },

        resumeSubscription: async () => {
          try {
            set({ isLoading: true, isError: false })
            const response = await fetch("/api/subscriptions/resume", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
            })

            if (!response.ok) {
              throw new Error(`Failed to resume subscription: ${response.statusText}`)
            }

            const result = await response.json()

            // Update local state
            set((state) => ({
              data: state.data
                ? {
                    ...state.data,
                    cancelAtPeriodEnd: false,
                    status: "ACTIVE" as SubscriptionStatusType,
                  }
                : null,
              lastFetched: 0, // Force refresh on next fetch
              isLoading: false,
              isError: false,
            }))

            // Dispatch event for other components
            dispatchSubscriptionEvent(SUBSCRIPTION_EVENTS.RESUMED)

            return result
          } catch (error) {
            console.error("Error resuming subscription:", error)
            set({ isLoading: false, isError: true })
            throw error
          }
        },

        activateFreePlan: async () => {
          try {
            set({ isLoading: true, isError: false })
            const response = await fetch("/api/subscriptions/activate-free", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ confirmed: true }),
            })

            if (!response.ok) {
              const data = await response.json()
              throw new Error(data.details || "Failed to activate free plan")
            }

            const result = await response.json()

            // Update local state
            set((state) => ({
              data: state.data
                ? {
                    ...state.data,
                    subscriptionPlan: "FREE" as SubscriptionPlanType,
                    status: "ACTIVE" as SubscriptionStatusType,
                    isSubscribed: false,
                  }
                : null,
              lastFetched: 0, // Force refresh on next fetch
              isLoading: false,
              isError: false,
            }))

            // Dispatch event for other components
            dispatchSubscriptionEvent(SUBSCRIPTION_EVENTS.CHANGED, {
              planId: "FREE",
              status: "ACTIVE",
            })

            return result
          } catch (error) {
            console.error("Error activating free plan:", error)
            set({ isLoading: false, isError: true })
            throw error
          }
        },

        clearSubscriptionCache: () => {
          set({
            lastFetched: 0,
            lastDetailsFetched: 0,
          })
        },

        setRefreshing: (isRefreshing: boolean) => {
          set({ isRefreshing })
        },

        // Derived state
        canDownloadPDF: () => {
          const state = get()
          return !!state.data?.isSubscribed && state.data.subscriptionPlan !== "FREE"
        },
      }),
      {
        name: "subscription-storage",
        partialize: (state) => ({
          data: state.data,
          lastFetched: state.lastFetched,
          detailsData: state.detailsData,
          lastDetailsFetched: state.lastDetailsFetched,
        }),
      },
    ),
  ),
)
