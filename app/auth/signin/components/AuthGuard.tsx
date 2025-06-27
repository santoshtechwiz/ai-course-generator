"use client"

import { useEffect, useState, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { useAuth } from "@/hooks"

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
  const { isAuthenticated, isLoading, isAdmin } = useAuth()
  const router = useRouter()
  const [isRedirecting, setIsRedirecting] = useState(false)

  useEffect(() => {
    // Only redirect if not loading and not already redirecting
    if (!isLoading && !isRedirecting) {
      if (!isAuthenticated) {
        setIsRedirecting(true)
        const currentPath = window.location.pathname
        const encodedPath = encodeURIComponent(currentPath)
        const safeRedirectTo = typeof redirectTo === "string" ? redirectTo : "/auth/signin"
        router.push(`${safeRedirectTo}?callbackUrl=${encodedPath}`)
      } else if (requireAdmin && !isAdmin) {
        setIsRedirecting(true)
        router.push("/unauthorized")
      }
    }
  }, [isAuthenticated, isLoading, isAdmin, requireAdmin, redirectTo, router, isRedirecting])

  if (isLoading || isRedirecting) {
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
