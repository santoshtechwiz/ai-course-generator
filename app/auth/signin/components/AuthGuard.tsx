"use client"

import { useEffect, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/providers/unified-auth-provider"

interface AuthGuardProps {
  children: ReactNode
  fallback?: ReactNode
  requireAdmin?: boolean
  redirectTo?: string
}

export function AuthGuard({
  children,
  fallback = null,
  requireAdmin = false,
  redirectTo = "/auth/signin",
}: AuthGuardProps) {
  const { isAuthenticated, isLoading, isAdmin } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        const currentPath = window.location.pathname
        router.push(`${redirectTo}?callbackUrl=${encodeURIComponent(currentPath)}`)
      } else if (requireAdmin && !isAdmin) {
        router.push("/unauthorized")
      }
    }
  }, [isAuthenticated, isLoading, isAdmin, requireAdmin, redirectTo, router])

  if (isLoading) {
    return fallback
  }

  if (!isAuthenticated) {
    return fallback
  }

  if (requireAdmin && !isAdmin) {
    return fallback
  }

  return <>{children}</>
}
