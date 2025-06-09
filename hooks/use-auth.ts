"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession, signOut } from "next-auth/react"
import { useDispatch } from "react-redux"
import { useSessionService } from "@/hooks/useSessionService"
import type { AppDispatch } from "@/store"
import { invalidateSessionCache } from "@/lib/auth"

export interface AuthHookResult {
  isAuthenticated: boolean
  userId: string | undefined
  isLoading: boolean
  isAdmin: boolean
  user: any
  guestId: string | null
  logout: () => Promise<void>
  status: "authenticated" | "loading" | "unauthenticated"
  session: any
}

/**
 * useAuth – Secure auth hook using NextAuth only (no Redux, no storage)
 */
export function useAuth(): AuthHookResult {
  const { data: session, status } = useSession()
  const [isLoading, setIsLoading] = useState(status === "loading")
  const [isAuthenticated, setIsAuthenticated] = useState(status === "authenticated")
  const [isAdmin, setIsAdmin] = useState(false)
  const dispatch = useDispatch<AppDispatch>()
  const { cleanupSessionData } = useSessionService()

  useEffect(() => {
    setIsLoading(status === "loading")
    setIsAuthenticated(status === "authenticated")

    // Check admin status
    if (session?.user) {
      setIsAdmin(!!session.user.isAdmin || (session as any).user.role === "admin")
    } else {
      setIsAdmin(false)
    }
  }, [session, status])

  // Enhanced logout that clears all session data
  const logout = useCallback(async () => {
    // First clean up all session data
    cleanupSessionData()

    // Clear local/session storage
    if (typeof window !== 'undefined') {
      // Clear auth-related items from localStorage
      const lsKeys = Object.keys(localStorage)
      lsKeys.forEach(key => {
        if (key.includes('token') || 
            key.includes('user') || 
            key.includes('auth') ||
            key.includes('session')) {
          localStorage.removeItem(key)
        }
      })
      
      try {
        // Clear auth-related items from sessionStorage
        const ssKeys = Object.keys(sessionStorage);
        ssKeys.forEach(key => {
          // Clear auth and quiz-related data
          if (key.includes('auth_') || key.includes('quiz_') || 
              key.includes('pendingQuiz') || key === 'callbackUrl') {
            sessionStorage.removeItem(key);
          }
        });
      } catch (e) {
        console.error("Error clearing session data:", e);
      }
    }

    // Clear server-side session cache
    invalidateSessionCache();

    // Then sign out with NextAuth
    await signOut({ redirect: false })
  }, [cleanupSessionData])

  return {
    isAuthenticated,
    userId: session?.user?.id,
    isLoading,
    isAdmin,
    user: session?.user || null,
    guestId: null,
    logout,
    status,
    session,
  }
}

export default useAuth
