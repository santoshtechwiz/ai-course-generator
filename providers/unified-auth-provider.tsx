"use client"
import { useEffect } from "react"
import { useAuth } from "@/hooks/useAuth"
import { useSession } from "next-auth/react"

export default function UnifiedAuthProvider({ children }: { children: React.ReactNode }) {
  const { initialize, isInitialized } = useAuth()
  const { status } = useSession()

  useEffect(() => {
    // Only initialize when session status is determined (loaded or unauthenticated)
    if (!isInitialized && status !== 'loading') {
      initialize()
    }
  }, [isInitialized, initialize, status])

  return <>{children}</>
}
