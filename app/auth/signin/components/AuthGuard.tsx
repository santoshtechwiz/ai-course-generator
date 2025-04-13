"use client"

import type React from "react"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "../context/AuthContext"
import { AuthStatus } from "./AuthStatus"


interface AuthGuardProps {
  children: React.ReactNode
  requireAuth?: boolean
  redirectTo?: string
  loadingComponent?: React.ReactNode
}

export function AuthGuard({
  children,
  requireAuth = true,
  redirectTo = "/auth/signin",
  loadingComponent,
}: AuthGuardProps) {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Skip during loading to prevent unnecessary redirects
    if (isLoading) return

    // If authentication is required but user is not authenticated
    if (requireAuth && !isAuthenticated) {
      // Store the current path to redirect back after login
      const returnUrl = encodeURIComponent(pathname)
      router.push(`${redirectTo}?callbackUrl=${returnUrl}`)
    }

    // If authentication is not required but user is authenticated (e.g., signin page)
    if (!requireAuth && isAuthenticated) {
      router.push("/dashboard")
    }
  }, [isAuthenticated, isLoading, requireAuth, redirectTo, router, pathname])

  return <AuthStatus loadingComponent={loadingComponent}>{children}</AuthStatus>
}
