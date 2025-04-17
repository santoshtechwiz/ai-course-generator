"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/providers/unified-auth-provider"

/**
 * Hook to handle authentication redirects
 */
export function useAuthRedirect(defaultRedirect = "/") {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams?.get("callbackUrl") || defaultRedirect

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push(callbackUrl)
    }
  }, [isAuthenticated, isLoading, router, callbackUrl])

  return { isLoading, isAuthenticated, callbackUrl }
}
