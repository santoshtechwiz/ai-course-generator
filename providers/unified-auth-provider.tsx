"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react"
import { useSession, signIn, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import useSubscriptionStore from "@/store/useSubscriptionStore"

// Define the unified auth context type
interface AuthContextType {
  isLoading: boolean
  isAuthenticated: boolean
  user: any
  isAdmin: boolean
  credits: number
  subscriptionPlan: string
  subscriptionStatus: string | null
  refreshUserData: () => Promise<void>
  signInWithProvider: (provider: string, callbackUrl?: string) => Promise<void>
  signInWithCredentials: (email: string, password: string, callbackUrl?: string) => Promise<boolean>
  signOutUser: (callbackUrl?: string) => Promise<void>
  requireAuth: (redirectTo?: string) => boolean
}

// Create the auth context
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Create the unified auth provider component
export function UnifiedAuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status, update: updateSession } = useSession()
  const { subscriptionStatus, refreshSubscription } = useSubscriptionStore()
  const [isLoading, setIsLoading] = useState<boolean>(status === "loading")
  const router = useRouter()

  // Function to refresh user data
  const refreshUserData = useCallback(async () => {
    try {
      if (session?.user?.id) {
        await refreshSubscription(true)
        await updateSession()
      }
    } catch (error) {
      console.error("Error refreshing user data:", error)
    }
  }, [session?.user?.id, refreshSubscription, updateSession])

  // Effect to handle session changes
  useEffect(() => {
    setIsLoading(status === "loading")

    if (status === "authenticated" && session?.user?.id) {
      refreshSubscription()
    }
  }, [status, session, refreshSubscription])

  // Sign in with provider
  const signInWithProvider = useCallback(async (provider: string, callbackUrl = "/dashboard/home") => {
    setIsLoading(true)
    try {
      const providerToUse = provider?.toLowerCase() || "credentials"
      await signIn(providerToUse, { callbackUrl })

      toast.success("Successfully logged in")
    } catch (error) {
      console.error(`Error signing in with ${provider}:`, error)
      toast.error(`Failed to sign in with ${provider || "provider"}. Please try again.`)
      setIsLoading(false)
    }
  }, [])

  // Sign in with credentials
  const signInWithCredentials = useCallback(
    async (email: string, password: string, callbackUrl = "/dashboard/home") => {
      setIsLoading(true)
      try {
        const result = await signIn("credentials", {
          redirect: false,
          email,
          password,
        })

        if (result?.error) {
          toast.error("Invalid email or password. Please try again.")
          setIsLoading(false)
          return false
        }

        toast.success("Successfully logged in")
        router.push(callbackUrl)
        return true
      } catch (error) {
        console.error("Login error:", error)
        toast.error("Something went wrong. Please try again later.")
        return false
      } finally {
        setIsLoading(false)
      }
    },
    [router],
  )

  // Sign out
  const signOutUser = useCallback(async (callbackUrl = "/") => {
    setIsLoading(true)
    try {
      await signOut({ callbackUrl })
    } catch (error) {
      console.error("Sign out error:", error)
      toast.error("Failed to sign out. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Helper function to require authentication
  const requireAuth = useCallback(
    (redirectTo = "/auth/signin") => {
      if (status === "loading") {
        return false // Still loading, don't redirect yet
      }

      if (status !== "authenticated") {
        const currentPath = window.location.pathname
        const encodedRedirect = encodeURIComponent(currentPath)
        router.push(`${redirectTo}?callbackUrl=${encodedRedirect}`)
        return false
      }

      return true
    },
    [status, router],
  )

  // Memoize the context value
  const contextValue = useMemo(() => {
    const credits = subscriptionStatus?.credits ?? session?.user?.credits ?? 0
    const plan = subscriptionStatus?.subscriptionPlan ?? session?.user?.subscriptionPlan ?? "FREE"
    const subStatus = subscriptionStatus?.status ?? session?.user?.subscriptionStatus ?? null

    return {
      isLoading,
      isAuthenticated: status === "authenticated",
      user: session?.user,
      isAdmin: session?.user?.isAdmin || false,
      credits,
      subscriptionPlan: plan,
      subscriptionStatus: subStatus,
      refreshUserData,
      signInWithProvider,
      signInWithCredentials,
      signOutUser,
      requireAuth,
    }
  }, [
    isLoading,
    status,
    session,
    subscriptionStatus,
    refreshUserData,
    signInWithProvider,
    signInWithCredentials,
    signOutUser,
    requireAuth,
  ])

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
}

// Create a hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
