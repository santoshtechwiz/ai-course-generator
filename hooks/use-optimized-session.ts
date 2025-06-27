"use client"

import { useSession } from "next-auth/react"
import { useCallback, useEffect, useRef, useMemo } from "react"
import { useAuthInit } from "@/providers/enhanced-auth-provider"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import {
  selectAuth,
  selectIsAuthenticated,
  selectIsAuthLoading,
  loginSuccess,
  loginFailure,
  selectUser,
} from "@/store/slices/auth-slice"
import { signOut } from "next-auth/react"

/**
 * useOptimizedSession - Central hook for accessing session data
 * 
 * This hook optimizes session fetches by:
 * 1. Using Redux as primary source of auth state
 * 2. Only fetching from next-auth when needed
 * 3. Synchronizing state between next-auth and Redux
 * 4. Preventing duplicate API calls to /api/auth/session
 * 5. Providing clean logout functionality
 */
export function useOptimizedSession() {
  const dispatch = useAppDispatch()
  const reduxAuth = useAppSelector(selectAuth)
  const user = useAppSelector(selectUser)
  const isAuthenticated = useAppSelector(selectIsAuthenticated)
  const isLoading = useAppSelector(selectIsAuthLoading)
  const { isInitialized, cleanLogout } = useAuthInit()
  
  // Track session fetch count to minimize unnecessary API calls
  const sessionFetchCount = useRef(0)
  const lastSyncTime = useRef<number>(0)
  // Use the useSession hook with custom config to reduce fetches
  const { data: session, status, update: updateSession } = useSession({ 
    required: false
    // Using existing state in Redux to avoid duplicate fetches instead
  })
  
  const syncedRef = useRef(false)
  
  // Sync next-auth session to Redux if needed
  useEffect(() => {
    // Only sync when we have definitive session state
    // and either:
    // 1. We haven't synced this session yet, OR
    // 2. It's been more than 1 second since last sync
    const now = Date.now()
    const shouldSync = 
      status !== "loading" && 
      (!syncedRef.current || now - lastSyncTime.current > 1000)
    
    if (shouldSync) {
      if (status === "authenticated" && session?.user) {
        dispatch(
          loginSuccess({
            user: session.user,
            token: session.user.accessToken || null,
          })
        )
      } else if (status === "unauthenticated") {
        dispatch(loginFailure("Not authenticated"))
      }
      
      syncedRef.current = true
      lastSyncTime.current = now
      sessionFetchCount.current += 1
    }
  }, [status, session, dispatch])
  
  // Logout function that ensures clean state removal
  const logout = useCallback(async (redirectUrl = "/") => {
    await cleanLogout(redirectUrl)
  }, [cleanLogout])
  
  // Update session without triggering re-fetches
  const updateUserData = useCallback(async (userData: any) => {
    try {
      // Update next-auth session first
      await updateSession({ user: { ...session?.user, ...userData } })
      
      // Then update Redux for consistency
      if (reduxAuth.user) {
        dispatch(loginSuccess({ 
          user: { ...reduxAuth.user, ...userData },
          token: reduxAuth.token  
        }))
      }
      
      return true
    } catch (error) {
      console.error("Failed to update user data:", error)
      return false
    }
  }, [session, reduxAuth, dispatch, updateSession])
  
  // Force refresh session when needed
  const refreshSession = useCallback(async () => {
    await updateSession()
    return session
  }, [session, updateSession])
  
  // Memoize to prevent unnecessary re-renders
  return useMemo(() => ({
    // Prefer Redux state, fallback to next-auth session
    user: reduxAuth?.user || session?.user || null,
    token: reduxAuth?.token || session?.user?.accessToken || null,
    status: reduxAuth.status,
    isAuthenticated,
    isLoading,
    isInitialized,
    // Expose original session for cases where it's needed
    session,
    sessionStatus: status,
    // Additional utility methods
    logout,
    updateUserData,
    refreshSession,
  }), [
    reduxAuth, 
    session, 
    isAuthenticated, 
    isLoading, 
    isInitialized,
    status, 
    logout, 
    updateUserData,
    refreshSession
  ])
}
