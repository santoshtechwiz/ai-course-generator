"use client"

import { useEffect, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/providers/unified-auth-provider"
import { Loader2 } from "lucide-react"

interface AuthGuardProps {
  children: ReactNode
  fallback?: ReactNode
  requireAdmin?: boolean
  redirectTo?: string
  loadingComponent?: ReactNode
}

export function AuthGuard({
  children,
  fallback = null,
  requireAdmin = false,
  redirectTo = "/auth/signin",
  loadingComponent = null,
}: AuthGuardProps) {
  const { isAuthenticated, isLoading, isAdmin, user } = useAuth()
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
    return loadingComponent || (
      <div className="flex justify-center items-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return fallback
  }

  if (requireAdmin && !isAdmin) {
    return fallback
  }

  return <>{children}</>
}
