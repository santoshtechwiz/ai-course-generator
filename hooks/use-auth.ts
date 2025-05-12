"use client"

import { useCallback, useEffect } from "react"
import { useSession, signIn, signOut } from "next-auth/react"
import { useAppSelector } from "@/lib/utils/redux-utils"
import {
  clearAuthState,
  setIsAuthenticated,
  setIsProcessingAuth,
  setRedirectUrl,
  setUser,
} from "@/store/slices/authSlice"
import { useAppDispatch } from "@/store"

/**
 * Hook for handling authentication state and actions
 * @returns Authentication state and methods
 */
export function useAuth() {
  const dispatch = useAppDispatch()
  const { data: session, status, update: updateSession } = useSession()
  const authState = useAppSelector((state) => state.auth)

  // Update authentication state based on session
  useEffect(() => {
    const isAuthenticated = status === "authenticated" && !!session?.user

    if (isAuthenticated && session?.user) {
      dispatch(setUser(session.user))
      dispatch(setIsAuthenticated(true))
    } else if (status === "unauthenticated" && authState.isAuthenticated) {
      dispatch(clearAuthState())
    }
  }, [dispatch, session, status, authState.isAuthenticated])

  // Login method with optional redirect
  const login = useCallback(
    (redirectUrl?: string) => {
      if (redirectUrl) {
        dispatch(setRedirectUrl(redirectUrl))
        dispatch(setIsProcessingAuth(true))
        signIn(undefined, { callbackUrl: redirectUrl })
      } else {
        signIn()
      }
    },
    [dispatch],
  )

  // Logout method
  const logout = useCallback(() => {
    dispatch(clearAuthState())
    signOut({ callbackUrl: "/dashboard/explore" })
  }, [dispatch])

  // Refresh user data
  const refreshUserData = useCallback(() => {
    return updateSession()
  }, [updateSession])

  return {
    user: session?.user || null,
    isAuthenticated: status === "authenticated" && !!session?.user,
    isLoading: status === "loading",
    login,
    logout,
    refreshUserData,
    authState,
  }
}
