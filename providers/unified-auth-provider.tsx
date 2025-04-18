"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { useSession, signIn, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"

// Define the auth context type
type AuthContextType = {
  user: any
  isAuthenticated: boolean
  isAdmin: boolean
  isLoading: boolean
  signIn: (provider?: string, options?: any) => Promise<any>
  signOut: (options?: any) => Promise<any>
  requireAuth: (redirectTo?: string) => void
  refreshSession: () => void
}

// Create the auth context
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Provider component
export function UnifiedAuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status, update } = useSession()
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  // Determine if user is authenticated and admin
  const isAuthenticated = !!session?.user
  const isAdmin = !!session?.user?.isAdmin

  // Effect to handle loading state
  useEffect(() => {
    if (status !== "loading") {
      setIsLoading(false)
    } else {
      setIsLoading(true)
    }
  }, [status])

  // Function to require authentication
  const requireAuth = (redirectTo = "/auth/signin") => {
    if (!isLoading && !isAuthenticated) {
      const currentPath = typeof window !== "undefined" ? window.location.pathname : "/"
      router.push(`${redirectTo}?callbackUrl=${encodeURIComponent(currentPath)}`)
    }
  }

  // Function to refresh the session
  const refreshSession = async () => {
    await update()
  }

  // Create the context value
  const contextValue: AuthContextType = {
    user: session?.user,
    isAuthenticated,
    isAdmin,
    isLoading,
    signIn: (provider, options) => signIn(provider, options),
    signOut: (options) => signOut(options),
    requireAuth,
    refreshSession,
  }

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
}

// Hook to use the auth context
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an UnifiedAuthProvider")
  }
  return context
}
