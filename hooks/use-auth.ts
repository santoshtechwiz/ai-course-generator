"use client"

import { useSession, signOut } from "next-auth/react"
import { useCallback, useMemo, useRef } from "react"
import { useDispatch } from "react-redux"
import type { AppDispatch } from "@/store"
import { logout as reduxLogout } from "@/store/slices/authSlice"
import { resetState as resetSubscriptionState } from "@/store/slices/subscription-slice"
import { resetState as resetUserState } from "@/store/slices/userSlice"
import { resetState as resetCourseState } from "@/store/slices/courseSlice"
import { resetState as resetQuizState } from "@/store/slices/quizSlice"

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
  const guestIdRef = useRef<string | null>(null)
  const dispatch = useDispatch<AppDispatch>()

  const isAuthenticated = status === "authenticated"
  const isLoading = status === "loading"
  const user = session?.user || null
  const userId = session?.user?.id
  const isAdmin = !!session?.user?.isAdmin

  // Generate guest ID once in-memory (no storage)
  const getGuestId = useCallback((): string => {
    if (guestIdRef.current) return guestIdRef.current

    try {
      const uuid = Math.random().toString(36).substring(2, 15)
      guestIdRef.current = `guest_${uuid}`
    } catch {
      guestIdRef.current = `guest_${Date.now().toString(36)}`
    }

    return guestIdRef.current
  }, [])

  const guestId = useMemo(() => {
    if (isAuthenticated) return null
    return getGuestId()
  }, [isAuthenticated, getGuestId])

  const logout = useCallback(async () => {
    // First, dispatch Redux logout actions to clear all state
    dispatch(reduxLogout())
    dispatch(resetSubscriptionState())
    dispatch(resetUserState())
    dispatch(resetCourseState())
    dispatch(resetQuizState())

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
      
      // Clear auth-related items from sessionStorage
      const ssKeys = Object.keys(sessionStorage)
      ssKeys.forEach(key => {
        if (key.includes('token') || 
            key.includes('user') || 
            key.includes('auth') ||
            key.includes('session')) {
          sessionStorage.removeItem(key)
        }
      })
    }
    
    // Then sign out with NextAuth
    await signOut({ redirect: false })
    guestIdRef.current = null
    
  }, [dispatch])

  return {
    isAuthenticated,
    userId,
    isLoading,
    isAdmin,
    user,
    guestId,
    logout,
    status,
    session,
  }
}

export default useAuth
