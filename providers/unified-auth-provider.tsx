"use client"
import { useEffect } from "react"
import { useAuthContext } from "@/context/auth-context"

export default function UnifiedAuthProvider({ children }: { children: React.ReactNode }) {
  const { initialize, isInitialized, status } = useAuthContext()

  useEffect(() => {
    // Only initialize when session status is determined (loaded or unauthenticated)
    if (!isInitialized && status !== 'loading') {
      initialize()
    }
  }, [isInitialized, initialize, status])

  return <>{children}</>
}
