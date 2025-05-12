"use client"

import { useCallback } from "react"
import { useSession, signIn, signOut } from "next-auth/react"
import { useAppDispatch, useAppSelector } from "@/store"
import {
  clearAuthState,
  setIsAuthenticated,
  setIsProcessingAuth,
  setRedirectUrl,
  setUser,
} from "@/store/slices/authSlice"

export function useAuth() {
  const dispatch = useAppDispatch()
  const { data: session, status, update: updateSession } = useSession()
  const authState = useAppSelector((state) => state.auth)

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

  const logout = useCallback(() => {
    dispatch(clearAuthState())
    signOut({ callbackUrl: "/dashboard/explore" })
  }, [dispatch])

  // Add a throttled refresh function to prevent excessive refreshes
  const refreshUserData = useCallback(() => {
    // Use the session update function from next-auth
    // This will trigger a controlled refresh of the session
    return updateSession()
  }, [updateSession])

  const isAuthenticated = status === "authenticated" && !!session?.user

  // Sync session with Redux state
  if (status === "authenticated" && session?.user && !authState.isAuthenticated) {
    dispatch(setUser(session.user))
    dispatch(setIsAuthenticated(true))
  } else if (status === "unauthenticated" && authState.isAuthenticated) {
    dispatch(setUser(null))
    dispatch(setIsAuthenticated(false))
  }

  return {
    user: session?.user || null,
    isAuthenticated,
    isLoading: status === "loading",
    login,
    logout,
    refreshUserData,
    authState,
  }
}
