"use client"

import { createContext, useContext, useEffect } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import { useTracking } from "@/hooks/useTracking"

const TrackingContext = createContext<ReturnType<typeof useTracking> | null>(null)

export function TrackingProvider({ children, userId }: { children: React.ReactNode; userId: string }) {
  const { trackInteraction } = useTracking(userId)
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    trackInteraction("page_view", pathname, "page", { query: searchParams.toString() })
  }, [pathname, searchParams, trackInteraction])

  return <TrackingContext.Provider value={{ trackInteraction }}>{children}</TrackingContext.Provider>
}

export function useTrackingContext() {
  const context = useContext(TrackingContext)
  if (!context) {
    throw new Error("useTrackingContext must be used within a TrackingProvider")
  }
  return context
}

